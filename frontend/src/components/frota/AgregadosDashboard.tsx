import React, { useState, useMemo, useRef } from 'react';
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
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Bus,
  CreditCard,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Vehicle } from '@/types/fleet';
import { agregadosDashboardPDFService } from '@/services/agregadosDashboardPDFService';

interface AgregadosDashboardProps {
  veiculos: Vehicle[];
}

type PeriodType = 'mensal' | 'trimestral' | 'anual' | 'custom';

interface PeriodRange {
  label: string;
  start: Date;
  end: Date;
  months: number;
}

const PAYMENT_COLORS: Record<string, string> = {
  DAILY: '#f97316',
  MONTHLY: '#3b82f6',
  PER_TRIP: '#22c55e',
  PERCENTAGE: '#a855f7',
};

const PAYMENT_LABELS: Record<string, string> = {
  DAILY: 'Diário',
  MONTHLY: 'Mensal',
  PER_TRIP: 'Por Viagem',
  PERCENTAGE: 'Percentual',
};

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function getPeriodRange(periodType: PeriodType, referenceDate: Date, customStart?: string, customEnd?: string): PeriodRange {
  const ref = new Date(referenceDate);

  if (periodType === 'custom' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    return {
      label: `${start.toLocaleDateString('pt-BR')} — ${end.toLocaleDateString('pt-BR')}`,
      start,
      end,
      months,
    };
  }

  if (periodType === 'mensal') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      label: `${MONTH_NAMES[ref.getMonth()]} ${ref.getFullYear()}`,
      start,
      end,
      months: 1,
    };
  }

  if (periodType === 'trimestral') {
    const quarter = Math.floor(ref.getMonth() / 3);
    const start = new Date(ref.getFullYear(), quarter * 3, 1);
    const end = new Date(ref.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
    const qLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
    return {
      label: `${qLabels[quarter]} ${ref.getFullYear()}`,
      start,
      end,
      months: 3,
    };
  }

  // anual
  const start = new Date(ref.getFullYear(), 0, 1);
  const end = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
  return {
    label: `${ref.getFullYear()}`,
    start,
    end,
    months: 12,
  };
}

function isContractActiveInPeriod(vehicle: Vehicle, periodStart: Date, periodEnd: Date): boolean {
  const contractStart = vehicle.aggregatedContractStartDate
    ? new Date(vehicle.aggregatedContractStartDate)
    : null;
  const contractEnd = vehicle.aggregatedContractEndDate
    ? new Date(vehicle.aggregatedContractEndDate)
    : null;

  // Se não tem datas de contrato, considerar ativo
  if (!contractStart && !contractEnd) return true;

  // Se tem início mas não tem fim, considerar ativo a partir do início
  if (contractStart && !contractEnd) {
    return contractStart <= periodEnd;
  }

  // Se tem fim mas não tem início, considerar ativo até o fim
  if (!contractStart && contractEnd) {
    return contractEnd >= periodStart;
  }

  // Contrato se sobrepõe ao período se: início do contrato <= fim do período E fim do contrato >= início do período
  return contractStart! <= periodEnd && contractEnd! >= periodStart;
}

function calculatePeriodRevenue(vehicle: Vehicle, months: number): number {
  const dailyRate = vehicle.aggregatedDailyRate || 0;
  const monthlyRate = vehicle.aggregatedMonthlyRate || 0;

  switch (vehicle.aggregatedPaymentType) {
    case 'DAILY':
      return dailyRate * 30 * months;
    case 'MONTHLY':
      return monthlyRate * months;
    case 'PER_TRIP':
      return dailyRate * 22 * months;
    case 'PERCENTAGE':
      return monthlyRate * months;
    default:
      return 0;
  }
}

function calculateMonthlyRevenue(vehicle: Vehicle): number {
  const dailyRate = vehicle.aggregatedDailyRate || 0;
  const monthlyRate = vehicle.aggregatedMonthlyRate || 0;

  switch (vehicle.aggregatedPaymentType) {
    case 'DAILY':
      return dailyRate * 30;
    case 'MONTHLY':
      return monthlyRate;
    case 'PER_TRIP':
      return dailyRate * 22;
    case 'PERCENTAGE':
      return monthlyRate;
    default:
      return 0;
  }
}

function navigatePeriod(periodType: PeriodType, currentDate: Date, direction: 'prev' | 'next'): Date {
  const d = new Date(currentDate);
  const delta = direction === 'next' ? 1 : -1;

  if (periodType === 'mensal') {
    d.setMonth(d.getMonth() + delta);
  } else if (periodType === 'trimestral') {
    d.setMonth(d.getMonth() + delta * 3);
  } else {
    d.setFullYear(d.getFullYear() + delta);
  }

  return d;
}

const AgregadosDashboard: React.FC<AgregadosDashboardProps> = ({ veiculos }) => {
  const [periodType, setPeriodType] = useState<PeriodType>('mensal');
  const [referenceDate, setReferenceDate] = useState<Date>(new Date());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const aggregatedVehicles = useMemo(
    () => veiculos.filter((v) => v.isAggregated),
    [veiculos]
  );

  // Período selecionado
  const period = useMemo(
    () => getPeriodRange(periodType, referenceDate, customStart, customEnd),
    [periodType, referenceDate, customStart, customEnd]
  );

  // Veículos ativos no período
  const activeVehicles = useMemo(
    () => aggregatedVehicles.filter((v) => isContractActiveInPeriod(v, period.start, period.end)),
    [aggregatedVehicles, period]
  );

  // KPIs baseados no período
  const totalAggregated = activeVehicles.length;

  const totalPeriodRevenue = useMemo(() => {
    return activeVehicles.reduce((sum, v) => sum + calculatePeriodRevenue(v, period.months), 0);
  }, [activeVehicles, period.months]);

  const totalMonthlyRevenue = useMemo(() => {
    return activeVehicles.reduce((sum, v) => sum + calculateMonthlyRevenue(v), 0);
  }, [activeVehicles]);

  const totalDailyRevenue = useMemo(() => {
    return activeVehicles.reduce((sum, v) => {
      if (v.aggregatedPaymentType === 'DAILY' || v.aggregatedPaymentType === 'PER_TRIP') {
        return sum + (v.aggregatedDailyRate || 0);
      }
      return sum;
    }, 0);
  }, [activeVehicles]);

  const totalAnnualRevenue = totalMonthlyRevenue * 12;

  // Contratos vencidos / vencendo
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredContracts = aggregatedVehicles.filter((v) => {
    if (!v.aggregatedContractEndDate) return false;
    return new Date(v.aggregatedContractEndDate) < today;
  }).length;

  const expiringSoonContracts = aggregatedVehicles.filter((v) => {
    if (!v.aggregatedContractEndDate) return false;
    const endDate = new Date(v.aggregatedContractEndDate);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return endDate >= today && endDate <= thirtyDaysFromNow;
  }).length;

  // Receita por tipo de pagamento (apenas veículos ativos no período)
  const revenueByPaymentType = useMemo(() => {
    const grouped: Record<string, { count: number; dailyRevenue: number; monthlyRevenue: number }> = {};

    activeVehicles.forEach((v) => {
      const type = v.aggregatedPaymentType || 'DAILY';
      if (!grouped[type]) {
        grouped[type] = { count: 0, dailyRevenue: 0, monthlyRevenue: 0 };
      }
      grouped[type].count += 1;
      if (type === 'DAILY' || type === 'PER_TRIP') {
        grouped[type].dailyRevenue += v.aggregatedDailyRate || 0;
      }
      if (type === 'MONTHLY' || type === 'PERCENTAGE') {
        grouped[type].monthlyRevenue += v.aggregatedMonthlyRate || 0;
      }
    });

    return Object.entries(grouped).map(([type, data]) => ({
      type,
      label: PAYMENT_LABELS[type] || type,
      count: data.count,
      dailyRevenue: data.dailyRevenue,
      monthlyRevenue: data.monthlyRevenue,
      totalMonthly:
        type === 'DAILY' || type === 'PER_TRIP'
          ? data.dailyRevenue * 30
          : data.monthlyRevenue,
      periodRevenue:
        type === 'DAILY' || type === 'PER_TRIP'
          ? data.dailyRevenue * 30 * period.months
          : data.monthlyRevenue * period.months,
    }));
  }, [activeVehicles, period.months]);

  // Dados para gráfico de barras — Receita por veículo no período
  const barChartData = useMemo(() => {
    return activeVehicles
      .map((v) => ({
        name: v.plate || 'S/N',
        receita: calculatePeriodRevenue(v, period.months),
        proprietario: v.aggregatedOwnerName || 'N/I',
        mensal: calculateMonthlyRevenue(v),
      }))
      .filter((item) => item.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 12);
  }, [activeVehicles, period.months]);

  // Dados para gráfico de pizza
  const pieChartData = revenueByPaymentType.map((item) => ({
    name: item.label,
    value: item.periodRevenue,
    count: item.count,
  }));

  const pieColors = revenueByPaymentType.map(
    (item) => PAYMENT_COLORS[item.type] || '#6b7280'
  );

  // Dados para gráfico de evolução mensal (últimos 12 meses)
  const monthlyEvolutionData = useMemo(() => {
    const months: { month: string; receita: number; acumulado: number }[] = [];
    let acumulado = 0;

    for (let i = 11; i >= 0; i--) {
      const d = new Date(referenceDate);
      d.setMonth(d.getMonth() - i);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      const vehiclesInMonth = aggregatedVehicles.filter((v) =>
        isContractActiveInPeriod(v, monthStart, monthEnd)
      );

      const monthRevenue = vehiclesInMonth.reduce(
        (sum, v) => sum + calculateMonthlyRevenue(v),
        0
      );

      acumulado += monthRevenue;

      months.push({
        month: `${MONTH_NAMES[d.getMonth()]}${d.getFullYear().toString().slice(2)}`,
        receita: monthRevenue,
        acumulado,
      });
    }

    return months;
  }, [aggregatedVehicles, referenceDate]);

  // Métricas de mercado (veículos ativos)
  const totalMarketValue = activeVehicles.reduce(
    (sum, v) => sum + (Number(v.marketValue) || 0),
    0
  );

  const avgDailyRate =
    totalAggregated > 0
      ? activeVehicles.reduce((sum, v) => sum + (v.aggregatedDailyRate || 0), 0) / totalAggregated
      : 0;

  const avgMonthlyRate =
    totalAggregated > 0
      ? activeVehicles.reduce((sum, v) => sum + calculateMonthlyRevenue(v), 0) / totalAggregated
      : 0;

  // Função de exportação PDF
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      await agregadosDashboardPDFService.generatePDFFromElement(
        dashboardRef.current,
        {
          periodLabel: period.label,
          periodStart: period.start,
          periodEnd: period.end,
          periodMonths: period.months,
          vehicles: aggregatedVehicles,
        }
      );
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (aggregatedVehicles.length === 0) {
    return (
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-seguranca-lightgray text-lg font-semibold mb-2">
              Nenhum agregado registrado
            </h3>
            <p className="text-gray-400 text-sm max-w-md">
              Cadastre veículos de agregados para visualizar o dashboard financeiro com métricas
              de receita, contratos e análise por tipo de pagamento.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" ref={dashboardRef}>
      {/* Barra de Filtros de Período */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Ícone */}
            <div className="flex items-center gap-2 text-seguranca-lightgray">
              <Filter className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">Período:</span>
            </div>

            {/* Botões de período */}
            <div className="flex rounded-lg border border-gray-600 overflow-hidden">
              {([
                { type: 'mensal' as PeriodType, label: 'Mensal' },
                { type: 'trimestral' as PeriodType, label: 'Trimestral' },
                { type: 'anual' as PeriodType, label: 'Anual' },
                { type: 'custom' as PeriodType, label: 'Personalizado' },
              ]).map((p) => (
                <button
                  key={p.type}
                  onClick={() => setPeriodType(p.type)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    periodType === p.type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Navegação (prev/next) — apenas para mensal/trimestral/anual */}
            {periodType !== 'custom' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReferenceDate(navigatePeriod(periodType, referenceDate, 'prev'))}
                  className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-seguranca-lightgray font-medium min-w-[120px] text-center">
                  {period.label}
                </span>
                <button
                  onClick={() => setReferenceDate(navigatePeriod(periodType, referenceDate, 'next'))}
                  className="p-1.5 rounded-md bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Date inputs para período customizado */}
            {periodType === 'custom' && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[150px]"
                  placeholder="Início"
                />
                <span className="text-gray-400 text-xs">até</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[150px]"
                  placeholder="Fim"
                />
              </div>
            )}

            {/* Botão Exportar PDF */}
            <Button
              onClick={handleExportPDF}
              disabled={isExporting || activeVehicles.length === 0}
              variant="outline"
              size="sm"
              className="border-green-600 text-green-400 hover:bg-green-900/30 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-1" />
              )}
              {isExporting ? 'Gerando...' : 'PDF'}
            </Button>

            {/* Indicador de veículos no período */}
            <div className="text-xs text-gray-400">
              <span className="text-blue-400 font-medium">{totalAggregated}</span> veículo{totalAggregated !== 1 ? 's' : ''} no período
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-900/30">
                <Users className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Agregados</p>
                <p className="text-lg font-bold text-orange-400">{totalAggregated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-900/30">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Receita Diária</p>
                <p className="text-lg font-bold text-green-400">
                  R$ {totalDailyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-blue-900/30">
                <TrendingUp className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Receita Mensal</p>
                <p className="text-lg font-bold text-blue-400">
                  R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-purple-900/30">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  Receita {periodType === 'mensal' ? 'Mensal' : periodType === 'trimestral' ? 'Trimestral' : periodType === 'anual' ? 'Anual' : 'no Período'}
                </p>
                <p className="text-lg font-bold text-purple-400">
                  R$ {totalPeriodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-red-900/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Contratos Vencidos</p>
                <p className="text-lg font-bold text-red-400">{expiredContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-yellow-900/30">
                <Clock className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Vencendo (30d)</p>
                <p className="text-lg font-bold text-yellow-400">{expiringSoonContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico de Barras — Receita no Período por Veículo */}
        <Card className="bg-seguranca-graphite border-gray-600 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              Receita no Período por Veículo
              <span className="text-xs text-gray-400 font-normal ml-1">({period.label})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={barChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `R$ ${value.toLocaleString('pt-BR')}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                    }}
                    formatter={(value: number, _name: string, props: any) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      `Receita ${period.label}`,
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return `${label} — ${item?.proprietario || ''}`;
                    }}
                  />
                  <Bar
                    dataKey="receita"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500">
                Nenhum veículo ativo no período selecionado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Pizza — Distribuição por Tipo de Pagamento */}
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-orange-400" />
              Distribuição por Tipo de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={false}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index] || '#6b7280'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                    }}
                    formatter={(value: number, _name: string, props: any) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                      `Receita no Período (${props.payload.count} veículos)`,
                    ]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-gray-300 text-xs">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução Mensal — Área */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            Evolução da Receita (Últimos 12 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={monthlyEvolutionData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradientReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradientAcumulado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#9ca3af"
                fontSize={10}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `${(value / 1000).toFixed(0)}k` : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#e5e7eb',
                }}
                formatter={(value: number, name: string) => [
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  name === 'receita' ? 'Receita Mensal' : 'Acumulado',
                ]}
              />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#gradientReceita)"
              />
              <Area
                type="monotone"
                dataKey="acumulado"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#gradientAcumulado)"
              />
              <Legend
                verticalAlign="top"
                height={30}
                formatter={(value) => (
                  <span className="text-gray-300 text-xs">
                    {value === 'receita' ? 'Receita Mensal' : 'Acumulado'}
                  </span>
                )}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métricas por Tipo de Pagamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {revenueByPaymentType.map((item) => (
          <Card key={item.type} className="bg-seguranca-graphite border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-seguranca-lightgray">
                  Pagamento {item.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    backgroundColor: `${PAYMENT_COLORS[item.type]}20`,
                    color: PAYMENT_COLORS[item.type],
                  }}
                >
                  {item.count} veículo{item.count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Receita no Período:</span>
                  <span className="text-green-400 font-medium">
                    R${' '}
                    {item.periodRevenue.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Receita Mensal:</span>
                  <span className="text-blue-400 font-medium">
                    R${' '}
                    {item.totalMonthly.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                {item.type === 'DAILY' || item.type === 'PER_TRIP' ? (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Valor Diário Total:</span>
                    <span className="text-gray-300">
                      R${' '}
                      {item.dailyRevenue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Valor Mensal Total:</span>
                    <span className="text-gray-300">
                      R${' '}
                      {item.monthlyRevenue.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Receita Anual Est.:</span>
                  <span className="text-purple-400 font-medium">
                    R${' '}
                    {(item.totalMonthly * 12).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor Médio Diário</p>
                <p className="text-lg font-bold text-green-400">
                  R${' '}
                  {avgDailyRate.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-900/30">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor Médio Mensal</p>
                <p className="text-lg font-bold text-blue-400">
                  R${' '}
                  {avgMonthlyRate.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-900/30">
                <Bus className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor de Mercado Total</p>
                <p className="text-lg font-bold text-purple-400">
                  R${' '}
                  {totalMarketValue.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-900/30">
                <CheckCircle className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Contratos Ativos</p>
                <p className="text-lg font-bold text-orange-400">
                  {totalAggregated}
                  <span className="text-xs text-gray-400 ml-1">
                    de {aggregatedVehicles.length}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgregadosDashboard;
