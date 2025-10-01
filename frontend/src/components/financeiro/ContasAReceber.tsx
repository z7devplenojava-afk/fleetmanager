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
  CheckCircle,
  AlertCircle,
  XCircle,
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
  PieChart
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
  const [showForm, setShowForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCobrancaModal, setShowCobrancaModal] = useState(false);
  const [cobrancaTexto, setCobrancaTexto] = useState('');
  const [cobrancaTipo, setCobrancaTipo] = useState<'email' | 'whatsapp' | 'telefone'>('email');
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  // Funções de cobrança e gestão
  
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
  const handleCobrancaAutomatica = async (contaId: string, tipo: 'email' | 'whatsapp' | 'telefone') => {
    try {
      // Implementar envio de cobrança automática
      const conta = contas.find(c => c.id === contaId);
      if (!conta) return;

      const novoHistorico: HistoricoCobranca = {
        id: Date.now().toString(),
        data: new Date().toISOString(),
        tipo,
        descricao: `Cobrança automática enviada via ${tipo}`,
        usuario: 'Sistema',
        resultado: 'enviado'
      };

      // Atualizar histórico da conta
      setContas(prev => prev.map(c => 
        c.id === contaId 
          ? { ...c, historicoCobranca: [...c.historicoCobranca, novoHistorico] }
          : c
      ));

      toast({
        title: 'Cobrança Enviada',
        description: `Cobrança enviada via ${tipo} para ${conta.client.name}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar cobrança',
        variant: 'destructive'
      });
    }
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
          ? { ...c, historicoCobranca: [...c.historicoCobranca, novoHistorico] }
          : c
      ));

      setShowCobrancaModal(false);
      setCobrancaTexto('');
      setSelectedConta(null);

      toast({
        title: 'Cobrança Enviada',
        description: `Cobrança personalizada enviada para ${selectedConta.client.name}`
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
      const contasVencidas = contas.filter(c => c.status === 'OVERDUE');
      // Implementar exportação de relatório de inadimplência
      toast({
        title: 'Relatório Gerado',
        description: `Relatório de inadimplência com ${contasVencidas.length} contas gerado`
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

  const calcularEstatisticas = () => {
    const total = contas.length;
    const valorTotal = contas.reduce((sum, c) => sum + c.amount, 0);
    const valorPago = contas.reduce((sum, c) => sum + c.amountPaid, 0);
    const valorPendente = contas.reduce((sum, c) => sum + c.pendingAmount, 0);
    const vencidas = contas.filter(c => c.status === 'OVERDUE').length;
    const valorVencido = contas.filter(c => c.status === 'OVERDUE').reduce((sum, c) => sum + c.pendingAmount, 0);
    const mediaAtraso = contas.filter(c => c.overdueDays > 0).reduce((sum, c) => sum + c.overdueDays, 0) / contas.filter(c => c.overdueDays > 0).length || 0;

    // Distribuição por status (somatório de valores por status)
    const porStatus: Record<string, number> = contas.reduce((acc, conta) => {
      const key = conta.status;
      const valor = typeof conta.amount === 'number' ? conta.amount : 0;
      acc[key] = (acc[key] || 0) + valor;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      valorTotal,
      valorPago,
      valorPendente,
      vencidas,
      valorVencido,
      mediaAtraso: Math.round(mediaAtraso),
      taxaInadimplencia: total > 0 ? (vencidas / total * 100) : 0,
      porStatus
    };
  };

  // Carregar dados reais da API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('Carregando dados de Contas a Receber...');
        
        // Carregar contas a receber
        const contasData = await contasAReceberService.getContasAReceber();
        console.log('Contas carregadas:', contasData);
        setContas(contasData);
        
        // Carregar clientes
        const clientesData = await contasAReceberService.getClientes();
        console.log('Clientes carregados:', clientesData);
        setClientes(clientesData);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = calcularEstatisticas();

  // Filtros aplicados
  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conta.status === filterStatus;
    const matchesCategoria = filterCategoria === 'all' || conta.categoria === filterCategoria;
    const matchesCliente = filterCliente === 'all' || conta.client.id === filterCliente;
    
    // Filtro por data
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      const contaDate = new Date(conta.dueDate);
      matchesDate = contaDate >= dateRange.from && contaDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesCategoria && matchesCliente && matchesDate;
  });

  return (
    <ContasAReceberGuard requiredPermission="VIEW_ACCOUNTS_RECEIVABLE">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-seguranca-lightgray">Contas a Receber</h1>
            <p className="text-gray-400">Gerencie suas contas a receber e controle de inadimplência</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button 
              variant="outline" 
              onClick={handleExportInadimplencia}
              disabled={exportLoading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
            >
              <FileText className="w-4 h-4 mr-2" />
              Relatório Inadimplência
            </Button>
            <Button 
              onClick={() => handleOpenFormModal()}
              className="flex items-center gap-2 bg-seguranca-red text-white hover:bg-seguranca-red/90"
            >
              <Plus className="w-4 h-4" />
              Nova Conta
            </Button>
          </div>
        </div>


        {/* Filtros */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Campo de busca */}
              <div className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por cliente, fatura ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-gray-600 bg-seguranca-black text-seguranca-lightgray placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  />
                </div>
              </div>
              
              {/* Filtros básicos */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Todos Status</SelectItem>
                      <SelectItem value="pendente" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Pendente</SelectItem>
                      <SelectItem value="pago" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Pago</SelectItem>
                      <SelectItem value="vencido" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Vencido</SelectItem>
                      <SelectItem value="cancelado" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Todas</SelectItem>
                      <SelectItem value="servicos" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Serviços</SelectItem>
                      <SelectItem value="produtos" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Produtos</SelectItem>
                      <SelectItem value="consultoria" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Consultoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros Avançados
                </Button>
              </div>
            </div>

            {/* Filtros Avançados */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray">Período</label>
                    <DatePickerWithRange
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-seguranca-lightgray">Cliente</label>
                    <Select value={filterCliente} onValueChange={setFilterCliente}>
                      <SelectTrigger className="border-gray-600 bg-seguranca-black text-seguranca-lightgray focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-black border-gray-600">
                        <SelectItem value="all" className="text-seguranca-lightgray hover:bg-seguranca-graphite">Todos os Clientes</SelectItem>
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id} className="text-seguranca-lightgray hover:bg-seguranca-graphite">
                            {cliente.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterCategoria('all');
                        setFilterCliente('all');
                        setDateRange(undefined);
                      }}
                      className="w-full border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  Mostrando {filteredContas.length} de {contas.length} contas
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="lista">Lista de Contas</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-seguranca-lightgray">Total a Receber</p>
                        <p className="text-2xl font-bold text-seguranca-yellow">
                          R$ {contas.reduce((sum, c) => sum + c.amount, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-seguranca-yellow" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-seguranca-lightgray">Valor Recebido</p>
                        <p className="text-2xl font-bold text-seguranca-yellow">
                          R$ {contas.reduce((sum, c) => sum + c.amountPaid, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-seguranca-yellow" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-seguranca-lightgray">Valor Vencido</p>
                        <p className="text-2xl font-bold text-seguranca-red">
                          R$ {contas.filter(c => c.status === 'OVERDUE').reduce((sum, c) => sum + c.amount, 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-seguranca-red/20 rounded-lg flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-seguranca-red" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-seguranca-lightgray">Taxa Inadimplência</p>
                        <p className="text-2xl font-bold text-seguranca-red">
                          {contas.length > 0 ? ((contas.filter(c => c.status === 'OVERDUE').length / contas.length) * 100).toFixed(1) : 0}%
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-seguranca-red/20 rounded-lg flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-seguranca-red" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Gráficos Principais */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Status - Pizza */}
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <PieChart className="h-5 w-5 text-seguranca-yellow" />
                      Distribuição por Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { status: 'PENDING', label: 'Pendentes', color: 'bg-seguranca-lightgray', count: contas.filter(c => c.status === 'PENDING').length },
                        { status: 'PAID', label: 'Pagas', color: 'bg-seguranca-yellow', count: contas.filter(c => c.status === 'PAID').length },
                        { status: 'OVERDUE', label: 'Vencidas', color: 'bg-seguranca-red', count: contas.filter(c => c.status === 'OVERDUE').length },
                        { status: 'PARTIAL', label: 'Parciais', color: 'bg-seguranca-yellow', count: contas.filter(c => c.status === 'PARTIAL').length }
                      ].map((item) => {
                        const percentage = contas.length > 0 ? (item.count / contas.length) * 100 : 0;
                        return (
                          <div key={item.status} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                                <span className="text-sm text-seguranca-lightgray">{item.label}</span>
                              </div>
                              <span className="font-semibold text-seguranca-lightgray">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-400 text-right">{percentage.toFixed(1)}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Gráfico de Valores - Barras */}
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <BarChart3 className="h-5 w-5 text-seguranca-yellow" />
                      Valores por Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { 
                          label: 'Total a Receber', 
                          value: contas.reduce((sum, c) => sum + c.amount, 0),
                          color: 'bg-seguranca-yellow',
                          textColor: 'text-seguranca-yellow'
                        },
                        { 
                          label: 'Valor Recebido', 
                          value: contas.reduce((sum, c) => sum + c.amountPaid, 0),
                          color: 'bg-seguranca-yellow',
                          textColor: 'text-seguranca-yellow'
                        },
                        { 
                          label: 'Valor Pendente', 
                          value: contas.reduce((sum, c) => sum + c.pendingAmount, 0),
                          color: 'bg-seguranca-red',
                          textColor: 'text-seguranca-red'
                        },
                        { 
                          label: 'Valor Vencido', 
                          value: contas.filter(c => c.status === 'OVERDUE').reduce((sum, c) => sum + c.amount, 0),
                          color: 'bg-seguranca-red',
                          textColor: 'text-seguranca-red'
                        }
                      ].map((item) => {
                        const maxValue = Math.max(
                          contas.reduce((sum, c) => sum + c.amount, 0),
                          contas.reduce((sum, c) => sum + c.amountPaid, 0),
                          contas.reduce((sum, c) => sum + c.pendingAmount, 0),
                          contas.filter(c => c.status === 'OVERDUE').reduce((sum, c) => sum + c.amount, 0)
                        );
                        const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        
                        return (
                          <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-seguranca-lightgray">{item.label}</span>
                              <span className={`font-semibold ${item.textColor}`}>
                                R$ {item.value.toLocaleString('pt-BR')}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Análise de Inadimplência */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clientes por Valor */}
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <User className="h-5 w-5 text-seguranca-yellow" />
                      Top Clientes por Valor
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contas
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 5)
                        .map((conta, index) => (
                          <div key={conta.id} className="flex items-center justify-between p-3 bg-seguranca-black/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-seguranca-yellow/20 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-seguranca-yellow">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium text-seguranca-lightgray">{conta.client.name}</p>
                                <p className="text-xs text-gray-400">{conta.invoiceNumber}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-seguranca-yellow">
                                R$ {conta.amount.toLocaleString('pt-BR')}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  conta.status === 'OVERDUE' ? 'border-seguranca-red text-seguranca-red' :
                                  conta.status === 'PAID' ? 'border-seguranca-yellow text-seguranca-yellow' :
                                  conta.status === 'PENDING' ? 'border-seguranca-lightgray text-seguranca-lightgray' :
                                  'border-seguranca-yellow text-seguranca-yellow'
                                }`}
                              >
                                {conta.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contas Vencidas */}
                <Card className="bg-seguranca-graphite border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
                      <AlertCircle className="h-5 w-5 text-seguranca-red" />
                      Contas Vencidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contas
                        .filter(c => c.status === 'OVERDUE')
                        .sort((a, b) => b.overdueDays - a.overdueDays)
                        .slice(0, 5)
                        .map((conta) => (
                          <div key={conta.id} className="flex items-center justify-between p-3 bg-seguranca-red/10 border border-seguranca-red/20 rounded-lg">
                            <div>
                              <p className="font-medium text-seguranca-lightgray">{conta.client.name}</p>
                              <p className="text-xs text-gray-400">{conta.invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-seguranca-red">
                                R$ {conta.amount.toLocaleString('pt-BR')}
                              </p>
                              <p className="text-xs text-seguranca-red">
                                {conta.overdueDays} dias em atraso
                              </p>
                            </div>
                          </div>
                        ))}
                      {contas.filter(c => c.status === 'OVERDUE').length === 0 && (
                        <div className="text-center py-8">
                          <CheckCircle className="h-12 w-12 text-seguranca-yellow mx-auto mb-2" />
                          <p className="text-seguranca-lightgray">Nenhuma conta vencida!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lista" className="space-y-4">
            {/* Tabela de Contas */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-seguranca-graphite border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Cliente / Fatura
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Medição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Vencimento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-seguranca-lightgray uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-seguranca-black divide-y divide-gray-700">
                      {filteredContas.map((conta) => (
                        <tr key={conta.id} className="hover:bg-seguranca-graphite/50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-seguranca-lightgray">{conta.client.name}</div>
                              <div className="text-sm text-gray-400">
                                Fatura: {conta.invoiceNumber}
                              </div>
                              <div className="text-sm text-gray-400">{conta.description}</div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-seguranca-lightgray">
                              {conta.measurementNumber || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-seguranca-yellow">
                                R$ {conta.amount.toLocaleString('pt-BR')}
                              </div>
                              {conta.amountPaid > 0 && (
                                <div className="text-sm text-seguranca-yellow">
                                  Pago: R$ {conta.amountPaid.toLocaleString('pt-BR')}
                                </div>
                              )}
                              {conta.pendingAmount > 0 && (
                                <div className="text-sm text-seguranca-red">
                                  Pendente: R$ {conta.pendingAmount.toLocaleString('pt-BR')}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm text-seguranca-lightgray">
                                {format(new Date(conta.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </div>
                              {conta.overdueDays > 0 && (
                                <div className="text-sm text-seguranca-red">
                                  {conta.overdueDays} dias em atraso
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <Badge
                              variant={conta.status === 'PAID' ? 'default' : 
                                      conta.status === 'OVERDUE' ? 'destructive' : 
                                      conta.status === 'PENDING' ? 'secondary' : 'outline'}
                            >
                              {conta.status === 'PAID' ? 'Pago' :
                               conta.status === 'OVERDUE' ? 'Vencido' :
                               conta.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {(conta.status === 'PENDING' || conta.status === 'OVERDUE') && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite hover:text-seguranca-yellow"
                                  onClick={() => {
                                    setSelectedConta(conta);
                                    setShowCobrancaModal(true);
                                  }}
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="border-gray-600 text-seguranca-red hover:bg-seguranca-graphite hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Modal de Cobrança */}
        <Dialog open={showCobrancaModal} onOpenChange={setShowCobrancaModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enviar Cobrança</DialogTitle>
              <DialogDescription>
                Enviar cobrança para {selectedConta?.client.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-seguranca-lightgray">Tipo de Cobrança</label>
                <Select value={cobrancaTipo} onValueChange={setCobrancaTipo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">E-mail</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Mensagem Personalizada</Label>
                <Textarea
                  value={cobrancaTexto}
                  onChange={(e) => setCobrancaTexto(e.target.value)}
                  placeholder="Digite uma mensagem personalizada (opcional)"
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCobrancaModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCobrancaPersonalizada}>
                <Send className="w-4 h-4 mr-2" />
                Enviar Cobrança
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Formulário */}
        <ContasAReceberFormModal
          open={showFormModal}
          onOpenChange={handleCloseFormModal}
          onSuccess={handleFormSuccess}
          editMode={editMode}
          contaData={selectedConta}
        />
       </div>
     </ContasAReceberGuard>
   );
 };

export default ContasAReceber;
