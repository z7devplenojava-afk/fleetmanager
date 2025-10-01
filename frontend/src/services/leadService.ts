import api from '@/lib/axios';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  source: string;
  status: string;
  description: string;
  assignedTo?: {
    id: number;
    name: string;
  };
  createdBy: {
    id: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  description?: string;
  assignedToId?: number;
}

export interface UpdateLeadRequest extends CreateLeadRequest {
  status?: string;
}

export interface LeadStats {
  NEW: number;
  CONTACTED: number;
  QUALIFIED: number;
  PROPOSAL_SENT: number;
  NEGOTIATION: number;
  WON: number;
  LOST: number;
}

export interface LeadSourceStats {
  WEBSITE: number;
  REFERRAL: number;
  SOCIAL_MEDIA: number;
  COLD_CALL: number;
  EVENT: number;
  OTHER: number;
}

class LeadService {
  async getAllLeads(): Promise<Lead[]> {
    const response = await api.get('/leads/all');
    return response.data;
  }

  async getLeads(page: number = 0, size: number = 10): Promise<{ content: Lead[]; totalElements: number }> {
    const response = await api.get(`/api/leads?page=${page}&size=${size}`);
    return response.data;
  }

  async getLeadById(id: number): Promise<Lead> {
    const response = await api.get(`/api/leads/${id}`);
    return response.data;
  }

  async createLead(leadData: CreateLeadRequest): Promise<Lead> {
    const response = await api.post('/leads', leadData);
    return response.data;
  }

  async updateLead(id: number, leadData: UpdateLeadRequest): Promise<Lead> {
    const response = await api.put(`/api/leads/${id}`, leadData);
    return response.data;
  }

  async updateLeadStatus(id: number, status: string): Promise<Lead> {
    const response = await api.patch(`/api/leads/${id}/status`, { status });
    return response.data;
  }

  async deleteLead(id: number): Promise<void> {
    await api.delete(`/api/leads/${id}`);
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    const response = await api.get(`/api/leads/status/${status}`);
    return response.data;
  }

  async getLeadsBySource(source: string): Promise<Lead[]> {
    const response = await api.get(`/api/leads/source/${source}`);
    return response.data;
  }

  async getLeadsByAssignedTo(userId: number): Promise<Lead[]> {
    const response = await api.get(`/api/leads/assigned/${userId}`);
    return response.data;
  }

  async getLeadsByCompany(company: string): Promise<Lead[]> {
    const response = await api.get(`/api/leads/company/${encodeURIComponent(company)}`);
    return response.data;
  }

  async getRecentLeads(days: number): Promise<Lead[]> {
    const response = await api.get(`/api/leads/recent/${days}`);
    return response.data;
  }

  async searchLeads(term: string): Promise<Lead[]> {
    const response = await api.get(`/api/leads/search?term=${encodeURIComponent(term)}`);
    return response.data;
  }

  async getStatsByStatus(): Promise<LeadStats> {
    const response = await api.get('/leads/stats/count-by-status');
    return response.data;
  }

  async getStatsBySource(): Promise<LeadSourceStats> {
    const response = await api.get('/leads/stats/count-by-source');
    return response.data;
  }
}

export default new LeadService(); 