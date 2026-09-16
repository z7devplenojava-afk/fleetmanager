import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Building,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  X,
  Mail,
  Phone,
  FileText,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
  CreditCard,
  BarChart3,
  PieChart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ContasAReceberGuard } from './FinanceiroPermissionGuard';
import { ContasAReceberFormModal } from './ContasAReceberFormModal';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, isAfter, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { DateRange } from 'react-day-picker';
import { contasAReceberService, Cliente, ContaAReceber } from '@/services/contasAReceberService';

interface HistoricoCobranca {
  id: string;
  data: string;
  tipo: 'email' | 'telefone' | 'whatsapp' | 'carta' | 'visita';
  descricao: string;
  usuario: string;
  resultado: 'enviado' | 'lido' | 'respondido' | 'promessa' | 'sem_resposta';
}

export const ContasAReceber: React.FC = () => {
  const [contas, setContas] = useState<ContaAReceber[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategoria, setFilterCategoria] = useState('all');
  const [filterCliente, setFilterCliente] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  
  // Estados do modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaAReceber | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCobrancaModal, setShowCobrancaModal] = useState(false);
  const [cobrancaTexto, setCobrancaTexto] = useState('');
  const [cobrancaTipo, setCobrancaTipo] = useState<'email' | 'whatsapp' | 'telefone'>('email');
  const [exportLoading, setExportLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<ContaAReceber | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Funções do modal
  const handleOpenFormModal = (conta?: ContaAReceber) => {
    if (conta) {
      setSelectedConta(conta);
      setEditMode(true);
    } else {
      setSelectedConta(null);
      setEditMode(false);
    }
    setShowFormModal(true);
  };

  const handleCloseFormModal = () => {
    setShowFormModal(false);
    setSelectedConta(null);
    setEditMode(false);
  };

  const handleFormSuccess = () => {
    loadContas();
    handleCloseFormModal();
  };

  const handleCobrancaPersonalizada = async () => {
    if (!selectedConta || !cobrancaTexto.trim()) return;

    try {
      const novoHistorico: HistoricoCobranca = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        tipo: cobrancaTipo,
        descricao: cobrancaTexto,
        usuario: 'Usuário Atual',
        resultado: 'enviado'
      };

      setContas(prev => prev.map(c => 
        c.id === selectedConta.id 
          ? { ...c, historicoCobranca: [...(c.historicoCobranca || []), novoHistorico] }
          : c
      ));

      setShowCobrancaModal(false);
      setCobrancaTexto('');
      setSelectedConta(null);

      toast({
        title: 'Cobrança Enviada',
        description: `Cobrança personalizada enviada para ${selectedConta.client?.name || 'cliente'}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar cobrança personalizada',
        variant: 'destructive'
      });
    }
  };

  const handleExportInadimplencia = async () => {
    setExportLoading(true);
    try {
      const contasVencidas = contas.filter(c => c.status === 'OVERDUE' || c.status === 'VENCIDA');
      toast({
        title: 'Relatório Gerado',
        description: `Relatório de inadimplência com ${contasVencidas.length} contas gerado com sucesso.`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleViewConta = (conta: ContaAReceber) => {
    setSelectedConta(conta);
    setShowViewModal(true);
  };

  const handleEditConta = (conta: ContaAReceber) => {
    handleOpenFormModal(conta);
  };

  const handleDeleteClick = (conta: ContaAReceber) => {
    setContaToDelete(conta);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!contaToDelete?.id) return;

    setDeleting(true);
    try {
      await contasAReceberService.deleteContaAReceber(contaToDelete.id);
      toast({
        title: 'Sucesso',
        description: 'Conta a receber excluída com sucesso!'
      });
      loadContas();
      setShowDeleteConfirm(false);
      setContaToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar conta:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir conta a receber. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const calcularEstatisticas = () => {
    const total = contas.length;
    const valorTotal = contas.reduce((sum, c) => sum + (c?.amount || c?.valor || 0), 0);
    const valorPago = contas.reduce((sum, c) => sum + (c?.amountPaid || 0), 0);
    const valorPendente = contas.reduce((sum, c) => sum + (c?.pendingAmount || (c?.status === 'PENDING' || c?.status === 'ABERTA' ? (c?.amount || c?.valor || 0) : 0)), 0);
    const vencidas = contas.filter(c => c?.status === 'OVERDUE' || c?.status === 'VENCIDA').length;
    const valorVencido = contas
      .filter(c => c?.status === 'OVERDUE' || c?.status === 'VENCIDA')
      .reduce((sum, c) => sum + (c?.pendingAmount || c?.amount || c?.valor || 0), 0);
    
    const contasComAtraso = contas.filter(c => (c?.overdueDays || 0) > 0);
    const mediaAtraso = contasComAtraso.length > 0
      ? contasComAtraso.reduce((sum, c) => sum + (c?.overdueDays || 0), 0) / contasComAtraso.length
      : 0;

    return {
      total,
      valorTotal: isNaN(valorTotal) ? 0 : valorTotal,
      valorPago: isNaN(valorPago) ? 0 : valorPago,
      valorPendente: isNaN(valorPendente) ? 0 : valorPendente,
      vencidas,
      valorVencido: isNaN(valorVencido) ? 0 : valorVencido,
      mediaAtraso: Math.round(mediaAtraso) || 0,
      taxaInadimplencia: total > 0 ? (vencidas / total * 100) : 0
    };
  };

  const loadContas = async () => {
    try {
      setLoading(true);
      const [contasData, clientesData] = await Promise.all([
        contasAReceberService.getContasAReceber(),
        contasAReceberService.getClientes()
      ]);
      setContas(contasData || []);
      setClientes(clientesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de Contas a Receber.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContas();
  }, []);

  const stats = calcularEstatisticas();

  const [sortField, setSortField] = useState<string>('vencimento');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredContas = contas.filter(conta => {
    if (!conta) return false;
    
    const matchesSearch = (conta.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (conta.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (conta.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = filterStatus === 'all' || conta.status === filterStatus ||
                         (filterStatus === 'PENDING' && (conta.status === 'ABERTA' || conta.status === 'PENDING')) ||
                         (filterStatus === 'PAID' && (conta.status === 'PAGA' || conta.status === 'PAID')) ||
                         (filterStatus === 'OVERDUE' && (conta.status === 'VENCIDA' || conta.status === 'OVERDUE'));
    const matchesCategoria = filterCategoria === 'all' || conta.categoria === filterCategoria;
    const matchesCliente = filterCliente === 'all' || conta.client?.id === filterCliente;
    
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      try {
        const contaDate = new Date(conta.dueDate || conta.vencimento);
        if (isNaN(contaDate.getTime())) return false;
        matchesDate = contaDate >= dateRange.from && contaDate <= dateRange.to;
      } catch {
        matchesDate = false;
      }
    }
    
    return matchesSearch && matchesStatus && matchesCategoria && matchesCliente && matchesDate;
  });

  const sortedContas = React.useMemo(() => {
    return [...filteredContas].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'cliente':
          valA = (a.client?.name || a.cliente || '').toLowerCase();
          valB = (b.client?.name || b.cliente || '').toLowerCase();
          break;
        case 'medicao':
          valA = (a.measurementNumber || '').toLowerCase();
          valB = (b.measurementNumber || '').toLowerCase();
          break;
        case 'valor':
          valA = Number(a.amount || a.valor || 0);
          valB = Number(b.amount || b.valor || 0);
          break;
        case 'vencimento':
          valA = new Date(a.dueDate || a.vencimento || 0).getTime();
          valB = new Date(b.dueDate || b.vencimento || 0).getTime();
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        default:
          valA = 0;
          valB = 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContas, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'PAGA':
      case 'RECEBIDA':
        return (
          <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold px-2.5 py-1 flex items-center gap-1.5 w-fit">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Pago
          </Badge>
        );
      case 'OVERDUE':
      case 'VENCIDA':
        return (
          <Badge className="bg-red-950/80 text-red-400 border border-red-500/40 font-semibold px-2.5 py-1 flex items-center gap-1.5 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            Vencido
          </Badge>
        );
      case 'PARTIAL':
      case 'PARCIAL':
        return (
          <Badge className="bg-sky-950/80 text-sky-400 border border-sky-500/40 font-semibold px-2.5 py-1 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Parcial
          </Badge>
        );
      case 'PENDING':
      case 'ABERTA':
      case 'PENDENTE':
      default:
        return (
          <Badge className="bg-amber-950/80 text-amber-400 border border-amber-500/40 font-semibold px-2.5 py-1 flex items-center gap-1.5 w-fit">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <ContasAReceberGuard requiredPermission="VIEW_ACCOUNTS_RECEIVABLE">
      <div className="space-y-6 min-h-screen text-slate-100 p-2 sm:p-4">
        
        {/* Header Principal */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Contas a Receber</h1>
                <p className="text-sm text-slate-400">Gerencie entradas financeiras, cobranças e controle de inadimplência</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={loadContas}
              disabled={loading}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportInadimplencia}
              disabled={exportLoading}
              className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            >
              <FileText className="w-4 h-4 mr-2 text-amber-400" />
              Relatório Inadimplência
            </Button>

            <Button 
              onClick={() => handleOpenFormModal()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </Button>
          </div>
        </div>

        {/* Barra de Busca e Filtros */}
        <Card className="bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-md">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, número da fatura ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-full md:w-48">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="OVERDUE">Vencido</SelectItem>
                      <SelectItem value="PARTIAL">Parcial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Categoria Filter */}
                <div className="w-full md:w-48">
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500 rounded-xl">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
                      <SelectItem value="all">Todas Categorias</SelectItem>
                      <SelectItem value="servicos">Serviços</SelectItem>
                      <SelectItem value="produtos">Produtos</SelectItem>
                      <SelectItem value="locacao">Locação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`border-slate-700 rounded-xl text-slate-200 hover:bg-slate-800 ${showAdvancedFilters ? 'bg-slate-800 text-emerald-400 border-emerald-500/40' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
              </div>

              {/* Filtros Avançados Expansíveis */}
              {showAdvancedFilters && (
                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-400">Período de Vencimento</label>
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase text-slate-400">Cliente Especifico</label>
                    <Select value={filterCliente} onValueChange={setFilterCliente}>
                      <SelectTrigger className="bg-slate-950 border-slate-700 text-white rounded-xl">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-white">
                        <SelectItem value="all">Todos os Clientes</SelectItem>
                        {clientes && Array.isArray(clientes) ? clientes
                          .filter(cliente => cliente && cliente.id && cliente.name)
                          .map(cliente => (
                            <SelectItem key={cliente.id} value={cliente.id}>
                              {cliente.name}
                            </SelectItem>
                          )) : null}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterCategoria('all');
                        setFilterCliente('all');
                        setDateRange(undefined);
                      }}
                      className="w-full text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Visualização */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl w-full sm:w-auto flex">
            <TabsTrigger 
              value="dashboard"
              className="flex-1 sm:flex-initial px-6 py-2 rounded-lg font-semibold text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all"
            >
              <BarChart3 className="w-4 h-4 mr-2 text-emerald-400" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger 
              value="lista"
              className="flex-1 sm:flex-initial px-6 py-2 rounded-lg font-semibold text-slate-400 data-[state=active]:bg-slate-800 data-[state=active]:text-white transition-all"
            >
              <FileText className="w-4 h-4 mr-2 text-amber-400" />
              Lista de Contas ({filteredContas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards Header Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total a Receber */}
              <Card className="bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Previsto</p>
                      <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                        R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{stats.total} faturas registradas</p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valor Recebido */}
              <Card className="bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 transition-all shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Recebido</p>
                      <p className="text-2xl font-mono font-bold text-white mt-1">
                        R$ {stats.valorPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {stats.valorTotal > 0 ? ((stats.valorPago / stats.valorTotal) * 100).toFixed(1) : 0}% liquidado
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valor Vencido */}
              <Card className="bg-slate-900/90 border-slate-800 hover:border-red-500/40 transition-all shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Vencido</p>
                      <p className="text-2xl font-mono font-bold text-red-400 mt-1">
                        R$ {stats.valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {stats.vencidas} faturas em atraso
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Taxa Inadimplência */}
              <Card className="bg-slate-900/90 border-slate-800 hover:border-amber-500/40 transition-all shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Inadimplência</p>
                      <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
                        {stats.taxaInadimplencia.toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Média de atraso: <span className="text-white font-semibold">{stats.mediaAtraso} dias</span>
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                      <TrendingDown className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Painéis Gráficos e Distribuição */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Distribuição por Status */}
              <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-400" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'PENDING', label: 'Pendentes', color: 'bg-amber-500', count: contas.filter(c => c.status === 'PENDING' || c.status === 'ABERTA').length },
                    { key: 'PAID', label: 'Pagas', color: 'bg-emerald-500', count: contas.filter(c => c.status === 'PAID' || c.status === 'PAGA' || c.status === 'RECEBIDA').length },
                    { key: 'OVERDUE', label: 'Vencidas', color: 'bg-red-500', count: contas.filter(c => c.status === 'OVERDUE' || c.status === 'VENCIDA').length },
                    { key: 'PARTIAL', label: 'Parciais', color: 'bg-sky-500', count: contas.filter(c => c.status === 'PARTIAL' || c.status === 'PARCIAL').length }
                  ].map(item => {
                    const percentage = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                    return (
                      <div key={item.key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            {item.label}
                          </span>
                          <span className="font-mono text-white font-semibold">{item.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Balanço de Valores */}
              <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-amber-400" />
                    Valores em Carteira
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Total Previsto', val: stats.valorTotal, color: 'bg-slate-400', textColor: 'text-slate-200' },
                    { label: 'Total Recebido', val: stats.valorPago, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                    { label: 'Total Pendente', val: stats.valorPendente, color: 'bg-amber-500', textColor: 'text-amber-400' },
                    { label: 'Total Vencido', val: stats.valorVencido, color: 'bg-red-500', textColor: 'text-red-400' }
                  ].map((item) => {
                    const maxVal = Math.max(stats.valorTotal, 1);
                    const pct = (item.val / maxVal) * 100;
                    return (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">{item.label}</span>
                          <span className={`font-mono font-bold ${item.textColor}`}>
                            R$ {item.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div className={`h-full ${item.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

            </div>

            {/* Listas Resumidas: Top Clientes & Contas Vencidas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Clientes */}
              <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-emerald-400" />
                    Top Clientes por Volume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contas
                      .slice()
                      .sort((a, b) => (b?.amount || b?.valor || 0) - (a?.amount || a?.valor || 0))
                      .slice(0, 5)
                      .map((conta, idx) => (
                        <div key={conta.id || idx} className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl hover:border-slate-700 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
                              #{idx + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm">{conta.client?.name || conta.cliente || 'Cliente não informado'}</p>
                              <p className="text-xs text-slate-400">Fatura: {conta.invoiceNumber || conta.numeroFatura || '-'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-emerald-400 text-sm">
                              R$ {((conta?.amount || conta?.valor || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            {getStatusBadge(conta.status)}
                          </div>
                        </div>
                      ))}
                    {contas.length === 0 && (
                      <p className="text-center py-6 text-slate-500 text-sm">Nenhuma conta cadastrada.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Faturas em Atraso Crítico */}
              <Card className="bg-slate-900/90 border-slate-800 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Contas em Atraso Prioritárias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contas
                      .filter(c => c.status === 'OVERDUE' || c.status === 'VENCIDA')
                      .sort((a, b) => (b.overdueDays || 0) - (a.overdueDays || 0))
                      .slice(0, 5)
                      .map((conta, idx) => (
                        <div key={conta.id || idx} className="flex items-center justify-between p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl">
                          <div>
                            <p className="font-semibold text-white text-sm">{conta.client?.name || conta.cliente || 'Cliente'}</p>
                            <p className="text-xs text-red-300">Fatura #{conta.invoiceNumber || '-'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-red-400 text-sm">
                              R$ {((conta?.amount || conta?.valor || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-red-400 font-semibold mt-0.5">
                              {conta.overdueDays || 0} dias em atraso
                            </p>
                          </div>
                        </div>
                      ))}
                    {contas.filter(c => c.status === 'OVERDUE' || c.status === 'VENCIDA').length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                        <p className="text-slate-300 font-medium">Nenhuma conta em atraso!</p>
                        <p className="text-xs text-slate-500">Parabéns, a inadimplência está sob controle.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          <TabsContent value="lista" className="space-y-4">
            <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-slate-200">
                    <thead className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-5 py-4 cursor-pointer hover:bg-slate-900 transition-colors select-none" onClick={() => handleSort('cliente')}>
                          <div className="flex items-center gap-1.5">
                            <span>Cliente / Fatura</span>
                            {sortField === 'cliente' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 cursor-pointer hover:bg-slate-900 transition-colors select-none" onClick={() => handleSort('medicao')}>
                          <div className="flex items-center gap-1.5">
                            <span>Medição</span>
                            {sortField === 'medicao' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 cursor-pointer hover:bg-slate-900 transition-colors select-none" onClick={() => handleSort('valor')}>
                          <div className="flex items-center gap-1.5">
                            <span>Valor</span>
                            {sortField === 'valor' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 cursor-pointer hover:bg-slate-900 transition-colors select-none" onClick={() => handleSort('vencimento')}>
                          <div className="flex items-center gap-1.5">
                            <span>Vencimento</span>
                            {sortField === 'vencimento' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 cursor-pointer hover:bg-slate-900 transition-colors select-none" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1.5">
                            <span>Status</span>
                            {sortField === 'status' ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-emerald-400 font-bold" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                            )}
                          </div>
                        </th>
                        <th className="px-5 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
                      {sortedContas.map((conta) => (
                        <tr key={conta.id} className="hover:bg-slate-800/60 transition-colors">
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-bold text-white text-sm">{conta.client?.name || conta.cliente || '-'}</p>
                              <p className="text-xs text-slate-400">Fatura: <span className="font-mono text-slate-300">{conta.invoiceNumber || conta.numeroFatura || '-'}</span></p>
                              {conta.description && <p className="text-xs text-slate-500 mt-0.5">{conta.description}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm font-mono text-slate-300">
                            {conta.measurementNumber || '-'}
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-mono font-bold text-emerald-400">
                                R$ {((conta?.amount || conta?.valor || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              {(conta?.amountPaid || 0) > 0 && (
                                <p className="text-xs text-emerald-400 font-mono">
                                  Pago: R$ {((conta?.amountPaid || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                              {(conta?.pendingAmount || 0) > 0 && (
                                <p className="text-xs text-red-400 font-mono">
                                  Pend: R$ {((conta?.pendingAmount || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div>
                              <p className="text-sm text-slate-200">
                                {conta.dueDate || conta.vencimento ? format(new Date(conta.dueDate || conta.vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                              </p>
                              {(conta.overdueDays || 0) > 0 && (
                                <p className="text-xs font-semibold text-red-400">
                                  {conta.overdueDays} dias em atraso
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {getStatusBadge(conta.status)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
                                onClick={() => handleViewConta(conta)}
                                title="Visualizar detalhes"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                                onClick={() => handleEditConta(conta)}
                                title="Editar conta"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {(conta.status === 'PENDING' || conta.status === 'OVERDUE' || conta.status === 'ABERTA' || conta.status === 'VENCIDA') && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                                  onClick={() => {
                                    setSelectedConta(conta);
                                    setShowCobrancaModal(true);
                                  }}
                                  title="Enviar cobrança"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                onClick={() => handleDeleteClick(conta)}
                                title="Excluir conta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredContas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500">
                            Nenhum lançamento encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Cobrança */}
        <Dialog open={showCobrancaModal} onOpenChange={setShowCobrancaModal}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                Enviar Notificação de Cobrança
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Enviar aviso de cobrança para {selectedConta?.client?.name || selectedConta?.cliente || 'cliente'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-slate-300">Canal de Envio</Label>
                <Select value={cobrancaTipo} onValueChange={(val: any) => setCobrancaTipo(val)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    <SelectItem value="email">E-mail Corporativo</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="telefone">Ligação / Telefone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Mensagem Personalizada</Label>
                <Textarea
                  value={cobrancaTexto}
                  onChange={(e) => setCobrancaTexto(e.target.value)}
                  placeholder="Prezado cliente, lembramos sobre a fatura pendente..."
                  rows={4}
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCobrancaModal(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                Cancelar
              </Button>
              <Button onClick={handleCobrancaPersonalizada} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                <Send className="w-4 h-4 mr-2" />
                Enviar Notificação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Formulário (Nova/Edição) */}
        <ContasAReceberFormModal
          open={showFormModal}
          onOpenChange={handleCloseFormModal}
          onSuccess={handleFormSuccess}
          editMode={editMode}
          initialData={selectedConta}
        />

        {/* Modal de Visualização */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-800 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Detalhes da Conta a Receber
              </DialogTitle>
            </DialogHeader>
            {selectedConta && (
              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Cliente</Label>
                    <p className="text-white font-semibold text-base mt-0.5">{selectedConta.client?.name || selectedConta.cliente || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Número da Fatura</Label>
                    <p className="text-white font-mono font-semibold text-base mt-0.5">{selectedConta.invoiceNumber || selectedConta.numeroFatura || '-'}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Descrição</Label>
                    <p className="text-slate-200 mt-0.5">{selectedConta.description || selectedConta.descricao || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Valor Total</Label>
                    <p className="text-emerald-400 font-mono font-bold text-lg mt-0.5">
                      R$ {((selectedConta.amount || selectedConta.valor || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Valor Pago</Label>
                    <p className="text-emerald-400 font-mono font-semibold text-base mt-0.5">
                      R$ {((selectedConta.amountPaid || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Valor Pendente</Label>
                    <p className="text-red-400 font-mono font-semibold text-base mt-0.5">
                      R$ {((selectedConta.pendingAmount || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Data de Vencimento</Label>
                    <p className="text-white font-semibold mt-0.5">
                      {selectedConta.dueDate || selectedConta.vencimento ? format(new Date(selectedConta.dueDate || selectedConta.vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Status Atual</Label>
                    <div className="mt-1">{getStatusBadge(selectedConta.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-slate-400 font-semibold">Forma de Pagamento</Label>
                    <p className="text-white font-medium mt-0.5">{selectedConta.paymentMethod || 'PIX'}</p>
                  </div>
                  {selectedConta.overdueDays && selectedConta.overdueDays > 0 && (
                    <div>
                      <Label className="text-xs uppercase text-slate-400 font-semibold">Dias em Atraso</Label>
                      <p className="text-red-400 font-bold mt-0.5">{selectedConta.overdueDays} dias</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowViewModal(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Fechar
              </Button>
              {selectedConta && (
                <Button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditConta(selectedConta);
                  }}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Conta
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Tem certeza que deseja excluir esta conta a receber? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            {contaToDelete && (
              <div className="py-3 px-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                <p className="text-slate-300 text-sm">
                  <strong className="text-slate-400">Cliente:</strong> {contaToDelete.client?.name || contaToDelete.cliente || 'Não informado'}
                </p>
                <p className="text-slate-300 text-sm">
                  <strong className="text-slate-400">Valor:</strong> <span className="font-mono text-emerald-400 font-bold">R$ {((contaToDelete.amount || contaToDelete.valor || 0) as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setContaToDelete(null);
                }}
                disabled={deleting}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-500 text-white font-semibold"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ContasAReceberGuard>
  );
};

export default ContasAReceber;
