import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VisitCalendarEvent } from '@/services/visitService';

interface VisitCalendarProps {
  events: VisitCalendarEvent[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: VisitCalendarEvent) => void;
  onDayClick?: (date: Date, events: VisitCalendarEvent[]) => void;
  loading?: boolean;
}

export const VisitCalendar: React.FC<VisitCalendarProps> = ({
  events,
  selectedDate,
  onDateChange,
  onEventClick,
  onDayClick,
  loading = false,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [isMobile, setIsMobile] = useState(false);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint do Tailwind
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Função auxiliar para converter string de data (YYYY-MM-DD) para Date no timezone local
  // Isso evita problemas de timezone onde uma data pode aparecer no dia anterior
  const parseLocalDate = (dateString: string): Date => {
    // Se a data já está no formato YYYY-MM-DD, criar diretamente no timezone local
      const parts = dateString.split('-');
      if (parts.length === 3) {
        const year = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1; // Mês é 0-indexed
        const day = Number.parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    // Fallback para o método padrão
    return new Date(dateString);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Adicionar dias do mês anterior
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: []
      });
    }

    // Adicionar dias do mês atual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day, 0, 0, 0, 0);
      const dayEvents = events.filter(event => {
        if (!event.date) return false;
        
        const eventDate = parseLocalDate(event.date);
        // Normalizar ambas as datas para comparação (meia-noite do dia)
        eventDate.setHours(0, 0, 0, 0);
        
        const matches = eventDate.getFullYear() === dayDate.getFullYear() &&
                        eventDate.getMonth() === dayDate.getMonth() &&
                        eventDate.getDate() === dayDate.getDate();
        
        // Log apenas para o dia 11 e 12 para debug
        if (day === 11 || day === 12) {
          console.log(`🔍 Dia ${day} - Comparando evento:`, {
            eventId: event.id,
            eventDateStr: event.date,
            eventDateParsed: eventDate.toISOString().split('T')[0],
            dayDate: dayDate.toISOString().split('T')[0],
            matches
          });
        }
        
        return matches;
      });

      // Log apenas para o dia 11 e 12 para debug
      if (day === 11 || day === 12) {
        console.log(`📅 Dia ${day} do mês ${month + 1}/${year}:`, {
          dayDate: dayDate.toISOString().split('T')[0],
          eventsCount: dayEvents.length,
          eventIds: dayEvents.map(e => e.id)
        });
      }

      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: dayDate.toDateString() === today.toDateString(),
        isSelected: dayDate.toDateString() === selectedDate.toDateString(),
        events: dayEvents
      });
    }

    // Adicionar dias do próximo mês para completar a grade
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        events: []
      });
    }

    return days;
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    onDateChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    onDateChange(newMonth);
  };

  const handleDayClick = (day: any) => {
    if (day.isCurrentMonth) {
      // Criar data no timezone local para evitar problemas de timezone
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const dayOfMonth = day.date;
      const newDate = new Date(year, month, dayOfMonth, 0, 0, 0, 0);
      
      console.log('📅 VisitCalendar - Dia clicado:', {
        dayOfMonth,
        year,
        month: month + 1,
        eventsCount: day.events?.length || 0,
        events: day.events?.map((e: any) => ({ id: e.id, date: e.date })) || [],
        newDate: newDate.toISOString().split('T')[0]
      });
      
      onDateChange(newDate);
      
      // Sempre chamar o callback com os eventos do dia correto
      // IMPORTANTE: Passar exatamente os eventos que foram associados a este dia específico
      if (onDayClick) {
        const eventsForDay = day.events || [];
        console.log('📤 VisitCalendar - Passando eventos para handleDayClick:', {
          date: newDate.toISOString().split('T')[0],
          eventsCount: eventsForDay.length,
          eventIds: eventsForDay.map((e: any) => e.id)
        });
        onDayClick(newDate, eventsForDay);
      }
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      console.warn('⚠️ Status não definido, usando SCHEDULED como padrão');
      return 'bg-blue-500';
    }
    
    const normalizedStatus = status.toUpperCase();
    console.log('🎨 Obtendo cor para status:', normalizedStatus);
    
    switch (normalizedStatus) {
      case 'SCHEDULED':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-yellow-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'PENDING':
        return 'bg-blue-500'; // Mesma cor de SCHEDULED para compatibilidade
      case 'NOT_COMPLETED':
        return 'bg-gray-500';
      case 'MISSED':
        return 'bg-gray-500';
      default:
        console.warn('⚠️ Status desconhecido:', normalizedStatus, '- usando cinza');
        return 'bg-gray-500';
    }
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4 w-full max-w-full overflow-hidden">
      {/* Header do Calendário - Responsivo SST - Otimizado para mobile */}
      <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
        {/* Navegação do Mês - Horizontal sempre, compacto em mobile */}
        <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
          <Button
            variant="outline"
            size={isMobile ? "icon" : "sm"}
            onClick={handlePreviousMonth}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex-shrink-0 p-0"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
          
          <h2 className="text-xs sm:text-base md:text-lg lg:text-xl font-semibold text-white text-center flex-1 px-1 sm:px-2 min-w-0">
            {isMobile ? (
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] sm:text-sm">{monthNames[currentMonth.getMonth()]}</span>
                <span className="text-[10px] sm:text-xs text-gray-400">{currentMonth.getFullYear()}</span>
              </div>
            ) : (
              `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
            )}
          </h2>
          
          <Button
            variant="outline"
            size={isMobile ? "icon" : "sm"}
            onClick={handleNextMonth}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] flex-shrink-0 p-0"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>
        </div>

        {/* Legenda de Status - Responsiva SST - Quebra em múltiplas linhas em mobile, mais compacta */}
        <div className={`flex ${isMobile ? 'flex-wrap justify-center gap-x-2 gap-y-1.5' : 'items-center justify-center sm:justify-end gap-2 sm:gap-3'} text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-gray-400`}>
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span className="whitespace-nowrap">{isMobile ? 'Ag.' : 'Agendada'}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <span className="whitespace-nowrap">{isMobile ? 'And.' : 'Em Andamento'}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
            <span className="whitespace-nowrap">{isMobile ? 'Conc.' : 'Concluída'}</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-1.5 flex-shrink-0">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-red-500 rounded-full flex-shrink-0"></div>
            <span className="whitespace-nowrap">{isMobile ? 'Canc.' : 'Cancelada'}</span>
          </div>
        </div>
      </div>

      {/* Dias da semana - Responsivo SST - Ultra compacto em mobile */}
      <div className="grid grid-cols-7 gap-0 text-center">
        {dayNames.map((day) => (
          <div 
            key={day} 
            className="py-1 sm:py-1.5 md:py-2 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs xl:text-sm font-medium text-gray-400"
            aria-label={day}
          >
            {isMobile ? day.substring(0, 1) : day}
          </div>
        ))}
      </div>

      {/* Grade do calendário - Responsiva SST - Ultra compacta em mobile, sem scroll horizontal */}
      <div className="grid grid-cols-7 gap-0 w-full max-w-full overflow-hidden">
        {days.map((day, index) => (
          <button
            key={index}
            type="button"
            className={`
              min-h-[50px] sm:min-h-[60px] md:min-h-[70px] lg:min-h-[80px] xl:min-h-[100px]
              p-0.5 sm:p-1 md:p-1.5 lg:p-2 border border-gray-700 cursor-pointer transition-colors
              ${day.isCurrentMonth ? 'bg-seguranca-graphite hover:bg-gray-700 active:bg-gray-600' : 'bg-seguranca-black text-gray-600'}
              ${day.isToday ? 'ring-1 sm:ring-2 ring-seguranca-yellow' : ''}
              ${day.isSelected ? 'bg-seguranca-yellow/20' : ''}
              flex flex-col items-start justify-start
              min-w-0 w-full
            `}
            onClick={() => handleDayClick(day)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleDayClick(day);
              }
            }}
            aria-label={(() => {
              const monthName = monthNames[currentMonth.getMonth()];
              const todayLabel = day.isToday ? ', hoje' : '';
              const eventsLabel = day.events.length > 0 
                ? `, ${day.events.length} visita${day.events.length > 1 ? 's' : ''}` 
                : '';
              return `${day.date} de ${monthName}${todayLabel}${eventsLabel}`;
            })()}
          >
            {/* Número do dia - SST: Tamanho mínimo de fonte legível, compacto */}
            <div className={`
              text-[10px] sm:text-xs md:text-sm lg:text-base font-semibold leading-none mb-0.5 sm:mb-1
              ${day.isCurrentMonth ? 'text-white' : 'text-gray-600'}
              ${day.isToday ? 'text-seguranca-yellow font-bold' : ''}
              self-start
            `}>
              {day.date}
            </div>
            
            {/* Eventos - Adaptado para mobile SST - Ultra simplificado */}
            <div className="flex-1 w-full overflow-hidden mt-0.5 sm:mt-1 min-h-0">
              {/* Em mobile, mostrar apenas indicador de status + contador */}
              {isMobile ? (
                // Mobile: apenas indicador visual ultra compacto
                day.events.length > 0 && (
                  <button
                    type="button"
                    className={`
                      w-full h-2.5 sm:h-3 rounded
                      ${getStatusColor(day.events[0].status)}
                      flex items-center justify-center
                      cursor-pointer hover:opacity-90 active:opacity-75 transition-opacity
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (day.events.length === 1) {
                        onEventClick(day.events[0]);
                      } else if (onDayClick) {
                        const newDate = new Date(currentMonth);
                        newDate.setDate(day.date);
                        onDayClick(newDate, day.events);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        if (day.events.length === 1) {
                          onEventClick(day.events[0]);
                        } else if (onDayClick) {
                          // Criar data no timezone local para evitar problemas de timezone
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const dayOfMonth = day.date;
                          const newDate = new Date(year, month, dayOfMonth, 0, 0, 0, 0);
                          onDayClick(newDate, day.events);
                        }
                      }
                    }}
                    title={`${day.events.length} visita${day.events.length > 1 ? 's' : ''}`}
                    aria-label={`${day.events.length} visita${day.events.length > 1 ? 's' : ''} neste dia`}
                  >
                    {day.events.length > 1 && (
                      <span className="text-[7px] sm:text-[8px] text-white font-bold leading-none">{day.events.length}</span>
                    )}
                  </button>
                )
              ) : (
                // Desktop: mostrar eventos completos
                <div className="space-y-0.5 sm:space-y-1 w-full">
                  {day.events.slice(0, 3).map((event) => {
                    const eventKey = event.id || `event-${event.date}-${event.time}-${event.workPost}`;
                    const statusColor = getStatusColor(event.status);
                    return (
                      <button
                        key={eventKey}
                        type="button"
                        className={`
                          text-[9px] sm:text-[10px] md:text-xs p-0.5 sm:p-1 rounded cursor-pointer 
                          min-h-[18px] sm:min-h-[20px] md:min-h-[24px] flex items-center justify-center w-full
                          ${statusColor}
                          text-white hover:opacity-90 active:opacity-75 transition-opacity
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        title={`${event.title || event.workPost} - ${event.time}`}
                        aria-label={`Visita ${event.title || event.workPost} às ${event.time}`}
                      >
                        <div className="w-full truncate">
                          <div className="flex items-center space-x-0.5 sm:space-x-1 mb-0.5">
                            <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 flex-shrink-0" />
                            <span className="truncate font-medium text-[8px] sm:text-[9px] md:text-[10px]">{event.time}</span>
                          </div>
                          <div className="truncate text-[7px] sm:text-[8px] md:text-[9px] opacity-90">{event.workPost}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Contador de eventos adicionais */}
                  {day.events.length > 3 && (
                    <button
                      type="button"
                      className="text-[8px] sm:text-[9px] md:text-[10px] text-gray-400 font-medium cursor-pointer hover:text-gray-300 active:text-white transition-colors w-full text-left py-0.5 min-h-[16px] sm:min-h-[18px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDayClick) {
                          // Criar data no timezone local para evitar problemas de timezone
                          const year = currentMonth.getFullYear();
                          const month = currentMonth.getMonth();
                          const dayOfMonth = day.date;
                          const newDate = new Date(year, month, dayOfMonth, 0, 0, 0, 0);
                          onDayClick(newDate, day.events);
                        }
                      }}
                      title={`Clique para ver todas as ${day.events.length} visitas`}
                      aria-label={`Ver todas as ${day.events.length} visitas deste dia`}
                    >
                      +{day.events.length - 3} mais
                    </button>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
        </div>
      )}

      {/* Eventos do dia selecionado - Responsivo SST */}
      {selectedDate && (() => {
        const selectedDayEvents = events.filter(event => {
          const eventDate = parseLocalDate(event.date);
          return eventDate.getFullYear() === selectedDate.getFullYear() &&
                 eventDate.getMonth() === selectedDate.getMonth() &&
                 eventDate.getDate() === selectedDate.getDate();
        });

        return (
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white mb-3 sm:mb-4">
                Visitas em {selectedDate.toLocaleDateString('pt-BR', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm sm:text-base text-gray-400 text-center py-4">Nenhuma visita agendada para este dia</p>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {selectedDayEvents.map((event) => (
                    <button
                      key={event.id || `selected-event-${event.date}-${event.time}`}
                      type="button"
                      className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-seguranca-black rounded-lg border border-gray-700 hover:bg-gray-800 active:bg-gray-700 cursor-pointer gap-3 sm:gap-0 transition-colors text-left min-h-[60px] sm:min-h-[auto]"
                      onClick={() => onEventClick(event)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onEventClick(event);
                        }
                      }}
                      aria-label={`Visita ${event.workPost} às ${event.time}`}
                    >
                      <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                        <div className={`w-3 h-3 sm:w-3 sm:h-3 rounded-full flex-shrink-0 mt-1 sm:mt-0 ${getStatusColor(event.status)}`} aria-hidden="true"></div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-semibold text-sm sm:text-base truncate">{event.workPost}</p>
                          <p className="text-xs sm:text-sm text-gray-400 truncate mt-0.5">{event.client || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col sm:text-right items-center sm:items-end justify-between sm:justify-end gap-3 sm:gap-1">
                        <p className="text-white font-semibold text-sm sm:text-base">{event.time}</p>
                        <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[140px] sm:max-w-none">{event.supervisor || 'N/A'}</p>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
        );
      })()}
    </div>
  );
};