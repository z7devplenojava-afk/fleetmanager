import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
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
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { contasAPagarService } from '@/services/contasAPagarService';
import { contasAReceberService } from '@/services/contasAReceberService';

interface Pagamento {
  id: string;
  contaId: string;
  tipo: 'PAGAMENTO' | 'RECEBIMENTO';
  valor: number;
  dataPagamento: Date;
  metodoPagamento: 'DINHEIRO' | 'PIX' | 'TRANSFERENCIA' | 'CARTAO' | 'BOLETO' | 'CHEQUE';
  status: 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO';
  observacoes?: string;
  comprovante?: File;
  banco?: string;
  agencia?: string;
  conta?: string;
  numeroDocumento?: string;
  createdAt: Date;
}

interface ContaParaPagamento {
  id: string;
  descricao: string;
  valor: number;
  vencimento: Date;
  status: string;
  tipo: 'PAGAR' | 'RECEBER';
  fornecedor?: string;
  cliente?: string;
}

const PagamentosTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [contasPendentes, setContasPendentes] = useState<ContaParaPagamento[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaParaPagamento | null>(null);
  const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [periodoFilter, setPeriodoFilter] = useState<string>('30D');
  
  // Formulário de pagamento
  const [paymentForm, setPaymentForm] = useState({
    valor: 0,
    dataPagamento: new Date(),
    metodoPagamento: 'PIX' as const,
    observacoes: '',
    banco: '',
    agencia: '',
    conta: '',
    numeroDocumento: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar contas pendentes
      const [contasPagar, contasReceber] = await Promise.all([
        contasAPagarService.getContasAPagar({ status: 'ABERTA' }),
        contasAReceberService.getContasAReceber({ status: 'ABERTA' })
      ]);

      const contasPendentesData = [
        ...contasPagar.map(conta => ({
          id: conta.id!,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento,
          status: conta.status,
          tipo: 'PAGAR' as const,
          fornecedor: conta.fornecedor
        })),
        ...contasReceber.map(conta => ({
          id: conta.id!,
          descricao: conta.descricao,
          valor: conta.valor,
          vencimento: conta.vencimento,
          status: conta.status,
          tipo: 'RECEBER' as const,
          cliente: conta.cliente
        }))
      ];

      setContasPendentes(contasPendentesData);

      // Mock de pagamentos (em produção, viria de uma API)
      const mockPagamentos: Pagamento[] = [
        {
          id: '1',
          contaId: '1',
          tipo: 'PAGAMENTO',
          valor: 1500,
          dataPagamento: new Date('2024-01-15'),
          metodoPagamento: 'PIX',
          status: 'CONFIRMADO',
          observacoes: 'Pagamento realizado via PIX',
          banco: 'Banco do Brasil',
          createdAt: new Date('2024-01-15')
        },
        {
          id: '2',
          contaId: '2',
          tipo: 'RECEBIMENTO',
          valor: 3000,
          dataPagamento: new Date('2024-01-16'),
          metodoPagamento: 'TRANSFERENCIA',
          status: 'CONFIRMADO',
          observacoes: 'Recebimento via transferência',
          banco: 'Itaú',
          createdAt: new Date('2024-01-16')
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

  const handleProcessarPagamento = async () => {
    if (!selectedConta) return;

    try {
      // Aqui você implementaria a lógica de processamento do pagamento
      // Por enquanto, vamos simular
      
      const novoPagamento: Pagamento = {
        id: Date.now().toString(),
        contaId: selectedConta.id,
        tipo: selectedConta.tipo === 'PAGAR' ? 'PAGAMENTO' : 'RECEBIMENTO',
        valor: paymentForm.valor,
        dataPagamento: paymentForm.dataPagamento,
        metodoPagamento: paymentForm.metodoPagamento,
        status: 'CONFIRMADO',
        observacoes: paymentForm.observacoes,
        banco: paymentForm.banco,
        agencia: paymentForm.agencia,
        conta: paymentForm.conta,
        numeroDocumento: paymentForm.numeroDocumento,
        createdAt: new Date()
      };

      setPagamentos(prev => [novoPagamento, ...prev]);
      
      // Atualizar status da conta
      if (selectedConta.tipo === 'PAGAR') {
        await contasAPagarService.updateContaAPagar(selectedConta.id, { 
          status: 'PAGA', 
          dataPagamento: paymentForm.dataPagamento 
        });
      } else {
        await contasAReceberService.updateContaAReceber(selectedConta.id, { 
          status: 'RECEBIDA', 
          dataPagamento: paymentForm.dataPagamento 
        });
      }

      toast({
        title: "Sucesso",
        description: `${selectedConta.tipo === 'PAGAR' ? 'Pagamento' : 'Recebimento'} processado com sucesso!`,
      });

      setShowPaymentModal(false);
      setSelectedConta(null);
      setPaymentForm({
        valor: 0,
        dataPagamento: new Date(),
        metodoPagamento: 'PIX',
        observacoes: '',
        banco: '',
        agencia: '',
        conta: '',
        numeroDocumento: ''
      });

      await carregarDados();

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento",
        variant: "destructive",
      });
    }
  };

  const handleAbrirPagamento = (conta: ContaParaPagamento) => {
    setSelectedConta(conta);
    setPaymentForm(prev => ({
      ...prev,
      valor: conta.valor,
      dataPagamento: new Date()
    }));
    setShowPaymentModal(true);
  };

  const handleVisualizarPagamento = (pagamento: Pagamento) => {
    setSelectedPagamento(pagamento);
    setShowReceiptModal(true);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentos.filter(pagamento => {
    const matchesSearch = 
      pagamento.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pagamento.numeroDocumento?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || pagamento.status === statusFilter;
    const matchesTipo = tipoFilter === 'TODOS' || pagamento.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  // Filtrar contas pendentes
  const contasFiltradas = contasPendentes.filter(conta => {
    const descricao = conta.descricao || '';
    const matchesSearch = 
      descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.fornecedor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.cliente?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Estatísticas
  const totalPagamentos = pagamentos.reduce((sum, p) => sum + p.valor, 0);
  const pagamentosConfirmados = pagamentos.filter(p => p.status === 'CONFIRMADO').length;
  const pagamentosPendentes = pagamentos.filter(p => p.status === 'PENDENTE').length;
  const valorPendente = contasPendentes.reduce((sum, c) => sum + c.valor, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <CreditCard className="text-blue-500" />
            Pagamentos
          </h1>
          <p className="text-gray-300 mt-1">
            Gerencie pagamentos e recebimentos da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={carregarDados}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Atualizar
          </Button>
          <Button
            variant="outline"
            className="border-gray-600 text-white hover:bg-seguranca-black"
          >
            <Download size={16} className="mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Processado</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(totalPagamentos)}</p>
              </div>
              <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-green-600">{pagamentos.length} transações</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Confirmados</p>
                <p className="text-xl font-bold text-blue-800">{pagamentosConfirmados}</p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-blue-600">Pagamentos confirmados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pendentes</p>
                <p className="text-xl font-bold text-yellow-800">{pagamentosPendentes}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-yellow-600">Aguardando confirmação</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Valor Pendente</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(valorPendente)}</p>
              </div>
              <div className="h-10 w-10 bg-red-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-red-600">Contas em aberto</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList className="bg-seguranca-graphite/80 backdrop-blur border-gray-700 p-1 grid grid-cols-2 gap-1 rounded-lg shadow-inner">
          <TabsTrigger value="pendentes" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-sm px-4 py-2">
            Contas Pendentes
          </TabsTrigger>
          <TabsTrigger value="historico" className="data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow text-sm px-4 py-2">
            Histórico de Pagamentos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Contas Pendentes */}
        <TabsContent value="pendentes">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="text-yellow-500" />
                Contas Pendentes de Pagamento
              </CardTitle>
              <div className="flex items-center gap-4 mt-4">
                <Input
                  placeholder="Buscar contas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm border-gray-600 bg-seguranca-black text-white placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
                <Button
                  variant="outline"
                  className="text-white border-gray-600 hover:bg-seguranca-black"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contasFiltradas.map((conta) => (
                  <Card key={conta.id} className="bg-seguranca-black border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={conta.tipo === 'PAGAR' ? 'border-red-300 text-red-300' : 'border-green-300 text-green-300'}>
                              {conta.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}
                            </Badge>
                            <Badge variant="outline" className="border-yellow-300 text-yellow-300">
                              {conta.status}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-1">{conta.descricao}</h3>
                          <p className="text-gray-400 text-sm mb-2">
                            {conta.tipo === 'PAGAR' ? `Fornecedor: ${conta.fornecedor}` : `Cliente: ${conta.cliente}`}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} />
                              {formatCurrency(conta.valor)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAbrirPagamento(conta)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CreditCard size={16} className="mr-2" />
                            {conta.tipo === 'PAGAR' ? 'Pagar' : 'Receber'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {contasFiltradas.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhuma conta pendente encontrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Histórico de Pagamentos */}
        <TabsContent value="historico">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Receipt className="text-blue-500" />
                Histórico de Pagamentos
              </CardTitle>
              <div className="flex items-center gap-4 mt-4">
                <Input
                  placeholder="Buscar pagamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm border-gray-600 bg-seguranca-black text-white placeholder:text-gray-400 focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                    <SelectItem value="CONFIRMADO" className="text-white hover:bg-seguranca-graphite">Confirmado</SelectItem>
                    <SelectItem value="PENDENTE" className="text-white hover:bg-seguranca-graphite">Pendente</SelectItem>
                    <SelectItem value="CANCELADO" className="text-white hover:bg-seguranca-graphite">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600">
                    <SelectItem value="TODOS" className="text-white hover:bg-seguranca-graphite">Todos</SelectItem>
                    <SelectItem value="PAGAMENTO" className="text-white hover:bg-seguranca-graphite">Pagamento</SelectItem>
                    <SelectItem value="RECEBIMENTO" className="text-white hover:bg-seguranca-graphite">Recebimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagamentosFiltrados.map((pagamento) => (
                  <Card key={pagamento.id} className="bg-seguranca-black border-gray-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={pagamento.tipo === 'PAGAMENTO' ? 'border-red-300 text-red-300' : 'border-green-300 text-green-300'}>
                              {pagamento.tipo === 'PAGAMENTO' ? 'Pagamento' : 'Recebimento'}
                            </Badge>
                            <Badge variant="outline" className={
                              pagamento.status === 'CONFIRMADO' ? 'border-green-300 text-green-300' :
                              pagamento.status === 'PENDENTE' ? 'border-yellow-300 text-yellow-300' :
                              'border-red-300 text-red-300'
                            }>
                              {pagamento.status}
                            </Badge>
                            <Badge variant="outline" className="border-blue-300 text-blue-300">
                              {pagamento.metodoPagamento}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                            <span className="flex items-center gap-1">
                              <DollarSign size={14} />
                              {formatCurrency(pagamento.valor)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {format(pagamento.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                            {pagamento.banco && (
                              <span className="flex items-center gap-1">
                                <Banknote size={14} />
                                {pagamento.banco}
                              </span>
                            )}
                          </div>
                          {pagamento.observacoes && (
                            <p className="text-gray-400 text-sm">{pagamento.observacoes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVisualizarPagamento(pagamento)}
                            variant="outline"
                            className="text-white border-gray-600 hover:bg-seguranca-black"
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pagamentosFiltrados.length === 0 && (
                  <div className="text-center py-8">
                    <Receipt className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhum pagamento encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Pagamento */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[600px] bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow flex items-center gap-2">
              <CreditCard size={20} />
              {selectedConta?.tipo === 'PAGAR' ? 'Processar Pagamento' : 'Processar Recebimento'}
            </DialogTitle>
            <DialogDescription>
              {selectedConta?.tipo === 'PAGAR' ? 'Confirme os dados do pagamento' : 'Confirme os dados do recebimento'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConta && (
            <div className="space-y-6">
              {/* Informações da Conta */}
              <div className="bg-seguranca-graphite p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">{selectedConta.descricao}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-white ml-2 font-semibold">{formatCurrency(selectedConta.valor)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Vencimento:</span>
                    <span className="text-white ml-2">{format(selectedConta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-white ml-2">{selectedConta.tipo === 'PAGAR' ? 'A Pagar' : 'A Receber'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white ml-2">{selectedConta.status}</span>
                  </div>
                </div>
              </div>

              {/* Formulário de Pagamento */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Valor</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.valor}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                      className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Data do Pagamento</label>
                    <Input
                      type="date"
                      value={format(paymentForm.dataPagamento, 'yyyy-MM-dd')}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, dataPagamento: new Date(e.target.value) }))}
                      className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Método de Pagamento</label>
                  <Select value={paymentForm.metodoPagamento} onValueChange={(value: any) => setPaymentForm(prev => ({ ...prev, metodoPagamento: value }))}>
                    <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600">
                      <SelectItem value="PIX" className="text-white hover:bg-seguranca-graphite">PIX</SelectItem>
                      <SelectItem value="TRANSFERENCIA" className="text-white hover:bg-seguranca-graphite">Transferência</SelectItem>
                      <SelectItem value="DINHEIRO" className="text-white hover:bg-seguranca-graphite">Dinheiro</SelectItem>
                      <SelectItem value="CARTAO" className="text-white hover:bg-seguranca-graphite">Cartão</SelectItem>
                      <SelectItem value="BOLETO" className="text-white hover:bg-seguranca-graphite">Boleto</SelectItem>
                      <SelectItem value="CHEQUE" className="text-white hover:bg-seguranca-graphite">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Banco</label>
                    <Input
                      value={paymentForm.banco}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, banco: e.target.value }))}
                      placeholder="Nome do banco"
                      className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Agência</label>
                    <Input
                      value={paymentForm.agencia}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, agencia: e.target.value }))}
                      placeholder="Agência"
                      className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-seguranca-lightgray">Conta</label>
                    <Input
                      value={paymentForm.conta}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, conta: e.target.value }))}
                      placeholder="Número da conta"
                      className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Número do Documento</label>
                  <Input
                    value={paymentForm.numeroDocumento}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, numeroDocumento: e.target.value }))}
                    placeholder="Número do documento/comprovante"
                    className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-seguranca-lightgray">Observações</label>
                  <Textarea
                    value={paymentForm.observacoes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Observações adicionais"
                    className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow"
                    rows={3}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessarPagamento}
                  className="bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90"
                >
                  <CreditCard size={16} className="mr-2" />
                  {selectedConta.tipo === 'PAGAR' ? 'Processar Pagamento' : 'Processar Recebimento'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Pagamento */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="sm:max-w-[500px] bg-seguranca-black text-seguranca-lightgray border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-seguranca-yellow flex items-center gap-2">
              <Receipt size={20} />
              Detalhes do Pagamento
            </DialogTitle>
          </DialogHeader>
          
          {selectedPagamento && (
            <div className="space-y-4">
              <div className="bg-seguranca-graphite p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-white ml-2">{selectedPagamento.tipo}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="text-white ml-2">{selectedPagamento.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Valor:</span>
                    <span className="text-white ml-2 font-semibold">{formatCurrency(selectedPagamento.valor)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Método:</span>
                    <span className="text-white ml-2">{selectedPagamento.metodoPagamento}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Data:</span>
                    <span className="text-white ml-2">{format(selectedPagamento.dataPagamento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                  {selectedPagamento.banco && (
                    <div>
                      <span className="text-gray-400">Banco:</span>
                      <span className="text-white ml-2">{selectedPagamento.banco}</span>
                    </div>
                  )}
                </div>
                {selectedPagamento.observacoes && (
                  <div className="mt-4">
                    <span className="text-gray-400 text-sm">Observações:</span>
                    <p className="text-white text-sm mt-1">{selectedPagamento.observacoes}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiptModal(false)}
                  className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
                >
                  Fechar
                </Button>
                <Button
                  variant="outline"
                  className="text-seguranca-lightgray border-gray-600 hover:bg-seguranca-graphite"
                >
                  <Download size={16} className="mr-2" />
                  Baixar Comprovante
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
