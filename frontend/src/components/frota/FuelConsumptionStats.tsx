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
import fleetService from '@/services/fleetService';
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
  id?: string;
  vehicleId?: string;
  placa?: string;
  plate?: string;
  vehiclePlate?: string;
  marca?: string;
  brand?: string;
  vehicleBrand?: string;
  modelo?: string;
  model?: string;
  vehicleModel?: string;
  status?: string;
}

interface FuelConsumptionStatsProps {
  vehicles?: Vehicle[];
}

interface HistoricalData {
  date: string;
  consumption: number; // km/L
  costPerLiter: number;
}

// Helpers para compatibilidade entre formatos de veículo (PT/EN / API / Component)
const getVehicleId = (v: any): string => String(v?.id || v?.vehicleId || '');
const getVehiclePlate = (v: any): string => v?.plate || v?.placa || v?.vehiclePlate || '';
const getVehicleBrand = (v: any): string => v?.brand || v?.marca || v?.vehicleBrand || '';
const getVehicleModel = (v: any): string => v?.model || v?.modelo || v?.vehicleModel || '';
const getVehicleStatus = (v: any): string => String(v?.status || '').toLowerCase();

export const FuelConsumptionStats: React.FC<FuelConsumptionStatsProps> = ({ vehicles: initialVehicles = [] }) => {
  const [localVehicles, setLocalVehicles] = useState<any[]>(initialVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [stats, setStats] = useState<FuelConsumptionStatsData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sincronizar ou carregar veículos caso a prop venha vazia
  useEffect(() => {
    if (initialVehicles && initialVehicles.length > 0) {
      setLocalVehicles(initialVehicles);
    } else {
      const fetchVehicles = async () => {
        setLoadingVehicles(true);
        try {
          const fetched = await fleetService.getVehicles();
          if (Array.isArray(fetched) && fetched.length > 0) {
            setLocalVehicles(fetched);
          }
        } catch (e) {
          console.warn('⚠️ Falha ao buscar lista de veículos como fallback:', e);
        } finally {
          setLoadingVehicles(false);
        }
      };
      fetchVehicles();
    }
  }, [initialVehicles]);

  const allVehicles = localVehicles && localVehicles.length > 0 ? localVehicles : initialVehicles;

  const activeVehicles = allVehicles.filter(v => {
    if (!v) return false;
    const status = getVehicleStatus(v);
    if (!status) return true; // se não tiver status, assume disponível
    return status === 'active' || status === 'ativo' || status === 'disponivel' || status === 'em_uso' || status === 'operacional';
  });

  const displayVehicles = activeVehicles.length > 0 ? activeVehicles : allVehicles;

  const loadStats = async () => {
    if (!selectedVehicle) return;

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Carregando estatísticas para veículo:', selectedVehicle);
      const url = (startDate && endDate)
        ? `/fuel-records/vehicle/${selectedVehicle}/period?startDate=${startDate}&endDate=${endDate}`
        : `/fuel-records/vehicle/${selectedVehicle}`;

      const response = await api.get(url);
      console.log('✅ Dados recebidos:', response.data?.length || 0, 'registros');
      
      const records = (response.data || [])
        .filter((r: any) => r && r.mileage != null)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log('📊 Registros válidos após filtro:', records.length);

      if (records.length < 2) {
        console.log('⚠️ Poucos registros para calcular estatísticas');
        setStats(null);
        setHistoricalData([]);
        return;
      }

      // Calcular estatísticas agregadas a partir dos registros
      const totalFuelConsumed = records.reduce((sum: number, record: any) => sum + (record.quantity || 0), 0);
      const totalCost = records.reduce((sum: number, record: any) => sum + (record.cost || 0), 0);
      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      const totalDistance = Math.max(0, (lastRecord.mileage || 0) - (firstRecord.mileage || 0));

      const vehicleInfo = allVehicles.find(v => getVehicleId(v) === selectedVehicle);
      const plate = vehicleInfo ? getVehiclePlate(vehicleInfo) : (records[0]?.vehiclePlate || '');
      const brand = vehicleInfo ? getVehicleBrand(vehicleInfo) : '';
      const model = vehicleInfo ? getVehicleModel(vehicleInfo) : '';
      const modelDisplay = [brand, model].filter(Boolean).join(' ') || (records[0]?.vehicleModel || '');

      const aggregatedStats: FuelConsumptionStatsData = {
        vehiclePlate: plate,
        vehicleModel: modelDisplay,
        totalRecords: records.length,
        totalFuelConsumed,
        totalCost,
        averageFuelPerRefill: records.length > 0 ? totalFuelConsumed / records.length : 0,
        averagePricePerLiter: totalFuelConsumed > 0 ? totalCost / totalFuelConsumed : 0,
        consumptionPerKm: totalDistance > 0 ? totalFuelConsumed / totalDistance : 0,
        costPerKm: totalDistance > 0 ? totalCost / totalDistance : 0,
        totalDistance,
        lastRefillDate: lastRecord.date,
        lastRefillQuantity: lastRecord.quantity || 0,
        lastRefillCost: lastRecord.cost || 0,
      };
      setStats(aggregatedStats);

      // Processar dados para o gráfico
      const chartData: HistoricalData[] = [];
      for (let i = 1; i < records.length; i++) {
        const prev = records[i - 1];
        const curr = records[i];
        const distance = (curr.mileage || 0) - (prev.mileage || 0);
        const qty = curr.quantity || 1;
        if (distance > 0) {
          chartData.push({
            date: new Date(curr.date).toLocaleDateString('pt-BR'),
            consumption: distance / qty,
            costPerLiter: (curr.cost || 0) / qty,
          });
        }
      }
      setHistoricalData(chartData);

    } catch (err: any) {
      console.error('❌ Erro ao carregar estatísticas:', err);
      
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
    if (consumptionPerKm <= 0 || isNaN(consumptionPerKm)) {
      return { label: 'Sem Dados', color: 'bg-gray-500' };
    }
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

  const renderVehicleSelect = (className: string = "w-full sm:w-64 bg-seguranca-black border-gray-600 text-seguranca-lightgray") => (
    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loadingVehicles ? "Carregando veículos..." : "Selecione um veículo"} />
      </SelectTrigger>
      <SelectContent className="bg-seguranca-black border-gray-600">
        {displayVehicles.length === 0 ? (
          <div className="p-2 text-sm text-gray-400 text-center">Nenhum veículo disponível</div>
        ) : (
          displayVehicles.map((vehicle) => {
            const vId = getVehicleId(vehicle);
            const vPlate = getVehiclePlate(vehicle);
            const vBrand = getVehicleBrand(vehicle);
            const vModel = getVehicleModel(vehicle);
            const desc = [vBrand, vModel].filter(Boolean).join(' ');

            return (
              <SelectItem key={vId || vPlate} value={vId} className="text-seguranca-lightgray">
                {vPlate || 'Sem Placa'} {desc ? `- ${desc}` : ''}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );

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
              {renderVehicleSelect()}
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
          {renderVehicleSelect()}
          
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
