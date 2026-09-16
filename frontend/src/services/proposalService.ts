import api from '@/lib/axios';

export interface ProposalItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProposalFleetItem {
  id?: string;
  name: string;
  vehicleCategory?: string;
  quantity: number;
  franchiseKm?: number;
  dailyRate?: number;
  excessKmRate?: number;
  operatingDays?: number;
  dieselPrice?: number;
  totalDaily?: number;
  totalMonthly?: number;
}

export interface Proposal {
  id: number | string; // Pode ser UUID (string) ou number
  title: string;
  proposalNumber: string;
  client?: {
    id: number | string;
    name: string;
  };
  lead?: {
    id: number | string;
    name: string;
  };
  clientName?: string;
  leadName?: string;
  status: string;
  totalValue: number;
  validUntil: string;
  description: string;
  assignedTo?: {
    id: number | string;
    name: string;
  };
  assignedToName?: string;
  createdBy?: {
    id: number | string;
    name: string;
  };
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: ProposalItem[];
  fleetItems?: ProposalFleetItem[];
  costSimulation?: any;
}

export interface CreateProposalRequest {
  title: string;
  clientId?: number | string; // Pode ser UUID (string) ou number
  leadId?: number | string; // Pode ser UUID (string) ou number
  totalValue: number;
  validUntil?: string;
  description?: string;
  assignedToId?: number | string; // Pode ser UUID (string) ou number
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
    const response = await api.get('/api/proposals/all');
    return response.data;
  },

  async getProposals(page: number = 0, size: number = 10): Promise<{ content: Proposal[]; totalElements: number }> {
    const response = await api.get(`/api/proposals?page=${page}&size=${size}`);
    return response.data;
  },

  async getProposalById(id: number | string): Promise<Proposal> {
    const response = await api.get(`/api/proposals/${id}`);
    return response.data;
  },

  async createProposal(proposalData: CreateProposalRequest): Promise<Proposal> {
    const response = await api.post('/api/proposals', proposalData);
    return response.data;
  },

  async updateProposal(id: number | string, proposalData: UpdateProposalRequest): Promise<Proposal> {
    const response = await api.put(`/api/proposals/${id}`, proposalData);
    return response.data;
  },

  async updateProposalStatus(id: number | string, status: string): Promise<Proposal> {
    const response = await api.patch(`/api/proposals/${id}/status`, { status });
    return response.data;
  },

  async deleteProposal(id: number | string): Promise<void> {
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