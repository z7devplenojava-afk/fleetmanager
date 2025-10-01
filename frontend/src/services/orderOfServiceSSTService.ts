import api from '@/lib/axios';
import { OrderOfServiceSST, CreateOrderOfServiceSSTDTO, UpdateOrderOfServiceSSTDTO, OrderOfServiceSSTFilters } from '@/types/orderOfServiceSST';

export const orderOfServiceSSTService = {
  /**
   * Busca todas as ordens de serviço SST
   */
  async findAll(): Promise<OrderOfServiceSST[]> {
    const response = await api.get('/orders-of-service-sst');
    return response.data;
  },

  /**
   * Busca uma ordem de serviço SST por ID
   */
  async findById(id: string): Promise<OrderOfServiceSST> {
    const response = await api.get(`/api/orders-of-service-sst/${id}`);
    return response.data;
  },

  /**
   * Cria uma nova ordem de serviço SST
   */
  async create(data: CreateOrderOfServiceSSTDTO): Promise<OrderOfServiceSST> {
    const response = await api.post('/orders-of-service-sst', data);
    return response.data;
  },

  /**
   * Atualiza uma ordem de serviço SST existente
   */
  async update(id: string, data: UpdateOrderOfServiceSSTDTO): Promise<OrderOfServiceSST> {
    const response = await api.put(`/api/orders-of-service-sst/${id}`, data);
    return response.data;
  },

  /**
   * Remove uma ordem de serviço SST
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/orders-of-service-sst/${id}`);
  },

  /**
   * Busca ordens de serviço SST com filtros
   */
  async findWithFilters(filters: OrderOfServiceSSTFilters = {}): Promise<OrderOfServiceSST[]> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.responsible) params.append('responsible', filters.responsible);
    if (filters.issueDateFrom) params.append('issueDateFrom', filters.issueDateFrom);
    if (filters.issueDateTo) params.append('issueDateTo', filters.issueDateTo);
    
    const response = await api.get(`/api/orders-of-service-sst?${params.toString()}`);
    return response.data;
  },

  /**
   * Upload de documento para uma ordem de serviço SST
   */
  async uploadDocument(id: string, file: File): Promise<OrderOfServiceSST> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/orders-of-service-sst/${id}/document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Download de documento de uma ordem de serviço SST
   */
  async downloadDocument(id: string): Promise<Blob> {
    const response = await api.get(`/api/orders-of-service-sst/${id}/document`, {
      responseType: 'blob',
    });
    return response.data;
  }
}; 