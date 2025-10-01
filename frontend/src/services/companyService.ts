import api from '@/lib/axios';
import { Company, CompanyFilters, CompanyStats, CompanyStatus } from '@/types/company';

export const companyService = {
  // Buscar todas as empresas
  async getAllCompanies(): Promise<Company[]> {
    const response = await api.get('/companies');
    return response.data;
  },

  // Buscar empresa por ID
  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Buscar empresa por CNPJ
  async getCompanyByCnpj(cnpj: string): Promise<Company> {
    const response = await api.get(`/companies/cnpj/${cnpj}`);
    return response.data;
  },

  // Criar nova empresa
  async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const response = await api.post('/companies', company);
    return response.data;
  },

  // Atualizar empresa
  async updateCompany(id: string, company: Partial<Company>): Promise<Company> {
    const response = await api.put(`/companies/${id}`, company);
    return response.data;
  },

  // Deletar empresa
  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },

  // Buscar empresas por status
  async getCompaniesByStatus(status: CompanyStatus): Promise<Company[]> {
    const response = await api.get(`/companies/status/${status}`);
    return response.data;
  },

  // Buscar empresas por cidade
  async getCompaniesByCity(city: string): Promise<Company[]> {
    const response = await api.get(`/companies/city/${city}`);
    return response.data;
  },

  // Buscar empresas por estado
  async getCompaniesByState(state: string): Promise<Company[]> {
    const response = await api.get(`/companies/state/${state}`);
    return response.data;
  },

  // Buscar empresas por setor
  async getCompaniesBySector(sector: string): Promise<Company[]> {
    const response = await api.get(`/companies/sector/${sector}`);
    return response.data;
  },

  // Buscar empresas por tipo
  async getCompaniesByType(type: string): Promise<Company[]> {
    const response = await api.get(`/companies/type/${type}`);
    return response.data;
  },

  // Buscar empresas por tamanho
  async getCompaniesBySize(size: string): Promise<Company[]> {
    const response = await api.get(`/companies/size/${size}`);
    return response.data;
  },

  // Buscar empresas por termo
  async searchCompanies(searchTerm: string): Promise<Company[]> {
    const response = await api.get(`/companies/search?searchTerm=${searchTerm}`);
    return response.data;
  },

  // Busca avançada
  async getCompaniesByAdvancedFilters(filters: CompanyFilters, page = 0, size = 20): Promise<{
    content: Company[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
  }> {
    const params = new URLSearchParams();
    
    if (filters.name) params.append('name', filters.name);
    if (filters.cnpj) params.append('cnpj', filters.cnpj);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.size) params.append('size', filters.size);
    
    params.append('page', page.toString());
    params.append('size', size.toString());

    const response = await api.get(`/companies/advanced-filters?${params.toString()}`);
    return response.data;
  },

  // Estatísticas
  async getActiveCompaniesCount(): Promise<number> {
    const response = await api.get('/companies/stats/active-count');
    return response.data;
  },

  async getCompaniesCountByStatus(status: CompanyStatus): Promise<number> {
    const response = await api.get(`/companies/stats/status-count/${status}`);
    return response.data;
  },

  async getCompaniesCountByState(state: string): Promise<number> {
    const response = await api.get(`/companies/stats/state-count/${state}`);
    return response.data;
  },

  async getCompaniesCountBySector(sector: string): Promise<number> {
    const response = await api.get(`/companies/stats/sector-count/${sector}`);
    return response.data;
  },

  async getCompaniesCountByType(type: string): Promise<number> {
    const response = await api.get(`/companies/stats/type-count/${type}`);
    return response.data;
  },

  async getCompaniesCountBySize(size: string): Promise<number> {
    const response = await api.get(`/companies/stats/size-count/${size}`);
    return response.data;
  },

  // Buscar estatísticas completas
  async getCompanyStats(): Promise<CompanyStats> {
    const [
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      pendingCompanies,
      suspendedCompanies
    ] = await Promise.all([
      this.getAllCompanies().then(companies => companies.length),
      this.getActiveCompaniesCount(),
      this.getCompaniesCountByStatus(CompanyStatus.INACTIVE),
      this.getCompaniesCountByStatus(CompanyStatus.PENDING),
      this.getCompaniesCountByStatus(CompanyStatus.SUSPENDED)
    ]);

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      pendingCompanies,
      suspendedCompanies,
      companiesByState: {}, // TODO: Implementar
      companiesBySector: {}, // TODO: Implementar
      companiesByType: {}, // TODO: Implementar
      companiesBySize: {} // TODO: Implementar
    };
  }
}; 