import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, FileText, Calendar, DollarSign, Building2, User, AlertTriangle, Eye, Edit, Trash, FileDown, Sparkles, Package, Wrench, Car, Clock } from 'lucide-react';
import { Quotation, QuotationStatus, quotationService } from '@/services/quotationService';
import { purchaseRequestService, PurchaseRequest } from '@/services/purchaseRequestService';
import { materialRequisitionService, MaterialRequisition } from '@/services/materialRequisitionService';
import { TripleQuoteComparisonModal } from '@/components/almoxarifado/TripleQuoteComparisonModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import QuotationFormModal from '@/components/QuotationFormModal';
import { QuotationViewModal } from '@/components/compras/QuotationViewModal';
import { PurchaseRequestViewModal } from '@/components/compras/PurchaseRequestViewModal';
import { QuotationReportModal } from '@/components/compras/QuotationReportModal';
import { QuotationReportViewModal } from '@/components/compras/QuotationReportViewModal';
import { quotationReportGenerator, QuotationReportFilters } from '@/utils/quotationReportGenerator';
import { QuotationBudgetUploadModal } from '@/components/compras/QuotationBudgetUploadModal';
import { ParsedBudgetData } from '@/utils/quotationBudgetParser';
import { PurchaseOrdersFinancialManager } from '@/components/financeiro/PurchaseOrdersFinancialManager';
import { CreditCard, ShoppingCart } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface QuotationFilters {
  status: QuotationStatus | 'ALL';
  supplier: string;
  assignedTo: string;
  dateRange: string;
}

const CotacoesCompras: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requisitions' | 'quotations' | 'orders'>('requisitions');
  const [requisitions, setRequisitions] = useState<MaterialRequisition[]>([]);
  const [filteredRequisitions, setFilteredRequisitions] = useState<MaterialRequisition[]>([]);
  const [selectedRequisitionForQuotes, setSelectedRequisitionForQuotes] = useState<MaterialRequisition | null>(null);
  const [isTripleQuoteModalOpen, setIsTripleQuoteModalOpen] = useState(false);
  const [loadingRequisitions, setLoadingRequisitions] = useState(true);

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [filteredQuotations, setFilteredQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingPurchaseRequest, setViewingPurchaseRequest] = useState<PurchaseRequest | null>(null);
  const [isPurchaseRequestViewOpen, setIsPurchaseRequestViewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportViewModalOpen, setIsReportViewModalOpen] = useState(false);
  const [reportPdfBlob, setReportPdfBlob] = useState<Blob | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isBudgetUploadModalOpen, setIsBudgetUploadModalOpen] = useState(false);
  const [parsedBudgetData, setParsedBudgetData] = useState<ParsedBudgetData | null>(null);
  const { toast } = useToast();
  const [filters, setFilters] = useState<QuotationFilters>({
    status: 'ALL',
    supplier: '',
    assignedTo: '',
    dateRange: ''
  });

  // Mock data for development
  const mockQuotations: Quotation[] = [
    {
      id: '1',
      quoteNumber: 'COT-2024-001',
      title: 'Equipamentos de Segurança',
      description: 'Cotação para equipamentos de proteção individual',
      supplierId: '1',
      supplierName: 'Fornecedor ABC Ltda',
      unitId: '1',
      unitName: 'Unidade Central',
      status: 'SENT',
      totalValue: 15000.00,
      validUntil: '2024-02-15',
      terms: 'Pagamento em 30 dias',
      paymentMethod: 'Boleto',
      deliveryMethod: 'Entrega no local',
      notes: 'Urgente para renovação do estoque',
      createdById: '1',
      createdByName: 'João Silva',
      assignedToId: '2',
      assignedToName: 'Maria Santos',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      quoteNumber: 'COT-2024-002',
      title: 'Material de Limpeza',
      description: 'Produtos de limpeza para todas as unidades',
      supplierId: '2',
      supplierName: 'Limpeza Total S.A.',
      unitId: '2',
      unitName: 'Unidade Norte',
      status: 'APPROVED',
      totalValue: 8500.00,
      validUntil: '2024-02-20',
      terms: 'Pagamento à vista com desconto',
      paymentMethod: 'PIX',
      deliveryMethod: 'Retirada no fornecedor',
      createdById: '2',
      createdByName: 'Maria Santos',
      assignedToId: '1',
      assignedToName: 'João Silva',
      createdAt: '2024-01-10T14:30:00Z',
      updatedAt: '2024-01-12T09:15:00Z'
    },
    {
      id: '3',
      quoteNumber: 'COT-2024-003',
      title: 'Uniformes Corporativos',
      description: 'Uniformes para equipe de segurança',
      supplierId: '3',
      supplierName: 'Confecções Uniformes Ltda',
      status: 'EXPIRED',
      totalValue: 12000.00,
      validUntil: '2024-01-10',
      terms: 'Pagamento em 45 dias',
      paymentMethod: 'Cartão',
      deliveryMethod: 'Entrega programada',
      createdById: '1',
      createdByName: 'João Silva',
      createdAt: '2023-12-20T16:45:00Z',
      updatedAt: '2024-01-11T08:00:00Z'
    }
  ];

  useEffect(() => {
    loadQuotations();
    loadRequisitions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quotations, requisitions, searchTerm, filters]);

  const loadRequisitions = async () => {
    try {
      setLoadingRequisitions(true);
      const data = await materialRequisitionService.listRequisitions();
      setRequisitions(data || []);
      setFilteredRequisitions(data || []);
    } catch (error) {
      console.error('Erro ao carregar requisições de material:', error);
      setRequisitions([]);
      setFilteredRequisitions([]);
    } finally {
      setLoadingRequisitions(false);
    }
  };

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await quotationService.getAll();
      // Mapear dados do backend para o formato esperado pelo frontend
      const mappedData = data.map((q: any) => {
        const mapped = {
          ...q,
          id: q.id?.toString() || q.id,
          supplierId: q.supplierId?.toString() || q.supplierId || q.supplier?.id?.toString() || q.supplier?.id || undefined,
          supplierName: q.supplierName || q.supplier?.name,
          purchaseRequestId: q.purchaseRequestId?.toString() || q.purchaseRequestId || undefined,
          purchaseRequestNumber: q.purchaseRequestNumber || q.purchaseRequest?.requestNumber,
          purchaseRequestTitle: q.purchaseRequestTitle || q.purchaseRequest?.title,
          unitId: q.unitId?.toString() || q.unitId || undefined,
          createdById: q.createdById?.toString() || q.createdById || undefined,
          assignedToId: q.assignedToId?.toString() || q.assignedToId || undefined,
          totalValue: typeof q.totalValue === 'string' ? parseFloat(q.totalValue) : (q.totalValue || 0),
          validUntil: q.validUntil ? (q.validUntil.includes('T') ? q.validUntil.split('T')[0] : q.validUntil) : q.validUntil,
          createdAt: q.createdAt || new Date().toISOString(),
          updatedAt: q.updatedAt || new Date().toISOString(),
          status: q.status || 'DRAFT'
        };
        return mapped;
      });
      setQuotations(mappedData);
    } catch (error) {
      console.error('Erro ao carregar cotações:', error);
      setQuotations([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    // Filtrar Cotações
    let filteredQ = quotations;
    if (searchTerm) {
      filteredQ = filteredQ.filter(quotation =>
        quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quotation.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.status !== 'ALL') {
      filteredQ = filteredQ.filter(quotation => quotation.status === filters.status);
    }
    if (filters.supplier) {
      filteredQ = filteredQ.filter(quotation => 
        quotation.supplierName?.toLowerCase().includes(filters.supplier.toLowerCase())
      );
    }
    if (filters.assignedTo) {
      filteredQ = filteredQ.filter(quotation => 
        quotation.assignedToName?.toLowerCase().includes(filters.assignedTo.toLowerCase())
      );
    }
    setFilteredQuotations(filteredQ);

    // Filtrar Requisições
    let filteredR = requisitions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredR = filteredR.filter(req =>
        req.requisitionNumber?.toLowerCase().includes(term) ||
        req.itemName?.toLowerCase().includes(term) ||
        req.itemCode?.toLowerCase().includes(term) ||
        req.workOrderNumber?.toLowerCase().includes(term) ||
        req.vehiclePlate?.toLowerCase().includes(term) ||
        req.vehicleModel?.toLowerCase().includes(term) ||
        req.requesterName?.toLowerCase().includes(term) ||
        req.justification?.toLowerCase().includes(term)
      );
    }
    setFilteredRequisitions(filteredR);
  };

  const getRequisitionStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING_QUOTES':
        return <Badge className="bg-amber-600 text-white font-medium">Aguardando 3 Cotações</Badge>;
      case 'QUOTES_RECEIVED':
        return <Badge className="bg-blue-600 text-white font-medium">Cotações Recebidas</Badge>;
      case 'APPROVED_BY_MANAGER':
        return <Badge className="bg-emerald-600 text-white font-medium">Aprovado p/ Gestor</Badge>;
      case 'OC_GENERATED':
        return <Badge className="bg-purple-600 text-white font-medium">OC Gerada</Badge>;
      case 'WAITING_DELIVERY':
        return <Badge className="bg-cyan-600 text-white font-medium">Aguardando Entrega</Badge>;
      case 'AVAILABLE_FOR_INSTALLATION':
        return <Badge className="bg-emerald-700 text-white font-medium">Disponível p/ Instalação</Badge>;
      case 'INSTALLED_COMPLETED':
        return <Badge className="bg-zinc-600 text-white font-medium">Instalado / Concluído</Badge>;
      case 'RESERVED_STOCK':
        return <Badge className="bg-indigo-600 text-white font-medium">Reservado no Estoque</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfig = {
      DRAFT: { label: 'Rascunho', variant: 'secondary' as const },
      SENT: { label: 'Enviada', variant: 'default' as const },
      APPROVED: { label: 'Aprovada', variant: 'success' as const },
      REJECTED: { label: 'Rejeitada', variant: 'destructive' as const },
      EXPIRED: { label: 'Expirada', variant: 'outline' as const }
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const isExpiringSoon = (validUntil: string) => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const handleCreateQuotation = () => {
    setSelectedQuotation(null);
    setShowModal(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setShowModal(true);
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setViewingQuotation(quotation);
    setIsViewModalOpen(true);
  };

  const handleOpenTripleQuotes = (req: MaterialRequisition) => {
    setSelectedRequisitionForQuotes(req);
    setIsTripleQuoteModalOpen(true);
  };

  const handleAskDeleteQuotation = (quotation: Quotation) => {
    setDeleteTarget(quotation);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await quotationService.remove(deleteTarget.id);
      await loadQuotations();
    } catch (error) {
      console.error('Erro ao excluir cotação:', error);
      alert('Não foi possível excluir a cotação. Tente novamente.');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleViewPurchaseRequestFromQuotation = async (purchaseRequestId: string) => {
    try {
      const data = await purchaseRequestService.getPurchaseRequestById(purchaseRequestId);
      setViewingPurchaseRequest(data);
      setIsPurchaseRequestViewOpen(true);
    } catch (error) {
      console.error('Erro ao carregar solicitação de compra:', error);
      alert('Não foi possível carregar a solicitação de compra.');
    }
  };

  const handleApplyBudgetToNewQuote = (data: ParsedBudgetData) => {
    setParsedBudgetData(data);
    setSelectedQuotation(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedQuotation(null);
    setParsedBudgetData(null);
    loadQuotations();
  };

  const handleGenerateReport = async (reportFilters: QuotationReportFilters) => {
    setIsGeneratingReport(true);
    try {
      const pdfBlob = await quotationReportGenerator.generatePDF(quotations, reportFilters);
      setReportPdfBlob(pdfBlob);
      setIsReportModalOpen(false);
      setIsReportViewModalOpen(true);
      toast({
        title: "Sucesso",
        description: "Relatório gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const pendingQuotesCount = requisitions.filter(
    r => r.status === 'WAITING_QUOTES' || r.status === 'QUOTES_RECEIVED'
  ).length;

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-amber-400" />
              Cotações de Compras & Requisições
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Gerencie as 3 cotações obrigatórias de peças e cotações gerais de fornecedores com rastreabilidade de OS, Solicitante e Justificativa.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsBudgetUploadModalOpen(true)}
              className="border-blue-500/50 bg-blue-900/30 text-blue-200 hover:bg-blue-800/60 hover:text-white font-semibold"
            >
              <Sparkles className="mr-2 h-4 w-4 text-blue-400 animate-pulse" />
              Analisar Orçamento Fornecedor
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(true)}
              className="border-zinc-700 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Relatório PDF
            </Button>
            <Button
              onClick={handleCreateQuotation}
              className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Cotação Geral
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Requisições Pendentes Cotação</CardTitle>
              <Package className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-400">{pendingQuotesCount}</div>
              <p className="text-xs text-zinc-500 mt-1">Aguardando cotação de peças</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Total Cotações Cadastradas</CardTitle>
              <FileText className="h-4 w-4 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotations.length}</div>
              <p className="text-xs text-zinc-500 mt-1">Cotações diretas de fornecedores</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Cotações Aprovadas</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">
                {quotations.filter(q => q.status === 'APPROVED').length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Ordens de compra autorizadas</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">Emergências na Frota</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">
                {requisitions.filter(r => r.urgency === 'EMERGENCIA' && r.status !== 'INSTALLED_COMPLETED').length}
              </div>
              <p className="text-xs text-zinc-500 mt-1">Veículos parados aguardando peça</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 space-x-2">
          <button
            onClick={() => setActiveTab('requisitions')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'requisitions'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Package className="w-4 h-4" />
            Requisições de Peças & OS (3 Cotações)
            {pendingQuotesCount > 0 && (
              <Badge className="ml-1.5 bg-amber-500 text-zinc-950 font-bold px-1.5 py-0.2 text-[11px]">
                {pendingQuotesCount}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'quotations'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cotações de Fornecedores Cadastradas ({quotations.length})
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-lg'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Ordens de Compra & Programação Financeira
          </button>
        </div>

        {/* Filter Bar (Only on Requisitions and Quotations tabs) */}
        {activeTab !== 'orders' && (
        <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium text-zinc-300">Pesquisa & Filtros Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder={
                    activeTab === 'requisitions'
                      ? "Buscar por Item, OS, Placa, Solicitante ou Motivo..."
                      : "Buscar cotações por título, fornecedor..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-950 border-zinc-700 text-zinc-100"
                />
              </div>

              {activeTab === 'quotations' && (
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as QuotationStatus | 'ALL' }))}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-100">
                    <SelectValue placeholder="Status da Cotação" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="ALL">Todos os Status</SelectItem>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="SENT">Enviada</SelectItem>
                    <SelectItem value="APPROVED">Aprovada</SelectItem>
                    <SelectItem value="REJECTED">Rejeitada</SelectItem>
                    <SelectItem value="EXPIRED">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {activeTab === 'quotations' && (
                <Input
                  placeholder="Fornecedor..."
                  value={filters.supplier}
                  onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                  className="bg-zinc-950 border-zinc-700 text-zinc-100"
                />
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    status: 'ALL',
                    supplier: '',
                    assignedTo: '',
                    dateRange: ''
                  });
                }}
                className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
        )}

        {/* TAB 1: REQUISIÇÕES DE PEÇAS & OS (3 COTAÇÕES OBRIGATÓRIAS) */}
        {activeTab === 'requisitions' && (
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl">
            <CardHeader className="border-b border-zinc-800/80 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-400" />
                    Requisições de Peças com Rastreabilidade Completa
                  </CardTitle>
                  <p className="text-xs text-zinc-400 mt-1">
                    Cada item informa o solicitante (quem), motivo/justificativa (por quê), veículo e OS de destino para o processo de 3 cotações.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadRequisitions}
                  className="border-zinc-700 bg-zinc-800 text-xs text-zinc-300"
                >
                  Atualizar Lista
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingRequisitions ? (
                <div className="flex justify-center items-center h-40">
                  <div className="text-zinc-400 text-sm">Carregando requisições de compra...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-950/60 border-b border-zinc-800">
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-semibold text-xs">Nº Req & Data</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs">Item & Quantidade Solicitada</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs">OS & Veículo</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs">Solicitado Por (Quem)</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs max-w-xs">Motivo / Justificativa (Por quê)</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs">Prioridade</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs">Status da Cotação</TableHead>
                        <TableHead className="text-zinc-400 font-semibold text-xs text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequisitions.map((req) => (
                        <TableRow
                          key={req.id}
                          className="border-zinc-800/80 hover:bg-zinc-800/50 transition-colors"
                        >
                          <TableCell className="font-mono text-xs">
                            <span className="font-bold text-amber-300 block">{req.requisitionNumber}</span>
                            <span className="text-[11px] text-zinc-400">
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString('pt-BR') : '-'}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-zinc-100 text-sm block">
                                {req.itemName}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-amber-400 font-mono">
                                <span>Qtd: {req.quantity} {req.unit || 'un'}</span>
                                {req.itemCode && (
                                  <span className="text-zinc-400 text-[11px]">| Cód: {req.itemCode}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-0.5 text-xs">
                              {req.workOrderNumber ? (
                                <span className="font-semibold text-zinc-200 block">
                                  🔧 OS: {req.workOrderNumber}
                                </span>
                              ) : (
                                <span className="text-zinc-500 block">Sem OS</span>
                              )}
                              {req.vehiclePlate && (
                                <span className="text-zinc-300 font-mono text-[11px] block">
                                  🚗 {req.vehiclePlate} {req.vehicleModel ? `(${req.vehicleModel})` : ''}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-xs">
                              <span className="font-medium text-zinc-200 block">
                                👤 {req.requesterName || 'Mecânico / Solicitante'}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="max-w-xs">
                            <p className="text-xs text-zinc-300 italic line-clamp-2" title={req.justification}>
                              "{req.justification || 'Solicitação de compra de peça para manutenção.'}"
                            </p>
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                req.urgency === 'EMERGENCIA'
                                  ? 'border-red-500 text-red-400 bg-red-950/40 text-[11px] font-bold'
                                  : 'border-zinc-700 text-zinc-300 bg-zinc-800/60 text-[11px]'
                              }
                            >
                              {req.urgency === 'EMERGENCIA' ? '🚨 Emergência' : '🟢 Normal'}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {getRequisitionStatusBadge(req.status)}
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => handleOpenTripleQuotes(req)}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              Lançar / Analisar 3 Cotações
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}

                      {filteredRequisitions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <div className="text-zinc-400 text-sm">
                              {searchTerm
                                ? 'Nenhuma requisição encontrada com os filtros aplicados.'
                                : 'Nenhuma requisição de compra cadastrada no momento.'}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: COTAÇÕES DE FORNECEDORES GERAIS */}
        {activeTab === 'quotations' && (
          <Card className="bg-zinc-900 border-zinc-800 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-zinc-100">Lista de Cotações Cadastradas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-zinc-400">Carregando cotações...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-950/60 border-b border-zinc-800">
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Número</TableHead>
                        <TableHead className="text-zinc-400">Título / Descrição</TableHead>
                        <TableHead className="text-zinc-400">Fornecedor</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Valor Total</TableHead>
                        <TableHead className="text-zinc-400">Válida Até</TableHead>
                        <TableHead className="text-zinc-400">Responsável</TableHead>
                        <TableHead className="text-zinc-400">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuotations.map((quotation) => (
                        <TableRow key={quotation.id} className="border-zinc-800 hover:bg-zinc-800/50">
                          <TableCell className="font-medium text-amber-300 font-mono text-xs">
                            {quotation.quoteNumber}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-zinc-100">{quotation.title}</div>
                              {quotation.description && (
                                <div className="text-xs text-zinc-400 truncate max-w-xs">
                                  {quotation.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-xs text-zinc-300">
                              <Building2 className="mr-2 h-4 w-4 text-zinc-500" />
                              {quotation.supplierName || 'Não informado'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(quotation.status)}
                              {isExpiringSoon(quotation.validUntil) && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" title="Expira em breve" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-400 font-mono text-xs">
                            {formatCurrency(quotation.totalValue)}
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                              {formatDate(quotation.validUntil)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300">
                            <div className="flex items-center">
                              <User className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                              {quotation.assignedToName || 'Não atribuído'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewQuotation(quotation)}
                                title="Visualizar"
                                className="text-zinc-300 hover:text-white"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditQuotation(quotation)}
                                title="Editar"
                                className="text-zinc-300 hover:text-white"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAskDeleteQuotation(quotation)}
                                title="Excluir"
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredQuotations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="text-zinc-400">
                              {searchTerm || filters.status !== 'ALL' || filters.supplier || filters.assignedTo
                                ? 'Nenhuma cotação encontrada com os filtros aplicados.'
                                : 'Nenhuma cotação cadastrada ainda.'}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: ORDENS DE COMPRA & PROGRAMAÇÃO FINANCEIRA */}
        {activeTab === 'orders' && (
          <PurchaseOrdersFinancialManager />
        )}
      </div>

      {/* Modal de 3 Cotações Inteligentes */}
      {isTripleQuoteModalOpen && selectedRequisitionForQuotes && (
        <TripleQuoteComparisonModal
          isOpen={isTripleQuoteModalOpen}
          onClose={() => {
            setIsTripleQuoteModalOpen(false);
            setSelectedRequisitionForQuotes(null);
          }}
          requisition={selectedRequisitionForQuotes}
          onApproved={() => {
            loadRequisitions();
            loadQuotations();
          }}
        />
      )}

      {/* Modal de Criação / Edição de Cotação */}
      {showModal && (
        <QuotationFormModal
          quotation={selectedQuotation}
          initialParsedBudget={parsedBudgetData}
          onClose={handleModalClose}
        />
      )}

      {/* Modal de Análise e Upload de Orçamentos do Fornecedor */}
      <QuotationBudgetUploadModal
        isOpen={isBudgetUploadModalOpen}
        onClose={() => setIsBudgetUploadModalOpen(false)}
        onApplyParsedBudget={handleApplyBudgetToNewQuote}
      />

      {/* Modal de Visualização */}
      <QuotationViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingQuotation(null);
        }}
        quotation={viewingQuotation}
        onViewPurchaseRequest={handleViewPurchaseRequestFromQuotation}
      />

      <PurchaseRequestViewModal
        isOpen={isPurchaseRequestViewOpen}
        onClose={() => {
          setIsPurchaseRequestViewOpen(false);
          setViewingPurchaseRequest(null);
        }}
        request={viewingPurchaseRequest || undefined}
        onQuotationCreated={loadQuotations}
      />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {deleteTarget
                ? `Deseja realmente excluir a cotação ${deleteTarget.quoteNumber}?`
                : 'Deseja realmente excluir esta cotação?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-500"
              onClick={handleConfirmDelete}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Relatório */}
      <QuotationReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onGenerate={handleGenerateReport}
        loading={isGeneratingReport}
      />

      {/* Modal de Visualização do Relatório */}
      <QuotationReportViewModal
        isOpen={isReportViewModalOpen}
        onClose={() => {
          setIsReportViewModalOpen(false);
          setReportPdfBlob(null);
        }}
        pdfBlob={reportPdfBlob}
        fileName={`relatorio-cotacoes-${new Date().toISOString().split('T')[0]}.pdf`}
      />
    </StandardLayout>
  );
};

export default CotacoesCompras;