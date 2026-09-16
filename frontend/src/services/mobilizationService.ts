import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 3: Gestão Operacional, Tráfego & Mobilização.
 * RF-03.1 (elegibilidade), RF-03.3 (vistoria de mobilização), RF-03.5 (talões).
 */

const BASE_URL = '/api/operational-mobilization';

// ===== RF-03.1: Elegibilidade =====

export interface EligibilityCriterion {
  required: boolean;
  present: boolean;
  ok: boolean;
  detail: string;
}

export interface VehicleEligibility {
  vehicleId: string;
  plate: string;
  model?: string | null;
  year?: number | null;
  eligible: boolean;
  criteria: Record<string, EligibilityCriterion>;
  failures: string[];
}

export const CRITERION_LABELS: Record<string, string> = {
  IDADE_MAX_5_ANOS: 'Idade máxima de 5 anos',
  AR_CONDICIONADO: 'Ar-condicionado',
  CINTO_TODOS_ASSENTOS: 'Cinto em todos os assentos',
  FREIO_MOTOR_RETARDER: 'Freio motor/retarder',
  CAMERA_CONDUTOR: 'Câmera no condutor',
  TELEMETRIA: 'Telemetria',
};

export const eligibilityService = {
  checkVehicle: async (vehicleId: string): Promise<VehicleEligibility> => {
    const { data } = await api.get<VehicleEligibility>(`${BASE_URL}/eligibility/${vehicleId}`);
    return data;
  },

  filterFleet: async (includeIneligible = false): Promise<VehicleEligibility[]> => {
    const { data } = await api.get<VehicleEligibility[]>(`${BASE_URL}/eligibility`, {
      params: { includeIneligible },
    });
    return Array.isArray(data) ? data : [];
  },
};

// ===== RF-03.3: Vistoria de mobilização =====

export interface MobilizationInspection {
  id?: string;
  registryNumber?: string;
  inspectionDate?: string;
  vehicle?: { id: string } | null;
  vehiclePlate?: string;
  client?: { id: string } | null;
  clientName?: string;
  contractNumber?: string;
  currentMileage?: number | null;
  bodyworkOk?: boolean;
  bodyworkNotes?: string;
  tiresOk?: boolean;
  tiresNotes?: string;
  tachographOk?: boolean;
  warningTriangleOk?: boolean;
  wheelWrenchOk?: boolean;
  reverseAlarmOk?: boolean;
  crlvAttached?: boolean;
  photosUrls?: string;
  generalNotes?: string;
  inspectorName?: string;
  clientRepresentativeName?: string;
  approved?: boolean;
}

export const inspectionService = {
  list: async (params?: { vehicleId?: string; clientId?: string }): Promise<MobilizationInspection[]> => {
    const { data } = await api.get<MobilizationInspection[]>(`${BASE_URL}/inspections`, { params });
    return Array.isArray(data) ? data : [];
  },

  create: async (inspection: MobilizationInspection): Promise<MobilizationInspection> => {
    const { data } = await api.post<MobilizationInspection>(`${BASE_URL}/inspections`, inspection);
    return data;
  },

  approve: async (id: string): Promise<MobilizationInspection> => {
    const { data } = await api.post<MobilizationInspection>(`${BASE_URL}/inspections/${id}/approve`);
    return data;
  },

  downloadPdf: (id: string) => {
    return api.get(`${BASE_URL}/inspections/${id}/pdf`, { responseType: 'blob' });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/inspections/${id}`);
  },
};

// ===== RF-03.5: Talões de Parte Diária =====

export type DailyLogBookStatus = 'ACTIVE' | 'EXHAUSTED' | 'CANCELLED' | 'LOST';

export const BOOK_STATUS_LABELS: Record<DailyLogBookStatus, string> = {
  ACTIVE: 'Ativo',
  EXHAUSTED: 'Esgotado',
  CANCELLED: 'Cancelado',
  LOST: 'Extraviado',
};

export interface DailyLogBook {
  id?: string;
  bookNumber?: string;
  vehicle?: { id: string } | null;
  vehiclePlate?: string;
  assignedDriver?: { id: string } | null;
  assignedDriverName?: string;
  assignedClient?: { id: string } | null;
  assignedWorkPost?: { id: string } | null;
  firstNumber?: number;
  lastNumber?: number;
  currentNumber?: number;
  issuedAt?: string;
  issuedBy?: string;
  status?: DailyLogBookStatus;
  notes?: string;
  totalSheets?: number;
  remainingSheets?: number;
}

export interface BookEntry {
  id: string;
  sequentialNumber: number;
  usedAt?: string;
  usedBy?: string;
  dailyLogId?: string;
}

export const bookService = {
  list: async (params?: { status?: DailyLogBookStatus; vehicleId?: string }): Promise<DailyLogBook[]> => {
    const { data } = await api.get<DailyLogBook[]>(`${BASE_URL}/books`, { params });
    return Array.isArray(data) ? data : [];
  },

  issue: async (book: DailyLogBook, sheetsQuantity = 50): Promise<DailyLogBook> => {
    const { data } = await api.post<DailyLogBook>(`${BASE_URL}/books?sheetsQuantity=${sheetsQuantity}`, book);
    return data;
  },

  consumeSheet: async (id: string, dailyLogId?: string, usedBy?: string): Promise<BookEntry> => {
    const { data } = await api.post<BookEntry>(`${BASE_URL}/books/${id}/consume-sheet`, null, {
      params: { dailyLogId, usedBy },
    });
    return data;
  },

  getEntries: async (id: string): Promise<BookEntry[]> => {
    const { data } = await api.get<BookEntry[]>(`${BASE_URL}/books/${id}/entries`);
    return Array.isArray(data) ? data : [];
  },

  updateStatus: async (id: string, status: DailyLogBookStatus): Promise<DailyLogBook> => {
    const { data } = await api.patch<DailyLogBook>(`${BASE_URL}/books/${id}/status`, { status });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/books/${id}`);
  },
};
