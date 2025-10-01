import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  BarChart3, 
  FileText,
  Plus,
  Filter,
  Route,
  MapPin,
  Building2,
  TrendingUp,
  Eye,
  Edit,
  Play,
  Square,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  Visit, 
  VisitStatus, 
  VisitStatistics, 
  VisitSchedule, 
  VisitScheduleStatus,
  Client,
  EfficiencyReport
} from '@/types/visit';
import { Employee } from '@/types/employee';
import { visitService } from '@/services/visitService';
import { employeeService } from '@/services/employeeService';
import visitScheduleService from '@/services/visitScheduleService';
import clientService from '@/services/clientService';
import CreateVisitSchedule from '@/components/visits/CreateVisitSchedule';
import RouteVisualization from '@/components/visits/RouteVisualization';
import VisitCalendar from '@/components/visits/VisitCalendar';
import RotaSemanalSupervisao from '@/pages/RotaSemanalSupervisao'; // Importar o componente da rota semanal de supervisão

const ControleVisitasAvancado: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<VisitSchedule | null>(null);
  
  // Estados para filtros
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });
  
  // Estados para dados
  const [visits, setVisits] = useState<Visit[]>([]);
  const [schedules, setSchedules] = useState<VisitSchedule[]>([]);
  const [statistics, setStatistics] = useState<VisitStatistics | null>(null);
  const [efficiencyReport, setEfficiencyReport] = useState<EfficiencyReport | null>(null);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedSupervisor) {
      loadVisitsAndSchedules();
    }
  }, [selectedSupervisor, selectedClient, dateRange]);

  // Ajustar valor do cliente quando for "all"
  const getClientFilter = () => {
    return selectedClient === "all" ? "" : selectedClient;
  };

  const loadInitialData = async () => {
    try {
      const [employeesData, clientsData] = await Promise.all([
        employeeService.getAllEmployees(),
        clientService.getAllClients()
      ]);
      
      // Verificar se os dados são arrays
      const employeesList = Array.isArray(employeesData) ? employeesData : [];
      const clientsList = Array.isArray(clientsData) ? clientsData : [];
      
      const supervisorsList = employeesList.filter(emp => 
        emp.position?.name?.toLowerCase().includes('supervisor') ||
        emp.jobInfo?.position?.toLowerCase().includes('supervisor')
      );
      
      setSupervisors(supervisorsList);
      setClients(clientsList);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast.error('Erro ao carregar dados');
      // Definir arrays vazios em caso de erro
      setSupervisors([]);
      setClients([]);
    }
  };

  const loadVisitsAndSchedules = async () => {
    if (!selectedSupervisor) return;
    
    setLoading(true);
    try {
      const [schedulesData, visitsData, reportData] = await Promise.all([
        visitScheduleService.getSchedulesBySupervisor(
          selectedSupervisor, 
          dateRange.start, 
          dateRange.end
        ),
        visitService.getVisitsBySupervisor(
          selectedSupervisor,
          selectedYear,
          selectedMonth
        ),
        visitScheduleService.getEfficiencyReport(
          selectedSupervisor,
          dateRange.start,
          dateRange.end
        )
      ]);
      
      setSchedules(schedulesData);
      setVisits(visitsData);
      setEfficiencyReport(reportData);
      
      // Calcular estatísticas
      const stats = {
        totalVisits: visitsData.length,
        completedVisits: visitsData.filter(v => v.status === VisitStatus.COMPLETED).length,
        pendingVisits: visitsData.filter(v => v.status === VisitStatus.PENDING).length,
        notCompletedVisits: visitsData.filter(v => v.status === VisitStatus.NOT_COMPLETED).length,
        completionRate: visitsData.length > 0 
          ? (visitsData.filter(v => v.status === VisitStatus.COMPLETED).length / visitsData.length) * 100 
          : 0
      };
      setStatistics(stats);
      
    } catch (error) {
      console.error('Erro ao carregar visitas e escalas:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleAction = async (scheduleId: string, action: 'start' | 'complete' | 'reoptimize') => {
    try {
      let result;
      switch (action) {
        case 'start':
          result = await visitScheduleService.startSchedule(scheduleId);
          toast.success('Escala iniciada com sucesso');
          break;
        case 'complete':
          result = await visitScheduleService.completeSchedule(scheduleId);
          toast.success('Escala concluída com sucesso');
          break;
        case 'reoptimize':
          result = await visitScheduleService.reoptimizeSchedule(scheduleId);
          toast.success(`Escala re-otimizada! Novo score: ${result.routeOptimizationScore?.toFixed(1)}%`);
          break;
      }
      
      // Recarregar dados
      loadVisitsAndSchedules();
    } catch (error) {
      console.error(`Erro ao ${action} escala:`, error);
      toast.error(`Erro ao ${action} escala`);
    }
  };

  const getScheduleStatusBadge = (status: VisitScheduleStatus) => {
    const statusConfig = {
      PLANNED: { color: 'bg-blue-500', text: 'Planejada' },
      IN_PROGRESS: { color: 'bg-orange-500', text: 'Em Execução' },
      COMPLETED: { color: 'bg-green-500', text: 'Concluída' },
      CANCELLED: { color: 'bg-red-500', text: 'Cancelada' },
      RESCHEDULED: { color: 'bg-purple-500', text: 'Reagendada' }
    };
    
    const config = statusConfig[status] || statusConfig.PLANNED;
    
    return (
      <Badge className={`${config.color} text-white`}>
        {config.text}
      </Badge>
    );
  };

  const getEfficiencyColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <StandardLayout 
      title="Controle de Visitas Avançado"
      subtitle="Gerenciamento inteligente de escalas e otimização de rotas"
    >
      <div className="space-y-6">
        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Supervisor</Label>
                <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar supervisor" />
                  </SelectTrigger>
                  <SelectContent>
                    {supervisors.filter(supervisor => supervisor.id).map(supervisor => (
                      <SelectItem key={supervisor.id} value={supervisor.id!}>
                        {supervisor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clients.filter(client => client.id).map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        {efficiencyReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Escalas Totais</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{efficiencyReport.totalSchedules}</div>
                <p className="text-xs text-muted-foreground">
                  {efficiencyReport.completedSchedules} concluídas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {efficiencyReport.completionRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getEfficiencyColor(efficiencyReport.avgOptimizationScore)}`}>
                  {efficiencyReport.avgOptimizationScore.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distância Total</CardTitle>
                <MapPin className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {efficiencyReport.totalDistanceKm.toFixed(1)}km
                </div>
                <p className="text-xs text-muted-foreground">
                  {efficiencyReport.totalTimeHours.toFixed(1)}h de viagem
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="calendar">Calendário</TabsTrigger>
              <TabsTrigger value="schedules">Escalas</TabsTrigger>
              <TabsTrigger value="route">Visualizar Rota</TabsTrigger>
              <TabsTrigger value="optimized-schedules">Escalas Otimizadas</TabsTrigger> {/* Nova Aba */}
            </TabsList>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Escala
            </Button>
          </div>

          <TabsContent value="calendar">
            <div className="space-y-6">
              {/* Lista de Postos de Trabalho */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                    <MapPin className="w-5 h-5 text-seguranca-yellow" />
                    Postos de Trabalho da Semana - {selectedSupervisor ? supervisors.find(s => s.id === selectedSupervisor)?.name : 'Todos'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto border-4 border-seguranca-yellow border-t-transparent rounded-full animate-spin"></div>
                        <div>
                          <h3 className="text-lg font-medium text-seguranca-lightgray">Carregando postos de trabalho...</h3>
                          <p className="text-sm text-gray-400">Aguarde enquanto carregamos os locais de visita</p>
                        </div>
                      </div>
                    </div>
                  ) : (schedules.length === 0 && visits.length === 0) ? (
                    <div className="text-center py-16">
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-seguranca-lightgray">Nenhum posto de trabalho encontrado</h3>
                          <p className="text-sm text-gray-400 mt-1">Selecione outro período ou supervisor</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[...schedules, ...visits]
                        .sort((a, b) => {
                          const dateA = new Date(('scheduleDate' in a ? a.scheduleDate : a.visitDate)).getTime();
                          const dateB = new Date(('scheduleDate' in b ? b.scheduleDate : b.visitDate)).getTime();
                          return dateA - dateB;
                        })
                        .map((item, index) => {
                          const isSchedule = 'clientName' in item;
                          const date = new Date(isSchedule ? item.scheduleDate : item.visitDate);
                          const name = isSchedule ? item.clientName : item.unitName;
                          const supervisor = isSchedule ? item.supervisorName : item.supervisorName;
                          const time = isSchedule ? item.startTime : item.scheduledTime;
                          const status = isSchedule ? item.status : item.status;
                          
                          return (
                            <div 
                              key={index} 
                              className="p-4 bg-seguranca-black border border-gray-700 rounded-lg"
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-medium text-seguranca-lightgray">
                                      {name || 'Posto de Trabalho'}
                                    </h3>
                                    {getScheduleStatusBadge(status as VisitScheduleStatus)}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} • {time?.substring(0, 5) || 'N/A'}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    Supervisor: {supervisor || 'N/A'}
                                  </p>
                                </div>
                                
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Definir selectedSchedule para visualização da rota ou exibir detalhes da visita
                                    if (isSchedule) {
                                      setSelectedSchedule(item as VisitSchedule);
                                      setActiveTab('route'); // Mudar para a aba de rota ao selecionar uma escala
                                    } else {
                                      toast.info(`Visita selecionada: ${name || 'Sem nome'} - ${new Date(date).toLocaleDateString('pt-BR')}`);
                                      // Implementar lógica para exibir detalhes da visita, se necessário
                                    }
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver Detalhes
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedules">
            <div className="space-y-4">
              {schedules.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Route className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma escala encontrada</h3>
                    <p className="text-gray-500 text-center mb-4">
                      Crie uma nova escala para começar a otimizar as rotas de visitas
                    </p>
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Primeira Escala
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                schedules.map(schedule => (
                  <Card key={schedule.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            {schedule.clientName}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {new Date(schedule.scheduleDate).toLocaleDateString('pt-BR')} • 
                            {schedule.startTime} - {schedule.endTime}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScheduleStatusBadge(schedule.status)}
                          {schedule.routeOptimizationScore && (
                            <Badge variant="outline" className={getEfficiencyColor(schedule.routeOptimizationScore)}>
                              {schedule.routeOptimizationScore.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold">{schedule.visits?.length || 0}</div>
                          <div className="text-sm text-gray-500">Visitas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {schedule.totalTravelDistanceKm?.toFixed(1) || '0'}km
                          </div>
                          <div className="text-sm text-gray-500">Distância</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {Math.ceil((schedule.totalEstimatedTimeMinutes || 0) / 60)}h
                          </div>
                          <div className="text-sm text-gray-500">Tempo Total</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedSchedule(schedule)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Rota
                        </Button>
                        
                        {schedule.status === VisitScheduleStatus.PLANNED && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleScheduleAction(schedule.id!, 'start')}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Iniciar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScheduleAction(schedule.id!, 'reoptimize')}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Re-otimizar
                            </Button>
                          </>
                        )}
                        
                        {schedule.status === VisitScheduleStatus.IN_PROGRESS && (
                          <Button
                            size="sm"
                            onClick={() => handleScheduleAction(schedule.id!, 'complete')}
                          >
                            <Square className="w-4 h-4 mr-1" />
                            Concluir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="route">
            {selectedSchedule ? (
              <RouteVisualization schedule={selectedSchedule} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma escala</h3>
                  <p className="text-gray-500 text-center">
                    Escolha uma escala na aba "Escalas" para visualizar a rota otimizada
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Conteúdo da Nova Aba: Escalas Otimizadas */}
          <TabsContent value="optimized-schedules">
            <RotaSemanalSupervisao />
          </TabsContent>
        </Tabs>

        {/* Modal de Criação */}
        {showCreateForm && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-start sm:items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateForm(false);
              }
            }}
          >
            <div 
              className="bg-seguranca-graphite rounded-lg w-full max-w-7xl max-h-[95vh] overflow-y-auto border border-gray-600 my-2 sm:my-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-6">
                <CreateVisitSchedule
                  onScheduleCreated={(schedule) => {
                    setShowCreateForm(false);
                    setSelectedSchedule(schedule);
                    setActiveTab('route');
                    loadVisitsAndSchedules();
                  }}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </StandardLayout>
  );
};

export default ControleVisitasAvancado;
