import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Fuel,
  Droplets,
  DollarSign,
  TrendingUp,
  BarChart3,
  Gauge,
  Layers,
  Building2,
  MapPin,
  RefreshCw,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Car,
  ChevronRight,
  Eye,
  Filter,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { FuelRecord, Vehicle } from '@/types/fleet';
import { FuelConsumptionOverview } from './FuelConsumptionOverview';
import { FuelConsumptionStats } from './FuelConsumptionStats';
import { AbastecimentosTable } from './AbastecimentosTable';
import EfficiencyAlerts from './EfficiencyAlerts';

interface AbastecimentoGeralDashboardTabProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
  onRefresh: () => void;
  onNavigateTab?: (tab: string) => void;
  isLoading?: boolean;
}

export const AbastecimentoGeralDashboardTab: React.FC<AbastecimentoGeralDashboardTabProps> = ({
  fuelRecords,
  vehicles,
  onRefresh,
  onNavigateTab,
  isLoading = false,
}) => {
  // Filtro de escopo do histórico
  const [filterType, setFilterType] = useState<'ALL' | 'INTERNAL' | 'EXTERNAL'>('ALL');

  // Métricas de Consumo Geral
  const totalCost = useMemo(() => {
    return fuelRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  }, [fuelRecords]);

  const totalLiters = useMemo(() => {
    return fuelRecords.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }, [fuelRecords]);

  const avgPricePerLiter = useMemo(() => {
    return totalLiters > 0 ? totalCost / totalLiters : 0;
  }, [totalCost, totalLiters]);

  const totalFuelings = fuelRecords.length;

  const avgLitersPerFueling = useMemo(() => {
    return totalFuelings > 0 ? totalLiters / totalFuelings : 0;
  }, [totalFuelings, totalLiters]);

  // Divisão Interno vs Externo
  const { internalRecords, externalRecords } = useMemo(() => {
    const internal: FuelRecord[] = [];
    const external: FuelRecord[] = [];

    fuelRecords.forEach((r) => {
      const anyR = r as any;
      const isInt =
        anyR.isInternal === true ||
        anyR.type === 'INTERNAL' ||
        anyR.pumpId ||
        anyR.tankId ||
        anyR.garageId ||
        (r.station || '').toLowerCase().includes('garagem') ||
        (r.station || '').toLowerCase().includes('interno') ||
        (r.station || '').toLowerCase().includes('base');

      if (isInt) {
        internal.push(r);
      } else {
        external.push(r);
      }
    });

    return { internalRecords: internal, externalRecords: external };
  }, [fuelRecords]);

  const internalLiters = internalRecords.reduce((a, b) => a + (b.quantity || 0), 0);
  const externalLiters = externalRecords.reduce((a, b) => a + (b.quantity || 0), 0);
  const internalCost = internalRecords.reduce((a, b) => a + (b.cost || 0), 0);
  const externalCost = externalRecords.reduce((a, b) => a + (b.cost || 0), 0);

  const internalLitersPct = totalLiters > 0 ? (internalLiters / totalLiters) * 100 : 0;
  const externalLitersPct = totalLiters > 0 ? (externalLiters / totalLiters) * 100 : 0;

  // Breakdown por Combustível
  const fuelBreakdown = useMemo(() => {
    const map: Record<string, { liters: number; cost: number; count: number }> = {
      DIESEL: { liters: 0, cost: 0, count: 0 },
      GASOLINE: { liters: 0, cost: 0, count: 0 },
      ETHANOL: { liters: 0, cost: 0, count: 0 },
      FLEX: { liters: 0, cost: 0, count: 0 },
    };

    fuelRecords.forEach((r) => {
      const ft = (r.fuelType || 'DIESEL').toUpperCase();
      const key = map[ft] ? ft : 'DIESEL';
      map[key].liters += r.quantity || 0;
      map[key].cost += r.cost || 0;
      map[key].count += 1;
    });

    return map;
  }, [fuelRecords]);

  // Top 5 Veículos mais abastecidos
  const topVehicles = useMemo(() => {
    const vMap: Record<string, { plate: string; liters: number; cost: number; count: number }> = {};
    fuelRecords.forEach((r) => {
      const plate = r.vehiclePlate || 'Desconhecido';
      if (!vMap[plate]) {
        vMap[plate] = { plate, liters: 0, cost: 0, count: 0 };
      }
      vMap[plate].liters += r.quantity || 0;
      vMap[plate].cost += r.cost || 0;
      vMap[plate].count += 1;
    });

    return Object.values(vMap)
      .sort((a, b) => b.liters - a.liters)
      .slice(0, 5);
  }, [fuelRecords]);

  // Registros para a tabela do histórico com filtro de escopo
  const tableRecords = useMemo(() => {
    if (filterType === 'INTERNAL') return internalRecords;
    if (filterType === 'EXTERNAL') return externalRecords;
    return fuelRecords;
  }, [fuelRecords, internalRecords, externalRecords, filterType]);

  return (
    <div className="space-y-6">
      {/* Top Banner de Boas-Vindas e Resumo Geral */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-seguranca-graphite to-[#191c26] border border-gray-700/80 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-seguranca-red text-white uppercase tracking-wider">
              Visão Executiva
            </span>
            <span className="text-xs text-gray-400 font-medium">Controle Total de Combustível</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Dashboard Geral de Abastecimentos
          </h2>
          <p className="text-xs sm:text-sm text-gray-400">
            Métricas unificadas de consumo, estatísticas de frota, conciliação de fechamentos e histórico completo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={onRefresh}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 h-10 text-xs sm:text-sm gap-2"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Atualizar Dados
          </Button>

          {onNavigateTab && (
            <Button
              onClick={() => onNavigateTab('interno')}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 text-xs sm:text-sm font-semibold gap-1.5 shadow-md shadow-blue-900/30"
            >
              <Building2 size={16} />
              Abastecimento Interno
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CARD / SEÇÃO DE CONSUMO                                     */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-400" />
            1. Indicadores Globais de Consumo
          </h3>
          <span className="text-xs text-gray-400">Total apurado: {totalFuelings} abastecimentos</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Gasto */}
          <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-seguranca-yellow/5 rounded-full blur-2xl -mr-6 -mt-6" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Total Gasto
              </CardTitle>
              <DollarSign className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-seguranca-yellow tracking-tight">
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                <span className="text-blue-400 font-medium">Interno: {internalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </p>
            </CardContent>
          </Card>

          {/* Litros Totais */}
          <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-6 -mt-6" />
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Volume Consumido
              </CardTitle>
              <Droplets className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-400 tracking-tight">
                {totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {internalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L interno • {externalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L externo
              </p>
            </CardContent>
          </Card>

          {/* Custo Médio por Litro */}
          <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Preço Médio / Litro
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-400 tracking-tight">
                {avgPricePerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Média ponderada frota inteira
              </p>
            </CardContent>
          </Card>

          {/* Média por Abastecimento */}
          <Card className="bg-seguranca-graphite border-gray-700/80 shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Média por Abastecimento
              </CardTitle>
              <Fuel className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-purple-400 tracking-tight">
                {avgLitersPerFueling.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {vehicles.length} veículos na frota
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CARD / SEÇÃO DE ESTATÍSTICAS                                */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-seguranca-yellow" />
          2. Estatísticas e Eficiência de Combustível
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card Estatístico: Distribuição Interno vs Externo */}
          <Card className="bg-seguranca-graphite border-gray-700/80 p-5 rounded-xl shadow-md">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center justify-between">
              <span>Origem do Combustível</span>
              <span className="text-[11px] text-blue-400 font-normal">Interno vs Externo</span>
            </h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-300 flex items-center gap-1.5">
                    <Building2 size={13} /> Interno (Garagens)
                  </span>
                  <span className="text-white font-bold">{internalLitersPct.toFixed(1)}%</span>
                </div>
                <Progress value={internalLitersPct} className="h-2.5 bg-gray-700" />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>{internalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L</span>
                  <span>{internalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-300 flex items-center gap-1.5">
                    <MapPin size={13} /> Externo (Rede Conveniada)
                  </span>
                  <span className="text-white font-bold">{externalLitersPct.toFixed(1)}%</span>
                </div>
                <Progress value={externalLitersPct} className="h-2.5 bg-gray-700" />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                  <span>{externalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L</span>
                  <span>{externalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Estatístico: Tipos de Combustível */}
          <Card className="bg-seguranca-graphite border-gray-700/80 p-5 rounded-xl shadow-md">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center justify-between">
              <span>Volume por Combustível</span>
              <Fuel size={14} className="text-purple-400" />
            </h4>

            <div className="space-y-2.5">
              {Object.entries(fuelBreakdown).map(([type, data]) => {
                const pct = totalLiters > 0 ? (data.liters / totalLiters) * 100 : 0;
                return (
                  <div key={type} className="text-xs">
                    <div className="flex justify-between font-medium mb-0.5">
                      <span className="text-gray-300">{type}</span>
                      <span className="text-white font-bold">
                        {data.liters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-gray-700" />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Card Estatístico: Top Veículos Consumidores */}
          <Card className="bg-seguranca-graphite border-gray-700/80 p-5 rounded-xl shadow-md">
            <h4 className="text-xs font-bold uppercase text-gray-400 mb-3 flex items-center justify-between">
              <span>Top 5 Veículos (Maior Volume)</span>
              <Car size={14} className="text-seguranca-yellow" />
            </h4>

            <div className="space-y-2">
              {topVehicles.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">Nenhum abastecimento computado</p>
              ) : (
                topVehicles.map((v, idx) => (
                  <div
                    key={v.plate}
                    className="flex items-center justify-between p-2 rounded-lg bg-seguranca-black/40 border border-gray-700/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-seguranca-yellow/20 text-seguranca-yellow text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-white">{v.plate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-400">
                        {v.liters.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        {v.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Alertas e visão comparativa */}
        <EfficiencyAlerts compact />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <FuelConsumptionOverview vehicles={vehicles} />
          <FuelConsumptionStats vehicles={vehicles} />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. CARD / SEÇÃO DE FECHAMENTOS                                 */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-emerald-400" />
            3. Fechamentos e Conciliação Operacional
          </h3>
          {onNavigateTab && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('readings')}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 gap-1 h-8"
            >
              Ir para Tela de Fechamentos <ChevronRight size={14} />
            </Button>
          )}
        </div>

        <Card className="bg-seguranca-graphite border-gray-700/80 p-5 rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-seguranca-black/50 p-4 rounded-xl border border-gray-700/80 flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Status de Auditoria</span>
                <span className="text-base font-bold text-white">Conciliação Ativa</span>
                <p className="text-[11px] text-emerald-400 mt-0.5">Leituras de bombas e tanques em dia</p>
              </div>
            </div>

            <div className="bg-seguranca-black/50 p-4 rounded-xl border border-gray-700/80 flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <Gauge size={24} />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Aferição de Bombas</span>
                <span className="text-base font-bold text-white">Fechamento por Turno</span>
                <p className="text-[11px] text-gray-400 mt-0.5">Comparativo horímetro vs volume injetado</p>
              </div>
            </div>

            <div className="bg-seguranca-black/50 p-4 rounded-xl border border-gray-700/80 flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <Building2 size={24} />
              </div>
              <div>
                <span className="text-[11px] uppercase font-bold text-gray-400 block">Infraestrutura</span>
                <span className="text-base font-bold text-white">Tanques Próprios</span>
                <p className="text-[11px] text-gray-400 mt-0.5">Monitoramento de nível e capacidade</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ============================================================== */}
      {/* 4. CARD / SEÇÃO DO HISTÓRICO DETALHADO                         */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-seguranca-yellow" />
            4. Histórico Detalhado de Abastecimentos
          </h3>

          {/* Chips de Filtro de Escopo */}
          <div className="flex items-center gap-1.5 bg-seguranca-black/60 p-1 rounded-lg border border-gray-700/80 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'ALL'
                  ? 'bg-seguranca-red text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Todos ({fuelRecords.length})
            </button>
            <button
              onClick={() => setFilterType('INTERNAL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'INTERNAL'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Apenas Interno ({internalRecords.length})
            </button>
            <button
              onClick={() => setFilterType('EXTERNAL')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                filterType === 'EXTERNAL'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Apenas Externo ({externalRecords.length})
            </button>
          </div>
        </div>

        <Card className="bg-seguranca-graphite border-gray-700/80 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <AbastecimentosTable
              abastecimentos={tableRecords}
              veiculos={vehicles.map((v) => ({
                id: v.id,
                placa: v.plate || (v as any).placa || '',
                fleetNumber: (v as any).fleetNumber || (v as any).prefixo || '',
                marca: v.brand || (v as any).marca || '',
                modelo: v.model || (v as any).modelo || '',
                status: v.status || 'ATIVO',
              }))}
              onRefresh={onRefresh}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AbastecimentoGeralDashboardTab;

