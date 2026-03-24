import api from '@/lib/axios';

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
  unitId?: string;
  requesterId?: string;
  approverId?: string;
}

export interface UpdatePurchaseRequestRequest extends CreatePurchaseRequestRequest {
  id: string;
}

class PurchaseRequestService {
  async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    const response = await api.get('/api/purchase-requests');
    return response.data;
  }

  async getPurchaseRequestById(id: string): Promise<PurchaseRequest> {
    const response = await api.get(`/api/purchase-requests/${id}`);
    return response.data;
  }

  async createPurchaseRequest(request: CreatePurchaseRequestRequest): Promise<PurchaseRequest> {
    const response = await api.post('/api/purchase-requests', request);
    return response.data;
  }

  async updatePurchaseRequest(id: string, request: UpdatePurchaseRequestRequest): Promise<PurchaseRequest> {
    const response = await api.put(`/api/purchase-requests/${id}`, request);
    return response.data;
  }

  async deletePurchaseRequest(id: string): Promise<void> {
    await api.delete(`/api/purchase-requests/${id}`);
  }

  async approveRequest(id: string, approverName: string, approvalNotes?: string): Promise<PurchaseRequest> {
    const params = new URLSearchParams();
    params.append('approverName', approverName);
    if (approvalNotes) {
      params.append('approvalNotes', approvalNotes);
    }
    
    const response = await api.post(`/api/purchase-requests/${id}/approve?${params.toString()}`);
    return response.data;
  }

  async rejectRequest(id: string, rejectorName: string, rejectionReason: string): Promise<PurchaseRequest> {
    const params = new URLSearchParams();
    params.append('rejectorName', rejectorName);
    params.append('rejectionReason', rejectionReason);
    
    const response = await api.post(`/api/purchase-requests/${id}/reject?${params.toString()}`);
    return response.data;
  }

  async completeRequest(id: string): Promise<PurchaseRequest> {
    const response = await api.post(`/api/purchase-requests/${id}/complete`);
    return response.data;
  }

  async getRequestsByStatus(status: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/status/${status}`);
    return response.data;
  }

  async getRequestsByPriority(priority: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/priority/${priority}`);
    return response.data;
  }

  async getRequestsByRequester(requesterId: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/requester/${requesterId}`);
    return response.data;
  }

  async getRequestsByApprover(approverId: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/approver/${approverId}`);
    return response.data;
  }

  async getRequestsByUnit(unitId: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/unit/${unitId}`);
    return response.data;
  }

  async getOverdueRequests(): Promise<PurchaseRequest[]> {
    const response = await api.get('/api/purchase-requests/overdue');
    return response.data;
  }

  async getUrgentRequests(): Promise<PurchaseRequest[]> {
    const response = await api.get('/api/purchase-requests/urgent');
    return response.data;
  }

  async getPendingApprovalRequests(): Promise<PurchaseRequest[]> {
    const response = await api.get('/api/purchase-requests/pending-approval');
    return response.data;
  }

  async searchRequests(searchTerm: string): Promise<PurchaseRequest[]> {
    const response = await api.get(`/api/purchase-requests/search?searchTerm=${encodeURIComponent(searchTerm)}`);
    return response.data;
  }

  async getRequestsCountByStatus(status: string): Promise<number> {
    const response = await api.get(`/api/purchase-requests/stats/count/${status}`);
    return response.data;
  }

  async getUrgentRequestsCount(): Promise<number> {
    const response = await api.get('/api/purchase-requests/stats/urgent-count');
    return response.data;
  }

  async getOverdueRequestsCount(): Promise<number> {
    const response = await api.get('/api/purchase-requests/stats/overdue-count');
    return response.data;
  }
}

export const purchaseRequestService = new PurchaseRequestService();