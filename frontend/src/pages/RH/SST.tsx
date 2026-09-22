import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Stethoscope, 
  HardHat, 
  AlertTriangle, 
  GraduationCap, 
  FileCheck, 
  Users, 
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sstService, SSTDashboardSummary, SSTAlert } from '@/services/sstService';
import { useToast } from '@/hooks/use-toast';
import RiskMatrixByPosition from '@/components/sst/RiskMatrixByPosition';
import CorrectiveActions from '@/components/sst/CorrectiveActions';

const SST: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados para dados reais
  const [sstStats, setSstStats] = useState<SSTDashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<SSTAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingAlerts, setCheckingAlerts] = useState(false);

  // Carregar dados do dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dashboardData, alertsData] = await Promise.all([
          sstService.getDashboardSummary(),
          sstService.getAlerts()
        ]);
        
        setSstStats(dashboardData);
        setAlerts(alertsData);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard SST:', err);
        setError('Erro ao carregar dados do dashboard');
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do dashboard SST",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  const recentAccidents = [
    {
      id: '1',
      employee: 'João Silva',
      date: '2024-01-15',
      type: 'Quase Acidente',
      severity: 'Baixa',
      status: 'Investigando'
    },
    {
      id: '2',
      employee: 'Maria Santos',
      date: '2024-01-12',
      type: 'Acidente com Afastamento',
      severity: 'Média',
      status: 'Em Tratamento'
    }
  ];

  const expiringItems = alerts
    .filter(a => !a.isResolved && a.dueDate)
    .map(a => ({
      id: a.id,
      type: a.type === 'TREINAMENTO_VENCIMENTO' ? 'Treinamento'
        : a.type === 'EPI_VENCIMENTO' ? 'EPI (CA)'
        : a.type === 'CIPA_MANDATO' ? 'CIPA'
        : a.type === 'EXAME_VENCIMENTO' ? 'ASO'
        : 'Alerta',
      employee: a.employeeName || '',
      description: a.message,
      expiryDate: a.dueDate as string,
      daysLeft: Math.ceil((new Date(a.dueDate as string).getTime() - Date.now()) / 86400000),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Verificação manual de vencimentos (roda o scheduler sob demanda)
  const handleRunAlertCheck = async () => {
    try {
      setCheckingAlerts(true);
      const result = await sstService.runAlertCheck();
      const total = (result?.asoAlerts || 0) + (result?.cnhAlerts || 0) + (result?.trainingAlerts || 0)
        + (result?.epiCaAlerts || 0) + (result?.cipaAlerts || 0);
      toast({
        title: 'Verificação concluída',
        description: total > 0
          ? `${total} novo(s) alerta(s) de vencimento gerado(s).`
          : 'Nenhum novo vencimento encontrado.',
      });
      const alertsData = await sstService.getAlerts();
      setAlerts(alertsData);
    } catch (err) {
      console.error('Erro ao executar verificação de vencimentos:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível executar a verificação de vencimentos.',
        variant: 'destructive',
      });
    } finally {
      setCheckingAlerts(false);
    }
  };

  // Função para marcar alerta como lido
  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await sstService.markAlertAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      ));
      toast({
        title: "Sucesso",
        description: "Alerta marcado como lido",
      });
    } catch (err) {
      console.error('Erro ao marcar alerta como lido:', err);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o alerta como lido",
        variant: "destructive",
      });
    }
  };

  // Função para marcar alerta como resolvido
  const handleMarkAlertAsResolved = async (alertId: string) => {
    try {
      await sstService.markAlertAsResolved(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, isResolved: true, resolvedAt: new Date().toISOString() } : alert
      ));
      toast({
        title: "Sucesso",
        description: "Alerta marcado como resolvido",
      });
    } catch (err) {
      console.error('Erro ao marcar alerta como resolvido:', err);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o alerta como resolvido",
        variant: "destructive",
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Baixa':
        return 'bg-green-100 text-green-800';
      case 'Média':
        return 'bg-yellow-100 text-yellow-800';
      case 'Alta':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Investigando':
        return 'bg-blue-100 text-blue-800';
      case 'Em Tratamento':
        return 'bg-orange-100 text-orange-800';
      case 'Concluído':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryColor = (daysLeft: number) => {
    if (daysLeft <= 7) return 'text-red-600';
    if (daysLeft <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Se estiver carregando, mostrar loading
  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
            <p className="text-seguranca-lightgray">Carregando dados do SST...</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Se houver erro, mostrar mensagem de erro
  if (error) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-red-500">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
              <Shield className="h-8 w-8 text-seguranca-yellow" />
              Controle SST
            </h1>
            <p className="text-gray-400 mt-1">Saúde e Segurança do Trabalho - Conformidade Legal</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/sst/relatorios')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
            <Button 
              onClick={() => navigate('/rh/sst/exames')}
              className="bg-seguranca-red hover:bg-seguranca-darkred w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Exame
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-2 bg-seguranca-graphite border-gray-600 p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Conformidade
            </TabsTrigger>
            <TabsTrigger value="risks" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Riscos
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Ações
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">ASO em Dia</CardTitle>
                  <Stethoscope className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-lightgray">
                    {sstStats 
                      ? `${sstStats.asoUpToDate ?? 0}/${sstStats.totalEmployees ?? 0}` 
                      : '0/0'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {sstStats && sstStats.totalEmployees && sstStats.totalEmployees > 0
                      ? `${(((sstStats.asoUpToDate ?? 0) / sstStats.totalEmployees) * 100).toFixed(1)}% dos funcionários`
                      : '0% dos funcionários'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">EPIs Válidos</CardTitle>
                  <HardHat className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-lightgray">
                    {sstStats 
                      ? `${sstStats.epiValid ?? 0}/${sstStats.totalEmployees ?? 0}` 
                      : '0/0'}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {sstStats && sstStats.totalEmployees && sstStats.totalEmployees > 0
                      ? `${(((sstStats.epiValid ?? 0) / sstStats.totalEmployees) * 100).toFixed(1)}% dos funcionários`
                      : '0% dos funcionários'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">Acidentes (Mês)</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-lightgray">{sstStats?.accidentsThisMonth || 0}</div>
                  <p className="text-xs text-gray-400 mt-1 flex items-center">
                    {sstStats && sstStats.accidentsThisMonth < sstStats.accidentsLastMonth ? (
                      <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    vs {sstStats?.accidentsLastMonth || 0} mês anterior
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-seguranca-lightgray">Treinamentos Pendentes</CardTitle>
                  <GraduationCap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-seguranca-lightgray">{sstStats?.trainingPending || 0}</div>
                  <p className="text-xs text-gray-400 mt-1">
                    {sstStats?.inspectionPending || 0} inspeções pendentes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Próximos Vencimentos (dados reais dos alertas) */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" />
                  Próximos Vencimentos (30 dias)
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunAlertCheck}
                  disabled={checkingAlerts}
                  className="border-gray-600 text-seguranca-lightgray"
                >
                  {checkingAlerts ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Verificar vencimentos agora
                </Button>
              </CardHeader>
              <CardContent>
                {expiringItems.length > 0 ? (
                  <div className="space-y-2">
                    {expiringItems.slice(0, 8).map((item) => (
                      <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        item.daysLeft < 0 ? 'bg-red-900/20 border-red-500' :
                        item.daysLeft <= 7 ? 'bg-orange-900/20 border-orange-500' :
                        'bg-yellow-900/20 border-yellow-500'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">{item.type}</Badge>
                            {item.employee && (
                              <p className="font-medium text-seguranca-lightgray">{item.employee}</p>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">{item.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className={`text-sm font-medium ${item.daysLeft < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                            {item.daysLeft < 0 ? `Vencido há ${Math.abs(item.daysLeft)}d` : `${item.daysLeft}d restantes`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.expiryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="text-seguranca-lightgray">Nenhum vencimento nos próximos 30 dias</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertas e Notificações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alertas SST */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Alertas SST ({alerts.filter(a => !a.isRead).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                          alert.priority === 4 ? 'bg-red-900/20 border-red-500' :
                          alert.priority === 3 ? 'bg-orange-900/20 border-orange-500' :
                          alert.priority === 2 ? 'bg-yellow-900/20 border-yellow-500' :
                          'bg-blue-900/20 border-blue-500'
                        }`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-seguranca-lightgray">{alert.title}</p>
                              {!alert.isRead && (
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{alert.message}</p>
                            {alert.employeeName && (
                              <p className="text-xs text-gray-500">Funcionário: {alert.employeeName}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {!alert.isRead && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAlertAsRead(alert.id)}
                                className="text-xs"
                              >
                                Marcar como lido
                              </Button>
                            )}
                            {!alert.isResolved && (
                              <Button
                                size="sm"
                                onClick={() => handleMarkAlertAsResolved(alert.id)}
                                className="text-xs bg-green-600 hover:bg-green-700"
                              >
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {alerts.length > 5 && (
                        <div className="text-center pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab('actions')}
                            className="text-seguranca-lightgray"
                          >
                            Ver todos os alertas ({alerts.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-seguranca-lightgray">Nenhum alerta pendente</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Acidentes Recentes */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Acidentes Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentAccidents.length > 0 ? (
                    <div className="space-y-3">
                      {recentAccidents.map((accident) => (
                        <div key={accident.id} className="flex items-center justify-between p-3 bg-seguranca-black rounded-lg border border-red-500">
                          <div>
                            <p className="font-medium text-seguranca-lightgray">{accident.employee}</p>
                            <p className="text-sm text-gray-400">{accident.type}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getSeverityColor(accident.severity)}>
                              {accident.severity}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(accident.date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-seguranca-lightgray">Nenhum acidente recente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Ações Rápidas */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/sst/exames')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <Stethoscope size={20} />
                    <span className="text-sm mt-1">Exames Médicos</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/sst/epis')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <HardHat size={20} />
                    <span className="text-sm mt-1">EPIs</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/sst/acidentes')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <AlertTriangle size={20} />
                    <span className="text-sm mt-1">Acidentes</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/sst/treinamentos')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <GraduationCap size={20} />
                    <span className="text-sm mt-1">Treinamentos</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conformidade */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/exames')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-green-500" />
                    Exames Médicos (ASO)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Controle de exames admissional, periódico, retorno, mudança de função e demissional
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/epis')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-blue-500" />
                    Equipamentos de Proteção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Entrega, controle e vencimento de EPIs por funcionário e cargo
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/treinamentos')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-500" />
                    Treinamentos SST
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    NR-35, CIPA, NR-10, brigada de incêndio e outros treinamentos obrigatórios
                  </p>
                </CardContent>
              </Card>

              {/* TODO: Implementar página de Inspeções
              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/inspecoes')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-orange-500" />
                    Inspeções e Auditorias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Checklists de segurança, inspeções de EPIs e auditorias de conformidade
                  </p>
                </CardContent>
              </Card>
              */}

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/cipa')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-500" />
                    CIPA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Gestão da Comissão Interna de Prevenção de Acidentes
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst/relatorios')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                    Relatórios SST
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Relatórios de conformidade, estatísticas e indicadores de SST
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Riscos */}
          <TabsContent value="risks" className="space-y-6">
            <RiskMatrixByPosition />
          </TabsContent>

          {/* Ações */}
          <TabsContent value="actions" className="space-y-6">
            <CorrectiveActions />
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default SST;

