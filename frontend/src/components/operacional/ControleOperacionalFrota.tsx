import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bus, CalendarClock, Clock3, MapPin, Search, Settings2, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import fleetService from '@/services/fleetService';
import { scheduleService, Schedule } from '@/services/scheduleService';
import clientService, { Client } from '@/services/clientService';
import bilifluxService from '@/services/bilifluxService';
import { Vehicle } from '@/types/fleet';
import fleetWorkOrderService, { FleetWorkOrder, MaintenanceType, WorkOrderPriority, WorkOrderStatus } from '@/services/fleetWorkOrderService';
import FleetWorkOrderForm from '@/components/frota/FleetWorkOrderForm';

type HistoryEvent = { id: string; eventDate: string; eventType: string; description: string; responsibleName?: string };
type ActionMode = 'movement' | 'maintenance' | null;

const statusLabels: Record<string, string> = {
  ACTIVE: 'Operacional', INACTIVE: 'Inativo', MAINTENANCE: 'Em manutenção', BLOCKED: 'Bloqueado',
  SOLD: 'Vendido', BAIXADO: 'Baixado', LEASED: 'Locado', OUT_OF_SERVICE: 'Fora de operação', RESERVED: 'Reserva',
};
const statusColors: Record<string, string> = {
  ACTIVE: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  MAINTENANCE: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  BLOCKED: 'border-red-400/30 bg-red-400/10 text-red-300',
  OUT_OF_SERVICE: 'border-red-400/30 bg-red-400/10 text-red-300',
};

const ControleOperacionalFrota: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const responsibleName = (user as any)?.fullName || (user as any)?.name || 'Usuário operacional';
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [saving, setSaving] = useState(false);
  const [destinationClientId, setDestinationClientId] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [movementStatus, setMovementStatus] = useState('ACTIVE');
  const [driverName, setDriverName] = useState('');
  const [reason, setReason] = useState('');
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantBusy, setAssistantBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fleetService.getVehicles(true), clientService.getAllClients(), scheduleService.findAll(), fleetWorkOrderService.findAll(),
      ]);
      const [vehicleResult, clientResult, scheduleResult, orderResult] = results;
      setVehicles(vehicleResult.status === 'fulfilled' ? vehicleResult.value || [] : []);
      setClients(clientResult.status === 'fulfilled' ? clientResult.value || [] : []);
      setSchedules(scheduleResult.status === 'fulfilled' && Array.isArray(scheduleResult.value) ? scheduleResult.value : []);
      setWorkOrders(orderResult.status === 'fulfilled' && Array.isArray(orderResult.value) ? orderResult.value : []);
      if (vehicleResult.status === 'rejected') toast({ title: 'Não foi possível carregar os veículos', description: 'Confira o acesso à frota e tente atualizar novamente.', variant: 'destructive' });
    } catch {
      toast({ title: 'Falha ao carregar o quadro', description: 'Confira a conexão e tente atualizar novamente.', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!selected) { setHistory([]); return; }
    api.get<HistoryEvent[]>(`/api/vehicle-operations/${selected.id}/history`)
      .then(({ data }) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [selected]);

  const latestScheduleByVehicle = useMemo(() => {
    const result = new Map<string, Schedule>();
    [...schedules].filter((schedule) => schedule.scheduleDate <= new Date().toISOString().slice(0, 10)).sort((a, b) => new Date(b.scheduleDate).getTime() - new Date(a.scheduleDate).getTime())
      .forEach((schedule) => { if (schedule.vehicleId && !result.has(schedule.vehicleId)) result.set(schedule.vehicleId, schedule); });
    return result;
  }, [schedules]);
  const latestOrderByVehicle = useMemo(() => {
    const result = new Map<string, FleetWorkOrder>();
    [...workOrders].sort((a, b) => new Date(b.createdAt || b.plannedDate).getTime() - new Date(a.createdAt || a.plannedDate).getTime())
      .forEach((item) => { if (!result.has(item.vehicleId)) result.set(item.vehicleId, item); });
    return result;
  }, [workOrders]);
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term || [vehicle.plate, vehicle.fleetNumber, vehicle.model, vehicle.brand, vehicle.clientName, vehicle.location, vehicle.assignedDriver]
      .some((value) => String(value || '').toLowerCase().includes(term));
    const matchesClient = clientFilter === 'all' || vehicle.clientId === clientFilter || (!vehicle.clientId && vehicle.clientName === clients.find((client) => client.id === clientFilter)?.name);
    return matchesTerm && matchesClient;
  }), [vehicles, search, clientFilter, clients]);
  const groupedVehicles = useMemo(() => filteredVehicles.reduce<Record<string, Vehicle[]>>((groups, vehicle) => {
    const key = vehicle.clientName || 'Sem cliente / garagem';
    (groups[key] ||= []).push(vehicle);
    return groups;
  }, {}), [filteredVehicles]);

  const vehicleSchedule = selected ? latestScheduleByVehicle.get(selected.id) : undefined;
  const vehicleOrder = selected ? latestOrderByVehicle.get(selected.id) : undefined;
  const openAction = (vehicle: Vehicle, mode: Exclude<ActionMode, null>) => {
    setSelected(vehicle); setActionMode(mode); setDestinationClientId(vehicle.clientId || '');
    setDestinationLocation(vehicle.location || ''); setMovementStatus(vehicle.status || 'ACTIVE');
    setDriverName(vehicle.assignedDriver || ''); setReason('');
  };
  const submitAction = async (event: React.FormEvent) => {
    event.preventDefault(); if (!selected || !actionMode) return;
    setSaving(true);
    try {
      if (actionMode === 'movement') {
        const client = clients.find((item) => item.id === destinationClientId);
        await api.post(`/api/vehicle-operations/${selected.id}/movements`, {
          destinationClientId: destinationClientId || null, destinationClientName: client?.name || 'Sem cliente / garagem',
          destinationLocation, status: movementStatus, driverName, reason, responsibleName,
        });
        toast({ title: 'Movimentação registrada', description: `O histórico de ${selected.plate} foi atualizado.` });
      }
      setActionMode(null); setSelected(null); await load();
    } catch (error: any) {
      toast({ title: 'Não foi possível salvar', description: error?.response?.data?.message || error.message || 'Tente novamente.', variant: 'destructive' });
    } finally { setSaving(false); }
  };
  const askAssistant = async (event: React.FormEvent) => {
    event.preventDefault(); if (!question.trim()) return;
    setAssistantBusy(true); setAssistantReply('');
    const fleetContext = vehicles.slice(0, 150).map((vehicle) => { const order = latestOrderByVehicle.get(vehicle.id); return `${vehicle.plate}: cliente ${vehicle.clientName || 'sem cliente'}, local ${vehicle.location || 'não informado'}, estado ${statusLabels[vehicle.status] || vehicle.status}, motorista ${latestScheduleByVehicle.get(vehicle.id)?.employee?.name || vehicle.assignedDriver || 'não informado'}, última OS ${order?.osNumber || order?.anomaliesDescription || order?.otherDescription || 'sem registro'} (${order?.status || '—'})`; }).join('\n');
    try {
      const result = await bilifluxService.chat({ message: `Você é o Assistente de Operações da frota. Use os dados abaixo para orientar o operador. Não afirme que executou movimentações; destaque quando houver dados ausentes.\nFROTA:\n${fleetContext}\n\nPERGUNTA: ${question}`, userName: 'Operação' });
      setAssistantReply(result.reply || 'Não consegui gerar uma orientação agora.');
    } catch { setAssistantReply('O assistente está indisponível neste momento.'); }
    finally { setAssistantBusy(false); }
  };

  const schoolVehicle = (vehicle: Vehicle) => vehicle.busType === 'ESCOLA' || String(vehicle.vehicleType || '').toLowerCase().includes('escol');
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Centro de controle</p><h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Operação e movimentação de veículos</h2><p className="mt-1 text-sm text-slate-400">Localização por cliente, remanejamentos, manutenção e linha do tempo.</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={loading}>Atualizar quadro</Button><Button onClick={() => setAssistantOpen(true)} className="bg-indigo-600 text-white hover:bg-indigo-500"><Sparkles className="mr-2 h-4 w-4"/>Assistente IA</Button></div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Veículos', vehicles.length], ['Operacionais', vehicles.filter(v => v.status === 'ACTIVE').length], ['Em manutenção', vehicles.filter(v => v.status === 'MAINTENANCE').length], ['Escolares', vehicles.filter(schoolVehicle).length]].map(([label, value]) => <Card key={label} className="border-slate-700 bg-slate-900"><CardContent className="p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-2xl font-bold text-white">{value}</p></CardContent></Card>)}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar placa, cliente, local ou motorista" className="border-slate-700 bg-slate-900 pl-9 text-white"/></div><Select value={clientFilter} onValueChange={setClientFilter}><SelectTrigger className="w-full border-slate-700 bg-slate-900 text-white sm:w-64"><SelectValue placeholder="Todos os clientes"/></SelectTrigger><SelectContent><SelectItem value="all">Todos os clientes</SelectItem>{clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div>
      {loading ? <div className="rounded-xl border border-slate-700 p-10 text-center text-slate-400">Carregando frota e escalas…</div> : filteredVehicles.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">Nenhum veículo encontrado para os filtros selecionados.</div> : Object.entries(groupedVehicles).map(([clientName, group]) => <section key={clientName} className="space-y-3"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-semibold text-white"><MapPin className="h-4 w-4 text-red-300"/>{clientName}</h3><Badge variant="outline" className="border-slate-700 text-slate-300">{group.length} veículos</Badge></div><div className="grid gap-3 xl:grid-cols-2">{group.map(vehicle => { const schedule = latestScheduleByVehicle.get(vehicle.id); const order = latestOrderByVehicle.get(vehicle.id); return <Card key={vehicle.id} className="border-slate-700 bg-slate-900/80"><CardContent className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><button onClick={() => setSelected(vehicle)} className="min-w-0 text-left"><div className="flex items-center gap-2"><Bus className="h-4 w-4 text-slate-400"/><span className="font-bold text-white">{vehicle.plate}</span>{schoolVehicle(vehicle) && <Badge className="bg-sky-500/15 text-sky-300">Escolar</Badge>}</div><p className="mt-1 truncate text-sm text-slate-400">{vehicle.brand} {vehicle.model} {vehicle.fleetNumber ? `· Frota ${vehicle.fleetNumber}` : ''}</p></button><Badge variant="outline" className={statusColors[vehicle.status] || 'border-slate-600 text-slate-300'}>{statusLabels[vehicle.status] || vehicle.status}</Badge></div><div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2"><p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-500"/>{vehicle.location || 'Local não informado'}</p><p className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5 text-slate-500"/>Motorista: {schedule?.employee?.name || vehicle.assignedDriver || 'Sem escala recente'}</p><p className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-slate-500"/>Escala: {schedule ? `${schedule.scheduleDate} ${schedule.startTime || ''}–${schedule.endTime || ''}` : 'Sem escala'}</p><p className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5 text-slate-500"/>Última OS: {order?.osNumber || order?.anomaliesDescription || order?.otherDescription || 'Sem OS registrada'}</p></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setSelected(vehicle)}>Detalhes e histórico</Button><Button size="sm" onClick={() => openAction(vehicle, 'movement')}><Settings2 className="mr-1.5 h-3.5 w-3.5"/>Remanejar</Button><Button size="sm" variant="outline" onClick={() => openAction(vehicle, 'maintenance')}><Wrench className="mr-1.5 h-3.5 w-3.5"/>Abrir OS</Button></div></CardContent></Card>; })}</div></section>)}

      <Dialog open={!!selected && !actionMode} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto border-slate-700 bg-slate-950 text-white sm:max-w-xl"><DialogHeader><DialogTitle>Histórico do veículo {selected?.plate}</DialogTitle><DialogDescription className="text-slate-400">Dados operacionais recentes e movimentações registradas.</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="grid gap-2 rounded-xl bg-slate-900 p-4 text-sm sm:grid-cols-2"><p>Cliente: {selected.clientName || 'Sem cliente'}</p><p>Local: {selected.location || 'Não informado'}</p><p>Status: {statusLabels[selected.status] || selected.status}</p><p>Último motorista: {vehicleSchedule?.employee?.name || selected.assignedDriver || 'Não identificado'}</p><p>Escala: {vehicleSchedule ? `${vehicleSchedule.scheduleDate}, ${vehicleSchedule.startTime || ''}–${vehicleSchedule.endTime || ''}` : 'Sem escala'}</p><p>Última OS: {vehicleOrder?.osNumber || vehicleOrder?.anomaliesDescription || vehicleOrder?.otherDescription || 'Sem OS'}</p></div><h3 className="font-semibold">Linha do tempo</h3>{history.length ? history.map(item => <div key={item.id} className="border-l-2 border-red-500/60 pl-3"><p className="text-xs text-slate-500">{new Date(item.eventDate).toLocaleString('pt-BR')} · {item.eventType}</p><p className="text-sm text-slate-200">{item.description}</p><p className="text-xs text-slate-500">{item.responsibleName || 'Operação'}</p></div>) : <p className="text-sm text-slate-400">Ainda não há movimentações registradas para este veículo.</p>}</div>}</DialogContent></Dialog>
      <Dialog open={actionMode === 'movement'} onOpenChange={open => { if (!open) setActionMode(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto border-slate-700 bg-slate-950 text-white sm:max-w-lg"><DialogHeader><DialogTitle>Remanejar {selected?.plate}</DialogTitle><DialogDescription className="text-slate-400">A movimentação será registrada no histórico do veículo.</DialogDescription></DialogHeader><form onSubmit={submitAction} className="space-y-4"><div className="space-y-2"><Label>Cliente destino</Label><Select value={destinationClientId || 'none'} onValueChange={value => setDestinationClientId(value === 'none' ? '' : value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="none">Sem cliente / garagem</SelectItem>{clients.map(client => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Local / unidade de destino</Label><Input required value={destinationLocation} onChange={e => setDestinationLocation(e.target.value)} placeholder="Ex.: garagem, escola, unidade"/></div><div className="space-y-2"><Label>Status operacional</Label><Select value={movementStatus} onValueChange={setMovementStatus}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Motorista atual (opcional)</Label><Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Nome do motorista"/></div><div className="space-y-2"><Label>Motivo do remanejamento</Label><Textarea required value={reason} onChange={e => setReason(e.target.value)} placeholder="Informe motivo e detalhes da transferência"/></div><DialogFooter><Button type="button" variant="outline" onClick={() => setActionMode(null)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Registrar movimentação'}</Button></DialogFooter></form></DialogContent></Dialog>
      {selected && <FleetWorkOrderForm isOpen={actionMode === 'maintenance'} onClose={() => { setActionMode(null); setSelected(null); }} onSuccess={(savedOrder) => { setActionMode(null); setSelected(null); void (async () => { try { await fleetService.updateVehicle(selected.id, { status: 'MAINTENANCE' }); await api.post(`/api/vehicle-operations/${selected.id}/events`, { eventType: 'OS_ABERTA', description: `OS ${savedOrder?.osNumber || ''} aberta: ${savedOrder?.anomaliesDescription || savedOrder?.otherDescription || 'manutenção solicitada'}`, responsibleName }); await load(); } catch { toast({ title: 'OS criada; status do veículo não atualizado', description: 'Atualize o status operacional manualmente.', variant: 'destructive' }); } })(); }} initialVehicleId={selected.id} initialValues={{ vehicleId: selected.id, vehiclePlate: selected.plate, vehicleModel: selected.model, maintenanceType: MaintenanceType.CORRETIVA, status: WorkOrderStatus.OPEN, priority: WorkOrderPriority.MEDIUM, laborType: 'INTERNAL', plannedDate: new Date().toISOString().slice(0, 10), driverName: vehicleSchedule?.employee?.name || selected.assignedDriver }} />}
      <Dialog open={assistantOpen} onOpenChange={setAssistantOpen}><DialogContent className="border-slate-700 bg-slate-950 text-white sm:max-w-xl"><DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-indigo-300"/>Assistente de Operações</DialogTitle><DialogDescription className="text-slate-400">Pergunte sobre localização, disponibilidade, escalas ou manutenção da frota.</DialogDescription></DialogHeader><form onSubmit={askAssistant} className="space-y-3"><Textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ex.: Quais veículos estão em manutenção no cliente X?"/><Button type="submit" disabled={assistantBusy || !question.trim()}>{assistantBusy ? 'Analisando frota…' : 'Consultar assistente'}</Button></form>{assistantReply && <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 text-sm text-slate-200">{assistantReply}</div>}</DialogContent></Dialog>
    </div>
  );
};

export default ControleOperacionalFrota;
