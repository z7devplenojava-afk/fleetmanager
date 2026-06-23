import api from '@/lib/axios';
import { 
  InventoryItem, 
  InventoryMovement, 
  InventoryMovementDTO,
  InventoryRequest,
  InventoryRequestItem,
  ServiceOrder,
  ServiceOrderItem,
  ItemCategory,
  ItemType,
  ItemStatus,
  MovementType
} from '@/types/inventory';

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  requesterName?: string;
  department?: string;
  justification?: string;
  estimatedTotal?: number;
  urgency: string;
  requiredDate?: string;
  requestDate: string;
  approvalDate?: string;
  completionDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  supplier?: string;
  paymentMethod?: string;
  installments?: number;
  deliveryMethod?: string;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  unitId?: string;
  unitName?: string;
  requesterId?: string;
  approverId?: string;
  approverName?: string;
  createdAt: string;
  updatedAt: string;
  
  // Campos calculados
  urgent: boolean;
  canBeApproved: boolean;
  overdue: boolean;
  daysUntilRequired: number;
  items?: PurchaseRequestItem[];
  totalItems: number;
  totalValue: number;
}

export interface PurchaseRequestItem {
  id: string;
  purchaseRequestId: string;
  productId?: string;
  productName?: string;
  itemName: string;
  description?: string;
  specification?: string;
  unit?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  brand?: string;
  model?: string;
  supplier?: string;
  priority: string;
  status: string;
  justification?: string;
  alternativeSupplier?: string;
  notes?: string;
  urgency: string;
  currentStock?: number;
  minimumStock?: number;
  stockStatus?: string;
  approvedBy?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // Campos calculados
  urgent: boolean;
  lowStock: boolean;
  outOfStock: boolean;
}

export interface CreatePurchaseRequestRequest {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  requesterName?: string;
  department?: string;
  justification?: string;
  estimatedTotal?: number;
  urgency?: string;
  requiredDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  supplier?: string;
  paymentMethod?: string;
  installments?: number;
  deliveryMethod?: string;
  deliveryAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  items?: PurchaseRequestItem[];
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  category?: string;
  isActive?: boolean;
  paymentTerms?: string;
  deliveryTime?: number;
  minimumOrder?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cep?: string;
  category?: string;
  isActive?: boolean;
  paymentTerms?: string;
  deliveryTime?: number;
  minimumOrder?: number;
  notes?: string;
}

class UnifiedInventoryService {
  private static instance: UnifiedInventoryService;

  private constructor() {}

  static getInstance(): UnifiedInventoryService {
    if (!UnifiedInventoryService.instance) {
      UnifiedInventoryService.instance = new UnifiedInventoryService();
    }
    return UnifiedInventoryService.instance;
  }

  // ===== INTEGRATED INVENTORY METHODS =====

  // Get items with stock status for purchase suggestions
  async getItemsForPurchase(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/all');
    return response.data.map((item: InventoryItem) => ({
      ...item,
      needsPurchase: item.quantity <= item.minimumQuantity,
      suggestedPurchaseQuantity: Math.max(item.minimumQuantity * 2 - item.quantity, item.minimumQuantity),
      stockStatus: this.getStockStatus(item.quantity, item.minimumQuantity)
    }));
  }

  // Create purchase request based on low stock
  async createPurchaseFromLowStock(items: InventoryItem[]): Promise<PurchaseRequest> {
    const purchaseItems: PurchaseRequestItem[] = items.map(item => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      itemName: item.name,
      description: item.description,
      quantity: Math.max(item.minimumQuantity * 2 - item.quantity, item.minimumQuantity),
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * Math.max(item.minimumQuantity * 2 - item.quantity, item.minimumQuantity),
      currentStock: item.quantity,
      minimumStock: item.minimumQuantity,
      stockStatus: this.getStockStatus(item.quantity, item.minimumQuantity),
      urgent: item.quantity <= item.minimumQuantity / 2,
      lowStock: item.quantity <= item.minimumQuantity,
      outOfStock: item.quantity === 0
    }));

    const purchaseRequest: CreatePurchaseRequestRequest = {
      title: `Compra Automática - Estoque Baixo`,
      description: `Solicitação gerada automaticamente devido a baixo estoque de ${items.length} item(ns)`,
      priority: items.some(item => item.quantity <= item.minimumQuantity / 2) ? 'URGENT' : 'MEDIUM',
      urgency: items.some(item => item.quantity === 0) ? 'IMMEDIATE' : 'NORMAL',
      justification: 'Compra gerada automaticamente pelo sistema devido a níveis críticos de estoque',
      estimatedTotal: purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
      items: purchaseItems
    };

    const response = await api.post('/purchase-requests/auto-generated', purchaseRequest);
    return response.data;
  }

  // Auto-generate entry when purchase is approved
  async createInventoryEntryFromPurchase(purchaseRequest: PurchaseRequest): Promise<InventoryMovement> {
    if (!purchaseRequest.items || purchaseRequest.items.length === 0) {
      throw new Error('Purchase request has no items');
    }

    // Create inventory movement for each item
    const movements: InventoryMovement[] = [];
    
    for (const item of purchaseRequest.items) {
      if (item.productId) {
        const movement: InventoryMovementDTO = {
          itemId: item.productId,
          movementType: MovementType.ENTRY,
          quantity: item.quantity || 0,
          reason: `Entrada via compra - ${purchaseRequest.requestNumber}`,
          responsiblePerson: purchaseRequest.approvedBy || 'Sistema',
          notes: `Fornecedor: ${purchaseRequest.supplier || 'Não informado'}`
        };

        const movementResponse = await api.post('/inventory-movements', movement);
        movements.push(movementResponse.data);
      }
    }

    return movements[0]; // Return first movement for reference
  }

  // Update stock when service order consumes items
  async updateStockFromServiceOrder(serviceOrder: ServiceOrder): Promise<InventoryMovement[]> {
    const movements: InventoryMovement[] = [];
    
    for (const item of serviceOrder.items) {
      if (item.type === 'PART' && item.partNumber) {
        // Find inventory item by part number
        const itemResponse = await api.get(`/inventory-items/by-part-number/${item.partNumber}`);
        const inventoryItem: InventoryItem = itemResponse.data;
        
        if (inventoryItem) {
          const movement: InventoryMovementDTO = {
            itemId: inventoryItem.id,
            movementType: MovementType.EXIT,
            quantity: item.appliedQuantity || item.quantity,
            reason: `Baixa via Ordem de Serviço - ${serviceOrder.orderNumber}`,
            responsiblePerson: serviceOrder.createdBy,
            notes: `Cliente: ${serviceOrder.clientName} - Veículo: ${serviceOrder.vehiclePlate}`
          };

          const movementResponse = await api.post('/inventory-movements', movement);
          movements.push(movementResponse.data);
        }
      }
    }

    return movements;
  }

  // Get unified suppliers for both modules
  async getUnifiedSuppliers(): Promise<Supplier[]> {
    const response = await api.get('/suppliers/unified');
    return response.data;
  }

  // Create supplier used in both modules
  async createUnifiedSupplier(supplier: CreateSupplierRequest): Promise<Supplier> {
    const response = await api.post('/suppliers/unified', supplier);
    return response.data;
  }

  // Get purchase requests with inventory integration
  async getPurchaseRequestsWithInventory(): Promise<PurchaseRequest[]> {
    const response = await api.get('/purchase-requests/with-inventory');
    return response.data;
  }

  // Get items that need purchase
  async getItemsNeedingPurchase(): Promise<InventoryItem[]> {
    const response = await api.get('/inventory-items/needing-purchase');
    return response.data;
  }

  // Get purchase suggestions based on consumption
  async getPurchaseSuggestions(): Promise<any[]> {
    const response = await api.get('/inventory-items/purchase-suggestions');
    return response.data;
  }

  // Approve purchase request and create inventory entry
  async approvePurchaseRequestWithInventory(
    requestId: string, 
    approverName: string, 
    notes?: string
  ): Promise<{ purchaseRequest: PurchaseRequest; inventoryMovements: InventoryMovement[] }> {
    // First approve the purchase request
    const approveResponse = await api.post(`/purchase-requests/${requestId}/approve`, {
      approverName,
      notes
    });
    
    const purchaseRequest: PurchaseRequest = approveResponse.data;
    
    // Then create inventory entries
    const movements = await this.createInventoryEntryFromPurchase(purchaseRequest);
    
    return {
      purchaseRequest,
      inventoryMovements: movements
    };
  }

  // Get unified dashboard data
  async getUnifiedDashboard(): Promise<any> {
    const response = await api.get('/inventory/unified-dashboard');
    return response.data;
  }

  // Get stock status helper
  private getStockStatus(quantity: number, minimum: number): string {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= minimum / 2) return 'CRITICAL';
    if (quantity <= minimum) return 'LOW';
    return 'NORMAL';
  }

  // Generate purchase order from service order items
  async generatePurchaseOrderFromService(serviceOrderId: string): Promise<PurchaseRequest> {
    const serviceOrderResponse = await api.get(`/service-orders/${serviceOrderId}`);
    const serviceOrder: ServiceOrder = serviceOrderResponse.data;
    
    const purchaseItems: PurchaseRequestItem[] = serviceOrder.items
      .filter(item => item.type === 'PART')
      .map(item => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        itemName: item.description,
        description: `Peça necessária para Ordem de Serviço ${serviceOrder.orderNumber}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        specification: `Veículo: ${serviceOrder.vehiclePlate}`,
        priority: 'HIGH',
        urgency: 'NORMAL'
      }));

    const purchaseRequest: CreatePurchaseRequestRequest = {
      title: `Compra para O.S. ${serviceOrder.orderNumber}`,
      description: `Peças necessárias para execução da Ordem de Serviço ${serviceOrder.orderNumber} - Cliente: ${serviceOrder.clientName}`,
      priority: 'HIGH',
      urgency: 'NORMAL',
      justification: 'Compra gerada a partir de Ordem de Serviço',
      estimatedTotal: purchaseItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
      items: purchaseItems
    };

    const response = await api.post('/purchase-requests/from-service-order', purchaseRequest);
    return response.data;
  }

  // Check and auto-generate purchase requests
  async checkAndGeneratePurchaseRequests(): Promise<PurchaseRequest[]> {
    const itemsNeedingPurchase = await this.getItemsNeedingPurchase();
    const generatedRequests: PurchaseRequest[] = [];
    
    // Group items by priority and urgency
    const criticalItems = itemsNeedingPurchase.filter(item => item.quantity <= item.minimumQuantity / 2);
    const lowStockItems = itemsNeedingPurchase.filter(item => 
      item.quantity <= item.minimumQuantity && item.quantity > item.minimumQuantity / 2
    );
    
    // Generate requests for critical items immediately
    if (criticalItems.length > 0) {
      const criticalRequest = await this.createPurchaseFromLowStock(criticalItems);
      generatedRequests.push(criticalRequest);
    }
    
    // Group low stock items by supplier for efficiency
    if (lowStockItems.length > 0) {
      const lowStockRequest = await this.createPurchaseFromLowStock(lowStockItems);
      generatedRequests.push(lowStockRequest);
    }
    
    return generatedRequests;
  }

  // Get inventory consumption report
  async getConsumptionReport(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/inventory/consumption-report?${params.toString()}`);
    return response.data;
  }

  // Get purchase forecast
  async getPurchaseForecast(months: number = 3): Promise<any> {
    const response = await api.get(`/inventory/purchase-forecast?months=${months}`);
    return response.data;
  }

  // Get supplier performance
  async getSupplierPerformance(supplierId: string): Promise<any> {
    const response = await api.get(`/suppliers/${supplierId}/performance`);
    return response.data;
  }

  // Validate purchase request against stock
  async validatePurchaseRequest(request: CreatePurchaseRequestRequest): Promise<{
    valid: boolean;
    warnings: string[];
    suggestions: string[];
  }> {
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
}

export default UnifiedInventoryService.getInstance();
