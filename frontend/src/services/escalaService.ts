import api from './api';

export type EscalaStatus = 'PLANEJADA' | 'CONFIRMADA' | 'EXECUTANDO' | 'CONCLUIDA' | 'CANCELADA';
export type EscalaOrigin = 'MANUAL' | 'GERADA';

export interface Escala {
  id: string;
  scaleDate: string;
  routeId: string;
  routeName?: string;
  routeColor?: string;
  routeCapacity?: number;
  estimatedDurationMinutes?: number;
  timeSlotId?: string | null;
  departureTime: string; // HH:mm:ss
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  vehicleStatus?: string | null;
  vehiclePassengerCapacity?: number | null;
  driverId?: string | null;
  driverName?: string | null;
  driverStatus?: string | null;
  status: EscalaStatus;
  origin: EscalaOrigin;
  tripId?: string | null;
  createdAt?: string;
}

export interface EscalaPayload {
  scaleDate: string;
  routeId: string;
  departureTime: string; // HH:mm:ss
  vehicleId?: string;
  driverId?: string;
  timeSlotId?: string;
  status?: EscalaStatus;
}

export interface Conflitos {
  violacoes: string[];
  alertas: string[];
}

export interface GeracaoResult {
  date: string;
  dayType: string;
  generated: number;
  skipped: number;
}

const ESCALAS_FORBIDDEN_SESSION_KEY = 'fluxbus_escalas_forbidden_v1';
let escalasForbiddenForRole =
  typeof sessionStorage !== 'undefined' &&
  sessionStorage.getItem(ESCALAS_FORBIDDEN_SESSION_KEY) === 'true';

const toBody = (payload: EscalaPayload) => ({
  scaleDate: payload.scaleDate,
  departureTime: payload.departureTime,
  route: { id: payload.routeId },
  vehicle: payload.vehicleId ? { id: payload.vehicleId } : null,
  driver: payload.driverId ? { id: payload.driverId } : null,
  timeSlot: payload.timeSlotId ? { id: payload.timeSlotId } : null,
  status: payload.status,
});

const escalaService = {
  isEscalasForbidden(): boolean {
    return escalasForbiddenForRole;
  },

  async list(date?: string): Promise<Escala[]> {
    if (escalasForbiddenForRole) {
      return [];
    }
    try {
      const response = await api.get('/api/escalas', {
        params: date ? { date } : {},
        silentErrorLog: true,
      } as any);
      return Array.isArray(response.data) ? response.data : [];
    } catch (err: any) {
      if (err?.response?.status === 403) {
        escalasForbiddenForRole = true;
        try {
          sessionStorage.setItem(ESCALAS_FORBIDDEN_SESSION_KEY, 'true');
        } catch {
          // ignore
        }
      }
      return [];
    }
  },

  async getById(id: string): Promise<Escala> {
    const response = await api.get(`/api/escalas/${id}`);
    return response.data;
  },

  async create(payload: EscalaPayload): Promise<Escala> {
    const response = await api.post('/api/escalas', toBody(payload));
    return response.data;
  },

  async update(id: string, payload: EscalaPayload): Promise<Escala> {
    const response = await api.put(`/api/escalas/${id}`, toBody(payload));
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/escalas/${id}`);
  },

  /** Dry-run: nao grava, retorna violacoes e alertas. */
  async validate(payload: EscalaPayload): Promise<Conflitos> {
    const response = await api.post('/api/escalas/validate', toBody(payload));
    return response.data;
  },

  async generate(date: string): Promise<GeracaoResult> {
    const response = await api.post(`/api/escalas/generate/${date}`);
    return response.data;
  },
};

export default escalaService;
