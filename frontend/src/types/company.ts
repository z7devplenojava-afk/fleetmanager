export interface Company {
  id: string;
  name: string;
  tradeName?: string;
  cnpj?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  description?: string;
  status: CompanyStatus;
  type?: string;
  sector?: string;
  size?: string;
  annualRevenue?: number;
  employeeCount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export const CompanyStatusLabels: Record<CompanyStatus, string> = {
  [CompanyStatus.ACTIVE]: 'Ativa',
  [CompanyStatus.INACTIVE]: 'Inativa',
  [CompanyStatus.PENDING]: 'Pendente',
  [CompanyStatus.SUSPENDED]: 'Suspensa'
};

export const CompanyStatusColors: Record<CompanyStatus, string> = {
  [CompanyStatus.ACTIVE]: 'bg-green-100 text-green-800',
  [CompanyStatus.INACTIVE]: 'bg-gray-100 text-gray-800',
  [CompanyStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [CompanyStatus.SUSPENDED]: 'bg-red-100 text-red-800'
};

export interface CompanyFilters {
  name?: string;
  cnpj?: string;
  city?: string;
  state?: string;
  sector?: string;
  status?: CompanyStatus;
  type?: string;
  size?: string;
}

export interface CompanyStats {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  pendingCompanies: number;
  suspendedCompanies: number;
  companiesByState: Record<string, number>;
  companiesBySector: Record<string, number>;
  companiesByType: Record<string, number>;
  companiesBySize: Record<string, number>;
} 