import api from '@/lib/axios';

export interface Receipt {
  id: string;
  employeeName: string;
  cpf: string;
  month: number;
  year: number;
  companyId?: string;
  companyName?: string;
  companyCnpj?: string;
  companySigla?: string;
  fileName: string;
  filePath: string;
  transferDate: string;
  createdAt?: string;
}

export const receiptService = {
  /**
   * Busca todos os comprovantes do colaborador logado
   * Backend já filtra por CPF para ROLE_COLABORADOR
   */
  async getAllReceipts(): Promise<Receipt[]> {
    try {
      // Verificar se é um colaborador e filtrar por CPF
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('👤 ReceiptService - Usuário logado:', user.name, 'Role:', user.role);
        
        // Se for COLABORADOR, filtrar por CPF (username é o CPF)
        if (user.role === 'COLABORADOR' && user.username) {
          console.log('🔒 ReceiptService - Filtrando por CPF:', user.username);
          const response = await api.get(`/receipts?cpf=${user.username}`);
          return response.data;
        }
      }
      
      const response = await api.get('/receipts');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comprovantes:', error);
      return [];
    }
  },

  /**
   * Busca comprovantes processados
   */
  async getProcessedFiles(): Promise<Receipt[]> {
    try {
      const response = await api.get('/receipts/processed-files');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comprovantes processados:', error);
      return [];
    }
  },

  /**
   * Baixa um comprovante
   */
  async downloadReceipt(receiptId: string, fileName?: string): Promise<void> {
    try {
      if (!receiptId) {
        throw new Error('ID do comprovante não informado.');
      }

      const response = await api.get(`/receipts/${encodeURIComponent(receiptId)}/download`, {
        responseType: 'blob'
      });

      // Criar link temporário para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `comprovante_${receiptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      throw error;
    }
  },

  /**
   * Visualiza um comprovante em nova aba
   */
  async viewReceipt(receiptId: string): Promise<void> {
    try {
      if (!receiptId) {
        throw new Error('ID do comprovante não informado.');
      }

      const response = await api.get(`/receipts/${encodeURIComponent(receiptId)}/view`, {
        responseType: 'blob'
      });

      // Abrir em nova aba
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (error) {
      console.error('Erro ao visualizar comprovante:', error);
      throw error;
    }
  },

  /**
   * Busca comprovante por ID
   */
  async getReceiptById(id: string): Promise<Receipt | null> {
    try {
      const response = await api.get(`/receipts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comprovante por ID:', error);
      return null;
    }
  },

  /**
   * Busca comprovantes por CPF
   */
  async getReceiptsByCpf(cpf: string): Promise<Receipt[]> {
    try {
      const response = await api.get(`/receipts/cpf/${cpf}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comprovantes por CPF:', error);
      return [];
    }
  },

  /**
   * Busca comprovantes por mês e ano
   */
  async getReceiptsByMonthYear(month: number, year: number): Promise<Receipt[]> {
    try {
      const response = await api.get(`/receipts/month/${month}/year/${year}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comprovantes por mês/ano:', error);
      return [];
    }
  },

  /**
   * Upload de comprovante
   */
  async uploadReceipt(file: File): Promise<Receipt[]> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/receipts/process-automatic', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Erro ao fazer upload de comprovante:', error);
      throw error;
    }
  },

  /**
   * Exclui um comprovante
   */
  async deleteReceipt(id: string): Promise<void> {
    try {
      await api.delete(`/receipts/${id}`);
    } catch (error) {
      console.error('Erro ao excluir comprovante:', error);
      throw error;
    }
  },

  /**
   * Exclui múltiplos comprovantes
   */
  async deleteMultipleReceipts(ids: string[]): Promise<{ deleted: number; failed: number; errors: string[] }> {
    try {
      const response = await api.post('/receipts/delete-multiple', { ids });
      return response.data;
    } catch (error) {
      console.error('Erro ao excluir múltiplos comprovantes:', error);
      throw error;
    }
  }
};

export default receiptService;

