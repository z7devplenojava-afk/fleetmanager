import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Briefcase, 
  FileText, 
  Calendar, 
  Award, 
  Shield, 
  Building, 
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Loader2,
  TrendingUp,
  MapPin,
  DollarSign,
  UserPlus,
  UserMinus,
  FileCheck,
  Handshake,
  Settings,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import hrService from '@/services/hrService';
import { useNavigate } from 'react-router-dom';

const RH: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Buscar estatísticas de RH
  const { 
    data: stats, 
    isLoading: statsLoading,
    error: statsError 
  } = useQuery({
    queryKey: ['hrStats'],
    queryFn: () => hrService.getHRStats()
  });

  // Buscar funcionários com experiência vencendo
  const { 
    data: expiringProbation, 
    isLoading: probationLoading 
  } = useQuery({
    queryKey: ['expiringProbation'],
    queryFn: () => hrService.getEmployeesWithExpiringProbation(7)
  });

  // Loading state
  if (statsLoading || probationLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando dados de RH...</span>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (statsError) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-seguranca-red mx-auto mb-2" />
            <p className="text-seguranca-lightgray">Erro ao carregar dados de RH</p>
          </div>
        </div>
      </StandardLayout>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'VACATION':
        return 'bg-blue-100 text-blue-800';
      case 'SICK_LEAVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Recursos Humanos</h1>
            <p className="text-gray-400 mt-1">Gestão completa do Departamento Pessoal</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/rh/funcionarios/novo')}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              <UserPlus size={16} className="mr-2" />
              Novo Funcionário
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/rh/vagas/nova')}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              <Plus size={16} className="mr-2" />
              Nova Vaga
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="overview" className="text-seguranca-lightgray data-[state=active]:bg-seguranca-red">
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="employees" className="text-seguranca-lightgray data-[state=active]:bg-seguranca-red">
              Funcionários
            </TabsTrigger>
            <TabsTrigger value="operations" className="text-seguranca-lightgray data-[state=active]:bg-seguranca-red">
              Operações
            </TabsTrigger>
            <TabsTrigger value="compliance" className="text-seguranca-lightgray data-[state=active]:bg-seguranca-red">
              Compliance
            </TabsTrigger>
          </TabsList>

          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Cards de Estatísticas */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total Funcionários</CardTitle>
                    <Users className="h-4 w-4 text-seguranca-yellow" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">{stats.totalEmployees}</div>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.activeEmployees} ativos
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Vagas Abertas</CardTitle>
                    <Briefcase className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">{stats.openVacancies}</div>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.pendingTransfers} transferências pendentes
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Férias Pendentes</CardTitle>
                    <Calendar className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">{stats.pendingVacations}</div>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.onVacation} em férias
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-seguranca-lightgray">Experiência Vencendo</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-seguranca-lightgray">{stats.probationExpiring}</div>
                    <p className="text-xs text-gray-400 mt-1">
                      Próximos 7 dias
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alertas e Notificações */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Funcionários com Experiência Vencendo */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Experiência Vencendo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringProbation && expiringProbation.length > 0 ? (
                    <div className="space-y-3">
                      {expiringProbation.slice(0, 5).map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-3 bg-seguranca-black rounded-lg border border-red-500">
                          <div>
                            <p className="font-medium text-seguranca-lightgray">{employee.name}</p>
                            <p className="text-sm text-gray-400">{employee.jobInfo.position}</p>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            {new Date(employee.jobInfo.probationEndDate).toLocaleDateString('pt-BR')}
                          </Badge>
                        </div>
                      ))}
                      {expiringProbation.length > 5 && (
                        <p className="text-sm text-gray-400 text-center">
                          +{expiringProbation.length - 5} mais funcionários
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-seguranca-lightgray">Nenhuma experiência vencendo</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status por Unidade */}
              <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-500" />
                    Status por Unidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats && (
                    <div className="space-y-3">
                      {Object.entries(stats.byUnit).map(([unit, count]) => (
                        <div key={unit} className="flex items-center justify-between">
                          <span className="text-seguranca-lightgray">{unit}</span>
                          <Badge className="bg-blue-100 text-blue-800">{count}</Badge>
                        </div>
                      ))}
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
                    onClick={() => navigate('/rh/funcionarios')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <Users size={20} />
                    <span className="text-sm mt-1">Funcionários</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/vagas')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <Briefcase size={20} />
                    <span className="text-sm mt-1">Vagas</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/ferias')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <Calendar size={20} />
                    <span className="text-sm mt-1">Férias</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/rh/ocorrencias')}
                    className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black h-20 flex-col"
                  >
                    <FileText size={20} />
                    <span className="text-sm mt-1">Ocorrências</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funcionários */}
          <TabsContent value="employees" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/funcionarios')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Users className="h-5 w-5 text-seguranca-yellow" />
                    Gestão de Funcionários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Cadastro, admissão, demissão e gestão completa da vida funcional
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/remanejamentos')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Remanejamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Transferências, troca de função e movimentações de pessoal
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/ferias')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    Férias e Afastamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Controle de período aquisitivo, concessivo e afastamentos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/ocorrencias')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Ocorrências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Atestados, advertências, premiações e ausências justificadas
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/beneficios')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Benefícios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Vale transporte, refeição, assistência médica e outros benefícios
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/funcoes')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Settings className="h-5 w-5 text-gray-500" />
                    Funções
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Cadastro de funções, requisitos e treinamentos obrigatórios
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Operações */}
          <TabsContent value="operations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/vagas')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    Abertura de Vagas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Cadastro e publicação de vagas no portal institucional
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/postos')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-500" />
                    Postos de Trabalho
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Implantação e gestão de postos de trabalho
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/ordens-servico')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-purple-500" />
                    Ordens de Serviço
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Emissão de ordens de serviço por função e cliente
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/epis')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Gestão de EPI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Entrega, devolução e controle de equipamentos de proteção
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/admissao-demissao')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Handshake className="h-5 w-5 text-orange-500" />
                    Admissão/Demissão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Processo completo com checklists e geração de documentos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/relatorios')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-500" />
                    Relatórios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Relatórios gerenciais e estatísticas de RH
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Compliance */}
          <TabsContent value="compliance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/lgpd')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-500" />
                    LGPD
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Termos de proteção de dados e consentimentos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/documentos')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Gestão centralizada de documentos e contratos
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/certificacoes')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-500" />
                    Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Controle de certificações e treinamentos obrigatórios
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-seguranca-graphite border-gray-600 hover:border-gray-500 transition-colors cursor-pointer" onClick={() => navigate('/rh/sst')}>
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Controle SST
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Saúde e Segurança do Trabalho - Conformidade legal
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default RH; 