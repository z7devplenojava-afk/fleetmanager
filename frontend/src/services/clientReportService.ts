import api from '@/lib/axios';
import { ReportFilters } from '@/components/clientes/ClientReportFilters';

const formatFiltersForBackend = (filters: ReportFilters) => {
  return {
    name: filters.name,
    cnpj: filters.cnpj,
    startDate: filters.startDate ? filters.startDate.toISOString().split('T')[0] : undefined,
    endDate: filters.endDate ? filters.endDate.toISOString().split('T')[0] : undefined,
    status: filters.status,
  };
};

export const clientReportService = {
  async generatePdfReport(filters: ReportFilters): Promise<Blob> {
    const formattedFilters = formatFiltersForBackend(filters);
    const response = await api.post('/reports/clients/pdf', formattedFilters, {
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  async generateExcelReport(filters: ReportFilters): Promise<Blob> {
    const formattedFilters = formatFiltersForBackend(filters);
    const response = await api.post('/reports/clients/excel', formattedFilters, {
      responseType: 'blob', // Important for downloading files
    });
    return response.data;
  },

  downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};