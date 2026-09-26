import api from '@/lib/axios';

export type WarehouseInventoryScope = 'ALL' | 'CATEGORY' | 'LOCATION' | 'PRODUCT';
export type WarehouseInventoryStatus = 
  | 'CRIADO' 
  | 'EM_CONTAGEM' 
  | 'CONFERENCIA' 
  | 'AGUARDANDO_APROVACAO' 
  | 'FINALIZADO' 
  | 'CANCELADO';

export interface WarehouseInventoryItem {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  trackingType: string;
  unit?: string;
  locationId: string;
  locationName: string;
  unitCost: number;
  quantitySystem?: number | null;
  quantityCount1?: number | null;
  quantityCount2?: number | null;
  quantityFinal?: number | null;
  difference?: number | null;
  divergenceValue?: number | null;
  status: string;
}

export interface WarehouseInventoryScannedSerial {
  id: string;
  productId: string;
  productName: string;
  serialOrDot: string;
  foundInSystem: boolean;
  createdAt: string;
}

export interface WarehouseInventoryAudit {
  id: string;
  code: string;
  description: string;
  scopeType: WarehouseInventoryScope;
  targetCategoryId?: string;
  targetCategoryName?: string;
  targetLocationId?: string;
  targetLocationName?: string;
  freezeMovements: boolean;
  status: WarehouseInventoryStatus;
  openedByUserId: string;
  openedByName?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  openedAt: string;
  closedAt?: string;
  notes?: string;
  totalItems: number;
  divergentItems: number;
  totalDivergenceValue: number;
  items: WarehouseInventoryItem[];
  scannedSerials: WarehouseInventoryScannedSerial[];
}

export interface CreateInventoryPayload {
  code: string;
  description: string;
  scopeType: WarehouseInventoryScope;
  targetCategoryId?: string;
  targetLocationId?: string;
  freezeMovements?: boolean;
  notes?: string;
}

export interface SubmitCountPayload {
  countRound: number;
  items: {
    itemId: string;
    countedQuantity?: number;
    scannedSerials?: string[];
  }[];
}

export interface ApproveInventoryPayload {
  justification: string;
  notes?: string;
}

class WarehouseInventoryService {
  async list(status?: WarehouseInventoryStatus): Promise<{ content: WarehouseInventoryAudit[]; totalElements: number }> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      const res = await api.get(`/api/warehouse/inventory?${params.toString()}`);
      return res.data || { content: [], totalElements: 0 };
    } catch (error) {
      console.warn('Endpoint /api/warehouse/inventory ainda não disponível no backend:', error);
      return { content: [], totalElements: 0 };
    }
  }

  async getById(id: string, blind: boolean = false): Promise<WarehouseInventoryAudit> {
    const res = await api.get(`/api/warehouse/inventory/${id}?blind=${blind}`);
    return res.data;
  }

  async create(payload: CreateInventoryPayload): Promise<WarehouseInventoryAudit> {
    const res = await api.post('/api/warehouse/inventory', payload);
    return res.data;
  }

  async startCount(id: string): Promise<WarehouseInventoryAudit> {
    const res = await api.post(`/api/warehouse/inventory/${id}/start`);
    return res.data;
  }

  async submitCount(id: string, payload: SubmitCountPayload): Promise<WarehouseInventoryAudit> {
    const res = await api.post(`/api/warehouse/inventory/${id}/submit-count`, payload);
    return res.data;
  }

  async approve(id: string, payload: ApproveInventoryPayload): Promise<WarehouseInventoryAudit> {
    const res = await api.post(`/api/warehouse/inventory/${id}/approve`, payload);
    return res.data;
  }

  async cancel(id: string, reason?: string): Promise<WarehouseInventoryAudit> {
    const params = new URLSearchParams();
    if (reason) params.append('reason', reason);
    const res = await api.post(`/api/warehouse/inventory/${id}/cancel?${params.toString()}`);
    return res.data;
  }
}

export const warehouseInventoryService = new WarehouseInventoryService();
