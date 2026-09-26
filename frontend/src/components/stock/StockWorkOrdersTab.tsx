import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  ShoppingCart, 
  Search, 
  Filter, 
  RefreshCw, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  FileText, 
  DollarSign, 
  Building2, 
  User, 
  Loader2,
  Calendar,
  Layers,
  ChevronRight,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import fleetWorkOrderService, { FleetWorkOrder } from '@/services/fleetWorkOrderService';
import { materialRequisitionService, MaterialRequisition } from '@/services/materialRequisitionService';

interface StockWorkOrdersTabProps {
  onGoToRequisitions?: () => void;
}

export const StockWorkOrdersTab: React.FC<StockWorkOrdersTabProps> = ({ onGoToRequisitions }) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [procurementFilter, setProcurementFilter] = useState('ALL');

  // Modal de Detalhes da OS
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<FleetWorkOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, reqsData] = await Promise.all([
        fleetWorkOrderService.findAll(),
        materialRequisitionService.getAll()
      ]);
      setWorkOrders(Array.isArray(ordersData) ? ordersData : []);
      setRequisitions(Array.isArray(reqsData) ? reqsData : []);
    } catch (error) {
      console.error('Erro ao carregar Ordens de Serviço no Almoxarifado:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as Ordens de Serviço da frota.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Mapeia requisições associadas a cada OS
  const requisitionsByWorkOrderId = useMemo(() => {
    const map = new Map<string, MaterialRequisition[]>();
    requisitions.forEach(req => {
      if (req.workOrderId) {
        const list = map.get(req.workOrderId) || [];
        list.push(req);
        map.set(req.workOrderId, list);
      }
    });
    return map;
  }, [requisitions]);

  // Estatísticas do Topo
  const stats = useMemo(() => {
    let totalOrders = workOrders.length;
    let pendingQuotes = 0;
    let quotesReceived = 0;
    let stockReserved = 0;

    requisitions.forEach(r => {
      if (r.status === 'WAITING_QUOTES') pendingQuotes++;
      if (r.status === 'QUOTES_RECEIVED') quotesReceived++;
      if (r.status === 'RESERVED_STOCK' || r.status === 'AVAILABLE_FOR_INSTALLATION') stockReserved++;
    });

    return { totalOrders, pendingQuotes, quotesReceived, stockReserved };
  }, [workOrders, requisitions]);

  // Filtro de Ordens de Serviço
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter(order => {
      const matchesSearch = 
        (order.osNumber && order.osNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.vehiclePlate && order.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.vehicleModel && order.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.mechanicName && order.mechanicName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;

      // Filtro de cotações/compras
      const orderReqs = requisitionsByWorkOrderId.get(order.id) || [];
      let matchesProcurement = true;
      if (procurementFilter === 'WITH_REQ') {
        matchesProcurement = orderReqs.length > 0;
      } else if (procurementFilter === 'WAITING_QUOTES') {
        matchesProcurement = orderReqs.some(r => r.status === 'WAITING_QUOTES');
      } else if (procurementFilter === 'IN_STOCK') {
        matchesProcurement = orderReqs.some(r => r.status === 'RESERVED_STOCK' || r.status === 'AVAILABLE_FOR_INSTALLATION');
      }

      return matchesSearch && matchesStatus && matchesProcurement;
    });
  }, [workOrders, requisitionsByWorkOrderId, searchTerm, statusFilter, procurementFilter]);

  const handleOpenDetail = (order: FleetWorkOrder) => {
    setSelectedWorkOrder(order);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Aberta</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30">Em Execução</Badge>;
      case 'WAITING_PARTS':
        return <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">Aguardando Peças</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Concluída</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-600 text-white font-bold animate-pulse">Urgente</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-600 text-white font-semibold">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-600/80 text-white">Média</Badge>;
      default:
        return <Badge className="bg-gray-600 text-gray-200">Baixa</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de OS e Cotações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Total de OS da Frota</p>
              <h3 className="text-2xl font-bold text-seguranca-lightgray mt-1">{stats.totalOrders}</h3>
              <p className="text-xs text-gray-500 mt-1">Ordens de serviço registradas</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <Wrench size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle size={14} /> Aguardando 3 Cotações
              </p>
              <h3 className="text-2xl font-bold text-amber-300 mt-1">{stats.pendingQuotes}</h3>
              <p className="text-xs text-gray-400 mt-1">Peças em falta na oficina</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <ShoppingCart size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-400 font-medium">Cotações Cadastradas</p>
              <h3 className="text-2xl font-bold text-blue-300 mt-1">{stats.quotesReceived}</h3>
              <p className="text-xs text-gray-400 mt-1">Prontas para aprovação do gestor</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
              <FileText size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-400 font-medium">Atendidas com Estoque</p>
              <h3 className="text-2xl font-bold text-emerald-300 mt-1">{stats.stockReserved}</h3>
              <p className="text-xs text-gray-400 mt-1">Peças reservadas ou instaladas</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="bg-seguranca-graphite border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por Nº da OS, Placa do Ônibus, Modelo ou Mecânico..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Status da OS" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  <SelectItem value="OPEN">Abertas</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="WAITING_PARTS">Aguardando Peças</SelectItem>
                  <SelectItem value="COMPLETED">Concluídas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={procurementFilter} onValueChange={setProcurementFilter}>
                <SelectTrigger className="w-[190px] bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Situação Peças" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="ALL">Todas as Peças</SelectItem>
                  <SelectItem value="WITH_REQ">Com Requisição de Peça</SelectItem>
                  <SelectItem value="WAITING_QUOTES">Precisa de 3 Cotações</SelectItem>
                  <SelectItem value="IN_STOCK">Atendido com Estoque</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
              >
                <RefreshCw size={16} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Ordens de Serviço e Vínculo com Compras */}
      <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden">
        <CardHeader className="bg-seguranca-black/50 border-b border-gray-700 py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-seguranca-lightgray flex items-center gap-2">
              <Wrench className="text-seguranca-yellow" size={18} />
              Ordens de Serviço da Frota & Demanda de Peças do Almoxarifado
            </CardTitle>
            <span className="text-xs text-gray-400">
              {filteredWorkOrders.length} OS encontrada(s)
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-2" />
              <p>Carregando Ordens de Serviço da oficina...</p>
            </div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="text-center p-12 text-gray-400">
              <Wrench size={40} className="mx-auto text-gray-600 mb-3" />
              <p className="font-semibold text-gray-300">Nenhuma Ordem de Serviço encontrada</p>
              <p className="text-sm mt-1">Verifique os filtros selecionados ou atualize a lista.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-seguranca-black/80 text-xs uppercase font-semibold text-gray-400 border-b border-gray-700">
                  <tr>
                    <th className="py-3 px-4">Nº OS / Prioridade</th>
                    <th className="py-3 px-4">Ônibus (Veículo)</th>
                    <th className="py-3 px-4">Tipo / Manutenção</th>
                    <th className="py-3 px-4">Mecânico / Garagem</th>
                    <th className="py-3 px-4">Status OS</th>
                    <th className="py-3 px-4">Peças Requisitadas & Cotações</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredWorkOrders.map(order => {
                    const orderReqs = requisitionsByWorkOrderId.get(order.id) || [];
                    const hasWaitingQuotes = orderReqs.some(r => r.status === 'WAITING_QUOTES');
                    const hasReservedStock = orderReqs.some(r => r.status === 'RESERVED_STOCK' || r.status === 'AVAILABLE_FOR_INSTALLATION');

                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-seguranca-black/40 transition-colors cursor-pointer"
                        onClick={() => handleOpenDetail(order)}
                      >
                        {/* Nº OS e Prioridade */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-white flex items-center gap-2">
                            {order.osNumber || 'Sem Nº'}
                          </div>
                          <div className="mt-1">
                            {getPriorityBadge(order.priority || 'NORMAL')}
                          </div>
                        </td>

                        {/* Veículo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-seguranca-yellow shrink-0" />
                            <div>
                              <span className="font-bold text-white tracking-wider">{order.vehiclePlate || 'S/ Placa'}</span>
                              <p className="text-xs text-gray-400 truncate max-w-[150px]">{order.vehicleModel || 'Ônibus'}</p>
                            </div>
                          </div>
                        </td>

                        {/* Tipo Manutenção */}
                        <td className="py-3 px-4">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-700/60 text-gray-300">
                            {order.maintenanceType === 'PREVENTIVE' ? 'Preventiva' :
                             order.maintenanceType === 'CORRECTIVE' ? 'Corretiva' :
                             order.maintenanceType === 'PREDICTIVE' ? 'Preditiva' : 'Manutenção'}
                          </span>
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {order.plannedDate ? new Date(order.plannedDate).toLocaleDateString('pt-BR') : 'Sem data'}
                          </p>
                        </td>

                        {/* Mecânico e Garagem */}
                        <td className="py-3 px-4">
                          <div className="text-xs flex items-center gap-1 text-gray-300">
                            <User size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{order.mechanicName || 'Mecânico não atribuído'}</span>
                          </div>
                          <div className="text-xs flex items-center gap-1 text-gray-400 mt-0.5">
                            <Building2 size={13} className="text-gray-500 shrink-0" />
                            <span className="truncate max-w-[140px]">{order.garageName || 'Almoxarifado Central'}</span>
                          </div>
                        </td>

                        {/* Status da OS */}
                        <td className="py-3 px-4">
                          {getStatusBadge(order.status || 'OPEN')}
                        </td>

                        {/* Requisições de Peças & Cotações */}
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          {orderReqs.length === 0 ? (
                            <span className="text-xs text-gray-500 italic">Nenhum material requisitado</span>
                          ) : (
                            <div className="space-y-1.5">
                              {orderReqs.map(req => (
                                <div key={req.id} className="flex items-center justify-between gap-2 p-1.5 rounded bg-seguranca-black/60 border border-gray-700 text-xs">
                                  <div className="truncate max-w-[200px]">
                                    <span className="font-semibold text-white">{req.itemName}</span>
                                    <span className="text-gray-400 ml-1">({req.quantity} {req.unit})</span>
                                  </div>
                                  <div>
                                    {req.status === 'WAITING_QUOTES' && (
                                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-[10px] whitespace-nowrap">
                                        Fazer 3 Cotações
                                      </Badge>
                                    )}
                                    {req.status === 'QUOTES_RECEIVED' && (
                                      <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] whitespace-nowrap">
                                        Cotações Feitas
                                      </Badge>
                                    )}
                                    {(req.status === 'RESERVED_STOCK' || req.status === 'AVAILABLE_FOR_INSTALLATION') && (
                                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] whitespace-nowrap">
                                        Em Estoque ✓
                                      </Badge>
                                    )}
                                    {(req.status === 'OC_GENERATED' || req.status === 'WAITING_DELIVERY') && (
                                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] whitespace-nowrap">
                                        OC Emitida
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {hasWaitingQuotes && onGoToRequisitions && (
                              <Button
                                size="sm"
                                onClick={onGoToRequisitions}
                                className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold text-xs h-8"
                              >
                                <ShoppingCart size={14} className="mr-1" />
                                Cotar Agora
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDetail(order)}
                              className="border-gray-600 text-gray-300 hover:bg-seguranca-black hover:text-white h-8"
                            >
                              <Eye size={14} className="mr-1" />
                              Ver OS
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Ordem de Serviço */}
      {selectedWorkOrder && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-700 text-seguranca-lightgray">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Wrench className="text-seguranca-yellow" size={20} />
                Ordem de Serviço: {selectedWorkOrder.osNumber}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Detalhes da manutenção mecânica e requisições vinculadas ao almoxarifado.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Identificação do Ônibus e Mecânico */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-seguranca-black/60 border border-gray-700 text-sm">
                <div>
                  <span className="text-xs text-gray-400">Veículo / Ônibus:</span>
                  <p className="font-bold text-white tracking-wider flex items-center gap-1.5 mt-0.5">
                    <Truck size={16} className="text-seguranca-yellow" />
                    {selectedWorkOrder.vehiclePlate} — {selectedWorkOrder.vehicleModel}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Mecânico Responsável:</span>
                  <p className="font-semibold text-gray-200 flex items-center gap-1.5 mt-0.5">
                    <User size={16} className="text-blue-400" />
                    {selectedWorkOrder.mechanicName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Status da OS:</span>
                  <div className="mt-1">{getStatusBadge(selectedWorkOrder.status || 'OPEN')}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-400">Prioridade da OS:</span>
                  <div className="mt-1">{getPriorityBadge(selectedWorkOrder.priority || 'NORMAL')}</div>
                </div>
              </div>

              {/* Anomalias / Defeito relatado */}
              {selectedWorkOrder.anomaliesDescription && (
                <div className="p-3 rounded-lg bg-seguranca-black/40 border border-gray-800 text-sm">
                  <span className="text-xs text-gray-400 font-semibold block mb-1">Defeito / Anomalias Relatadas:</span>
                  <p className="text-gray-300 italic">{selectedWorkOrder.anomaliesDescription}</p>
                </div>
              )}

              {/* Materiais e Peças da OS */}
              <div>
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                  <ShoppingCart size={16} className="text-seguranca-yellow" />
                  Materiais e Peças Vinculadas ao Almoxarifado
                </h4>

                {(!requisitionsByWorkOrderId.get(selectedWorkOrder.id) || requisitionsByWorkOrderId.get(selectedWorkOrder.id)?.length === 0) ? (
                  <div className="p-4 rounded border border-dashed border-gray-700 text-center text-xs text-gray-500">
                    Nenhuma solicitação de compras ou requisição de material gerada para esta OS.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {requisitionsByWorkOrderId.get(selectedWorkOrder.id)?.map(req => (
                      <div key={req.id} className="p-3 rounded-lg bg-seguranca-black/70 border border-gray-700 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-sm">{req.itemName}</p>
                          <p className="text-xs text-gray-400">
                            Qtd: <span className="text-seguranca-yellow font-semibold">{req.quantity} {req.unit}</span> • Req: #{req.requisitionNumber}
                          </p>
                          {req.justification && (
                            <p className="text-xs text-gray-500 italic mt-0.5 truncate max-w-[340px]">
                              Motivo: {req.justification}
                            </p>
                          )}
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5">
                          {req.status === 'WAITING_QUOTES' && (
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs">
                              Aguardando 3 Cotações
                            </Badge>
                          )}
                          {req.status === 'QUOTES_RECEIVED' && (
                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs">
                              Cotações Prontas
                            </Badge>
                          )}
                          {(req.status === 'RESERVED_STOCK' || req.status === 'AVAILABLE_FOR_INSTALLATION') && (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                              Atendido com Estoque ✓
                            </Badge>
                          )}
                          {(req.status === 'OC_GENERATED' || req.status === 'WAITING_DELIVERY') && (
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs">
                              Ordem de Compra Emitida
                            </Badge>
                          )}

                          {req.status === 'WAITING_QUOTES' && onGoToRequisitions && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowDetailModal(false);
                                onGoToRequisitions();
                              }}
                              className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold text-xs h-7"
                            >
                              Lançar Cotações
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t border-gray-700 pt-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="border-gray-600 text-gray-300"
              >
                Fechar
              </Button>
              {onGoToRequisitions && (
                <Button
                  onClick={() => {
                    setShowDetailModal(false);
                    onGoToRequisitions();
                  }}
                  className="bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold"
                >
                  <ShoppingCart size={16} className="mr-1.5" />
                  Ir para Painel de Cotações
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
