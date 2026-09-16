import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { pagamentosService, Pagamento, Cliente, AgendamentoPagamento } from '@/services/pagamentosService';
import { contasAPagarService, Supplier } from '@/services/contasAPagarService';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  DollarSign,
  Shield,
  Zap,
  FileText,
  Download,
  Upload,
  Settings,
  Target,
  TrendingDown,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  Lock,
  Unlock,
  History,
  Bell,
  CheckSquare,
  X,
  GitBranch,
  Loader2
} from 'lucide-react';
import { PagamentosGuard } from './FinanceiroPermissionGuard';
import { PagamentoFormModal } from './PagamentoFormModal';
import { PagamentoViewModal } from './PagamentoViewModal';
import { format, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces movidas para o serviço

interface WorkflowEtapa {
  id: string;
  etapa: 'solicitacao' | 'aprovacao_gestor' | 'aprovacao_financeiro' | 'aprovacao_diretoria' | 'execucao' | 'confirmacao';
  responsavel: string;
  dataInicio?: string;
  dataConclusao?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'rejeitado';
  observacoes?: string;
  valorLimite?: number;
}

interface IntegracaoBancaria {
  banco: string;
  agencia: string;
  conta: string;
  chavePix?: string;
  codigoBarras?: string;
  statusIntegracao: 'pendente' | 'processando' | 'concluido' | 'erro';
  idTransacao?: string;
  comprovanteBancario?: string;
  dataProcessamento?: string;
}

interface LimitePagamento {
  id: string;
  tipo: 'diario' | 'mensal' | 'categoria' | 'fornecedor';
  valor: number;
  valorUtilizado: number;
  periodo: string;
  categoria?: string;
  fornecedor?: string;
  ativo: boolean;
}

interface NotificacaoPagamento {
  id: string;
  tipo: 'aprovacao_pendente' | 'limite_excedido' | 'vencimento_proximo' | 'pagamento_executado';
  titulo: string;
  descricao: string;
  pagamentoId: string;
  destinatario: string;
  dataEnvio: string;
  lida: boolean;
}

export const Pagamentos: React.FC = () => {
  const { toast } = useToast();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Supplier[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterFormaPagamento, setFilterFormaPagamento] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  const [selectedPagamentos, setSelectedPagamentos] = useState<string[]>([]);
  const [showSelection, setShowSelection] = useState(false);

  // Carregar dados do backend
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pagamentosData, clientesData, fornecedoresData, agendamentosData] = await Promise.all([
        pagamentosService.getPagamentos(),
        pagamentosService.getClientes(),
        contasAPagarService.getFornecedores(),
        pagamentosService.getAgendamentos()
      ]);
      
      setPagamentos(Array.isArray(pagamentosData) ? pagamentosData : []);
      setClientes(Array.isArray(clientesData) ? clientesData : []);
      setFornecedores(Array.isArray(fornecedoresData) ? fornecedoresData : []);
      setAgendamentos(Array.isArray(agendamentosData) ? agendamentosData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos pagamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pagamentos
  const filteredPagamentos = pagamentos.filter(pagamento => {
    const clienteNome = pagamento.clienteNome || '';
    const descricao = pagamento.descricao || '';
    const matchesSearch = clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pagamento.status === filterStatus;
    const matchesCategoria = filterCategoria === 'all' || pagamento.categoria === filterCategoria;
    const matchesFormaPagamento = filterFormaPagamento === 'all' || pagamento.formaPagamento === filterFormaPagamento;

    return matchesSearch && matchesStatus && matchesCategoria && matchesFormaPagamento;
  });

  // Estatísticas
  const stats = {
    total: pagamentos.length,
    pendente: pagamentos.filter(p => p.status === 'PENDING').length,
    pago: pagamentos.filter(p => p.status === 'PAID').length,
    vencido: pagamentos.filter(p => p.status === 'OVERDUE').length,
    cancelado: pagamentos.filter(p => p.status === 'CANCELLED').length,
    valorTotal: pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0),
    valorPendente: pagamentos.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (p.valor || 0), 0),
    valorPago: pagamentos.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.valor || 0), 0),
    valorVencido: pagamentos.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + (p.valor || 0), 0)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'PAID': return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE': return <AlertCircle className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendente';
      case 'PAID': return 'Pago';
      case 'OVERDUE': return 'Vencido';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const handleMarcarComoPago = async (id: string) => {
    try {
      const dataPagamento = new Date().toISOString().split('T')[0];
      const pagamentoAtualizado = await pagamentosService.markAsPaid(id, dataPagamento);
      
      setPagamentos(prev => prev.map(p => 
        p.id === id ? pagamentoAtualizado : p
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento marcado como pago.',
      });
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao marcar pagamento como pago.',
        variant: 'destructive',
      });
    }
  };

  const handleAgendarPagamento = async (id: string, dataAgendamento: string, observacoes?: string) => {
    try {
      await pagamentosService.agendarPagamento(id, dataAgendamento, observacoes);
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento agendado com sucesso.',
      });
      
      // Recarregar dados para atualizar agendamentos
      loadData();
    } catch (error) {
      console.error('Erro ao agendar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao agendar pagamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePagamento = async (id: string) => {
    try {
      await pagamentosService.deletePagamento(id);
      
      setPagamentos(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Pagamento excluído com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pagamento.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMultiplePagamentos = async (ids: string[]) => {
    try {
      await pagamentosService.deletePagamentos(ids);
      
      setPagamentos(prev => prev.filter(p => !ids.includes(p.id)));
      setSelectedPagamentos([]);
      
      toast({
        title: 'Sucesso',
        description: `${ids.length} pagamento(s) excluído(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao excluir pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir pagamentos.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateReport = async (pagamentoId: string, format: 'pdf' | 'excel') => {
    try {
      let blob: Blob;
      
      if (format === 'pdf') {
        blob = await pagamentosService.generateRelatorioPagamentosPDF({ 
          clienteId: pagamentoId 
        });
      } else {
        blob = await pagamentosService.generateRelatorioPagamentosExcel({ 
          clienteId: pagamentoId 
        });
      }
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_pagamento_${pagamentoId}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso',
        description: `Relatório ${format.toUpperCase()} gerado com sucesso.`,
      });
    } catch (error) {
      console.error(`Erro ao gerar relatório ${format}:`, error);
      toast({
        title: 'Erro',
        description: `Erro ao gerar relatório ${format.toUpperCase()}.`,
        variant: 'destructive',
      });
    }
  };

  const handleGenerateBulkReport = async (format: 'pdf' | 'excel') => {
    if (selectedPagamentos.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione pelo menos um pagamento para gerar o relatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let blob: Blob;
      
      if (format === 'pdf') {
        blob = await pagamentosService.generateRelatorioPagamentosPDF({});
      } else {
        blob = await pagamentosService.generateRelatorioPagamentosExcel({});
      }
      
      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_pagamentos_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Sucesso',
        description: `Relatório ${format.toUpperCase()} gerado com sucesso.`,
      });
    } catch (error) {
      console.error(`Erro ao gerar relatório ${format}:`, error);
      toast({
        title: 'Erro',
        description: `Erro ao gerar relatório ${format.toUpperCase()}.`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenFormModal = (pagamento?: Pagamento) => {
    setSelectedPagamento(pagamento || null);
    setShowForm(true);
  };

  const handleOpenViewModal = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento);
    setShowViewModal(true);
  };

  const handleOpenEditModal = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento);
    setShowEditModal(true);
  };

  const handleFormSuccess = () => {
    loadData();
    setShowForm(false);
    setShowEditModal(false);
    setSelectedPagamento(null);
  };

  const handleSelectPagamento = (id: string) => {
    setSelectedPagamentos(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedPagamentos.length === filteredPagamentos.length) {
      setSelectedPagamentos([]);
    } else {
      setSelectedPagamentos(filteredPagamentos.map(p => p.id));
    }
  };

  const isAllSelected = selectedPagamentos.length === filteredPagamentos.length && filteredPagamentos.length > 0;

  // Função para obter cor da prioridade
  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return 'text-red-600 bg-red-50';
      case 'alta': return 'text-orange-600 bg-orange-50';
      case 'media': return 'text-yellow-600 bg-yellow-50';
      case 'baixa': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Função para obter ícone da prioridade
  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente': return AlertTriangle;
      case 'alta': return TrendingUp;
      case 'media': return Clock;
      case 'baixa': return TrendingDown;
      default: return Clock;
    }
  };

  // Função para verificar limites
  const verificarLimites = (valor: number, categoria?: string) => {
    const limiteDiario = limites.find(l => l.tipo === 'diario' && l.ativo);
    const limiteMensal = limites.find(l => l.tipo === 'mensal' && l.ativo);
    const limiteCategoria = limites.find(l => l.tipo === 'categoria' && l.categoria === categoria && l.ativo);

    const alertas = [];

    if (limiteDiario && (limiteDiario.valorUtilizado + valor) > limiteDiario.valor) {
      alertas.push(`Limite diário excedido: R$ ${((limiteDiario.valorUtilizado + valor) - limiteDiario.valor).toFixed(2)}`);
    }

    if (limiteMensal && (limiteMensal.valorUtilizado + valor) > limiteMensal.valor) {
      alertas.push(`Limite mensal excedido: R$ ${((limiteMensal.valorUtilizado + valor) - limiteMensal.valor).toFixed(2)}`);
    }

    if (limiteCategoria && (limiteCategoria.valorUtilizado + valor) > limiteCategoria.valor) {
      alertas.push(`Limite da categoria excedido: R$ ${((limiteCategoria.valorUtilizado + valor) - limiteCategoria.valor).toFixed(2)}`);
    }

    return alertas;
  };

  // Função para processar workflow
  const processarWorkflow = async (pagamentoId: string, etapa: string) => {
    setWorkflowLoading(true);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPagamentos(prev => prev.map(pagamento => {
        if (pagamento.id === pagamentoId) {
          const workflowAtualizado = pagamento.workflow?.map(w => 
            w.etapa === etapa 
              ? { ...w, status: 'concluido', dataConclusao: format(new Date(), 'yyyy-MM-dd') }
              : w
          ) || [];
          
          return { ...pagamento, workflow: workflowAtualizado };
        }
        return pagamento;
      }));
      
      toast({
        title: "Workflow atualizado",
        description: `Etapa ${etapa} concluída com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro no workflow",
        description: "Não foi possível processar a etapa do workflow.",
        variant: "destructive",
      });
    } finally {
      setWorkflowLoading(false);
    }
  };

  // Função para integração bancária
  const processarIntegracaoBancaria = async (pagamentoId: string) => {
    setIntegracaoLoading(true);
    try {
      // Simular integração bancária
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setPagamentos(prev => prev.map(pagamento => {
        if (pagamento.id === pagamentoId && pagamento.integracaoBancaria) {
          return {
            ...pagamento,
            integracaoBancaria: {
              ...pagamento.integracaoBancaria,
              statusIntegracao: 'concluido',
              idTransacao: `TXN-${Date.now()}`,
              dataProcessamento: format(new Date(), 'yyyy-MM-dd')
            },
            status: 'executado',
            dataExecucao: format(new Date(), 'yyyy-MM-dd')
          };
        }
        return pagamento;
      }));
      
      toast({
        title: "Integração bancária concluída",
        description: "Pagamento processado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na integração",
        description: "Não foi possível processar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIntegracaoLoading(false);
    }
  };

  if (loading) {
    return (
      <PagamentosGuard>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando pagamentos...</p>
          </div>
        </div>
      </PagamentosGuard>
    );
  }

  return (
    <PagamentosGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pagamentos</h1>
            <p className="text-muted-foreground">
              Gerencie pagamentos com agendamento e alertas de vencimento
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowSelection(!showSelection)}
              className={showSelection ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
            >
              {showSelection ? 'Desativar Seleção' : 'Ativar Seleção'}
            </Button>
            <PagamentosGuard action="manage">
              <Button onClick={() => handleOpenFormModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Pagamento
              </Button>
            </PagamentosGuard>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="aprovacoes">Aprovações</TabsTrigger>
            <TabsTrigger value="execucao">Execução</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="limites">Limites</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total}</p>
                      <p className="text-sm text-muted-foreground">Total de Pagamentos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">R$ {(stats.valorTotal || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-sm text-muted-foreground">Valor Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold">R$ {(stats.valorPendente || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-sm text-muted-foreground">Pendente</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">R$ {(stats.valorPago || 0).toLocaleString('pt-BR')}</p>
                      <p className="text-sm text-muted-foreground">Pago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status dos Pagamentos */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pendente}</div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.aprovado}</div>
                    <div className="text-sm text-muted-foreground">Aprovados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.executado}</div>
                    <div className="text-sm text-muted-foreground">Executados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {pagamentos.filter(p => p.status === 'rejeitado').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Rejeitados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {pagamentos.filter(p => p.status === 'cancelado').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Cancelados</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lista de Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar por fornecedor ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterFormaPagamento} onValueChange={setFilterFormaPagamento}>
                    <SelectTrigger>
                      <SelectValue placeholder="Forma de Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Formas</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="CARTAO">Cartão</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Categorias</SelectItem>
                      <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                      <SelectItem value="SERVICO">Serviço</SelectItem>
                      <SelectItem value="EQUIPAMENTO">Equipamento</SelectItem>
                      <SelectItem value="IMPOSTO">Imposto</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação em Lote */}
            {showSelection && selectedPagamentos.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium">
                        {selectedPagamentos.length} pagamento(s) selecionado(s)
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateBulkReport('pdf')}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Relatório PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateBulkReport('excel')}
                        className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Relatório Excel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (window.confirm(`Tem certeza que deseja excluir ${selectedPagamentos.length} pagamento(s)?`)) {
                            handleDeleteMultiplePagamentos(selectedPagamentos);
                          }
                        }}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir ({selectedPagamentos.length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabela de Pagamentos */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {showSelection && (
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Descrição</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Valor</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vencimento</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Forma Pagamento</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Categoria</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPagamentos.map((pagamento) => {
                        const isVencimentoProximo = () => {
                          if (!pagamento.dataVencimento) return false;
                          const hoje = new Date();
                          const vencimento = new Date(pagamento.dataVencimento);
                          const diffTime = vencimento.getTime() - hoje.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 3 && diffDays >= 0;
                        };

                        const isVencido = () => {
                          if (!pagamento.dataVencimento) return false;
                          const hoje = new Date();
                          const vencimento = new Date(pagamento.dataVencimento);
                          return vencimento < hoje && pagamento.status === 'PENDING';
                        };

                        return (
                          <tr key={pagamento.id} className="hover:bg-gray-50">
                            {showSelection && (
                              <td className="px-4 py-3">
                                <Checkbox
                                  checked={selectedPagamentos.includes(pagamento.id)}
                                  onCheckedChange={() => handleSelectPagamento(pagamento.id)}
                                />
                              </td>
                            )}
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{pagamento.clienteNome || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {pagamento.descricao || '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-red-600">
                                R$ {(pagamento.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getStatusColor(pagamento.status)}>
                                {getStatusIcon(pagamento.status)}
                                <span className="ml-1">{getStatusLabel(pagamento.status)}</span>
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className={`${
                                  isVencido() ? 'text-red-600 font-medium' :
                                  isVencimentoProximo() ? 'text-yellow-600 font-medium' :
                                  'text-muted-foreground'
                                }`}>
                                  {pagamento.dataVencimento ? (() => {
                                    try {
                                      const date = new Date(pagamento.dataVencimento);
                                      if (isNaN(date.getTime())) return '-';
                                      return format(date, 'dd/MM/yyyy', { locale: ptBR });
                                    } catch {
                                      return '-';
                                    }
                                  })() : '-'}
                                </span>
                                {(isVencido() || isVencimentoProximo()) && (
                                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">
                                {pagamento.formaPagamento}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-muted-foreground">
                                {pagamento.categoria}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleOpenViewModal(pagamento)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <PagamentosGuard action="manage">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenEditModal(pagamento)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </PagamentosGuard>
                                {pagamento.status === 'PENDING' && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleMarcarComoPago(pagamento.id)}
                                    className="text-green-600 border-green-600 hover:bg-green-600 hover:text-white"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <PagamentosGuard action="manage">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      if (window.confirm('Tem certeza que deseja excluir este pagamento?')) {
                                        handleDeletePagamento(pagamento.id);
                                      }
                                    }}
                                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </PagamentosGuard>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aprovações */}
          <TabsContent value="aprovacoes" className="space-y-4">
            <PagamentosGuard action="manage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Pagamentos Pendentes de Aprovação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pagamentos.filter(p => p.status === 'pendente').map((pagamento) => (
                      <div key={pagamento.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{pagamento.fornecedor}</h4>
                            <p className="text-sm text-gray-600">{pagamento.descricao}</p>
                            <p className="text-lg font-bold text-red-600">
                              R$ {pagamento.valor.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => handleAprovarPagamento(pagamento.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprovar
                            </Button>
                            <Button variant="outline" className="text-red-600">
                              <XCircle className="w-4 h-4 mr-2" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {pagamentos.filter(p => p.status === 'pendente').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum pagamento pendente de aprovação.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </PagamentosGuard>
          </TabsContent>

          {/* Execução */}
          <TabsContent value="execucao" className="space-y-4">
            <PagamentosGuard action="execute">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Pagamentos Aprovados para Execução
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pagamentos.filter(p => p.status === 'aprovado').map((pagamento) => (
                      <div key={pagamento.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{pagamento.fornecedor}</h4>
                            <p className="text-sm text-gray-600">{pagamento.descricao}</p>
                            <p className="text-lg font-bold text-red-600">
                              R$ {pagamento.valor.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-sm text-gray-500">
                              Aprovado por: {pagamento.aprovador}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              onClick={() => handleExecutarPagamento(pagamento.id)}
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Executar Pagamento
                            </Button>
                            <Button variant="outline">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Gerar Comprovante
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {pagamentos.filter(p => p.status === 'aprovado').length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum pagamento aprovado para execução.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </PagamentosGuard>
          </TabsContent>

            {/* Aba Workflow */}
            <TabsContent value="workflow" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Gestão de Workflow
                    </CardTitle>
                    <CardDescription>
                      Acompanhe o fluxo de aprovação dos pagamentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pagamentos.filter(p => p.workflow && p.workflow.length > 0).map((pagamento) => (
                        <div key={pagamento.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{pagamento.id} - {pagamento.fornecedor}</h4>
                              <p className="text-sm text-muted-foreground">
                                R$ {pagamento.valor.toFixed(2)} • {pagamento.descricao}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getPrioridadeColor(pagamento.prioridade || 'media')
                            }`}>
                              {pagamento.prioridade?.toUpperCase()}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {pagamento.workflow?.map((etapa, index) => {
                              const Icon = etapa.status === 'concluido' ? CheckCircle : 
                                          etapa.status === 'pendente' ? Clock : AlertCircle;
                              const statusColor = etapa.status === 'concluido' ? 'text-green-600' :
                                                 etapa.status === 'pendente' ? 'text-yellow-600' : 'text-red-600';
                              
                              return (
                                <div key={etapa.id} className="flex items-center gap-3">
                                  <Icon className={`h-4 w-4 ${statusColor}`} />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium capitalize">
                                        {etapa.etapa.replace('_', ' ')}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {etapa.responsavel}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Início: {etapa.dataInicio ? (() => {
                                        try {
                                          const date = new Date(etapa.dataInicio);
                                          return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy', { locale: ptBR });
                                        } catch {
                                          return '-';
                                        }
                                      })() : '-'}
                                      {etapa.dataConclusao && (
                                        <> • Conclusão: {(() => {
                                          try {
                                            const date = new Date(etapa.dataConclusao);
                                            return isNaN(date.getTime()) ? '-' : format(date, 'dd/MM/yyyy', { locale: ptBR });
                                          } catch {
                                            return '-';
                                          }
                                        })()}</>
                                      )}
                                    </div>
                                  </div>
                                  {etapa.status === 'pendente' && (
                                    <Button
                                      size="sm"
                                      onClick={() => processarWorkflow(pagamento.id, etapa.etapa)}
                                      disabled={workflowLoading}
                                    >
                                      {workflowLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        'Processar'
                                      )}
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t">
                            <Progress 
                              value={(pagamento.workflow?.filter(w => w.status === 'concluido').length || 0) / (pagamento.workflow?.length || 1) * 100}
                              className="h-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {pagamento.workflow?.filter(w => w.status === 'concluido').length || 0} de {pagamento.workflow?.length || 0} etapas concluídas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Limites - Temporariamente desabilitada */}
            <TabsContent value="limites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Controle de Limites
                  </CardTitle>
                  <CardDescription>
                    Funcionalidade em desenvolvimento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Controle de Limites
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Esta funcionalidade será implementada em uma versão futura.
                    </p>
                    <p className="text-sm text-gray-400">
                      Aqui você poderá gerenciar limites de pagamento por categoria, período e valor.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        </div>

        {/* Modais */}
        <PagamentoFormModal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setSelectedPagamento(null);
          }}
          onSuccess={handleFormSuccess}
          fornecedores={fornecedores}
        />

        <PagamentoFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPagamento(null);
          }}
          onSuccess={handleFormSuccess}
          pagamento={selectedPagamento}
          fornecedores={fornecedores}
        />

        <PagamentoViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPagamento(null);
          }}
          pagamento={selectedPagamento}
          onEdit={handleOpenEditModal}
          onGenerateReport={handleGenerateReport}
        />
      </PagamentosGuard>
    );
  };
