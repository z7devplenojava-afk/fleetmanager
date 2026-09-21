import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  Fuel, DollarSign, TrendingUp, Calendar, Building2, ArrowUpDown,
  ArrowUp, ArrowDown, FileText, Gauge, Droplets, Truck, Printer,
  Sparkles, Download, Eye, Search, Filter, RefreshCw, Layers,
  BarChart3, AlertTriangle, Lightbulb, ChevronRight, ChevronLeft,
  X, CheckCircle2, ChevronDown, Award, Edit, Trash2
} from 'lucide-react';
import { FuelRecord, Vehicle } from '@/types/fleet';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import AbastecimentoExternoFormModal from '@/components/frota/AbastecimentoExternoFormModal';
import AbastecimentoDeleteDialog from '@/components/frota/AbastecimentoDeleteDialog';
import {
  downloadAbastecimentoExternoPDF,
  previewAbastecimentoExternoPDF,
  AbastecimentoExternoPDFOptions,
} from '@/utils/abastecimentoExternoPDFGenerator';

export type AbastExternoSubTab = 'lancamentos' | 'indicadores' | 'relatorio-inteligente';

interface AbastecimentoExternoReportProps {
  fuelRecords: FuelRecord[];
  veiculos?: Vehicle[];
  onRefresh?: () => void;
  activeSubTab?: AbastExternoSubTab;
  onSubTabChange?: (tab: AbastExternoSubTab) => void;
}

type SortDirection = 'asc' | 'desc';
type ReportPdfType = 'executive' | 'period' | 'detailed' | 'client' | 'vehicle' | 'station';

const FUEL_COLORS: Record<string, string> = {
  DIESEL: '#3b82f6',
  GASOLINE: '#ef4444',
  ETHANOL: '#22c55e',
  FLEX: '#a855f7',
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#a855f7', '#06b6d4', '#eab308', '#ec4899'];

function formatCurrency(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const AbastecimentoExternoReport: React.FC<AbastecimentoExternoReportProps> = ({
  fuelRecords,
  veiculos = [],
  onRefresh,
  activeSubTab: propSubTab,
  onSubTabChange,
}) => {
  const { user, empresa } = useAuth();
  const { toast } = useToast();

  // Controle de Sub-Abas
  const [internalSubTab, setInternalSubTab] = useState<AbastExternoSubTab>('lancamentos');
  const currentTab = propSubTab || internalSubTab;

  const handleTabChange = (val: string) => {
    const tab = val as AbastExternoSubTab;
    setInternalSubTab(tab);
    onSubTabChange?.(tab);
  };

  // Sincronizar se a prop externa mudar
  useEffect(() => {
    if (propSubTab) {
      setInternalSubTab(propSubTab);
    }
  }, [propSubTab]);

  // Filtros Globais
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('ALL');
  const [selectedVehicle, setSelectedVehicle] = useState('ALL');
  const [selectedStation, setSelectedStation] = useState('ALL');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Paginação da tabela de lançamentos
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modal de Detalhes de Lançamento
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<FuelRecord | null>(null);

  // Ações (Editar / Excluir)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<FuelRecord | null>(null);

  const handleEditRecord = (r: FuelRecord) => {
    setEditingRecord(r);
    setIsEditModalOpen(true);
  };

  const handleDeleteRecord = (r: FuelRecord) => {
    setDeletingRecord(r);
    setIsDeleteDialogOpen(true);
  };

  // Estado do Relatório Inteligente
  const [selectedReportType, setSelectedReportType] = useState<ReportPdfType>('executive');
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Filtragem de registros externos
  const externalRecords = useMemo(() => {
    return fuelRecords.filter(r => {
      const hasClient = !!(r.clientName || r.contractNumber || r.obraName);
      const hasNotes = r.notes?.toLowerCase().includes('externo') || r.notes?.toLowerCase().includes('posto');
      return hasClient || hasNotes;
    });
  }, [fuelRecords]);

  // Listas únicas para dropdowns
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    externalRecords.forEach(r => { if (r.clientName) set.add(r.clientName); });
    return Array.from(set).sort();
  }, [externalRecords]);

  const uniqueVehicles = useMemo(() => {
    const set = new Set<string>();
    externalRecords.forEach(r => { if (r.vehiclePlate) set.add(r.vehiclePlate); });
    return Array.from(set).sort();
  }, [externalRecords]);

  const uniqueStations = useMemo(() => {
    const set = new Set<string>();
    externalRecords.forEach(r => { if (r.station) set.add(r.station); });
    return Array.from(set).sort();
  }, [externalRecords]);

  // Registros Filtrados com busca textual
  const filteredRecords = useMemo(() => {
    return externalRecords
      .filter(r => {
        if (startDate && r.date < startDate) return false;
        if (endDate && r.date > endDate) return false;
        if (selectedClient !== 'ALL' && r.clientName !== selectedClient) return false;
        if (selectedVehicle !== 'ALL' && r.vehiclePlate !== selectedVehicle) return false;
        if (selectedStation !== 'ALL' && r.station !== selectedStation) return false;

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchPlate = r.vehiclePlate?.toLowerCase().includes(term);
          const matchClient = r.clientName?.toLowerCase().includes(term);
          const matchStation = r.station?.toLowerCase().includes(term);
          const matchObra = r.obraName?.toLowerCase().includes(term);
          const matchNotes = r.notes?.toLowerCase().includes(term);
          const matchContract = r.contractNumber?.toLowerCase().includes(term);
          if (!matchPlate && !matchClient && !matchStation && !matchObra && !matchNotes && !matchContract) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [externalRecords, startDate, endDate, selectedClient, selectedVehicle, selectedStation, searchTerm, sortDir]);

  // Resetar página quando os filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, selectedClient, selectedVehicle, selectedStation, searchTerm]);

  // Estatísticas e KPIs consolidados
  const stats = useMemo(() => {
    const count = filteredRecords.length;
    const totalCost = filteredRecords.reduce((sum, r) => sum + (r.cost || 0), 0);
    const totalLiters = filteredRecords.reduce((sum, r) => sum + (r.quantity || 0), 0);

    let totalKm = 0;
    filteredRecords.forEach(r => {
      if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
        totalKm += (r.mileage - r.initialMileage);
      }
    });

    const avgConsumption = totalKm > 0 ? totalLiters / totalKm : 0;
    const avgCostPerKm = totalKm > 0 ? totalCost / totalKm : 0;
    const avgPricePerLiter = totalLiters > 0 ? totalCost / totalLiters : 0;

    return {
      count,
      totalCost,
      totalLiters,
      totalKm,
      avgConsumption,
      avgCostPerKm,
      avgPricePerLiter,
    };
  }, [filteredRecords]);

  // Resumos Analíticos Agrupados
  const clientSummary = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; liters: number; km: number; contracts: Set<string> }>();
    filteredRecords.forEach(r => {
      const key = r.clientName || 'Não Informado';
      const cur = map.get(key) || { count: 0, cost: 0, liters: 0, km: 0, contracts: new Set<string>() };
      cur.count += 1;
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
        cur.km += (r.mileage - r.initialMileage);
      }
      if (r.contractNumber) cur.contracts.add(r.contractNumber);
      map.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([client, data]) => ({
        client,
        contracts: Array.from(data.contracts).join(', ') || '—',
        count: data.count,
        cost: data.cost,
        liters: data.liters,
        km: data.km,
        avgConsumption: data.km > 0 ? data.liters / data.km : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  const vehicleSummary = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; liters: number; km: number; clients: Set<string> }>();
    filteredRecords.forEach(r => {
      const key = r.vehiclePlate || '—';
      const cur = map.get(key) || { count: 0, cost: 0, liters: 0, km: 0, clients: new Set<string>() };
      cur.count += 1;
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
        cur.km += (r.mileage - r.initialMileage);
      }
      if (r.clientName) cur.clients.add(r.clientName);
      map.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([plate, data]) => ({
        plate,
        clients: Array.from(data.clients).join(', ') || '—',
        count: data.count,
        cost: data.cost,
        liters: data.liters,
        km: data.km,
        avgConsumption: data.km > 0 ? data.liters / data.km : 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  const stationSummary = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; liters: number; vehicles: Set<string> }>();
    filteredRecords.forEach(r => {
      const key = r.station || 'Não Informado';
      const cur = map.get(key) || { count: 0, cost: 0, liters: 0, vehicles: new Set<string>() };
      cur.count += 1;
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      if (r.vehiclePlate) cur.vehicles.add(r.vehiclePlate);
      map.set(key, cur);
    });

    return Array.from(map.entries())
      .map(([station, data]) => ({
        station,
        count: data.count,
        cost: data.cost,
        liters: data.liters,
        avgPricePerLiter: data.liters > 0 ? data.cost / data.liters : 0,
        vehicles: Array.from(data.vehicles).join(', ') || '—',
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [filteredRecords]);

  // Resumo Cronológico por Período / Data
  const periodSummary = useMemo(() => {
    const map = new Map<string, { count: number; cost: number; liters: number; km: number; stations: Set<string> }>();
    filteredRecords.forEach(r => {
      const d = r.date;
      const cur = map.get(d) || { count: 0, cost: 0, liters: 0, km: 0, stations: new Set<string>() };
      cur.count += 1;
      cur.cost += r.cost || 0;
      cur.liters += r.quantity || 0;
      if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
        cur.km += (r.mileage - r.initialMileage);
      }
      if (r.station) cur.stations.add(r.station);
      map.set(d, cur);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        const parts = date.split('-');
        return {
          date,
          formattedDate: `${parts[2]}/${parts[1]}/${parts[0]}`,
          count: data.count,
          cost: data.cost,
          liters: data.liters,
          km: data.km,
          avgConsumption: data.km > 0 ? data.liters / data.km : 0,
          avgPricePerLiter: data.liters > 0 ? data.cost / data.liters : 0,
          stations: Array.from(data.stations).slice(0, 2).join(', ') || '—',
        };
      });
  }, [filteredRecords]);

  // Atalhos Rápidos de Período
  const setPeriodPreset = (preset: 'today' | 'week' | 'month' | 'lastMonth' | '90days' | 'year' | 'all') => {
    const now = new Date();
    const toIso = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    if (preset === 'today') {
      const today = toIso(now);
      setStartDate(today);
      setEndDate(today);
      return;
    }
    if (preset === 'week') {
      const current = new Date();
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(current.setDate(diff));
      setStartDate(toIso(monday));
      setEndDate(toIso(new Date()));
      return;
    }
    if (preset === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(toIso(firstDay));
      setEndDate(toIso(new Date()));
      return;
    }
    if (preset === 'lastMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(toIso(firstDay));
      setEndDate(toIso(lastDay));
      return;
    }
    if (preset === '90days') {
      const past = new Date();
      past.setDate(past.getDate() - 90);
      setStartDate(toIso(past));
      setEndDate(toIso(new Date()));
      return;
    }
    if (preset === 'year') {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      setStartDate(toIso(firstDay));
      setEndDate(toIso(new Date()));
      return;
    }
  };

  // Insights Inteligentes Calculados
  const smartInsights = useMemo(() => {
    // 1. Posto mais em conta
    const stationsWithPrices = stationSummary.filter(s => s.liters >= 20 && s.avgPricePerLiter > 0);
    const cheapestStation = stationsWithPrices.length > 0
      ? [...stationsWithPrices].sort((a, b) => a.avgPricePerLiter - b.avgPricePerLiter)[0]
      : null;

    // 2. Maior cliente em custo
    const topClient = clientSummary.length > 0 ? clientSummary[0] : null;
    const topClientPercent = topClient && stats.totalCost > 0
      ? ((topClient.cost / stats.totalCost) * 100).toFixed(1)
      : '0';

    // 3. Veículo com maior desvio de consumo
    const vehiclesWithValidKm = vehicleSummary.filter(v => v.km >= 50 && v.avgConsumption > 0);
    const highestConsumer = vehiclesWithValidKm.length > 0
      ? [...vehiclesWithValidKm].sort((a, b) => b.avgConsumption - a.avgConsumption)[0]
      : null;

    // 4. Tipo de combustível predominante
    const fuelMap: Record<string, { liters: number; cost: number }> = {};
    filteredRecords.forEach(r => {
      const ft = r.fuelType || 'OUTRO';
      fuelMap[ft] = fuelMap[ft] || { liters: 0, cost: 0 };
      fuelMap[ft].liters += (r.quantity || 0);
      fuelMap[ft].cost += (r.cost || 0);
    });

    const dominantFuel = Object.entries(fuelMap).sort((a, b) => b[1].liters - a[1].liters)[0];

    return {
      cheapestStation,
      topClient,
      topClientPercent,
      highestConsumer,
      dominantFuelName: dominantFuel ? (dominantFuel[0] === 'DIESEL' ? 'Diesel' : dominantFuel[0] === 'GASOLINE' ? 'Gasolina' : dominantFuel[0] === 'ETHANOL' ? 'Etanol' : 'Flex') : '—',
      dominantFuelPercent: dominantFuel && stats.totalLiters > 0 ? ((dominantFuel[1].liters / stats.totalLiters) * 100).toFixed(0) : '0',
    };
  }, [stationSummary, clientSummary, vehicleSummary, filteredRecords, stats]);

  // Dados para os Gráficos
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { km: number; liters: number; cost: number }>();
    filteredRecords.forEach(r => {
      const month = r.date.substring(0, 7);
      const cur = map.get(month) || { km: 0, liters: 0, cost: 0 };
      if (r.mileage && r.initialMileage && r.mileage > r.initialMileage) {
        cur.km += (r.mileage - r.initialMileage);
      }
      cur.liters += r.quantity || 0;
      cur.cost += r.cost || 0;
      map.set(month, cur);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [year, m] = month.split('-');
        const monthLabel = `${m}/${year.slice(2)}`;
        return {
          month: monthLabel,
          kmRodado: data.km,
          consumoMedio: data.km > 0 ? Number((data.liters / data.km).toFixed(2)) : 0,
          custoTotal: data.cost,
        };
      });
  }, [filteredRecords]);

  const fuelTypeData = useMemo(() => {
    const map = new Map<string, { litros: number; custo: number }>();
    filteredRecords.forEach(r => {
      const type = r.fuelType || 'OUTRO';
      const cur = map.get(type) || { litros: 0, custo: 0 };
      cur.litros += r.quantity || 0;
      cur.custo += r.cost || 0;
      map.set(type, cur);
    });

    const labels: Record<string, string> = {
      DIESEL: 'Diesel',
      GASOLINE: 'Gasolina',
      ETHANOL: 'Etanol',
      FLEX: 'Flex',
    };

    return Array.from(map.entries()).map(([type, data]) => ({
      name: labels[type] || type,
      litros: data.litros,
      custo: data.custo,
      color: FUEL_COLORS[type] || '#6b7280',
    }));
  }, [filteredRecords]);

  const costByVehicleChart = useMemo(() => {
    return vehicleSummary.slice(0, 8).map(v => ({
      vehicle: v.plate,
      custo: v.cost,
    }));
  }, [vehicleSummary]);

  const costByStationChart = useMemo(() => {
    return stationSummary.slice(0, 8).map(s => ({
      station: s.station.length > 16 ? s.station.substring(0, 16) + '...' : s.station,
      custo: s.cost,
    }));
  }, [stationSummary]);

  const dailyCostChart = useMemo(() => {
    const map = new Map<string, number>();
    filteredRecords.forEach(r => {
      map.set(r.date, (map.get(r.date) || 0) + r.cost);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-15)
      .map(([date, cost]) => {
        const parts = date.split('-');
        return {
          date: `${parts[2]}/${parts[1]}`,
          custo: cost,
        };
      });
  }, [filteredRecords]);

  // Paginação dos Lançamentos
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage, itemsPerPage]);

  const toggleSort = () => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');

  // Gerador de PDF Padrão OS
  const handleExportPdf = async (action: 'preview' | 'download', type: ReportPdfType = selectedReportType) => {
    setGeneratingPdf(true);
    try {
      const pdfOptions: AbastecimentoExternoPDFOptions = {
        reportType: type,
        fuelRecords: filteredRecords,
        stats,
        clientSummary,
        vehicleSummary,
        stationSummary,
        periodSummary,
        filters: {
          startDate,
          endDate,
          selectedClient,
          selectedVehicle,
          selectedStation,
          sortDir,
        },
        company: {
          name: empresa?.nome || user?.companyName || 'FLUXBUS GESTÃO DE FROTAS',
          tradeName: (empresa as any)?.sigla || empresa?.nome || 'FLUXBUS',
          cnpj: (empresa as any)?.cnpj,
          logoUrl: resolveCompanyLogoUrl(empresa?.logoUrl),
          phone: (empresa as any)?.telefone,
          email: (empresa as any)?.email,
          address: (empresa as any)?.endereco,
        },
        userName: user?.name || 'Administrador',
      };

      if (action === 'preview') {
        await previewAbastecimentoExternoPDF(pdfOptions);
        toast({
          title: 'PDF Aberto para Visualização',
          description: 'O relatório foi aberto no padrão oficial da Ordem de Serviço.',
        });
      } else {
        await downloadAbastecimentoExternoPDF(pdfOptions);
        toast({
          title: 'Download Concluído',
          description: 'O relatório PDF oficial foi salvo com sucesso.',
        });
      }
    } catch (err: any) {
      console.error('Erro ao gerar PDF de abastecimento externo:', err);
      toast({
        title: 'Erro ao gerar relatório',
        description: err?.message || 'Ocorreu um erro ao montar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Exportar CSV
  const handleExportCsv = () => {
    try {
      const headers = ['Data', 'Placa', 'Cliente', 'Obra', 'Contrato', 'Combustivel', 'Litros', 'Preco_Por_Litro', 'Total_RS', 'KM_Inicial', 'KM_Final', 'Posto', 'Observacoes'];
      const rows = filteredRecords.map(r => [
        r.date,
        r.vehiclePlate,
        `"${(r.clientName || '').replace(/"/g, '""')}"`,
        `"${(r.obraName || '').replace(/"/g, '""')}"`,
        `"${(r.contractNumber || '').replace(/"/g, '""')}"`,
        r.fuelType,
        r.quantity.toFixed(2),
        (r.pricePerLiter || 0).toFixed(2),
        r.cost.toFixed(2),
        r.initialMileage || '',
        r.mileage || '',
        `"${(r.station || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `abastecimentos-externos-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Planilha Exportada',
        description: `${filteredRecords.length} lançamentos exportados em formato CSV.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar CSV',
        description: err?.message || 'Falha ao gerar arquivo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE NAVEGAÇÃO POR SUB-ABAS (FLUIDA, CLEAN E RESPONSIVA) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-950/80 p-2 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-lg">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 w-full sm:w-[500px] h-11 bg-zinc-900/80 border border-zinc-700/60 p-1 rounded-xl">
            <TabsTrigger
              value="lancamentos"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lançamentos</span>
              <span className="hidden md:inline-block px-1.5 py-0.2 text-[10px] bg-black/40 rounded-full font-mono">
                {filteredRecords.length}
              </span>
            </TabsTrigger>

            <TabsTrigger
              value="indicadores"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Gráficos & KPIs</span>
            </TabsTrigger>

            <TabsTrigger
              value="relatorio-inteligente"
              className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-emerald-500 data-[state=active]:text-zinc-950 data-[state=active]:font-black rounded-lg transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Relatório Inteligente</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Ações Rápidas no Header */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(prev => !prev)}
            className={`h-10 text-xs border-zinc-700 transition-all ${
              showFilters || startDate || endDate || selectedClient !== 'ALL' || selectedVehicle !== 'ALL' || selectedStation !== 'ALL'
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <span>Filtros</span>
            {(startDate || endDate || selectedClient !== 'ALL' || selectedVehicle !== 'ALL' || selectedStation !== 'ALL') && (
              <span className="ml-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportPdf('preview')}
            disabled={generatingPdf || filteredRecords.length === 0}
            className="h-10 text-xs border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800"
            title="Visualizar PDF oficial da Ordem de Serviço"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            <span className="hidden md:inline">Visualizar PDF OS</span>
            <span className="md:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* PAINEL DE FILTROS EXPANSÍVEL (RESPONSIVO E COMPACTO) */}
      {showFilters && (
        <Card className="bg-zinc-900/90 border-zinc-800/90 rounded-2xl shadow-xl backdrop-blur-md animate-in fade-in-50 duration-200">
          <CardHeader className="pb-3 border-b border-zinc-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Parâmetros de Filtragem de Abastecimento Externo
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedClient('ALL');
                setSelectedVehicle('ALL');
                setSelectedStation('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 h-7 px-2"
            >
              Limpar Filtros
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Data Inicial</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-700 text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Data Final</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-700 text-white text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="ALL">Todos os Clientes</SelectItem>
                    {uniqueClients.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Veículo (Placa)</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                  <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="ALL">Todos os Veículos</SelectItem>
                    {uniqueVehicles.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Posto de Gasolina</Label>
                <Select value={selectedStation} onValueChange={setSelectedStation}>
                  <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-white text-xs h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="ALL">Todos os Postos</SelectItem>
                    {uniqueStations.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-[11px]">Ordenação da Data</Label>
                <Button
                  variant="outline"
                  onClick={toggleSort}
                  className="bg-zinc-950/80 border-zinc-700 text-zinc-200 text-xs h-9 w-full justify-between"
                >
                  <span>{sortDir === 'desc' ? 'Decrescente' : 'Crescente'}</span>
                  {sortDir === 'desc' ? <ArrowDown className="h-3.5 w-3.5 text-emerald-400" /> : <ArrowUp className="h-3.5 w-3.5 text-emerald-400" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GRADE DE KPIS COMPACTA E ELEGANTE (SEMPRE ATUALIZADA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Registros</span>
              <Layers className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="text-xl font-bold text-white mt-1.5 font-mono">{stats.count}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-emerald-500/40 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Custo Total</span>
              <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1.5 font-mono">{formatCurrency(stats.totalCost)}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-blue-500/40 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Volume</span>
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-blue-400 mt-1.5 font-mono">
              {stats.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>KM Rodados</span>
              <Gauge className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div className="text-xl font-bold text-zinc-200 mt-1.5 font-mono">
              {stats.totalKm.toLocaleString('pt-BR')} km
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-amber-500/40 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Consumo Médio</span>
              <Fuel className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1.5 font-mono">
              {stats.avgConsumption > 0 ? stats.avgConsumption.toFixed(2) : '—'} L/km
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-purple-500/40 transition-all rounded-xl shadow-sm">
          <CardContent className="p-3.5">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Custo / KM</span>
              <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-purple-400 mt-1.5 font-mono">
              {formatCurrency(stats.avgCostPerKm)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: 📋 LANÇAMENTOS & HISTÓRICO                                         */}
      {/* ========================================================================= */}
      {currentTab === 'lancamentos' && (
        <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
          <CardHeader className="p-4 border-b border-zinc-800 bg-zinc-950/40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Barra de Busca Instantânea */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  placeholder="Buscar por placa, cliente, obra, posto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-950/80 border-zinc-700 text-white text-xs h-9 rounded-xl placeholder:text-zinc-500 focus:border-emerald-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Controles de Itens por Página e Exportação */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Exibir:</span>
                <Select value={String(itemsPerPage)} onValueChange={v => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="w-20 h-8 bg-zinc-950 border-zinc-700 text-xs text-zinc-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white text-xs">
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="h-8 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  title="Exportar dados filtrados em CSV"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> CSV
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-950/60">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 text-xs py-3">
                      <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white font-bold">
                        Data {sortDir === 'desc' ? <ArrowDown className="h-3 w-3 text-emerald-400" /> : <ArrowUp className="h-3 w-3 text-emerald-400" />}
                      </button>
                    </TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3">Veículo</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3">Cliente / Obra</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3">Combustível</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3 text-right">Litros</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3 text-right">R$ / L</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3 text-right">Total</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3 text-right">Odômetro</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3">Posto</TableHead>
                    <TableHead className="text-zinc-400 text-xs py-3 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.length > 0 ? (
                    paginatedRecords.map(r => (
                      <TableRow
                        key={r.id}
                        className="border-zinc-800/60 hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedRecordForDetail(r)}
                      >
                        <TableCell className="text-zinc-300 text-xs whitespace-nowrap font-medium">
                          {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-zinc-100 text-xs">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono font-bold tracking-wider text-emerald-400">
                            {r.vehiclePlate}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs max-w-[200px] truncate">
                          <div className="font-medium text-zinc-200">{r.clientName || '—'}</div>
                          {r.obraName && <div className="text-[11px] text-zinc-500 truncate">{r.obraName}</div>}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1"
                            style={{
                              backgroundColor: (FUEL_COLORS[r.fuelType] || '#6b7280') + '25',
                              color: FUEL_COLORS[r.fuelType] || '#9ca3af',
                              border: `1px solid ${(FUEL_COLORS[r.fuelType] || '#6b7280')}50`,
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: FUEL_COLORS[r.fuelType] || '#9ca3af' }} />
                            {r.fuelType === 'DIESEL' ? 'Diesel' : r.fuelType === 'GASOLINE' ? 'Gasolina' : r.fuelType === 'ETHANOL' ? 'Etanol' : 'Flex'}
                          </span>
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs text-right font-mono">
                          {r.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs text-right font-mono">
                          {(r.pricePerLiter || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-emerald-400 text-xs font-bold text-right font-mono">
                          {formatCurrency(r.cost)}
                        </TableCell>
                        <TableCell className="text-zinc-400 text-xs text-right font-mono">
                          {r.mileage ? `${r.mileage.toLocaleString('pt-BR')} km` : '—'}
                        </TableCell>
                        <TableCell className="text-zinc-300 text-xs max-w-[180px] truncate">
                          {r.station || '—'}
                        </TableCell>
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRecordForDetail(r)}
                              className="h-7 w-7 p-0 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                              title="Visualizar detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(r)}
                              className="h-7 w-7 p-0 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-white"
                              title="Editar"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteRecord(r)}
                              className="h-7 w-7 p-0 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-zinc-500 py-12">
                        <Fuel className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-40" />
                        <p className="text-sm">Nenhum abastecimento externo encontrado para os filtros selecionados.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação */}
            {filteredRecords.length > 0 && (
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
                <div>
                  Mostrando <span className="font-semibold text-zinc-200">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                  <span className="font-semibold text-zinc-200">{Math.min(currentPage * itemsPerPage, filteredRecords.length)}</span> de{' '}
                  <span className="font-semibold text-zinc-200">{filteredRecords.length}</span> registros
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 text-xs border-zinc-800 text-zinc-300 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Anterior
                  </Button>
                  <span className="px-3 py-1 font-mono font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 rounded">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 text-xs border-zinc-800 text-zinc-300 disabled:opacity-30"
                  >
                    Próxima <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: 📊 GRÁFICOS & INDICADORES (SEPARADO DA LISTA)                      */}
      {/* ========================================================================= */}
      {currentTab === 'indicadores' && (
        <div className="space-y-6">
          {/* Seção 1: Desempenho e Consumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> Quilometragem Rodada por Mês (km)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        labelStyle={{ color: '#f4f4f5' }}
                        formatter={(value: number) => [`${value.toLocaleString('pt-BR')} km`, 'KM Rodado']}
                      />
                      <Bar dataKey="kmRodado" fill="#10b981" radius={[6, 6, 0, 0]} name="KM Rodado" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados para o período</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-blue-400" /> Consumo Médio por Mês (L/km)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        labelStyle={{ color: '#f4f4f5' }}
                      />
                      <Line type="monotone" dataKey="consumoMedio" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8', r: 4 }} name="Consumo (L/km)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados para o período</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seção 2: Custos Financeiros */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Truck className="h-4 w-4 text-emerald-400" /> Maiores Custos por Veículo (Top 8)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {costByVehicleChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={costByVehicleChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="vehicle" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        labelStyle={{ color: '#f4f4f5' }}
                        formatter={(value: number) => [formatCurrency(value), 'Custo Total']}
                      />
                      <Bar dataKey="custo" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Custo Total" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" /> Gastos por Posto Externo (Top 8)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {costByStationChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={costByStationChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="station" stroke="#71717a" fontSize={10} angle={-25} textAnchor="end" height={55} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        labelStyle={{ color: '#f4f4f5' }}
                        formatter={(value: number) => [formatCurrency(value), 'Custo']}
                      />
                      <Bar dataKey="custo" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Custo" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Seção 3: Distribuição e Tendência Diária */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-purple-400" /> Distribuição por Combustível
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {fuelTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={fuelTypeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={45}
                        paddingAngle={3}
                        dataKey="litros"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {fuelTypeData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        formatter={(value: number) => [`${value.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L`, 'Volume']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="pb-2 border-b border-zinc-800/80 bg-zinc-950/30">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" /> Evolução de Custo Diário Recente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {dailyCostChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={dailyCostChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 10 }}
                        labelStyle={{ color: '#f4f4f5' }}
                        formatter={(value: number) => [formatCurrency(value), 'Gasto no Dia']}
                      />
                      <Area type="monotone" dataKey="custo" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-zinc-500 text-xs">Sem dados</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumos em Tabelas Agrupadas */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Resumo por Cliente */}
            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="p-4 border-b border-zinc-800 bg-zinc-950/40">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" /> Resumo por Cliente / Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-zinc-950">
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400 text-xs py-2">Cliente</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Litros</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Consumo</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clientSummary.map(c => (
                        <TableRow key={c.client} className="border-zinc-800/40 hover:bg-zinc-800/40 text-xs">
                          <TableCell className="text-zinc-200 font-medium">{c.client}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono">{c.liters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono">{c.avgConsumption > 0 ? `${c.avgConsumption.toFixed(2)} L/km` : '—'}</TableCell>
                          <TableCell className="text-emerald-400 text-right font-mono font-semibold">{formatCurrency(c.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Resumo por Posto */}
            <Card className="bg-zinc-900/60 border-zinc-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
              <CardHeader className="p-4 border-b border-zinc-800 bg-zinc-950/40">
                <CardTitle className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" /> Resumo de Preços por Posto
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-zinc-950">
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400 text-xs py-2">Posto</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Abastec.</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Preço Médio/L</TableHead>
                        <TableHead className="text-zinc-400 text-xs py-2 text-right">Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stationSummary.map(s => (
                        <TableRow key={s.station} className="border-zinc-800/40 hover:bg-zinc-800/40 text-xs">
                          <TableCell className="text-zinc-200 font-medium">{s.station}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono">{s.count}</TableCell>
                          <TableCell className="text-zinc-300 text-right font-mono">{formatCurrency(s.avgPricePerLiter)}</TableCell>
                          <TableCell className="text-emerald-400 text-right font-mono font-semibold">{formatCurrency(s.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: ⚡ RELATÓRIO INTELIGENTE & CENTRAL DE EMISSÃO PDF (PADRÃO OS)        */}
      {/* ========================================================================= */}
      {currentTab === 'relatorio-inteligente' && (
        <div className="space-y-6">
          {/* CARDS DE INSIGHTS PREDITIVOS / INTELIGENTES */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1: Posto Mais Econômico */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/40 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                      Posto Mais Vantajoso
                    </span>
                    <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
                      {smartInsights.cheapestStation?.station || 'Sem dados suficientes'}
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Preço Médio / L:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {smartInsights.cheapestStation ? formatCurrency(smartInsights.cheapestStation.avgPricePerLiter) : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Concentração de Custo */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-blue-950/40 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase">
                      Maior Concentração Cliente
                    </span>
                    <h4 className="text-sm font-bold text-white truncate max-w-[170px]">
                      {smartInsights.topClient?.client || 'Nenhum'}
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Parcela do Custo:</span>
                  <span className="font-mono font-bold text-blue-400">
                    {smartInsights.topClientPercent}% do total ({formatCurrency(smartInsights.topClient?.cost || 0)})
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Alerta de Consumo */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/40 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                      Atenção ao Consumo
                    </span>
                    <h4 className="text-sm font-bold text-white font-mono">
                      {smartInsights.highestConsumer?.plate || 'Frota Regular'}
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Média Observada:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {smartInsights.highestConsumer ? `${smartInsights.highestConsumer.avgConsumption.toFixed(2)} L/km` : 'Normal'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Combustível Principal */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-purple-950/40 border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Fuel className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
                      Combustível Predominante
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {smartInsights.dominantFuelName}
                    </h4>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex justify-between items-center text-xs">
                  <span className="text-zinc-400">Representatividade:</span>
                  <span className="font-mono font-bold text-purple-400">
                    {smartInsights.dominantFuelPercent}% dos litros
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PAINEL DE GERAÇÃO E SELEÇÃO DE RELATÓRIO EXECUTIVO (PADRÃO OS) */}
          <Card className="bg-zinc-900/70 border-zinc-800 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden">
            <CardHeader className="p-5 border-b border-zinc-800 bg-zinc-950/40">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Gerador de Relatórios Executivos (Padrão Oficial OS)
                  </CardTitle>
                  <p className="text-xs text-zinc-400 mt-1">
                    Gera documentos corporativos formatados com cabeçalho institucional, logomarca da empresa, sumário executivo e paginação idêntica à Ordem de Serviço.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleExportPdf('preview', selectedReportType)}
                    disabled={generatingPdf || filteredRecords.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30 font-semibold text-xs h-10 px-4"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {generatingPdf ? 'Gerando...' : 'Visualizar PDF (Padrão OS)'}
                  </Button>

                  <Button
                    onClick={() => handleExportPdf('download', selectedReportType)}
                    disabled={generatingPdf || filteredRecords.length === 0}
                    variant="outline"
                    className="border-zinc-700 text-zinc-200 hover:bg-zinc-800 text-xs h-10 px-3"
                  >
                    <Download className="w-4 h-4 mr-2 text-emerald-400" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-6">
              {/* Seleção do Período com Atalhos Rápidos */}
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Definição do Período do Relatório:
                  </Label>
                  <span className="text-[11px] text-zinc-400">
                    Período selecionado:{' '}
                    <strong className="text-zinc-200">
                      {startDate ? new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Início'} até{' '}
                      {endDate ? new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Hoje'}
                    </strong>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: 'Hoje', key: 'today' },
                    { label: 'Esta Semana', key: 'week' },
                    { label: 'Este Mês', key: 'month' },
                    { label: 'Mês Passado', key: 'lastMonth' },
                    { label: 'Últimos 90 Dias', key: '90days' },
                    { label: 'Ano Atual', key: 'year' },
                    { label: 'Todo o Histórico', key: 'all' },
                  ].map(preset => (
                    <Button
                      key={preset.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPeriodPreset(preset.key as any)}
                      className="h-7 text-[11px] px-2.5 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-zinc-400 text-[11px]">Data de Início do Período</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-zinc-400 text-[11px]">Data de Término do Período</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Seleção do Tipo de Relatório */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 block">
                  Selecione o Modelo do Relatório:
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                  {[
                    { id: 'executive', title: 'Consolidado Executivo', desc: 'KPIs + Resumos por Cliente, Veículo e Posto', icon: Award },
                    { id: 'period', title: 'Por Período / Data', desc: 'Consolidação cronológica dia a dia com médias e totais', icon: Calendar },
                    { id: 'detailed', title: 'Analítico Detalhado', desc: 'Lançamentos individuais com odômetro e dados', icon: FileText },
                    { id: 'client', title: 'Por Cliente & Contrato', desc: 'Focado em repasse de custos por contrato', icon: Building2 },
                    { id: 'vehicle', title: 'Por Veículo & Frota', desc: 'Análise individualizada por placa e consumo', icon: Truck },
                    { id: 'station', title: 'Por Posto Externo', desc: 'Comparativo de preços praticados e postos', icon: Fuel },
                  ].map(item => {
                    const Icon = item.icon;
                    const isSelected = selectedReportType === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReportType(item.id as ReportPdfType)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                            : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                            {item.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-snug">{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Prévia Executiva do Conteúdo do PDF */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-300">
                      Prévia dos Dados que Serão Incluídos no Documento Oficial:
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                    {filteredRecords.length} lançamentos filtrados
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 text-[11px] block">Custo Total Consolidado</span>
                    <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">{formatCurrency(stats.totalCost)}</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 text-[11px] block">Volume Total Faturado</span>
                    <span className="text-base font-bold text-blue-400 font-mono mt-0.5 block">{stats.totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} Litros</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 text-[11px] block">Veículos Envolvidos</span>
                    <span className="text-base font-bold text-zinc-200 font-mono mt-0.5 block">{vehicleSummary.length} placas</span>
                  </div>

                  <div className="p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/60">
                    <span className="text-zinc-500 text-[11px] block">Postos Atendidos</span>
                    <span className="text-base font-bold text-amber-400 font-mono mt-0.5 block">{stationSummary.length} redes</span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 flex items-center justify-between pt-1">
                  <span>
                    Empresa Emissora: <strong className="text-zinc-300">{empresa?.nome || user?.companyName || 'FluxBus'}</strong>
                  </span>
                  <span>
                    Filtros aplicados: <strong className="text-zinc-300">
                      {[
                        startDate ? `De ${new Date(startDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : null,
                        endDate ? `Até ${new Date(endDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : null,
                        selectedClient !== 'ALL' ? `Cliente: ${selectedClient}` : null,
                        selectedVehicle !== 'ALL' ? `Veículo: ${selectedVehicle}` : null,
                      ].filter(Boolean).join(' | ') || 'Sem restrições de data'}
                    </strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAIS DE AÇÃO (Editar / Excluir) */}
      <AbastecimentoExternoFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
          onRefresh?.();
        }}
        veiculos={veiculos}
        abastecimento={editingRecord}
      />

      <AbastecimentoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeletingRecord(null);
        }}
        onSuccess={() => {
          setIsDeleteDialogOpen(false);
          setDeletingRecord(null);
          onRefresh?.();
        }}
        abastecimento={deletingRecord}
      />

      {/* MODAL DE DETALHES DE UM LANÇAMENTO ESPECÍFICO */}
      <Dialog open={!!selectedRecordForDetail} onOpenChange={open => !open && setSelectedRecordForDetail(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Fuel className="w-5 h-5 text-emerald-400" />
              Detalhes do Abastecimento Externo
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Informações completas do registro vinculado ao veículo e cliente.
            </DialogDescription>
          </DialogHeader>

          {selectedRecordForDetail && (
            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Veículo</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">{selectedRecordForDetail.vehiclePlate}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Data</span>
                  <span className="text-zinc-200 font-semibold">{new Date(selectedRecordForDetail.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Cliente</span>
                  <span className="text-zinc-200">{selectedRecordForDetail.clientName || '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Obra / Setor</span>
                  <span className="text-zinc-200">{selectedRecordForDetail.obraName || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Combustível</span>
                  <span className="font-semibold text-zinc-200">{selectedRecordForDetail.fuelType}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Litros</span>
                  <span className="font-mono font-bold text-zinc-200">{selectedRecordForDetail.quantity.toFixed(1)} L</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Valor Total</span>
                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(selectedRecordForDetail.cost)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Preço / Litro</span>
                  <span className="font-mono text-zinc-300">R$ {(selectedRecordForDetail.pricePerLiter || 0).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">KM Inicial</span>
                  <span className="font-mono text-zinc-300">{selectedRecordForDetail.initialMileage ? `${selectedRecordForDetail.initialMileage} km` : '—'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">KM Final</span>
                  <span className="font-mono text-zinc-300">{selectedRecordForDetail.mileage ? `${selectedRecordForDetail.mileage} km` : '—'}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1.5">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Posto de Gasolina</span>
                  <span className="text-zinc-200 font-medium">{selectedRecordForDetail.station || '—'}</span>
                </div>
                {selectedRecordForDetail.notes && (
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Observações / Cupom</span>
                    <p className="text-zinc-300 italic">{selectedRecordForDetail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRecordForDetail(null)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AbastecimentoExternoReport;
