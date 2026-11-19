'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Wrench,
    Plus,
    Filter,
    Search,
    MoreHorizontal,
    ClipboardList,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Eye,
    FileText,
    Hammer,
    CircleDashed,
    TrendingUp,
    Car,
    ShoppingCart,
    Package,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Sparkles,
    Warehouse,
    Bell,
    Folder,
    Trash2,
    X
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { garageService, Garage } from '@/services/garageService';
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
import { FleetComponentControlsPanel } from '@/components/frota/FleetComponentControlsPanel';
import { ClientMaintenancePlanPanel } from '@/components/frota/ClientMaintenancePlanPanel';
import { DueComponentsAlertModal } from '@/components/frota/DueComponentsAlertModal';
import fleetComponentControlService, {
    buildWorkOrderPrefillFromComponentRow,
    buildWorkOrderPrefillFromMultipleComponentRows,
    FleetComponentControlRow
} from '@/services/fleetComponentControlService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
    generateFleetWorkOrderPDFBlob,
    generateFleetWorkOrderPDFDownload
} from '@/utils/fleetWorkOrderPDFGenerator';

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

const formatDisplayDate = (d?: string) => {
    if (!d) return '—';
    const clean = d.split('T')[0];
    const parts = clean.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
};

const FleetWorkOrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [prefillOrderValues, setPrefillOrderValues] = useState<Partial<FleetWorkOrder> | undefined>(undefined);
    const [dueModalOpen, setDueModalOpen] = useState(false);
    const [hasTriggeredDueModal, setHasTriggeredDueModal] = useState(false);
    const [isRunningAutoSweep, setIsRunningAutoSweep] = useState(false);
    const tabParam = searchParams.get('tab');

    const handleRunAutoPreventiveSweep = async () => {
        setIsRunningAutoSweep(true);
        try {
            const res = await fleetWorkOrderService.runAutoPreventiveSweep();
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
            queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
            toast({
                title: res.createdCount > 0
                    ? `${res.createdCount} OS Preventiva(s) Modelo 2 gerada(s)`
                    : 'Frota verificada (nenhuma nova OS vencida)',
                description: res.createdCount > 0
                    ? `${res.checkedVehicles} veículo(s) avaliado(s) conforme perfil Urbano/Rodoviário e revisão do Alternador.`
                    : `${res.checkedVehicles} veículo(s) avaliado(s). Nenhuma pendência nova sem OS preventiva aberta.`,
            });
        } catch (err: any) {
            toast({
                title: 'Erro ao gerar OS Preventivas automáticas',
                description: err?.response?.data?.error || err?.message || 'Falha ao executar varredura de KM.',
                variant: 'destructive',
            });
        } finally {
            setIsRunningAutoSweep(false);
        }
    };
    const resolveTabView = (param: string | null): 'os' | 'componentes' | 'alertas' | 'plano-cliente' => {
        if (param === 'componentes') return 'componentes';
        if (param === 'alertas') return 'alertas';
        if (param === 'plano-cliente' || param === 'clientes' || param === 'plano') return 'plano-cliente';
        return 'os';
    };
    const [view, setView] = useState<'os' | 'componentes' | 'alertas' | 'plano-cliente'>(resolveTabView(tabParam));
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'ALL'>('ALL');

    useEffect(() => {
        setView(resolveTabView(tabParam));
    }, [tabParam]);

    const { data: compDashboard } = useQuery({
        queryKey: ['fleet-component-controls', 'ALL', 'ALL', String(new Date().getFullYear())],
        queryFn: () => fleetComponentControlService.getDashboard({ controlType: 'ALL' }),
        staleTime: 60_000,
    });

    const expiringComponentsCount = compDashboard?.expiringAlerts?.length || 0;

    useEffect(() => {
        if (!hasTriggeredDueModal && compDashboard && compDashboard.expiringAlerts.length > 0) {
            setHasTriggeredDueModal(true);
            setDueModalOpen(true);
        }
    }, [compDashboard, hasTriggeredDueModal]);

    const handleOpenOsFromComponent = (vals: Partial<FleetWorkOrder>) => {
        setSelectedOrder(undefined);
        setPrefillOrderValues(vals);
        setIsFormOpen(true);
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [garageFilter, setGarageFilter] = useState<string>('ALL');
    const [sortField, setSortField] = useState<string>('osNumber');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const { data: garages = [] } = useQuery({
        queryKey: ['garages-for-os-filter'],
        queryFn: () => garageService.list(),
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
    });

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['fleet-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll(),
        staleTime: 60_000, // 1 minuto de dados quentes instantâneos
        gcTime: 10 * 60_000, // Mantém em cache por 10 minutos na memória
        refetchOnWindowFocus: false, // Evita engasgos e refetches desnecessários ao alternar abas
    });

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

    const [viewingPdfOrder, setViewingPdfOrder] = useState<FleetWorkOrder | null>(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
    const [requestingPurchaseId, setRequestingPurchaseId] = useState<string | null>(null);

    const handleGeneratePDF = (order: FleetWorkOrder) => {
        setViewingPdfOrder(order);
        setIsPdfModalOpen(true);
    };

    const handleDownloadPDF = async (order: FleetWorkOrder) => {
        setGeneratingPdfId(order.id);
        try {
            await generateFleetWorkOrderPDFDownload(order);
            toast({ title: 'Sucesso', description: 'PDF da O.S. baixado com sucesso.' });
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao baixar PDF da O.S.', variant: 'destructive' });
        } finally {
            setGeneratingPdfId(null);
        }
    };

    const [purchaseModalOrder, setPurchaseModalOrder] = useState<FleetWorkOrder | null>(null);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    const handleRequestPurchase = (order: FleetWorkOrder) => {
        setPurchaseModalOrder(order);
        setIsPurchaseModalOpen(true);
    };

    // Gap 5 — Duplicar OS (PRD §25)
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const [duplicateModalOrder, setDuplicateModalOrder] = useState<FleetWorkOrder | null>(null);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

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

    // ── Seleção e Ações em Massa / Cancelamento / Exclusão ───────────────
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

    const [cancelModalIds, setCancelModalIds] = useState<string[]>([]);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const [deleteModalIds, setDeleteModalIds] = useState<string[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleToggleSelect = (id: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleOpenCancelModal = (ids: string[]) => {
        setCancelModalIds(ids);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (cancelModalIds.length === 0) return;
        setIsCancelling(true);
        try {
            if (cancelModalIds.length === 1) {
                await fleetWorkOrderService.updateStatus(cancelModalIds[0], WorkOrderStatus.CANCELLED);
                toast({ title: 'OS Cancelada', description: 'Ordem de Serviço cancelada com sucesso.' });
            } else {
                const res = await fleetWorkOrderService.bulkCancel(cancelModalIds, cancelReason);
                toast({ title: 'Cancelamento em Lote', description: `${res.successCount} OS(s) cancelada(s) com sucesso.` });
            }
            setSelectedOrderIds(prev => prev.filter(id => !cancelModalIds.includes(id)));
            setIsCancelModalOpen(false);
            setCancelModalIds([]);
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            toast({
                title: 'Erro ao cancelar',
                description: error?.response?.data?.error || error?.response?.data?.message || 'Falha ao cancelar OS.',
                variant: 'destructive'
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const handleOpenDeleteModal = (ids: string[]) => {
        setDeleteModalIds(ids);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deleteModalIds.length === 0) return;
        setIsDeleting(true);
        try {
            if (deleteModalIds.length === 1) {
                await fleetWorkOrderService.delete(deleteModalIds[0]);
                toast({ title: 'OS Excluída', description: 'Ordem de Serviço excluída (inativada) com sucesso.' });
            } else {
                const res = await fleetWorkOrderService.bulkDelete(deleteModalIds);
                let msg = `${res.successCount} OS(s) excluída(s) com sucesso.`;
                if (res.skippedCount > 0) {
                    msg += ` (${res.skippedCount} OS(s) concluída(s) foram preservadas por segurança - RN10).`;
                }
                toast({ title: 'Exclusão em Lote', description: msg });
            }
            setSelectedOrderIds(prev => prev.filter(id => !deleteModalIds.includes(id)));
            setIsDeleteModalOpen(false);
            setDeleteModalIds([]);
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            toast({
                title: 'Erro ao excluir',
                description: error?.response?.data?.error || error?.response?.data?.message || 'Falha ao excluir. OSs concluídas não podem ser excluídas.',
                variant: 'destructive'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Cards / Resumo conforme PRD Seção 23
    const stats = useMemo(() => ({
        total: orders.length,
        open: orders.filter(o => o.status === WorkOrderStatus.OPEN || o.status === WorkOrderStatus.DRAFT).length,
        inProgress: orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length,
        waitingParts: orders.filter(o => o.status === WorkOrderStatus.WAITING_PARTS).length,
        completed: orders.filter(o => o.status === WorkOrderStatus.COMPLETED).length,
    }), [orders]);

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
            // Filtro por garagem executora da OS
            if (garageFilter !== 'ALL' && o.garageId !== garageFilter) return false;
            // Gap 4 — Filtro por data de parada (PRD §24)
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

    const isAllSelected = sortedOrders.length > 0 && sortedOrders.every(o => selectedOrderIds.includes(o.id));
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedOrderIds([]);
        } else {
            setSelectedOrderIds(sortedOrders.map(o => o.id));
        }
    };

    return (
        <StandardLayout title="Gestão de Ordem de Serviço">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="text-center lg:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold text-seguranca-lightgray flex items-center justify-center lg:justify-start gap-2">
                            <ClipboardList className="h-7 w-7 sm:h-8 sm:w-8 text-seguranca-yellow" />
                            Ordens de Serviço
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">Controle de manutenção corretiva e preventiva.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handleRunAutoPreventiveSweep}
                            disabled={isRunningAutoSweep}
                            className="border-emerald-500/70 text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs sm:text-sm h-10"
                            title="Avalia toda a frota e abre OS Preventiva Modelo 2 automática para os veículos que atingiram os intervalos Urbano/Rodoviário ou 150.000 km do Alternador"
                        >
                            <CheckCircle2 className={`mr-2 h-4 w-4 ${isRunningAutoSweep ? 'animate-spin' : ''}`} />
                            {isRunningAutoSweep ? 'Avaliando Frota...' : 'Gerar Preventivas (KM)'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/manutencao/limpeza')}
                            className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 font-bold text-xs sm:text-sm h-10"
                        >
                            <Sparkles className="mr-2 h-4 w-4" /> Solicitar Limpeza
                        </Button>
                        <Button
                            onClick={() => { setSelectedOrder(undefined); setPrefillOrderValues(undefined); setIsFormOpen(true); }}
                            className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-bold text-xs sm:text-sm h-10"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nova O.S.
                        </Button>
                    </div>
                </div>

                {/* Navegação entre Ordens de Serviço, Plano por Cliente, Controles Preventivos e Alertas de Vencimentos */}
                <div className="flex flex-wrap gap-2">
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
                        variant={view === 'plano-cliente' ? 'default' : 'outline'}
                        onClick={() => {
                            setView('plano-cliente');
                            setSearchParams({ tab: 'plano-cliente' });
                        }}
                        size="sm"
                        className={`h-9 ${view === 'plano-cliente' ? 'bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md shadow-amber-950/40' : 'border-amber-500/50 text-amber-300 hover:bg-amber-500/10 font-semibold'}`}
                    >
                        <Folder className="h-4 w-4 mr-2" />
                        Plano de Manutenção por Cliente
                    </Button>
                    <Button
                        variant={view === 'componentes' ? 'default' : 'outline'}
                        onClick={() => {
                            setView('componentes');
                            setSearchParams({ tab: 'componentes' });
                        }}
                        size="sm"
                        className={`h-9 ${view === 'componentes' ? 'bg-seguranca-yellow hover:bg-amber-400 text-black font-semibold' : 'border-seguranca-yellow/40 text-seguranca-yellow hover:bg-seguranca-yellow/10'}`}
                    >
                        <Wrench className="h-4 w-4 mr-2" />
                        Controles Preventivos
                    </Button>
                    <Button
                        variant={view === 'alertas' ? 'default' : 'outline'}
                        onClick={() => {
                            setView('alertas');
                            setSearchParams({ tab: 'alertas' });
                        }}
                        size="sm"
                        className={`h-9 ${view === 'alertas' ? 'bg-red-600 hover:bg-red-700 text-white font-semibold' : 'border-red-500/40 text-red-300 hover:bg-red-500/10'}`}
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Alertas de Vencimentos
                        {expiringComponentsCount > 0 && (
                            <Badge className="ml-2 bg-white text-red-700 font-bold text-[10px] px-1.5 py-0">
                                {expiringComponentsCount}
                            </Badge>
                        )}
                    </Button>
                </div>

                {view === 'plano-cliente' ? (
                    <ClientMaintenancePlanPanel
                        onViewOrder={(o) => { setSelectedOrder(o); setIsFormOpen(true); }}
                    />
                ) : view === 'componentes' || view === 'alertas' ? (
                    <FleetComponentControlsPanel
                        key={view}
                        defaultSubTab={view === 'alertas' ? 'ALERTS' : 'ALL'}
                        showAutoAlertModalOnMount={false}
                        onCreateWorkOrder={handleOpenOsFromComponent}
                    />
                ) : (
                    <>
                        {/* Cards/Resumo conforme PRD Seção 23 */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <Card className="bg-seguranca-graphite border-l-4 border-l-gray-500">
                                <CardContent className="p-4">
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Total de OS</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.total}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500">
                                <CardContent className="p-4">
                                    <p className="text-xs text-blue-400 font-semibold uppercase">Abertas</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.open}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-seguranca-graphite border-l-4 border-l-orange-500">
                                <CardContent className="p-4">
                                    <p className="text-xs text-orange-400 font-semibold uppercase">Em Andamento</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.inProgress}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-seguranca-graphite border-l-4 border-l-purple-500">
                                <CardContent className="p-4">
                                    <p className="text-xs text-purple-400 font-semibold uppercase">Aguardando Peça</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.waitingParts}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-seguranca-graphite border-l-4 border-l-green-500">
                                <CardContent className="p-4">
                                    <p className="text-xs text-green-400 font-semibold uppercase">Concluídas</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.completed}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Filters & Content */}
                        <div className="space-y-4">
                            <div className="bg-seguranca-graphite p-3 rounded-lg border border-gray-700 space-y-4">
                                {/* Top row: Search, Dates, Garage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                                    <div className="relative w-full">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Pesquisar por OS, placa, modelo..."
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                            className="pl-9 bg-seguranca-black border-gray-600 text-sm h-10 w-full"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={e => setDateFrom(e.target.value)}
                                            className="bg-seguranca-black border-gray-600 text-xs h-10 flex-1 text-gray-300"
                                            title="Data inicial"
                                        />
                                        <span className="text-gray-500 text-xs shrink-0">até</span>
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={e => setDateTo(e.target.value)}
                                            className="bg-seguranca-black border-gray-600 text-xs h-10 flex-1 text-gray-300"
                                            title="Data final"
                                        />
                                    </div>

                                    <Select value={garageFilter} onValueChange={setGarageFilter}>
                                        <SelectTrigger className="bg-seguranca-black border-gray-600 text-sm h-10 w-full">
                                            <SelectValue placeholder="Garagem" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                            <SelectItem value="ALL">Todas as garagens</SelectItem>
                                            {garages.filter(g => g.active !== false).map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                                            onClick={() => setTypeFilter('ALL')}
                                            size="sm"
                                            className="flex-1 h-10 text-xs font-semibold"
                                        >
                                            Todos Tipos
                                        </Button>
                                        <Button
                                            variant={typeFilter === MaintenanceType.CORRETIVA ? 'default' : 'outline'}
                                            onClick={() => setTypeFilter(MaintenanceType.CORRETIVA)}
                                            size="sm"
                                            className="flex-1 h-10 text-xs border-orange-600/40 text-orange-400 font-semibold"
                                        >
                                            🔧 Corretiva
                                        </Button>
                                        <Button
                                            variant={typeFilter === MaintenanceType.PREVENTIVA ? 'default' : 'outline'}
                                            onClick={() => setTypeFilter(MaintenanceType.PREVENTIVA)}
                                            size="sm"
                                            className="flex-1 h-10 text-xs border-green-600/40 text-green-400 font-semibold"
                                        >
                                            📋 Preventiva
                                        </Button>
                                    </div>
                                </div>

                                {/* Bottom row: Status scrollable bar */}
                                <div className="border-t border-gray-700/50 pt-3">
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        <Button
                                            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                                            onClick={() => setStatusFilter('ALL')}
                                            size="sm"
                                            className="h-8 text-[11px] px-3 shrink-0 font-bold"
                                        >
                                            TODOS STATUS
                                        </Button>
                                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                                            <Button
                                                key={status}
                                                variant={statusFilter === status ? 'default' : 'outline'}
                                                onClick={() => setStatusFilter(status as WorkOrderStatus)}
                                                size="sm"
                                                className={`h-8 text-[11px] px-3 shrink-0 font-bold ${statusFilter === status ? config.color : 'text-gray-400 border-gray-700'}`}
                                            >
                                                {config.label.toUpperCase()}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Card className="bg-seguranca-graphite border-gray-600">
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-xs text-left border-collapse">
                                            <thead className="bg-seguranca-black/70 text-gray-400 uppercase text-[10px] sm:text-[11px] tracking-wider">
                                                <tr>
                                                    <th className="p-2 sm:px-2.5 text-center w-8 select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={isAllSelected}
                                                            onChange={handleSelectAll}
                                                            className="rounded border-gray-600 bg-gray-800 text-seguranca-yellow focus:ring-seguranca-yellow cursor-pointer h-3.5 w-3.5"
                                                            title="Selecionar todas"
                                                        />
                                                    </th>
                                                    <th className="p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('osNumber')}>
                                                        <span className="flex items-center">Nº OS <SortIcon field="osNumber" /></span>
                                                    </th>
                                                    <th className="p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('maintenanceType')}>
                                                        <span className="flex items-center">Tipo <SortIcon field="maintenanceType" /></span>
                                                    </th>
                                                    <th className="p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('status')}>
                                                        <span className="flex items-center">Status <SortIcon field="status" /></span>
                                                    </th>
                                                    <th className="p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none min-w-[110px]" onClick={() => handleSort('vehiclePlate')}>
                                                        <span className="flex items-center">Equipamento <SortIcon field="vehiclePlate" /></span>
                                                    </th>
                                                    <th className="hidden sm:table-cell p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('garage')}>
                                                        <span className="flex items-center">Garagem <SortIcon field="garage" /></span>
                                                    </th>
                                                    <th className="hidden lg:table-cell p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('client')}>
                                                        <span className="flex items-center">Cliente / Obra <SortIcon field="client" /></span>
                                                    </th>
                                                    <th className="hidden md:table-cell p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('stopDate')}>
                                                        <span className="flex items-center">Data Parada <SortIcon field="stopDate" /></span>
                                                    </th>
                                                    <th className="hidden xl:table-cell p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('odometerIn')}>
                                                        <span className="flex items-center">KM Parada <SortIcon field="odometerIn" /></span>
                                                    </th>
                                                    <th className="hidden md:table-cell p-2 sm:px-2 cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('mechanicName')}>
                                                        <span className="flex items-center">Responsável <SortIcon field="mechanicName" /></span>
                                                    </th>
                                                    <th className="p-2 sm:px-2 text-right cursor-pointer hover:text-white transition-colors select-none whitespace-nowrap" onClick={() => handleSort('totalCost')}>
                                                        <span className="flex items-center justify-end">Custo <SortIcon field="totalCost" /></span>
                                                    </th>
                                                    <th className="p-2 sm:px-2.5 text-center uppercase text-[10px] sm:text-[11px] tracking-wider whitespace-nowrap sticky right-0 bg-slate-100 dark:bg-[#121318] text-slate-700 dark:text-gray-300 z-20 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_rgba(0,0,0,0.4)]">
                                                        Ações
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200 dark:divide-gray-700/60">
                                                {isLoading && orders.length === 0 ? (
                                                    Array.from({ length: 5 }).map((_, idx) => (
                                                        <tr key={`skeleton-${idx}`} className="animate-pulse">
                                                            <td className="p-2 sm:px-2.5 text-center"><div className="h-3.5 w-3.5 bg-gray-700 rounded mx-auto" /></td>
                                                            <td className="p-2 sm:px-2"><div className="h-4 w-16 sm:w-20 bg-gray-700 rounded" /></td>
                                                            <td className="p-2 sm:px-2"><div className="h-4 w-12 sm:w-16 bg-gray-700 rounded-full" /></td>
                                                            <td className="p-2 sm:px-2"><div className="h-4 w-12 sm:w-16 bg-gray-700 rounded-full" /></td>
                                                            <td className="p-2 sm:px-2"><div className="h-4 w-16 sm:w-20 bg-gray-700 rounded mb-1" /><div className="h-3 w-20 sm:w-24 bg-gray-800 rounded" /></td>
                                                            <td className="hidden sm:table-cell p-2 sm:px-2"><div className="h-4 w-16 bg-gray-700 rounded" /></td>
                                                            <td className="hidden lg:table-cell p-2 sm:px-2"><div className="h-4 w-20 bg-gray-700 rounded mb-1" /><div className="h-3 w-16 bg-gray-800 rounded" /></td>
                                                            <td className="hidden md:table-cell p-2 sm:px-2"><div className="h-4 w-16 bg-gray-700 rounded" /></td>
                                                            <td className="hidden xl:table-cell p-2 sm:px-2"><div className="h-4 w-14 bg-gray-700 rounded" /></td>
                                                            <td className="hidden md:table-cell p-2 sm:px-2"><div className="h-4 w-20 bg-gray-700 rounded" /></td>
                                                            <td className="p-2 sm:px-2 text-right"><div className="h-4 w-14 sm:w-16 bg-gray-700 rounded ml-auto" /></td>
                                                            <td className="p-2 sm:px-2.5 sticky right-0 bg-white dark:bg-[#16181f] z-10 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_rgba(0,0,0,0.4)]"><div className="h-7 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto" /></td>
                                                        </tr>
                                                    ))
                                                ) : sortedOrders.map(order => (
                                                    <tr key={order.id} className={`hover:bg-slate-50 dark:hover:bg-seguranca-black/40 transition-colors ${selectedOrderIds.includes(order.id) ? 'bg-amber-50/60 dark:bg-seguranca-yellow/5' : ''}`}>
                                                        <td className="p-2 sm:px-2.5 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedOrderIds.includes(order.id)}
                                                                onChange={() => handleToggleSelect(order.id)}
                                                                className="rounded border-gray-600 bg-gray-800 text-seguranca-yellow focus:ring-seguranca-yellow cursor-pointer h-3.5 w-3.5"
                                                            />
                                                        </td>
                                                        <td className="p-2 sm:px-2 font-mono font-bold text-seguranca-lightgray text-xs whitespace-nowrap">
                                                            {order.osNumber || `OS-${order.id.slice(0, 8)}`}
                                                        </td>
                                                        <td className="p-2 sm:px-2 whitespace-nowrap">
                                                            <div className="flex flex-col gap-0.5 items-start">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`font-bold text-[10px] px-1.5 py-0.5 ${order.maintenanceType === MaintenanceType.PREVENTIVA
                                                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/50'
                                                                        : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-500/50'
                                                                        }`}
                                                                >
                                                                    {order.maintenanceType === MaintenanceType.PREVENTIVA ? 'PREV' : (order.maintenanceType === MaintenanceType.CORRETIVA ? 'CORR' : order.maintenanceType || 'CORR')}
                                                                </Badge>
                                                                {(order.preventiveModel === 'MODELO_2' || order.preventiveModel === 'MODELO_RESUMIDO') && (
                                                                    <span className="preventiva-badge-resumido text-[9px] font-bold px-1 py-0.5 rounded border whitespace-nowrap bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-600/50">
                                                                        Resumido {order.autoGenerated ? '• Auto' : ''} {order.operationProfile ? `• ${order.operationProfile}` : ''}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-2 sm:px-2 whitespace-nowrap">
                                                            {order.status === WorkOrderStatus.WAITING_PARTS ? (
                                                                <PartsProcurementHoverCard workOrderId={order.id} osNumber={order.osNumber}>
                                                                    <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px] cursor-pointer hover:opacity-90 transition-opacity px-2 py-0.5`}>
                                                                        {STATUS_CONFIG[order.status]?.label || order.status}
                                                                    </Badge>
                                                                </PartsProcurementHoverCard>
                                                            ) : (
                                                                <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px] px-2 py-0.5`}>
                                                                    {STATUS_CONFIG[order.status]?.label || order.status}
                                                                </Badge>
                                                            )}
                                                        </td>
                                                        <td className="p-2 sm:px-2 min-w-[110px]">
                                                            <div className="font-semibold text-gray-200 text-xs whitespace-nowrap">{order.vehiclePlate || 'N/A'}</div>
                                                            <div className="text-[10px] text-gray-400 truncate max-w-[110px] 2xl:max-w-[140px]">{order.vehicleModel}</div>
                                                            <div className="text-[10px] text-seguranca-yellow/90 sm:hidden flex items-center gap-1 mt-0.5">
                                                                <Warehouse className="h-3 w-3 shrink-0" />
                                                                <span className="truncate max-w-[90px]">{getOrderGarageName(order)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="hidden sm:table-cell p-2 sm:px-2 text-gray-300">
                                                            <div className="flex items-center gap-1">
                                                                <Warehouse className="h-3 w-3 text-seguranca-yellow/80 shrink-0" />
                                                                <span className="font-medium text-xs text-gray-200 truncate max-w-[90px] whitespace-nowrap">
                                                                    {getOrderGarageName(order)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="hidden lg:table-cell p-2 sm:px-2 text-gray-300">
                                                            <div className="font-medium text-xs text-gray-200 truncate max-w-[100px]">{order.clientName || '—'}</div>
                                                            {order.workPostName && <div className="text-[10px] text-gray-400 truncate max-w-[100px]">{order.workPostName}</div>}
                                                        </td>
                                                        <td className="hidden md:table-cell p-2 sm:px-2 text-gray-300 text-xs whitespace-nowrap">
                                                            <div>
                                                                {formatDisplayDate(order.stopDate)}
                                                                {order.stopTime && <span className="text-[10px] text-gray-500 ml-1">({order.stopTime})</span>}
                                                            </div>
                                                        </td>
                                                        <td className="hidden xl:table-cell p-2 sm:px-2 text-gray-300 font-mono text-xs whitespace-nowrap">
                                                            {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : '—'}
                                                        </td>
                                                        <td className="hidden md:table-cell p-2 sm:px-2 text-gray-300 text-xs whitespace-nowrap max-w-[100px] truncate">
                                                            {getOrderResponsibleDisplay(order)}
                                                        </td>
                                                        <td className="p-2 sm:px-2 text-right font-mono font-bold text-seguranca-lightgray text-xs whitespace-nowrap">
                                                            {(order.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </td>
                                                        <td className="p-2 sm:px-2.5 text-center whitespace-nowrap sticky right-0 bg-white dark:bg-[#16181f] text-slate-800 dark:text-gray-200 z-20 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] dark:shadow-[-6px_0_10px_rgba(0,0,0,0.4)]">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleGeneratePDF(order)}
                                                                    disabled={generatingPdfId === order.id}
                                                                    title="Visualizar e Imprimir OS (PDF)"
                                                                    className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-7 px-2 text-[11px] font-semibold shrink-0"
                                                                >
                                                                    <FileText className="mr-1 h-3 w-3" />
                                                                    Ver
                                                                </Button>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-7 w-7 p-0 shrink-0 text-gray-300">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 z-[10100]">
                                                                        <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsFormOpen(true); }} className="text-gray-200">
                                                                            <Eye className="mr-2 h-4 w-4" /> Visualizar / Editar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleGeneratePDF(order)} className="text-gray-200">
                                                                            <FileText className="mr-2 h-4 w-4" /> Visualizar / Imprimir PDF
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDuplicate(order)}
                                                                            disabled={duplicatingId === order.id}
                                                                            className="text-blue-400"
                                                                        >
                                                                            <ClipboardList className="mr-2 h-4 w-4" />
                                                                            {duplicatingId === order.id ? 'Duplicando...' : 'Duplicar OS'}
                                                                        </DropdownMenuItem>

                                                                        <DropdownMenuItem
                                                                            onClick={async () => {
                                                                                try {
                                                                                    await generateFleetWorkOrderPDFDownload(order, { templateModel: 'MODELO_2' });
                                                                                } catch {
                                                                                    toast({ title: 'Erro ao gerar PDF Modelo 2', variant: 'destructive' });
                                                                                }
                                                                            }}
                                                                            className="text-emerald-300"
                                                                        >
                                                                            <FileText className="mr-2 h-4 w-4" /> Baixar PDF Modelo 2 (Check-List Frota)
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
                                                                                disabled={requestingPurchaseId === order.id}
                                                                                className="text-yellow-400"
                                                                            >
                                                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                                                {requestingPurchaseId === order.id ? 'Solicitando...' : 'Solicitar Compra ao Almoxarifado'}
                                                                            </DropdownMenuItem>
                                                                        )}

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
                                                                                onClick={() => handleOpenCancelModal([order.id])}
                                                                                className="text-amber-400 font-medium"
                                                                            >
                                                                                <AlertTriangle className="mr-2 h-4 w-4" /> Cancelar OS
                                                                            </DropdownMenuItem>
                                                                        )}

                                                                        <DropdownMenuItem
                                                                            onClick={() => handleOpenDeleteModal([order.id])}
                                                                            className="text-red-400 hover:text-red-300 font-semibold"
                                                                        >
                                                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir OS
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {filteredOrders.length === 0 && (
                                            <div className="p-12 text-center">
                                                <CircleDashed className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                                <p className="text-gray-400">Nenhuma Ordem de Serviço encontrada para os filtros selecionados.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Barra Flutuante de Ações em Massa */}
                        {selectedOrderIds.length > 0 && (
                            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10050] bg-gray-900/95 border border-seguranca-yellow/60 backdrop-blur-md rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4 text-xs animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <span className="bg-seguranca-yellow text-black font-bold px-2 py-0.5 rounded-full text-xs">
                                        {selectedOrderIds.length}
                                    </span>
                                    <span>OS selecionada{selectedOrderIds.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="h-4 w-px bg-gray-700" />
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleOpenCancelModal(selectedOrderIds)}
                                        className="h-8 border-amber-500/60 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-1.5"
                                    >
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Cancelar Selecionadas
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleOpenDeleteModal(selectedOrderIds)}
                                        className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold gap-1.5"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Excluir Selecionadas
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setSelectedOrderIds([])}
                                        className="h-8 text-gray-400 hover:text-white hover:bg-gray-800 text-xs gap-1"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                        Desmarcar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <FleetWorkOrderForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setSelectedOrder(undefined);
                    setPrefillOrderValues(undefined);
                    queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
                    setTimeout(() => {
                        if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                            document.body.style.pointerEvents = '';
                            document.body.style.overflow = '';
                        }
                    }, 50);
                }}
                onSuccess={() => {
                    setIsFormOpen(false);
                    setSelectedOrder(undefined);
                    setPrefillOrderValues(undefined);
                    queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
                    setTimeout(() => {
                        if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                            document.body.style.pointerEvents = '';
                            document.body.style.overflow = '';
                        }
                    }, 50);
                }}
                order={selectedOrder}
                initialValues={prefillOrderValues}
            />

            <DueComponentsAlertModal
                open={dueModalOpen}
                onOpenChange={setDueModalOpen}
                alerts={compDashboard?.expiringAlerts || []}
                thresholdKm={compDashboard?.config?.alertThresholdKm}
                onOpenWorkOrder={(row: FleetComponentControlRow) =>
                    handleOpenOsFromComponent(buildWorkOrderPrefillFromComponentRow(row))
                }
                onOpenMultipleWorkOrders={(rows: FleetComponentControlRow[]) =>
                    handleOpenOsFromComponent(buildWorkOrderPrefillFromMultipleComponentRows(rows))
                }
                onGoToAlertsTab={() => {
                    setView('alertas');
                    setSearchParams({ tab: 'alertas' });
                }}
            />

            <FleetWorkOrderViewModal
                isOpen={isPdfModalOpen}
                onClose={() => {
                    setIsPdfModalOpen(false);
                    setViewingPdfOrder(null);
                    setTimeout(() => {
                        if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                            document.body.style.pointerEvents = '';
                            document.body.style.overflow = '';
                        }
                    }, 50);
                }}
                order={viewingPdfOrder}
            />

            {/* Modal Interativo e Centralizado de Solicitação ao Almoxarifado */}
            <FleetWorkOrderPurchaseModal
                isOpen={isPurchaseModalOpen}
                onClose={() => {
                    setIsPurchaseModalOpen(false);
                    setPurchaseModalOrder(null);
                    setTimeout(() => {
                        if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) {
                            document.body.style.pointerEvents = '';
                            document.body.style.overflow = '';
                        }
                    }, 50);
                }}
                order={purchaseModalOrder}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
                }}
            />

            {/* Modal de Confirmação de Duplicação */}
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

            {/* Modal de Cancelamento (individual ou em lote) */}
            <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
                <DialogContent className="max-w-md w-[92vw] sm:w-full bg-[#0d0e12] border-gray-800 text-gray-100 shadow-2xl rounded-2xl p-5 z-[10155]">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white">
                                    Cancelar {cancelModalIds.length > 1 ? `${cancelModalIds.length} Ordens de Serviço` : 'Ordem de Serviço'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-400">
                                    O status será alterado para <strong className="text-amber-400">Cancelada</strong>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-3 space-y-3">
                        <p className="text-xs text-gray-300">
                            {cancelModalIds.length > 1
                                ? `Deseja cancelar as ${cancelModalIds.length} ordens de serviço selecionadas? Esta ação pode ser revertida alterando o status novamente.`
                                : 'Deseja cancelar esta ordem de serviço? Esta ação pode ser revertida alterando o status novamente.'}
                        </p>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-400 font-medium">Motivo do cancelamento (opcional)</label>
                            <Input
                                placeholder="Ex: Peça não disponível, serviço adiado..."
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                className="bg-gray-900 border-gray-700 text-sm h-9 placeholder:text-gray-600"
                                disabled={isCancelling}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCancelModalOpen(false)}
                            disabled={isCancelling}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                        >
                            Voltar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmCancel}
                            disabled={isCancelling}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5"
                        >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Exclusão (individual ou em lote) */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md w-[92vw] sm:w-full bg-[#0d0e12] border-gray-800 text-gray-100 shadow-2xl rounded-2xl p-5 z-[10155]">
                    <DialogHeader className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
                                <Trash2 className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold text-white">
                                    Excluir {deleteModalIds.length > 1 ? `${deleteModalIds.length} Ordens de Serviço` : 'Ordem de Serviço'}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-400">
                                    A OS será inativada (soft-delete) e não aparecerá mais na listagem
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="py-3 space-y-2">
                        <p className="text-xs text-gray-300">
                            {deleteModalIds.length > 1
                                ? `Deseja excluir as ${deleteModalIds.length} ordens de serviço selecionadas?`
                                : 'Deseja excluir esta ordem de serviço?'}
                        </p>
                        <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-3">
                            <p className="text-xs text-red-300 font-medium">⚠️ Atenção (RN10):</p>
                            <p className="text-xs text-red-200/80 mt-0.5">
                                OSs com status <strong>Concluída</strong> não podem ser excluídas. Essas serão preservadas automaticamente.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-800">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                            className="border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                        >
                            Voltar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs gap-1.5"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </StandardLayout >
    );
};

export default FleetWorkOrdersPage;
