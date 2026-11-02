import React, { useState, useEffect, useCallback } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    User,
    Route as RouteIcon,
    Car,
    Clock,
    Building2,
    Loader2,
    Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    scheduleService,
    Schedule,
    isScheduleActiveForDate,
    resolveScheduleRecurrence,
} from '@/services/scheduleService';
import ScheduleDayDetailsModal, { resolveScheduleHelpers } from './ScheduleDayDetailsModal';
import { parseLocalDate } from '@/utils/date-utils';

interface ScheduleCalendarTabProps {
    schedulesProp?: Schedule[];
    onRefresh?: () => void;
}

const ScheduleCalendarTab: React.FC<ScheduleCalendarTabProps> = ({
    schedulesProp,
    onRefresh
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>(schedulesProp || []);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const fetchSchedules = useCallback(async () => {
        if (schedulesProp) {
            setSchedules(schedulesProp);
            return;
        }
        setIsLoading(true);
        try {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            const calendarStart = startOfWeek(start);
            const calendarEnd = endOfWeek(end);

            const response = await scheduleService.findAll();

            const rangeSchedules = response.filter((s: Schedule) => {
                const rec = resolveScheduleRecurrence(s);
                if (rec === 'WEEKLY_FIXED' || rec === 'WEEKEND') return true;
                if (!s.scheduleDate) return false;
                const sDate = parseLocalDate(s.scheduleDate);
                return sDate >= calendarStart && sDate <= calendarEnd;
            });

            setSchedules(rangeSchedules);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentDate, schedulesProp]);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    useEffect(() => {
        const handleRealtimeUpdate = () => {
            if (onRefresh) {
                onRefresh();
            }
            fetchSchedules();
        };
        window.addEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
        window.addEventListener('storage', handleRealtimeUpdate);
        return () => {
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
            window.removeEventListener('storage', handleRealtimeUpdate);
        };
    }, [fetchSchedules, onRefresh]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    });

    const getSchedulesForDay = (date: Date) => {
        const targetStr = format(date, 'yyyy-MM-dd');
        return schedules.filter((schedule) =>
            isScheduleActiveForDate(schedule, targetStr)
        );
    };

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        setModalOpen(true);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-seguranca-graphite border border-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={prevMonth}
                        className="border-gray-600 hover:bg-gray-800"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-lg sm:text-xl font-semibold text-white capitalize min-w-[180px] text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={nextMonth}
                        className="border-gray-600 hover:bg-gray-800"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span className="text-xs text-gray-300 flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5 text-seguranca-yellow" />
                        Clique em qualquer dia para visualizar motoristas, veículos, rotas, horários e clientes
                    </span>
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-seguranca-yellow" />}
                    <Button
                        variant="secondary"
                        onClick={goToToday}
                        className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90 font-semibold"
                    >
                        Hoje
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-lg border border-gray-700 bg-seguranca-graphite overflow-hidden">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-700 bg-seguranca-black/50">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {days.map((day) => {
                        const daySchedules = getSchedulesForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const hasSchedules = daySchedules.length > 0;

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    min-h-[135px] border-b border-r border-gray-700 p-2 transition-all cursor-pointer
                                    ${!isCurrentMonth ? 'bg-seguranca-black/30 opacity-75' : 'bg-transparent'}
                                    ${isToday(day) ? 'bg-seguranca-yellow/5 border-seguranca-yellow/40' : ''}
                                    hover:bg-seguranca-yellow/10 hover:border-seguranca-yellow/60
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span
                                        className={`
                                            text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center
                                            ${
                                                isToday(day)
                                                    ? 'bg-seguranca-yellow text-seguranca-black font-bold'
                                                    : !isCurrentMonth
                                                    ? 'text-gray-500'
                                                    : 'text-gray-300'
                                            }
                                        `}
                                    >
                                        {format(day, 'd')}
                                    </span>
                                    {hasSchedules && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] h-5 px-1.5 bg-seguranca-yellow/20 border-seguranca-yellow/40 text-seguranca-yellow font-semibold"
                                        >
                                            {daySchedules.length} {daySchedules.length === 1 ? 'escala' : 'escalas'}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    {daySchedules.slice(0, 3).map((schedule) => {
                                        const info = resolveScheduleHelpers(schedule);
                                        return (
                                            <TooltipProvider key={schedule.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="text-xs p-1.5 rounded bg-seguranca-black/60 border border-gray-700 hover:border-seguranca-yellow/50 transition-colors space-y-0.5">
                                                            {/* Motorista + Horário */}
                                                            <div className="flex items-center justify-between gap-1">
                                                                <div className="flex items-center gap-1 truncate">
                                                                    <User className="h-3 w-3 shrink-0 text-seguranca-yellow" />
                                                                    <span className="truncate text-white font-semibold">
                                                                        {info.driverName}
                                                                    </span>
                                                                </div>
                                                                {(info.startTime || info.endTime) && (
                                                                    <span className="text-[9px] text-orange-300 font-mono shrink-0">
                                                                        {info.startTime || '--:--'}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Veículo + Rota */}
                                                            <div className="flex items-center justify-between gap-1 text-[10px]">
                                                                {info.vehiclePlate && (
                                                                    <span className="inline-flex items-center gap-1 text-purple-300 font-medium shrink-0">
                                                                        <Car className="h-2.5 w-2.5" />
                                                                        {info.vehiclePlate}
                                                                    </span>
                                                                )}
                                                                <span className="inline-flex items-center gap-1 text-blue-300 truncate">
                                                                    <RouteIcon className="h-2.5 w-2.5 shrink-0" />
                                                                    <span className="truncate">{info.routeDisplay}</span>
                                                                </span>
                                                            </div>

                                                            {/* Cliente */}
                                                            {info.clientDisplay && info.clientDisplay !== 'Cliente / Operação Padrão' && (
                                                                <div className="flex items-center gap-1 truncate text-[10px] text-emerald-300/90">
                                                                    <Building2 className="h-2.5 w-2.5 shrink-0" />
                                                                    <span className="truncate">{info.clientDisplay}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-seguranca-graphite border-gray-600 p-3 space-y-1.5 z-[100] pointer-events-none max-w-xs">
                                                        <p className="text-[10px] font-bold text-seguranca-yellow uppercase tracking-wider mb-1">
                                                            Detalhes da Escala (Clique no dia para ver todos)
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-seguranca-yellow shrink-0" />
                                                            <span className="text-xs font-bold text-white">
                                                                Motorista: {info.driverName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Car className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                                            <span className="text-xs text-gray-200">
                                                                Veículo: {info.vehicleDisplay}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <RouteIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                            <span className="text-xs text-gray-200">
                                                                Rota: {info.routeDisplay}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                                            <span className="text-xs text-gray-200">
                                                                Horário: {info.timeDisplay}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                                            <span className="text-xs text-gray-200">
                                                                Cliente: {info.clientDisplay}
                                                            </span>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                    {daySchedules.length > 3 && (
                                        <div className="text-[10px] text-center text-seguranca-yellow font-semibold pt-0.5">
                                            +{daySchedules.length - 3} motorista(s) escalado(s) • Clique para ver
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Schedule Details Modal ao clicar no dia */}
            <ScheduleDayDetailsModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                selectedDate={selectedDate}
                schedules={selectedDate ? getSchedulesForDay(selectedDate) : []}
                onScheduleUpdated={() => {
                    if (onRefresh) onRefresh();
                    fetchSchedules();
                }}
            />
        </div>
    );
};

export default ScheduleCalendarTab;
