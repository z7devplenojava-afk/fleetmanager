import api from '@/lib/axios';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUuid = (val?: string | null): boolean => {
  if (!val || typeof val !== 'string') return false;
  return UUID_REGEX.test(val.trim());
};

const toValidUuidOrUndefined = (val?: string | null): string | undefined => {
  return isValidUuid(val) ? val!.trim() : undefined;
};

export interface ParteDiariaAtividade {
  id?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  activityType?: string;
  routeCode?: string;
  companyName?: string;
  startKm?: number;
  endKm?: number;
  passengersCount?: number;
  notes?: string;
}

export interface ParteDiaria {
  id?: string;
  companyId?: string;
  number?: string;
  date?: string;
  clientId?: string;
  clientName?: string;
  contractId?: string;
  contractNumber?: string;
  obraName?: string;
  serviceName?: string;
  routeName?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  driverId?: string;
  driverName?: string;
  startTime?: string;
  endTime?: string;
  startKm?: number;
  endKm?: number;
  drivenKm?: number;
  disregardedKm?: number;
  consideredKm?: number;
  disregardReason?: string;
  status?: string;
  notes?: string;
  createdBy?: string;
  atividades?: ParteDiariaAtividade[];
}

function sanitizeParteDiariaPayload(data: ParteDiaria): ParteDiaria {
  return {
    ...data,
    id: toValidUuidOrUndefined(data.id),
    companyId: toValidUuidOrUndefined(data.companyId),
    clientId: toValidUuidOrUndefined(data.clientId),
    contractId: toValidUuidOrUndefined(data.contractId),
    vehicleId: toValidUuidOrUndefined(data.vehicleId),
    driverId: toValidUuidOrUndefined(data.driverId),
    atividades: Array.isArray(data.atividades)
      ? data.atividades.map((a) => ({
          ...a,
          id: toValidUuidOrUndefined(a.id),
        }))
      : [],
  };
}

export const parteDiariaService = {
  async createParteDiaria(data: ParteDiaria): Promise<ParteDiaria> {
    const sanitized = sanitizeParteDiariaPayload(data);
    const response = await api.post('/api/partes-diarias', sanitized);
    return response.data;
  },

  async getPartesDiarias(start?: string, end?: string, clientId?: string): Promise<ParteDiaria[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    if (isValidUuid(clientId)) params.append('clientId', clientId!.trim());
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/partes-diarias${query}`);
    return response.data;
  },

  async getParteDiariaById(id: string): Promise<ParteDiaria> {
    const response = await api.get(`/api/partes-diarias/${id}`);
    return response.data;
  },

  async updateParteDiaria(id: string, data: ParteDiaria): Promise<ParteDiaria> {
    const sanitized = sanitizeParteDiariaPayload(data);
    if (!isValidUuid(id)) {
      const response = await api.post('/api/partes-diarias', sanitized);
      return response.data;
    }
    const response = await api.put(`/api/partes-diarias/${id.trim()}`, sanitized);
    return response.data;
  },

  async deleteParteDiaria(id: string): Promise<void> {
    if (!isValidUuid(id)) {
      return;
    }
    await api.delete(`/api/partes-diarias/${id.trim()}`);
  },
};
