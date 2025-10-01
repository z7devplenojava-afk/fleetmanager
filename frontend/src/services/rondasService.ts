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
    try {
      const response = await api.get('/rondas');
      return response.data;
    } catch (error) {
      console.warn('API de rondas não disponível, usando dados mock:', error);
      return this.getMockRondas();
    }
  },

  async getRondasWithFilters(filters: RondaFilters, page = 0, size = 20): Promise<{ content: Ronda[], totalElements: number }> {
    try {
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
    } catch (error) {
      console.warn('API de busca de rondas não disponível, usando dados mock:', error);
      const mockRondas = this.getMockRondas();
      return { content: mockRondas, totalElements: mockRondas.length };
    }
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
      const response = await api.post('/rondas', ronda);
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
    try {
      const response = await api.get('/rondas/stats');
      return response.data;
    } catch (error) {
      console.warn('API de estatísticas não disponível, usando dados mock:', error);
      return this.getMockStats();
    }
  },

  async getRondasRelatorio(filters: RondaFilters): Promise<RondaRelatorio[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.tipo) params.append('tipo', filters.tipo);
      if (filters.responsavelId) params.append('responsavelId', filters.responsavelId);
      if (filters.localId) params.append('localId', filters.localId);
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
      if (filters.dataFim) params.append('dataFim', filters.dataFim);
      
      const response = await api.get(`/api/rondas/relatorio?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('API de relatórios não disponível, usando dados mock:', error);
      return this.getMockRelatorio();
    }
  },

  // ===== ENUMS =====

  async getStatusOptions(): Promise<RondaStatus[]> {
    try {
      const response = await api.get('/rondas/enums/status');
      return response.data;
    } catch (error) {
      console.warn('API de status não disponível, usando valores padrão:', error);
      return ['AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA', 'ATRASADA'];
    }
  },

  async getTipoOptions(): Promise<RondaTipo[]> {
    try {
      const response = await api.get('/rondas/enums/tipos');
      return response.data;
    } catch (error) {
      console.warn('API de tipos não disponível, usando valores padrão:', error);
      return ['PREVENTIVA', 'PATRULHAMENTO', 'VIGILANCIA', 'EMERGENCIA', 'ESPECIAL'];
    }
  },

  async getPrioridadeOptions(): Promise<RondaPrioridade[]> {
    try {
      const response = await api.get('/rondas/enums/prioridades');
      return response.data;
    } catch (error) {
      console.warn('API de prioridades não disponível, usando valores padrão:', error);
      return ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];
    }
  },

  // ===== DADOS MOCK =====

  getMockRondas(): Ronda[] {
    return [
      {
        id: '1',
        nome: 'Ronda Preventiva - Shopping Norte',
        descricao: 'Ronda de segurança preventiva no shopping',
        tipo: 'PREVENTIVA',
        prioridade: 'MEDIA',
        status: 'AGENDADA',
        dataInicio: '2024-01-15T08:00:00Z',
        dataFim: '2024-01-15T12:00:00Z',
        duracaoEstimada: 240,
        responsavelId: '1',
        responsavelNome: 'João Silva',
        supervisorId: '2',
        supervisorNome: 'Maria Santos',
        localId: '1',
        localNome: 'Shopping Norte',
        endereco: 'Av. Paulista, 1000 - São Paulo/SP',
        observacoes: 'Verificar câmeras e alarmes',
        checkpoints: [
          {
            id: '1',
            rondaId: '1',
            nome: 'Entrada Principal',
            descricao: 'Verificar entrada principal',
            ordem: 1,
            latitude: -23.5505,
            longitude: -46.6333,
            endereco: 'Entrada Principal - Shopping Norte',
            obrigatorio: true,
            tempoEstimado: 15,
            status: 'PENDENTE'
          },
          {
            id: '2',
            rondaId: '1',
            nome: 'Estacionamento',
            descricao: 'Verificar estacionamento',
            ordem: 2,
            latitude: -23.5506,
            longitude: -46.6334,
            endereco: 'Estacionamento - Shopping Norte',
            obrigatorio: true,
            tempoEstimado: 30,
            status: 'PENDENTE'
          }
        ],
        equipamentos: [
          {
            id: '1',
            rondaId: '1',
            equipamentoId: '1',
            equipamentoNome: 'Rádio Comunicador',
            equipamentoTipo: 'COMUNICACAO',
            numeroSerie: 'RC001',
            status: 'DISPONIVEL'
          }
        ],
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        createdBy: 'admin'
      },
      {
        id: '2',
        nome: 'Patrulhamento Noturno - Centro',
        descricao: 'Patrulhamento noturno no centro da cidade',
        tipo: 'PATRULHAMENTO',
        prioridade: 'ALTA',
        status: 'EM_ANDAMENTO',
        dataInicio: '2024-01-15T22:00:00Z',
        dataFim: '2024-01-16T06:00:00Z',
        duracaoEstimada: 480,
        duracaoReal: 120,
        responsavelId: '3',
        responsavelNome: 'Pedro Costa',
        localId: '2',
        localNome: 'Centro da Cidade',
        endereco: 'Centro - São Paulo/SP',
        checkpoints: [],
        equipamentos: [],
        createdAt: '2024-01-14T15:00:00Z',
        updatedAt: '2024-01-15T22:00:00Z',
        createdBy: 'admin'
      }
    ];
  },

  getMockStats(): RondaStats {
    return {
      total: 25,
      agendadas: 8,
      emAndamento: 3,
      concluidas: 12,
      canceladas: 1,
      atrasadas: 1,
      percentualConclusao: 85.5,
      tempoMedioConclusao: 245,
      rondasHoje: 5,
      rondasSemana: 18
    };
  },

  getMockRelatorio(): RondaRelatorio[] {
    return [
      {
        id: '1',
        rondaId: '1',
        rondaNome: 'Ronda Preventiva - Shopping Norte',
        dataInicio: '2024-01-15T08:00:00Z',
        dataFim: '2024-01-15T12:00:00Z',
        duracaoReal: 240,
        status: 'CONCLUIDA',
        responsavelNome: 'João Silva',
        localNome: 'Shopping Norte',
        checkpointsVisitados: 2,
        checkpointsTotal: 2,
        percentualConclusao: 100,
        observacoes: 'Ronda executada com sucesso',
        createdAt: '2024-01-15T12:00:00Z'
      }
    ];
  }
};
