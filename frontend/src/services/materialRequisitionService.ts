import api from './api';

export type RequisitionUrgency = 'NORMAL' | 'EMERGENCIA';

export type RequisitionStatus =
  | 'PENDING_CHECK'
  | 'RESERVED_STOCK'
  | 'WAITING_QUOTES'
  | 'QUOTES_RECEIVED'
  | 'APPROVED_BY_MANAGER'
  | 'OC_GENERATED'
  | 'WAITING_DELIVERY'
  | 'AVAILABLE_FOR_INSTALLATION'
  | 'INSTALLED_COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface ReservationConflictDetail {
  reservationId: string;
  workOrderId: string;
  workOrderNumber: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  quantityReserved: number;
  status: string;
}

export interface StockItemAvailability {
  stockItemId: string;
  itemName: string;
  itemCode: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableFreeQuantity: number;
  isAvailable: boolean;
  hasConflict: boolean;
  activeReservations: ReservationConflictDetail[];
}

export interface MaterialRequisition {
  id: string;
  companyId: string;
  requisitionNumber: string;
  workOrderId?: string;
  workOrderNumber?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  stockItemId?: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unit: string;
  urgency: RequisitionUrgency;
  justification: string;
  requesterId?: string;
  requesterName?: string;
  originDepartment?: 'OPERATIONAL' | 'RH_DP' | 'STOCK' | string;
  status: RequisitionStatus;
  statusDescription: string;
  managerApprovalId?: string;
  managerApprovalName?: string;
  managerApprovalDate?: string;
  rejectionReason?: string;
  releasedAt?: string;
  slaLeadTimeMinutes?: number;
  slaTargetMinutes?: number;
  isSlaBreached?: boolean;
  createdAt: string;
  updatedAt: string;
  purchaseOrderId?: string;
  ocNumber?: string;
  quoteComparisonId?: string;
  deliveryDate?: string;
  deliveredAt?: string;
  deliveredById?: string;
  deliveredByName?: string;
  receivedByName?: string;
  deliveryNotes?: string;
}

export interface CreateRequisitionPayload {
  workOrderId?: string;
  vehicleId?: string;
  stockItemId?: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unit?: string;
  urgency: RequisitionUrgency;
  justification: string;
  originDepartment?: string;
}

export interface UpdateRequisitionPayload {
  workOrderId?: string;
  vehicleId?: string;
  stockItemId?: string;
  itemName: string;
  itemCode?: string;
  quantity: number;
  unit?: string;
  urgency: RequisitionUrgency;
  justification: string;
  originDepartment?: string;
}

export interface ConfirmDeliveryPayload {
  deliveryDate?: string;
  receivedByName?: string;
  notes?: string;
}

export const materialRequisitionService = {
  checkAvailability: async (stockItemId: string, excludeWorkOrderId?: string): Promise<StockItemAvailability> => {
    const params = new URLSearchParams({ stockItemId });
    if (excludeWorkOrderId) params.append('excludeWorkOrderId', excludeWorkOrderId);
    const response = await api.get(`/api/material-requisitions/check-availability?${params.toString()}`);
    return response.data;
  },

  createRequisition: async (payload: CreateRequisitionPayload): Promise<MaterialRequisition> => {
    const response = await api.post('/api/material-requisitions', payload);
    return response.data;
  },

  updateRequisition: async (id: string, payload: UpdateRequisitionPayload): Promise<MaterialRequisition> => {
    const response = await api.put(`/api/material-requisitions/${id}`, payload);
    return response.data;
  },

  deleteRequisition: async (id: string): Promise<void> => {
    await api.delete(`/api/material-requisitions/${id}`);
  },

  bulkDeleteRequisitions: async (ids: string[]): Promise<{ requested: number; deleted: number; skippedNonPending: number; messages: string[] }> => {
    const response = await api.post('/api/material-requisitions/bulk-delete', { ids });
    return response.data;
  },

  approveRequisition: async (id: string, notes?: string): Promise<MaterialRequisition> => {
    const response = await api.post(`/api/material-requisitions/${id}/approve`, { notes });
    return response.data;
  },

  rejectRequisition: async (id: string, reason: string): Promise<MaterialRequisition> => {
    const response = await api.post(`/api/material-requisitions/${id}/reject`, { reason });
    return response.data;
  },

  listRequisitions: async (status?: RequisitionStatus): Promise<MaterialRequisition[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/api/material-requisitions${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<MaterialRequisition> => {
    const response = await api.get(`/api/material-requisitions/${id}`);
    return response.data;
  },

  reserveStockDirectly: async (workOrderId: string, stockItemId: string, quantity: number, notes?: string) => {
    const response = await api.post('/api/material-requisitions/reserve-stock', {
      workOrderId,
      stockItemId,
      quantity,
      notes
    });
    return response.data;
  },

  confirmDelivery: async (id: string, payload?: ConfirmDeliveryPayload): Promise<MaterialRequisition> => {
    const response = await api.post(`/api/material-requisitions/${id}/deliver`, payload || {});
    return response.data;
  }
};
