import api from '@/lib/axios';

export interface Position {
  id: string;
  name: string;
  description?: string;
  baseSalary?: number;
  unitId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionDTO {
  name: string;
  description: string;
  baseSalary: number;
  unitId?: string;
}

export const positionService = {
  // Buscar todas as posições
  async getPositions(): Promise<Position[]> {
    const response = await api.get('/positions');
    return response.data;
  },

  // Buscar posição por ID
  async getPositionById(id: string): Promise<Position> {
    const response = await api.get(`/api/positions/${id}`);
    return response.data;
  },

  // Criar nova posição
  async createPosition(positionData: PositionDTO): Promise<Position> {
    const response = await api.post('/positions', positionData);
    return response.data;
  },

  // Atualizar posição
  async updatePosition(id: string, positionData: PositionDTO): Promise<Position> {
    const response = await api.put(`/api/positions/${id}`, positionData);
    return response.data;
  },

  // Excluir posição
  async deletePosition(id: string): Promise<void> {
    await api.delete(`/api/positions/${id}`);
  }
}; 