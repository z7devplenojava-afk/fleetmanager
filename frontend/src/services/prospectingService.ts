import api from '@/lib/axios';

export interface ProspectingLead {
  id: string;
  cnpj?: string;
  companyName?: string;
  tradeName?: string;
  cnae?: string;
  cnaeDescription?: string;
  activity?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  partnerNames?: string;
  purchasingContacts?: string;
  googlePlaceId?: string;
  googleRating?: number;
  googleReviews?: number;
  googleTypes?: string;
  source?: string;
  searchTerm?: string;
  status: string;
  qualificationScore?: number;
  qualificationNotes?: string;
  leadId?: string;
  opportunityId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProspectingSearchFilters {
  activity?: string;
  cnae?: string;
  cnaeDescription?: string;
  cnpj?: string;
  city?: string;
  description?: string;
  searchTerm?: string;
}

export interface ProspectingStats {
  total: number;
  found: number;
  enriched: number;
  qualified: number;
  sentToKanban: number;
  discarded: number;
}

class ProspectingService {
  async search(filters: ProspectingSearchFilters): Promise<ProspectingLead[]> {
    const { data } = await api.post('/api/prospecting/search', filters);
    return data;
  }

  async searchByCnpj(cnpj: string, searchTerm?: string): Promise<ProspectingLead[]> {
    const { data } = await api.post('/api/prospecting/search/cnpj', { cnpj, searchTerm });
    return data;
  }

  async findAll(): Promise<ProspectingLead[]> {
    const { data } = await api.get('/api/prospecting');
    return data;
  }

  async findById(id: string): Promise<ProspectingLead> {
    const { data } = await api.get(`/api/prospecting/${id}`);
    return data;
  }

  async findByFilters(
    city?: string,
    cnae?: string,
    activity?: string,
    status?: string
  ): Promise<ProspectingLead[]> {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (cnae) params.append('cnae', cnae);
    if (activity) params.append('activity', activity);
    if (status) params.append('status', status);
    const { data } = await api.get(`/api/prospecting/filters?${params.toString()}`);
    return data;
  }

  async searchLeads(term: string): Promise<ProspectingLead[]> {
    const { data } = await api.get(`/api/prospecting/search?term=${encodeURIComponent(term)}`);
    return data;
  }

  async getStats(): Promise<ProspectingStats> {
    const { data } = await api.get('/api/prospecting/stats');
    return data;
  }

  async enrich(id: string): Promise<ProspectingLead> {
    const { data } = await api.post(`/api/prospecting/${id}/enrich`);
    return data;
  }

  async qualify(id: string): Promise<ProspectingLead> {
    const { data } = await api.post(`/api/prospecting/${id}/qualify`);
    return data;
  }

  async sendToKanban(id: string): Promise<ProspectingLead> {
    const { data } = await api.post(`/api/prospecting/${id}/send-to-kanban`);
    return data;
  }

  async sendMultipleToKanban(ids: string[]): Promise<ProspectingLead[]> {
    const { data } = await api.post('/api/prospecting/send-selected-to-kanban', { ids });
    return data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/api/prospecting/${id}`);
  }

  // Helper: parse partner names JSON
  parsePartnerNames(json?: string): Array<{ name: string; role: string }> {
    if (!json) return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [{ name: json, role: '' }];
    }
  }

  // Helper: parse purchasing contacts JSON
  parsePurchasingContacts(json?: string): { name?: string; department?: string; phone?: string; email?: string } | null {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  // Helper: status label
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      FOUND: 'Encontrado',
      ENRICHED: 'Enriquecido',
      QUALIFIED: 'Qualificado',
      SENT_TO_KANBAN: 'Enviado ao Kanban',
      DISCARDED: 'Descartado',
    };
    return labels[status] || status;
  }

  // Helper: status color class
  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      FOUND: 'bg-blue-500',
      ENRICHED: 'bg-yellow-500',
      QUALIFIED: 'bg-green-500',
      SENT_TO_KANBAN: 'bg-purple-500',
      DISCARDED: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  }
}

export default new ProspectingService();
