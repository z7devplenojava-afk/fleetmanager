'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import tripService, { TripEventDTO } from '@/services/tripService';
import {
    scheduleService,
    Schedule,
    resolveScheduleRecurrence,
    resolveScheduleStartTime,
    resolveScheduleEndTime,
    inferDirectionFromRouteCode,
} from '@/services/scheduleService';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Play,
    AlertTriangle,
    Clock,
    Search,
    RefreshCw,
    Gauge,
    Users,
    Camera,
    MapPin,
    CheckCircle2,
    Calendar,
    Building2,
    Route as RouteIcon,
    Eye,
    Bus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/date-utils';

interface UnifiedDriverHistoryItem {
    id: string;
    source: 'SCHEDULE' | 'DAILY_SHEET' | 'TRIP_EVENT';
    eventType: string;
    eventLabel: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING_APPROVAL' | 'SCHEDULED' | 'EVENT';
    dateStr: string; // YYYY-MM-DD
    startTime: string;
    endTime: string;
    registeredAt?: string;
    driverId?: string;
    driverName: string;
    clientName: string;
    routeName: string;
    direction?: 'IDA' | 'RETORNO';
    recurrence?: 'WEEKLY_FIXED' | 'WEEKEND' | 'SINGLE_DAY';
    vehiclePlate: string;
    vehicleModel?: string;
    initialKm?: number;
    finalKm?: number;
    distanceKm?: number;
    passengersCount?: number;
    photosCount: number;
    startAddress?: string;
    endAddress?: string;
    observations?: string;
    rawSchedule?: Schedule;
}

function getDailySheetHistoryItems(): UnifiedDriverHistoryItem[] {
    const items: UnifiedDriverHistoryItem[] = [];
    if (typeof window === 'undefined') return items;

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('driverDailySheet_v2_')) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const header = parsed?.header || {};
            const driverName = header.driverName || parsed.driverName || 'Motorista';
            const dateStr = header.date || parsed.date || new Date().toISOString().substring(0, 10);
            const vehiclePlate = header.vehicle || header.vehiclePlate || parsed.vehiclePlate || '—';
            const rows = Array.isArray(parsed?.rows) ? parsed.rows : [];

            rows.forEach((row: any, idx: number) => {
                const comp = row.companyName || row.company || '';
                const startKmStr = row.startKm ?? row.kmStart ?? '';
                const endKmStr = row.endKm ?? row.kmEnd ?? '';
                const startTimeStr = row.startTime || '';
                if (!comp && !startKmStr && !endKmStr && !startTimeStr) return;

                const kmIni = startKmStr !== '' && startKmStr != null ? Number(startKmStr) : undefined;
                const kmFim = endKmStr !== '' && endKmStr != null ? Number(endKmStr) : undefined;
                const dist =
                    kmIni != null && kmFim != null && kmFim >= kmIni ? kmFim - kmIni : undefined;
                const pax =
                    row.passengers !== '' && row.passengers != null ? Number(row.passengers) : undefined;

                items.push({
                    id: `daily-sheet-${key}-${row.id || idx}`,
                    source: 'DAILY_SHEET',
                    eventType: kmFim != null ? 'TRIP_END' : 'TRIP_START',
                    eventLabel: kmFim != null ? 'Percurso Concluído (Quadro Diário)' : 'Percurso em Execução (Quadro Diário)',
                    status: kmFim != null ? 'COMPLETED' : kmIni != null ? 'IN_PROGRESS' : 'SCHEDULED',
                    dateStr,
                    startTime: row.startTime || '--:--',
                    endTime: row.endTime || '--:--',
                    driverName,
                    clientName: comp || '—',
                    routeName: row.routeCode || 'Percurso Operacional',
                    direction: row.direction || inferDirectionFromRouteCode(row.routeCode),
                    vehiclePlate,
                    initialKm: kmIni,
                    finalKm: kmFim,
                    distanceKm: dist,
                    passengersCount: pax,
                    photosCount: 0,
                    observations: row.otherJustification || parsed.otherJustification || 'Registro do Formulário Diário de Percursos',
                });
            });
        }
    } catch {
        // ignore storage parse errors
    }

    return items;
}

export const HistoryTab: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [driverFilter, setDriverFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'EXECUTED' | 'IN_PROGRESS' | 'COMPLETED' | 'SCHEDULED'>('ALL');
    const [recurrenceFilter, setRecurrenceFilter] = useState<'ALL' | 'WEEKLY_FIXED' | 'WEEKEND'>('ALL');
    const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);

    const {
        data: combinedData,
        isLoading,
        refetch,
        isRefetching,
    } = useQuery({
        queryKey: ['traffic-driver-execution-history'],
        queryFn: async () => {
            const [schedulesRes, eventsRes] = await Promise.allSettled([
                scheduleService.findAll(),
                tripService.getEvents(),
            ]);

            const schedules: Schedule[] =
                schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value)
                    ? schedulesRes.value
                    : [];
            const tripEvents: TripEventDTO[] =
                eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)
                    ? eventsRes.value
                    : [];

            return { schedules, tripEvents };
        },
    });

    useEffect(() => {
        const handleRealtime = () => {
            refetch();
        };
        window.addEventListener('fluxbus:driver-records-updated', handleRealtime);
        window.addEventListener('storage', handleRealtime);
        return () => {
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtime);
            window.removeEventListener('storage', handleRealtime);
        };
    }, [refetch]);

    const historyItems = useMemo<UnifiedDriverHistoryItem[]>(() => {
        const schedules = combinedData?.schedules || [];
        const tripEvents = combinedData?.tripEvents || [];
        const list: UnifiedDriverHistoryItem[] = [];

        // 1. Converter todas as escalas e execuções reais dos motoristas
        for (const s of schedules) {
            let photosCount = 0;
            if (s.tripPhotosJson) {
                try {
                    const parsed = JSON.parse(s.tripPhotosJson);
                    if (Array.isArray(parsed)) photosCount = parsed.length;
                } catch {
                    photosCount = 0;
                }
            }

            const hasInitialKm = s.initialKm != null;
            const hasFinalKm = s.finalKm != null;
            const distanceKm =
                hasInitialKm && hasFinalKm && Number(s.finalKm) >= Number(s.initialKm)
                    ? Number(s.finalKm) - Number(s.initialKm)
                    : undefined;

            const isCompleted = s.status === 'COMPLETED' || hasFinalKm;
            const isPendingApproval = s.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
            const isInProgress =
                !isCompleted &&
                (s.status === 'IN_PROGRESS' || hasInitialKm || Boolean(s.pointRegisteredAt));

            let status: UnifiedDriverHistoryItem['status'] = 'SCHEDULED';
            let eventType = 'SCHEDULED';
            let eventLabel = 'Escala Programada';

            if (isCompleted) {
                status = 'COMPLETED';
                eventType = 'TRIP_END';
                eventLabel = 'Viagem / Rota Concluída';
            } else if (isPendingApproval) {
                status = 'PENDING_APPROVAL';
                eventType = 'POINT_PENDING';
                eventLabel = 'Ponto Registrado (Aguard. Gestor)';
            } else if (isInProgress) {
                status = 'IN_PROGRESS';
                eventType = 'TRIP_START';
                eventLabel = 'Em Execução (Ponto / KM Inicial)';
            } else if (s.status === 'CONFIRMED') {
                status = 'SCHEDULED';
                eventType = 'CONFIRMED';
                eventLabel = 'Escala Confirmada';
            }

            const routeName =
                s.routeCode ||
                s.route?.name ||
                s.travelTrip?.name ||
                s.workPost?.name ||
                s.location?.name ||
                'Rota Operacional';

            const clientName =
                s.clientName ||
                s.client?.name ||
                s.workPost?.client?.name ||
                s.travelTrip?.client?.name ||
                '—';

            const vehiclePlate = s.vehicle?.plate || s.vehiclePlate || '—';
            const direction = s.direction || inferDirectionFromRouteCode(routeName);
            const recurrence = resolveScheduleRecurrence(s);

            list.push({
                id: s.id,
                source: 'SCHEDULE',
                eventType,
                eventLabel,
                status,
                dateStr: (s.scheduleDate || '').substring(0, 10),
                startTime: resolveScheduleStartTime(s),
                endTime: resolveScheduleEndTime(s),
                registeredAt: s.pointRegisteredAt,
                driverId: s.employeeId || s.employee?.id,
                driverName: s.employee?.name || 'Motorista',
                clientName,
                routeName,
                direction,
                recurrence,
                vehiclePlate,
                vehicleModel: s.vehicle?.model || s.vehicleModel,
                initialKm: s.initialKm,
                finalKm: s.finalKm,
                distanceKm,
                passengersCount: s.passengersCount,
                photosCount,
                startAddress: s.startAddress,
                endAddress: s.endAddress,
                observations: s.pointJustification || s.observations,
                rawSchedule: s,
            });
        }

        // 2. Adicionar registros do Formulário Diário de Controle de Percursos (evitando duplicatas exatas)
        const dailyItems = getDailySheetHistoryItems();
        for (const dItem of dailyItems) {
            const alreadyInSchedules = list.some(
                (existing) =>
                    existing.dateStr === dItem.dateStr &&
                    existing.driverName.toLowerCase() === dItem.driverName.toLowerCase() &&
                    existing.startTime === dItem.startTime &&
                    existing.initialKm === dItem.initialKm
            );
            if (!alreadyInSchedules) {
                list.push(dItem);
            }
        }

        // 3. Adicionar eventos de telemetria/viagem do backend (/api/trips/events), se houver
        for (const ev of tripEvents) {
            const dt = ev.timestamp ? new Date(ev.timestamp) : new Date();
            const dateStr = !Number.isNaN(dt.getTime())
                ? format(dt, 'yyyy-MM-dd')
                : new Date().toISOString().substring(0, 10);
            const timeStr = !Number.isNaN(dt.getTime()) ? format(dt, 'HH:mm') : '--:--';

            list.push({
                id: `event-${ev.id}`,
                source: 'TRIP_EVENT',
                eventType: ev.type,
                eventLabel: ev.type === 'TRIP_START' ? 'Início de Viagem' : ev.type === 'TRIP_END' ? 'Fim de Viagem' : ev.type,
                status: ev.type === 'TRIP_END' ? 'COMPLETED' : 'IN_PROGRESS',
                dateStr,
                startTime: timeStr,
                endTime: '--:--',
                registeredAt: ev.timestamp,
                driverName: ev.driverName || 'Motorista',
                clientName: '—',
                routeName: ev.tripName || 'Rota',
                vehiclePlate: ev.vehiclePlate || '—',
                photosCount: 0,
                observations: ev.observations,
            });
        }

        // Ordenar priorizando execuções com ponto/KM registrado e datas mais recentes
        return list.sort((a, b) => {
            const aExec = a.status === 'IN_PROGRESS' || a.status === 'COMPLETED' || a.status === 'PENDING_APPROVAL' ? 1 : 0;
            const bExec = b.status === 'IN_PROGRESS' || b.status === 'COMPLETED' || b.status === 'PENDING_APPROVAL' ? 1 : 0;
            if (aExec !== bExec) return bExec - aExec;
            const dateCmp = String(b.dateStr || '').localeCompare(String(a.dateStr || ''));
            if (dateCmp !== 0) return dateCmp;
            return String(b.startTime || '').localeCompare(String(a.startTime || ''));
        });
    }, [combinedData]);

    const uniqueDrivers = useMemo(() => {
        const set = new Set<string>();
        historyItems.forEach((item) => {
            if (item.driverName && item.driverName !== 'Não informado') {
                set.add(item.driverName);
            }
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [historyItems]);

    const filteredItems = useMemo(() => {
        return historyItems.filter((item) => {
            if (driverFilter !== 'ALL' && item.driverName !== driverFilter) {
                return false;
            }
            if (statusFilter === 'EXECUTED') {
                if (item.status === 'SCHEDULED' && item.initialKm == null && !item.registeredAt) {
                    return false;
                }
            } else if (statusFilter === 'IN_PROGRESS' && item.status !== 'IN_PROGRESS' && item.status !== 'PENDING_APPROVAL') {
                return false;
            } else if (statusFilter === 'COMPLETED' && item.status !== 'COMPLETED') {
                return false;
            } else if (statusFilter === 'SCHEDULED' && item.status !== 'SCHEDULED') {
                return false;
            }

            if (recurrenceFilter === 'WEEKLY_FIXED' && item.recurrence === 'WEEKEND') {
                return false;
            }
            if (recurrenceFilter === 'WEEKEND' && item.recurrence !== 'WEEKEND') {
                return false;
            }

            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                item.driverName.toLowerCase().includes(q) ||
                item.routeName.toLowerCase().includes(q) ||
                item.clientName.toLowerCase().includes(q) ||
                item.vehiclePlate.toLowerCase().includes(q) ||
                item.eventLabel.toLowerCase().includes(q) ||
                (item.startAddress || '').toLowerCase().includes(q) ||
                (item.endAddress || '').toLowerCase().includes(q) ||
                (item.observations || '').toLowerCase().includes(q)
            );
        });
    }, [historyItems, driverFilter, statusFilter, recurrenceFilter, searchQuery]);

    // Resumo estatístico do histórico filtrado
    const summaryStats = useMemo(() => {
        let completed = 0;
        let inProgress = 0;
        let totalKmRodado = 0;
        let totalPassengers = 0;
        let totalPhotos = 0;

        filteredItems.forEach((item) => {
            if (item.status === 'COMPLETED') completed += 1;
            if (item.status === 'IN_PROGRESS' || item.status === 'PENDING_APPROVAL') inProgress += 1;
            if (item.distanceKm != null && item.distanceKm > 0) totalKmRodado += item.distanceKm;
            if (item.passengersCount != null && item.passengersCount > 0) totalPassengers += item.passengersCount;
            totalPhotos += item.photosCount || 0;
        });

        return {
            total: filteredItems.length,
            completed,
            inProgress,
            totalKmRodado,
            totalPassengers,
            totalPhotos,
        };
    }, [filteredItems]);

    const getStatusVisual = (item: UnifiedDriverHistoryItem) => {
        switch (item.status) {
            case 'COMPLETED':
                return {
                    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    iconBg: 'bg-emerald-600',
                    icon: <CheckCircle2 size={14} className="text-white" />,
                };
            case 'IN_PROGRESS':
                return {
                    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                    iconBg: 'bg-blue-600',
                    icon: <Play size={14} className="text-white" />,
                };
            case 'PENDING_APPROVAL':
                return {
                    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    iconBg: 'bg-amber-600',
                    icon: <AlertTriangle size={14} className="text-white" />,
                };
            default:
                return {
                    badgeClass: 'bg-gray-700/50 text-gray-300 border-gray-600',
                    iconBg: 'bg-gray-600',
                    icon: <Clock size={14} className="text-white" />,
                };
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            {/* Cards de Resumo do Histórico de Execução dos Motoristas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Total de Registros / Execuções</p>
                            <h4 className="text-2xl font-bold text-white mt-0.5">{summaryStats.total}</h4>
                            <p className="text-[11px] text-seguranca-yellow mt-0.5">
                                {uniqueDrivers.length} motorista(s) listado(s)
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-seguranca-yellow/15 text-seguranca-yellow">
                            <RouteIcon className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Concluídas / Em Execução</p>
                            <h4 className="text-2xl font-bold text-emerald-400 mt-0.5">
                                {summaryStats.completed}{' '}
                                <span className="text-sm text-gray-400 font-normal">/ {summaryStats.inProgress} em curso</span>
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Ponto eletrônico & rotas
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">KM Total Percorrido</p>
                            <h4 className="text-2xl font-bold text-blue-400 mt-0.5">
                                {summaryStats.totalKmRodado.toLocaleString('pt-BR')} km
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Soma de KM Final - KM Inicial
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-500/15 text-blue-400">
                            <Gauge className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400">Passageiros & Fotos</p>
                            <h4 className="text-2xl font-bold text-purple-300 mt-0.5">
                                {summaryStats.totalPassengers}{' '}
                                <span className="text-xs text-emerald-300 font-normal">
                                    • {summaryStats.totalPhotos} foto(s)
                                </span>
                            </h4>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                                Comprovação com câmera e GPS
                            </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400">
                            <Users className="w-5 h-5" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-seguranca-graphite border-gray-700 min-h-[420px]">
                <CardHeader className="space-y-3 pb-4 border-b border-gray-800">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div>
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-seguranca-yellow" />
                                Histórico Completo de Execução dos Motoristas
                            </CardTitle>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Registros de ponto eletrônico, horários (início/fim), cliente, rota, veículo, KM inicial/final, passageiros, fotos no ônibus e endereços GPS (Ida/Retorno). Clique no motorista para abrir o mapa e as fotos.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filtro por Motorista */}
                            <select
                                value={driverFilter}
                                onChange={(e) => setDriverFilter(e.target.value)}
                                className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-1.5 text-xs text-white focus:border-seguranca-yellow outline-none"
                            >
                                <option value="ALL">Todos os Motoristas ({uniqueDrivers.length})</option>
                                {uniqueDrivers.map((drv) => (
                                    <option key={drv} value={drv}>
                                        👤 {drv}
                                    </option>
                                ))}
                            </select>

                            {/* Filtro por Regime Semanal / FDS */}
                            <select
                                value={recurrenceFilter}
                                onChange={(e) => setRecurrenceFilter(e.target.value as any)}
                                className="bg-seguranca-black border border-gray-600 rounded-md px-3 py-1.5 text-xs text-white focus:border-seguranca-yellow outline-none"
                            >
                                <option value="ALL">Todos os Regimes (Semanal + FDS)</option>
                                <option value="WEEKLY_FIXED">📅 Escala Fixa Semanal</option>
                                <option value="WEEKEND">🗓️ Escala Final de Semana (FDS)</option>
                            </select>

                            {/* Busca por texto */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar motorista, placa, rota, cliente..."
                                    className="bg-seguranca-black border border-gray-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-white focus:border-seguranca-yellow outline-none w-60"
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-seguranca-black border-gray-600 text-gray-300 hover:text-white h-8"
                                onClick={() => refetch()}
                            >
                                <RefreshCw size={14} className={`mr-1.5 ${isRefetching ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                        </div>
                    </div>

                    {/* Botões rápidos de Status de Execução */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {[
                            { id: 'ALL', label: `Todos (${historyItems.length})` },
                            { id: 'EXECUTED', label: '⚡ Com Ponto / KM Registrado' },
                            { id: 'IN_PROGRESS', label: '🚌 Em Andamento' },
                            { id: 'COMPLETED', label: '✅ Concluídas (KM Final)' },
                            { id: 'SCHEDULED', label: '📅 Escalas Programadas' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all border ${
                                    statusFilter === tab.id
                                        ? 'bg-seguranca-yellow text-seguranca-black border-seguranca-yellow'
                                        : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-800 bg-seguranca-black/40 text-gray-400 text-[11px] uppercase tracking-wider">
                                    <th className="px-4 py-3 font-semibold">Execução / Status</th>
                                    <th className="px-4 py-3 font-semibold">Data & Horário</th>
                                    <th className="px-4 py-3 font-semibold">Motorista</th>
                                    <th className="px-4 py-3 font-semibold">Cliente & Rota / Percurso</th>
                                    <th className="px-4 py-3 font-semibold">Veículo</th>
                                    <th className="px-4 py-3 font-semibold">KM (Ini → Fim) & Passag.</th>
                                    <th className="px-4 py-3 font-semibold">Geolocalização GPS & Fotos</th>
                                    <th className="px-4 py-3 font-semibold text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/80">
                                {filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                                            Nenhum registro de execução encontrado para o filtro selecionado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const visual = getStatusVisual(item);
                                        const formattedDate = item.dateStr
                                            ? format(parseLocalDate(item.dateStr), 'dd/MM/yyyy', { locale: ptBR })
                                            : '—';

                                        return (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-seguranca-black/40 transition-colors text-xs"
                                            >
                                                {/* 1. Execução / Status */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className={`p-1.5 rounded-lg ${visual.iconBg} shadow-sm mt-0.5 shrink-0`}>
                                                            {visual.icon}
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Badge variant="outline" className={`text-[10px] font-semibold ${visual.badgeClass}`}>
                                                                {item.eventLabel}
                                                            </Badge>
                                                            <div className="flex items-center gap-1 flex-wrap">
                                                                {item.direction && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[9px] px-1.5 py-0 ${
                                                                            item.direction === 'IDA'
                                                                                ? 'border-blue-500/40 text-blue-300 bg-blue-500/10'
                                                                                : 'border-purple-500/40 text-purple-300 bg-purple-500/10'
                                                                        }`}
                                                                    >
                                                                        {item.direction === 'IDA' ? '➡️ IDA' : '⬅️ RETORNO'}
                                                                    </Badge>
                                                                )}
                                                                {item.recurrence && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className={`text-[9px] px-1.5 py-0 ${
                                                                            item.recurrence === 'WEEKEND'
                                                                                ? 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                                                                                : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                                                        }`}
                                                                    >
                                                                        {item.recurrence === 'WEEKEND' ? '🗓️ FDS' : '📅 Semanal'}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Data & Horário */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-gray-200 flex items-center gap-1">
                                                            <Calendar size={12} className="text-seguranca-yellow" />
                                                            {formattedDate}
                                                        </span>
                                                        <span className="font-mono text-amber-300 flex items-center gap-1">
                                                            <Clock size={11} />
                                                            {item.startTime} às {item.endTime}
                                                        </span>
                                                        {item.registeredAt && (
                                                            <span className="text-[10px] text-emerald-400">
                                                                Ponto: {format(new Date(item.registeredAt), 'HH:mm:ss')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 3. Motorista (Clicável) */}
                                                <td className="px-4 py-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setInspectedDriver({
                                                                id: item.driverId,
                                                                name: item.driverName,
                                                            })
                                                        }
                                                        className="text-left group hover:bg-seguranca-yellow/10 p-1.5 -m-1.5 rounded-lg transition-colors"
                                                    >
                                                        <div className="font-bold text-white group-hover:text-seguranca-yellow underline decoration-dotted underline-offset-4">
                                                            {item.driverName}
                                                        </div>
                                                        <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                                            <MapPin size={10} /> Ver mapa & histórico
                                                        </div>
                                                    </button>
                                                </td>

                                                {/* 4. Cliente & Rota / Percurso */}
                                                <td className="px-4 py-3 max-w-[230px]">
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold text-gray-100 truncate flex items-center gap-1.5">
                                                            <Bus size={12} className="text-seguranca-red shrink-0" />
                                                            <span className="truncate">{item.routeName}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                                                            <Building2 size={11} className="shrink-0" />
                                                            <span className="truncate">{item.clientName}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 5. Veículo */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-mono font-bold text-seguranca-yellow">
                                                        🚌 {item.vehiclePlate}
                                                    </div>
                                                    {item.vehicleModel && (
                                                        <div className="text-[10px] text-gray-400 truncate max-w-[130px]">
                                                            {item.vehicleModel}
                                                        </div>
                                                    )}
                                                </td>

                                                {/* 6. KM (Inicial -> Final) & Passageiros */}
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        {item.initialKm != null || item.finalKm != null ? (
                                                            <div className="flex items-center gap-1 text-gray-200 font-mono">
                                                                <Gauge size={12} className="text-blue-400 shrink-0" />
                                                                <span>
                                                                    {item.initialKm ?? '—'} → {item.finalKm ?? 'em curso'}
                                                                </span>
                                                                {item.distanceKm != null && (
                                                                    <Badge className="ml-1 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                                                        +{item.distanceKm} km
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-[11px]">
                                                                KM aguardando início
                                                            </span>
                                                        )}

                                                        {item.passengersCount != null && (
                                                            <div className="flex items-center gap-1 text-purple-300 text-[11px]">
                                                                <Users size={12} className="text-purple-400 shrink-0" />
                                                                <span>{item.passengersCount} passageiro(s)</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 7. Geolocalização GPS & Fotos */}
                                                <td className="px-4 py-3 max-w-[240px]">
                                                    <div className="space-y-1">
                                                        {item.startAddress && (
                                                            <div
                                                                className="text-[10px] text-gray-300 truncate flex items-center gap-1"
                                                                title={`Partida: ${item.startAddress}`}
                                                            >
                                                                <MapPin size={11} className="text-emerald-400 shrink-0" />
                                                                <span className="truncate">Ini: {item.startAddress}</span>
                                                            </div>
                                                        )}
                                                        {item.endAddress && (
                                                            <div
                                                                className="text-[10px] text-gray-300 truncate flex items-center gap-1"
                                                                title={`Chegada: ${item.endAddress}`}
                                                            >
                                                                <MapPin size={11} className="text-blue-400 shrink-0" />
                                                                <span className="truncate">Fim: {item.endAddress}</span>
                                                            </div>
                                                        )}
                                                        {item.photosCount > 0 && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-[10px] border-emerald-500/40 text-emerald-300 bg-emerald-500/10 gap-1"
                                                            >
                                                                <Camera size={10} /> {item.photosCount} foto(s) no ônibus
                                                            </Badge>
                                                        )}
                                                        {!item.startAddress && !item.endAddress && item.photosCount === 0 && (
                                                            <span className="text-[11px] text-gray-500 truncate block">
                                                                {item.observations || '—'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 8. Ações */}
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            setInspectedDriver({
                                                                id: item.driverId,
                                                                name: item.driverName,
                                                            })
                                                        }
                                                        className="h-7 px-2.5 text-[11px] bg-seguranca-black border-gray-600 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                                                    >
                                                        <Eye size={13} className="mr-1" />
                                                        Detalhes / Mapa
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Inspeção Completa do Motorista (Atividades, Fotos e Mapa de Trajeto Ida/Retorno) */}
            <DriverActivityInspectorModal
                open={Boolean(inspectedDriver)}
                onOpenChange={(open) => {
                    if (!open) setInspectedDriver(null);
                }}
                driverName={inspectedDriver?.name || ''}
                driverId={inspectedDriver?.id}
                initialSchedules={combinedData?.schedules || []}
                onRefreshParent={() => refetch()}
            />
        </div>
    );
};
