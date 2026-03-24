import React, { useState, useEffect } from 'react';
import { UUID } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp,
  Users,
  MapPin,
  Eye,
  Plus,
  Activity
} from 'lucide-react';
import NewVisitModal from './NewVisitModal';
import AllVisitsModal from './AllVisitsModal';
import { visitService } from '@/services/visitService';
import { Visit } from '@/types/visit';

interface VisitSummary {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  cancelledVisits: number;
  completionRate: number;
  activeSupervisors: number;
  todayVisits: number;
}

interface RecentVisit {
  id: UUID;
  time: string;
  supervisor: string;
  unit: string;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'IN_PROGRESS';
}

const VisitWidget: React.FC = () => {
  const [summary, setSummary] = useState<VisitSummary>({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    cancelledVisits: 0,
    completionRate: 0,
    activeSupervisors: 0,
    todayVisits: 0
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewVisitModal, setShowNewVisitModal] = useState(false);
  const [showAllVisitsModal, setShowAllVisitsModal] = useState(false);

  useEffect(() => {
    fetchVisitData();
  }, []);

  const fetchVisitData = async () => {
    setIsLoading(true);
    try {
      // Buscar visitas recentes do backend (últimas 3, ordenadas por data descendente)
      // Usar o endpoint com ordenação por visitDate DESC para pegar as mais recentes
      const visitsResponse = await visitService.getVisits({}, 0, 10, 'visitDate', 'DESC');
      let visits = visitsResponse.content || [];
      
      // Garantir que pegamos as 3 mais recentes
      visits = visits.slice(0, 3);
      
      // Calcular estatísticas
      const today = new Date().toISOString().split('T')[0];
      const todayVisits = visits.filter(v => v.visitDate === today);
      const completedVisits = visits.filter(v => v.status === 'COMPLETED').length;
      const pendingVisits = visits.filter(v => v.status === 'PENDING' || v.status === 'SCHEDULED').length;
      const cancelledVisits = visits.filter(v => v.status === 'CANCELLED').length;
      const totalVisits = visits.length;
      const completionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
      
      // Buscar todas as visitas para calcular estatísticas completas
      const allVisitsResponse = await visitService.getVisits({}, 0, 1000);
      const allVisits = allVisitsResponse.content || [];
      const allCompleted = allVisits.filter(v => v.status === 'COMPLETED').length;
      const allPending = allVisits.filter(v => v.status === 'PENDING' || v.status === 'SCHEDULED').length;
      const allCancelled = allVisits.filter(v => v.status === 'CANCELLED').length;
      const allTotal = allVisitsResponse.totalElements || 0;
      const allCompletionRate = allTotal > 0 ? (allCompleted / allTotal) * 100 : 0;
      
      // Contar supervisores únicos
      const uniqueSupervisors = new Set(allVisits.map(v => v.supervisorId).filter(Boolean));
      
      setSummary({
        totalVisits: allTotal,
        completedVisits: allCompleted,
        pendingVisits: allPending,
        cancelledVisits: allCancelled,
        completionRate: allCompletionRate,
        activeSupervisors: uniqueSupervisors.size,
        todayVisits: todayVisits.length
      });

      // Converter visitas para o formato RecentVisit
      const recentVisitsData: RecentVisit[] = visits.slice(0, 3).map(visit => {
        // Formatar hora da visita
        let timeStr = '';
        if (visit.visitTime) {
          try {
            // Se visitTime já está no formato HH:mm, usar diretamente
            if (visit.visitTime.match(/^\d{2}:\d{2}$/)) {
              timeStr = visit.visitTime;
            } else {
              // Tentar parsear como datetime
              const timeParts = visit.visitTime.split('T')[1]?.split(':') || [];
              if (timeParts.length >= 2) {
                timeStr = `${timeParts[0]}:${timeParts[1]}`;
              } else {
                timeStr = visit.visitTime.substring(0, 5);
              }
            }
          } catch (e) {
            timeStr = visit.visitTime.substring(0, 5) || '00:00';
          }
        } else {
          timeStr = '00:00';
        }
        
        return {
          id: visit.id,
          time: timeStr,
          supervisor: visit.supervisorName || 'Não informado',
          unit: visit.workPostName || visit.clientName || 'Não informado',
          status: (visit.status || 'SCHEDULED') as 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'IN_PROGRESS'
        };
      });
      
      setRecentVisits(recentVisitsData);
    } catch (error) {
      console.error('Erro ao buscar dados de visitas:', error);
      // Em caso de erro, manter dados vazios
      setSummary({
        totalVisits: 0,
        completedVisits: 0,
        pendingVisits: 0,
        cancelledVisits: 0,
        completionRate: 0,
        activeSupervisors: 0,
        todayVisits: 0
      });
      setRecentVisits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      COMPLETED: { label: 'Concluída', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
      PENDING: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
      IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Activity }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border flex items-center gap-1 text-xs`}>
        <Icon className="w-2 h-2" />
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resumo de Métricas */}
        <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray text-lg">
            <Calendar className="w-5 h-5 text-seguranca-darkred" />
            Controle de Visitas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4 text-seguranca-lightgray/60">
              Carregando...
            </div>
          ) : (
            <>
              {/* Métricas principais em grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-seguranca-black rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">{summary.todayVisits}</div>
                  <div className="text-xs text-seguranca-lightgray/70">Hoje</div>
                </div>
                <div className="text-center p-3 bg-seguranca-black rounded-lg">
                  <div className="text-2xl font-bold text-green-400">{summary.completionRate.toFixed(1)}%</div>
                  <div className="text-xs text-seguranca-lightgray/70">Taxa de Sucesso</div>
                </div>
              </div>

              {/* Status das visitas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-seguranca-lightgray/70">Realizadas</span>
                  <span className="text-sm font-medium text-green-400">{summary.completedVisits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-seguranca-lightgray/70">Pendentes</span>
                  <span className="text-sm font-medium text-yellow-400">{summary.pendingVisits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-seguranca-lightgray/70">Supervisores Ativos</span>
                  <span className="text-sm font-medium text-blue-400">{summary.activeSupervisors}</span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-seguranca-darkred hover:bg-seguranca-red text-white text-xs"
                  onClick={() => setShowNewVisitModal(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Visita
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700 text-xs"
                  onClick={() => setShowAllVisitsModal(true)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Todas
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Visitas Recentes */}
      <Card className="lg:col-span-2 bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-seguranca-lightgray text-lg">
              <Clock className="w-5 h-5 text-seguranca-darkred" />
              Visitas Recentes
            </CardTitle>
            <div className="flex items-center gap-1 text-xs text-seguranca-lightgray/70">
              <TrendingUp className="w-3 h-3" />
              Últimas 3 visitas
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-6 text-seguranca-lightgray/60">
              Carregando visitas...
            </div>
          ) : (
            <div className="space-y-3">
              {recentVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 bg-seguranca-black rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-sm font-medium text-seguranca-lightgray">
                      {visit.time}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-seguranca-lightgray">
                        {visit.unit}
                      </div>
                      <div className="text-xs text-seguranca-lightgray/70 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {visit.supervisor}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(visit.status)}
                  </div>
                </div>
              ))}
              
              {recentVisits.length === 0 && (
                <div className="text-center py-6 text-seguranca-lightgray/60">
                  Nenhuma visita recente
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>

    {/* Modais */}
    <NewVisitModal 
      open={showNewVisitModal}
      onOpenChange={setShowNewVisitModal}
      onVisitCreated={() => {
        fetchVisitData(); // Recarregar dados após criar visita
        setShowNewVisitModal(false);
      }}
    />
    
    <AllVisitsModal 
      open={showAllVisitsModal}
      onOpenChange={setShowAllVisitsModal}
    />
    </>
  );
};

export default VisitWidget;
