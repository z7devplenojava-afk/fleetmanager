import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import fleetWorkOrderService, {
  WorkOrderStatus, MaintenanceType, FleetWorkOrder,
} from '@/services/fleetWorkOrderService';
import { generateFleetWorkOrderPDFBlob } from '@/utils/fleetWorkOrderPDFGenerator';
import {
  Search, RefreshCw, MoreHorizontal, Eye, Pencil, Trash2, FileText, Copy, Package,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; color: string }> = {
  [WorkOrderStatus.OPEN]: { label: 'Aberta', color: 'bg-blue-600 text-white' },
  [WorkOrderStatus.DRAFT]: { label: 'Rascunho', color: 'bg-gray-500 text-white' },
  [WorkOrderStatus.PENDING_APPROVAL]: { label: 'Aguardando Aprovação', color: 'bg-yellow-500 text-black' },
  [WorkOrderStatus.APPROVED]: { label: 'Aprovada', color: 'bg-blue-500 text-white' },
  [WorkOrderStatus.IN_PROGRESS]: { label: 'Em Andamento', color: 'bg-orange-500 text-white' },
  [WorkOrderStatus.WAITING_PARTS]: { label: 'Aguardando Peça', color: 'bg-purple-600 text-white' },
  [WorkOrderStatus.COMPLETED]: { label: 'Concluída', color: 'bg-green-600 text-white' },
  [WorkOrderStatus.CANCELLED]: { label: 'Cancelada', color: 'bg-red-600 text-white' },
};

interface OrdensServicoTableProps {
  onRefresh?: () => void;
}

const OrdensServicoTable: React.FC<OrdensServicoTableProps> = ({ onRefresh }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<FleetWorkOrder | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['fleet-work-orders'],
    queryFn: () => fleetWorkOrderService.findAll(),
    retry: 2,
  });

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return orders.filter(o => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && o.maintenanceType !== typeFilter) return false;
      if (term) {
        const hay = [
          o.osNumber, o.vehiclePlate, o.vehicleModel, o.mechanicName, o.clientName,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  const handleGeneratePDF = async (order: FleetWorkOrder) => {
    setGeneratingPdfId(order.id);
    try {
      const blob = await generateFleetWorkOrderPDFBlob(order);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar PDF da O.S.', variant: 'destructive' });
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const handleDuplicate = async (order: FleetWorkOrder) => {
    try {
      await fleetWorkOrderService.duplicate(order.id);
      toast({ title: 'OS Duplicada', description: 'Nova OS criada com sucesso.' });
      queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
      onRefresh?.();
    } catch {
      toast({ title: 'Erro', description: 'Falha ao duplicar OS.', variant: 'destructive' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await fleetWorkOrderService.delete(orderToDelete.id);
      toast({ title: 'Sucesso', description: `OS ${orderToDelete.osNumber || ''} excluída com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] });
      onRefresh?.();
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Falha ao excluir OS.';
      toast({ title: 'Erro', description: msg, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-seguranca-graphite p-3 rounded-lg border border-gray-700">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por OS, placa, modelo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-seguranca-black border-gray-600 text-sm h-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs h-9 w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-600">
              <SelectItem value="ALL">Todos os status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={v => setTypeFilter(v)}>
            <SelectTrigger className="bg-seguranca-black border-gray-600 text-xs h-9 w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-600">
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              {Object.values(MaintenanceType).map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-400 hover:bg-gray-700"
          onClick={() => refetch()}
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-graphite border-gray-700 hover:bg-transparent">
              <TableHead className="text-zinc-400 text-xs py-3">Nº OS</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Tipo</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Status</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Veículo</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Cliente / Setor</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Parada</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3 text-right">Odômetro</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3">Mecânico</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3 text-right">Custo Total</TableHead>
              <TableHead className="text-zinc-400 text-xs py-3 text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-8 text-center text-gray-400">
                  {isLoading ? 'Carregando ordens de serviço...' : 'Nenhuma ordem de serviço encontrada.'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(order => (
                <TableRow key={order.id} className="border-zinc-800/60 hover:bg-zinc-800/40 transition-colors">
                  <TableCell className="font-bold text-seguranca-lightgray text-xs">
                    {order.osNumber || `OS-${order.id.slice(0, 8)}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${order.maintenanceType === MaintenanceType.PREVENTIVA ? 'border-green-500 text-green-400' : 'border-orange-500 text-orange-400'}`}
                    >
                      {order.maintenanceType || 'CORRETIVA'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px]`}>
                      {STATUS_CONFIG[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-gray-200 text-xs">{order.vehiclePlate || 'N/A'}</div>
                    <div className="text-[11px] text-gray-400">{order.vehicleModel}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-200 text-xs">{order.clientName || '—'}</div>
                    {order.workPostName && <div className="text-[11px] text-gray-400">{order.workPostName}</div>}
                  </TableCell>
                  <TableCell className="text-gray-300 text-xs">
                    {order.stopDate ? new Date(order.stopDate + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    {order.stopTime && <span className="text-gray-500 ml-1">({order.stopTime})</span>}
                  </TableCell>
                  <TableCell className="text-gray-300 text-xs font-mono text-right">
                    {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : '—'}
                  </TableCell>
                  <TableCell className="text-gray-300 text-xs">
                    {order.mechanicName || 'Não atribuído'}
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-seguranca-lightgray text-xs">
                    {(order.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGeneratePDF(order)}
                        disabled={generatingPdfId === order.id}
                        title="Imprimir PDF da OS"
                        className="border-red-500/60 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-7 px-2 text-[10px]"
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        PDF
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="hover:bg-gray-700 h-7 w-7 p-0" title="Mais ações">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 text-gray-200">
                          <DropdownMenuItem onClick={() => handleGeneratePDF(order)}>
                            <Eye className="mr-2 h-4 w-4" /> Visualizar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(order)}>
                            <Copy className="mr-2 h-4 w-4" /> Duplicar OS
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setOrderToDelete(order)}
                            className="text-red-400 focus:text-red-300"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Resumo */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          {filtered.length} de {orders.length} ordem(ns) de serviço
        </span>
        <span className="font-mono font-bold text-seguranca-lightgray">
          Custo total: {(filtered.reduce((acc, o) => acc + (o.totalCost || 0), 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>

      {/* Confirmação de exclusão */}
      <AlertDialog open={!!orderToDelete} onOpenChange={open => !open && setOrderToDelete(null)}>
        <AlertDialogContent className="bg-seguranca-graphite border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Ordem de Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a OS{' '}
              <strong className="text-seguranca-lightgray">
                {orderToDelete?.osNumber || orderToDelete?.id.slice(0, 8)}
              </strong>{' '}
              do veículo <strong className="text-seguranca-lightgray">{orderToDelete?.vehiclePlate || 'N/A'}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => { e.preventDefault(); handleConfirmDelete(); }}
              disabled={isDeleting}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white"
            >
              {isDeleting ? <Package className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdensServicoTable;
