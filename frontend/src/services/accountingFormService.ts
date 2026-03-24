import api from '@/lib/axios';

export const accountingFormService = {
  /**
   * Gera ficha de contabilidade em HTML para visualização
   */
  async generateHtml(employeeId: string): Promise<void> {
    try {
      const response = await api.get(`/api/accounting-forms/${employeeId}/html`, {
        responseType: 'blob'
      });

      // Criar blob e abrir em nova aba
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Erro ao gerar ficha de contabilidade:', error);
      throw error;
    }
  },

  /**
   * Gera ficha de contabilidade em PDF para download
   */
  async downloadPdf(employeeId: string, employeeName: string): Promise<void> {
    try {
      const response = await api.get(`/api/accounting-forms/${employeeId}/pdf`, {
        responseType: 'blob'
      });

      // Criar link de download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ficha_contabilidade_${employeeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Erro ao baixar ficha de contabilidade:', error);
      throw error;
    }
  },

  /**
   * Gera ficha de contabilidade em Excel para download
   */
  async downloadExcel(employeeId: string, employeeName: string): Promise<void> {
    try {
      const response = await api.get(`/api/accounting-forms/${employeeId}/excel`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ficha_contabilidade_${employeeName.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Erro ao baixar ficha de contabilidade em Excel:', error);
      throw error;
    }
  },

  /**
   * Imprime ficha de contabilidade
   */
  async print(employeeId: string): Promise<void> {
    try {
      const response = await api.get(`/api/accounting-forms/${employeeId}/html`, {
        responseType: 'blob'
      });

      // Criar blob e abrir em nova aba para impressão
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      // Aguardar carregamento e imprimir
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      }
      
      // Cleanup
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Erro ao imprimir ficha de contabilidade:', error);
      throw error;
    }
  }
};

export default accountingFormService;

