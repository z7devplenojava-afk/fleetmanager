import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { FuelRecord } from '@/types/fleet';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoricoPrecosProps {
  abastecimentos: FuelRecord[];
}

const HistoricoPrecos: React.FC<HistoricoPrecosProps> = ({ abastecimentos }) => {
  // Dados de preços por posto nos últimos 30 dias
  const priceData = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentRecords = abastecimentos.filter(record => 
      parseISO(record.date) >= thirtyDaysAgo
    );

    // Agrupar por posto e calcular estatísticas
    const postoStats = recentRecords.reduce((acc, record) => {
      const posto = record.station || 'Não informado';
      const pricePerLiter = record.cost / record.quantity;
      
      if (!acc[posto]) {
        acc[posto] = {
          prices: [],
          totalCost: 0,
          totalLiters: 0,
          count: 0
        };
      }
      
      acc[posto].prices.push({
        date: record.date,
        price: pricePerLiter,
        cost: record.cost,
        liters: record.quantity
      });
      acc[posto].totalCost += record.cost;
      acc[posto].totalLiters += record.quantity;
      acc[posto].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // Calcular médias e tendências
    return Object.entries(postoStats).map(([posto, stats]) => {
      const avgPrice = stats.totalLiters > 0 ? stats.totalCost / stats.totalLiters : 0;
      const prices = stats.prices.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const firstPrice = prices[0]?.price || 0;
      const lastPrice = prices[prices.length - 1]?.price || 0;
      const trend = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
      
      const minPrice = Math.min(...prices.map((p: any) => p.price));
      const maxPrice = Math.max(...prices.map((p: any) => p.price));
      
      return {
        posto,
        avgPrice,
        minPrice,
        maxPrice,
        trend,
        count: stats.count,
        lastPrice,
        priceHistory: prices
      };
    }).sort((a, b) => b.count - a.count);
  }, [abastecimentos]);

  // Evolução de preços geral
  const priceEvolution = useMemo(() => {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentRecords = abastecimentos
      .filter(record => parseISO(record.date) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Agrupar por dia
    const dailyPrices = recentRecords.reduce((acc, record) => {
      const date = format(parseISO(record.date), 'yyyy-MM-dd');
      const pricePerLiter = record.cost / record.quantity;
      
      if (!acc[date]) {
        acc[date] = { totalCost: 0, totalLiters: 0, count: 0 };
      }
      
      acc[date].totalCost += record.cost;
      acc[date].totalLiters += record.quantity;
      acc[date].count += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(dailyPrices).map(([date, stats]) => ({
      date: format(parseISO(date), 'dd/MM', { locale: ptBR }),
      fullDate: date,
      avgPrice: stats.totalLiters > 0 ? stats.totalCost / stats.totalLiters : 0,
      abastecimentos: stats.count
    }));
  }, [abastecimentos]);

  return (
    <div className="space-y-6">
      {/* Evolução Geral de Preços */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Preços (Últimos 30 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={priceEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toFixed(3)}`, 'Preço Médio/L']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line type="monotone" dataKey="avgPrice" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Comparação por Posto */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Preços por Posto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {priceData.map((posto, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-lg">{posto.posto}</h4>
                  <div className="flex items-center gap-2">
                    {posto.trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      posto.trend >= 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {posto.trend >= 0 ? '+' : ''}{posto.trend.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Preço Médio</p>
                    <p className="font-semibold">R$ {posto.avgPrice.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Menor Preço</p>
                    <p className="font-semibold text-green-600">R$ {posto.minPrice.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Maior Preço</p>
                    <p className="font-semibold text-red-600">R$ {posto.maxPrice.toFixed(3)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Abastecimentos</p>
                    <p className="font-semibold">{posto.count}</p>
                  </div>
                </div>
                
                {posto.maxPrice - posto.minPrice > 0.2 && (
                  <div className="mt-2 flex items-center gap-2 text-yellow-600">
                    <AlertTriangle size={16} />
                    <span className="text-sm">
                      Variação alta de preços: R$ {(posto.maxPrice - posto.minPrice).toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ranking de Postos */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Postos por Preço Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceData.slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={['dataMin - 0.1', 'dataMax + 0.1']} />
              <YAxis dataKey="posto" type="category" width={100} />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toFixed(3)}`, 'Preço Médio/L']}
              />
              <Bar dataKey="avgPrice" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricoPrecos;
