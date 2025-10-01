// ===== TIPOS BÁSICOS =====

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type AccountType = 'CHECKING' | 'SAVINGS';
export type ContractType = 'EXPERIENCE' | 'INDEFINITE' | 'TEMPORARY';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'VACATION' | 'MATERNITY_LEAVE' | 'MEDICAL_CERTIFICATE' | 'TERMINATED' | 'SUSPENDED';
export type VacancyStatus = 'OPEN' | 'CLOSED' | 'CANCELLED' | 'PAUSED';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type OccurrenceType = 'MEDICAL_CERTIFICATE' | 'WARNING' | 'AWARD' | 'JUSTIFIED_ABSENCE';
export type OccurrenceStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type VacationType = 'REGULAR' | 'COLLECTIVE' | 'COMPENSATORY';
export type VacationStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type BenefitType = 'TRANSPORT' | 'MEAL' | 'HEALTH' | 'DENTAL' | 'LIFE_INSURANCE' | 'OTHER';
export type BenefitUnit = 'FIXED' | 'PERCENTAGE';
export type WorkStationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
export type EPIAssignmentStatus = 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';
export type LGPDConsentType = 'DATA_PROCESSING' | 'DATA_SHARING' | 'MARKETING';
export type ServiceOrderStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// ===== INTERFACES PRINCIPAIS =====

export interface Employee {
  id: number;
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  photoUrl?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankInfo: {
    bank: string;
    agency: string;
    account: string;
    accountType: AccountType;
  };
  jobInfo: {
    position: string;
    function: string;
    unit: string;
    admissionDate: string;
    probationEndDate: string;
    contractType: ContractType;
    salary: number;
    status: EmployeeStatus;
  };
  documents: {
    id: number;
    type: string;
    number: string;
    issueDate: string;
    issuingAuthority: string;
  }[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobVacancy {
  id: string;
  title: string;
  position: string;
  function: string; // NOVO CAMPO
  location: string;
  requirements: string[];
  workSchedule: string;
  salary: number;
  benefits: string[];
  deadline: string;
  status: VacancyStatus;
  applications: number;
  createdAt: string;
  updatedAt: string;
  requiresCnh?: boolean;
  cnhCategory?: string;
}

export interface Transfer {
  id: number;
  employeeId: number;
  employeeName: string;
  fromPosition: string;
  toPosition: string;
  fromUnit: string;
  toUnit: string;
  fromFunction: string;
  toFunction: string;
  reason: string;
  transferDate: string;
  approvedBy: string;
  status: TransferStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Occurrence {
  id: number;
  employeeId: number;
  employeeName: string;
  type: OccurrenceType;
  description: string;
  date: string;
  duration?: number;
  documentUrl?: string;
  status: OccurrenceStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vacation {
  id: number;
  employeeId: number;
  employeeName: string;
  type: VacationType;
  acquisitionPeriod: string;
  concessionPeriod: string;
  startDate: string;
  endDate: string;
  days: number;
  status: VacationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Benefit {
  id: number;
  name: string;
  type: BenefitType;
  description: string;
  value: number;
  unit: BenefitUnit;
  positions: string[];
  units: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobPosition {
  id: number;
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  mandatoryTrainings: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  benefits: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkStation {
  id: number;
  name: string;
  description: string;
  location: string;
  clientId: number;
  clientName: string;
  unit: string;
  contractId: number;
  requiredPositions: {
    position: string;
    quantity: number;
  }[];
  infrastructure: string[];
  status: WorkStationStatus;
  implantationDate: string;
  checklist: {
    infrastructure: boolean;
    hr: boolean;
    epi: boolean;
    training: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EPIAssignment {
  id: number;
  employeeId: number;
  employeeName: string;
  epiId: number;
  epiName: string;
  assignmentDate: string;
  returnDate?: string;
  status: EPIAssignmentStatus;
  digitalSignature?: string;
  photoUrl?: string;
  notes?: string;
  assignedBy: string;
  returnedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LGPDConsent {
  id: number;
  employeeId: number;
  employeeName: string;
  consentDate: string;
  consentType: LGPDConsentType;
  documentUrl: string;
  ipAddress: string;
  userAgent: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: number;
  employeeId: number;
  employeeName: string;
  function: string;
  clientId: number;
  clientName: string;
  workStationId: number;
  workStationName: string;
  startDate: string;
  endDate?: string;
  status: ServiceOrderStatus;
  digitalSignature?: string;
  documentUrl: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== INTERFACES DE FILTROS =====

export interface EmployeeFilters {
  status?: EmployeeStatus;
  unit?: string;
  position?: string;
  function?: string;
  searchTerm?: string;
  admissionDateFrom?: string;
  admissionDateTo?: string;
  probationExpiring?: boolean;
}

export interface JobVacancyFilters {
  status?: VacancyStatus;
  position?: string;
  location?: string;
  searchTerm?: string;
  deadlineFrom?: string;
  deadlineTo?: string;
}

export interface TransferFilters {
  employeeId?: number;
  status?: TransferStatus;
  dateFrom?: string;
  dateTo?: string;
  unit?: string;
}

export interface OccurrenceFilters {
  employeeId?: number;
  type?: OccurrenceType;
  status?: OccurrenceStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface VacationFilters {
  employeeId?: number;
  status?: VacationStatus;
  dateFrom?: string;
  dateTo?: string;
  type?: VacationType;
}

export interface BenefitFilters {
  type?: BenefitType;
  active?: boolean;
  position?: string;
  unit?: string;
}

export interface JobPositionFilters {
  active?: boolean;
  searchTerm?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface WorkStationFilters {
  status?: WorkStationStatus;
  unit?: string;
  clientId?: number;
  searchTerm?: string;
}

export interface EPIAssignmentFilters {
  employeeId?: number;
  status?: EPIAssignmentStatus;
  dateFrom?: string;
  dateTo?: string;
  epiId?: number;
}

export interface LGPDConsentFilters {
  employeeId?: number;
  active?: boolean;
  consentType?: LGPDConsentType;
  dateFrom?: string;
  dateTo?: string;
}

export interface ServiceOrderFilters {
  employeeId?: number;
  status?: ServiceOrderStatus;
  dateFrom?: string;
  dateTo?: string;
  clientId?: number;
  workStationId?: number;
}

// ===== INTERFACES DE ESTATÍSTICAS =====

export interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  onVacation: number;
  onSickLeave: number;
  probationExpiring: number;
  openVacancies: number;
  pendingTransfers: number;
  pendingOccurrences: number;
  pendingVacations: number;
  byStatus: Record<EmployeeStatus, number>;
  byUnit: Record<string, number>;
  byPosition: Record<string, number>;
}

// ===== INTERFACES DE FORMULÁRIOS =====

export interface CreateEmployeeData {
  name: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  photoUrl?: string;
  email: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankInfo: {
    bank: string;
    agency: string;
    account: string;
    accountType: AccountType;
  };
  jobInfo: {
    position: string;
    function: string;
    unit: string;
    admissionDate: string;
    probationEndDate: string;
    contractType: ContractType;
    salary: number;
  };
  documents: {
    type: string;
    number: string;
    issueDate: string;
    issuingAuthority: string;
  }[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface CreateJobVacancyData {
  title: string;
  position: string;
  location: string;
  requirements: string[];
  workSchedule: string;
  salary: number;
  benefits: string[];
  deadline: string;
  requiresCnh?: boolean;
  cnhCategory?: string;
}

export interface CreateTransferData {
  employeeId: number;
  fromPosition: string;
  toPosition: string;
  fromUnit: string;
  toUnit: string;
  fromFunction: string;
  toFunction: string;
  reason: string;
  transferDate: string;
  notes?: string;
}

export interface CreateOccurrenceData {
  employeeId: number;
  type: OccurrenceType;
  description: string;
  date: string;
  duration?: number;
  documentUrl?: string;
  notes?: string;
}

export interface CreateVacationData {
  employeeId: number;
  type: VacationType;
  acquisitionPeriod: string;
  concessionPeriod: string;
  startDate: string;
  endDate: string;
  days: number;
  notes?: string;
}

export interface CreateBenefitData {
  name: string;
  type: BenefitType;
  description: string;
  value: number;
  unit: BenefitUnit;
  positions: string[];
  units: string[];
}

export interface CreateJobPositionData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  mandatoryTrainings: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  benefits: string[];
}

export interface CreateWorkStationData {
  name: string;
  description: string;
  location: string;
  clientId: number;
  unit: string;
  contractId: number;
  requiredPositions: {
    position: string;
    quantity: number;
  }[];
  infrastructure: string[];
  implantationDate: string;
}

export interface CreateEPIAssignmentData {
  employeeId: number;
  epiId: number;
  assignmentDate: string;
  notes?: string;
  assignedBy: string;
}

export interface CreateLGPDConsentData {
  employeeId: number;
  consentType: LGPDConsentType;
  documentUrl: string;
  ipAddress: string;
  userAgent: string;
}

export interface CreateServiceOrderData {
  employeeId: number;
  function: string;
  clientId: number;
  workStationId: number;
  startDate: string;
  endDate?: string;
  notes?: string;
}

// ===== INTERFACES DE RESPOSTA =====

export interface EmployeeResponse {
  success: boolean;
  data?: Employee;
  message?: string;
  errors?: string[];
}

export interface EmployeesResponse {
  success: boolean;
  data?: Employee[];
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface HRStatsResponse {
  success: boolean;
  data?: HRStats;
  message?: string;
  errors?: string[];
} 