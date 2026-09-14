import React, { useState } from 'react';
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
    Eye
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import fleetWorkOrderService, {
    WorkOrderStatus,
    FleetWorkOrder,
    MaintenanceType
} from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    generateFleetWorkOrderPDFBlob
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

const ManutencaoDashboard: React.FC = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

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

    const handleGeneratePDF = async (order: FleetWorkOrder) => {
        setGeneratingPdfId(order.id);
        try {
            const blob = await generateFleetWorkOrderPDFBlob(order);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao gerar PDF da O.S.', variant: 'destructive' });
        } finally {
            setGeneratingPdfId(null);
        }
    };

    const handleDuplicate = async (order: FleetWorkOrder) => {
        const ok = window.confirm(`Duplicar a OS ${order.osNumber || '#' + order.id.slice(0, 8)}?\nUma nova OS será criada com os mesmos dados.`);
        if (!ok) return;
        try {
            await fleetWorkOrderService.duplicate(order.id);
            toast({ title: 'OS Duplicada', description: `Nova OS criada com sucesso.` });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            toast({ title: 'Erro', description: 'Falha ao duplicar OS.', variant: 'destructive' });
        }
    };

    if (recordsLoading && orders.length === 0) {
        return <LoadingSpinner />;
    }

    const scheduled = orders.filter(o => o.status === WorkOrderStatus.OPEN || o.status === WorkOrderStatus.DRAFT).length;
    const inProgress = orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length;
    const waitingParts = orders.filter(o => o.status === WorkOrderStatus.WAITING_PARTS).length;
    const completed = orders.filter(o => o.status === WorkOrderStatus.COMPLETED).length;
    const totalCost = orders.reduce((acc, o) => acc + (o.totalCost || 0), 0);

    const filteredOrders = orders.filter(o => {
        if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
        if (typeFilter !== 'ALL' && o.maintenanceType !== typeFilter) return false;
        if (dateFrom && o.stopDate && o.stopDate < dateFrom) return false;
        if (dateTo && o.stopDate && o.stopDate > dateTo) return false;
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const osNum = (o.osNumber || '').toLowerCase();
            const plate = (o.vehiclePlate || '').toLowerCase();
            const model = (o.vehicleModel || '').toLowerCase();
            const mech = (o.mechanicName || '').toLowerCase();
            if (!osNum.includes(term) && !plate.includes(term) && !model.includes(term) && !mech.includes(term)) {
                return false;
            }
        }
        return true;
    });

    return (
        <StandardLayout title="Gestão de Manutenção" subtitle="Controle e agendamento de manutenções e ordens de serviço da frota">
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

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetchOrders()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${recordsLoading ? 'animate-spin' : ''}`} />
                            Atualizar
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-seguranca-graphite p-3 rounded-lg border border-gray-700">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative w-full sm:w-60">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Pesquisar por OS, placa, modelo..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 bg-seguranca-black border-gray-600 text-sm h-9"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-seguranca-black border-gray-600 text-xs h-9 w-32 text-gray-300"
                                title="Data inicial"
                            />
                            <span className="text-gray-500 text-xs">até</span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-seguranca-black border-gray-600 text-xs h-9 w-32 text-gray-300"
                                title="Data final"
                            />
                        </div>
                        <Button
                            variant={typeFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setTypeFilter('ALL')}
                            size="sm"
                            className="h-9 text-xs"
                        >
                            Todos Tipos
                        </Button>
                        <Button
                            variant={typeFilter === MaintenanceType.CORRETIVA ? 'default' : 'outline'}
                            onClick={() => setTypeFilter(MaintenanceType.CORRETIVA)}
                            size="sm"
                            className="h-9 text-xs border-orange-600/40 text-orange-400"
                        >
                            🔧 Corretiva
                        </Button>
                        <Button
                            variant={typeFilter === MaintenanceType.PREVENTIVA ? 'default' : 'outline'}
                            onClick={() => setTypeFilter(MaintenanceType.PREVENTIVA)}
                            size="sm"
                            className="h-9 text-xs border-green-600/40 text-green-400"
                        >
                            📋 Preventiva
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                        <Button
                            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('ALL')}
                            size="sm"
                            className="h-8 text-xs"
                        >
                            Todos Status
                        </Button>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                onClick={() => setStatusFilter(status as WorkOrderStatus)}
                                size="sm"
                                className={`h-8 text-xs ${statusFilter === status ? config.color : 'text-gray-400'}`}
                            >
                                {config.label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden">
                    <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20 pb-3 pt-3">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                            <ClipboardList className="mr-2 text-seguranca-yellow" size={20} />
                            Ordens de Serviço e Manutenções da Frota
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-seguranca-black/50 text-gray-400 uppercase text-xs">
                                    <tr>
                                        <th className="p-4">Nº OS</th>
                                        <th className="p-4">Tipo</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Equipamento / Placa</th>
                                        <th className="p-4">Cliente / Obra</th>
                                        <th className="p-4">Data Parada</th>
                                        <th className="p-4">KM Parada</th>
                                        <th className="p-4">Responsável</th>
                                        <th className="p-4 text-right">Custo Total</th>
                                        <th className="p-4 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-gray-400">
                                                Nenhuma ordem de serviço encontrada com os filtros selecionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
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
                                                    <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-xs`}>
                                                        {STATUS_CONFIG[order.status]?.label || order.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-gray-200">{order.vehiclePlate || 'N/A'}</div>
                                                    <div className="text-xs text-gray-400">{order.vehicleModel}</div>
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    <div className="font-medium text-gray-200">{order.clientName || '—'}</div>
                                                    {order.workPostName && <div className="text-xs text-gray-400">{order.workPostName}</div>}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {order.stopDate ? new Date(order.stopDate + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                                                    {order.stopTime && <span className="text-xs text-gray-500 ml-1">({order.stopTime})</span>}
                                                </td>
                                                <td className="p-4 text-gray-300 font-mono">
                                                    {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : '—'}
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {order.mechanicName || 'Não atribuído'}
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
                                                            title="Imprimir PDF da OS"
                                                            className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 px-2 text-xs"
                                                        >
                                                            <FileText className="mr-1 h-3.5 w-3.5" />
                                                            PDF
                                                        </Button>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 text-gray-200">
                                                                <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsFormModalOpen(true); }}>
                                                                    <Eye className="mr-2 h-4 w-4" /> Visualizar / Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleDuplicate(order)}>
                                                                    <Wrench className="mr-2 h-4 w-4" /> Duplicar OS
                                                                </DropdownMenuItem>
                                                                {Object.entries(STATUS_CONFIG).map(([stKey, stCfg]) => (
                                                                    stKey !== order.status && (
                                                                        <DropdownMenuItem
                                                                            key={stKey}
                                                                            onClick={() => handleUpdateStatus(order.id, stKey as WorkOrderStatus)}
                                                                        >
                                                                            Mudar para {stCfg.label}
                                                                        </DropdownMenuItem>
                                                                    )
                                                                ))}
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

            <FleetWorkOrderForm
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setSelectedOrder(undefined);
                }}
                onSuccess={handleSuccess}
                order={selectedOrder}
            />
        </StandardLayout>
    );
};

export default ManutencaoDashboard;

