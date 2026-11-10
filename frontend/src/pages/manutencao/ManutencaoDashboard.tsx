import React, { useState, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Wrench,
    Plus,
    Search,
    RefreshCw,
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Hammer,
    Package,
    CircleDashed,
    FileText,
    MoreHorizontal,
    Eye,
    Gauge,
    DollarSign,
    FileCheck,
    ShoppingCart,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Warehouse,
    Sparkles
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { garageService } from '@/services/garageService';
import fleetWorkOrderService, {
    WorkOrderStatus,
    WorkOrderItemType,
    FleetWorkOrder,
    MaintenanceType,
    getOrderResponsibleDisplay
} from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import { FleetWorkOrderViewModal } from '@/components/frota/FleetWorkOrderViewModal';
import { FleetWorkOrderPurchaseModal } from '@/components/frota/FleetWorkOrderPurchaseModal';
import { PartsProcurementHoverCard } from '@/components/frota/PartsProcurementHoverCard';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    generateFleetWorkOrderPDFDownload
} from '@/utils/fleetWorkOrderPDFGenerator';
import TcoPanel from '@/components/frota/TcoPanel';
import ModuloDespesasPanel from '@/components/financeiro/ModuloDespesasPanel';

const formatDisplayDate = (d?: string) => {
    if (!d) return '—';
    const clean = d.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
};

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string, color: string, icon: any }> = {
    [WorkOrderStatus.OPEN]: { label: 'Aberta', color: 'bg-blue-600 text-white', icon: Clock },
    [WorkOrderStatus.DRAFT]: { label: 'Rascunho', color: 'bg-gray-500 text-white', icon: CircleDashed },
    [WorkOrderStatus.PENDING_APPROVAL]: { label: 'Aguardando Aprovação', color: 'bg-yellow-500 text-black', icon: AlertTriangle },
    [WorkOrderStatus.APPROVED]: { label: 'Aprovada', color: 'bg-blue-500 text-white', icon: CheckCircle2 },
    [WorkOrderStatus.IN_PROGRESS]: { label: 'Em Andamento', color: 'bg-orange-500 text-white', icon: Hammer },
    [WorkOrderStatus.WAITING_PARTS]: { label: 'Aguardando Peça', color: 'bg-purple-600 text-white', icon: Package },
    [WorkOrderStatus.COMPLETED]: { label: 'Concluída', color: 'bg-green-600 text-white', icon: CheckCircle2 },
    [WorkOrderStatus.CANCELLED]: { label: 'Cancelada', color: 'bg-red-600 text-white', icon: AlertTriangle },
};

const ManutencaoDashboard: React.FC = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [garageFilter, setGarageFilter] = useState<string>('ALL');
    const [sortField, setSortField] = useState<string>('osNumber');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const tabParam = searchParams.get('tab');
    const [view, setView] = useState<'os' | 'tco' | 'despesas'>(
        tabParam === 'despesas' ? 'despesas' : tabParam === 'tco' ? 'tco' : 'os'
    );
    const [viewingPdfOrder, setViewingPdfOrder] = useState<FleetWorkOrder | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const [purchaseModalOrder, setPurchaseModalOrder] = useState<FleetWorkOrder | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [duplicateModalOrder, setDuplicateModalOrder] = useState<FleetWorkOrder | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: garages = [] } = useQuery({
        queryKey: ['garages-for-os-filter'],
        queryFn: () => garageService.list(),
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
    });

    const { data: orders = [], isLoading: recordsLoading, refetch: refetchOrders } = useQuery({
        queryKey: ['fleet-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll(),
        retry: 2
    });

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        setIsFormModalOpen(false);
        setSelectedOrder(undefined);
    };

    const handleUpdateStatus = async (id: string, status: WorkOrderStatus) => {
        try {
            await fleetWorkOrderService.updateStatus(id, status);
            toast({ title: 'Sucesso', description: `Status da OS atualizado para ${STATUS_CONFIG[status]?.label || status}` });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            const msg = error?.response?.data?.message || 'Falha ao atualizar status.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        }
    };

    const handleGeneratePDF = (order: FleetWorkOrder) => {
        setViewingPdfOrder(order);
        setIsPdfModalOpen(true);
    };

    const handleDownloadPDF = async (order: FleetWorkOrder) => {
        setGeneratingPdfId(order.id);
        try {
            await generateFleetWorkOrderPDFDownload(order);
            toast({ title: 'Sucesso', description: 'PDF da O.S. baixado com sucesso.' });
        } catch {
            toast({ title: 'Erro', description: 'Falha ao baixar PDF da O.S.', variant: 'destructive' });
        } finally {
            setGeneratingPdfId(null);
        }
    };

    const handleRequestPurchase = (order: FleetWorkOrder) => {
        setPurchaseModalOrder(order);
        setIsPurchaseModalOpen(true);
    };

    const handleDuplicate = (order: FleetWorkOrder) => {
        setDuplicateModalOrder(order);
        setIsDuplicateModalOpen(true);
    };

    const confirmDuplicate = async () => {
        if (!duplicateModalOrder?.id) return;
        setDuplicatingId(duplicateModalOrder.id);
        try {
            await fleetWorkOrderService.duplicate(duplicateModalOrder.id);
            toast({
                title: 'OS Duplicada',
                description: `Nova OS criada a partir de ${duplicateModalOrder.osNumber || duplicateModalOrder.id.slice(0, 8)}.`
            });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
            setIsDuplicateModalOpen(false);
            setDuplicateModalOrder(null);
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Falha ao duplicar OS.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        } finally {
            setDuplicatingId(null);
        }
    };

    const getOrderGarageName = (order: FleetWorkOrder): string => {
        if (order.garageName && order.garageName.trim()) return order.garageName;
        if (order.garageId) {
            const found = garages.find(g => g.id === order.garageId);
            if (found?.name) return found.name;
        }
        return '—';
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
            if (typeFilter !== 'ALL' && o.maintenanceType !== typeFilter) return false;
            if (garageFilter !== 'ALL' && o.garageId !== garageFilter) return false;
            if (dateFrom && o.stopDate && o.stopDate < dateFrom) return false;
            if (dateTo && o.stopDate && o.stopDate > dateTo) return false;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const osNum = (o.osNumber || '').toLowerCase();
                const plate = (o.vehiclePlate || '').toLowerCase();
                const model = (o.vehicleModel || '').toLowerCase();
                const mech = getOrderResponsibleDisplay(o).toLowerCase();
                const client = (o.clientName || '').toLowerCase();
                const wp = (o.workPostName || '').toLowerCase();
                const garage = getOrderGarageName(o).toLowerCase();
                if (!osNum.includes(term) && !plate.includes(term) && !model.includes(term) && !mech.includes(term) && !client.includes(term) && !wp.includes(term) && !garage.includes(term)) {
                    return false;
                }
            }
            return true;
        });
    }, [orders, statusFilter, typeFilter, garageFilter, dateFrom, dateTo, searchTerm, garages]);

    const sortedOrders = useMemo(() => {
        const arr = [...filteredOrders];
        arr.sort((a, b) => {
            let aVal: any;
            let bVal: any;
            switch (sortField) {
                case 'osNumber':
                    aVal = a.osNumber || '';
                    bVal = b.osNumber || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'maintenanceType':
                    aVal = a.maintenanceType || '';
                    bVal = b.maintenanceType || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'status':
                    aVal = a.status || '';
                    bVal = b.status || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'vehiclePlate':
                    aVal = a.vehiclePlate || '';
                    bVal = b.vehiclePlate || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'garage':
                    aVal = getOrderGarageName(a);
                    bVal = getOrderGarageName(b);
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'client':
                    aVal = a.clientName || '';
                    bVal = b.clientName || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'stopDate':
                    aVal = a.stopDate || '';
                    bVal = b.stopDate || '';
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'odometerIn':
                    aVal = a.odometerIn || 0;
                    bVal = b.odometerIn || 0;
                    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
                case 'mechanicName':
                    aVal = getOrderResponsibleDisplay(a);
                    bVal = getOrderResponsibleDisplay(b);
                    return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'totalCost':
                    aVal = a.totalCost || 0;
                    bVal = b.totalCost || 0;
                    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
                default:
                    return 0;
            }
        });
        return arr;
    }, [filteredOrders, sortField, sortDir, garages]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
        return sortDir === 'asc'
            ? <ArrowUp className="h-3 w-3 ml-1 text-seguranca-yellow" />
            : <ArrowDown className="h-3 w-3 ml-1 text-seguranca-yellow" />;
    };

    const renderOrderActionMenuItems = (order: FleetWorkOrder) => (
        <>
            <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsFormModalOpen(true); }} className="text-gray-200">
                <Eye className="mr-2 h-4 w-4" /> Visualizar / Editar
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => handleDuplicate(order)}
                disabled={duplicatingId === order.id}
                className="text-blue-400"
            >
                <ClipboardList className="mr-2 h-4 w-4" />
                {duplicatingId === order.id ? 'Duplicando...' : 'Duplicar OS'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleGeneratePDF(order)} className="text-gray-200">
                <FileText className="mr-2 h-4 w-4" /> Visualizar / Imprimir PDF
            </DropdownMenuItem>
            <DropdownMenuItem
                onClick={() => handleDownloadPDF(order)}
                disabled={generatingPdfId === order.id}
                className="text-gray-200"
            >
                <FileText className="mr-2 h-4 w-4" /> Baixar PDF
            </DropdownMenuItem>

            {(order.items || []).some(i => (i.type ?? WorkOrderItemType.PART) === WorkOrderItemType.PART) && (
                <DropdownMenuItem
                    onClick={() => handleRequestPurchase(order)}
                    className="text-yellow-400"
                >
                    <ShoppingCart className="mr-2 h-4 w-4" /> Solicitar Compra ao Almoxarifado
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-gray-700" />

            {order.status !== WorkOrderStatus.IN_PROGRESS && (
                <DropdownMenuItem
                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.IN_PROGRESS)}
                    className="text-orange-400"
                >
                    <Hammer className="mr-2 h-4 w-4" /> Iniciar Execução
                </DropdownMenuItem>
            )}
            {order.status !== WorkOrderStatus.WAITING_PARTS && (
                <DropdownMenuItem
                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.WAITING_PARTS)}
                    className="text-purple-400"
                >
                    <Package className="mr-2 h-4 w-4" /> Aguardando Peça
                </DropdownMenuItem>
            )}
            {order.status !== WorkOrderStatus.COMPLETED && (
                <DropdownMenuItem
                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.COMPLETED)}
                    className="text-green-500 font-bold"
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Concluir OS
                </DropdownMenuItem>
            )}
            {order.status !== WorkOrderStatus.CANCELLED && (
                <DropdownMenuItem
                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.CANCELLED)}
                    className="text-red-500"
                >
                    <AlertTriangle className="mr-2 h-4 w-4" /> Cancelar OS
                </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-gray-700" />

            {[WorkOrderStatus.DRAFT, WorkOrderStatus.PENDING_APPROVAL, WorkOrderStatus.APPROVED].map((stKey) => (
                stKey !== order.status && (
                    <DropdownMenuItem
                        key={stKey}
                        onClick={() => handleUpdateStatus(order.id, stKey)}
                        className="text-gray-300"
                    >
                        Mudar para {STATUS_CONFIG[stKey]?.label}
                    </DropdownMenuItem>
                )
            ))}
        </>
    );

    if (recordsLoading && orders.length === 0) {
        return <LoadingSpinner />;
    }

    const scheduled = orders.filter(o => o.status === WorkOrderStatus.OPEN || o.status === WorkOrderStatus.DRAFT).length;
    const inProgress = orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length;
    const waitingParts = orders.filter(o => o.status === WorkOrderStatus.WAITING_PARTS).length;
    const completed = orders.filter(o => o.status === WorkOrderStatus.COMPLETED).length;
    const totalCost = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);

    return (
        <StandardLayout title="Gestão de Manutenção" subtitle="Controle e agendamento de manutenções e ordens de serviço da frota">
            {/* PRD Módulo 6: alternância entre Ordens de Serviço, Painel TCO e Despesas com Manutenção */}
            <div className="flex flex-wrap gap-2 mb-4">
                <Button
                    variant={view === 'os' ? 'default' : 'outline'}
                    onClick={() => {
                        setView('os');
                        setSearchParams({});
                    }}
                    size="sm"
                    className="h-9"
                >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    Ordens de Serviço
                </Button>
                <Button
                    variant={view === 'tco' ? 'default' : 'outline'}
                    onClick={() => {
                        setView('tco');
                        setSearchParams({ tab: 'tco' });
                    }}
                    size="sm"
                    className="h-9"
                >
                    <Gauge className="h-4 w-4 mr-2" />
                    Painel TCO (Substituição)
                </Button>
                <Button
                    variant="outline"
                    onClick={() => navigate('/manutencao/laudos')}
                    size="sm"
                    className="h-9 border-blue-500/40 text-blue-300 hover:bg-blue-500/10"
                >
                    <FileCheck className="h-4 w-4 mr-2 text-blue-400" />
                    Laudos de Inspeção
                </Button>
                <Button
                    variant={view === 'despesas' ? 'default' : 'outline'}
                    onClick={() => {
                        setView('despesas');
                        setSearchParams({ tab: 'despesas' });
                    }}
                    size="sm"
                    className={`h-9 ${view === 'despesas' ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold' : 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'}`}
                >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Despesas com Manutenção
                </Button>
            </div>

            {view === 'tco' ? (
                <TcoPanel />
            ) : view === 'despesas' ? (
                <ModuloDespesasPanel
                    modulo="MANUTENCAO"
                    titulo="Despesas com Manutenção"
                    subtitulo="Controle de notas, faturas e lançamentos de contas a pagar vinculados à manutenção e ordens de serviço da frota"
                />
            ) : (
            <div className="space-y-6">
                {/* Header & Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500 min-w-[130px]">
                            <CardHeader className="pb-1 p-3">
                                <CardTitle className="text-xs font-medium text-blue-400 uppercase tracking-wider">Abertas</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="text-xl font-bold text-seguranca-lightgray">{scheduled}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-l-4 border-l-orange-500 min-w-[130px]">
                            <CardHeader className="pb-1 p-3">
                                <CardTitle className="text-xs font-medium text-orange-400 uppercase tracking-wider">Em Andamento</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="text-xl font-bold text-seguranca-lightgray">{inProgress}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-l-4 border-l-purple-500 min-w-[130px]">
                            <CardHeader className="pb-1 p-3">
                                <CardTitle className="text-xs font-medium text-purple-400 uppercase tracking-wider">Aguard. Peça</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="text-xl font-bold text-seguranca-lightgray">{waitingParts}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-l-4 border-l-green-500 min-w-[130px]">
                            <CardHeader className="pb-1 p-3">
                                <CardTitle className="text-xs font-medium text-green-400 uppercase tracking-wider">Concluídas</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="text-xl font-bold text-seguranca-lightgray">{completed}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-l-4 border-l-yellow-500 min-w-[130px]">
                            <CardHeader className="pb-1 p-3">
                                <CardTitle className="text-xs font-medium text-yellow-400 uppercase tracking-wider">Custo Total</CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-0">
                                <div className="text-base font-bold text-green-400">
                                    {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetchOrders()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${recordsLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/manutencao/limpeza')}
                            className="flex-1 md:flex-none border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 font-semibold"
                        >
                            <Sparkles size={18} className="mr-2" />
                            Solicitar Limpeza
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/manutencao/laudos')}
                            className="flex-1 md:flex-none border-blue-500/60 text-blue-400 hover:bg-blue-950/40 font-semibold"
                        >
                            <FileCheck size={18} className="mr-2 text-blue-400" />
                            Laudos de Inspeção
                        </Button>
                        <Button
                            onClick={() => { setSelectedOrder(undefined); setIsFormModalOpen(true); }}
                            className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred font-bold text-white shadow-lg shadow-red-900/20"
                        >
                            <Plus size={18} className="mr-2" />
                            Nova Manutenção
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 bg-seguranca-graphite p-3 rounded-xl border border-gray-700 shadow-md">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 w-full">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Pesquisar por OS, placa, modelo, cliente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 bg-seguranca-black border-gray-600 text-sm h-10 sm:h-9 rounded-lg w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-seguranca-black border-gray-600 text-xs h-10 sm:h-9 flex-1 text-gray-300 rounded-lg"
                                title="Data inicial"
                            />
                            <span className="text-gray-500 text-xs shrink-0">até</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-seguranca-black border-gray-600 text-xs h-10 sm:h-9 flex-1 text-gray-300 rounded-lg"
                                title="Data final"
                            />
                        </div>
                        <Select value={garageFilter} onValueChange={setGarageFilter}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600 text-sm h-10 sm:h-9 w-full rounded-lg">
                                <SelectValue placeholder="Todas as garagens" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                <SelectItem value="ALL">Todas as garagens</SelectItem>
                                {garages.filter(g => g.active !== false).map(g => (
                                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                            <Button
                                variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                                onClick={() => setTypeFilter('ALL')}
                                size="sm"
                                className="flex-1 h-10 sm:h-9 text-xs shrink-0 whitespace-nowrap rounded-lg"
                            >
                                Todos Tipos
                            </Button>
                            <Button
                                variant={typeFilter === MaintenanceType.CORRETIVA ? 'default' : 'outline'}
                                onClick={() => setTypeFilter(MaintenanceType.CORRETIVA)}
                                size="sm"
                                className="flex-1 h-10 sm:h-9 text-xs shrink-0 whitespace-nowrap border-orange-600/40 text-orange-400 rounded-lg"
                            >
                                🔧 Corretiva
                            </Button>
                            <Button
                                variant={typeFilter === MaintenanceType.PREVENTIVA ? 'default' : 'outline'}
                                onClick={() => setTypeFilter(MaintenanceType.PREVENTIVA)}
                                size="sm"
                                className="flex-1 h-10 sm:h-9 text-xs shrink-0 whitespace-nowrap border-green-600/40 text-green-400 rounded-lg"
                            >
                                📋 Preventiva
                            </Button>
                        </div>
                    </div>

                    {/* Filtros de Status com scroll horizontal perfeito no mobile */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full py-1 border-t border-gray-700/60 pt-2">
                        <Button
                            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('ALL')}
                            size="sm"
                            className="h-8 text-xs shrink-0 whitespace-nowrap rounded-lg font-medium"
                        >
                            Todos Status
                        </Button>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                onClick={() => setStatusFilter(status as WorkOrderStatus)}
                                size="sm"
                                className={`h-8 text-xs shrink-0 whitespace-nowrap rounded-lg font-medium ${statusFilter === status ? config.color : 'text-gray-300 border-gray-700 hover:border-gray-500'}`}
                            >
                                {config.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table / Cards View */}
                <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden shadow-lg">
                    <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20 pb-3 pt-3">
                        <CardTitle className="text-seguranca-lightgray flex items-center justify-between text-base sm:text-lg">
                            <span className="flex items-center">
                                <ClipboardList className="mr-2 text-seguranca-yellow" size={20} />
                                Ordens de Serviço e Manutenções da Frota
                            </span>
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {filteredOrders.length} OS
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Visualização em Cards para Mobile (< md) */}
                        <div className="block md:hidden divide-y divide-gray-700/80">
                            {sortedOrders.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    Nenhuma ordem de serviço encontrada com os filtros selecionados.
                                </div>
                            ) : (
                                sortedOrders.map(order => (
                                    <div key={`mobile-${order.id}`} className="p-3.5 space-y-2.5 hover:bg-seguranca-black/30 transition-colors">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-bold text-sm text-seguranca-lightgray">
                                                {order.osNumber || `OS-${order.id.slice(0, 8)}`}
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="outline" className={`font-bold text-[10px] px-1.5 py-0.5 ${order.maintenanceType === MaintenanceType.PREVENTIVA ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400'}`}>
                                                    {order.maintenanceType || 'CORRETIVA'}
                                                </Badge>
                                                <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px] px-2 py-0.5`}>
                                                    {STATUS_CONFIG[order.status]?.label || order.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-2 bg-seguranca-black/40 p-2.5 rounded-lg border border-gray-700/60">
                                            <div>
                                                <div className="font-mono font-bold text-seguranca-yellow text-base">
                                                    {order.vehiclePlate || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {order.vehicleModel || 'Veículo não informado'}
                                                </div>
                                                <div className="text-[11px] text-seguranca-yellow/90 flex items-center gap-1 mt-0.5">
                                                    <Warehouse className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{getOrderGarageName(order)}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-400">Custo Total</div>
                                                <div className="font-mono font-bold text-sm text-emerald-400">
                                                    {(order.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-0.5">
                                            <span>
                                                Data: {formatDisplayDate(order.stopDate)}
                                            </span>
                                            <span>
                                                {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : ''}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1 border-t border-gray-700/50">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => { setSelectedOrder(order); setIsFormModalOpen(true); }}
                                                className="flex-1 h-8 text-xs border-gray-600 text-gray-200 hover:bg-gray-700"
                                            >
                                                <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                Ver / Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleGeneratePDF(order)}
                                                disabled={generatingPdfId === order.id}
                                                className="h-8 px-3 text-xs border-red-500/60 text-red-400 hover:bg-red-500/10"
                                                title="Visualizar PDF"
                                            >
                                                <FileText className="h-3.5 w-3.5 mr-1" />
                                                PDF
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-8 w-8 p-0 border border-gray-700">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 z-[10100]">
                                                    {renderOrderActionMenuItems(order)}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Visualização em Tabela para Desktop (>= md) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-seguranca-black/50 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('osNumber')}>
                                            <span className="flex items-center">Nº OS <SortIcon field="osNumber" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('maintenanceType')}>
                                            <span className="flex items-center">Tipo <SortIcon field="maintenanceType" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('status')}>
                                            <span className="flex items-center">Status <SortIcon field="status" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('vehiclePlate')}>
                                            <span className="flex items-center">Equipamento / Placa <SortIcon field="vehiclePlate" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('garage')}>
                                            <span className="flex items-center">Garagem <SortIcon field="garage" /></span>
                                        </th>
                                        <th className="hidden lg:table-cell p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('client')}>
                                            <span className="flex items-center">Cliente / Obra <SortIcon field="client" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('stopDate')}>
                                            <span className="flex items-center">Data Parada <SortIcon field="stopDate" /></span>
                                        </th>
                                        <th className="hidden xl:table-cell p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('odometerIn')}>
                                            <span className="flex items-center">KM Parada <SortIcon field="odometerIn" /></span>
                                        </th>
                                        <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('mechanicName')}>
                                            <span className="flex items-center">Responsável <SortIcon field="mechanicName" /></span>
                                        </th>
                                        <th className="p-4 text-right cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('totalCost')}>
                                            <span className="flex items-center justify-end">Custo Total <SortIcon field="totalCost" /></span>
                                        </th>
                                        <th className="p-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {sortedOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-gray-400">
                                                Nenhuma ordem de serviço encontrada com os filtros selecionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-seguranca-black/30 transition-colors">
                                                <td className="p-4 font-bold text-seguranca-lightgray">
                                                    {order.osNumber || `OS-${order.id.slice(0, 8)}`}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className={`font-bold ${order.maintenanceType === MaintenanceType.PREVENTIVA ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400'}`}>
                                                        {order.maintenanceType || 'CORRETIVA'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    {order.status === WorkOrderStatus.WAITING_PARTS ? (
                                                        <PartsProcurementHoverCard workOrderId={order.id} osNumber={order.osNumber}>
                                                            <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-xs cursor-pointer hover:opacity-90 transition-opacity`}>
                                                                {STATUS_CONFIG[order.status]?.label || order.status}
                                                            </Badge>
                                                        </PartsProcurementHoverCard>
                                                    ) : (
                                                        <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-xs`}>
                                                            {STATUS_CONFIG[order.status]?.label || order.status}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-200">{order.vehiclePlate || 'N/A'}</div>
                                                    <div className="text-xs text-gray-400">{order.vehicleModel}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    <div className="flex items-center gap-1.5">
                                                        <Warehouse className="h-3.5 w-3.5 text-seguranca-yellow/80 shrink-0" />
                                                        <span className="font-medium text-xs sm:text-sm text-gray-200 whitespace-nowrap">
                                                            {getOrderGarageName(order)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="hidden lg:table-cell p-4 text-gray-300">
                                                    <div className="font-medium text-gray-200">{order.clientName || '—'}</div>
                                                    {order.workPostName && <div className="text-xs text-gray-400">{order.workPostName}</div>}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {formatDisplayDate(order.stopDate)}
                                                    {order.stopTime && <span className="text-xs text-gray-500 ml-1">({order.stopTime})</span>}
                                                </td>
                                                <td className="hidden xl:table-cell p-4 text-gray-300 font-mono">
                                                    {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : '—'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {getOrderResponsibleDisplay(order)}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-seguranca-lightgray">
                                                    {(order.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleGeneratePDF(order)}
                                                            disabled={generatingPdfId === order.id}
                                                            title="Visualizar e Imprimir OS"
                                                            className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 px-2.5 text-xs font-semibold"
                                                        >
                                                            <FileText className="mr-1 h-3.5 w-3.5" />
                                                            Visualizar
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 z-[10100]">
                                                                {renderOrderActionMenuItems(order)}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
            )}

            <FleetWorkOrderForm
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setSelectedOrder(undefined);
                }}
                onSuccess={handleSuccess}
                order={selectedOrder}
            />

            <FleetWorkOrderViewModal
                isOpen={isPdfModalOpen}
                onClose={() => {
                    setIsPdfModalOpen(false);
                    setViewingPdfOrder(null);
                }}
                order={viewingPdfOrder}
            />

            <FleetWorkOrderPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => {
                    setIsPurchaseModalOpen(false);
                    setPurchaseModalOrder(null);
                }}
                order={purchaseModalOrder}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
                }}
            />

            <Dialog open={isDuplicateModalOpen} onOpenChange={setIsDuplicateModalOpen}>
                <DialogContent className="max-w-md w-[92vw] sm:w-full bg-[#0d0e12] border-gray-800 text-gray-100 shadow-2xl rounded-2xl p-5 z-[10150]">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white">Duplicar Ordem de Serviço</DialogTitle>
                                <DialogDescription className="text-xs text-gray-400">
                                    Cópia de OS com status inicial Aberta
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-3 text-xs text-gray-300">
                        Deseja duplicar a OS <strong className="text-white font-mono">{duplicateModalOrder?.osNumber || (duplicateModalOrder?.id ? '#' + duplicateModalOrder.id.slice(0, 8) : '')}</strong>? Uma nova OS será gerada com os mesmos dados e itens cadastrados.
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDuplicateModalOpen(false)}
                            disabled={!!duplicatingId}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={confirmDuplicate}
                            disabled={!!duplicatingId}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                        >
                            {duplicatingId ? 'Duplicando...' : 'Confirmar Duplicação'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </StandardLayout>
    );
};

export default ManutencaoDashboard;

