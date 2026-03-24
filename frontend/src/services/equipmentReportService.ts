import api from '@/lib/axios';

export interface EquipmentReportRequest {
  reportType: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  equipmentType?: string;
  exportFormat?: string;
}

export interface EquipmentReportResponse {
  data: any[];
  summary?: any;
  generatedAt: string;
}

export const equipmentReportService = {
  // Gerar relatório de equipamentos por funcionário
  async getEquipmentByEmployeeReport(filters?: Partial<EquipmentReportRequest>): Promise<EquipmentReportResponse> {
    try {
      console.log('🔗 Gerando relatório de equipamentos por funcionário:', filters);
      
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.equipmentType) params.append('equipmentType', filters.equipmentType);
      
      const response = await api.get(`/api/equipment-reports/equipment-by-employee?${params.toString()}`);
      
      console.log('✅ Relatório de equipamentos por funcionário gerado:', response.data);
      
      return {
        data: response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de equipamentos por funcionário:', error);
      throw error;
    }
  },

  // Gerar relatório de validade de armas
  async getWeaponValidityReport(filters?: Partial<EquipmentReportRequest>): Promise<EquipmentReportResponse> {
    try {
      console.log('🔗 Gerando relatório de validade de armas:', filters);
      
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/api/equipment-reports/weapon-validity?${params.toString()}`);
      
      console.log('✅ Relatório de validade de armas gerado:', response.data);
      
      return {
        data: response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de validade de armas:', error);
      throw error;
    }
  },

  // Gerar relatório de uso
  async getUsageReport(filters?: Partial<EquipmentReportRequest>): Promise<EquipmentReportResponse> {
    try {
      console.log('🔗 Gerando relatório de uso:', filters);
      
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/api/equipment-reports/usage-report?${params.toString()}`);
      
      console.log('✅ Relatório de uso gerado:', response.data);
      
      return {
        data: response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de uso:', error);
      throw error;
    }
  },

  // Gerar relatório de vencimento
  async getExpirationReport(filters?: Partial<EquipmentReportRequest>): Promise<EquipmentReportResponse> {
    try {
      console.log('🔗 Gerando relatório de vencimento:', filters);
      
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/api/equipment-reports/expiration-report?${params.toString()}`);
      
      console.log('✅ Relatório de vencimento gerado:', response.data);
      
      return {
        data: response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de vencimento:', error);
      throw error;
    }
  },

  // Gerar relatório geral
  async getGeneralReport(filters?: Partial<EquipmentReportRequest>): Promise<EquipmentReportResponse> {
    try {
      console.log('🔗 Gerando relatório geral:', filters);
      
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.equipmentType) params.append('equipmentType', filters.equipmentType);
      
      const response = await api.get(`/api/equipment-reports/general-report?${params.toString()}`);
      
      console.log('✅ Relatório geral gerado:', response.data);
      
      return {
        data: response.data,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Erro ao gerar relatório geral:', error);
      throw error;
    }
  },

  // Exportar relatório para PDF
  async exportToPdf(reportRequest: EquipmentReportRequest): Promise<Blob> {
    try {
      console.log('🔗 Exportando relatório para PDF:', reportRequest);
      
      const response = await api.post('/api/equipment-reports/export/pdf', reportRequest, {
        responseType: 'blob'
      });
      
      console.log('✅ Relatório PDF exportado com sucesso');
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao exportar relatório para PDF:', error);
      throw error;
    }
  },

  // Exportar relatório para Excel
  async exportToExcel(reportRequest: EquipmentReportRequest): Promise<Blob> {
    try {
      console.log('🔗 Exportando relatório para Excel:', reportRequest);
      
      const response = await api.post('/api/equipment-reports/export/excel', reportRequest, {
        responseType: 'blob'
      });
      
      console.log('✅ Relatório Excel exportado com sucesso');
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao exportar relatório para Excel:', error);
      throw error;
    }
  },

  // Exportar relatório para CSV
  async exportToCsv(reportRequest: EquipmentReportRequest): Promise<Blob> {
    try {
      console.log('🔗 Exportando relatório para CSV:', reportRequest);
      
      const response = await api.post('/api/equipment-reports/export/csv', reportRequest, {
        responseType: 'blob'
      });
      
      console.log('✅ Relatório CSV exportado com sucesso');
      
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao exportar relatório para CSV:', error);
      throw error;
    }
  },

  // Função utilitária para download de arquivo
  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};