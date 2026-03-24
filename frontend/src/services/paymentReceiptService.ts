import api from '../lib/axios';

export interface PaymentReceipt {
  id: string;
  employeeId?: string;
  employeeName: string;
  companyId?: string;
  companyName?: string;
  companyCnpj?: string;
  companySigla?: string;
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

export interface ReceiptProcessingResponse {
  receipts: PaymentReceipt[];
  summary: {
    totalPages: number;
    receiptsProcessed: number;
    receiptsSaved: number;
    pagesWithError: number;
    pagesSkipped: number;
    validationOk: boolean;
    validationMessage: string;
  };
  employeesByCount: Array<{
    employeeName: string;
    count: number;
  }>;
}

export interface CreatePaymentReceiptDTO {
  employeeId?: string;
  employeeName: string;
  companyId?: string;
  companyName?: string;
  companyCnpj?: string;
  companySigla?: string;
  month: number;
  year: number;
  fileName: string;
  filePath?: string;
  grossSalary?: number;
  netSalary?: number;
  notes?: string;
}

class PaymentReceiptService {
  // Buscar todos os comprovantes (com busca opcional)
  async getAllPaymentReceipts(searchTerm?: string): Promise<PaymentReceipt[]> {
    try {
      const params = searchTerm && searchTerm.trim().length >= 4 
        ? { search: searchTerm.trim() } 
        : {};
      const response = await api.get('/receipts', { params });
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
  async uploadPaymentReceipt(file: File, employeeName: string, month: number, year: number): Promise<ReceiptProcessingResponse> {
    try {
      console.log('📤 Iniciando upload real do comprovante:', file.name);
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('employeeName', employeeName);
      formData.append('month', month.toString());
      formData.append('year', year.toString());
      
      // Fazer upload via endpoint específico
      const response = await api.post('/receipts/process-automatic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para processamento
      });
      
      console.log('✅ Upload realizado com sucesso:', response.data);
      return response.data as ReceiptProcessingResponse;
    } catch (error) {
      console.error('❌ Erro ao fazer upload do comprovante:', error);
      throw error;
    }
  }

  // Excluir comprovante individual
  async deletePaymentReceipt(receiptId: string): Promise<void> {
    try {
      console.log('🗑️ Excluindo comprovante:', receiptId);
      const response = await api.delete(`/receipts/${receiptId}`);
      console.log('✅ Comprovante excluído com sucesso', response.status);
    } catch (error: any) {
      console.error('❌ Erro ao excluir comprovante:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  // Excluir múltiplos comprovantes
  async deleteMultiplePaymentReceipts(receiptIds: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    try {
      console.log('🗑️ Excluindo múltiplos comprovantes:', receiptIds.length);
      console.log('📋 IDs:', receiptIds);
      
      if (receiptIds.length === 0) {
        return { deleted: 0, failed: 0, errors: [] };
      }

      const response = await api.post('/receipts/delete-multiple', { ids: receiptIds });
      console.log('✅ Múltiplos comprovantes excluídos:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao excluir múltiplos comprovantes:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestData: { ids: receiptIds }
      });
      
      // Se o backend retornou uma resposta com dados, tentar extrair informações úteis
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.deleted !== undefined && errorData.failed !== undefined) {
          // O backend retornou um resultado parcial, retornar isso
          return errorData;
        }
      }
      
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

  // Download em lote de comprovantes (ZIP) - ALTA PERFORMANCE
  async downloadBatch(receiptIds: string[]): Promise<void> {
    try {
      console.log('📦 Baixando comprovantes em lote:', receiptIds.length);
      
      if (!receiptIds || receiptIds.length === 0) {
        throw new Error('Nenhum comprovante selecionado para download');
      }

      const response = await api.post('/receipts/download-batch', 
        { ids: receiptIds },
        {
          responseType: 'blob',
          timeout: 300000, // 5 minutos de timeout para downloads grandes
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`📥 Progresso do download: ${percentCompleted}%`);
            }
          }
        }
      );

      // Criar blob e fazer download
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('download', `comprovantes_${timestamp}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download em lote concluído com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao fazer download em lote:', error);
      throw error;
    }
  }
}

export default new PaymentReceiptService();
