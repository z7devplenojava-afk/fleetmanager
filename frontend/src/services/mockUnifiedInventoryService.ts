import { 
  InventoryItem, 
  InventoryMovement,
  InventoryRequest,
  ServiceOrder,
  Supplier,
  CreatePurchaseRequestRequest,
  CreateSupplierRequest
} from './unifiedInventoryService';

// Mock data para simulação
const mockItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Filtro de Óleo Motor',
    description: 'Filtro de alta qualidade para motores diesel',
    category: 'SUPPLIES' as any,
    type: 'MAINTENANCE_SUPPLY' as any,
    brand: 'MANN-FILTER',
    model: 'HU 718/5 X',
    unitPrice: 45.90,
    quantity: 2,
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
    quantity: 0,
    minimumQuantity: 5,
    location: 'Prateleira C-02',
    supplier: 'Baterias Moura',
    status: 'ACTIVE' as any,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-20T16:30:00Z'
  }
];

const mockPurchaseRequests: InventoryRequest[] = [
  {
    id: '1',
    requestNumber: 'SC-2024-001',
    title: 'Compra de Filtros e Pneus',
    description: 'Solicitação de peças para manutenção preventiva da frota',
    priority: 'HIGH',
    status: 'PENDING',
    requesterName: 'João Silva',
    department: 'Manutenção',
    justification: 'Peças necessárias para manutenção programada',
    estimatedTotal: 892.90,
    urgency: 'NORMAL',
    requiredDate: '2024-04-15T00:00:00Z',
    requestDate: '2024-03-25T09:30:00Z',
    createdAt: '2024-03-25T09:30:00Z',
    updatedAt: '2024-03-25T09:30:00Z',
    urgent: false,
    canBeApproved: true,
    overdue: false,
    daysUntilRequired: 21,
    totalItems: 2,
    totalValue: 892.90
  },
  {
    id: '2',
    requestNumber: 'SC-2024-002',
    title: 'Compra Urgente - Baterias',
    description: 'Solicitação urgente devido a ruptura de estoque',
    priority: 'URGENT',
    status: 'APPROVED',
    requesterName: 'Maria Santos',
    department: 'Almoxarifado',
    justification: 'Estoque zerado de baterias 12V',
    estimatedTotal: 1425.00,
    urgency: 'IMMEDIATE',
    requiredDate: '2024-03-28T00:00:00Z',
    requestDate: '2024-03-20T14:20:00Z',
    approvalDate: '2024-03-21T10:15:00Z',
    approvedBy: 'Carlos Gestor',
    approvalNotes: 'Aprovado por urgência operacional',
    createdAt: '2024-03-20T14:20:00Z',
    updatedAt: '2024-03-21T10:15:00Z',
    urgent: true,
    canBeApproved: false,
    overdue: false,
    daysUntilRequired: -3,
    totalItems: 5,
    totalValue: 1425.00
  }
];

const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Auto Peças Ltda',
    cnpj: '12.345.678/0001-90',
    email: 'contato@autopecas.com.br',
    phone: '(11) 3456-7890',
    address: 'Rua das Peças, 123',
    city: 'São Paulo',
    state: 'SP',
    cep: '01234-567',
    category: 'Auto Peças',
    isActive: true,
    paymentTerms: '30 dias',
    deliveryTime: 5,
    minimumOrder: 500.00,
    notes: 'Fornecedor tradicional com bom atendimento',
    createdAt: '2023-01-15T10:30:00Z',
    updatedAt: '2024-02-20T14:20:00Z'
  },
  {
    id: '2',
    name: 'Pneus Center',
    cnpj: '98.765.432/0001-00',
    email: 'vendas@pneuscenter.com.br',
    phone: '(11) 2345-6789',
    address: 'Av. dos Pneus, 456',
    city: 'São Paulo',
    state: 'SP',
    cep: '04567-890',
    category: 'Pneus',
    isActive: true,
    paymentTerms: '15 dias',
    deliveryTime: 3,
    minimumOrder: 1000.00,
    notes: 'Especialista em pneus para veículos de carga',
    createdAt: '2023-03-20T11:45:00Z',
    updatedAt: '2024-01-10T09:30:00Z'
  }
];

class MockUnifiedInventoryService {
  // Simular delay de rede
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getItemsForPurchase(): Promise<InventoryItem[]> {
    await this.delay(500);
    return mockItems.map(item => ({
      ...item,
      needsPurchase: item.quantity <= item.minimumQuantity,
      suggestedPurchaseQuantity: Math.max(item.minimumQuantity * 2 - item.quantity, item.minimumQuantity),
      stockStatus: this.getStockStatus(item.quantity, item.minimumQuantity)
    }));
  }

  async getPurchaseRequestsWithInventory(): Promise<InventoryRequest[]> {
    await this.delay(600);
    return mockPurchaseRequests;
  }

  async getUnifiedSuppliers(): Promise<Supplier[]> {
    await this.delay(400);
    return mockSuppliers;
  }

  async getUnifiedDashboard(): Promise<any> {
    await this.delay(300);
    return {
      totalItems: mockItems.length,
      criticalItems: mockItems.filter(item => item.quantity <= item.minimumQuantity / 2).length,
      outOfStockItems: mockItems.filter(item => item.quantity === 0).length,
      itemsNeedingPurchase: mockItems.filter(item => item.quantity <= item.minimumQuantity).length,
      pendingPurchaseRequests: mockPurchaseRequests.filter(req => req.status === 'PENDING').length,
      approvedPurchaseRequests: mockPurchaseRequests.filter(req => req.status === 'APPROVED').length,
      totalPurchaseValue: mockPurchaseRequests.reduce((sum, req) => sum + (req.totalValue || 0), 0)
    };
  }

  async createPurchaseRequest(requestData: CreatePurchaseRequestRequest): Promise<InventoryRequest> {
    await this.delay(800);
    
    const newRequest: InventoryRequest = {
      id: Date.now().toString(),
      requestNumber: `SC-${new Date().getFullYear()}-${String(mockPurchaseRequests.length + 1).padStart(3, '0')}`,
      title: requestData.title,
      description: requestData.description,
      priority: requestData.priority || 'MEDIUM',
      status: 'PENDING',
      requesterName: requestData.requesterName || 'Usuário Sistema',
      department: requestData.department || 'Almoxarifado',
      justification: requestData.justification,
      estimatedTotal: requestData.estimatedTotal || 0,
      urgency: requestData.urgency || 'NORMAL',
      requiredDate: requestData.requiredDate,
      requestDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urgent: requestData.priority === 'URGENT',
      canBeApproved: true,
      overdue: false,
      daysUntilRequired: 30,
      totalItems: requestData.items?.length || 0,
      totalValue: requestData.estimatedTotal || 0
    };

    mockPurchaseRequests.push(newRequest);
    return newRequest;
  }

  async approvePurchaseRequestWithInventory(
    requestId: string, 
    approverName: string, 
    notes?: string
  ): Promise<{ purchaseRequest: InventoryRequest; inventoryMovements: InventoryMovement[] }> {
    await this.delay(1000);
    
    const request = mockPurchaseRequests.find(req => req.id === requestId);
    if (!request) {
      throw new Error('Purchase request not found');
    }

    // Atualizar status da solicitação
    request.status = 'APPROVED';
    request.approvedBy = approverName;
    request.approvalDate = new Date().toISOString();
    request.approvalNotes = notes;
    request.updatedAt = new Date().toISOString();

    // Criar movimentações de estoque simuladas
    const movements: InventoryMovement[] = request.items?.map(item => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemId: item.productId || '',
      movementType: 'ENTRY' as any,
      quantity: item.quantity || 0,
      reason: `Entrada via compra - ${request.requestNumber}`,
      responsiblePerson: approverName,
      movementDate: new Date().toISOString(),
      notes: `Fornecedor: ${request.supplier || 'Não informado'}`
    })) || [];

    return {
      purchaseRequest: request,
      inventoryMovements: movements
    };
  }

  async generatePurchaseOrderFromService(serviceOrderId: string): Promise<InventoryRequest> {
    await this.delay(700);
    
    const newRequest: InventoryRequest = {
      id: Date.now().toString(),
      requestNumber: `SC-OS-${new Date().getFullYear()}-${String(mockPurchaseRequests.length + 1).padStart(3, '0')}`,
      title: `Compra para Ordem de Serviço ${serviceOrderId}`,
      description: `Peças necessárias para execução da Ordem de Serviço ${serviceOrderId}`,
      priority: 'HIGH',
      status: 'PENDING',
      requesterName: 'Sistema Automático',
      department: 'Manutenção',
      justification: 'Compra gerada automaticamente a partir de Ordem de Serviço',
      estimatedTotal: 0,
      urgency: 'NORMAL',
      requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      requestDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      urgent: false,
      canBeApproved: true,
      overdue: false,
      daysUntilRequired: 7,
      totalItems: 0,
      totalValue: 0
    };

    mockPurchaseRequests.push(newRequest);
    return newRequest;
  }

  async createUnifiedSupplier(supplierData: CreateSupplierRequest): Promise<Supplier> {
    await this.delay(600);
    
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name: supplierData.name,
      cnpj: supplierData.cnpj,
      email: supplierData.email,
      phone: supplierData.phone,
      address: supplierData.address,
      city: supplierData.city,
      state: supplierData.state,
      cep: supplierData.cep,
      category: supplierData.category || 'Geral',
      isActive: supplierData.isActive !== false,
      paymentTerms: supplierData.paymentTerms || '30 dias',
      deliveryTime: supplierData.deliveryTime || 5,
      minimumOrder: supplierData.minimumOrder || 0,
      notes: supplierData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockSuppliers.push(newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, supplierData: any): Promise<Supplier> {
    await this.delay(500);
    
    const supplierIndex = mockSuppliers.findIndex(s => s.id === id);
    if (supplierIndex === -1) {
      throw new Error('Supplier not found');
    }

    mockSuppliers[supplierIndex] = { ...mockSuppliers[supplierIndex], ...supplierData, updatedAt: new Date().toISOString() };
    return mockSuppliers[supplierIndex];
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.delay(400);
    const index = mockSuppliers.findIndex(s => s.id === id);
    if (index !== -1) {
      mockSuppliers.splice(index, 1);
    }
  }

  async getItemsNeedingPurchase(): Promise<InventoryItem[]> {
    await this.delay(300);
    return mockItems.filter(item => item.quantity <= item.minimumQuantity);
  }

  async validatePurchaseRequest(request: CreatePurchaseRequestRequest): Promise<{
    valid: boolean;
    warnings: string[];
    suggestions: string[];
  }> {
    await this.delay(200);
    
    const warnings: string[] = [];
    const suggestions: string[] = [];
    
    if (!request.items || request.items.length === 0) {
      return { valid: false, warnings: ['Nenhum item na solicitação'], suggestions: [] };
    }
    
    for (const item of request.items) {
      if (item.currentStock !== undefined && item.minimumStock !== undefined) {
        if (item.currentStock === 0) {
          warnings.push(`${item.itemName} está sem estoque`);
          suggestions.push(`Considerar urgência alta para ${item.itemName}`);
        } else if (item.currentStock < item.minimumStock) {
          warnings.push(`${item.itemName} com estoque abaixo do mínimo`);
          suggestions.push(`Aumentar quantidade de ${item.itemName} para evitar ruptura`);
        }
      }
    }
    
    return {
      valid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  async checkAndGeneratePurchaseRequests(): Promise<InventoryRequest[]> {
    await this.delay(1000);
    
    const itemsNeedingPurchase = await this.getItemsNeedingPurchase();
    const generatedRequests: InventoryRequest[] = [];
    
    if (itemsNeedingPurchase.length > 0) {
      const criticalItems = itemsNeedingPurchase.filter(item => item.quantity <= item.minimumQuantity / 2);
      const lowStockItems = itemsNeedingPurchase.filter(item => 
        item.quantity <= item.minimumQuantity && item.quantity > item.minimumQuantity / 2
      );
      
      if (criticalItems.length > 0) {
        const criticalRequest = await this.createPurchaseRequest({
          title: `Compra Urgente - Estoque Crítico`,
          description: `Solicitação gerada automaticamente devido a estoque crítico de ${criticalItems.length} item(ns)`,
          priority: 'URGENT',
          urgency: 'IMMEDIATE',
          justification: 'Compra gerada automaticamente pelo sistema devido a níveis críticos de estoque'
        });
        generatedRequests.push(criticalRequest);
      }
      
      if (lowStockItems.length > 0) {
        const lowStockRequest = await this.createPurchaseRequest({
          title: `Compra Programada - Estoque Baixo`,
          description: `Solicitação gerada automaticamente para ${lowStockItems.length} item(ns) com estoque baixo`,
          priority: 'MEDIUM',
          urgency: 'NORMAL',
          justification: 'Compra gerada automaticamente pelo sistema para reposição de estoque'
        });
        generatedRequests.push(lowStockRequest);
      }
    }
    
    return generatedRequests;
  }

  // Métodos não implementados (delegados para o serviço real)
  async createInventoryItem(itemData: any): Promise<InventoryItem> {
    throw new Error('Método não implementado no serviço mock');
  }

  async updateInventoryItem(id: string, itemData: any): Promise<InventoryItem> {
    throw new Error('Método não implementado no serviço mock');
  }

  async deleteInventoryItem(id: string): Promise<void> {
    throw new Error('Método não implementado no serviço mock');
  }

  async createInventoryMovement(movementData: any): Promise<InventoryMovement> {
    throw new Error('Método não implementado no serviço mock');
  }

  private getStockStatus(quantity: number, minimum: number): string {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= minimum / 2) return 'CRITICAL';
    if (quantity <= minimum) return 'LOW';
    return 'NORMAL';
  }
}

export default MockUnifiedInventoryService;
