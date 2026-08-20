import api from '@/lib/axios';

export type LavajatoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface ChecklistItem {
  key: string;
  title: string;
  checked: boolean;
  photoUrl?: string | null;
}

export interface LavajatoStats {
  totalRecords: number;
  pending: number;
  inProgress: number;
  completed: number;
  avgDurationSeconds?: number | null;
  minDurationSeconds?: number | null;
  maxDurationSeconds?: number | null;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  completionRate: number;
  skippedInternalItems: Record<string, number>;
  skippedExternalItems: Record<string, number>;
  topVehicles: Record<string, number>;
  topOperators: Record<string, number>;
}

export interface LavajatoServiceRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleBrand?: string;
  vehicleColor?: string;
  vehiclePhotoUrl?: string;
  driverId?: string;
  driverName?: string;
  status: LavajatoStatus;
  checklistInternal?: string;
  checklistExternal?: string;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  observations?: string;
  driverPhone?: string;
  driverUserId?: string;
  operatorId?: string;
  operatorName?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLavajatoRequest {
  vehicleId: string;
  driverId?: string;
  driverUserId?: string;
  driverPhone?: string;
  checklistInternal?: string;
  checklistExternal?: string;
  observations?: string;
}

const DEFAULT_CHECKLIST_INTERNAL: ChecklistItem[] = [
  { key: 'bancos', title: 'Limpeza dos Bancos', checked: false, photoUrl: null },
  { key: 'painel', title: 'Limpeza do Painel', checked: false, photoUrl: null },
  { key: 'tapetes', title: 'Limpeza dos Tapetes', checked: false, photoUrl: null },
  { key: 'vidros-internos', title: 'Limpeza dos Vidros Internos', checked: false, photoUrl: null },
  { key: 'porta-malas', title: 'Limpeza do Porta-malas', checked: false, photoUrl: null },
  { key: 'purificador', title: 'Air Freshener / Purificador de Ar', checked: false, photoUrl: null },
  { key: 'console-central', title: 'Limpeza do Console Central', checked: false, photoUrl: null },
  { key: 'pedais', title: 'Limpeza dos Pedais e Caixa de Fusíveis', checked: false, photoUrl: null },
  { key: 'teto-colunas', title: 'Limpeza do Teto e Colunas', checked: false, photoUrl: null },
  { key: 'retrovisores-internos', title: 'Limpeza dos Retrovisores Internos', checked: false, photoUrl: null },
  { key: 'flushing', title: 'Flushing / Desinfecção Interna', checked: false, photoUrl: null },
  { key: 'compartimento-portas', title: 'Limpeza dos Compartimentos das Portas', checked: false, photoUrl: null },
  { key: 'bagageiro', title: 'Organização e Aspiração do Bagageiro', checked: false, photoUrl: null },
];

const DEFAULT_CHECKLIST_EXTERNAL: ChecklistItem[] = [
  { key: 'lavagem-carroceria', title: 'Lavagem da Carroceria', checked: false, photoUrl: null },
  { key: 'chapas', title: 'Limpeza das Chapas', checked: false, photoUrl: null },
  { key: 'rodas', title: 'Limpeza das Rodas', checked: false, photoUrl: null },
  { key: 'pneus', title: 'Pretinho nos Pneus', checked: false, photoUrl: null },
  { key: 'vidros-externos', title: 'Limpeza dos Vidros Externos', checked: false, photoUrl: null },
];

export const STATUS_LABELS: Record<LavajatoStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Finalizado',
};

export function parseChecklist(data?: string, fallback?: ChecklistItem[]): ChecklistItem[] {
  const defaults = fallback || DEFAULT_CHECKLIST_INTERNAL;
  if (!data) return defaults.map(i => ({ ...i }));
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return defaults.map(i => ({ ...i }));
  } catch {
    return defaults.map(i => ({ ...i }));
  }
}

export function stringifyChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}

export function getDefaultChecklistInternal(): ChecklistItem[] {
  return DEFAULT_CHECKLIST_INTERNAL.map(i => ({ ...i }));
}

export function getDefaultChecklistExternal(): ChecklistItem[] {
  return DEFAULT_CHECKLIST_EXTERNAL.map(i => ({ ...i }));
}

export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}min ${String(s).padStart(2, '0')}s`;
}

class LavajatoApiService {
  async list(params?: { vehicleId?: string; status?: LavajatoStatus }): Promise<LavajatoServiceRecord[]> {
    const query = new URLSearchParams();
    if (params?.vehicleId) query.set('vehicleId', params.vehicleId);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    const response = await api.get(`/frota/lavajato${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async getById(id: string): Promise<LavajatoServiceRecord> {
    const response = await api.get(`/frota/lavajato/${id}`);
    return response.data;
  }

  async create(data: CreateLavajatoRequest): Promise<LavajatoServiceRecord> {
    const response = await api.post('/frota/lavajato', data);
    return response.data;
  }

  async start(id: string): Promise<LavajatoServiceRecord> {
    const response = await api.post(`/frota/lavajato/${id}/start`);
    return response.data;
  }

  async updateChecklistInternal(id: string, checklistData: string): Promise<LavajatoServiceRecord> {
    const response = await api.put(`/frota/lavajato/${id}/checklist-internal`, { checklistData });
    return response.data;
  }

  async updateChecklistExternal(id: string, checklistData: string): Promise<LavajatoServiceRecord> {
    const response = await api.put(`/frota/lavajato/${id}/checklist-external`, { checklistData });
    return response.data;
  }

  async uploadItemPhoto(id: string, itemKey: string, checklistType: 'internal' | 'external', file: File): Promise<LavajatoServiceRecord> {
    const formData = new FormData();
    formData.append('itemKey', itemKey);
    formData.append('checklistType', checklistType);
    formData.append('photo', file);
    const response = await api.post(`/frota/lavajato/${id}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async complete(id: string): Promise<LavajatoServiceRecord> {
    const response = await api.post(`/frota/lavajato/${id}/complete`);
    return response.data;
  }

  async getStats(vehicleId?: string): Promise<LavajatoStats> {
    const query = new URLSearchParams();
    if (vehicleId) query.set('vehicleId', vehicleId);
    const qs = query.toString();
    const response = await api.get(`/frota/lavajato/stats${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/frota/lavajato/${id}`);
  }
}

export const lavajatoService = new LavajatoApiService();
