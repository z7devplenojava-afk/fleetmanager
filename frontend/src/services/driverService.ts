import api from '@/lib/axios';
import { Driver } from '@/types/driver';

export interface CreateDriverDTO {
  name: string;
  licenseNumber?: string;
  status?: 'ATIVO' | 'INATIVO';
}

const driverService = {
  async getDrivers(): Promise<Driver[]> {
    const response = await api.get('/api/drivers');
    return response.data;
  },

  async getDriver(id: string): Promise<Driver> {
    const response = await api.get(`/api/drivers/${id}`);
    return response.data;
  },

  async createDriver(data: CreateDriverDTO): Promise<Driver> {
    const response = await api.post('/api/drivers', data);
    return response.data;
  },

  async updateDriver(id: string, data: CreateDriverDTO): Promise<Driver> {
    const response = await api.put(`/api/drivers/${id}`, data);
    return response.data;
  },

  async deactivateDriver(id: string): Promise<void> {
    await api.patch(`/api/drivers/${id}/deactivate`);
  },

  async deleteDriver(id: string): Promise<void> {
    await api.delete(`/api/drivers/${id}`);
  },
};

export default driverService; 