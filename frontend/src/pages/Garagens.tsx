import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Warehouse, Plus, Trash2, Loader2, Bus, User, Phone, Search,
  MapPin, Building2, Users, Pencil, AlertTriangle, Gauge,
  ArrowLeftRight, History, ArrowRight,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  garageService, Garage, GarageInput, GarageOccupancyDashboard,
  GarageMovement, GarageTransferInput, MOVEMENT_REASON_LABELS,
} from '@/services/garageService';
import { employeeService, SimpleEmployee } from '@/services/employeeService';
import fleetService from '@/services/fleetService';

interface VehicleOption { id: string; plate: string; model: string; }

const Garagens: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  const [garages, setGarages] = useState<Garage[]>([]);
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [dashboard, setDashboard] = useState<GarageOccupancyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Diálogo de cadastro/edição
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GarageInput>({
    name: '', address: '', responsibleEmployeeId: '', responsibleName: '',
    responsiblePhone: '', capacity: undefined, notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Gerenciar veículos da garagem
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [vehicleToAssign, setVehicleToAssign] = useState('');

  // Confirmação de exclusão
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Remanejamento entre garagens
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferVehicleId, setTransferVehicleId] = useState('');
  const [transferToGarageId, setTransferToGarageId] = useState('');
  const [transferReason, setTransferReason] = useState('REMANEJAMENTO');
  const [transferDetail, setTransferDetail] = useState('');
  const [transferSaving, setTransferSaving] = useState(false);

  // Histórico de movimentações
  const [historyOpen, setHistoryOpen] = useState(false);
  const [movements, setMovements] = useState<GarageMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [garagesData, employeesData, vehiclesData, dashboardData] = await Promise.all([
        garageService.list(),
        employeeService.getSimpleEmployees().catch(() => []),
        fleetService.getVehicles().catch(() => [] as any[]),
        garageService.occupancyDashboard().catch(() => null),
      ]);
      setGarages(garagesData);
      setEmployees(employeesData);
      setVehicles((vehiclesData as any[]).map(v => ({ id: v.id, plate: v.plate, model: v.model || '' })));
      setDashboard(dashboardData);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar garagens', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return garages;
    return garages.filter(g =>
      g.name?.toLowerCase().includes(q) ||
      g.responsibleName?.toLowerCase().includes(q) ||
      g.address?.toLowerCase().includes(q)
    );
  }, [garages, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', address: '', responsibleEmployeeId: '', responsibleName: '', responsiblePhone: '', capacity: undefined, notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (garage: Garage) => {
    setEditingId(garage.id);
    setForm({
      name: garage.name || '',
      address: garage.address || '',
      responsibleEmployeeId: garage.responsibleEmployeeId || '',
      responsibleName: garage.responsibleName || '',
      responsiblePhone: garage.responsiblePhone || '',
      capacity: garage.capacity,
      notes: garage.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome da garagem', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: GarageInput = {
        ...form,
        name: form.name.trim(),
        responsibleEmployeeId: form.responsibleEmployeeId || undefined,
        responsibleName: form.responsibleName?.trim() || undefined,
        responsiblePhone: form.responsiblePhone?.trim() || undefined,
      };
      if (editingId) {
        await garageService.update(editingId, payload);
        toast({ title: 'Sucesso', description: 'Garagem atualizada' });
      } else {
        await garageService.create(payload);
        toast({ title: 'Sucesso', description: 'Garagem cadastrada' });
      }
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao salvar garagem', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await garageService.delete(deleteId);
      toast({ title: 'Sucesso', description: 'Garagem desativada' });
      loadData();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao desativar garagem', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  const openVehicles = async (garage: Garage) => {
    try {
      const fresh = await garageService.getById(garage.id);
      setSelectedGarage(fresh);
      setVehicleToAssign('');
      setVehiclesDialogOpen(true);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar veículos da garagem', variant: 'destructive' });
    }
  };

  const handleAssign = async () => {
    if (!selectedGarage || !vehicleToAssign) return;
    try {
      const updated = await garageService.assignVehicle(selectedGarage.id, vehicleToAssign);
      setSelectedGarage(updated);
      setVehicleToAssign('');
      toast({ title: 'Sucesso', description: 'Veículo alocado na garagem' });
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao alocar veículo';
      toast({ title: 'Não foi possível alocar', description: msg, variant: 'destructive' });
    }
  };

  const handleUnassign = async (vehicleId: string) => {
    if (!selectedGarage) return;
    try {
      const updated = await garageService.unassignVehicle(selectedGarage.id, vehicleId);
      setSelectedGarage(updated);
      toast({ title: 'Sucesso', description: 'Veículo removido da garagem' });
      loadData();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao remover veículo', variant: 'destructive' });
    }
  };

  const openTransfer = (vehicleId: string) => {
    setTransferVehicleId(vehicleId);
    setTransferToGarageId('');
    setTransferReason('REMANEJAMENTO');
    setTransferDetail('');
    setTransferDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferVehicleId || !transferToGarageId) return;
    setTransferSaving(true);
    try {
      const payload: GarageTransferInput = {
        vehicleId: transferVehicleId,
        toGarageId: transferToGarageId,
        reason: transferReason,
        reasonDetail: transferDetail.trim() || undefined,
      };
      const movement = await garageService.transferVehicle(payload);
      setTransferDialogOpen(false);
      toast({
        title: 'Remanejamento concluído',
        description: `${movement.vehiclePlate} → ${movement.toGarageName}`,
      });
      loadData();
      if (selectedGarage) {
        const fresh = await garageService.getById(selectedGarage.id);
        setSelectedGarage(fresh);
      }
    } catch (error: any) {
      toast({
        title: 'Não foi possível remanejar',
        description: error.response?.data?.message || 'Erro ao remanejar veículo',
        variant: 'destructive',
      });
    } finally {
      setTransferSaving(false);
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setMovementsLoading(true);
    try {
      const data = await garageService.listMovements(0, 50);
      setMovements(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar histórico', variant: 'destructive' });
    } finally {
      setMovementsLoading(false);
    }
  };

  const occupancyPercent = (g: Garage) => {
    if (!g.capacity || g.capacity <= 0) return null;
    return Math.min(100, Math.round(((g.vehicleCount || 0) / g.capacity) * 100));
  };

  return (
    <StandardLayout title="Gestão de Garagens" subtitle="Cadastro de garagens com responsável e controle de veículos por pátio">
      <div className="p-6">
        {/* Filtros + Ações */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar garagem ou responsável..."
              className="pl-9 bg-seguranca-graphite border-gray-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={openHistory}
            className="border-gray-600 text-gray-300 hover:text-white"
          >
            <History size={16} className="mr-1" /> Histórico
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="bg-seguranca-yellow text-black hover:bg-yellow-500 ml-auto">
                <Plus size={18} className="mr-1" /> Nova Garagem
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Warehouse size={18} className="text-seguranca-yellow" />
                  {editingId ? 'Editar Garagem' : 'Nova Garagem'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nome da Garagem *</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Ex.: Garagem Central"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Endereço</label>
                  <Input
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Endereço do pátio/base"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Responsável</label>
                  <Select
                    value={form.responsibleEmployeeId || ''}
                    onValueChange={(v) => {
                      setForm({ ...form, responsibleEmployeeId: v });
                      const emp = employees.find(e => e.id === v);
                      setForm(prev => ({
                        ...prev,
                        responsibleEmployeeId: v,
                        responsibleName: emp?.name || prev.responsibleName,
                        responsiblePhone: emp?.phone || prev.responsiblePhone,
                      }));
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                      <SelectValue placeholder="Selecione o responsável pela garagem" />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                      {employees.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Cada garagem deve ter um responsável designado.
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Contato do Responsável</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      value={form.responsiblePhone || ''}
                      onChange={e => setForm({ ...form, responsiblePhone: e.target.value })}
                      className="pl-9 bg-seguranca-black border-gray-700 text-white"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Capacidade (vagas)</label>
                  <Input
                    type="number"
                    min={0}
                    value={form.capacity ?? ''}
                    onChange={e => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Ex.: 50"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Observações</label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="bg-seguranca-black border-gray-700 text-white"
                    rows={2}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500">
                  {saving ? <Loader2 size={18} className="animate-spin mr-1" /> : <Plus size={18} className="mr-1" />}
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Garagem'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard de Ocupação */}
        {dashboard && dashboard.totalGarages > 0 && (
          <div className="space-y-3 mb-6">
            {/* Alertas de lotação */}
            {(dashboard.fullGarages > 0 || dashboard.nearCapacityGarages > 0) && (
              <div className="space-y-2">
                {dashboard.garages.filter(g => g.atCapacity).map(g => (
                  <div key={`full-${g.id}`} className="flex items-center gap-2 bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-sm">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                    <span className="text-red-300 font-semibold">🚨 Garagem lotada:</span>
                    <span className="text-red-200">
                      {g.name} — {g.vehicleCount}/{g.capacity} vagas. Novas alocações exigem remanejamento.
                    </span>
                  </div>
                ))}
                {dashboard.garages.filter(g => g.nearCapacity && !g.atCapacity).map(g => (
                  <div key={`near-${g.id}`} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/40 rounded-lg p-3 text-sm">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0" />
                    <span className="text-amber-300 font-semibold">⚠️ Atenção:</span>
                    <span className="text-amber-200">
                      {g.name} está com {g.occupancyRate}% da capacidade ({g.vehicleCount}/{g.capacity} vagas).
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-seguranca-graphite border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                  <Gauge size={14} /> Ocupação Geral
                </div>
                <p className={`text-2xl font-bold mt-1 ${
                  (dashboard.overallOccupancy ?? 0) >= 90 ? 'text-red-400'
                  : (dashboard.overallOccupancy ?? 0) >= 70 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {dashboard.overallOccupancy != null ? `${dashboard.overallOccupancy}%` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.totalVehicles} veículos / {dashboard.totalCapacity} vagas
                </p>
                {dashboard.overallOccupancy != null && (
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        dashboard.overallOccupancy >= 90 ? 'bg-red-500'
                        : dashboard.overallOccupancy >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, dashboard.overallOccupancy)}%` }}
                    />
                  </div>
                )}
              </Card>
              <Card className="bg-seguranca-graphite border-gray-700 p-4">
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                  <Warehouse size={14} /> Garagens
                </div>
                <p className="text-2xl font-bold text-white mt-1">{dashboard.totalGarages}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.garagesWithCapacity} com capacidade definida
                </p>
              </Card>
              <Card className={`p-4 border ${dashboard.fullGarages > 0 ? 'bg-red-500/10 border-red-500/40' : 'bg-seguranca-graphite border-gray-700'}`}>
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                  <AlertTriangle size={14} className={dashboard.fullGarages > 0 ? 'text-red-400' : ''} /> Lotação
                </div>
                <p className={`text-2xl font-bold mt-1 ${dashboard.fullGarages > 0 ? 'text-red-400' : 'text-white'}`}>
                  {dashboard.fullGarages}
                </p>
                <p className="text-xs text-gray-500 mt-1">garagem(ns) lotada(s)</p>
              </Card>
              <Card className={`p-4 border ${dashboard.nearCapacityGarages > 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-seguranca-graphite border-gray-700'}`}>
                <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wide">
                  <AlertTriangle size={14} className={dashboard.nearCapacityGarages > 0 ? 'text-amber-400' : ''} /> Em Atenção
                </div>
                <p className={`text-2xl font-bold mt-1 ${dashboard.nearCapacityGarages > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {dashboard.nearCapacityGarages}
                </p>
                <p className="text-xs text-gray-500 mt-1">≥ 90% da capacidade</p>
              </Card>
            </div>
          </div>
        )}

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-seguranca-yellow animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Warehouse className="mx-auto mb-2" size={36} />
            <p>Nenhuma garagem cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(garage => {
              const occ = occupancyPercent(garage);
              return (
                <Card key={garage.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0">
                        <Warehouse className="text-seguranca-yellow" size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{garage.name}</p>
                        {garage.address && (
                          <p className="text-gray-400 text-xs truncate flex items-center gap-1">
                            <MapPin size={10} /> {garage.address}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(garage)} className="text-gray-500 hover:text-seguranca-yellow transition-colors p-1" title="Editar">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(garage.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1" title="Desativar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                    {garage.responsibleName && (
                      <p className="flex items-center gap-1"><User size={12} className="text-seguranca-yellow" /> Resp.: {garage.responsibleName}</p>
                    )}
                    {garage.responsiblePhone && (
                      <p className="flex items-center gap-1"><Phone size={12} /> {garage.responsiblePhone}</p>
                    )}
                    <p className="flex items-center gap-1">
                      <Bus size={12} /> {garage.vehicleCount ?? 0} veículo(s)
                      {garage.capacity ? ` de ${garage.capacity} vagas` : ''}
                    </p>
                    {occ != null && (
                      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                        <div
                          className={`h-1.5 rounded-full ${occ >= 90 ? 'bg-red-500' : occ >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${occ}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => openVehicles(garage)}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-300 hover:text-white"
                  >
                    <Users size={15} className="mr-1" /> Ver veículos ({garage.vehicleCount ?? 0})
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Diálogo de veículos da garagem */}
        <Dialog open={vehiclesDialogOpen} onOpenChange={setVehiclesDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 size={18} className="text-seguranca-yellow" />
                Veículos — {selectedGarage?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Select value={vehicleToAssign} onValueChange={setVehicleToAssign}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white flex-1">
                    <SelectValue placeholder="Selecione um veículo para alocar" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} {v.model ? `- ${v.model}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAssign} disabled={!vehicleToAssign} className="bg-seguranca-yellow text-black hover:bg-yellow-500">
                  <Plus size={16} className="mr-1" /> Alocar
                </Button>
              </div>

              {(!selectedGarage?.vehicles || selectedGarage.vehicles.length === 0) ? (
                <p className="text-center text-gray-500 py-6 text-sm">Nenhum veículo alocado nesta garagem</p>
              ) : (
                <div className="space-y-2">
                  {selectedGarage.vehicles.map(v => (
                    <div key={v.id} className="flex items-center gap-3 bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="w-9 h-9 rounded-lg bg-seguranca-yellow/10 flex items-center justify-center flex-shrink-0">
                        <Bus className="text-seguranca-yellow" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{v.plate}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {[v.brand, v.model].filter(Boolean).join(' ')}
                          {v.currentMileage != null ? ` — ${v.currentMileage.toLocaleString('pt-BR')} km` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => openTransfer(v.id)}
                        className="text-gray-400 hover:text-seguranca-yellow transition-colors p-1"
                        title="Remanejar para outra garagem"
                      >
                        <ArrowLeftRight size={15} />
                      </button>
                      <button
                        onClick={() => handleUnassign(v.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors p-1"
                        title="Remover da garagem"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Diálogo de remanejamento */}
        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-seguranca-yellow" /> Remanejar Veículo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Garagem de Destino *</label>
                <Select value={transferToGarageId} onValueChange={setTransferToGarageId}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue placeholder="Selecione a garagem de destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {garages
                      .filter(g => g.active !== false && g.id !== selectedGarage?.id)
                      .map(g => (
                        <SelectItem key={g.id} value={g.id} disabled={g.atCapacity}>
                          {g.name}
                          {g.capacity ? ` (${g.vehicleCount ?? 0}/${g.capacity})` : ''}
                          {g.atCapacity ? ' 🚨 LOTADA' : g.nearCapacity ? ' ⚠️' : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Motivo</label>
                <Select value={transferReason} onValueChange={setTransferReason}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {Object.entries(MOVEMENT_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Detalhe (opcional)</label>
                <Textarea
                  value={transferDetail}
                  onChange={e => setTransferDetail(e.target.value)}
                  className="bg-seguranca-black border-gray-700 text-white"
                  rows={2}
                  placeholder="Ex.: remanejamento por escala do cliente X"
                />
              </div>
              <Button
                onClick={handleTransfer}
                disabled={transferSaving || !transferToGarageId}
                className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500"
              >
                {transferSaving ? <Loader2 size={16} className="animate-spin mr-1" /> : <ArrowLeftRight size={16} className="mr-1" />}
                Confirmar remanejamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Histórico de movimentações */}
        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History size={18} className="text-seguranca-yellow" /> Histórico de Movimentações
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {movementsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 text-seguranca-yellow animate-spin" />
                </div>
              ) : movements.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-2">
                  {movements.map(m => (
                    <div key={m.id} className="bg-seguranca-black/50 rounded-lg p-3 border border-gray-700/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Bus size={14} className="text-seguranca-yellow flex-shrink-0" />
                        <span className="text-white font-medium">{m.vehiclePlate || '—'}</span>
                        <span className="text-gray-400 flex items-center gap-1 min-w-0">
                          {m.fromGarageName || 'Entrada'} <ArrowRight size={12} className="flex-shrink-0" /> {m.toGarageName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span>{MOVEMENT_REASON_LABELS[m.reason || ''] || m.reason || '—'}</span>
                        {m.performedByName && <span>por {m.performedByName}</span>}
                        {m.createdAt && <span>{new Date(m.createdAt).toLocaleString('pt-BR')}</span>}
                        {m.kmReading != null && <span>{m.kmReading.toLocaleString('pt-BR')} km</span>}
                      </div>
                      {m.reasonDetail && <p className="text-xs text-gray-400 mt-1">{m.reasonDetail}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmação de desativação */}
        <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-seguranca-graphite border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar garagem?</AlertDialogTitle>
              <AlertDialogDescription>
                A garagem será desativada e não aparecerá mais nas seleções. O histórico é preservado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-500 text-white">
                Desativar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </StandardLayout>
  );
};

export default Garagens;
