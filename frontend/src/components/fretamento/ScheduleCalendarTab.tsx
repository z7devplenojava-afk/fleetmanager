
import React, { useState, useEffect } from 'react';
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
    MapPin,
    Car,
    Clock,
    Calendar as CalendarIcon,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { scheduleService, Schedule } from '@/services/scheduleService';
import ScheduleDayDetailsModal from './ScheduleDayDetailsModal';
import { parseLocalDate } from '@/utils/date-utils';

const ScheduleCalendarTab: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchSchedules();
    }, [currentDate]);

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            const start = startOfMonth(currentDate);
            const end = endOfMonth(currentDate);
            // Ensure we get the full range including days from prev/next months that appear on the calendar
            const calendarStart = startOfWeek(start);
            const calendarEnd = endOfWeek(end);

            const response = await scheduleService.findAll(); // Custom method to get all schedules

            // Filter client-side if backend doesn't support range yet (optimization for later)
            // For now, let's assume we get relevant schedules or filter them here
            const rangeSchedules = response.filter((s: any) => {
                const sDate = parseLocalDate(s.scheduleDate);
                return sDate >= calendarStart && sDate <= calendarEnd;
            });

            setSchedules(rangeSchedules);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentDate)),
        end: endOfWeek(endOfMonth(currentDate))
    });

    const getSchedulesForDay = (date: Date) => {
        return schedules.filter(schedule =>
            isSameDay(parseLocalDate(schedule.scheduleDate), date)
        );
    };

    const handleDayClick = (date: Date, daySchedules: Schedule[]) => {
        setSelectedDate(date);
        setModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            case 'COMPLETED': return 'bg-green-500/20 text-green-300 border-green-500/30';
            case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30';
            default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-seguranca-graphite border border-gray-700 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={prevMonth} className="border-gray-600 hover:bg-gray-800">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold text-white capitalize min-w-[200px] text-center">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="border-gray-600 hover:bg-gray-800">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-seguranca-yellow" />}
                    <Button variant="secondary" onClick={goToToday} className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90">
                        Hoje
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-lg border border-gray-700 bg-seguranca-graphite overflow-hidden">
                {/* Week Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-700 bg-seguranca-black/50">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-400">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {days.map((day, dayIdx) => {
                        const daySchedules = getSchedulesForDay(day);
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const hasSchedules = daySchedules.length > 0;

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day, daySchedules)}
                                className={`
                  min-h-[120px] border-b border-r border-gray-700 p-2 transition-all
                  ${!isCurrentMonth ? 'bg-seguranca-black/30' : 'bg-transparent'}
                  ${isToday(day) ? 'bg-seguranca-yellow/5 border-seguranca-yellow/40' : ''}
                  ${isCurrentMonth ? 'cursor-pointer hover:bg-seguranca-yellow/10 hover:border-seguranca-yellow/60' : ''}
                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`
                    text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center
                    ${isToday(day)
                                            ? 'bg-seguranca-yellow text-seguranca-black font-bold'
                                            : !isCurrentMonth ? 'text-gray-600' : 'text-gray-300'}
                  `}>
                                        {format(day, 'd')}
                                    </span>
                                    {hasSchedules && (
                                        <Badge
                                            variant="outline"
                                            className="text-[10px] h-5 px-1.5 bg-seguranca-yellow/20 border-seguranca-yellow/40 text-seguranca-yellow font-semibold"
                                        >
                                            {daySchedules.length}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    {daySchedules.slice(0, 3).map((schedule) => (
                                        <TooltipProvider key={schedule.id}>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className="text-xs p-1.5 rounded bg-seguranca-black/40 border border-gray-700 hover:border-seguranca-yellow/50 transition-colors cursor-help"
                                                    >
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <User className="h-3 w-3 shrink-0 text-seguranca-yellow" />
                                                            <span className="truncate text-gray-200 font-medium">
                                                                {schedule.employee?.name || 'Sem motorista'}
                                                            </span>
                                                        </div>
                                                        {schedule.route && (
                                                            <div className="flex items-center gap-1.5 truncate mt-1 text-gray-400">
                                                                <RouteIcon className="h-2.5 w-2.5 shrink-0" />
                                                                <span className="truncate text-[10px]">{schedule.route.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent className="bg-seguranca-graphite border-gray-600 p-3 space-y-2 z-[100] pointer-events-none">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-seguranca-yellow uppercase tracking-wider mb-1">Detalhes da Escala</p>
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-sm font-semibold text-white">{schedule.employee?.name}</span>
                                                        </div>
                                                        {schedule.route && (
                                                            <div className="flex items-center gap-2">
                                                                <RouteIcon className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-xs text-gray-300">Rota: {schedule.route.name}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                            <span className="text-xs text-gray-300">
                                                                Cliente: {schedule.client?.name || schedule.travelTrip?.client?.name || (schedule.workPost as any)?.client?.name || schedule.location?.name || '—'}
                                                            </span>
                                                        </div>
                                                        {(schedule.workPost?.shiftStart || schedule.workPost?.shiftEnd) && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                <span className="text-xs text-gray-300">
                                                                    Horário: {schedule.workPost?.shiftStart || '--:--'} às {schedule.workPost?.shiftEnd || '--:--'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ))}
                                    {daySchedules.length > 3 && (
                                        <div className="text-[10px] text-center text-seguranca-yellow/70 font-medium pt-1">
                                            +{daySchedules.length - 3} mais
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Schedule Details Modal */}
            <ScheduleDayDetailsModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                selectedDate={selectedDate}
                schedules={selectedDate ? getSchedulesForDay(selectedDate) : []}
            />
        </div>
    );
};

export default ScheduleCalendarTab;
