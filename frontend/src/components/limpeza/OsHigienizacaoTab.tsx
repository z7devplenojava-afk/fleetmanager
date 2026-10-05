import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, Search, Loader2, Bus, Calendar, CheckCircle2, Clock, Sparkles, AlertTriangle, Printer
} from 'lucide-react';
import {
  vehicleCleaningService, VehicleCleaningOrder,
  CLEANING_TYPE_LABELS, PHASE_LABELS, PHASE_COLORS, isDelayed,
} from '@/services/vehicleCleaningService';
import { VehicleCleaningViewModal } from '@/components/limpeza/VehicleCleaningViewModal';
import { useToast } from '@/hooks/use-toast';

interface OsHigienizacaoTabProps { plateFilter?: string; }

const OsHigienizacaoTab: React.FC<OsHigienizacaoTabProps> = ({ plateFilter }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<VehicleCleaningOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(plateFilter || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<VehicleCleaningOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await vehicleCleaningService.list(statusFilter !== 'ALL' ? { status: statusFilter as any } : {});
      setOrders(data);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar OSs de higienização', variant: 'destructive' });
    } finally { setIsLoading(false); }
  }, [statusFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o =>
      o.vehiclePlate?.toLowerCase().includes(q) ||
      o.vehicleModel?.toLowerCase().includes(q) ||
      o.driverName?.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const openModal = (order: VehicleCleaningOrder) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const renderStatusBadge = (order: VehicleCleaningOrder) => {
    if (order.status === 'COMPLETED') return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Concluída</span>;
    if (isDelayed(order)) return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-red-500/20 text-red-400 border-red-500/30 inline-flex items-center gap-1"><AlertTriangle size={10} /> Atrasada</span>;
    const phase = order.phase || 'AGUARDANDO';
    return <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full border " + PHASE_COLORS[phase]}>{PHASE_LABELS[phase]}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar placa, motorista, número OS..." className="pl-9 bg-seguranca-graphite border-gray-700 text-white h-9 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white w-44 h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDING">Aguardando</SelectItem>
            <SelectItem value="IN_PROGRESS">Em andamento</SelectItem>
            <SelectItem value="COMPLETED">Concluídas</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={load} className="border-gray-700 text-gray-300 hover:text-white bg-seguranca-graphite h-9">
          <Loader2 size={14} className={"mr-1.5 " + (isLoading ? 'animate-spin' : '')} /> Atualizar
        </Button>
      </div>

      <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-seguranca-black/60 border-b border-gray-700">
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead className="text-gray-300 font-semibold text-xs">Nº OS / Placa</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Tipo de Serviço</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Motorista / Solicitante</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Data / Hora Parada</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Liberação</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs">Fase / Status</TableHead>
                <TableHead className="text-gray-300 font-semibold text-xs text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 size={28} className="animate-spin mx-auto text-seguranca-yellow" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400"><Sparkles size={28} className="mx-auto mb-2 text-gray-600" /><br/>Nenhuma OS de higienização encontrada.</TableCell></TableRow>
              ) : filtered.map(order => (
                <TableRow key={order.id} className="border-gray-800 hover:bg-seguranca-black/30">
                  <TableCell className="text-xs">
                    <span className="text-seguranca-yellow font-bold text-sm block">{order.vehiclePlate}</span>
                    <span className="text-gray-500 font-mono">OS #OS-HIG-{order.id.substring(0, 8).toUpperCase()}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-300 font-medium">
                    <span className="text-sky-400">{CLEANING_TYPE_LABELS[order.cleaningType] || order.cleaningType}</span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-300">
                    {order.driverName || order.requestedByName || <span className="text-gray-500 italic">Não informado</span>}
                    {order.requesterSector && <span className="block text-[10px] text-gray-500">{order.requesterSector}</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-gray-300 flex items-center gap-1"><Calendar size={11} className="text-gray-500" />
                      {order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    {order.status === 'COMPLETED' ? (
                      <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} />
                        {order.releasedAt ? new Date(order.releasedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Liberado'}
                      </span>
                    ) : order.releaseDeadline ? (
                      <span className="text-gray-400 flex items-center gap-1"><Clock size={12} />{new Date(order.releaseDeadline).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    ) : <span className="text-gray-600">-</span>}
                  </TableCell>
                  <TableCell className="text-xs">{renderStatusBadge(order)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => openModal(order)}
                      className="h-8 px-3 text-xs bg-red-600 hover:bg-red-700 text-white font-semibold gap-1.5 inline-flex items-center shadow-sm"
                    >
                      <FileText size={13} /> Visualizar OS
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-gray-500 flex items-center gap-1.5">
        <Bus size={12} /> {filtered.length} OS(s) encontrada(s). Clique em "Visualizar OS" para abrir o documento no padrão oficial da frota.
      </p>

      {/* Modal Padronizado de Visualização da OS de Higienização */}
      <VehicleCleaningViewModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
};

export default OsHigienizacaoTab;
