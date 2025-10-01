import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Eye, DollarSign, TrendingUp, TrendingDown, Calendar, Loader2, AlertCircle, AlertTriangle, RefreshCw, Trash, Calculator, Clock, CheckCircle, FileText, Bell, BarChart3 } from 'lucide-react';
import { TransacaoFormModal } from '@/components/financeiro/TransacaoFormModal';
import { ContaReceberModal } from '@/components/financeiro/ContaReceberModal';
import { FaturaViewModal } from '@/components/financeiro/FaturaViewModal';
import { ConfirmarPagamentoModal } from '@/components/financeiro/ConfirmarPagamentoModal';
import { FinanceiroDashboard } from '@/components/financeiro/FinanceiroDashboard';
import { FinanceiroRelatorios } from '@/components/financeiro/FinanceiroRelatorios';
import { useToast } from '@/hooks/use-toast';
import { financialService, FinancialTransaction, Invoice, FinancialReport } from '@/services/financialService';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin } from '@/types/measurement';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { EmptyState } from '@/components/ui/EmptyState';
import { unitService, Unit } from '@/services/unitService';
import ProvisioningTable from '@/components/financeiro/ProvisioningTable';
import { provisioningService } from '@/services/provisioningService';
import { Provisioning } from '@/types/provisioning';
import MeasurementCompleteTable from '@/components/financeiro/MeasurementCompleteTable';
import MeasurementSimpleTable from '@/components/financeiro/MeasurementSimpleTable';
import { MeasurementBulletinModal } from '@/components/financeiro/MeasurementBulletinModal';
import { SimplifiedMeasurementModal } from '@/components/financeiro/SimplifiedMeasurementModal';

const Financeiro: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransacaoModal, setShowTransacaoModal] = useState(false);
  const [showContaReceberModal, setShowContaReceberModal] = useState(false);
  const [showFaturaModal, setShowFaturaModal] = useState(false);
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [selectedFatura, setSelectedFatura] = useState<Invoice | null>(null);
  const [resumoFinanceiro, setResumoFinanceiro] = useState<FinancialReport | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Estados adicionais
  const [showNovaFaturaModal, setShowNovaFaturaModal] = useState(false);
  const [editandoFatura, setEditandoFatura] = useState(false);
  const [novaFatura, setNovaFatura] = useState<any>({
    id: '',
    description: '',
    client: null,
    contract: null,
    amount: 0,
    issueDate: '',
    dueDate: '',
    notes: '',
    unit: null,
    status: 'PENDENTE',
  });
  const [salvandoFatura, setSalvandoFatura] = useState(false);
  const [clientesSelect, setClientesSelect] = useState([]);
  const [contratosSelect, setContratosSelect] = useState([]);
  const [editandoTransacao, setEditandoTransacao] = useState<FinancialTransaction | null>(null);
  const [modoEdicaoTransacao, setModoEdicaoTransacao] = useState(false);
  const [novaFaturaErro, setNovaFaturaErro] = useState<string | null>(null);
  const [unidadesSelect, setUnidadesSelect] = useState<Unit[]>([]);
  const [loadingEditData, setLoadingEditData] = useState(false);

  // Estados para medição
  const [measurementBulletins, setMeasurementBulletins] = useState<MeasurementBulletin[]>([]);
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationData, setValidationData] = useState({ validatedBy: '', checkedBy: '' });
  const [showMeasurementBulletinModal, setShowMeasurementBulletinModal] = useState(false);
  const [showSimplifiedMeasurementModal, setShowSimplifiedMeasurementModal] = useState(false);
  const [editingBulletin, setEditingBulletin] = useState<MeasurementBulletin | null>(null);

  // Estados para provisionamento
  const [provisionings, setProvisionings] = useState<Provisioning[]>([]);
  const [selectedProvisioning, setSelectedProvisioning] = useState<Provisioning | null>(null);
  const [showProvisioningModal, setShowProvisioningModal] = useState(false);

  // Carregar dados financeiros
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados de forma mais robusta
      let summary = null;
      let transactionsData = [];
      let invoicesData = [];

      try {
        summary = await financialService.getFinancialReport();
      } catch (err) {
        console.warn('Erro ao carregar resumo financeiro:', err);
      }

      try {
        transactionsData = await financialService.getTransactions();
      } catch (err) {
        console.warn('Erro ao carregar transações:', err);
      }

      try {
        invoicesData = await financialService.getInvoices();
      } catch (err) {
        console.warn('Erro ao carregar faturas:', err);
      }

      setResumoFinanceiro(summary || {});
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      
      console.log('DEBUG: Dados carregados:', {
        summary,
        transactionsCount: transactionsData?.length || 0,
        invoicesCount: invoicesData?.length || 0
      });
    } catch (err) {
      console.error('Erro geral ao carregar dados financeiros:', err);
      setError('Erro ao carregar dados financeiros. Tente novamente.');
      setTransactions([]);
      setInvoices([]);
      setResumoFinanceiro({});
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados localmente com verificações de segurança
  // Filtrar dados localmente com verificações de segurança
  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const filteredInvoices = invoicesArray.filter(invoice => {
    if (!invoice) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    return (
      (invoice.invoiceNumber?.toLowerCase() || '').includes(searchLower) ||
      (invoice.clientName?.toLowerCase() || '').includes(searchLower) ||
      (invoice.description?.toLowerCase() || '').includes(searchLower)
    );
  });

  const transactionsArray = Array.isArray(transactions) ? transactions : [];
  const filteredTransactions = transactionsArray.filter(transaction => {
    if (!transaction) return false;
    const searchLower = (searchTerm || '').toLowerCase();
    return (
      (transaction.description?.toLowerCase() || '').includes(searchLower) ||
      (transaction.category?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Calcular estatísticas com verificações de segurança
  const contasAPagar = transactionsArray
    .filter(t => t && t.type === 'EXPENSE' && t.status === 'PENDING')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Handlers básicos
  const handleTransacaoSuccess = () => {
    toast({
      title: "Sucesso",
      description: modoEdicaoTransacao ? "Transação editada com sucesso!" : "Transação salva com sucesso!",
    });
    setShowTransacaoModal(false);
    setEditandoTransacao(null);
    setModoEdicaoTransacao(false);
    loadFinancialData();
  };

  const handlePagamentoSuccess = () => {
    toast({
      title: "Sucesso",
      description: "Pagamento confirmado com sucesso!",
    });
    setShowPagamentoModal(false);
    loadFinancialData();
  };

  const handleViewFatura = (fatura: Invoice) => {
    setSelectedFatura(fatura);
    setShowFaturaModal(true);
  };

  const handleConfirmarPagamento = (fatura: Invoice) => {
    setSelectedFatura(fatura);
    setShowPagamentoModal(true);
  };

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadFinancialData();
      } catch (error) {
        console.error('Erro na inicialização:', error);
        // Definir dados mock para teste
        setTransactions([
          {
            id: '1',
            description: 'Pagamento de fornecedor',
            amount: 1500,
            type: 'EXPENSE',
            status: 'PENDING',
            category: 'Operacional',
            date: new Date().toISOString()
          },
          {
            id: '2',
            description: 'Recebimento de cliente',
            amount: 3000,
            type: 'INCOME',
            status: 'CONFIRMED',
            category: 'Vendas',
            date: new Date().toISOString()
          }
        ]);
        setInvoices([
          {
            id: '1',
            invoiceNumber: 'FAT-001',
            clientName: 'Cliente Teste',
            description: 'Serviços prestados',
            amount: 2500,
            status: 'PENDENTE',
            dueDate: new Date().toISOString(),
            issueDate: new Date().toISOString()
          }
        ]);
        setResumoFinanceiro({
          totalRevenue: 5000,
          accountsReceivable: 2500,
          totalExpenses: 1500
        });
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  return (
    <StandardLayout>
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-seguranca-graphite border-gray-600 p-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-1">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="contas-pagar" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Contas a Pagar
            </TabsTrigger>
            <TabsTrigger value="contas-receber" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Contas a Receber
            </TabsTrigger>
            <TabsTrigger value="fluxo-caixa" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Fluxo de Caixa
            </TabsTrigger>
            <TabsTrigger value="pagamentos" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="relatorios-financeiros" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Relatórios Financeiros
            </TabsTrigger>
            <TabsTrigger value="centro-custos" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Centro de Custos
            </TabsTrigger>
            <TabsTrigger value="faturas" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Faturas
            </TabsTrigger>
            <TabsTrigger value="medicoes" className="data-[state=active]:bg-seguranca-black data-[state=active]:text-seguranca-yellow text-xs px-2 py-1">
              Medições
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            {/* Cards de Resumo Financeiro */}
            {resumoFinanceiro && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-seguranca-black border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Receita Total</p>
                      <p className="text-2xl font-bold text-green-500">
                        R$ {(resumoFinanceiro.totalRevenue || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </Card>
                <Card className="bg-seguranca-black border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Contas a Receber</p>
                      <p className="text-2xl font-bold text-blue-500">
                        R$ {(resumoFinanceiro.accountsReceivable || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-500" />
                  </div>
                </Card>
                <Card className="bg-seguranca-black border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Contas a Pagar</p>
                      <p className="text-2xl font-bold text-orange-500">
                        R$ {contasAPagar.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-orange-500" />
                  </div>
                </Card>
                <Card className="bg-seguranca-black border-gray-600 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Lucro Líquido</p>
                      <p className="text-2xl font-bold text-purple-500">
                        R$ {((resumoFinanceiro.totalRevenue || 0) - contasAPagar).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Calculator className="h-8 w-8 text-purple-500" />
                  </div>
                </Card>
              </div>
            )}

            {/* Dashboard de Gráficos */}
            {!loading && transactionsArray.length > 0 && invoicesArray.length > 0 ? (
              <FinanceiroDashboard
                transactions={transactionsArray}
                invoices={invoicesArray}
                refreshData={loadFinancialData}
              />
            ) : (
              <Card className="bg-seguranca-graphite border-gray-600 p-6">
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400">
                    {loading ? 'Carregando gráficos financeiros...' : 'Nenhum dado disponível para exibir gráficos'}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contas-pagar">
            <div className="bg-gray-900 p-6 space-y-6 rounded-lg">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <DollarSign className="text-green-500" size={32} />
                    Contas a Pagar
                  </h1>
                  <p className="text-gray-400 mt-1">Gerencie o controle de contas a pagar da empresa</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <BarChart3 size={16} />
                    Mostrar Gráficos
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Nova Conta a Pagar
                  </Button>
                </div>
              </div>

              {/* Alertas de Vencimento */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="text-yellow-600" size={20} />
                  <h3 className="font-semibold text-yellow-800">Alertas de Vencimento</h3>
                </div>
                <div className="bg-white border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">Vivo</span>
                    <span className="text-gray-500 ml-2">Teste de Cadastro</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-800">R$ 2.450,00</div>
                    <div className="text-sm text-yellow-600">Vence em 26/09/2025</div>
                  </div>
                </div>
              </div>

              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total a Pagar */}
                <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Total a Pagar</p>
                      <p className="text-2xl font-bold text-blue-900">R$ 15.513,00</p>
                      <p className="text-xs text-blue-600 mt-1">6 contas</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                {/* Vencidas */}
                <div className="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Vencidas</p>
                      <p className="text-2xl font-bold text-yellow-900">R$ 5.010,00</p>
                      <p className="text-xs text-yellow-600 mt-1">2 contas</p>
                    </div>
                    <div className="bg-yellow-200 p-2 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-700" />
                    </div>
                  </div>
                </div>

                {/* A Vencer (30 dias) */}
                <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">A Vencer (30 dias)</p>
                      <p className="text-2xl font-bold text-green-900">1</p>
                      <p className="text-xs text-green-600 mt-1">Próximas</p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <Calendar className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                {/* Pagas no Mês */}
                <div className="bg-gray-100 rounded-lg p-4 border-l-4 border-gray-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 font-medium">Pagas no Mês</p>
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-xs text-gray-600 mt-1">Quitadas</p>
                    </div>
                    <div className="bg-gray-200 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-gray-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros e Busca */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Filtros e Busca</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Buscar por descrição ou fornecedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />

                  <select className="bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                    <option value="">Todos os Status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Pago</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>

                  <select className="bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                    <option value="">Todos os Tipos</option>
                    <option value="FIXA">Fixa</option>
                    <option value="VARIAVEL">Variável</option>
                  </select>
                </div>
              </div>

              {/* Período de Vencimento */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-blue-400" size={18} />
                    <h4 className="font-medium text-white">Período de Vencimento</h4>
                  </div>
                  <span className="text-sm text-gray-400">5 conta(s) encontrada(s)</span>
                </div>

                {/* Seletor de Ano */}
                <div className="mb-4">
                  <div className="flex gap-2">
                    <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm">2024</button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm">2025</button>
                    <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm">2026</button>
                  </div>
                </div>

                {/* Mês Selecionado */}
                <div className="mb-4">
                  <p className="text-blue-400 font-medium mb-2">Setembro 2025</p>
                </div>

                {/* Seletor de Mês */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Jan</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Fev</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Mar</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Abr</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Mai</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Jun</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Jul</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Ago</button>
                  <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm">Set</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Out</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Nov</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-2 rounded text-sm">Dez</button>
                </div>
              </div>

              {/* Lista de Contas */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-center py-8">
                  <p className="text-gray-400">Lista de contas será exibida aqui</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contas-receber">
            <Card className="bg-seguranca-graphite border-gray-600 p-3 sm:p-6">
              {/* Cabeçalho */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-seguranca-lightgray">Contas a Receber</h3>
                    <p className="text-gray-400">Gerencie suas contas a receber e controle de inadimplência</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowContaReceberModal(true)}
                      className="bg-seguranca-red hover:bg-seguranca-darkred"
                    >
                      <Plus size={18} className="mr-2" />
                      Nova Fatura
                    </Button>
                  </div>
                </div>

                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-seguranca-black border-gray-600 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total a Receber</p>
                        <p className="text-2xl font-bold text-blue-500">
                          R$ {filteredInvoices
                            .filter(f => f.status === 'PENDENTE' || f.status === 'PENDENTE_ERRO')
                            .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                            .toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  <Card className="bg-seguranca-black border-gray-600 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Valor Recebido</p>
                        <p className="text-2xl font-bold text-green-500">
                          R$ {filteredInvoices
                            .filter(f => f.status === 'PAGA')
                            .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                            .toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </Card>
                  <Card className="bg-seguranca-black border-gray-600 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Valor Vencido</p>
                        <p className="text-2xl font-bold text-red-500">
                          R$ {filteredInvoices
                            .filter(f => f.status === 'PENDENTE_ERRO')
                            .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                            .toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </Card>
                  <Card className="bg-seguranca-black border-gray-600 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total de Faturas</p>
                        <p className="text-2xl font-bold text-seguranca-yellow">
                          {filteredInvoices.length}
                        </p>
                      </div>
                      <FileText className="h-8 w-8 text-seguranca-yellow" />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Filtros */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Buscar por número da fatura, cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
              </div>

              {/* Lista de Faturas */}
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
                  <span className="ml-2 text-seguranca-lightgray">Carregando faturas...</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                  <p className="text-gray-400">Nenhuma fatura encontrada</p>
                  <Button
                    onClick={() => setShowContaReceberModal(true)}
                    className="mt-4 bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Plus size={18} className="mr-2" />
                    Criar primeira fatura
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvoices.map((fatura) => (
                    <Card key={fatura.id} className="bg-seguranca-black border-gray-600 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-seguranca-lightgray">
                              {fatura.invoiceNumber || `Fatura #${fatura.id}`}
                            </h4>
                            <Badge
                              className={`text-xs ${fatura.status === 'PAGA' ? 'bg-green-100 text-green-800' :
                                fatura.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                  fatura.status === 'PENDENTE_ERRO' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}
                            >
                              {fatura.status === 'PAGA' ? 'Paga' :
                                fatura.status === 'PENDENTE' ? 'Pendente' :
                                  fatura.status === 'PENDENTE_ERRO' ? 'Vencida' :
                                    fatura.status || 'Pendente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">
                            Cliente: {fatura.clientName || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-400">
                            Vencimento: {fatura.dueDate ? new Date(fatura.dueDate).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-500 mb-2">
                            R$ {(Number(fatura.amount) || 0).toLocaleString('pt-BR')}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewFatura(fatura)}
                              className="border-blue-500 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye size={16} className="mr-1" />
                              Ver
                            </Button>
                            {fatura.status === 'PENDENTE' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleConfirmarPagamento(fatura)}
                                className="border-green-500 text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Confirmar
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="fluxo-caixa">
            <div className="bg-gray-900 p-6 space-y-6 rounded-lg">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="text-blue-500" size={32} />
                    Fluxo de Caixa
                  </h1>
                  <p className="text-gray-400 mt-1">Controle de entradas e saídas financeiras</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                    onClick={loadFinancialData}
                  >
                    <RefreshCw size={16} />
                    Atualizar
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <FileText size={16} />
                    Exportar Relatório
                  </Button>
                </div>
              </div>

              {/* Cards de Resumo do Fluxo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Entradas do Mês</p>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {filteredTransactions
                          .filter(t => t && t.type === 'INCOME' && t.status === 'CONFIRMED')
                          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-green-600 mt-1">+12% vs mês anterior</p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">Saídas do Mês</p>
                      <p className="text-2xl font-bold text-red-900">
                        R$ {filteredTransactions
                          .filter(t => t && t.type === 'EXPENSE' && t.status === 'CONFIRMED')
                          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-red-600 mt-1">-5% vs mês anterior</p>
                    </div>
                    <div className="bg-red-200 p-2 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Saldo Atual</p>
                      <p className="text-2xl font-bold text-blue-900">
                        R$ {(
                          filteredTransactions
                            .filter(t => t && t.type === 'INCOME' && t.status === 'CONFIRMED')
                            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0) -
                          filteredTransactions
                            .filter(t => t && t.type === 'EXPENSE' && t.status === 'CONFIRMED')
                            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                        ).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">Posição atual</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros de Período */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Período de Análise</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Data Inicial</label>
                    <Input
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                      defaultValue="2025-09-01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Data Final</label>
                    <Input
                      type="date"
                      className="bg-gray-700 border-gray-600 text-white"
                      defaultValue="2025-09-30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Categoria</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todas as categorias</option>
                      <option value="receita">Receitas</option>
                      <option value="despesa">Despesas</option>
                      <option value="investimento">Investimentos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Gráfico de Fluxo de Caixa */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="text-blue-400" size={18} />
                    <h4 className="font-medium text-white">Fluxo de Caixa - Setembro 2025</h4>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Diário</button>
                    <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm">Semanal</button>
                    <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-sm">Mensal</button>
                  </div>
                </div>

                <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Gráfico de fluxo de caixa será exibido aqui</p>
                    <p className="text-sm text-gray-500 mt-2">Integração com biblioteca de gráficos em desenvolvimento</p>
                  </div>
                </div>
              </div>

              {/* Movimentações Recentes */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Movimentações Recentes</h4>
                </div>

                <div className="space-y-3">
                  {filteredTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${transaction.type === 'INCOME' ? 'bg-green-200' : 'bg-red-200'
                          }`}>
                          {transaction.type === 'INCOME' ? (
                            <TrendingUp className="h-4 w-4 text-green-700" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{transaction.description}</p>
                          <p className="text-sm text-gray-400">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                          }`}>
                          {transaction.type === 'INCOME' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400">Nenhuma movimentação encontrada</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pagamentos">
            <div className="bg-gray-900 p-6 space-y-6 rounded-lg">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <DollarSign className="text-green-500" size={32} />
                    Pagamentos
                  </h1>
                  <p className="text-gray-400 mt-1">Gerencie pagamentos e recebimentos</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Filter size={16} />
                    Filtros
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                    onClick={() => setShowTransacaoModal(true)}
                  >
                    <Plus size={16} />
                    Novo Pagamento
                  </Button>
                </div>
              </div>

              {/* Cards de Resumo de Pagamentos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Pagamentos Realizados</p>
                      <p className="text-2xl font-bold text-green-900">
                        R$ {filteredTransactions
                          .filter(t => t && t.status === 'CONFIRMED')
                          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {filteredTransactions.filter(t => t && t.status === 'CONFIRMED').length} transações
                      </p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Pagamentos Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        R$ {filteredTransactions
                          .filter(t => t && t.status === 'PENDING')
                          .reduce((acc, t) => acc + (Number(t.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {filteredTransactions.filter(t => t && t.status === 'PENDING').length} pendentes
                      </p>
                    </div>
                    <div className="bg-yellow-200 p-2 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Recebimentos</p>
                      <p className="text-2xl font-bold text-blue-900">
                        R$ {filteredInvoices
                          .filter(f => f && f.status === 'PAGA')
                          .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        {filteredInvoices.filter(f => f && f.status === 'PAGA').length} faturas pagas
                      </p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">Pagamentos Cancelados</p>
                      <p className="text-2xl font-bold text-red-900">
                        {filteredTransactions.filter(t => t && t.status === 'CANCELLED').length}
                      </p>
                      <p className="text-xs text-red-600 mt-1">Transações canceladas</p>
                    </div>
                    <div className="bg-red-200 p-2 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Filtros de Pagamento</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Buscar</label>
                    <Input
                      placeholder="Descrição, categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os Status</option>
                      <option value="PENDING">Pendente</option>
                      <option value="CONFIRMED">Confirmado</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os Tipos</option>
                      <option value="INCOME">Recebimento</option>
                      <option value="EXPENSE">Pagamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Período</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os períodos</option>
                      <option value="hoje">Hoje</option>
                      <option value="semana">Esta semana</option>
                      <option value="mes">Este mês</option>
                      <option value="ano">Este ano</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Pagamentos */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-blue-400" size={18} />
                    <h4 className="font-medium text-white">Histórico de Pagamentos</h4>
                  </div>
                  <span className="text-sm text-gray-400">
                    {filteredTransactions.length} transação(ões) encontrada(s)
                  </span>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-400">Carregando pagamentos...</span>
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-4">Nenhum pagamento encontrado</p>
                    <Button
                      onClick={() => setShowTransacaoModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus size={16} className="mr-2" />
                      Criar primeiro pagamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div key={transaction.id} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${transaction.type === 'INCOME' ? 'bg-green-200' : 'bg-red-200'
                              }`}>
                              {transaction.type === 'INCOME' ? (
                                <TrendingUp className="h-5 w-5 text-green-700" />
                              ) : (
                                <TrendingDown className="h-5 w-5 text-red-700" />
                              )}
                            </div>
                            <div>
                              <h5 className="font-medium text-white">{transaction.description}</h5>
                              <p className="text-sm text-gray-400">{transaction.category}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.date).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                              }`}>
                              {transaction.type === 'INCOME' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR')}
                            </p>
                            <Badge
                              className={`text-xs ${transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}
                            >
                              {transaction.status === 'CONFIRMED' ? 'Confirmado' :
                                transaction.status === 'PENDING' ? 'Pendente' : 'Cancelado'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="relatorios-financeiros">
            <FinanceiroRelatorios />
          </TabsContent>

          <TabsContent value="centro-custos">
            <div className="bg-gray-900 p-6 space-y-6 rounded-lg">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Calculator className="text-purple-500" size={32} />
                    Centro de Custos
                  </h1>
                  <p className="text-gray-400 mt-1">Gerencie e analise centros de custos por departamento</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <BarChart3 size={16} />
                    Relatório
                  </Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Novo Centro de Custo
                  </Button>
                </div>
              </div>

              {/* Cards de Resumo por Departamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Administrativo</p>
                      <p className="text-2xl font-bold text-blue-900">R$ 45.230,00</p>
                      <p className="text-xs text-blue-600 mt-1">35% do total</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Operacional</p>
                      <p className="text-2xl font-bold text-green-900">R$ 32.150,00</p>
                      <p className="text-xs text-green-600 mt-1">25% do total</p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Comercial</p>
                      <p className="text-2xl font-bold text-yellow-900">R$ 28.900,00</p>
                      <p className="text-xs text-yellow-600 mt-1">22% do total</p>
                    </div>
                    <div className="bg-yellow-200 p-2 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">Tecnologia</p>
                      <p className="text-2xl font-bold text-red-900">R$ 23.720,00</p>
                      <p className="text-xs text-red-600 mt-1">18% do total</p>
                    </div>
                    <div className="bg-red-200 p-2 rounded-lg">
                      <Calculator className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Filtros de Centro de Custo</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Departamento</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os departamentos</option>
                      <option value="administrativo">Administrativo</option>
                      <option value="operacional">Operacional</option>
                      <option value="comercial">Comercial</option>
                      <option value="tecnologia">Tecnologia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Período</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="mes">Este mês</option>
                      <option value="trimestre">Este trimestre</option>
                      <option value="semestre">Este semestre</option>
                      <option value="ano">Este ano</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tipo de Custo</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os tipos</option>
                      <option value="fixo">Custos Fixos</option>
                      <option value="variavel">Custos Variáveis</option>
                      <option value="direto">Custos Diretos</option>
                      <option value="indireto">Custos Indiretos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Análise de Custos por Categoria */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Análise de Custos por Categoria</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lista de Categorias */}
                  <div className="space-y-3">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">Pessoal</h5>
                        <span className="text-blue-400 font-semibold">R$ 85.420,00</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">65% do total de custos</p>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">Infraestrutura</h5>
                        <span className="text-green-400 font-semibold">R$ 23.150,00</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '18%' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">18% do total de custos</p>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">Marketing</h5>
                        <span className="text-yellow-400 font-semibold">R$ 12.800,00</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">10% do total de custos</p>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-white">Outros</h5>
                        <span className="text-red-400 font-semibold">R$ 8.630,00</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '7%' }}></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">7% do total de custos</p>
                    </div>
                  </div>

                  {/* Gráfico de Pizza (Placeholder) */}
                  <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="mx-auto h-16 w-16 text-gray-500 mb-4" />
                      <p className="text-gray-400">Gráfico de distribuição</p>
                      <p className="text-sm text-gray-500 mt-2">será exibido aqui</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhamento de Custos */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-blue-400" size={18} />
                    <h4 className="font-medium text-white">Detalhamento de Custos</h4>
                  </div>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
                  >
                    <FileText size={14} className="mr-2" />
                    Exportar
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-3 px-4 text-gray-300">Centro de Custo</th>
                        <th className="text-left py-3 px-4 text-gray-300">Departamento</th>
                        <th className="text-left py-3 px-4 text-gray-300">Categoria</th>
                        <th className="text-right py-3 px-4 text-gray-300">Valor</th>
                        <th className="text-center py-3 px-4 text-gray-300">% Total</th>
                        <th className="text-center py-3 px-4 text-gray-300">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">Salários Administrativo</td>
                        <td className="py-3 px-4 text-gray-300">Administrativo</td>
                        <td className="py-3 px-4 text-gray-300">Pessoal</td>
                        <td className="py-3 px-4 text-right text-white">R$ 35.420,00</td>
                        <td className="py-3 px-4 text-center text-gray-300">27%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">Equipamentos Operacionais</td>
                        <td className="py-3 px-4 text-gray-300">Operacional</td>
                        <td className="py-3 px-4 text-gray-300">Infraestrutura</td>
                        <td className="py-3 px-4 text-right text-white">R$ 18.150,00</td>
                        <td className="py-3 px-4 text-center text-gray-300">14%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">Campanhas Publicitárias</td>
                        <td className="py-3 px-4 text-gray-300">Comercial</td>
                        <td className="py-3 px-4 text-gray-300">Marketing</td>
                        <td className="py-3 px-4 text-right text-white">R$ 12.800,00</td>
                        <td className="py-3 px-4 text-center text-gray-300">10%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">Revisão</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">Licenças de Software</td>
                        <td className="py-3 px-4 text-gray-300">Tecnologia</td>
                        <td className="py-3 px-4 text-gray-300">Infraestrutura</td>
                        <td className="py-3 px-4 text-right text-white">R$ 8.720,00</td>
                        <td className="py-3 px-4 text-center text-gray-300">7%</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faturas">
            <div className="bg-gray-900 p-6 space-y-6 rounded-lg">
              {/* Cabeçalho */}
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileText className="text-blue-500" size={32} />
                    Faturas
                  </h1>
                  <p className="text-gray-400 mt-1">Gerencie faturas e notas fiscais</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Filter size={16} />
                    Filtros Avançados
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    onClick={() => setShowContaReceberModal(true)}
                  >
                    <Plus size={16} />
                    Nova Fatura
                  </Button>
                </div>
              </div>

              {/* Cards de Resumo de Faturas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Total de Faturas</p>
                      <p className="text-2xl font-bold text-blue-900">{filteredInvoices.length}</p>
                      <p className="text-xs text-blue-600 mt-1">Todas as faturas</p>
                    </div>
                    <div className="bg-blue-200 p-2 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 font-medium">Faturas Pagas</p>
                      <p className="text-2xl font-bold text-green-900">
                        {filteredInvoices.filter(f => f && f.status === 'PAGA').length}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        R$ {filteredInvoices
                          .filter(f => f && f.status === 'PAGA')
                          .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-green-200 p-2 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-yellow-700 font-medium">Faturas Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-900">
                        {filteredInvoices.filter(f => f && f.status === 'PENDENTE').length}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        R$ {filteredInvoices
                          .filter(f => f && f.status === 'PENDENTE')
                          .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-yellow-200 p-2 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-700" />
                    </div>
                  </div>
                </div>

                <div className="bg-red-100 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-700 font-medium">Faturas Vencidas</p>
                      <p className="text-2xl font-bold text-red-900">
                        {filteredInvoices.filter(f => f && f.status === 'PENDENTE_ERRO').length}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        R$ {filteredInvoices
                          .filter(f => f && f.status === 'PENDENTE_ERRO')
                          .reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
                          .toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="bg-red-200 p-2 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-700" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="text-blue-400" size={18} />
                  <h4 className="font-medium text-white">Buscar e Filtrar Faturas</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Buscar</label>
                    <Input
                      placeholder="Número, cliente, contrato..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Status</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os Status</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="PAGA">Paga</option>
                      <option value="PENDENTE_ERRO">Vencida</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cliente</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os clientes</option>
                      {/* Aqui seriam listados os clientes dinamicamente */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Período</label>
                    <select className="w-full bg-gray-700 border-gray-600 text-white rounded px-3 py-2 border">
                      <option value="">Todos os períodos</option>
                      <option value="mes">Este mês</option>
                      <option value="trimestre">Este trimestre</option>
                      <option value="ano">Este ano</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Faturas */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="text-blue-400" size={18} />
                    <h4 className="font-medium text-white">Lista de Faturas</h4>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
                    >
                      <FileText size={14} className="mr-2" />
                      Exportar
                    </Button>
                    <span className="text-sm text-gray-400 flex items-center">
                      {filteredInvoices.length} fatura(s) encontrada(s)
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 size={32} className="animate-spin text-blue-400" />
                    <span className="ml-2 text-gray-400">Carregando faturas...</span>
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                    <p className="text-gray-400 mb-4">Nenhuma fatura encontrada</p>
                    <Button
                      onClick={() => setShowContaReceberModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus size={16} className="mr-2" />
                      Criar primeira fatura
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 px-4 text-gray-300">Número</th>
                          <th className="text-left py-3 px-4 text-gray-300">Cliente</th>
                          <th className="text-left py-3 px-4 text-gray-300">Descrição</th>
                          <th className="text-right py-3 px-4 text-gray-300">Valor</th>
                          <th className="text-center py-3 px-4 text-gray-300">Vencimento</th>
                          <th className="text-center py-3 px-4 text-gray-300">Status</th>
                          <th className="text-center py-3 px-4 text-gray-300">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((fatura) => (
                          <tr key={fatura.id} className="border-b border-gray-700 hover:bg-gray-700">
                            <td className="py-3 px-4 text-white font-medium">
                              {fatura.invoiceNumber || `#${fatura.id}`}
                            </td>
                            <td className="py-3 px-4 text-gray-300">{fatura.clientName}</td>
                            <td className="py-3 px-4 text-gray-300">{fatura.description}</td>
                            <td className="py-3 px-4 text-right text-white font-semibold">
                              R$ {Number(fatura.amount).toLocaleString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {new Date(fatura.dueDate).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={`text-xs ${fatura.status === 'PAGA' ? 'bg-green-100 text-green-800' :
                                    fatura.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-800' :
                                      fatura.status === 'PENDENTE_ERRO' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                  }`}
                              >
                                {fatura.status === 'PAGA' ? 'Paga' :
                                  fatura.status === 'PENDENTE' ? 'Pendente' :
                                    fatura.status === 'PENDENTE_ERRO' ? 'Vencida' : 'Cancelada'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-600 text-gray-300 hover:bg-gray-600"
                                  onClick={() => handleViewFatura(fatura)}
                                >
                                  <Eye size={14} />
                                </Button>
                                {fatura.status === 'PENDENTE' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleConfirmarPagamento(fatura)}
                                  >
                                    <CheckCircle size={14} />
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="medicoes">
            <Card className="bg-seguranca-graphite border-gray-600 p-3 sm:p-6">
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-seguranca-lightgray">Medições</h3>
                    <p className="text-gray-400">Controle de medições e boletins de obra</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowMeasurementBulletinModal(true)}
                      className="bg-seguranca-red hover:bg-seguranca-darkred"
                    >
                      <Plus size={18} className="mr-2" />
                      Novo Boletim
                    </Button>
                    <Button
                      onClick={() => setShowSimplifiedMeasurementModal(true)}
                      variant="outline"
                      className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                    >
                      <Plus size={18} className="mr-2" />
                      Medição Simplificada
                    </Button>
                  </div>
                </div>
              </div>

              {/* Tabelas de Medição */}
              <Tabs defaultValue="complete" className="space-y-4">
                <TabsList className="bg-seguranca-black border-gray-600">
                  <TabsTrigger value="complete" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black">
                    Medições Completas
                  </TabsTrigger>
                  <TabsTrigger value="simple" className="data-[state=active]:bg-seguranca-yellow data-[state=active]:text-black">
                    Medições Simplificadas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="complete">
                  <MeasurementCompleteTable
                    bulletins={measurementBulletins}
                    onView={(bulletin) => {
                      setSelectedBulletin(bulletin);
                      setShowMeasurementModal(true);
                    }}
                    onEdit={(bulletin) => {
                      setEditingBulletin(bulletin);
                      setShowMeasurementBulletinModal(true);
                    }}
                    onDelete={(bulletin) => {
                      if (window.confirm('Tem certeza que deseja excluir este boletim?')) {
                        // Implementar exclusão
                      }
                    }}
                    onValidate={(bulletin) => {
                      setSelectedBulletin(bulletin);
                      setShowValidationModal(true);
                    }}
                  />
                </TabsContent>

                <TabsContent value="simple">
                  <MeasurementSimpleTable
                    bulletins={measurementBulletins.filter(b => b.type === 'SIMPLIFIED')}
                    onView={(bulletin) => {
                      setSelectedBulletin(bulletin);
                      setShowMeasurementModal(true);
                    }}
                    onEdit={(bulletin) => {
                      setEditingBulletin(bulletin);
                      setShowMeasurementBulletinModal(true);
                    }}
                    onDelete={(bulletin) => {
                      if (window.confirm('Tem certeza que deseja excluir este boletim?')) {
                        // Implementar exclusão
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <TransacaoFormModal
          open={showTransacaoModal}
          onOpenChange={setShowTransacaoModal}
          onSuccess={() => {
            setShowTransacaoModal(false);
            toast({
              title: "Sucesso",
              description: "Transação salva com sucesso!",
            });
          }}
        />

        <ContaReceberModal
          open={showContaReceberModal}
          onOpenChange={setShowContaReceberModal}
          onSuccess={() => {
            setShowContaReceberModal(false);
            toast({
              title: "Sucesso",
              description: "Conta a receber criada com sucesso!",
            });
          }}
        />

        {selectedFatura && (
          <FaturaViewModal
            open={showFaturaModal}
            onOpenChange={setShowFaturaModal}
            fatura={selectedFatura}
          />
        )}

        {selectedFatura && (
          <ConfirmarPagamentoModal
            open={showPagamentoModal}
            onOpenChange={setShowPagamentoModal}
            fatura={selectedFatura}
            onSuccess={() => {
              setShowPagamentoModal(false);
              toast({
                title: "Sucesso",
                description: "Pagamento confirmado com sucesso!",
              });
            }}
          />
        )}

        {/* Modais de Medição */}
        <MeasurementBulletinModal
          open={showMeasurementBulletinModal}
          onOpenChange={setShowMeasurementBulletinModal}
          bulletin={editingBulletin}
          onSuccess={() => {
            setShowMeasurementBulletinModal(false);
            setEditingBulletin(null);
            toast({
              title: "Sucesso",
              description: "Boletim de medição salvo com sucesso!",
            });
          }}
        />

        <SimplifiedMeasurementModal
          open={showSimplifiedMeasurementModal}
          onOpenChange={setShowSimplifiedMeasurementModal}
          onSuccess={() => {
            setShowSimplifiedMeasurementModal(false);
            toast({
              title: "Sucesso",
              description: "Medição simplificada salva com sucesso!",
            });
          }}
        />

        {/* Modal de Validação */}
        {showValidationModal && selectedBulletin && (
          <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Validar Boletim de Medição</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Validado por:</label>
                  <Input
                    value={validationData.validatedBy}
                    onChange={(e) => setValidationData(prev => ({ ...prev, validatedBy: e.target.value }))}
                    placeholder="Nome do responsável pela validação"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Verificado por:</label>
                  <Input
                    value={validationData.checkedBy}
                    onChange={(e) => setValidationData(prev => ({ ...prev, checkedBy: e.target.value }))}
                    placeholder="Nome do responsável pela verificação"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowValidationModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => {
                    // Implementar validação
                    setShowValidationModal(false);
                    toast({
                      title: "Sucesso",
                      description: "Boletim validado com sucesso!",
                    });
                  }}>
                    Validar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </StandardLayout>
  );
};

export default Financeiro;