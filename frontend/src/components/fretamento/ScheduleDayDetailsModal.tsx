import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    User,
    Route as RouteIcon,
    MapPin,
    Car,
    Clock,
    Building2,
    Search,
    Eye,
    Gauge,
    Users,
    Camera,
    Bus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Schedule } from '@/services/scheduleService';
import { DailyDetailsModal } from '@/components/shared/DailyDetailsModal';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';

interface ScheduleDayDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: Date | null;
    schedules: Schedule[];
    onScheduleUpdated?: () => void;
}

export const resolveScheduleHelpers = (schedule: Schedule) => {
    const driverName =
        schedule.employee?.name ||
        (schedule as any).driverName ||
        'Motorista não especificado';

    const vehiclePlate =
        schedule.vehicle?.plate ||
        schedule.vehiclePlate ||
        (schedule as any).plate ||
        '';
    const vehicleModel =
        schedule.vehicle?.model ||
        schedule.vehicleModel ||
        '';
    const vehicleDisplay = vehiclePlate
        ? vehicleModel
            ? `${vehiclePlate} • ${vehicleModel}`
            : vehiclePlate
        : vehicleModel || 'Não vinculado';

    const routeDisplay =
        schedule.routeCode ||
        schedule.route?.name ||
        schedule.travelTrip?.name ||
        schedule.workPost?.name ||
        (schedule as any).routeName ||
        'Rota não definida';

    const startTime =
        schedule.startTime ||
        schedule.workPost?.shiftStart ||
        (schedule as any).departureTime ||
        '';
    const endTime =
        schedule.endTime ||
        schedule.workPost?.shiftEnd ||
        (schedule as any).returnTime ||
        '';
    const timeDisplay =
        startTime && endTime
            ? `${startTime} às ${endTime}`
            : startTime
            ? `${startTime} (Saída)`
            : endTime
            ? `Até ${endTime}`
            : 'Horário comercial';

    const clientDisplay =
        schedule.clientName ||
        schedule.client?.name ||
        schedule.travelTrip?.client?.name ||
        (schedule.workPost as any)?.client?.name ||
        schedule.location?.name ||
        'Cliente / Operação Padrão';

    return {
        driverName,
        vehiclePlate,
        vehicleModel,
        vehicleDisplay,
        routeDisplay,
        startTime,
        endTime,
        timeDisplay,
        clientDisplay
    };
};

const ScheduleDayDetailsModal: React.FC<ScheduleDayDetailsModalProps> = ({
    open,
    onOpenChange,
    selectedDate,
    schedules,
    onScheduleUpdated
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);

    const filteredSchedules = useMemo(() => {
        if (!searchQuery.trim()) return schedules;
        const q = searchQuery.toLowerCase();
        return schedules.filter((schedule) => {
            const info = resolveScheduleHelpers(schedule);
            return (
                info.driverName.toLowerCase().includes(q) ||
                info.vehicleDisplay.toLowerCase().includes(q) ||
                info.routeDisplay.toLowerCase().includes(q) ||
                info.timeDisplay.toLowerCase().includes(q) ||
                info.clientDisplay.toLowerCase().includes(q)
            );
        });
    }, [schedules, searchQuery]);

    const daySummary = useMemo(() => {
        const drivers = new Set<string>();
        const vehicles = new Set<string>();
        const routes = new Set<string>();
        const clients = new Set<string>();

        schedules.forEach((s) => {
            const info = resolveScheduleHelpers(s);
            if (info.driverName && info.driverName !== 'Motorista não especificado') {
                drivers.add(info.driverName);
            }
            if (info.vehiclePlate) {
                vehicles.add(info.vehiclePlate);
            }
            if (info.routeDisplay && info.routeDisplay !== 'Rota não definida') {
                routes.add(info.routeDisplay);
            }
            if (info.clientDisplay && info.clientDisplay !== 'Cliente / Operação Padrão') {
                clients.add(info.clientDisplay);
            }
        });

        return {
            driversCount: drivers.size,
            vehiclesCount: vehicles.size,
            routesCount: routes.size,
            clientsCount: clients.size
        };
    }, [schedules]);

    if (!selectedDate) return null;

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            CONFIRMED: { label: 'Confirmada', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            IN_PROGRESS: { label: 'Em Andamento', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
            COMPLETED: { label: 'Concluída', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
            CANCELLED: { label: 'Cancelada', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
            PENDING: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    const getShiftLabel = (shift: string) => {
        const shiftLabels: Record<string, string> = {
            DAY: 'Diurno',
            NIGHT: 'Noturno',
            MIXED: 'Misto'
        };
        return shiftLabels[shift] || shift || 'Diurno';
    };

    const dateLabel = format(selectedDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <>
            <DailyDetailsModal
                open={open}
                onOpenChange={onOpenChange}
                title="Motoristas, Veículos, Rotas, Horários e Clientes Escalados no Dia"
                dateLabel={dateLabel}
                icon={Bus}
            >
                <div className="space-y-4">
                    {/* Resumo Operacional do Dia */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="rounded-xl bg-seguranca-black/70 border border-yellow-500/30 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-yellow-300/80 font-bold flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-seguranca-yellow" />
                                Motoristas Escalados
                            </span>
                            <p className="text-xl font-bold text-white mt-1">{daySummary.driversCount}</p>
                            <p className="text-[11px] text-gray-400">{schedules.length} escala(s) no dia</p>
                        </div>

                        <div className="rounded-xl bg-seguranca-black/70 border border-purple-500/30 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-purple-300/80 font-bold flex items-center gap-1.5">
                                <Car className="h-3.5 w-3.5 text-purple-400" />
                                Veículos Escalados
                            </span>
                            <p className="text-xl font-bold text-purple-300 mt-1">{daySummary.vehiclesCount}</p>
                            <p className="text-[11px] text-gray-400">Frota alocada</p>
                        </div>

                        <div className="rounded-xl bg-seguranca-black/70 border border-blue-500/30 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-blue-300/80 font-bold flex items-center gap-1.5">
                                <RouteIcon className="h-3.5 w-3.5 text-blue-400" />
                                Rotas / Percursos
                            </span>
                            <p className="text-xl font-bold text-blue-300 mt-1">{daySummary.routesCount}</p>
                            <p className="text-[11px] text-gray-400">Linhas ativas</p>
                        </div>

                        <div className="rounded-xl bg-seguranca-black/70 border border-emerald-500/30 p-3">
                            <span className="text-[10px] uppercase tracking-wider text-emerald-300/80 font-bold flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-emerald-400" />
                                Clientes Atendidos
                            </span>
                            <p className="text-xl font-bold text-emerald-300 mt-1">{daySummary.clientsCount}</p>
                            <p className="text-[11px] text-gray-400">Empresas / contratos</p>
                        </div>
                    </div>

                    {/* Busca Rápida no Dia */}
                    {schedules.length > 0 && (
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filtrar no dia por motorista, placa do veículo, rota, horário ou cliente..."
                                className="pl-9 bg-seguranca-black border-gray-700 text-white placeholder:text-gray-400 h-9 text-xs"
                            />
                        </div>
                    )}

                    {filteredSchedules.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 bg-seguranca-black/30 rounded-lg border border-gray-800">
                            <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p className="text-lg">
                                {schedules.length === 0
                                    ? 'Nenhum motorista ou veículo escalado para este dia'
                                    : 'Nenhuma escala encontrada para o filtro informado'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredSchedules.map((schedule) => {
                                const info = resolveScheduleHelpers(schedule);
                                let photosCount = 0;
                                if (schedule.tripPhotosJson) {
                                    try {
                                        const parsed = JSON.parse(schedule.tripPhotosJson);
                                        if (Array.isArray(parsed)) photosCount = parsed.length;
                                    } catch {
                                        photosCount = 0;
                                    }
                                }

                                return (
                                    <Card
                                        key={schedule.id}
                                        className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow/50 transition-all group"
                                    >
                                        <CardContent className="p-4">
                                            {/* Cabeçalho: Motorista Escalado + Botão de Atividades + Status */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-full bg-seguranca-yellow/20 flex items-center justify-center border border-seguranca-yellow/30 shrink-0">
                                                        <User className="w-5 h-5 text-seguranca-yellow" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setInspectedDriver({
                                                                        id: schedule.employeeId || schedule.employee?.id,
                                                                        name: info.driverName
                                                                    })
                                                                }
                                                                className="text-base sm:text-lg font-bold text-white hover:text-seguranca-yellow transition-colors flex items-center gap-1.5 text-left"
                                                                title="Clique para abrir todas as atividades, fotos e mapa de rota deste motorista"
                                                            >
                                                                <span className="underline decoration-dotted underline-offset-4">
                                                                    {info.driverName}
                                                                </span>
                                                                <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                                                            </button>
                                                            <Badge className="bg-gray-800 text-gray-300 border-gray-700 text-[10px]">
                                                                Turno: {getShiftLabel(schedule.shift)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Clique no motorista para ver atividades, fotos e mapa de trajeto
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-start sm:self-center">
                                                    {schedule.direction && (
                                                        <Badge
                                                            className={
                                                                schedule.direction === 'RETORNO'
                                                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]'
                                                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                                                            }
                                                        >
                                                            {schedule.direction === 'RETORNO' ? '↩ Retorno' : '➔ Ida'}
                                                        </Badge>
                                                    )}
                                                    {getStatusBadge(schedule.status)}
                                                </div>
                                            </div>

                                            {/* Grade Principal: Veículo, Rota, Horário e Cliente */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                                {/* Veículo */}
                                                <div className="flex items-start gap-2.5 bg-seguranca-graphite/50 p-3 rounded-lg border border-purple-500/25">
                                                    <Car className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-purple-300/80 uppercase font-bold tracking-wider mb-0.5">
                                                            Veículo Escalado
                                                        </p>
                                                        <p className="text-white font-bold truncate">
                                                            {info.vehiclePlate || 'Não informado'}
                                                        </p>
                                                        {info.vehicleModel && (
                                                            <p className="text-[11px] text-gray-400 truncate">
                                                                {info.vehicleModel}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Rota */}
                                                <div className="flex items-start gap-2.5 bg-seguranca-graphite/50 p-3 rounded-lg border border-blue-500/25">
                                                    <RouteIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-blue-300/80 uppercase font-bold tracking-wider mb-0.5">
                                                            Rota / Percurso
                                                        </p>
                                                        <p className="text-white font-bold truncate" title={info.routeDisplay}>
                                                            {info.routeDisplay}
                                                        </p>
                                                        {schedule.workPost?.postCode && (
                                                            <p className="text-[11px] text-gray-400 truncate">
                                                                Posto: {schedule.workPost.postCode}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Horário */}
                                                <div className="flex items-start gap-2.5 bg-seguranca-graphite/50 p-3 rounded-lg border border-orange-500/25">
                                                    <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-orange-300/80 uppercase font-bold tracking-wider mb-0.5">
                                                            Horário da Escala
                                                        </p>
                                                        <p className="text-white font-bold">
                                                            {info.timeDisplay}
                                                        </p>
                                                        <p className="text-[11px] text-gray-400">
                                                            Turno {getShiftLabel(schedule.shift)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Cliente */}
                                                <div className="flex items-start gap-2.5 bg-seguranca-graphite/50 p-3 rounded-lg border border-emerald-500/25">
                                                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] text-emerald-300/80 uppercase font-bold tracking-wider mb-0.5">
                                                            Cliente / Empresa
                                                        </p>
                                                        <p className="text-white font-bold truncate" title={info.clientDisplay}>
                                                            {info.clientDisplay}
                                                        </p>
                                                        {schedule.location?.name && schedule.location.name !== info.clientDisplay && (
                                                            <p className="text-[11px] text-gray-400 truncate">
                                                                Local: {schedule.location.name}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Informações operacionais extras se o motorista já iniciou/finalizou */}
                                            {(schedule.initialKm !== undefined ||
                                                schedule.finalKm !== undefined ||
                                                schedule.passengersCount !== undefined ||
                                                schedule.startAddress ||
                                                schedule.endAddress ||
                                                photosCount > 0) && (
                                                <div className="mt-3 pt-2.5 border-t border-gray-800/80 flex flex-wrap items-center gap-3 text-xs text-gray-300">
                                                    {(schedule.initialKm !== undefined || schedule.finalKm !== undefined) && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
                                                            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                                                            KM: <strong>{schedule.initialKm ?? '—'}</strong> →{' '}
                                                            <strong>{schedule.finalKm ?? 'em curso'}</strong>
                                                        </span>
                                                    )}
                                                    {schedule.passengersCount !== undefined && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-700">
                                                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                                                            Passageiros: <strong>{schedule.passengersCount}</strong>
                                                        </span>
                                                    )}
                                                    {photosCount > 0 && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                                                            <Camera className="w-3.5 h-3.5" />
                                                            {photosCount} foto(s)
                                                        </span>
                                                    )}
                                                    {schedule.startAddress && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 truncate max-w-full">
                                                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                                            Saída: {schedule.startAddress}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Observações */}
                                            {schedule.observations && (
                                                <div className="mt-3 p-2.5 bg-seguranca-graphite/20 rounded border-l-2 border-seguranca-yellow/30">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">
                                                        Observações
                                                    </p>
                                                    <p className="text-xs text-gray-300 italic">"{schedule.observations}"</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 mt-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </DailyDetailsModal>

            {/* Dossiê Completo por Motorista ao clicar no nome dentro do dia do calendário */}
            <DriverActivityInspectorModal
                isOpen={Boolean(inspectedDriver)}
                onClose={() => setInspectedDriver(null)}
                driverId={inspectedDriver?.id}
                driverName={inspectedDriver?.name || ''}
                initialSchedules={schedules.filter(
                    (e) =>
                        (inspectedDriver?.id && (e.employeeId === inspectedDriver.id || e.employee?.id === inspectedDriver.id)) ||
                        (inspectedDriver?.name &&
                            resolveScheduleHelpers(e).driverName.trim().toLowerCase() ===
                                inspectedDriver.name.trim().toLowerCase())
                )}
                onScheduleUpdated={onScheduleUpdated}
            />
        </>
    );
};

export default ScheduleDayDetailsModal;
