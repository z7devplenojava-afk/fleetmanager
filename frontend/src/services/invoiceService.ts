import api from '@/lib/axios';

export interface InvoiceSearchResult {
  invoiceNumber: string;
  measurementNumber?: string;
  description: string;
  amount: number;
  clientName: string;
  dueDate: string;
  status: string;
}

export const invoiceService = {
  /**
   * Buscar números de fatura para autocomplete
   */
  async searchInvoiceNumbers(term: string): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/search/invoice-number', {
        params: { term }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar números de fatura:', error);
      return [];
    }
  },

  /**
   * Buscar números de medição para autocomplete
   */
  async searchMeasurementNumbers(term: string): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/search/measurement-number', {
        params: { term }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar números de medição:', error);
      return [];
    }
  },

  /**
   * Buscar categorias para autocomplete
   */
  async searchCategories(term: string): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/search/categories', {
        params: { term }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      return [];
    }
  },

  /**
   * Buscar formas de pagamento para autocomplete
   */
  async searchPaymentMethods(term: string): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/search/payment-methods', {
        params: { term }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento:', error);
      return [];
    }
  },

  /**
   * Buscar fatura por número específico
   */
  async getInvoiceByNumber(invoiceNumber: string): Promise<InvoiceSearchResult | null> {
    try {
      const response = await api.get('/api/accounts-receivable/all');
      const invoices = response.data;
      
      const invoice = invoices.find((inv: any) => 
        inv.invoiceNumber?.toLowerCase() === invoiceNumber.toLowerCase()
      );
      
      if (invoice) {
        return {
          invoiceNumber: invoice.invoiceNumber,
          measurementNumber: invoice.measurementNumber,
          description: invoice.description,
          amount: invoice.amount,
          clientName: invoice.client?.name || 'Cliente não informado',
          dueDate: invoice.dueDate,
          status: invoice.status
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao buscar fatura por número:', error);
      return null;
    }
  }
};
