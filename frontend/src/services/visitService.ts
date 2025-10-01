import api from '@/lib/axios';
import { Visit, VisitStatistics, CreateVisitDTO, UpdateVisitDTO } from '@/types/visit';

export const visitService = {
  // Buscar visitas por supervisor e mês
  async getVisitsBySupervisor(supervisorId: string, year: number, month: number): Promise<Visit[]> {
    try {
      const response = await api.get(`/api/visits/supervisor/${supervisorId}`, {
        params: { year, month }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
      throw new Error('Falha ao buscar visitas');
    }
  },

  // Criar nova visita
  async createVisit(visitData: CreateVisitDTO): Promise<Visit> {
    try {
      const response = await api.post('/visits', visitData);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar visita:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Falha ao criar visita');
    }
  },

  // Atualizar visita
  async updateVisit(id: string, visitData: UpdateVisitDTO): Promise<Visit> {
    try {
      const response = await api.put(`/api/visits/${id}`, visitData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar visita:', error);
      throw new Error('Falha ao atualizar visita');
    }
  },

  // Marcar visita como realizada
  async markVisitAsCompleted(id: string): Promise<Visit> {
    try {
      const response = await api.put(`/api/visits/${id}/complete`);
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar visita como realizada:', error);
      throw new Error('Falha ao marcar visita como realizada');
    }
  },

  // Excluir visita
  async deleteVisit(id: string): Promise<void> {
    try {
      await api.delete(`/api/visits/${id}`);
    } catch (error) {
      console.error('Erro ao excluir visita:', error);
      throw new Error('Falha ao excluir visita');
    }
  },

  // Buscar estatísticas
  async getVisitStatistics(supervisorId: string, year: number, month: number): Promise<VisitStatistics> {
    try {
      const response = await api.get('/visits/statistics', {
        params: { supervisorId, year, month }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw new Error('Falha ao buscar estatísticas');
    }
  },

  // Buscar visitas de hoje
  async getTodaysVisits(supervisorId: string): Promise<Visit[]> {
    try {
      const response = await api.get(`/api/visits/today/${supervisorId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas de hoje:', error);
      throw new Error('Falha ao buscar visitas de hoje');
    }
  },

  // Gerar template mensal
  async generateMonthlyTemplate(supervisorId: string, year: number, month: number): Promise<Visit[]> {
    try {
      const response = await api.post('/visits/generate-template', null, {
        params: { supervisorId, year, month }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar template:', error);
      throw new Error('Falha ao gerar template');
    }
  }
};
