import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    Printer
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { clientService, Client } from '@/services/clientService';
import fleetWorkOrderService, { FleetWorkOrder, MaintenanceType } from '@/services/fleetWorkOrderService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface ClientMaintenancePlanPanelProps {
    onViewOrder?: (order: FleetWorkOrder) => void;
}

export const ClientMaintenancePlanPanel: React.FC<ClientMaintenancePlanPanelProps> = ({ onViewOrder }) => {
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
    const [downloadingZip, setDownloadingZip] = useState<boolean>(false);
    const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);

    // Carregar clientes
    const { data: clients = [] } = useQuery({
        queryKey: ['clients-for-maintenance-plan'],
        queryFn: async () => {
            const res = await clientService.getAll();
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
        return orders.filter(o => o.maintenanceType === MaintenanceType.PREVENTIVA || (o.preventiveModel != null));
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

    // Agrupar ordens por Cliente
    const groupedByClient = useMemo(() => {
        const map = new Map<string, { client: Client | null; clientName: string; orders: FleetWorkOrder[] }>();

        // Inicializar com o cliente selecionado ou com todos
        clients.forEach(c => {
            if (selectedClientId === 'all' || selectedClientId === c.id) {
                map.set(c.id, { client: c, clientName: c.name, orders: [] });
            }
        });

        // Adicionar grupo 'Sem Cliente Específico' se necessário
        if (selectedClientId === 'all') {
            map.set('unassigned', { client: null, clientName: 'Geral / Frota Interna', orders: [] });
        }

        preventiveOrders.forEach(order => {
            // Filtrar por período (stopDate ou createdAt)
            const dateStr = order.stopDate || order.createdAt;
            if (dateStr && selectedPeriod) {
                const [targetMonth, targetYear] = selectedPeriod.split('-');
                const cleanDate = dateStr.includes('T') ? dateStr : (dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
                const orderDate = new Date(cleanDate);
                if (!isNaN(orderDate.getTime())) {
                    const oMonth = String(orderDate.getMonth() + 1).padStart(2, '0');
                    const oYear = String(orderDate.getFullYear());
                    if (oMonth !== targetMonth || oYear !== targetYear) {
                        return; // Pula ordem fora do período
                    }
                }
            }

            // Filtrar por termo de busca (placa, modelo, etc)
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const plate = (order.vehiclePlate || '').toLowerCase();
                const model = (order.vehicleModel || '').toLowerCase();
                const cName = (order.clientName || '').toLowerCase();
                if (!plate.includes(term) && !model.includes(term) && !cName.includes(term)) {
                    return;
                }
            }

            // Associar ao cliente
            const cId = order.clientId;
            if (cId && map.has(cId)) {
                map.get(cId)!.orders.push(order);
            } else if (order.clientName) {
                // Tenta achar pelo nome
                const found = Array.from(map.values()).find(g => g.clientName.toLowerCase() === order.clientName?.toLowerCase());
                if (found) {
                    found.orders.push(order);
                } else if (selectedClientId === 'all') {
                    // Novo cliente dinâmico
                    map.set(order.clientName, { client: null, clientName: order.clientName, orders: [order] });
                }
            } else if (map.has('unassigned') && selectedClientId === 'all') {
                map.get('unassigned')!.orders.push(order);
            }
        });

        // Retornar apenas grupos que possuem ordens ou correspondem ao cliente selecionado
        return Array.from(map.values()).filter(g => g.orders.length > 0 || (selectedClientId !== 'all' && g.client?.id === selectedClientId));
    }, [clients, preventiveOrders, selectedClientId, selectedPeriod, searchTerm]);

    const activeClient = useMemo(() => {
        if (selectedClientId === 'all') return null;
        return clients.find(c => c.id === selectedClientId) || null;
    }, [clients, selectedClientId]);

    const folderTitle = useMemo(() => {
        const name = activeClient ? activeClient.name.toUpperCase() : 'TODOS OS CLIENTES';
        return `${name} ${selectedPeriod}`;
    }, [activeClient, selectedPeriod]);

    const handleDownloadSinglePdf = async (order: FleetWorkOrder) => {
        try {
            setDownloadingPdfId(order.id);
            const blob = await fleetWorkOrderService.generatePDF(order.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const plateClean = (order.vehiclePlate || 'VEICULO').replace(/[^a-zA-Z0-9]/g, '');
            const dateStr = order.stopDate ? order.stopDate.replace(/-/g, '').slice(2) : selectedPeriod.replace('-', '');
            a.download = `${plateClean} PREVENTIVA ${dateStr}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: 'Download Concluído', description: `PDF da OS ${order.osNumber || order.vehiclePlate} baixado com sucesso.` });
        } catch (err) {
            toast({ title: 'Erro ao gerar PDF', description: 'Não foi possível baixar o documento da preventiva.', variant: 'destructive' });
        } finally {
            setDownloadingPdfId(null);
        }
    };

    const handleSharePortalLink = () => {
        const url = `${window.location.origin}/portal-cliente?tab=preventivas&periodo=${selectedPeriod}${activeClient ? `&clienteId=${activeClient.id}` : ''}`;
        navigator.clipboard.writeText(url);
        toast({
            title: 'Link Copiado!',
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
                            Preventivas dos veículos agrupadas por cliente e período com relatórios e compartilhamento de PDF.
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
                        return (
                            <Card key={group.clientName} className="bg-seguranca-graphite border border-gray-700/80 rounded-2xl overflow-hidden shadow-xl">
                                {/* Header no formato da pasta do print: "TERRAÇO NOVA LIMA 11-2026" */}
                                <CardHeader className="bg-seguranca-black/50 border-b border-gray-700/80 px-5 py-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                                                <Folder className="h-5 w-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                                                    {folderName}
                                                    <Badge className="bg-emerald-950/70 border-emerald-500/50 text-emerald-300 font-mono text-[10px] px-2">
                                                        {group.orders.length} Preventiva(s)
                                                    </Badge>
                                                </CardTitle>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Veículos em operação no cliente com manutenção preventiva programada/concluída
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const url = `${window.location.origin}/portal-cliente?tab=preventivas&cliente=${encodeURIComponent(group.clientName)}&periodo=${selectedPeriod}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast({
                                                        title: 'Link Copiado!',
                                                        description: `Link de compartilhamento para ${group.clientName} copiado com sucesso.`
                                                    });
                                                }}
                                                className="border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 h-8 text-xs font-semibold gap-1.5"
                                            >
                                                <Copy className="h-3.5 w-3.5" />
                                                Copiar Link
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {/* Tabela de Arquivos PDF das Preventivas */}
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-seguranca-black/30 text-gray-400 uppercase text-[10px] border-b border-gray-700/50">
                                                <tr>
                                                    <th className="p-3 pl-5">Nome do Arquivo / Preventiva</th>
                                                    <th className="p-3">Veículo / Modelo</th>
                                                    <th className="p-3">Data Realizada</th>
                                                    <th className="p-3">Responsável Técnico</th>
                                                    <th className="p-3">Status</th>
                                                    <th className="p-3 pr-5 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-700/40">
                                                {group.orders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-6 text-center text-gray-500">
                                                            Nenhuma preventiva gerada para este cliente no mês {selectedPeriod}.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    group.orders.map(order => {
                                                        const plateClean = (order.vehiclePlate || 'VEICULO').replace(/[^a-zA-Z0-9]/g, '');
                                                        const dateDisplay = order.stopDate ? order.stopDate.split('-').reverse().join('-') : selectedPeriod;
                                                        const fileName = `${plateClean} PREVENTIVA ${dateDisplay}.pdf`;
                                                        const isDownloading = downloadingPdfId === order.id;

                                                        return (
                                                            <tr key={order.id} className="hover:bg-seguranca-black/40 transition-colors group">
                                                                {/* Nome no formato: "HDE8B69 PREVENTIVA 06-11-26.pdf" com ícone de PDF vermelho */}
                                                                <td className="p-3 pl-5 font-semibold text-gray-200">
                                                                    <div className="flex items-center gap-2.5">
                                                                        <div className="w-7 h-7 rounded bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0">
                                                                            <FileText className="h-4 w-4 text-red-400" />
                                                                        </div>
                                                                        <div>
                                                                            <span className="font-mono text-xs text-gray-100 group-hover:text-amber-300 transition-colors block">
                                                                                {fileName}
                                                                            </span>
                                                                            <span className="text-[10px] text-gray-500">
                                                                                OS: {order.osNumber || order.id.slice(0, 8)} • Modelo {order.preventiveModel === 'MODELO_2' || order.preventiveModel === 'MODELO_RESUMIDO' ? 'Resumido' : 'Padrão'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="p-3">
                                                                    <div className="font-bold text-white text-xs">{order.vehiclePlate || 'N/A'}</div>
                                                                    <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{order.vehicleModel}</div>
                                                                </td>

                                                                <td className="p-3 text-gray-300 font-mono">
                                                                    {order.stopDate ? order.stopDate.split('-').reverse().join('/') : '-'}
                                                                    {order.stopTime && <span className="text-gray-500 ml-1">({order.stopTime})</span>}
                                                                </td>

                                                                <td className="p-3 text-gray-300">
                                                                    {order.mechanicName || 'Equipe Manutenção VSS'}
                                                                </td>

                                                                <td className="p-3">
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                                                                        <CheckCircle2 className="h-3 w-3" />
                                                                        Realizada
                                                                    </span>
                                                                </td>

                                                                <td className="p-3 pr-5 text-right">
                                                                    <div className="flex items-center justify-end gap-1.5">
                                                                        {onViewOrder && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => onViewOrder(order)}
                                                                                title="Visualizar Detalhes"
                                                                                className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
                                                                            >
                                                                                <Eye className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        )}
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleDownloadSinglePdf(order)}
                                                                            disabled={isDownloading}
                                                                            title="Baixar Arquivo PDF"
                                                                            className="border-red-500/50 text-red-300 hover:bg-red-500/10 h-7 px-2.5 text-xs font-semibold gap-1"
                                                                        >
                                                                            <Download className={`h-3 w-3 ${isDownloading ? 'animate-bounce' : ''}`} />
                                                                            {isDownloading ? 'Baixando...' : 'PDF'}
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
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
                            O cliente pode visualizar e baixar os relatórios de preventiva de todos os veículos alocados em seu contrato através do Portal do Cliente.
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
                                Link de Acesso Direto:
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

