import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Bus,
    Users,
    MapPin,
    Activity,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Loader2,
    Calendar,
    LayoutDashboard,
    Clock,
    Car,
    Building2,
    User,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StandardLayout } from '@/components/StandardLayout';
import { PlanningTab } from '@/components/fretamento/PlanningTab';
import ScheduleCalendarTab from '@/components/fretamento/ScheduleCalendarTab';
import { HistoryTab } from '@/components/fretamento/HistoryTab';
import { OperacaoDoDiaDashboard } from '@/components/operacao/OperacaoDoDiaDashboard';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';
import { trafficDashboardService, type TrafficDashboardStats } from '@/services/trafficDashboardService';
import {
    scheduleService,
    Schedule,
    isScheduleActiveForDate,
    resolveScheduleRecurrence,
    resolveScheduleStartTime,
    resolveScheduleEndTime,
} from '@/services/scheduleService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isDriverUser } from '@/utils/roleRouting';
import { Navigate, useLocation } from 'react-router-dom';

const TrafficManagementDashboard: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { toast } = useToast();

    if (isDriverUser(user)) {
        if (location.pathname.includes('minhas-escalas') || location.pathname.includes('escalas')) {
            return <Navigate to="/driver/trips" replace />;
        }
        return <Navigate to="/driver-dashboard" replace />;
    }
    const [backendStats, setBackendStats] = useState<TrafficDashboardStats | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
    const [refreshing, setRefreshing] = useState(false);
    const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);

    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    const loadStatsAndSchedules = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const [statsRes, schedulesRes] = await Promise.allSettled([
                trafficDashboardService.getStats(),
                scheduleService.findAll(),
            ]);

            if (statsRes.status === 'fulfilled') {
                setBackendStats(statsRes.value);
            }
            if (schedulesRes.status === 'fulfilled') {
                setSchedules(Array.isArray(schedulesRes.value) ? schedulesRes.value : []);
            }
            setLastSync(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Erro ao carregar estatísticas de tráfego:', error);
            if (!silent) {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar as estatísticas do dashboard.',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    useEffect(() => {
        loadStatsAndSchedules();
    }, [loadStatsAndSchedules]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadStatsAndSchedules(true);
        }, 60000);
        const handleRealtime = () => loadStatsAndSchedules(true);
        window.addEventListener('fluxbus:driver-records-updated', handleRealtime);
        window.addEventListener('storage', handleRealtime);
        return () => {
            clearInterval(interval);
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtime);
            window.removeEventListener('storage', handleRealtime);
        };
    }, [loadStatsAndSchedules]);

    const handleRefresh = () => {
        loadStatsAndSchedules(true);
    };

    // Calcula em tempo real os indicadores de Monitoramento & Status a partir das Escalas cadastradas (Semanais / FDS)
    const computedStats = useMemo(() => {
        const activeToday = schedules.filter((s) => isScheduleActiveForDate(s, todayStr));
        const effectiveList = activeToday.length > 0 ? activeToday : schedules;

        const uniqueDrivers = new Set<string>();
        const uniqueRoutes = new Set<string>();
        let totalPassengers = 0;
        let inProgressCount = 0;
        let completedCount = 0;
        let pendingPointAlerts = 0;
        let weeklyFixedCount = 0;
        let weekendCount = 0;

        schedules.forEach((s) => {
            const rec = resolveScheduleRecurrence(s);
            if (rec === 'WEEKEND') weekendCount += 1;
            else weeklyFixedCount += 1;
        });

        effectiveList.forEach((s) => {
            if (s.employee?.name) uniqueDrivers.add(s.employee.name);
            const rName = s.routeCode || s.route?.name || s.travelTrip?.name || s.workPost?.name;
            if (rName) uniqueRoutes.add(rName);
            totalPassengers += s.passengersCount ?? 0;

            if (s.status === 'IN_PROGRESS' || (s.initialKm != null && s.finalKm == null)) {
                inProgressCount += 1;
            }
            if (s.status === 'COMPLETED' || s.finalKm != null) {
                completedCount += 1;
            }
            if (s.pointStatus === 'PENDING_TRAFFIC_APPROVAL' || s.status === 'CANCELLED') {
                pendingPointAlerts += 1;
            }
        });

        const totalSchedulesCount = effectiveList.length;
        const activeTripsVal = Math.max(
            backendStats?.activeTrips ?? 0,
            inProgressCount > 0 ? inProgressCount : totalSchedulesCount
        );
        const boardingsVal = Math.max(
            backendStats?.boardingsToday ?? 0,
            totalPassengers > 0 ? totalPassengers : totalSchedulesCount
        );
        const alertsVal = Math.max(backendStats?.geofenceAlerts ?? 0, pendingPointAlerts);

        const calculatedOccupancy =
            totalSchedulesCount > 0
                ? Math.round(
                      ((inProgressCount + completedCount > 0 ? inProgressCount + completedCount : totalSchedulesCount) /
                          totalSchedulesCount) *
                          100
                  )
                : 0;
        const occupancyVal = Math.max(backendStats?.occupancyRate ?? 0, calculatedOccupancy);

        return {
            activeTrips: activeTripsVal,
            routesInProgressNow: Math.max(backendStats?.routesInProgressNow ?? 0, inProgressCount),
            boardingsToday: boardingsVal,
            driversOnShiftToday: Math.max(backendStats?.driversOnShiftToday ?? 0, uniqueDrivers.size),
            geofenceAlerts: alertsVal,
            occupancyRate: occupancyVal,
            completedRoutesToday: Math.max(backendStats?.completedRoutesToday ?? 0, completedCount),
            totalActiveTravelTrips: Math.max(
                backendStats?.totalActiveTravelTrips ?? 0,
                uniqueRoutes.size || schedules.length
            ),
            totalSchedulesToday: Math.max(backendStats?.totalSchedulesToday ?? 0, totalSchedulesCount),
            driversAvailableForReallocation: Math.max(
                backendStats?.driversAvailableForReallocation ?? 0,
                uniqueDrivers.size
            ),
            weeklyFixedCount,
            weekendCount,
            effectiveList,
        };
    }, [schedules, backendStats, todayStr]);

    // Agrupamento das escalas em tempo real por funcionário (motorista)
    const groupedDrivers = useMemo(() => {
        const map = new Map<
            string,
            {
                driverId: string;
                driverName: string;
                schedules: Schedule[];
                inProgressCount: number;
                completedCount: number;
                pendingCount: number;
            }
        >();

        computedStats.effectiveList.forEach((s) => {
            const rawId = s.employeeId || s.employee?.id;
            const dName = (s.employee?.name || 'Motorista Não Definido').trim();
            const groupKey = rawId ? `id-${rawId}` : `name-${dName.toLowerCase()}`;

            if (!map.has(groupKey)) {
                map.set(groupKey, {
                    driverId: rawId || groupKey,
                    driverName: dName,
                    schedules: [],
                    inProgressCount: 0,
                    completedCount: 0,
                    pendingCount: 0,
                });
            }

            const grp = map.get(groupKey)!;
            grp.schedules.push(s);

            if (s.status === 'IN_PROGRESS' || (s.initialKm != null && s.finalKm == null)) {
                grp.inProgressCount += 1;
            } else if (s.status === 'COMPLETED' || s.finalKm != null) {
                grp.completedCount += 1;
            } else {
                grp.pendingCount += 1;
            }
        });

        return Array.from(map.values()).sort((a, b) => a.driverName.localeCompare(b.driverName));
    }, [computedStats.effectiveList]);

    const formatOccupancy = (rate: number) => {
        if (rate === 0) return '0%';
        return `${rate}%`;
    };

    const getOccupancyColor = (rate: number) => {
        if (rate >= 80) return 'text-green-500';
        if (rate >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getOccupancyBg = (rate: number) => {
        if (rate >= 80) return 'bg-green-500/20';
        if (rate >= 50) return 'bg-yellow-500/20';
        return 'bg-red-500/20';
    };

    const getOccupancyIcon = (rate: number) => {
        if (rate >= 80) return <CheckCircle2 className="text-green-500" />;
        if (rate >= 50) return <CheckCircle2 className="text-yellow-500" />;
        return <AlertCircle className="text-red-500" />;
    };

    return (
        <StandardLayout title="Gestão de Tráfego" subtitle="Painel Operacional & Acompanhamento em Tempo Real">
            <div className="p-4 md:p-6 space-y-6">
                <Tabs defaultValue="operacao" className="w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-700/60 pb-3">
                        <TabsList className="bg-seguranca-graphite border border-gray-700">
                            <TabsTrigger
                                value="operacao"
                                className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white flex items-center gap-1.5 text-xs sm:text-sm"
                            >
                                <LayoutDashboard size={16} /> Operação do Dia
                            </TabsTrigger>
                            <TabsTrigger
                                value="monitoring"
                                className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white flex items-center gap-1.5 text-xs sm:text-sm"
                            >
                                <Activity size={16} /> Monitoramento & Status
                            </TabsTrigger>
                            <TabsTrigger
                                value="planning"
                                className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white flex items-center gap-1.5 text-xs sm:text-sm"
                            >
                                <Bus size={16} /> Planejamento / Escalas
                            </TabsTrigger>
                            <TabsTrigger
                                value="calendar"
                                className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white flex items-center gap-1.5 text-xs sm:text-sm"
                            >
                                <Calendar size={16} /> Calendário
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="data-[state=active]:bg-seguranca-red data-[state=active]:text-white flex items-center gap-1.5 text-xs sm:text-sm"
                            >
                                Histórico
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex gap-2 items-center self-end sm:self-auto">
                            <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow text-xs">
                                Sincronizado: {lastSync}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="text-gray-400 hover:text-white"
                                title="Atualizar dados"
                            >
                                {refreshing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Aba Principal: Operação do Dia */}
                    <TabsContent value="operacao" className="mt-4">
                        <OperacaoDoDiaDashboard />
                    </TabsContent>

                    {/* Aba Monitoramento & Status sincronizada com as Escalas */}
                    <TabsContent value="monitoring" className="mt-4 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Card: Viagens Ativas */}
                            <Card className="bg-seguranca-graphite border-gray-700">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Viagens / Escalas Ativas</p>
                                            {loading ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            ) : (
                                                <h3 className="text-3xl font-bold text-white">
                                                    {computedStats.activeTrips}
                                                </h3>
                                            )}
                                            {!loading && (
                                                <p className="text-xs text-emerald-400 mt-1">
                                                    {computedStats.routesInProgressNow > 0
                                                        ? `${computedStats.routesInProgressNow} em andamento agora`
                                                        : `${computedStats.totalSchedulesToday} escala(s) ativa(s)`}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-seguranca-red/20 p-2 rounded-lg">
                                            <Bus className="text-seguranca-red" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card: Embarques Hoje */}
                            <Card className="bg-seguranca-graphite border-gray-700">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Embarques / Escalas Hoje</p>
                                            {loading ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            ) : (
                                                <h3 className="text-3xl font-bold text-white">
                                                    {computedStats.boardingsToday}
                                                </h3>
                                            )}
                                            {!loading && (
                                                <p className="text-xs text-seguranca-yellow mt-1">
                                                    {computedStats.driversOnShiftToday} motorista(s) escalado(s)
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-seguranca-yellow/20 p-2 rounded-lg">
                                            <Users className="text-seguranca-yellow" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card: Alertas Geofence / Ponto */}
                            <Card className="bg-seguranca-graphite border-gray-700">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Alertas Geofence / Ponto</p>
                                            {loading ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            ) : (
                                                <h3
                                                    className={`text-3xl font-bold ${
                                                        computedStats.geofenceAlerts > 0
                                                            ? 'text-amber-400'
                                                            : 'text-green-500'
                                                    }`}
                                                >
                                                    {computedStats.geofenceAlerts}
                                                </h3>
                                            )}
                                            {!loading && (
                                                <p
                                                    className={`text-xs mt-1 ${
                                                        computedStats.geofenceAlerts > 0
                                                            ? 'text-amber-300'
                                                            : 'text-green-500'
                                                    }`}
                                                >
                                                    {computedStats.geofenceAlerts === 0
                                                        ? 'Sem alertas pendentes'
                                                        : 'Aguardando aprovação do gestor'}
                                                </p>
                                            )}
                                        </div>
                                        <div
                                            className={`p-2 rounded-lg ${
                                                computedStats.geofenceAlerts > 0
                                                    ? 'bg-amber-500/20'
                                                    : 'bg-green-500/20'
                                            }`}
                                        >
                                            {computedStats.geofenceAlerts > 0 ? (
                                                <AlertCircle className="text-amber-400" />
                                            ) : (
                                                <CheckCircle2 className="text-green-500" />
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Card: Taxa de Ocupação / Execução */}
                            <Card className="bg-seguranca-graphite border-gray-700">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-400">Taxa de Ocupação / Execução</p>
                                            {loading ? (
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                                </div>
                                            ) : (
                                                <h3
                                                    className={`text-3xl font-bold ${getOccupancyColor(
                                                        computedStats.occupancyRate
                                                    )}`}
                                                >
                                                    {formatOccupancy(computedStats.occupancyRate)}
                                                </h3>
                                            )}
                                            {!loading && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {computedStats.completedRoutesToday} rota(s) concluída(s)
                                                </p>
                                            )}
                                        </div>
                                        <div className={`p-2 rounded-lg ${getOccupancyBg(computedStats.occupancyRate)}`}>
                                            {getOccupancyIcon(computedStats.occupancyRate)}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity size={20} className="text-seguranca-yellow" /> Status Detalhado da Operação
                                </CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                                        📅 Fixas Semanais (Seg–Sex): {computedStats.weeklyFixedCount}
                                    </Badge>
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                                        🗓️ Escalas FDS (Sáb/Dom): {computedStats.weekendCount}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 bg-seguranca-black/50 rounded-lg border border-gray-800">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">
                                                Viagens / Rotas Cadastradas
                                            </p>
                                            <p className="text-2xl font-bold text-white mt-1">
                                                {computedStats.totalActiveTravelTrips}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                rotas e viagens ativas nas escalas
                                            </p>
                                        </div>
                                        <div className="p-4 bg-seguranca-black/50 rounded-lg border border-gray-800">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">
                                                Escalas do Dia (Vigentes)
                                            </p>
                                            <p className="text-2xl font-bold text-emerald-400 mt-1">
                                                {computedStats.totalSchedulesToday}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                escalas semanais fixas e do dia em vigor
                                            </p>
                                        </div>
                                        <div className="p-4 bg-seguranca-black/50 rounded-lg border border-gray-800">
                                            <p className="text-xs text-gray-400 uppercase tracking-wider">
                                                Motoristas Escalados / Ativos
                                            </p>
                                            <p className="text-2xl font-bold text-seguranca-yellow mt-1">
                                                {computedStats.driversOnShiftToday}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                motoristas vinculados às escalas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Lista Ao Vivo das Escalas Monitoradas Agrupadas por Funcionário */}
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-200 flex items-center gap-2">
                                                <Bus className="h-4 w-4 text-seguranca-yellow shrink-0" />
                                                <span>
                                                    Monitoramento por Funcionário ({groupedDrivers.length} motorista{groupedDrivers.length === 1 ? '' : 's'} • {computedStats.effectiveList.length} escala{computedStats.effectiveList.length === 1 ? '' : 's'})
                                                </span>
                                            </h4>
                                            <Badge variant="outline" className="border-seguranca-yellow/40 text-seguranca-yellow text-[11px] self-start sm:self-auto">
                                                Agrupado por Motorista
                                            </Badge>
                                        </div>

                                        {groupedDrivers.length === 0 ? (
                                            <div className="text-center py-8 text-gray-400 bg-seguranca-black/30 rounded-lg border border-gray-800">
                                                Nenhuma escala cadastrada até o momento. Crie uma escala na aba Planejamento / Escalas.
                                            </div>
                                        ) : (
                                            <div className="space-y-3.5">
                                                {groupedDrivers.map((group) => {
                                                    const hasInProgress = group.inProgressCount > 0;
                                                    const allCompleted = group.completedCount === group.schedules.length;

                                                    return (
                                                        <div
                                                            key={group.driverId}
                                                            className="rounded-xl border border-gray-800 bg-seguranca-black/60 p-3.5 sm:p-4 space-y-3 hover:border-gray-700 transition-all shadow-md"
                                                        >
                                                            {/* Cabeçalho do Grupo do Funcionário */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-800">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className="w-8 h-8 rounded-lg bg-seguranca-yellow/15 border border-seguranca-yellow/30 flex items-center justify-center text-seguranca-yellow font-bold shrink-0">
                                                                        <User className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                setInspectedDriver({
                                                                                    id: group.driverId,
                                                                                    name: group.driverName,
                                                                                })
                                                                            }
                                                                            className="font-bold text-sm sm:text-base text-white hover:text-seguranca-yellow flex items-center gap-1.5 text-left group truncate"
                                                                        >
                                                                            <span className="truncate">{group.driverName}</span>
                                                                            <Eye className="h-3.5 w-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                                                                        </button>
                                                                        <span className="text-[11px] text-gray-400 block">
                                                                            Funcionário / Motorista Operacional
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <Badge className="bg-primary/20 text-white border border-primary/30 text-[11px] font-semibold">
                                                                        {group.schedules.length} Escala{group.schedules.length === 1 ? '' : 's'}
                                                                    </Badge>
                                                                    {hasInProgress && (
                                                                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold animate-pulse">
                                                                            🔵 {group.inProgressCount} Em Andamento
                                                                        </Badge>
                                                                    )}
                                                                    {group.completedCount > 0 && (
                                                                        <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
                                                                            ✅ {group.completedCount} Concluída{group.completedCount === 1 ? '' : 's'}
                                                                        </Badge>
                                                                    )}
                                                                    {group.pendingCount > 0 && !hasInProgress && !allCompleted && (
                                                                        <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px]">
                                                                            ⏳ {group.pendingCount} Pendente{group.pendingCount === 1 ? '' : 's'}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Grade de Escalas deste Funcionário */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                                                {group.schedules.map((sched) => {
                                                                    const rec = resolveScheduleRecurrence(sched);
                                                                    const routeName =
                                                                        sched.routeCode ||
                                                                        sched.route?.name ||
                                                                        sched.travelTrip?.name ||
                                                                        sched.workPost?.name ||
                                                                        'Rota não informada';
                                                                    const plate =
                                                                        sched.vehicle?.plate || sched.vehiclePlate || 'Sem placa';
                                                                    const model =
                                                                        sched.vehicle?.model || sched.vehicleModel || '';
                                                                    const clientName =
                                                                        sched.clientName ||
                                                                        sched.client?.name ||
                                                                        sched.workPost?.client?.name ||
                                                                        sched.location?.name ||
                                                                        'Operação Padrão';
                                                                    const startT = resolveScheduleStartTime(sched);
                                                                    const endT = resolveScheduleEndTime(sched);
                                                                    const isExecuting =
                                                                        sched.status === 'IN_PROGRESS' ||
                                                                        (sched.initialKm != null && sched.finalKm == null);
                                                                    const isDone =
                                                                        sched.status === 'COMPLETED' || sched.finalKm != null;

                                                                    return (
                                                                        <div
                                                                            key={sched.id}
                                                                            className="p-3 rounded-xl bg-seguranca-black/80 border border-gray-800/90 hover:border-seguranca-yellow/40 transition-all flex flex-col justify-between gap-2.5"
                                                                        >
                                                                            <div className="flex items-center justify-between gap-1.5">
                                                                                <Badge
                                                                                    className={
                                                                                        rec === 'WEEKEND'
                                                                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]'
                                                                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                                                                                    }
                                                                                >
                                                                                    {rec === 'WEEKEND' ? '🗓️ FDS' : '📅 Semanal Fixa'}
                                                                                </Badge>
                                                                                <Badge
                                                                                    variant="outline"
                                                                                    className={`text-[10px] font-semibold ${
                                                                                        isExecuting
                                                                                            ? 'border-blue-500 text-blue-300 bg-blue-500/15'
                                                                                            : isDone
                                                                                            ? 'border-emerald-500 text-emerald-300 bg-emerald-500/15'
                                                                                            : 'border-gray-700 text-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    {isExecuting
                                                                                        ? 'Em Andamento'
                                                                                        : isDone
                                                                                        ? 'Concluída'
                                                                                        : sched.status === 'CONFIRMED'
                                                                                        ? 'Confirmada'
                                                                                        : 'Pendente'}
                                                                                </Badge>
                                                                            </div>

                                                                            <div className="space-y-1 text-xs">
                                                                                <div className="font-semibold text-blue-300 truncate" title={routeName}>
                                                                                    {routeName}
                                                                                </div>
                                                                                <div className="flex items-center justify-between text-gray-300 text-[11px] pt-1 border-t border-gray-800/60">
                                                                                    <span className="font-mono text-orange-300 flex items-center gap-1">
                                                                                        <Clock className="h-3 w-3 text-orange-400 shrink-0" /> {startT} às {endT}
                                                                                    </span>
                                                                                    <span className="font-mono font-bold text-purple-300 flex items-center gap-1 truncate max-w-[140px]" title={plate}>
                                                                                        <Car className="h-3 w-3 text-purple-400 shrink-0" /> {plate}
                                                                                        {model ? ` (${model})` : ''}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-[11px] text-emerald-300 flex items-center gap-1 truncate pt-0.5" title={clientName}>
                                                                                    <Building2 className="h-3 w-3 text-emerald-400 shrink-0" /> {clientName}
                                                                                </div>
                                                                            </div>

                                                                            {/* Exibe KM e Passageiros se já registrados pelo motorista no Ponto */}
                                                                            {(sched.initialKm != null || sched.finalKm != null || (sched.passengersCount != null && sched.passengersCount > 0)) && (
                                                                                <div className="pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                                                                    <span>
                                                                                        KM: <strong className="text-white">{sched.initialKm ?? '--'}</strong>
                                                                                        {sched.finalKm != null ? ` ➔ ${sched.finalKm}` : ''}
                                                                                    </span>
                                                                                    {sched.passengersCount != null && (
                                                                                        <span>
                                                                                            Passag: <strong className="text-emerald-400">{sched.passengersCount}</strong>
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="planning" className="mt-4">
                        <PlanningTab />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-4">
                        <ScheduleCalendarTab />
                    </TabsContent>

                    <TabsContent value="history" className="mt-4">
                        <HistoryTab />
                    </TabsContent>
                </Tabs>
            </div>

            <DriverActivityInspectorModal
                isOpen={Boolean(inspectedDriver)}
                onClose={() => setInspectedDriver(null)}
                driverId={inspectedDriver?.id}
                driverName={inspectedDriver?.name || ''}
                initialSchedules={schedules.filter(
                    (e) =>
                        (inspectedDriver?.id &&
                            (e.employeeId === inspectedDriver.id || e.employee?.id === inspectedDriver.id)) ||
                        (inspectedDriver?.name &&
                            (e.employee?.name || '').trim().toLowerCase() ===
                                inspectedDriver.name.trim().toLowerCase())
                )}
                onScheduleUpdated={() => loadStatsAndSchedules(true)}
            />
        </StandardLayout>
    );
};

export default TrafficManagementDashboard;
