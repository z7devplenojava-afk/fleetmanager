import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { contasAPagarService } from '@/services/contasAPagarService';
import { contasAReceberService } from '@/services/contasAReceberService';

interface FluxoCaixaData {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
}

interface ResumoFluxo {
  totalEntradas: number;
  totalSaidas: number;
  saldoAtual: number;
  saldoAnterior: number;
  variacaoPercentual: number;
  entradasPendentes: number;
  saidasPendentes: number;
  saldoProjetado: number;
}

const FluxoCaixaTab: React.FC = () => {
  const { toast } = useToast();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7D' | '30D' | '90D' | '1A'>('30D');
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'diario' | 'mensal' | 'anual'>('diario');
  const [dadosFluxo, setDadosFluxo] = useState<FluxoCaixaData[]>([]);
  const [resumo, setResumo] = useState<ResumoFluxo>({
    totalEntradas: 0,
    totalSaidas: 0,
    saldoAtual: 0,
    saldoAnterior: 0,
    variacaoPercentual: 0,
    entradasPendentes: 0,
    saidasPendentes: 0,
    saldoProjetado: 0
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calcularPeriodo = () => {
    const hoje = new Date();
    let dataInicio: Date;

    switch (periodo) {
      case '7D':
        dataInicio = subDays(hoje, 7);
        break;
      case '30D':
        dataInicio = subDays(hoje, 30);
        break;
      case '90D':
        dataInicio = subDays(hoje, 90);
        break;
      case '1A':
        dataInicio = subDays(hoje, 365);
        break;
      default:
        dataInicio = subDays(hoje, 30);
    }

    return { dataInicio, dataFim: hoje };
  };

  const carregarDadosFluxo = async () => {
    try {
      setLoading(true);
      
      const { dataInicio, dataFim } = calcularPeriodo();
      
      // Carregar contas a receber e a pagar
      const [contasReceber, contasPagar] = await Promise.all([
        contasAReceberService.getContasAReceber({
          startDate: format(dataInicio, 'yyyy-MM-dd'),
          endDate: format(dataFim, 'yyyy-MM-dd')
        }),
        contasAPagarService.getContasAPagar({
          startDate: format(dataInicio, 'yyyy-MM-dd'),
          endDate: format(dataFim, 'yyyy-MM-dd')
        })
      ]);

      // Processar dados por período
      const dadosProcessados = processarDadosPorPeriodo(contasReceber, contasPagar, dataInicio, dataFim);
      setDadosFluxo(dadosProcessados);

      // Calcular resumo
      const resumoCalculado = calcularResumo(contasReceber, contasPagar, dadosProcessados);
      setResumo(resumoCalculado);

    } catch (error) {
      console.error('Erro ao carregar dados do fluxo de caixa:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do fluxo de caixa",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processarDadosPorPeriodo = (contasReceber: any[], contasPagar: any[], dataInicio: Date, dataFim: Date) => {
    const dados: FluxoCaixaData[] = [];
    const dataAtual = new Date(dataInicio);
    let saldoAcumulado = 0;

    while (dataAtual <= dataFim) {
      const dataStr = format(dataAtual, 'yyyy-MM-dd');
      
      // Calcular entradas do dia
      const entradas = contasReceber
        .filter(conta => {
          const dataVencimento = new Date(conta.vencimento);
          return format(dataVencimento, 'yyyy-MM-dd') === dataStr && conta.status === 'RECEBIDA';
        })
        .reduce((total, conta) => total + conta.valor, 0);

      // Calcular saídas do dia
      const saidas = contasPagar
        .filter(conta => {
          const dataVencimento = new Date(conta.vencimento);
          return format(dataVencimento, 'yyyy-MM-dd') === dataStr && conta.status === 'PAGA';
        })
        .reduce((total, conta) => total + conta.valor, 0);

      const saldo = entradas - saidas;
      saldoAcumulado += saldo;

      dados.push({
        data: dataStr,
        entradas,
        saidas,
        saldo,
        saldoAcumulado
      });

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return dados;
  };

  const calcularResumo = (contasReceber: any[], contasPagar: any[], dadosFluxo: FluxoCaixaData[]) => {
    const totalEntradas = contasReceber
      .filter(conta => conta.status === 'RECEBIDA')
      .reduce((total, conta) => total + conta.valor, 0);

    const totalSaidas = contasPagar
      .filter(conta => conta.status === 'PAGA')
      .reduce((total, conta) => total + conta.valor, 0);

    const saldoAtual = totalEntradas - totalSaidas;
    const saldoAnterior = dadosFluxo.length > 1 ? dadosFluxo[0].saldoAcumulado : 0;
    const variacaoPercentual = saldoAnterior !== 0 ? ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100 : 0;

    const entradasPendentes = contasReceber
      .filter(conta => conta.status === 'ABERTA')
      .reduce((total, conta) => total + conta.valor, 0);

    const saidasPendentes = contasPagar
      .filter(conta => conta.status === 'ABERTA')
      .reduce((total, conta) => total + conta.valor, 0);

    const saldoProjetado = saldoAtual + entradasPendentes - saidasPendentes;

    return {
      totalEntradas,
      totalSaidas,
      saldoAtual,
      saldoAnterior,
      variacaoPercentual,
      entradasPendentes,
      saidasPendentes,
      saldoProjetado
    };
  };

  useEffect(() => {
    carregarDadosFluxo();
  }, [periodo, tipoVisualizacao]);

  const dadosGrafico = dadosFluxo.map(item => ({
    ...item,
    dataFormatada: format(new Date(item.data), 'dd/MM', { locale: ptBR })
  }));

  const dadosPizza = [
    { name: 'Entradas', value: resumo.totalEntradas, color: '#10b981' },
    { name: 'Saídas', value: resumo.totalSaidas, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <BarChart3 className="text-blue-500" />
            Fluxo de Caixa
          </h1>
          <p className="text-gray-300 mt-1">
            Acompanhe o fluxo de entrada e saída de recursos da empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={carregarDadosFluxo}
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

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter size={18} />
            Filtros e Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Período</label>
              <Select value={periodo} onValueChange={(value: any) => setPeriodo(value)}>
                <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="7D" className="text-white hover:bg-seguranca-graphite">Últimos 7 dias</SelectItem>
                  <SelectItem value="30D" className="text-white hover:bg-seguranca-graphite">Últimos 30 dias</SelectItem>
                  <SelectItem value="90D" className="text-white hover:bg-seguranca-graphite">Últimos 90 dias</SelectItem>
                  <SelectItem value="1A" className="text-white hover:bg-seguranca-graphite">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Visualização</label>
              <Select value={tipoVisualizacao} onValueChange={(value: any) => setTipoVisualizacao(value)}>
                <SelectTrigger className="border-gray-600 bg-seguranca-black text-white focus:border-seguranca-yellow focus:ring-seguranca-yellow">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  <SelectItem value="diario" className="text-white hover:bg-seguranca-graphite">Diário</SelectItem>
                  <SelectItem value="mensal" className="text-white hover:bg-seguranca-graphite">Mensal</SelectItem>
                  <SelectItem value="anual" className="text-white hover:bg-seguranca-graphite">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total Entradas</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(resumo.totalEntradas)}</p>
              </div>
              <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-green-600">Receitas realizadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Saídas</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(resumo.totalSaidas)}</p>
              </div>
              <div className="h-10 w-10 bg-red-200 rounded-lg flex items-center justify-center">
                <ArrowDownRight className="h-5 w-5 text-red-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-red-600">Despesas pagas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Saldo Atual</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(resumo.saldoAtual)}</p>
              </div>
              <div className="h-10 w-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-700" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className={`text-xs ${resumo.variacaoPercentual >= 0 ? 'border-green-300 text-green-700' : 'border-red-300 text-red-700'}`}>
                {resumo.variacaoPercentual >= 0 ? '+' : ''}{resumo.variacaoPercentual.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Saldo Projetado</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(resumo.saldoProjetado)}</p>
              </div>
              <div className="h-10 w-10 bg-purple-200 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-xs text-purple-600">Incluindo pendências</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Evolução do Saldo */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="text-blue-500" />
              Evolução do Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dataFormatada" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }} 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'saldoAcumulado' ? 'Saldo Acumulado' : 
                    name === 'entradas' ? 'Entradas' : 'Saídas'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldoAcumulado" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Saldo Acumulado"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Entradas vs Saídas */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="text-blue-500" />
              Entradas vs Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="dataFormatada" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6'
                  }} 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'entradas' ? 'Entradas' : 'Saídas'
                  ]}
                />
                <Bar dataKey="entradas" fill="#10b981" name="Entradas" />
                <Bar dataKey="saidas" fill="#ef4444" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Pizza - Distribuição */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <PieChart className="text-blue-500" />
            Distribuição de Fluxo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {dadosPizza.map((entry, index) => (
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
          </div>
        </CardContent>
      </Card>

      {/* Alertas e Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Activity className="text-yellow-600" />
              Alertas de Fluxo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumo.saldoAtual < 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded">
                <TrendingDown size={16} className="text-red-600" />
                <span className="text-red-800 text-sm">
                  Saldo negativo: {formatCurrency(resumo.saldoAtual)}
                </span>
              </div>
            )}
            {resumo.entradasPendentes > resumo.saidasPendentes && (
              <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-green-800 text-sm">
                  Expectativa positiva: {formatCurrency(resumo.entradasPendentes - resumo.saidasPendentes)}
                </span>
              </div>
            )}
            {resumo.variacaoPercentual < -10 && (
              <div className="flex items-center gap-2 p-2 bg-orange-100 rounded">
                <Activity size={16} className="text-orange-600" />
                <span className="text-orange-800 text-sm">
                  Queda significativa no saldo: {resumo.variacaoPercentual.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <BarChart3 className="text-blue-600" />
              Insights de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-blue-700">
                <strong>Margem de Fluxo:</strong> {resumo.totalEntradas > 0 ? ((resumo.saldoAtual / resumo.totalEntradas) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-blue-700">
                <strong>Entradas Pendentes:</strong> {formatCurrency(resumo.entradasPendentes)}
              </p>
              <p className="text-blue-700">
                <strong>Saídas Pendentes:</strong> {formatCurrency(resumo.saidasPendentes)}
              </p>
              <p className="text-blue-700">
                <strong>Período:</strong> {periodo === '7D' ? '7 dias' : periodo === '30D' ? '30 dias' : periodo === '90D' ? '90 dias' : '1 ano'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FluxoCaixaTab;
