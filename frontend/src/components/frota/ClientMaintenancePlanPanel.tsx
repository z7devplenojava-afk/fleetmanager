import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import JSZip from 'jszip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    Folder, 
    FileText, 
    Download, 
    Share2, 
    Copy, 
    ExternalLink, 
    Search, 
    Filter, 
    Calendar, 
    Truck, 
    Building2, 
    Eye, 
    CheckCircle2, 
    Clock, 
    Sparkles,
    Printer,
    Archive,
    CheckSquare,
    ChevronRight,
    Users,
    Wrench,
    Plus,
    X
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clientService, Client } from '@/services/clientService';
import fleetService from '@/services/fleetService';
import fleetWorkOrderService, { FleetWorkOrder, MaintenanceType } from '@/services/fleetWorkOrderService';
import { generateFleetWorkOrderPDFBlob } from '@/utils/fleetWorkOrderPDFGenerator';
import { Vehicle } from '@/types/fleet';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ClientMaintenancePlanPanelProps {
    onViewOrder?: (order: FleetWorkOrder) => void;
    onCreateWorkOrder?: (plate: string, clientName?: string) => void;
}

interface ClientVehiclePreventiveItem {
    id: string; // Order id or vehicle id
    vehiclePlate: string;
    vehicleModel: string;
    fileName: string;
    order?: FleetWorkOrder;
    vehicle?: Vehicle;
    modifiedDate: string;
    modifiedBy: string;
    sizeDisplay: string;
    isCompleted: boolean;
}

export const ClientMaintenancePlanPanel: React.FC<ClientMaintenancePlanPanelProps> = ({ 
    onViewOrder,
    onCreateWorkOrder 
}) => {
    const { toast } = useToast();
    const [selectedClientId, setSelectedClientId] = useState<string>('all');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(() => {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        return `${mm}-${yyyy}`;
    });
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
    const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

    // Carregar clientes
    const { data: clients = [] } = useQuery({
        queryKey: ['clients-for-maintenance-plan'],
        queryFn: async () => {
            const res = await clientService.getAllClients();
            return Array.isArray(res) ? res : [];
        }
    });

    // Carregar veículos da frota
    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles-for-maintenance-plan'],
        queryFn: async () => {
            const res = await fleetService.getVehicles();
            return Array.isArray(res) ? res : [];
        }
    });

    // Carregar todas as ordens de serviço
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['fleet-work-orders-for-client-plan'],
        queryFn: async () => {
            const res = await fleetWorkOrderService.getAll();
            return Array.isArray(res) ? res : [];
        }
    });

    // Filtrar apenas ordens Preventivas
    const preventiveOrders = useMemo(() => {
        return orders.filter(o => 
            o.maintenanceType === MaintenanceType.PREVENTIVA || 
            (o.preventiveModel != null) ||
            (o.description && o.description.toLowerCase().includes('preventiv'))
        );
    }, [orders]);

    // Opções de períodos disponíveis (últimos 12 meses)
    const periodOptions = useMemo(() => {
        const list: { label: string; value: string }[] = [];
        const now = new Date();
        for (let i = 0; i < 12; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            const val = `${mm}-${yyyy}`;
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const label = `${monthNames[d.getMonth()]} ${yyyy} (${val})`;
            list.push({ label, value: val });
        }
        return list;
    }, []);

    // Agrupar veículos e preventivas por Cliente
    const groupedByClient = useMemo(() => {
        const [targetMonth, targetYear] = selectedPeriod.split('-');

        const map = new Map<string, {
            client: Client | null;
            clientName: string;
            items: ClientVehiclePreventiveItem[];
        }>();

        // 1. Inicializar clientes cadastrados
        clients.forEach(c => {
            if (selectedClientId === 'all' || selectedClientId === c.id) {
                map.set(c.id, { client: c, clientName: c.name, items: [] });
            }
        });

        if (selectedClientId === 'all') {
            map.set('unassigned', { client: null, clientName: 'Geral / Frota Interna', items: [] });
        }

        // 2. Mapear veículos aos seus respectivos clientes
        const vehiclesByClient = new Map<string, Vehicle[]>();
        vehicles.forEach(v => {
            const cId = v.clientId || '';
            const cName = v.clientName || '';
            let targetKey = 'unassigned';

            if (cId && map.has(cId)) {
                targetKey = cId;
            } else if (cName) {
                const found = Array.from(map.entries()).find(([_, g]) => 
                    g.clientName.toLowerCase() === cName.toLowerCase()
                );
                if (found) {
                    targetKey = found[0];
                } else if (selectedClientId === 'all') {
                    map.set(cName, { client: null, clientName: cName, items: [] });
                    targetKey = cName;
                }
            }

            if (!vehiclesByClient.has(targetKey)) {
                vehiclesByClient.set(targetKey, []);
            }
            vehiclesByClient.get(targetKey)!.push(v);
        });

        // 3. Cruzar com ordens de serviço preventivas do período selecionado
        const term = searchTerm.trim().toLowerCase();

        map.forEach((group, clientKey) => {
            const clientVehicles = vehiclesByClient.get(clientKey) || [];
            const addedPlates = new Set<string>();

            // Adicionar itens a partir de preventivas realizadas no período
            preventiveOrders.forEach(order => {
                const dateStr = order.stopDate || order.createdAt;
                if (dateStr) {
                    const cleanDate = dateStr.includes('T') ? dateStr : (dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
                    const orderDate = new Date(cleanDate);
                    if (!isNaN(orderDate.getTime())) {
                        const oMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
                        const oYear = String(orderDate.getFullYear());
                        if (oMonth !== targetMonth || oYear !== targetYear) {
                            return; // Fora do período selecionado
                        }
                    }
                }

                // Checar se a OS pertence a este cliente
                const orderClientMatch = 
                    (order.clientId && order.clientId === clientKey) ||
                    (order.clientName && order.clientName.toLowerCase() === group.clientName.toLowerCase()) ||
                    clientVehicles.some(cv => cv.plate?.toUpperCase() === order.vehiclePlate?.toUpperCase() || (cv as any).placa?.toUpperCase() === order.vehiclePlate?.toUpperCase());

                if (!orderClientMatch) return;

                const plate = (order.vehiclePlate || 'VEICULO').toUpperCase();
                const model = order.vehicleModel || 'Veículo da Frota';

                if (term && !plate.toLowerCase().includes(term) && !model.toLowerCase().includes(term)) {
                    return;
                }

                addedPlates.add(plate);

                // Formatar data no padrão DD-MM-YY para o nome do arquivo exatamente como no print
                let dateDisplay = selectedPeriod;
                let fullDisplayDate = '-';
                if (order.stopDate) {
                    const parts = order.stopDate.split('-');
                    if (parts.length === 3) {
                        dateDisplay = `${parts[2]}-${parts[1]}-${parts[0].slice(2)}`;
                        fullDisplayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                }

                const fileName = `${plate.replace(/[^A-Z0-9]/g, '')} PREVENTIVA ${dateDisplay}.pdf`;

                group.items.push({
                    id: order.id,
                    vehiclePlate: plate,
                    vehicleModel: model,
                    fileName,
                    order,
                    modifiedDate: fullDisplayDate,
                    modifiedBy: order.mechanicName || 'Erislaine Sarmento',
                    sizeDisplay: '3,30 MB',
                    isCompleted: true
                });
            });

            // Para veículos do cliente que ainda não têm OS no período, adicionar como pendente
            clientVehicles.forEach(v => {
                const plate = (v.plate || (v as any).placa || '').toUpperCase();
                if (!plate || addedPlates.has(plate)) return;

                const model = v.model || (v as any).modelo || 'Ônibus / Veículo';
                if (term && !plate.toLowerCase().includes(term) && !model.toLowerCase().includes(term)) {
                    return;
                }

                const fileName = `${plate.replace(/[^A-Z0-9]/g, '')} PREVENTIVA ${selectedPeriod}.pdf`;

                group.items.push({
                    id: `v-${v.id}`,
                    vehiclePlate: plate,
                    vehicleModel: model,
                    fileName,
                    vehicle: v,
                    modifiedDate: 'Programada / No Ciclo',
                    modifiedBy: 'Controle de Frota VSS',
                    sizeDisplay: 'Aguardando O.S.',
                    isCompleted: false
                });
            });
        });

        // Filtrar apenas grupos com itens ou se cliente específico foi selecionado
        return Array.from(map.values()).filter(g => 
            g.items.length > 0 || (selectedClientId !== 'all' && g.client?.id === selectedClientId)
        );
    }, [clients, vehicles, preventiveOrders, selectedClientId, selectedPeriod, searchTerm]);

    const activeClient = useMemo(() => {
        if (selectedClientId === 'all') return null;
        return clients.find(c => c.id === selectedClientId) || null;
    }, [clients, selectedClientId]);

    const folderTitle = useMemo(() => {
        const name = activeClient ? activeClient.name.toUpperCase() : 'TERRAÇO NOVA LIMA';
        return `${name} ${selectedPeriod}`;
    }, [activeClient, selectedPeriod]);

    // Download individual de PDF
    const handleDownloadSinglePdf = async (item: ClientVehiclePreventiveItem) => {
        if (!item.order?.id) {
            toast({
                title: 'O.S. Preventiva Pendente',
                description: `O veículo ${item.vehiclePlate} ainda não possui Ordem de Serviço Preventiva fechada para download direto.`,
                variant: 'destructive'
            });
            return;
        }

        try {
            setDownloadingPdfId(item.id);
            const blob = await generateFleetWorkOrderPDFBlob(item.order);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ 
                title: '✅ Download Concluído', 
                description: `Arquivo ${item.fileName} baixado com sucesso.` 
            });
        } catch (err) {
            console.error('Erro ao baixar PDF:', err);
            toast({ 
                title: '❌ Erro ao gerar PDF', 
                description: 'Não foi possível baixar o relatório da preventiva.', 
                variant: 'destructive' 
            });
        } finally {
            setDownloadingPdfId(null);
        }
    };

    // Download em Lote (ZIP)
    const handleDownloadBatchZip = async (itemsToDownload: ClientVehiclePreventiveItem[], folderName: string) => {
        const validOrders = itemsToDownload.filter(i => i.order && i.order.id);
        if (validOrders.length === 0) {
            toast({
                title: 'Nenhum PDF disponível',
                description: 'Não há ordens preventivas concluídas para gerar o arquivo compactado.',
                variant: 'destructive'
            });
            return;
        }

        try {
            setDownloadingZip(true);
            const zip = new JSZip();
            const folder = zip.folder(folderName) || zip;

            toast({
                title: 'Compactando Arquivos...',
                description: `Gerando ${validOrders.length} relatórios de preventiva em PDF para o pacote ZIP.`
            });

            for (const item of validOrders) {
                try {
                    const blob = await generateFleetWorkOrderPDFBlob(item.order!);
                    folder.file(item.fileName, blob);
                } catch (e) {
                    console.warn(`Falha ao obter PDF da OS ${item.order?.id}`, e);
                }
            }

            const zipContent = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(zipContent);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${folderName}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: '✅ Pacote ZIP Baixado!',
                description: `Todas as preventivas da pasta "${folderName}" foram compactadas e baixadas.`
            });
        } catch (error) {
            console.error('Erro ao gerar ZIP:', error);
            toast({
                title: '❌ Erro na compactação',
                description: 'Ocorreu um erro ao gerar o arquivo ZIP das preventivas.',
                variant: 'destructive'
            });
        } finally {
            setDownloadingZip(false);
        }
    };

    // Seleção em lote
    const toggleSelectItem = (id: string) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectGroup = (items: ClientVehiclePreventiveItem[]) => {
        const itemIds = items.map(i => i.id);
        const allSelected = itemIds.every(id => selectedItems.includes(id));
        if (allSelected) {
            setSelectedItems(prev => prev.filter(id => !itemIds.includes(id)));
        } else {
            setSelectedItems(prev => Array.from(new Set([...prev, ...itemIds])));
        }
    };

    const handleSharePortalLink = () => {
        const url = `${window.location.origin}/portal-cliente?tab=preventivas&periodo=${selectedPeriod}${activeClient ? `&clienteId=${activeClient.id}` : ''}`;
        navigator.clipboard.writeText(url);
        toast({
            title: '✅ Link Copiado!',
            description: 'O link de acesso direto do cliente às preventivas foi copiado para a área de transferência.'
        });
        setShareModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header de Filtros do Plano de Manutenção por Cliente */}
            <div className="bg-seguranca-graphite border border-gray-700/80 rounded-2xl p-4 sm:p-5 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
                            <Folder className="h-6 w-6 text-amber-400" />
                            Plano de Manutenção por Cliente
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-400 mt-1">
                            Organização e disponibilização das preventivas de todos os veículos operados em cada cliente por mês/ano.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            variant="outline"
                            onClick={() => setShareModalOpen(true)}
                            className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10 h-9 text-xs sm:text-sm font-semibold gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Disponibilizar ao Cliente
                        </Button>
                    </div>
                </div>

                {/* Filtros em linha */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-700/50">
                    {/* Seleção de Cliente */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Cliente
                        </label>
                        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                            <SelectTrigger className="bg-seguranca-black/60 border-gray-700 text-white h-9 text-xs">
                                <SelectValue placeholder="Selecione o Cliente" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white z-[10200]">
                                <SelectItem value="all">Todos os Clientes</SelectItem>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Seleção de Período (Mês-Ano) */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Período (Mês / Ano)
                        </label>
                        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                            <SelectTrigger className="bg-seguranca-black/60 border-gray-700 text-white h-9 text-xs font-mono">
                                <SelectValue placeholder="Selecione o Período" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white z-[10200]">
                                {periodOptions.map(p => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Busca Rápida por Placa / Veículo */}
                    <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Buscar Placa / Veículo
                        </label>
                        <div className="relative">
                            <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Filtrar por placa, modelo..."
                                className="bg-seguranca-black/60 border-gray-700 text-white pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Listagem das Pastas de Preventivas por Cliente (Fiel à imagem de referência do Windows Explorer) */}
            {isLoadingOrders ? (
                <div className="p-8 text-center text-gray-400 animate-pulse">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-seguranca-yellow" />
                    Carregando plano de manutenção preventiva por cliente...
                </div>
            ) : groupedByClient.length === 0 ? (
                <Card className="bg-seguranca-graphite border-gray-800 text-center py-12">
                    <CardContent>
                        <Folder className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-300">Nenhuma preventiva encontrada no período selecionado</h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Tente selecionar outro mês/ano ou outro cliente nos filtros acima.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {groupedByClient.map(group => {
                        const folderName = `${group.clientName.toUpperCase()} ${selectedPeriod}`;
                        const groupItemIds = group.items.map(i => i.id);
                        const selectedInGroup = group.items.filter(i => selectedItems.includes(i.id));
                        const isAllGroupSelected = group.items.length > 0 && groupItemIds.every(id => selectedItems.includes(id));

                        return (
                            <div key={group.clientName} className="bg-seguranca-graphite/95 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl transition-all">
                                
                                {/* 1. Breadcrumb / Título da Pasta (Fiel à Imagem 1: "📁 > TERRAÇO NOVA LIMA 11-2026") */}
                                <div className="bg-gradient-to-r from-seguranca-black via-seguranca-black/90 to-seguranca-graphite border-b border-gray-700 px-5 py-3.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                            <Folder className="h-4 w-4 text-amber-400" />
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm sm:text-base font-black tracking-wider text-white">
                                            <span className="text-gray-400 font-normal">📁 &gt;</span>
                                            <span className="text-white hover:text-amber-400 transition-colors uppercase">
                                                {folderName}
                                            </span>
                                            <Badge className="ml-2 bg-blue-950/70 border-blue-500/50 text-blue-300 font-mono text-[10px] px-2">
                                                {group.items.length} Veículo(s) / Preventiva(s)
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDownloadBatchZip(group.items, folderName)}
                                            disabled={downloadingZip}
                                            className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 h-8 text-xs font-semibold gap-1.5"
                                        >
                                            <Archive className="h-3.5 w-3.5" />
                                            {downloadingZip ? 'Compactando...' : 'Baixar Pasta (.ZIP)'}
                                        </Button>
                                    </div>
                                </div>

                                {/* 2. Barra de Ações do Windows Explorer (Abrir, Compartilhar, Copiar link, Excluir, Selecionados) */}
                                <div className="bg-seguranca-black/80 border-b border-gray-700/80 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-300">
                                    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={selectedInGroup.length === 0}
                                            onClick={() => {
                                                const firstOrder = selectedInGroup.find(i => i.order)?.order;
                                                if (firstOrder && onViewOrder) onViewOrder(firstOrder);
                                            }}
                                            className="h-7 px-2.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 disabled:opacity-40 gap-1.5"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            Abrir
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShareModalOpen(true)}
                                            className="h-7 px-2.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 gap-1.5"
                                        >
                                            <Share2 className="h-3.5 w-3.5 text-blue-400" />
                                            Compartilhar
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                const url = `${window.location.origin}/portal-cliente?tab=preventivas&cliente=${encodeURIComponent(group.clientName)}&periodo=${selectedPeriod}`;
                                                navigator.clipboard.writeText(url);
                                                toast({
                                                    title: '✅ Link Copiado!',
                                                    description: `Link de acesso direto do cliente ${group.clientName} copiado.`
                                                });
                                            }}
                                            className="h-7 px-2.5 text-xs text-gray-300 hover:text-white hover:bg-gray-800 gap-1.5"
                                        >
                                            <Copy className="h-3.5 w-3.5 text-emerald-400" />
                                            Copiar link
                                        </Button>

                                        {selectedInGroup.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDownloadBatchZip(selectedInGroup, `${folderName}-selecionados`)}
                                                disabled={downloadingZip}
                                                className="h-7 px-2.5 text-xs text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 gap-1.5 font-semibold"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Baixar Selecionados ({selectedInGroup.length})
                                            </Button>
                                        )}
                                    </div>

                                    {/* Indicador de Seleção no estilo do Windows Explorer: "X 1 selecionado" */}
                                    {selectedInGroup.length > 0 && (
                                        <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-500/40 rounded-full px-3 py-0.5 text-blue-300 text-[11px] font-medium">
                                            <button 
                                                onClick={() => setSelectedItems(prev => prev.filter(id => !groupItemIds.includes(id)))}
                                                className="hover:text-white transition-colors"
                                                title="Limpar seleção"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                            <span>
                                                {selectedInGroup.length === 1 ? '1 selecionado' : `${selectedInGroup.length} selecionados`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* 3. Tabela de Arquivos PDF (Fiel às colunas: Nome, Modificado, Modificado por, Tamanho, Compartilhar, Ações) */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-seguranca-black/40 text-gray-400 text-[11px] font-semibold border-b border-gray-700/60 select-none">
                                            <tr>
                                                <th className="py-2.5 pl-4 pr-1 w-10 text-center">
                                                    <Checkbox
                                                        checked={isAllGroupSelected}
                                                        onCheckedChange={() => toggleSelectGroup(group.items)}
                                                        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow data-[state=checked]:text-black"
                                                        aria-label="Selecionar todas as preventivas da pasta"
                                                    />
                                                </th>
                                                <th className="py-2.5 px-3">Nome</th>
                                                <th className="py-2.5 px-3">Modificado</th>
                                                <th className="py-2.5 px-3">Modificado por</th>
                                                <th className="py-2.5 px-3">Tamanho</th>
                                                <th className="py-2.5 px-3">Compartilhamento</th>
                                                <th className="py-2.5 pr-5 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/40">
                                            {group.items.map(item => {
                                                const isSelected = selectedItems.includes(item.id);
                                                const isDownloading = downloadingPdfId === item.id;

                                                return (
                                                    <tr 
                                                        key={item.id} 
                                                        onClick={() => toggleSelectItem(item.id)}
                                                        className={`transition-colors cursor-pointer select-none group ${
                                                            isSelected 
                                                                ? 'bg-blue-950/40 hover:bg-blue-950/60' 
                                                                : 'hover:bg-seguranca-black/40'
                                                        }`}
                                                    >
                                                        {/* Checkbox */}
                                                        <td className="py-2.5 pl-4 pr-1 text-center" onClick={(e) => e.stopPropagation()}>
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleSelectItem(item.id)}
                                                                className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow data-[state=checked]:text-black"
                                                            />
                                                        </td>

                                                        {/* Nome com Ícone Vermelho de PDF do Windows Explorer */}
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-6 h-6 rounded bg-red-950/70 border border-red-500/50 flex items-center justify-center shrink-0">
                                                                    <FileText className="h-3.5 w-3.5 text-red-400" />
                                                                </div>
                                                                <div className="truncate max-w-[260px] sm:max-w-[340px]">
                                                                    <span className="font-mono text-xs font-semibold text-gray-200 group-hover:text-amber-300 transition-colors block">
                                                                        {item.fileName}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400">
                                                                        Veículo: {item.vehiclePlate} • {item.vehicleModel}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Modificado */}
                                                        <td className="py-2.5 px-3 text-gray-300 font-mono text-[11px]">
                                                            {item.modifiedDate}
                                                        </td>

                                                        {/* Modificado por */}
                                                        <td className="py-2.5 px-3 text-gray-300 text-xs">
                                                            {item.modifiedBy}
                                                        </td>

                                                        {/* Tamanho */}
                                                        <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                                                            {item.sizeDisplay}
                                                        </td>

                                                        {/* Compartilhamento */}
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex items-center gap-1.5 text-blue-400 text-[11px]">
                                                                <Share2 className="h-3 w-3" />
                                                                <span>Compartilhado</span>
                                                            </div>
                                                        </td>

                                                        {/* Ações */}
                                                        <td className="py-2.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {item.order && onViewOrder && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => onViewOrder(item.order!)}
                                                                        title="Visualizar Ordem de Serviço"
                                                                        className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                                                                    >
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}

                                                                {item.order ? (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleDownloadSinglePdf(item)}
                                                                        disabled={isDownloading}
                                                                        title="Baixar Relatório PDF da Preventiva"
                                                                        className="border-red-500/50 text-red-300 hover:bg-red-500/10 h-7 px-2 text-xs font-semibold gap-1"
                                                                    >
                                                                        <Download className={`h-3 w-3 ${isDownloading ? 'animate-bounce' : ''}`} />
                                                                        {isDownloading ? 'Baixando...' : 'PDF'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (onCreateWorkOrder) {
                                                                                onCreateWorkOrder(item.vehiclePlate, group.clientName);
                                                                            } else {
                                                                                toast({
                                                                                    title: 'Abertura de O.S. Preventiva',
                                                                                    description: `Abra a aba Ordens de Serviço para registrar a preventiva do veículo ${item.vehiclePlate}.`
                                                                                });
                                                                            }
                                                                        }}
                                                                        className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 h-7 px-2 text-[10px] font-semibold gap-1"
                                                                    >
                                                                        <Wrench className="h-3 w-3" />
                                                                        Gerar Preventiva
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal de Compartilhamento com o Cliente */}
            <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-md z-[10300]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-white">
                            <Share2 className="h-5 w-5 text-blue-400" />
                            Disponibilizar Preventivas ao Cliente
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs text-gray-300">
                        <p>
                            O cliente pode visualizar e baixar os relatórios de preventiva de todos os veículos alocados em sua operação através do link seguro do Portal do Cliente.
                        </p>

                        <div className="bg-seguranca-black/60 border border-gray-700 rounded-xl p-3">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Pasta / Período:
                            </span>
                            <span className="font-mono text-amber-300 font-bold text-sm block">
                                {folderTitle}
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                                Link de Acesso Direto do Cliente:
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={`${window.location.origin}/portal-cliente?tab=preventivas&periodo=${selectedPeriod}${activeClient ? `&clienteId=${activeClient.id}` : ''}`}
                                    className="bg-seguranca-black/80 border-gray-700 text-gray-200 text-xs font-mono h-9"
                                />
                                <Button
                                    onClick={handleSharePortalLink}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-3 shrink-0"
                                >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copiar
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShareModalOpen(false)}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                        >
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
