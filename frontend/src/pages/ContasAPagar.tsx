import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Bell,
  FileText,
  BarChart3
} from 'lucide-react';
import { ContasAPagarFormModal, ContaAPagar } from '@/components/financeiro/ContasAPagarFormModal';
import { ContasAPagarTable } from '@/components/financeiro/ContasAPagarTable';
import { ContasAPagarDashboard } from '@/components/financeiro/ContasAPagarDashboard';
import { ContasAPagarViewModal } from '@/components/financeiro/ContasAPagarViewModal';
import { contasAPagarService } from '@/services/contasAPagarService';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContasAPagar: React.FC = () => {
  const { toast } = useToast();

  // Estados
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null);
  const [viewingConta, setViewingConta] = useState<ContaAPagar | null>(null);
  const [alertasVencimento, setAlertasVencimento] = useState<ContaAPagar[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Estados para filtros
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [contasFiltradas, setContasFiltradas] = useState<ContaAPagar[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');

  // Estatísticas do dashboard
  const [stats, setStats] = useState({
    totalContas: 0,
    contasAbertas: 0,
    contasVencidas: 0,
    contasPagas: 0,
    valorTotal: 0,
    valorVencidas: 0,
    vencendoEm7Dias: 0
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);

      const [contasData, estatisticas] = await Promise.all([
        contasAPagarService.getContasAPagar(),
        contasAPagarService.getEstatisticas()
      ]);

      setContas(contasData);

      // Calcular estatísticas
      const hoje = new Date();
      const contasVencidas = contasData.filter(c =>
        c.status === 'VENCIDA' || (c.status === 'ABERTA' && isBefore(new Date(c.vencimento), hoje))
      );
      const contasVencendoEm7Dias = contasData.filter(c =>
        c.status === 'ABERTA' &&
        new Date(c.vencimento) >= hoje &&
        new Date(c.vencimento) <= addDays(hoje, 7)
      );

      setStats({
        totalContas: contasData.length,
        contasAbertas: contasData.filter(c => c.status === 'ABERTA').length,
        contasVencidas: contasVencidas.length,
        contasPagas: contasData.filter(c => c.status === 'PAGA').length,
        valorTotal: contasData.reduce((sum, c) => sum + c.valor, 0),
        valorVencidas: contasVencidas.reduce((sum, c) => sum + c.valor, 0),
        vencendoEm7Dias: contasVencendoEm7Dias.length
      });

      // Alertas de vencimento
      setAlertasVencimento(contasVencendoEm7Dias);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados das contas a pagar.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };



  // Função para filtrar contas com todos os filtros
  const filtrarContas = (contasData: ContaAPagar[]) => {
    const contasFiltradas = contasData.filter(conta => {
      // Filtro por data de vencimento
      const dataVencimento = new Date(conta.vencimento);
      const anoConta = dataVencimento.getFullYear();
      const mesConta = dataVencimento.getMonth() + 1;
      const filtroData = anoConta === anoSelecionado && mesConta === mesSelecionado;

      // Filtro por busca
      const filtroBusca = !searchTerm ||
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por status
      const filtroStatus = statusFilter === 'TODOS' || conta.status === statusFilter;

      // Filtro por tipo
      const filtroTipo = tipoFilter === 'TODOS' || conta.tipo === tipoFilter;

      return filtroData && filtroBusca && filtroStatus && filtroTipo;
    });

    setContasFiltradas(contasFiltradas);
  };



  // Carregar dados ao montar o componente
  useEffect(() => {
    loadData();
  }, []);

  // Aplicar filtros quando os dados ou filtros mudarem
  useEffect(() => {
    if (contas.length > 0) {
      filtrarContas(contas);
    }
  }, [anoSelecionado, mesSelecionado, searchTerm, statusFilter, tipoFilter, contas]);

  // Handlers
  const handleCreateConta = () => {
    setEditingConta(null);
    setShowFormModal(true);
  };

  const handleEditConta = (conta: ContaAPagar) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleDeleteConta = async (id: string) => {
    try {
      await contasAPagarService.deleteContaAPagar(id);
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso!"
      });
      loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir conta.",
        variant: "destructive"
      });
    }
  };

  const handleViewConta = (conta: ContaAPagar) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingConta(null);
  };



  const handleFormSuccess = () => {
    setShowFormModal(false);
    setEditingConta(null);
    loadData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="text-green-600" />
              Contas a Pagar
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie o controle de contas a pagar da empresa
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDashboard(!showDashboard)}
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              {showDashboard ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
            </Button>
            <Button
              onClick={handleCreateConta}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Conta a Pagar
            </Button>
          </div>
        </div>

        {/* Dashboard de Gráficos */}
        {showDashboard && (
          <ContasAPagarDashboard
            contas={contas}
            refreshData={loadData}
          />
        )}

        {/* Alertas de Vencimento */}
        {alertasVencimento.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Bell className="text-yellow-600" />
                Alertas de Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertasVencimento.slice(0, 3).map(conta => (
                  <div key={conta.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <span className="font-medium">{conta.fornecedor}</span>
                      <span className="text-sm text-gray-600 ml-2">{conta.descricao}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-yellow-700">
                        {formatCurrency(conta.valor)}
                      </div>
                      <div className="text-sm text-yellow-600">
                        Vence em {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
                {alertasVencimento.length > 3 && (
                  <p className="text-sm text-yellow-600 text-center">
                    E mais {alertasVencimento.length - 3} conta(s) vencendo em breve...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total a Pagar</p>
                  <p className="text-xl font-bold text-blue-800">{formatCurrency(stats.valorTotal)}</p>
                </div>
                <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-blue-600">{stats.totalContas} contas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Vencidas</p>
                  <p className="text-xl font-bold text-yellow-800">{formatCurrency(stats.valorVencidas)}</p>
                </div>
                <div className="h-10 w-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-700" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-yellow-600">{stats.contasVencidas} contas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">A Vencer (30 dias)</p>
                  <p className="text-xl font-bold text-green-800">{stats.vencendoEm7Dias}</p>
                </div>
                <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-700" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                  Próximas
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Pagas no Mês</p>
                  <p className="text-xl font-bold text-gray-800">{stats.contasPagas}</p>
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-gray-700" />
                </div>
              </div>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs border-gray-300 text-gray-700">
                  Quitadas
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="text-blue-600" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Campo de Busca */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descrição ou fornecedor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="ABERTA">Aberta</option>
                  <option value="PAGA">Paga</option>
                  <option value="VENCIDA">Vencida</option>
                </select>
              </div>

              {/* Filtro por Tipo */}
              <div>
                <select
                  value={tipoFilter}
                  onChange={(e) => setTipoFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="TODOS">Todos os Tipos</option>
                  <option value="FIXA">Fixa</option>
                  <option value="VARIAVEL">Variável</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seletor de Data */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600" />
                Período de Vencimento
              </div>
              <div className="text-sm text-gray-600">
                {contasFiltradas.length} conta(s) encontrada(s)
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Seletor de Ano e Mês */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Ano:</span>
                <div className="flex gap-2">
                  {[2024, 2025, 2026].map(ano => (
                    <Button
                      key={ano}
                      variant={ano === anoSelecionado ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAnoSelecionado(ano)}
                      className={`min-w-[60px] ${ano === anoSelecionado ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    >
                      {ano}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Seletor de Mês */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Mês:</span>
                <span className="text-sm text-blue-600 font-medium">
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][mesSelecionado - 1]} {anoSelecionado}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
                ].map((mes, index) => (
                  <Button
                    key={index + 1}
                    variant={index + 1 === mesSelecionado ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMesSelecionado(index + 1)}
                    className={`text-xs ${index + 1 === mesSelecionado ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                  >
                    {mes}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Contas */}
        <ContasAPagarTable
          contas={contasFiltradas}
          onEdit={handleEditConta}
          onDelete={handleDeleteConta}
          onView={handleViewConta}
          onRefresh={loadData}
          loading={loading}
        />

        {/* Modal de Formulário */}
        <ContasAPagarFormModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          onSuccess={handleFormSuccess}
          editMode={!!editingConta}
          initialData={editingConta}
        />

        {/* Modal de Visualização */}
        <ContasAPagarViewModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          conta={viewingConta}
          onEdit={handleEditConta}
        />
      </div>
    </StandardLayout>
  );
};

export default ContasAPagar;