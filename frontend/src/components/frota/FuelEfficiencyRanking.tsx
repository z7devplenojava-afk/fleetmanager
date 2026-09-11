import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Fuel,
  DollarSign,
  Route,
  RefreshCw,
  Loader2,
  Award,
  AlertTriangle,
  CheckCircle,
  Car,
} from 'lucide-react';
import { vehicleFuelEfficiencyService, VehicleFuelEfficiency } from '@/services/vehicleFuelEfficiencyService';
import EfficiencyAlerts from '@/components/frota/EfficiencyAlerts';

interface FuelEfficiencyRankingProps {
  vehicles?: { id: string; plate: string; model: string; brand: string }[];
}

const FuelEfficiencyRanking: React.FC<FuelEfficiencyRankingProps> = ({ vehicles = [] }) => {
  const [efficiencyData, setEfficiencyData] = useState<VehicleFuelEfficiency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEfficiencyData();
  }, []);

  const loadEfficiencyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await vehicleFuelEfficiencyService.getAllVehiclesEfficiency();
      setEfficiencyData(data);
    } catch (err) {
      console.error('Erro ao carregar dados de eficiência:', err);
      setError('Erro ao carregar dados de eficiência');
    } finally {
      setIsLoading(false);
    }
  };

  // Estatísticas gerais
  const stats = useMemo(() => {
    if (efficiencyData.length === 0) {
      return {
        avgEfficiency: 0,
        bestEfficiency: 0,
        worstEfficiency: 0,
        avgCostPerKm: 0,
        totalFuel: 0,
        totalCost: 0,
        totalDistance: 0,
        totalVehicles: 0,
      };
    }

    const efficiencies = efficiencyData.map((e) => e.efficiencyKmPerLiter || 0).filter((e) => e > 0);
    const costsPerKm = efficiencyData.map((e) => e.costPerKm || 0).filter((c) => c > 0);

    return {
      avgEfficiency: efficiencies.length > 0 ? efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length : 0,
      bestEfficiency: efficiencies.length > 0 ? Math.max(...efficiencies) : 0,
      worstEfficiency: efficiencies.length > 0 ? Math.min(...efficiencies) : 0,
      avgCostPerKm: costsPerKm.length > 0 ? costsPerKm.reduce((a, b) => a + b, 0) / costsPerKm.length : 0,
      totalFuel: efficiencyData.reduce((sum, e) => sum + (e.totalFuelConsumed || 0), 0),
      totalCost: efficiencyData.reduce((sum, e) => sum + (e.totalCost || 0), 0),
      totalDistance: efficiencyData.reduce((sum, e) => sum + (e.totalDistance || 0), 0),
      totalVehicles: efficiencyData.length,
    };
  }, [efficiencyData]);

  // Dados para gráfico de barras — Ranking km/L
  const barChartData = useMemo(() => {
    return efficiencyData
      .filter((e) => e.efficiencyKmPerLiter > 0)
      .sort((a, b) => b.efficiencyKmPerLiter - a.efficiencyKmPerLiter)
      .map((e, index) => ({
        placa: e.vehiclePlate || 'N/I',
        nome: e.vehicleName || '',
        kmPorLitro: e.efficiencyKmPerLiter,
        custoPorKm: e.costPerKm,
        litros: e.totalFuelConsumed,
        distancia: e.totalDistance,
        custoTotal: e.totalCost,
        rank: index + 1,
      }));
  }, [efficiencyData]);

  // Dados para gráfico de custo/km
  const costBarData = useMemo(() => {
    return efficiencyData
      .filter((e) => e.costPerKm > 0)
      .sort((a, b) => a.costPerKm - b.costPerKm)
      .map((e, index) => ({
        placa: e.vehiclePlate || 'N/I',
        custoPorKm: e.costPerKm,
        rank: index + 1,
      }));
  }, [efficiencyData]);

  // Média da frota para referência
  const fleetAvg = stats.avgEfficiency;

  // Classificação de performance
  const getPerformanceColor = (efficiency: number): string => {
    if (efficiency >= fleetAvg * 1.15) return '#22c55e'; // 15%+ acima da média
    if (efficiency >= fleetAvg * 1.05) return '#3b82f6'; // 5%+ acima
    if (efficiency >= fleetAvg * 0.95) return '#eab308'; // Próximo da média
    if (efficiency >= fleetAvg * 0.85) return '#f97316'; // 15% abaixo
    return '#ef4444'; // Muito abaixo
  };

  const getPerformanceLabel = (efficiency: number): { label: string; color: string; icon: React.ReactNode } => {
    if (efficiency >= fleetAvg * 1.15) return { label: 'Excelente', color: 'text-green-400', icon: <Trophy className="h-4 w-4" /> };
    if (efficiency >= fleetAvg * 1.05) return { label: 'Ótimo', color: 'text-blue-400', icon: <Medal className="h-4 w-4" /> };
    if (efficiency >= fleetAvg * 0.95) return { label: 'Bom', color: 'text-yellow-400', icon: <CheckCircle className="h-4 w-4" /> };
    if (efficiency >= fleetAvg * 0.85) return { label: 'Regular', color: 'text-orange-400', icon: <AlertTriangle className="h-4 w-4" /> };
    return { label: 'Baixo', color: 'text-red-400', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  const getMedalEmoji = (rank: number): string => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#e5e7eb',
  };

  if (isLoading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mb-4" />
            <p className="text-gray-400">Calculando eficiência da frota...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={loadEfficiencyData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (efficiencyData.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Fuel className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-seguranca-lightgray text-lg font-semibold mb-2">
              Sem dados de eficiência
            </h3>
            <p className="text-gray-400 text-sm max-w-md text-center">
              Registre abastecimentos com quilometragem para calcular a eficiência de combustível dos veículos.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas de Eficiência */}
      <EfficiencyAlerts efficiencyData={efficiencyData} />

      {/* Header com Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
          <Route className="h-5 w-5 text-green-400" />
          Ranking de Eficiência de Combustível
        </h3>
        <Button
          onClick={loadEfficiencyData}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-400 hover:bg-gray-700"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-900/30">
                <TrendingUp className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Melhor km/L</p>
                <p className="text-lg font-bold text-green-400">{stats.bestEfficiency.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-900/30">
                <Fuel className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Média Frota</p>
                <p className="text-lg font-bold text-blue-400">{stats.avgEfficiency.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-900/30">
                <DollarSign className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Custo Médio/km</p>
                <p className="text-lg font-bold text-orange-400">R$ {stats.avgCostPerKm.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-purple-900/30">
                <Car className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Veículos</p>
                <p className="text-lg font-bold text-purple-400">{stats.totalVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Ranking km/L */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-400" />
            Ranking de Eficiência — km por Litro
            <span className="text-xs text-gray-400 font-normal ml-1">
              (Média da frota: {fleetAvg.toFixed(2)} km/L)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(300, barChartData.length * 35)}>
            <BarChart
              data={barChartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9ca3af"
                fontSize={10}
                domain={[0, 'auto']}
              />
              <YAxis
                type="category"
                dataKey="placa"
                stroke="#9ca3af"
                fontSize={11}
                width={90}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`${value.toFixed(2)} km/L`, 'Eficiência']}
                labelFormatter={(label, payload) => {
                  const item = payload?.[0]?.payload;
                  return `${label} — ${item?.nome || ''}`;
                }}
              />
              <ReferenceLine
                x={fleetAvg}
                stroke="#eab308"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Média: ${fleetAvg.toFixed(1)}`,
                  position: 'top',
                  fill: '#eab308',
                  fontSize: 10,
                }}
              />
              <Bar dataKey="kmPorLitro" radius={[0, 4, 4, 0]} maxBarSize={25}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPerformanceColor(entry.kmPorLitro)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Custo/km */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-orange-400" />
            Ranking de Custo por Quilômetro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={Math.max(250, costBarData.length * 30)}>
            <BarChart
              data={costBarData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                type="number"
                stroke="#9ca3af"
                fontSize={10}
                tickFormatter={(v) => `R$ ${v.toFixed(2)}`}
              />
              <YAxis
                type="category"
                dataKey="placa"
                stroke="#9ca3af"
                fontSize={11}
                width={90}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo/km']}
              />
              <Bar dataKey="custoPorKm" radius={[0, 4, 4, 0]} maxBarSize={25}>
                {costBarData.map((entry, index) => {
                  const avg = stats.avgCostPerKm;
                  const color = entry.custoPorKm <= avg * 0.9 ? '#22c55e'
                    : entry.custoPorKm <= avg * 1.1 ? '#eab308'
                    : '#ef4444';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tabela Detalhada do Ranking */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Ranking Completo — Eficiência da Frota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-center py-2 px-2 text-gray-400 font-medium w-12">#</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Veículo</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">km/L</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">L/km</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Custo/km</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Distância</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Combustível</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Custo Total</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {efficiencyData
                  .filter((e) => e.efficiencyKmPerLiter > 0)
                  .sort((a, b) => b.efficiencyKmPerLiter - a.efficiencyKmPerLiter)
                  .map((vehicle, index) => {
                    const performance = getPerformanceLabel(vehicle.efficiencyKmPerLiter);
                    return (
                      <tr
                        key={vehicle.vehicleId || index}
                        className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''} ${
                          index < 3 ? 'bg-yellow-900/10' : ''
                        }`}
                      >
                        <td className="text-center py-2 px-2 font-bold text-lg">
                          {getMedalEmoji(index + 1)}
                        </td>
                        <td className="py-2 px-2">
                          <div>
                            <span className="text-gray-200 font-medium">{vehicle.vehiclePlate}</span>
                            <span className="text-gray-500 ml-2">{vehicle.vehicleName}</span>
                          </div>
                        </td>
                        <td className="text-right py-2 px-2">
                          <span className="font-bold" style={{ color: getPerformanceColor(vehicle.efficiencyKmPerLiter) }}>
                            {vehicle.efficiencyKmPerLiter.toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-2 px-2 text-gray-400">
                          {(vehicle.consumptionLPerKm || 0).toFixed(3)}
                        </td>
                        <td className="text-right py-2 px-2">
                          <span className={`font-medium ${
                            vehicle.costPerKm <= stats.avgCostPerKm ? 'text-green-400' : 'text-red-400'
                          }`}>
                            R$ {(vehicle.costPerKm || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-2 px-2 text-gray-300">
                          {(vehicle.totalDistance || 0).toLocaleString('pt-BR')} km
                        </td>
                        <td className="text-right py-2 px-2 text-gray-300">
                          {(vehicle.totalFuelConsumed || 0).toFixed(1)} L
                        </td>
                        <td className="text-right py-2 px-2 text-gray-300">
                          R$ {(vehicle.totalCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-2">
                          <div className={`flex items-center gap-1 ${performance.color}`}>
                            {performance.icon}
                            <span className="text-xs font-medium">{performance.label}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda de Cores */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-gray-400 font-medium">Legenda:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-gray-300">Excelente (≥15% acima da média)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-300">Ótimo (≥5% acima)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-500" />
              <span className="text-gray-300">Bom (próximo da média)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-orange-500" />
              <span className="text-gray-300">Regular (≤15% abaixo)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-gray-300">Baixo (&gt;15% abaixo)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FuelEfficiencyRanking;
