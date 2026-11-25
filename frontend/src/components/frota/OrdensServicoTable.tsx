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
  WorkOrderStatus, MaintenanceType, FleetWorkOrder, getOrderResponsibleDisplay,
} from '@/services/fleetWorkOrderService';
import { generateFleetWorkOrderPDFBlob } from '@/utils/fleetWorkOrderPDFGenerator';
import {
  Search, RefreshCw, MoreHorizontal, Eye, Pencil, Trash2, FileText, Copy, Package,
} from 'lucide-react';
import { PartsProcurementHoverCard } from '@/components/frota/PartsProcurementHoverCard';
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

      {/* Tabela Mobile (Cards View) */}
      <div className="block md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-seguranca-graphite border border-gray-700 rounded-xl">
            {isLoading ? 'Carregando ordens de serviço...' : 'Nenhuma ordem de serviço encontrada.'}
          </div>
        ) : (
          filtered.map(order => (
            <div
              key={`mobile-os-${order.id}`}
              className="bg-seguranca-black border border-gray-700/80 hover:border-seguranca-yellow/50 rounded-xl p-3.5 space-y-3 shadow-md transition-all cursor-pointer"
              onClick={() => onEdit?.(order)}
            >
              {/* Header: OS number + Status + Tipo */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-white text-sm truncate">
                    {order.osNumber || `OS-${order.id.slice(0, 8)}`}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold shrink-0 ${
                      order.maintenanceType === MaintenanceType.PREVENTIVA
                        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50'
                        : 'bg-amber-950/40 text-amber-400 border-amber-500/50'
                    }`}
                  >
                    {order.maintenanceType || 'CORRETIVA'}
                  </Badge>
                </div>
                <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px] shrink-0`}>
                  {STATUS_CONFIG[order.status]?.label || order.status}
                </Badge>
              </div>

              {/* Informações do Veículo e Cliente */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Veículo</span>
                  <span className="font-semibold text-gray-100">{order.vehiclePlate || 'N/A'}</span>
                  {order.vehicleModel && <span className="text-gray-400 block text-[11px] truncate">{order.vehicleModel}</span>}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Cliente / Setor</span>
                  <span className="font-medium text-gray-200 truncate block">{order.clientName || '—'}</span>
                  {order.workPostName && <span className="text-gray-400 block text-[11px] truncate">{order.workPostName}</span>}
                </div>
              </div>

              {/* Detalhes operacionais: Parada, Odômetro, Mecânico, Custo */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-seguranca-graphite/40 p-2.5 rounded-lg border border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-400 block">Data Parada</span>
                  <span className="text-gray-200">
                    {order.stopDate ? new Date(order.stopDate + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Odômetro</span>
                  <span className="font-mono text-gray-200">
                    {order.odometerIn != null ? `${order.odometerIn.toLocaleString('pt-BR')} km` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Responsável</span>
                  <span className="text-gray-200 truncate block">{getOrderResponsibleDisplay(order)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block">Custo Total</span>
                  <span className="font-mono font-bold text-seguranca-yellow">
                    {(order.totalCost || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Ações Mobile com toque mínimo ergonômico */}
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-800/80" onClick={e => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGeneratePDF(order)}
                  disabled={generatingPdfId === order.id}
                  className="h-9 px-3 text-xs border-red-500/60 text-red-400 hover:bg-red-500/10 active:scale-95"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(order)}
                    className="h-9 px-3 text-xs border-blue-500/60 text-blue-400 hover:bg-blue-500/10 active:scale-95"
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-700 active:scale-95" title="Mais opções">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 text-gray-200">
                    <DropdownMenuItem onClick={() => handleGeneratePDF(order)}>
                      <Eye className="mr-2 h-4 w-4" /> Visualizar PDF
                    </DropdownMenuItem>
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(order)}>
                        <Copy className="mr-2 h-4 w-4" /> Duplicar OS
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirmOrder(order)}
                      className="text-red-400 hover:text-red-300 focus:text-red-300"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tabela Desktop */}
      <div className="hidden md:block rounded-lg border border-gray-700 overflow-hidden">
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
                      className={`text-[10px] font-bold ${
                        order.maintenanceType === MaintenanceType.PREVENTIVA
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/50'
                          : 'bg-amber-50 text-amber-800 border-amber-400 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-500/50'
                      }`}
                    >
                      {order.maintenanceType || 'CORRETIVA'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.status === WorkOrderStatus.WAITING_PARTS ? (
                      <PartsProcurementHoverCard workOrderId={order.id} osNumber={order.osNumber}>
                        <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px] cursor-pointer hover:opacity-90 transition-opacity`}>
                          {STATUS_CONFIG[order.status]?.label || order.status}
                        </Badge>
                      </PartsProcurementHoverCard>
                    ) : (
                      <Badge className={`${STATUS_CONFIG[order.status]?.color || 'bg-gray-600'} border-none font-bold text-[10px]`}>
                        {STATUS_CONFIG[order.status]?.label || order.status}
                      </Badge>
                    )}
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
                    {getOrderResponsibleDisplay(order)}
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
