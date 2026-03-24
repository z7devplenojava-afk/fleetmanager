'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    Hammer,
    CircleDashed,
    TrendingUp,
    DollarSign,
    Car
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import fleetWorkOrderService, {
    WorkOrderStatus,
    FleetWorkOrder
} from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import { useToast } from '@/hooks/use-toast';

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string, color: string, icon: any }> = {
    [WorkOrderStatus.DRAFT]: { label: 'Rascunho', color: 'bg-gray-500', icon: CircleDashed },
    [WorkOrderStatus.PENDING_APPROVAL]: { label: 'Pendente Aprovação', color: 'bg-yellow-500 text-black', icon: AlertTriangle },
    [WorkOrderStatus.APPROVED]: { label: 'Aprovado', color: 'bg-blue-500', icon: CheckCircle2 },
    [WorkOrderStatus.IN_PROGRESS]: { label: 'Em Execução', color: 'bg-orange-500', icon: Hammer },
    [WorkOrderStatus.COMPLETED]: { label: 'Concluído', color: 'bg-green-500', icon: CheckCircle2 },
    [WorkOrderStatus.CANCELLED]: { label: 'Cancelado', color: 'bg-red-500', icon: AlertTriangle },
};

const FleetWorkOrdersPage: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ['fleet-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll()
    });

    const handleUpdateStatus = async (id: string, status: WorkOrderStatus) => {
        try {
            await fleetWorkOrderService.updateStatus(id, status);
            toast({ title: 'Sucesso', description: `Status atualizado para ${STATUS_CONFIG[status].label}` });
            queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
        } catch (error) {
            toast({ title: 'Erro', description: 'Falha ao atualizar status.', variant: 'destructive' });
        }
    };

    const stats = {
        pendingApproval: orders.filter(o => o.status === WorkOrderStatus.PENDING_APPROVAL).length,
        inProgress: orders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length,
        totalCost: orders.reduce((sum, o) => sum + (o.totalCost || 0), 0)
    };

    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    return (
        <StandardLayout title="Gestão de O.S. de Frota">
            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-seguranca-lightgray flex items-center gap-2">
                            <ClipboardList className="h-8 w-8 text-seguranca-yellow" />
                            Ordens de Serviço de Frota
                        </h1>
                        <p className="text-gray-400">Controle de manutenção técnica e fluxo de aprovação de custos.</p>
                    </div>
                    <Button
                        onClick={() => { setSelectedOrder(undefined); setIsFormOpen(true); }}
                        className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nova O.S.
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-seguranca-graphite border-l-4 border-l-yellow-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Aguardando Aprovação</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.pendingApproval}</p>
                                </div>
                                <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-orange-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Em Execução (Oficina)</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">{stats.inProgress}</p>
                                </div>
                                <Hammer className="h-8 w-8 text-orange-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-seguranca-graphite border-l-4 border-l-green-500">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Custo Total (Mês)</p>
                                    <p className="text-2xl font-bold text-seguranca-lightgray">
                                        {stats.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Content */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Button
                            variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setStatusFilter('ALL')}
                            size="sm"
                        >
                            Todas
                        </Button>
                        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'default' : 'outline'}
                                onClick={() => setStatusFilter(status as WorkOrderStatus)}
                                size="sm"
                                className={statusFilter === status ? config.color : 'text-gray-400'}
                            >
                                <config.icon className="mr-2 h-4 w-4" />
                                {config.label}
                            </Button>
                        ))}
                    </div>

                    <Card className="bg-seguranca-graphite border-gray-600">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-seguranca-black/50 text-gray-400 uppercase text-xs">
                                        <tr>
                                            <th className="p-4">OS # / Veículo</th>
                                            <th className="p-4">Tipo M.O.</th>
                                            <th className="p-4">Data Planejada</th>
                                            <th className="p-4 text-right">Custo Total</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-seguranca-black/30 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-seguranca-lightgray">#{order.id.split('-')[0]}</div>
                                                    <div className="text-gray-400 flex items-center gap-1">
                                                        <Car className="h-3 w-3" /> {order.vehiclePlate || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="outline" className="border-gray-500 text-gray-400">
                                                        {order.laborType === 'INTERNAL' ? 'Oficina Interna' : 'Externo'}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-gray-300">
                                                    {new Date(order.plannedDate).toLocaleDateString('pt-BR')}
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-seguranca-lightgray">
                                                    {order.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </td>
                                                <td className="p-4">
                                                    <Badge className={`${STATUS_CONFIG[order.status].color} border-none`}>
                                                        {STATUS_CONFIG[order.status].label}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600">
                                                            <DropdownMenuItem onClick={() => { setSelectedOrder(order); setIsFormOpen(true); }} className="text-gray-200">
                                                                <Eye className="mr-2 h-4 w-4" /> Detalhes / Editar
                                                            </DropdownMenuItem>

                                                            {order.status === WorkOrderStatus.PENDING_APPROVAL && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.APPROVED)}
                                                                    className="text-green-500"
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar Custos
                                                                </DropdownMenuItem>
                                                            )}

                                                            {order.status === WorkOrderStatus.APPROVED && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.IN_PROGRESS)}
                                                                >
                                                                    <Hammer className="mr-2 h-4 w-4" /> Iniciar Manutenção
                                                                </DropdownMenuItem>
                                                            )}

                                                            {order.status === WorkOrderStatus.IN_PROGRESS && (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.COMPLETED)}
                                                                    className="text-green-500 font-bold"
                                                                >
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar & Liberar
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuItem
                                                                onClick={() => handleUpdateStatus(order.id, WorkOrderStatus.CANCELLED)}
                                                                className="text-red-500"
                                                            >
                                                                <AlertTriangle className="mr-2 h-4 w-4" /> Cancelar OS
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredOrders.length === 0 && (
                                    <div className="p-12 text-center">
                                        <CircleDashed className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                                        <p className="text-gray-400">Nenhuma Ordem de Serviço encontrada para este filtro.</p>
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
