import api from '@/lib/axios';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankFile {
  id: string;
  fileName: string;
  fileType: 'PDF' | 'CSV' | 'EXCEL';
  bankName: string;
  accountNumber: string;
  period: string;
  status: 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  totalRecords: number;
  matchedRecords: number;
  unmatchedRecords: number;
  fileSize: string;
  description: string;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  bankFileId: string;
  transactionDate: string;
  description: string;
  amount: number;
  balance: number;
  status: 'PENDING' | 'MATCHED' | 'UNMATCHED' | 'MANUAL_REVIEW';
  referenceNumber: string;
  category: string;
  notes: string;
  systemTransactionId: string;
  systemTransactionType: string;
  reconciliationDate: string;
  reconciliationUser: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankFileStatistics {
  totalFiles: number;
  completedFiles: number;
  processingFiles: number;
  errorFiles: number;
}

export interface BankTransactionStatistics {
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
}

export interface CreateBankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountType?: string;
  balance?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  description?: string;
}

export interface UploadBankFileRequest {
  file: File;
  bankName: string;
  accountNumber: string;
  period: string;
  description?: string;
}

class BankReconciliationService {
  // ===== BANK ACCOUNTS =====
  
  async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const response = await api.get('/bank-reconciliation/accounts');
      return Array.isArray(response.data) ? response.data : this.getMockBankAccounts();
    } catch (error) {
      console.error('Erro ao buscar contas bancárias:', error);
      return this.getMockBankAccounts();
    }
  }
  
  async getBankAccountById(id: string): Promise<BankAccount> {
    const response = await api.get(`/bank-reconciliation/accounts/${id}`);
    return response.data;
  }
  
  async createBankAccount(data: CreateBankAccountRequest): Promise<BankAccount> {
    const response = await api.post('/bank-reconciliation/accounts', data);
    return response.data;
  }
  
  // ===== BANK FILES =====
  
  async getBankFiles(page?: number, size?: number): Promise<{ content: BankFile[], totalElements: number, totalPages: number }> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    
    const response = await api.get(`/bank-reconciliation/files?${params.toString()}`);
    return response.data;
  }
  
  async getAllBankFiles(): Promise<BankFile[]> {
    try {
      const response = await api.get('/bank-reconciliation/files/all');
      return Array.isArray(response.data) ? response.data : this.getMockBankFiles();
    } catch (error) {
      console.error('Erro ao buscar arquivos bancários:', error);
      return this.getMockBankFiles();
    }
  }
  
  async getBankFileById(id: string): Promise<BankFile> {
    const response = await api.get(`/bank-reconciliation/files/${id}`);
    return response.data;
  }
  
  async uploadBankFile(data: UploadBankFileRequest): Promise<BankFile> {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('bankName', data.bankName);
    formData.append('accountNumber', data.accountNumber);
    formData.append('period', data.period);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    const response = await api.post('/bank-reconciliation/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
  
  async deleteBankFile(id: string): Promise<void> {
    await api.delete(`/bank-reconciliation/files/${id}`);
  }
  
  // ===== BANK TRANSACTIONS =====
  
  async getTransactionsByFileId(fileId: string): Promise<BankTransaction[]> {
    const response = await api.get(`/bank-reconciliation/files/${fileId}/transactions`);
    return response.data;
  }
  
  async getTransactionsByStatus(status: string): Promise<BankTransaction[]> {
    const response = await api.get(`/bank-reconciliation/transactions/status/${status}`);
    return response.data;
  }
  
  // ===== STATISTICS =====
  
  async getFileStatistics(): Promise<BankFileStatistics> {
    const response = await api.get('/bank-reconciliation/statistics/files');
    return response.data;
  }
  
  async getTransactionStatistics(): Promise<BankTransactionStatistics> {
    const response = await api.get('/bank-reconciliation/statistics/transactions');
    return response.data;
  }
  
  // ===== RECONCILIATIONS =====
  
  async getReconciliations(filters?: {
    accountId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.accountId) params.append('accountId', filters.accountId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/bank-reconciliation/reconciliations?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar conciliações:', error);
      return [];
    }
  }
  
  async getReconciliationSummary(
    accountId?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (accountId) params.append('accountId', accountId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await api.get(`/bank-reconciliation/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar resumo de conciliação:', error);
      return {
        totalReconciliations: 0,
        completedReconciliations: 0,
        pendingReconciliations: 0,
        totalDifference: 0
      };
    }
  }
  
  // ===== REPORTS =====
  
  async generateFileReport(fileId: string, statusFilter?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== 'ALL') {
      params.append('status', statusFilter);
    }
    
    const response = await api.get(`/bank-reconciliation/reports/file/${fileId}?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
  
  async generateSummaryReport(startDate?: string, endDate?: string, bankName?: string): Promise<Blob> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (bankName) params.append('bankName', bankName);
    
    const response = await api.get(`/bank-reconciliation/reports/summary?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  }
  
  // ===== UTILITY METHODS =====
  
  downloadReport(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Métodos para retornar dados mockados temporariamente
  private getMockBankAccounts(): BankAccount[] {
    return [
      {
        id: 'ACC-001',
        bankName: 'Banco do Brasil',
        accountNumber: '12345-6',
        accountType: 'CORRENTE',
        balance: 50000.00,
        status: 'ACTIVE',
        description: 'Conta principal da empresa',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'ACC-002',
        bankName: 'Itaú',
        accountNumber: '98765-4',
        accountType: 'POUPANCA',
        balance: 25000.00,
        status: 'ACTIVE',
        description: 'Conta poupança para reservas',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  }

  private getMockBankFiles(): BankFile[] {
    return [
      {
        id: 'FILE-001',
        fileName: 'extrato_bb_jan2024.pdf',
        fileType: 'PDF',
        bankName: 'Banco do Brasil',
        accountNumber: '12345-6',
        period: 'Janeiro 2024',
        status: 'COMPLETED',
        totalRecords: 150,
        matchedRecords: 120,
        unmatchedRecords: 30,
        fileSize: '2.5 MB',
        description: 'Extrato mensal - Janeiro 2024',
        errorMessage: '',
        createdAt: '2024-01-31T00:00:00Z',
        updatedAt: '2024-01-31T00:00:00Z'
      },
      {
        id: 'FILE-002',
        fileName: 'extrato_itau_fev2024.csv',
        fileType: 'CSV',
        bankName: 'Itaú',
        accountNumber: '98765-4',
        period: 'Fevereiro 2024',
        status: 'PROCESSING',
        totalRecords: 200,
        matchedRecords: 0,
        unmatchedRecords: 0,
        fileSize: '1.8 MB',
        description: 'Extrato mensal - Fevereiro 2024',
        errorMessage: '',
        createdAt: '2024-02-28T00:00:00Z',
        updatedAt: '2024-02-28T00:00:00Z'
      }
    ];
  }
}

export const bankReconciliationService = new BankReconciliationService();