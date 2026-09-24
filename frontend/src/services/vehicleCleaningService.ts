import api from '@/lib/axios';

export type CleaningStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type CleaningType = 'INTERNAL' | 'EXTERNAL' | 'COMPLETE' | 'SANITARY';
export type RequesterSector = 'DRIVER' | 'TRAFFIC' | 'OPERATIONAL' | 'MAINTENANCE';
export type Priority = 'NORMAL' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type CleaningPhase = 'AGUARDANDO' | 'EXTERNA' | 'INTERNA' | 'INSPECAO' | 'LIBERADO';

export interface ChecklistItem {
  key: string;
  title: string;
  category: 'INTERNAL' | 'EXTERNAL';
  checked: boolean;
  photoUrl?: string | null;
}

export interface QualityChecklistItem {
  key: string;
  title: string;
  checked: boolean;
}

export interface VehicleCleaningOrder {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleGarageName?: string;
  driverId?: string;
  driverName?: string;
  status: CleaningStatus;
  cleaningType: CleaningType;
  checklistData?: string;
  observations?: string;
  driverPhone?: string;
  driverUserId?: string;
  requestedBy?: string;
  requestedByName?: string;
  requesterSector?: RequesterSector;
  priority?: Priority;
  phase?: CleaningPhase;
  releaseDeadline?: string;
  estimatedCompletion?: string;
  startedAt?: string;
  currentPhase?: CleaningPhase;
  standardTimeMinutes?: number;
  delayAlertSent?: boolean;
  qualityApproved?: boolean;
  qualityInspectedBy?: string;
  qualityInspectedAt?: string;
  qualityChecklist?: string;
  releaseSpot?: string;
  releasedAt?: string;
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
  requesterSector?: RequesterSector;
  priority?: Priority;
  releaseDeadline?: string;
  releaseSpot?: string;
}

const CLEANING_TYPE_LABELS: Record<CleaningType, string> = {
  INTERNAL: 'Limpeza Interna',
  EXTERNAL: 'Limpeza Externa',
  COMPLETE: 'Limpeza Completa',
  SANITARY: 'Sanitário / Descarte',
};

const STATUS_LABELS: Record<CleaningStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Finalizada',
};

/** Colunas do Kanban com cores do fluxo (🟡🔵🟣🟢 + 🔴 derivado do SLA). */
export const PHASE_LABELS: Record<CleaningPhase, string> = {
  AGUARDANDO: 'Aguardando Higienização',
  EXTERNA: 'Em Lavagem Externa',
  INTERNA: 'Em Limpeza Interna',
  INSPECAO: 'Inspeção de Qualidade',
  LIBERADO: 'Liberado para Viagem',
};

export const PHASE_COLORS: Record<CleaningPhase, string> = {
  AGUARDANDO: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EXTERNA: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  INTERNA: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  INSPECAO: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  LIBERADO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  NORMAL: 'Normal',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  NORMAL: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  MEDIA: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  ALTA: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  URGENTE: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const SECTOR_LABELS: Record<RequesterSector, string> = {
  DRIVER: 'Motorista',
  TRAFFIC: 'Gestor de Tráfego',
  OPERATIONAL: 'Operacional / Pátio',
  MAINTENANCE: 'Manutenção',
};

/** Prioridade padrão por setor (tabela do fluxo). */
export const SECTOR_DEFAULT_PRIORITY: Record<RequesterSector, Priority> = {
  DRIVER: 'MEDIA',
  TRAFFIC: 'ALTA',
  OPERATIONAL: 'NORMAL',
  MAINTENANCE: 'MEDIA',
};

/** Tempo padrão de execução por categoria (minutos) — espelha o backend. */
export const STANDARD_TIME_MINUTES: Record<CleaningType, number> = {
  EXTERNAL: 30,
  INTERNAL: 60,
  SANITARY: 20,
  COMPLETE: 90,
};

export const INSPECTION_MARGIN_MINUTES = 5;
export const DELAY_ALERT_WINDOW_MINUTES = 20;

const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  { key: 'capas-banco', title: 'Capas de Banco', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'banheiro', title: 'Limpeza do Banheiro (quando houver)', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'geladeira', title: 'Itens da Geladeira', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'limpeza-interna', title: 'Limpeza Interna Geral', category: 'INTERNAL', checked: false, photoUrl: null },
  { key: 'lavagem-carroceria', title: 'Lavagem de Carroceria', category: 'EXTERNAL', checked: false, photoUrl: null },
  { key: 'pretinho-pneus', title: 'Pretinho nos Pneus', category: 'EXTERNAL', checked: false, photoUrl: null },
  { key: 'limpeza-rodas', title: 'Limpeza de Rodas', category: 'EXTERNAL', checked: false, photoUrl: null },
  { key: 'descarte-sanitario', title: 'Descarte Sanitário e Reabastecimento Químico', category: 'INTERNAL', checked: false, photoUrl: null },
];

const DEFAULT_QUALITY_CHECKLIST: QualityChecklistItem[] = [
  { key: 'wc', title: 'Sanitário limpo e cheiroso', checked: false },
  { key: 'bancos', title: 'Bancos/estofados limpos', checked: false },
  { key: 'vidros', title: 'Vidros limpos (internos e externos)', checked: false },
  { key: 'piso', title: 'Piso varrido e lavado', checked: false },
  { key: 'lixo', title: 'Lixeiras esvaziadas', checked: false },
];

export interface CleaningSupplyItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export const DEFAULT_SUPPLIES: CleaningSupplyItem[] = [
  { id: 'shampoo', name: 'Shampoo Automotivo Concentrado', quantity: 300, unit: 'ml' },
  { id: 'pretinho', name: 'Pretinho / Silicone para Pneus', quantity: 150, unit: 'ml' },
  { id: 'desinfetante', name: 'Desinfetante Sanitário / Químico', quantity: 200, unit: 'ml' },
  { id: 'aromatizante', name: 'Aromatizante Floral Veicular', quantity: 50, unit: 'ml' },
  { id: 'desengraxante', name: 'Desengraxante de Rodas e Chassi', quantity: 250, unit: 'ml' },
  { id: 'cera', name: 'Cera Líquida Protetora', quantity: 100, unit: 'ml' },
];

export function parseChecklist(data?: string): ChecklistItem[] {
  if (!data) return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items) && parsed.items.length > 0) {
      return parsed.items;
    }
    return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  } catch {
    return DEFAULT_CHECKLIST_ITEMS.map(i => ({ ...i }));
  }
}

export function parseSupplies(data?: string): CleaningSupplyItem[] {
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.supplies)) {
      return parsed.supplies;
    }
    return [];
  } catch {
    return [];
  }
}

export function stringifyChecklist(items: ChecklistItem[]): string {
  return JSON.stringify(items);
}

export function stringifyChecklistWithSupplies(items: ChecklistItem[], supplies?: CleaningSupplyItem[]): string {
  return JSON.stringify({ items, supplies: supplies || [] });
}

export function parseQualityChecklist(data?: string): QualityChecklistItem[] {
  if (!data) return DEFAULT_QUALITY_CHECKLIST.map(i => ({ ...i }));
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return DEFAULT_QUALITY_CHECKLIST.map(i => ({ ...i }));
  } catch {
    return DEFAULT_QUALITY_CHECKLIST.map(i => ({ ...i }));
  }
}

export function stringifyQualityChecklist(items: QualityChecklistItem[]): string {
  return JSON.stringify(items);
}

/** Previsão = início + tempo padrão da categoria + margem de inspeção (5 min). */
export function computeEstimatedCompletion(startedAt: string | undefined, cleaningType: CleaningType): Date | null {
  if (!startedAt) return null;
  const start = new Date(startedAt);
  return new Date(start.getTime() + (STANDARD_TIME_MINUTES[cleaningType] + INSPECTION_MARGIN_MINUTES) * 60_000);
}

/** 🔴 Atrasado: previsão ultrapassa o horário limite de liberação (saída/escala). */
export function isDelayed(order: VehicleCleaningOrder): boolean {
  if (order.status === 'COMPLETED' || order.phase === 'LIBERADO') return false;
  if (!order.releaseDeadline) return false;
  const now = Date.now();
  const deadline = new Date(order.releaseDeadline).getTime();
  if (now > deadline) return true;
  const estimate = order.estimatedCompletion
    ? new Date(order.estimatedCompletion).getTime()
    : computeEstimatedCompletion(order.startedAt, order.cleaningType)?.getTime();
  return estimate != null && estimate > deadline;
}

/** Minutos restantes até o horário limite de liberação (negativo = atrasado). */
export function minutesUntilDeadline(order: VehicleCleaningOrder): number | null {
  if (!order.releaseDeadline) return null;
  return Math.round((new Date(order.releaseDeadline).getTime() - Date.now()) / 60_000);
}

class VehicleCleaningService {
  async list(params?: { vehicleId?: string; status?: CleaningStatus; garageId?: string }): Promise<VehicleCleaningOrder[]> {
    const query = new URLSearchParams();
    if (params?.vehicleId) query.set('vehicleId', params.vehicleId);
    if (params?.status) query.set('status', params.status);
    if (params?.garageId) query.set('garageId', params.garageId);
    const qs = query.toString();
    const response = await api.get(`/frota/vehicle-cleanings${qs ? `?${qs}` : ''}`);
    return response.data;
  }

  /** Triagem & Fila Inteligente: pendentes ordenadas por prazo (SLA). */
  async queue(garageId?: string): Promise<VehicleCleaningOrder[]> {
    const query = garageId ? `?garageId=${encodeURIComponent(garageId)}` : '';
    const response = await api.get(`/frota/vehicle-cleanings/queue${query}`);
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

  async advancePhase(id: string): Promise<VehicleCleaningOrder> {
    const response = await api.post(`/frota/vehicle-cleanings/${id}/phase`);
    return response.data;
  }

  async submitQualityInspection(
    id: string,
    qualityChecklist: string,
    approve: boolean,
    approveAndComplete: boolean,
  ): Promise<VehicleCleaningOrder> {
    const response = await api.post(`/frota/vehicle-cleanings/${id}/quality`, {
      qualityChecklist,
      approve,
      approveAndComplete,
    });
    return response.data;
  }

  async release(id: string, releaseSpot?: string): Promise<VehicleCleaningOrder> {
    const response = await api.post(`/frota/vehicle-cleanings/${id}/release`, { releaseSpot });
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
