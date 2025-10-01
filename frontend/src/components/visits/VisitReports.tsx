import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Users,
  Target
} from 'lucide-react';
import { Visit, VisitStatistics, VisitStatus } from '@/types/visit';
import { visitService } from '@/services/visitService';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface VisitReportsProps {
  onExport?: (format: 'pdf' | 'excel') => void;
}

interface MonthlyData {
  month: string;
  total: number;
  completed: number;
  pending: number;
  notCompleted: number;
  cancelled: number;
}

interface UnitPerformance {
  unitId: string;
  unitName: string;
  totalVisits: number;
  completedVisits: number;
  completionRate: number;
  averageDuration: number;
}

const VisitReports: React.FC<VisitReportsProps> = ({ onExport }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [unitPerformance, setUnitPerformance] = useState<UnitPerformance[]>([]);
  const [statistics, setStatistics] = useState<VisitStatistics | null>(null);
  const [recentVisits, setRecentVisits] = useState<Visit[]>([]);

  useEffect(() => {
    loadReportData();
  }, [selectedYear]);

  const loadReportData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Carregar dados mensais
      const monthlyStats = await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
          const stats = await visitService.getVisitStatistics(user.id, selectedYear, month);
          return {
            month: new Date(selectedYear, month - 1).toLocaleDateString('pt-BR', { month: 'short' }),
            total: stats.totalVisits,
            completed: stats.completedVisits,
            pending: stats.pendingVisits,
            notCompleted: stats.notCompletedVisits,
            cancelled: stats.totalVisits - stats.completedVisits - stats.pendingVisits - stats.notCompletedVisits
          };
        })
      );

      setMonthlyData(monthlyStats);

      // Carregar estatísticas do ano atual
      const currentMonth = new Date().getMonth() + 1;
      const currentStats = await visitService.getVisitStatistics(user.id, selectedYear, currentMonth);
      setStatistics(currentStats);

      // Simular dados de performance por unidade (em produção, viria da API)
      const mockUnitPerformance: UnitPerformance[] = [
        { unitId: '1', unitName: 'Unidade Centro', totalVisits: 45, completedVisits: 42, completionRate: 93.3, averageDuration: 120 },
        { unitId: '2', unitName: 'Unidade Norte', totalVisits: 38, completedVisits: 35, completionRate: 92.1, averageDuration: 95 },
        { unitId: '3', unitName: 'Unidade Sul', totalVisits: 52, completedVisits: 48, completionRate: 92.3, averageDuration: 110 },
        { unitId: '4', unitName: 'Unidade Leste', totalVisits: 41, completedVisits: 38, completionRate: 92.7, averageDuration: 105 },
        { unitId: '5', unitName: 'Unidade Oeste', totalVisits: 33, completedVisits: 30, completionRate: 90.9, averageDuration: 100 }
      ];
      setUnitPerformance(mockUnitPerformance);

      // Carregar visitas recentes
      const recent = await visitService.getTodaysVisits(user.id);
      setRecentVisits(recent);

    } catch (error) {
      console.error('Erro ao carregar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '--:--';
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Carregando relatórios...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Visitas</h2>
          <p className="text-gray-600">Análise de performance e estatísticas detalhadas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
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
          
          <Button variant="outline" size="sm" onClick={loadReportData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onExport?.('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => onExport?.('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="units">Por Unidade</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
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
                      <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-green-600">{statistics.completionRate.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Visitas Realizadas</p>
                      <p className="text-2xl font-bold text-blue-600">{statistics.completedVisits}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-blue-600" />
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
            </div>
          )}

          {/* Gráfico de distribuição por status */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{month.month}</span>
                      <span className="text-sm text-gray-600">{month.total} visitas</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="flex h-2 rounded-full">
                        <div 
                          className="bg-green-500" 
                          style={{ width: `${month.total > 0 ? (month.completed / month.total) * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-yellow-500" 
                          style={{ width: `${month.total > 0 ? (month.pending / month.total) * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${month.total > 0 ? (month.notCompleted / month.total) * 100 : 0}%` }}
                        ></div>
                        <div 
                          className="bg-gray-500" 
                          style={{ width: `${month.total > 0 ? (month.cancelled / month.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Realizadas: {month.completed}</span>
                      <span>Pendentes: {month.pending}</span>
                      <span>Não Realizadas: {month.notCompleted}</span>
                      <span>Canceladas: {month.cancelled}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dados Mensais */}
        <TabsContent value="monthly" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitas por Mês - {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month) => (
                  <div key={month.month} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">{month.month}</h3>
                      <span className="text-sm text-gray-600">{month.total} visitas</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Realizadas: {month.completed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                        <span>Pendentes: {month.pending}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Não Realizadas: {month.notCompleted}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-600" />
                        <span>Canceladas: {month.cancelled}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance por Unidade */}
        <TabsContent value="units" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {unitPerformance.map((unit) => (
                  <div key={unit.unitId} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{unit.unitName}</h3>
                        <p className="text-sm text-gray-600">{unit.totalVisits} visitas totais</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {unit.completionRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Taxa de conclusão</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Visitas Realizadas</span>
                        <span>{unit.completedVisits}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${unit.completionRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Duração Média</span>
                        <span>{unit.averageDuration} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visitas Recentes */}
        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visitas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {recentVisits.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma visita recente encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVisits.map((visit) => (
                    <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(visit.status)}
                        <div>
                          <p className="font-medium">{visit.unitName}</p>
                          <p className="text-sm text-gray-600">{visit.unitAddress}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{formatDate(visit.visitDate)}</p>
                        <p className="text-sm text-gray-600">
                          {formatTime(visit.arrivalTime)} - {formatTime(visit.departureTime)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VisitReports;
