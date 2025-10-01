import axios from 'axios'; // Importar axios

export interface ReportFilters {
  startDate: string;
  endDate: string;
  supervisor: string;
  vehiclePlate: string;
}

// Remover ReportData e outros tipos não usados

class ReportService {
  private API_URL = import.meta.env.VITE_API_URL || '/api';

  /**
   * Gera relatório no backend (PDF ou Excel)
   */
  async generateReport(filters: ReportFilters, format: 'pdf' | 'xlsx'): Promise<any> {
    try {
      console.log(`📊 Solicitando relatório ${format} para o backend com filtros:`, filters);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token de autenticação não encontrado.");
      }

      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.supervisor && filters.supervisor !== 'all') params.append('supervisor', filters.supervisor);
      if (filters.vehiclePlate && filters.vehiclePlate !== 'all') params.append('vehiclePlate', filters.vehiclePlate);
      params.append('format', format);

      const response = await axios.get(`${this.API_URL}/frota/km-controls/report`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: params,
        responseType: 'arraybuffer', // Importante para receber o blob do arquivo
      });

      console.log(`✅ Relatório ${format} recebido do backend com sucesso.`);
      return response;
    } catch (error) {
      console.error(`❌ Erro ao solicitar relatório ${format} ao backend:`, error);
      throw error;
    }
  }

  /**
   * Valida filtros do relatório (mantido no frontend)
   */
  validateFilters(filters: ReportFilters): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.startDate && filters.endDate) {
      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        errors.push('Data inicial não pode ser maior que a data final');
      }
    }

    if (filters.startDate && new Date(filters.startDate) > new Date()) {
      errors.push('Data inicial não pode ser no futuro');
    }

    if (filters.endDate && new Date(filters.endDate) > new Date()) {
      errors.push('Data final não pode ser no futuro');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Remover formatReportData e convertToCSV, pois não são mais usados
}

export default new ReportService();
