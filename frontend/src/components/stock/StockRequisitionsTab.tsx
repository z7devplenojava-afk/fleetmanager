import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ShoppingCart, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Truck, 
  Wrench, 
  Clock, 
  Car, 
  Eye, 
  FileText, 
  CheckCircle, 
  Calendar, 
  User, 
  Layers, 
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Trash2,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  materialRequisitionService, 
  MaterialRequisition, 
  RequisitionStatus, 
  RequisitionUrgency,
  CreateRequisitionPayload,
  ConfirmDeliveryPayload
} from '@/services/materialRequisitionService';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import fleetWorkOrderService, { FleetWorkOrder } from '@/services/fleetWorkOrderService';
import { useNavigate } from 'react-router-dom';

interface StockRequisitionsTabProps {
  onRefreshStock?: () => void;
}

export const StockRequisitionsTab: React.FC<StockRequisitionsTabProps> = ({ onRefreshStock }) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados de dados
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [workOrders, setWorkOrders] = useState<FleetWorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [categoryPill, setCategoryPill] = useState<'ALL' | 'TO_DELIVER' | 'TO_BUY' | 'COMPLETED' | 'EMERGENCY'>('ALL');

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Estados de modais
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<MaterialRequisition | null>(null);

  // Estados do formulário de Entrega/Baixa
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [receivedByName, setReceivedByName] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isSubmittingDelivery, setIsSubmittingDelivery] = useState(false);

  // Estados do formulário de Nova Requisição
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string>('');
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemCode, setCustomItemCode] = useState('');
  const [reqQuantity, setReqQuantity] = useState<number>(1);
  const [reqUnit, setReqUnit] = useState<string>('UN');
  const [reqUrgency, setReqUrgency] = useState<RequisitionUrgency>('NORMAL');
  const [reqJustification, setReqJustification] = useState('');
  const [reqOriginDepartment, setReqOriginDepartment] = useState<string>('OPERATIONAL');
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [stockCheckResult, setStockCheckResult] = useState<any>(null);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reqs, items, wos] = await Promise.all([
        materialRequisitionService.listRequisitions().catch(() => []),
        stockService.getAllItems().catch(() => []),
        fleetWorkOrderService.findAll().catch(() => [])
      ]);
      setRequisitions(Array.isArray(reqs) ? reqs : []);
      setStockItems(Array.isArray(items) ? items : []);
      setWorkOrders(Array.isArray(wos) ? wos : []);
    } catch (error) {
      console.error('Erro ao carregar requisições do almoxarifado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as requisições de compras e peças.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    if (onRefreshStock) onRefreshStock();
    toast({ title: 'Sucesso', description: 'Requisições atualizadas!' });
  };

  // Helper de checagem de estoque ao selecionar item na nova requisição
  const handleItemSelect = async (stockItemId: string) => {
    setSelectedStockItemId(stockItemId);
    const found = stockItems.find(i => i.id === stockItemId);
    if (found) {
      setCustomItemName(found.name);
      setCustomItemCode(found.code || '');
      setReqUnit(found.unit || 'UN');
      try {
        setIsCheckingStock(true);
        const avail = await materialRequisitionService.checkAvailability(stockItemId, selectedWorkOrderId || undefined);
        setStockCheckResult(avail);
      } catch (err) {
        console.error('Erro ao checar disponibilidade:', err);
      } finally {
        setIsCheckingStock(false);
      }
    } else {
      setStockCheckResult(null);
    }
  };

  // Abertura do modal de entrega
  const handleOpenDelivery = (req: MaterialRequisition) => {
    setSelectedReq(req);
    setDeliveryDate(new Date().toISOString().slice(0, 16));
    setReceivedByName(req.requesterName || '');
    setDeliveryNotes('');
    setShowDeliveryModal(true);
  };

  // Submeter Entrega e Baixa Automática no Estoque
  const handleConfirmDelivery = async () => {
    if (!selectedReq) return;
    try {
      setIsSubmittingDelivery(true);
      const payload: ConfirmDeliveryPayload = {
        deliveryDate: deliveryDate ? new Date(deliveryDate).toISOString() : new Date().toISOString(),
        receivedByName: receivedByName.trim() || 'Mecânico / Solicitante',
        notes: deliveryNotes.trim() || undefined
      };

      await materialRequisitionService.confirmDelivery(selectedReq.id, payload);

      toast({
        title: '✅ Entrega Registrada com Sucesso!',
        description: `O item ${selectedReq.itemName} (${selectedReq.quantity} ${selectedReq.unit}) foi baixado automaticamente do estoque físico.`
      });

      setShowDeliveryModal(false);
      setSelectedReq(null);
      await loadData();
      if (onRefreshStock) onRefreshStock();
    } catch (error: any) {
      console.error('Erro ao confirmar entrega:', error);
      toast({
        title: 'Erro ao registrar entrega',
        description: error.response?.data?.message || error.message || 'Falha ao dar baixa no estoque.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingDelivery(false);
    }
  };

  // Submeter Nova Requisição
  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrderId) {
      toast({ title: 'Atenção', description: 'Selecione a Ordem de Serviço (OS) de referência.', variant: 'destructive' });
      return;
    }
    if (!customItemName.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome do item a ser requisitado.', variant: 'destructive' });
      return;
    }
    if (!reqJustification.trim()) {
      toast({ title: 'Atenção', description: 'A justificativa da requisição é obrigatória.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmittingNew(true);
      const wo = workOrders.find(w => w.id === selectedWorkOrderId);

      const payload: CreateRequisitionPayload = {
        workOrderId: selectedWorkOrderId,
        vehicleId: wo?.vehicle?.id || wo?.vehicleId,
        stockItemId: selectedStockItemId || undefined,
        itemName: customItemName.trim(),
        itemCode: customItemCode.trim() || undefined,
        quantity: Number(reqQuantity) || 1,
        unit: reqUnit || 'UN',
        urgency: reqUrgency,
        justification: reqJustification.trim(),
        originDepartment: reqOriginDepartment || undefined
      };

      await materialRequisitionService.createRequisition(payload);

      toast({
        title: '✅ Requisição Criada com Sucesso!',
        description: `Requisição vinculada à OS #${wo?.osNumber || selectedWorkOrderId.slice(0, 8)} cadastrada no almoxarifado.`
      });

      setShowNewModal(false);
      // Limpar formulário
      setSelectedWorkOrderId('');
      setSelectedStockItemId('');
      setCustomItemName('');
      setCustomItemCode('');
      setReqQuantity(1);
      setReqJustification('');
      setReqOriginDepartment('OPERATIONAL');
      setStockCheckResult(null);

      await loadData();
      if (onRefreshStock) onRefreshStock();
    } catch (error: any) {
      console.error('Erro ao criar requisição:', error);
      toast({
        title: 'Erro ao criar requisição',
        description: error.response?.data?.message || error.message || 'Falha ao processar requisição.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingNew(false);
    }
  };


  // Exclusão em massa - apenas pendentes
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(
      `Deseja excluir ${selectedIds.size} requisição(ões) pendente(s)? Esta ação não pode ser desfeita.`
    );
    if (!confirmed) return;
    try {
      setIsBulkDeleting(true);
      const result = await materialRequisitionService.bulkDeleteRequisitions([...selectedIds]);
      toast({
        title: '✅ Exclusão em Massa Concluída',
        description: `${result.deleted} excluída(s). ${result.skippedNonPending > 0 ? `${result.skippedNonPending} ignorada(s) por não estar pendente.` : ''}`,
      });
      setSelectedIds(new Set());
      await loadData();
      if (onRefreshStock) onRefreshStock();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.response?.data?.message || error.message,
        variant: 'destructive'
      });
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Métricas
  const kpis = useMemo(() => {
    const total = requisitions.length;
    const toBuy = requisitions.filter(r => 
      ['PENDING_CHECK', 'WAITING_QUOTES', 'QUOTES_RECEIVED', 'APPROVED_BY_MANAGER', 'OC_GENERATED', 'WAITING_DELIVERY'].includes(r.status)
    ).length;
    const toDeliver = requisitions.filter(r => 
      ['RESERVED_STOCK', 'AVAILABLE_FOR_INSTALLATION'].includes(r.status)
    ).length;
    const completed = requisitions.filter(r => r.status === 'INSTALLED_COMPLETED').length;
    const emergencies = requisitions.filter(r => r.urgency === 'EMERGENCIA' && r.status !== 'INSTALLED_COMPLETED').length;

    return { total, toBuy, toDeliver, completed, emergencies };
  }, [requisitions]);

  // Filtragem
  const filteredRequisitions = useMemo(() => {
    return requisitions.filter(req => {
      // Filtro da pílula rápida
      if (categoryPill === 'TO_DELIVER') {
        if (!['RESERVED_STOCK', 'AVAILABLE_FOR_INSTALLATION'].includes(req.status)) return false;
      } else if (categoryPill === 'TO_BUY') {
        if (!['PENDING_CHECK', 'WAITING_QUOTES', 'QUOTES_RECEIVED', 'APPROVED_BY_MANAGER', 'OC_GENERATED', 'WAITING_DELIVERY'].includes(req.status)) return false;
      } else if (categoryPill === 'COMPLETED') {
        if (req.status !== 'INSTALLED_COMPLETED') return false;
      } else if (categoryPill === 'EMERGENCY') {
        if (req.urgency !== 'EMERGENCIA') return false;
      }

      // Filtro de Status
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }

      // Filtro de Urgência
      if (urgencyFilter !== 'ALL' && req.urgency !== urgencyFilter) {
        return false;
      }

      // Busca por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchReqNum = req.requisitionNumber?.toLowerCase().includes(term);
        const matchItem = req.itemName?.toLowerCase().includes(term);
        const matchCode = req.itemCode?.toLowerCase().includes(term);
        const matchWo = req.workOrderNumber?.toLowerCase().includes(term);
        const matchPlate = req.vehiclePlate?.toLowerCase().includes(term);
        const matchModel = req.vehicleModel?.toLowerCase().includes(term);
        const matchRequester = req.requesterName?.toLowerCase().includes(term);

        return matchReqNum || matchItem || matchCode || matchWo || matchPlate || matchModel || matchRequester;
      }

      return true;
    });
  }, [requisitions, categoryPill, statusFilter, urgencyFilter, searchTerm]);

  // Variáveis derivadas de filteredRequisitions
  const pendingFiltered = filteredRequisitions.filter(r => r.status === 'PENDING_CHECK');
  const allPendingSelected = pendingFiltered.length > 0 && pendingFiltered.every(r => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFiltered.map(r => r.id)));
    }
  };

  const toggleSelectOne = (id: string, isPending: boolean) => {
    if (!isPending) return;
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Helpers de Badge
  const getStatusBadge = (status: RequisitionStatus) => {
    switch (status) {
      case 'PENDING_CHECK':
        return <Badge className="bg-blue-600/30 text-blue-400 border border-blue-500/40">Verificação Inicial</Badge>;
      case 'RESERVED_STOCK':
        return <Badge className="bg-emerald-600/30 text-emerald-400 border border-emerald-500/40">📦 Reservado em Estoque</Badge>;
      case 'WAITING_QUOTES':
        return <Badge className="bg-amber-600/30 text-amber-400 border border-amber-500/40">🛒 Aguardando 3 Cotações</Badge>;
      case 'QUOTES_RECEIVED':
        return <Badge className="bg-purple-600/30 text-purple-400 border border-purple-500/40">📊 Cotações Cadastradas</Badge>;
      case 'APPROVED_BY_MANAGER':
        return <Badge className="bg-cyan-600/30 text-cyan-400 border border-cyan-500/40">👍 Aprovado Gestor</Badge>;
      case 'OC_GENERATED':
        return <Badge className="bg-indigo-600/30 text-indigo-400 border border-indigo-500/40">📑 Ordem de Compra</Badge>;
      case 'WAITING_DELIVERY':
        return <Badge className="bg-orange-600/30 text-orange-400 border border-orange-500/40">🚚 Aguardando Fornecedor</Badge>;
      case 'AVAILABLE_FOR_INSTALLATION':
        return <Badge className="bg-green-600/30 text-green-300 border border-green-500/40">✨ Pronto p/ Entrega/OS</Badge>;
      case 'INSTALLED_COMPLETED':
        return <Badge className="bg-gray-600/30 text-gray-300 border border-gray-500/40">✅ Entregue & Baixado</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-600/30 text-red-400 border border-red-500/40">❌ Rejeitado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-zinc-700 text-zinc-400">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas e KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer transition-all border ${categoryPill === 'ALL' ? 'border-seguranca-yellow bg-seguranca-black/80 ring-1 ring-seguranca-yellow/50' : 'bg-seguranca-graphite border-gray-600 hover:border-gray-500'}`}
          onClick={() => setCategoryPill('ALL')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Total Requisições</CardTitle>
            <Layers className="h-4 w-4 text-seguranca-yellow" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-seguranca-lightgray">{kpis.total}</div>
            <p className="text-[11px] text-gray-400 mt-0.5">Todas as solicitações de OS</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border ${categoryPill === 'TO_DELIVER' ? 'border-emerald-500 bg-seguranca-black/80 ring-1 ring-emerald-500/50' : 'bg-seguranca-graphite border-gray-600 hover:border-gray-500'}`}
          onClick={() => setCategoryPill('TO_DELIVER')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">📦 Para Entregar</CardTitle>
            <Package className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{kpis.toDeliver}</div>
            <p className="text-[11px] text-gray-400 mt-0.5">Disponíveis / Reserva estoque</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border ${categoryPill === 'TO_BUY' ? 'border-amber-500 bg-seguranca-black/80 ring-1 ring-amber-500/50' : 'bg-seguranca-graphite border-gray-600 hover:border-gray-500'}`}
          onClick={() => setCategoryPill('TO_BUY')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-amber-400 uppercase tracking-wider">🛒 Para Comprar</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{kpis.toBuy}</div>
            <p className="text-[11px] text-gray-400 mt-0.5">Em cotação / Ordem de compra</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border ${categoryPill === 'COMPLETED' ? 'border-blue-500 bg-seguranca-black/80 ring-1 ring-blue-500/50' : 'bg-seguranca-graphite border-gray-600 hover:border-gray-500'}`}
          onClick={() => setCategoryPill('COMPLETED')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-gray-300 uppercase tracking-wider">✅ Entregues / Baixadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{kpis.completed}</div>
            <p className="text-[11px] text-gray-400 mt-0.5">Com baixa física efetuada</p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all border ${categoryPill === 'EMERGENCY' ? 'border-red-500 bg-seguranca-black/80 ring-1 ring-red-500/50' : 'bg-seguranca-graphite border-gray-600 hover:border-gray-500'}`}
          onClick={() => setCategoryPill('EMERGENCY')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-red-400 uppercase tracking-wider">🚨 Emergências</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{kpis.emergencies}</div>
            <p className="text-[11px] text-gray-400 mt-0.5">SLA crítico de 4 horas</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ações e Filtros */}
      <div className="bg-seguranca-graphite p-4 rounded-xl border border-gray-600 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por OS, Placa, Item, Código ou Nº Requisição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500"
            />
          </div>

          {/* Filtros Dropdown */}
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <SelectItem value="ALL">Todos os Status</SelectItem>
                <SelectItem value="PENDING_CHECK">Verificação Inicial</SelectItem>
                <SelectItem value="RESERVED_STOCK">Reservado em Estoque</SelectItem>
                <SelectItem value="WAITING_QUOTES">Aguardando 3 Cotações</SelectItem>
                <SelectItem value="QUOTES_RECEIVED">Cotações Cadastradas</SelectItem>
                <SelectItem value="APPROVED_BY_MANAGER">Aprovado pelo Gestor</SelectItem>
                <SelectItem value="OC_GENERATED">Ordem de Compra (OC)</SelectItem>
                <SelectItem value="WAITING_DELIVERY">Aguardando Fornecedor</SelectItem>
                <SelectItem value="AVAILABLE_FOR_INSTALLATION">Pronto p/ Instalação</SelectItem>
                <SelectItem value="INSTALLED_COMPLETED">Entregue & Baixado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px] bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <SelectItem value="ALL">Toda Urgência</SelectItem>
                <SelectItem value="NORMAL">Normal (72h)</SelectItem>
                <SelectItem value="EMERGENCIA">🚨 Emergência (4h)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-700 hover:bg-red-800 text-white font-semibold text-xs gap-1.5 animate-in fade-in"
              >
                {isBulkDeleting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Excluindo...</>
                ) : (
                  <><Trash2 className="h-3.5 w-3.5" /> Excluir Selecionadas ({selectedIds.size})</>
                )}
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => setShowNewModal(true)}
              className="bg-seguranca-yellow text-black hover:bg-yellow-500 font-semibold text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Nova Requisição p/ OS
            </Button>
          </div>
        </div>

        {/* Pílulas de Filtro Rápido */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-700/60">
          <span className="text-xs font-medium text-gray-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Visualização:
          </span>
          <button
            onClick={() => setCategoryPill('ALL')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${categoryPill === 'ALL' ? 'bg-seguranca-yellow text-black font-semibold shadow' : 'bg-seguranca-black/60 text-gray-300 hover:bg-seguranca-black'}`}
          >
            Todas ({kpis.total})
          </button>
          <button
            onClick={() => setCategoryPill('TO_DELIVER')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${categoryPill === 'TO_DELIVER' ? 'bg-emerald-600 text-white font-semibold shadow' : 'bg-seguranca-black/60 text-emerald-400 hover:bg-seguranca-black'}`}
          >
            <Package className="h-3 w-3" /> Para Entregar ({kpis.toDeliver})
          </button>
          <button
            onClick={() => setCategoryPill('TO_BUY')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${categoryPill === 'TO_BUY' ? 'bg-amber-600 text-white font-semibold shadow' : 'bg-seguranca-black/60 text-amber-400 hover:bg-seguranca-black'}`}
          >
            <ShoppingCart className="h-3 w-3" /> Para Comprar / Cotações ({kpis.toBuy})
          </button>
          <button
            onClick={() => setCategoryPill('COMPLETED')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${categoryPill === 'COMPLETED' ? 'bg-blue-600 text-white font-semibold shadow' : 'bg-seguranca-black/60 text-blue-400 hover:bg-seguranca-black'}`}
          >
            <CheckCircle2 className="h-3 w-3" /> Entregues & Baixadas ({kpis.completed})
          </button>
          <button
            onClick={() => setCategoryPill('EMERGENCY')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${categoryPill === 'EMERGENCY' ? 'bg-red-600 text-white font-semibold shadow' : 'bg-seguranca-black/60 text-red-400 hover:bg-seguranca-black'}`}
          >
            <AlertTriangle className="h-3 w-3" /> Emergências ({kpis.emergencies})
          </button>
        </div>
      </div>

      {/* Tabela de Requisições */}
      <div className="bg-seguranca-graphite border border-gray-600 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow mb-3" />
            <p className="text-seguranca-lightgray font-medium">Carregando requisições do almoxarifado...</p>
          </div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Package className="h-12 w-12 text-gray-500 mb-3" />
            <p className="text-seguranca-lightgray font-semibold text-lg">Nenhuma requisição encontrada</p>
            <p className="text-gray-400 text-sm max-w-md mt-1">
              Não há requisições que correspondam aos filtros selecionados. Crie uma nova requisição associada a uma Ordem de Serviço.
            </p>
            <Button
              onClick={() => setShowNewModal(true)}
              className="mt-4 bg-seguranca-yellow text-black hover:bg-yellow-500 text-xs font-semibold"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Criar Requisição de Peça
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-seguranca-black text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700">
                <tr>
                  <th className="px-3 py-3.5 w-10">
                    {pendingFiltered.length > 0 && (
                      <input
                        type="checkbox"
                        checked={allPendingSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-600 bg-seguranca-black accent-seguranca-yellow cursor-pointer"
                        title="Selecionar todas pendentes"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3.5">Nº Requisição</th>
                  <th className="px-4 py-3.5">Ordem de Serviço (OS) & Veículo</th>
                  <th className="px-4 py-3.5">Item Solicitado</th>
                  <th className="px-4 py-3.5">Urgência</th>
                  <th className="px-4 py-3.5">Destino / Fluxo</th>
                  <th className="px-4 py-3.5">Status & SLA</th>
                  <th className="px-4 py-3.5">Entrega & Baixa</th>
                  <th className="px-4 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60 bg-seguranca-graphite">
                {filteredRequisitions.map((req) => {
                  const isDelivered = req.status === 'INSTALLED_COMPLETED';
                  const isReadyForDelivery = ['RESERVED_STOCK', 'AVAILABLE_FOR_INSTALLATION'].includes(req.status);
                  const isUnderProcurement = ['PENDING_CHECK', 'WAITING_QUOTES', 'QUOTES_RECEIVED', 'APPROVED_BY_MANAGER', 'OC_GENERATED', 'WAITING_DELIVERY'].includes(req.status);
                  const isPending = req.status === 'PENDING_CHECK';
                  const isSelected = selectedIds.has(req.id);

                  return (
                    <tr key={req.id} className={`hover:bg-seguranca-black/40 transition-colors ${isSelected ? 'bg-seguranca-yellow/5 ring-1 ring-inset ring-seguranca-yellow/20' : ''}`}>
                      {/* Checkbox de seleção (apenas pendentes) */}
                      <td className="px-3 py-3.5">
                        {isPending ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(req.id, isPending)}
                            className="h-4 w-4 rounded border-gray-600 bg-seguranca-black accent-seguranca-yellow cursor-pointer"
                          />
                        ) : (
                          <span className="block h-4 w-4" />
                        )}
                      </td>
                      {/* Nº Requisição */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-bold text-seguranca-lightgray text-xs">
                          {req.requisitionNumber}
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-2.5 w-2.5" />
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString('pt-BR') : '—'}
                        </div>
                      </td>

                      {/* OS e Veículo (Referência Obrigatória) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-300 font-mono text-xs font-semibold px-2 py-0.5">
                            <Wrench className="h-3 w-3 mr-1 text-amber-400" />
                            {req.workOrderNumber || (req.workOrderId ? `OS-${req.workOrderId.slice(0, 8)}` : 'Sem OS')}
                          </Badge>
                        </div>
                        {req.vehiclePlate && (
                          <div className="text-xs text-seguranca-lightgray font-semibold flex items-center gap-1.5 mt-1">
                            <Car className="h-3 w-3 text-seguranca-yellow" />
                            <span>{req.vehiclePlate}</span>
                            {req.vehicleModel && (
                              <span className="text-gray-400 font-normal truncate max-w-[140px]">
                                · {req.vehicleModel}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Item Solicitado */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-seguranca-lightgray">
                          {req.itemName}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                          {req.itemCode && <span className="font-mono text-[11px] text-gray-500">Cód: {req.itemCode}</span>}
                          <span className="font-semibold text-emerald-400">
                            {req.quantity} {req.unit || 'UN'}
                          </span>
                        </div>
                      </td>

                      {/* Urgência */}
                      <td className="px-4 py-3.5">
                        {req.urgency === 'EMERGENCIA' ? (
                          <Badge className="bg-red-600/30 text-red-400 border border-red-500/50 flex items-center gap-1 w-fit animate-pulse">
                            <AlertTriangle className="h-3 w-3" /> Emergência (4h)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs w-fit">
                            Normal (72h)
                          </Badge>
                        )}
                      </td>

                      {/* Destino / Fluxo */}
                      <td className="px-4 py-3.5">
                        {isReadyForDelivery ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                            <Package className="h-3 w-3" /> Atender do Estoque
                          </span>
                        ) : isUnderProcurement ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
                            <ShoppingCart className="h-3 w-3" /> Compras / Cotação
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/50">
                            <CheckCircle2 className="h-3 w-3" /> Concluído
                          </span>
                        )}
                      </td>

                      {/* Status & SLA */}
                      <td className="px-4 py-3.5">
                        <div>{getStatusBadge(req.status)}</div>
                        {req.slaLeadTimeMinutes != null && !isDelivered && (
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${req.isSlaBreached ? 'text-red-400 font-bold' : 'text-gray-400'}`}>
                            <Clock className="h-2.5 w-2.5" />
                            {req.isSlaBreached ? 'SLA Excedido!' : `Lead time: ${Math.round(req.slaLeadTimeMinutes / 60)}h`}
                          </div>
                        )}
                      </td>

                      {/* Entrega & Baixa */}
                      <td className="px-4 py-3.5 text-xs">
                        {isDelivered ? (
                          <div>
                            <div className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Entregue
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {req.deliveryDate ? new Date(req.deliveryDate).toLocaleDateString('pt-BR') : '—'}
                              {req.receivedByName && ` · ${req.receivedByName}`}
                            </div>
                          </div>
                        ) : isReadyForDelivery ? (
                          <span className="text-amber-400 font-medium text-xs flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 animate-bounce" /> Pronto p/ Baixa
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">Aguardando compras</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão de Dar Baixa / Entregar Item */}
                          {!isDelivered && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenDelivery(req)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-7 px-2.5 gap-1 shadow-sm"
                              title="Informar entrega e dar baixa automática no estoque"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              Dar Baixa
                            </Button>
                          )}

                          {/* Se estiver no fluxo de compras, botão de atalho */}
                          {isUnderProcurement && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate('/cotacoes-compras')}
                              className="border-amber-600/70 text-amber-400 hover:bg-amber-950/40 text-xs h-7 px-2"
                              title="Ir para Cotações e Compras"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {/* Botão Ver Detalhes */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReq(req);
                              setShowDetailsModal(true);
                            }}
                            className="text-gray-400 hover:text-seguranca-lightgray hover:bg-seguranca-black h-7 w-7 p-0"
                            title="Ver Detalhes da Requisição"
                          >
                            <Eye className="h-4 w-4" />
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR ENTREGA E BAIXA AUTOMÁTICA NO ESTOQUE */}
      {/* ========================================================================= */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="bg-seguranca-graphite border border-gray-600 text-seguranca-lightgray max-w-lg shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-seguranca-lightgray">
              <Truck className="h-5 w-5 text-emerald-400" />
              Confirmar Entrega & Baixa no Estoque
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Informe a data de entrega e o recebedor para que o sistema execute a baixa automática do saldo no estoque.
            </DialogDescription>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-4 my-2">
              {/* Resumo da Requisição e OS */}
              <div className="bg-seguranca-black/60 p-3.5 rounded-lg border border-gray-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Nº Requisição:</span>
                  <span className="font-mono font-bold text-seguranca-yellow">{selectedReq.requisitionNumber}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Ordem de Serviço (OS):</span>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-300 font-mono text-xs">
                    {selectedReq.workOrderNumber || `OS-${selectedReq.workOrderId?.slice(0, 8)}`}
                  </Badge>
                </div>
                {selectedReq.vehiclePlate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Veículo Vinculado:</span>
                    <span className="font-semibold text-seguranca-lightgray">
                      {selectedReq.vehiclePlate} {selectedReq.vehicleModel ? `(${selectedReq.vehicleModel})` : ''}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-700">
                  <span className="text-gray-400">Item Solicitado:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedReq.itemName} · {selectedReq.quantity} {selectedReq.unit || 'UN'}
                  </span>
                </div>
              </div>

              {/* Alerta de Baixa Automática */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-lg flex items-start gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Baixa Automática no Saldo:</strong> Ao confirmar, o saldo do item no almoxarifado será debitado em <strong>{selectedReq.quantity} {selectedReq.unit || 'UN'}</strong> com registro de saída para a OS.
                </div>
              </div>

              {/* Formulário de Entrega */}
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-300 mb-1 block">Data e Hora da Entrega *</Label>
                  <Input
                    type="datetime-local"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-300 mb-1 block">Recebido Por (Mecânico / Solicitante) *</Label>
                  <Input
                    placeholder="Nome do mecânico ou colaborador que retirou a peça"
                    value={receivedByName}
                    onChange={(e) => setReceivedByName(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-300 mb-1 block">Observações da Entrega (Opcional)</Label>
                  <Textarea
                    placeholder="Ex: Peça entregue na oficina box 2 para troca imediata"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs min-h-[60px]"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeliveryModal(false)}
              disabled={isSubmittingDelivery}
              className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={isSubmittingDelivery}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSubmittingDelivery ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Processando Baixa...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Confirmar Entrega & Dar Baixa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: NOVA REQUISIÇÃO DE PEÇA VINCULADA À ORDEM DE SERVIÇO (OS) */}
      {/* ========================================================================= */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="bg-seguranca-graphite border border-gray-600 text-seguranca-lightgray max-w-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-seguranca-lightgray">
              <Plus className="h-5 w-5 text-seguranca-yellow" />
              Nova Requisição de Material / Peça para OS
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Toda requisição deve referenciar uma Ordem de Serviço (OS) e veículo correspondente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRequisition} className="space-y-4 my-2">
            {/* Seleção Obrigatória de Ordem de Serviço */}
            <div>
              <Label className="text-xs text-gray-300 mb-1 block">Ordem de Serviço (OS) de Referência *</Label>
              <Select value={selectedWorkOrderId} onValueChange={setSelectedWorkOrderId} required>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                  <SelectValue placeholder="Selecione a Ordem de Serviço em andamento..." />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-60">
                  {workOrders.map((wo) => (
                    <SelectItem key={wo.id} value={wo.id} className="text-xs">
                      #{wo.osNumber || wo.id.slice(0, 8)} · {wo.vehicle?.plate || 'Veículo N/D'} ({wo.vehicle?.model || ''}) - {wo.title || 'Manutenção'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção ou Busca do Item no Estoque */}
            <div>
              <Label className="text-xs text-gray-300 mb-1 block">Item do Almoxarifado / Estoque (Opcional)</Label>
              <Select value={selectedStockItemId} onValueChange={handleItemSelect}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                  <SelectValue placeholder="Escolher item cadastrado no estoque..." />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-60">
                  {stockItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="text-xs">
                      {item.fullName || item.name} (Saldo: {item.currentQuantity} {item.unit || 'UN'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Indicador de Disponibilidade em Tempo Real */}
            {isCheckingStock ? (
              <div className="p-2.5 bg-seguranca-black/50 border border-gray-700 rounded text-xs text-gray-400 flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-seguranca-yellow" /> Verificando saldo e reservas...
              </div>
            ) : stockCheckResult ? (
              <div className={`p-3 rounded-lg border text-xs ${stockCheckResult.isAvailable ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300' : 'bg-amber-950/40 border-amber-600/50 text-amber-300'}`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {stockCheckResult.isAvailable ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                  {stockCheckResult.isAvailable 
                    ? `Disponível em Estoque Livre: ${stockCheckResult.availableFreeQuantity} ${reqUnit}` 
                    : `Saldo livre insuficiente (${stockCheckResult.availableFreeQuantity} ${reqUnit})! A requisição seguirá para cotação de compras.`}
                </div>
                {stockCheckResult.hasConflict && (
                  <div className="text-[11px] text-orange-400 mt-1">
                    ⚠️ Atenção: Há {stockCheckResult.activeReservations.length} reserva(s) deste item para outro(s) veículo(s).
                  </div>
                )}
              </div>
            ) : null}

            {/* Campos do Item */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-gray-300 mb-1 block">Nome da Peça / Material *</Label>
                <Input
                  placeholder="Ex: Filtro de Combustível, Pastilha de Freio..."
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1 block">Código / Referência</Label>
                <Input
                  placeholder="Ex: FL-4029"
                  value={customItemCode}
                  onChange={(e) => setCustomItemCode(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm font-mono"
                />
              </div>
            </div>

            {/* Quantidade, Unidade e Urgência */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-gray-300 mb-1 block">Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={reqQuantity}
                  onChange={(e) => setReqQuantity(Number(e.target.value))}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1 block">Unidade</Label>
                <Input
                  value={reqUnit}
                  onChange={(e) => setReqUnit(e.target.value)}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-sm uppercase"
                  placeholder="UN, PC, LT..."
                />
              </div>
              <div>
                <Label className="text-xs text-gray-300 mb-1 block">Urgência *</Label>
                <Select value={reqUrgency} onValueChange={(v: RequisitionUrgency) => setReqUrgency(v)}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                    <SelectItem value="NORMAL">Normal (72h)</SelectItem>
                    <SelectItem value="EMERGENCIA">🚨 Emergência (4h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Justificativa Obrigatória */}
            <div>
              <Label className="text-xs text-gray-300 mb-1 block">Justificativa da Requisição / Motivo da Troca *</Label>
              <Textarea
                placeholder="Ex: Peça desgastada identificada na manutenção preventiva da OS; veículo não pode operar sem a substituição."
                value={reqJustification}
                onChange={(e) => setReqJustification(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs min-h-[70px]"
                required
              />
            </div>

            {/* Departamento de Origem */}
            <div>
              <Label className="text-xs text-gray-300 mb-1 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                Departamento de Origem da Requisição
              </Label>
              <Select value={reqOriginDepartment} onValueChange={setReqOriginDepartment}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray text-xs">
                  <SelectValue placeholder="Selecione o departamento..." />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                  <SelectItem value="OPERATIONAL">⚙️ Operacional / Manutenção</SelectItem>
                  <SelectItem value="RH_DP">👥 RH / Departamento Pessoal</SelectItem>
                  <SelectItem value="STOCK">📦 Estoque / Almoxarifado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewModal(false)}
                disabled={isSubmittingNew}
                className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingNew}
                className="bg-seguranca-yellow text-black hover:bg-yellow-500 font-semibold"
              >
                {isSubmittingNew ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Criando Requisição...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Cadastrar Requisição
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: DETALHES COMPLETOS DA REQUISIÇÃO & RASTREIO */}
      {/* ========================================================================= */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-seguranca-graphite border border-gray-600 text-seguranca-lightgray max-w-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-seguranca-lightgray">
              <FileText className="h-5 w-5 text-seguranca-yellow" />
              Detalhes da Requisição #{selectedReq?.requisitionNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedReq && (
            <div className="space-y-4 my-2 text-xs">
              {/* Status e Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-seguranca-black/60 rounded-lg border border-gray-700">
                <div>
                  <div className="text-gray-400">Status Atual:</div>
                  <div className="mt-1">{getStatusBadge(selectedReq.status)}</div>
                </div>
                <div>
                  <div className="text-gray-400">Urgência:</div>
                  <div className="mt-1 font-bold text-seguranca-lightgray">
                    {selectedReq.urgency === 'EMERGENCIA' ? '🚨 Emergência (4h SLA)' : 'Normal (72h SLA)'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400">Data de Criação:</div>
                  <div className="mt-1 font-mono text-seguranca-lightgray">
                    {selectedReq.createdAt ? new Date(selectedReq.createdAt).toLocaleString('pt-BR') : '—'}
                  </div>
                </div>
              </div>

              {/* Vínculo OS e Veículo */}
              <div className="p-3 bg-seguranca-black/40 rounded-lg border border-gray-700 space-y-1.5">
                <div className="font-semibold text-amber-400 flex items-center gap-1">
                  <Wrench className="h-3.5 w-3.5" /> Referência da Ordem de Serviço:
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-seguranca-lightgray">
                  <div>
                    <span className="text-gray-400">Nº da OS: </span>
                    <strong className="font-mono text-seguranca-yellow">{selectedReq.workOrderNumber || selectedReq.workOrderId || 'N/D'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Veículo: </span>
                    <strong>{selectedReq.vehiclePlate || 'N/D'} {selectedReq.vehicleModel ? `(${selectedReq.vehicleModel})` : ''}</strong>
                  </div>
                </div>
              </div>

              {/* Dados do Item */}
              <div className="p-3 bg-seguranca-black/40 rounded-lg border border-gray-700 space-y-1.5">
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" /> Item Solicitado:
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-seguranca-lightgray">
                  <div>
                    <span className="text-gray-400">Nome: </span>
                    <strong>{selectedReq.itemName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Código / Ref: </span>
                    <span className="font-mono">{selectedReq.itemCode || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Quantidade: </span>
                    <strong className="text-emerald-400">{selectedReq.quantity} {selectedReq.unit || 'UN'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Solicitante: </span>
                    <span>{selectedReq.requesterName || 'Sistema'}</span>
                  </div>
                </div>
              </div>

              {/* Justificativa */}
              <div className="p-3 bg-seguranca-black/40 rounded-lg border border-gray-700">
                <div className="text-gray-400 font-semibold mb-1">Justificativa da Requisição:</div>
                <p className="text-gray-300 italic bg-seguranca-black/60 p-2 rounded border border-gray-800">
                  "{selectedReq.justification || 'Sem justificativa informada'}"
                </p>
              </div>

              {/* Informações de Entrega e Baixa */}
              {selectedReq.status === 'INSTALLED_COMPLETED' ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-lg space-y-1 text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> Entrega & Baixa no Estoque Concluídas
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-gray-400">Data da Entrega: </span>
                      <span className="text-white font-mono">{selectedReq.deliveryDate ? new Date(selectedReq.deliveryDate).toLocaleString('pt-BR') : '—'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Recebido Por: </span>
                      <span className="text-white font-semibold">{selectedReq.receivedByName || '—'}</span>
                    </div>
                    {selectedReq.deliveryNotes && (
                      <div className="col-span-2">
                        <span className="text-gray-400">Obs Entrega: </span>
                        <span className="text-gray-300">{selectedReq.deliveryNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/40 border border-amber-600/50 rounded-lg flex items-center justify-between">
                  <div className="text-amber-300">
                    <strong>Pendente de Entrega:</strong> Este item ainda não foi retirado/entregue para aplicação na OS.
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleOpenDelivery(selectedReq);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-7"
                  >
                    Dar Baixa Agora
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
              className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockRequisitionsTab;
