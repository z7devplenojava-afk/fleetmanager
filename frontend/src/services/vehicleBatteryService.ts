import api from '@/lib/axios';

export interface VehicleBattery {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel?: string;
  batteryCode?: string;
  brand?: string;
  model?: string;
  voltage?: string;
  capacity?: string;
  installDate?: string;
  warrantyExpiryDate?: string;
  status: 'ACTIVE' | 'REPLACED' | 'SCRAPPED';
  cost?: number;
  notes?: string;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
}

class VehicleBatteryService {
  async list(vehicleId?: string, status?: string): Promise<VehicleBattery[]> {
    const params = new URLSearchParams();
    if (vehicleId) params.append('vehicleId', vehicleId);
    if (status) params.append('status', status);
    const query = params.toString();
    const response = await api.get(`/api/frota/vehicle-batteries${query ? `?${query}` : ''}`);
    return response.data;
  }

  async getById(id: string): Promise<VehicleBattery> {
    const response = await api.get(`/api/frota/vehicle-batteries/${id}`);
    return response.data;
  }

  async create(data: Partial<VehicleBattery>): Promise<VehicleBattery> {
    const response = await api.post('/api/frota/vehicle-batteries', data);
    return response.data;
  }

  async update(id: string, data: Partial<VehicleBattery>): Promise<VehicleBattery> {
    const response = await api.put(`/api/frota/vehicle-batteries/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/api/frota/vehicle-batteries/${id}`);
  }
}

export const vehicleBatteryService = new VehicleBatteryService();
