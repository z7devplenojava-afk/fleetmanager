'use client';

import React, { useState } from 'react';
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
    Package
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import fleetWorkOrderService, {
    WorkOrderStatus,
    WorkOrderItemType,
    FleetWorkOrder,
    MaintenanceType
} from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
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

const FleetWorkOrdersPage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['fleet-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll()
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

    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

    const handleGeneratePDF = async (order: FleetWorkOrder) => {
        try {
            const blob = await generateFleetWorkOrderPDFBlob(order);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao gerar PDF da O.S.', variant: 'destructive' });
        }
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

    const [requestingPurchaseId, setRequestingPurchaseId] = useState<string | null>(null);

    const handleRequestPurchase = async (order: FleetWorkOrder) => {
        const parts = (order.items || []).filter(i => (i.type ?? WorkOrderItemType.PART) === WorkOrderItemType.PART);
        const total = parts.reduce((s, i) => s + (i.totalPrice || 0), 0);
        const ok = window.confirm(
            `Enviar solicitação de compra ao almoxarifado?\n\n` +
            `Peças da O.S. ${order.osNumber || '#' + order.id.slice(0, 8)}: ${parts.length}\n` +
            `Valor estimado: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n\n` +
            `O almoxarifado receberá a solicitação e fará as cotações.`
        );
        if (!ok) return;
        setRequestingPurchaseId(order.id);
        try {
            const created = await fleetWorkOrderService.requestPurchase(order.id);
            toast({
                title: 'Solicitação enviada',
                description: `Compra solicitada ao almoxarifado: ${created.requestNumber || ''} — aguardando cotações.`
            });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            const msg = error?.response?.data?.error;
            toast({
                title: 'Erro',
                description: msg || 'Falha ao solicitar compra ao almoxarifado.',
                variant: 'destructive'
            });
        } finally {
            setRequestingPurchaseId(null);
        }
    };

    // Gap 5 — Duplicar OS (PRD §25)
    const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
    const handleDuplicate = async (order: FleetWorkOrder) => {
        const ok = window.confirm(`Duplicar a OS ${order.osNumber || '#' + order.id.slice(0, 8)}?\nUma nova OS será criada com os mesmos dados e status ABERTA.`);
        if (!ok) return;
        setDuplicatingId(order.id);
        try {
            await fleetWorkOrderService.duplicate(order.id);
            toast({ title: 'OS Duplicada', description: `Nova OS criada a partir de ${order.osNumber || order.id.slice(0, 8)}.` });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'Falha ao duplicar OS.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        } finally {
            setDuplicatingId(null);
        }
    };

    // Cards / Resumo conforme PRD Seção 23
    const stats = {
        total: orders.length,
        open: orders.filter(o => o.status === WorkOrderStatus.OPEN || o.status === WorkOrderStatus.DRAFT).length,
        inProgress: orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length,
        waitingParts: orders.filter(o => o.status === WorkOrderStatus.WAITING_PARTS).length,
        completed: orders.filter(o => o.status === WorkOrderStatus.COMPLETED).length,
    };

    const filteredOrders = orders.filter(o => {
        if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
        if (typeFilter !== 'ALL' && o.maintenanceType !== typeFilter) return false;
        // Gap 4 — Filtro por data de parada (PRD §24)
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
        <StandardLayout title="Gestão de Ordem de Serviço">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-2">
                            <ClipboardList className="h-8 w-8 text-seguranca-yellow" />
                            Ordens de Serviço de Manutenção
                        </h1>
                        <p className="text-gray-400">Controle completo de manutenção corretiva e preventiva de equipamentos e veículos.</p>
                    </div>
                    <Button
                        onClick={() => { setSelectedOrder(undefined); setIsFormOpen(true); }}
                        className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-bold"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nova Ordem de Serviço
                    </Button>
                </div>

                {/* Cards/Resumo conforme PRD Seção 23 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

                    <Card className="bg-seguranca-graphite border-gray-600">
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
                                        {filteredOrders.map(order => (
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
                                                            <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600">
                                                                <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsFormOpen(true); }} className="text-gray-200">
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

                                                                <DropdownMenuItem
                                                                    onClick={() => handleGeneratePDF(order)}
                                                                    className="text-gray-200"
                                                                >
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
                                                                        onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.CANCELLED)}
                                                                        className="text-red-500"
                                                                    >
                                                                        <AlertTriangle className="mr-2 h-4 w-4" /> Cancelar OS
                                                                    </DropdownMenuItem>
                                                                )}
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
            </div>

            <FleetWorkOrderForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => { setIsFormOpen(false); queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] }); }}
                order={selectedOrder}
            />
        </StandardLayout>
    );
};

export default FleetWorkOrdersPage;
