import api from '../lib/axios';
import { 
  FeriasPeriodo, 
  Afastamento, 
  CreateFeriasRequest, 
  UpdateFeriasRequest, 
  CreateAfastamentoRequest, 
  UpdateAfastamentoRequest,
  FeriasFilters,
  AfastamentoFilters
} from '../types/ferias';

export const feriasService = {
  // Férias
  async getFerias(filters: FeriasFilters = {}): Promise<FeriasPeriodo[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/ferias?${params.toString()}`);
    return response.data;
  },

  async getFeriasById(id: string): Promise<FeriasPeriodo> {
    const response = await api.get(`/api/ferias/${id}`);
    return response.data;
  },

  async getFeriasByEmployee(employeeId: string): Promise<FeriasPeriodo[]> {
    const response = await api.get(`/api/ferias/employee/${employeeId}`);
    return response.data;
  },

  async createFerias(data: CreateFeriasRequest): Promise<FeriasPeriodo> {
    const response = await api.post('/ferias', data);
    return response.data;
  },

  async updateFerias(id: string, data: UpdateFeriasRequest): Promise<FeriasPeriodo> {
    const response = await api.put(`/api/ferias/${id}`, data);
    return response.data;
  },

  async deleteFerias(id: string): Promise<void> {
    await api.delete(`/api/ferias/${id}`);
  },

  async approveFerias(id: string): Promise<FeriasPeriodo> {
    const response = await api.put(`/api/ferias/${id}/approve`);
    return response.data;
  },

  async rejectFerias(id: string, motivo: string): Promise<FeriasPeriodo> {
    const response = await api.put(`/api/ferias/${id}/reject`, { motivo });
    return response.data;
  },

  // Afastamentos
  async getAfastamentos(filters: AfastamentoFilters = {}): Promise<Afastamento[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/afastamentos?${params.toString()}`);
    return response.data;
  },

  async getAfastamentoById(id: string): Promise<Afastamento> {
    const response = await api.get(`/api/afastamentos/${id}`);
    return response.data;
  },

  async getAfastamentosByEmployee(employeeId: string): Promise<Afastamento[]> {
    const response = await api.get(`/api/afastamentos/employee/${employeeId}`);
    return response.data;
  },

  async createAfastamento(data: CreateAfastamentoRequest): Promise<Afastamento> {
    const response = await api.post('/afastamentos', data);
    return response.data;
  },

  async updateAfastamento(id: string, data: UpdateAfastamentoRequest): Promise<Afastamento> {
    const response = await api.put(`/api/afastamentos/${id}`, data);
    return response.data;
  },

  async deleteAfastamento(id: string): Promise<void> {
    await api.delete(`/api/afastamentos/${id}`);
  },

  async approveAfastamento(id: string): Promise<Afastamento> {
    const response = await api.put(`/api/afastamentos/${id}/approve`);
    return response.data;
  },

  async rejectAfastamento(id: string, motivo: string): Promise<Afastamento> {
    const response = await api.put(`/api/afastamentos/${id}/reject`, { motivo });
    return response.data;
  },

  // Relatórios e Estatísticas
  async getFeriasStats(): Promise<{
    pendentes: number;
    aprovadas: number;
    emAndamento: number;
    concluidas: number;
    canceladas: number;
  }> {
    const response = await api.get('/ferias/stats');
    return response.data;
  },

  async getAfastamentosStats(): Promise<{
    ativos: number;
    pendentes: number;
    aprovados: number;
    concluidos: number;
  }> {
    const response = await api.get('/afastamentos/stats');
    return response.data;
  },

  // Exportação
  async exportFerias(filters: FeriasFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/ferias/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportAfastamentos(filters: AfastamentoFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/api/afastamentos/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}; 