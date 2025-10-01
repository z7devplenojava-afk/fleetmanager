import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Route,
  Eye,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { Visit, VisitSchedule, VisitStatus, VisitScheduleStatus } from '@/types/visit';

interface VisitCalendarProps {
  visits: Visit[];
  schedules: VisitSchedule[];
  onVisitClick?: (visit: Visit) => void;
  onScheduleClick?: (schedule: VisitSchedule) => void;
  onDateClick?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  visits: Visit[];
  schedules: VisitSchedule[];
}

const VisitCalendar: React.FC<VisitCalendarProps> = ({
  visits,
  schedules,
  onVisitClick,
  onScheduleClick,
  onDateClick
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week'); // Revertido para 'week'
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    showVisits: true,
    showSchedules: true,
    status: 'all' as 'all' | 'pending' | 'completed' | 'cancelled'
  });

  // Navegação do calendário
  const goToPreviousMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      // Semana anterior
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    }
    
    // Limpar a data selecionada ao navegar
    setSelectedDate(null);
    
    // Notificar sobre a mudança de data
    if (onDateClick) {
      onDateClick(new Date(currentDate));
    }
  };

  const goToNextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      // Próxima semana
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    }
    
    // Limpar a data selecionada ao navegar
    setSelectedDate(null);
    
    // Notificar sobre a mudança de data
    if (onDateClick) {
      onDateClick(new Date(currentDate));
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  // Funções auxiliares
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getVisitsForDate = useCallback((date: Date) => {
    if (!filters.showVisits) return [];
    
    return visits.filter(visit => {
      const visitDate = new Date(visit.visitDate);
      const dateMatch = isSameDate(visitDate, date);
      
      if (!dateMatch) return false;
      
      if (filters.status === 'all') return true;
      
      const statusMatch = 
        (filters.status === 'pending' && (visit.status === 'PENDING' || visit.status === 'DRAFT')) ||
        (filters.status === 'completed' && (visit.status === 'COMPLETED' || visit.status === 'ACTIVE')) ||
        (filters.status === 'cancelled' && visit.status === 'CANCELLED');
        
      return statusMatch;
    });
  }, [visits, filters]);

  const getSchedulesForDate = useCallback((date: Date) => {
    if (!filters.showSchedules) return [];
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduleDate);
      const dateMatch = isSameDate(scheduleDate, date);
      
      if (!dateMatch) return false;
      
      if (filters.status === 'all') return true;
      
      const statusMatch = 
        (filters.status === 'pending' && (schedule.status === 'PENDING' || schedule.status === 'DRAFT')) ||
        (filters.status === 'completed' && (schedule.status === 'COMPLETED' || schedule.status === 'ACTIVE')) ||
        (filters.status === 'cancelled' && schedule.status === 'CANCELLED');
        
      return statusMatch;
    });
  }, [schedules, filters]);

  // Gerar dias do calendário para o mês atual ou semana atual
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const days: CalendarDay[] = [];
    
    if (viewMode === 'month') {
      // Visualização mensal
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const firstDayOfWeek = firstDay.getDay();
      
      // Dias do mês anterior
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = new Date(year, month, -i);
        days.push({
          date,
          isCurrentMonth: false,
          isToday: isToday(date),
          visits: getVisitsForDate(date),
          schedules: getSchedulesForDate(date)
        });
      }
      
      // Dias do mês atual
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        days.push({
          date,
          isCurrentMonth: true,
          isToday: isToday(date),
          visits: getVisitsForDate(date),
          schedules: getSchedulesForDate(date)
        });
      }
      
      // Dias do próximo mês
      const remainingDays = 42 - days.length;
      for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day);
        days.push({
          date,
          isCurrentMonth: false,
          isToday: isToday(date),
          visits: getVisitsForDate(date),
          schedules: getSchedulesForDate(date)
        });
      }
    } else {
      // Visualização semanal
      // Encontrar o domingo da semana atual
      const currentDay = new Date(currentDate);
      const dayOfWeek = currentDay.getDay();
      const diff = currentDay.getDate() - dayOfWeek;
      const firstDayOfWeek = new Date(currentDay.setDate(diff));
      
      // Gerar os 7 dias da semana
      for (let i = 0; i < 7; i++) {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + i);
        days.push({
          date,
          isCurrentMonth: date.getMonth() === month,
          isToday: isToday(date),
          visits: getVisitsForDate(date),
          schedules: getSchedulesForDate(date)
        });
      }
    }
    
    return days;
  }, [currentDate, getVisitsForDate, getSchedulesForDate, viewMode]);

  const getStatusColor = (status: VisitStatus | VisitScheduleStatus) => {
    switch (status) {
      case 'COMPLETED':
      case 'ACTIVE':
        return 'bg-green-600';
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-600';
      case 'CANCELLED':
        return 'bg-red-600';
      case 'IN_PROGRESS':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatMonthYear = (date: Date) => {
    if (viewMode === 'month') {
      return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
      // Para visualização semanal, mostrar o intervalo de datas
      const dayOfWeek = date.getDay();
      const diff = date.getDate() - dayOfWeek;
      const firstDayOfWeek = new Date(date);
      firstDayOfWeek.setDate(diff);
      
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      
      const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      return `${firstDayOfWeek.toLocaleDateString('pt-BR', formatOptions)} - ${lastDayOfWeek.toLocaleDateString('pt-BR', formatOptions)}, ${date.getFullYear()}`;
    }
  };

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateClick?.(day.date);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="space-y-4">
      {/* Header do Calendário */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-seguranca-lightgray capitalize">
            {formatMonthYear(currentDate)}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700 h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700 h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle de filtros */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700 ${
              showFilters ? 'bg-gray-700' : ''
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          
          {/* Modo de visualização */}
          <div className="flex items-center border border-gray-600 rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('month')}
              className={`rounded-none border-r border-gray-600 h-8 ${
                viewMode === 'month' 
                  ? 'bg-seguranca-darkred text-white' 
                  : 'text-seguranca-lightgray hover:bg-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('week')}
              className={`rounded-none h-8 ${
                viewMode === 'week' 
                  ? 'bg-seguranca-darkred text-white' 
                  : 'text-seguranca-lightgray hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            onClick={goToToday}
            className="bg-seguranca-darkred hover:bg-seguranca-red text-white"
            size="sm"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Hoje
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <h3 className="text-sm font-medium text-seguranca-lightgray mb-3">Filtros de Visualização</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.showSchedules}
                  onChange={(e) => setFilters(prev => ({ ...prev, showSchedules: e.target.checked }))}
                  className="rounded border-gray-600 bg-seguranca-black text-seguranca-yellow focus:ring-seguranca-yellow"
                />
                Mostrar Escalas
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={filters.showVisits}
                  onChange={(e) => setFilters(prev => ({ ...prev, showVisits: e.target.checked }))}
                  className="rounded border-gray-600 bg-seguranca-black text-seguranca-yellow focus:ring-seguranca-yellow"
                />
                Mostrar Visitas
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-gray-400">Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray text-sm p-2"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({ showVisits: true, showSchedules: true, status: 'all' })}
                variant="outline"
                size="sm"
                className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid do Calendário */}
      <div className="bg-seguranca-black rounded-lg border border-gray-600 overflow-hidden">
        {/* Header dos dias da semana */}
        <div className="grid grid-cols-7 border-b border-gray-600">
          {weekDays.map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-medium text-gray-400 bg-seguranca-graphite"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid dos dias */}
        {viewMode === 'month' ? (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-700 cursor-pointer transition-colors relative ${
                  day.isCurrentMonth 
                    ? 'bg-seguranca-black hover:bg-gray-800/50' 
                    : 'bg-gray-900/30 text-gray-500'
                } ${
                  selectedDate && isSameDate(day.date, selectedDate)
                    ? 'ring-2 ring-seguranca-yellow'
                    : ''
                } ${
                  day.isToday ? 'bg-seguranca-yellow/5 border-seguranca-yellow/30' : ''
                }`}
                onClick={() => handleDateClick(day)}
              >
                {/* Número do dia */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    day.isToday 
                      ? 'text-seguranca-yellow font-bold'
                      : day.isCurrentMonth 
                        ? 'text-seguranca-lightgray' 
                        : 'text-gray-500'
                  }`}>
                    {day.date.getDate()}
                  </span>
                  
                  {day.isToday && (
                    <div className="w-2 h-2 bg-seguranca-yellow rounded-full"></div>
                  )}
                </div>

                {/* Escalas do dia */}
                <div className="space-y-1">
                  {day.schedules.map((schedule, scheduleIndex) => (
                    <div
                      key={scheduleIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick?.(schedule);
                      }}
                      className={`px-2 py-1 rounded text-xs text-white cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(schedule.status)}`}
                      title={`Escala: ${schedule.supervisorName || 'N/A'} - ${schedule.clientName || 'N/A'} ${schedule.startTime || ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        <span className="truncate">
                          {schedule.supervisorName || 'Supervisor'} ({schedule.startTime?.substring(0, 5)})
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Visitas do dia */}
                  {day.visits.map((visit, visitIndex) => (
                    <div
                      key={visitIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVisitClick?.(visit);
                      }}
                      className={`px-2 py-1 rounded text-xs text-white cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(visit.status)}`}
                      title={`Visita: ${visit.supervisorName || 'N/A'} - ${visit.unitName || 'N/A'} ${visit.scheduledTime || ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {visit.unitName || 'Unidade'} ({visit.scheduledTime?.substring(0, 5)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Indicador de múltiplos eventos */}
                {(day.schedules.length + day.visits.length) > 3 && (
                  <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                    +{(day.schedules.length + day.visits.length) - 3}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Visualização semanal */
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => (
              <div 
                key={index}
                className={`border-r border-b border-gray-700 p-2 ${day.isToday ? 'bg-seguranca-yellow/5' : ''}`}
              >
                <div className="text-center mb-3">
                  <div className="text-sm font-medium text-gray-400">{weekDays[day.date.getDay()]}</div>
                  <div className={`text-xl font-bold ${day.isToday ? 'text-seguranca-yellow' : 'text-seguranca-lightgray'}`}>
                    {day.date.getDate()}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {/* Escalas do dia */}
                  {day.schedules.map((schedule, scheduleIndex) => (
                    <div
                      key={scheduleIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onScheduleClick?.(schedule);
                      }}
                      className={`px-2 py-1 rounded text-xs text-white cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(schedule.status)}`}
                      title={`Escala: ${schedule.clientName || 'N/A'} - ${schedule.supervisorName || 'N/A'} (${schedule.startTime?.substring(0, 5) || ''})`}
                    >
                      <div className="flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        <span className="truncate">
                          {schedule.clientName || 'Cliente'} ({schedule.startTime?.substring(0, 5)})
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Visitas do dia */}
                  {day.visits.map((visit, visitIndex) => (
                    <div
                      key={visitIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        onVisitClick?.(visit);
                      }}
                      className={`px-2 py-1 rounded text-xs text-white cursor-pointer transition-opacity hover:opacity-80 ${getStatusColor(visit.status)}`}
                      title={`Visita: ${visit.unitName || 'N/A'} - ${visit.supervisorName || 'N/A'} (${visit.scheduledTime?.substring(0, 5) || ''})`}
                    >
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {visit.unitName || 'Unidade'} ({visit.scheduledTime?.substring(0, 5)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legenda e Estatísticas */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded"></div>
            <span className="text-gray-400">Completo/Ativo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-600 rounded"></div>
            <span className="text-gray-400">Pendente/Rascunho</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-gray-400">Em Progresso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded"></div>
            <span className="text-gray-400">Cancelado</span>
          </div>
        </div>
        
        {/* Estatísticas do mês */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Route className="w-4 h-4" />
            <span>{schedules.length} Escalas</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{visits.length} Visitas</span>
          </div>
        </div>
      </div>

      {/* Detalhes do dia selecionado */}
      {selectedDate && (
        <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-seguranca-lightgray mb-3">
            {selectedDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Escalas do dia */}
            <div>
              <h4 className="text-sm font-medium text-seguranca-yellow mb-2 flex items-center gap-2">
                <Route className="w-4 h-4" />
                Escalas ({getSchedulesForDate(selectedDate).length})
              </h4>
              <div className="space-y-2">
                {getSchedulesForDate(selectedDate).map((schedule, index) => (
                  <div
                    key={index}
                    onClick={() => onScheduleClick?.(schedule)}
                    className="p-3 bg-seguranca-black border border-gray-700 rounded cursor-pointer hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-seguranca-lightgray">
                        {schedule.supervisorName || 'Supervisor não definido'}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(schedule.status)} text-white`}>
                        {schedule.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      Cliente: {schedule.clientName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Unidades: {schedule.unitIds?.length || 0}
                    </p>
                  </div>
                ))}
                {getSchedulesForDate(selectedDate).length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma escala programada</p>
                )}
              </div>
            </div>

            {/* Visitas do dia */}
            <div>
              <h4 className="text-sm font-medium text-seguranca-yellow mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Visitas ({getVisitsForDate(selectedDate).length})
              </h4>
              <div className="space-y-2">
                {getVisitsForDate(selectedDate).map((visit, index) => (
                  <div
                    key={index}
                    onClick={() => onVisitClick?.(visit)}
                    className="p-3 bg-seguranca-black border border-gray-700 rounded cursor-pointer hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-seguranca-lightgray">
                        {visit.unitName || 'Unidade não definida'}
                      </span>
                      <Badge className={`text-xs ${getStatusColor(visit.status)} text-white`}>
                        {visit.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supervisor: {visit.supervisorName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      Horário: {visit.scheduledTime || 'N/A'}
                    </p>
                  </div>
                ))}
                {getVisitsForDate(selectedDate).length === 0 && (
                  <p className="text-sm text-gray-500">Nenhuma visita programada</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitCalendar;