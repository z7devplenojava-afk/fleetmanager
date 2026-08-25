import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  History,
  Calendar,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Car,
  DollarSign,
  Fuel,
  Award,
  BarChart3,
  Activity,
} from 'lucide-react';
import { vehicleFuelEfficiencyService, VehicleFuelEfficiency } from '@/services/vehicleFuelEfficiencyService';
import { FuelRecord, Vehicle } from '@/types/fleet';
import fleetService from '@/services/fleetService';

interface EfficiencyAlertsHistoryProps {
  vehicles?: { id: string; plate: string; model: string; brand: string }[];
}

type PeriodView = 'monthly' | 'quarterly' | 'yearly';

interface MonthlyAlertSnapshot {
  month: string;
  label: string;
  totalVehicles: number;
  avgEfficiency: number;
  critical: number;
  warning: number;
  info: number;
  positive: number;
  totalAlerts: number;
  potentialSavings: number;
  worstVehicle: { plate: string; efficiency: number } | null;
  bestVehicle: { plate: string; efficiency: number } | null;
}

interface VehicleTrend {
  vehiclePlate: string;
  vehicleName: string;
  months: { month: string; efficiency: number; costPerKm: number }[];
  trend: 'improving' | 'stable' | 'declining';
  trendPercent: number;
}

const THRESHOLDS = { critical: -25, warning: -15, info: -5, excellent: 20 };

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const EfficiencyAlertsHistory: React.FC<EfficiencyAlertsHistoryProps> = ({ vehicles = [] }) => {
  const [fuelRecords, setFuelRecords] = useState<FuelRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodView, setPeriodView] = useState<PeriodView>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const records = await fleetService.getFuelRecords();
      setFuelRecords(records);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar registros por período customizado
  const filteredRecords = useMemo(() => {
    let records = [...fuelRecords];
    if (startDate) records = records.filter((r) => r.date >= startDate);
    if (endDate) records = records.filter((r) => r.date <= endDate);
    return records;
  }, [fuelRecords, startDate, endDate]);

  // Calcular eficiência por veículo para um conjunto de registros
  const calculateEfficiencyForPeriod = useMemo(() => {
    return (records: FuelRecord[]): VehicleFuelEfficiency[] => {
      const vehicleMap = new Map<string, { records: FuelRecord[]; plate: string }>();

      records.forEach((r) => {
        const vid = r.vehicleId || 'unknown';
        if (!vehicleMap.has(vid)) {
          vehicleMap.set(vid, { records: [], plate: r.vehiclePlate || 'N/I' });
        }
        vehicleMap.get(vid)!.records.push(r);
      });

      const results: VehicleFuelEfficiency[] = [];
      const validEfficiencies: number[] = [];

      vehicleMap.forEach(({ records: vRecords, plate }) => {
        if (vRecords.length < 2) return;

        vRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        let totalDistance = 0;
        for (let i = 1; i < vRecords.length; i++) {
          const dist = (vRecords[i].mileage || 0) - (vRecords[i - 1].mileage || 0);
          if (dist > 0) totalDistance += dist;
        }

        const totalFuel = vRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
        const totalCost = vRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

        if (totalDistance <= 0 || totalFuel <= 0) return;

        const efficiency = totalDistance / totalFuel;
        const consumption = totalFuel / totalDistance;
        const costPerKm = totalCost / totalDistance;

        validEfficiencies.push(efficiency);

        results.push({
          vehicleId: vRecords[0].vehicleId || '',
          vehiclePlate: plate,
          vehicleName: plate,
          efficiencyKmPerLiter: efficiency,
          consumptionLPerKm: consumption,
          costPerKm,
          totalFuelConsumed: totalFuel,
          totalCost,
          totalDistance,
          totalRecords: vRecords.length,
        } as VehicleFuelEfficiency);
      });

      // Anexar média para cálculo de alertas
      const avg = validEfficiencies.length > 0
        ? validEfficiencies.reduce((a, b) => a + b, 0) / validEfficiencies.length
        : 0;

      return results.map((r) => ({ ...r, _avg: avg } as any));
    };
  }, []);

  // Snapshots mensais de alertas
  const monthlySnapshots = useMemo((): MonthlyAlertSnapshot[] => {
    if (filteredRecords.length === 0) return [];

    // Agrupar registros por mês
    const monthMap = new Map<string, FuelRecord[]>();
    filteredRecords.forEach((r) => {
      const monthKey = r.date?.substring(0, 7) || 'sem-data';
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
      monthMap.get(monthKey)!.push(r);
    });

    // Gerar snapshot para cada mês
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, records]) => {
        const efficiencies = calculateEfficiencyForPeriod(records);
        const validEff = efficiencies.filter((e) => e.efficiencyKmPerLiter > 0);
        const avg = validEff.length > 0
          ? validEff.reduce((s, e) => s + e.efficiencyKmPerLiter, 0) / validEff.length
          : 0;

        let critical = 0, warning = 0, info = 0, positive = 0;
        let potentialSavings = 0;
        let worstEff = Infinity, bestEff = 0;
        let worstPlate = '', bestPlate = '';

        validEff.forEach((e) => {
          const dev = ((e.efficiencyKmPerLiter - avg) / avg) * 100;

          if (dev <= THRESHOLDS.critical) { critical++; potentialSavings += e.costPerKm * e.totalDistance * 0.15; }
          else if (dev <= THRESHOLDS.warning) { warning++; potentialSavings += e.costPerKm * e.totalDistance * 0.10; }
          else if (dev <= THRESHOLDS.info) { info++; }
          else if (dev >= THRESHOLDS.excellent) { positive++; }

          if (e.efficiencyKmPerLiter < worstEff) { worstEff = e.efficiencyKmPerLiter; worstPlate = e.vehiclePlate; }
          if (e.efficiencyKmPerLiter > bestEff) { bestEff = e.efficiencyKmPerLiter; bestPlate = e.vehiclePlate; }
        });

        const [y, m] = month.split('-');
        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const label = `${monthNames[parseInt(m, 10) - 1]}/${y?.slice(2) || ''}`;

        return {
          month,
          label,
          totalVehicles: validEff.length,
          avgEfficiency: avg,
          critical,
          warning,
          info,
          positive,
          totalAlerts: critical + warning + info,
          potentialSavings,
          worstVehicle: worstPlate ? { plate: worstPlate, efficiency: worstEff } : null,
          bestVehicle: bestPlate ? { plate: bestPlate, efficiency: bestEff } : null,
        };
      });
  }, [filteredRecords, calculateEfficiencyForPeriod]);

  // Dados consolidados por trimestre
  const quarterlySnapshots = useMemo(() => {
    const quarterMap = new Map<string, MonthlyAlertSnapshot[]>();
    monthlySnapshots.forEach((s) => {
      const [y, m] = s.month.split('-');
      const q = Math.ceil(parseInt(m) / 3);
      const key = `${y}-Q${q}`;
      if (!quarterMap.has(key)) quarterMap.set(key, []);
      quarterMap.get(key)!.push(s);
    });

    return Array.from(quarterMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([quarter, snaps]) => ({
        month: quarter,
        label: quarter,
        totalVehicles: Math.max(...snaps.map((s) => s.totalVehicles)),
        avgEfficiency: snaps.reduce((s, sn) => s + sn.avgEfficiency, 0) / snaps.length,
        critical: snaps.reduce((s, sn) => s + sn.critical, 0),
        warning: snaps.reduce((s, sn) => s + sn.warning, 0),
        info: snaps.reduce((s, sn) => s + sn.info, 0),
        positive: snaps.reduce((s, sn) => s + sn.positive, 0),
        totalAlerts: snaps.reduce((s, sn) => s + sn.totalAlerts, 0),
        potentialSavings: snaps.reduce((s, sn) => s + sn.potentialSavings, 0),
        worstVehicle: snaps[snaps.length - 1]?.worstVehicle || null,
        bestVehicle: snaps[snaps.length - 1]?.bestVehicle || null,
      }));
  }, [monthlySnapshots]);

  // Dados consolidados por ano
  const yearlySnapshots = useMemo(() => {
    const yearMap = new Map<string, MonthlyAlertSnapshot[]>();
    monthlySnapshots.forEach((s) => {
      const year = s.month.split('-')[0];
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(s);
    });

    return Array.from(yearMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, snaps]) => ({
        month: year,
        label: year,
        totalVehicles: Math.max(...snaps.map((s) => s.totalVehicles)),
        avgEfficiency: snaps.reduce((s, sn) => s + sn.avgEfficiency, 0) / snaps.length,
        critical: snaps.reduce((s, sn) => s + sn.critical, 0),
        warning: snaps.reduce((s, sn) => s + sn.warning, 0),
        info: snaps.reduce((s, sn) => s + sn.info, 0),
        positive: snaps.reduce((s, sn) => s + sn.positive, 0),
        totalAlerts: snaps.reduce((s, sn) => s + sn.totalAlerts, 0),
        potentialSavings: snaps.reduce((s, sn) => s + sn.potentialSavings, 0),
        worstVehicle: null,
        bestVehicle: null,
      }));
  }, [monthlySnapshots]);

  const activeSnapshots = periodView === 'monthly' ? monthlySnapshots
    : periodView === 'quarterly' ? quarterlySnapshots
    : yearlySnapshots;

  // Estatísticas gerais
  const overallStats = useMemo(() => {
    if (activeSnapshots.length === 0) return { totalCritical: 0, totalWarning: 0, totalInfo: 0, totalPositive: 0, totalSavings: 0, avgEffTrend: 0 };

    const totalCritical = activeSnapshots.reduce((s, sn) => s + sn.critical, 0);
    const totalWarning = activeSnapshots.reduce((s, sn) => s + sn.warning, 0);
    const totalInfo = activeSnapshots.reduce((s, sn) => s + sn.info, 0);
    const totalPositive = activeSnapshots.reduce((s, sn) => s + sn.positive, 0);
    const totalSavings = activeSnapshots.reduce((s, sn) => s + sn.potentialSavings, 0);

    // Tendência da eficiência
    let avgEffTrend = 0;
    if (activeSnapshots.length >= 2) {
      const first = activeSnapshots[0].avgEfficiency;
      const last = activeSnapshots[activeSnapshots.length - 1].avgEfficiency;
      avgEffTrend = first > 0 ? ((last - first) / first) * 100 : 0;
    }

    return { totalCritical, totalWarning, totalInfo, totalPositive, totalSavings, avgEffTrend };
  }, [activeSnapshots]);

  // Tendência por veículo
  const vehicleTrends = useMemo((): VehicleTrend[] => {
    if (monthlySnapshots.length < 2) return [];

    const vehicleMap = new Map<string, { months: { month: string; efficiency: number; costPerKm: number }[] }>();

    // Recalcular eficiência mensal por veículo
    const monthMap = new Map<string, FuelRecord[]>();
    filteredRecords.forEach((r) => {
      const mk = r.date?.substring(0, 7) || 'sem-data';
      if (!monthMap.has(mk)) monthMap.set(mk, []);
      monthMap.get(mk)!.push(r);
    });

    monthMap.forEach((records, month) => {
      const vMap = new Map<string, FuelRecord[]>();
      records.forEach((r) => {
        const vid = r.vehicleId || 'unknown';
        if (!vMap.has(vid)) vMap.set(vid, []);
        vMap.get(vid)!.push(r);
      });

      vMap.forEach((vRecords, vid) => {
        if (vRecords.length < 2) return;
        vRecords.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

        let totalDist = 0;
        for (let i = 1; i < vRecords.length; i++) {
          const d = (vRecords[i].mileage || 0) - (vRecords[i - 1].mileage || 0);
          if (d > 0) totalDist += d;
        }
        const totalFuel = vRecords.reduce((s, r) => s + (r.quantity || 0), 0);
        const totalCost = vRecords.reduce((s, r) => s + (r.cost || 0), 0);

        if (totalDist <= 0 || totalFuel <= 0) return;

        const plate = vRecords[0].vehiclePlate || vid;
        if (!vehicleMap.has(plate)) vehicleMap.set(plate, { months: [] });
        vehicleMap.get(plate)!.months.push({
          month,
          efficiency: totalDist / totalFuel,
          costPerKm: totalCost / totalDist,
        });
      });
    });

    return Array.from(vehicleMap.entries())
      .map(([plate, data]) => {
        const sorted = data.months.sort((a, b) => a.month.localeCompare(b.month));
        let trend: 'improving' | 'stable' | 'declining' = 'stable';
        let trendPercent = 0;

        if (sorted.length >= 2) {
          const first = sorted[0].efficiency;
          const last = sorted[sorted.length - 1].efficiency;
          trendPercent = first > 0 ? ((last - first) / first) * 100 : 0;

          if (trendPercent > 5) trend = 'improving';
          else if (trendPercent < -5) trend = 'declining';
        }

        return {
          vehiclePlate: plate,
          vehicleName: plate,
          months: sorted,
          trend,
          trendPercent,
        };
      })
      .filter((v) => v.months.length >= 2)
      .sort((a, b) => {
        const order = { improving: 0, stable: 1, declining: 2 };
        return order[a.trend] - order[b.trend] || a.trendPercent - b.trendPercent;
      });
  }, [filteredRecords, monthlySnapshots]);

  // Exportar PDF (simplificado)
  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      if (format === 'excel') {
        const blob = await fleetService.exportFuelRecordsExcel({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-alertas-eficiencia-${new Date().toISOString().split('T')[0]}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = await fleetService.exportFuelRecordsPDF({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-alertas-eficiencia-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
    } finally {
      setIsExporting(false);
    }
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
            <p className="text-gray-400">Carregando histórico de alertas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-blue-400" />
          Histórico de Alertas de Eficiência
        </h3>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" disabled={isExporting} className="border-green-600 text-green-400 hover:bg-green-900/30">
            {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
            PDF
          </Button>
          <Button onClick={() => handleExport('excel')} variant="outline" size="sm" disabled={isExporting} className="border-blue-600 text-blue-400 hover:bg-blue-900/30">
            {isExporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
            Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-seguranca-lightgray">
              <Filter className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">Período:</span>
            </div>

            <div className="flex rounded-lg border border-gray-600 overflow-hidden">
              {([
                { type: 'monthly' as PeriodView, label: 'Mensal' },
                { type: 'quarterly' as PeriodView, label: 'Trimestral' },
                { type: 'yearly' as PeriodView, label: 'Anual' },
              ]).map((p) => (
                <button
                  key={p.type}
                  onClick={() => setPeriodView(p.type)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    periodView === p.type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[140px]" />
              <span className="text-gray-400 text-xs">até</span>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[140px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-red-900/30"><AlertOctagon className="h-4 w-4 text-red-400" /></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Críticos</p>
                <p className="text-lg font-bold text-red-400">{overallStats.totalCritical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-900/30"><AlertTriangle className="h-4 w-4 text-orange-400" /></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Alertas</p>
                <p className="text-lg font-bold text-orange-400">{overallStats.totalWarning}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-900/30"><CheckCircle className="h-4 w-4 text-green-400" /></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Excelentes</p>
                <p className="text-lg font-bold text-green-400">{overallStats.totalPositive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-purple-900/30">
                {overallStats.avgEffTrend >= 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Tendência</p>
                <p className={`text-lg font-bold ${overallStats.avgEffTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {overallStats.avgEffTrend >= 0 ? '+' : ''}{overallStats.avgEffTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-yellow-900/30"><DollarSign className="h-4 w-4 text-yellow-400" /></div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Economia Perdida</p>
                <p className="text-sm font-bold text-yellow-400">{formatCurrency(overallStats.totalSavings)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução de Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-400" />
              Evolução de Alertas por Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={activeSnapshots} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="top"
                  height={30}
                  formatter={(value) => <span className="text-gray-300 text-xs">{value}</span>}
                />
                <Bar dataKey="critical" name="Críticos" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="warning" name="Alertas" fill="#f97316" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="info" name="Info" fill="#3b82f6" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              Eficiência Média da Frota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={activeSnapshots} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradEfficiency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v.toFixed(2)} km/L`, 'Eficiência Média']} />
                <Area type="monotone" dataKey="avgEfficiency" stroke="#22c55e" strokeWidth={2} fill="url(#gradEfficiency)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Economia Potencial e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              Economia Potencial Perdida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activeSnapshots} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Economia Perdida']} />
                <Bar dataKey="potentialSavings" fill="#eab308" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Distribuição Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Críticos', value: overallStats.totalCritical },
                    { name: 'Alertas', value: overallStats.totalWarning },
                    { name: 'Informativos', value: overallStats.totalInfo },
                    { name: 'Excelentes', value: overallStats.totalPositive },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  <Cell fill="#ef4444" />
                  <Cell fill="#f97316" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#22c55e" />
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend verticalAlign="bottom" height={36} formatter={(v) => <span className="text-gray-300 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tendência por Veículo */}
      {vehicleTrends.length > 0 && (
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <Car className="h-4 w-4 text-cyan-400" />
              Tendência de Eficiência por Veículo
              <span className="text-xs text-gray-400 font-normal ml-1">
                (últimos {monthlySnapshots.length} meses)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Veículo</th>
                    <th className="text-center py-2 px-2 text-gray-400 font-medium">Tendência</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Variação</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">1º Mês</th>
                    <th className="text-right py-2 px-2 text-gray-400 font-medium">Último Mês</th>
                    <th className="text-left py-2 px-2 text-gray-400 font-medium">Evolução</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleTrends.map((vt, idx) => {
                    const firstEff = vt.months[0]?.efficiency || 0;
                    const lastEff = vt.months[vt.months.length - 1]?.efficiency || 0;
                    const trendIcon = vt.trend === 'improving' ? <TrendingUp className="h-4 w-4 text-green-400" />
                      : vt.trend === 'declining' ? <TrendingDown className="h-4 w-4 text-red-400" />
                      : <Activity className="h-4 w-4 text-yellow-400" />;
                    const trendColor = vt.trend === 'improving' ? 'text-green-400'
                      : vt.trend === 'declining' ? 'text-red-400'
                      : 'text-yellow-400';
                    const trendLabel = vt.trend === 'improving' ? 'Melhorando'
                      : vt.trend === 'declining' ? 'Piorando'
                      : 'Estável';

                    return (
                      <tr key={vt.vehiclePlate || idx} className={`border-b border-gray-700/50 ${idx % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                        <td className="py-2 px-2 text-gray-200 font-medium">{vt.vehiclePlate}</td>
                        <td className="py-2 px-2 text-center">
                          <div className={`flex items-center justify-center gap-1 ${trendColor}`}>
                            {trendIcon}
                            <span className="text-xs font-medium">{trendLabel}</span>
                          </div>
                        </td>
                        <td className={`py-2 px-2 text-right font-medium ${trendColor}`}>
                          {vt.trendPercent >= 0 ? '+' : ''}{vt.trendPercent.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-right text-gray-300">{firstEff.toFixed(2)} km/L</td>
                        <td className="py-2 px-2 text-right text-gray-300">{lastEff.toFixed(2)} km/L</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-0.5">
                            {vt.months.slice(-6).map((m, i) => (
                              <div
                                key={i}
                                className="w-2 rounded-sm"
                                style={{
                                  height: `${Math.max(4, (m.efficiency / Math.max(...vt.months.map((x) => x.efficiency))) * 20)}px`,
                                  backgroundColor: m.efficiency >= (vt.months.reduce((s, x) => s + x.efficiency, 0) / vt.months.length)
                                    ? '#22c55e' : '#ef4444',
                                }}
                                title={`${m.month}: ${m.efficiency.toFixed(2)} km/L`}
                              />
                            ))}
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
      )}

      {/* Tabela Detalhada do Histórico */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-400" />
            Detalhamento por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Período</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Veículos</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">km/L Médio</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">🔴 Críticos</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">🟠 Alertas</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">🔵 Info</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-medium">🟢 Excelentes</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-medium">Economia</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Pior</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-medium">Melhor</th>
                </tr>
              </thead>
              <tbody>
                {activeSnapshots.map((snap, idx) => (
                  <tr key={snap.month} className={`border-b border-gray-700/50 ${idx % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                    <td className="py-2 px-2 text-gray-200 font-medium">{snap.label}</td>
                    <td className="py-2 px-2 text-right text-gray-300">{snap.totalVehicles}</td>
                    <td className="py-2 px-2 text-right">
                      <span className="text-blue-400 font-medium">{snap.avgEfficiency.toFixed(2)}</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {snap.critical > 0 && <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full text-xs font-medium">{snap.critical}</span>}
                      {snap.critical === 0 && <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {snap.warning > 0 && <span className="bg-orange-900/50 text-orange-300 px-2 py-0.5 rounded-full text-xs font-medium">{snap.warning}</span>}
                      {snap.warning === 0 && <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {snap.info > 0 && <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full text-xs font-medium">{snap.info}</span>}
                      {snap.info === 0 && <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {snap.positive > 0 && <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded-full text-xs font-medium">{snap.positive}</span>}
                      {snap.positive === 0 && <span className="text-gray-600">—</span>}
                    </td>
                    <td className="py-2 px-2 text-right text-yellow-400 font-medium">{formatCurrency(snap.potentialSavings)}</td>
                    <td className="py-2 px-2 text-gray-300">
                      {snap.worstVehicle ? `${snap.worstVehicle.plate} (${snap.worstVehicle.efficiency.toFixed(1)})` : '—'}
                    </td>
                    <td className="py-2 px-2 text-gray-300">
                      {snap.bestVehicle ? `${snap.bestVehicle.plate} (${snap.bestVehicle.efficiency.toFixed(1)})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              {activeSnapshots.length > 1 && (
                <tfoot>
                  <tr className="border-t border-gray-600 bg-gray-800/50">
                    <td className="py-2 px-2 text-gray-400 font-bold">TOTAL</td>
                    <td className="py-2 px-2 text-right text-gray-400">—</td>
                    <td className="py-2 px-2 text-right text-blue-400 font-bold">
                      {(activeSnapshots.reduce((s, sn) => s + sn.avgEfficiency, 0) / activeSnapshots.length).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-center text-red-400 font-bold">{overallStats.totalCritical}</td>
                    <td className="py-2 px-2 text-center text-orange-400 font-bold">{overallStats.totalWarning}</td>
                    <td className="py-2 px-2 text-center text-blue-400 font-bold">{overallStats.totalInfo}</td>
                    <td className="py-2 px-2 text-center text-green-400 font-bold">{overallStats.totalPositive}</td>
                    <td className="py-2 px-2 text-right text-yellow-400 font-bold">{formatCurrency(overallStats.totalSavings)}</td>
                    <td className="py-2 px-2 text-gray-400">—</td>
                    <td className="py-2 px-2 text-gray-400">—</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EfficiencyAlertsHistory;
