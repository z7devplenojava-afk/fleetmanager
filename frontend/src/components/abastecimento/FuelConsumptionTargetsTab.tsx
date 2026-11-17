'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Bus,
  Car,
  Fuel,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Download,
  Filter,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { FuelRecord, Vehicle } from '@/types/fleet';

interface FuelConsumptionTargetsTabProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
}

export type VehicleCategory = 'VAN' | 'MINIBUS' | 'MICRO' | 'ONIBUS';

interface CategoryTargetConfig {
  label: string;
  defaultTarget: number;
  icon: string;
}

const CATEGORY_CONFIG: Record<VehicleCategory, CategoryTargetConfig> = {
  VAN: { label: 'Vans', defaultTarget: 8.5, icon: '🚐' },
  MINIBUS: { label: 'Minibus', defaultTarget: 6.1, icon: '🚐' },
  MICRO: { label: 'Micros', defaultTarget: 5.5, icon: '🚌' },
  ONIBUS: { label: 'Ônibus (Rodoviário / Urbano)', defaultTarget: 3.2, icon: '🚍' },
};

/**
 * Identifica a categoria do veículo (Van, Minibus, Micro, Ônibus)
 */
export function resolveVehicleCategory(v?: Vehicle): VehicleCategory {
  if (!v) return 'ONIBUS';

  const type = (v.vehicleType || '').toUpperCase();
  const busType = (v.busType || '').toUpperCase();
  const model = ((v.model || '') + ' ' + (v.brand || '')).toUpperCase();
  const prefix = (v.patrimonyNumber || (v as any).fleetNumber || '').toString();

  // 1. Van
  if (type === 'VAN' || model.includes('VAN') || model.includes('SPRINTER') || model.includes('TRANSIT') || model.includes('MASTER') || model.includes('DUCATO')) {
    return 'VAN';
  }

  // 2. Minibus
  if (type === 'MINIBUS' || model.includes('MINIBUS') || (prefix.startsWith('54') || prefix.startsWith('55') || prefix.startsWith('61'))) {
    return 'MINIBUS';
  }

  // 3. Micro-ônibus
  if (busType.includes('MICRO') || type.includes('MICRO') || model.includes('MICRO') || model.includes('VOLARE') || model.includes('SENIOR') || (prefix.startsWith('33') || prefix.startsWith('51') || prefix.startsWith('53') || prefix.startsWith('64') || prefix.startsWith('68') || prefix.startsWith('69') || prefix.startsWith('72') || prefix.startsWith('73') || prefix.startsWith('80') || prefix.startsWith('88') || prefix.startsWith('89'))) {
    return 'MICRO';
  }

  // 4. Ônibus (padrão)
  return 'ONIBUS';
}

export const FuelConsumptionTargetsTab: React.FC<FuelConsumptionTargetsTabProps> = ({
  fuelRecords,
  vehicles,
}) => {
  // Mês e Ano de Referência
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const now = new Date();
    return now.getMonth(); // 0 a 11
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());

  // Metas por categoria customizáveis
  const [targets, setTargets] = useState<Record<VehicleCategory, number>>(() => {
    try {
      const saved = localStorage.getItem('fuel_category_targets');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      VAN: 8.5,
      MINIBUS: 6.1,
      MICRO: 5.5,
      ONIBUS: 3.2,
    };
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleTargetChange = (cat: VehicleCategory, val: number) => {
    const updated = { ...targets, [cat]: val };
    setTargets(updated);
    try {
      localStorage.setItem('fuel_category_targets', JSON.stringify(updated));
    } catch (_) {}
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  // Filtrar registros do mês selecionado
  const monthRecords = useMemo(() => {
    return fuelRecords.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date + 'T12:00:00');
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });
  }, [fuelRecords, selectedMonth, selectedYear]);

  // Consolidar dados por veículo no mês
  const vehicleStats = useMemo(() => {
    // Mapa de registros por vehicleId
    const recordsByVehicle = new Map<string, FuelRecord[]>();
    monthRecords.forEach(r => {
      if (!r.vehicleId) return;
      const list = recordsByVehicle.get(r.vehicleId) || [];
      list.push(r);
      recordsByVehicle.set(r.vehicleId, list);
    });

    return vehicles.map(veh => {
      const vRecords = recordsByVehicle.get(veh.id) || [];
      // Ordenar por data / odômetro
      vRecords.sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (da !== db) return da - db;
        return (a.mileage || 0) - (b.mileage || 0);
      });

      const category = resolveVehicleCategory(veh);
      const target = targets[category];

      let totalLiters = 0;
      let totalCost = 0;
      let minKm = Infinity;
      let maxKm = -Infinity;

      vRecords.forEach(r => {
        totalLiters += Number(r.quantity) || 0;
        totalCost += Number(r.cost) || 0;

        const km = r.mileage || 0;
        const initial = r.initialMileage || 0;

        if (initial > 0 && initial < minKm) minKm = initial;
        if (km > 0) {
          if (km < minKm) minKm = km;
          if (km > maxKm) maxKm = km;
        }
      });

      if (minKm === Infinity) minKm = 0;
      if (maxKm === -Infinity) maxKm = 0;

      let kmMensal = maxKm > minKm ? maxKm - minKm : 0;
      // Se tiver km registrado diretamente nos abastecimentos acumulados
      if (kmMensal === 0 && vRecords.length > 0) {
        kmMensal = vRecords.reduce((acc, r) => acc + ((r.finalMileage && r.initialMileage) ? (r.finalMileage - r.initialMileage) : 0), 0);
      }

      const mediaRealizada = totalLiters > 0 && kmMensal > 0 ? kmMensal / totalLiters : 0;
      const desvio = mediaRealizada > 0 ? mediaRealizada - target : 0;

      const isLocacaoOuParado = totalLiters === 0 && kmMensal === 0;

      let status: 'ABOVE' | 'ON_TARGET' | 'BELOW' | 'INACTIVE';
      if (isLocacaoOuParado) {
        status = 'INACTIVE';
      } else if (mediaRealizada >= target) {
        status = 'ABOVE';
      } else if (mediaRealizada >= target * 0.95) {
        status = 'ON_TARGET';
      } else {
        status = 'BELOW';
      }

      return {
        vehicle: veh,
        category,
        recordsCount: vRecords.length,
        minKm,
        maxKm,
        kmMensal,
        totalLiters,
        totalCost,
        mediaRealizada,
        target,
        desvio,
        status,
      };
    });
  }, [vehicles, monthRecords, targets]);

  // Filtragem para tabela
  const filteredVehicles = useMemo(() => {
    return vehicleStats.filter(item => {
      const v = item.vehicle;
      const prefix = (v.patrimonyNumber || (v as any).fleetNumber || '').toLowerCase();
      const plate = (v.plate || (v as any).placa || '').toLowerCase();
      const model = (v.model || '').toLowerCase();
      const q = searchTerm.toLowerCase();

      const matchesSearch = !q || prefix.includes(q) || plate.includes(q) || model.includes(q);
      const matchesCategory = activeCategoryFilter === 'ALL' || item.category === activeCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [vehicleStats, searchTerm, activeCategoryFilter]);

  // Totais Gerais
  const totals = useMemo(() => {
    let totalKm = 0;
    let totalLiters = 0;
    let totalCost = 0;
    let activeVehiclesCount = 0;

    vehicleStats.forEach(item => {
      totalKm += item.kmMensal;
      totalLiters += item.totalLiters;
      totalCost += item.totalCost;
      if (item.totalLiters > 0 || item.kmMensal > 0) {
        activeVehiclesCount++;
      }
    });

    const mediaGeral = totalLiters > 0 ? totalKm / totalLiters : 0;

    return {
      totalKm,
      totalLiters,
      totalCost,
      mediaGeral,
      activeVehiclesCount,
      totalVehicles: vehicleStats.length,
    };
  }, [vehicleStats]);

  // Totais por Categoria
  const categorySummaries = useMemo(() => {
    const map: Record<VehicleCategory, { km: number; liters: number; count: number; cost: number }> = {
      VAN: { km: 0, liters: 0, count: 0, cost: 0 },
      MINIBUS: { km: 0, liters: 0, count: 0, cost: 0 },
      MICRO: { km: 0, liters: 0, count: 0, cost: 0 },
      ONIBUS: { km: 0, liters: 0, count: 0, cost: 0 },
    };

    vehicleStats.forEach(item => {
      const c = item.category;
      map[c].km += item.kmMensal;
      map[c].liters += item.totalLiters;
      map[c].cost += item.totalCost;
      if (item.totalLiters > 0) map[c].count++;
    });

    return map;
  }, [vehicleStats]);

  // Exportar CSV
  const handleExportCSV = () => {
    const headers = ['FROTA', 'PLACA', 'CATEGORIA', 'MODELO', 'KM_MENSAL', 'CONSUMO_LTS', 'MEDIA_KML', 'META_KML', 'DESVIO', 'CUSTO_TOTAL_RS', 'STATUS'];
    const rows = filteredVehicles.map(item => [
      item.vehicle.patrimonyNumber || (item.vehicle as any).fleetNumber || 'S/N',
      item.vehicle.plate || (item.vehicle as any).placa || '',
      CATEGORY_CONFIG[item.category].label,
      item.vehicle.model || '',
      item.kmMensal.toFixed(0),
      item.totalLiters.toFixed(2),
      item.mediaRealizada > 0 ? item.mediaRealizada.toFixed(2) : '0.00',
      item.target.toFixed(2),
      item.desvio.toFixed(2),
      item.totalCost.toFixed(2),
      item.status === 'INACTIVE' ? 'Locacao/Parado' : item.status === 'ABOVE' ? 'Acima da Meta' : 'Abaixo da Meta'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fechamento_abastecimento_${monthNames[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Barra de Navegação do Mês + Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-seguranca-graphite p-4 rounded-xl border border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="border-gray-600 hover:bg-gray-700 h-9 px-2 text-gray-200"
            title="Mês Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-seguranca-yellow" />
            <span className="text-lg font-bold text-white tracking-wide">
              {monthNames[selectedMonth].toUpperCase()} / {selectedYear}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="border-gray-600 hover:bg-gray-700 h-9 px-2 text-gray-200"
            title="Próximo Mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className={`border-gray-600 text-xs h-9 ${showConfig ? 'bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <Sliders className="h-4 w-4 mr-1.5" />
            Ajustar Metas
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/40 text-xs h-9 ml-auto sm:ml-0"
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar Fechamento
          </Button>
        </div>
      </div>

      {/* Painel Expansível de Ajuste de Metas */}
      {showConfig && (
        <Card className="bg-seguranca-graphite/90 border border-seguranca-yellow/40 animate-in fade-in-50 duration-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-seguranca-yellow flex items-center gap-2">
              <Target className="h-4 w-4" />
              Configurar Metas de Consumo (km/l) por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(Object.keys(CATEGORY_CONFIG) as VehicleCategory[]).map(cat => (
                <div key={cat} className="space-y-1.5 bg-gray-900/60 p-3 rounded-lg border border-gray-700">
                  <Label className="text-xs text-gray-300 flex items-center gap-1.5">
                    <span>{CATEGORY_CONFIG[cat].icon}</span>
                    <span className="font-semibold">{CATEGORY_CONFIG[cat].label}</span>
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="20"
                      value={targets[cat]}
                      onChange={e => handleTargetChange(cat, Number(e.target.value))}
                      className="h-8 text-xs bg-gray-800 border-gray-600 text-white font-mono"
                    />
                    <span className="text-xs text-gray-400">km/l</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">
              💡 As metas ajustadas são salvas e usadas automaticamente para calcular a eficiência de cada veículo da categoria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Cards de KPIs do Fechamento Mensal */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="bg-seguranca-graphite border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-semibold uppercase">KM Rodado no Mês</p>
              <Gauge className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {totals.totalKm.toLocaleString('pt-BR')} <span className="text-xs font-normal text-gray-400">km</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{totals.activeVehiclesCount} veículos em operação</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-semibold uppercase">Consumo Total Diesel</p>
              <Fuel className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {totals.totalLiters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} <span className="text-xs font-normal text-gray-400">L</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {monthRecords.length} abastecimentos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-l-4 border-l-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-semibold uppercase">Média Geral da Frota</p>
              <Target className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
              {totals.mediaGeral > 0 ? totals.mediaGeral.toFixed(2) : '—'} <span className="text-xs font-normal text-gray-400">km/l</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Média ponderada do mês</p>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400 font-semibold uppercase">Gasto Total Combustível</p>
              <DollarSign className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-1">
              {totals.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Diesel + lançamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Médias por Categoria (Van, Minibus, Micro, Ônibus) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(CATEGORY_CONFIG) as VehicleCategory[]).map(cat => {
          const summary = categorySummaries[cat];
          const mediaCat = summary.liters > 0 ? summary.km / summary.liters : 0;
          const target = targets[cat];
          const atingiu = mediaCat >= target;

          return (
            <div
              key={cat}
              onClick={() => setActiveCategoryFilter(activeCategoryFilter === cat ? 'ALL' : cat)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                activeCategoryFilter === cat
                  ? 'bg-seguranca-yellow/10 border-seguranca-yellow shadow-md'
                  : 'bg-seguranca-graphite/80 border-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <span>{CATEGORY_CONFIG[cat].icon}</span>
                  {CATEGORY_CONFIG[cat].label}
                </span>
                <Badge className={atingiu ? 'bg-emerald-950/70 text-emerald-400 border-emerald-600 text-[10px]' : 'bg-red-950/70 text-red-400 border-red-600 text-[10px]'}>
                  Meta: {target.toFixed(1)} km/l
                </Badge>
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-white">
                  {mediaCat > 0 ? mediaCat.toFixed(2) : '—'} <span className="text-xs font-normal text-gray-400">km/l</span>
                </span>
                {mediaCat > 0 && (
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${atingiu ? 'text-emerald-400' : 'text-red-400'}`}>
                    {atingiu ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {(mediaCat - target > 0 ? '+' : '') + (mediaCat - target).toFixed(2)}
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span>{summary.count} veículos</span>
                <span>{summary.liters.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela de Fechamento por Veículo */}
      <Card className="bg-seguranca-graphite border-gray-700 shadow-md">
        <CardHeader className="p-4 border-b border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Bus className="h-5 w-5 text-seguranca-yellow" />
              Controle de Abastecimento e Eficiência da Frota ({filteredVehicles.length} veículos)
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Buscar frota ou placa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 text-xs bg-gray-900 border-gray-700 text-white w-48"
            />

            {activeCategoryFilter !== 'ALL' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategoryFilter('ALL')}
                className="h-8 text-xs text-seguranca-yellow hover:text-white"
              >
                Limpar Filtro
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-seguranca-black/80">
                <TableRow className="border-gray-700">
                  <TableHead className="text-xs text-gray-300 font-semibold py-3">Frota</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3">Veículo / Placa</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3">Categoria</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">KM Mensal</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">Consumo (L)</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">Média Real (km/l)</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">Meta (km/l)</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">Desvio</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-center">Desempenho</TableHead>
                  <TableHead className="text-xs text-gray-300 font-semibold py-3 text-right">Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-700/60">
                {filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500 text-xs">
                      Nenhum veículo encontrado para os filtros selecionados no mês de {monthNames[selectedMonth]}.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map(item => {
                    const v = item.vehicle;
                    const prefix = v.patrimonyNumber || (v as any).fleetNumber || '—';
                    const plate = v.plate || (v as any).placa || '—';

                    return (
                      <TableRow key={v.id} className="hover:bg-gray-800/40 transition-colors">
                        <TableCell className="font-mono font-bold text-white text-xs">
                          {prefix}
                        </TableCell>
                        <TableCell className="text-xs text-gray-200">
                          <div className="font-medium">{plate}</div>
                          <div className="text-[11px] text-gray-400">{v.model || v.brand || ''}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-[10px] bg-gray-800 border-gray-600 text-gray-300">
                            {CATEGORY_CONFIG[item.category].icon} {CATEGORY_CONFIG[item.category].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-gray-200">
                          {item.kmMensal > 0 ? item.kmMensal.toLocaleString('pt-BR') : '0'}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-amber-300 font-semibold">
                          {item.totalLiters > 0 ? item.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0.0'}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono font-bold">
                          {item.mediaRealizada > 0 ? (
                            <span className={item.mediaRealizada >= item.target ? 'text-emerald-400' : 'text-red-400'}>
                              {item.mediaRealizada.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-gray-400">
                          {item.target.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono">
                          {item.mediaRealizada > 0 ? (
                            <span className={item.desvio >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {item.desvio >= 0 ? `+${item.desvio.toFixed(2)}` : item.desvio.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.status === 'INACTIVE' && (
                            <Badge className="bg-gray-800 text-gray-400 border-gray-600 text-[10px]">
                              Locação / Parado
                            </Badge>
                          )}
                          {item.status === 'ABOVE' && (
                            <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-600 text-[10px] flex items-center justify-center gap-1 w-fit mx-auto">
                              <CheckCircle2 className="h-3 w-3" /> No Alvo
                            </Badge>
                          )}
                          {item.status === 'ON_TARGET' && (
                            <Badge className="bg-yellow-950/80 text-yellow-300 border-yellow-600 text-[10px] flex items-center justify-center gap-1 w-fit mx-auto">
                              Tolerância
                            </Badge>
                          )}
                          {item.status === 'BELOW' && (
                            <Badge className="bg-red-950/80 text-red-300 border-red-600 text-[10px] flex items-center justify-center gap-1 w-fit mx-auto">
                              <AlertTriangle className="h-3 w-3" /> Abaixo Meta
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs font-mono text-gray-300">
                          {item.totalCost > 0
                            ? item.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                            : 'R$ 0,00'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
