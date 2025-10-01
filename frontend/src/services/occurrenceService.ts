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

// Dados de fallback para quando o backend não estiver disponível
const fallbackOccurrences: Occurrence[] = [
  {
    id: '1',
    type: 'incidente',
    title: 'Tentativa de Invasão',
    description: 'Indivíduo suspeito tentou acessar a área restrita do condomínio',
    employeeId: '1',
    employeeName: 'João Silva',
    location: 'Condomínio Residencial',
    status: 'investigando',
    priority: 'alta',
    date: '2024-01-15T08:30:00Z',
    startTime: '08:30',
    endTime: '10:00',
    responsible: 'Supervisor Carlos',
    startDate: '2024-01-15T08:30:00Z',
    endDate: '2024-01-15T10:00:00Z',
    reason: 'Segurança comprometida'
  },
  {
    id: '2',
    type: 'equipamento',
    title: 'Falha no Sistema de CFTV',
    description: 'Câmera do portão principal apresentou falha técnica',
    employeeId: '2',
    employeeName: 'Maria Santos',
    location: 'Shopping Center',
    status: 'aberta',
    priority: 'media',
    date: '2024-01-14T14:20:00Z',
    startTime: '14:20',
    endTime: '16:00',
    responsible: 'Técnico Roberto',
    startDate: '2024-01-14T14:20:00Z',
    endDate: '2024-01-14T16:00:00Z',
    reason: 'Manutenção preventiva'
  },
  {
    id: '3',
    type: 'ausencia',
    title: 'Ausência Injustificada',
    description: 'Funcionário não compareceu ao trabalho sem aviso prévio',
    employeeId: '3',
    employeeName: 'Pedro Costa',
    location: 'Escritório Comercial',
    status: 'resolvida',
    priority: 'baixa',
    date: '2024-01-13T07:00:00Z',
    startTime: '07:00',
    endTime: '18:00',
    responsible: 'RH Ana Paula',
    startDate: '2024-01-13T07:00:00Z',
    endDate: '2024-01-13T18:00:00Z',
    reason: 'Problemas pessoais'
  }
];

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
      
      console.log('🔗 Tentando buscar ocorrências no backend:', url);
      const response = await api.get(url);
      console.log('✅ Ocorrências carregadas do backend:', response.data.length);
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, usando dados de fallback:', error);
      
      // Aplicar filtros nos dados de fallback
      let filteredData = [...fallbackOccurrences];
      
      if (filters.employeeId) {
        filteredData = filteredData.filter(o => o.employeeId === filters.employeeId);
      }
      if (filters.type) {
        filteredData = filteredData.filter(o => o.type.toLowerCase() === filters.type?.toLowerCase());
      }
      if (filters.status) {
        filteredData = filteredData.filter(o => o.status.toLowerCase() === filters.status?.toLowerCase());
      }
      if (filters.priority) {
        filteredData = filteredData.filter(o => o.priority.toLowerCase() === filters.priority?.toLowerCase());
      }
      if (filters.startDate) {
        filteredData = filteredData.filter(o => new Date(o.date) >= new Date(filters.startDate!));
      }
      if (filters.endDate) {
        filteredData = filteredData.filter(o => new Date(o.date) <= new Date(filters.endDate!));
      }
      
      console.log('📱 Usando dados de fallback - Ocorrências:', filteredData.length);
      return filteredData;
    }
  },

  async getOccurrenceById(id: string): Promise<Occurrence> {
    try {
      console.log('🔗 Tentando buscar ocorrência por ID no backend:', id);
      const response = await api.get(`/occurrences/${id}`);
      console.log('✅ Ocorrência encontrada no backend');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, buscando nos dados de fallback:', error);
      
      const occurrence = fallbackOccurrences.find(o => o.id === id);
      if (!occurrence) {
        throw new Error('Ocorrência não encontrada');
      }
      
      console.log('📱 Ocorrência encontrada nos dados de fallback');
      return occurrence;
    }
  },

  async createOccurrence(data: CreateOccurrenceRequest): Promise<Occurrence> {
    try {
      console.log('🔗 Tentando criar ocorrência no backend:', data);
      const response = await api.post('/occurrences', data);
      console.log('✅ Ocorrência criada no backend');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando criação:', error);
      
      // Simular criação local
      const newOccurrence: Occurrence = {
        ...data,
        id: Date.now().toString(),
        employeeName: `Funcionário ${data.employeeId}` // Em um caso real, buscaríamos o nome
      };
      
      console.log('📱 Ocorrência simulada localmente');
      return newOccurrence;
    }
  },

  async updateOccurrence(id: string, data: UpdateOccurrenceRequest): Promise<Occurrence> {
    try {
      console.log('🔗 Tentando atualizar ocorrência no backend:', id);
      const response = await api.put(`/occurrences/${id}`, data);
      console.log('✅ Ocorrência atualizada no backend');
      return response.data;
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando atualização:', error);
      
      // Simular atualização local
      const occurrence = fallbackOccurrences.find(o => o.id === id);
      if (!occurrence) {
        throw new Error('Ocorrência não encontrada');
      }
      
      const updatedOccurrence = { ...occurrence, ...data };
      console.log('📱 Ocorrência atualizada localmente');
      return updatedOccurrence;
    }
  },

  async deleteOccurrence(id: string): Promise<void> {
    try {
      console.log('🔗 Tentando excluir ocorrência no backend:', id);
      await api.delete(`/occurrences/${id}`);
      console.log('✅ Ocorrência excluída no backend');
    } catch (error) {
      console.warn('⚠️ Backend não disponível, simulando exclusão:', error);
      console.log('📱 Ocorrência excluída localmente (simulado)');
    }
  }
}; 