import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  PurchaseRequest, 
  purchaseRequestService,
  CreatePurchaseRequestRequest 
} from '@/services/purchaseRequestService';
import { PurchaseRequestFormModal } from '@/components/compras/PurchaseRequestFormModal';
import { PurchaseRequestViewModal } from '@/components/compras/PurchaseRequestViewModal';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';
import { SupplierImportModal } from '@/components/compras/SupplierImportModal';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingCart, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  FileText,
  Building2,
  ToggleLeft,
  ToggleRight,
  FileDown,
  Upload,
  Database
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import { PurchaseRequestReportModal } from '@/components/compras/PurchaseRequestReportModal';
import { PurchaseRequestReportViewModal } from '@/components/compras/PurchaseRequestReportViewModal';
import { purchaseRequestReportGenerator, PurchaseRequestReportFilters } from '@/utils/purchaseRequestReportGenerator';

export default function Compras() {
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<PurchaseRequest | undefined>();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isReportViewModalOpen, setIsReportViewModalOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [reportFileName, setReportFileName] = useState<string>('');
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Determinar tab ativa baseado na URL
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/fornecedores')) return 'fornecedores';
    if (path.includes('/solicitacoes') || path.includes('/aprovacoes') || path.includes('/relatorios')) return 'solicitacoes';
    if (path === '/compras') return 'solicitacoes'; // default para /compras
    return 'solicitacoes'; // default
  };
  
  // Determinar tab de solicitação ativa baseado na URL
  const getActiveRequestTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/aprovacoes')) return 'approved';
    if (path.includes('/solicitacoes')) return 'all';
    return 'all';
  };
  
  const [activeMainTab, setActiveMainTab] = useState(getActiveTabFromPath());
  const [activeRequestTab, setActiveRequestTab] = useState(() => {
    const path = location.pathname;
    if (path.includes('/aprovacoes')) return 'approved';
    return 'all';
  });
  
  // Atualizar tab quando a rota mudar
  useEffect(() => {
    const tab = getActiveTabFromPath();
    setActiveMainTab(tab);
    
    // Atualizar tab de solicitação baseado na rota
    const requestTab = getActiveRequestTabFromPath();
    setActiveRequestTab(requestTab);
    
    // Se estiver em /compras sem subrota, redirecionar para /compras/solicitacoes
    if (location.pathname === '/compras') {
      navigate('/compras/solicitacoes', { replace: true });
    }
  }, [location.pathname, navigate]);
  
  // Navegar quando a tab mudar
  const handleTabChange = (value: string) => {
    setActiveMainTab(value);
    if (value === 'solicitacoes') {
      navigate('/compras/solicitacoes');
    } else if (value === 'fornecedores') {
      navigate('/compras/fornecedores');
    }
  };
  
  // Navegar quando a tab de solicitação mudar
  const handleRequestTabChange = (value: string) => {
    setActiveRequestTab(value);
    if (value === 'approved') {
      navigate('/compras/aprovacoes');
    } else if (value === 'all') {
      navigate('/compras/solicitacoes');
    } else {
      navigate('/compras/solicitacoes');
    }
  };
  
  // Estados para Fornecedores
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isSupplierImportModalOpen, setIsSupplierImportModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    urgentRequests: 0,
    overdueRequests: 0,
    totalValue: 0,
  });

  useEffect(() => {
    loadPurchaseRequests();
    loadStats();
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [purchaseRequests, searchTerm, statusFilter, priorityFilter, activeRequestTab]);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, supplierSearchTerm]);

  const loadPurchaseRequests = async () => {
    try {
      setLoading(true);
      const data = await purchaseRequestService.getAllPurchaseRequests();
      setPurchaseRequests(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar solicitações de compra.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [allRequests, pendingCount, urgentRequests, overdueRequests] = await Promise.all([
        purchaseRequestService.getAllPurchaseRequests(),
        purchaseRequestService.getRequestsCountByStatus('PENDING'),
        purchaseRequestService.getUrgentRequests(),
        purchaseRequestService.getOverdueRequests(),
      ]);

      const totalValue = allRequests.reduce(
        (sum: number, req: PurchaseRequest) => sum + (req.totalValue || req.estimatedTotal || 0),
        0
      );

      setStats(prevStats => ({
        ...prevStats,
        totalRequests: allRequests.length,
        pendingRequests: pendingCount,
        urgentRequests: urgentRequests.length,
        overdueRequests: overdueRequests.length,
        totalValue,
      }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterRequests = () => {
    let filtered = purchaseRequests;

    // Filtro por aba ativa
    switch (activeRequestTab) {
      case 'pending':
        filtered = filtered.filter(req => req.status === 'PENDING');
        break;
      case 'approved':
        filtered = filtered.filter(req => req.status === 'APPROVED');
        break;
      case 'rejected':
        filtered = filtered.filter(req => req.status === 'REJECTED');
        break;
      case 'urgent':
        filtered = filtered.filter(req => req.urgent);
        break;
      case 'overdue':
        filtered = filtered.filter(req => req.overdue);
        break;
    }

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // Filtro por prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(req => req.priority === priorityFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleCreateRequest = async (requestData: CreatePurchaseRequestRequest): Promise<PurchaseRequest> => {
    try {
      const savedRequest = await purchaseRequestService.createPurchaseRequest(requestData);
      await loadPurchaseRequests();
      await loadStats();
      setIsModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Solicitação de compra criada com sucesso!",
      });
      return savedRequest;
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateRequest = async (requestData: any): Promise<PurchaseRequest> => {
    try {
      const savedRequest = await purchaseRequestService.updatePurchaseRequest(requestData.id, requestData);
      await loadPurchaseRequests();
      await loadStats();
      setIsModalOpen(false);
      setEditingRequest(undefined);
      toast({
        title: "Sucesso",
        description: "Solicitação de compra atualizada com sucesso!",
      });
      return savedRequest;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      try {
        await purchaseRequestService.deletePurchaseRequest(id);
        await loadPurchaseRequests();
        await loadStats();
        toast({
          title: "Sucesso",
          description: "Solicitação excluída com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir solicitação.",
          variant: "destructive",
        });
      }
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      const approverName = user?.name || 'Sistema';
      await purchaseRequestService.approveRequest(id, approverName, 'Aprovado via sistema');
      await loadPurchaseRequests();
      await loadStats();
      toast({
        title: "Sucesso",
        description: "Solicitação aprovada com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao aprovar solicitação.",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (id: string) => {
    const reason = window.prompt('Motivo da rejeição:');
    if (reason) {
      try {
        await purchaseRequestService.rejectRequest(id, 'Sistema', reason);
        await loadPurchaseRequests();
        await loadStats();
        toast({
          title: "Sucesso",
          description: "Solicitação rejeitada com sucesso!",
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao rejeitar solicitação.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditRequest = (request: PurchaseRequest) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };

  const handleViewRequest = (request: PurchaseRequest) => {
    setViewingRequest(request);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRequest(undefined);
  };

  // Funções para Fornecedores
  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await contasAPagarService.getFornecedores();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores.",
        variant: "destructive",
      });
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;
    
    if (supplierSearchTerm) {
      const search = supplierSearchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        (s.name || '').toLowerCase().includes(search) ||
        (s.cnpj || '').toLowerCase().includes(search) ||
        (s.email || '').toLowerCase().includes(search) ||
        (s.city || '').toLowerCase().includes(search) ||
        (s.state || '').toLowerCase().includes(search)
      );
    }
    
    setFilteredSuppliers(filtered);
  };

  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (data: CreateSupplierRequest) => {
    try {
      if (editingSupplier) {
        await contasAPagarService.updateFornecedor(editingSupplier.id, data);
        toast({
          title: "Sucesso",
          description: "Fornecedor atualizado com sucesso!",
        });
      } else {
        await contasAPagarService.createFornecedor(data);
        toast({
          title: "Sucesso",
          description: "Fornecedor criado com sucesso!",
        });
      }
      await loadSuppliers();
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
    } catch (error: any) {
      let msg = 'Não foi possível salvar o fornecedor.';
      
      // Tratar erro de CNPJ duplicado (409 Conflict)
      if (error?.response?.status === 409) {
        msg = error?.response?.data?.message || 'Já existe um fornecedor cadastrado com este CNPJ.';
      } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
      }
      
      toast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!window.confirm(`Tem certeza que deseja excluir o fornecedor "${supplier.name}"?`)) {
      return;
    }
    
    try {
      await contasAPagarService.deleteFornecedor(supplier.id);
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso!",
      });
      await loadSuppliers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir fornecedor.",
        variant: "destructive",
      });
    }
  };

  const handleToggleSupplierStatus = async (supplier: Supplier) => {
    try {
      await contasAPagarService.toggleFornecedorStatus(supplier.id);
      toast({
        title: "Sucesso",
        description: `Fornecedor ${supplier.isActive ? 'desativado' : 'ativado'} com sucesso!`,
      });
      await loadSuppliers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status do fornecedor.",
        variant: "destructive",
      });
    }
  };

  const handleCloseSupplierModal = () => {
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SUBMITTED: 'Enviada',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      IN_PROCESS: 'Em processo',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
      PENDING: 'Pendente',
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      URGENT: 'Urgente',
      HIGH: 'Alta',
      MEDIUM: 'Média',
      LOW: 'Baixa',
    };
    return labels[priority] || priority;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'SUBMITTED': return 'bg-indigo-100 text-indigo-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROCESS': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number | string) => {
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? parseFloat(value.replace(/\./g, '').replace(',', '.'))
          : 0;
    const numeric = Number.isFinite(numericValue) ? numericValue : 0;
    // Garante exatamente 2 casas decimais usando toFixed
    const rounded = parseFloat(numeric.toFixed(2));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleGenerateReport = async (filters: PurchaseRequestReportFilters) => {
    try {
      setGeneratingReport(true);
      const blob = await purchaseRequestReportGenerator.generatePDF(purchaseRequests, filters);
      const fileName = `relatorio-solicitacoes-compra-${new Date().toISOString().split('T')[0]}.pdf`;
      
      setPdfBlob(blob);
      setReportFileName(fileName);
      setIsReportModalOpen(false);
      setIsReportViewModalOpen(true);
      
      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <MainLayout title="Gestão de Compras" subtitle="Controle completo de solicitações e processos de compra">
      <div className="space-y-6">
        {/* Tabs principais */}
        <Tabs value={activeMainTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-seguranca-graphite border-gray-600">
            <TabsTrigger value="solicitacoes" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
              <Building2 className="w-4 h-4 mr-2" />
              Fornecedores
            </TabsTrigger>
          </TabsList>

          {/* Aba de Solicitações */}
          <TabsContent value="solicitacoes" className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReportModalOpen(true)}
                className="border-gray-600 text-seguranca-lightgray hover:bg-gray-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Gerar Relatório PDF
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Solicitação
              </Button>
            </div>

            {/* Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Solicitações</p>
                  <p className="text-2xl font-bold">{stats.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Urgentes</p>
                  <p className="text-2xl font-bold text-red-600">{stats.urgentRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Valor Total</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Filtros */}
            <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  <SelectItem value="COMPLETED">Concluído</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadPurchaseRequests}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

            {/* Tabs de Solicitações */}
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeRequestTab} onValueChange={handleRequestTabChange}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">Todas</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes</TabsTrigger>
                    <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                    <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
                    <TabsTrigger value="urgent">Urgentes</TabsTrigger>
                    <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeRequestTab} className="mt-6">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Título</TableHead>
                          <TableHead>Solicitante</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Prioridade</TableHead>
                          {activeRequestTab === 'approved' && <TableHead>Aprovador por</TableHead>}
                          <TableHead>Data Necessária</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <div className="font-medium">{request.requestNumber}</div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{request.title}</div>
                                {request.description && (
                                  <div className="text-sm text-muted-foreground truncate max-w-xs">
                                    {request.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {request.requesterName && <div>{request.requesterName}</div>}
                                {request.unitName && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.unitName}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <Badge className={getStatusColor(request.status)}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                                {request.urgent && (
                                  <Badge variant="destructive" className="text-xs">
                                    Urgente
                                  </Badge>
                                )}
                                {request.overdue && (
                                  <Badge variant="outline" className="text-xs">
                                    Atrasado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(request.priority)}>
                                {getPriorityLabel(request.priority)}
                              </Badge>
                            </TableCell>
                            {activeRequestTab === 'approved' && (
                              <TableCell>
                                <div className="text-sm">
                                  {request.approverName || request.approvedBy || '-'}
                                  {request.approvalDate && (
                                    <div className="text-xs text-muted-foreground">
                                      {formatDate(request.approvalDate)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(request.requiredDate)}
                                {request.daysUntilRequired !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.daysUntilRequired > 0 
                                      ? `${request.daysUntilRequired} dias`
                                      : 'Vencido'
                                    }
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatCurrency(request.totalValue || request.estimatedTotal || 0)}
                                {request.totalItems && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.totalItems} itens
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <TooltipProvider>
                                <div className="flex items-center space-x-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewRequest(request)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Visualizar Solicitação</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditRequest(request)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar Solicitação</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  {request.status === 'PENDING' && (
                                    <>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleApproveRequest(request.id)}
                                            className="text-green-600"
                                          >
                                            <CheckCircle className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Aprovar Solicitação</p>
                                        </TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRejectRequest(request.id)}
                                            className="text-red-600"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Rejeitar Solicitação</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </>
                                  )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteRequest(request.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir Solicitação</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Fornecedores */}
          <TabsContent value="fornecedores" className="space-y-6">
            {/* Header Fornecedores */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-seguranca-red" />
                  Gestão de Fornecedores
                </h2>
                <p className="text-muted-foreground">
                  Cadastro e gerenciamento de fornecedores
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSupplierImportModalOpen(true)}
                  className="border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 font-semibold"
                >
                  <Upload className="w-4 h-4 mr-2 text-amber-400" />
                  Importar (PDF / Excel)
                </Button>
                <Button onClick={handleCreateSupplier} className="bg-seguranca-red hover:bg-seguranca-darkred">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </div>
            </div>

            {/* Filtros Fornecedores */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nome, CNPJ, email, cidade ou estado..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Button variant="outline" onClick={loadSuppliers} disabled={loadingSuppliers}>
                    <RefreshCw className={`w-4 h-4 ${loadingSuppliers ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tabela de Fornecedores */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSuppliers ? (
                  <div className="flex justify-center items-center h-32">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : filteredSuppliers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum fornecedor encontrado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CNPJ</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Cidade/Estado</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSuppliers.map((supplier) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">
                              {supplier.name}
                              {supplier.category && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {supplier.category}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{supplier.cnpj || '—'}</TableCell>
                            <TableCell>{supplier.email || '—'}</TableCell>
                            <TableCell>{supplier.phone || '—'}</TableCell>
                            <TableCell>
                              {supplier.city || '—'} {supplier.state ? `- ${supplier.state}` : ''}
                            </TableCell>
                            <TableCell>
                              <Badge variant={supplier.isActive !== false ? "default" : "secondary"}>
                                {supplier.isActive !== false ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSupplier(supplier)}
                                  title="Editar"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleSupplierStatus(supplier)}
                                  title={supplier.isActive !== false ? "Desativar" : "Ativar"}
                                >
                                  {supplier.isActive !== false ? (
                                    <ToggleRight className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <ToggleLeft className="w-4 h-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteSupplier(supplier)}
                                  title="Excluir"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Formulário de Solicitação */}
        <PurchaseRequestFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={editingRequest}
          onSave={editingRequest ? handleUpdateRequest : handleCreateRequest}
          loading={loading}
        />

        {/* Modal de Visualização de Solicitação */}
        <PurchaseRequestViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingRequest(undefined);
          }}
          request={viewingRequest}
        />

        {/* Modal de Formulário de Fornecedor */}
        <SupplierFormModal
          isOpen={isSupplierModalOpen}
          onClose={handleCloseSupplierModal}
          supplier={editingSupplier}
          onSave={handleSaveSupplier}
        />

        {/* Modal de Importação de Fornecedores (PDF / Excel) */}
        <SupplierImportModal
          isOpen={isSupplierImportModalOpen}
          onClose={() => setIsSupplierImportModalOpen(false)}
          onSuccess={loadSuppliers}
        />

        {/* Modal de Relatório */}
        <PurchaseRequestReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onGenerate={handleGenerateReport}
          loading={generatingReport}
        />

        {/* Modal de Visualização do PDF */}
        <PurchaseRequestReportViewModal
          isOpen={isReportViewModalOpen}
          onClose={() => {
            setIsReportViewModalOpen(false);
            if (pdfBlob) {
              URL.revokeObjectURL(URL.createObjectURL(pdfBlob));
              setPdfBlob(null);
            }
          }}
          pdfBlob={pdfBlob}
          fileName={reportFileName}
        />
      </div>
    </MainLayout>
  );
}