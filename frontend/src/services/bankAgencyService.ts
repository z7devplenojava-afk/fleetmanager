import api from '@/lib/axios';

export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  cnpj: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  website: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Agency {
  id: string;
  bankId: string;
  bankName: string;
  bankCode: string;
  code: string;
  name: string;
  shortName: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  manager: string;
  managerPhone: string;
  managerEmail: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBankRequest {
  code: string;
  name: string;
  shortName?: string;
  cnpj?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CreateAgencyRequest {
  bankId: string;
  code: string;
  name: string;
  shortName?: string;
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  manager?: string;
  managerPhone?: string;
  managerEmail?: string;
  notes?: string;
}

export interface BankStatistics {
  totalBanks: number;
  activeBanks: number;
  inactiveBanks: number;
  suspendedBanks: number;
  states: string[];
}

export interface AgencyStatistics {
  totalAgencies: number;
  activeAgencies: number;
  inactiveAgencies: number;
  suspendedAgencies: number;
  maintenanceAgencies: number;
  cities: string[];
  states: string[];
}

class BankAgencyService {
  // ===== BANKS =====
  
  async getBanks(page?: number, size?: number): Promise<{ content: Bank[], totalElements: number, totalPages: number }> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    
    const response = await api.get(`/banks?${params.toString()}`);
    return response.data;
  }
  
  async getAllBanks(): Promise<Bank[]> {
    const response = await api.get('/banks/all');
    return response.data;
  }
  
  async getBankById(id: string): Promise<Bank> {
    const response = await api.get(`/banks/${id}`);
    return response.data;
  }
  
  async getBankByCode(code: string): Promise<Bank> {
    const response = await api.get(`/banks/code/${code}`);
    return response.data;
  }
  
  async createBank(data: CreateBankRequest): Promise<Bank> {
    const response = await api.post('/banks', data);
    return response.data;
  }
  
  async updateBank(id: string, data: CreateBankRequest): Promise<Bank> {
    const response = await api.put(`/banks/${id}`, data);
    return response.data;
  }
  
  async deleteBank(id: string): Promise<void> {
    await api.delete(`/banks/${id}`);
  }
  
  // ===== BANK SEARCH =====
  
  async searchBanksByName(name: string): Promise<Bank[]> {
    const response = await api.get(`/banks/search/name?name=${encodeURIComponent(name)}`);
    return response.data;
  }
  
  async searchBanksByCode(code: string): Promise<Bank[]> {
    const response = await api.get(`/banks/search/code?code=${encodeURIComponent(code)}`);
    return response.data;
  }
  
  async getBanksByStatus(status: string): Promise<Bank[]> {
    const response = await api.get(`/banks/status/${status}`);
    return response.data;
  }
  
  async getBanksByState(state: string): Promise<Bank[]> {
    const response = await api.get(`/banks/state/${state}`);
    return response.data;
  }
  
  // ===== AGENCIES =====
  
  async getAgencies(page?: number, size?: number): Promise<{ content: Agency[], totalElements: number, totalPages: number }> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (size !== undefined) params.append('size', size.toString());
    
    const response = await api.get(`/agencies?${params.toString()}`);
    return response.data;
  }
  
  async getAllAgencies(): Promise<Agency[]> {
    const response = await api.get('/agencies/all');
    return response.data;
  }
  
  async getAgencyById(id: string): Promise<Agency> {
    const response = await api.get(`/agencies/${id}`);
    return response.data;
  }
  
  async getAgenciesByBankId(bankId: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/bank/${bankId}`);
    return response.data;
  }
  
  async createAgency(data: CreateAgencyRequest): Promise<Agency> {
    const response = await api.post('/agencies', data);
    return response.data;
  }
  
  async updateAgency(id: string, data: CreateAgencyRequest): Promise<Agency> {
    const response = await api.put(`/agencies/${id}`, data);
    return response.data;
  }
  
  async deleteAgency(id: string): Promise<void> {
    await api.delete(`/agencies/${id}`);
  }
  
  // ===== AGENCY SEARCH =====
  
  async searchAgenciesByName(name: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/search/name?name=${encodeURIComponent(name)}`);
    return response.data;
  }
  
  async searchAgenciesByCode(code: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/search/code?code=${encodeURIComponent(code)}`);
    return response.data;
  }
  
  async searchAgenciesByBankName(bankName: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/search/bank?bankName=${encodeURIComponent(bankName)}`);
    return response.data;
  }
  
  async searchAgenciesByCity(city: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/search/city?city=${encodeURIComponent(city)}`);
    return response.data;
  }
  
  async getAgenciesByStatus(status: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/status/${status}`);
    return response.data;
  }
  
  async getAgenciesByState(state: string): Promise<Agency[]> {
    const response = await api.get(`/agencies/state/${state}`);
    return response.data;
  }
  
  // ===== STATISTICS =====
  
  async getBankStatistics(): Promise<BankStatistics> {
    const response = await api.get('/banks/statistics');
    return response.data;
  }
  
  async getAgencyStatistics(): Promise<AgencyStatistics> {
    const response = await api.get('/agencies/statistics');
    return response.data;
  }
}

export const bankAgencyService = new BankAgencyService();
