import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CostSimulation,
  calculateSimulation,
  VEHICLE_CATEGORIES,
  STATUS_LABELS,
} from '@/services/costSimulationService';
import { CostDrilldownModal } from './CostDrilldownModal';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import {
  Calculator,
  DollarSign,
  Fuel,
  Users,
  Route,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  Plus,
  Minus,
  Bus,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpDown,
  Download,
} from 'lucide-react';

export interface SelectedFleetItem {
  simulation: CostSimulation;
  quantity: number;
}

interface CostSummaryTabProps {
  simulations: CostSimulation[];
  loading?: boolean;
  onEditSimulation: (simulation: CostSimulation) => void;
  onDeleteSimulation: (simulation: CostSimulation) => void;
  onNewSimulation: () => void;
  onGenerateProposal?: (simulation: CostSimulation) => void;
  onGenerateMultiProposal?: (items: SelectedFleetItem[]) => void;
}

const fmtBRL = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 0,00';

const fmtKm = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km`
    : '0 km';

const fmtPct = (v?: number) =>
  typeof v === 'number' && isFinite(v)
    ? `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
    : '0%';

export const CostSummaryTab: React.FC<CostSummaryTabProps> = ({
  simulations,
  loading = false,
  onEditSimulation,
  onDeleteSimulation,
  onNewSimulation,
  onGenerateProposal,
  onGenerateMultiProposal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSimulation, setSelectedSimulation] = useState<CostSimulation | null>(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);

  // Seleção múltipla para propostas de frota
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean; quantity: number }>>({});

  const handleToggleItem = (id: string, checked: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [id]: { selected: checked, quantity: prev[id]?.quantity || 1 },
    }));
  };

  const handleToggleAll = (checked: boolean) => {
    const next: Record<string, { selected: boolean; quantity: number }> = {};
    if (checked) {
      filteredSimulations.forEach((s) => {
        if (s.id) {
          next[s.id] = { selected: true, quantity: selectedItems[s.id]?.quantity || 1 };
        }
      });
    }
    setSelectedItems(next);
  };

  const handleChangeQuantity = (id: string, delta: number) => {
    setSelectedItems((prev) => {
      const currentQty = prev[id]?.quantity || 1;
      const newQty = Math.max(1, currentQty + delta);
      return {
        ...prev,
        [id]: { selected: true, quantity: newQty },
      };
    });
  };

  const handleClearSelection = () => {
    setSelectedItems({});
  };

  // Filtragem das simulações
  const filteredSimulations = useMemo(() => {
    return simulations.filter((s) => {
      const matchesSearch =
        !searchTerm.trim() ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.origin && s.origin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.destination && s.destination.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.clientName && s.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        categoryFilter === 'ALL' || s.vehicleCategory === categoryFilter;

      const matchesStatus =
        statusFilter === 'ALL' || s.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [simulations, searchTerm, categoryFilter, statusFilter]);

  // Itens de frota selecionados
  const selectedFleetList = useMemo(() => {
    return simulations
      .filter((s) => s.id && selectedItems[s.id]?.selected)
      .map((s) => ({
        simulation: s,
        quantity: selectedItems[s.id!]?.quantity || 1,
      }));
  }, [simulations, selectedItems]);

  const isAllSelected = useMemo(() => {
    return (
      filteredSimulations.length > 0 &&
      filteredSimulations.every((s) => s.id && selectedItems[s.id]?.selected)
    );
  }, [filteredSimulations, selectedItems]);

  // KPIs da listagem
  const kpis = useMemo(() => {
    const totalLines = simulations.length;
    const totalMonthlyRevenue = simulations.reduce((sum, s) => sum + (s.monthlyPrice || 0), 0);
    const totalFranchiseKm = simulations.reduce((sum, s) => sum + (s.franchiseKm || (s.dailyKm * (s.operatingDays || 26))), 0);
    const avgCostPerKm = totalFranchiseKm > 0 ? (totalMonthlyRevenue / totalFranchiseKm) : 0;
    const avgMargin = simulations.length > 0
      ? simulations.reduce((sum, s) => sum + (s.profitMarginPct || 0.12), 0) / simulations.length
      : 0.12;

    return {
      totalLines,
      totalMonthlyRevenue,
      totalFranchiseKm,
      avgCostPerKm,
      avgMargin,
    };
  }, [simulations]);

  const totalSelectedVehicles = useMemo(() => {
    return selectedFleetList.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedFleetList]);

  const totalSelectedMonthly = useMemo(() => {
    return selectedFleetList.reduce((sum, item) => {
      return sum + (item.simulation.monthlyPrice || 0) * item.quantity;
    }, 0);
  }, [selectedFleetList]);

  const totalSelectedFranchiseKm = useMemo(() => {
    return selectedFleetList.reduce((sum, item) => {
      const km = item.simulation.franchiseKm || (item.simulation.dailyKm * (item.simulation.operatingDays || 26));
      return sum + km * item.quantity;
    }, 0);
  }, [selectedFleetList]);

  // Exportar Tabela Consolidada para Excel
  const handleExportExcel = () => {
    const data = filteredSimulations.map((s, idx) => ({
      'IT.': s.itemNumber || idx + 1,
      'PROPOSTA / OPERAÇÃO': s.name,
      'CLIENTE / LEAD': s.clientName || 'Não vinculado',
      'VEÍCULO': s.vehicleTypeLabel || (s.vehicleCategory === 'BUS' ? 'ÔNIBUS' : s.vehicleCategory === 'MICRO_BUS' ? 'MICRO' : 'VAN'),
      'TURNO': s.shift || `${s.driverCount} turno(s)`,
      'ESCALA': s.scale || 'SEG Á SAB',
      'INICIAL': s.origin || 'N/A',
      'FINAL': s.destination || 'N/A',
      'MOTORISTAS': s.driverCount,
      'KM DIÁRIO': s.dailyKm,
      'KM MENSAL': s.franchiseKm || (s.dailyKm * (s.operatingDays || 26)),
      'VALOR MENSAL (R$)': s.monthlyPrice || 0,
      'VALOR DA DIÁRIA (R$)': s.dailyRate || 0,
      'STATUS': s.status ? STATUS_LABELS[s.status] : 'Rascunho',
    }));

    exportToExcel(data, `Tabela_Precos_Consolidada_${new Date().toISOString().split('T')[0]}`);
  };

  const openDrilldown = (s: CostSimulation) => {
    setSelectedSimulation(s);
    setDrilldownOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Modal de Detalhamento Drill-down */}
      <CostDrilldownModal
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        simulation={selectedSimulation}
        onEdit={(s) => {
          onEditSimulation(s);
        }}
        onGenerateProposal={onGenerateProposal}
      />

      {/* Top Header Card */}
      <div className="bg-card/90 backdrop-blur-md border border-border/60 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500 flex items-center justify-center shrink-0">
            <Bus className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Tabela Consolidada de Preços & Orçamentos
              </h2>
              <Badge className="bg-red-600/20 text-red-400 border-none font-semibold text-[10px] uppercase">
                Resumo de Custos
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Quadro resumo com todas as operações precificadas, KPIs globais e geração de propostas oficiais.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="text-xs font-semibold gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Exportar Excel
          </Button>
          <Button
            onClick={onNewSimulation}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 rounded-xl shadow-lg shadow-red-600/20 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Barra Flutuante de Composição de Frota Multi-Veículos */}
      {selectedFleetList.length > 0 && (
        <div className="sticky top-4 z-30 bg-gradient-to-r from-slate-900/95 via-slate-900/95 to-slate-950/95 border-2 border-red-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-red-950/40 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600/20 border border-red-500/40 rounded-xl text-red-400 shrink-0">
              <Bus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Composição de Frota Selecionada</span>
                <Badge className="bg-red-600 text-white font-bold text-xs px-2.5 py-0.5">
                  {totalSelectedVehicles} veículo(s) em {selectedFleetList.length} linha(s)
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1">
                <span>Franquia Global: <strong className="text-white">{fmtKm(totalSelectedFranchiseKm)}</strong></span>
                <span>•</span>
                <span>Faturamento Mensal: <strong className="text-emerald-400 font-bold text-sm">{fmtBRL(totalSelectedMonthly)}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-white text-xs"
            >
              Limpar Seleção
            </Button>
            <Button
              onClick={() => onGenerateMultiProposal && onGenerateMultiProposal(selectedFleetList)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center gap-2 shrink-0 text-xs"
            >
              <FileText className="h-4 w-4" />
              <span>Gerar Proposta da Frota ({totalSelectedVehicles} Veículos)</span>
            </Button>
          </div>
        </div>
      )}

      {/* Cards de KPIs Globais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur border border-border/60 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Total de Rotas / Linhas</span>
            <Bus className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{kpis.totalLines}</div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Operações orçadas</p>
        </Card>

        <Card className="bg-card/60 backdrop-blur border border-border/60 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Receita Mensal Total</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-500">
            {fmtBRL(kpis.totalMonthlyRevenue)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Faturamento consolidado</p>
        </Card>

        <Card className="bg-card/60 backdrop-blur border border-border/60 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">KM Total Mensal</span>
            <Route className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {fmtKm(kpis.totalFranchiseKm)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Franquia projetada</p>
        </Card>

        <Card className="bg-card/60 backdrop-blur border border-border/60 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">Custo Médio / KM</span>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">
            {fmtBRL(kpis.avgCostPerKm)} / km
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Margem média: {fmtPct(kpis.avgMargin)}</p>
        </Card>
      </div>

      {/* Tabela Consolidada de Preços */}
      <Card className="border border-border/60 rounded-2xl shadow-xl overflow-hidden bg-card/90">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">
                Tabela de Preços Atualizada (Quadro Resumo)
              </CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                {filteredSimulations.length} linha(s)
              </Badge>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar rota, origem, destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32 text-xs h-9">
                  <SelectValue placeholder="Veículo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Todos Veículos</SelectItem>
                  <SelectItem value="BUS" className="text-xs">Ônibus</SelectItem>
                  <SelectItem value="MICRO_BUS" className="text-xs">Micro-ônibus</SelectItem>
                  <SelectItem value="VAN" className="text-xs">Van Sprinter</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 text-xs h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Todos Status</SelectItem>
                  <SelectItem value="APPROVED" className="text-xs">Aprovado</SelectItem>
                  <SelectItem value="DRAFT" className="text-xs">Rascunho</SelectItem>
                  <SelectItem value="PENDING_APPROVAL" className="text-xs">Em Análise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
              <p className="text-sm">Carregando tabela consolidada...</p>
            </div>
          ) : filteredSimulations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Bus className="h-10 w-10 mx-auto opacity-30 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma operação encontrada com os filtros atuais.</p>
              <Button onClick={onNewSimulation} variant="outline" size="sm" className="text-xs">
                <Plus className="h-3.5 w-3.5 mr-1" /> Criar Novo Lançamento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/40 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-3 w-10 text-center">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={(checked) => handleToggleAll(!!checked)}
                        aria-label="Selecionar todas"
                      />
                    </th>
                    <th className="py-3 px-2 w-16 text-center">Qtd</th>
                    <th className="py-3 px-3 w-10 text-center">IT.</th>
                    <th className="py-3 px-3 min-w-[200px]">Proposta / Operação</th>
                    <th className="py-3 px-3 min-w-[150px]">Cliente / Lead</th>
                    <th className="py-3 px-3">Veículo</th>
                    <th className="py-3 px-3">Turno / Horários</th>
                    <th className="py-3 px-3">Escala</th>
                    <th className="py-3 px-3">Inicial</th>
                    <th className="py-3 px-3">Final</th>
                    <th className="py-3 px-3 text-center">Mot.</th>
                    <th className="py-3 px-3 text-right">KM Diário</th>
                    <th className="py-3 px-3 text-right">KM Mensal</th>
                    <th className="py-3 px-4 text-right font-bold text-foreground">VALOR FINAL</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredSimulations.map((s, idx) => {
                    const isChecked = !!(s.id && selectedItems[s.id]?.selected);
                    const qty = s.id ? selectedItems[s.id]?.quantity || 1 : 1;
                    const itemNum = s.itemNumber || idx + 1;
                    const vehicleLabel = s.vehicleTypeLabel || (s.vehicleCategory === 'BUS' ? 'ÔNIBUS' : s.vehicleCategory === 'MICRO_BUS' ? 'MICRO' : 'VAN');
                    const monthlyVal = s.monthlyPrice || 0;
                    const monthlyKm = s.franchiseKm || (s.dailyKm * (s.operatingDays || 26));

                    return (
                      <tr
                        key={s.id || idx}
                        className={`transition-colors cursor-pointer ${
                          isChecked ? 'bg-red-500/10 hover:bg-red-500/15' : 'hover:bg-accent/20'
                        }`}
                        onClick={(e) => {
                          // Se não clicou em botão ou checkbox, abrir o modal drilldown
                          const target = e.target as HTMLElement;
                          if (!target.closest('button') && !target.closest('input')) {
                            openDrilldown(s);
                          }
                        }}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {s.id && (
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={(checked) => handleToggleItem(s.id!, !!checked)}
                              aria-label={`Selecionar ${s.name}`}
                            />
                          )}
                        </td>
                        <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-0.5 bg-slate-950/60 border border-border/60 rounded-md p-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={qty <= 1}
                              onClick={() => s.id && handleChangeQuantity(s.id, -1)}
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </Button>
                            <span className="font-bold text-[11px] w-4 text-center text-foreground">{qty}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => s.id && handleChangeQuantity(s.id, 1)}
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-muted-foreground">
                          {itemNum}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground max-w-[240px]" title={s.name}>
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="h-3.5 w-3.5 text-red-500 shrink-0" />
                            <span className="truncate font-bold text-foreground">{s.name || `Proposta #${itemNum}`}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 max-w-[180px]" title={s.clientName || 'Cliente / Lead'}>
                          {s.clientName ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 truncate">
                                {s.clientName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px] italic">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                            {vehicleLabel}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate" title={s.shift || ''}>
                          {s.shift || `${s.driverCount} Turno(s)`}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                          {s.scale || 'SEG Á SAB'}
                        </td>
                        <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                          {s.origin || '—'}
                        </td>
                        <td className="py-3 px-3 font-medium text-foreground whitespace-nowrap">
                          {s.destination || '—'}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-foreground">
                          {s.driverCount}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground font-medium">
                          {s.dailyKm}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground font-medium">
                          {monthlyKm.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-500 whitespace-nowrap text-sm">
                          {fmtBRL(monthlyVal)}
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDrilldown(s)}
                              title="Ver Quadro Resumo de Custos"
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditSimulation(s)}
                              title="Editar no Lançamento de Custos"
                              className="h-7 w-7 p-0 rounded-lg text-blue-400 hover:text-blue-300"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {onGenerateProposal && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onGenerateProposal(s)}
                                title="Gerar Proposta Comercial Oficial"
                                className="h-7 w-7 p-0 rounded-lg text-purple-400 hover:text-purple-300"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteSimulation(s)}
                              title="Excluir Rota"
                              className="h-7 w-7 p-0 rounded-lg text-red-500 hover:text-red-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CostSummaryTab;
