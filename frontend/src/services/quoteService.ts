import api from '@/lib/axios';

export interface Quote {
  id: number;
  title: string;
  description?: string;
  clientId: number;
  clientName?: string;
  leadId?: number;
  leadName?: string;
  assignedToId?: number;
  assignedToName?: string;
  createdById: number;
  createdByName?: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  totalValue: number;
  validUntil: string;
  terms?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteRequest {
  title: string;
  description?: string;
  clientId: string | number; // Aceita string (UUID) ou number para compatibilidade
  leadId?: string | number; // Aceita string (UUID) ou number para compatibilidade
  assignedToId?: number;
  totalValue: number;
  validUntil: string;
  estimatedDuration?: number;
  paymentTerms?: string;
  notes?: string;
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  status?: Quote['status'];
}

export const quoteService = {
  // Buscar todos os orçamentos
  async getAllQuotes(): Promise<Quote[]> {
    const response = await api.get('/api/quotes/all');
    return response.data;
  },

  // Buscar orçamento por ID
  async getQuoteById(id: number | string): Promise<Quote> {
    const response = await api.get(`/api/quotes/${id}`);
    return response.data;
  },

  // Criar novo orçamento
  async createQuote(quoteData: CreateQuoteRequest): Promise<Quote> {
    const response = await api.post('/api/quotes', quoteData);
    return response.data;
  },

  // Atualizar orçamento
  async updateQuote(id: number | string, quoteData: UpdateQuoteRequest): Promise<Quote> {
    const response = await api.put(`/api/quotes/${id}`, quoteData);
    return response.data;
  },

  // Excluir orçamento
  async deleteQuote(id: number | string): Promise<void> {
    await api.delete(`/api/quotes/${id}`);
  },

  // Buscar orçamentos por cliente
  async getQuotesByClient(clientId: number): Promise<Quote[]> {
    const response = await api.get(`/quotes/client/${clientId}`);
    return response.data;
  },

  // Buscar orçamentos por lead
  async getQuotesByLead(leadId: number): Promise<Quote[]> {
    const response = await api.get(`/quotes/lead/${leadId}`);
    return response.data;
  },

  // Buscar orçamentos por responsável
  async getQuotesByAssignedTo(userId: number): Promise<Quote[]> {
    const response = await api.get(`/quotes/assigned/${userId}`);
    return response.data;
  },

  // Buscar orçamentos por criador
  async getQuotesByCreatedBy(userId: number): Promise<Quote[]> {
    const response = await api.get(`/quotes/created/${userId}`);
    return response.data;
  },

  // Buscar orçamentos por status
  async getQuotesByStatus(status: Quote['status']): Promise<Quote[]> {
    const response = await api.get(`/quotes/status/${status}`);
    return response.data;
  },

  // Buscar orçamentos expirados
  async getExpiredQuotes(): Promise<Quote[]> {
    const response = await api.get('/quotes/expired');
    return response.data;
  },

  // Buscar orçamentos expirando em breve
  async getQuotesExpiringSoon(days: number): Promise<Quote[]> {
    const response = await api.get(`/quotes/expiring-soon/${days}`);
    return response.data;
  },

  // Buscar orçamentos
  async searchQuotes(term: string): Promise<Quote[]> {
    const response = await api.get(`/quotes/search?term=${encodeURIComponent(term)}`);
    return response.data;
  },

  // Alterar status do orçamento
  async updateQuoteStatus(id: number, status: Quote['status']): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/status`, { status });
    return response.data;
  }
}; 