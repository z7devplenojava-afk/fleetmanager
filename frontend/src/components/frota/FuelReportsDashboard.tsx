import React, { useState, useMemo } from 'react';
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
  LineChart,
  Line,
} from 'recharts';
import {
  Fuel,
  DollarSign,
  TrendingUp,
  Calendar,
  Car,
  User,
  MapPin,
  Warehouse,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Route,
  History,
} from 'lucide-react';
import { FuelRecord, Vehicle } from '@/types/fleet';
import fleetService from '@/services/fleetService';
import FuelEfficiencyRanking from '@/components/frota/FuelEfficiencyRanking';
import EfficiencyAlertsHistory from '@/components/frota/EfficiencyAlertsHistory';
import { downloadFuelReportsPDF } from '@/utils/fuelReportsPDFGenerator';
import { useAuth } from '@/contexts/AuthContext';

interface FuelReportsDashboardProps {
  fuelRecords: FuelRecord[];
  vehicles: Vehicle[];
}

type ReportView = 'period' | 'vehicle' | 'worksite' | 'garage' | 'driver' | 'efficiency' | 'history';

const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  DIESEL: 'Diesel',
  FLEX: 'Flex',
};

const FUEL_TYPE_COLORS: Record<string, string> = {
  GASOLINE: '#ef4444',
  ETHANOL: '#22c55e',
  DIESEL: '#3b82f6',
  FLEX: '#a855f7',
};

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#6366f1'];

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatLiters(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

const FuelReportsDashboard: React.FC<FuelReportsDashboardProps> = ({ fuelRecords, vehicles }) => {
  const { user } = useAuth();

  // Filtros
  const [reportView, setReportView] = useState<ReportView>('period');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('ALL');
  const [selectedDriver, setSelectedDriver] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [selectedCostCenter, setSelectedCostCenter] = useState('ALL');
  const [selectedFuelType, setSelectedFuelType] = useState('ALL');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Listas únicas para filtros
  const uniqueDrivers = useMemo(() => {
    const driverMap = new Map<string, string>();
    fuelRecords.forEach((r) => {
      if (r.driver) {
        const name = typeof r.driver === 'string' ? r.driver : (r.driver as any)?.name || '';
        const id = typeof r.driver === 'string' ? r.driver : (r.driver as any)?.id || '';
        if (name && id) driverMap.set(id, name);
      }
    });
    return Array.from(driverMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [fuelRecords]);

  const uniqueStations = useMemo(() => {
    const stations = new Set<string>();
    fuelRecords.forEach((r) => {
      if (r.station) stations.add(r.station);
    });
    return Array.from(stations).sort();
  }, [fuelRecords]);

  const uniqueCostCenters = useMemo(() => {
    const centers = new Set<string>();
    fuelRecords.forEach((r) => {
      if ((r as any).costCenter) centers.add((r as any).costCenter);
    });
    return Array.from(centers).sort();
  }, [fuelRecords]);

  // Dados filtrados
  const filteredRecords = useMemo(() => {
    let records = [...fuelRecords];

    if (startDate) {
      records = records.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter((r) => r.date <= endDate);
    }
    if (selectedVehicleId !== 'ALL') {
      records = records.filter((r) => r.vehicleId === selectedVehicleId);
    }
    if (selectedDriver !== 'ALL') {
      records = records.filter((r) => {
        const driverId = typeof r.driver === 'string' ? r.driver : (r.driver as any)?.id;
        return driverId === selectedDriver;
      });
    }
    if (selectedStation !== 'ALL') {
      records = records.filter((r) => r.station === selectedStation);
    }
    if (selectedCostCenter !== 'ALL') {
      records = records.filter((r) => (r as any).costCenter === selectedCostCenter);
    }
    if (selectedFuelType !== 'ALL') {
      records = records.filter((r) => r.fuelType === selectedFuelType);
    }

    return records;
  }, [fuelRecords, startDate, endDate, selectedVehicleId, selectedDriver, selectedStation, selectedCostCenter, selectedFuelType]);

  // KPIs
  const kpis = useMemo(() => {
    const totalCost = filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalLiters = filteredRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;
    const avgCostPerRecord = filteredRecords.length > 0 ? totalCost / filteredRecords.length : 0;

    // Comparativo com período anterior (estimativa)
    const totalRecords = filteredRecords.length;
    const uniqueVehicles = new Set(filteredRecords.map((r) => r.vehicleId)).size;

    return { totalCost, totalLiters, avgPricePerLiter, avgCostPerRecord, totalRecords, uniqueVehicles };
  }, [filteredRecords]);

  // Dados para gráfico por período (mensal)
  const periodChartData = useMemo(() => {
    const monthMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      const monthKey = r.date?.substring(0, 7) || 'sem-data'; // YYYY-MM
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { cost: 0, liters: 0, count: 0 });
      }
      const data = monthMap.get(monthKey)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        label: (() => {
          const [y, m] = month.split('-');
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          return `${monthNames[parseInt(m, 10) - 1]}/${y?.slice(2) || ''}`;
        })(),
        custo: data.cost,
        litros: data.liters,
        abastecimentos: data.count,
        precoMedio: data.liters > 0 ? data.cost / data.liters : 0,
      }));
  }, [filteredRecords]);

  // Dados para gráfico por veículo
  const vehicleChartData = useMemo(() => {
    const vehicleMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      const plate = r.vehiclePlate || r.vehicleId || 'N/I';
      if (!vehicleMap.has(plate)) {
        vehicleMap.set(plate, { cost: 0, liters: 0, count: 0 });
      }
      const data = vehicleMap.get(plate)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(vehicleMap.entries())
      .map(([plate, data]) => ({
        placa: plate,
        custo: data.cost,
        litros: data.liters,
        abastecimentos: data.count,
        precoMedio: data.liters > 0 ? data.cost / data.liters : 0,
      }))
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 15);
  }, [filteredRecords]);

  // Dados para gráfico por obra/setor (costCenter)
  const worksiteChartData = useMemo(() => {
    const centerMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      const center = (r as any).costCenter || 'Não informado';
      if (!centerMap.has(center)) {
        centerMap.set(center, { cost: 0, liters: 0, count: 0 });
      }
      const data = centerMap.get(center)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(centerMap.entries())
      .map(([center, data]) => ({
        setor: center.length > 20 ? center.substring(0, 20) + '...' : center,
        setorFull: center,
        custo: data.cost,
        litros: data.liters,
        abastecimentos: data.count,
      }))
      .sort((a, b) => b.custo - a.custo);
  }, [filteredRecords]);

  // Dados para gráfico por garagem (station)
  const garageChartData = useMemo(() => {
    const stationMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      const station = r.station || 'Não informado';
      if (!stationMap.has(station)) {
        stationMap.set(station, { cost: 0, liters: 0, count: 0 });
      }
      const data = stationMap.get(station)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(stationMap.entries())
      .map(([station, data]) => ({
        posto: station.length > 25 ? station.substring(0, 25) + '...' : station,
        postoFull: station,
        custo: data.cost,
        litros: data.liters,
        abastecimentos: data.count,
        precoMedio: data.liters > 0 ? data.cost / data.liters : 0,
      }))
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 10);
  }, [filteredRecords]);

  // Dados para gráfico por motorista
  const driverChartData = useMemo(() => {
    const driverMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      let driverName = 'Não informado';
      if (r.driver) {
        driverName = typeof r.driver === 'string' ? r.driver : (r.driver as any)?.name || 'Não informado';
      }
      if (!driverMap.has(driverName)) {
        driverMap.set(driverName, { cost: 0, liters: 0, count: 0 });
      }
      const data = driverMap.get(driverName)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(driverMap.entries())
      .map(([name, data]) => ({
        motorista: name.length > 20 ? name.substring(0, 20) + '...' : name,
        motoristaFull: name,
        custo: data.cost,
        litros: data.liters,
        abastecimentos: data.count,
        precoMedio: data.liters > 0 ? data.cost / data.liters : 0,
      }))
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 10);
  }, [filteredRecords]);

  // Dados para pizza — tipo de combustível
  const fuelTypePieData = useMemo(() => {
    const typeMap = new Map<string, { cost: number; liters: number; count: number }>();

    filteredRecords.forEach((r) => {
      const type = r.fuelType || 'OUTRO';
      if (!typeMap.has(type)) {
        typeMap.set(type, { cost: 0, liters: 0, count: 0 });
      }
      const data = typeMap.get(type)!;
      data.cost += r.cost || 0;
      data.liters += r.quantity || 0;
      data.count += 1;
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      name: FUEL_TYPE_LABELS[type] || type,
      value: data.cost,
      litros: data.liters,
      count: data.count,
    }));
  }, [filteredRecords]);

  // Exportação PDF — Padrão OS Corporativo
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      const reportViewForPDF = ['period', 'vehicle', 'worksite', 'garage', 'driver'].includes(reportView)
        ? reportView as any
        : 'all';

      await downloadFuelReportsPDF({
        reportView: reportViewForPDF,
        fuelRecords: filteredRecords,
        vehicles,
        kpis,
        filters: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          vehicleId: selectedVehicleId,
          vehiclePlate: selectedVehicle?.plate,
          driver: selectedDriver,
          station: selectedStation,
          costCenter: selectedCostCenter,
          fuelType: selectedFuelType,
        },
        company: {
          name: (user as any)?.companyName || (user as any)?.empresa || undefined,
          cnpj: (user as any)?.companyCnpj || undefined,
          logoUrl: (user as any)?.companyLogoUrl || null,
        },
        userName: (user as any)?.name || (user as any)?.username || undefined,
      });
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Exportação Excel
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const blob = await fleetService.exportFuelRecordsExcel({
        vehicleId: selectedVehicleId !== 'ALL' ? selectedVehicleId : undefined,
        driverId: selectedDriver !== 'ALL' ? selectedDriver : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-abastecimento-${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const tooltipStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#e5e7eb',
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Linha 1: Período + Combustível + Botões */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-seguranca-lightgray">
                <Filter className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[140px]"
                  placeholder="Início"
                />
                <span className="text-gray-400 text-xs">até</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs w-[140px]"
                  placeholder="Fim"
                />
              </div>

              <select
                value={selectedFuelType}
                onChange={(e) => setSelectedFuelType(e.target.value)}
                className="bg-gray-700 border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1.5"
              >
                <option value="ALL">Todos Combustíveis</option>
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINE">Gasolina</option>
                <option value="ETHANOL">Etanol</option>
                <option value="FLEX">Flex</option>
              </select>

              <div className="ml-auto flex gap-2">
                <Button
                  onClick={handleExportPDF}
                  disabled={isExportingPDF || filteredRecords.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-green-600 text-green-400 hover:bg-green-900/30"
                >
                  {isExportingPDF ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                  PDF
                </Button>
                <Button
                  onClick={handleExportExcel}
                  disabled={isExportingExcel || filteredRecords.length === 0}
                  variant="outline"
                  size="sm"
                  className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                >
                  {isExportingExcel ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-1" />}
                  Excel
                </Button>
              </div>
            </div>

            {/* Linha 2: Veículo + Motorista + Posto + Setor */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Car className="h-3.5 w-3.5 text-blue-400" />
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1.5 max-w-[180px]"
                >
                  <option value="ALL">Todos Veículos</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-green-400" />
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1.5 max-w-[180px]"
                >
                  <option value="ALL">Todos Motoristas</option>
                  {uniqueDrivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-orange-400" />
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1.5 max-w-[180px]"
                >
                  <option value="ALL">Todas as Garagens</option>
                  {uniqueStations.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Warehouse className="h-3.5 w-3.5 text-purple-400" />
                <select
                  value={selectedCostCenter}
                  onChange={(e) => setSelectedCostCenter(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 text-xs rounded-md px-2 py-1.5 max-w-[180px]"
                >
                  <option value="ALL">Todos Setores/Obra</option>
                  {uniqueCostCenters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {(selectedVehicleId !== 'ALL' || selectedDriver !== 'ALL' || selectedStation !== 'ALL' || selectedCostCenter !== 'ALL' || selectedFuelType !== 'ALL' || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedVehicleId('ALL');
                    setSelectedDriver('ALL');
                    setSelectedStation('ALL');
                    setSelectedCostCenter('ALL');
                    setSelectedFuelType('ALL');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-900/30">
                <DollarSign className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Custo Total</p>
                <p className="text-sm font-bold text-green-400">{formatCurrency(kpis.totalCost)}</p>
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
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total Litros</p>
                <p className="text-sm font-bold text-blue-400">{formatLiters(kpis.totalLiters)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-orange-900/30">
                <TrendingUp className="h-4 w-4 text-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Preço Médio/L</p>
                <p className="text-sm font-bold text-orange-400">R$ {kpis.avgPricePerLiter.toFixed(3)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-purple-900/30">
                <BarChart3 className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Abastecimentos</p>
                <p className="text-sm font-bold text-purple-400">{kpis.totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-cyan-900/30">
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Custo Médio</p>
                <p className="text-sm font-bold text-cyan-400">{formatCurrency(kpis.avgCostPerRecord)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-600">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-yellow-900/30">
                <Car className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Veículos</p>
                <p className="text-sm font-bold text-yellow-400">{kpis.uniqueVehicles}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <div className="flex flex-wrap gap-2">
        {([
          { type: 'period' as ReportView, label: '📅 Por Período', icon: Calendar },
          { type: 'vehicle' as ReportView, label: '🚗 Por Veículo', icon: Car },
          { type: 'worksite' as ReportView, label: '🏗️ Por Obra/Setor', icon: Warehouse },
          { type: 'garage' as ReportView, label: '⛽ Por Garagem', icon: MapPin },
          { type: 'driver' as ReportView, label: '👤 Por Motorista', icon: User },
          { type: 'efficiency' as ReportView, label: '⚡ Eficiência km/L', icon: Route },
          { type: 'history' as ReportView, label: '📜 Histórico Alertas', icon: History },
        ]).map((view) => (
          <button
            key={view.type}
            onClick={() => setReportView(view.type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              reportView === view.type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Gráficos por Visualização */}
      {reportView === 'period' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                Evolução de Custos Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={periodChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradientCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Custo']} />
                  <Area type="monotone" dataKey="custo" stroke="#22c55e" strokeWidth={2} fill="url(#gradientCost)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Fuel className="h-4 w-4 text-blue-400" />
                Consumo de Combustível Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={periodChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatLiters(v), 'Litros']} />
                  <Bar dataKey="litros" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Preço Médio por Litro Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={periodChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" stroke="#9ca3af" fontSize={10} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(3)}`, 'Preço/L']} />
                  <Line type="monotone" dataKey="precoMedio" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportView === 'vehicle' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-400" />
                Custo por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={vehicleChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="placa" stroke="#9ca3af" fontSize={10} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Custo']} />
                  <Bar dataKey="custo" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Fuel className="h-4 w-4 text-green-400" />
                Consumo por Veículo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={vehicleChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                  <YAxis type="category" dataKey="placa" stroke="#9ca3af" fontSize={10} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatLiters(v), 'Litros']} />
                  <Bar dataKey="litros" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportView === 'worksite' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-purple-400" />
                Custo por Obra/Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={worksiteChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="setor" stroke="#9ca3af" fontSize={9} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Custo']} labelFormatter={(_, payload) => payload?.[0]?.payload?.setorFull || ''} />
                  <Bar dataKey="custo" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Fuel className="h-4 w-4 text-cyan-400" />
                Consumo por Obra/Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={worksiteChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="setor" stroke="#9ca3af" fontSize={9} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatLiters(v), 'Litros']} labelFormatter={(_, payload) => payload?.[0]?.payload?.setorFull || ''} />
                  <Bar dataKey="litros" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportView === 'garage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-400" />
                Custo por Garagem/Posto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={garageChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="posto" stroke="#9ca3af" fontSize={9} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Custo']} labelFormatter={(_, payload) => payload?.[0]?.payload?.postoFull || ''} />
                  <Bar dataKey="custo" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                Preço Médio por Garagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={garageChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="posto" stroke="#9ca3af" fontSize={9} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(3)}`, 'Preço/L']} labelFormatter={(_, payload) => payload?.[0]?.payload?.postoFull || ''} />
                  <Bar dataKey="precoMedio" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {reportView === 'driver' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-green-400" />
                Custo por Motorista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={driverChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="motorista" stroke="#9ca3af" fontSize={10} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Custo']} labelFormatter={(_, payload) => payload?.[0]?.payload?.motoristaFull || ''} />
                  <Bar dataKey="custo" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <Fuel className="h-4 w-4 text-blue-400" />
                Consumo por Motorista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={driverChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                  <YAxis type="category" dataKey="motorista" stroke="#9ca3af" fontSize={10} width={120} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatLiters(v), 'Litros']} labelFormatter={(_, payload) => payload?.[0]?.payload?.motoristaFull || ''} />
                  <Bar dataKey="litros" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-400" />
                Preço Médio por Litro por Motorista
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={driverChartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="motorista" stroke="#9ca3af" fontSize={9} angle={-30} textAnchor="end" height={60} />
                  <YAxis stroke="#9ca3af" fontSize={10} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`R$ ${v.toFixed(3)}`, 'Preço/L']} />
                  <Bar dataKey="precoMedio" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Visualização de Eficiência */}
      {reportView === 'efficiency' && (
        <FuelEfficiencyRanking vehicles={vehicles} />
      )}

      {/* Visualização de Histórico de Alertas */}
      {reportView === 'history' && (
        <EfficiencyAlertsHistory vehicles={vehicles} />
      )}

      {/* Gráfico de Pizza — Distribuição por Tipo de Combustível (sempre visível) */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-purple-400" />
            Distribuição por Tipo de Combustível
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fuelTypePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={fuelTypePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {fuelTypePieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={FUEL_TYPE_COLORS[Object.keys(FUEL_TYPE_COLORS)[index]] || CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number, _name: string, props: any) => [
                    formatCurrency(value),
                    `${props.payload.count} abastecimentos — ${formatLiters(props.payload.litros)}`,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-gray-300 text-xs">{value}</span>}
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

      {/* Tabela Resumo */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-yellow-400" />
            Resumo dos Dados Filtrados
            <span className="text-xs text-gray-400 font-normal ml-1">
              ({filteredRecords.length} registros)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Data</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Veículo</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Motorista</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Combustível</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Litros</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Valor/L</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Custo Total</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Posto</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 50).map((record, index) => (
                  <tr key={record.id || index} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/20' : ''}`}>
                    <td className="py-1.5 px-3 text-gray-300">{record.date || '—'}</td>
                    <td className="py-1.5 px-3 text-gray-300">{record.vehiclePlate || '—'}</td>
                    <td className="py-1.5 px-3 text-gray-300">
                      {record.driver ? (typeof record.driver === 'string' ? record.driver : (record.driver as any)?.name || '—') : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-gray-300">{FUEL_TYPE_LABELS[record.fuelType] || record.fuelType}</td>
                    <td className="py-1.5 px-3 text-gray-300 text-right">{formatLiters(record.quantity || 0)}</td>
                    <td className="py-1.5 px-3 text-gray-300 text-right">
                      {record.quantity > 0 ? `R$ ${(record.cost / record.quantity).toFixed(3)}` : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-green-400 text-right font-medium">{formatCurrency(record.cost || 0)}</td>
                    <td className="py-1.5 px-3 text-gray-300">{record.station || '—'}</td>
                  </tr>
                ))}
              </tbody>
              {filteredRecords.length > 50 && (
                <tfoot>
                  <tr className="border-t border-gray-600 bg-gray-800/50">
                    <td colSpan={4} className="py-2 px-3 text-gray-400 font-medium">
                      Mostrando 50 de {filteredRecords.length} registros
                    </td>
                    <td className="py-2 px-3 text-blue-400 text-right font-medium">{formatLiters(kpis.totalLiters)}</td>
                    <td className="py-2 px-3 text-orange-400 text-right font-medium">R$ {kpis.avgPricePerLiter.toFixed(3)}</td>
                    <td className="py-2 px-3 text-green-400 text-right font-bold">{formatCurrency(kpis.totalCost)}</td>
                    <td className="py-2 px-3"></td>
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

export default FuelReportsDashboard;
