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
  BarChart3,
  Users,
  CheckCircle
} from 'lucide-react';
import { ContasAReceberFormModal, ContaAReceber } from '@/components/financeiro/ContasAReceberFormModal';
import { ContasAReceberTable } from '@/components/financeiro/ContasAReceberTable';
import { ContasAReceberDashboard } from '@/components/financeiro/ContasAReceberDashboard';
import { ContasAReceberViewModal } from '@/components/financeiro/ContasAReceberViewModal';
import { contasAReceberService } from '@/services/contasAReceberService';
import { format, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContasAReceberTab: React.FC = () => {
  const { toast } = useToast();

  // Estados
  const [contas, setContas] = useState<ContaAReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingConta, setEditingConta] = useState<ContaAReceber | null>(null);
  const [viewingConta, setViewingConta] = useState<ContaAReceber | null>(null);
  const [alertasVencimento, setAlertasVencimento] = useState<ContaAReceber[]>([]);
  const [showDashboard, setShowDashboard] = useState(false);

  // Estados para filtros
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number>(new Date().getMonth() + 1);
  const [contasFiltradas, setContasFiltradas] = useState<ContaAReceber[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');

  // Estatísticas do dashboard
  const [stats, setStats] = useState({
    totalContas: 0,
    contasAbertas: 0,
    contasVencidas: 0,
    contasRecebidas: 0,
    valorTotal: 0,
    valorVencidas: 0,
    vencendoEm7Dias: 0
  });

  // Carregar dados
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await contasAReceberService.getContasAReceber();
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
      const contasRecebidas = data.filter(c => c.status === 'RECEBIDA').length;
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
        contasRecebidas,
        valorTotal,
        valorVencidas,
        vencendoEm7Dias
      });
    } catch (error) {
      console.error('Erro ao carregar contas a receber:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
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
        conta.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conta.numeroFatura?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleEditConta = (conta: ContaAReceber) => {
    setEditingConta(conta);
    setShowFormModal(true);
  };

  const handleViewConta = (conta: ContaAReceber) => {
    setViewingConta(conta);
    setShowViewModal(true);
  };

  const handleDeleteConta = async (id: string) => {
    try {
      await contasAReceberService.deleteContaAReceber(id);
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
            <DollarSign className="text-green-500" />
            Contas a Receber
          </h1>
          <p className="text-gray-300 mt-1">
            Gerencie o controle de contas a receber da empresa
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
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus size={16} />
            Nova Conta a Receber
          </Button>
        </div>
      </div>

      {/* Dashboard de Gráficos */}
      {showDashboard && (
        <ContasAReceberDashboard
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
                    <span className="font-medium">{conta.cliente}</span>
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
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total a Receber</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(stats.valorTotal)}</p>
              </div>
              <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-green-600">{stats.totalContas} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Vencidas</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(stats.valorVencidas)}</p>
              </div>
              <div className="h-10 w-10 bg-red-200 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-red-600">{stats.contasVencidas} contas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">A Vencer (7 dias)</p>
                <p className="text-xl font-bold text-blue-800">{stats.vencendoEm7Dias}</p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                Próximas
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Recebidas no Mês</p>
                <p className="text-xl font-bold text-purple-800">{stats.contasRecebidas}</p>
              </div>
              <div className="h-10 w-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-purple-700" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                Recebidas
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
                placeholder="Buscar por descrição, cliente ou número da fatura..."
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
                <option value="RECEBIDA">Recebida</option>
                <option value="VENCIDA">Vencida</option>
                <option value="CANCELADA">Cancelada</option>
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
                <option value="FATURA">Fatura</option>
                <option value="MEDICAO">Medição</option>
                <option value="SERVICO">Serviço</option>
                <option value="PRODUTO">Produto</option>
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
      <ContasAReceberTable
        contas={contasFiltradas}
        loading={loading}
        onEdit={handleEditConta}
        onView={handleViewConta}
        onDelete={handleDeleteConta}
        onRefresh={loadData}
      />

      {/* Modais */}
      <ContasAReceberFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        onSuccess={loadData}
        editMode={!!editingConta}
        initialData={editingConta}
      />

      <ContasAReceberViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        conta={viewingConta}
      />
    </div>
  );
};

export default ContasAReceberTab;
