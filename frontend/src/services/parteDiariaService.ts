import api from '@/lib/axios';

export interface ParteDiariaAtividade {
  id?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  activityType?: string;
  startKm?: number;
  endKm?: number;
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

export const parteDiariaService = {
  async createParteDiaria(data: ParteDiaria): Promise<ParteDiaria> {
    const response = await api.post('/api/partes-diarias', data);
    return response.data;
  },

  async getPartesDiarias(start?: string, end?: string): Promise<ParteDiaria[]> {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/api/partes-diarias${query}`);
    return response.data;
  },

  async getParteDiariaById(id: string): Promise<ParteDiaria> {
    const response = await api.get(`/api/partes-diarias/${id}`);
    return response.data;
  }
};
