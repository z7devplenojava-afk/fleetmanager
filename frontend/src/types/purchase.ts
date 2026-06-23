export interface InventoryRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency: 'NORMAL' | 'IMMEDIATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';
  requesterName?: string;
  department?: string;
  justification?: string;
  estimatedTotal?: number;
  items?: InventoryRequestItem[];
  requiredDate?: string;
  requestDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  urgent?: boolean;
  canBeApproved?: boolean;
  overdue?: boolean;
  daysUntilRequired?: number;
  totalItems?: number;
  totalValue?: number;
}

export interface InventoryRequestItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  specification?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency?: 'NORMAL' | 'IMMEDIATE';
  currentStock?: number;
  minimumStock?: number;
  productId?: string;
  appliedQuantity?: number;
  returnedQuantity?: number;
}

export interface PurchaseOrderData {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  items: PurchaseOrderItem[];
  totalValue: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT' | 'RECEIVED';
  emergencyPurchase: boolean;
  createdAt: string;
  approvedAt?: string;
  sentAt?: string;
  receivedAt?: string;
  quotations?: PurchaseQuotation[];
}

export interface PurchaseQuotation {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  items: QuotationItem[];
  totalValue: number;
  deliveryTime: number;
  paymentTerms: string;
  validity: string;
  createdAt: string;
  selected?: boolean;
}

export interface QuotationItem {
  itemId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  available: boolean;
  deliveryTime?: number;
}

export interface PurchaseOrderItem {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specification: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency: 'NORMAL' | 'IMMEDIATE';
  partNumber?: string;
}

export interface CreatePurchaseRequestRequest {
  title: string;
  description: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency?: 'NORMAL' | 'IMMEDIATE';
  justification?: string;
  estimatedTotal?: number;
  items?: InventoryRequestItem[];
  requesterName?: string;
  department?: string;
  requiredDate?: string;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  urgency: 'NORMAL' | 'IMMEDIATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';
  requesterName?: string;
  department?: string;
  justification?: string;
  estimatedTotal?: number;
  items?: InventoryRequestItem[];
  requiredDate?: string;
  requestDate?: string;
  approvalDate?: string;
  approvedBy?: string;
  approvalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
  urgent?: boolean;
  canBeApproved?: boolean;
  overdue?: boolean;
  daysUntilRequired?: number;
  totalItems?: number;
  totalValue?: number;
}
