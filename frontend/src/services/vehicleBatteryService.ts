import api from '@/lib/axios';

export interface VehicleBattery {
  id: string;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  vehicleModel?: string | null;
  batteryCode?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  voltage?: string;
  capacity?: string;
  ccaRating?: number;
  installKm?: number;
  installDate?: string;
  removalDate?: string;
  removalReason?: string;
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

  async install(id: string, params: { vehicleId: string; installKm?: number; installDate?: string }): Promise<VehicleBattery> {
    const query = new URLSearchParams({ vehicleId: params.vehicleId });
    if (params.installKm !== undefined) query.append('installKm', String(params.installKm));
    if (params.installDate) query.append('installDate', params.installDate);
    const response = await api.post(`/api/frota/vehicle-batteries/${id}/install?${query.toString()}`);
    return response.data;
  }

  async remove(id: string, params: { reason?: string; scrap?: boolean }): Promise<VehicleBattery> {
    const query = new URLSearchParams();
    if (params.reason) query.append('reason', params.reason);
    if (params.scrap) query.append('scrap', 'true');
    const response = await api.post(`/api/frota/vehicle-batteries/${id}/remove?${query.toString()}`);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/api/frota/vehicle-batteries/${id}`);
  }
}

export const vehicleBatteryService = new VehicleBatteryService();
