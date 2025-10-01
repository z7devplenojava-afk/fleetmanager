import axios from '@/lib/axios';
import { 
  EquipmentReport, 
  EquipmentReportFilters 
} from '@/types/equipmentReport';

class EquipmentReportService {
  private readonly baseUrl = '/equipment-reports';

  // Gerar relatório geral
  async generateReport(filters: EquipmentReportFilters): Promise<EquipmentReport> {
    try {
      const response = await axios.post(`${this.baseUrl}/generate`, filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // Relatório de equipamentos por funcionário
  async generateEquipmentByEmployeeReport(filters: EquipmentReportFilters): Promise<EquipmentReport> {
    try {
      const response = await axios.post(`${this.baseUrl}/equipment-by-employee`, filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório por funcionário:', error);
      throw error;
    }
  }

  // Relatório de validade de armas
  async generateWeaponValidityReport(filters: EquipmentReportFilters): Promise<EquipmentReport> {
    try {
      const response = await axios.post(`${this.baseUrl}/weapon-validity`, filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de validade de armas:', error);
      throw error;
    }
  }

  // Relatório de uso
  async generateUsageReport(filters: EquipmentReportFilters): Promise<EquipmentReport> {
    try {
      const response = await axios.post(`${this.baseUrl}/usage-report`, filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de uso:', error);
      throw error;
    }
  }

  // Relatório de vencimento
  async generateExpiryReport(filters: EquipmentReportFilters): Promise<EquipmentReport> {
    try {
      const response = await axios.post(`${this.baseUrl}/expiry-report`, filters);
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de vencimento:', error);
      throw error;
    }
  }

  // Exportar para PDF
  async exportToPdf(filters: EquipmentReportFilters): Promise<Blob> {
    try {
      const response = await axios.post(`${this.baseUrl}/export/pdf`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw error;
    }
  }

  // Exportar para Excel
  async exportToExcel(filters: EquipmentReportFilters): Promise<Blob> {
    try {
      const response = await axios.post(`${this.baseUrl}/export/excel`, filters, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw error;
    }
    }
    
    // Obter opções de filtros
    async getFilterOptions(): Promise<any> {
      try {
        const response = await axios.get(`${this.baseUrl}/filters/options`);
        return response.data;
      } catch (error) {
        console.error('Erro ao obter opções de filtros:', error);
        throw error;
      }
    }

  // Métodos utilitários
  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Em uso':
        return 'bg-blue-100 text-blue-800';
      case 'Devolvido':
        return 'bg-green-100 text-green-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      case 'Vencendo em breve':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getExpiryColor(daysToExpiry?: number): string {
    if (!daysToExpiry) return 'text-gray-600';
    if (daysToExpiry < 0) return 'text-red-600 font-semibold';
    if (daysToExpiry <= 30) return 'text-yellow-600 font-semibold';
    return 'text-green-600';
  }

  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const equipmentReportService = new EquipmentReportService();
export default equipmentReportService; 