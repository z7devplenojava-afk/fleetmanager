import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Fuel, DollarSign, Calendar, Download } from 'lucide-react';
import { FuelRecord } from '@/types/fleet';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AbastecimentoReportsProps {
  abastecimentos: FuelRecord[];
  onExportPDF: () => void;
  onExportExcel: () => void;
}

const AbastecimentoReports: React.FC<AbastecimentoReportsProps> = ({
  abastecimentos,
  onExportPDF,
  onExportExcel
}) => {
  // Dados para gráficos
  const chartData = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthRecords = abastecimentos.filter(record => {
        const recordDate = parseISO(record.date);
        return recordDate >= monthStart && recordDate <= monthEnd;
      });

      const totalCost = monthRecords.reduce((sum, record) => sum + record.cost, 0);
      const totalLiters = monthRecords.reduce((sum, record) => sum + record.quantity, 0);
      const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        custo: totalCost,
        litros: totalLiters,
        precoMedio: avgPricePerLiter,
        abastecimentos: monthRecords.length
      };
    });
  }, [abastecimentos]);

  // Dados por posto
  const postoData = useMemo(() => {
    const postoStats = abastecimentos.reduce((acc, record) => {
      const posto = record.station || 'Não informado';
      if (!acc[posto]) {
        acc[posto] = { custo: 0, litros: 0, count: 0 };
      }
      acc[posto].custo += record.cost;
      acc[posto].litros += record.quantity;
      acc[posto].count += 1;
      return acc;
    }, {} as Record<string, { custo: number; litros: number; count: number }>);

    return Object.entries(postoStats)
      .map(([posto, stats]) => ({
        posto,
        custo: stats.custo,
        litros: stats.litros,
        abastecimentos: stats.count,
        precoMedio: stats.litros > 0 ? stats.custo / stats.litros : 0
      }))
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 5); // Top 5 postos
  }, [abastecimentos]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalCost = abastecimentos.reduce((sum, record) => sum + record.cost, 0);
    const totalLiters = abastecimentos.reduce((sum, record) => sum + record.quantity, 0);
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;
    
    const lastMonth = subMonths(new Date(), 1);
    const lastMonthRecords = abastecimentos.filter(record => {
      const recordDate = parseISO(record.date);
      return recordDate >= startOfMonth(lastMonth) && recordDate <= endOfMonth(lastMonth);
    });
    
    const lastMonthCost = lastMonthRecords.reduce((sum, record) => sum + record.cost, 0);
    const currentMonthCost = abastecimentos
      .filter(record => {
        const recordDate = parseISO(record.date);
        const now = new Date();
        return recordDate >= startOfMonth(now) && recordDate <= endOfMonth(now);
      })
      .reduce((sum, record) => sum + record.cost, 0);
    
    const costTrend = lastMonthCost > 0 ? ((currentMonthCost - lastMonthCost) / lastMonthCost) * 100 : 0;

    return {
      totalCost,
      totalLiters,
      avgPricePerLiter,
      totalRecords: abastecimentos.length,
      costTrend
    };
  }, [abastecimentos]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold">R$ {stats.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              {stats.costTrend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-red-600 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
              )}
              <span className={`text-sm ${stats.costTrend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.abs(stats.costTrend).toFixed(1)}% vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Litros</p>
                <p className="text-2xl font-bold">{stats.totalLiters.toFixed(1)}L</p>
              </div>
              <Fuel className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Preço Médio/L</p>
                <p className="text-2xl font-bold">R$ {stats.avgPricePerLiter.toFixed(3)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abastecimentos</p>
                <p className="text-2xl font-bold">{stats.totalRecords}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botões de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Exportar Relatórios
            <div className="flex gap-2">
              <Button onClick={onExportPDF} variant="outline">
                <Download size={16} className="mr-2" />
                PDF
              </Button>
              <Button onClick={onExportExcel} variant="outline">
                <Download size={16} className="mr-2" />
                Excel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Custos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Custos (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line type="monotone" dataKey="custo" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Litros por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Consumo de Combustível (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}L`, 'Litros']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="litros" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Postos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Postos por Custo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={postoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ posto, percent }) => `${posto} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="custo"
                >
                  {postoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Preço Médio por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Preço Médio por Litro (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(3)}`, 'Preço/L']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line type="monotone" dataKey="precoMedio" stroke="#ff7300" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AbastecimentoReports;
