import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  MapPin,
  Users,
  BarChart3,
  RefreshCw,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { Visit, VisitStatistics, VisitStatus } from '@/types/visit';
import { visitService } from '@/services/visitService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VisitDashboardProps {
  onViewVisits?: () => void;
  onCreateVisit?: () => void;
  onViewReports?: () => void;
}

const VisitDashboard: React.FC<VisitDashboardProps> = ({
  onViewVisits,
  onCreateVisit,
  onViewReports
}) => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<VisitStatistics | null>(null);
  const [todaysVisits, setTodaysVisits] = useState<Visit[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedMonth, selectedYear]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [stats, visits] = await Promise.all([
        visitService.getVisitStatistics(user.id, selectedYear, selectedMonth),
        visitService.getTodaysVisits(user.id)
      ]);
      
      setStatistics(stats);
      setTodaysVisits(visits);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: VisitStatus) => {
    const statusConfig = {
      [VisitStatus.PENDING]: { 
        label: 'Pendente', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      },
      [VisitStatus.COMPLETED]: { 
        label: 'Realizada', 
        className: 'bg-green-100 text-green-800 border-green-200' 
      },
      [VisitStatus.NOT_COMPLETED]: { 
        label: 'Não Realizada', 
        className: 'bg-red-100 text-red-800 border-red-200' 
      },
      [VisitStatus.CANCELLED]: { 
        label: 'Cancelada', 
        className: 'bg-gray-100 text-gray-800 border-gray-200' 
      }
    };

    const config = statusConfig[status];
    return (
      <Badge className={cn('border', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const getStatusIcon = (status: VisitStatus) => {
    switch (status) {
      case VisitStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case VisitStatus.NOT_COMPLETED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case VisitStatus.CANCELLED:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Carregando dados...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Visitas</h2>
          <p className="text-gray-600">Visão geral das suas visitas e estatísticas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={month} value={month.toString()}>
                  {new Date(2024, month - 1).toLocaleDateString('pt-BR', { month: 'long' })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de estatísticas */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Visitas</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalVisits}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Realizadas</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.completedVisits}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.pendingVisits}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.completionRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visitas de hoje */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Visitas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysVisits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma visita agendada para hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(visit.status)}
                    <div>
                      <p className="font-medium text-gray-900">{visit.unitName}</p>
                      <p className="text-sm text-gray-600">{visit.unitAddress}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Chegada: {formatTime(visit.arrivalTime)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Saída: {formatTime(visit.departureTime)}
                      </p>
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewVisits}>
          <CardContent className="p-6 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Ver Todas as Visitas</h3>
            <p className="text-sm text-gray-600">Visualizar lista completa</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onCreateVisit}>
          <CardContent className="p-6 text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold text-gray-900">Nova Visita</h3>
            <p className="text-sm text-gray-600">Agendar nova visita</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onViewReports}>
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Relatórios</h3>
            <p className="text-sm text-gray-600">Ver relatórios detalhados</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VisitDashboard;
