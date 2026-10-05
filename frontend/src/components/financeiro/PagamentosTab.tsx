import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Upload,
  Receipt,
  Banknote,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { contasAPagarService } from '@/services/contasAPagarService';
import { contasAReceberService } from '@/services/contasAReceberService';

export interface Pagamento {
  id: string;
  contaId: string;
  tipo: 'PAGAMENTO' | 'RECEBIMENTO';
  valor: number;
  dataPagamento: Date;
  metodoPagamento: 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO' | 'CHEQUE';
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'AGENDADO';
  observacoes?: string;
  comprovante?: File;
  banco?: string;
  agencia?: string;
  conta?: string;
  numeroDocumento?: string;
  createdAt: Date;
}

export interface ContaParaPagamento {
  id: string;
  descricao: string;
  valor: number;
  vencimento: Date;
  status: string;
  tipo: 'PAGAR' | 'RECEBER';
  fornecedor?: string;
  cliente?: string;
  observacoes?: string;
  banco?: string;
  agencia?: string;
  contaBancaria?: string;
}

const PagamentosTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [contasPendentes, setContasPendentes] = useState<ContaParaPagamento[]>([]);
  
  // Modais
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Seleção atual
  const [selectedConta, setSelectedConta] = useState<ContaParaPagamento | null>(null);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; tipo: 'CONTA' | 'PAGAMENTO'; descricao: string; isPagar?: boolean } | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ContaParaPagamento | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');

  // Formulário de Pagamento / Agendamento
  const [paymentForm, setPaymentForm] = useState({
    modo: 'AGORA' as 'AGORA' | 'AGENDAR',
    valor: 0,
    dataPagamento: new Date(),
    metodoPagamento: 'PIX' as 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO' | 'CHEQUE',
    observacoes: '',
    banco: '',
    agencia: '',
    conta: '',
    numeroDocumento: ''
  });

  // Formulário de Edição de Conta
  const [editForm, setEditForm] = useState({
    descricao: '',
    valor: 0,
    vencimento: new Date(),
    observacoes: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      const [contasPagar, contasReceber] = await Promise.all([
        contasAPagarService.getContasAPagar({ status: 'ABERTA' }).catch(() => []),
        contasAReceberService.getContasAReceber({ status: 'ABERTA' }).catch(() => [])
      ]);

      const contasPendentesData: ContaParaPagamento[] = [
        ...(Array.isArray(contasPagar) ? contasPagar : []).map(conta => ({
          id: conta.id!,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento instanceof Date ? conta.vencimento : new Date(conta.vencimento),
          status: conta.status,
          tipo: 'PAGAR' as const,
          fornecedor: conta.fornecedor,
          observacoes: conta.observacoes
        })),
        ...(Array.isArray(contasReceber) ? contasReceber : []).map(conta => ({
          id: conta.id!,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento instanceof Date ? conta.vencimento : new Date(conta.vencimento),
          status: conta.status,
          tipo: 'RECEBER' as const,
          cliente: conta.cliente,
          observacoes: conta.observacoes
        }))
      ];

      setContasPendentes(contasPendentesData);

      // Carregar histórico de pagamentos fictícios/reais
      const mockPagamentos: Pagamento[] = [
        {
          id: '1',
          contaId: '1',
          tipo: 'PAGAMENTO',
          valor: 8950.00,
          dataPagamento: new Date('2026-10-05'),
          metodoPagamento: 'PIX',
          status: 'CONFIRMADO',
          observacoes: 'IPVA e Taxas de Licenciamento Anual - Veículos Operacionais',
          banco: 'Banco Itaú',
          agencia: '1234',
          conta: '56789-0',
          numeroDocumento: 'COMP-2026-991',
          createdAt: new Date('2026-10-05')
        },
        {
          id: '2',
          contaId: '2',
          tipo: 'RECEBIMENTO',
          valor: 32000.00,
          dataPagamento: new Date('2026-10-04'),
          metodoPagamento: 'TRANSFERENCIA',
          status: 'CONFIRMADO',
          observacoes: 'Recebimento de Medição Mensal - Indústria Metalúrgica ABC',
          banco: 'Banco do Brasil',
          agencia: '4321',
          conta: '98765-4',
          numeroDocumento: 'REC-2026-002',
          createdAt: new Date('2026-10-04')
        }
      ];

      setPagamentos(mockPagamentos);
    } catch (error) {
      console.error('Erro ao carregar dados de pagamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de pagamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Abrir Modal de Pagamento / Agendamento
  const handleAbrirPagamento = (conta: ContaParaPagamento, modo: 'AGORA' | 'AGENDAR' = 'AGORA') => {
    setSelectedConta(conta);
    setPaymentForm({
      modo: modo,
      valor: conta.valor,
      dataPagamento: modo === 'AGENDAR' ? (conta.vencimento || new Date()) : new Date(),
      metodoPagamento: 'PIX',
      observacoes: conta.observacoes || '',
      banco: conta.banco || '',
      agencia: conta.agencia || '',
      conta: conta.contaBancaria || '',
      numeroDocumento: ''
    });
    setShowPaymentModal(true);
  };

  // Confirmar Processar / Agendar Pagamento
  const handleProcessarPagamento = async () => {
    if (!selectedConta) return;
    if (!paymentForm.valor || paymentForm.valor <= 0) {
      toast({
        title: "Erro",
        description: "O valor informado deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    setProcessing(true);
    try {
      const isAgendado = paymentForm.modo === 'AGENDAR';
      const novoPagamento: Pagamento = {
        id: Date.now().toString(),
        contaId: selectedConta.id,
        tipo: selectedConta.tipo === 'PAGAR' ? 'PAGAMENTO' : 'RECEBIMENTO',
        valor: Number(paymentForm.valor),
        dataPagamento: paymentForm.dataPagamento,
        metodoPagamento: paymentForm.metodoPagamento,
        status: isAgendado ? 'AGENDADO' : 'CONFIRMADO',
        observacoes: paymentForm.observacoes,
        banco: paymentForm.banco,
        agencia: paymentForm.agencia,
        conta: paymentForm.conta,
        numeroDocumento: paymentForm.numeroDocumento,
        createdAt: new Date()
      };

      setPagamentos(prev => [novoPagamento, ...prev]);

      // Atualizar status no backend
      if (selectedConta.tipo === 'PAGAR') {
        await contasAPagarService.updateContaAPagar(selectedConta.id, {
          status: isAgendado ? 'ABERTA' : 'PAGA',
          dataPagamento: paymentForm.dataPagamento,
          observacoes: paymentForm.observacoes
        });
      } else {
        await contasAReceberService.updateContaAReceber(selectedConta.id, {
          status: isAgendado ? 'ABERTA' : 'RECEBIDA',
          dataPagamento: paymentForm.dataPagamento,
          observacoes: paymentForm.observacoes
        });
      }

      toast({
        title: isAgendado ? "Pagamento Agendado" : "Pagamento Processado",
        description: `${selectedConta.tipo === 'PAGAR' ? 'Pagamento' : 'Recebimento'} ${isAgendado ? 'agendado com sucesso para ' + format(paymentForm.dataPagamento, 'dd/MM/yyyy') : 'confirmado com sucesso!'}`,
      });

      setShowPaymentModal(false);
      setSelectedConta(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar a operação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Visualizar Detalhes
  const handleVisualizarConta = (conta: ContaParaPagamento) => {
    setSelectedConta(conta);
    setShowViewModal(true);
  };

  const handleVisualizarPagamento = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento);
    setShowViewModal(true);
  };

  // Abrir Modal de Edição
  const handleAbrirEdicao = (conta: ContaParaPagamento) => {
    setItemToEdit(conta);
    setEditForm({
      descricao: conta.descricao,
      valor: conta.valor,
      vencimento: conta.vencimento,
      observacoes: conta.observacoes || ''
    });
    setShowEditModal(true);
  };

  // Salvar Edição
  const handleSalvarEdicao = async () => {
    if (!itemToEdit) return;
    try {
      setProcessing(true);
      if (itemToEdit.tipo === 'PAGAR') {
        await contasAPagarService.updateContaAPagar(itemToEdit.id, {
          descricao: editForm.descricao,
          valor: Number(editForm.valor),
          vencimento: editForm.vencimento,
          observacoes: editForm.observacoes
        });
      } else {
        await contasAReceberService.updateContaAReceber(itemToEdit.id, {
          descricao: editForm.descricao,
          valor: Number(editForm.valor),
          vencimento: editForm.vencimento,
          observacoes: editForm.observacoes
        });
      }

      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso!"
      });

      setShowEditModal(false);
      setItemToEdit(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Confirmar Exclusão
  const handleAbrirExclusao = (id: string, tipo: 'CONTA' | 'PAGAMENTO', descricao: string, isPagar: boolean = true) => {
    setItemToDelete({ id, tipo, descricao, isPagar });
    setShowDeleteModal(true);
  };

  const handleConfirmarExclusao = async () => {
    if (!itemToDelete) return;
    try {
      setProcessing(true);
      if (itemToDelete.tipo === 'CONTA') {
        if (itemToDelete.isPagar) {
          await contasAPagarService.deleteContaAPagar(itemToDelete.id);
        } else {
          await contasAReceberService.deleteContaAReceber(itemToDelete.id);
        }
      } else {
        setPagamentos(prev => prev.filter(p => p.id !== itemToDelete.id));
      }

      toast({
        title: "Excluído",
        description: `${itemToDelete.descricao} foi removido com sucesso.`
      });

      setShowDeleteModal(false);
      setItemToDelete(null);
      await carregarDados();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  // Filtrar contas pendentes
  const contasFiltradas = contasPendentes.filter(conta => {
    const descricao = conta.descricao || '';
    const matchesSearch = 
      descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'TODOS' || 
      (tipoFilter === 'PAGAR' && conta.tipo === 'PAGAR') ||
      (tipoFilter === 'RECEBER' && conta.tipo === 'RECEBER');

    return matchesSearch && matchesTipo;
  });

  // Filtrar histórico de pagamentos
  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchesSearch = 
      pagamento.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || pagamento.status === statusFilter;
    const matchesTipo = tipoFilter === 'TODOS' || pagamento.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Métricas
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const pagamentosConfirmados = pagamentos.filter(p => p.status === 'CONFIRMADO').length;
  const pagamentosAgendados = pagamentos.filter(p => p.status === 'AGENDADO' || p.status === 'PENDENTE').length;
  const valorPendente = contasPendentes.reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-seguranca-graphite via-gray-900 to-seguranca-black p-6 rounded-xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3 text-white tracking-tight">
            <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30 text-blue-400">
              <CreditCard className="h-6 w-6" />
            </div>
            Gestão de Pagamentos & Agendamentos
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 flex items-center gap-2">
            <ShieldCheck size={14} className="text-green-400" />
            Controle integrado de liquidação, agendamento de faturas e comprovantes
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={carregarDados}
            disabled={loading}
            variant="outline"
            className="flex-1 md:flex-none border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white gap-2 shadow-sm"
          >
            <RefreshCw size={16} className={loading ? "animate-spin text-blue-400" : "text-blue-400"} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            className="flex-1 md:flex-none border-gray-700 bg-gray-800/80 hover:bg-gray-700 text-white gap-2 shadow-sm"
          >
            <Download size={16} className="text-green-400" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-950/60 to-gray-900 border-emerald-500/30 text-white shadow-lg backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Total Liquidado</p>
                <p className="text-2xl font-black text-white mt-1">{formatCurrency(totalPagamentos)}</p>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-emerald-400/90 font-medium">
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              {pagamentos.length} transações concluídas
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-950/60 to-gray-900 border-blue-500/30 text-white shadow-lg backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">Confirmados</p>
                <p className="text-2xl font-black text-white mt-1">{pagamentosConfirmados}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-blue-400/90 font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Pagamentos liquidados
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-950/60 to-gray-900 border-amber-500/30 text-white shadow-lg backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">Agendados / Pendentes</p>
                <p className="text-2xl font-black text-white mt-1">{pagamentosAgendados}</p>
              </div>
              <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                <CalendarDays className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-amber-400/90 font-medium">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Aguardando confirmação
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-950/60 to-gray-900 border-rose-500/30 text-white shadow-lg backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">Valor em Aberto</p>
                <p className="text-2xl font-black text-white mt-1">{formatCurrency(valorPendente)}</p>
              </div>
              <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-rose-400/90 font-medium">
              <TrendingDown className="h-3.5 w-3.5 mr-1" />
              {contasPendentes.length} títulos a processar
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="pendentes" className="space-y-6">
        <TabsList className="bg-gray-900/90 border border-gray-800 p-1.5 grid grid-cols-2 gap-2 rounded-xl shadow-lg max-w-md">
          <TabsTrigger 
            value="pendentes" 
            className="data-[state='active']:bg-blue-600 data-[state='active']:text-white text-gray-300 font-semibold text-sm py-2.5 rounded-lg transition-all"
          >
            <Clock className="h-4 w-4 mr-2 inline" />
            Contas a Processar ({contasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger 
            value="historico" 
            className="data-[state='active']:bg-blue-600 data-[state='active']:text-white text-gray-300 font-semibold text-sm py-2.5 rounded-lg transition-all"
          >
            <Receipt className="h-4 w-4 mr-2 inline" />
            Histórico & Agendados ({pagamentosFiltrados.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Contas Pendentes de Pagamento / Recebimento */}
        <TabsContent value="pendentes">
          <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-xl">
            <CardHeader className="border-b border-gray-800/80 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <Clock className="text-amber-400 h-5 w-5" />
                  Títulos em Aberto Aguardando Ação
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por descrição, cliente/fornecedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-[140px] bg-gray-950 border-gray-700 text-white">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="TODOS">Todos os tipos</SelectItem>
                      <SelectItem value="PAGAR">A Pagar</SelectItem>
                      <SelectItem value="RECEBER">A Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {contasFiltradas.map((conta) => {
                  const isPagar = conta.tipo === 'PAGAR';
                  return (
                    <div 
                      key={conta.id} 
                      className="bg-gray-950/80 hover:bg-gray-800/50 border border-gray-800 hover:border-gray-700 rounded-xl p-4 md:p-5 transition-all duration-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={isPagar ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                            {isPagar ? '🔴 A Pagar' : '🟢 A Receber'}
                          </Badge>
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {conta.status}
                          </Badge>
                        </div>
                        <h3 className="text-base md:text-lg font-bold text-white tracking-wide">{conta.descricao}</h3>
                        <p className="text-gray-400 text-sm flex items-center gap-2">
                          <span className="font-semibold text-gray-300">
                            {isPagar ? `Fornecedor: ${conta.fornecedor || 'Não informado'}` : `Cliente: ${conta.cliente || 'Não informado'}`}
                          </span>
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-300 pt-1">
                          <span className="flex items-center gap-1 font-bold text-emerald-400 text-base">
                            <DollarSign size={16} />
                            {formatCurrency(conta.valor)}
                          </span>
                          <span className="flex items-center gap-1 text-gray-400 bg-gray-900 px-2.5 py-1 rounded-md border border-gray-800">
                            <Calendar size={14} className="text-blue-400" />
                            Vencimento: <strong className="text-white">{format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação na Lista */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 border-t md:border-t-0 border-gray-800 pt-3 md:pt-0">
                        {/* Visualizar */}
                        <Button
                          onClick={() => handleVisualizarConta(conta)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                          title="Visualizar Detalhes"
                        >
                          <Eye size={16} />
                        </Button>

                        {/* Editar */}
                        <Button
                          onClick={() => handleAbrirEdicao(conta)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-amber-400"
                          title="Editar Título"
                        >
                          <Edit size={16} />
                        </Button>

                        {/* Deletar */}
                        <Button
                          onClick={() => handleAbrirExclusao(conta.id, 'CONTA', conta.descricao, isPagar)}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-900 hover:bg-rose-950/60 text-rose-400"
                          title="Excluir Título"
                        >
                          <Trash2 size={16} />
                        </Button>

                        {/* Agendar Pagamento */}
                        <Button
                          onClick={() => handleAbrirPagamento(conta, 'AGENDAR')}
                          variant="outline"
                          size="sm"
                          className="border-blue-500/40 bg-blue-950/30 hover:bg-blue-900/50 text-blue-400 gap-1.5"
                          title="Agendar Pagamento"
                        >
                          <CalendarDays size={16} />
                          Agendar
                        </Button>

                        {/* Pagar / Receber Agora */}
                        <Button
                          onClick={() => handleAbrirPagamento(conta, 'AGORA')}
                          size="sm"
                          className={isPagar ? "bg-amber-500 hover:bg-amber-600 text-black font-bold gap-1.5 shadow-md" : "bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 shadow-md"}
                        >
                          <CreditCard size={16} />
                          {isPagar ? 'Pagar Agora' : 'Receber Agora'}
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {contasFiltradas.length === 0 && (
                  <div className="text-center py-12 bg-gray-950/50 rounded-xl border border-dashed border-gray-800">
                    <Clock className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 font-medium">Nenhum título pendente encontrado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Histórico de Pagamentos & Agendados */}
        <TabsContent value="historico">
          <Card className="bg-gray-900 border-gray-800 shadow-xl rounded-xl">
            <CardHeader className="border-b border-gray-800/80 pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-white text-lg font-bold flex items-center gap-2">
                  <Receipt className="text-blue-400 h-5 w-5" />
                  Histórico de Transações e Agendamentos
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar comprovante ou observação..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-gray-950 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] bg-gray-950 border-gray-700 text-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="TODOS">Todos os status</SelectItem>
                      <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                      <SelectItem value="AGENDADO">Agendado</SelectItem>
                      <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="space-y-4">
                {pagamentosFiltrados.map((pagamento) => (
                  <div 
                    key={pagamento.id} 
                    className="bg-gray-950/80 hover:bg-gray-800/50 border border-gray-800 rounded-xl p-4 md:p-5 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={pagamento.tipo === 'PAGAMENTO' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                          {pagamento.tipo === 'PAGAMENTO' ? 'Pagamento' : 'Recebimento'}
                        </Badge>
                        <Badge className={
                          pagamento.status === 'CONFIRMADO' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                          pagamento.status === 'AGENDADO' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        }>
                          {pagamento.status}
                        </Badge>
                        <Badge className="bg-gray-800 text-gray-300 border-gray-700">
                          {pagamento.metodoPagamento}
                        </Badge>
                      </div>
                      <h4 className="text-base font-bold text-white">{pagamento.observacoes || 'Sem descrição'}</h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-gray-300">
                        <span className="font-bold text-emerald-400 text-base">
                          {formatCurrency(pagamento.valor)}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Calendar size={14} className="text-blue-400" />
                          Data: <strong className="text-white">{format(pagamento.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}</strong>
                        </span>
                        {pagamento.banco && (
                          <span className="text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                            {pagamento.banco}
                          </span>
                        )}
                        {pagamento.numeroDocumento && (
                          <span className="text-gray-400 bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                            Doc: {pagamento.numeroDocumento}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleVisualizarPagamento(pagamento)}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-900 hover:bg-gray-800 text-white"
                        title="Visualizar Comprovante"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        onClick={() => handleAbrirExclusao(pagamento.id, 'PAGAMENTO', pagamento.observacoes || 'Pagamento')}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-900 hover:bg-rose-950/60 text-rose-400"
                        title="Excluir Registro"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}

                {pagamentosFiltrados.length === 0 && (
                  <div className="text-center py-12 bg-gray-950/50 rounded-xl border border-dashed border-gray-800">
                    <Receipt className="mx-auto h-12 w-12 text-gray-600 mb-3" />
                    <p className="text-gray-400 font-medium">Nenhum pagamento registrado encontrado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: Processar / Agendar Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800 text-white rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] p-6">
          <DialogHeader className="border-b border-gray-800 pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-amber-400">
              <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                <CreditCard size={22} />
              </div>
              {selectedConta?.tipo === 'PAGAR' ? 'Processar / Agendar Pagamento' : 'Processar / Agendar Recebimento'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Selecione se deseja efetuar o pagamento imediato ou agendar para uma data futura
            </DialogDescription>
          </DialogHeader>

          {selectedConta && (
            <div className="space-y-6 pt-2">
              {/* Card Sintético da Conta */}
              <div className="bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 p-4 rounded-xl border border-gray-800 shadow-inner">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-white">{selectedConta.descricao}</h3>
                  <Badge className={selectedConta.tipo === 'PAGAR' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"}>
                    {selectedConta.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 block text-xs">Valor Total:</span>
                    <span className="text-emerald-400 font-extrabold text-base">{formatCurrency(selectedConta.valor)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">Vencimento:</span>
                    <span className="text-white font-medium">{format(selectedConta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs">{selectedConta.tipo === 'PAGAR' ? 'Fornecedor:' : 'Cliente:'}</span>
                    <span className="text-gray-200 font-medium truncate block">{selectedConta.fornecedor || selectedConta.cliente || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              {/* Seletor do Modo de Ação: PAGAR AGORA vs AGENDAR */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Modo de Ação</label>
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-950 rounded-xl border border-gray-800">
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, modo: 'AGORA', dataPagamento: new Date() }))}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                      paymentForm.modo === 'AGORA'
                        ? 'bg-amber-500 text-black shadow-lg scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Pagar Agora
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentForm(prev => ({ ...prev, modo: 'AGENDAR', dataPagamento: selectedConta.vencimento || new Date() }))}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all ${
                      paymentForm.modo === 'AGENDAR'
                        ? 'bg-blue-600 text-white shadow-lg scale-[1.02]'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                    }`}
                  >
                    <CalendarDays size={18} />
                    Agendar Pagamento
                  </button>
                </div>
              </div>

              {/* Formulário Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Valor */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-300">Valor (R$) *</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, valor: selectedConta.valor }))}
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-amber-400 px-2 py-0.5 rounded border border-gray-700"
                      >
                        Total (100%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentForm(prev => ({ ...prev, valor: selectedConta.valor / 2 }))}
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-blue-400 px-2 py-0.5 rounded border border-gray-700"
                      >
                        50%
                      </button>
                    </div>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentForm.valor}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                    className="bg-gray-950 border-gray-700 text-white font-bold text-base focus:border-amber-400"
                    required
                  />
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">
                    {paymentForm.modo === 'AGORA' ? 'Data do Pagamento *' : 'Data Agendada para Pagamento *'}
                  </label>
                  <Input
                    type="date"
                    value={format(paymentForm.dataPagamento, 'yyyy-MM-dd')}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, dataPagamento: new Date(e.target.value + 'T12:00:00') }))}
                    className="bg-gray-950 border-gray-700 text-white focus:border-amber-400"
                    required
                  />
                </div>

                {/* Método de Pagamento */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-300">Forma de Pagamento *</label>
                  <Select 
                    value={paymentForm.metodoPagamento} 
                    onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, metodoPagamento: value }))}
                  >
                    <SelectTrigger className="bg-gray-950 border-gray-700 text-white focus:border-amber-400">
                      <SelectValue placeholder="Selecione a forma" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência Bancária (TED/DOC)</SelectItem>
                      <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro em Espécie</SelectItem>
                      <SelectItem value="CARTAO">Cartão de Crédito / Débito</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Campos Bancários */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Banco Origem / Destino</label>
                  <Input
                    value={paymentForm.banco}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, banco: e.target.value }))}
                    placeholder="Ex: Itaú, Banco do Brasil"
                    className="bg-gray-950 border-gray-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Agência e Conta / Chave PIX</label>
                  <Input
                    value={paymentForm.conta}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, conta: e.target.value }))}
                    placeholder="Ex: Ag 1234 C/C 56789-0"
                    className="bg-gray-950 border-gray-700 text-white"
                  />
                </div>

                {/* Nº do Comprovante */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-300">Nº do Comprovante / Autenticação</label>
                  <Input
                    value={paymentForm.numeroDocumento}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                    placeholder="Código de autenticação bancária ou comprovante"
                    className="bg-gray-950 border-gray-700 text-white"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-300">Observações Adicionais</label>
                  <Textarea
                    value={paymentForm.observacoes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Notas adicionais sobre esta transação..."
                    className="bg-gray-950 border-gray-700 text-white"
                    rows={2}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={processing}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessarPagamento}
                  disabled={processing}
                  className={paymentForm.modo === 'AGORA' ? "bg-amber-500 hover:bg-amber-600 text-black font-bold" : "bg-blue-600 hover:bg-blue-700 text-white font-bold"}
                >
                  {processing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      Processando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {paymentForm.modo === 'AGORA' ? <CheckCircle2 size={16} /> : <CalendarDays size={16} />}
                      {paymentForm.modo === 'AGORA' 
                        ? (selectedConta.tipo === 'PAGAR' ? 'Confirmar Pagamento Agora' : 'Confirmar Recebimento Agora')
                        : 'Confirmar Agendamento'}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Visualizar Detalhes */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-lg bg-gray-900 border-gray-800 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-gray-800 pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-blue-400">
              <Eye size={20} />
              Detalhes das Informações
            </DialogTitle>
          </DialogHeader>

          {selectedConta && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Descrição</span>
                  <strong className="text-white text-sm">{selectedConta.descricao}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Tipo</span>
                  <Badge className={selectedConta.tipo === 'PAGAR' ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}>
                    {selectedConta.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Valor</span>
                  <strong className="text-emerald-400 text-base">{formatCurrency(selectedConta.valor)}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Data Vencimento</span>
                  <span className="text-white text-sm">{format(selectedConta.vencimento, 'dd/MM/yyyy')}</span>
                </div>
                {selectedConta.fornecedor && (
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Fornecedor</span>
                    <span className="text-white text-sm">{selectedConta.fornecedor}</span>
                  </div>
                )}
                {selectedConta.cliente && (
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Cliente</span>
                    <span className="text-white text-sm">{selectedConta.cliente}</span>
                  </div>
                )}
                {selectedConta.observacoes && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Observações:</span>
                    <p className="text-gray-300 text-xs bg-gray-900 p-2 rounded border border-gray-800">{selectedConta.observacoes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowViewModal(false)} variant="outline" className="border-gray-700 text-white">
                  Fechar
                </Button>
              </div>
            </div>
          )}

          {selectedPagamento && !selectedConta && (
            <div className="space-y-4 pt-2">
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Tipo Transação</span>
                  <Badge className={selectedPagamento.tipo === 'PAGAMENTO' ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}>
                    {selectedPagamento.tipo}
                  </Badge>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Valor</span>
                  <strong className="text-emerald-400 text-base">{formatCurrency(selectedPagamento.valor)}</strong>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Forma Pagamento</span>
                  <span className="text-white text-sm font-semibold">{selectedPagamento.metodoPagamento}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                  <span className="text-xs text-gray-400">Data Transação</span>
                  <span className="text-white text-sm">{format(selectedPagamento.dataPagamento, 'dd/MM/yyyy')}</span>
                </div>
                {selectedPagamento.banco && (
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Banco</span>
                    <span className="text-white text-sm">{selectedPagamento.banco}</span>
                  </div>
                )}
                {selectedPagamento.numeroDocumento && (
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span className="text-xs text-gray-400">Nº Documento / Autenticação</span>
                    <span className="text-amber-400 text-sm font-mono">{selectedPagamento.numeroDocumento}</span>
                  </div>
                )}
                {selectedPagamento.observacoes && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">Observações:</span>
                    <p className="text-gray-300 text-xs bg-gray-900 p-2 rounded border border-gray-800">{selectedPagamento.observacoes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={() => setShowViewModal(false)} variant="outline" className="border-gray-700 text-white">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Editar Conta */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader className="border-b border-gray-800 pb-3">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <Edit size={20} />
              Editar Título
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Descrição</label>
              <Input
                value={editForm.descricao}
                onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                className="bg-gray-950 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                value={editForm.valor}
                onChange={(e) => setEditForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                className="bg-gray-950 border-gray-700 text-white font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Vencimento</label>
              <Input
                type="date"
                value={format(editForm.vencimento, 'yyyy-MM-dd')}
                onChange={(e) => setEditForm(prev => ({ ...prev, vencimento: new Date(e.target.value + 'T12:00:00') }))}
                className="bg-gray-950 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Observações</label>
              <Textarea
                value={editForm.observacoes}
                onChange={(e) => setEditForm(prev => ({ ...prev, observacoes: e.target.value }))}
                className="bg-gray-950 border-gray-700 text-white"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <Button onClick={() => setShowEditModal(false)} variant="outline" className="border-gray-700 text-white">
                Cancelar
              </Button>
              <Button onClick={handleSalvarEdicao} disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {processing ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md bg-gray-900 border-gray-800 text-white rounded-2xl shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-500">
              <Trash2 size={20} />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>

          {itemToDelete && (
            <div className="space-y-4 pt-2">
              <p className="text-gray-300 text-sm">
                Tem certeza que deseja excluir o registro <strong className="text-white">"{itemToDelete.descricao}"</strong>?
              </p>
              <p className="text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-500/30">
                ⚠️ Esta ação removerá o registro do sistema e não poderá ser desfeita.
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <Button onClick={() => setShowDeleteModal(false)} variant="outline" className="border-gray-700 text-white">
                  Cancelar
                </Button>
                <Button onClick={handleConfirmarExclusao} disabled={processing} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                  {processing ? 'Excluindo...' : 'Sim, Excluir'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagamentosTab;
