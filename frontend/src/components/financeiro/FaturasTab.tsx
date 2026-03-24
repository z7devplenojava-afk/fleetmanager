import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import CurrencyInput from 'react-currency-input-field';
import {
  FileText,
  DollarSign,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Target,
  RefreshCw,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  CreditCard,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';

interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  type: 'FIXA' | 'VARIAVEL';
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  dueDate: string;
  issueDate: string;
  paymentDate?: string;
  category?: string;
  centroCusto?: string;
  supplier?: {
    id: string;
    name: string;
  };
  client?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

interface FormData {
  invoiceNumber: string;
  description: string;
  amount: string;
  type: 'FIXA' | 'VARIAVEL';
  status: 'PENDENTE' | 'PAGA' | 'VENCIDA' | 'CANCELADA';
  dueDate: string;
  issueDate: string;
  category?: string;
  centroCusto?: string;
  notes?: string;
}

interface InvoiceSummary {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  totalPending: number;
  totalPaid: number;
  totalOverdue: number;
}

const FaturasTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary>({
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    totalPending: 0,
    totalPaid: 0,
    totalOverdue: 0
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [typeFilter, setTypeFilter] = useState<string>('TODOS');
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  
  // Formulário
  const [formData, setFormData] = useState<Partial<FormData>>({
    invoiceNumber: '',
    description: '',
    amount: '0,00',
    type: 'VARIAVEL',
    status: 'PENDENTE',
    dueDate: '',
    issueDate: '',
    category: '',
    centroCusto: '',
    notes: ''
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'PAGA': return 'bg-green-100 text-green-800';
      case 'VENCIDA': return 'bg-red-100 text-red-800';
      case 'CANCELADA': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE': return <Clock className="h-4 w-4" />;
      case 'PAGA': return <CheckCircle className="h-4 w-4" />;
      case 'VENCIDA': return <AlertTriangle className="h-4 w-4" />;
      case 'CANCELADA': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar faturas da API
      const response = await api.get('/invoices/all');
      setInvoices(response.data);

      // Carregar resumo financeiro
      const summaryResponse = await api.get('/invoices/reports/summary');
      setSummary(summaryResponse.data);

    } catch (error) {
      console.error('Erro ao carregar faturas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar faturas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarFatura = async () => {
    try {
      // Converter o valor de string para number antes de enviar
      const dataToSend = {
        ...formData,
        amount: parseFloat(formData.amount?.replace(',', '.') || '0')
      };

      if (editingInvoice) {
        // Atualizar fatura existente
        await api.put(`/invoices/${editingInvoice.id}`, dataToSend);
        toast({
          title: "Sucesso",
          description: "Fatura atualizada com sucesso",
        });
      } else {
        // Criar nova fatura
        await api.post('/invoices', dataToSend);
        toast({
          title: "Sucesso",
          description: "Fatura criada com sucesso",
        });
      }
      
      setShowFormModal(false);
      setEditingInvoice(null);
      setFormData({
        invoiceNumber: '',
        description: '',
        amount: '0,00',
        type: 'VARIAVEL',
        status: 'PENDENTE',
        dueDate: '',
        issueDate: '',
        category: '',
        centroCusto: '',
        notes: ''
      });
      
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar fatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar fatura",
        variant: "destructive",
      });
    }
  };

  const handleExcluirFatura = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fatura?')) return;
    
    try {
      await api.delete(`/invoices/${id}`);
      toast({
        title: "Sucesso",
        description: "Fatura excluída com sucesso",
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir fatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir fatura",
        variant: "destructive",
      });
    }
  };

  const handleMarcarComoPaga = async (id: string) => {
    try {
      await api.patch(`/invoices/${id}/mark-as-paid`);
      toast({
        title: "Sucesso",
        description: "Fatura marcada como paga",
      });
      carregarDados();
    } catch (error) {
      console.error('Erro ao marcar fatura como paga:', error);
      toast({
        title: "Erro",
        description: "Erro ao marcar fatura como paga",
        variant: "destructive",
      });
    }
  };

  const handleEditarFatura = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      description: invoice.description,
      amount: invoice.amount ? invoice.amount.toFixed(2).replace('.', ',') : '0,00',
      type: invoice.type,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
      category: invoice.category || '',
      centroCusto: invoice.centroCusto || '',
      notes: invoice.notes || ''
    });
    setShowFormModal(true);
  };

  const handleVisualizarFatura = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
  };

  const handleNovoFatura = () => {
    setEditingInvoice(null);
    setFormData({
      invoiceNumber: '',
      description: '',
      amount: '0,00',
      type: 'VARIAVEL',
      status: 'PENDENTE',
      dueDate: '',
      issueDate: '',
      category: '',
      centroCusto: '',
      notes: ''
    });
    setShowFormModal(true);
  };

  // Filtrar faturas
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'TODOS' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'TODOS' || invoice.type === typeFilter;
    const matchesCategory = categoryFilter === 'TODOS' || invoice.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory;
  });

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
            <FileText className="h-6 w-6 text-seguranca-yellow" />
            Faturas
          </h2>
          <p className="text-gray-400 mt-1">
            Gerencie faturas e acompanhe pagamentos
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={carregarDados}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={handleNovoFatura}
            className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-600/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-sm">Total de Faturas</p>
                <p className="text-2xl font-bold text-white">{summary.totalInvoices}</p>
                <p className="text-blue-200 text-xs">{summary.pendingInvoices} pendentes</p>
              </div>
              <FileText className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-600/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-200 text-sm">Total Pago</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPaid)}</p>
                <p className="text-green-200 text-xs">{summary.paidInvoices} faturas pagas</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-600/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">Total Pendente</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPending)}</p>
                <p className="text-yellow-200 text-xs">Aguardando pagamento</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-600/20 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">Total Vencido</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalOverdue)}</p>
                <p className="text-red-200 text-xs">{summary.overdueInvoices} faturas vencidas</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Número, descrição, fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGA">Paga</SelectItem>
                  <SelectItem value="VENCIDA">Vencida</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas</SelectItem>
                  <SelectItem value="SERVICOS">Serviços</SelectItem>
                  <SelectItem value="MATERIAIS">Materiais</SelectItem>
                  <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Faturas */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">
            Faturas ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">Número</TableHead>
                  <TableHead className="text-gray-300">Descrição</TableHead>
                  <TableHead className="text-gray-300">Fornecedor</TableHead>
                  <TableHead className="text-gray-300">Valor</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Vencimento</TableHead>
                  <TableHead className="text-gray-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-gray-600 hover:bg-gray-700/50">
                    <TableCell className="text-white font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {invoice.description}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {invoice.supplier?.name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleVisualizarFatura(invoice)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Visualizar fatura"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditarFatura(invoice)}
                          className="text-yellow-400 hover:text-yellow-300"
                          title="Editar fatura"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'PENDENTE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarcarComoPaga(invoice.id)}
                            className="text-green-400 hover:text-green-300"
                            title="Marcar como paga"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleExcluirFatura(invoice.id)}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir fatura"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              {editingInvoice ? 'Editar Fatura' : 'Nova Fatura'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingInvoice ? 'Atualize os dados da fatura' : 'Preencha os dados da nova fatura'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Número da Fatura *</label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                  placeholder="Ex: FAT-2024-001"
                  className="bg-seguranca-black border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Valor *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">R$</span>
                  <CurrencyInput
                    prefix=""
                    decimalSeparator="," 
                    groupSeparator="."
                    decimalsLimit={2}
                    fixedDecimalLength={2}
                    value={formData.amount}
                    onValueChange={(value) => setFormData({...formData, amount: value || '0,00'})}
                    placeholder="0,00"
                    className="w-full pl-10 pr-3 py-2 bg-seguranca-black border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Descrição *</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição da fatura"
                className="bg-seguranca-black border-gray-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Tipo *</label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'FIXA' | 'VARIAVEL'})}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXA">Fixa</SelectItem>
                    <SelectItem value="VARIAVEL">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Status *</label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGA">Paga</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Categoria</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICOS">Serviços</SelectItem>
                    <SelectItem value="MATERIAIS">Materiais</SelectItem>
                    <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Data de Emissão *</label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Data de Vencimento *</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="bg-seguranca-black border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Observações</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais"
                className="bg-seguranca-black border-gray-600 text-white"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowFormModal(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarFatura}
              className="bg-seguranca-yellow hover:bg-yellow-600 text-black"
            >
              {editingInvoice ? 'Atualizar' : 'Criar'} Fatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">
              Detalhes da Fatura
            </DialogTitle>
          </DialogHeader>
          
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Número</label>
                  <p className="text-white">{viewingInvoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Valor</label>
                  <p className="text-white font-bold">{formatCurrency(viewingInvoice.amount)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300">Descrição</label>
                <p className="text-white">{viewingInvoice.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Tipo</label>
                  <p className="text-white">{viewingInvoice.type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Status</label>
                  <Badge className={`${getStatusColor(viewingInvoice.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(viewingInvoice.status)}
                    {viewingInvoice.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Categoria</label>
                  <p className="text-white">{viewingInvoice.category || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Data de Emissão</label>
                  <p className="text-white">{format(new Date(viewingInvoice.issueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Data de Vencimento</label>
                  <p className="text-white">{format(new Date(viewingInvoice.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              </div>
              
              {viewingInvoice.paymentDate && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Data de Pagamento</label>
                  <p className="text-white">{format(new Date(viewingInvoice.paymentDate), 'dd/MM/yyyy', { locale: ptBR })}</p>
                </div>
              )}
              
              {viewingInvoice.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-300">Observações</label>
                  <p className="text-white">{viewingInvoice.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowViewModal(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaturasTab;
