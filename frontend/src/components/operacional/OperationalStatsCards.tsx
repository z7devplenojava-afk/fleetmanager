import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Users,
  MapPin,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle,
  Eye,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { operationalStatsService, OperationalStats } from '@/services/operationalStatsService';
import NewVisitModal from './NewVisitModal';
import AllVisitsModal from './AllVisitsModal';

const OperationalStatsCards: React.FC = () => {
  const [stats, setStats] = useState<OperationalStats | null>(null);
  const [recentVisits, setRecentVisits] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any | null>(null);
  const [nextAction, setNextAction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [statsData, visitsData, activityData, actionData] = await Promise.all([
        operationalStatsService.getOperationalStats(),
        operationalStatsService.getRecentVisits(),
        operationalStatsService.getRecentActivity().catch(() => null),
        operationalStatsService.getNextActions().catch(() => null)
      ]);
      setStats(statsData);
      setRecentVisits(visitsData);
      setRecentActivity(activityData);
      setNextAction(actionData);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="text-center text-gray-400">
              Erro ao carregar estatísticas
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Botão de atualizar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar Estatísticas
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Equipamentos Ativos */}
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Equipamentos Ativos</p>
                <p className="text-3xl font-bold text-white">{stats.activeEquipment}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.activeEquipment > 0 ? `${stats.activeEquipment} ativos` : 'Nenhum ativo'}
                </p>
              </div>
              <div className="p-3 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funcionários em Serviço */}
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Funcionários em Serviço</p>
                <p className="text-3xl font-bold text-white">{stats.employeesOnDuty}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.employeesOnDuty > 0 ? `${stats.employeesOnDuty} em serviço hoje` : 'Nenhum em serviço'}
                </p>
              </div>
              <div className="p-3 bg-green-600 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Postos Ativos */}
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Postos Ativos</p>
                <p className="text-3xl font-bold text-white">{stats.activeWorkPosts}</p>
                <p className="text-xs text-gray-500 mt-1">Todos operacionais</p>
              </div>
              <div className="p-3 bg-purple-600 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Pendentes */}
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Alertas Pendentes</p>
                <p className="text-3xl font-bold text-orange-400">{stats.pendingAlerts}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.pendingAlerts > 0 
                    ? `${stats.pendingAlerts} ${stats.pendingAlerts === 1 ? 'equipamento' : 'equipamentos'} ${stats.pendingAlerts === 1 ? 'vencendo' : 'vencendo'}`
                    : 'Nenhum alerta pendente'
                  }
                </p>
              </div>
              <div className="p-3 bg-orange-600 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Controle de Visitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controle de Visitas */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Calendar className="h-5 w-5 text-red-500" />
              Controle de Visitas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-white">{stats.todayVisits}</p>
                <p className="text-sm text-gray-400">Hoje</p>
              </div>
              <div className="text-center p-4 bg-gray-900 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
                <p className="text-sm text-gray-400">Taxa de Sucesso</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center">
                <p className="text-green-400 font-semibold">{stats.completedVisits}</p>
                <p className="text-gray-500">Realizadas</p>
              </div>
              <div className="text-center">
                <p className="text-yellow-400 font-semibold">{stats.pendingVisits}</p>
                <p className="text-gray-500">Pendentes</p>
              </div>
              <div className="text-center">
                <p className="text-blue-400 font-semibold">{stats.activeSupervisors}</p>
                <p className="text-gray-500">Supervisores Ativos</p>
              </div>
            </div>

            <div className="flex gap-2">
              <NewVisitModal onVisitCreated={loadStats} />
              <AllVisitsModal onVisitUpdated={loadStats} />
            </div>
          </CardContent>
        </Card>

        {/* Visitas Recentes */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5 text-red-500" />
              Visitas Recentes
              <Badge variant="secondary" className="ml-auto bg-gray-700 text-gray-300">
                Últimas 3 visitas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Visitas recentes do backend */}
            {recentVisits.length > 0 ? (
              recentVisits.map((visit, index) => (
                <div key={visit.id || index} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {visit.scheduledAt ? 
                        new Date(visit.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' ' + visit.location
                        : visit.title
                      }
                    </p>
                    <p className="text-xs text-gray-400">
                      Responsável: {visit.assignedTo || 'Não atribuído'}
                    </p>
                  </div>
                  <Badge className={`${
                    visit.status === 'COMPLETED' ? 'bg-green-600' :
                    visit.status === 'IN_PROGRESS' ? 'bg-blue-600' :
                    visit.status === 'SCHEDULED' ? 'bg-yellow-600' :
                    'bg-gray-600'
                  } text-white`}>
                    {visit.status === 'COMPLETED' ? 'Concluída' :
                     visit.status === 'IN_PROGRESS' ? 'Em Andamento' :
                     visit.status === 'SCHEDULED' ? 'Pendente' :
                     visit.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                Nenhuma visita recente encontrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de Atividade Recente e Próximas Ações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity ? (
              <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm text-white">{recentActivity.description}</p>
                  <p className="text-xs text-gray-400">{recentActivity.timeAgo}</p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                Nenhuma atividade recente
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Ações */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Próximas Ações</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAction ? (
              <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-white">{nextAction.description}</p>
                  {nextAction.daysUntilExpiry && (
                    <p className="text-xs text-gray-400">
                      Vence em {nextAction.daysUntilExpiry} {nextAction.daysUntilExpiry === 1 ? 'dia' : 'dias'}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4">
                Nenhuma ação pendente
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OperationalStatsCards;
