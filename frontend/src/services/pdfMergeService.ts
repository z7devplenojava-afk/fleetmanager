import api from '@/lib/axios';

export interface PdfMergeResult {
  id?: string;
  fileName: string;
  filePath: string;
  employeeName: string;
  month: number;
  year: number;
  fileSize: number;
  contentType: string;
  createdAt: string;
  status: string;
  downloadUrl: string;
  viewUrl: string;
  totalPages?: number;
  description: string;
}

export interface MergePayslipReceiptRequest {
  payslipFile: File;
  receiptFile: File;
  employeeName: string;
  month: number;
  year: number;
}

export interface MergeMultipleDocumentsRequest {
  files: File[];
  employeeName: string;
  month: number;
  year: number;
}

class PdfMergeService {
  /**
   * Une um holerite e um comprovante em um único PDF
   */
  async mergePayslipAndReceipt(request: MergePayslipReceiptRequest): Promise<PdfMergeResult> {
    try {
      console.log('🔄 Iniciando merge de holerite e comprovante para:', request.employeeName);
      
      const formData = new FormData();
      formData.append('payslipFile', request.payslipFile);
      formData.append('receiptFile', request.receiptFile);
      formData.append('employeeName', request.employeeName);
      formData.append('month', request.month.toString());
      formData.append('year', request.year.toString());
      
      const response = await api.post('/api/pdf-merge/payslip-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos
      });
      
      console.log('✅ Merge concluído com sucesso:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao unir holerite e comprovante:', error);
      throw new Error('Falha ao unir documentos: ' + (error as any).response?.data?.message || error);
    }
  }

  /**
   * Une múltiplos documentos em um único PDF
   */
  async mergeMultipleDocuments(request: MergeMultipleDocumentsRequest): Promise<PdfMergeResult> {
    try {
      console.log('🔄 Iniciando merge de', request.files.length, 'documentos para:', request.employeeName);
      
      const formData = new FormData();
      request.files.forEach((file, index) => {
        formData.append('files', file);
      });
      formData.append('employeeName', request.employeeName);
      formData.append('month', request.month.toString());
      formData.append('year', request.year.toString());
      
      const response = await api.post('/api/pdf-merge/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 segundos
      });
      
      console.log('✅ Merge de múltiplos documentos concluído:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao unir múltiplos documentos:', error);
      throw new Error('Falha ao unir documentos: ' + (error as any).response?.data?.message || error);
    }
  }

  /**
   * Cria um PDF unificado em memória e retorna os bytes
   */
  async mergeToBytes(files: File[]): Promise<Blob> {
    try {
      console.log('🔄 Criando PDF unificado em memória com', files.length, 'arquivos');
      
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      
      const response = await api.post('/api/pdf-merge/merge-to-bytes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
        timeout: 60000, // 60 segundos
      });
      
      console.log('✅ PDF unificado criado em memória');
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao criar PDF unificado em memória:', error);
      throw new Error('Falha ao criar PDF unificado: ' + (error as any).response?.data?.message || error);
    }
  }

  /**
   * Download de arquivo unificado
   */
  async downloadFile(fileName: string): Promise<void> {
    try {
      console.log('📥 Iniciando download do arquivo:', fileName);
      
      const response = await api.get(`/api/pdf-merge/download/${fileName}`, {
        responseType: 'blob',
      });
      
      // Criar link de download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Download concluído:', fileName);
      
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error);
      throw new Error('Falha ao fazer download: ' + (error as any).response?.data?.message || error);
    }
  }

  /**
   * Visualizar arquivo unificado
   */
  getViewUrl(fileName: string): string {
    return `${api.defaults.baseURL}/api/pdf-merge/view/${fileName}`;
  }

  /**
   * Listar arquivos unificados disponíveis
   */
  async listMergedFiles(): Promise<any> {
    try {
      console.log('📋 Listando arquivos unificados disponíveis');
      
      const response = await api.get('/api/pdf-merge/list');
      
      console.log('✅ Lista de arquivos obtida:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('❌ Erro ao listar arquivos unificados:', error);
      throw new Error('Falha ao listar arquivos: ' + (error as any).response?.data?.message || error);
    }
  }

  /**
   * Validar arquivos antes do merge
   */
  validateFiles(files: File[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (files.length < 2) {
      errors.push('É necessário pelo menos 2 arquivos para unir');
    }
    
    files.forEach((file, index) => {
      if (file.size === 0) {
        errors.push(`Arquivo ${index + 1}: Arquivo está vazio`);
      }
      
      if (file.type !== 'application/pdf') {
        errors.push(`Arquivo ${index + 1}: Deve ser um PDF`);
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        errors.push(`Arquivo ${index + 1}: Muito grande (máximo 10MB)`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatar tamanho do arquivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const pdfMergeService = new PdfMergeService();
export default pdfMergeService;
