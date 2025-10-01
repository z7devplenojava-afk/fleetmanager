export type CertificationType = 'SAFETY' | 'TECHNICAL' | 'MANAGEMENT' | 'COMPLIANCE' | 'OTHER';
export type CertificationStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';

export interface Certification {
  id: number;
  name: string;
  description?: string;
  type: CertificationType;
  status: CertificationStatus;
  employeeId: number;
  employeeName: string;
  employeeCpf: string;
  issuingOrganization: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  renewalDate?: string;
  cost: number;
  location: string;
  notes?: string;
  attachments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CertificationStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  cancelled: number;
  expiringSoon: number;
  totalCost: number;
  byType: Record<CertificationType, number>;
  byOrganization: Record<string, number>;
}

export interface CertificationFilters {
  type?: CertificationType;
  status?: CertificationStatus;
  employeeId?: number;
  issuingOrganization?: string;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  minCost?: number;
  maxCost?: number;
}

export interface CertificationRenewalData {
  renewalDate: string;
  cost: number;
  notes?: string;
} 