import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Bus,
    Users,
    UserCheck,
    MapPin,
    Clock,
    Eye,
    Download,
    Plus,
    TrendingUp,
    Calendar,
    Gauge,
    QrCode,
    Filter,
    CheckCircle2,
    RefreshCw,
    Building2,
    Camera,
    AlertTriangle
} from 'lucide-react';
import { TripDetailsModal, TripDetailData } from './TripDetailsModal';
import { PassengerQuickFormModal } from './PassengerQuickFormModal';
import { DriverQuickFormModal } from './DriverQuickFormModal';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';
import {
    scheduleService,
    Schedule,
    isScheduleActiveForDate,
    matchesScheduleModeFilter,
    resolveScheduleRecurrence,
    resolveScheduleStartTime,
    resolveScheduleEndTime,
} from '@/services/scheduleService';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeSvgUri } from '@/utils/qrCodeHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LINE_COLORS = [
    { hex: '#16a34a', barClass: 'bg-emerald-500' },
    { hex: '#2563eb', barClass: 'bg-blue-500' },
    { hex: '#eab308', barClass: 'bg-yellow-500' },
    { hex: '#ec4899', barClass: 'bg-pink-500' },
    { hex: '#f97316', barClass: 'bg-orange-500' },
    { hex: '#06b6d4', barClass: 'bg-cyan-500' },
];

interface OperacaoDoDiaDashboardProps {
    filterGarage?: string;
    onSelectTripForDriver?: (trip: TripDetailData) => void;
}

export const OperacaoDoDiaDashboard: React.FC<OperacaoDoDiaDashboardProps> = () => {
    const { toast } = useToast();
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
    const [recurrenceMode, setRecurrenceMode] = useState<'ALL' | 'WEEKLY_FIXED' | 'WEEKEND'>('ALL');
    const [selectedPeriod, setSelectedPeriod] = useState('ALL');
    const [selectedLine, setSelectedLine] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedTrip, setSelectedTrip] = useState<TripDetailData | null>(null);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [qrCodeTrip, setQrCodeTrip] = useState<TripDetailData | null>(null);
    const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);

    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const list = await scheduleService.findAll();
            setSchedules(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('Erro ao carregar escalas para Operação do Dia:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSchedules();
        const handleRealtime = () => {
            loadSchedules();
        };
        window.addEventListener('fluxbus:driver-records-updated', handleRealtime);
        window.addEventListener('storage', handleRealtime);
        return () => {
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtime);
            window.removeEventListener('storage', handleRealtime);
        };
    }, [loadSchedules]);

    // Escalas ativas para a data selecionada (respeitando Escala Fixa Semanal Seg-Sex e Escala FDS Sáb/Dom)
    const activeSchedulesForDay = useMemo(() => {
        return schedules.filter((s) => {
            if (recurrenceMode !== 'ALL') {
                return matchesScheduleModeFilter(s, recurrenceMode);
            }
            return isScheduleActiveForDate(s, selectedDate);
        });
    }, [schedules, selectedDate, recurrenceMode]);

    // Converte as escalas reais criadas para os itens da Operação do Dia
    const mappedTrips = useMemo(() => {
        return activeSchedulesForDay.map((s, idx) => {
            const startTime = resolveScheduleStartTime(s);
            const endTime = resolveScheduleEndTime(s);
            const routeLabel =
                s.routeCode ||
                s.route?.name ||
                s.travelTrip?.name ||
                s.workPost?.name ||
                s.location?.name ||
                'Rota / Percurso';
            const clientLabel =
                s.clientName ||
                s.client?.name ||
                s.travelTrip?.client?.name ||
                (s.workPost as any)?.client?.name ||
                s.location?.name ||
                'Operação Padrão';
            const plate = s.vehicle?.plate || s.vehiclePlate || 'Não inf.';
            const vehicleModel = s.vehicle?.model || s.vehicleModel || 'Ônibus / Frota';
            const driverName = s.employee?.name || 'Motorista não informado';
            const recurrence = resolveScheduleRecurrence(s);
            const colorInfo = LINE_COLORS[idx % LINE_COLORS.length];

            const isRunning =
                s.status === 'IN_PROGRESS' ||
                (s.initialKm != null && s.finalKm == null && s.status !== 'COMPLETED');
            const isCompleted = s.status === 'COMPLETED' || s.finalKm != null;
            const isPendingPoint = s.pointStatus === 'PENDING_TRAFFIC_APPROVAL';

            const passengersRealized = s.passengersCount ?? 0;
            const passengersExpected = Math.max(passengersRealized, 44);

            let photosCount = 0;
            if (s.tripPhotosJson) {
                try {
                    const parsed = JSON.parse(s.tripPhotosJson);
                    if (Array.isArray(parsed)) photosCount = parsed.length;
                } catch {
                    photosCount = 0;
                }
            }

            const tripDetail: TripDetailData & {
                schedule: Schedule;
                recurrence: 'WEEKLY_FIXED' | 'WEEKEND' | 'SINGLE_DAY';
                clientLabel: string;
                isCompleted: boolean;
                isPendingPoint: boolean;
                photosCount: number;
                barClass: string;
            } = {
                id: s.id,
                time: startTime,
                departureTime: startTime,
                arrivalTime: endTime,
                lineName: clientLabel !== 'Operação Padrão' ? clientLabel : routeLabel,
                lineColor: colorInfo.hex,
                barClass: colorInfo.barClass,
                route: routeLabel,
                origin: s.startAddress || s.travelTrip?.originAddress || 'Origem da Escala',
                destination: s.endAddress || s.travelTrip?.destinationAddress || clientLabel,
                vehicleType: vehicleModel,
                vehiclePlate: plate,
                driverName,
                passengersExpected,
                passengersRealized,
                kmStart: s.initialKm ?? 0,
                kmEnd: s.finalKm ?? s.initialKm ?? 0,
                status: isRunning ? 'EM_ANDAMENTO' : 'PROGRAMADO',
                garageName: clientLabel,
                schedule: s,
                recurrence,
                clientLabel,
                isCompleted,
                isPendingPoint,
                photosCount,
            };

            return tripDetail;
        });
    }, [activeSchedulesForDay]);

    // Lista dinâmica de Rotas/Linhas presentes nas escalas para o filtro
    const availableRoutes = useMemo(() => {
        const set = new Set<string>();
        mappedTrips.forEach((t) => {
            if (t.route) set.add(t.route);
        });
        return Array.from(set);
    }, [mappedTrips]);

    // Filtragem reativa (Período, Linha/Rota, Busca)
    const filteredTrips = useMemo(() => {
        return mappedTrips.filter((t) => {
            if (selectedLine !== 'ALL' && t.route !== selectedLine) return false;

            if (selectedPeriod !== 'ALL') {
                const hour = Number((t.time || '08:00').split(':')[0]);
                if (selectedPeriod === 'MANHA' && (hour < 5 || hour >= 12)) return false;
                if (selectedPeriod === 'TARDE' && (hour < 12 || hour >= 18)) return false;
                if (selectedPeriod === 'NOITE' && hour >= 5 && hour < 18) return false;
            }

            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase();
                const match =
                    t.driverName.toLowerCase().includes(q) ||
                    t.vehiclePlate.toLowerCase().includes(q) ||
                    t.route.toLowerCase().includes(q) ||
                    t.clientLabel.toLowerCase().includes(q);
                if (!match) return false;
            }

            return true;
        });
    }, [mappedTrips, selectedLine, selectedPeriod, searchTerm]);

    // Indicadores reais calculados a partir das escalas
    const kpis = useMemo(() => {
        const uniqueRoutes = new Set<string>();
        const uniqueDrivers = new Set<string>();
        const uniqueVehicles = new Set<string>();
        let totalPassengers = 0;
        let totalKmRodados = 0;
        let inProgressOrCompleted = 0;
        let completedCount = 0;
        let pendingPointApprovals = 0;

        filteredTrips.forEach((t) => {
            if (t.route && t.route !== 'Rota / Percurso') uniqueRoutes.add(t.route);
            if (t.driverName && t.driverName !== 'Motorista não informado') uniqueDrivers.add(t.driverName);
            if (t.vehiclePlate && t.vehiclePlate !== 'Não inf.') uniqueVehicles.add(t.vehiclePlate);
            totalPassengers += t.passengersRealized || 0;
            if (t.kmEnd > t.kmStart && t.kmStart > 0) {
                totalKmRodados += t.kmEnd - t.kmStart;
            }
            if (t.status === 'EM_ANDAMENTO' || t.isCompleted) {
                inProgressOrCompleted += 1;
            }
            if (t.isCompleted) {
                completedCount += 1;
            }
            if (t.isPendingPoint) {
                pendingPointApprovals += 1;
            }
        });

        return {
            activeRoutes: uniqueRoutes.size || (filteredTrips.length > 0 ? 1 : 0),
            totalPassengers,
            driversCount: uniqueDrivers.size,
            vehiclesCount: uniqueVehicles.size,
            totalTrips: filteredTrips.length,
            inProgressOrCompleted,
            completedCount,
            totalKmRodados,
            pendingPointApprovals,
        };
    }, [filteredTrips]);

    // Ocupação real / progresso das rotas cadastradas
    const occupationList = useMemo(() => {
        if (filteredTrips.length === 0) return [];
        return filteredTrips.map((t) => {
            const pct =
                t.passengersRealized > 0
                    ? Math.min(100, Math.round((t.passengersRealized / (t.passengersExpected || 44)) * 100))
                    : t.isCompleted
                    ? 100
                    : t.status === 'EM_ANDAMENTO'
                    ? 65
                    : 0;
            return {
                id: t.id,
                name: `${t.route} (${t.driverName.split(' ').slice(0, 2).join(' ')})`,
                routeName: t.route,
                driverName: t.driverName,
                vehiclePlate: t.vehiclePlate,
                color: t.barClass,
                percent: pct,
                passengers: t.passengersRealized,
                isCompleted: t.isCompleted,
                status: t.status,
            };
        });
    }, [filteredTrips]);

    const completedRoutesCount = useMemo(() => {
        return occupationList.filter((o) => o.percent === 100 || o.isCompleted).length;
    }, [occupationList]);

    const avgOccupancy = useMemo(() => {
        if (occupationList.length === 0) return 0;
        const sum = occupationList.reduce((acc, item) => acc + item.percent, 0);
        return Math.round(sum / occupationList.length);
    }, [occupationList]);

    const handleSaveKm = async (tripId: string, kmStart: number, kmEnd: number) => {
        try {
            if (kmStart > 0) {
                await scheduleService.registerPoint(tripId, { initialKm: kmStart });
            }
            if (kmEnd > 0 && kmEnd >= kmStart) {
                await scheduleService.finishTrip(tripId, { finalKm: kmEnd });
            }
            await loadSchedules();
        } catch {
            // fallback
        }
    };

    const handleExport = async () => {
        try {
            const blob = await scheduleService.generatePDFReport({
                startDate: selectedDate,
                endDate: selectedDate,
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `operacao-do-dia-${selectedDate}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toast({
                title: 'Exportando Operação do Dia',
                description: 'Relatório operacional das escalas gerado em PDF com sucesso.',
            });
        } catch {
            toast({
                title: 'Exportando Operação do Dia',
                description: 'Resumo operacional da tela atualizado.',
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Saudação Sincronizado com Escalas Reais */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
                <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs">
                            Sincronizado com Escalas Cadastradas
                        </Badge>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs">
                            Escala Fixa Semanal (Seg–Sex) & Escala FDS
                        </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                            <Bus className="h-7 w-7" />
                        </span>
                        <span>
                            Operação do Dia &mdash; <span className="text-blue-400">Escalas em Tempo Real</span>
                        </span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Acompanhe em tempo real os motoristas escalados, veículos, rotas, horários, clientes, KMs e passageiros.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        onClick={loadSchedules}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-bold gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
                        Sincronizar Escalas
                    </Button>
                    <Button
                        onClick={() => setIsPassengerModalOpen(true)}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-bold gap-2"
                    >
                        <Plus className="h-4 w-4 text-blue-400" /> Cadastro Passageiro
                    </Button>
                    <Button
                        onClick={() => setIsDriverModalOpen(true)}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-bold gap-2"
                    >
                        <Plus className="h-4 w-4 text-emerald-400" /> Cadastro Motorista
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Download className="h-4 w-4" /> Exportar PDF
                    </Button>
                </div>
            </div>

            {/* 5 Cards Superiores alimentados pelas Escalas Cadastradas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Rotas / Linhas
                            </span>
                            <div className="text-2xl font-black text-white">{kpis.activeRoutes}</div>
                            <span className="text-[10px] text-emerald-400 font-bold">
                                {kpis.totalTrips} escala(s) ativa(s)
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Passageiros
                            </span>
                            <div className="text-2xl font-black text-white">{kpis.totalPassengers}</div>
                            <span className="text-[10px] text-emerald-400 font-bold">
                                Registrados pelos motoristas
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Motoristas
                            </span>
                            <div className="text-2xl font-black text-white">{kpis.driversCount}</div>
                            <span className="text-[10px] text-purple-400 font-bold">
                                🟢 Escalados no dia
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Veículos
                            </span>
                            <div className="text-2xl font-black text-white">{kpis.vehiclesCount}</div>
                            <span className="text-[10px] text-amber-400 font-bold">
                                🟢 Frota escalada
                            </span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-xl">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                Escalas / Viagens
                            </span>
                            <div className="text-2xl font-black text-white">{kpis.totalTrips}</div>
                            <span className="text-[10px] text-pink-400 font-bold">
                                🟢 {kpis.completedCount} concluída(s)
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros da Operação (Data, Regime Semanal/FDS, Período, Rota e Busca) */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{ backgroundColor: '#020617', color: '#ffffff', colorScheme: 'dark' }}
                        className="h-9 w-38 bg-slate-950 border-slate-700 text-xs font-bold text-white"
                    />
                </div>

                {/* Seletor de Regime: Vigente na Data vs Semanal Fixa vs FDS */}
                <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-700">
                    <button
                        type="button"
                        onClick={() => setRecurrenceMode('ALL')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            recurrenceMode === 'ALL'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        Vigentes no Dia
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrenceMode('WEEKLY_FIXED')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            recurrenceMode === 'WEEKLY_FIXED'
                                ? 'bg-emerald-600 text-white'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        📅 Escala Semanal (Fixa)
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrenceMode('WEEKEND')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                            recurrenceMode === 'WEEKEND'
                                ? 'bg-amber-600 text-white'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        🗓️ Escala FDS
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="h-9 w-36 bg-slate-950 border-slate-700 text-xs text-white">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700 text-white text-xs">
                            <SelectItem value="ALL">Todos Períodos</SelectItem>
                            <SelectItem value="MANHA">Manhã (05h-12h)</SelectItem>
                            <SelectItem value="TARDE">Tarde (12h-18h)</SelectItem>
                            <SelectItem value="NOITE">Noite (18h-05h)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select value={selectedLine} onValueChange={setSelectedLine}>
                        <SelectTrigger className="h-9 w-44 bg-slate-950 border-slate-700 text-xs text-white">
                            <SelectValue placeholder="Rotas / Linhas" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700 text-white text-xs">
                            <SelectItem value="ALL">Todas as Rotas</SelectItem>
                            {availableRoutes.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex-1 min-w-[200px] ml-auto">
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Filtrar motorista, placa, rota ou cliente..."
                        style={{ backgroundColor: '#020617', color: '#ffffff' }}
                        className="h-9 bg-slate-950 border-slate-700 text-xs text-white placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* 1. Tabela Principal de Operação do Dia em Largura Total (100% Full Width) */}
            <Card className="w-full bg-slate-900/90 border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <CardHeader className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl shrink-0">
                            <Bus className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                Operação do Dia (Escalas Ativas)
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-400 mt-0.5">
                                Acompanhamento em tempo real dos motoristas, veículos, rotas, KM e passageiros
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Badge variant="outline" className="text-xs border-blue-500/40 text-blue-300 bg-blue-500/10 font-bold px-3 py-1">
                            {filteredTrips.length} escala(s) em operação
                        </Badge>
                    </div>
                </CardHeader>
                <div className="flex-1 overflow-x-auto">
                    {filteredTrips.length === 0 ? (
                        <div className="p-10 text-center text-slate-400 space-y-2">
                            <Bus className="h-10 w-10 mx-auto opacity-30" />
                            <p className="text-sm font-semibold text-white">
                                Nenhuma escala encontrada para o filtro selecionado
                            </p>
                            <p className="text-xs text-slate-400">
                                Cadastre escalas na aba &ldquo;Planejamento / Escalas&rdquo; ou alterne entre Escala Semanal e Escala FDS acima.
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4 min-w-[130px]">Horário / Regime</th>
                                    <th className="py-3.5 px-3 min-w-[130px]">Cliente</th>
                                    <th className="py-3.5 px-3 min-w-[170px]">Rota / Trajeto</th>
                                    <th className="py-3.5 px-3 min-w-[120px]">Veículo / Placa</th>
                                    <th className="py-3.5 px-3 min-w-[160px]">Motorista Escalado</th>
                                    <th className="py-3.5 px-3 min-w-[140px]">KM / Passag.</th>
                                    <th className="py-3.5 px-3 min-w-[110px]">Status</th>
                                    <th className="py-3.5 px-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                                {filteredTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-100 font-mono">
                                                {trip.departureTime} às {trip.arrivalTime}
                                            </div>
                                            <div className="mt-1">
                                                {trip.recurrence === 'WEEKEND' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                        🗓️ Escala FDS
                                                    </span>
                                                ) : trip.recurrence === 'SINGLE_DAY' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        📌 Data Única
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                                        📅 Fixa Semanal
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <span
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-sm max-w-[140px] truncate"
                                                style={{ backgroundColor: trip.lineColor }}
                                                title={trip.clientLabel}
                                            >
                                                <Building2 className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{trip.clientLabel}</span>
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-slate-200 font-semibold max-w-[200px] truncate" title={trip.route}>
                                            {trip.route}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="font-mono font-bold text-amber-400">{trip.vehiclePlate}</div>
                                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                                {trip.vehicleType}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setInspectedDriver({
                                                        id: trip.schedule.employeeId || trip.schedule.employee?.id,
                                                        name: trip.driverName,
                                                    })
                                                }
                                                className="text-left group hover:text-amber-300 transition-colors"
                                                title="Clique no motorista para ver todas as atividades, fotos e mapa de rota"
                                            >
                                                <div className="font-bold text-white group-hover:text-amber-300 underline decoration-dotted underline-offset-4">
                                                    {trip.driverName}
                                                </div>
                                                <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-2.5 w-2.5" /> Ver atividades & mapa
                                                </div>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <div className="font-bold text-slate-200">
                                                <span className="text-emerald-400">{trip.passengersRealized}</span> passag.
                                            </div>
                                            {trip.kmStart > 0 && (
                                                <div className="text-[10px] text-cyan-300 font-mono">
                                                    KM: {trip.kmStart} → {trip.schedule.finalKm ?? 'curso'}
                                                </div>
                                            )}
                                            {trip.photosCount > 0 && (
                                                <div className="text-[10px] text-amber-300 flex items-center gap-1">
                                                    <Camera className="h-2.5 w-2.5" /> {trip.photosCount} foto(s)
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            {trip.isPendingPoint ? (
                                                <Badge className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border-amber-500/40">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Aguard. Gestor
                                                </Badge>
                                            ) : trip.isCompleted ? (
                                                <Badge className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Concluída
                                                </Badge>
                                            ) : trip.status === 'EM_ANDAMENTO' ? (
                                                <Badge className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block bg-current" />
                                                    Em andamento
                                                </Badge>
                                            ) : (
                                                <Badge className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                    <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block bg-current" />
                                                    {trip.schedule.status === 'CONFIRMED' ? 'Confirmada' : 'Escalada'}
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-3 text-right space-x-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => {
                                                    setSelectedTrip(trip);
                                                    setIsTripModalOpen(true);
                                                }}
                                                className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                                title="Ver Detalhes da Escala / Viagem"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setQrCodeTrip(trip)}
                                                className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                                                title="Gerar QR Code de Embarque"
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </Card>

            {/* 2. Painel Analítico Inteligente: Ocupação & Execução das Rotas em Grade Panorama */}
            <Card className="w-full bg-slate-900/90 border-slate-800 text-white rounded-2xl shadow-xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl shrink-0">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                                Ocupação & Execução das Rotas
                            </CardTitle>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Progresso de execução e lotação em tempo real das rotas monitoradas no dia
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-bold px-2.5 py-1">
                            Taxa Média: {avgOccupancy}%
                        </Badge>
                        {completedRoutesCount > 0 && (
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-bold px-2.5 py-1">
                                {completedRoutesCount} Concluída(s)
                            </Badge>
                        )}
                        <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs px-2.5 py-1">
                            {occupationList.length} Rota(s) Monitorada(s)
                        </Badge>
                    </div>
                </div>

                {occupationList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                        Nenhuma rota ativa para exibir ocupação no momento.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                        {occupationList.map((item) => (
                            <div
                                key={item.id}
                                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <span className="text-xs font-bold text-slate-200 flex items-center gap-2 truncate" title={item.routeName}>
                                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.color}`} />
                                            <span className="truncate">{item.routeName}</span>
                                        </span>
                                        <span className="text-[11px] text-slate-400 block truncate pl-4.5 mt-0.5">
                                            {item.driverName} • <span className="font-mono text-amber-400">{item.vehiclePlate}</span>
                                        </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-white shrink-0">
                                        {item.passengers > 0 ? `${item.passengers} pass. (${item.percent}%)` : `${item.percent}%`}
                                    </span>
                                </div>

                                <div className="h-2 w-full bg-slate-800/80 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                        style={{ width: `${Math.max(6, item.percent)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/90 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>
                            Média geral de ocupação/execução das escalas ativas: <strong className="text-white font-bold">{avgOccupancy}%</strong>
                        </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                        Dados sincronizados em tempo real conforme registros dos motoristas
                    </span>
                </div>
            </Card>

            {/* 4 Cards Inferiores sincronizados com as Escalas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Passageiros Transportados
                        </span>
                        <div className="text-2xl font-black text-white mt-1">{kpis.totalPassengers}</div>
                        <span className="text-xs text-emerald-400 font-bold">
                            Informados no Ponto Eletrônico
                        </span>
                    </div>
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
                        <Users className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Escalas em Execução / Concluídas
                        </span>
                        <div className="text-2xl font-black text-white mt-1">
                            {kpis.inProgressOrCompleted}{' '}
                            <span className="text-base text-slate-500 font-normal">/ {kpis.totalTrips}</span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] mt-1">
                            {kpis.completedCount} Concluída(s)
                        </Badge>
                    </div>
                    <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
                        <MapPin className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            KM Rodados nas Escalas
                        </span>
                        <div className="text-2xl font-black text-white mt-1">
                            {kpis.totalKmRodados.toLocaleString('pt-BR')}{' '}
                            <span className="text-xs text-slate-400 font-normal">km</span>
                        </div>
                        <span className="text-xs text-purple-400 font-bold">
                            Cálculo KM Final - KM Inicial
                        </span>
                    </div>
                    <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
                        <Gauge className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                            Aprovações de Ponto Pendentes
                        </span>
                        <div className="text-2xl font-black text-amber-400 mt-1">
                            {kpis.pendingPointApprovals}
                        </div>
                        <span className="text-xs text-slate-400 font-bold">
                            {kpis.pendingPointApprovals === 0
                                ? 'Todos os pontos em dia'
                                : 'Aguardando Gestor de Tráfego'}
                        </span>
                    </div>
                    <div className="p-3 bg-amber-600/10 text-amber-400 rounded-xl">
                        <Clock className="h-7 w-7" />
                    </div>
                </Card>
            </div>

            {/* Modais */}
            <TripDetailsModal
                isOpen={isTripModalOpen}
                onClose={() => setIsTripModalOpen(false)}
                trip={selectedTrip}
                onSaveKm={handleSaveKm}
                onOpenQrCode={(t) => setQrCodeTrip(t)}
            />

            <PassengerQuickFormModal
                isOpen={isPassengerModalOpen}
                onClose={() => setIsPassengerModalOpen(false)}
            />

            <DriverQuickFormModal
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
            />

            {/* Dossiê Completo por Motorista */}
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
                onScheduleUpdated={loadSchedules}
            />

            {/* Modal de Exibição do QR Code da Viagem */}
            <Dialog open={!!qrCodeTrip} onOpenChange={() => setQrCodeTrip(null)}>
                <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-6 rounded-2xl text-center">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-white">
                            QR Code de Embarque &mdash; {qrCodeTrip?.route}
                        </DialogTitle>
                    </DialogHeader>
                    {qrCodeTrip && (
                        <div className="space-y-4 py-4">
                            <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-lg">
                                <img
                                    src={generateQrCodeSvgUri(
                                        JSON.stringify({
                                            tripId: qrCodeTrip.id,
                                            line: qrCodeTrip.lineName,
                                            route: qrCodeTrip.route,
                                            plate: qrCodeTrip.vehiclePlate,
                                            time: qrCodeTrip.time,
                                        })
                                    )}
                                    alt="QR Code da Viagem"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="text-xs text-slate-300">
                                <p className="font-bold text-white">
                                    {qrCodeTrip.route} &bull; {qrCodeTrip.time}
                                </p>
                                <p className="text-slate-400">
                                    Veículo: {qrCodeTrip.vehiclePlate} ({qrCodeTrip.driverName})
                                </p>
                                <p className="text-emerald-400 text-[11px] mt-2 font-semibold">
                                    Apresente para os passageiros escanearem ao embarcar.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperacaoDoDiaDashboard;
