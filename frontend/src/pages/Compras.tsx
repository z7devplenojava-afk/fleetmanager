import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  PurchaseRequest, 
  purchaseRequestService,
  CreatePurchaseRequestRequest 
} from '@/services/purchaseRequestService';
import { PurchaseRequestFormModal } from '@/components/compras/PurchaseRequestFormModal';
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
  FileText
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';

export default function Compras() {
  const { toast } = useToast();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  
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
  }, []);

  useEffect(() => {
    filterRequests();
  }, [purchaseRequests, searchTerm, statusFilter, priorityFilter, activeTab]);

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
      const [
        pendingCount,
        urgentRequests,
        overdueRequests
      ] = await Promise.all([
        purchaseRequestService.getRequestsCountByStatus('PENDING'),
        purchaseRequestService.getUrgentRequests(),
        purchaseRequestService.getOverdueRequests(),
      ]);

      setStats(prevStats => ({
        ...prevStats,
        totalRequests: purchaseRequests.length,
        pendingRequests: pendingCount,
        urgentRequests: urgentRequests.length,
        overdueRequests: overdueRequests.length,
        totalValue: purchaseRequests.reduce((sum, req) => sum + (req.totalValue || 0), 0),
      }));
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterRequests = () => {
    let filtered = purchaseRequests;

    // Filtro por aba ativa
    switch (activeTab) {
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

  const handleCreateRequest = async (requestData: CreatePurchaseRequestRequest) => {
    try {
      await purchaseRequestService.createPurchaseRequest(requestData);
      await loadPurchaseRequests();
      await loadStats();
      setIsModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Solicitação de compra criada com sucesso!",
      });
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateRequest = async (requestData: any) => {
    try {
      await purchaseRequestService.updatePurchaseRequest(requestData.id, requestData);
      await loadPurchaseRequests();
      await loadStats();
      setIsModalOpen(false);
      setEditingRequest(undefined);
      toast({
        title: "Sucesso",
        description: "Solicitação de compra atualizada com sucesso!",
      });
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
      await purchaseRequestService.approveRequest(id, 'Sistema', 'Aprovado via sistema');
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRequest(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <MainLayout title="Gestão de Compras" subtitle="Controle de solicitações e processos de compra">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Compras</h1>
            <p className="text-muted-foreground">
              Controle completo de solicitações e processos de compra
            </p>
          </div>
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

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendentes</TabsTrigger>
                <TabsTrigger value="approved">Aprovadas</TabsTrigger>
                <TabsTrigger value="rejected">Rejeitadas</TabsTrigger>
                <TabsTrigger value="urgent">Urgentes</TabsTrigger>
                <TabsTrigger value="overdue">Atrasadas</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
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
                                  {request.status}
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
                                {request.priority}
                              </Badge>
                            </TableCell>
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
                                {formatCurrency(request.totalValue || 0)}
                                {request.totalItems && (
                                  <div className="text-xs text-muted-foreground">
                                    {request.totalItems} itens
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRequest(request)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {request.status === 'PENDING' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApproveRequest(request.id)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRejectRequest(request.id)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRequest(request.id)}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modal de Formulário */}
        <PurchaseRequestFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          request={editingRequest}
          onSave={editingRequest ? handleUpdateRequest : handleCreateRequest}
          loading={loading}
        />
      </div>
    </MainLayout>
  );
}