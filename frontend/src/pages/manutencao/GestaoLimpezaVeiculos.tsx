import React, { useState, useEffect, useCallback } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Sparkles, Plus, Trash2, Play, CheckCircle2, Camera, Loader2,
  Bus, User, Phone, ClipboardCheck, Search
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
  vehicleCleaningService, VehicleCleaningOrder, ChecklistItem,
  CreateCleaningOrderRequest, CleaningType, CleaningStatus,
  parseChecklist, stringifyChecklist, CLEANING_TYPE_LABELS, STATUS_LABELS,
} from '@/services/vehicleCleaningService';

interface VehicleOption { id: string; plate: string; model: string; }

const GestaoLimpezaVeiculos: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  const [orders, setOrders] = useState<VehicleCleaningOrder[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Novo diálogo
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newVehicleId, setNewVehicleId] = useState('');
  const [newDriverId, setNewDriverId] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newCleaningType, setNewCleaningType] = useState<CleaningType>('COMPLETE');
  const [newObservations, setNewObservations] = useState('');
  const [saving, setSaving] = useState(false);

  // Detalhe / execução
  const [selectedOrder, setSelectedOrder] = useState<VehicleCleaningOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await vehicleCleaningService.list(
        statusFilter === 'ALL' ? undefined : { status: statusFilter as CleaningStatus }
      );
      setOrders(data);
    } catch (error: any) {
      toast({ title: 'Erro', description: 'Erro ao carregar ordens de limpeza', variant: 'destructive' });
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
    } catch {
      // opcional: silencioso, os selects simplesmente ficam vazios
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);
  useEffect(() => { loadVehiclesAndDrivers(); }, [loadVehiclesAndDrivers]);

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
        observations: newObservations.trim() || undefined,
      };
      await vehicleCleaningService.create(payload);
      setShowNewDialog(false);
      setNewVehicleId('');
      setNewDriverId('');
      setNewDriverPhone('');
      setNewObservations('');
      toast({ title: 'Sucesso', description: 'Ordem de limpeza criada' });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao criar ordem', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (order: VehicleCleaningOrder) => {
    try {
      const fresh = await vehicleCleaningService.getById(order.id);
      setSelectedOrder(fresh);
      setChecklist(parseChecklist(fresh.checklistData));
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
      toast({ title: 'Sucesso', description: 'Limpeza iniciada' });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao iniciar', variant: 'destructive' });
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

  const handleComplete = async () => {
    if (!selectedOrder) return;
    setCompleting(true);
    try {
      const updated = await vehicleCleaningService.complete(selectedOrder.id);
      setSelectedOrder(updated);
      toast({
        title: 'Limpeza finalizada',
        description: 'Motorista notificado (sino + WhatsApp quando configurado)',
      });
      loadOrders();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao finalizar', variant: 'destructive' });
    } finally {
      setCompleting(false);
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

  const renderStatusBadge = (status: CleaningStatus) => {
    const map: Record<CleaningStatus, string> = {
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

  return (
    <StandardLayout title="Limpeza de Veículos" subtitle="Gestão de limpeza interna e externa com checklist e fotos">
      <div className="p-6">
        {/* Filtros + Ações */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="pl-9 bg-seguranca-graphite border-gray-700 text-white w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                <SelectItem value="ALL">Todos os status</SelectItem>
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
                <SelectItem value="COMPLETED">Finalizadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-yellow text-black hover:bg-yellow-500 ml-auto">
                <Plus size={18} className="mr-1" /> Nova Ordem de Limpeza
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles size={18} className="text-seguranca-yellow" /> Nova Ordem de Limpeza
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Veículo *</label>
                  <Select value={newVehicleId} onValueChange={setNewVehicleId}>
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} {v.model ? `- ${v.model}` : ''}
                        </SelectItem>
                      ))}
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
                      placeholder="(00) 00000-0000 — recebe aviso de limpeza finalizada"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente com o WhatsApp cadastrado do motorista.</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Tipo de limpeza *</label>
                  <Select value={newCleaningType} onValueChange={(v) => setNewCleaningType(v as CleaningType)}>
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                      <SelectItem value="INTERNAL">Limpeza Interna</SelectItem>
                      <SelectItem value="EXTERNAL">Limpeza Externa</SelectItem>
                      <SelectItem value="COMPLETE">Limpeza Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Observações</label>
                  <Textarea
                    value={newObservations}
                    onChange={e => setNewObservations(e.target.value)}
                    className="bg-seguranca-black border-gray-700 text-white"
                    rows={3}
                    placeholder="Ex.: limpeza completa antes da viagem das 14h"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={saving}
                  className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500"
                >
                  {saving ? <Loader2 size={18} className="animate-spin mr-1" /> : <Plus size={18} className="mr-1" />}
                  Criar Ordem
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
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sparkles className="mx-auto mb-2" size={36} />
            <p>Nenhuma ordem de limpeza encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => (
              <Card key={order.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all">
                <div className="flex items-center justify-between mb-3">
                  {renderStatusBadge(order.status)}
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
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  {order.driverName && (
                    <span className="flex items-center gap-1"><User size={12} /> {order.driverName}</span>
                  )}
                  <span className="flex items-center gap-1"><ClipboardCheck size={12} /> {CLEANING_TYPE_LABELS[order.cleaningType]}</span>
                </div>
                <Button
                  onClick={() => openDetail(order)}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:text-white"
                >
                  {order.status === 'COMPLETED' ? 'Ver detalhes' : 'Executar checklist'}
                </Button>
              </Card>
            ))}
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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {selectedOrder.driverName && (
                      <span className="flex items-center gap-1"><User size={12} /> {selectedOrder.driverName}</span>
                    )}
                    {selectedOrder.driverPhone && (
                      <span className="flex items-center gap-1"><Phone size={12} /> {selectedOrder.driverPhone}</span>
                    )}
                  </div>
                  {renderStatusBadge(selectedOrder.status)}
                </div>

                {selectedOrder.observations && (
                  <div className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-1">Observações</p>
                    <p className="text-sm text-white">{selectedOrder.observations}</p>
                  </div>
                )}

                {renderChecklistSection('INTERNAL', 'Limpeza Interna')}
                {renderChecklistSection('EXTERNAL', 'Limpeza Externa')}

                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                  {selectedOrder.status === 'PENDING' && (
                    <Button onClick={handleStart} className="bg-sky-600 hover:bg-sky-500">
                      <Play size={16} className="mr-1" /> Iniciar limpeza
                    </Button>
                  )}
                  {selectedOrder.status !== 'COMPLETED' && (
                    <Button
                      onClick={handleComplete}
                      disabled={completing || selectedOrder.status === 'PENDING'}
                      className="bg-emerald-600 hover:bg-emerald-500 ml-auto"
                      title={selectedOrder.status === 'PENDING' ? 'Inicie a limpeza antes de finalizar' : 'Finalizar e notificar o motorista'}
                    >
                      {completing ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                      Finalizar e notificar motorista
                    </Button>
                  )}
                  {selectedOrder.status === 'COMPLETED' && (
                    <span className="text-emerald-400 text-sm flex items-center gap-1 ml-auto">
                      <CheckCircle2 size={16} /> Finalizada em {selectedOrder.completedAt ? new Date(selectedOrder.completedAt).toLocaleString('pt-BR') : ''}
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
