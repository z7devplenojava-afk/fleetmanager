import React, { useState, useEffect } from 'react';
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

const ContasAPagarTab: React.FC = () => {
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
      const data = await contasAPagarService.getContasAPagar();
      setContas(data);
      
      // Calcular alertas de vencimento
      const hoje = new Date();
      const proximos7Dias = addDays(hoje, 7);
      const alertas = data.filter(conta => 
        conta.status === 'ABERTA' && 
        isBefore(conta.vencimento, proximos7Dias) &&
        !isBefore(conta.vencimento, hoje)
      );
      setAlertasVencimento(alertas);
      
      // Calcular estatísticas
      const totalContas = data.length;
      const contasAbertas = data.filter(c => c.status === 'ABERTA').length;
      const contasVencidas = data.filter(c => c.status === 'VENCIDA').length;
      const contasPagas = data.filter(c => c.status === 'PAGA').length;
      const valorTotal = data.reduce((sum, c) => sum + c.valor, 0);
      const valorVencidas = data.filter(c => c.status === 'VENCIDA').reduce((sum, c) => sum + c.valor, 0);
      const vencendoEm7Dias = data.filter(c => {
        const diasAteVencimento = Math.ceil((c.vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        return c.status === 'ABERTA' && diasAteVencimento <= 7 && diasAteVencimento >= 0;
      }).length;

      setStats({
        totalContas,
        contasAbertas,
        contasVencidas,
        contasPagas,
        valorTotal,
        valorVencidas,
        vencendoEm7Dias
      });
    } catch (error) {
      console.error('Erro ao carregar contas a pagar:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a pagar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contas
  const filterContas = () => {
    let filtered = contas;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(conta =>
        conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'TODOS') {
      filtered = filtered.filter(conta => conta.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(conta => conta.tipo === tipoFilter);
    }

    // Filtro por ano e mês
    filtered = filtered.filter(conta => {
      const dataVencimento = new Date(conta.vencimento);
      return dataVencimento.getFullYear() === anoSelecionado &&
             dataVencimento.getMonth() + 1 === mesSelecionado;
    });

    setContasFiltradas(filtered);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterContas();
  }, [contas, searchTerm, statusFilter, tipoFilter, anoSelecionado, mesSelecionado]);

  // Handlers
  const handleCreateConta = () => {
    setEditingConta(null);
    setShowFormModal(true);
  };

  const handleEditConta = (conta: ContaAPagar) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleViewConta = (conta: ContaAPagar) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleSaveConta = async (conta: ContaAPagar) => {
    try {
      if (editingConta) {
        await contasAPagarService.updateContaAPagar(editingConta.id!, conta);
        toast({
          title: "Sucesso",
          description: "Conta atualizada com sucesso",
        });
      } else {
        await contasAPagarService.createContaAPagar(conta);
        toast({
          title: "Sucesso",
          description: "Conta criada com sucesso",
        });
      }
      await loadData();
      setShowFormModal(false);
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar conta",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConta = async (id: string) => {
    try {
      await contasAPagarService.deleteContaAPagar(id);
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso",
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conta",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <DollarSign className="text-seguranca-yellow" />
            Contas a Pagar
          </h1>
          <p className="text-gray-300 mt-1">
            Gerencie o controle de contas a pagar da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex items-center gap-2 border-gray-600 text-white hover:bg-seguranca-black"
          >
            <BarChart3 size={16} />
            {showDashboard ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </Button>
          <Button
            onClick={handleCreateConta}
            className="flex items-center gap-2 bg-seguranca-red hover:bg-seguranca-darkred"
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
          <CardContent className="p4">
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
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <FileText className="text-seguranca-yellow" />
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
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white placeholder-gray-400"
              />
            </div>

            {/* Filtro por Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white"
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
                className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-seguranca-yellow focus:border-transparent bg-seguranca-black text-white"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="FIXA">Fixa</option>
                <option value="VARIAVEL">Variável</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Período de Vencimento */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-white">
            <Calendar className="text-seguranca-yellow" />
            Período de Vencimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Ano */}
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">Ano:</span>
            <div className="flex gap-2">
              {[2024, 2025, 2026].map(ano => (
                <Button
                  key={ano}
                  variant={ano === anoSelecionado ? "default" : "outline"}
                  onClick={() => setAnoSelecionado(ano)}
                  className={ano === anoSelecionado ? "bg-seguranca-yellow text-black" : "border-gray-600 text-white hover:bg-seguranca-black"}
                >
                  {ano}
                </Button>
              ))}
            </div>
          </div>

          {/* Seleção de Mês */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                Mês: {meses[mesSelecionado - 1]} {anoSelecionado}
              </span>
              <span className="text-gray-400 text-sm">
                {contasFiltradas.length} conta(s) encontrada(s)
              </span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {meses.map((mes, index) => (
                <Button
                  key={mes}
                  variant={index + 1 === mesSelecionado ? "default" : "outline"}
                  onClick={() => setMesSelecionado(index + 1)}
                  className={index + 1 === mesSelecionado ? "bg-seguranca-yellow text-black" : "border-gray-600 text-white hover:bg-seguranca-black"}
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
        loading={loading}
        onEdit={handleEditConta}
        onView={handleViewConta}
        onDelete={handleDeleteConta}
      />

      {/* Modais */}
      <ContasAPagarFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={loadData}
        editMode={!!editingConta}
        initialData={editingConta}
      />

      <ContasAPagarViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        conta={viewingConta}
      />
    </div>
  );
};

export default ContasAPagarTab;
