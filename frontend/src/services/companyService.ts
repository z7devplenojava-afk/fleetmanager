import api from '@/lib/axios';

export interface CompanyDefaultEPI {
  id?: string;
  epiName: string;
  quantity: number;
  caNumber?: string;
  validity?: string;
  observations?: string;
  orderIndex?: number;
}

export interface CreateCompanyRequest {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  enderecoRua?: string;
  enderecoNumero?: string;
  enderecoComplemento?: string;
  enderecoBairro?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  sigla?: string;
  description?: string;
  website?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  logoUrl?: string;
  defaultEpis?: CompanyDefaultEPI[];
}

export const companyService = {
  async createCompany(data: CreateCompanyRequest) {
    const response = await api.post('/api/companies', data);
    return response.data;
  },

  async getAllCompanies() {
    const response = await api.get('/api/companies');
    return response.data as Array<any>;
  },

  async getCompanyById(id: string) {
    const response = await api.get(`/api/companies/${id}`);
    return response.data;
  },

  async updateCompany(id: string, data: Partial<CreateCompanyRequest>) {
    const response = await api.put(`/api/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string) {
    await api.delete(`/api/companies/${id}`);
  },

  async toggleCompanyStatus(id: string, currentStatus?: string) {
    try {
      const response = await api.patch(`/api/companies/${id}/toggle-status`);
      return response.data;
    } catch (err: any) {
      // Fallback via PUT caso o endpoint PATCH não esteja carregado
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await api.put(`/api/companies/${id}`, { status: newStatus });
      return response.data;
    }
  },

  async getCompanyOverview(companyId?: string): Promise<CompanyOverviewDTO> {
    const url = companyId ? `/api/company/overview?companyId=${companyId}` : '/api/company/overview';
    const response = await api.get(url);
    return response.data;
  },
};

export interface CompanyOverviewDTO {
  companyId: string;
  companyName: string;
  cnpj: string;
  active: boolean;
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalClients: number;
  activeClients: number;
  totalWorkPosts: number;
  totalActiveContracts: number;
  monthlyContractValueTotal: number;
  openServiceOrders: number;
  inProgressServiceOrders: number;
  completedServiceOrdersMonth: number;
  totalStockItems: number;
  lowStockItems: number;
  stockTotalValue: number;
  revenueCurrentMonth: number;
  expensesCurrentMonth: number;
  netResultCurrentMonth: number;
  accountsPayablePending: number;
  accountsReceivablePending: number;
  headcountByDepartment: Record<string, number>;
  fleetStatusDistribution: Record<string, number>;
  revenueEvolutionLast6Months: Array<{ month: string; revenue: number; expenses: number }>;
}

export default companyService;