import api from '@/lib/axios';

export interface FinancialTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  unit?: { id: string, name: string };
  supplierName?: string; // Adicionado campo para o nome do fornecedor
}

export type InvoiceStatus = 'PENDENTE' | 'PAGA' | 'CANCELADA' | 'PENDENTE_ERRO';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  contractNumber?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  pendingInvoices: number;
  overdueInvoices: number;
  accountsReceivable: number;
  accountsPayable: number;
  cashFlow: {
    currentMonth: number;
    previousMonth: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  };
}

export interface CreateTransactionRequest {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  reference?: string;
  notes?: string;
  unitId: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
}

export interface CreateInvoiceRequest {
  invoiceNumber?: string;
  description: string;
  clientId: string;
  contractId?: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  notes?: string;
  unitId: string;
  status?: string;
}

export interface FinancialFilters {
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const financialService = {
  // ===== TRANSAÇÕES =====
  
  // Buscar todas as transações
  async getTransactions(filters: FinancialFilters = {}): Promise<FinancialTransaction[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const queryString = params.toString();
    const url = queryString
      ? `/financial/transactions?${queryString}`
      : `/financial/transactions`;
    const response = await api.get(url);
    return response.data;
  },

  // Criar nova transação
  async createTransaction(data: CreateTransactionRequest): Promise<FinancialTransaction> {
    const response = await api.post('/api/financial/transactions', data);
    return response.data;
  },

  // Atualizar transação
  async updateTransaction(id: string, unitId: string, data: any): Promise<FinancialTransaction> {
    const response = await api.put(`/api/financial/transactions/unit/${unitId}/transaction/${id}`, data);
    return response.data;
  },

  // Excluir transação
  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/api/financial/transactions/${id}`);
  },

  // ===== FATURAS =====

  // Buscar todas as faturas
  async getInvoices(filters: FinancialFilters = {}): Promise<Invoice[]> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await api.get(`/api/invoices?${params.toString()}`);
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content;
    }
    return [];
  },

  // Criar nova fatura
  async createInvoice(data: CreateInvoiceRequest): Promise<Invoice> {
    const response = await api.post('/api/invoices', data);
    return response.data;
  },

  // Marcar fatura como paga
  async markInvoiceAsPaid(id: string, paymentDate?: string): Promise<Invoice> {
    const response = await api.put(`/api/invoices/${id}/paid`, { paymentDate });
    return response.data;
  },

  // Editar fatura
  async updateInvoice(id: string, data: Partial<CreateInvoiceRequest>): Promise<Invoice> {
    const response = await api.put(`/api/invoices/${id}`, data);
    return response.data;
  },

  // Excluir fatura
  async deleteInvoice(id: string): Promise<void> {
    await api.delete(`/api/invoices/${id}`);
  },

  // ===== RELATÓRIOS =====

  // Gerar relatório financeiro
  async getFinancialReport(startDate?: string, endDate?: string): Promise<FinancialReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/api/invoices/reports/summary?${params.toString()}`);
    return response.data;
  },

  // Relatório por centro de custo
  async getReportByCostCenter(params: { centro?: string; startDate?: string; endDate?: string }) {
    const qs = new URLSearchParams();
    if (params.centro) qs.append('centro', params.centro);
    if (params.startDate) qs.append('startDate', params.startDate);
    if (params.endDate) qs.append('endDate', params.endDate);
    const { data } = await api.get(`/api/invoices/reports/by-cost-center?${qs.toString()}`);
    return data as { total: number; items: any[] };
  },

  // Marcar fatura como paga
  async marcarFaturaComoPaga(id: string, paymentDate?: string) {
    const url = `/invoices/${id}/mark-as-paid` + (paymentDate ? `?paymentDate=${paymentDate}` : '');
    return api.patch(url);
  },
}; 