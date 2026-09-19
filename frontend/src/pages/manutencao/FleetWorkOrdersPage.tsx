'use client';

import React, { useState, useMemo } from 'react';
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
    ArrowDown
} from 'lucide-react';
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
    MaintenanceType
} from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';
import { FleetWorkOrderViewModal } from '@/components/frota/FleetWorkOrderViewModal';
import { FleetWorkOrderPurchaseModal } from '@/components/frota/FleetWorkOrderPurchaseModal';
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
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<FleetWorkOrder | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');
    const [typeFilter, setTypeFilter] = useState<MaintenanceType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [garageFilter, setGarageFilter] = useState<string>('ALL');
    const [sortField, setSortField] = useState<string>('osNumber');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const { data: garages = [] } = useQuery({
        queryKey: ['garages-for-os-filter'],
        queryFn: () => garageService.list(),
        staleTime: 60_000,
    });

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
            const mech = (o.mechanicName || '').toLowerCase();
            if (!osNum.includes(term) && !plate.includes(term) && !model.includes(term) && !mech.includes(term)) {
                return false;
            }
        }
        return true;
    });

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
                    aVal = a.mechanicName || '';
                    bVal = b.mechanicName || '';
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
    }, [filteredOrders, sortField, sortDir]);

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
                            <Select value={garageFilter} onValueChange={setGarageFilter}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs h-9 w-44">
                                    <SelectValue placeholder="Garagem" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600 z-[10060]">
                                    <SelectItem value="ALL">Todas as garagens</SelectItem>
                                    {garages.filter(g => g.active !== false).map(g => (
                                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                            <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('client')}>
                                                <span className="flex items-center">Cliente / Obra <SortIcon field="client" /></span>
                                            </th>
                                            <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('stopDate')}>
                                                <span className="flex items-center">Data Parada <SortIcon field="stopDate" /></span>
                                            </th>
                                            <th className="p-4 cursor-pointer hover:text-white transition-colors select-none" onClick={() => handleSort('odometerIn')}>
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
                                        {sortedOrders.map(order => (
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
                                                    {formatDisplayDate(order.stopDate)}
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
                                                            title="Visualizar e Imprimir OS"
                                                            className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 px-2.5 text-xs font-semibold"
                                                        >
                                                            <FileText className="mr-1 h-3.5 w-3.5" />
                                                            Visualizar OS
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

            <FleetWorkOrderViewModal
                isOpen={isPdfModalOpen}
                onClose={() => {
                    setIsPdfModalOpen(false);
                    setViewingPdfOrder(null);
                }}
                order={viewingPdfOrder}
            />

            {/* Modal Interativo e Centralizado de Solicitação ao Almoxarifado */}
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
        </StandardLayout>
    );
};

export default FleetWorkOrdersPage;
