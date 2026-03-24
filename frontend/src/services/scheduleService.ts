import api from '@/lib/axios';

// --- Interfaces ---

// Representa um funcionário simplificado, para uso dentro da Schedule
export interface ScheduleEmployee {
  id: string;
  name: string;
}

// Representa uma localização simplificada
export interface ScheduleLocation {
  id: string;
  name: string;
}

// Representa um posto de trabalho simplificado
export interface ScheduleWorkPost {
  id: string;
  name: string;
  postCode: string;
  clientId?: string;
  client?: { id: string; name: string };
  shiftStart?: string;
  shiftEnd?: string;
}

// Representa uma rota simplificada
export interface ScheduleRoute {
  id: string;
  name: string;
}

// Representa um veículo simplificado
export interface ScheduleVehicle {
  id: string;
  plate: string;
  model?: string;
}

// Representa uma viagem simplificada
export interface ScheduleTravelTrip {
  id: string;
  name: string;
  code?: string;
  tripType?: string;
  legs?: number;
  originAddress?: string;
  destinationAddress?: string;
  client?: { id: string; name: string };
}

// Representa um cliente simplificado
export interface ScheduleClient {
  id: string;
  name: string;
}

// Enum para os turnos (Shift)
export type Shift = 'DAY' | 'NIGHT' | 'MIXED';

// Enum para o status da escala (ScheduleStatus)
export type ScheduleStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Interface principal para a Escala de Trabalho
export interface Schedule {
  id: string;
  employee: ScheduleEmployee;
  scheduleDate: string; // Formato YYYY-MM-DD
  shift: Shift;
  location: ScheduleLocation;
  workPost?: ScheduleWorkPost;
  travelTrip?: ScheduleTravelTrip;
  legs?: number;
  client?: ScheduleClient;
  status: ScheduleStatus;
  observations?: string;
  routeId?: string;
  route?: ScheduleRoute;
  vehicleId?: string;
  vehicle?: ScheduleVehicle;
  vehiclePlate?: string;
  createdAt: string;
  updatedAt: string;
}

// DTO para criar uma nova escala
export interface CreateScheduleDTO {
  employeeId: string;
  locationId?: string;
  workPostId?: string; // Posto de trabalho (opcional)
  travelTripId?: string; // Viagem associada (alternativa ao workPostId)
  legs?: number; // Número de pegadas (1-4)
  scheduleDate: string; // Formato YYYY-MM-DD
  shift: Shift;
  status: ScheduleStatus;
  observations?: string;
  routeId?: string;
  vehicleId?: string;
}

// DTO para atualizar uma escala (todos os campos são opcionais)
export type UpdateScheduleDTO = Partial<CreateScheduleDTO>;

// --- Service ---

export const scheduleService = {
  /**
   * Busca todas as escalas de trabalho.
   */
  async findAll(): Promise<Schedule[]> {
    try {
      console.log('🔍 ScheduleService.findAll - Fazendo requisição para /api/schedules');
      const response = await api.get('/api/schedules', {
        validateStatus: (status) => status < 500 // Não lançar erro para 401/403, apenas para 500+
      });
      const data = response.data;

      console.log('🔍 ScheduleService.findAll - Response status:', response.status);
      console.log('🔍 ScheduleService.findAll - Response headers:', response.headers);
      console.log('🔍 ScheduleService.findAll - Dados recebidos:', typeof data, data);
      console.log('🔍 ScheduleService.findAll - É array?', Array.isArray(data));
      console.log('🔍 ScheduleService.findAll - Quantidade:', Array.isArray(data) ? data.length : 'N/A');

      // Garantir que sempre retornamos um array
      if (Array.isArray(data)) {
        console.log('✅ ScheduleService.findAll - Retornando array com', data.length, 'escalas');
        if (data.length > 0) {
          console.log('📋 ScheduleService.findAll - Primeira escala:', data[0]);
        }
        return data;
      } else if (data && Array.isArray(data.content)) {
        console.log('✅ ScheduleService.findAll - Retornando data.content com', data.content.length, 'escalas');
        return data.content;
      } else if (data && typeof data === 'number') {
        // Se o backend retornou apenas um número (count), retornar array vazio
        console.warn('⚠️ API retornou apenas contagem de escalas:', data);
        return [];
      } else {
        console.warn('⚠️ API retornou dados em formato inesperado:', data);
        console.warn('⚠️ Tipo dos dados:', typeof data);
        console.warn('⚠️ Estrutura dos dados:', JSON.stringify(data, null, 2));
        return [];
      }
    } catch (error: any) {
      console.error('❌ Erro detalhado ao buscar escalas de trabalho:', error);
      console.error('❌ Status:', error.response?.status);
      console.error('❌ Data:', error.response?.data);
      console.error('❌ Headers:', error.response?.headers);
      console.error('❌ Mensagem:', error.message);

      // Se for erro 500, logar mas retornar array vazio (backend pode estar com problema temporário)
      if (error.response?.status === 500) {
        console.warn('⚠️ Backend retornou erro 500. Retornando array vazio para não quebrar o frontend.');
        console.warn('⚠️ Isso pode indicar que o backend precisa ser atualizado com as correções mais recentes.');
      }

      // Retornar array vazio ao invés de lançar erro para não quebrar o frontend
      return [];
    }
  },

  /**
   * Busca uma escala de trabalho pelo seu ID.
   * @param id - O UUID da escala.
   */
  async findById(id: string): Promise<Schedule> {
    const response = await api.get(`/api/schedules/${id}`);
    return response.data;
  },

  /**
   * Busca todas as escalas de um funcionário específico.
   * @param employeeId - O UUID do funcionário.
   */
  async findByEmployeeId(employeeId: string): Promise<Schedule[]> {
    const response = await api.get(`/api/schedules/employee/${employeeId}`);
    return response.data;
  },

  /**
   * Busca escalas de trabalho por uma data específica.
   * @param date - A data no formato 'YYYY-MM-DD'.
   */
  async findByDate(date: string): Promise<Schedule[]> {
    const response = await api.get('/api/schedules/date', { params: { date } });
    return response.data;
  },

  /**
   * Cria uma nova escala de trabalho.
   * @param data - Os dados da nova escala.
   */
  async create(data: CreateScheduleDTO): Promise<Schedule> {
    console.log('📤 ScheduleService.create - Enviando dados:', data);
    try {
      const response = await api.post('/api/schedules', data);
      console.log('✅ ScheduleService.create - Resposta:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ ScheduleService.create - Erro:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);

      // Re-throw with message from backend if available
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      if (typeof error.response?.data === 'string') {
        throw new Error(error.response.data);
      }

      throw error;
    }
  },

  /**
   * Atualiza uma escala de trabalho existente.
   * @param id - O UUID da escala a ser atualizada.
   * @param data - Os dados a serem atualizados.
   */
  async update(id: string, data: UpdateScheduleDTO): Promise<Schedule> {
    const response = await api.put(`/api/schedules/${id}`, data);
    return response.data;
  },

  /**
   * Exclui uma escala de trabalho.
   * @param id - O UUID da escala a ser excluída.
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/schedules/${id}`);
  },

  /**
   * Busca todas as escalas de trabalho (com suporte a filtros para compatibilidade).
   */
  async getSchedules(filters?: any): Promise<Schedule[]> {
    try {
      const response = await api.get('/api/schedules', {
        validateStatus: (status) => status < 500 // Não lançar erro para 401/403, apenas para 500+
      });
      const data = response.data;

      console.log('🔍 ScheduleService.getSchedules - Dados recebidos:', typeof data, data);

      // Garantir que sempre retornamos um array
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.content)) {
        return data.content;
      } else if (data && typeof data === 'number') {
        // Se o backend retornou apenas um número (count), retornar array vazio
        console.warn('⚠️ API retornou apenas contagem de escalas:', data);
        return [];
      } else {
        console.warn('⚠️ API retornou dados em formato inesperado:', data);
        return [];
      }
    } catch (error: any) {
      console.error('Erro ao buscar escalas de trabalho:', error);

      // Se for erro 500, logar mas retornar array vazio
      if (error.response?.status === 500) {
        console.warn('⚠️ Backend retornou erro 500. Retornando array vazio para não quebrar o frontend.');
      }

      return [];
    }
  },

  /**
   * Exclui uma escala de trabalho (alias para delete para compatibilidade)
   */
  async deleteSchedule(id: string): Promise<void> {
    await this.delete(id);
  },

  /**
   * Gera relatório PDF de escalas com filtros opcionais
   */
  async generatePDFReport(filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    workPostId?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      console.log('📤 ScheduleService.generatePDFReport - Filtros:', filters);
      const response = await api.get('/api/schedules/report/pdf', {
        params: filters,
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao gerar relatório PDF:', error);

      // Tentar ler o erro se for um Blob (comum ao baixar arquivos)
      if (error.response?.data instanceof Blob) {
        try {
          const blobText = await error.response.data.text();
          console.error('❌ Conteúdo do Blob de erro:', blobText);
          const jsonError = JSON.parse(blobText);
          console.error('❌ Erro estruturado:', jsonError);
          if (jsonError.message) {
            throw new Error(jsonError.message);
          }
        } catch (e) {
          console.warn('⚠️ Não foi possível fazer parse do erro Blob:', e);
        }
      }

      throw new Error(error.response?.data?.message || 'Falha ao gerar relatório PDF');
    }
  },
}; 