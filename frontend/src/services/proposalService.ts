import api from '@/lib/axios';

export interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Proposal {
  id: number;
  title: string;
  proposalNumber: string;
  client?: {
    id: number;
    name: string;
  };
  lead?: {
    id: number;
    name: string;
  };
  status: string;
  totalValue: number;
  validUntil: string;
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
  items?: ProposalItem[];
}

export interface CreateProposalRequest {
  title: string;
  clientId?: number;
  leadId?: number;
  totalValue: number;
  validUntil?: string;
  description?: string;
  assignedToId?: number;
  items?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateProposalRequest extends CreateProposalRequest {
  status?: string;
}

export interface ProposalStats {
  DRAFT: number;
  SENT: number;
  UNDER_REVIEW: number;
  APPROVED: number;
  REJECTED: number;
  EXPIRED: number;
  CONVERTED: number;
}

export interface ProposalValueStats {
  DRAFT: number;
  SENT: number;
  UNDER_REVIEW: number;
  APPROVED: number;
  REJECTED: number;
  EXPIRED: number;
  CONVERTED: number;
}

export const proposalService = {
  async getAllProposals(): Promise<Proposal[]> {
    const response = await api.get('/proposals/all');
    return response.data;
  },

  async getProposals(page: number = 0, size: number = 10): Promise<{ content: Proposal[]; totalElements: number }> {
    const response = await api.get(`/api/proposals?page=${page}&size=${size}`);
    return response.data;
  },

  async getProposalById(id: number): Promise<Proposal> {
    const response = await api.get(`/api/proposals/${id}`);
    return response.data;
  },

  async createProposal(proposalData: CreateProposalRequest): Promise<Proposal> {
    const response = await api.post('/proposals', proposalData);
    return response.data;
  },

  async updateProposal(id: number, proposalData: UpdateProposalRequest): Promise<Proposal> {
    const response = await api.put(`/api/proposals/${id}`, proposalData);
    return response.data;
  },

  async updateProposalStatus(id: number, status: string): Promise<Proposal> {
    const response = await api.patch(`/api/proposals/${id}/status`, { status });
    return response.data;
  },

  async deleteProposal(id: number): Promise<void> {
    await api.delete(`/api/proposals/${id}`);
  },

  async getProposalsByStatus(status: string): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/status/${status}`);
    return response.data;
  },

  async getProposalsByClient(clientId: number): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/client/${clientId}`);
    return response.data;
  },

  async getProposalsByLead(leadId: number): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/lead/${leadId}`);
    return response.data;
  },

  async getProposalsByAssignedTo(userId: number): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/assigned/${userId}`);
    return response.data;
  },

  async getProposalsByCreatedBy(userId: number): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/created/${userId}`);
    return response.data;
  },

  async getExpiredProposals(): Promise<Proposal[]> {
    const response = await api.get('/proposals/expired');
    return response.data;
  },

  async getProposalsExpiringSoon(days: number): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/expiring-soon/${days}`);
    return response.data;
  },

  async searchProposals(term: string): Promise<Proposal[]> {
    const response = await api.get(`/api/proposals/search?term=${encodeURIComponent(term)}`);
    return response.data;
  },

  async getStatsByStatus(): Promise<ProposalStats> {
    const response = await api.get('/proposals/stats/count-by-status');
    return response.data;
  },

  async getTotalValueByStatus(): Promise<ProposalStats> {
    const response = await api.get('/proposals/stats/total-value-by-status');
    return response.data;
  }
};