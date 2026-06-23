import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Wrench, User, Car, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, Package, Trash2, Edit, FileDown, Eye } from 'lucide-react';
import { ServiceOrder, ServiceOrderItem, InventoryItem } from '@/types/inventory';
import { useInventoryNotifications } from '@/hooks/useInventoryNotifications';
import { serviceOrderPDFGenerator } from '@/utils/serviceOrderPDFGenerator';
import ServiceOrderMaintenanceIntegration from './ServiceOrderMaintenanceIntegration';
import ServiceOrderPurchaseFlow from './ServiceOrderPurchaseFlow';

const mockServiceOrders: ServiceOrder[] = [
  {
    id: '1',
    orderNumber: 'OS-2024-001',
    clientId: 'client-001',
    clientName: 'Transportes Rápidos Ltda',
    vehicleId: 'veh-001',
    vehiclePlate: 'ABC-1234',
    vehicleInfo: {
      brand: 'Volvo',
      model: 'FH 540',
      year: 2022,
      currentMileage: 45680,
      lastMaintenanceMileage: 42000,
      nextMaintenanceMileage: 50000
    },
    items: [
      {
        id: '1',
        type: 'PART',
        description: 'Filtro de Óleo Motor MANN-FILTER',
        partNumber: 'HU 718/5 X',
        quantity: 2,
        unitPrice: 45.90,
        totalPrice: 91.80,
        appliedQuantity: 2,
        returnedQuantity: 0
      },
      {
        id: '2',
        type: 'LABOR',
        description: 'Mão de obra - Troca de filtro de óleo',
        quantity: 2,
        unitPrice: 80.00,
        totalPrice: 160.00,
        appliedQuantity: 2,
        returnedQuantity: 0
      }
    ],
    laborCost: 160.00,
    partsCost: 91.80,
    totalCost: 251.80,
    status: 'COMPLETED',
    createdBy: 'mec-001',
    createdAt: '2024-03-20T09:30:00Z',
    completedAt: '2024-03-20T14:45:00Z'
  },
  {
    id: '2',
    orderNumber: 'OS-2024-002',
    clientId: 'client-002',
    clientName: 'Logística Express S/A',
    vehicleId: 'veh-002',
    vehiclePlate: 'DEF-5678',
    vehicleInfo: {
      brand: 'Scania',
      model: 'R 450',
      year: 2021,
      currentMileage: 78920,
      lastMaintenanceMileage: 75000,
      nextMaintenanceMileage: 85000
    },
    items: [
      {
        id: '3',
        type: 'PART',
        description: 'Pneu 205/75R16 Michelin',
        partNumber: 'XZY3-205-75-16',
        quantity: 4,
        unitPrice: 380.50,
        totalPrice: 1522.00,
        appliedQuantity: 4,
        returnedQuantity: 0
      },
      {
        id: '4',
        type: 'LABOR',
        description: 'Balanceamento e alinhamento',
        quantity: 1,
        unitPrice: 120.00,
        totalPrice: 120.00,
        appliedQuantity: 1,
        returnedQuantity: 0
      }
    ],
    laborCost: 120.00,
    partsCost: 1522.00,
    totalCost: 1642.00,
    status: 'IN_PROGRESS',
    createdBy: 'mec-002',
    createdAt: '2024-03-22T11:15:00Z'
  }
];

const mockClients = [
  { id: 'client-001', name: 'Transportes Rápidos Ltda' },
  { id: 'client-002', name: 'Logística Express S/A' },
  { id: 'client-003', name: 'Distribuidora Central' }
];

const mockVehicles = [
  { id: 'veh-001', plate: 'ABC-1234', brand: 'Volvo', model: 'FH 540' },
  { id: 'veh-002', plate: 'DEF-5678', brand: 'Scania', model: 'R 450' },
  { id: 'veh-003', plate: 'GHI-9012', brand: 'Mercedes-Benz', model: 'Actros 2651' }
];

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Filtro de Óleo Motor',
    description: 'Filtro de alta qualidade para motores diesel',
    category: 'SUPPLIES' as any,
    type: 'MAINTENANCE_SUPPLY' as any,
    brand: 'MANN-FILTER',
    model: 'HU 718/5 X',
    unitPrice: 45.90,
    quantity: 12,
    minimumQuantity: 10,
    location: 'Prateleira A-01',
    supplier: 'Auto Peças Ltda',
    status: 'ACTIVE' as any,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z'
  },
  {
    id: '2',
    name: 'Pneu 205/75R16',
    description: 'Pneu para veículos de carga',
    category: 'SUPPLIES' as any,
    type: 'MAINTENANCE_SUPPLY' as any,
    brand: 'Michelin',
    model: 'XZY3',
    unitPrice: 380.50,
    quantity: 8,
    minimumQuantity: 4,
    location: 'Prateleira B-03',
    supplier: 'Pneus Center',
    status: 'ACTIVE' as any,
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-03-15T11:45:00Z'
  },
  {
    id: '3',
    name: 'Bateria 12V 80Ah',
    description: 'Bateria para caminhonetes',
    category: 'SUPPLIES' as any,
    type: 'MAINTENANCE_SUPPLY' as any,
    brand: 'Moura',
    model: 'M80',
    unitPrice: 285.00,
    quantity: 15,
    minimumQuantity: 5,
    location: 'Prateleira C-02',
    supplier: 'Baterias Moura',
    status: 'ACTIVE' as any,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-20T16:30:00Z'
  }
];

export default function ServiceOrderIntegrated() {
  const { onRequestCreated, onOrderCompleted } = useInventoryNotifications();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | undefined>();
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const [orders, setOrders] = useState<ServiceOrder[]>(mockServiceOrders);
  const [newOrder, setNewOrder] = useState({
    orderNumber: `OS-${new Date().getFullYear()}-${String(mockServiceOrders.length + 1).padStart(3, '0')}`,
    clientId: '',
    vehicleId: '',
    items: [],
    status: 'OPEN'
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      OPEN: 'Aberta',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluída',
      CANCELLED: 'Cancelada'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewOrder = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const handleGeneratePDF = async (order: ServiceOrder, action: 'download' | 'open' = 'download') => {
    if (!order) return;
    
    try {
      setPdfGenerating(true);
      
      const pdfData = {
        order,
        company: {
          name: 'Fleet Manager System',
          document: '12.345.678/0001-90',
          address: 'Rua Principal, 123 - Centro, São Paulo - SP',
          phone: '(11) 3456-7890',
          email: 'contato@fleetmanager.com'
        },
        generatedBy: 'Sistema Fleet Manager',
        generatedAt: new Date().toISOString()
      };

      if (action === 'download') {
        await serviceOrderPDFGenerator.generateAndDownloadPDF(pdfData);
      } else {
        await serviceOrderPDFGenerator.generateAndOpenPDF(pdfData);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço Integradas</h1>
          <p className="text-muted-foreground">Gerencie ordens de serviço com integração ao módulo de manutenção</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Ordem de Serviço
        </Button>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de O.S.</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'IN_PROGRESS').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {orders.reduce((sum, o) => sum + o.totalCost, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar ordens de serviço..."
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
                <SelectItem value="OPEN">Aberta</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Número</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-left p-2">Veículo</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Quilometragem</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-right p-2">Valor</th>
                  <th className="text-center p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div className="font-medium">{order.orderNumber}</div>
                    </td>
                    <td className="p-2">
                      <div>{order.clientName}</div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        {order.vehiclePlate}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        {order.vehicleInfo?.brand} {order.vehicleInfo?.model}
                        <div className="text-xs text-muted-foreground">
                          {order.vehicleInfo?.year}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        <div className="font-medium">{order.vehicleInfo?.currentMileage?.toLocaleString('pt-BR')} km</div>
                        <div className="text-xs text-muted-foreground">
                          Próxima: {order.vehicleInfo?.nextMaintenanceMileage?.toLocaleString('pt-BR')} km
                        </div>
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="p-2">
                      <div className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="p-2 text-right">
                      <div className="font-medium">
                        R$ {order.totalCost.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(order, 'open')}
                          disabled={pdfGenerating}
                          title="Visualizar PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGeneratePDF(order, 'download')}
                          disabled={pdfGenerating}
                          title="Baixar PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Ordem de Serviço</h2>
                  <p className="text-muted-foreground">{selectedOrder.orderNumber}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>

              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                  <TabsTrigger value="integration">Integração Manutenção</TabsTrigger>
                  <TabsTrigger value="purchase-flow">Fluxo de Compras</TabsTrigger>
                  <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Informações do Cliente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Nome:</span> {selectedOrder.clientName}
                          </div>
                          <div>
                            <span className="font-medium">ID Cliente:</span> {selectedOrder.clientId}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Car className="h-4 w-4" />
                          Informações do Veículo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Placa:</span> {selectedOrder.vehiclePlate}
                          </div>
                          <div>
                            <span className="font-medium">Modelo:</span> {selectedOrder.vehicleInfo?.brand} {selectedOrder.vehicleInfo?.model}
                          </div>
                          <div>
                            <span className="font-medium">Ano:</span> {selectedOrder.vehicleInfo?.year}
                          </div>
                          <div>
                            <span className="font-medium">Quilometragem Atual:</span> 
                            <span className="ml-2 font-bold text-blue-600">
                              {selectedOrder.vehicleInfo?.currentMileage?.toLocaleString('pt-BR')} km
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Última Manutenção:</span> 
                            <span className="ml-2">
                              {selectedOrder.vehicleInfo?.lastMaintenanceMileage?.toLocaleString('pt-BR')} km
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Próxima Manutenção:</span> 
                            <span className="ml-2 font-medium text-orange-600">
                              {selectedOrder.vehicleInfo?.nextMaintenanceMileage?.toLocaleString('pt-BR')} km
                            </span>
                          </div>
                          {selectedOrder.vehicleInfo && (
                            <div className="mt-3 p-2 bg-gray-50 rounded">
                              <div className="text-xs text-muted-foreground mb-1">Próxima manutenção em:</div>
                              <div className="text-sm font-medium">
                                {selectedOrder.vehicleInfo.nextMaintenanceMileage - selectedOrder.vehicleInfo.currentMileage} km
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Informações da O.S.</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">Número:</span> {selectedOrder.orderNumber}
                          </div>
                          <div>
                            <span className="font-medium">ID Veículo:</span> {selectedOrder.vehicleId}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge className={`ml-2 ${getStatusColor(selectedOrder.status)}`}>
                              {getStatusLabel(selectedOrder.status)}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Data de Criação:</span>
                            <div>{new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</div>
                          </div>
                          {selectedOrder.completedAt && (
                            <div>
                              <span className="font-medium">Conclusão:</span>
                              <div>{new Date(selectedOrder.completedAt).toLocaleString('pt-BR')}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Itens da Ordem de Serviço</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant={item.type === 'PART' ? 'default' : 'secondary'} className="text-xs">
                                  {item.type === 'PART' ? 'Peça' : 'Mão de Obra'}
                                </Badge>
                                <span className="text-sm font-medium text-foreground">{item.description}</span>
                                {item.partNumber && (
                                  <span className="text-xs text-muted-foreground"> - {item.partNumber}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span>{item.quantity} unid</span>
                                <span className="font-medium text-foreground">R$ {item.totalPrice.toFixed(2)}</span>
                                {item.appliedQuantity && (
                                  <div className="text-xs text-green-600">
                                    Aplicado: {item.appliedQuantity}
                                  </div>
                                )}
                                {item.returnedQuantity && (
                                  <div className="text-xs text-orange-600">
                                    Devolvido: {item.returnedQuantity}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t">
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Custo Peças:</div>
                          <div className="text-lg font-bold text-foreground">R$ {selectedOrder.partsCost.toFixed(2)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Custo Mão de Obra:</div>
                          <div className="text-lg font-bold text-foreground">R$ {selectedOrder.laborCost.toFixed(2)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-sm text-muted-foreground">Total:</div>
                          <div className="text-xl font-bold text-foreground">R$ {selectedOrder.totalCost.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="integration">
                  <ServiceOrderMaintenanceIntegration 
                    serviceOrder={selectedOrder}
                    onIntegrationComplete={(maintenance) => {
                      console.log('Manutenção integrada:', maintenance);
                    }}
                  />
                </TabsContent>

                <TabsContent value="purchase-flow">
                  <ServiceOrderPurchaseFlow 
                    serviceOrder={selectedOrder}
                    onPurchaseComplete={(purchaseRequest) => {
                      console.log('Solicitação de compra criada:', purchaseRequest);
                    }}
                  />
                </TabsContent>

                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico da Ordem de Serviço</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <div className="font-medium">Ordem criada</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        
                        {selectedOrder.completedAt && (
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                            <div>
                              <div className="font-medium">Ordem concluída</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(selectedOrder.completedAt).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => handleGeneratePDF(selectedOrder, 'open')}
                  disabled={pdfGenerating}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar PDF
                </Button>
                <Button 
                  onClick={() => handleGeneratePDF(selectedOrder, 'download')}
                  disabled={pdfGenerating}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
