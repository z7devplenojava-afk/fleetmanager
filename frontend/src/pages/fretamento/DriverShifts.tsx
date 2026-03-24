import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Clock,
    Plus,
    Play,
    Square,
    Coffee,
    MapPin,
    Users,
    Route as RouteIcon,
    AlertTriangle,
    CheckCircle2,
    ArrowRightLeft,
    Timer,
    Navigation,
    Loader2,
    Calendar,
    Trash2,
    Eye,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { driverShiftService, DriverShift, ReallocationSuggestion, RouteExecution } from '@/services/driverShiftService';
import driverService from '@/services/driverService';
import { routeService } from '@/services/routeService';

const DriverShifts: React.FC = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('shifts');

    // Data selecionada
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Turnos
    const [shifts, setShifts] = useState<DriverShift[]>([]);

    // Drivers e Rotas para o form
    const [drivers, setDrivers] = useState<Array<{ id: string; name: string }>>([]);
    const [routes, setRoutes] = useState<Array<{ id: string; name: string }>>([]);

    // Modal de criação de turno
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        driverId: '',
        vehicleId: '',
        shiftDate: new Date().toISOString().split('T')[0],
        plannedStartTime: '06:00',
        plannedEndTime: '14:00',
        breakStartTime: '10:00',
        breakEndTime: '10:30',
        observations: '',
    });

    // Modal de atribuição de rota
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignShiftId, setAssignShiftId] = useState('');
    const [assignRouteId, setAssignRouteId] = useState('');
    const [assignStart, setAssignStart] = useState('');
    const [assignEnd, setAssignEnd] = useState('');

    // Modal detalhes
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState<DriverShift | null>(null);

    // Realocação
    const [suggestions, setSuggestions] = useState<ReallocationSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [shiftsData, driversData, routesData] = await Promise.all([
                driverShiftService.findByDate(selectedDate),
                driverService.getDrivers(),
                routeService.findAllRoutes(),
            ]);
            setShifts(Array.isArray(shiftsData) ? shiftsData : []);
            setDrivers(driversData.map(d => ({ id: d.id, name: d.name })));
            setRoutes(routesData.map(r => ({ id: r.id, name: r.name })));
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
            toast({ title: 'Erro', description: 'Erro ao carregar turnos', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [selectedDate, toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
            const data = await driverShiftService.getReallocationSuggestions(selectedDate);
            setSuggestions(data);
        } catch (err) {
            console.error('Erro ao carregar sugestões:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'reallocation') {
            loadSuggestions();
        }
    }, [activeTab, selectedDate]);

    // ========================
    // Ações
    // ========================

    const handleCreateShift = async () => {
        if (!formData.driverId || !formData.plannedStartTime || !formData.plannedEndTime) {
            toast({ title: 'Erro', description: 'Preencha motorista e horários', variant: 'destructive' });
            return;
        }
        try {
            await driverShiftService.create({
                driver: { id: formData.driverId, name: '' },
                shiftDate: formData.shiftDate,
                plannedStartTime: formData.plannedStartTime,
                plannedEndTime: formData.plannedEndTime,
                breakStartTime: formData.breakStartTime || undefined,
                breakEndTime: formData.breakEndTime || undefined,
                observations: formData.observations || undefined,
            } as any);
            toast({ title: 'Sucesso', description: 'Turno criado com sucesso' });
            setShowCreateModal(false);
            loadData();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao criar turno', variant: 'destructive' });
        }
    };

    const handleStartShift = async (id: string) => {
        try {
            await driverShiftService.startShift(id);
            toast({ title: 'Turno iniciado' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao iniciar turno', variant: 'destructive' });
        }
    };

    const handleEndShift = async (id: string) => {
        try {
            await driverShiftService.endShift(id);
            toast({ title: 'Turno finalizado' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao finalizar turno', variant: 'destructive' });
        }
    };

    const handleStartBreak = async (id: string) => {
        try {
            await driverShiftService.startBreak(id);
            toast({ title: 'Pausa iniciada' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const handleEndBreak = async (id: string) => {
        try {
            await driverShiftService.endBreak(id);
            toast({ title: 'Pausa finalizada' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const handleDeleteShift = async (id: string) => {
        try {
            await driverShiftService.delete(id);
            toast({ title: 'Turno excluído' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao excluir turno', variant: 'destructive' });
        }
    };

    const handleAssignRoute = async () => {
        if (!assignShiftId || !assignRouteId) return;
        try {
            await driverShiftService.assignRoute(assignShiftId, assignRouteId, assignStart || undefined, assignEnd || undefined);
            toast({ title: 'Rota atribuída ao turno' });
            setShowAssignModal(false);
            loadData();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro ao atribuir rota', variant: 'destructive' });
        }
    };

    const handleStartExecution = async (executionId: string) => {
        try {
            await driverShiftService.startExecution(executionId);
            toast({ title: 'Rota iniciada' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const handleCompleteExecution = async (executionId: string) => {
        try {
            await driverShiftService.completeExecution(executionId);
            toast({ title: 'Rota concluída' });
            loadData();
        } catch (err) {
            toast({ title: 'Erro', variant: 'destructive' });
        }
    };

    const handleReallocation = async (driverShiftId: string, routeId: string) => {
        try {
            await driverShiftService.executeReallocation(driverShiftId, routeId);
            toast({ title: 'Realocação executada', description: 'Motorista realocado com sucesso para nova rota' });
            loadData();
            loadSuggestions();
        } catch (err) {
            toast({ title: 'Erro', description: 'Erro na realocação', variant: 'destructive' });
        }
    };

    // ========================
    // Helpers de exibição
    // ========================

    const getStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            SCHEDULED: { label: 'Agendado', className: 'bg-blue-600 text-white' },
            IN_PROGRESS: { label: 'Em Serviço', className: 'bg-green-600 text-white' },
            ON_BREAK: { label: 'Em Pausa', className: 'bg-yellow-600 text-white' },
            AVAILABLE: { label: 'Disponível', className: 'bg-emerald-500 text-white animate-pulse' },
            COMPLETED: { label: 'Finalizado', className: 'bg-gray-600 text-white' },
            CANCELLED: { label: 'Cancelado', className: 'bg-red-600 text-white' },
        };
        const c = config[status] || { label: status, className: 'bg-gray-500 text-white' };
        return <Badge className={c.className}>{c.label}</Badge>;
    };

    const getExecutionStatusBadge = (status: string) => {
        const config: Record<string, { label: string; className: string }> = {
            SCHEDULED: { label: 'Agendada', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            IN_PROGRESS: { label: 'Executando', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
            COMPLETED: { label: 'Concluída', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
            CANCELLED: { label: 'Cancelada', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
            DELAYED: { label: 'Atrasada', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
            REASSIGNED: { label: 'Reatribuída', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
        };
        const c = config[status] || { label: status, className: 'bg-gray-500/20 text-gray-400' };
        return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
    };

    const formatHours = (hours?: number) => {
        if (!hours && hours !== 0) return '--';
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h}h${m > 0 ? ` ${m}min` : ''}`;
    };

    // ========================
    // Estatísticas do dia
    // ========================

    const stats = {
        total: shifts.length,
        inProgress: shifts.filter(s => s.status === 'IN_PROGRESS').length,
        available: shifts.filter(s => s.availableForReallocation).length,
        completed: shifts.filter(s => s.status === 'COMPLETED').length,
    };

    return (
        <StandardLayout title="Gestão de Turnos" subtitle="Gerencie turnos, acompanhe execuções e realoque motoristas">
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-7 h-7 text-red-500" />
                        Gestão de Turnos
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie turnos, acompanhe execuções e realoque motoristas</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-seguranca-graphite border-gray-600 text-gray-200 w-44"
                        />
                    </div>
                    <Button
                        onClick={() => {
                            setFormData(prev => ({ ...prev, shiftDate: selectedDate }));
                            setShowCreateModal(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Novo Turno
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20"><Users className="w-5 h-5 text-blue-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{stats.total}</p><p className="text-xs text-gray-400">Turnos Hoje</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20"><Play className="w-5 h-5 text-green-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{stats.inProgress}</p><p className="text-xs text-gray-400">Em Serviço</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20"><ArrowRightLeft className="w-5 h-5 text-emerald-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{stats.available}</p><p className="text-xs text-gray-400">Disponíveis p/ Realocação</p></div>
                    </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-500/20"><CheckCircle2 className="w-5 h-5 text-gray-400" /></div>
                        <div><p className="text-2xl font-bold text-white">{stats.completed}</p><p className="text-xs text-gray-400">Finalizados</p></div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-seguranca-graphite border-gray-700">
                    <TabsTrigger value="shifts" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <Clock className="w-4 h-4 mr-1" /> Turnos do Dia
                    </TabsTrigger>
                    <TabsTrigger value="reallocation" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">
                        <ArrowRightLeft className="w-4 h-4 mr-1" /> Realocação Inteligente
                        {stats.available > 0 && (
                            <Badge className="ml-2 bg-emerald-500 text-white text-xs">{stats.available}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* ======================== */}
                {/* TAB: Turnos do Dia */}
                {/* ======================== */}
                <TabsContent value="shifts" className="mt-4">
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                </div>
                            ) : shifts.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Nenhum turno para esta data</p>
                                    <Button className="mt-3 bg-red-600 hover:bg-red-700" onClick={() => setShowCreateModal(true)}>
                                        <Plus className="w-4 h-4 mr-1" /> Criar Turno
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-gray-700 hover:bg-transparent">
                                            <TableHead className="text-gray-400">Motorista</TableHead>
                                            <TableHead className="text-gray-400">Horário</TableHead>
                                            <TableHead className="text-gray-400">Pausa</TableHead>
                                            <TableHead className="text-gray-400">Horas Totais</TableHead>
                                            <TableHead className="text-gray-400">Usadas</TableHead>
                                            <TableHead className="text-gray-400">Restantes</TableHead>
                                            <TableHead className="text-gray-400">Rotas</TableHead>
                                            <TableHead className="text-gray-400">Status</TableHead>
                                            <TableHead className="text-gray-400 text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shifts.map((shift) => (
                                            <TableRow key={shift.id} className="border-gray-700 hover:bg-gray-800/50">
                                                <TableCell className="text-white font-medium">
                                                    {shift.driver?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-gray-300">
                                                    {shift.plannedStartTime?.substring(0, 5)} - {shift.plannedEndTime?.substring(0, 5)}
                                                </TableCell>
                                                <TableCell className="text-gray-400 text-sm">
                                                    {shift.breakStartTime && shift.breakEndTime
                                                        ? `${shift.breakStartTime.substring(0, 5)} - ${shift.breakEndTime.substring(0, 5)}`
                                                        : '--'
                                                    }
                                                </TableCell>
                                                <TableCell className="text-white font-mono">
                                                    {formatHours(shift.totalShiftHours)}
                                                </TableCell>
                                                <TableCell className="text-yellow-400 font-mono">
                                                    {formatHours(shift.hoursUsed)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`font-mono font-bold ${
                                                        (shift.hoursRemaining || 0) > 1 ? 'text-emerald-400' :
                                                        (shift.hoursRemaining || 0) > 0 ? 'text-yellow-400' : 'text-gray-500'
                                                    }`}>
                                                        {formatHours(shift.hoursRemaining)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                                                        {shift.routeExecutions?.length || 0} rota(s)
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(shift.status)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {shift.status === 'SCHEDULED' && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleStartShift(shift.id)}
                                                                className="text-green-400 hover:text-green-300 hover:bg-green-900/30" title="Iniciar Turno">
                                                                <Play className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {shift.status === 'IN_PROGRESS' && (
                                                            <>
                                                                <Button size="sm" variant="ghost" onClick={() => handleStartBreak(shift.id)}
                                                                    className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/30" title="Iniciar Pausa">
                                                                    <Coffee className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="sm" variant="ghost" onClick={() => handleEndShift(shift.id)}
                                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30" title="Finalizar Turno">
                                                                    <Square className="w-4 h-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        {shift.status === 'ON_BREAK' && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleEndBreak(shift.id)}
                                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30" title="Retornar da Pausa">
                                                                <Play className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        {(shift.status === 'IN_PROGRESS' || shift.status === 'AVAILABLE') && (
                                                            <Button size="sm" variant="ghost"
                                                                onClick={() => {
                                                                    setAssignShiftId(shift.id);
                                                                    setShowAssignModal(true);
                                                                }}
                                                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                                                                title="Atribuir Rota">
                                                                <RouteIcon className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                        <Button size="sm" variant="ghost"
                                                            onClick={() => { setSelectedShift(shift); setShowDetailModal(true); }}
                                                            className="text-gray-400 hover:text-gray-300" title="Detalhes">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {shift.status === 'SCHEDULED' && (
                                                            <Button size="sm" variant="ghost" onClick={() => handleDeleteShift(shift.id)}
                                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30" title="Excluir">
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ======================== */}
                {/* TAB: Realocação Inteligente */}
                {/* ======================== */}
                <TabsContent value="reallocation" className="mt-4">
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
                                Sugestões de Realocação
                            </CardTitle>
                            <p className="text-sm text-gray-400">
                                Motoristas que finalizaram suas rotas, tem horas sobrando e estão próximos a outras rotas disponíveis
                            </p>
                        </CardHeader>
                        <CardContent>
                            {loadingSuggestions ? (
                                <div className="flex items-center justify-center p-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                                    <span className="ml-3 text-gray-400">Analisando disponibilidade...</span>
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Navigation className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="text-lg">Nenhuma sugestão de realocação no momento</p>
                                    <p className="text-sm mt-1">As sugestões aparecem quando motoristas finalizam rotas com horas sobrando</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {suggestions.map((suggestion, idx) => (
                                        <Card key={idx} className="bg-gray-800/50 border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-4 h-4 text-blue-400" />
                                                                <span className="text-white font-medium">{suggestion.driverName}</span>
                                                            </div>
                                                            <span className="text-gray-500">pode executar</span>
                                                            <div className="flex items-center gap-1">
                                                                <RouteIcon className="w-4 h-4 text-emerald-400" />
                                                                <span className="text-emerald-400 font-medium">{suggestion.routeName}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {suggestion.distanceKm} km de distância
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Navigation className="w-3 h-3" />
                                                                ~{suggestion.estimatedTravelMinutes} min deslocamento
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Timer className="w-3 h-3" />
                                                                ~{suggestion.estimatedRouteDurationMinutes} min rota
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {suggestion.availableMinutes} min disponíveis
                                                            </span>
                                                        </div>
                                                        <div className="mt-2">
                                                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                                                                Margem: +{suggestion.timeMarginMinutes} min sobrando
                                                            </Badge>
                                                            {suggestion.distanceKm <= 5 && (
                                                                <Badge className="ml-2 bg-green-600 text-white text-xs">
                                                                    Proximidade Ideal
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleReallocation(suggestion.driverId, suggestion.routeId)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white ml-4"
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4 mr-1" /> Realocar
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ======================== */}
            {/* Modal: Criar Turno */}
            {/* ======================== */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-red-500" /> Criar Novo Turno
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Configure o turno personalizado do motorista
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="text-gray-400">Motorista *</Label>
                            <Select value={formData.driverId} onValueChange={(v) => setFormData({ ...formData, driverId: v })}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue placeholder="Selecione o motorista" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {drivers.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-gray-400">Data do Turno *</Label>
                            <Input type="date" value={formData.shiftDate}
                                onChange={(e) => setFormData({ ...formData, shiftDate: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400">Início do Turno *</Label>
                                <Input type="time" value={formData.plannedStartTime}
                                    onChange={(e) => setFormData({ ...formData, plannedStartTime: e.target.value })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                            <div>
                                <Label className="text-gray-400">Fim do Turno *</Label>
                                <Input type="time" value={formData.plannedEndTime}
                                    onChange={(e) => setFormData({ ...formData, plannedEndTime: e.target.value })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400">Início da Pausa</Label>
                                <Input type="time" value={formData.breakStartTime}
                                    onChange={(e) => setFormData({ ...formData, breakStartTime: e.target.value })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                            <div>
                                <Label className="text-gray-400">Fim da Pausa</Label>
                                <Input type="time" value={formData.breakEndTime}
                                    onChange={(e) => setFormData({ ...formData, breakEndTime: e.target.value })}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-gray-400">Observações</Label>
                            <Input value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                                className="bg-seguranca-black border-gray-600 text-gray-200"
                                placeholder="Observações sobre o turno..." />
                        </div>
                        <Button onClick={handleCreateShift} className="w-full bg-red-600 hover:bg-red-700 text-white h-11">
                            Criar Turno
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ======================== */}
            {/* Modal: Atribuir Rota */}
            {/* ======================== */}
            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RouteIcon className="w-5 h-5 text-purple-500" /> Atribuir Rota ao Turno
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <Label className="text-gray-400">Rota *</Label>
                            <Select value={assignRouteId} onValueChange={setAssignRouteId}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600 text-gray-200">
                                    <SelectValue placeholder="Selecione a rota" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {routes.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-gray-400">Horário Início</Label>
                                <Input type="time" value={assignStart}
                                    onChange={(e) => setAssignStart(e.target.value)}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                            <div>
                                <Label className="text-gray-400">Horário Fim</Label>
                                <Input type="time" value={assignEnd}
                                    onChange={(e) => setAssignEnd(e.target.value)}
                                    className="bg-seguranca-black border-gray-600 text-gray-200" />
                            </div>
                        </div>
                        <Button onClick={handleAssignRoute} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-11">
                            Atribuir Rota
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ======================== */}
            {/* Modal: Detalhes do Turno */}
            {/* ======================== */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5 text-blue-500" /> Detalhes do Turno
                        </DialogTitle>
                    </DialogHeader>
                    {selectedShift && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400">Motorista</p>
                                    <p className="text-white font-medium">{selectedShift.driver?.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Status</p>
                                    {getStatusBadge(selectedShift.status)}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Horário Planejado</p>
                                    <p className="text-white">{selectedShift.plannedStartTime?.substring(0, 5)} - {selectedShift.plannedEndTime?.substring(0, 5)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Horário Real</p>
                                    <p className="text-white">
                                        {selectedShift.actualStartTime?.substring(0, 5) || '--'} - {selectedShift.actualEndTime?.substring(0, 5) || '--'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Horas Totais</p>
                                    <p className="text-white font-mono">{formatHours(selectedShift.totalShiftHours)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Horas Restantes</p>
                                    <p className={`font-mono font-bold ${(selectedShift.hoursRemaining || 0) > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {formatHours(selectedShift.hoursRemaining)}
                                    </p>
                                </div>
                            </div>

                            {selectedShift.currentLocationName && (
                                <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                    <span className="text-gray-300 text-sm">Localização: {selectedShift.currentLocationName}</span>
                                </div>
                            )}

                            {selectedShift.availableForReallocation && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <AlertTriangle className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 text-sm font-medium">Disponível para realocação</span>
                                </div>
                            )}

                            {/* Execuções de Rotas */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                                    <RouteIcon className="w-4 h-4" /> Rotas do Turno
                                </h3>
                                {(!selectedShift.routeExecutions || selectedShift.routeExecutions.length === 0) ? (
                                    <p className="text-gray-500 text-sm italic">Nenhuma rota atribuída</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedShift.routeExecutions.map((exec: RouteExecution) => (
                                            <Card key={exec.id} className="bg-gray-800/30 border-gray-700">
                                                <CardContent className="p-3">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-white font-medium text-sm">
                                                                    #{exec.executionOrder} {exec.route?.name}
                                                                </span>
                                                                {exec.reallocation && (
                                                                    <Badge className="bg-purple-600 text-white text-xs">Realocação</Badge>
                                                                )}
                                                                {getExecutionStatusBadge(exec.status)}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                                                <span>
                                                                    Plan: {exec.plannedStartTime?.substring(0, 5) || '--'} - {exec.plannedEndTime?.substring(0, 5) || '--'}
                                                                </span>
                                                                {exec.actualStartTime && (
                                                                    <span>
                                                                        Real: {exec.actualStartTime.substring(0, 5)} - {exec.actualEndTime?.substring(0, 5) || '...'}
                                                                    </span>
                                                                )}
                                                                {exec.timeDifferenceMinutes != null && (
                                                                    <Badge variant="outline" className={`text-xs ${
                                                                        exec.timeDifferenceMinutes < 0 ? 'border-green-500/30 text-green-400' : 'border-red-500/30 text-red-400'
                                                                    }`}>
                                                                        {exec.timeDifferenceMinutes < 0 ? '' : '+'}{exec.timeDifferenceMinutes} min
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {exec.status === 'SCHEDULED' && (
                                                                <Button size="sm" variant="ghost" onClick={() => handleStartExecution(exec.id)}
                                                                    className="text-green-400 hover:bg-green-900/30" title="Iniciar">
                                                                    <Play className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            {exec.status === 'IN_PROGRESS' && (
                                                                <Button size="sm" variant="ghost" onClick={() => handleCompleteExecution(exec.id)}
                                                                    className="text-blue-400 hover:bg-blue-900/30" title="Concluir">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
        </StandardLayout>
    );
};

export default DriverShifts;
