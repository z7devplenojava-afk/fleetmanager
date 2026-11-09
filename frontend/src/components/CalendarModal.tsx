import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
    CalendarDays,
    Clock,
    CalendarCheck,
    Compass,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { ptBR } from 'date-fns/locale';

interface CalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());

    // Relógio em tempo real
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const dateToDisplay = selectedDate || new Date();

    const formattedFullDate = dateToDisplay.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Cálculos do dia do ano e número da semana
    const dayOfYear = Math.floor(
        (dateToDisplay.getTime() - new Date(dateToDisplay.getFullYear(), 0, 0).getTime()) /
            (1000 * 60 * 60 * 24)
    );

    const firstDayOfYear = new Date(dateToDisplay.getFullYear(), 0, 1);
    const pastDaysOfYear = (dateToDisplay.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    const isToday =
        selectedDate &&
        selectedDate.toDateString() === new Date().toDateString();

    const handleNavigate = (path: string) => {
        onClose();
        navigate(path);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl bg-slate-950 border border-slate-800 text-slate-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
                {/* Header com Gradiente Moderno */}
                <div className="bg-gradient-to-r from-red-600/30 via-slate-900 to-amber-600/20 p-5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-sm">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                                Calendário do Sistema
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                    OFICIAL
                                </span>
                            </DialogTitle>
                            <p className="text-xs text-slate-400 font-medium">
                                Agenda operacional e sincronização em tempo real
                            </p>
                        </div>
                    </div>

                    {/* Relógio em Tempo Real */}
                    <div className="text-right hidden sm:block">
                        <div className="flex items-center justify-end gap-1.5 text-xs text-amber-400 font-mono font-bold">
                            <Clock size={13} className="animate-pulse" />
                            <span>
                                {currentTime.toLocaleTimeString('pt-BR', { hour12: false })}
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                            Brasília (GMT-3)
                        </span>
                    </div>
                </div>

                {/* Conteúdo Principal: Calendário + Painel Lateral de Informações */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Coluna 1: Calendário Interativo */}
                    <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-3 flex flex-col items-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            locale={ptBR}
                            className="rounded-md"
                        />
                        <div className="w-full flex justify-between items-center pt-2 px-2 border-t border-slate-800 mt-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedDate(new Date())}
                                className={`text-xs h-7 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium ${
                                    isToday ? 'opacity-50 pointer-events-none' : ''
                                }`}
                            >
                                <Sparkles size={12} className="mr-1.5" />
                                Voltar para Hoje
                            </Button>
                            <span className="text-[11px] font-mono text-slate-400">
                                {isToday ? 'Dia Atual' : 'Data Personalizada'}
                            </span>
                        </div>
                    </div>

                    {/* Coluna 2: Informações da Data e Ações Operacionais */}
                    <div className="flex flex-col justify-between h-full space-y-4">
                        {/* Card com Detalhes da Data Selecionada */}
                        <div className="bg-slate-900/80 rounded-xl border border-slate-800/80 p-4 space-y-3">
                            <div>
                                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                                    Data Selecionada
                                </span>
                                <h4 className="text-sm font-bold text-white capitalize mt-0.5">
                                    {formattedFullDate}
                                </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                        Dia do Ano
                                    </span>
                                    <span className="text-xs font-bold text-amber-400 font-mono">
                                        {dayOfYear}º dia
                                    </span>
                                </div>
                                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                        Semana
                                    </span>
                                    <span className="text-xs font-bold text-blue-400 font-mono">
                                        Semana {weekNumber}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-lg">
                                <CheckCircle2 size={14} className="shrink-0" />
                                <span>Operações e cronotacógrafos sincronizados</span>
                            </div>
                        </div>

                        {/* Atalhos Rápidos da Frota e Operação */}
                        <div className="space-y-2">
                            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider px-1">
                                Atalhos para o Dia
                            </span>

                            <div className="grid grid-cols-1 gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleNavigate('/escalas')}
                                    className="w-full justify-start text-xs h-9 bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:text-white"
                                >
                                    <CalendarCheck size={14} className="mr-2 text-blue-400" />
                                    Visualizar Escalas e Turnos
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleNavigate('/ponto-eletronico')}
                                    className="w-full justify-start text-xs h-9 bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:text-white"
                                >
                                    <Clock size={14} className="mr-2 text-amber-400" />
                                    Espelho e Ponto Eletrônico
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleNavigate('/gestao-trafego/painel-operacional')}
                                    className="w-full justify-start text-xs h-9 bg-slate-900/60 border-slate-800 hover:bg-slate-800 hover:text-white"
                                >
                                    <Compass size={14} className="mr-2 text-red-400" />
                                    Painel de Tráfego e Viagens
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CalendarModal;

