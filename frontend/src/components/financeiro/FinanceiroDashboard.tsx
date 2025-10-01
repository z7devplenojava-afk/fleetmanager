import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { financialService, FinancialTransaction, Invoice } from '@/services/financialService';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { TrendingUp, TrendingDown, DollarSign, Calendar, AlertTriangle, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';

interface FinanceiroDashboardProps {
  transactions: FinancialTransaction[];
  invoices: Invoice[];
  refreshData: () => void;
}

export const FinanceiroDashboard: React.FC<FinanceiroDashboardProps> = ({ 
  transactions, 
  invoices, 
  refreshData 
}) => {
  const [loading, setLoading] = useState(false);
  const [dadosGraficos, setDadosGraficos] = useState({
    receitasDespesas: [] as any[],
    porStatus: [] as any[],
    evolucaoMensal: [] as any[],
    porCategoria: [] as any[],
    fluxoCaixa: [] as any[],
    topTransacoes: [] as any[]
  });

  // Cores para os gráficos
  const CORES = {
    RECEITA: '#10b981',      // verde
    DESPESA: '#ef4444',      // vermelho
    PENDENTE: '#f59e0b',     // amarelo
    CONFIRMADO: '#10b981',   // verde
    CANCELADO: '#6b7280',    // cinza
    PAGA: '#10b981',         // verde
    VENCIDA: '#dc2626',      // vermelho escuro
    ATRASADA: '#f97316'      // laranja
  };

  useEffect(() => {
    processarDadosGraficos();
  }, [transactions, invoices]);

  const processarDadosGraficos = () => {
    setLoading(true);
    
    // 1. Receitas vs Despesas (últimos 6 meses)
    const receitasDespesas = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const transacoesMes = transactions.filter(t => {
        const data = new Date(t.date);
        return data >= inicioMes && data <= fimMes;
      });

      const receitas = transacoesMes
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const despesas = transacoesMes
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      receitasDespesas.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        receitas,
        despesas,
        lucro: receitas - despesas
      });
    }

    // 2. Status das Transações
    const statusMap = {
      'PENDING': 'Pendente',
      'CONFIRMED': 'Confirmado', 
      'CANCELLED': 'Cancelado'
    };
    
    const porStatus = Object.entries(statusMap).map(([status, label]) => {
      const count = transactions.filter(t => t.status === status).length;
      const valor = transactions
        .filter(t => t.status === status)
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      return {
        name: label,
        quantidade: count,
        valor,
        fill: CORES[status as keyof typeof CORES]
      };
    }).filter(item => item.quantidade > 0);

    // 3. Evolução Mensal (Receitas + Despesas)
    const evolucaoMensal = receitasDespesas.map(item => ({
      mes: item.mes,
      receitas: item.receitas,
      despesas: item.despesas,
      saldo: item.lucro
    }));

    // 4. Por Categoria
    const categoriaMap = new Map();
    transactions.forEach(t => {
      const categoria = t.category || 'Sem categoria';
      if (!categoriaMap.has(categoria)) {
        categoriaMap.set(categoria, { receitas: 0, despesas: 0, quantidade: 0 });
      }
      const current = categoriaMap.get(categoria);
      if (t.type === 'INCOME') {
        current.receitas += Number(t.amount) || 0;
      } else {
        current.despesas += Number(t.amount) || 0;
      }
      current.quantidade += 1;
    });

    const porCategoria = Array.from(categoriaMap.entries())
      .map(([nome, dados]) => ({
        name: nome,
        receitas: dados.receitas,
        despesas: dados.despesas,
        total: dados.receitas + dados.despesas,
        quantidade: dados.quantidade
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    // 5. Fluxo de Caixa (últimos 12 meses)
    const fluxoCaixa = [];
    for (let i = 11; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const transacoesMes = transactions.filter(t => {
        const data = new Date(t.date);
        return data >= inicioMes && data <= fimMes;
      });

      const receitas = transacoesMes
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const despesas = transacoesMes
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      fluxoCaixa.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas
      });
    }

    // 6. Top Transações por Valor
    const topTransacoes = [...transactions]
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
      .slice(0, 10)
      .map(t => ({
        name: t.description || 'Sem descrição',
        valor: Number(t.amount) || 0,
        tipo: t.type,
        data: format(new Date(t.date), 'dd/MM/yyyy'),
        status: t.status
      }));

    setDadosGraficos({
      receitasDespesas,
      porStatus,
      evolucaoMensal,
      porCategoria,
      fluxoCaixa,
      topTransacoes
    });
    
    setLoading(false);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Receitas (Mês)</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-500 truncate">
                  {formatarMoeda(dadosGraficos.receitasDespesas[dadosGraficos.receitasDespesas.length - 1]?.receitas || 0)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Despesas (Mês)</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-500 truncate">
                  {formatarMoeda(dadosGraficos.receitasDespesas[dadosGraficos.receitasDespesas.length - 1]?.despesas || 0)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Lucro (Mês)</p>
                <p className={`text-lg sm:text-xl lg:text-2xl font-bold truncate ${(dadosGraficos.receitasDespesas[dadosGraficos.receitasDespesas.length - 1]?.lucro || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatarMoeda(dadosGraficos.receitasDespesas[dadosGraficos.receitasDespesas.length - 1]?.lucro || 0)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-400 truncate">Total Transações</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-500 truncate">
                  {transactions.length}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Gráfico: Receitas vs Despesas */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
              <DollarSign size={18} className="text-seguranca-yellow flex-shrink-0" />
              <span className="truncate">Receitas vs Despesas (6 meses)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px] sm:min-h-[300px]">
              <BarChart data={dadosGraficos.receitasDespesas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="mes" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), '']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" fill={CORES.RECEITA} radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" fill={CORES.DESPESA} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Status das Transações */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
              <AlertTriangle size={18} className="text-seguranca-yellow flex-shrink-0" />
              <span className="truncate">Status das Transações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px] sm:min-h-[300px]">
              <PieChart>
                <Pie
                  data={dadosGraficos.porStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="valor"
                >
                  {dadosGraficos.porStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Evolução Mensal */}
        <Card className="bg-seguranca-graphite border-gray-600 xl:col-span-2">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
              <Activity size={18} className="text-seguranca-yellow flex-shrink-0" />
              <span className="truncate">Evolução Mensal das Movimentações</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={300} className="min-h-[300px] sm:min-h-[350px]">
              <LineChart data={dadosGraficos.evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="mes" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), '']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="receitas" 
                  stroke={CORES.RECEITA} 
                  strokeWidth={2}
                  name="Receitas"
                  dot={{ fill: CORES.RECEITA, strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke={CORES.DESPESA} 
                  strokeWidth={2}
                  name="Despesas"
                  dot={{ fill: CORES.DESPESA, strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  stroke="#ffd700" 
                  strokeWidth={2}
                  name="Saldo"
                  strokeDasharray="5 5"
                  dot={{ fill: '#ffd700', strokeWidth: 2, r: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Fluxo de Caixa */}
        <Card className="bg-seguranca-graphite border-gray-600 xl:col-span-2">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
              <TrendingUp size={18} className="text-seguranca-yellow flex-shrink-0" />
              <span className="truncate">Fluxo de Caixa (12 meses)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px] sm:min-h-[300px]">
              <AreaChart data={dadosGraficos.fluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis dataKey="mes" stroke="#999" />
                <YAxis stroke="#999" />
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), '']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="receitas" 
                  stackId="1"
                  stroke={CORES.RECEITA} 
                  fill={CORES.RECEITA}
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesas" 
                  stackId="1"
                  stroke={CORES.DESPESA} 
                  fill={CORES.DESPESA}
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Top Categorias */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray text-sm sm:text-base">
              <span className="truncate">Top Categorias por Valor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px] sm:min-h-[300px]">
              <BarChart data={dadosGraficos.porCategoria} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis type="number" stroke="#999" />
                <YAxis dataKey="name" type="category" stroke="#999" width={100} />
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico: Top Transações */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-seguranca-lightgray text-sm sm:text-base">
              <span className="truncate">Top 10 Transações por Valor</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px] sm:min-h-[300px]">
              <BarChart data={dadosGraficos.topTransacoes} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#555" />
                <XAxis type="number" stroke="#999" />
                <YAxis dataKey="name" type="category" stroke="#999" width={120} />
                <Tooltip 
                  formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                  contentStyle={{ 
                    backgroundColor: '#333', 
                    border: '1px solid #555',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                />
                <Bar dataKey="valor" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};