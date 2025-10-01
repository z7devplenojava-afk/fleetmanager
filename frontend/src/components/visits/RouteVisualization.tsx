import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Route, 
  TrendingUp,
  Car,
  Target,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { VisitSchedule, Visit } from '@/types/visit';

interface RouteVisualizationProps {
  schedule: VisitSchedule;
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({ schedule }) => {
  const visits = schedule.visits || [];
  const sortedVisits = visits.sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getEfficiencyColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return '0min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatDistance = (km?: number) => {
    if (!km) return '0km';
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            Rota Otimizada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{visits.length}</div>
              <div className="text-sm text-gray-500">Visitas</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getEfficiencyColor(schedule.routeOptimizationScore)}`}>
                {schedule.routeOptimizationScore?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-gray-500">Eficiência</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(schedule.totalTravelDistanceKm)}
              </div>
              <div className="text-sm text-gray-500">Distância Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatTime(schedule.totalEstimatedTimeMinutes)}
              </div>
              <div className="text-sm text-gray-500">Tempo Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização da Rota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            Sequência de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedVisits.map((visit, index) => (
              <div
                key={visit.id}
                className="relative flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Indicador de Ordem */}
                <div className="flex-shrink-0 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${getStatusColor(visit.status)}`}>
                    {visit.routeOrder || index + 1}
                  </div>
                  {index < sortedVisits.length - 1 && (
                    <div className="absolute top-8 left-4 w-0.5 h-8 bg-gray-300 transform -translate-x-1/2"></div>
                  )}
                </div>

                {/* Informações da Visita */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{visit.unitName}</h3>
                      {visit.unitAddress && (
                        <p className="text-sm text-gray-500 mt-1">{visit.unitAddress}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        Prioridade {visit.priorityLevel || 1}
                      </Badge>
                      {visit.status === 'COMPLETED' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : visit.status === 'CANCELLED' ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalhes da Visita */}
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(visit.estimatedDurationMinutes)}
                    </div>
                    {visit.preferredTimeStart && (
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {new Date(`2000-01-01T${visit.preferredTimeStart}`).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    {visit.travelTimeToNextMinutes && index < sortedVisits.length - 1 && (
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {formatTime(visit.travelTimeToNextMinutes)} / {formatDistance(visit.travelDistanceToNextKm)}
                      </div>
                    )}
                  </div>

                  {/* Observações */}
                  {visit.observations && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700">
                      {visit.observations}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Resumo Final */}
          {visits.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">Resumo da Otimização</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-blue-700">Economia estimada:</span>
                  <div className="font-medium">
                    {schedule.routeOptimizationScore && schedule.routeOptimizationScore > 70
                      ? `${Math.round((schedule.routeOptimizationScore - 50) / 2)}% tempo`
                      : 'Rota padrão'
                    }
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Combustível:</span>
                  <div className="font-medium">
                    {schedule.totalTravelDistanceKm
                      ? `~${Math.round(schedule.totalTravelDistanceKm * 0.12)} litros`
                      : 'Não calculado'
                    }
                  </div>
                </div>
                <div>
                  <span className="text-blue-700">Status:</span>
                  <div className="font-medium">
                    {schedule.status === 'PLANNED' && 'Planejada'}
                    {schedule.status === 'IN_PROGRESS' && 'Em Execução'}
                    {schedule.status === 'COMPLETED' && 'Concluída'}
                    {schedule.status === 'CANCELLED' && 'Cancelada'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteVisualization;
