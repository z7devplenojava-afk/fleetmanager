import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Droplets, Plus, Trash2, Play, CheckCircle2, Timer, Loader2,
  Bus, User, Phone, ClipboardCheck, Search, Clock, Eye, Camera,
  Calendar, AlertTriangle
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
  lavajatoService, LavajatoServiceRecord, ChecklistItem,
  CreateLavajatoRequest, LavajatoStatus,
  parseChecklist, stringifyChecklist, STATUS_LABELS, formatDuration,
  getDefaultChecklistInternal, getDefaultChecklistExternal,
} from '@/services/lavajatoService';
import LavajatoStatsPanel from './LavajatoStats';

interface VehicleOption { id: string; plate: string; model: string; }

const Lavajato: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  const [records, setRecords] = useState<LavajatoServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Busca de placa na lista
  const [plateSearch, setPlateSearch] = useState('');

  // Novo registro
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newObservations, setNewObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Detalhe / execução
  const [selectedRecord, setSelectedRecord] = useState<LavajatoServiceRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checklistInternal, setChecklistInternal] = useState<ChecklistItem[]>([]);
  const [checklistExternal, setChecklistExternal] = useState<ChecklistItem[]>([]);
  const [completing, setCompleting] = useState(false);
  const [showCompleteWarning, setShowCompleteWarning] = useState(false);
  const [pendingCompleteReason, setPendingCompleteReason] = useState<string[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Timer em tempo real
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await lavajatoService.list(
        statusFilter === 'ALL' ? undefined : { status: statusFilter as LavajatoStatus }
      );
      setRecords(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar registros de lavajato', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, toast]);

  const loadVehiclesAndDrivers = useCallback(async () => {
    try {
      const [vehData, drvData] = await Promise.all([
        fleetService.getVehicles(),
        driverService.getDrivers(),
      ]);
      setVehicles(vehData.map((v: any) => ({ id: v.id, plate: v.plate, model: v.model || '' })));
      setDrivers(drvData);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => { loadRecords(); }, [loadRecords]);
  useEffect(() => { loadVehiclesAndDrivers(); }, [loadVehiclesAndDrivers]);

  // Timer em tempo real
  useEffect(() => {
    if (selectedRecord?.status === 'IN_PROGRESS' && selectedRecord.startedAt) {
      const start = new Date(selectedRecord.startedAt).getTime();
      const update = () => {
        const now = Date.now();
        setElapsedSeconds(Math.floor((now - start) / 1000));
      };
      update();
      timerRef.current = setInterval(update, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      setElapsedSeconds(selectedRecord?.durationSeconds || 0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [selectedRecord]);

  const handleCreate = async () => {
    if (!newVehicleId) {
      toast({ title: 'Atenção', description: 'Selecione o veículo', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: CreateLavajatoRequest = {
        vehicleId: newVehicleId,
        driverId: newDriverId || undefined,
        driverPhone: newDriverPhone.trim() || undefined,
        observations: newObservations.trim() || undefined,
      };
      await lavajatoService.create(payload);
      setShowNewDialog(false);
      setNewVehicleId('');
      setNewDriverId('');
      setNewDriverPhone('');
      setNewObservations('');
      setVehicleSearch('');
      toast({ title: 'Sucesso', description: 'Registro de lavajato criado' });
      loadRecords();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar registro', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (record: LavajatoServiceRecord) => {
    try {
      const fresh = await lavajatoService.getById(record.id);
      setSelectedRecord(fresh);
      setChecklistInternal(parseChecklist(fresh.checklistInternal, getDefaultChecklistInternal()));
      setChecklistExternal(parseChecklist(fresh.checklistExternal, getDefaultChecklistExternal()));
      setDetailOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao abrir registro', variant: 'destructive' });
    }
  };

  const handleStart = async () => {
    if (!selectedRecord) return;
    try {
      const updated = await lavajatoService.start(selectedRecord.id);
      setSelectedRecord(updated);
      toast({ title: 'Sucesso', description: 'Serviço iniciado — cronômetro rodando!' });
      loadRecords();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao iniciar', variant: 'destructive' });
    }
  };

  const handleUploadPhoto = async (listType: 'internal' | 'external', key: string, file: File) => {
    if (!selectedRecord) return;
    setUploadingKey(key);
    try {
      const updated = await lavajatoService.uploadItemPhoto(selectedRecord.id, key, listType, file);
      setSelectedRecord(updated);
      if (listType === 'internal') {
        setChecklistInternal(parseChecklist(updated.checklistInternal, getDefaultChecklistInternal()));
      } else {
        setChecklistExternal(parseChecklist(updated.checklistExternal, getDefaultChecklistExternal()));
      }
      toast({ title: 'Sucesso', description: 'Foto anexada' });
    } catch {
      toast({ title: 'Erro', description: 'Erro ao enviar foto', variant: 'destructive' });
    } finally {
      setUploadingKey(null);
    }
  };

  const toggleItem = async (listType: 'internal' | 'external', key: string) => {
    if (!selectedRecord) return;
    const currentList = listType === 'internal' ? checklistInternal : checklistExternal;
    const next = currentList.map(i => i.key === key ? { ...i, checked: !i.checked } : i);
    if (listType === 'internal') {
      setChecklistInternal(next);
      try { await lavajatoService.updateChecklistInternal(selectedRecord.id, stringifyChecklist(next)); } catch { /* sync later */ }
    } else {
      setChecklistExternal(next);
      try { await lavajatoService.updateChecklistExternal(selectedRecord.id, stringifyChecklist(next)); } catch { /* sync later */ }
    }
  };

  const handleComplete = async () => {
    if (!selectedRecord) return;

    // Verificar itens não marcados
    const uncheckedInternal = checklistInternal.filter(i => !i.checked);
    const uncheckedExternal = checklistExternal.filter(i => !i.checked);
    const warnings: string[] = [];
    if (uncheckedInternal.length > 0) {
      warnings.push(`${uncheckedInternal.length} item(ns) interno(s) não concluído(s): ${uncheckedInternal.map(i => i.title).join(', ')}`);
    }
    if (uncheckedExternal.length > 0) {
      warnings.push(`${uncheckedExternal.length} item(ns) externo(s) não concluído(s): ${uncheckedExternal.map(i => i.title).join(', ')}`);
    }
    if (warnings.length > 0) {
      setPendingCompleteReason(warnings);
      setShowCompleteWarning(true);
      return;
    }
    await doComplete();
  };

  const doComplete = async () => {
    if (!selectedRecord) return;
    setShowCompleteWarning(false);
    setCompleting(true);
    try {
      const updated = await lavajatoService.complete(selectedRecord.id);
      setSelectedRecord(updated);
      toast({
        title: 'Serviço finalizado',
        description: 'Motorista e operacional notificados (sino + WhatsApp quando configurado)',
      });
      loadRecords();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao finalizar', variant: 'destructive' });
    } finally {
      setCompleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lavajatoService.delete(id);
      toast({ title: 'Sucesso', description: 'Registro excluído' });
      loadRecords();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const renderStatusBadge = (status: LavajatoStatus) => {
    const map: Record<LavajatoStatus, string> = {
      PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      IN_PROGRESS: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
    return (
      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${map[status]}`}>
        {STATUS_LABELS[status]}
      </span>
    );
  };

  const renderChecklistSection = (
    listType: 'internal' | 'external',
    title: string,
    items: ChecklistItem[]
  ) => {
    if (items.length === 0) return null;
    const checkedCount = items.filter(i => i.checked).length;
    const progressPct = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-seguranca-yellow uppercase tracking-wide flex items-center gap-2">
          {listType === 'internal' ? '🏠' : '🚗'} {title}
          <span className="text-xs text-gray-500 normal-case">
            ({checkedCount}/{items.length})
          </span>
        </h4>
        {/* Barra de progresso */}
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              progressPct === 100 ? 'bg-emerald-500' : 'bg-seguranca-yellow'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {items.map(item => (
          <div key={item.key} className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleItem(listType, item.key)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600 hover:border-emerald-400'
                }`}
              >
                {item.checked && <CheckCircle2 size={14} />}
              </button>
              <p className={`text-sm font-medium flex-1 ${item.checked ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>
                {item.title}
              </p>
              <label className="cursor-pointer p-1.5 text-gray-400 hover:text-seguranca-yellow transition-colors flex-shrink-0" title="Anexar foto">
                {uploadingKey === item.key ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingKey !== null}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadPhoto(listType, item.key, file);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            {item.photoUrl && (
              <img
                src={item.photoUrl}
                alt={item.title}
                className="mt-2 h-24 w-auto rounded-lg object-cover border border-gray-700"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  // Filtrar registros por placa
  const filteredRecords = useMemo(() => {
    if (!plateSearch.trim()) return records;
    const q = plateSearch.trim().toUpperCase();
    return records.filter(r =>
      r.vehiclePlate?.toUpperCase().includes(q) ||
      r.vehicleModel?.toUpperCase().includes(q) ||
      r.vehicleBrand?.toUpperCase().includes(q) ||
      r.driverName?.toUpperCase().includes(q)
    );
  }, [records, plateSearch]);

  // Veículos filtrados para o diálogo
  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles;
    const q = vehicleSearch.trim().toUpperCase();
    return vehicles.filter(v =>
      v.plate.toUpperCase().includes(q) ||
      v.model.toUpperCase().includes(q)
    );
  }, [vehicles, vehicleSearch]);

  // Estatísticas rápidas
  const stats = {
    total: records.length,
    pending: records.filter(r => r.status === 'PENDING').length,
    inProgress: records.filter(r => r.status === 'IN_PROGRESS').length,
    completed: records.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <StandardLayout title="Lavajato" subtitle="Registro de lavagem, checklist interno/externo, cronômetro e notificações">
      <div className="p-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-seguranca-graphite border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center">
                <Droplets className="text-seguranca-yellow" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
          </Card>
          <Card className="bg-seguranca-graphite border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="text-amber-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
                <p className="text-xs text-gray-400">Pendentes</p>
              </div>
            </div>
          </Card>
          <Card className="bg-seguranca-graphite border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center">
                <Timer className="text-sky-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                <p className="text-xs text-gray-400">Em andamento</p>
              </div>
            </div>
          </Card>
          <Card className="bg-seguranca-graphite border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="text-emerald-400" size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
                <p className="text-xs text-gray-400">Finalizados</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Dashboard de Estatísticas */}
        <LavajatoStatsPanel />

        {/* Filtros + Ações */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              value={plateSearch}
              onChange={e => setPlateSearch(e.target.value)}
              className="pl-9 bg-seguranca-graphite border-gray-700 text-white w-full"
              placeholder="Buscar por placa, modelo, motorista..."
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
              <SelectItem value="ALL">Todos os status</SelectItem>
              <SelectItem value="PENDING">Pendentes</SelectItem>
              <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
              <SelectItem value="COMPLETED">Finalizados</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-yellow text-black hover:bg-yellow-500 ml-auto">
                <Plus size={18} className="mr-1" /> Novo Serviço de Lavajato
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Droplets size={18} className="text-seguranca-yellow" /> Novo Serviço de Lavajato
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Veículo *</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                    <Input
                      value={vehicleSearch}
                      onChange={e => setVehicleSearch(e.target.value)}
                      className="pl-8 bg-seguranca-black border-gray-700 text-white text-sm"
                      placeholder="Filtrar por placa ou modelo..."
                    />
                  </div>
                  <Select value={newVehicleId} onValueChange={setNewVehicleId}>
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                      {filteredVehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} {v.model ? `- ${v.model}` : ''}
                        </SelectItem>
                      ))}
                      {filteredVehicles.length === 0 && (
                        <div className="px-3 py-2 text-sm text-gray-500">Nenhum veículo encontrado</div>
                      )}
                    </SelectContent>
                  </Select>
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
                      placeholder="(00) 00000-0000 — recebe aviso quando pronto"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente com o WhatsApp do motorista.</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Observações</label>
                  <Textarea
                    value={newObservations}
                    onChange={e => setNewObservations(e.target.value)}
                    className="bg-seguranca-black border-gray-700 text-white"
                    rows={3}
                    placeholder="Ex.: lavagem completa antes da viagem das 14h"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  {saving ? <Loader2 size={18} className="animate-spin mr-1" /> : <Plus size={18} className="mr-1" />}
                  Criar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-seguranca-yellow animate-spin" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Droplets className="mx-auto mb-2" size={36} />
            <p>{plateSearch ? 'Nenhum registro encontrado para "' + plateSearch + '"' : 'Nenhum registro de lavajato encontrado'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRecords.map(record => (
              <Card key={record.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all">
                <div className="flex items-center justify-between mb-3">
                  {renderStatusBadge(record.status)}
                  <button onClick={() => handleDelete(record.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  {record.vehiclePhotoUrl ? (
                    <img
                      src={record.vehiclePhotoUrl}
                      alt={record.vehiclePlate}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-700 flex-shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-700/50"
                      style={record.vehicleColor ? { backgroundColor: record.vehicleColor + '20', borderColor: record.vehicleColor + '40' } : { backgroundColor: 'rgba(250,204,21,0.1)' }}
                    >
                      <Bus
                        size={20}
                        style={record.vehicleColor ? { color: record.vehicleColor } : { color: 'var(--color-seguranca-yellow, #facc15)' }}
                      />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{record.vehiclePlate}</p>
                    <p className="text-gray-400 text-xs truncate">{record.vehicleBrand} {record.vehicleModel}</p>
                    {record.vehicleColor && (
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <span
                          className="inline-block w-2 h-2 rounded-full border border-gray-600"
                          style={{ backgroundColor: record.vehicleColor }}
                        /> {record.vehicleColor}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                  {record.driverName && (
                    <span className="flex items-center gap-1"><User size={12} /> {record.driverName}</span>
                  )}
                  {record.operatorName && (
                    <span className="flex items-center gap-1"><ClipboardCheck size={12} /> {record.operatorName}</span>
                  )}
                </div>
                {/* Data de criação + progresso do checklist */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  {record.createdAt && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {new Date(record.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                  {record.status !== 'PENDING' && (() => {
                    const intParsed = (() => { try { return JSON.parse(record.checklistInternal || '[]'); } catch { return []; } })();
                    const extParsed = (() => { try { return JSON.parse(record.checklistExternal || '[]'); } catch { return []; } })();
                    const intTotal = intParsed.length;
                    const intDone = intParsed.filter((i: any) => i.checked).length;
                    const extTotal = extParsed.length;
                    const extDone = extParsed.filter((i: any) => i.checked).length;
                    const totalAll = intTotal + extTotal;
                    const doneAll = intDone + extDone;
                    return totalAll > 0 ? (
                      <span className="flex items-center gap-1">
                        <ClipboardCheck size={11} /> {doneAll}/{totalAll} itens
                      </span>
                    ) : null;
                  })()}
                </div>
                {record.status === 'IN_PROGRESS' && record.startedAt && (
                  <div className="flex items-center gap-2 text-sky-400 text-xs mb-3">
                    <Timer size={14} className="animate-pulse" />
                    <span>Cronômetro: {formatDuration(Math.floor((Date.now() - new Date(record.startedAt).getTime()) / 1000))}</span>
                  </div>
                )}
                {record.status === 'COMPLETED' && record.durationSeconds && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs mb-3">
                    <Clock size={14} />
                    <span>Duração: {formatDuration(record.durationSeconds)}</span>
                  </div>
                )}
                <Button
                  onClick={() => openDetail(record)}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:text-white"
                >
                  {record.status === 'COMPLETED' ? (
                    <><Eye size={16} className="mr-1" /> Ver detalhes</>
                  ) : (
                    <><Play size={16} className="mr-1" /> Executar checklist</>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {/* Detalhe / Execução */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Droplets size={18} className="text-seguranca-yellow" />
                Lavajato — {selectedRecord?.vehiclePlate}
              </DialogTitle>
            </DialogHeader>

            {selectedRecord && (
              <div className="space-y-5 py-4">
                {/* Header info */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {selectedRecord.driverName && (
                      <span className="flex items-center gap-1"><User size={12} /> {selectedRecord.driverName}</span>
                    )}
                    {selectedRecord.driverPhone && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {selectedRecord.driverPhone}</span>
                    )}
                    {selectedRecord.operatorName && (
                      <span className="flex items-center gap-1"><ClipboardCheck size={12} /> Operador: {selectedRecord.operatorName}</span>
                    )}
                  </div>
                  {renderStatusBadge(selectedRecord.status)}
                </div>

                {/* Timer em destaque */}
                {selectedRecord.status === 'IN_PROGRESS' && (
                  <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-sky-400 uppercase tracking-wide mb-1">Tempo de execução</p>
                    <p className="text-3xl font-mono font-bold text-sky-300">{formatDuration(elapsedSeconds)}</p>
                    <p className="text-xs text-gray-500 mt-1">Cronômetro rodando desde {selectedRecord.startedAt ? new Date(selectedRecord.startedAt).toLocaleTimeString('pt-BR') : ''}</p>
                  </div>
                )}

                {selectedRecord.status === 'COMPLETED' && selectedRecord.durationSeconds != null && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                    <p className="text-xs text-emerald-400 uppercase tracking-wide mb-1">Duração total</p>
                    <p className="text-3xl font-mono font-bold text-emerald-300">{formatDuration(selectedRecord.durationSeconds)}</p>
                    {selectedRecord.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">Finalizado em {new Date(selectedRecord.completedAt).toLocaleString('pt-BR')}</p>
                    )}
                  </div>
                )}

                {/* Observações */}
                {selectedRecord.observations && (
                  <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-1">Observações</p>
                    <p className="text-sm text-white">{selectedRecord.observations}</p>
                  </div>
                )}

                {/* Checklist Interno */}
                <div className="border border-gray-700/50 rounded-lg p-4 bg-seguranca-black/30">
                  {renderChecklistSection('internal', 'Limpeza Interna', checklistInternal)}
                </div>

                {/* Checklist Externo */}
                <div className="border border-gray-700/50 rounded-lg p-4 bg-seguranca-black/30">
                  {renderChecklistSection('external', 'Limpeza Externa', checklistExternal)}
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                  {selectedRecord.status === 'PENDING' && (
                    <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-500">
                      <Play size={16} className="mr-1" /> Iniciar serviço
                    </Button>
                  )}
                  {selectedRecord.status === 'IN_PROGRESS' && (
                    <Button
                      onClick={handleComplete}
                      disabled={completing}
                      className="bg-emerald-600 hover:bg-emerald-500 ml-auto"
                      title="Finalizar e notificar motorista + operacional"
                    >
                      {completing ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                      Finalizar e notificar
                    </Button>
                  )}
                  {selectedRecord.status === 'COMPLETED' && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1 ml-auto">
                      <CheckCircle2 size={16} /> Serviço finalizado
                    </span>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Confirmação de finalização com itens não marcados */}
        <Dialog open={showCompleteWarning} onOpenChange={setShowCompleteWarning}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <AlertTriangle size={18} /> Itens incompletos no checklist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <p className="text-sm text-gray-300">
                Existem itens no checklist que ainda não foram marcados. Deseja finalizar mesmo assim?
              </p>
              <div className="bg-seguranca-black/50 rounded-lg p-3 border border-amber-500/30 space-y-2">
                {pendingCompleteReason.map((reason, idx) => (
                  <p key={idx} className="text-xs text-amber-300">⚠ {reason}</p>
                ))}
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowCompleteWarning(false)} className="border-gray-600 text-gray-300">
                  Voltar ao checklist
                </Button>
                <Button onClick={doComplete} disabled={completing} className="bg-emerald-600 hover:bg-emerald-500">
                  {completing ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                  Finalizar mesmo assim
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default Lavajato;
