import api from '@/lib/axios';

export type RentalInvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'PARTIAL';

export interface RentalInvoiceItem {
  id?: string;
  vehicleId?: string;
  plate: string;
  model?: string;
  description?: string;
  amount: number;
}

export interface RentalInvoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  clientCnpj?: string;
  clientIe?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZipCode?: string;
  contractId?: string;
  contractNumber?: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  receiptDate?: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  status: RentalInvoiceStatus;
  paymentMethod?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  notes?: string;
  nfseNumber?: string;
  nfseStatus?: string;
  nfseIssueDate?: string;
  nfsePdfUrl?: string;
  receivableId?: string;
  items: RentalInvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RentalInvoiceInput {
  number?: string;
  clientId: string;
  clientName?: string;
  clientCnpj?: string;
  clientIe?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZipCode?: string;
  contractId?: string | null;
  contractNumber?: string;
  issueDate: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  receiptDate?: string;
  discount?: number;
  status?: RentalInvoiceStatus;
  paymentMethod?: string;
  bankName?: string;
  bankAgency?: string;
  bankAccount?: string;
  notes?: string;
  items: RentalInvoiceItem[];
}

export interface RentalInvoiceFilters {
  clientId?: string;
  contractId?: string;
  status?: string;
  search?: string;
}

export const rentalInvoiceService = {
  async list(filters: RentalInvoiceFilters = {}): Promise<RentalInvoice[]> {
    const params: Record<string, string> = {};
    if (filters.clientId) params.clientId = filters.clientId;
    if (filters.contractId) params.contractId = filters.contractId;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    const response = await api.get('/api/rental-invoices', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getById(id: string): Promise<RentalInvoice> {
    const response = await api.get(`/api/rental-invoices/${id}`);
    return response.data;
  },

  async nextNumber(): Promise<string> {
    const response = await api.get('/api/rental-invoices/next-number');
    return response.data?.number ?? '1';
  },

  async create(data: RentalInvoiceInput): Promise<RentalInvoice> {
    const response = await api.post('/api/rental-invoices', data);
    return response.data;
  },

  async update(id: string, data: RentalInvoiceInput): Promise<RentalInvoice> {
    const response = await api.put(`/api/rental-invoices/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, status: RentalInvoiceStatus): Promise<RentalInvoice> {
    const response = await api.patch(`/api/rental-invoices/${id}/status`, { status });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/api/rental-invoices/${id}`);
  },

  async downloadNfse(id: string): Promise<void> {
    const response = await api.get(`/api/rental-invoices/${id}/nfse`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  },
};
