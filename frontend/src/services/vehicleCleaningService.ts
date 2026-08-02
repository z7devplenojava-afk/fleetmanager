import api from '@/lib/axios';

export type CleaningStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type CleaningType = 'INTERNAL' | 'EXTERNAL' | 'COMPLETE';

export interface ChecklistItem {
  key: string;
  title: string;
  category: 'INTERNAL' | 'EXTERNAL';
  checked: boolean;
  photoUrl?: string | null;
}

export interface VehicleCleaningOrder {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  driverId?: string;
  driverName?: string;
  status: CleaningStatus;
  cleaningType: CleaningType;
  checklistData?: string;
  observations?: string;
  driverPhone?: string;
  driverUserId?: string;
  requestedBy?: string;
  completedAt?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCleaningOrderRequest {
  vehicleId: string;
  driverId?: string;
  driverUserId?: string;
  driverPhone?: string;
  cleaningType: CleaningType;
  checklistData?: string;
  observations?: string;
}

const CLEANING_TYPE_LABELS: Record<CleaningType, string> = {
  INTERNAL: 'Limpeza Interna',
  EXTERNAL: 'Limpeza Externa',
  COMPLETE: 'Limpeza Completa',
};

const STATUS_LABELS: Record<CleaningStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Finalizada',
};

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'capas-banco', title: 'Capas de Banco', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'banheiro', title: 'Limpeza do Banheiro (quando houver)', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'geladeira', title: 'Itens da Geladeira', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'limpeza-interna', title: 'Limpeza Interna Geral', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'lavagem-carroceria', title: 'Lavagem de Carroceria', category: 'EXTERNAL', checked: false, photoUrl: null },
  { key: 'pretinho-pneus', title: 'Pretinho nos Pneus', category: 'EXTERNAL', checked: false, photoUrl: null },
  { key: 'limpeza-rodas', title: 'Limpeza de Rodas', category: 'EXTERNAL', checked: false, photoUrl: null },
];

export function parseChecklist(data?: string): ChecklistItem[] {
  if (!data) return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  } catch {
    return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  }
}

export function stringifyChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}

class VehicleCleaningService {
  async list(params?: { vehicleId?: string; status?: CleaningStatus }): Promise<VehicleCleaningOrder[]> {
    const query = new URLSearchParams();
    if (params?.vehicleId) query.set('vehicleId', params.vehicleId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    const response = await api.get(`/frota/vehicle-cleanings${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getById(id: string): Promise<VehicleCleaningOrder> {
    const response = await api.get(`/frota/vehicle-cleanings/${id}`);
    return response.data;
  }

  async create(data: CreateCleaningOrderRequest): Promise<VehicleCleaningOrder> {
    const response = await api.post('/frota/vehicle-cleanings', data);
    return response.data;
  }

  async start(id: string): Promise<VehicleCleaningOrder> {
    const response = await api.post(`/frota/vehicle-cleanings/${id}/start`);
    return response.data;
  }

  async updateChecklist(id: string, checklistData: string): Promise<VehicleCleaningOrder> {
    const response = await api.put(`/frota/vehicle-cleanings/${id}/checklist`, { checklistData });
    return response.data;
  }

  async uploadItemPhoto(id: string, itemKey: string, file: File): Promise<VehicleCleaningOrder> {
    const formData = new FormData();
    formData.append('itemKey', itemKey);
    formData.append('photo', file);
    const response = await api.post(`/frota/vehicle-cleanings/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async complete(id: string): Promise<VehicleCleaningOrder> {
    const response = await api.post(`/frota/vehicle-cleanings/${id}/complete`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/frota/vehicle-cleanings/${id}`);
  }
}

export const vehicleCleaningService = new VehicleCleaningService();
export { CLEANING_TYPE_LABELS, STATUS_LABELS };
