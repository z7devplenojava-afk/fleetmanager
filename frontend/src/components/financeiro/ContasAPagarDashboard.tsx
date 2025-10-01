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
    processarDadosGraficos();
  }, [contas]);

  const processarDadosGraficos = () => {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico: Despesas por Tipo */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <DollarSign size={20} className="text-seguranca-yellow" />
            Despesas por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dadosGraficos.porTipo}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="valor"
              >
                {dadosGraficos.porTipo.map((entry, index) => (
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

      {/* Gráfico: Status das Contas */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <AlertTriangle size={20} className="text-seguranca-yellow" />
            Status das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosGraficos.porStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#333', 
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#ccc'
                }}
              />
              <Bar dataKey="valor" fill="#ffd700" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Evolução Mensal */}
      <Card className="bg-seguranca-graphite border-gray-600 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <TrendingUp size={20} className="text-seguranca-yellow" />
            Evolução Mensal das Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
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
                dataKey="fixas" 
                stroke={CORES.FIXA} 
                strokeWidth={3}
                name="Fixas"
                dot={{ fill: CORES.FIXA, strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="variaveis" 
                stroke={CORES.VARIAVEL} 
                strokeWidth={3}
                name="Variáveis"
                dot={{ fill: CORES.VARIAVEL, strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Top Fornecedores */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">
            Top 5 Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosGraficos.porFornecedor} layout="horizontal">
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
              <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico: Centro de Custo */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray">
            Despesas por Centro de Custo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosGraficos.porCentroCusto}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip 
                formatter={(value: number) => [formatarMoeda(value), 'Valor']}
                contentStyle={{ 
                  backgroundColor: '#333', 
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: '#ccc'
                }}
              />
              <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};