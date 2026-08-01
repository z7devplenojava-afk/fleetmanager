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

const mockServiceOrders: ServiceOrder[] = [
  {
    id: '1',
    orderNumber: 'OS-2024-001',
    clientId: 'client-001',
    clientName: 'Transportes Rápidos Ltda',
    vehicleId: 'veh-001',
    vehiclePlate: 'ABC-1234',
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
    items: [
      {
        id: '3',
        type: 'PART',
        description: 'Jogo de Pneus 205/75R16',
        partNumber: 'XZY3',
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
        quantity: 1.5,
        unitPrice: 120.00,
        totalPrice: 180.00,
        appliedQuantity: 1.5,
        returnedQuantity: 0
      }
    ],
    laborCost: 300.00,
    partsCost: 1522.00,
    totalCost: 1822.00,
    status: 'IN_PROGRESS',
    createdBy: 'mec-002',
    createdAt: '2024-03-25T11:20:00Z'
  }
];

const mockClients = [
  { id: 'client-001', name: 'Transportes Rápidos Ltda' },
  { id: 'client-002', name: 'Logística Express S/A' },
  { id: 'client-003', name: 'Entregas Brasil Ltda' }
];

const mockVehicles = [
  { id: 'veh-001', plate: 'ABC-1234', model: 'Volvo FH' },
  { id: 'veh-002', plate: 'DEF-5678', model: 'Scania 113H' },
  { id: 'veh-003', plate: 'GHI-9012', model: 'Mercedes Actros' }
];

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Filtro de Óleo Motor',
    description: 'Filtro de alta qualidade para motores diesel',
    quantity: 24,
    unitPrice: 45.90
  },
  {
    id: '2',
    name: 'Pneu 205/75R16',
    description: 'Pneu para veículos de carga',
    quantity: 8,
    unitPrice: 380.50
  },
  {
    id: '3',
    name: 'Bateria 12V 80Ah',
    description: 'Bateria para caminhonetes',
    quantity: 15,
    unitPrice: 285.00
  }
];

export default function ServiceOrder() {
  const { onRequestCreated, onOrderCompleted } = useInventoryNotifications();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([]);
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
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'Aberta';
      case 'IN_PROGRESS':
        return 'Em Andamento';
      case 'COMPLETED':
        return 'Concluída';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const handleAddItem = (type: 'PART' | 'LABOR') => {
    const newItem: ServiceOrderItem = {
      id: Date.now().toString(),
      type,
      description: type === 'PART' ? 'Nova peça' : 'Novo serviço',
      quantity: 1,
      unitPrice: type === 'PART' ? 0 : 80.00,
      totalPrice: type === 'PART' ? 0 : 80.00
    };

    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          if (field === 'description') {
            return { ...item, [field]: value };
          }
          if (field === 'quantity') {
            const unitPrice = item.unitPrice || 0;
            return {
              ...item,
              [field]: parseFloat(value) || 0,
              totalPrice: unitPrice * (parseFloat(value) || 0)
            };
          }
          if (field === 'unitPrice') {
            const quantity = item.quantity || 0;
            return {
              ...item,
              [field]: parseFloat(value) || 0,
              totalPrice: quantity * (parseFloat(value) || 0)
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const calculateTotals = () => {
    const partsTotal = newOrder.items
      .filter(item => item.type === 'PART')
      .reduce((total, item) => total + item.totalPrice, 0);
    
    const laborTotal = newOrder.items
      .filter(item => item.type === 'LABOR')
      .reduce((total, item) => total + item.totalPrice, 0);

    return {
      partsTotal,
      laborTotal,
      total: partsTotal + laborTotal
    };
  };

  const handleCreateOrder = () => {
    if (!newOrder.clientId || !newOrder.vehicleId || newOrder.items.length === 0) {
      alert('Preencha todos os campos obrigatórios e adicione pelo menos um item');
      return;
    }

    const totals = calculateTotals();
    const order: ServiceOrder = {
      id: Date.now().toString(),
      orderNumber: newOrder.orderNumber,
      clientId: newOrder.clientId,
      clientName: mockClients.find(c => c.id === newOrder.clientId)?.name || '',
      vehicleId: newOrder.vehicleId,
      vehiclePlate: mockVehicles.find(v => v.id === newOrder.vehicleId)?.plate || '',
      items: newOrder.items,
      laborCost: totals.laborTotal,
      partsCost: totals.partsTotal,
      totalCost: totals.total,
      status: 'OPEN',
      createdBy: 'mec-001',
      createdAt: new Date().toISOString()
    };

    setOrders(prev => [...prev, order]);
    onOrderCreated(order);
    setShowNewOrderModal(false);
    setNewOrder({
      orderNumber: `OS-${new Date().getFullYear()}-${String(mockServiceOrders.length + 2).padStart(3, '0')}`,
      clientId: '',
      vehicleId: '',
      items: [],
      status: 'OPEN'
    });
  };

  const handleGeneratePDF = async (order: ServiceOrder, action: 'download' | 'open' = 'download') => {
    if (!order) return;
    
    try {
      setPdfGenerating(true);
      
      const pdfData = {
        order,
        company: {
          name: 'FluxBus Fleet Management',
          document: '12.345.678/0001-90',
          address: 'Rua Principal, 123 - Centro, São Paulo - SP',
          phone: '(11) 3456-7890',
          email: 'contato@fluxbus.com.br'
        },
        generatedBy: 'Sistema FluxBus',
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
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground">Gerencie ordens de serviço e peças aplicadas</p>
        </div>
        <Button 
          onClick={() => setShowNewOrderModal(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Ordem</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abertas</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'OPEN').length}
            </div>
            <p className="text-xs text-muted-foreground">Ordens abertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'IN_PROGRESS').length}
            </div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">Mês atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {orders.filter(o => o.status === 'CANCELLED').length}
            </div>
            <p className="text-xs text-muted-foreground">Canceladas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ordens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="OPEN">Abertas</SelectItem>
                <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                <SelectItem value="COMPLETED">Concluídas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">Ordens de Serviço ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 hover:bg-accent">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Wrench className="h-4 w-4 text-red-500" />
                      <div>
                        <h3 className="font-medium text-foreground">{order.orderNumber}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{order.clientName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Car className="h-3 w-3" />
                          <span>{order.vehiclePlate}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
                
                <div className="border-t pt-3">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label>Cliente</Label>
                      <div className="text-foreground">{order.clientName}</div>
                    </div>
                    <div>
                      <Label>Veículo</Label>
                      <div className="text-foreground">{order.vehiclePlate}</div>
                    </div>
                  </div>

                  <div>
                    <Label>Itens da Ordem</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                      {order.items.map((item, index) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Custo Peças:</div>
                      <div className="text-lg font-bold text-foreground">R$ {order.partsCost.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Custo Mão de Obra:</div>
                      <div className="text-lg font-bold text-foreground">R$ {order.laborCost.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground">Total:</div>
                      <div className="text-xl font-bold text-foreground">R$ {order.totalCost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Nova Ordem de Serviço</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewOrderModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderNumber">Número da OS</Label>
                  <Input
                    id="orderNumber"
                    value={newOrder.orderNumber}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="Digite o número da OS"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newOrder.status} onValueChange={(value) => setNewOrder(prev => ({ ...prev, status: value as any }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPEN">Aberta</SelectItem>
                      <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                      <SelectItem value="COMPLETED">Concluída</SelectItem>
                      <SelectItem value="CANCELLED">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select value={newOrder.clientId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, clientId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehicleId">Veículo</Label>
                  <Select value={newOrder.vehicleId} onValueChange={(value) => setNewOrder(prev => ({ ...prev, vehicleId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o veículo" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.plate} - {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Itens da Ordem</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {newOrder.items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <Select
                          value={item.type}
                          onValueChange={(value) => handleItemChange(item.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PART">Peça</SelectItem>
                            <SelectItem value="LABOR">Mão de Obra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Descrição"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          type="number"
                          min="1"
                          placeholder="Quantidade"
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Valor Unitário"
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-foreground">
                          R$ {item.totalPrice.toFixed(2)}
                        </div>
                        <div className="flex items-center space-x-2">
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
                            onClick={() => handleEditOrder(order)}
                          >
                            <Edit className="w-4 h-4" />
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
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    onClick={handleAddItem}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Custo Peças:</div>
                  <div className="text-lg font-bold text-foreground">R$ {calculateTotals().partsTotal.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Custo Mão de Obra:</div>
                  <div className="text-lg font-bold text-foreground">R$ {calculateTotals().laborTotal.toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Total:</div>
                  <div className="text-xl font-bold text-foreground">R$ {calculateTotals().total.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewOrderModal(false)}
                  <h2 className="text-2xl font-bold text-foreground">Ordem de Serviço</h2>
                  <p className="text-muted-foreground">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {getStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <div className="text-foreground">{selectedOrder.clientName}</div>
                </div>
                <div>
                  <Label>Veículo</Label>
                  <div className="text-foreground">{selectedOrder.vehiclePlate}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data de Criação</Label>
                  <div className="text-foreground">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
                {selectedOrder.completedAt && (
                  <div>
                    <Label>Data de Conclusão</Label>
                    <div className="text-foreground">{new Date(selectedOrder.completedAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                )}
              </div>

              <div>
                <Label>Itens da Ordem</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-4">
                  {selectedOrder.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
