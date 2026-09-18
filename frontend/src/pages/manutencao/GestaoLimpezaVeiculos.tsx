import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Sparkles, Plus, Trash2, Play, CheckCircle2, Camera, Loader2,
  Bus, User, Phone, ClipboardCheck, Search, AlertTriangle,
  ArrowRight, ShieldCheck, KanbanSquare, List, Clock, MapPin, Warehouse,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import fleetService from '@/services/fleetService';
import driverService, { Driver } from '@/services/driverService';
import {
  vehicleCleaningService, VehicleCleaningOrder, ChecklistItem, QualityChecklistItem,
  CreateCleaningOrderRequest, CleaningType, CleaningStatus, CleaningPhase,
  RequesterSector, Priority,
  parseChecklist, stringifyChecklist, parseQualityChecklist, stringifyQualityChecklist,
  CLEANING_TYPE_LABELS, STATUS_LABELS, PHASE_LABELS, PHASE_COLORS,
  PRIORITY_LABELS, PRIORITY_COLORS, SECTOR_LABELS, SECTOR_DEFAULT_PRIORITY,
  isDelayed, minutesUntilDeadline,
} from '@/services/vehicleCleaningService';
import { garageService, Garage } from '@/services/garageService';

interface VehicleOption { id: string; plate: string; model: string; fleetNumber?: string; garageId?: string; }

const KANBAN_COLUMNS: CleaningPhase[] = ['AGUARDANDO', 'EXTERNA', 'INTERNA', 'INSPECAO', 'LIBERADO'];

const GestaoLimpezaVeiculos: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  const [orders, setOrders] = useState<VehicleCleaningOrder[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [garageFilter, setGarageFilter] = useState<string>('ALL');
  const [garages, setGarages] = useState<Garage[]>([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Novo diálogo
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

  // Detalhe / execução
  const [selectedOrder, setSelectedOrder] = useState<VehicleCleaningOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [qualityItems, setQualityItems] = useState<QualityChecklistItem[]>([]);
  const [releaseSpotInput, setReleaseSpotInput] = useState('');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

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
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar ordens de limpeza', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, garageFilter, toast]);

  const loadVehiclesAndDrivers = useCallback(async () => {
    try {
      const [vehData, drvData, garageData] = await Promise.all([
        fleetService.getVehicles(),
        driverService.getDrivers(),
        garageService.list().catch(() => []),
      ]);
      setVehicles(vehData.map((v: any) => ({ id: v.id, plate: v.plate, model: v.model || '', fleetNumber: v.fleetNumber, garageId: v.garageId })));
      setDrivers(drvData);
      setGarages(garageData);
    } catch {
      // opcional: silencioso, os selects simplesmente ficam vazios
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
      o.driverName?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const handleSectorChange = (sector: RequesterSector) => {
    setNewSector(sector);
    setNewPriority(SECTOR_DEFAULT_PRIORITY[sector]);
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
      };
      await vehicleCleaningService.create(payload);
      setShowNewDialog(false);
      setNewVehicleId('');
      setNewDriverId('');
      setNewDriverPhone('');
      setNewCleaningType('COMPLETE');
      setNewDeadline('');
      setNewReleaseSpot('');
      setNewObservations('');
      toast({ title: 'Sucesso', description: 'Solicitação criada na fila de higienização' });
      loadOrders();
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
          ? `Previsão de término: ${new Date(updated.estimatedCompletion).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} — CCO e motorista notificados`
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
      await vehicleCleaningService.updateChecklist(selectedOrder.id, stringifyChecklist(next));
    } catch {
      // mantém estado local; sincronizará na próxima abertura
    }
  };

  const toggleQualityItem = (key: string) => {
    setQualityItems(prev => prev.map(i => i.key === key ? { ...i, checked: !i.checked } : i));
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
    try {
      await vehicleCleaningService.delete(id);
      toast({ title: 'Sucesso', description: 'Ordem excluída' });
      loadOrders();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
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
        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border bg-red-500/15 text-red-400 border-red-500/30">
          🔴 Atrasado
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
            <label className="cursor-pointer p-2 text-gray-400 hover:text-seguranca-yellow transition-colors flex-shrink-0">
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
        <ShieldCheck size={14} /> Inspeção de Qualidade
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

  const renderOrderCard = (order: VehicleCleaningOrder) => (
    <Card key={order.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all">
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {renderPhaseBadge(order)}
          {renderPriorityBadge(order.priority)}
        </div>
        <button onClick={() => handleDelete(order.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0">
          <Bus className="text-seguranca-yellow" size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate">{order.vehiclePlate}</p>
          <p className="text-gray-400 text-xs truncate">{order.vehicleModel || CLEANING_TYPE_LABELS[order.cleaningType]}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2 flex-wrap">
        {order.driverName && (
          <span className="flex items-center gap-1"><User size={12} /> {order.driverName}</span>
        )}
        <span className="flex items-center gap-1"><ClipboardCheck size={12} /> {CLEANING_TYPE_LABELS[order.cleaningType]}</span>
        {order.vehicleGarageName && (
          <span className="flex items-center gap-1"><Warehouse size={12} /> {order.vehicleGarageName}</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs mb-4 flex-wrap">
        {renderSlaInfo(order)}
        {order.requesterSector && (
          <span className="text-gray-500">via {SECTOR_LABELS[order.requesterSector]}</span>
        )}
        {order.releaseSpot && (
          <span className="flex items-center gap-1 text-emerald-400"><MapPin size={12} /> {order.releaseSpot}</span>
        )}
      </div>
      {isDelayed(order) && order.status !== 'COMPLETED' && (
        <div className="flex items-center gap-1 text-xs text-red-400 mb-3 bg-red-500/10 border border-red-500/30 rounded-md p-2">
          <AlertTriangle size={12} /> Previsão acima do horário de saída — avaliar troca de carro
        </div>
      )}
      <Button
        onClick={() => openDetail(order)}
        variant="outline"
        className="w-full border-gray-600 text-gray-300 hover:text-white"
      >
        {order.status === 'COMPLETED' ? 'Ver detalhes' : 'Executar checklist'}
      </Button>
    </Card>
  );

  const kanban = useMemo(() => {
    void nowTick; // reavalia isDelayed/minutos a cada tick
    return KANBAN_COLUMNS.map(phase => ({
      phase,
      orders: filteredOrders.filter(o => (o.phase || 'AGUARDANDO') === phase && o.status !== 'COMPLETED')
        .concat(phase === 'LIBERADO' ? filteredOrders.filter(o => o.status === 'COMPLETED') : []),
    }));
  }, [filteredOrders, nowTick]);

  return (
    <StandardLayout title="Gestão de Limpeza de Veículos" subtitle="Fila por SLA, execução em fases, inspeção de qualidade e liberação para viagem">
      <div className="p-6">
        {/* Filtros + Ações */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar placa, modelo, motorista..."
              className="pl-9 bg-seguranca-graphite border-gray-700 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
              <SelectItem value="COMPLETED">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={garageFilter} onValueChange={setGarageFilter}>
            <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white w-44">
              <SelectValue placeholder="Garagem" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
              <SelectItem value="ALL">Todas as garagens</SelectItem>
              {garages.filter(g => g.active !== false).map(g => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
            className={viewMode === 'kanban' ? 'bg-seguranca-yellow text-black' : 'border-gray-600 text-gray-300'}
          >
            <KanbanSquare size={16} className="mr-1" /> Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-seguranca-yellow text-black' : 'border-gray-600 text-gray-300'}
          >
            <List size={16} className="mr-1" /> Lista
          </Button>

          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-yellow text-black hover:bg-yellow-500 ml-auto">
                <Plus size={18} className="mr-1" /> Nova Solicitação
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
                  <p className="text-xs text-gray-500 mt-1">Padrão aplicada conforme o setor solicitante.</p>
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
                  <label className="text-sm text-gray-400 mb-1 block">Tipo de Serviço *</label>
                  <Select value={newCleaningType} onValueChange={(v) => setNewCleaningType(v as CleaningType)}>
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                      <SelectItem value="EXTERNAL">Apenas Externa (lavagem rápida/chassi)</SelectItem>
                      <SelectItem value="INTERNAL">Apenas Interna (varrição, estofados, painel)</SelectItem>
                      <SelectItem value="SANITARY">Sanitário / Descarte e Reabastecimento</SelectItem>
                      <SelectItem value="COMPLETE">Completa (interna + externa)</SelectItem>
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
                  className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  {saving ? <Loader2 size={18} className="animate-spin mr-1" /> : <Plus size={18} className="mr-1" />}
                  Abrir Solicitação
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-seguranca-yellow animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sparkles className="mx-auto mb-2" size={36} />
            <p>Nenhuma ordem de limpeza encontrada</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {kanban.map(col => (
              <div key={col.phase} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${col.phase === 'AGUARDANDO' ? 'bg-amber-400' : col.phase === 'EXTERNA' ? 'bg-sky-400' : col.phase === 'INTERNA' ? 'bg-purple-400' : col.phase === 'INSPECAO' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  <h3 className="text-sm font-semibold text-gray-300">{PHASE_LABELS[col.phase]}</h3>
                  <span className="text-xs text-gray-500 ml-auto">{col.orders.length}</span>
                </div>
                {col.orders.length === 0 ? (
                  <div className="text-center text-xs text-gray-600 py-6 border border-dashed border-gray-800 rounded-lg">
                    —
                  </div>
                ) : (
                  col.orders.map(renderOrderCard)
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredOrders.map(renderOrderCard)}
          </div>
        )}

        {/* Detalhe / Execução */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles size={18} className="text-seguranca-yellow" />
                Limpeza — {selectedOrder?.vehiclePlate}
              </DialogTitle>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-5 py-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    {selectedOrder.driverName && (
                      <span className="flex items-center gap-1"><User size={12} /> {selectedOrder.driverName}</span>
                    )}
                    {selectedOrder.driverPhone && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {selectedOrder.driverPhone}</span>
                    )}
                    {selectedOrder.requesterSector && (
                      <span>{SECTOR_LABELS[selectedOrder.requesterSector]}</span>
                    )}
                    {selectedOrder.requestedByName && (
                      <span className="text-gray-500">solicitado por {selectedOrder.requestedByName}</span>
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
                        <p className="text-gray-400 mb-1">Saída prevista (deadline)</p>
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

                {selectedOrder.observations && (
                  <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-1">Observações de Ocorrência</p>
                    <p className="text-sm text-white">{selectedOrder.observations}</p>
                  </div>
                )}

                {renderChecklistSection('INTERNAL', 'Limpeza Interna')}
                {renderChecklistSection('EXTERNAL', 'Limpeza Externa')}
                {selectedOrder.phase === 'INSPECAO' && renderQualitySection()}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700 items-center">
                  {selectedOrder.status === 'PENDING' && (
                    <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-500">
                      <Play size={16} className="mr-1" /> Iniciar higienização
                    </Button>
                  )}
                  {selectedOrder.status === 'IN_PROGRESS' && selectedOrder.phase !== 'INSPECAO' && (
                    <Button onClick={handleAdvancePhase} className="bg-purple-600 hover:bg-purple-500">
                      Avançar fase <ArrowRight size={16} className="ml-1" />
                    </Button>
                  )}
                  {selectedOrder.phase === 'INSPECAO' && selectedOrder.status === 'IN_PROGRESS' && (
                    <>
                      <Button
                        onClick={() => handleSubmitQuality(true)}
                        disabled={completing || !qualityItems.every(i => i.checked)}
                        className="bg-emerald-600 hover:bg-emerald-500"
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
                        Registrar inspeção
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'IN_PROGRESS' && selectedOrder.phase === 'INSPECAO' && selectedOrder.qualityApproved && (
                    <div className="flex items-center gap-2 ml-auto">
                      <Input
                        value={releaseSpotInput}
                        onChange={e => setReleaseSpotInput(e.target.value)}
                        placeholder="Vaga (ex.: B-04)"
                        className="w-36 bg-seguranca-black border-gray-700 text-white"
                      />
                      <Button onClick={handleRelease} disabled={completing} className="bg-emerald-600 hover:bg-emerald-500">
                        Liberar para viagem
                      </Button>
                    </div>
                  )}
                  {selectedOrder.status === 'COMPLETED' && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1 ml-auto flex-wrap">
                      <CheckCircle2 size={16} />
                      Liberado {selectedOrder.releasedAt ? `em ${new Date(selectedOrder.releasedAt).toLocaleString('pt-BR')}` : ''}
                      {selectedOrder.releaseSpot ? ` — vaga ${selectedOrder.releaseSpot}` : ''}
                    </span>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default GestaoLimpezaVeiculos;
