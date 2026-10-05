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
    if (consumptionPerKm <= 0 || isNaN(consumptionPerKm) || !Number.isFinite(consumptionPerKm)) {
      return { label: 'Sem Dados', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
    }
    if (consumptionPerKm <= 0.08) return { label: 'Excelente', color: 'bg-emerald-950/60 text-emerald-400 border-emerald-800' };
    if (consumptionPerKm <= 0.12) return { label: 'Bom', color: 'bg-sky-950/60 text-sky-400 border-sky-800' };
    if (consumptionPerKm <= 0.16) return { label: 'Regular', color: 'bg-amber-950/60 text-amber-400 border-amber-800' };
    return { label: 'Alto Consumo', color: 'bg-rose-950/60 text-rose-400 border-rose-800' };
  };

  const clearFilters = () => {
    setSelectedVehicle('');
    setStartDate('');
    setEndDate('');
    setStats(null);
  };

  const renderVehicleSelect = (className: string = "w-full bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs sm:text-sm") => (
    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loadingVehicles ? "Carregando veículos..." : "Selecione um veículo"} />
      </SelectTrigger>
      <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60 text-zinc-100">
        {displayVehicles.length === 0 ? (
          <div className="p-2 text-xs text-gray-400 text-center">Nenhum veículo disponível</div>
        ) : (
          displayVehicles.map((vehicle) => {
            const vId = getVehicleId(vehicle);
            const vPlate = getVehiclePlate(vehicle);
            const vBrand = getVehicleBrand(vehicle);
            const vModel = getVehicleModel(vehicle);
            const desc = [vBrand, vModel].filter(Boolean).join(' ');

            return (
              <SelectItem key={vId || vPlate} value={vId} className="text-zinc-200 focus:bg-zinc-800 focus:text-white text-xs sm:text-sm">
                <span className="font-mono font-bold text-yellow-400 mr-1.5">{vPlate || 'S/ Placa'}</span>
                {desc ? <span className="text-zinc-300">• {desc}</span> : ''}
              </SelectItem>
            );
          })
        )}
      </SelectContent>
    </Select>
  );

  // Cálculo seguro de km/L sem gerar Infinity / oo km/L
  const kmPerLiter = stats && stats.totalDistance > 0 && stats.totalFuelConsumed > 0
    ? (stats.totalDistance / stats.totalFuelConsumed)
    : (stats && stats.consumptionPerKm > 0 && Number.isFinite(1 / stats.consumptionPerKm))
      ? (1 / stats.consumptionPerKm)
      : null;

  return (
    <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden shadow-lg">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-gray-700/60 bg-seguranca-black/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="text-seguranca-lightgray flex items-center gap-2.5 text-base sm:text-lg">
            <div className="p-2 rounded-lg bg-amber-500/10 text-seguranca-yellow border border-amber-500/20 shrink-0">
              <BarChart3 size={18} />
            </div>
            <div>
              <span className="font-bold block">Estatísticas de Consumo</span>
              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                Desempenho e custos detalhados por veículo
              </span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              onClick={loadStats}
              disabled={loading || !selectedVehicle}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold h-8 px-3.5 flex-1 sm:flex-none"
            >
              {loading ? (
                <Loader2 size={14} className="mr-1.5 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-1.5" />
              )}
              Atualizar
            </Button>
            {selectedVehicle && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs h-8 px-2.5"
                title="Limpar seleção e filtros"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Filtros em layout responsivo */}
        <div className="mt-4 pt-3 border-t border-gray-700/40 grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-6">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Veículo Selecionado
            </label>
            {renderVehicleSelect()}
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-seguranca-black border border-gray-600 text-seguranca-lightgray px-3 py-1.5 rounded-md text-xs focus:ring-1 focus:ring-seguranca-yellow focus:outline-none h-9"
              placeholder="Data inicial"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-seguranca-black border border-gray-600 text-seguranca-lightgray px-3 py-1.5 rounded-md text-xs focus:ring-1 focus:ring-seguranca-yellow focus:outline-none h-9"
              placeholder="Data final"
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-5">
        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <Loader2 size={36} className="animate-spin text-seguranca-yellow mb-3" />
            <span className="text-sm font-medium text-seguranca-lightgray">Calculando estatísticas do veículo...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-900/20 border border-red-600/60 rounded-xl text-xs text-red-300 mb-4">
            <AlertCircle className="text-red-400 shrink-0" size={18} />
            <span>{error}</span>
          </div>
        )}

        {!selectedVehicle && !loading && (
          <div className="text-center py-10 px-4">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto mb-3 text-seguranca-yellow">
              <Car size={26} />
            </div>
            <p className="text-sm font-semibold text-seguranca-lightgray">
              Nenhum veículo selecionado
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
              Escolha um veículo acima para visualizar os dados de consumo, custo por km e gráficos de evolução.
            </p>
          </div>
        )}
        
        {selectedVehicle && stats && !loading && stats.totalRecords < 2 && (
          <div className="text-center py-10 px-4">
            <div className="h-14 w-14 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <BarChart3 size={26} />
            </div>
            <p className="text-sm font-semibold text-seguranca-lightgray">
              Dados insuficientes para estatísticas
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              É necessário ter pelo menos 2 registros de abastecimento com quilometragem (odômetro) informada para calcular as métricas.
            </p>
          </div>
        )}

        {selectedVehicle && stats && !loading && stats.totalRecords >= 2 && (
          <div className="space-y-4 sm:space-y-5">
            {/* Header / Resumo do Veículo */}
            <div className="bg-seguranca-black/80 p-3.5 sm:p-4 rounded-xl border border-gray-700/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-700/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-seguranca-yellow shrink-0">
                    <Car size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-yellow-400 bg-zinc-900 border border-yellow-500/30 px-2 py-0.5 rounded shadow-sm">
                        {stats.vehiclePlate || 'SEM PLACA'}
                      </span>
                      <Badge variant="outline" className={`text-[10px] py-0 px-2 border ${getConsumptionEfficiency(stats.consumptionPerKm).color}`}>
                        {getConsumptionEfficiency(stats.consumptionPerKm).label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-xs sm:max-w-md">
                      {stats.vehicleModel || 'Modelo não especificado'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <span className="text-gray-400 block text-[11px]">Último Registro</span>
                  <span className="font-medium text-seguranca-lightgray">
                    {stats.lastRefillDate ? formatDate(stats.lastRefillDate) : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-gray-400 block text-[11px]">Abastecimentos</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5">{stats.totalRecords}</p>
                </div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-gray-400 block text-[11px]">Distância Rodada</span>
                  <p className="text-sm sm:text-base font-bold text-white mt-0.5 font-mono">
                    {formatNumber(stats.totalDistance)} km
                  </p>
                </div>
                <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800 col-span-2 sm:col-span-1">
                  <span className="text-gray-400 block text-[11px]">Consumo Médio</span>
                  <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5 font-mono">
                    {kmPerLiter !== null && kmPerLiter > 0 ? `${formatNumber(kmPerLiter, 2)} km/L` : 'Sem km registrado'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* 4 Cards Principais de Métricas - Grid responsivo */}
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Consumo Total */}
              <Card className="bg-seguranca-black/80 border-gray-700/60 rounded-xl shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Consumo Total</span>
                    <div className="p-1 rounded-md bg-amber-500/10 text-seguranca-yellow">
                      <Fuel size={14} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold font-mono text-seguranca-lightgray">
                    {formatNumber(stats.totalFuelConsumed)} L
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Média: {formatNumber(stats.averageFuelPerRefill)} L/abast.
                  </p>
                </CardContent>
              </Card>
              
              {/* Custo Total */}
              <Card className="bg-seguranca-black/80 border-gray-700/60 rounded-xl shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Custo Total</span>
                    <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                      <DollarSign size={14} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold font-mono text-seguranca-lightgray">
                    {formatCurrency(stats.totalCost)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    Média: {formatCurrency(stats.averagePricePerLiter)}/L
                  </p>
                </CardContent>
              </Card>
              
              {/* Consumo/km */}
              <Card className="bg-seguranca-black/80 border-gray-700/60 rounded-xl shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Consumo / km</span>
                    <div className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                      <TrendingUp size={14} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold font-mono text-seguranca-lightgray">
                    {stats.totalDistance > 0 ? `${formatNumber(stats.consumptionPerKm, 3)} L/km` : '0,000 L/km'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate font-medium">
                    {kmPerLiter !== null && kmPerLiter > 0 ? (
                      <span className="text-emerald-400 font-semibold">{formatNumber(kmPerLiter, 2)} km/L</span>
                    ) : (
                      <span className="text-zinc-500 text-[10px]">Sem km suf. para km/L</span>
                    )}
                  </p>
                </CardContent>
              </Card>
              
              {/* Custo/km */}
              <Card className="bg-seguranca-black/80 border-gray-700/60 rounded-xl shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Custo / km</span>
                    <div className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                      <DollarSign size={14} />
                    </div>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold font-mono text-seguranca-lightgray">
                    {stats.totalDistance > 0 ? formatCurrency(stats.costPerKm) : 'R$ 0,00'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {stats.totalDistance > 0 ? 'Por km percorrido' : 'Requer odômetro válido'}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Último abastecimento */}
            {stats.lastRefillDate && (
              <Card className="bg-seguranca-black/80 border-gray-700/60 rounded-xl shadow-sm">
                <CardHeader className="p-3 sm:p-4 pb-2 border-b border-gray-700/40">
                  <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-sm sm:text-base">
                    <Calendar className="text-seguranca-yellow" size={16} />
                    Detalhes do Último Abastecimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-gray-400 text-[11px] block">Data</span>
                      <p className="text-seguranca-lightgray font-semibold mt-0.5">
                        {formatDate(stats.lastRefillDate)}
                      </p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-gray-400 text-[11px] block">Volume Abastecido</span>
                      <p className="text-seguranca-lightgray font-semibold mt-0.5 font-mono">
                        {formatNumber(stats.lastRefillQuantity)} L
                      </p>
                    </div>
                    <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-gray-400 text-[11px] block">Custo Total</span>
                      <p className="text-emerald-400 font-semibold mt-0.5 font-mono">
                        {formatCurrency(stats.lastRefillCost)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Consumo */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-seguranca-lightgray mb-2.5 flex items-center gap-1.5">
                <BarChart3 size={15} className="text-seguranca-yellow" />
                Evolução do Consumo (km/L) e Custo (R$/L)
              </h4>
              <div className="h-64 sm:h-72 bg-seguranca-black/90 rounded-xl p-3 sm:p-4 border border-gray-700/60">
                {historicalData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" stroke="#FBBF24" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#F87171" tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          borderColor: '#374151',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Line yAxisId="left" type="monotone" dataKey="consumption" name="Consumo (km/L)" stroke="#FBBF24" strokeWidth={2} dot={{ r: 3 }} />
                      <Line yAxisId="right" type="monotone" dataKey="costPerLiter" name="Custo/L (R$)" stroke="#F87171" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <BarChart3 size={32} className="text-gray-600 mb-2" />
                    <p className="text-xs text-gray-400">
                      Dados insuficientes para desenhar a curva de evolução temporal.
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      São necessários ao menos 2 abastecimentos com distância positiva calculada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 
