import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Sparkles,
  CalendarCheck
} from 'lucide-react';

interface YearCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const YearCalendarModal: React.FC<YearCalendarModalProps> = ({ isOpen, onClose }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Gera a matriz de dias de um determinado mês e ano
  const getDaysInMonthMatrix = (year: number, month: number) => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  };

  const formattedToday = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-slate-950 border border-slate-800 text-slate-100 p-0 shadow-2xl rounded-2xl">
        {/* Header com Gradiente Moderno */}
        <div className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur-md p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <CalendarIcon size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Calendário Anual da Operação
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {selectedYear === currentYear ? 'ANO ATUAL' : selectedYear}
                </span>
              </DialogTitle>
              <p className="text-xs text-slate-400 capitalize">
                Hoje: <span className="text-amber-400 font-semibold">{formattedToday}</span>
              </p>
            </div>
          </div>

          {/* Navegador de Anos e Botão de Voltar para Hoje */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedYear(currentYear)}
              className="text-xs border-slate-800 hover:bg-slate-900 text-slate-300"
            >
              <CalendarCheck className="h-3.5 w-3.5 mr-1 text-primary" />
              Ir para Hoje
            </Button>
            <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 p-0.5">
              <button
                onClick={() => setSelectedYear(prev => prev - 1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Ano anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-sm font-bold font-mono text-white">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear(prev => prev + 1)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="Próximo ano"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Grid de 12 Meses */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MONTH_NAMES.map((monthName, monthIndex) => {
            const isCurrentMonth = selectedYear === currentYear && monthIndex === currentMonth;
            const daysMatrix = getDaysInMonthMatrix(selectedYear, monthIndex);

            return (
              <div
                key={monthName}
                className={`rounded-xl p-3 border transition-all ${
                  isCurrentMonth
                    ? 'bg-slate-900/90 border-primary/50 shadow-md shadow-primary/10 ring-1 ring-primary/30'
                    : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Cabeçalho do Mês */}
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/60">
                  <span className={`text-sm font-bold ${isCurrentMonth ? 'text-primary' : 'text-slate-200'}`}>
                    {monthName}
                  </span>
                  {isCurrentMonth && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold animate-pulse">
                      Mês Atual
                    </span>
                  )}
                </div>

                {/* Dias da Semana */}
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 mb-1">
                  {WEEK_DAYS.map((wd, i) => (
                    <span key={i} className={i === 0 ? 'text-rose-400' : ''}>
                      {wd}
                    </span>
                  ))}
                </div>

                {/* Grade de Dias */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {daysMatrix.map((day, idx) => {
                    if (day === null) {
                      return <div key={`empty-${idx}`} className="h-6" />;
                    }
                    const isTodayDay = isCurrentMonth && day === currentDay;
                    const isSunday = idx % 7 === 0;

                    return (
                      <div
                        key={`day-${day}`}
                        className={`h-6 flex items-center justify-center rounded text-[11px] font-medium transition-all ${
                          isTodayDay
                            ? 'bg-primary text-primary-foreground font-black shadow-sm shadow-primary scale-110 ring-2 ring-white/20 z-10'
                            : isSunday
                            ? 'text-rose-400/80 hover:bg-slate-800'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                        title={isTodayDay ? 'Hoje' : `${day} de ${monthName} de ${selectedYear}`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé Informativo */}
        <div className="p-4 bg-slate-900/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary" />
              Dia Atual (Hoje)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-primary/50 bg-slate-900" />
              Mês Atual
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-300 hover:text-white">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default YearCalendarModal;

