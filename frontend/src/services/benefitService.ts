import api from '@/lib/axios';

export interface Benefit {
  id: string;
  name: string;
  description?: string;
  type: 'HEALTH' | 'DENTAL' | 'LIFE_INSURANCE' | 'MEAL' | 'TRANSPORT' | 'OTHER';
  value?: number;
  percentage?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenefitRequest {
  name: string;
  description?: string;
  type: Benefit['type'];
  value?: number;
  percentage?: number;
}

export interface UpdateBenefitRequest extends Partial<CreateBenefitRequest> {
  isActive?: boolean;
}

export const benefitService = {
  // Buscar todos os benefícios
  async getBenefits(): Promise<Benefit[]> {
    const response = await api.get('/api/benefits');
    return response.data;
  },

  // Buscar benefício por ID
  async getBenefitById(id: string): Promise<Benefit> {
    const response = await api.get(`/api/benefits/${id}`);
    return response.data;
  },

  // Criar novo benefício
  async createBenefit(benefitData: Partial<Benefit>): Promise<Benefit> {
    const response = await api.post('/api/benefits', benefitData);
    return response.data;
  },

  // Atualizar benefício
  async updateBenefit(id: string, benefitData: UpdateBenefitRequest): Promise<Benefit> {
    const response = await api.put(`/api/benefits/${id}`, benefitData);
    return response.data;
  },

  // Excluir benefício
  async deleteBenefit(id: string): Promise<void> {
    await api.delete(`/api/benefits/${id}`);
  },

  // Ativar/desativar benefício
  async toggleBenefitStatus(id: string, isActive: boolean): Promise<Benefit> {
    const response = await api.patch(`/api/benefits/${id}/status`, { isActive });
    return response.data;
  },

  // Buscar benefícios por tipo
  async getBenefitsByType(type: Benefit['type']): Promise<Benefit[]> {
    const response = await api.get(`/api/benefits/type/${type}`);
    return response.data;
  },

  // Buscar benefícios ativos
  async getActiveBenefits(): Promise<Benefit[]> {
    const response = await api.get('/api/benefits/active');
    return response.data;
  }
}; 