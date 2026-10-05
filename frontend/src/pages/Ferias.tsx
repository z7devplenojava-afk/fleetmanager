import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { 
  Calendar, 
  Plus, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  History,
  Play,
  Ban
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService, Employee } from '@/services/employeeService';
import { feriasService } from '@/services/feriasService';
import { PeriodoAquisitivo, FeriasColetiva, AlertaConcessivo } from '@/types/ferias';
import FeriasFormModal from '@/components/ferias/FeriasFormModal';
import FeriasColetivasModal from '@/components/ferias/FeriasColetivasModal';
import AfastamentoFormModal from '@/components/ferias/AfastamentoFormModal';
import FeriasReportModal from '@/components/ferias/FeriasReportModal';
import ApprovalModal from '@/components/ferias/ApprovalModal';

interface FeriasPeriodo {
  id: string;
  employeeId: string;
  employeeName: string;
  periodoAquisitivo: string; // ex: "2024/2025"
  dataInicio: string;
  dataFim: string;
  status: 'PENDENTE' | 'APROVADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  tipo: 'FERIAS_NORMAIS' | 'FERIAS_VENDIDAS' | 'ABONO_PECUNIARIO';
  observacoes?: string;
  createdAt: string;
}

interface Afastamento {
  id: string;
  employeeId: string;
  employeeName: string;
  tipo: 'ATESTADO' | 'LICENCA_MEDICA' | 'LICENCA_MATERNIDADE' | 'LICENCA_PATERNIDADE' | 'SUSPENSAO' | 'OUTROS';
  dataInicio: string;
  dataFim: string;
  status: 'PENDENTE' | 'APROVADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  motivo: string;
  documento?: string;
  observacoes?: string;
  createdAt: string;
}

const FeriasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ferias');
  const [searchTerm, setSearchTerm] = useState('');
  const [feriasModalOpen, setFeriasModalOpen] = useState(false);
  const [afastamentoModalOpen, setAfastamentoModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FeriasPeriodo | Afastamento | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Período aquisitivo: colaborador selecionado na aba dedicada
  const [paEmployeeId, setPaEmployeeId] = useState<string>('');
  // Férias coletivas (Fase 2)
  const [coletivaModalOpen, setColetivaModalOpen] = useState(false);
  const [coletivaEditing, setColetivaEditing] = useState<FeriasColetiva | null>(null);
  const [coletivaActionId, setColetivaActionId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { canApproveVacations, canApproveAbsences, canAccessReports } = useUserPermissions();

  // Buscar dados reais da API
  const { data: feriasPeriodos = [], isLoading: feriasLoading, error: feriasError } = useQuery({
    queryKey: ['ferias'],
    queryFn: () => feriasService.getFerias(),
    retry: 2,
    retryDelay: 1000
  });

  const { data: afastamentos = [], isLoading: afastamentosLoading, error: afastamentosError } = useQuery({
    queryKey: ['afastamentos'],
    queryFn: () => feriasService.getAfastamentos(),
    retry: 2,
    retryDelay: 1000
  });

  // Buscar funcionários para filtros
  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => employeeService.getAllEmployees(),
  });

  // Período aquisitivo do colaborador selecionado (RF-01)
  const { data: periodosAquisitivos = [], isLoading: paLoading } = useQuery<PeriodoAquisitivo[]>({
    queryKey: ['periodo-aquisitivo', paEmployeeId],
    queryFn: () => feriasService.getPeriodosAquisitivos(paEmployeeId),
    enabled: !!paEmployeeId,
    retry: 1
  });

  const { data: saldoFerias } = useQuery({
    queryKey: ['saldo-ferias', paEmployeeId],
    queryFn: () => feriasService.getSaldoFerias(paEmployeeId),
    enabled: !!paEmployeeId,
    retry: 1
  });

  // Férias coletivas e alertas de período concessivo (RF-04 e RF-07 — Fase 2)
  const { data: coletivas = [], isLoading: coletivasLoading } = useQuery<FeriasColetiva[]>({
    queryKey: ['ferias-coletivas'],
    queryFn: () => feriasService.getColetivas(),
    retry: 1
  });

  const { data: alertasConcessivo = [] } = useQuery<AlertaConcessivo[]>({
    queryKey: ['alertas-concessivo'],
    queryFn: () => feriasService.getAlertasConcessivo(),
    retry: 1
  });

  // Calcular estatísticas dos dados carregados
  const feriasPendentes = feriasPeriodos.filter(f => f.status === 'PENDENTE').length;
  const feriasAprovadas = feriasPeriodos.filter(f => f.status === 'APROVADO').length;
  const afastamentosAtivos = afastamentos.filter(a => a.status === 'EM_ANDAMENTO' || a.status === 'APROVADO').length;
  const totalFuncionarios = employees?.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-500 text-black';
      case 'APROVADO': return 'bg-green-500 text-white';
      case 'REJECTED': return 'bg-red-500 text-white';
      case 'CANCELADO': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'FERIAS_NORMAIS': return 'bg-blue-500 text-white';
      case 'FERIAS_VENDIDAS': return 'bg-orange-500 text-white';
      case 'ABONO_PECUNIARIO': return 'bg-purple-500 text-white';
      case 'ATESTADO': return 'bg-yellow-500 text-black';
      case 'LICENCA_MEDICA': return 'bg-red-500 text-white';
      case 'LICENCA_MATERNIDADE': return 'bg-pink-500 text-white';
      case 'LICENCA_PATERNIDADE': return 'bg-cyan-500 text-white';
      case 'SUSPENSAO': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleOpenFeriasModal = () => {
    setFeriasModalOpen(true);
  };

  const handleOpenAfastamentoModal = () => {
    setAfastamentoModalOpen(true);
  };

  const handleCloseModals = () => {
    console.log('Fechando modais');
    setFeriasModalOpen(false);
    setAfastamentoModalOpen(false);
    setViewModalOpen(false);
    setEditModalOpen(false);
    setReportModalOpen(false);
    setApprovalModalOpen(false);
    setColetivaModalOpen(false);
    setColetivaEditing(null);
    setSelectedItem(null);
    // Recarregar dados após criar/editar
    queryClient.invalidateQueries({ queryKey: ['ferias'] });
    queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
    queryClient.invalidateQueries({ queryKey: ['ferias-coletivas'] });
    queryClient.invalidateQueries({ queryKey: ['alertas-concessivo'] });
    queryClient.invalidateQueries({ queryKey: ['periodo-aquisitivo'] });
    queryClient.invalidateQueries({ queryKey: ['saldo-ferias'] });
  };

  const handleView = (item: FeriasPeriodo | Afastamento) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  };

  const handleEdit = (item: FeriasPeriodo | Afastamento) => {
    console.log('Editando item:', item);
    setSelectedItem(item);
    
    // Determinar qual modal abrir baseado no tipo do item
    if ('tipo' in item && (item.tipo === 'FERIAS_NORMAIS' || item.tipo === 'FERIAS_VENDIDAS' || item.tipo === 'ABONO_PECUNIARIO')) {
      // É uma férias
      console.log('Abrindo modal de férias');
      setFeriasModalOpen(true);
      setAfastamentoModalOpen(false); // Garantir que o outro modal esteja fechado
    } else {
      // É um afastamento
      console.log('Abrindo modal de afastamento');
      setAfastamentoModalOpen(true);
      setFeriasModalOpen(false); // Garantir que o outro modal esteja fechado
    }
  };

  const handleApprove = (item: FeriasPeriodo | Afastamento) => {
    console.log('Abrindo modal de aprovação:', item);
    setSelectedItem(item);
    setApprovalModalOpen(true);
  };

  const handleApprovalClose = () => {
    setApprovalModalOpen(false);
    setSelectedItem(null);
    // Recarregar dados após aprovar/rejeitar
    queryClient.invalidateQueries({ queryKey: ['ferias'] });
    queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
  };

  const handleDelete = async (item: FeriasPeriodo | Afastamento) => {
    console.log('Excluindo item:', item);
    
    if (!confirm(`Tem certeza que deseja excluir esta solicitação?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      
      if ('tipo' in item && (item.tipo === 'FERIAS_NORMAIS' || item.tipo === 'FERIAS_VENDIDAS' || item.tipo === 'ABONO_PECUNIARIO')) {
        // É uma férias
        console.log('Excluindo férias com ID:', item.id);
        await feriasService.deleteFerias(item.id);
        toast({
          title: "Sucesso",
          description: "Solicitação de férias excluída com sucesso.",
          variant: "default"
        });
      } else {
        // É um afastamento
        console.log('Excluindo afastamento com ID:', item.id);
        await feriasService.deleteAfastamento(item.id);
        toast({
          title: "Sucesso",
          description: "Afastamento excluído com sucesso.",
          variant: "default"
        });
      }

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['ferias'] });
      queryClient.invalidateQueries({ queryKey: ['afastamentos'] });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir solicitação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ------------------------------------------------------------------
  // Férias coletivas (RF-04 — Fase 2)
  // ------------------------------------------------------------------

  const handleNovaColetiva = () => {
    setColetivaEditing(null);
    setColetivaModalOpen(true);
  };

  const handleEditarColetiva = (item: FeriasColetiva) => {
    setColetivaEditing(item);
    setColetivaModalOpen(true);
  };

  const executarAcaoColetiva = async (
    acao: () => Promise<void>,
    sucesso: string
  ) => {
    try {
      await acao();
      toast({
        title: 'Sucesso',
        description: sucesso,
        variant: 'default'
      });
      queryClient.invalidateQueries({ queryKey: ['ferias-coletivas'] });
      queryClient.invalidateQueries({ queryKey: ['ferias'] });
      queryClient.invalidateQueries({ queryKey: ['periodo-aquisitivo'] });
      queryClient.invalidateQueries({ queryKey: ['saldo-ferias'] });
    } catch (error) {
      console.error('Erro na ação de férias coletivas:', error);
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Não foi possível concluir a ação.',
        variant: 'destructive'
      });
    }
  };

  const handleProcessarColetiva = async (item: FeriasColetiva) => {
    if (
      !confirm(
        `Processar "${item.titulo}"?\n\nOs colaboradores elegíveis serão afastados em ${formatDate(
          item.dataInicio
        )} e o saldo dos períodos aquisitivos será abatido (regras de 1º ano, maternidade e licença remunerada aplicadas).`
      )
    ) {
      return;
    }
    setColetivaActionId(item.id);
    try {
      const resultado = await feriasService.processarColetiva(item.id);
      toast({
        title: 'Coletiva processada',
        description: `${resultado.processados} processados, ${resultado.pulados} pulados (${resultado.afastadasMaternidade} em maternidade), ${resultado.diasLicencaRemunerada} dias de licença remunerada.`
      });
      queryClient.invalidateQueries({ queryKey: ['ferias-coletivas'] });
      queryClient.invalidateQueries({ queryKey: ['ferias'] });
      queryClient.invalidateQueries({ queryKey: ['periodo-aquisitivo'] });
      queryClient.invalidateQueries({ queryKey: ['saldo-ferias'] });
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao processar a coletiva.',
        variant: 'destructive'
      });
    } finally {
      setColetivaActionId(null);
    }
  };

  const handleConcluirColetiva = (item: FeriasColetiva) => {
    executarAcaoColetiva(
      () => feriasService.concluirColetiva(item.id),
      'Férias coletivas concluídas.'
    );
  };

  const handleCancelarColetiva = (item: FeriasColetiva) => {
    if (!confirm(`Cancelar "${item.titulo}"? As férias geradas serão descartadas.`)) return;
    executarAcaoColetiva(
      () => feriasService.cancelarColetiva(item.id),
      'Coletiva cancelada.'
    );
  };

  const handleExcluirColetiva = (item: FeriasColetiva) => {
    if (!confirm(`Excluir definitivamente "${item.titulo}"?`)) return;
    executarAcaoColetiva(
      () => feriasService.excluirColetiva(item.id),
      'Coletiva excluída.'
    );
  };

  return (
    <StandardLayout title="Férias e Afastamentos">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Férias e Afastamentos</h1>
            <p className="text-gray-400 mt-1">Controle de período aquisitivo, concessivo e afastamentos</p>
          </div>
          <div className="flex gap-2">
          {canAccessReports && (
            <Button 
              onClick={() => setReportModalOpen(true)}
              variant="outline" 
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-yellow hover:text-seguranca-black"
            >
              <Download className="mr-2 h-4 w-4" />
              Relatórios
            </Button>
          )}
            <div className="relative">
              <Button 
                className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                onClick={
                  activeTab === 'coletivas'
                    ? handleNovaColetiva
                    : activeTab === 'ferias'
                      ? handleOpenFeriasModal
                      : handleOpenAfastamentoModal
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Solicitação
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Férias Pendentes</p>
                  <p className="text-2xl font-bold text-seguranca-yellow">{feriasPendentes}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Afastamentos Ativos</p>
                  <p className="text-2xl font-bold text-red-400">{afastamentosAtivos}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Férias Aprovadas</p>
                  <p className="text-2xl font-bold text-green-400">{feriasAprovadas}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Funcionários</p>
                  <p className="text-2xl font-bold text-blue-400">{totalFuncionarios}</p>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-seguranca-graphite">
            <TabsTrigger value="ferias" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
              <Calendar className="mr-2 h-4 w-4" />
              Férias
            </TabsTrigger>
            <TabsTrigger value="coletivas" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
              <Users className="mr-2 h-4 w-4" />
              Coletivas
            </TabsTrigger>
            <TabsTrigger value="periodo-aquisitivo" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
              <History className="mr-2 h-4 w-4" />
              Período Aquisitivo
            </TabsTrigger>
            <TabsTrigger value="afastamentos" className="data-[state='active']:bg-seguranca-yellow data-[state='active']:text-black">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Afastamentos
            </TabsTrigger>
          </TabsList>

          {/* Tab Férias */}
          <TabsContent value="ferias" className="space-y-4">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Férias */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Períodos de Férias</CardTitle>
              </CardHeader>
              <CardContent>
                {feriasLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                    <span className="ml-2 text-seguranca-lightgray">Carregando férias...</span>
                  </div>
                ) : feriasError ? (
                  <div className="flex items-center justify-center h-32 text-red-400">
                    <AlertTriangle className="h-6 w-6 mr-2" />
                    <span>Erro ao carregar férias. Tente novamente.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                          <th className="p-3 text-sm">Funcionário</th>
                          <th className="p-3 text-sm">Período Aquisitivo</th>
                          <th className="p-3 text-sm">Data Início</th>
                          <th className="p-3 text-sm">Data Fim</th>
                          <th className="p-3 text-sm">Dias</th>
                          <th className="p-3 text-sm">Tipo</th>
                          <th className="p-3 text-sm">Status</th>
                          <th className="p-3 text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feriasPeriodos.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400">
                              Nenhuma solicitação de férias encontrada.
                            </td>
                          </tr>
                        ) : (
                          feriasPeriodos.map((ferias) => (
                            <tr key={ferias.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                              <td className="p-3 text-sm">{ferias.employeeName}</td>
                              <td className="p-3 text-sm">{ferias.periodoAquisitivo}</td>
                              <td className="p-3 text-sm">{formatDate(ferias.dataInicio)}</td>
                              <td className="p-3 text-sm">{formatDate(ferias.dataFim)}</td>
                              <td className="p-3 text-sm">{calculateDays(ferias.dataInicio, ferias.dataFim)} dias</td>
                              <td className="p-3 text-sm">
                                <Badge className={getTipoColor(ferias.tipo)}>
                                  {ferias.tipo.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <Badge className={getStatusColor(ferias.status)}>
                                  {ferias.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black"
                                    onClick={() => handleView(ferias)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-400 border-green-400 hover:bg-green-400 hover:text-seguranca-black"
                                    onClick={() => handleEdit(ferias)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {ferias.status === 'PENDENTE' && canApproveVacations && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-seguranca-black"
                                      onClick={() => handleApprove(ferias)}
                                      title="Aprovar/Rejeitar"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black"
                                    onClick={() => handleDelete(ferias)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Período Aquisitivo (CLT Art. 129-137) */}
          <TabsContent value="periodo-aquisitivo" className="space-y-4">
            {/* Seleção de colaborador */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-gray-400 text-sm mb-1">Colaborador</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <select
                        value={paEmployeeId}
                        onChange={(e) => setPaEmployeeId(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none text-sm"
                      >
                        <option value="">Selecione um colaborador...</option>
                        {employees?.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo do saldo */}
            {paEmployeeId && saldoFerias && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm">Saldo Disponível</p>
                    <p className="text-3xl font-bold text-seguranca-yellow">{saldoFerias.diasSaldo ?? 0}</p>
                    <p className="text-gray-400 text-xs">dias</p>
                  </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm">Dias Utilizados</p>
                    <p className="text-3xl font-bold text-green-400">{saldoFerias.diasUtilizados ?? 0}</p>
                    <p className="text-gray-400 text-xs">de {saldoFerias.diasDireito ?? 30} dias</p>
                  </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm">Abono Máximo</p>
                    <p className="text-3xl font-bold text-purple-400">{saldoFerias.maximoAbonoPecuniario ?? 0}</p>
                    <p className="text-gray-400 text-xs">dias (1/3 do saldo — Art. 143)</p>
                  </CardContent>
                </Card>
                <Card className="bg-seguranca-graphite border-gray-600">
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm">Limite Concessivo</p>
                    <p className="text-xl font-bold text-red-300">
                      {saldoFerias.limiteConcessivo
                        ? new Date(saldoFerias.limiteConcessivo).toLocaleDateString('pt-BR')
                        : '—'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {saldoFerias.diasAteLimiteConcessivo != null
                        ? `${saldoFerias.diasAteLimiteConcessivo} dias restantes`
                        : ''}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Alertas de período concessivo (RF-07 — Fase 2) */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-seguranca-yellow" />
                  Períodos Concessivos a Vencer (90 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alertasConcessivo.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    Nenhum período concessivo vencendo nos próximos 90 dias.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                          <th className="p-3 text-sm">Colaborador</th>
                          <th className="p-3 text-sm">Período Aquisitivo</th>
                          <th className="p-3 text-sm">Limite Concessivo</th>
                          <th className="p-3 text-sm">Saldo</th>
                          <th className="p-3 text-sm">Prazo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alertasConcessivo.map(alerta => {
                          const diasRestantes = Math.max(
                            0,
                            Math.ceil(
                              (new Date(alerta.limiteConcessivo).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24)
                            )
                          );
                          return (
                            <tr
                              key={alerta.id}
                              className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors"
                            >
                              <td className="p-3 text-sm">{alerta.employeeName || '—'}</td>
                              <td className="p-3 text-sm">
                                {formatDate(alerta.dataInicio)} — {formatDate(alerta.dataFim)}
                              </td>
                              <td className="p-3 text-sm">
                                {formatDate(alerta.limiteConcessivo)}
                              </td>
                              <td className="p-3 text-sm font-bold text-seguranca-yellow">
                                {alerta.diasSaldo} dias
                              </td>
                              <td className="p-3 text-sm">
                                <Badge
                                  className={
                                    diasRestantes <= 30
                                      ? 'bg-red-500 text-white'
                                      : diasRestantes <= 60
                                        ? 'bg-orange-500 text-black'
                                        : 'bg-yellow-500 text-black'
                                  }
                                >
                                  {diasRestantes} dias
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Histórico de períodos aquisitivos */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Períodos Aquisitivos</CardTitle>
              </CardHeader>
              <CardContent>
                {!paEmployeeId ? (
                  <div className="p-8 text-center text-gray-400">
                    Selecione um colaborador para ver os períodos aquisitivos.
                  </div>
                ) : paLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                    <span className="ml-2 text-seguranca-lightgray">Carregando períodos...</span>
                  </div>
                ) : periodosAquisitivos.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Nenhum período aquisitivo encontrado para este colaborador.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                          <th className="p-3 text-sm">Início</th>
                          <th className="p-3 text-sm">Fim</th>
                          <th className="p-3 text-sm">Limite Concessivo</th>
                          <th className="p-3 text-sm">Dias de Direito</th>
                          <th className="p-3 text-sm">Saldo</th>
                          <th className="p-3 text-sm">Utilizados</th>
                          <th className="p-3 text-sm">Faltas</th>
                          <th className="p-3 text-sm">Origem</th>
                          <th className="p-3 text-sm">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodosAquisitivos.map((pa) => (
                          <tr key={pa.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                            <td className="p-3 text-sm">{new Date(pa.dataInicio).toLocaleDateString('pt-BR')}</td>
                            <td className="p-3 text-sm">{new Date(pa.dataFim).toLocaleDateString('pt-BR')}</td>
                            <td className="p-3 text-sm">{new Date(pa.limiteConcessivo).toLocaleDateString('pt-BR')}</td>
                            <td className="p-3 text-sm">{pa.diasDireito} dias</td>
                            <td className="p-3 text-sm font-bold text-seguranca-yellow">{pa.diasSaldo} dias</td>
                            <td className="p-3 text-sm">{pa.diasUtilizados} dias</td>
                            <td className="p-3 text-sm">{pa.faltasInjustificadas}</td>
                            <td className="p-3 text-sm">{pa.origem}</td>
                            <td className="p-3 text-sm">
                              <Badge className={
                                pa.status === 'CONCESSIVO' ? 'bg-seguranca-yellow text-black' :
                                pa.status === 'EM_ANDAMENTO' ? 'bg-blue-500 text-white' :
                                pa.status === 'QUITADO' ? 'bg-green-500 text-white' :
                                'bg-red-500 text-white'
                              }>
                                {pa.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Coletivas (RF-04 — Fase 2) */}
          <TabsContent value="coletivas" className="space-y-4">
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray flex items-center justify-between">
                  <span>Férias Coletivas (CLT Art. 139/140)</span>
                  <Button
                    size="sm"
                    className="bg-seguranca-yellow text-black hover:bg-yellow-500"
                    onClick={handleNovaColetiva}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Coletiva
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {coletivasLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                    <span className="ml-2 text-seguranca-lightgray">Carregando coletivas...</span>
                  </div>
                ) : coletivas.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Nenhuma feria coletiva cadastrada. Crie uma para afastar grupos de
                    colaboradores no mesmo periodo.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                          <th className="p-3 text-sm">Titulo</th>
                          <th className="p-3 text-sm">Periodo</th>
                          <th className="p-3 text-sm">Dias</th>
                          <th className="p-3 text-sm">Abrangencia</th>
                          <th className="p-3 text-sm">Status</th>
                          <th className="p-3 text-sm">Acoes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {coletivas.map(coletiva => (
                          <tr
                            key={coletiva.id}
                            className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors"
                          >
                            <td className="p-3 text-sm font-medium">{coletiva.titulo}</td>
                            <td className="p-3 text-sm">
                              {formatDate(coletiva.dataInicio)} — {formatDate(coletiva.dataFim)}
                            </td>
                            <td className="p-3 text-sm">{coletiva.diasDuracao} dias</td>
                            <td className="p-3 text-sm">
                              {coletiva.abrangeTodaEmpresa
                                ? 'Toda a empresa'
                                : `${coletiva.departamentoIds?.length || 0} departamento(s)`}
                            </td>
                            <td className="p-3 text-sm">
                              <Badge
                                className={
                                  coletiva.status === 'Planejado'
                                    ? 'bg-blue-500 text-white'
                                    : coletiva.status === 'Em Andamento'
                                      ? 'bg-seguranca-yellow text-black'
                                      : coletiva.status === 'Concluido'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-red-500 text-white'
                                }
                              >
                                {coletiva.status}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                {coletiva.status !== 'Concluido' &&
                                  coletiva.status !== 'Cancelado' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black"
                                      onClick={() => handleEditarColetiva(coletiva)}
                                      title="Editar"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                {coletiva.status !== 'Cancelado' &&
                                  coletiva.status !== 'Concluido' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-seguranca-black disabled:opacity-50"
                                      onClick={() => handleProcessarColetiva(coletiva)}
                                      disabled={coletivaActionId === coletiva.id}
                                      title="Processar (gera as ferias em massa)"
                                    >
                                      <Play className="h-3 w-3" />
                                    </Button>
                                  )}
                                {coletiva.status === 'Em Andamento' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-400 border-green-400 hover:bg-green-400 hover:text-seguranca-black"
                                    onClick={() => handleConcluirColetiva(coletiva)}
                                    title="Concluir"
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                  </Button>
                                )}
                                {coletiva.status !== 'Concluido' &&
                                  coletiva.status !== 'Cancelado' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black"
                                      onClick={() => handleCancelarColetiva(coletiva)}
                                      title="Cancelar"
                                    >
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  )}
                                {coletiva.status === 'Planejado' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black"
                                    onClick={() => handleExcluirColetiva(coletiva)}
                                    title="Excluir"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fluxo de processamento */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-seguranca-lightgray text-base">
                  Como funciona o processamento
                </CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400 text-sm space-y-1">
                <p>
                  <strong className="text-seguranca-lightgray">Processar:</strong> gera as
                  ferias de cada colaborador elegivel no periodo, abate o saldo do periodo
                  aquisitivo e cria licencas remuneradas para o excedente do 1º ano.
                </p>
                <p>
                  <strong className="text-seguranca-lightgray">Regras aplicadas:</strong>{' '}
                  colaboradores em licenca maternidade nao sao afastados (saldo preservado);
                  admissao com menos de 12 meses recebe 2,5 dia por mes trabalhado (fracao
                  acima de 14 dias conta) e, apos o gozo, ganha um novo periodo aquisitivo.
                </p>
                <p>
                  <strong className="text-seguranca-lightgray">Concluir:</strong> encerra a
                  coletiva depois que todos os afastamentos terminarem.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Afastamentos */}
          <TabsContent value="afastamentos" className="space-y-4">
            {/* Filtros */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar funcionário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-seguranca-black border border-gray-600 rounded text-seguranca-lightgray focus:border-seguranca-yellow focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button variant="outline" className="border-gray-600 text-seguranca-lightgray">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Afastamentos */}
            <Card className="bg-seguranca-graphite border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Afastamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {afastamentosLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                    <span className="ml-2 text-seguranca-lightgray">Carregando afastamentos...</span>
                  </div>
                ) : afastamentosError ? (
                  <div className="flex items-center justify-center h-32 text-red-400">
                    <AlertTriangle className="h-6 w-6 mr-2" />
                    <span>Erro ao carregar afastamentos. Tente novamente.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-seguranca-yellow text-left border-b border-gray-700">
                          <th className="p-3 text-sm">Funcionário</th>
                          <th className="p-3 text-sm">Tipo</th>
                          <th className="p-3 text-sm">Data Início</th>
                          <th className="p-3 text-sm">Data Fim</th>
                          <th className="p-3 text-sm">Dias</th>
                          <th className="p-3 text-sm">Motivo</th>
                          <th className="p-3 text-sm">Status</th>
                          <th className="p-3 text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {afastamentos.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-400">
                              Nenhum afastamento encontrado.
                            </td>
                          </tr>
                        ) : (
                          afastamentos.map((afastamento) => (
                            <tr key={afastamento.id} className="border-b border-gray-700 text-seguranca-lightgray hover:bg-seguranca-black transition-colors">
                              <td className="p-3 text-sm">{afastamento.employeeName}</td>
                              <td className="p-3 text-sm">
                                <Badge className={getTipoColor(afastamento.tipo)}>
                                  {afastamento.tipo.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">{formatDate(afastamento.dataInicio)}</td>
                              <td className="p-3 text-sm">{formatDate(afastamento.dataFim)}</td>
                              <td className="p-3 text-sm">{calculateDays(afastamento.dataInicio, afastamento.dataFim)} dia{calculateDays(afastamento.dataInicio, afastamento.dataFim) !== 1 ? 's' : ''}</td>
                              <td className="p-3 text-sm max-w-xs truncate">{afastamento.motivo}</td>
                              <td className="p-3 text-sm">
                                <Badge className={getStatusColor(afastamento.status)}>
                                  {afastamento.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-seguranca-black"
                                    onClick={() => handleView(afastamento)}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-green-400 border-green-400 hover:bg-green-400 hover:text-seguranca-black"
                                    onClick={() => handleEdit(afastamento)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  {afastamento.status === 'PENDENTE' && canApproveAbsences && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      className="text-purple-400 border-purple-400 hover:bg-purple-400 hover:text-seguranca-black"
                                      onClick={() => handleApprove(afastamento)}
                                      title="Aprovar/Rejeitar"
                                    >
                                      <CheckCircle2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-seguranca-black"
                                    onClick={() => handleDelete(afastamento)}
                                    disabled={isDeleting}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modais */}
      {feriasModalOpen && (
        <FeriasFormModal
          onSuccess={handleCloseModals}
          onClose={handleCloseModals}
          editingId={selectedItem && 'tipo' in selectedItem ? selectedItem.id : undefined}
          initialData={selectedItem && 'tipo' in selectedItem ? {
            employeeId: selectedItem.employeeId,
            periodoAquisitivo: selectedItem.periodoAquisitivo || '',
            dataInicio: selectedItem.dataInicio,
            dataFim: selectedItem.dataFim,
            tipo: selectedItem.tipo,
            observacoes: selectedItem.observacoes || ''
          } : undefined}
        />
      )}

      {afastamentoModalOpen && (
        <AfastamentoFormModal
          onSuccess={handleCloseModals}
          onClose={handleCloseModals}
          editingId={selectedItem && 'motivo' in selectedItem ? selectedItem.id : undefined}
          initialData={selectedItem && 'motivo' in selectedItem ? {
            employeeId: selectedItem.employeeId,
            tipo: selectedItem.tipo as any,
            dataInicio: selectedItem.dataInicio,
            dataFim: selectedItem.dataFim,
            motivo: selectedItem.motivo,
            documento: selectedItem.documento || '',
            observacoes: selectedItem.observacoes || ''
          } : undefined}
        />
      )}

      {/* Modal de Visualização */}
      {viewModalOpen && selectedItem && (
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-seguranca-lightgray flex items-center gap-2">
                <Eye className="h-5 w-5 text-seguranca-yellow" />
                Detalhes da Solicitação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Funcionário</label>
                  <p className="text-seguranca-lightgray font-medium">{selectedItem.employeeName}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Status</label>
                  <Badge className={getStatusColor(selectedItem.status)}>
                    {selectedItem.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Data de Início</label>
                  <p className="text-seguranca-lightgray">{formatDate(selectedItem.dataInicio)}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Data de Fim</label>
                  <p className="text-seguranca-lightgray">{formatDate(selectedItem.dataFim)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm">Dias</label>
                  <p className="text-seguranca-lightgray">{calculateDays(selectedItem.dataInicio, selectedItem.dataFim)} dias</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Tipo</label>
                  <Badge className={getTipoColor(selectedItem.tipo)}>
                    {selectedItem.tipo.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {'motivo' in selectedItem && (
                <div>
                  <label className="text-gray-400 text-sm">Motivo</label>
                  <p className="text-seguranca-lightgray">{selectedItem.motivo}</p>
                </div>
              )}

              {'observacoes' in selectedItem && selectedItem.observacoes && (
                <div>
                  <label className="text-gray-400 text-sm">Observações</label>
                  <p className="text-seguranca-lightgray">{selectedItem.observacoes}</p>
                </div>
              )}

              <div>
                <label className="text-gray-400 text-sm">Data de Criação</label>
                <p className="text-seguranca-lightgray">{formatDate(selectedItem.createdAt)}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Relatórios */}
      {reportModalOpen && (
        <FeriasReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
        />
      )}

      {/* Modal de Aprovação */}
      {approvalModalOpen && selectedItem && (
        <ApprovalModal
          isOpen={approvalModalOpen}
          onClose={handleApprovalClose}
          item={selectedItem}
          type={selectedItem && 'tipo' in selectedItem && (selectedItem.tipo === 'FERIAS_NORMAIS' || selectedItem.tipo === 'FERIAS_VENDIDAS' || selectedItem.tipo === 'ABONO_PECUNIARIO') ? 'ferias' : 'afastamento'}
        />
      )}
      {/* Modal de Férias Coletivas (Fase 2) */}
      {coletivaModalOpen && (
        <FeriasColetivasModal
          onSuccess={handleCloseModals}
          onClose={handleCloseModals}
          editingId={coletivaEditing?.id}
          initialData={coletivaEditing || undefined}
        />
      )}
    </StandardLayout>
  );
};

export default FeriasPage; 