import api from '@/lib/axios';
import { Unit } from '@/types/visit';

// Tipos para requisições
export interface CreateUnitRequest {
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  code?: string;
  manager?: string;
  parentId?: string;
  clientId?: number;
}

export interface UpdateUnitRequest {
  name?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  code?: string;
  manager?: string;
  parentId?: string;
  clientId?: number;
}

export interface DeleteCheckResponse {
  canDelete: boolean;
  unitName?: string;
  dependenciesCount?: number;
  dependencies?: {
    positions?: number;
    employees?: number;
    payrolls?: number;
    locations?: number;
    children?: number;
  };
  message?: string;
}

export const unitService = {
  // Buscar todas as unidades
  async getAllUnits(): Promise<Unit[]> {
    try {
      const response = await api.get('/api/units');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      throw new Error('Falha ao buscar unidades');
    }
  },

  // Buscar apenas unidades ativas
  async getActiveUnits(): Promise<Unit[]> {
    try {
      const response = await api.get('/api/units/active');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar unidades ativas:', error);
      throw new Error('Falha ao buscar unidades ativas');
    }
  },

  // Buscar unidade por ID
  async getUnitById(id: string): Promise<Unit> {
    try {
      const response = await api.get(`/api/units/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar unidade:', error);
      throw new Error('Falha ao buscar unidade');
    }
  },

  // Buscar unidades por cliente
  async getUnitsByClient(clientId: string): Promise<Unit[]> {
    try {
      const response = await api.get(`/api/units/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar unidades do cliente:', error);
      throw new Error('Falha ao buscar unidades do cliente');
    }
  },

  // Criar nova unidade
  async createUnit(unitData: CreateUnitRequest): Promise<Unit> {
    try {
      const response = await api.post('/api/units', unitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar unidade:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao criar unidade');
    }
  },

  // Atualizar unidade
  async updateUnit(id: string, unitData: UpdateUnitRequest): Promise<Unit> {
    try {
      const response = await api.put(`/api/units/${id}`, unitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao atualizar unidade:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao atualizar unidade');
    }
  },

  // Excluir unidade
  async deleteUnit(id: string): Promise<void> {
    try {
      await api.delete(`/api/units/${id}`);
    } catch (error: any) {
      console.error('Erro ao excluir unidade:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao excluir unidade');
    }
  },

  // Excluir unidade com dependências
  async deleteUnitWithDependencies(id: string): Promise<void> {
    try {
      await api.delete(`/api/units/${id}/with-dependencies`);
    } catch (error: any) {
      console.error('Erro ao excluir unidade com dependências:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao excluir unidade com dependências');
    }
  },

  // Verificar possibilidade de exclusão
  async checkDeletePossibility(id: string): Promise<DeleteCheckResponse> {
    try {
      const response = await api.get(`/api/units/${id}/can-delete`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao verificar possibilidade de exclusão:', error);
      // Fallback se endpoint não existir
      if (error.response?.status === 404) {
        return {
          canDelete: true,
          dependenciesCount: 0,
          dependencies: {},
          message: 'Unidade pode ser excluída'
        };
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao verificar possibilidade de exclusão');
    }
  },

  // Buscar unidades próximas (para otimização de rotas)
  async getNearbyUnits(latitude: number, longitude: number, radiusKm: number = 10): Promise<Unit[]> {
    try {
      const response = await api.get('/units/nearby', {
        params: { latitude, longitude, radius: radiusKm }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar unidades próximas:', error);
      throw new Error('Falha ao buscar unidades próximas');
    }
  },

  // Buscar estatísticas de unidades
  async getUnitStatistics(): Promise<{
    totalUnits: number;
    activeUnits: number;
    inactiveUnits: number;
    unitsWithVisits: number;
    averageVisitsPerUnit: number;
  }> {
    try {
      const response = await api.get('/units/statistics');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de unidades:', error);
      throw new Error('Falha ao buscar estatísticas de unidades');
    }
  }
};

export default unitService;