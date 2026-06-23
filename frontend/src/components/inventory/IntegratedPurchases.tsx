import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingUp,
  Building2,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { InventoryRequest, CreatePurchaseRequestRequest, Supplier, CreateSupplierRequest } from '@/services/mockUnifiedInventoryService';

export default function IntegratedPurchases() {
  const {
    items,
    itemsNeedingPurchase,
    purchaseRequests,
    suppliers,
    loadingItems,
    loadingPurchases,
    loadingSuppliers,
    dashboardData,
    createPurchaseRequest,
    approvePurchaseRequest,
    generatePurchaseFromServiceOrder,
    createSupplier,
    getItemsNeedingPurchaseCount,
    getCriticalItemsCount,
    getOutOfStockItemsCount,
    getPendingPurchaseRequestsCount,
    getUrgentPurchaseRequestsCount,
    refreshData
  } = useUnifiedInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('requests');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');

  const filteredRequests = purchaseRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requesterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredSuppliers = suppliers.filter(supplier => {
    const search = supplierSearchTerm.toLowerCase();
    return supplier.name.toLowerCase().includes(search) ||
           (supplier.cnpj || '').toLowerCase().includes(search) ||
           (supplier.email || '').toLowerCase().includes(search) ||
           (supplier.city || '').toLowerCase().includes(search) ||
           (supplier.state || '').toLowerCase().includes(search);
  });

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Rascunho',
      SUBMITTED: 'Enviada',
      PENDING: 'Pendente',
      APPROVED: 'Aprovada',
      REJECTED: 'Rejeitada',
      IN_PROCESS: 'Em processo',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada',
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
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
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
    const numericValue = typeof value === 'number' ? value : parseFloat(value.replace(/\./g, '').replace(',', '.'));
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(numericValue || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleCreateRequest = async (requestData: CreatePurchaseRequestRequest) => {
    try {
      await createPurchaseRequest(requestData);
      setShowNewRequestModal(false);
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      await approvePurchaseRequest(requestId);
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
    }
  };

  const handleCreateSupplier = async (supplierData: CreateSupplierRequest) => {
    try {
      await createSupplier(supplierData);
      setShowNewSupplierModal(false);
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    }
  };

  const handleGenerateAutoPurchase = async () => {
    try {
      if (itemsNeedingPurchase.length === 0) {
        alert('Não há itens que precisam de compra no momento.');
        return;
      }
      
      const response = confirm(
        `Gerar solicitação de compra automática para ${itemsNeedingPurchase.length} item(ns) com estoque baixo?\n\n` +
        `Itens:\n${itemsNeedingPurchase.map(item => `• ${item.name} (Atual: ${item.quantity}, Mínimo: ${item.minimumQuantity})`).join('\n')}`
      );
      
      if (response) {
        await createPurchaseRequest({
          title: `Compra Automática - ${new Date().toLocaleDateString('pt-BR')}`,
          description: `Solicitação gerada automaticamente para ${itemsNeedingPurchase.length} item(ns) com estoque baixo`,
          priority: itemsNeedingPurchase.some(item => item.quantity <= item.minimumQuantity / 2) ? 'URGENT' : 'MEDIUM',
          urgency: itemsNeedingPurchase.some(item => item.quantity === 0) ? 'IMMEDIATE' : 'NORMAL',
          justification: 'Compra gerada automaticamente pelo sistema devido a níveis críticos de estoque'
        });
      }
    } catch (error) {
      console.error('Erro ao gerar compra automática:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras Integradas</h1>
          <p className="text-muted-foreground">Gestão de compras com integração automática ao estoque</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={refreshData} variant="outline" disabled={loadingItems || loadingPurchases}>
            <RefreshCw className={`w-4 h-4 ${loadingItems || loadingPurchases ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setShowNewRequestModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      {/* Dashboard Unificado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Itens Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getCriticalItemsCount()}</div>
            <p className="text-xs text-muted-foreground">Abaixo de 50% do mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sem Estoque</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{getOutOfStockItemsCount()}</div>
            <p className="text-xs text-muted-foreground">Quantidade zero</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precisam Compra</CardTitle>
            <ShoppingCart className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getItemsNeedingPurchaseCount()}</div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Solicitações Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getPendingPurchaseRequestsCount()}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Compra Automática */}
      {itemsNeedingPurchase.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Compra Automática Sugerida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-800 font-medium">
                  {itemsNeedingPurchase.length} item(ns) precisam de compra imediata
                </p>
                <p className="text-sm text-orange-600">
                  Clique para gerar solicitação automática
                </p>
              </div>
              <Button 
                onClick={handleGenerateAutoPurchase}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Gerar Compra Automática
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Solicitações</span>
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="auto-purchases" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Compras Automáticas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Solicitações de Compra Integradas</span>
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="APPROVED">Aprovado</SelectItem>
                      <SelectItem value="REJECTED">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="MEDIUM">Média</SelectItem>
                      <SelectItem value="LOW">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtros */}
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar solicitações..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabela */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Integração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingPurchases ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhuma solicitação encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRequests.map((request) => (
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
                              <Badge className={getStatusColor(request.status)}>
                                {getStatusLabel(request.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getPriorityColor(request.priority)}>
                                {getPriorityLabel(request.priority)}
                              </Badge>
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
                              <div className="flex items-center space-x-1">
                                {request.status === 'APPROVED' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <ArrowRight className="w-3 h-3 mr-1" />
                                    Estoque Atualizado
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {request.status === 'PENDING' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Fornecedores Integrados</span>
                <Button onClick={() => setShowNewSupplierModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Fornecedor
                </Button>
              </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Lista de fornecedores simplificada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loadingSuppliers ? (
                      <div className="col-span-full flex justify-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                      </div>
                    ) : suppliers.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        Nenhum fornecedor cadastrado
                      </div>
                    ) : (
                      suppliers.map((supplier) => (
                        <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-foreground">{supplier.name}</h3>
                                <p className="text-sm text-muted-foreground">{supplier.category}</p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {supplier.city && <div>{supplier.city}/{supplier.state}</div>}
                                  {supplier.email && <div>{supplier.email}</div>}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Badge variant={supplier.isActive !== false ? "default" : "secondary"}>
                                  {supplier.isActive !== false ? "Ativo" : "Inativo"}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedSupplier(supplier)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto-purchases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens que Precisam de Compra</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingItems ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : itemsNeedingPurchase.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Nenhum item precisa de compra</h3>
                    <p className="text-sm">Todos os itens estão com estoque adequado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemsNeedingPurchase.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-orange-500" />
                            <div>
                              <h4 className="font-medium text-foreground">{item.name}</h4>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Atual: {item.quantity}</div>
                            <div>Mínimo: {item.minimumQuantity}</div>
                            <div>Sugerido: {(item as any).suggestedPurchaseQuantity}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-foreground">
                            {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total: {formatCurrency(item.unitPrice * (item as any).suggestedPurchaseQuantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  );
}
