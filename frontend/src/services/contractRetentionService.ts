import api from '@/lib/axios';
import {
  ContractRetention,
  CreateContractRetentionDTO,
  UpdateContractRetentionDTO,
  RetentionStatus
} from '@/types/contractRetention';

export const contractRetentionService = {
  async getAll(): Promise<ContractRetention[]> {
    try {
      const response = await api.get('/contract-retentions');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar retenções contratuais:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ContractRetention> {
    const response = await api.get(`/contract-retentions/${id}`);
    return response.data;
  },

  async create(data: CreateContractRetentionDTO): Promise<ContractRetention> {
    const response = await api.post('/contract-retentions', data);
    return response.data;
  },

  async update(id: string, data: UpdateContractRetentionDTO): Promise<ContractRetention> {
    const response = await api.put(`/contract-retentions/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: RetentionStatus, actualReleaseDate?: string): Promise<ContractRetention> {
    const params = new URLSearchParams();
    params.append('status', status);
    if (actualReleaseDate) params.append('actualReleaseDate', actualReleaseDate);
    const response = await api.patch(`/contract-retentions/${id}/status?${params.toString()}`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/contract-retentions/${id}`);
  }
};
