import React, { useState, useEffect } from 'react';
// import { StandardLayout } from '@/components/StandardLayout'; // Removido para evitar navbar duplicada
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
  RefreshCw,
  Sun,
  Moon
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

const RotaSemanalSupervisao: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<VisitSchedule | null>(null);
  const [turno, setTurno] = useState<'diurno' | 'noturno'>('diurno');
  
  // Estados para filtros
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState<number>(getWeekNumber(new Date()));
  const [dateRange, setDateRange] = useState({
    start: getWeekStartDate(new Date()).toISOString().split('T')[0],
    end: getWeekEndDate(new Date()).toISOString().split('T')[0]
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
    // Carregar visitas e escalas sempre que os filtros mudarem ou na carga inicial (após loadInitialData)
    if (supervisors.length > 0) { // Garante que os supervisores foram carregados
      loadVisitsAndSchedules();
    }
  }, [selectedSupervisor, selectedClient, dateRange, turno, supervisors]);
  
  // Atualizar o calendário quando mudar o turno ou a semana
  useEffect(() => {
    // Atualizar o título da página com base no turno selecionado
    document.title = `Rota Semanal - ${turno === 'diurno' ? 'Turno Diurno' : 'Turno Noturno'} - Semana ${selectedWeek}`;
  }, [turno, selectedWeek]);

  // Função para obter o número da semana do ano
  function getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Função para obter a data de início da semana (domingo)
  function getWeekStartDate(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  }

  // Função para obter a data de fim da semana (sábado)
  function getWeekEndDate(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + 6;
    return new Date(date.setDate(diff));
  }

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
          dateRange.end,
          turno === 'noturno' // Adicionar filtro de turno
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

  const handleCreateSchedule = async (data: any) => {
    try {
      await visitScheduleService.createSchedule({
        ...data,
        isNightShift: turno === 'noturno' // Adicionar informação do turno
      });
      toast.success('Escala criada com sucesso!');
      setShowCreateForm(false);
      loadVisitsAndSchedules();
    } catch (error) {
      console.error('Erro ao criar escala:', error);
      toast.error('Erro ao criar escala');
    }
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const currentStart = new Date(dateRange.start);
    const newStart = new Date(currentStart);
    
    if (direction === 'prev') {
      newStart.setDate(currentStart.getDate() - 7);
    } else {
      newStart.setDate(currentStart.getDate() + 7);
    }
    
    const newEnd = new Date(newStart);
    newEnd.setDate(newStart.getDate() + 6);
    
    // Atualizar o intervalo de datas
    setDateRange({
      start: newStart.toISOString().split('T')[0],
      end: newEnd.toISOString().split('T')[0]
    });
    
    // Atualizar o número da semana
    const newWeek = getWeekNumber(newStart);
    setSelectedWeek(newWeek);
    
    // Atualizar o ano e mês se necessário
    setSelectedYear(newStart.getFullYear());
    setSelectedMonth(newStart.getMonth() + 1);
    
    // Carregar os dados para a nova semana se um supervisor estiver selecionado
    if (selectedSupervisor) {
      loadVisitsAndSchedules();
    }
  };

  return (
    // <StandardLayout title="Rota Semanal de Supervisão" subtitle="Controle de visitas de supervisores">
    <div className="space-y-6">
      {showCreateForm ? (
        <CreateVisitSchedule 
          onSubmit={handleCreateSchedule}
          onCancel={() => setShowCreateForm(false)}
        />
      ) : selectedSchedule ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-seguranca-lightgray">
              Detalhes da Rota
            </h2>
            <Button 
              variant="outline" 
              onClick={() => setSelectedSchedule(null)}
            >
              Voltar
            </Button>
          </div>
          
          <RouteVisualization 
            schedule={selectedSchedule}
            onStatusChange={() => loadVisitsAndSchedules()}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filtros */}
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                <Filter className="w-5 h-5 text-seguranca-yellow" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor" className="text-seguranca-lightgray">
                    Supervisor
                  </Label>
                  <Select 
                    value={selectedSupervisor} 
                    onValueChange={setSelectedSupervisor}
                  >
                    <SelectTrigger id="supervisor" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Selecione um supervisor" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      {supervisors.map(supervisor => (
                        <SelectItem key={supervisor.id} value={supervisor.id}>
                          {supervisor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-seguranca-lightgray">
                    Cliente
                  </Label>
                  <Select 
                    value={selectedClient} 
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger id="client" className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="week" className="text-seguranca-lightgray">
                    Semana
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-gray-800"
                      onClick={() => handleWeekChange('prev')}
                      title="Semana anterior"
                    >
                      &lt;
                    </Button>
                    <div className="flex-1 h-10 flex flex-col items-center justify-center bg-seguranca-black border border-gray-600 rounded-md text-seguranca-lightgray">
                      <div className="font-medium">Semana {selectedWeek}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(dateRange.start).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} - {new Date(dateRange.end).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-gray-800"
                      onClick={() => handleWeekChange('next')}
                      title="Próxima semana"
                    >
                      &gt;
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="turno" className="text-seguranca-lightgray">
                    Turno
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={turno === 'diurno' ? 'default' : 'outline'}
                      className={turno === 'diurno' 
                        ? 'bg-seguranca-yellow text-black border-2 border-seguranca-yellow shadow-md' 
                        : 'bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-gray-800'}
                      onClick={() => setTurno('diurno')}
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Diurno
                      {turno === 'diurno' && (
                        <span className="ml-1 text-xs bg-black text-white px-1 rounded">Ativo</span>
                      )}
                    </Button>
                    <Button 
                      variant={turno === 'noturno' ? 'default' : 'outline'}
                      className={turno === 'noturno' 
                        ? 'bg-blue-600 text-white border-2 border-blue-600 shadow-md' 
                        : 'bg-seguranca-black border-gray-600 text-seguranca-lightgray hover:bg-gray-800'}
                      onClick={() => setTurno('noturno')}
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Noturno
                      {turno === 'noturno' && (
                        <span className="ml-1 text-xs bg-black text-white px-1 rounded">Ativo</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Abas */}
          <div className="flex justify-between items-center">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-seguranca-black border-gray-600">
                <TabsTrigger value="calendar" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendário
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
                  <FileText className="w-4 h-4 mr-2" />
                  Lista
                </TabsTrigger>
                <TabsTrigger value="stats" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Estatísticas
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Rota
            </Button>
          </div>

          <TabsContent value="calendar">
            <div className="space-y-6">
              {/* Lista de Postos de Trabalho */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                    <MapPin className="w-5 h-5 text-seguranca-yellow" />
                    Postos de Trabalho da Semana - {turno === 'diurno' ? 'Turno Diurno' : 'Turno Noturno'}
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
                          const dateA = new Date((a as VisitSchedule).scheduleDate || (a as Visit).visitDate).getTime();
                          const dateB = new Date((b as VisitSchedule).scheduleDate || (b as Visit).visitDate).getTime();
                          return dateA - dateB;
                        })
                        .map((item, index) => {
                          const isSchedule = 'clientName' in item;
                          const date = new Date(isSchedule ? (item as VisitSchedule).scheduleDate : (item as Visit).visitDate);
                          const name = isSchedule ? (item as VisitSchedule).clientName : (item as Visit).unitName;
                          const supervisor = isSchedule ? (item as VisitSchedule).supervisorName : (item as Visit).supervisorName;
                          const time = isSchedule ? (item as VisitSchedule).startTime : (item as Visit).scheduledTime;
                          const status = isSchedule ? (item as VisitSchedule).status : (item as Visit).status;
                          
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
                                    if (isSchedule) setSelectedSchedule(item as VisitSchedule);
                                    else toast.info(`Visita selecionada: ${name || 'Sem nome'} - ${new Date(date).toLocaleDateString('pt-BR')}`);
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

          <TabsContent value="list">
            <div className="space-y-6">
              {/* Lista de Escalas */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                    <Route className="w-5 h-5 text-seguranca-yellow" />
                    Rotas de Supervisão - {turno === 'diurno' ? 'Turno Diurno' : 'Turno Noturno'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center space-y-4">
                        <div className="w-12 h-12 mx-auto border-4 border-seguranca-yellow border-t-transparent rounded-full animate-spin"></div>
                        <div>
                          <h3 className="text-lg font-medium text-seguranca-lightgray">Carregando dados...</h3>
                          <p className="text-sm text-gray-400">Aguarde enquanto carregamos as rotas</p>
                        </div>
                      </div>
                    </div>
                  ) : schedules.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                          <Route className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-seguranca-lightgray">Nenhuma rota encontrada</h3>
                          <p className="text-sm text-gray-400 mt-1">Selecione outro período ou crie uma nova rota</p>
                        </div>
                        <Button 
                          onClick={() => setShowCreateForm(true)}
                          className="mt-4 bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Nova Rota
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {schedules.map(schedule => (
                        <div 
                          key={schedule.id} 
                          className="p-4 bg-seguranca-black border border-gray-700 rounded-lg"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-seguranca-lightgray">
                                  {new Date(schedule.scheduleDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h3>
                                {getScheduleStatusBadge(schedule.status)}
                              </div>
                              <p className="text-sm text-gray-400">
                                {schedule.supervisorName} • {schedule.startTime?.substring(0, 5)} às {schedule.endTime?.substring(0, 5)}
                              </p>
                              <p className="text-sm text-gray-400">
                                Cliente: {schedule.clientName || 'N/A'}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <MapPin className="w-4 h-4" />
                                {schedule.visits?.length || 0} unidades
                                {schedule.totalTravelDistanceKm && (
                                  <span className="ml-2">
                                    • {schedule.totalTravelDistanceKm.toFixed(1)} km
                                  </span>
                                )}
                                {schedule.totalEstimatedTimeMinutes && (
                                  <span className="ml-2">
                                    • {Math.floor(schedule.totalEstimatedTimeMinutes / 60)}h{schedule.totalEstimatedTimeMinutes % 60}min
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
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
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Concluir
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <div className="space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <BarChart3 className="w-5 h-5 text-seguranca-yellow" />
                      Estatísticas de Visitas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!statistics ? (
                      <div className="text-center py-8 text-gray-400">
                        Selecione um supervisor para ver estatísticas
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-seguranca-black rounded-lg text-center">
                            <div className="text-2xl font-bold text-seguranca-yellow">
                              {statistics.totalVisits}
                            </div>
                            <div className="text-sm text-gray-400">Total de Visitas</div>
                          </div>
                          <div className="p-4 bg-seguranca-black rounded-lg text-center">
                            <div className="text-2xl font-bold text-green-500">
                              {statistics.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">Taxa de Conclusão</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Concluídas</span>
                            <span className="text-sm font-medium text-green-500">{statistics.completedVisits}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Pendentes</span>
                            <span className="text-sm font-medium text-yellow-500">{statistics.pendingVisits}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Não Concluídas</span>
                            <span className="text-sm font-medium text-red-500">{statistics.notCompletedVisits}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <TrendingUp className="w-5 h-5 text-seguranca-yellow" />
                      Eficiência de Rotas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!efficiencyReport ? (
                      <div className="text-center py-8 text-gray-400">
                        Selecione um supervisor para ver relatório de eficiência
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-seguranca-black rounded-lg text-center">
                            <div className="text-2xl font-bold text-blue-500">
                              {efficiencyReport.totalSchedules}
                            </div>
                            <div className="text-sm text-gray-400">Total de Rotas</div>
                          </div>
                          <div className="p-4 bg-seguranca-black rounded-lg text-center">
                            <div className="text-2xl font-bold text-seguranca-yellow">
                              {efficiencyReport.averageEfficiencyScore?.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-400">Eficiência Média</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Distância Total</span>
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {efficiencyReport.totalDistanceKm?.toFixed(1)} km
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Tempo de Viagem</span>
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {Math.floor((efficiencyReport.totalTravelTimeMinutes || 0) / 60)}h{(efficiencyReport.totalTravelTimeMinutes || 0) % 60}min
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Visitas Realizadas</span>
                            <span className="text-sm font-medium text-seguranca-lightgray">
                              {efficiencyReport.totalCompletedVisits || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      )}
    </div>
    // </StandardLayout>
  );
};

export default RotaSemanalSupervisao;