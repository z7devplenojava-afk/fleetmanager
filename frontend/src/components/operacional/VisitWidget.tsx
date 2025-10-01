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

  useEffect(() => {
    fetchVisitData();
  }, []);

  const fetchVisitData = async () => {
    setIsLoading(true);
    try {
      // Simular dados para demonstração
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSummary({
        totalVisits: 142,
        completedVisits: 128,
        pendingVisits: 8,
        cancelledVisits: 6,
        completionRate: 90.1,
        activeSupervisors: 12,
        todayVisits: 15
      });

      setRecentVisits([
        {
          id: '1',
          time: '14:30',
          supervisor: 'Maria Santos',
          unit: 'Shopping Center Norte',
          status: 'COMPLETED'
        },
        {
          id: '2',
          time: '10:15',
          supervisor: 'João Silva',
          unit: 'Condomínio Residencial',
          status: 'IN_PROGRESS'
        },
        {
          id: '3',
          time: '09:00',
          supervisor: 'Ana Costa',
          unit: 'Empresa ABC Ltda',
          status: 'PENDING'
        }
      ]);
    } catch (error) {
      console.error('Erro ao buscar dados de visitas:', error);
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
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nova Visita
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-transparent border-gray-600 text-seguranca-lightgray hover:bg-gray-700 text-xs"
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
  );
};

export default VisitWidget;
