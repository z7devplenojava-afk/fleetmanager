import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Fuel, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Car, 
  BarChart3, 
  RefreshCw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface FuelConsumptionStatsData {
  vehiclePlate: string;
  vehicleModel: string;
  totalRecords: number;
  totalFuelConsumed: number;
  totalCost: number;
  averageFuelPerRefill: number;
  averagePricePerLiter: number;
  consumptionPerKm: number;
  costPerKm: number;
  totalDistance: number;
  lastRefillDate: string;
  lastRefillQuantity: number;
  lastRefillCost: number;
}

interface Vehicle {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  status: string;
}

interface FuelConsumptionStatsProps {
  vehicles: Vehicle[];
}

interface HistoricalData {
  date: string;
  consumption: number; // km/L
  costPerLiter: number;
}

export const FuelConsumptionStats: React.FC<FuelConsumptionStatsProps> = ({ vehicles }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<FuelConsumptionStatsData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const vehiclesAtivos = vehicles.filter(v => 
    v.status.toLowerCase() === 'active' || 
    v.status.toLowerCase() === 'ativo'
  );

  const loadStats = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Carregando estatísticas para veículo:', selectedVehicle);
      const response = await api.get(`/fuel-records/vehicle/${selectedVehicle}`);
      console.log('✅ Dados recebidos:', response.data?.length || 0, 'registros');
      
      const records = response.data
        .filter(r => r.mileage != null)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log('📊 Registros válidos após filtro:', records.length);

      if (records.length < 2) {
        console.log('⚠️ Poucos registros para calcular estatísticas');
        setStats(null);
        setHistoricalData([]);
        return;
      }

      // Calcular estatísticas agregadas a partir dos registros
      const totalFuelConsumed = records.reduce((sum, record) => sum + record.quantity, 0);
      const totalCost = records.reduce((sum, record) => sum + record.cost, 0);
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      const totalDistance = lastRecord.mileage - firstRecord.mileage;

      const vehicleInfo = vehicles.find(v => v.id === selectedVehicle);

      const aggregatedStats: FuelConsumptionStatsData = {
        vehiclePlate: vehicleInfo?.placa || '',
        vehicleModel: vehicleInfo?.modelo || '',
        totalRecords: records.length,
        totalFuelConsumed,
        totalCost,
        averageFuelPerRefill: totalFuelConsumed / records.length,
        averagePricePerLiter: totalCost / totalFuelConsumed,
        consumptionPerKm: totalDistance > 0 ? totalFuelConsumed / totalDistance : 0,
        costPerKm: totalDistance > 0 ? totalCost / totalDistance : 0,
        totalDistance,
        lastRefillDate: lastRecord.date,
        lastRefillQuantity: lastRecord.quantity,
        lastRefillCost: lastRecord.cost,
      };
      setStats(aggregatedStats);

      // Processar dados para o gráfico (lógica já existente)
      const chartData: HistoricalData[] = [];
      for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const curr = records[i];
        const distance = curr.mileage - prev.mileage;
        if (distance > 0) {
          chartData.push({
            date: new Date(curr.date).toLocaleDateString('pt-BR'),
            consumption: distance / curr.quantity,
            costPerLiter: curr.cost / curr.quantity,
          });
        }
      }
      setHistoricalData(chartData);

    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      
      // Melhorar mensagem de erro baseada no tipo de erro
      let errorMessage = 'Erro ao carregar estatísticas';
      
      if (err.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Veículo não encontrado ou sem registros de combustível.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVehicle) {
      loadStats();
    }
  }, [selectedVehicle, startDate, endDate]);

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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
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

  const clearFilters = () => {
    setSelectedVehicle('');
    setStartDate('');
    setEndDate('');
    setStats(null);
  };

  if (!stats && !loading && !selectedVehicle) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
            <BarChart3 className="text-seguranca-yellow" size={20} />
            Estatísticas de Consumo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">
              Selecione um veículo para visualizar as estatísticas de consumo
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger className="w-full sm:w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione um veículo" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-black border-gray-600">
                  {vehiclesAtivos.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id} className="text-seguranca-lightgray">
                      {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-seguranca-graphite border-gray-600">
      <CardHeader>
        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
          <BarChart3 className="text-seguranca-yellow" size={20} />
          Estatísticas de Consumo
        </CardTitle>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full sm:w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray">
              <SelectValue placeholder="Selecione um veículo" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-black border-gray-600">
              {vehiclesAtivos.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id} className="text-seguranca-lightgray">
                  {vehicle.placa} - {vehicle.marca} {vehicle.modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray px-3 py-2 rounded-md"
              placeholder="Data inicial"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray px-3 py-2 rounded-md"
              placeholder="Data final"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={loadStats}
              disabled={loading || !selectedVehicle}
              className="bg-seguranca-red hover:bg-seguranca-darkred"
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <RefreshCw size={16} className="mr-2" />
              )}
              Atualizar
            </Button>
            <Button
              onClick={clearFilters}
              variant="outline"
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
            >
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 size={32} className="animate-spin text-seguranca-yellow" />
            <span className="ml-2 text-seguranca-lightgray">Carregando estatísticas...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-600 rounded-lg">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-400">{error}</span>
          </div>
        )}
        
        {stats && !loading && stats.totalRecords < 2 ? (
          <div className="text-center py-8">
            <BarChart3 size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">
              Não há dados suficientes para gerar as estatísticas de consumo.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              É necessário ter pelo menos 2 registros de abastecimento com quilometragem informada.
            </p>
          </div>
        ) : stats && !loading ? (
          <div className="space-y-6">
            {/* Header com informações do veículo */}
            <div className="bg-seguranca-black p-4 rounded-lg border border-gray-600">
              <div className="flex items-center gap-3 mb-2">
                <Car className="text-seguranca-yellow" size={24} />
                <div>
                  <h3 className="text-lg font-semibold text-seguranca-lightgray">
                    {stats.vehiclePlate}
                  </h3>
                  <p className="text-gray-400">{stats.vehicleModel}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Total de Abastecimentos:</span>
                  <p className="text-seguranca-lightgray font-medium">{stats.totalRecords}</p>
                </div>
                <div>
                  <span className="text-gray-400">Último Abastecimento:</span>
                  <p className="text-seguranca-lightgray font-medium">
                    {stats.lastRefillDate ? formatDate(stats.lastRefillDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Distância Total:</span>
                  <p className="text-seguranca-lightgray font-medium">
                    {formatNumber(stats.totalDistance)} km
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Eficiência:</span>
                  <Badge className={getConsumptionEfficiency(stats.consumptionPerKm).color}>
                    {getConsumptionEfficiency(stats.consumptionPerKm).label}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Estatísticas principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Fuel className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Consumo Total</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatNumber(stats.totalFuelConsumed)} L
                  </p>
                  <p className="text-xs text-gray-400">
                    Média: {formatNumber(stats.averageFuelPerRefill)} L/abastecimento
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
                    {formatCurrency(stats.totalCost)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Média: {formatCurrency(stats.averagePricePerLiter)}/L
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Consumo/km</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatNumber(stats.consumptionPerKm, 3)} L/km
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatNumber(1 / stats.consumptionPerKm, 1)} km/L
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-seguranca-black border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-seguranca-yellow" size={20} />
                    <span className="text-gray-400 text-sm">Custo/km</span>
                  </div>
                  <p className="text-2xl font-bold text-seguranca-lightgray">
                    {formatCurrency(stats.costPerKm)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Por quilômetro rodado
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Último abastecimento */}
            {stats.lastRefillDate && (
              <Card className="bg-seguranca-black border-gray-600">
                <CardHeader>
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-lg">
                    <Calendar className="text-seguranca-yellow" size={18} />
                    Último Abastecimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-400 text-sm">Data:</span>
                      <p className="text-seguranca-lightgray font-medium">
                        {formatDate(stats.lastRefillDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Quantidade:</span>
                      <p className="text-seguranca-lightgray font-medium">
                        {formatNumber(stats.lastRefillQuantity)} L
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">Custo:</span>
                      <p className="text-seguranca-lightgray font-medium">
                        {formatCurrency(stats.lastRefillCost)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Consumo */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-seguranca-lightgray mb-4">
                Evolução do Consumo (km/L) e Custo (R$/L)
              </h4>
              <div className="h-80 bg-seguranca-black rounded-lg p-4 border border-gray-600">
                {historicalData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                      <XAxis dataKey="date" stroke="#A0AEC0" />
                      <YAxis yAxisId="left" stroke="#A0AEC0" />
                      <YAxis yAxisId="right" orientation="right" stroke="#A0AEC0" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A202C',
                          borderColor: '#4A5568',
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="consumption" name="Consumo (km/L)" stroke="#FBBF24" />
                      <Line yAxisId="right" type="monotone" dataKey="costPerLiter" name="Custo/Litro (R$)" stroke="#F87171" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">Dados insuficientes para gerar o gráfico de evolução.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}; 
