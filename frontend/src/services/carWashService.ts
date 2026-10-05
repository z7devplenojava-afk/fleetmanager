import api from '@/lib/axios';

export interface CarWash {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  supplierId?: string;
  priceInternal?: number;
  priceExternal?: number;
  priceComplete?: number;
  priceSanitary?: number;
  active: boolean;
  notes?: string;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

class CarWashService {
  async list(): Promise<CarWash[]> {
    const response = await api.get('/car-washes');
    return response.data;
  }

  async getById(id: string): Promise<CarWash> {
    const response = await api.get(`/car-washes/${id}`);
    return response.data;
  }

  async create(data: Partial<CarWash>): Promise<CarWash> {
    const response = await api.post('/car-washes', data);
    return response.data;
  }

  async update(id: string, data: Partial<CarWash>): Promise<CarWash> {
    const response = await api.put(`/car-washes/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/car-washes/${id}`);
  }
}

export const carWashService = new CarWashService();
