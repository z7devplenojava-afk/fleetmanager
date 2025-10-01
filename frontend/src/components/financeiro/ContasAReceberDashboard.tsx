import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { ContaAReceber } from './ContasAReceberFormModal';
import { format, subMonths, startOfMonth, endOfMonth, addDays, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, BarChart, Bar } from 'recharts';

interface ContasAReceberDashboardProps {
  contas: ContaAReceber[];
  refreshData: () => void;
}

export const ContasAReceberDashboard: React.FC<ContasAReceberDashboardProps> = ({
  contas,
  refreshData
}) => {
  const [periodo, setPeriodo] = useState<'3M' | '6M' | '1A'>('3M');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const hoje = new Date();
    const proximos7Dias = addDays(hoje, 7);
    const proximos30Dias = addDays(hoje, 30);

    const totalContas = contas.length;
    const contasAbertas = contas.filter(c => c.status === 'ABERTA').length;
    const contasRecebidas = contas.filter(c => c.status === 'RECEBIDA').length;
    const contasVencidas = contas.filter(c => c.status === 'VENCIDA').length;
    const contasCanceladas = contas.filter(c => c.status === 'CANCELADA').length;

    const valorTotal = contas.reduce((sum, c) => sum + c.valor, 0);
    const valorAbertas = contas.filter(c => c.status === 'ABERTA').reduce((sum, c) => sum + c.valor, 0);
    const valorRecebidas = contas.filter(c => c.status === 'RECEBIDA').reduce((sum, c) => sum + c.valor, 0);
    const valorVencidas = contas.filter(c => c.status === 'VENCIDA').reduce((sum, c) => sum + c.valor, 0);

    const contasVencendoEm7Dias = contas.filter(c => 
      c.status === 'ABERTA' && 
      isAfter(c.vencimento, hoje) && 
      isBefore(c.vencimento, proximos7Dias)
    ).length;

    const valorVencendoEm7Dias = contas.filter(c => 
      c.status === 'ABERTA' && 
      isAfter(c.vencimento, hoje) && 
      isBefore(c.vencimento, proximos7Dias)
    ).reduce((sum, c) => sum + c.valor, 0);

    const contasVencendoEm30Dias = contas.filter(c => 
      c.status === 'ABERTA' && 
      isAfter(c.vencimento, hoje) && 
      isBefore(c.vencimento, proximos30Dias)
    ).length;

    const valorVencendoEm30Dias = contas.filter(c => 
      c.status === 'ABERTA' && 
      isAfter(c.vencimento, hoje) && 
      isBefore(c.vencimento, proximos30Dias)
    ).reduce((sum, c) => sum + c.valor, 0);

    return {
      totalContas,
      contasAbertas,
      contasRecebidas,
      contasVencidas,
      contasCanceladas,
      valorTotal,
      valorAbertas,
      valorRecebidas,
      valorVencidas,
      contasVencendoEm7Dias,
      valorVencendoEm7Dias,
      contasVencendoEm30Dias,
      valorVencendoEm30Dias
    };
  };

  const stats = calcularEstatisticas();

  // Dados para gráfico de linha (evolução mensal)
  const gerarDadosEvolucao = () => {
    const meses = [];
    const hoje = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const data = subMonths(hoje, i);
      const inicioMes = startOfMonth(data);
      const fimMes = endOfMonth(data);
      
      const contasMes = contas.filter(c => {
        const dataVencimento = new Date(c.vencimento);
        return dataVencimento >= inicioMes && dataVencimento <= fimMes;
      });
      
      const valorMes = contasMes.reduce((sum, c) => sum + c.valor, 0);
      const recebidasMes = contasMes.filter(c => c.status === 'RECEBIDA').reduce((sum, c) => sum + c.valor, 0);
      
      meses.push({
        mes: format(data, 'MMM/yy', { locale: ptBR }),
        total: valorMes,
        recebidas: recebidasMes,
        abertas: valorMes - recebidasMes
      });
    }
    
    return meses;
  };

  // Dados para gráfico de pizza (por status)
  const dadosStatus = [
    { name: 'Abertas', value: stats.valorAbertas, count: stats.contasAbertas, color: '#f59e0b' },
    { name: 'Recebidas', value: stats.valorRecebidas, count: stats.contasRecebidas, color: '#10b981' },
    { name: 'Vencidas', value: stats.valorVencidas, count: stats.contasVencidas, color: '#ef4444' },
    { name: 'Canceladas', value: contas.filter(c => c.status === 'CANCELADA').reduce((sum, c) => sum + c.valor, 0), count: stats.contasCanceladas, color: '#6b7280' }
  ];

  // Dados para gráfico de barras (por tipo)
  const dadosTipo = [
    { tipo: 'Fatura', valor: contas.filter(c => c.tipo === 'FATURA').reduce((sum, c) => sum + c.valor, 0), count: contas.filter(c => c.tipo === 'FATURA').length },
    { tipo: 'Medição', valor: contas.filter(c => c.tipo === 'MEDICAO').reduce((sum, c) => sum + c.valor, 0), count: contas.filter(c => c.tipo === 'MEDICAO').length },
    { tipo: 'Serviço', valor: contas.filter(c => c.tipo === 'SERVICO').reduce((sum, c) => sum + c.valor, 0), count: contas.filter(c => c.tipo === 'SERVICO').length },
    { tipo: 'Produto', valor: contas.filter(c => c.tipo === 'PRODUTO').reduce((sum, c) => sum + c.valor, 0), count: contas.filter(c => c.tipo === 'PRODUTO').length }
  ];

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Dashboard */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-green-500" />
            Dashboard - Contas a Receber
          </h2>
          <p className="text-gray-300 mt-1">
            Análise completa do fluxo de receitas da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {(['3M', '6M', '1A'] as const).map((p) => (
              <Button
                key={p}
                variant={periodo === p ? "default" : "outline"}
                onClick={() => setPeriodo(p)}
                className={periodo === p ? "bg-seguranca-yellow text-black" : "border-gray-600 text-white hover:bg-seguranca-black"}
                size="sm"
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Activity size={16} className="mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
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

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Em Aberto</p>
                <p className="text-xl font-bold text-yellow-800">{formatCurrency(stats.valorAbertas)}</p>
              </div>
              <div className="h-10 w-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-yellow-600">{stats.contasAbertas} contas</p>
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
                <p className="text-sm font-medium text-blue-700">Vencendo (7 dias)</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(stats.valorVencendoEm7Dias)}</p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-blue-600">{stats.contasVencendoEm7Dias} contas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Mensal */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="text-green-500" />
              Evolução Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gerarDadosEvolucao()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Total"
                />
                <Line 
                  type="monotone" 
                  dataKey="recebidas" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Recebidas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="text-green-500" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={dadosStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {dadosStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }} 
                  formatter={(value: number) => [formatCurrency(value), 'Valor']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Barras - Por Tipo */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="text-green-500" />
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosTipo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tipo" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }} 
                formatter={(value: number) => [formatCurrency(value), 'Valor']}
              />
              <Bar dataKey="valor" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Alertas e Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.contasVencidas > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                <AlertTriangle size={16} className="text-red-600" />
                <span className="text-red-800 text-sm">
                  {stats.contasVencidas} conta(s) vencida(s) - {formatCurrency(stats.valorVencidas)}
                </span>
              </div>
            )}
            {stats.contasVencendoEm7Dias > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded">
                <Clock size={16} className="text-yellow-600" />
                <span className="text-yellow-800 text-sm">
                  {stats.contasVencendoEm7Dias} conta(s) vencendo em 7 dias - {formatCurrency(stats.valorVencendoEm7Dias)}
                </span>
              </div>
            )}
            {stats.contasVencidas === 0 && stats.contasVencendoEm7Dias === 0 && (
              <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-green-800 text-sm">
                  Todas as contas estão em dia!
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Users className="text-blue-600" />
              Insights de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-blue-700">
                <strong>Taxa de Recebimento:</strong> {stats.totalContas > 0 ? ((stats.contasRecebidas / stats.totalContas) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-blue-700">
                <strong>Valor Médio por Conta:</strong> {stats.totalContas > 0 ? formatCurrency(stats.valorTotal / stats.totalContas) : 'R$ 0,00'}
              </p>
              <p className="text-blue-700">
                <strong>Contas em Aberto:</strong> {stats.contasAbertas} de {stats.totalContas}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
