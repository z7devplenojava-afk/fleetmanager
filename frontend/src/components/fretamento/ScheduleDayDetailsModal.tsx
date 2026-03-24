import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    User,
    Route as RouteIcon,
    MapPin,
    Car,
    Clock,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Schedule } from '@/services/scheduleService';
import { DailyDetailsModal } from '@/components/shared/DailyDetailsModal';

interface ScheduleDayDetailsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate: Date | null;
    schedules: Schedule[];
}

const ScheduleDayDetailsModal: React.FC<ScheduleDayDetailsModalProps> = ({
    open,
    onOpenChange,
    selectedDate,
    schedules
}) => {
    if (!selectedDate) return null;

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            CONFIRMED: { label: 'Confirmada', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
            COMPLETED: { label: 'Concluída', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
            CANCELLED: { label: 'Cancelada', className: 'bg-red-500/20 text-red-300 border-red-500/30' },
            PENDING: { label: 'Pendente', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
        return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
    };

    const getShiftLabel = (shift: string) => {
        const shiftLabels: Record<string, string> = {
            DAY: 'Diurno',
            NIGHT: 'Noturno',
            MIXED: 'Misto'
        };
        return shiftLabels[shift] || shift;
    };

    const dateLabel = format(selectedDate, "eeee, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
        <DailyDetailsModal
            open={open}
            onOpenChange={onOpenChange}
            title="Escalas do Dia"
            dateLabel={dateLabel}
            icon={User}
        >
            <div className="space-y-4">
                {schedules.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-seguranca-black/30 rounded-lg border border-gray-800">
                        <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p className="text-lg">Nenhum motorista escalado para este dia</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {schedules.map((schedule) => (
                            <Card key={schedule.id} className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow/40 transition-all group">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-seguranca-yellow/20 flex items-center justify-center border border-seguranca-yellow/10">
                                                <User className="w-6 h-6 text-seguranca-yellow" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white group-hover:text-seguranca-yellow transition-colors">
                                                    {schedule.employee?.name || 'Motorista não especificado'}
                                                </h3>
                                                <p className="text-sm text-gray-400">
                                                    Turno: <span className="text-gray-300 font-medium">{getShiftLabel(schedule.shift)}</span>
                                                </p>
                                            </div>
                                        </div>
                                        {getStatusBadge(schedule.status)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {/* Cliente */}
                                        <div className="flex items-center gap-3 bg-seguranca-graphite/40 p-2.5 rounded border border-gray-800/50">
                                            <MapPin className="w-4 h-4 text-green-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Cliente</p>
                                                <p className="text-gray-200 font-medium truncate">
                                                    {schedule.client?.name || schedule.travelTrip?.client?.name || (schedule.workPost as any)?.client?.name || schedule.location?.name || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Rota */}
                                        <div className="flex items-center gap-3 bg-seguranca-graphite/40 p-2.5 rounded border border-gray-800/50">
                                            <RouteIcon className="w-4 h-4 text-blue-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Rota</p>
                                                <p className="text-gray-200 font-medium truncate">
                                                    {schedule.route?.name || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Veículo */}
                                        <div className="flex items-center gap-3 bg-seguranca-graphite/40 p-2.5 rounded border border-gray-800/50">
                                            <Car className="w-4 h-4 text-purple-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Veículo</p>
                                                <p className="text-gray-200 font-medium truncate">
                                                    {schedule.vehicle?.plate || schedule.vehiclePlate || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Horário */}
                                        <div className="flex items-center gap-3 bg-seguranca-graphite/40 p-2.5 rounded border border-gray-800/50">
                                            <Clock className="w-4 h-4 text-orange-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Horário</p>
                                                <p className="text-gray-200 font-medium">
                                                    {schedule.workPost?.shiftStart || '--:--'} às {schedule.workPost?.shiftEnd || '--:--'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observações */}
                                    {schedule.observations && (
                                        <div className="mt-3 p-3 bg-seguranca-graphite/20 rounded border-l-2 border-seguranca-yellow/30">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Observações</p>
                                            <p className="text-sm text-gray-300 italic">"{schedule.observations}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-4 mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white"
                    >
                        Fechar
                    </Button>
                </div>
            </div>
        </DailyDetailsModal>
    );
};

export default ScheduleDayDetailsModal;
