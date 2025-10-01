export interface JobCandidate {
  id: string;
  jobVacancyId: string;
  jobVacancyTitle: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string;
  address?: string;
  city?: string;
  state?: string;
  educationLevel?: string;
  experienceYears?: number;
  currentPosition?: string;
  currentCompany?: string;
  expectedSalary?: number;
  availability?: string;
  curriculumFileName?: string;
  curriculumFilePath?: string;
  curriculumFileSize?: number;
  status: CandidateStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // NOVOS CAMPOS
  requiresCnh?: boolean;
  cnhCategory?: string | null;
  curriculumUrl?: string | null;
}

export enum CandidateStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INTERVIEWED = 'INTERVIEWED',
  HIRED = 'HIRED',
  WITHDRAWN = 'WITHDRAWN'
}

export const CandidateStatusLabels: Record<CandidateStatus, string> = {
  [CandidateStatus.PENDING]: 'Pendente',
  [CandidateStatus.APPROVED]: 'Aprovado',
  [CandidateStatus.REJECTED]: 'Reprovado',
  [CandidateStatus.INTERVIEWED]: 'Entrevistado',
  [CandidateStatus.HIRED]: 'Contratado',
  [CandidateStatus.WITHDRAWN]: 'Desistiu'
};

export const CandidateStatusColors: Record<CandidateStatus, string> = {
  [CandidateStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [CandidateStatus.APPROVED]: 'bg-green-100 text-green-800',
  [CandidateStatus.REJECTED]: 'bg-red-100 text-red-800',
  [CandidateStatus.INTERVIEWED]: 'bg-blue-100 text-blue-800',
  [CandidateStatus.HIRED]: 'bg-purple-100 text-purple-800',
  [CandidateStatus.WITHDRAWN]: 'bg-gray-100 text-gray-800'
};

export interface CandidateFormData {
  jobVacancyId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  address: string;
  city: string;
  state: string;
  educationLevel: string;
  experienceYears: number;
  currentPosition: string;
  currentCompany: string;
  expectedSalary: number;
  availability: string;
  curriculum?: File;
  // NOVOS CAMPOS
  requiresCnh?: boolean;
  cnhCategory?: string | null;
}

export interface CandidateStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  interviewed: number;
  hired: number;
}

export interface CandidateStatusUpdate {
  status: CandidateStatus;
  notes?: string;
} 