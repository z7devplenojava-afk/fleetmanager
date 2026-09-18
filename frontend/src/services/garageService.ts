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
}

export const garageService = new GarageService();
