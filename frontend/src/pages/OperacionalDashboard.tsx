import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  TrendingUp,
  Clock,
  MapPin,
  UserCheck,
  FileText,
  RefreshCw
} from 'lucide-react';
import { operacionalService } from '@/services/operacionalService';
import { PostoOperacional, FuncionarioOperacional, EscalaOperacional, FeriasOperacional, TarefaOperacional, CoberturaOperacional } from '@/types/operacional';

const OperacionalDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [postos, setPostos] = useState<PostoOperacional[]>([]);
  const [funcionarios, setFuncionarios] = useState<FuncionarioOperacional[]>([]);
  const [escalas, setEscalas] = useState<EscalaOperacional[]>([]);
  const [ferias, setFerias] = useState<FeriasOperacional[]>([]);
  const [tarefas, setTarefas] = useState<TarefaOperacional[]>([]);
  const [coberturas, setCoberturas] = useState<CoberturaOperacional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      const [dashboard, postosData, funcionariosData, escalasData, feriasData, tarefasData, coberturasData] = await Promise.all([
        operacionalService.getDashboardData(),
        operacionalService.getPostos(),
        operacionalService.getFuncionarios(),
        operacionalService.getEscalas(),
        operacionalService.getFeriasAtivas(),
        operacionalService.getTarefasByStatus('AGENDADA'),
        operacionalService.getCoberturasAtivas()
      ]);

      setDashboardData(dashboard);
      setPostos(postosData);
      setFuncionarios(funcionariosData);
      setEscalas(escalasData);
      setFerias(feriasData);
      setTarefas(tarefasData);
      setCoberturas(coberturasData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVO': return 'bg-green-500';
      case 'FERIAS': return 'bg-blue-500';
      case 'FOLGA': return 'bg-yellow-500';
      case 'FALTA': return 'bg-red-500';
      case 'MANUTENCAO': return 'bg-orange-500';
      case 'INATIVO': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'bg-red-500';
      case 'ALTA': return 'bg-orange-500';
      case 'MEDIA': return 'bg-yellow-500';
      case 'BAIXA': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando dashboard operacional...</span>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="bg-seguranca-black/60 border border-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-seguranca-yellow animate-pulse" />
              Monitoramento Operacional
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-seguranca-lightgray">
              Dashboard Operacional
            </h1>
            <p className="text-sm sm:text-base text-seguranca-lightgray/70">
              Visão geral da operação da Promover Vigilância Patrimonial.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/30">
                {dashboardData?.postosAtivos || 0} postos ativos
              </Badge>
              <Badge variant="outline" className="border-gray-700 text-gray-300">
                {funcionarios.length} colaboradores
              </Badge>
            </div>
          </div>
          <Button
            onClick={loadDashboardData}
            disabled={refreshing}
            variant="outline"
            className="w-full sm:w-auto border-seguranca-yellow/60 text-seguranca-yellow hover:bg-seguranca-yellow/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar dados
          </Button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Postos Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">
                {dashboardData?.postosAtivos || 0}
              </div>
              <p className="text-xs text-seguranca-lightgray/70">
                de {dashboardData?.totalPostos || 0} postos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Funcionários Ativos</CardTitle>
              <Users className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">
                {dashboardData?.funcionariosAtivos || 0}
              </div>
              <p className="text-xs text-seguranca-lightgray/70">
                {dashboardData?.funcionariosFerias || 0} em férias
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Coberturas Ativas</CardTitle>
              <UserCheck className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">
                {dashboardData?.coberturasAtivas || 0}
              </div>
              <p className="text-xs text-seguranca-lightgray/70">
                substituições em andamento
              </p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Tarefas Pendentes</CardTitle>
              <CheckSquare className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">
                {dashboardData?.tarefasPendentes || 0}
              </div>
              <p className="text-xs text-seguranca-lightgray/70">
                {dashboardData?.tarefasConcluidas || 0} concluídas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com Informações Detalhadas */}
        <Tabs defaultValue="postos" className="space-y-4">
          <TabsList className="flex w-full gap-2 bg-transparent p-1 overflow-x-auto lg:grid lg:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <TabsTrigger
              value="postos"
              className="flex-1 min-w-[150px] lg:min-w-0 justify-center whitespace-nowrap border border-gray-700 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Postos
            </TabsTrigger>
            <TabsTrigger
              value="funcionarios"
              className="flex-1 min-w-[150px] lg:min-w-0 justify-center whitespace-nowrap border border-gray-700 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black"
            >
              <Users className="h-4 w-4 mr-2" />
              Funcionários
            </TabsTrigger>
            <TabsTrigger
              value="ferias"
              className="flex-1 min-w-[150px] lg:min-w-0 justify-center whitespace-nowrap border border-gray-700 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Férias
            </TabsTrigger>
            <TabsTrigger
              value="tarefas"
              className="flex-1 min-w-[150px] lg:min-w-0 justify-center whitespace-nowrap border border-gray-700 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black"
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Tarefas
            </TabsTrigger>
            <TabsTrigger
              value="coberturas"
              className="flex-1 min-w-[150px] lg:min-w-0 justify-center whitespace-nowrap border border-gray-700 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-yellow data-[state='active']:text-seguranca-black"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Coberturas
            </TabsTrigger>
          </TabsList>

          {/* Tab Postos */}
          <TabsContent value="postos" className="space-y-4 mt-1">
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Postos Operacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {postos.map((posto) => (
                    <div key={posto.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-seguranca-lightgray">{posto.nome}</h3>
                        <Badge className={`${getStatusColor(posto.status)} text-white`}>
                          {posto.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-seguranca-lightgray/70 mb-2">{posto.cliente}</p>
                      <p className="text-xs text-seguranca-lightgray/50 mb-2">{posto.endereco}</p>
                      <div className="flex items-center text-xs text-seguranca-lightgray/70">
                        <Clock className="h-3 w-3 mr-1" />
                        {posto.horarioFuncionamento}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Funcionários */}
          <TabsContent value="funcionarios" className="space-y-4 mt-1">
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {funcionarios.map((funcionario) => (
                    <div key={funcionario.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-seguranca-lightgray">{funcionario.nome}</h3>
                        <Badge className={`${getStatusColor(funcionario.status)} text-white`}>
                          {funcionario.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-seguranca-lightgray/70 mb-1">Matrícula: {funcionario.matricula}</p>
                      <p className="text-sm text-seguranca-lightgray/70 mb-1">Cargo: {funcionario.cargo}</p>
                      <p className="text-xs text-seguranca-lightgray/50">{funcionario.telefone}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Férias */}
          <TabsContent value="ferias" className="space-y-4 mt-1">
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Férias Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ferias.map((feria) => (
                    <div key={feria.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-seguranca-lightgray">{feria.funcionario.nome}</h3>
                        <Badge className={`${getStatusColor(feria.status)} text-white`}>
                          {feria.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-seguranca-lightgray/70">Período:</p>
                          <p className="text-seguranca-lightgray">
                            {new Date(feria.dataInicio).toLocaleDateString('pt-BR')} - {new Date(feria.dataFim).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-seguranca-lightgray/70">Cobertura:</p>
                          <p className="text-seguranca-lightgray">
                            {feria.funcionarioCobertura?.nome || 'Não definida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Tarefas */}
          <TabsContent value="tarefas" className="space-y-4 mt-1">
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Tarefas Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tarefas.map((tarefa) => (
                    <div key={tarefa.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-seguranca-lightgray">{tarefa.titulo}</h3>
                        <div className="flex gap-2">
                          <Badge className={`${getPriorityColor(tarefa.prioridade)} text-white`}>
                            {tarefa.prioridade}
                          </Badge>
                          <Badge className={`${getStatusColor(tarefa.status)} text-white`}>
                            {tarefa.status}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-seguranca-lightgray/70 mb-2">{tarefa.descricao}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-seguranca-lightgray/70">Posto:</p>
                          <p className="text-seguranca-lightgray">{tarefa.posto?.nome || 'Não definido'}</p>
                        </div>
                        <div>
                          <p className="text-seguranca-lightgray/70">Responsável:</p>
                          <p className="text-seguranca-lightgray">{tarefa.funcionarioResponsavel?.nome || 'Não definido'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Coberturas */}
          <TabsContent value="coberturas" className="space-y-4 mt-1">
            <Card className="bg-seguranca-black/60 border border-gray-800 rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Coberturas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coberturas.map((cobertura) => (
                    <div key={cobertura.id} className="bg-seguranca-black p-4 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-seguranca-lightgray">
                          {cobertura.funcionarioOriginal.nome} → {cobertura.funcionarioCobertura.nome}
                        </h3>
                        <Badge className={`${getStatusColor(cobertura.status)} text-white`}>
                          {cobertura.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-seguranca-lightgray/70">Posto:</p>
                          <p className="text-seguranca-lightgray">{cobertura.posto.nome}</p>
                        </div>
                        <div>
                          <p className="text-seguranca-lightgray/70">Motivo:</p>
                          <p className="text-seguranca-lightgray">{cobertura.motivo}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <p className="text-seguranca-lightgray/70">Período:</p>
                        <p className="text-seguranca-lightgray">
                          {new Date(cobertura.dataInicio).toLocaleDateString('pt-BR')} - {new Date(cobertura.dataFim).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default OperacionalDashboard;
