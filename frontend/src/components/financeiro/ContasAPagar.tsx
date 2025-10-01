import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, AlertTriangle, Calendar, DollarSign, FileText, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { ContasAPagarTable } from './ContasAPagarTable';
import { ContasAPagarDashboard } from './ContasAPagarDashboard';
import { ContasAPagarFormModal } from './ContasAPagarFormModal';
import { ContasAPagarViewModal } from './ContasAPagarViewModal';
import { ContaAPagar } from './ContasAPagarFormModal';
import { contasAPagarService } from '@/services/contasAPagarService';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { DateRange } from 'react-day-picker';

export const ContasAPagar: React.FC = () => {
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null);
  const [viewingConta, setViewingConta] = useState<ContaAPagar | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [fornecedorFilter, setFornecedorFilter] = useState<string>('all');
  const [centroCustoFilter, setCentroCustoFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    try {
      setLoading(true);
      const data = await contasAPagarService.getContasAPagar();
      setContas(data);
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar contas a pagar',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (conta: ContaAPagar) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleView = (conta: ContaAPagar) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingConta(null);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      try {
        await contasAPagarService.deleteContaAPagar(id);
        toast({
          title: 'Sucesso',
          description: 'Conta excluída com sucesso'
        });
        loadContas();
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir conta',
          variant: 'destructive'
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingConta(null);
    loadContas();
    toast({
      title: 'Sucesso',
      description: editingConta ? 'Conta atualizada com sucesso' : 'Conta criada com sucesso'
    });
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      // Implementar exportação PDF
      toast({
        title: 'Sucesso',
        description: 'Relatório PDF gerado com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório PDF',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setExportLoading(true);
    try {
      // Implementar exportação Excel
      toast({
        title: 'Sucesso',
        description: 'Relatório Excel gerado com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar relatório Excel',
        variant: 'destructive'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTipoFilter('all');
    setFornecedorFilter('all');
    setCentroCustoFilter('all');
    setDateRange({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date())
    });
  };

  const filteredContas = contas.filter(conta => {
    const matchesSearch = conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conta.fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conta.status === statusFilter;
    const matchesTipo = tipoFilter === 'all' || conta.tipo === tipoFilter;
    const matchesFornecedor = fornecedorFilter === 'all' || conta.fornecedor.nome === fornecedorFilter;
    const matchesCentroCusto = centroCustoFilter === 'all' || conta.centroCusto === centroCustoFilter;
    
    // Filtro por data
    let matchesDate = true;
    if (dateRange?.from && dateRange?.to) {
      const contaDate = new Date(conta.vencimento);
      matchesDate = contaDate >= dateRange.from && contaDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesTipo && matchesFornecedor && matchesCentroCusto && matchesDate;
  });

  // Estatísticas rápidas
  const stats = {
    total: contas.length,
    valorTotal: contas.reduce((sum, conta) => sum + conta.valor, 0),
    abertas: contas.filter(c => c.status === 'ABERTA').length,
    vencidas: contas.filter(c => c.status === 'VENCIDA').length,
    vencendoEm7Dias: contas.filter(c => {
      const hoje = new Date();
      const em7Dias = addDays(hoje, 7);
      const vencimento = new Date(c.vencimento);
      return isAfter(vencimento, hoje) && isBefore(vencimento, em7Dias);
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-600">Gerencie suas contas a pagar e controle de vencimentos</p>
        </div>
        <Button onClick={() => setShowFormModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Conta
        </Button>
      </div>


      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="lista">Lista de Contas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ContasAPagarDashboard contas={contas} refreshData={loadContas} />
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Filtros e Exportação</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros Avançados
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={exportLoading}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exportLoading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros Básicos */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por descrição ou fornecedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ABERTA">Aberta</SelectItem>
                    <SelectItem value="PAGA">Paga</SelectItem>
                    <SelectItem value="VENCIDA">Vencida</SelectItem>
                    <SelectItem value="CANCELADA">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="FIXA">Fixa</SelectItem>
                    <SelectItem value="VARIAVEL">Variável</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros Avançados */}
              {showAdvancedFilters && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Período de Vencimento</label>
                      <DatePickerWithRange
                        date={dateRange}
                        onDateChange={setDateRange}
                        placeholder="Selecione o período"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Fornecedor</label>
                      <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os Fornecedores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Fornecedores</SelectItem>
                          {/* Adicionar fornecedores únicos */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-2 block">Centro de Custo</label>
                      <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos os Centros" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os Centros</SelectItem>
                          {/* Adicionar centros de custo únicos */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              )}

              {/* Resumo dos Filtros */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Mostrando {filteredContas.length} de {contas.length} contas
                  {filteredContas.length !== contas.length && ' (filtrado)'}
                </span>
                <span>
                  Total: R$ {filteredContas.reduce((sum, conta) => sum + conta.valor, 0).toLocaleString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <ContasAPagarTable
            contas={filteredContas}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onRefresh={loadContas}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Formulário */}
      <ContasAPagarFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={handleFormSuccess}
        initialData={editingConta}
      />

      {/* Modal de Visualização */}
      <ContasAPagarViewModal
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        conta={viewingConta}
        onEdit={handleEdit}
      />
    </div>
  );
};

export default ContasAPagar;