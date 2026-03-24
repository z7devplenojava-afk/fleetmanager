import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Car, AlertCircle, Building, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Schedule } from '@/services/scheduleService';

interface ScheduleViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    schedule: Schedule | null;
}

export function ScheduleViewSheet({ open, onOpenChange, schedule }: ScheduleViewSheetProps) {
    if (!schedule) return null;

    // Helper para formatar data
    const formatDate = (date: Date | string) => {
        if (!date) return '—';
        const d = typeof date === 'string' ? new Date(date) : date;
        return isNaN(d.getTime()) ? '—' : format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    // Helper para formatar horário
    const formatTime = (time: string) => {
        return time ? time.substring(0, 5) : '—';
    };

    // Mapeamento de status e cores
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Pendente</Badge>;
            case 'CONFIRMED':
                return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">Confirmada</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Concluída</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-500/20 text-red-300 border-red-500/30">Cancelada</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    // Mapeamento de turno
    const getShiftBadge = (shift: string) => {
        switch (shift) {
            case 'DAY':
                return <Badge variant="outline" className="bg-blue-600/20 text-blue-300 border-blue-500/40">Diurno</Badge>;
            case 'NIGHT':
                return <Badge variant="outline" className="bg-purple-600/20 text-purple-300 border-purple-500/40">Noturno</Badge>;
            case 'MIXED':
                return <Badge variant="outline" className="bg-amber-600/20 text-amber-200 border-amber-500/40">Misto</Badge>;
            default:
                return <Badge variant="outline">{shift}</Badge>;
        }
    };

    // Extrair endereço seguro
    const getAddress = () => {
        // Tenta pegar do location, senão do workPost
        const loc = schedule.location || (schedule as any).workPost;
        if (!loc) return 'Endereço não disponível';

        // Se tiver endereço formatado
        if (loc.address) return loc.address;

        // Se tiver nome da unidade/cliente
        return loc.name || 'Local não identificado';
    };

    // Extrair nome do cliente
    const getClientName = () => {
        // Tenta pegar via client, location.unit.client, workPost.client
        const client = (schedule as any).client ||
            (schedule.location as any)?.unit?.client ||
            (schedule as any).workPost?.client;

        return client?.name || 'Cliente não identificado';
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-seguranca-graphite border-l-gray-700 text-gray-100 sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2 text-white">
                        <Calendar className="w-5 h-5 text-seguranca-yellow" />
                        Detalhes da Escala
                    </SheetTitle>
                    <SheetDescription className="text-gray-400">
                        Informações completas do agendamento
                    </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                    {/* Status e Turno */}
                    <div className="flex items-center justify-between p-4 bg-seguranca-black/40 rounded-lg border border-gray-700">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status</span>
                            {getStatusBadge(schedule.status)}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Turno</span>
                            {getShiftBadge(schedule.shift)}
                        </div>
                    </div>

                    {/* Dados Principais */}
                    <div className="space-y-4">

                        {/* Posto e Cliente */}
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <Building className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Posto de Trabalho</h4>
                                <p className="text-gray-300 text-sm">{(schedule as any).workPost?.name || schedule.location?.name || '—'}</p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-seguranca-yellow">
                                    <MapPin className="w-3 h-3" />
                                    <span>{getClientName()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-gray-700/50" />

                        {/* Funcionário */}
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Profissional</h4>
                                <p className="text-gray-300 text-sm">{schedule.employee?.name || 'Não atribuído'}</p>
                                {(schedule.employee as any)?.role && (
                                    <span className="text-xs text-gray-500">{(schedule.employee as any).role}</span>
                                )}
                            </div>
                        </div>

                        <div className="h-px bg-gray-700/50" />

                        {/* Data e Hora */}
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <Clock className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Data e Horário</h4>
                                <p className="text-gray-300 text-sm">{formatDate(schedule.scheduleDate)}</p>
                                <p className="text-sm font-mono text-seguranca-yellow mt-1">
                                    {formatTime((schedule as any).startTime)} às {formatTime((schedule as any).endTime)}
                                </p>
                            </div>
                        </div>

                        <div className="h-px bg-gray-700/50" />

                        {/* Veículo (se houver) */}
                        <div className="flex gap-3">
                            <div className="mt-1">
                                <Car className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-white text-sm">Veículo</h4>
                                {schedule.vehicle ? (
                                    <>
                                        <p className="text-gray-300 text-sm font-medium">{schedule.vehicle.model}</p>
                                        <p className="text-xs text-gray-500">{schedule.vehicle.plate}</p>
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-sm italic">Nenhum veículo vinculado</p>
                                )}
                            </div>
                        </div>

                        {/* Observações */}
                        {schedule.observations && (
                            <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-md mt-2">
                                <div className="flex gap-2">
                                    <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-200">{schedule.observations}</p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <SheetFooter className="mt-8">
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => onOpenChange(false)}>
                        Fechar
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
