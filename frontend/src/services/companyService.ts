import api from '@/lib/axios';
import { compressImageIfNeeded } from '@/lib/imageUtils';

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
  iconUrl?: string;
  bannerUrls?: string[];
  defaultEpis?: CompanyDefaultEPI[];
}

async function uploadCompanyAsset(
  file: File,
  endpoint: string,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  fallbackFilename: string,
  label: string
): Promise<{ url: string; filename: string; originalName: string }> {
  let fileToUpload = file;
  try {
    fileToUpload = await compressImageIfNeeded(file, maxWidth, maxHeight, quality);
  } catch (e) {
    console.warn(`Falha na compressão client-side de ${label}, usando arquivo original:`, e);
    fileToUpload = file;
  }
  const formData = new FormData();
  formData.append('file', fileToUpload, fileToUpload.name || file.name || fallbackFilename);
  const response = await api.post(endpoint, formData, {
    headers: {
      'Content-Type': undefined
    }
  });
  return response.data;
}

export const companyService = {
  async createCompany(data: CreateCompanyRequest) {
    const response = await api.post('/api/companies', data);
    return response.data;
  },

  async getMyCompany() {
    try {
      const response = await api.get('/api/companies/my-company');
      return response.data;
    } catch {
      return null;
    }
  },

  async getAllCompanies() {
    const response = await api.get('/api/companies');
    return response.data as Array<any>;
  },

  async getCompanies() {
    return this.getAllCompanies();
  },

  async getCompanyById(id: string) {
    try {
      const response = await api.get(`/api/companies/${id}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.response?.status === 409) {
        return null;
      }
      throw err;
    }
  },

  async updateCompany(id: string, data: Partial<CreateCompanyRequest>) {
    const response = await api.put(`/api/companies/${id}`, data);
    return response.data;
  },

  async deleteCompany(id: string) {
    await api.delete(`/api/companies/${id}`);
  },

  async toggleCompanyStatus(id: string, _currentStatus?: string) {
    const response = await api.patch(`/api/companies/${id}/toggle-status`);
    return response.data;
  },

  async getCompanyOverview(companyId?: string): Promise<CompanyOverviewDTO> {
    const url = companyId ? `/api/company/overview?companyId=${companyId}` : '/api/company/overview';
    const response = await api.get(url);
    return response.data;
  },

  async uploadLogo(file: File): Promise<{ url: string; filename: string; originalName: string }> {
    return uploadCompanyAsset(file, '/api/uploads/companies/logo', 1200, 1200, 0.85, 'logo.png', 'logomarca');
  },

  async uploadIcon(file: File): Promise<{ url: string; filename: string; originalName: string }> {
    return uploadCompanyAsset(file, '/api/uploads/companies/logo', 512, 512, 0.9, 'icon.png', 'ícone');
  },

  async uploadBanner(file: File): Promise<{ url: string; filename: string; originalName: string }> {
    return uploadCompanyAsset(file, '/api/uploads/companies/banner-upload', 1920, 1080, 0.85, 'banner.jpg', 'banner');
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