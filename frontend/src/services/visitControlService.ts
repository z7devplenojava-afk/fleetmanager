import api from '@/lib/axios';

export interface VisitControl {
  id: string;
  location: string;
  assignedTo: string;
  supervisorId?: string;
  supervisorName?: string;
  workPostId?: string;
  workPostName?: string;
  visitDate: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  observations?: string;
  findings?: string;
  reportUrl?: string;
  isSuccessful?: boolean;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VisitControlFilters {
  workPostId?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
  startDate?: string;
  endDate?: string;
}

export interface VisitControlReport {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  filters?: string;
  workPostId?: string;
  workPostName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  totalVisits: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export const visitControlService = {
  // Buscar todas as visitas
  async getAllVisitControls(): Promise<VisitControl[]> {
    try {
      const response = await api.get('/api/visit-controls');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
      throw new Error('Falha ao buscar visitas');
    }
  },

  // Buscar visita por ID
  async getVisitControlById(id: string): Promise<VisitControl> {
    try {
      const response = await api.get(`/api/visit-controls/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visita:', error);
      throw new Error('Falha ao buscar visita');
    }
  },

  // Buscar visitas com filtros
  async getVisitControlsByFilters(filters: VisitControlFilters): Promise<VisitControl[]> {
    try {
      const params = new URLSearchParams();
      if (filters.workPostId) params.append('workPostId', filters.workPostId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/visit-controls/filtered?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas filtradas:', error);
      throw new Error('Falha ao buscar visitas filtradas');
    }
  },

  // Gerar relatório PDF (download direto - mantido para compatibilidade)
  async generatePDFReport(filters: VisitControlFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters.workPostId) params.append('workPostId', filters.workPostId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`/api/visit-controls/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar relatório PDF');
    }
  },

  // Gerar e salvar relatório
  async generateAndSaveReport(filters: VisitControlFilters): Promise<VisitControlReport> {
    try {
      const params = new URLSearchParams();
      if (filters.workPostId) params.append('workPostId', filters.workPostId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.post(`/api/visit-control-reports/generate?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar e salvar relatório:', error);
      throw new Error('Falha ao gerar e salvar relatório');
    }
  },

  // Listar relatórios
  async getAllReports(): Promise<VisitControlReport[]> {
    try {
      const response = await api.get('/api/visit-control-reports');
      return response.data;
    } catch (error) {
      console.error('Erro ao listar relatórios:', error);
      throw new Error('Falha ao listar relatórios');
    }
  },

  // Download de relatório
  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/visit-control-reports/${reportId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      throw new Error('Falha ao baixar relatório');
    }
  },

  // Visualizar relatório (retorna blob para abrir em nova janela)
  async viewReport(reportId: string): Promise<Blob> {
    try {
      const response = await api.get(`/api/visit-control-reports/${reportId}/view`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao visualizar relatório:', error);
      throw new Error('Falha ao visualizar relatório');
    }
  },

  // Excluir relatório
  async deleteReport(reportId: string): Promise<void> {
    try {
      await api.delete(`/api/visit-control-reports/${reportId}`);
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      throw new Error('Falha ao excluir relatório');
    }
  },

  // Criar visita
  async createVisitControl(visitControl: Partial<VisitControl>): Promise<VisitControl> {
    try {
      const response = await api.post('/api/visit-controls', visitControl);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar visita:', error);
      throw new Error('Falha ao criar visita');
    }
  },

  // Atualizar visita
  async updateVisitControl(id: string, visitControl: Partial<VisitControl>): Promise<VisitControl> {
    try {
      const response = await api.put(`/api/visit-controls/${id}`, visitControl);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar visita:', error);
      throw new Error('Falha ao atualizar visita');
    }
  },

  // Excluir visita
  async deleteVisitControl(id: string): Promise<void> {
    try {
      await api.delete(`/api/visit-controls/${id}`);
    } catch (error) {
      console.error('Erro ao excluir visita:', error);
      throw new Error('Falha ao excluir visita');
    }
  },

  // Buscar visitas de hoje
  async getTodayVisits(): Promise<VisitControl[]> {
    try {
      const response = await api.get('/api/visit-controls/today');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas de hoje:', error);
      throw new Error('Falha ao buscar visitas de hoje');
    }
  },

  // Buscar visitas recentes
  async getRecentVisits(): Promise<VisitControl[]> {
    try {
      const response = await api.get('/api/visit-controls/recent');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas recentes:', error);
      throw new Error('Falha ao buscar visitas recentes');
    }
  },

  // Buscar visitas por status
  async getVisitsByStatus(status: VisitControl['status']): Promise<VisitControl[]> {
    try {
      const response = await api.get(`/api/visit-controls/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas por status:', error);
      throw new Error('Falha ao buscar visitas por status');
    }
  },

  // Buscar visitas por supervisor
  async getVisitsBySupervisor(supervisorId: string): Promise<VisitControl[]> {
    try {
      const response = await api.get(`/api/visit-controls/supervisor/${supervisorId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar visitas por supervisor:', error);
      throw new Error('Falha ao buscar visitas por supervisor');
    }
  }
};

