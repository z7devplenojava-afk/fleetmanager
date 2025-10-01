import api from '../lib/axios';

export interface PaymentReceipt {
  id: string;
  employeeId?: string;
  employeeName: string;
  month: number;
  year: number;
  receiptNumber?: string;
  paymentDate?: string;
  grossSalary?: number;
  netSalary?: number;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  // Campos bancários
  debitedAgency?: string;
  debitedAccount?: string;
  debitedName?: string;
  creditedAgency?: string;
  creditedAccount?: string;
  creditedName?: string;
  controlNumber?: string;
  authenticationCode?: string;
  transferDate?: string;
  transferTime?: string;
  bankName?: string;
  transactionType?: string;
  statementIdentification?: string;
}

export interface CreatePaymentReceiptDTO {
  employeeId?: string;
  employeeName: string;
  month: number;
  year: number;
  fileName: string;
  filePath?: string;
  grossSalary?: number;
  netSalary?: number;
  notes?: string;
}

class PaymentReceiptService {
  // Buscar todos os comprovantes
  async getAllPaymentReceipts(): Promise<PaymentReceipt[]> {
    try {
      const response = await api.get('/receipts');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error);
      throw error;
    }
  }

  // Buscar comprovantes por ano e mês
  async getPaymentReceiptsByYearAndMonth(year: number, month: number): Promise<PaymentReceipt[]> {
    try {
      const response = await api.get(`/receipts/year/${year}/month/${month}`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar comprovantes por ano/mês:', error);
      throw error;
    }
  }

  // Buscar todos os anos únicos
  async getDistinctYears(): Promise<number[]> {
    try {
      const response = await api.get('/receipts/years');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar anos:', error);
      throw error;
    }
  }

  // Buscar todos os meses únicos para um ano
  async getDistinctMonthsByYear(year: number): Promise<number[]> {
    try {
      const response = await api.get(`/receipts/years/${year}/months`);
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar meses:', error);
      throw error;
    }
  }

  // Buscar arquivos processados
  async getProcessedFiles(): Promise<PaymentReceipt[]> {
    try {
      const response = await api.get('/receipts/processed-files');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar arquivos processados:', error);
      throw error;
    }
  }

  // Criar novo comprovante
  async createPaymentReceipt(data: CreatePaymentReceiptDTO): Promise<PaymentReceipt> {
    try {
      const response = await api.post('/receipts', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar comprovante:', error);
      throw error;
    }
  }

  // Download de comprovante
  async downloadReceipt(receiptId: string): Promise<Blob> {
    try {
      const response = await api.get(`/receipts/${receiptId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao fazer download do comprovante:', error);
      throw error;
    }
  }

  // Contar total de comprovantes
  async getTotalCount(): Promise<number> {
    try {
      const response = await api.get('/receipts/count');
      return response.data || 0;
    } catch (error) {
      console.error('Erro ao contar comprovantes:', error);
      throw error;
    }
  }

  // Contar comprovantes processados hoje
  async getProcessedTodayCount(): Promise<number> {
    try {
      const response = await api.get('/receipts/count/processed-today');
      return response.data || 0;
    } catch (error) {
      console.error('Erro ao contar comprovantes processados hoje:', error);
      throw error;
    }
  }

  // Upload de arquivo real
  async uploadPaymentReceipt(file: File, employeeName: string, month: number, year: number): Promise<PaymentReceipt> {
    try {
      console.log('📤 Iniciando upload real do comprovante:', file.name);
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employeeName', employeeName);
      formData.append('month', month.toString());
      formData.append('year', year.toString());
      
      // Fazer upload via endpoint específico
      const response = await api.post('/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para processamento
      });
      
      console.log('✅ Upload realizado com sucesso:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do comprovante:', error);
      throw error;
    }
  }

  // Excluir comprovante individual
  async deletePaymentReceipt(receiptId: string): Promise<void> {
    try {
      console.log('🗑️ Excluindo comprovante:', receiptId);
      await api.delete(`/receipts/${receiptId}`);
      console.log('✅ Comprovante excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro ao excluir comprovante:', error);
      throw error;
    }
  }

  // Excluir múltiplos comprovantes
  async deleteMultiplePaymentReceipts(receiptIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    try {
      console.log('🗑️ Excluindo múltiplos comprovantes:', receiptIds.length);
      
      if (receiptIds.length === 0) {
        return { deleted: 0, failed: 0, errors: [] };
      }

      const response = await api.post('/receipts/delete-multiple', { ids: receiptIds });
      console.log('✅ Múltiplos comprovantes excluídos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao excluir múltiplos comprovantes:', error);
      throw error;
    }
  }

  // Baixar comprovante individual
  async downloadPaymentReceipt(receiptId: string, fileName: string): Promise<void> {
    try {
      console.log('⬇️ Baixando comprovante:', receiptId);
      const response = await api.get(`/receipts/${receiptId}/download`, {
        responseType: 'blob', // Importante para downloads de arquivos
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName); // Usa o nome do arquivo fornecido
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      console.log('✅ Comprovante baixado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao baixar comprovante:', error);
      throw error;
    }
  }

  // Obter PDF do comprovante para visualização
  async getPaymentReceiptPdf(receiptId: string): Promise<Blob> {
    try {
      console.log('🔍 Carregando PDF do comprovante para visualização:', receiptId);
      const response = await api.get(`/receipts/${receiptId}/view`, {
        responseType: 'blob', // Importante para arquivos binários
      });
      console.log('✅ PDF do comprovante carregado com sucesso');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao carregar PDF do comprovante:', error);
      throw error;
    }
  }
}

export default new PaymentReceiptService();
