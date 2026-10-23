import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sparkles,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  Camera,
  Loader2,
  Bus,
  User,
  Phone,
  ClipboardCheck,
  Search,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  KanbanSquare,
  List,
  Clock,
  MapPin,
  Warehouse,
  FileDown,
  FileSpreadsheet,
  Printer,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Layers,
  CheckCircle,
  XCircle,
  Eye,
  Droplets,
  FileText,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import fleetService from '@/services/fleetService';
import driverService, { Driver } from '@/services/driverService';
import {
  vehicleCleaningService,
  VehicleCleaningOrder,
  ChecklistItem,
  QualityChecklistItem,
  CreateCleaningOrderRequest,
  CleaningType,
  CleaningStatus,
  CleaningPhase,
  RequesterSector,
  Priority,
  CleaningSupplyItem,
  DEFAULT_SUPPLIES,
  parseChecklist,
  stringifyChecklist,
  parseQualityChecklist,
  stringifyQualityChecklist,
  parseSupplies,
  stringifyChecklistWithSupplies,
  CLEANING_TYPE_LABELS,
  STATUS_LABELS,
  PHASE_LABELS,
  PHASE_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  SECTOR_LABELS,
  SECTOR_DEFAULT_PRIORITY,
  isDelayed,
  minutesUntilDeadline,
} from '@/services/vehicleCleaningService';
import { garageService, Garage } from '@/services/garageService';
import { carWashService, CarWash } from '@/services/carWashService';
import { CarWashManagerModal } from '@/components/limpeza/CarWashManagerModal';
import { EvidencePhotosSection } from '@/components/limpeza/EvidencePhotosSection';
import { exportToXLSX, exportToPDF } from '@/utils/exportUtils';
import {
  downloadCleaningReleasePDF,
  openCleaningReleasePDFPreview,
} from '@/utils/vehicleCleaningPdfGenerator';
import OsHigienizacaoTab from '@/components/limpeza/OsHigienizacaoTab';
import { LavajatoContent } from '@/pages/manutencao/Lavajato';
import { VehicleCleaningViewModal } from '@/components/limpeza/VehicleCleaningViewModal';

interface VehicleOption {
  id: string;
  plate: string;
  model: string;
  fleetNumber?: string;
  garageId?: string;
}

const KANBAN_COLUMNS: CleaningPhase[] = ['AGUARDANDO', 'EXTERNA', 'INTERNA', 'INSPECAO', 'LIBERADO'];

const GestaoLimpezaVeiculos: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  // Navegação por abas principais
  const [activeMainTab, setActiveMainTab] = useState<'operacional' | 'relatorios' | 'estatisticas' | 'lavajato' | 'os-higienizacao'>('operacional');

  const [orders, setOrders] = useState<VehicleCleaningOrder[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [garageFilter, setGarageFilter] = useState<string>('ALL');
  const [garages, setGarages] = useState<Garage[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [mobileKanbanPhase, setMobileKanbanPhase] = useState<CleaningPhase>('AGUARDANDO');

  // Filtros de Relatórios
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSectorFilter, setReportSectorFilter] = useState<string>('ALL');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('ALL');

  // Novo diálogo de solicitação
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newCleaningType, setNewCleaningType] = useState<CleaningType>('COMPLETE');
  const [newSector, setNewSector] = useState<RequesterSector>('OPERATIONAL');
  const [newPriority, setNewPriority] = useState<Priority>('NORMAL');
  const [newDeadline, setNewDeadline] = useState('');
  const [newReleaseSpot, setNewReleaseSpot] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [saving, setSaving] = useState(false);

  // Car Washes Terceirizados & Evidências
  const [carWashes, setCarWashes] = useState<CarWash[]>([]);
  const [showCarWashModal, setShowCarWashModal] = useState(false);
  const [newExecutionLocation, setNewExecutionLocation] = useState<ExecutionLocation>('INTERNAL');
  const [newCarWashId, setNewCarWashId] = useState('');
  const [newCleaningCost, setNewCleaningCost] = useState('');

  // Detalhe / execução
  const [selectedOrder, setSelectedOrder] = useState<VehicleCleaningOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [qualityItems, setQualityItems] = useState<QualityChecklistItem[]>([]);
  const [supplies, setSupplies] = useState<CleaningSupplyItem[]>([]);
  const [releaseSpotInput, setReleaseSpotInput] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  // Modal de visualização padronizada da OS de Higienização
  const [isCleaningOsModalOpen, setIsCleaningOsModalOpen] = useState(false);
  const [cleaningOrderForOsModal, setCleaningOrderForOsModal] = useState<VehicleCleaningOrder | null>(null);

  // Adicionar insumo personalizado no modal
  const [newSupplyName, setNewSupplyName] = useState('');
  const [newSupplyQty, setNewSupplyQty] = useState('100');
  const [newSupplyUnit, setNewSupplyUnit] = useState('ml');

  // Atualiza relógio para SLA/Atrasado em tempo real
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await vehicleCleaningService.list({
        ...(statusFilter !== 'ALL' ? { status: statusFilter as CleaningStatus } : {}),
        ...(garageFilter !== 'ALL' ? { garageId: garageFilter } : {}),
      });
      setOrders(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar ordens de limpeza', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, garageFilter, toast]);

  const loadVehiclesAndDrivers = useCallback(async () => {
    try {
      const [vehData, drvData, garageData, carWashData] = await Promise.all([
        fleetService.getVehicles(),
        driverService.getDrivers(),
        garageService.list().catch(() => []),
        carWashService.list().catch(() => []),
      ]);
      setVehicles(vehData.map((v: any) => ({
        id: v.id,
        plate: v.plate,
        model: v.model || '',
        fleetNumber: v.fleetNumber,
        garageId: v.garageId,
      })));
      setDrivers(drvData);
      setGarages(garageData);
      setCarWashes(carWashData);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadVehiclesAndDrivers(); }, [loadVehiclesAndDrivers]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.vehiclePlate?.toLowerCase().includes(q) ||
      o.vehicleModel?.toLowerCase().includes(q) ||
      o.driverName?.toLowerCase().includes(q) ||
      o.releaseSpot?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  // Cálculos de KPIs em tempo real
  const kpiStats = useMemo(() => {
    void nowTick;
    const total = orders.length;
    const aguardando = orders.filter(o => (o.phase || 'AGUARDANDO') === 'AGUARDANDO' && o.status !== 'COMPLETED').length;
    const emLavagem = orders.filter(o => (o.phase === 'EXTERNA' || o.phase === 'INTERNA') && o.status !== 'COMPLETED').length;
    const inspecao = orders.filter(o => o.phase === 'INSPECAO' && o.status !== 'COMPLETED').length;
    const liberadosHoje = orders.filter(o => {
      if (o.status !== 'COMPLETED') return false;
      if (!o.completedAt && !o.releasedAt) return true;
      const compDate = new Date(o.completedAt || o.releasedAt || '').toDateString();
      return compDate === new Date().toDateString();
    }).length;
    const atrasados = orders.filter(o => isDelayed(o)).length;

    return { total, aguardando, emLavagem, inspecao, liberadosHoje, atrasados };
  }, [orders, nowTick]);

  const handleSectorChange = (sector: RequesterSector) => {
    setNewSector(sector);
    setNewPriority(SECTOR_DEFAULT_PRIORITY[sector]);
  };

  const handleCarWashSelect = (carWashId: string, type: CleaningType) => {
    setNewCarWashId(carWashId);
    const cw = carWashes.find(c => c.id === carWashId);
    if (cw) {
      let val: number | undefined;
      switch (type) {
        case 'EXTERNAL': val = cw.priceExternal; break;
        case 'INTERNAL': val = cw.priceInternal; break;
        case 'SANITARY': val = cw.priceSanitary; break;
        case 'COMPLETE': val = cw.priceComplete; break;
      }
      if (val != null) {
        setNewCleaningCost(val.toString());
      }
    }
  };

  const handleCreate = async () => {
    if (!newVehicleId) {
      toast({ title: 'Atenção', description: 'Selecione o veículo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateCleaningOrderRequest = {
        vehicleId: newVehicleId,
        driverId: newDriverId || undefined,
        driverPhone: newDriverPhone.trim() || undefined,
        cleaningType: newCleaningType,
        requesterSector: newSector,
        priority: newPriority,
        releaseDeadline: newDeadline ? new Date(newDeadline).toISOString() : undefined,
        releaseSpot: newReleaseSpot.trim() || undefined,
        observations: newObservations.trim() || undefined,
        executionLocation: newExecutionLocation,
        carWashId: newExecutionLocation === 'EXTERNAL' && newCarWashId ? newCarWashId : undefined,
        cleaningCost: newExecutionLocation === 'EXTERNAL' && newCleaningCost ? parseFloat(newCleaningCost) : undefined,
      };
      const created = await vehicleCleaningService.create(payload);
      setShowNewDialog(false);
      setNewVehicleId('');
      setNewDriverId('');
      setNewDriverPhone('');
      setNewCleaningType('COMPLETE');
      setNewDeadline('');
      setNewReleaseSpot('');
      setNewObservations('');
      setNewExecutionLocation('INTERNAL');
      setNewCarWashId('');
      setNewCleaningCost('');
      toast({ title: 'Sucesso', description: 'Solicitação criada com sucesso!' });
      loadOrders();
      // Abre a OS de Higienização padronizada automaticamente
      setCleaningOrderForOsModal(created);
      setIsCleaningOsModalOpen(true);
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar solicitação', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (order: VehicleCleaningOrder) => {
    try {
      const fresh = await vehicleCleaningService.getById(order.id);
      setSelectedOrder(fresh);
      setChecklist(parseChecklist(fresh.checklistData));
      setQualityItems(parseQualityChecklist(fresh.qualityChecklist));
      setSupplies(parseSupplies(fresh.checklistData));
      setReleaseSpotInput(fresh.releaseSpot || '');
      setDetailOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao abrir ordem', variant: 'destructive' });
    }
  };

  const handleStart = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await vehicleCleaningService.start(selectedOrder.id);
      setSelectedOrder(updated);
      toast({
        title: 'Em execução',
        description: updated.estimatedCompletion
          ? `Previsão: ${new Date(updated.estimatedCompletion).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — CCO e motorista notificados`
          : 'CCO e motorista notificados',
      });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao iniciar', variant: 'destructive' });
    }
  };

  const handleAdvancePhase = async () => {
    if (!selectedOrder) return;
    try {
      const updated = await vehicleCleaningService.advancePhase(selectedOrder.id);
      setSelectedOrder(updated);
      toast({ title: 'Fase avançada', description: PHASE_LABELS[updated.phase || 'AGUARDANDO'] });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao avançar fase', variant: 'destructive' });
    }
  };

  const toggleItem = async (key: string) => {
    if (!selectedOrder) return;
    const next = checklist.map(i => i.key === key ? { ...i, checked: !i.checked } : i);
    setChecklist(next);
    try {
      await vehicleCleaningService.updateChecklist(selectedOrder.id, stringifyChecklistWithSupplies(next, supplies));
    } catch {
      // mantém estado local
    }
  };

  const toggleQualityItem = (key: string) => {
    setQualityItems(prev => prev.map(i => i.key === key ? { ...i, checked: !i.checked } : i));
  };

  // Insumos
  const handleAddDefaultSupply = async (defSupply: CleaningSupplyItem) => {
    if (!selectedOrder) return;
    const exists = supplies.find(s => s.id === defSupply.id);
    let nextSupplies: CleaningSupplyItem[];
    if (exists) {
      nextSupplies = supplies.map(s => s.id === defSupply.id ? { ...s, quantity: s.quantity + defSupply.quantity } : s);
    } else {
      nextSupplies = [...supplies, { ...defSupply }];
    }
    setSupplies(nextSupplies);
    try {
      await vehicleCleaningService.updateChecklist(selectedOrder.id, stringifyChecklistWithSupplies(checklist, nextSupplies));
      toast({ title: 'Insumo Adicionado', description: `${defSupply.name} registrado.` });
    } catch {
      // ok
    }
  };

  const handleAddCustomSupply = async () => {
    if (!selectedOrder || !newSupplyName.trim()) return;
    const newSupply: CleaningSupplyItem = {
      id: `custom-${Date.now()}`,
      name: newSupplyName.trim(),
      quantity: parseFloat(newSupplyQty) || 1,
      unit: newSupplyUnit.trim() || 'un',
    };
    const nextSupplies = [...supplies, newSupply];
    setSupplies(nextSupplies);
    setNewSupplyName('');
    try {
      await vehicleCleaningService.updateChecklist(selectedOrder.id, stringifyChecklistWithSupplies(checklist, nextSupplies));
      toast({ title: 'Insumo Adicionado', description: `${newSupply.name} registrado.` });
    } catch {
      // ok
    }
  };

  const handleRemoveSupply = async (id: string) => {
    if (!selectedOrder) return;
    const nextSupplies = supplies.filter(s => s.id !== id);
    setSupplies(nextSupplies);
    try {
      await vehicleCleaningService.updateChecklist(selectedOrder.id, stringifyChecklistWithSupplies(checklist, nextSupplies));
    } catch {
      // ok
    }
  };

  const handleSubmitQuality = async (approveAndComplete: boolean) => {
    if (!selectedOrder) return;
    const allChecked = qualityItems.length > 0 && qualityItems.every(i => i.checked);
    setCompleting(true);
    try {
      const updated = await vehicleCleaningService.submitQualityInspection(
        selectedOrder.id, stringifyQualityChecklist(qualityItems), allChecked, approveAndComplete,
      );
      setSelectedOrder(updated);
      if (approveAndComplete && allChecked) {
        toast({ title: 'Liberado para viagem', description: 'Motorista notificado (sino + WhatsApp)' });
      } else if (!allChecked) {
        toast({ title: 'Atenção', description: 'Há itens de qualidade pendentes', variant: 'destructive' });
      } else {
        toast({ title: 'Inspeção registrada', description: 'Finalize a liberação quando o veículo estiver pronto' });
      }
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro na inspeção', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedOrder) return;
    setCompleting(true);
    try {
      const updated = await vehicleCleaningService.release(selectedOrder.id, releaseSpotInput.trim() || undefined);
      setSelectedOrder(updated);
      toast({
        title: 'Liberado para viagem',
        description: `Motorista notificado${updated.releaseSpot ? ` — vaga ${updated.releaseSpot}` : ''}`,
      });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao liberar', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const handleUploadPhoto = async (key: string, file: File) => {
    if (!selectedOrder) return;
    setUploadingKey(key);
    try {
      const updated = await vehicleCleaningService.uploadItemPhoto(selectedOrder.id, key, file);
      setSelectedOrder(updated);
      setChecklist(parseChecklist(updated.checklistData));
      toast({ title: 'Sucesso', description: 'Foto anexada' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao enviar foto', variant: 'destructive' });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta ordem de limpeza?')) return;
    try {
      await vehicleCleaningService.delete(id);
      toast({ title: 'Sucesso', description: 'Ordem excluída' });
      loadOrders();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  // Exportação de Relatórios
  const filteredReportOrders = useMemo(() => {
    return orders.filter(o => {
      if (reportStartDate) {
        const orderDate = o.createdAt ? new Date(o.createdAt) : null;
        if (orderDate && orderDate < new Date(reportStartDate)) return false;
      }
      if (reportEndDate) {
        const orderDate = o.createdAt ? new Date(o.createdAt) : null;
        const end = new Date(reportEndDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate && orderDate > end) return false;
      }
      if (reportSectorFilter !== 'ALL' && o.requesterSector !== reportSectorFilter) return false;
      if (reportTypeFilter !== 'ALL' && o.cleaningType !== reportTypeFilter) return false;
      return true;
    });
  }, [orders, reportStartDate, reportEndDate, reportSectorFilter, reportTypeFilter]);

  const handleExportReportExcel = async () => {
    try {
      const rows = filteredReportOrders.map(o => ({
        'Ordem ID': o.id.substring(0, 8).toUpperCase(),
        'Placa': o.vehiclePlate,
        'Prefixo / Modelo': o.vehicleModel || '',
        'Garagem': o.vehicleGarageName || '',
        'Tipo de Limpeza': CLEANING_TYPE_LABELS[o.cleaningType] || o.cleaningType,
        'Setor Solicitante': o.requesterSector ? SECTOR_LABELS[o.requesterSector] : '',
        'Prioridade': o.priority ? PRIORITY_LABELS[o.priority] : '',
        'Fase Atual': PHASE_LABELS[o.phase || 'AGUARDANDO'],
        'Status': STATUS_LABELS[o.status] || o.status,
        'Motorista': o.driverName || '',
        'Telefone': o.driverPhone || '',
        'Vaga Pátio': o.releaseSpot || '',
        'Horário Entrada': o.createdAt ? new Date(o.createdAt).toLocaleString('pt-BR') : '',
        'Início Real': o.startedAt ? new Date(o.startedAt).toLocaleString('pt-BR') : '',
        'Liberação': o.releasedAt ? new Date(o.releasedAt).toLocaleString('pt-BR') : '',
        'SLA': isDelayed(o) ? 'Atrasado' : 'No Prazo',
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      await exportToXLSX(rows, `relatorio-higienizacao-veiculos-${dateStr}`, 'Relatório de Higienização e Limpeza de Frota');
      toast({ title: 'Exportado com Sucesso', description: `${rows.length} registros exportados para Excel.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível exportar para Excel.', variant: 'destructive' });
    }
  };

  const handleExportReportPdf = async () => {
    try {
      const rows = filteredReportOrders.map(o => ({
        Placa: o.vehiclePlate,
        Tipo: CLEANING_TYPE_LABELS[o.cleaningType] || o.cleaningType,
        Garagem: o.vehicleGarageName || 'Central',
        Setor: o.requesterSector ? SECTOR_LABELS[o.requesterSector] : '',
        Fase: PHASE_LABELS[o.phase || 'AGUARDANDO'],
        Status: STATUS_LABELS[o.status] || o.status,
        Entrada: o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : '',
        Vaga: o.releaseSpot || '-',
      }));

      const dateStr = new Date().toISOString().slice(0, 10);
      await exportToPDF(rows, `relatorio-limpeza-${dateStr}`, 'Relatório Consolidado de Limpeza e Higienização');
      toast({ title: 'Exportado com Sucesso', description: `${rows.length} registros exportados para PDF.` });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível exportar para PDF.', variant: 'destructive' });
    }
  };

  const renderPriorityBadge = (priority?: Priority) => {
    if (!priority) return null;
    return (
      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[priority]}`}>
        {PRIORITY_LABELS[priority]}
      </span>
    );
  };

  const renderPhaseBadge = (order: VehicleCleaningOrder) => {
    if (isDelayed(order)) {
      return (
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/30 flex items-center gap-1">
          <AlertTriangle size={11} /> Atrasado
        </span>
      );
    }
    const phase = order.phase || 'AGUARDANDO';
    return (
      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${PHASE_COLORS[phase]}`}>
        {PHASE_LABELS[phase]}
      </span>
    );
  };

  const renderSlaInfo = (order: VehicleCleaningOrder) => {
    if (!order.releaseDeadline) return null;
    const mins = minutesUntilDeadline(order);
    if (mins == null) return null;
    const urgent = mins <= 20 && order.status !== 'COMPLETED';
    return (
      <span className={`flex items-center gap-1 text-xs ${urgent ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
        <Clock size={12} />
        {order.status === 'COMPLETED'
          ? `Saída ${new Date(order.releaseDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
          : mins < 0
            ? `Saída há ${Math.abs(mins)} min`
            : `Saída em ${mins} min`}
      </span>
    );
  };

  const renderChecklistSection = (category: 'INTERNAL' | 'EXTERNAL', title: string) => {
    const items = checklist.filter(i => i.category === category);
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-seguranca-yellow uppercase tracking-wide">{title}</h4>
        {items.map(item => (
          <div key={item.key} className="flex items-center gap-3 bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
            <button
              onClick={() => toggleItem(item.key)}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600 hover:border-emerald-400'
              }`}
            >
              {item.checked && <CheckCircle2 size={14} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.checked ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>
                {item.title}
              </p>
              {item.photoUrl && (
                <img src={item.photoUrl} alt={item.title} className="mt-2 h-24 w-auto rounded-lg object-cover border border-gray-700" />
              )}
            </div>
            <label className="cursor-pointer p-2 text-gray-400 hover:text-seguranca-yellow transition-colors flex-shrink-0" title="Anexar foto">
              {uploadingKey === item.key ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Camera size={18} />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingKey !== null}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadPhoto(item.key, file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        ))}
      </div>
    );
  };

  const renderQualitySection = () => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide flex items-center gap-1">
        <ShieldCheck size={14} /> Inspeção de Qualidade (Auditoria CCO)
      </h4>
      {qualityItems.map(item => (
        <div key={item.key} className="flex items-center gap-3 bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
          <button
            onClick={() => toggleQualityItem(item.key)}
            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
              item.checked ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-600 hover:border-cyan-400'
            }`}
          >
            {item.checked && <CheckCircle2 size={14} />}
          </button>
          <p className={`text-sm font-medium ${item.checked ? 'text-cyan-400' : 'text-white'}`}>{item.title}</p>
        </div>
      ))}
    </div>
  );

  const renderSuppliesSection = () => (
    <div className="space-y-3 bg-seguranca-black/30 p-3.5 rounded-lg border border-gray-700/60">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
          <Layers size={14} /> Insumos & Produtos Químicos Aplicados
        </h4>
        <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
          {supplies.length} item(ns)
        </Badge>
      </div>

      {/* Atalhos Rápidos para Produtos Padrões */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-gray-400 self-center mr-1">Adicionar Rápido:</span>
        {DEFAULT_SUPPLIES.map(def => (
          <button
            key={def.id}
            type="button"
            onClick={() => handleAddDefaultSupply(def)}
            className="text-[11px] bg-seguranca-graphite hover:bg-purple-900/30 text-gray-300 hover:text-purple-300 border border-gray-700 rounded px-2 py-0.5 transition-colors flex items-center gap-1"
          >
            <Plus size={10} /> {def.name.split(' ')[0]} ({def.quantity}{def.unit})
          </button>
        ))}
      </div>

      {/* Lista de Insumos Registrados */}
      {supplies.length > 0 ? (
        <div className="space-y-1.5 mt-2">
          {supplies.map(s => (
            <div key={s.id} className="flex items-center justify-between bg-seguranca-black/60 px-3 py-1.5 rounded border border-gray-800 text-xs">
              <span className="text-white font-medium">{s.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-purple-400 font-semibold">{s.quantity} {s.unit}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSupply(s.id)}
                  className="text-gray-500 hover:text-red-400 transition-colors"
                  title="Remover insumo"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">Nenhum produto químico ou insumo registrado ainda.</p>
      )}

      {/* Insumo Customizado */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          placeholder="Nome de outro produto..."
          value={newSupplyName}
          onChange={e => setNewSupplyName(e.target.value)}
          className="h-8 text-xs bg-seguranca-black border-gray-700 text-white flex-1"
        />
        <Input
          placeholder="Qtd"
          type="number"
          value={newSupplyQty}
          onChange={e => setNewSupplyQty(e.target.value)}
          className="h-8 text-xs bg-seguranca-black border-gray-700 text-white w-20"
        />
        <Select value={newSupplyUnit} onValueChange={setNewSupplyUnit}>
          <SelectTrigger className="h-8 text-xs bg-seguranca-black border-gray-700 text-white w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
            <SelectItem value="ml">ml</SelectItem>
            <SelectItem value="L">L</SelectItem>
            <SelectItem value="un">un</SelectItem>
            <SelectItem value="g">g</SelectItem>
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleAddCustomSupply}
          className="h-8 px-2.5 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus size={14} />
        </Button>
      </div>
    </div>
  );

  const renderOrderCard = (order: VehicleCleaningOrder) => {
    const isLiberado = order.status === 'COMPLETED' || order.phase === 'LIBERADO';
    const delayed = isDelayed(order) && order.status !== 'COMPLETED';

    return (
      <Card
        key={order.id}
        className={`group relative bg-slate-900/85 backdrop-blur-md border ${
          delayed
            ? 'border-red-500/60 shadow-lg shadow-red-950/30 ring-1 ring-red-500/30'
            : 'border-white/10 hover:border-amber-400/50 shadow-black/40'
        } p-3.5 sm:p-4 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden`}
      >
        <div>
          {/* Top Badges & Actions */}
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {renderPhaseBadge(order)}
              {renderPriorityBadge(order.priority)}
            </div>
            <div className="flex items-center gap-1">
              {isLiberado && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openCleaningReleasePDFPreview(order);
                  }}
                  className="text-gray-400 hover:text-amber-300 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  title="Imprimir Comprovante de Liberação (PDF)"
                >
                  <Printer size={15} />
                </button>
              )}
              <button
                onClick={() => handleDelete(order.id)}
                className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Excluir ordem"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Vehicle Plate & Model Header */}
          <div className="flex items-center gap-3 mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
              <Bus className="text-amber-400" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-black border border-amber-400/40 text-amber-300 font-mono font-bold tracking-wider text-xs sm:text-sm shadow-inner">
                  {order.vehiclePlate}
                </span>
                {order.vehicleModel && (
                  <span className="text-gray-300 text-xs truncate font-medium">
                    {order.vehicleModel}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-[11px] truncate mt-0.5">
                {CLEANING_TYPE_LABELS[order.cleaningType]}
              </p>
            </div>
          </div>

          {/* Details Metadata */}
          <div className="space-y-1.5 text-xs text-gray-400 mb-3 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {order.driverName ? (
                <span className="flex items-center gap-1.5 text-gray-300 truncate">
                  <User size={13} className="text-gray-500 shrink-0" />
                  <span className="truncate">{order.driverName}</span>
                </span>
              ) : (
                <span className="text-gray-500 text-[11px] italic">Sem motorista vinculado</span>
              )}
              {order.vehicleGarageName && (
                <span className="flex items-center gap-1 text-gray-400 text-[11px] bg-white/5 px-2 py-0.5 rounded-md">
                  <Warehouse size={11} className="text-gray-500" /> {order.vehicleGarageName}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 flex-wrap">
              {renderSlaInfo(order)}
              {order.releaseSpot && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                  <MapPin size={11} /> Vaga {order.releaseSpot}
                </span>
              )}
              {order.requesterSector && (
                <span className="text-gray-500 text-[11px] ml-auto">
                  via {SECTOR_LABELS[order.requesterSector]}
                </span>
              )}
            </div>
          </div>

          {delayed && (
            <div className="flex items-center gap-2 text-xs text-red-300 mb-3 bg-red-950/40 border border-red-500/40 rounded-xl p-2.5">
              <AlertTriangle size={14} className="text-red-400 shrink-0 animate-pulse" />
              <span className="leading-tight">Atraso de SLA — priorizar saída ou avaliar veículo reserva.</span>
            </div>
          )}
        </div>

        {/* Touch-Friendly Action Button */}
        <div className="pt-2">
          <Button
            onClick={() => openDetail(order)}
            className={`w-full h-10 sm:h-11 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              isLiberado
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/10 hover:bg-amber-400 hover:text-black text-white border border-white/15'
            }`}
          >
            {isLiberado ? (
              <>
                <CheckCircle2 size={16} className="text-emerald-400" />
                Ver Detalhes & Comprovante
              </>
            ) : (
              <>
                <Play size={15} className="text-amber-400 fill-amber-400" />
                Executar Checklist de Limpeza
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  const kanban = useMemo(() => {
    void nowTick;
    return KANBAN_COLUMNS.map(phase => ({
      phase,
      orders: filteredOrders.filter(o => (o.phase || 'AGUARDANDO') === phase && o.status !== 'COMPLETED')
        .concat(phase === 'LIBERADO' ? filteredOrders.filter(o => o.status === 'COMPLETED') : []),
    }));
  }, [filteredOrders, nowTick]);

  return (
    <StandardLayout
      title="Gestão de Limpeza e Higienização de Veículos"
      subtitle="Fila inteligente por SLA, execução em fases, auditoria de qualidade, insumos e liberação de frota"
    >
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-24 sm:pb-6">
        {/* KPI Cards no Topo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          <Card
            onClick={() => { setStatusFilter('ALL'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              statusFilter === 'ALL' && activeMainTab === 'operacional'
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                : 'bg-slate-900/80 border-white/10 hover:border-amber-400/40 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Total Geral</p>
              <div className="w-7 h-7 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                <Bus size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1.5">{kpiStats.total}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Veículos no fluxo</p>
          </Card>

          <Card
            onClick={() => { setStatusFilter('PENDING'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              statusFilter === 'PENDING' && activeMainTab === 'operacional'
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                : 'bg-slate-900/80 border-white/10 hover:border-amber-400/40 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Aguardando</p>
              <div className="w-7 h-7 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-amber-400 mt-1.5">{kpiStats.aguardando}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Fila de entrada</p>
          </Card>

          <Card
            onClick={() => { setStatusFilter('IN_PROGRESS'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              statusFilter === 'IN_PROGRESS' && activeMainTab === 'operacional'
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-sky-400/80 shadow-lg shadow-sky-500/10 ring-2 ring-sky-400/30'
                : 'bg-slate-900/80 border-white/10 hover:border-sky-400/40 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Em Higienização</p>
              <div className="w-7 h-7 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Sparkles size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-sky-400 mt-1.5">{kpiStats.emLavagem}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Externa / Interna</p>
          </Card>

          <Card
            onClick={() => { setStatusFilter('IN_PROGRESS'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              statusFilter === 'IN_PROGRESS' && activeMainTab === 'operacional'
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-400/30'
                : 'bg-slate-900/80 border-white/10 hover:border-cyan-400/40 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Em Inspeção</p>
              <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <ShieldCheck size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-cyan-400 mt-1.5">{kpiStats.inspecao}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Auditoria CCO</p>
          </Card>

          <Card
            onClick={() => { setStatusFilter('COMPLETED'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              statusFilter === 'COMPLETED' && activeMainTab === 'operacional'
                ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-emerald-400/80 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-400/30'
                : 'bg-slate-900/80 border-white/10 hover:border-emerald-400/40 hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Liberados Hoje</p>
              <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1.5">{kpiStats.liberadosHoje}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Prontos p/ viagem</p>
          </Card>

          <Card
            onClick={() => { setStatusFilter('ALL'); setActiveMainTab('operacional'); }}
            className={`transition-all duration-200 cursor-pointer p-3 sm:p-4 rounded-2xl border backdrop-blur-md ${
              kpiStats.atrasados > 0
                ? 'bg-red-950/30 border-red-500/50 hover:border-red-500 ring-2 ring-red-500/20'
                : 'bg-slate-900/80 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-xs text-gray-400 font-medium">Risco / SLA</p>
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                kpiStats.atrasados > 0 ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-white/5 border border-white/10 text-gray-400'
              }`}>
                <AlertTriangle size={14} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-1.5 ${kpiStats.atrasados > 0 ? 'text-red-400' : 'text-gray-300'}`}>
              {kpiStats.atrasados}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">Atraso de saída</p>
          </Card>
        </div>

        {/* Barra Superior de Ações Rápidas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/40 p-2.5 sm:p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-300 font-medium">
              Fila em Tempo Real: <strong className="text-white">{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'veículo listado' : 'veículos listados'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCarWashModal(true)}
              className="bg-sky-950/30 border-sky-600/40 text-sky-400 hover:bg-sky-900/40 hover:text-sky-300 font-medium rounded-xl text-xs sm:text-sm h-9"
            >
              <Droplets size={14} className="mr-1.5 text-sky-400" /> Gerenciar Lava-Jatos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadOrders}
              className="bg-slate-800/80 border-white/10 text-gray-300 hover:text-white rounded-xl text-xs sm:text-sm h-9"
            >
              <RefreshCw size={14} className={`mr-1.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} /> Atualizar
            </Button>

            <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
              <DialogTrigger asChild>
                <Button className="relative group overflow-hidden bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-bold px-3.5 sm:px-4 py-2 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 border border-amber-300/40 flex items-center gap-2 h-9 text-xs sm:text-sm">
                  <span className="w-5 h-5 rounded-lg bg-black/15 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                    <Plus size={14} className="text-slate-950 stroke-[2.5]" />
                  </span>
                  <span className="tracking-tight font-bold">Nova Solicitação</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles size={18} className="text-seguranca-yellow" /> Nova Solicitação de Limpeza
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Veículo (prefixo/placa) *</label>
                      <Select value={newVehicleId} onValueChange={setNewVehicleId}>
                        <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                          {vehicles.map(v => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.fleetNumber ? `[${v.fleetNumber}] ` : ''}{v.plate} {v.model ? `- ${v.model}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Setor Solicitante</label>
                      <Select value={newSector} onValueChange={(v) => handleSectorChange(v as RequesterSector)}>
                        <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                          {Object.entries(SECTOR_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Prioridade</label>
                      <Select value={newPriority} onValueChange={(v) => setNewPriority(v as Priority)}>
                        <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                          {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">Padrão aplicado conforme o setor solicitante.</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Motorista (opcional)</label>
                      <Select
                        value={newDriverId}
                        onValueChange={(v) => {
                          setNewDriverId(v);
                          const selected = drivers.find(d => d.id === v);
                          setNewDriverPhone(selected?.phone || '');
                        }}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                          {drivers.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">WhatsApp do Motorista</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          value={newDriverPhone}
                          onChange={e => setNewDriverPhone(e.target.value)}
                          className="pl-9 bg-seguranca-black border-gray-700 text-white"
                          placeholder="(00) 00000-0000 — recebe aviso de liberação"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1.5 block font-semibold">Local de Execução da Limpeza *</label>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setNewExecutionLocation('INTERNAL')}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            newExecutionLocation === 'INTERNAL'
                              ? 'bg-seguranca-yellow text-black border-seguranca-yellow shadow-md'
                              : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <Warehouse size={15} /> Garagem Própria (Interna)
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewExecutionLocation('EXTERNAL')}
                          className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            newExecutionLocation === 'EXTERNAL'
                              ? 'bg-sky-500 text-white border-sky-500 shadow-md'
                              : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <Droplets size={15} /> Lava-Jato Externo (Terceirizado)
                        </button>
                      </div>
                    </div>

                    {newExecutionLocation === 'EXTERNAL' && (
                      <div className="space-y-3 bg-sky-950/20 border border-sky-500/30 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-sky-300 font-semibold block uppercase tracking-wide">
                            Prestador de Serviço (Lava-Jato) *
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCarWashModal(true)}
                            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold"
                          >
                            <Plus size={12} /> Cadastrar Lava-Jato
                          </button>
                        </div>
                        <Select
                          value={newCarWashId}
                          onValueChange={(v) => handleCarWashSelect(v, newCleaningType)}
                        >
                          <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                            <SelectValue placeholder="Selecione o Lava-Jato prestador" />
                          </SelectTrigger>
                          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                            {carWashes.map(cw => (
                              <SelectItem key={cw.id} value={cw.id}>
                                {cw.name} {cw.phone ? `(${cw.phone})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">Valor do Serviço Terceirizado (R$)</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newCleaningCost}
                            onChange={e => setNewCleaningCost(e.target.value)}
                            placeholder="Ex.: 80,00"
                            className="bg-seguranca-black border-gray-700 text-white"
                          />
                          <p className="text-[11px] text-gray-500 mt-1">Preenchido com o valor acordado cadastrado no Lava-Jato.</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Tipo de Serviço *</label>
                      <Select
                        value={newCleaningType}
                        onValueChange={(v) => {
                          const type = v as CleaningType;
                          setNewCleaningType(type);
                          if (newExecutionLocation === 'EXTERNAL' && newCarWashId) {
                            handleCarWashSelect(newCarWashId, type);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                          <SelectItem value="EXTERNAL">Limpeza Externa (Lavajato — Apenas Carroceria)</SelectItem>
                          <SelectItem value="INTERNAL">Higienização Interna (Varrição, Estofados, Painel)</SelectItem>
                          <SelectItem value="SANITARY">Sanitário / Descarte e Reabastecimento</SelectItem>
                          <SelectItem value="COMPLETE">Higienização Completa (Interna + Externa)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Horário Limite de Liberação (saída/escala)</label>
                      <Input
                        type="datetime-local"
                        value={newDeadline}
                        onChange={e => setNewDeadline(e.target.value)}
                        className="bg-seguranca-black border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Vaga no Pátio (opcional)</label>
                      <Input
                        value={newReleaseSpot}
                        onChange={e => setNewReleaseSpot(e.target.value)}
                        className="bg-seguranca-black border-gray-700 text-white"
                        placeholder="Ex.: B-04"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-1 block">Observações de Ocorrência</label>
                      <Textarea
                        value={newObservations}
                        onChange={e => setNewObservations(e.target.value)}
                        className="bg-seguranca-black border-gray-700 text-white"
                        rows={3}
                        placeholder="Ex.: Cinto de segurança com sujeira na poltrona 14; mancha de graxa no degrau"
                      />
                    </div>
                    <Button
                      onClick={handleCreate}
                      disabled={saving}
                      className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold py-2.5 rounded-xl shadow-md"
                    >
                      {saving ? <Loader2 size={18} className="animate-spin mr-1" /> : <Plus size={18} className="mr-1 stroke-[2.5]" />}
                      Abrir Solicitação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

        {/* Abas Principais com Rolagem Suave */}
        <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)} className="w-full">
          <div className="overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="bg-slate-900/90 backdrop-blur border border-white/10 p-1.5 rounded-2xl inline-flex gap-1 min-w-full sm:min-w-0">
              <TabsTrigger value="operacional" className="rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-md text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                <KanbanSquare size={15} /> Painel Operacional
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-md text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> Histórico & Relatórios
              </TabsTrigger>
              <TabsTrigger value="estatisticas" className="rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state='active']:bg-seguranca-red data-[state='active']:text-white data-[state='active']:shadow-md text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                <BarChart3 size={15} /> Produtividade & Métricas
              </TabsTrigger>
              <TabsTrigger value="lavajato" className="rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state='active']:bg-sky-600 data-[state='active']:text-white data-[state='active']:shadow-md text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                <Droplets size={15} /> Lavajato
              </TabsTrigger>
              <TabsTrigger value="os-higienizacao" className="rounded-xl px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium data-[state='active']:bg-blue-600 data-[state='active']:text-white data-[state='active']:shadow-md text-gray-400 hover:text-white transition-all flex items-center gap-1.5">
                <FileText size={15} /> OS Higienização
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: PAINEL OPERACIONAL */}
          <TabsContent value="operacional" className="space-y-4 mt-3 sm:mt-4">
            {/* Barra de Filtros & Controles */}
            <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-2xl border border-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar placa, modelo, motorista..."
                    className="pl-9 pr-9 bg-slate-950/80 border-white/10 text-white rounded-xl focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40 text-xs sm:text-sm h-10 placeholder:text-gray-500"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Limpar busca"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-slate-950/80 border-white/10 text-white rounded-xl h-10 text-xs sm:text-sm flex-1 sm:w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-gray-700 text-white rounded-xl">
                      <SelectItem value="ALL">Todos os status</SelectItem>
                      <SelectItem value="PENDING">Pendentes</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                      <SelectItem value="COMPLETED">Finalizadas</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={garageFilter} onValueChange={setGarageFilter}>
                    <SelectTrigger className="bg-slate-950/80 border-white/10 text-white rounded-xl h-10 text-xs sm:text-sm flex-1 sm:w-44">
                      <SelectValue placeholder="Garagem" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-gray-700 text-white rounded-xl">
                      <SelectItem value="ALL">Todas as garagens</SelectItem>
                      {garages.filter(g => g.active !== false).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="bg-slate-950/90 border border-white/10 p-1 rounded-xl flex items-center flex-shrink-0">
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'kanban'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Visualização Kanban"
                    >
                      <KanbanSquare size={14} />
                      <span className="hidden sm:inline">Kanban</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'list'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      title="Visualização em Lista"
                    >
                      <List size={14} />
                      <span className="hidden sm:inline">Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Status Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 text-xs">
                <span className="text-[11px] text-gray-500 font-medium mr-1 hidden sm:inline flex-shrink-0">Filtro rápido:</span>
                {[
                  { id: 'ALL', label: 'Todos', count: kpiStats.total },
                  { id: 'PENDING', label: 'Aguardando', count: kpiStats.aguardando },
                  { id: 'IN_PROGRESS', label: 'Em Higienização', count: kpiStats.emLavagem + kpiStats.inspecao },
                  { id: 'COMPLETED', label: 'Liberados', count: kpiStats.liberadosHoje },
                ].map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => setStatusFilter(chip.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                      statusFilter === chip.id
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className="text-[10px] font-mono px-1 py-0.2 bg-black/40 rounded-full text-gray-300">
                      {chip.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conteúdo Kanban / Lista */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-900/40 backdrop-blur-sm border border-dashed border-white/10 rounded-2xl space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                  <Sparkles size={26} />
                </div>
                <h4 className="text-base font-semibold text-white">Nenhuma ordem de limpeza encontrada</h4>
                <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                  Não há veículos com os filtros selecionados. Abra uma nova solicitação ou limpe a busca.
                </p>
                <Button
                  onClick={() => setShowNewDialog(true)}
                  className="bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-amber-500/20 mt-2"
                >
                  <Plus size={14} className="mr-1 stroke-[2.5]" /> Criar Nova Solicitação
                </Button>
              </div>
            ) : viewMode === 'kanban' ? (
              <>
                {/* Mobile Kanban Phase Switcher (Telas pequenas < md) */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {kanban.map(col => {
                      const isActive = mobileKanbanPhase === col.phase;
                      return (
                        <button
                          key={col.phase}
                          onClick={() => setMobileKanbanPhase(col.phase)}
                          className={`flex-1 min-w-[105px] p-2 rounded-xl border text-center transition-all ${
                            isActive
                              ? 'bg-slate-800/90 border-amber-400/80 ring-1 ring-amber-400/40 shadow-sm'
                              : 'bg-slate-900/60 border-white/5 text-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-0.5">
                            <span className={`w-2 h-2 rounded-full ${
                              col.phase === 'AGUARDANDO' ? 'bg-amber-400' :
                              col.phase === 'EXTERNA' ? 'bg-sky-400' :
                              col.phase === 'INTERNA' ? 'bg-purple-400' :
                              col.phase === 'INSPECAO' ? 'bg-cyan-400' : 'bg-emerald-400'
                            }`} />
                            <span className={`text-[11px] font-semibold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                              {PHASE_LABELS[col.phase]}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {col.orders.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mostra apenas a coluna selecionada no mobile */}
                  {(() => {
                    const activeCol = kanban.find(c => c.phase === mobileKanbanPhase) || kanban[0];
                    return (
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                            Fase: {PHASE_LABELS[activeCol.phase]}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {activeCol.orders.length} {activeCol.orders.length === 1 ? 'veículo' : 'veículos'}
                          </span>
                        </div>
                        {activeCol.orders.length === 0 ? (
                          <div className="text-center text-xs text-gray-500 py-10 bg-slate-900/30 border border-dashed border-white/5 rounded-2xl">
                            Nenhum veículo nesta fase no momento
                          </div>
                        ) : (
                          activeCol.orders.map(renderOrderCard)
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Desktop 5-Columns Grid (Telas md+) */}
                <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  {kanban.map(col => (
                    <div key={col.phase} className="space-y-3 bg-slate-900/30 p-2.5 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 px-1">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                          col.phase === 'AGUARDANDO' ? 'bg-amber-400' :
                          col.phase === 'EXTERNA' ? 'bg-sky-400' :
                          col.phase === 'INTERNA' ? 'bg-purple-400' :
                          col.phase === 'INSPECAO' ? 'bg-cyan-400' : 'bg-emerald-400'
                        }`} />
                        <h3 className="text-xs font-semibold text-gray-300 truncate">{PHASE_LABELS[col.phase]}</h3>
                        <span className="text-[11px] text-gray-400 ml-auto font-mono bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                          {col.orders.length}
                        </span>
                      </div>
                      {col.orders.length === 0 ? (
                        <div className="text-center text-xs text-gray-600 py-8 border border-dashed border-white/5 rounded-xl">
                          Nenhum veículo
                        </div>
                      ) : (
                        col.orders.map(renderOrderCard)
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredOrders.map(renderOrderCard)}
              </div>
            )}
          </TabsContent>

          {/* TAB 2: HISTÓRICO & RELATÓRIOS */}
          <TabsContent value="relatorios" className="space-y-4 mt-4">
            <Card className="bg-seguranca-graphite border-gray-700 p-4">
              <div className="flex flex-wrap items-end gap-3 justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Data Inicial</label>
                    <Input
                      type="date"
                      value={reportStartDate}
                      onChange={e => setReportStartDate(e.target.value)}
                      className="bg-seguranca-black border-gray-700 text-white text-xs h-9 w-36"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Data Final</label>
                    <Input
                      type="date"
                      value={reportEndDate}
                      onChange={e => setReportEndDate(e.target.value)}
                      className="bg-seguranca-black border-gray-700 text-white text-xs h-9 w-36"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Setor Solicitante</label>
                    <Select value={reportSectorFilter} onValueChange={setReportSectorFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                        <SelectItem value="ALL">Todos os setores</SelectItem>
                        {Object.entries(SECTOR_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tipo de Limpeza</label>
                    <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                      <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                        <SelectItem value="ALL">Todos os tipos</SelectItem>
                        {Object.entries(CLEANING_TYPE_LABELS).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleExportReportExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                  >
                    <FileSpreadsheet size={15} className="mr-1.5" /> Exportar Excel
                  </Button>
                  <Button
                    onClick={handleExportReportPdf}
                    className="bg-seguranca-red hover:bg-red-700 text-white text-xs h-9"
                  >
                    <FileDown size={15} className="mr-1.5" /> Exportar PDF
                  </Button>
                </div>
              </div>
            </Card>

            {/* Tabela de Relatórios */}
            <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-seguranca-black/60 border-b border-gray-700">
                    <TableRow className="border-gray-700 hover:bg-transparent">
                      <TableHead className="text-gray-300 font-semibold text-xs">Ordem / Placa</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Tipo de Serviço</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Garagem</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Setor Solicitante</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Data Entrada</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Liberação / Vaga</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs">Status / Fase</TableHead>
                      <TableHead className="text-gray-300 font-semibold text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReportOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                          Nenhum registro encontrado para este período ou filtro.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReportOrders.map(order => (
                        <TableRow key={order.id} className="border-gray-800 hover:bg-seguranca-black/30">
                          <TableCell className="font-medium text-white text-xs">
                            <span className="font-bold text-seguranca-yellow block">{order.vehiclePlate}</span>
                            <span className="text-[11px] text-gray-400">OS #{order.id.substring(0, 8).toUpperCase()}</span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-300">
                            {CLEANING_TYPE_LABELS[order.cleaningType]}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {order.vehicleGarageName || 'Central'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {order.requesterSector ? SECTOR_LABELS[order.requesterSector] : 'Operacional'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {order.releaseSpot ? (
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <MapPin size={12} /> {order.releaseSpot}
                              </span>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex flex-col gap-1 items-start">
                              {renderPhaseBadge(order)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openDetail(order)}
                                className="h-7 px-2 text-gray-300 hover:text-white hover:bg-gray-700/50"
                                title="Ver Detalhes"
                              >
                                <Eye size={13} className="mr-1" /> Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openCleaningReleasePDFPreview(order)}
                                className="h-7 px-2 border-gray-700 text-seguranca-yellow hover:bg-seguranca-yellow/10"
                                title="Imprimir Comprovante de Liberação"
                              >
                                <Printer size={13} className="mr-1" /> PDF
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>

          {/* TAB 3: PRODUTIVIDADE & MÉTRICAS */}
          <TabsContent value="estatisticas" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Distribuição por Tipo */}
              <Card className="bg-seguranca-graphite border-gray-700 p-4">
                <CardHeader className="p-0 pb-3 border-b border-gray-700/60 mb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <Layers size={16} className="text-seguranca-yellow" />
                    Distribuição por Tipo de Limpeza
                  </CardTitle>
                </CardHeader>
                <div className="space-y-2.5">
                  {(['COMPLETE', 'EXTERNAL', 'INTERNAL', 'SANITARY'] as CleaningType[]).map(type => {
                    const count = orders.filter(o => o.cleaningType === type).length;
                    const pct = orders.length > 0 ? ((count / orders.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">{CLEANING_TYPE_LABELS[type]}</span>
                          <span className="text-gray-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-seguranca-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-seguranca-yellow rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Cumprimento de SLA */}
              <Card className="bg-seguranca-graphite border-gray-700 p-4">
                <CardHeader className="p-0 pb-3 border-b border-gray-700/60 mb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-400" />
                    Pontualidade & SLA de Viagem
                  </CardTitle>
                </CardHeader>
                <div className="space-y-3">
                  {(() => {
                    const pontuais = orders.filter(o => !isDelayed(o)).length;
                    const atrasados = orders.filter(o => isDelayed(o)).length;
                    const taxaPontual = orders.length > 0 ? ((pontuais / orders.length) * 100).toFixed(1) : '100';
                    return (
                      <>
                        <div className="text-center py-2">
                          <span className="text-4xl font-extrabold text-emerald-400">{taxaPontual}%</span>
                          <p className="text-xs text-gray-400 mt-1">Taxa de Liberação Dentro do Prazo</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="bg-emerald-950/20 border border-emerald-500/30 p-2 rounded">
                            <span className="text-emerald-400 font-bold block text-base">{pontuais}</span>
                            <span className="text-gray-400">No Prazo</span>
                          </div>
                          <div className="bg-red-950/20 border border-red-500/30 p-2 rounded">
                            <span className="text-red-400 font-bold block text-base">{atrasados}</span>
                            <span className="text-gray-400">Com Atraso</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Card>

              {/* Setores Solicitantes */}
              <Card className="bg-seguranca-graphite border-gray-700 p-4">
                <CardHeader className="p-0 pb-3 border-b border-gray-700/60 mb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <User size={16} className="text-sky-400" />
                    Origem das Demandas por Setor
                  </CardTitle>
                </CardHeader>
                <div className="space-y-2.5">
                  {(['DRIVER', 'TRAFFIC', 'OPERATIONAL', 'MAINTENANCE'] as RequesterSector[]).map(sector => {
                    const count = orders.filter(o => o.requesterSector === sector).length;
                    const pct = orders.length > 0 ? ((count / orders.length) * 100).toFixed(0) : '0';
                    return (
                      <div key={sector} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">{SECTOR_LABELS[sector]}</span>
                          <span className="text-gray-400 font-mono">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-seguranca-black rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: LAVAJATO */}
          <TabsContent value="lavajato" className="mt-4">
            <LavajatoContent />
          </TabsContent>

          {/* TAB 5: OS HIGIENIZAÇÃO */}
          <TabsContent value="os-higienizacao" className="mt-4">
            <OsHigienizacaoTab />
          </TabsContent>
        </Tabs>

        {/* Modal de Detalhe, Execução, Insumos & Impressão */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6 flex-wrap gap-2">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles size={18} className="text-seguranca-yellow" />
                  Higienização — {selectedOrder?.vehiclePlate}
                </DialogTitle>
                {selectedOrder && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCleaningOrderForOsModal(selectedOrder);
                        setIsCleaningOsModalOpen(true);
                      }}
                      className="h-8 text-xs border-red-500/60 text-red-400 hover:bg-red-500/10 font-semibold"
                    >
                      <FileText size={14} className="mr-1.5" /> Visualizar OS
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCleaningReleasePDF(selectedOrder, supplies)}
                      className="h-8 text-xs border-gray-600 text-gray-300 hover:text-white"
                    >
                      <FileDown size={14} className="mr-1.5" /> Baixar
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-5 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap bg-seguranca-black/40 p-3 rounded-lg border border-gray-700/60">
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    {selectedOrder.driverName && (
                      <span className="flex items-center gap-1 text-white font-medium">
                        <User size={12} className="text-seguranca-yellow" /> {selectedOrder.driverName}
                      </span>
                    )}
                    {selectedOrder.driverPhone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} /> {selectedOrder.driverPhone}
                      </span>
                    )}
                    {selectedOrder.requesterSector && (
                      <span>Setor: <strong className="text-gray-300">{SECTOR_LABELS[selectedOrder.requesterSector]}</strong></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderPriorityBadge(selectedOrder.priority)}
                    {renderPhaseBadge(selectedOrder)}
                  </div>
                </div>

                {(selectedOrder.releaseDeadline || selectedOrder.estimatedCompletion) && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {selectedOrder.releaseDeadline && (
                      <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                        <p className="text-gray-400 mb-1">Saída prevista (deadline da viagem)</p>
                        <p className="text-white font-semibold">
                          {new Date(selectedOrder.releaseDeadline).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                    {selectedOrder.estimatedCompletion && (
                      <div className={`rounded-lg p-3 border ${isDelayed(selectedOrder) ? 'bg-red-500/10 border-red-500/30' : 'bg-seguranca-black/50 border-gray-700/50'}`}>
                        <p className="text-gray-400 mb-1 flex items-center gap-1">
                          Previsão de término {isDelayed(selectedOrder) && <AlertTriangle size={12} className="text-red-400" />}
                        </p>
                        <p className={`font-semibold ${isDelayed(selectedOrder) ? 'text-red-400' : 'text-white'}`}>
                          {new Date(selectedOrder.estimatedCompletion).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.executionLocation === 'EXTERNAL' && (
                  <div className="bg-sky-950/30 border border-sky-500/40 rounded-lg p-3 text-xs flex items-center justify-between flex-wrap gap-2">
                    <span className="text-sky-300 font-semibold flex items-center gap-1.5">
                      <Droplets size={15} className="text-sky-400" /> Prestador Terceirizado: {selectedOrder.carWashName || 'Lava-Jato Externo'}
                    </span>
                    {selectedOrder.cleaningCost != null && selectedOrder.cleaningCost > 0 && (
                      <span className="text-emerald-400 font-bold font-mono text-sm">
                        R$ {selectedOrder.cleaningCost.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {selectedOrder.observations && (
                  <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-1 font-semibold">Observações / Ocorrências Informadas:</p>
                    <p className="text-sm text-gray-200">{selectedOrder.observations}</p>
                  </div>
                )}

                <EvidencePhotosSection
                  order={selectedOrder}
                  onOrderUpdated={(updated) => {
                    setSelectedOrder(updated);
                    loadOrders();
                  }}
                />

                {renderChecklistSection('INTERNAL', 'Limpeza Interna')}
                {renderChecklistSection('EXTERNAL', 'Limpeza Externa')}
                {selectedOrder.phase === 'INSPECAO' && renderQualitySection()}

                {/* Seção de Insumos e Produtos Químicos */}
                {renderSuppliesSection()}

                {/* Barra de Ações Operacionais */}
                <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-700 items-center">
                  {selectedOrder.status === 'PENDING' && (
                    <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-500 font-semibold">
                      <Play size={16} className="mr-1" /> Iniciar higienização
                    </Button>
                  )}
                  {selectedOrder.status === 'IN_PROGRESS' && selectedOrder.phase !== 'INSPECAO' && (
                    <Button onClick={handleAdvancePhase} className="bg-purple-600 hover:bg-purple-500 font-semibold">
                      Avançar fase <ArrowRight size={16} className="ml-1" />
                    </Button>
                  )}
                  {selectedOrder.phase === 'INSPECAO' && selectedOrder.status === 'IN_PROGRESS' && (
                    <>
                      <Button
                        onClick={() => handleSubmitQuality(true)}
                        disabled={completing || !qualityItems.every(i => i.checked)}
                        className="bg-emerald-600 hover:bg-emerald-500 font-semibold"
                      >
                        {completing ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                        Aprovar e liberar
                      </Button>
                      <Button
                        onClick={() => handleSubmitQuality(false)}
                        disabled={completing}
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        Registrar inspeção parcial
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'IN_PROGRESS' && selectedOrder.phase === 'INSPECAO' && selectedOrder.qualityApproved && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        value={releaseSpotInput}
                        onChange={e => setReleaseSpotInput(e.target.value)}
                        placeholder="Vaga (ex.: B-04)"
                        className="w-36 bg-seguranca-black border-gray-700 text-white text-xs h-9"
                      />
                      <Button onClick={handleRelease} disabled={completing} className="bg-emerald-600 hover:bg-emerald-500 text-xs h-9">
                        Liberar para viagem
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'COMPLETED' && (
                    <div className="flex items-center justify-between w-full flex-wrap gap-2">
                      <span className="text-emerald-400 text-xs sm:text-sm flex items-center gap-1">
                        <CheckCircle2 size={16} />
                        Liberado {selectedOrder.releasedAt ? `em ${new Date(selectedOrder.releasedAt).toLocaleString('pt-BR')}` : ''}
                        {selectedOrder.releaseSpot ? ` — vaga ${selectedOrder.releaseSpot}` : ''}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => openCleaningReleasePDFPreview(selectedOrder, supplies)}
                        className="bg-seguranca-yellow text-black hover:bg-yellow-500 text-xs font-semibold ml-auto"
                      >
                        <Printer size={14} className="mr-1.5" /> Imprimir Comprovante
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal Oficial Padronizado da OS de Higienização */}
        <VehicleCleaningViewModal
          isOpen={isCleaningOsModalOpen}
          onClose={() => {
            setIsCleaningOsModalOpen(false);
            setCleaningOrderForOsModal(null);
          }}
          order={cleaningOrderForOsModal}
          supplies={supplies}
        />

        {/* Modal de Gestão de Lava-Jatos */}
        <CarWashManagerModal
          isOpen={showCarWashModal}
          onClose={() => {
            setShowCarWashModal(false);
            loadVehiclesAndDrivers();
          }}
          onSelectCarWash={(cw) => handleCarWashSelect(cw.id, newCleaningType)}
        />

        {/* Floating Action Button (FAB) no Mobile */}
        {activeMainTab === 'operacional' && (
          <button
            onClick={() => setShowNewDialog(true)}
            className="sm:hidden fixed bottom-6 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-slate-950 shadow-2xl shadow-amber-500/50 flex items-center justify-center border-2 border-white/20 active:scale-90 transition-transform"
            title="Nova Solicitação"
            aria-label="Nova Solicitação"
          >
            <Plus size={26} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    </StandardLayout>
  );
};

export default GestaoLimpezaVeiculos;
