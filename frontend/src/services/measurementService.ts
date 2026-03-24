import api from '@/lib/axios';
import { 
  MeasurementBulletin, 
  MeasurementItem, 
  CalculationMemory, 
  MeasurementStatus,
  CreateMeasurementBulletinDTO,
  UpdateMeasurementBulletinDTO,
  ValidationData,
  MeasurementFilters,
  MeasurementReport
} from '@/types/measurement';

// Dados mockados removidos - agora usa apenas API real

export const measurementService = {
  /**
   * Busca todos os boletins de medição ou aplica filtros
   */
  async getBulletins(filters?: MeasurementFilters): Promise<MeasurementBulletin[]> {
    try {
      if (filters?.searchTerm) {
        // Busca por texto
        const response = await api.get(`/measurements/search-text?searchTerm=${encodeURIComponent(filters.searchTerm)}`);
        return response.data || [];
      } else if (filters && Object.keys(filters).some(key => filters[key as keyof MeasurementFilters])) {
        // Busca com filtros
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, value.toString());
          }
        });
        const response = await api.get(`/measurements/search?${params.toString()}`);
        // O endpoint retorna uma página, então precisamos extrair o conteúdo
        return response.data?.content || response.data || [];
      } else {
        // Buscar todos os boletins (usar endpoint sem paginação)
        const response = await api.get('/measurements/all');
        const data = response.data;
        
        // Garantir que sempre retornamos um array
        if (Array.isArray(data)) {
          return data;
        } else if (data && Array.isArray(data.content)) {
          return data.content;
        } else {
          console.warn('⚠️ API retornou dados em formato inesperado:', data);
          return [];
        }
      }
    } catch (error) {
      console.error('Erro ao buscar boletins de medição:', error);
      // Em caso de erro, retornar lista vazia em vez de lançar exceção
      return [];
    }
  },



  /**
   * Busca um boletim de medição pelo ID
   */
  async getBulletinById(id: string): Promise<MeasurementBulletin> {
    try {
      const response = await api.get(`/measurements/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar boletim por ID:', error);
      throw new Error('Falha ao buscar boletim de medição');
    }
  },

  /**
   * Cria um novo boletim de medição
   */
  async createBulletin(data: CreateMeasurementBulletinDTO): Promise<MeasurementBulletin> {
    try {
      const response = await api.post('/measurements', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar boletim de medição:', error);
      throw new Error('Falha ao criar boletim de medição');
    }
  },

  /**
   * Atualiza um boletim de medição
   */
  async updateBulletin(id: string, data: UpdateMeasurementBulletinDTO): Promise<MeasurementBulletin> {
    try {
      const response = await api.put(`/measurements/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar boletim de medição:', error);
      throw new Error('Falha ao atualizar boletim de medição');
    }
  },

  /**
   * Valida um boletim de medição
   */
  async validateBulletin(id: string, validationData: ValidationData): Promise<MeasurementBulletin> {
    try {
      const params = new URLSearchParams();
      params.append('validatedBy', validationData.validatedBy);
      params.append('checkedBy', validationData.checkedBy);
      
      const response = await api.patch(`/measurements/${id}/validate?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao validar boletim de medição:', error);
      throw new Error('Falha ao validar boletim de medição');
    }
  },

  /**
   * Exclui um boletim de medição
   */
  async deleteBulletin(id: string): Promise<void> {
    try {
      await api.delete(`/measurements/${id}`);
    } catch (error) {
      console.error('Erro ao excluir boletim de medição:', error);
      throw new Error('Falha ao excluir boletim de medição');
    }
  },

  /**
   * Salva a memória de cálculo
   */
  async saveCalculationMemory(bulletinId: string, memory: Partial<CalculationMemory>): Promise<CalculationMemory> {
    try {
      const response = await api.post(`/measurements/${bulletinId}/calculation-memory`, memory);
      return response.data;
    } catch (error) {
      console.error('Erro ao salvar memória de cálculo:', error);
      throw new Error('Falha ao salvar memória de cálculo');
    }
  },

  /**
   * Gera relatório de medições
   */
  async getReport(): Promise<MeasurementReport> {
    try {
      const response = await api.get('/measurements/report');
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de medições:', error);
      throw new Error('Falha ao gerar relatório de medições');
    }
  },

  /**
   * Helper para obter nome do centro de custo
   */
  getCostCenterName(costCenterId: string): string {
    const costCenters: Record<string, string> = {
      '1': 'Operacional',
      '2': 'Comercial',
      '3': 'RH',
      '4': 'Financeiro'
    };
    return costCenters[costCenterId] || 'Não definido';
  },

  /**
   * Gera PDF de um boletim específico
   */
  async generateBulletinPDF(id: string): Promise<Blob> {
    try {
      console.log(`📄 Gerando PDF para boletim: ${id}`);
      
      const response = await api.get(`/measurements/${id}/pdf`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/pdf'
        }
      });
      
      console.log('✅ PDF gerado com sucesso, tamanho:', response.data.size, 'bytes');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF do boletim:', error);
      throw error;
    }
  },

  /**
   * Gera Excel de um boletim específico
   */
  async generateBulletinExcel(id: string): Promise<Blob> {
    try {
      const response = await api.get(`/measurements/${id}/excel`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar Excel do boletim:', error);
      throw error;
    }
  },

  /**
   * Gera PDFs em lote de múltiplos boletins
   */
  async generateBulkBulletinsPDF(bulletinIds: string[]): Promise<Blob> {
    try {
      const response = await api.post('/measurements/bulk/pdf', bulletinIds, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar PDFs em lote:', error);
      throw error;
    }
  },

  /**
   * Gera Excel em lote com múltiplos boletins
   */
  async generateBulkBulletinsExcel(bulletinIds: string[]): Promise<Blob> {
    try {
      const response = await api.post('/measurements/bulk/excel', bulletinIds, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar Excel em lote:', error);
      throw error;
    }
  }
}; 