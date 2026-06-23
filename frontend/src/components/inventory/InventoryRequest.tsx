import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Package, Clock, CheckCircle, XCircle, AlertTriangle, User, FileText, Calendar } from 'lucide-react';
import { InventoryRequest, InventoryRequestItem, InventoryItem } from '@/types/inventory';
import { useInventoryNotifications } from '@/hooks/useInventoryNotifications';

const mockRequests: InventoryRequest[] = [
  {
    id: '1',
    employeeId: 'emp-001',
    employeeName: 'João Silva',
    status: 'PENDING',
    requestedAt: '2024-03-25T09:30:00Z',
    items: [
      {
        id: '1',
        itemId: '1',
        itemDescription: 'Filtro de Óleo Motor MANN-FILTER',
        requestedQuantity: 5,
        unitPrice: 45.90,
        totalPrice: 229.50
      },
      {
        id: '2',
        itemId: '2',
        itemDescription: 'Pneu 205/75R16 Michelin',
        requestedQuantity: 2,
        unitPrice: 380.50,
        totalPrice: 761.00
      }
    ]
  },
  {
    id: '2',
    employeeId: 'emp-002',
    employeeName: 'Maria Santos',
    status: 'APPROVED',
    approvedAt: '2024-03-24T14:15:00Z',
    approvedBy: 'Carlos Gestor',
    requestedAt: '2024-03-23T11:20:00Z',
    items: [
      {
        id: '3',
        itemId: '3',
        itemDescription: 'Bateria 12V 80Ah MOURA',
        requestedQuantity: 3,
        approvedQuantity: 3,
        unitPrice: 285.00,
        totalPrice: 855.00
      }
    ]
  },
  {
    id: '3',
    employeeId: 'emp-003',
    employeeName: 'Pedro Oliveira',
    status: 'REJECTED',
    rejectionReason: 'Itens não disponíveis em estoque no momento',
    requestedAt: '2024-03-22T16:45:00Z',
    items: [
      {
        id: '4',
        itemId: '4',
        itemDescription: 'Extintor de Incêndio ABC 10kg',
        requestedQuantity: 2,
        unitPrice: 89.90,
        totalPrice: 179.80
      }
    ]
  }
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
  },
  {
    id: '4',
    name: 'Extintor de Incêndio ABC 10kg',
    description: 'Extintor de pó químico tipo ABC',
    quantity: 6,
    unitPrice: 89.90
  }
];

export default function InventoryRequest() {
  const { onRequestCreated, onRequestApproved, onRequestRejected } = useInventoryNotifications();
  const [requests, setRequests] = useState<InventoryRequest[]>(mockRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<InventoryRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    employeeId: 'emp-001',
    employeeName: 'João Silva',
    items: [],
    reason: ''
  });

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'APPROVED':
        return 'Aprovado';
      case 'REJECTED':
        return 'Rejeitado';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return status;
    }
  };

  const handleAddItem = () => {
    setNewRequest(prev => ({
      ...prev,
      items: [...prev.items, {
        id: Date.now().toString(),
        itemId: '',
        itemDescription: '',
        requestedQuantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }]
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setNewRequest(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const handleItemChange = (itemId: string, field: string, value: any) => {
    setNewRequest(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          if (field === 'itemId') {
            const selectedItem = mockInventoryItems.find(inv => inv.id === value);
            return {
              ...item,
              [field]: value,
              itemDescription: selectedItem?.description || '',
              unitPrice: selectedItem?.unitPrice || 0
            };
          }
          if (field === 'requestedQuantity') {
            const unitPrice = item.unitPrice || 0;
            return {
              ...item,
              [field]: parseInt(value) || 0,
              totalPrice: unitPrice * (parseInt(value) || 0)
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const calculateTotal = () => {
    return newRequest.items.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleSubmitRequest = () => {
    if (newRequest.items.length === 0) {
      alert('Adicione pelo menos um item à requisição');
      return;
    }
    
    const request: InventoryRequest = {
      id: Date.now().toString(),
      employeeId: newRequest.employeeId,
      employeeName: newRequest.employeeName,
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      items: newRequest.items
    };

    setRequests(prev => [...prev, request]);
    onRequestCreated(request);
    setShowNewRequestModal(false);
    setNewRequest({
      employeeId: 'emp-001',
      employeeName: 'João Silva',
      items: [],
      reason: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Requisições de Peças</h1>
          <p className="text-muted-foreground">Solicite peças e suprimentos para manutenção</p>
        </div>
        <Button 
          onClick={() => setShowNewRequestModal(true)}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Requisição</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">Aprovadas este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejeitadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'REJECTED').length}
            </div>
            <p className="text-xs text-muted-foreground">Rejeitadas este mês</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Concluídas</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'COMPLETED').length}
            </div>
            <p className="text-xs text-muted-foreground">Entregues este mês</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar requisições..."
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
                <SelectItem value="PENDING">Pendentes</SelectItem>
                <SelectItem value="APPROVED">Aprovadas</SelectItem>
                <SelectItem value="REJECTED">Rejeitadas</SelectItem>
                <SelectItem value="COMPLETED">Concluídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground">Minhas Requisições ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 hover:bg-accent">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-red-500" />
                      <div>
                        <h3 className="font-medium text-foreground">{request.employeeName}</h3>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Solicitado em: {new Date(request.requestedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
                
                <div className="border-t pt-3">
                  <div className="space-y-2">
                    {request.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium text-foreground">{item.itemDescription}</span>
                            <span className="text-muted-foreground"> - {item.requestedQuantity} unid</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-foreground">R$ {item.totalPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="text-sm text-muted-foreground">Total da Requisição:</div>
                      <div className="text-lg font-bold text-foreground">
                        R$ {request.items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Nova Requisição</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewRequestModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeId">ID do Funcionário</Label>
                <Input
                  id="employeeId"
                  value={newRequest.employeeId}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, employeeId: e.target.value }))}
                  placeholder="Digite o ID do funcionário"
                />
              </div>

              <div>
                <Label htmlFor="employeeName">Nome do Funcionário</Label>
                <Input
                  id="employeeName"
                  value={newRequest.employeeName}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, employeeName: e.target.value }))}
                  placeholder="Digite o nome do funcionário"
                />
              </div>

              <div>
                <Label>Itens da Requisição</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {newRequest.items.map((item, index) => (
                    <div key={item.id} className="flex gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <Select
                          value={item.itemId}
                          onValueChange={(value) => handleItemChange(item.id, 'itemId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma peça" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockInventoryItems.map((inventoryItem) => (
                              <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                                {inventoryItem.name} - {inventoryItem.quantity} unidades
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Input
                          value={item.requestedQuantity}
                          onChange={(e) => handleItemChange(item.id, 'requestedQuantity', e.target.value)}
                          type="number"
                          min="1"
                          placeholder="Quantidade"
                        />
                      </div>
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-foreground">
                          R$ {item.totalPrice.toFixed(2)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
                <div className="text-sm text-muted-foreground">Total:</div>
                <div className="text-xl font-bold text-foreground">R$ {calculateTotal().toFixed(2)}</div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowNewRequestModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitRequest}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Enviar Requisição
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-foreground">Detalhes da Requisição</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID do Funcionário</Label>
                  <div className="text-foreground">{selectedRequest.employeeId}</div>
                </div>
                <div>
                  <Label>Nome do Funcionário</Label>
                  <div className="text-foreground">{selectedRequest.employeeName}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data da Solicitação</Label>
                  <div className="text-foreground">{new Date(selectedRequest.requestedAt).toLocaleDateString('pt-BR')}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
              </div>

              {selectedRequest.approvedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data de Aprovação</Label>
                    <div className="text-foreground">{new Date(selectedRequest.approvedAt).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div>
                    <Label>Aprovado por</Label>
                    <div className="text-foreground">{selectedRequest.approvedBy}</div>
                  </div>
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div>
                  <Label>Motivo da Rejeição</Label>
                  <div className="text-red-600">{selectedRequest.rejectionReason}</div>
                </div>
              )}

              <div>
                <Label>Itens Solicitados</Label>
                <div className="space-y-2 border rounded-lg p-4">
                  {selectedRequest.items.map((item, index) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div className="flex-1">
                        <div className="text-sm">
                          <span className="font-medium text-foreground">{item.itemDescription}</span>
                          <span className="text-muted-foreground"> - {item.requestedQuantity} unid</span>
                          {item.approvedQuantity && (
                            <span className="text-green-600"> (Aprovado: {item.approvedQuantity})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">R$ {item.totalPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">Total da Requisição:</div>
                <div className="text-xl font-bold text-foreground">
                  R$ {selectedRequest.items.reduce((total, item) => total + item.totalPrice, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
