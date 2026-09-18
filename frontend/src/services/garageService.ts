import api from '@/lib/axios';

export interface GarageVehicleSummary {
  id: string;
  plate: string;
  model?: string;
  brand?: string;
  currentMileage?: number;
  status?: string;
}

export interface GarageOccupancyDashboard {
  garages: Garage[];
  totalGarages: number;
  totalVehicles: number;
  totalCapacity: number;
  overallOccupancy?: number | null;
  garagesWithCapacity: number;
  fullGarages: number;
  nearCapacityGarages: number;
  fleetStatusTotals?: Record<string, number>;
}

export interface Garage {
  id: string;
  name: string;
  address?: string;
  responsibleEmployeeId?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  capacity?: number;
  notes?: string;
  companyId?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  vehicleCount?: number;
  occupancyRate?: number | null;
  atCapacity?: boolean;
  nearCapacity?: boolean;
  statusBreakdown?: Record<string, number>;
  vehicles?: GarageVehicleSummary[];
}

export interface GarageInput {
  name: string;
  address?: string;
  responsibleEmployeeId?: string;
  responsibleName?: string;
  responsiblePhone?: string;
  capacity?: number;
  notes?: string;
  active?: boolean;
}

export interface GarageMovement {
  id: string;
  vehicleId: string;
  vehiclePlate?: string;
  fromGarageId?: string;
  fromGarageName?: string;
  toGarageId?: string;
  toGarageName?: string;
  reason?: string;
  reasonDetail?: string;
  performedBy?: string;
  performedByName?: string;
  kmReading?: number;
  companyId?: string;
  createdAt?: string;
}

export interface GarageTransferInput {
  vehicleId: string;
  toGarageId: string;
  reason?: string;
  reasonDetail?: string;
  kmReading?: number;
}

export const MOVEMENT_REASON_LABELS: Record<string, string> = {
  REMANEJAMENTO: 'Remanejamento',
  MANUTENCAO: 'Manutenção',
  LIMPEZA: 'Limpeza',
  OPERACAO: 'Operação / Recolhimento',
  ESCALA: 'Escala',
  OUTROS: 'Outros',
};

class GarageService {
  async list(): Promise<Garage[]> {
    const response = await api.get('/garages');
    return response.data;
  }

  /** Dashboard de ocupação com alertas de lotação. */
  async occupancyDashboard(): Promise<GarageOccupancyDashboard> {
    const response = await api.get('/garages/dashboard');
    return response.data;
  }

  async getById(id: string): Promise<Garage> {
    const response = await api.get(`/garages/${id}`);
    return response.data;
  }

  async create(data: GarageInput): Promise<Garage> {
    const response = await api.post('/garages', data);
    return response.data;
  }

  async update(id: string, data: Partial<GarageInput>): Promise<Garage> {
    const response = await api.put(`/garages/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/garages/${id}`);
  }

  async getVehicles(id: string): Promise<Garage> {
    const response = await api.get(`/garages/${id}/vehicles`);
    return response.data;
  }

  async assignVehicle(garageId: string, vehicleId: string): Promise<Garage> {
    const response = await api.post(`/garages/${garageId}/vehicles/${vehicleId}`);
    return response.data;
  }

  async unassignVehicle(garageId: string, vehicleId: string): Promise<Garage> {
    const response = await api.delete(`/garages/${garageId}/vehicles/${vehicleId}`);
    return response.data;
  }

  async getVehicleGarage(vehicleId: string): Promise<Garage | null> {
    const response = await api.get(`/garages/vehicle/${vehicleId}`);
    return response.data;
  }

  /** Remanejamento de veículo entre garagens. */
  async transferVehicle(data: GarageTransferInput): Promise<GarageMovement> {
    const response = await api.post('/garages/transfers', data);
    return response.data;
  }

  /** Histórico de movimentações entre garagens (paginado). */
  async listMovements(page = 0, size = 30): Promise<GarageMovement[]> {
    const response = await api.get(`/garages/movements?page=${page}&size=${size}`);
    return response.data;
  }

  /** Histórico de movimentações de um veículo. */
  async getVehicleMovements(vehicleId: string): Promise<GarageMovement[]> {
    const response = await api.get(`/garages/movements/vehicle/${vehicleId}`);
    return response.data;
  }
}

export const garageService = new GarageService();
