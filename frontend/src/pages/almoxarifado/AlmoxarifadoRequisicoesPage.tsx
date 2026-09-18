import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Package,
  ShoppingCart,
  Receipt,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  RefreshCw,
  Sparkles,
  Building2,
  DollarSign,
  Truck,
  TrendingDown,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  materialRequisitionService,
  MaterialRequisition,
  RequisitionStatus
} from '@/services/materialRequisitionService';
import {
  procurementService,
  ProcurementPurchaseOrder,
  StockInvoiceEntry
} from '@/services/procurementService';
import { TripleQuoteComparisonModal } from '@/components/almoxarifado/TripleQuoteComparisonModal';
import { PurchaseOrderModal } from '@/components/financeiro/PurchaseOrderModal';
import { InvoiceEntryModal } from '@/components/almoxarifado/InvoiceEntryModal';

export const AlmoxarifadoRequisicoesPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'requisitions' | 'orders' | 'invoices'>('requisitions');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Data lists
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<ProcurementPurchaseOrder[]>([]);
  const [invoiceEntries, setInvoiceEntries] = useState<StockInvoiceEntry[]>([]);

  // Modals state
  const [selectedRequisitionForQuotes, setSelectedRequisitionForQuotes] = useState<MaterialRequisition | null>(null);
  const [selectedPO, setSelectedPO] = useState<ProcurementPurchaseOrder | null>(null);
  const [selectedRequisitionForInvoice, setSelectedRequisitionForInvoice] = useState<MaterialRequisition | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [reqs, pos, invs] = await Promise.all([
        materialRequisitionService.listRequisitions(),
        procurementService.listPurchaseOrders(),
        procurementService.listInvoiceEntries()
      ]);
      setRequisitions(reqs);
      setPurchaseOrders(pos);
      setInvoiceEntries(invs);
    } catch (error) {
      console.error('Erro ao carregar dados do almoxarifado/compras:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar as requisições e ordens de compra.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalPendingReqs = requisitions.filter(
    (r) => r.status !== 'INSTALLED_COMPLETED' && r.status !== 'REJECTED' && r.status !== 'CANCELLED'
  ).length;
  const totalEmergency = requisitions.filter(
    (r) => r.urgency === 'EMERGENCIA' && r.status !== 'INSTALLED_COMPLETED' && r.status !== 'REJECTED'
  ).length;
  const pendingFinancialApproval = purchaseOrders.filter(
    (po) => po.status === 'PENDING_FINANCIAL_APPROVAL'
  ).length;
  const readyForInstallation = requisitions.filter(
    (r) => r.status === 'AVAILABLE_FOR_INSTALLATION'
  ).length;

  const filteredRequisitions = requisitions.filter((r) => {
    const matchesSearch =
      r.requisitionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <StandardLayout
      title="Almoxarifado & Requisições de Compras"
      description="Gestão integrada de requisições de peças por OS, 3 cotações inteligentes, ordens de compra e entrada de NF-e com SLA."
    >
      <div className="space-y-6 pb-12">
        {/* CARDS DE METRICAS E KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400">Requisições Ativas</span>
                <p className="text-2xl font-bold text-zinc-100 mt-1">{totalPendingReqs}</p>
                <span className="text-[11px] text-zinc-500">Aguardando atendimento/compra</span>
              </div>
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <Package className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400">Reposição Emergencial</span>
                <p className="text-2xl font-bold text-red-400 mt-1">{totalEmergency}</p>
                <span className="text-[11px] text-red-300">Veículos parados em manutenção</span>
              </div>
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400">Pendentes no Financeiro</span>
                <p className="text-2xl font-bold text-blue-400 mt-1">{pendingFinancialApproval}</p>
                <span className="text-[11px] text-zinc-500">Ordens de Compra p/ autorizar</span>
              </div>
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-400">Peças Prontas p/ Instalar</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{readyForInstallation}</p>
                <span className="text-[11px] text-emerald-300">Liberadas no almoxarifado</span>
              </div>
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ABAS E CONTEUDO PRINCIPAL */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
              <TabsTrigger
                value="requisitions"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2 text-xs font-medium"
              >
                <ShoppingCart className="w-4 h-4" />
                Requisições de Peças ({requisitions.length})
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2 text-xs font-medium"
              >
                <FileText className="w-4 h-4" />
                Ordens de Compra - Financeiro ({purchaseOrders.length})
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-2 text-xs font-medium"
              >
                <Receipt className="w-4 h-4" />
                Entradas por NF-e & SLA ({invoiceEntries.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs"
                onClick={loadAllData}
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                onClick={() => {
                  setSelectedRequisitionForInvoice(null);
                  setSelectedPO(null);
                  setIsInvoiceModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Lançar Entrada de NF-e
              </Button>
            </div>
          </div>

          {/* ABA 1: REQUISIÇÕES DE PEÇAS */}
          <TabsContent value="requisitions" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-bold text-zinc-100">
                      Painel de Requisições ao Almoxarifado
                    </CardTitle>
                    <CardDescription className="text-xs text-zinc-400">
                      Acompanhe as solicitações de peças vinculadas às OS com controle de SLA e cotações.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-zinc-400" />
                      <Input
                        placeholder="Buscar por OS, peça ou placa..."
                        className="pl-8 bg-zinc-800 border-zinc-700 text-xs text-zinc-100 h-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-100 rounded-lg p-2 h-9"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="WAITING_QUOTES">Aguardando 3 Cotações</option>
                      <option value="QUOTES_RECEIVED">Cotações Cadastradas</option>
                      <option value="OC_GENERATED">OC Emitida (Financeiro)</option>
                      <option value="AVAILABLE_FOR_INSTALLATION">Liberada p/ Instalação</option>
                      <option value="INSTALLED_COMPLETED">Instalada / Concluída</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Requisição / OS</th>
                        <th className="p-3.5">Veículo</th>
                        <th className="p-3.5">Item / Peça</th>
                        <th className="p-3.5">Prioridade</th>
                        <th className="p-3.5">Justificativa</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">SLA / Tempo</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredRequisitions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-zinc-500">
                            Nenhuma requisição de peça encontrada.
                          </td>
                        </tr>
                      ) : (
                        filteredRequisitions.map((req) => {
                          const isEmergency = req.urgency === 'EMERGENCIA';
                          const isBreached = req.isSlaBreached;

                          return (
                            <tr key={req.id} className="hover:bg-zinc-800/40 transition-colors">
                              <td className="p-3.5">
                                <span className="font-bold text-zinc-100">{req.requisitionNumber}</span>
                                {req.workOrderNumber && (
                                  <div className="text-[11px] text-amber-400 font-medium">
                                    {req.workOrderNumber}
                                  </div>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="font-semibold text-zinc-200">{req.vehiclePlate || 'N/D'}</span>
                                {req.vehicleModel && (
                                  <div className="text-[11px] text-zinc-400">{req.vehicleModel}</div>
                                )}
                              </td>
                              <td className="p-3.5">
                                <span className="font-medium text-zinc-100">
                                  {req.quantity} {req.unit} — {req.itemName}
                                </span>
                                {req.itemCode && (
                                  <div className="text-[11px] text-zinc-500">Cód: {req.itemCode}</div>
                                )}
                              </td>
                              <td className="p-3.5">
                                {isEmergency ? (
                                  <Badge className="bg-red-600 text-white text-[10px] font-bold animate-pulse">
                                    EMERGÊNCIA
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                                    NORMAL
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3.5 max-w-xs truncate text-zinc-300" title={req.justification}>
                                {req.justification}
                              </td>
                              <td className="p-3.5">
                                <Badge
                                  className={
                                    req.status === 'AVAILABLE_FOR_INSTALLATION'
                                      ? 'bg-emerald-600 text-white font-semibold'
                                      : req.status === 'OC_GENERATED' || req.status === 'WAITING_DELIVERY'
                                      ? 'bg-blue-600 text-white font-semibold'
                                      : 'bg-amber-600 text-white font-semibold'
                                  }
                                >
                                  {req.statusDescription || req.status}
                                </Badge>
                              </td>
                              <td className="p-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Clock
                                    className={`w-3.5 h-3.5 ${
                                      isBreached ? 'text-red-400' : 'text-zinc-400'
                                    }`}
                                  />
                                  <span
                                    className={`font-semibold ${
                                      isBreached ? 'text-red-400' : 'text-zinc-300'
                                    }`}
                                  >
                                    {req.slaLeadTimeMinutes
                                      ? `${Math.floor(req.slaLeadTimeMinutes / 60)}h ${
                                          req.slaLeadTimeMinutes % 60
                                        }m`
                                      : 'Em aberto'}
                                  </span>
                                </div>
                                <span className="text-[10px] text-zinc-500">
                                  Meta: {Math.floor((req.slaTargetMinutes || 4320) / 60)}h
                                </span>
                              </td>
                              <td className="p-3.5 text-right space-x-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-semibold"
                                  onClick={() => setSelectedRequisitionForQuotes(req)}
                                >
                                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                                  3 Cotações
                                </Button>
                                {req.status === 'WAITING_DELIVERY' || req.status === 'OC_GENERATED' ? (
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                                    onClick={() => {
                                      setSelectedRequisitionForInvoice(req);
                                      setIsInvoiceModalOpen(true);
                                    }}
                                  >
                                    <Receipt className="w-3.5 h-3.5 mr-1" />
                                    Dar Entrada NF
                                  </Button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: ORDENS DE COMPRA (FINANCEIRO) */}
          <TabsContent value="orders" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <CardTitle className="text-base font-bold text-zinc-100">
                  Ordens de Compra Direcionadas ao Financeiro
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Acompanhe e autorize o pagamento de OCs geradas a partir das 3 cotações de peças.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Número OC</th>
                        <th className="p-3.5">Fornecedor</th>
                        <th className="p-3.5">Item Solicitado</th>
                        <th className="p-3.5">Valor Total</th>
                        <th className="p-3.5">Condição</th>
                        <th className="p-3.5">Urgência</th>
                        <th className="p-3.5">Status Financeiro</th>
                        <th className="p-3.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {purchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-zinc-500">
                            Nenhuma Ordem de Compra registrada.
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders.map((po) => (
                          <tr key={po.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-zinc-100">{po.ocNumber}</td>
                            <td className="p-3.5 font-semibold text-zinc-200">{po.supplierName}</td>
                            <td className="p-3.5 text-zinc-300">
                              {po.quantity}x {po.itemName}
                            </td>
                            <td className="p-3.5 font-bold text-emerald-400">
                              R$ {(po.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3.5 text-amber-400 font-medium">{po.paymentTerms}</td>
                            <td className="p-3.5">
                              {po.urgency === 'EMERGENCIA' ? (
                                <Badge className="bg-red-600 text-white font-bold text-[10px]">EMERGÊNCIA</Badge>
                              ) : (
                                <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                                  NORMAL
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5">
                              <Badge
                                className={
                                  po.status === 'FINANCIAL_APPROVED'
                                    ? 'bg-blue-600 text-white'
                                    : po.status === 'DELIVERED_IN_ALMOXARIFADO'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-amber-600 text-white'
                                }
                              >
                                {po.statusDescription || po.status}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                                onClick={() => setSelectedPO(po)}
                              >
                                Ver Detalhes / Autorizar
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: ENTRADAS DE NOTA FISCAL & SLA */}
          <TabsContent value="invoices" className="space-y-4">
            <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <CardTitle className="text-base font-bold text-zinc-100">
                  Histórico de Notas Fiscais de Entrada & SLA de Liberação
                </CardTitle>
                <CardDescription className="text-xs text-zinc-400">
                  Registro de recebimento de peças no almoxarifado e tempo total (Lead Time) até liberação para a OS.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-800/60 text-zinc-400 uppercase tracking-wider font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3.5">Número da NF-e</th>
                        <th className="p-3.5">Fornecedor</th>
                        <th className="p-3.5">Item Recebido</th>
                        <th className="p-3.5">Valor Total</th>
                        <th className="p-3.5">Data / Hora Entrada</th>
                        <th className="p-3.5">OS Vinculada</th>
                        <th className="p-3.5">Lead Time / SLA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {invoiceEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-500">
                            Nenhuma entrada de NF-e registrada.
                          </td>
                        </tr>
                      ) : (
                        invoiceEntries.map((inv) => (
                          <tr key={inv.id} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="p-3.5 font-bold text-zinc-100">NF-e #{inv.invoiceNumber}</td>
                            <td className="p-3.5 text-zinc-200">{inv.supplierName}</td>
                            <td className="p-3.5 font-medium text-emerald-300">
                              {inv.quantityReceived}x {inv.stockItemName || 'Peça'}
                            </td>
                            <td className="p-3.5 font-bold text-zinc-100">
                              R$ {(inv.totalInvoiceCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3.5 text-zinc-400">
                              {new Date(inv.entryDate).toLocaleString('pt-BR')}
                            </td>
                            <td className="p-3.5 font-semibold text-amber-400">
                              {inv.workOrderNumber || 'Entrada Avulsa'}
                            </td>
                            <td className="p-3.5">
                              <Badge className="bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">
                                <Clock className="w-3 h-3 mr-1" /> {inv.formattedLeadTime || 'Imediato'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL 3 COTAÇÕES */}
      {selectedRequisitionForQuotes && (
        <TripleQuoteComparisonModal
          isOpen={!!selectedRequisitionForQuotes}
          onClose={() => setSelectedRequisitionForQuotes(null)}
          requisition={selectedRequisitionForQuotes}
          onApproved={loadAllData}
        />
      )}

      {/* MODAL ORDEM DE COMPRA */}
      {selectedPO && (
        <PurchaseOrderModal
          isOpen={!!selectedPO}
          onClose={() => setSelectedPO(null)}
          purchaseOrder={selectedPO}
          onStatusUpdated={loadAllData}
        />
      )}

      {/* MODAL ENTRADA DE NOTA FISCAL */}
      <InvoiceEntryModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedRequisitionForInvoice(null);
        }}
        purchaseOrder={selectedPO}
        requisition={selectedRequisitionForInvoice}
        onSuccess={loadAllData}
      />
    </StandardLayout>
  );
};

export default AlmoxarifadoRequisicoesPage;
