import api from '@/lib/axios';
import { 
  Ronda, 
  CreateRondaDTO, 
  UpdateRondaDTO, 
  RondaFilters, 
  RondaStats, 
  RondaRelatorio,
  RondaStatus,
  RondaTipo,
  RondaPrioridade
} from '@/types/rondas';

export const rondasService = {
  // ===== CRUD BÁSICO =====

  async getAllRondas(): Promise<Ronda[]> {
    const response = await api.get('/api/rondas');
    return response.data?.content || response.data || [];
  },

  async getRondasWithFilters(filters: RondaFilters, page = 0, size = 20): Promise<{ content: Ronda[], totalElements: number }> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.prioridade) params.append('prioridade', filters.prioridade);
    if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
    if (filters.localId) params.append('localId', filters.localId);
    if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters.dataFim) params.append('dataFim', filters.dataFim);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    
    params.append('page', page.toString());
    params.append('size', size.toString());
    
    const response = await api.get(`/api/rondas/search?${params.toString()}`);
    return response.data;
  },

  async getRondaById(id: string): Promise<Ronda> {
    try {
      const response = await api.get(`/api/rondas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar ronda por ID:', error);
      throw new Error('Ronda não encontrada');
    }
  },

  async createRonda(ronda: CreateRondaDTO): Promise<Ronda> {
    try {
      const response = await api.post('/api/rondas', ronda);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar ronda:', error);
      throw new Error('Falha ao criar ronda');
    }
  },

  async updateRonda(id: string, ronda: UpdateRondaDTO): Promise<Ronda> {
    try {
      const response = await api.put(`/api/rondas/${id}`, ronda);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar ronda:', error);
      throw new Error('Falha ao atualizar ronda');
    }
  },

  async deleteRonda(id: string): Promise<void> {
    try {
      await api.delete(`/api/rondas/${id}`);
    } catch (error) {
      console.error('Erro ao excluir ronda:', error);
      throw new Error('Falha ao excluir ronda');
    }
  },

  // ===== OPERAÇÕES ESPECÍFICAS =====

  async iniciarRonda(id: string): Promise<Ronda> {
    try {
      const response = await api.post(`/api/rondas/${id}/iniciar`);
      return response.data;
    } catch (error) {
      console.error('Erro ao iniciar ronda:', error);
      throw new Error('Falha ao iniciar ronda');
    }
  },

  async concluirRonda(id: string, observacoes?: string): Promise<Ronda> {
    try {
      const response = await api.post(`/api/rondas/${id}/concluir`, { observacoes });
      return response.data;
    } catch (error) {
      console.error('Erro ao concluir ronda:', error);
      throw new Error('Falha ao concluir ronda');
    }
  },

  async cancelarRonda(id: string, motivo: string): Promise<Ronda> {
    try {
      const response = await api.post(`/api/rondas/${id}/cancelar`, { motivo });
      return response.data;
    } catch (error) {
      console.error('Erro ao cancelar ronda:', error);
      throw new Error('Falha ao cancelar ronda');
    }
  },

  async registrarCheckpoint(rondaId: string, checkpointId: string, observacoes?: string, fotos?: string[]): Promise<void> {
    try {
      await api.post(`/api/rondas/${rondaId}/checkpoints/${checkpointId}/registrar`, {
        observacoes,
        fotos
      });
    } catch (error) {
      console.error('Erro ao registrar checkpoint:', error);
      throw new Error('Falha ao registrar checkpoint');
    }
  },

  // ===== RELATÓRIOS E ESTATÍSTICAS =====

  async getRondaStats(): Promise<RondaStats> {
    const response = await api.get('/api/rondas/stats');
    return response.data;
  },

  async getRondasRelatorio(filters: RondaFilters): Promise<Ronda[]> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.tipo) params.append('tipo', filters.tipo);
    if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
    if (filters.localId) params.append('localId', filters.localId);
    
    // Converter datas para formato ISO DateTime (YYYY-MM-DDTHH:mm:ss)
    if (filters.dataInicio) {
      const dataInicioISO = filters.dataInicio.includes('T') 
        ? filters.dataInicio 
        : `${filters.dataInicio}T00:00:00`;
      params.append('dataInicio', dataInicioISO);
    }
    if (filters.dataFim) {
      const dataFimISO = filters.dataFim.includes('T')
        ? filters.dataFim
        : `${filters.dataFim}T23:59:59`;
      params.append('dataFim', dataFimISO);
    }
    
    const response = await api.get(`/api/rondas/relatorio?${params.toString()}`);
    return response.data || [];
  },

  // ===== ENUMS =====

  async getStatusOptions(): Promise<RondaStatus[]> {
    const response = await api.get('/api/rondas/enums/status');
    return response.data;
  },

  async getTipoOptions(): Promise<RondaTipo[]> {
    const response = await api.get('/api/rondas/enums/tipos');
    return response.data;
  },

  async getPrioridadeOptions(): Promise<RondaPrioridade[]> {
    const response = await api.get('/api/rondas/enums/prioridades');
    return response.data;
  }
};
