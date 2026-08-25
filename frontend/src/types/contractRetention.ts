export enum RetentionStatus {
  RETIDO = 'RETIDO',
  LIBERADO = 'LIBERADO',
  FATURADO = 'FATURADO',
  CANCELADO = 'CANCELADO'
}

export interface ContractRetention {
  id: string;
  companyId?: string;
  unitId?: string;
  unitName?: string;
  clientId?: string;
  clientName?: string;
  contractId?: string;
  contractNumber?: string;
  measurementId?: string;
  measurementNumber?: string;
  referenceMonth?: string;
  measuredValue: number;
  rmuDiscount: number;
  retentionRate: number;
  retentionValue: number;
  netInvoicedValue: number;
  status: RetentionStatus;
  expectedReleaseDate?: string;
  actualReleaseDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractRetentionDTO {
  unitId?: string;
  clientId?: string;
  contractId?: string;
  measurementId?: string;
  referenceMonth?: string;
  measuredValue: number;
  rmuDiscount?: number;
  retentionRate?: number;
  status?: RetentionStatus;
  expectedReleaseDate?: string;
  actualReleaseDate?: string;
  notes?: string;
}

export interface UpdateContractRetentionDTO extends Partial<CreateContractRetentionDTO> {}
