import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    User,
    Car,
    Route as RouteIcon,
    Calendar as CalendarIcon,
    RefreshCw,
    History,
    SquarePen,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { scheduleService, Schedule, CreateScheduleDTO, ScheduleStatus, Shift } from '@/services/scheduleService';
import employeeService from '@/services/employeeService';
import { routeService } from '@/services/routeService';
import fleetService from '@/services/fleetService';

interface Employee {
    id: string;
    name: string;
}

interface Route {
    id: string;
    name: string;
}

interface Vehicle {
    id: string;
    plate: string;
    model?: string;
}

const TransportAssignments: React.FC = () => {
    const { toast } = useToast();
    const [assignments, setAssignments] = useState<Schedule[]>([]);
    const [filteredAssignments, setFilteredAssignments] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [selectedAssignment, setSelectedAssignment] = useState<Schedule | null>(null);

    // Dropdown data
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmployee, setFilterEmployee] = useState<string>('all');
    const [filterRoute, setFilterRoute] = useState<string>('all');
    const [filterVehicle, setFilterVehicle] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<ScheduleStatus | 'all'>('all');
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    // Form data
    const [formData, setFormData] = useState({
        employeeId: '',
        routeId: '',
        vehicleId: '',
        scheduleDate: new Date(),
        shift: 'DAY' as Shift,
        status: 'PENDING' as ScheduleStatus,
        observations: '',
    });

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    // Apply filters
    useEffect(() => {
        applyFilters();
    }, [assignments, searchTerm, filterEmployee, filterRoute, filterVehicle, filterStatus, dateFrom, dateTo]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load assignments
            try {
                const schedulesData = await scheduleService.findAll();
                setAssignments(schedulesData || []);
            } catch (err) {
                console.error('Error loading schedules:', err);
                setAssignments([]);
            }

            // Load employees
            try {
                const employeesData = await employeeService.getAllEmployees();
                const employeesList = Array.isArray(employeesData) ? employeesData : employeesData?.content || [];
                setEmployees(employeesList.map((e: any) => ({ id: e.id, name: e.name || e.nome })));
            } catch (err) {
                console.error('Error loading employees:', err);
                setEmployees([]);
                toast({
                    title: 'Aviso',
                    description: 'Não foi possível carregar motoristas',
                    variant: 'destructive',
                });
            }

            // Load routes
            try {
                const routesData = await routeService.findAllRoutes();
                setRoutes(Array.isArray(routesData) ? routesData.map((r: any) => ({ id: r.id, name: r.name })) : []);
            } catch (err) {
                console.error('Error loading routes:', err);
                setRoutes([]);
                toast({
                    title: 'Aviso',
                    description: 'Não foi possível carregar rotas',
                    variant: 'destructive',
                });
            }

            // Load vehicles
            try {
                const vehiclesData = await fleetService.getVehicles();
                setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
            } catch (err) {
                console.error('Error loading vehicles:', err);
                setVehicles([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...assignments];

        // Search term
        if (searchTerm) {
            filtered = filtered.filter(a =>
                a.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.route?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.vehicle?.plate?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Employee filter
        if (filterEmployee !== 'all') {
            filtered = filtered.filter(a => a.employee?.id === filterEmployee);
        }

        // Route filter
        if (filterRoute !== 'all') {
            filtered = filtered.filter(a => a.route?.id === filterRoute);
        }

        // Vehicle filter
        if (filterVehicle !== 'all') {
            filtered = filtered.filter(a => a.vehicle?.id === filterVehicle);
        }

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === filterStatus);
        }

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(a => new Date(a.scheduleDate) >= dateFrom);
        }
        if (dateTo) {
            filtered = filtered.filter(a => new Date(a.scheduleDate) <= dateTo);
        }

        setFilteredAssignments(filtered);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setFilterEmployee('all');
        setFilterRoute('all');
        setFilterVehicle('all');
        setFilterStatus('all');
        setDateFrom(undefined);
        setDateTo(undefined);
    };

    const handleCreate = () => {
        setModalMode('create');
        setSelectedAssignment(null);
        setFormData({
            employeeId: '',
            routeId: '',
            vehicleId: '',
            scheduleDate: new Date(),
            shift: 'DAY',
            status: 'PENDING',
            observations: '',
        });
        setModalOpen(true);
    };

    const handleEdit = (assignment: Schedule) => {
        setModalMode('edit');
        setSelectedAssignment(assignment);
        setFormData({
            employeeId: assignment.employee?.id || '',
            routeId: assignment.route?.id || '',
            vehicleId: assignment.vehicle?.id || '',
            scheduleDate: new Date(assignment.scheduleDate),
            shift: assignment.shift,
            status: assignment.status,
            observations: assignment.observations || '',
        });
        setModalOpen(true);
    };

    const handleView = (assignment: Schedule) => {
        setModalMode('view');
        setSelectedAssignment(assignment);
        setModalOpen(true);
    };

    const handleDelete = async (assignment: Schedule) => {
        if (!confirm('Tem certeza que deseja excluir esta atribuição?')) return;

        try {
            await scheduleService.delete(assignment.id);
            toast({
                title: 'Sucesso',
                description: 'Atribuição excluída com sucesso',
            });
            loadData();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao excluir atribuição',
                variant: 'destructive',
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.employeeId || !formData.routeId) {
            toast({
                title: 'Erro de Validação',
                description: 'Motorista e Rota são obrigatórios',
                variant: 'destructive',
            });
            return;
        }

        try {
            const data: CreateScheduleDTO = {
                employeeId: formData.employeeId,
                locationId: formData.routeId, // Using route as location for now
                scheduleDate: format(formData.scheduleDate, 'yyyy-MM-dd'),
                shift: formData.shift,
                status: formData.status,
                observations: formData.observations,
                routeId: formData.routeId,
                vehicleId: formData.vehicleId || undefined,
            };

            if (modalMode === 'create') {
                await scheduleService.create(data);
                toast({
                    title: 'Sucesso',
                    description: 'Atribuição criada com sucesso',
                });
            } else if (modalMode === 'edit' && selectedAssignment) {
                await scheduleService.update(selectedAssignment.id, data);
                toast({
                    title: 'Sucesso',
                    description: 'Atribuição atualizada com sucesso',
                });
            }

            setModalOpen(false);
            loadData();
        } catch (error) {
            toast({
                title: 'Erro',
                description: 'Erro ao salvar atribuição',
                variant: 'destructive',
            });
        }
    };

    const getStatusBadge = (status: ScheduleStatus) => {
        const config = {
            PENDING: { label: 'ACTIVE', className: 'bg-red-500/20 text-red-500 border-red-500/30 font-bold px-3 py-1 rounded-full text-[10px]' },
            CONFIRMED: { label: 'ACTIVE', className: 'bg-red-500/20 text-red-500 border-red-500/30 font-bold px-3 py-1 rounded-full text-[10px]' },
            COMPLETED: { label: 'COMPLETED', className: 'bg-gray-800 text-gray-400 border-gray-700 font-bold px-3 py-1 rounded-full text-[10px]' },
            CANCELLED: { label: 'CANCELLED', className: 'bg-gray-800 text-gray-500 border-gray-700 font-bold px-3 py-1 rounded-full text-[10px]' },
        };
        const { label, className } = config[status];
        return <Badge variant="outline" className={className}>{label}</Badge>;
    };

    const getShiftLabel = (shift: Shift) => {
        const labels = { DAY: 'Diurno', NIGHT: 'Noturno', MIXED: 'Misto' };
        return labels[shift] || shift;
    };

    return (
        <StandardLayout
            title="Atribuições de Transportes"
            subtitle="Gestão de alocação de veículos e motoristas"
            actions={
                <Button
                    onClick={handleCreate}
                    className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 font-semibold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Atribuição
                </Button>
            }
        >
            <div className="p-6 space-y-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Atribuições Cadastradas</h2>
                    <p className="text-gray-400 text-sm">Gerencie as atribuições de transporte do sistema</p>
                </div>
                {/* Filters Section */}
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Filter className="w-5 h-5 text-seguranca-yellow" />
                                Filtros
                            </h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetFilters}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Limpar
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {/* Search */}
                            <div className="xl:col-span-2">
                                <Label className="text-gray-400 text-sm">Busca Rápida</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Motorista, Rota, Veículo..."
                                        className="pl-10 bg-seguranca-black border-gray-600 text-gray-200"
                                    />
                                </div>
                            </div>

                            {/* Employee Filter */}
                            <div>
                                <Label className="text-gray-400 text-sm">Motorista</Label>
                                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="all">Todos</SelectItem>
                                        {employees.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Route Filter */}
                            <div>
                                <Label className="text-gray-400 text-sm">Rota</Label>
                                <Select value={filterRoute} onValueChange={setFilterRoute}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="all">Todas</SelectItem>
                                        {routes.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Vehicle Filter */}
                            <div>
                                <Label className="text-gray-400 text-sm">Veículo</Label>
                                <Select value={filterVehicle} onValueChange={setFilterVehicle}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="all">Todos</SelectItem>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <Label className="text-gray-400 text-sm">Status</Label>
                                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                        <SelectItem value="COMPLETED">Concluída</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Table Section */}
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                                Carregando atribuições...
                            </div>
                        ) : filteredAssignments.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <User className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>Nenhuma atribuição encontrada</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-gray-700 hover:bg-transparent px-4">
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Organização</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Motorista</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Veículo</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Rota</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Funcionários</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4">Status</TableHead>
                                        <TableHead className="text-gray-400 font-medium text-xs py-4 text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAssignments.map((assignment) => (
                                        <TableRow key={assignment.id} className="border-gray-700 hover:bg-gray-800/30">
                                            <TableCell className="text-gray-200 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{assignment.route?.name?.split(' ')[0] === 'ROTA' ? assignment.location?.name || 'Moderna Industria e Comercio Ltda' : 'Moderna Industria e Comercio Ltda'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-200 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-white">{assignment.employee?.name || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-200 py-4">
                                                <span className="uppercase">{assignment.vehicle?.plate || 'N/A'}</span>
                                            </TableCell>
                                            <TableCell className="text-gray-200 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider">{assignment.route?.name || 'N/A'}</span>
                                                    <span className="text-[10px] text-gray-500">{assignment.observations || '1350H.kmz'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-200 py-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm">9</span>
                                                    <span className="text-[10px] text-gray-500">funcionário(s)</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {getStatusBadge(assignment.status)}
                                            </TableCell>
                                            <TableCell className="text-right py-4">
                                                <div className="flex items-center justify-end gap-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-white"
                                                        onClick={() => handleEdit(assignment)}
                                                    >
                                                        <SquarePen className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-white"
                                                        onClick={() => handleDelete(assignment)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-gray-400 hover:text-white"
                                                        onClick={() => handleView(assignment)}
                                                    >
                                                        <History className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Modal */}
                <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                    <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-seguranca-yellow text-xl">
                                {modalMode === 'create' ? 'Nova Atribuição' :
                                    modalMode === 'edit' ? 'Editar Atribuição' : 'Detalhes da Atribuição'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-400">
                                {modalMode === 'view'
                                    ? 'Visualize os detalhes da atribuição'
                                    : 'Preencha os dados para atribuir um motorista a uma rota'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-4 py-4">
                            {/* Employee Select */}
                            <div className="col-span-2">
                                <Label className="text-gray-300">Motorista *</Label>
                                <Select
                                    value={formData.employeeId}
                                    onValueChange={(v) => setFormData({ ...formData, employeeId: v })}
                                    disabled={modalMode === 'view'}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Selecione o motorista" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        {employees.map(e => (
                                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Route Select */}
                            <div className="col-span-2">
                                <Label className="text-gray-300">Rota *</Label>
                                <Select
                                    value={formData.routeId}
                                    onValueChange={(v) => setFormData({ ...formData, routeId: v })}
                                    disabled={modalMode === 'view'}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Selecione a rota" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        {routes.map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Vehicle Select */}
                            <div className="col-span-2">
                                <Label className="text-gray-300">Veículo</Label>
                                <Select
                                    value={formData.vehicleId || 'none'}
                                    onValueChange={(v) => setFormData({ ...formData, vehicleId: v === 'none' ? '' : v })}
                                    disabled={modalMode === 'view'}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue placeholder="Selecione o veículo (opcional)" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.plate} - {v.model || 'N/A'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Date */}
                            <div>
                                <Label className="text-gray-300">Data *</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left bg-seguranca-black border-gray-600"
                                            disabled={modalMode === 'view'}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(formData.scheduleDate, 'dd/MM/yyyy', { locale: ptBR })}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-seguranca-graphite border-gray-700">
                                        <Calendar
                                            mode="single"
                                            selected={formData.scheduleDate}
                                            onSelect={(date) => date && setFormData({ ...formData, scheduleDate: date })}
                                            locale={ptBR}
                                            className="bg-seguranca-graphite"
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Shift */}
                            <div>
                                <Label className="text-gray-300">Turno *</Label>
                                <Select
                                    value={formData.shift}
                                    onValueChange={(v) => setFormData({ ...formData, shift: v as Shift })}
                                    disabled={modalMode === 'view'}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="DAY">Diurno</SelectItem>
                                        <SelectItem value="NIGHT">Noturno</SelectItem>
                                        <SelectItem value="MIXED">Misto</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status */}
                            <div className="col-span-2">
                                <Label className="text-gray-300">Status *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(v) => setFormData({ ...formData, status: v as ScheduleStatus })}
                                    disabled={modalMode === 'view'}
                                >
                                    <SelectTrigger className="bg-seguranca-black border-gray-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-seguranca-graphite border-gray-600">
                                        <SelectItem value="PENDING">Pendente</SelectItem>
                                        <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                                        <SelectItem value="COMPLETED">Concluída</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Observations */}
                            <div className="col-span-2">
                                <Label className="text-gray-300">Observações</Label>
                                <Input
                                    value={formData.observations}
                                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                    placeholder="Observações adicionais..."
                                    className="bg-seguranca-black border-gray-600 text-gray-200"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>

                        {modalMode !== 'view' && (
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setModalOpen(false)}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSubmit}
                                    className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                                >
                                    {modalMode === 'create' ? 'Criar Atribuição' : 'Salvar Alterações'}
                                </Button>
                            </DialogFooter>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </StandardLayout>
    );
};

export default TransportAssignments;
