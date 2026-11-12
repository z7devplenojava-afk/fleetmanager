import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import fleetComponentControlService, {
  buildWorkOrderPrefillFromComponentRow,
  COMPONENT_CONTROLS_META,
  ComponentControlType,
  FleetComponentControlConfig,
  FleetComponentControlRow,
} from '@/services/fleetComponentControlService';
import fleetWorkOrderService, { FleetWorkOrder } from '@/services/fleetWorkOrderService';
import { DueComponentsAlertModal } from './DueComponentsAlertModal';
import {
  AlertTriangle,
  Bell,
  Check,
  Clock,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

interface FleetComponentControlsPanelProps {
  onCreateWorkOrder: (initialValues: Partial<FleetWorkOrder>) => void;
  defaultSubTab?: ControlSubTab;
  showAutoAlertModalOnMount?: boolean;
}

export type ControlSubTab =
  | 'ALL'
  | ComponentControlType
  | 'ALERTS'
  | 'CONFIG';

const formatBrDate = (iso?: string) => {
  if (!iso) return '—';
  const clean = iso.split('T')[0];
  const [y, m, d] = clean.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
};

export const FleetComponentControlsPanel: React.FC<FleetComponentControlsPanelProps> = ({
  onCreateWorkOrder,
  defaultSubTab = 'ALL',
  showAutoAlertModalOnMount = true,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [subTab, setSubTab] = useState<ControlSubTab>(defaultSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'OK'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [hasTriggeredAutoModal, setHasTriggeredAutoModal] = useState(false);

  // Manual entry modal state
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState<{
    vehicleId: string;
    controlType: ComponentControlType;
    serviceDate: string;
    serviceKm: number;
    nextDueKm: number;
    oilFilterChanged: boolean;
    dieselFilterChanged: boolean;
    waterSeparatorFilterChanged: boolean;
    airFilterChanged: boolean;
    notes: string;
  }>({
    vehicleId: '',
    controlType: 'ALIGNMENT',
    serviceDate: new Date().toISOString().split('T')[0],
    serviceKm: 0,
    nextDueKm: 20000,
    oilFilterChanged: true,
    dieselFilterChanged: true,
    waterSeparatorFilterChanged: true,
    airFilterChanged: true,
    notes: '',
  });

  const apiControlType =
    subTab !== 'ALL' && subTab !== 'ALERTS' && subTab !== 'CONFIG' ? subTab : undefined;

  const { data: dashboard, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['fleet-component-controls', apiControlType, selectedMonth, selectedYear],
    queryFn: () =>
      fleetComponentControlService.getDashboard({
        controlType: apiControlType || 'ALL',
        month: selectedMonth !== 'ALL' ? Number(selectedMonth) : undefined,
        year: selectedMonth !== 'ALL' ? Number(selectedYear) : undefined,
      }),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-component-controls'],
    queryFn: fleetService.getVehicles,
  });

  const { data: scheduleMatrix = [] } = useQuery({
    queryKey: ['preventive-schedule-matrix'],
    queryFn: () => fleetWorkOrderService.getPreventiveSchedule(),
  });

  const [configForm, setConfigForm] = useState<FleetComponentControlConfig | null>(null);

  useEffect(() => {
    if (dashboard?.config) {
      setConfigForm(dashboard.config);
    }
  }, [dashboard?.config]);

  useEffect(() => {
    if (
      showAutoAlertModalOnMount &&
      !hasTriggeredAutoModal &&
      dashboard?.expiringAlerts &&
      dashboard.expiringAlerts.length > 0
    ) {
      setAlertModalOpen(true);
      setHasTriggeredAutoModal(true);
    }
  }, [showAutoAlertModalOnMount, hasTriggeredAutoModal, dashboard?.expiringAlerts]);

  const manualMutation = useMutation({
    mutationFn: (payload: Partial<FleetComponentControlRow>) =>
      fleetComponentControlService.recordManual(payload),
    onSuccess: () => {
      toast({ title: 'Controle preventivo registrado com sucesso!' });
      queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
      queryClient.invalidateQueries({ queryKey: ['system-alerts-center'] });
      setManualModalOpen(false);
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar controle',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const configMutation = useMutation({
    mutationFn: (cfg: FleetComponentControlConfig) =>
      fleetComponentControlService.updateConfig(cfg),
    onSuccess: () => {
      toast({ title: 'Intervalos e parâmetros salvos!' });
      queryClient.invalidateQueries({ queryKey: ['fleet-component-controls'] });
    },
    onError: (err: any) => {
      toast({
        title: 'Erro ao salvar parâmetros',
        description: err?.response?.data?.message || err.message,
        variant: 'destructive',
      });
    },
  });

  const filteredRows = useMemo(() => {
    const source = subTab === 'ALERTS' ? (dashboard?.expiringAlerts || []) : (dashboard?.rows || []);
    const q = searchTerm.trim().toLowerCase();
    return source.filter((r) => {
      if (subTab !== 'ALERTS' && statusFilter !== 'ALL' && r.alertStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (r.fleetNumber || '').toLowerCase().includes(q) ||
        (r.plate || '').toLowerCase().includes(q) ||
        (r.model || '').toLowerCase().includes(q) ||
        (r.controlLabel || '').toLowerCase().includes(q) ||
        (r.osNumber || '').toLowerCase().includes(q)
      );
    });
  }, [dashboard, subTab, searchTerm, statusFilter]);

  const showOilFilterColumns = subTab === 'ENGINE_OIL';

  const getIntervalKmForControl = (type: ComponentControlType, cfg?: FleetComponentControlConfig) => {
    if (type === 'ENGINE_OIL') return cfg?.engineOilIntervalKm ?? 25000;
    if (type === 'STARTER') return cfg?.starterIntervalKm ?? 200000;
    if (type === 'ALTERNATOR') return cfg?.alternatorIntervalKm ?? 150000;
    if (type === 'ALTERNATOR_INSPECTION') return cfg?.alternatorQuickCheckIntervalKm ?? 15000;
    if (type === 'PULLEY_BEARING') return cfg?.pulleyBearingIntervalKm ?? 20000;
    return cfg?.alignmentIntervalKm ?? 20000;
  };

  const openManualModalForRow = (row?: FleetComponentControlRow) => {
    const fallbackType: ComponentControlType =
      row?.controlType ||
      (subTab !== 'ALL' && subTab !== 'ALERTS' && subTab !== 'CONFIG' ? subTab : 'ALIGNMENT');
    const defaultInt = getIntervalKmForControl(fallbackType, dashboard?.config);

    const kmBase = row?.currentKm ?? 0;
    setManualForm({
      vehicleId: row?.vehicleId || vehicles[0]?.id || '',
      controlType: fallbackType,
      serviceDate: row?.serviceDate ? row.serviceDate.split('T')[0] : new Date().toISOString().split('T')[0],
      serviceKm: row?.serviceKm ?? kmBase,
      nextDueKm: (row?.serviceKm ?? kmBase) + defaultInt,
      oilFilterChanged: row?.oilFilterChanged ?? true,
      dieselFilterChanged: row?.dieselFilterChanged ?? true,
      waterSeparatorFilterChanged: row?.waterSeparatorFilterChanged ?? true,
      airFilterChanged: row?.airFilterChanged ?? true,
      notes: '',
    });
    setManualModalOpen(true);
  };

  const triggerOsForRow = (row: FleetComponentControlRow) => {
    onCreateWorkOrder(buildWorkOrderPrefillFromComponentRow(row));
  };

  const expiringCount = dashboard?.expiringAlerts?.length || 0;

  return (
    <div className="space-y-4">
      {/* KPI Strip + Action Buttons */}
      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase">Vencidos</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-2xl font-bold font-mono text-red-400">{dashboard?.overdueCount ?? 0}</div>
              <span className="text-[10px] text-gray-400">KM ultrapassado</span>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase">Próx. do Vencimento</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-2xl font-bold font-mono text-amber-400">{dashboard?.dueSoonCount ?? 0}</div>
              <span className="text-[10px] text-gray-400">
                &le; {(dashboard?.config?.alertThresholdKm ?? 3000).toLocaleString('pt-BR')} km
              </span>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase">Em Dia</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-2xl font-bold font-mono text-emerald-400">{dashboard?.okCount ?? 0}</div>
              <span className="text-[10px] text-gray-400">Dentro do ciclo</span>
            </CardContent>
          </Card>

          <Card
            onClick={() => setAlertModalOpen(true)}
            className="bg-seguranca-graphite border-amber-500/40 cursor-pointer hover:border-amber-400 transition-colors"
          >
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-[10px] font-semibold text-amber-300 uppercase flex items-center gap-1">
                <Bell className="h-3 w-3" /> Modal de Alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-3">
              <div className="text-2xl font-bold font-mono text-white">{expiringCount}</div>
              <span className="text-[10px] text-amber-300 underline">Abrir modal de vencimentos</span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-gray-600 text-gray-200 hover:bg-gray-800 text-xs"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => openManualModalForRow()}
            className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Lançar / Ajustar Controle
          </Button>
        </div>
      </div>

      {/* Abas dos 5 Controles + Alertas de Vencimentos + Parâmetros */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardHeader className="border-b border-gray-700/70 bg-seguranca-black/40 p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={subTab === 'ALL' ? 'default' : 'outline'}
              onClick={() => setSubTab('ALL')}
              className={`h-8 text-xs ${subTab === 'ALL' ? 'bg-seguranca-red text-white' : 'border-gray-700 text-gray-300'}`}
            >
              Todos os Controles
            </Button>

            {COMPONENT_CONTROLS_META.map((ctrl) => (
              <Button
                key={ctrl.type}
                size="sm"
                variant={subTab === ctrl.type ? 'default' : 'outline'}
                onClick={() => setSubTab(ctrl.type)}
                className={`h-8 text-xs ${
                  subTab === ctrl.type ? 'bg-seguranca-red text-white' : 'border-gray-700 text-gray-300'
                }`}
              >
                {ctrl.label}
              </Button>
            ))}

            <Button
              size="sm"
              variant={subTab === 'ALERTS' ? 'default' : 'outline'}
              onClick={() => setSubTab('ALERTS')}
              className={`h-8 text-xs ${
                subTab === 'ALERTS'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-amber-500/50 text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              Alertas de Vencimentos
              {expiringCount > 0 && (
                <Badge className="ml-1.5 bg-red-600 text-white text-[10px] px-1.5 py-0">
                  {expiringCount}
                </Badge>
              )}
            </Button>

            <Button
              size="sm"
              variant={subTab === 'CONFIG' ? 'default' : 'outline'}
              onClick={() => setSubTab('CONFIG')}
              className={`h-8 text-xs ${subTab === 'CONFIG' ? 'bg-blue-600 text-white' : 'border-gray-700 text-gray-300'}`}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Parâmetros
            </Button>
          </div>

          {subTab !== 'CONFIG' && (
            <div className="flex flex-col md:flex-row gap-2.5 justify-between pt-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar frota, placa, modelo ou OS..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-seguranca-black border-gray-600 text-xs text-white"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-36 h-9 bg-seguranca-black border-gray-600 text-xs text-white">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                    <SelectItem value="ALL">Todos os Meses</SelectItem>
                    {Array.from({ length: 12 }, (_, idx) => {
                      const monthNum = idx + 1;
                      const label = new Date(2026, idx, 1)
                        .toLocaleDateString('pt-BR', { month: 'long' })
                        .toUpperCase();
                      return (
                        <SelectItem key={monthNum} value={String(monthNum)}>
                          {label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {selectedMonth !== 'ALL' && (
                  <Input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-24 h-9 bg-seguranca-black border-gray-600 text-xs font-mono text-white"
                  />
                )}

                {subTab !== 'ALERTS' && (
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-44 h-9 bg-seguranca-black border-gray-600 text-xs text-white">
                      <SelectValue placeholder="Situação" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                      <SelectItem value="ALL">Todas as Situações</SelectItem>
                      <SelectItem value="OVERDUE">Vencidos</SelectItem>
                      <SelectItem value="DUE_SOON">Próximos do Vencimento</SelectItem>
                      <SelectItem value="OK">Em Dia</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-4">
          {subTab === 'CONFIG' && configForm ? (
            <div className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Alinhamento (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.alignmentIntervalKm}
                    onChange={(e) => setConfigForm({ ...configForm, alignmentIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Troca de Óleo de Motor (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.engineOilIntervalKm}
                    onChange={(e) => setConfigForm({ ...configForm, engineOilIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Rolamento da Polia (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.pulleyBearingIntervalKm}
                    onChange={(e) => setConfigForm({ ...configForm, pulleyBearingIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Revisão - Arranque (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.starterIntervalKm}
                    onChange={(e) => setConfigForm({ ...configForm, starterIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alternador - Inspeção Rápida (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.alternatorQuickCheckIntervalKm ?? 15000}
                    onChange={(e) => setConfigForm({ ...configForm, alternatorQuickCheckIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Alternador - Revisão Geral / Troca (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.alternatorIntervalKm}
                    onChange={(e) => setConfigForm({ ...configForm, alternatorIntervalKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-gray-600 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-300 font-semibold">Antecedência Alerta / Modal (KM)</Label>
                  <Input
                    type="number"
                    value={configForm.alertThresholdKm}
                    onChange={(e) => setConfigForm({ ...configForm, alertThresholdKm: Number(e.target.value) })}
                    className="bg-seguranca-black border-amber-500/50 font-mono text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Modelo Padrão OS Preventiva</Label>
                  <Select
                    value={configForm.defaultPreventiveModel || 'MODELO_2'}
                    onValueChange={(v) => setConfigForm({ ...configForm, defaultPreventiveModel: v })}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                      <SelectItem value="MODELO_2">Modelo 2 (Automático — Check-List Frota)</SelectItem>
                      <SelectItem value="MODELO_1">Modelo 1 (Checklist Completo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-emerald-200 cursor-pointer bg-emerald-950/30 border border-emerald-700/40 rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={configForm.autoOpenPreventiveOs !== false}
                  onChange={(e) => setConfigForm({ ...configForm, autoOpenPreventiveOs: e.target.checked })}
                  className="rounded border-gray-500 h-4 w-4"
                />
                <span>
                  Abrir automaticamente OS Preventiva <b>Modelo 2</b> ao atualizar KM do veículo (Parte Diária / Checklist / Rotina Diária), sem duplicar OS já aberta.
                </span>
              </label>
              <Button
                onClick={() => configMutation.mutate(configForm)}
                disabled={configMutation.isPending}
                className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {configMutation.isPending ? 'Salvando...' : 'Salvar Parâmetros'}
              </Button>

              {scheduleMatrix.length > 0 && (
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Matriz Preventiva Automática Modelo 2 (Urbano vs Rodoviário) &amp; Alternador 150.000 km
                  </h4>
                  <div className="bg-seguranca-black border border-gray-700 rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-seguranca-graphite">
                        <TableRow className="border-gray-700">
                          <TableHead className="text-[11px] text-white font-bold">Sistema / Componente</TableHead>
                          <TableHead className="text-[11px] text-white font-bold">Urbano (KM)</TableHead>
                          <TableHead className="text-[11px] text-white font-bold">Rodoviário (KM)</TableHead>
                          <TableHead className="text-[11px] text-white font-bold">Observações de Manutenção</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduleMatrix.map((row) => (
                          <TableRow
                            key={row.code}
                            className={`border-gray-800 ${
                              row.code === 'ALTERNATOR_OVERHAUL' || row.code === 'ALTERNATOR_QUICK'
                                ? 'bg-amber-950/25'
                                : ''
                            }`}
                          >
                            <TableCell className="text-xs font-semibold text-white">{row.systemName}</TableCell>
                            <TableCell className="text-xs font-mono text-emerald-300">{row.urbanRangeLabel}</TableCell>
                            <TableCell className="text-xs font-mono text-blue-300">{row.roadRangeLabel}</TableCell>
                            <TableCell className="text-xs text-gray-300">{row.notes}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center text-gray-400 text-xs">Carregando controles preventivos...</div>
          ) : (
            <div className="bg-seguranca-black border border-gray-700 rounded-xl overflow-x-auto">
              <Table>
                <TableHeader className="bg-seguranca-graphite">
                  <TableRow className="border-gray-700">
                    <TableHead className="text-xs font-bold text-white">FROTA / PLACA</TableHead>
                    {(subTab === 'ALL' || subTab === 'ALERTS') && (
                      <TableHead className="text-xs font-bold text-white">CONTROLE</TableHead>
                    )}
                    <TableHead className="text-xs font-bold text-white">TROCA EFETIVADA</TableHead>
                    {showOilFilterColumns && (
                      <>
                        <TableHead className="text-xs font-bold text-center text-white">FILTRO ÓLEO</TableHead>
                        <TableHead className="text-xs font-bold text-center text-white">FILTRO DIESEL</TableHead>
                        <TableHead className="text-xs font-bold text-center text-white">SEP. ÁGUA</TableHead>
                        <TableHead className="text-xs font-bold text-center text-white">FILTRO AR</TableHead>
                      </>
                    )}
                    <TableHead className="text-xs font-bold text-right text-white">KM TROCA</TableHead>
                    <TableHead className="text-xs font-bold text-right text-white">KM ATUAL</TableHead>
                    <TableHead className="text-xs font-bold text-right text-white">PRÓXIMA TROCA</TableHead>
                    <TableHead className="text-xs font-bold text-right text-red-400">KM FALTA P/ TROCA</TableHead>
                    <TableHead className="text-xs font-bold text-right text-white">AÇÕES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => {
                      const isOverdue = row.alertStatus === 'OVERDUE';
                      const isSoon = row.alertStatus === 'DUE_SOON';
                      return (
                        <TableRow
                          key={`${row.vehicleId}-${row.controlType}`}
                          className={`border-gray-800 hover:bg-seguranca-graphite/40 text-xs ${
                            isOverdue ? 'bg-red-950/15' : isSoon ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          <TableCell className="font-mono font-bold text-white">
                            <div>{row.fleetNumber || row.plate}</div>
                            {row.fleetNumber && <span className="text-[10px] text-gray-400">{row.plate}</span>}
                          </TableCell>

                          {(subTab === 'ALL' || subTab === 'ALERTS') && (
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] border-gray-600 text-seguranca-yellow">
                                {row.controlLabel}
                              </Badge>
                            </TableCell>
                          )}

                          <TableCell className="font-mono text-gray-200">
                            <div>{formatBrDate(row.serviceDate)}</div>
                            {row.osNumber && (
                              <span className="text-[10px] text-blue-300">{row.osNumber}</span>
                            )}
                          </TableCell>

                          {showOilFilterColumns && (
                            <>
                              <TableCell className="text-center">
                                {row.oilFilterChanged ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-gray-600">—</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.dieselFilterChanged ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-gray-600">—</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.waterSeparatorFilterChanged ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-gray-600">—</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {row.airFilterChanged ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <span className="text-gray-600">—</span>}
                              </TableCell>
                            </>
                          )}

                          <TableCell className="text-right font-mono text-gray-300">
                            {row.serviceKm != null ? row.serviceKm.toLocaleString('pt-BR') : '—'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-gray-200">
                            {row.currentKm.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-blue-300 font-semibold">
                            {row.nextDueKm.toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            <span
                              className={
                                isOverdue
                                  ? 'text-red-400'
                                  : isSoon
                                  ? 'text-amber-300'
                                  : 'text-emerald-400'
                              }
                            >
                              {row.kmRemaining.toLocaleString('pt-BR')}
                            </span>
                            {isOverdue && (
                              <span className="block text-[9px] text-red-400">VENCIDO</span>
                            )}
                            {isSoon && (
                              <span className="block text-[9px] text-amber-300">PRÓXIMO</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openManualModalForRow(row)}
                                className="h-7 px-2 text-[11px] border-gray-600 text-gray-200 hover:bg-gray-800"
                                title="Lançar / Ajustar troca manual"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => triggerOsForRow(row)}
                                className="h-7 px-2.5 text-[11px] bg-seguranca-red hover:bg-seguranca-darkred text-white"
                              >
                                <Wrench className="h-3 w-3 mr-1" /> Abrir OS
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={showOilFilterColumns ? 12 : 8} className="h-24 text-center text-gray-400 text-xs">
                        {subTab === 'ALERTS' ? (
                          <span className="flex items-center justify-center gap-2 text-emerald-400">
                            <ShieldCheck className="h-4 w-4" /> Nenhum componente vencido ou próximo do vencimento!
                          </span>
                        ) : (
                          'Nenhum registro encontrado para os filtros atuais.'
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Lançamento / Ajuste Manual (para importar dados históricos das planilhas) */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <DialogContent className="max-w-lg bg-seguranca-graphite border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Registrar / Ajustar Histórico de Controle Preventivo
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-400">
              Use este formulário para lançar a última troca histórica ou ajustar o próximo vencimento. Novas OS concluídas atualizam este painel automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Veículo / Frota *</Label>
                <Select
                  value={manualForm.vehicleId}
                  onValueChange={(v) => setManualForm((p) => ({ ...p, vehicleId: v }))}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white max-h-56">
                    {vehicles.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.fleetNumber ? `[${v.fleetNumber}] ` : ''}{v.plate} • {(v.currentMileage || 0).toLocaleString('pt-BR')} km
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Controle *</Label>
                <Select
                  value={manualForm.controlType}
                  onValueChange={(v: ComponentControlType) => {
                    const interval = getIntervalKmForControl(v, dashboard?.config);
                    setManualForm((p) => ({
                      ...p,
                      controlType: v,
                      nextDueKm: (p.serviceKm || 0) + interval,
                    }));
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                    {COMPONENT_CONTROLS_META.map((c) => (
                      <SelectItem key={c.type} value={c.type}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Troca Efetivada (Data) *</Label>
                <Input
                  type="date"
                  value={manualForm.serviceDate}
                  onChange={(e) => setManualForm((p) => ({ ...p, serviceDate: e.target.value }))}
                  className="bg-seguranca-black border-gray-600 text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">KM da Troca *</Label>
                <Input
                  type="number"
                  value={manualForm.serviceKm}
                  onChange={(e) => {
                    const km = Number(e.target.value) || 0;
                    const interval = getIntervalKmForControl(manualForm.controlType, dashboard?.config);
                    setManualForm((p) => ({ ...p, serviceKm: km, nextDueKm: km + interval }));
                  }}
                  className="bg-seguranca-black border-gray-600 font-mono text-xs text-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Próxima Troca (KM) *</Label>
                <Input
                  type="number"
                  value={manualForm.nextDueKm}
                  onChange={(e) => setManualForm((p) => ({ ...p, nextDueKm: Number(e.target.value) || 0 }))}
                  className="bg-seguranca-black border-gray-600 font-mono text-xs text-white"
                />
              </div>
            </div>

            {manualForm.controlType === 'ENGINE_OIL' && (
              <div className="p-3 rounded-lg bg-seguranca-black/60 border border-gray-700 space-y-2">
                <span className="text-xs font-semibold text-amber-300 block">Filtros Substituídos:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'oilFilterChanged', label: 'Filtro de Óleo' },
                    { key: 'dieselFilterChanged', label: 'Filtro Diesel' },
                    { key: 'waterSeparatorFilterChanged', label: 'Filtro Sep. de Água' },
                    { key: 'airFilterChanged', label: 'Filtro de Ar' },
                  ].map((f) => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean((manualForm as any)[f.key])}
                        onChange={(e) => setManualForm((p) => ({ ...p, [f.key]: e.target.checked }))}
                        className="rounded border-gray-500 h-3.5 w-3.5"
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-700 pt-3">
            <Button variant="outline" onClick={() => setManualModalOpen(false)} className="border-gray-600 text-xs">
              Cancelar
            </Button>
            <Button
              onClick={() => manualMutation.mutate(manualForm as any)}
              disabled={manualMutation.isPending || !manualForm.vehicleId}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold"
            >
              {manualMutation.isPending ? 'Salvando...' : 'Salvar Registro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DueComponentsAlertModal
        open={alertModalOpen}
        onOpenChange={setAlertModalOpen}
        alerts={dashboard?.expiringAlerts || []}
        thresholdKm={dashboard?.config?.alertThresholdKm}
        onOpenWorkOrder={triggerOsForRow}
        onGoToAlertsTab={() => setSubTab('ALERTS')}
      />
    </div>
  );
};
