import api from './api';

export type ComparisonStatus = 'IN_QUOTATION' | 'READY_FOR_EVALUATION' | 'APPROVED' | 'REJECTED';
export type PurchaseOrderStatus =
  | 'PENDING_FINANCIAL_APPROVAL'
  | 'FINANCIAL_APPROVED'
  | 'PURCHASED_IN_TRANSIT'
  | 'DELIVERED_IN_ALMOXARIFADO'
  | 'CANCELLED';

export interface ProcurementQuoteOption {
  id?: string;
  comparisonId?: string;
  supplierName: string;
  supplierCnpj?: string;
  supplierContact?: string;
  supplierPhone?: string;
  unitPrice: number;
  totalPrice: number;
  paymentTerms: string; // À VISTA, 30 DIAS, 30/60 DIAS, 30/60/90 DIAS
  paymentTermDays?: number;
  deliveryTimeDays: number;
  shippingCost?: number;
  warrantyMonths?: number;
  isWinner?: boolean;
  isSystemRecommended?: boolean;
  proposalAttachmentUrl?: string;
  notes?: string;
}

export interface ProcurementQuoteComparison {
  id: string;
  companyId: string;
  requisitionId: string;
  requisitionNumber: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unit: string;
  urgency: string;
  vehiclePlate?: string;
  workOrderNumber?: string;
  comparisonNumber: string;
  status: ComparisonStatus;
  systemRecommendedOptionId?: string;
  systemRecommendationReason?: string;
  chosenOptionId?: string;
  overrideReason?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  options: ProcurementQuoteOption[];
}

export interface ProcurementPurchaseOrder {
  id: string;
  companyId: string;
  ocNumber: string;
  requisitionId: string;
  requisitionNumber: string;
  workOrderId?: string;
  workOrderNumber?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  comparisonId?: string;
  winningQuoteOptionId?: string;
  supplierName: string;
  supplierCnpj?: string;
  supplierContact?: string;
  supplierPhone?: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentTerms: string;
  deliveryEstimatedDate?: string;
  urgency: string;
  justification: string;
  status: PurchaseOrderStatus;
  statusDescription: string;
  financialApprovedById?: string;
  financialApprovedByName?: string;
  financialApprovedAt?: string;
  financialNotes?: string;
  // Programação Financeira & Cartão de Crédito
  paymentMethod?: string;
  installmentsCount?: number;
  cardNumber?: string;
  cardFlag?: string;
  paymentReference?: string;
  paymentScheduledDate?: string;
  paymentDueDate?: string;
  paymentStatus?: 'PENDING_PROGRAMMING' | 'PROGRAMMED' | 'PAID' | 'CANCELLED';
  installmentDetails?: string;
  financialProgrammedById?: string;
  financialProgrammedByName?: string;
  financialProgrammedAt?: string;

  invoiceNumber?: string;
  invoiceKey?: string;
  invoiceReceivedAt?: string;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockInvoiceEntry {
  id: string;
  companyId: string;
  purchaseOrderId?: string;
  ocNumber?: string;
  requisitionId?: string;
  requisitionNumber?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  stockItemId?: string;
  stockItemName?: string;
  stockItemCode?: string;
  invoiceNumber: string;
  invoiceSeries?: string;
  invoiceKey?: string;
  supplierName: string;
  supplierCnpj?: string;
  issueDate?: string;
  entryDate: string;
  quantityReceived: number;
  unitCost: number;
  totalInvoiceCost: number;
  receivedById?: string;
  receivedByName?: string;
  entryType: 'PURCHASE_ORDER' | 'MANUAL_ENTRY' | 'XML_IMPORT';
  isReleasedToWorkOrder: boolean;
  leadTimeMinutes?: number;
  formattedLeadTime?: string;
  notes?: string;
  createdAt: string;
}

export interface SaveTripleQuotesPayload {
  requisitionId: string;
  options: ProcurementQuoteOption[];
}

export interface ApproveQuotePayload {
  comparisonId: string;
  chosenOptionId: string;
  overrideReason?: string;
  approverNotes?: string;
}

export interface FinancialApprovalPayload {
  purchaseOrderId: string;
  approved: boolean;
  financialNotes?: string;
  paymentMethod?: string;
  installmentsCount?: number;
  cardNumber?: string;
  cardFlag?: string;
  paymentReference?: string;
  paymentScheduledDate?: string;
  paymentDueDate?: string;
  installmentDetails?: string;
}

export interface InvoiceEntryPayload {
  purchaseOrderId?: string;
  requisitionId?: string;
  stockItemId?: string;
  invoiceNumber: string;
  invoiceSeries?: string;
  invoiceKey?: string;
  supplierName: string;
  supplierCnpj?: string;
  issueDate?: string;
  quantityReceived: number;
  unitCost: number;
  totalInvoiceCost: number;
  entryType?: 'PURCHASE_ORDER' | 'MANUAL_ENTRY' | 'XML_IMPORT';
  releaseToWorkOrder?: boolean;
  notes?: string;
}

export const procurementService = {
  getQuotesByRequisition: async (requisitionId: string): Promise<ProcurementQuoteComparison | null> => {
    const response = await api.get(`/api/procurement/quotes/by-requisition/${requisitionId}`);
    return response.data;
  },

  saveTripleQuotes: async (payload: SaveTripleQuotesPayload): Promise<ProcurementQuoteComparison> => {
    const response = await api.post('/api/procurement/quotes/triple', payload);
    return response.data;
  },

  approveQuote: async (payload: ApproveQuotePayload): Promise<ProcurementPurchaseOrder> => {
    const response = await api.post('/api/procurement/quotes/approve', payload);
    return response.data;
  },

  listPurchaseOrders: async (status?: PurchaseOrderStatus): Promise<ProcurementPurchaseOrder[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/api/procurement/purchase-orders${params}`);
    return response.data;
  },

  financialApproval: async (payload: FinancialApprovalPayload): Promise<ProcurementPurchaseOrder> => {
    const response = await api.post('/api/procurement/purchase-orders/financial-approval', payload);
    return response.data;
  },

  registerInvoiceEntry: async (payload: InvoiceEntryPayload): Promise<StockInvoiceEntry> => {
    const response = await api.post('/api/procurement/invoices/entry', payload);
    return response.data;
  },

  listInvoiceEntries: async (): Promise<StockInvoiceEntry[]> => {
    const response = await api.get('/api/procurement/invoices/entries');
    return response.data;
  }
};
