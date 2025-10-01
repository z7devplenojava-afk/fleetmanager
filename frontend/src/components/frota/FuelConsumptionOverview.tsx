import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Fuel, 
  TrendingUp, 
  DollarSign, 
  Car, 
  BarChart3, 
  RefreshCw,
  Loader2,
  AlertCircle,
  Trophy,
  TrendingDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import BestEfficiencyCard from './BestEfficiencyCard';

interface VehicleFuelStats {
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  vehicleBrand: string;
  totalRecords: number;
  totalFuelConsumed: number;
  totalCost: number;
  averageFuelPerRefill: number;
  averagePricePerLiter: number;
  consumptionPerKm: number;
  costPerKm: number;
  totalDistance: number;
}

interface FuelConsumptionOverviewProps {
  vehicles: any[];
}

export const FuelConsumptionOverview: React.FC<FuelConsumptionOverviewProps> = ({ vehicles }) => {
  const [stats, setStats] = useState<VehicleFuelStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadAllVehiclesStats = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Carregando estatísticas de todos os veículos...');
      const response = await api.get('/fuel-records/stats/all-vehicles');
      console.log('✅ Resposta da API:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setStats(response.data);
        console.log('📊 Estatísticas carregadas:', response.data.length, 'veículos');
        
        // Log detalhado de cada veículo
        response.data.forEach((stat, index) => {
          console.log(`🚗 Veículo ${index + 1}:`, {
            placa: stat.vehiclePlate,
            registros: stat.totalRecords,
            combustivel: stat.totalFuelConsumed,
            custo: stat.totalCost,
            distancia: stat.totalDistance,
            consumoKm: stat.consumptionPerKm
          });
        });
      } else {
        console.warn('⚠️ Resposta da API não é um array:', response.data);
        setStats([]);
      }
    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      setError(err.response?.data?.message || err.message || 'Erro ao carregar estatísticas');
      toast({
        title: "Erro",
        description: "Não foi possível carregar as estatísticas gerais.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllVehiclesStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getConsumptionEfficiency = (consumptionPerKm: number) => {
    // Caso especial: sem dados ou consumo zero
    if (consumptionPerKm <= 0 || isNaN(consumptionPerKm)) {
      return { label: 'Sem Dados', color: 'bg-gray-500' };
    }
    
    // Lógica normal para casos com dados
    if (consumptionPerKm <= 0.08) return { label: 'Excelente', color: 'bg-green-500' };
    if (consumptionPerKm <= 0.12) return { label: 'Bom', color: 'bg-blue-500' };
    if (consumptionPerKm <= 0.16) return { label: 'Regular', color: 'bg-yellow-500' };
    return { label: 'Alto', color: 'bg-red-500' };
  };

  // Calcular estatísticas gerais
  const totalVehicles = stats.length;
  const totalFuelConsumed = stats.reduce((acc, stat) => acc + (stat.totalFuelConsumed || 0), 0);
  const totalCost = stats.reduce((acc, stat) => acc + (stat.totalCost || 0), 0);
  const totalDistance = stats.reduce((acc, stat) => acc + (stat.totalDistance || 0), 0);
  const averageConsumptionPerKm = totalDistance > 0 ? totalFuelConsumed / totalDistance : 0;
  const averageCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

  // Encontrar veículos com melhor e pior eficiência
  const sortedByEfficiency = [...stats].sort((a, b) => (a.consumptionPerKm || 0) - (b.consumptionPerKm || 0));
  const mostEfficient = sortedByEfficiency[0];
  const leastEfficient = sortedByEfficiency[sortedByEfficiency.length - 1];

  if (loading) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="text-seguranca-yellow" size={20} />
            Visão Geral - Consumo de Combustível
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
            <span className="ml-2 text-seguranca-lightgray">Carregando estatísticas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="text-seguranca-yellow" size={20} />
            Visão Geral - Consumo de Combustível
          </CardTitle>
          <Button
            onClick={loadAllVehiclesStats}
            disabled={loading}
            className="bg-seguranca-red hover:bg-seguranca-darkred"
          >
            {loading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Atualizar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-600 rounded-lg mb-6">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}
        
        {stats.length === 0 && !loading && (
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">Nenhuma estatística disponível</p>
          </div>
        )}
        
        {stats.length > 0 && (
          <div className="space-y-6">
            {/* Estatísticas Gerais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Veículos</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">{totalVehicles}</p>
                  <p className="text-xs text-gray-400">Com registros de abastecimento</p>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Consumo Total</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatNumber(totalFuelConsumed)} L
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatNumber(averageConsumptionPerKm, 3)} L/km médio
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Custo Total</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatCurrency(totalCost)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(averageCostPerKm)}/km médio
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Distância Total</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatNumber(totalDistance)} km
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatNumber(totalDistance / totalVehicles)} km/veículo
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Destaques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Melhor Eficiência */}
              {mostEfficient && (
                <BestEfficiencyCard
                  vehiclePlate={mostEfficient.vehiclePlate}
                  consumptionPerKm={mostEfficient.consumptionPerKm}
                  costPerKm={mostEfficient.costPerKm}
                  totalRecords={mostEfficient.totalRecords}
                  totalFuelConsumed={mostEfficient.totalFuelConsumed}
                  totalCost={mostEfficient.totalCost}
                  totalDistance={mostEfficient.totalDistance}
                  vehicleModel={mostEfficient.vehicleModel}
                />
              )}
              
              {/* Maior Consumo */}
              {leastEfficient && (
                <Card className="bg-seguranca-black border-red-600">
                  <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                      <TrendingDown className="text-red-400" size={18} />
                      Maior Consumo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Veículo:</span>
                        <span className="text-seguranca-lightgray font-medium">{leastEfficient.vehiclePlate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Consumo:</span>
                        <span className="text-red-400 font-medium">
                          {formatNumber(leastEfficient.consumptionPerKm, 3)} L/km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Rendimento:</span>
                        <span className="text-red-400 font-medium">
                          {formatNumber(1 / leastEfficient.consumptionPerKm, 1)} km/L
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Custo/km:</span>
                        <span className="text-seguranca-lightgray">
                          {formatCurrency(leastEfficient.costPerKm)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Tabela de Estatísticas por Veículo */}
            <Card className="bg-seguranca-black border-gray-600">
              <CardHeader>
                <CardTitle className="text-seguranca-lightgray">Estatísticas por Veículo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left p-2 text-gray-400">Veículo</th>
                        <th className="text-left p-2 text-gray-400">Abastecimentos</th>
                        <th className="text-left p-2 text-gray-400">Consumo Total</th>
                        <th className="text-left p-2 text-gray-400">Custo Total</th>
                        <th className="text-left p-2 text-gray-400">Consumo/km</th>
                        <th className="text-left p-2 text-gray-400">Custo/km</th>
                        <th className="text-left p-2 text-gray-400">Eficiência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.map((stat, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-800">
                          <td className="p-2 text-seguranca-lightgray">
                            <div>
                              <div className="font-medium">{stat.vehiclePlate || 'N/A'}</div>
                              <div className="text-xs text-gray-400">{stat.vehicleModel || stat.vehicleBrand || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="p-2 text-seguranca-lightgray">{stat.totalRecords || 0}</td>
                          <td className="p-2 text-seguranca-lightgray">{formatNumber(stat.totalFuelConsumed || 0)} L</td>
                          <td className="p-2 text-seguranca-lightgray">{formatCurrency(stat.totalCost || 0)}</td>
                          <td className="p-2 text-seguranca-lightgray">{formatNumber(stat.consumptionPerKm || 0, 3)} L/km</td>
                          <td className="p-2 text-seguranca-lightgray">{formatCurrency(stat.costPerKm || 0)}</td>
                          <td className="p-2">
                            <Badge className={getConsumptionEfficiency(stat.consumptionPerKm || 0).color}>
                              {getConsumptionEfficiency(stat.consumptionPerKm || 0).label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 