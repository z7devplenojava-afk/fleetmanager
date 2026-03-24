import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, MapPin, Clock, User, Building, Calendar } from 'lucide-react';
import { Visit } from '@/types/visit';
import { DailyDetailsModal } from '@/components/shared/DailyDetailsModal';

interface DayVisitsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visits: Visit[];
  date: Date;
  onVisitClick: (visit: Visit) => void;
}

const DayVisitsModal: React.FC<DayVisitsModalProps> = ({
  open,
  onOpenChange,
  visits,
  date,
  onVisitClick,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', className: 'bg-blue-500 text-white' },
      SCHEDULED: { label: 'Agendada', className: 'bg-blue-500 text-white' },
      IN_PROGRESS: { label: 'Em Andamento', className: 'bg-yellow-500 text-white' },
      COMPLETED: { label: 'Concluída', className: 'bg-green-500 text-white' },
      NOT_COMPLETED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
      CANCELLED: { label: 'Cancelada', className: 'bg-red-500 text-white' },
      MISSED: { label: 'Não Realizada', className: 'bg-gray-500 text-white' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status || 'Desconhecido',
      className: 'bg-gray-500 text-white',
    };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    try {
      if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
      }
      const d = new Date(timeString);
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  };

  const formatDateLabel = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <DailyDetailsModal
      open={open}
      onOpenChange={onOpenChange}
      title="Visitas do Dia"
      dateLabel={formatDateLabel(date)}
      icon={Calendar}
      maxWidth="max-w-[800px]"
    >
      <div className="space-y-4">
        {visits.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-seguranca-black/30 rounded-lg border border-gray-800">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Nenhuma visita agendada para este dia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visits.map((visit) => (
              <Card
                key={visit.id}
                className="bg-seguranca-black border-gray-700 hover:border-seguranca-yellow/40 transition-all cursor-pointer group"
                onClick={() => {
                  onVisitClick(visit);
                  onOpenChange(false);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-white font-semibold text-lg group-hover:text-seguranca-yellow transition-colors truncate">
                          {visit.workPostName || visit.clientName || 'Visita sem local'}
                        </h3>
                        <div className="flex-shrink-0">
                          {getStatusBadge(visit.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {visit.visitTime && (
                          <div className="flex items-center gap-2 text-gray-300 bg-seguranca-graphite/40 px-2 py-1 rounded">
                            <Clock className="w-4 h-4 text-seguranca-yellow flex-shrink-0" />
                            <span className="font-medium truncate">{formatTime(visit.visitTime)}</span>
                          </div>
                        )}

                        {visit.clientName && (
                          <div className="flex items-center gap-2 text-gray-300 bg-seguranca-graphite/40 px-2 py-1 rounded">
                            <Building className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="truncate">{visit.clientName}</span>
                          </div>
                        )}

                        {visit.locationAddress && (
                          <div className="flex items-center gap-2 text-gray-300 bg-seguranca-graphite/40 px-2 py-1 rounded">
                            <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="truncate">{visit.locationAddress}</span>
                          </div>
                        )}

                        {visit.supervisorName && (
                          <div className="flex items-center gap-2 text-gray-300 bg-seguranca-graphite/40 px-2 py-1 rounded">
                            <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            <span className="truncate">
                              {visit.supervisorName}
                            </span>
                          </div>
                        )}
                      </div>

                      {visit.observations && (
                        <div className="bg-seguranca-graphite/20 p-2 rounded border-l-2 border-seguranca-yellow/30">
                          <p className="text-xs text-gray-400 italic line-clamp-2">
                            "{visit.observations}"
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-seguranca-yellow hover:text-seguranca-yellow/80 hover:bg-seguranca-yellow/10 w-full sm:w-auto self-end sm:self-center border border-transparent hover:border-seguranca-yellow/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVisitClick(visit);
                        onOpenChange(false);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
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

export default DayVisitsModal;












