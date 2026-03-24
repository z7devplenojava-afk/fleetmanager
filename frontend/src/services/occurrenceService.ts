import api from '@/lib/axios';

export interface Occurrence {
  id: string;
  type: string;
  title: string;
  description: string;
  employeeId: string;
  employeeName: string;
  location: string;
  status: string;
  priority: string;
  date: string;
  startTime?: string;
  endTime?: string;
  responsible: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  warningNumber?: number;
}

export interface OccurrenceFilters {
  employeeId?: string;
  type?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  responsible?: string;
  location?: string;
}

export interface CreateOccurrenceRequest {
  type: string;
  title: string;
  description: string;
  employeeId: string;
  location: string;
  status: string;
  priority: string;
  date: string;
  startTime?: string;
  endTime?: string;
  responsible: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  warningNumber?: number;
}

export interface UpdateOccurrenceRequest extends Partial<CreateOccurrenceRequest> {
  id: string;
}


export const occurrenceService = {
  async getOccurrences(filters: OccurrenceFilters = {}): Promise<Occurrence[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const queryString = params.toString();
      const url = queryString ? `/occurrences?${queryString}` : '/occurrences';
      
      console.log('🔗 Buscando ocorrências no backend:', url);
      const response = await api.get(url);
      console.log('✅ Ocorrências carregadas do backend:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar ocorrências:', error);
      throw new Error('Falha ao conectar com o servidor de ocorrências');
    }
  },

  async getOccurrenceById(id: string): Promise<Occurrence> {
    try {
      console.log('🔗 Buscando ocorrência por ID no backend:', id);
      const response = await api.get(`/occurrences/${id}`);
      console.log('✅ Ocorrência encontrada no backend');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar ocorrência:', error);
      throw new Error(`Ocorrência ${id} não encontrada ou erro no servidor`);
    }
  },

  async createOccurrence(data: CreateOccurrenceRequest): Promise<Occurrence> {
    try {
      console.log('🔗 Criando ocorrência no backend:', data);
      const response = await api.post('/occurrences', data);
      console.log('✅ Ocorrência criada no backend');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar ocorrência:', error);
      throw new Error('Falha ao criar ocorrência no servidor');
    }
  },

  async updateOccurrence(id: string, data: UpdateOccurrenceRequest): Promise<Occurrence> {
    try {
      console.log('🔗 Atualizando ocorrência no backend:', id);
      const response = await api.put(`/occurrences/${id}`, data);
      console.log('✅ Ocorrência atualizada no backend');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar ocorrência:', error);
      throw new Error(`Falha ao atualizar ocorrência ${id} no servidor`);
    }
  },

  async deleteOccurrence(id: string): Promise<void> {
    try {
      console.log('🔗 Excluindo ocorrência no backend:', id);
      await api.delete(`/occurrences/${id}`);
      console.log('✅ Ocorrência excluída no backend');
    } catch (error) {
      console.error('❌ Erro ao excluir ocorrência:', error);
      throw new Error(`Falha ao excluir ocorrência ${id} no servidor`);
    }
  },

  // Gerar relatório PDF de ocorrências
  async generatePDFReport(filters: OccurrenceFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/api/operational/occurrences/report/pdf?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw new Error('Falha ao gerar relatório PDF');
    }
  }
}; 