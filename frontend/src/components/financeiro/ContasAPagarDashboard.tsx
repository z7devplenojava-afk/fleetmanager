import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { contasAPagarService } from '@/services/contasAPagarService';
import { ContaAPagar } from './ContasAPagarFormModal';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

interface DashboardProps {
  contas: ContaAPagar[];
  refreshData: () => void;
}

export const ContasAPagarDashboard: React.FC<DashboardProps> = ({ contas, refreshData }) => {
  const [loading, setLoading] = useState(false);
  const [dadosGraficos, setDadosGraficos] = useState({
    porTipo: [] as any[],
    porStatus: [] as any[],
    evolucaoMensal: [] as any[],
    porFornecedor: [] as any[],
    porCentroCusto: [] as any[]
  });

  // Cores para os gráficos
  const CORES = {
    FIXA: '#ef4444',      // vermelho
    VARIAVEL: '#3b82f6',  // azul
    ABERTA: '#f59e0b',    // amarelo
    PAGA: '#10b981',      // verde
    VENCIDA: '#dc2626',   // vermelho escuro
    ATRASADA: '#f97316',  // laranja
    CANCELADA: '#6b7280'  // cinza
  };

  useEffect(() => {
    console.log('📊 ContasAPagarDashboard - contas recebidas:', contas?.length || 0);
    processarDadosGraficos();
  }, [contas]);

  const processarDadosGraficos = () => {
    console.log('🔄 Processando dados para gráficos...');
    setLoading(true);
    
    // 1. Dados por Tipo
    const porTipo = [
      {
        name: 'Despesas Fixas',
        valor: contas.filter(c => c.tipo === 'FIXA').reduce((sum, c) => sum + c.valor, 0),
        quantidade: contas.filter(c => c.tipo === 'FIXA').length,
        fill: CORES.FIXA
      },
      {
        name: 'Despesas Variáveis',
        valor: contas.filter(c => c.tipo === 'VARIAVEL').reduce((sum, c) => sum + c.valor, 0),
        quantidade: contas.filter(c => c.tipo === 'VARIAVEL').length,
        fill: CORES.VARIAVEL
      }
    ];

    // 2. Dados por Status
    const statusMap = ['ABERTA', 'PAGA', 'VENCIDA', 'ATRASADA', 'CANCELADA'];
    const porStatus = statusMap.map(status => ({
      name: status === 'ABERTA' ? 'Abertas' : 
            status === 'PAGA' ? 'Pagas' :
            status === 'VENCIDA' ? 'Vencidas' :
            status === 'ATRASADA' ? 'Atrasadas' : 'Canceladas',
      valor: contas.filter(c => c.status === status).reduce((sum, c) => sum + c.valor, 0),
      quantidade: contas.filter(c => c.status === status).length,
      fill: CORES[status as keyof typeof CORES]
    })).filter(item => item.quantidade > 0);

    // 3. Evolução Mensal (últimos 6 meses)
    const evolucaoMensal = [];
    for (let i = 5; i >= 0; i--) {
      const mes = subMonths(new Date(), i);
      const inicioMes = startOfMonth(mes);
      const fimMes = endOfMonth(mes);
      
      const contasMes = contas.filter(c => {
        const vencimento = new Date(c.vencimento);
        return vencimento >= inicioMes && vencimento <= fimMes;
      });

      evolucaoMensal.push({
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        fixas: contasMes.filter(c => c.tipo === 'FIXA').reduce((sum, c) => sum + c.valor, 0),
        variaveis: contasMes.filter(c => c.tipo === 'VARIAVEL').reduce((sum, c) => sum + c.valor, 0),
        total: contasMes.reduce((sum, c) => sum + c.valor, 0)
      });
    }

    // 4. Top 5 Fornecedores por Valor
    const fornecedorMap = new Map();
    contas.forEach(conta => {
      const fornecedor = conta.fornecedor || 'Não informado';
      if (!fornecedorMap.has(fornecedor)) {
        fornecedorMap.set(fornecedor, { valor: 0, quantidade: 0 });
      }
      const current = fornecedorMap.get(fornecedor);
      fornecedorMap.set(fornecedor, {
        valor: current.valor + conta.valor,
        quantidade: current.quantidade + 1
      });
    });

    const porFornecedor = Array.from(fornecedorMap.entries())
      .map(([nome, dados]) => ({ name: nome, valor: dados.valor, quantidade: dados.quantidade }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    // 5. Por Centro de Custo
    const centroCustoMap = new Map();
    contas.forEach(conta => {
      const centro = conta.centroCusto || 'Não definido';
      if (!centroCustoMap.has(centro)) {
        centroCustoMap.set(centro, { valor: 0, quantidade: 0 });
      }
      const current = centroCustoMap.get(centro);
      centroCustoMap.set(centro, {
        valor: current.valor + conta.valor,
        quantidade: current.quantidade + 1
      });
    });

    const porCentroCusto = Array.from(centroCustoMap.entries())
      .map(([nome, dados]) => ({ name: nome, valor: dados.valor, quantidade: dados.quantidade }))
      .sort((a, b) => b.valor - a.valor);

    setDadosGraficos({
      porTipo,
      porStatus,
      evolucaoMensal,
      porFornecedor,
      porCentroCusto
    });
    
    console.log('✅ Dados processados:', {
      porTipo: porTipo.length,
      porStatus: porStatus.length,
      evolucaoMensal: evolucaoMensal.length,
      porFornecedor: porFornecedor.length,
      porCentroCusto: porCentroCusto.length
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
    return (
      <div className="flex justify-center items-center p-12 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-3"></div>
          <p className="text-zinc-400 text-sm font-medium">Carregando indicadores e gráficos...</p>
        </div>
      </div>
    );
  }

  const hasData = contas && contas.length > 0;

  if (!hasData) {
    return (
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl p-8 text-center">
        <DollarSign className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
        <p className="text-white font-bold text-base">Nenhum dado financeiro para exibir no momento</p>
        <p className="text-zinc-400 text-xs mt-1">Cadastre novas contas ou importe faturas para visualizar os gráficos.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      {/* Gráfico: Despesas por Tipo */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="py-4 px-5 bg-zinc-950/60 border-b border-zinc-800">
          <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
            <DollarSign size={18} className="text-emerald-400" />
            Despesas Fixas vs. Variáveis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={dadosGraficos.porTipo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
                dataKey="valor"
              >
                {dadosGraficos.porTipo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="#18181b" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Total']}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Legend 
                wrapperStyle={{ color: '#d4d4d8', fontSize: '12px', fontWeight: 600 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Status das Contas */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="py-4 px-5 bg-zinc-950/60 border-b border-zinc-800">
          <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosGraficos.porStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Bar dataKey="valor" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Evolução Mensal */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden lg:col-span-2">
        <CardHeader className="py-4 px-5 bg-zinc-950/60 border-b border-zinc-800">
          <CardTitle className="text-white text-sm font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-sky-400" />
            Evolução Mensal das Despesas (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dadosGraficos.evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="mes" stroke="#a1a1aa" fontSize={12} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), '']}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Legend wrapperStyle={{ color: '#d4d4d8', fontSize: '12px', fontWeight: 600 }} />
              <Line 
                type="monotone" 
                dataKey="fixas" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Fixas"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="variaveis" 
                stroke="#38bdf8" 
                strokeWidth={3}
                name="Variáveis"
                dot={{ fill: '#38bdf8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Top Fornecedores */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="py-4 px-5 bg-zinc-950/60 border-b border-zinc-800">
          <CardTitle className="text-white text-sm font-bold">
            Top 5 Fornecedores por Volume Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosGraficos.porFornecedor} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis type="number" stroke="#a1a1aa" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" stroke="#d4d4d8" width={110} fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Bar dataKey="valor" fill="#10b981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Centro de Custo */}
      <Card className="bg-zinc-900 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <CardHeader className="py-4 px-5 bg-zinc-950/60 border-b border-zinc-800">
          <CardTitle className="text-white text-sm font-bold">
            Despesas por Centro de Custo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosGraficos.porCentroCusto}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '12px',
                  color: '#f4f4f5',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                }}
              />
              <Bar dataKey="valor" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};