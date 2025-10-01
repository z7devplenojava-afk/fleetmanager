// Tipos para Boletim de Medição

export interface MeasurementBulletin {
  id: string;
  companyName: string; // "PROMOVER VIGILÂNCIA PATRIMONIAL LTDA"
  periodStart: string; // Data de início do período
  periodEnd: string; // Data de fim do período
  contractNumber: string; // "CTC-CBM 148/295/2025-BSS"
  contractStart: string; // Data de início do contrato
  contractEnd: string; // Data de fim do contrato
  nfNumber: string; // "NF 27917"
  elaboratedBy: string; // Responsável pela elaboração
  measuredBy: string; // Responsável pela medição
  validatedBy: string; // "Otto Mendes - ADM"
  checkedBy: string; // "Benedito"
  status: MeasurementStatus;
  items: MeasurementItem[];
  calculationMemory?: CalculationMemory;
  subtotal: number;
  client?: { id: number; name: string };
  contract?: { id: string; contractNumber: string; description: string };
  unit?: { id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementItem {
  id: string;
  itemNumber: number; // 2, 3, etc.
  code: string; // "CTC-CBM 148/295/2025-BSS"
  description: string; // "Posto de vigilância 12 horas noturno..."
  unit: string; // "VB/MÊS"
  quantity: number; // 1
  unitPrice: number; // Preço unitário
  totalValue: number; // quantity * unitPrice
  costCenterId?: string;
  costCenterName?: string;
  bulletinId: string;
}

export interface CalculationMemory {
  id: string;
  details: string; // Texto com cálculos ou observações
  evidencePath?: string; // Caminho para arquivos de evidência
  monthReference?: string; // Mês de referência (ex: "Mar-25")
  calculationItems?: string[]; // Array de itens de cálculo
  bulletinId: string;
}

export enum MeasurementStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  CANCELLED = 'CANCELLED'
}

export interface MeasurementFilters {
  periodStart?: string;
  periodEnd?: string;
  contractNumber?: string;
  status?: MeasurementStatus;
  searchTerm?: string;
}

// DTOs para criação e atualização
export interface CreateMeasurementBulletinDTO {
  periodStart: string;
  periodEnd: string;
  contractNumber: string;
  contractStart: string;
  contractEnd: string;
  nfNumber: string;
  elaboratedBy: string;
  measuredBy: string;
  status?: MeasurementStatus;
  clientId?: string;
  contractId?: string;
  unitId?: string;
  notes?: string;
  items: CreateMeasurementItemDTO[];
  calculationMemory?: {
    details: string;
    monthReference: string;
    evidencePath: string;
    calculationItems: string[];
  };
}

export interface CreateMeasurementItemDTO {
  itemNumber: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  costCenterId?: string;
  costCenterName?: string;
}

export interface UpdateMeasurementBulletinDTO extends Partial<CreateMeasurementBulletinDTO> {
  validatedBy?: string;
  checkedBy?: string;
  status?: MeasurementStatus;
}

// Tipos para validação
export interface ValidationData {
  validatedBy: string;
  checkedBy: string;
  notes?: string;
}

// Tipos para relatórios
export interface MeasurementReport {
  totalBulletins: number;
  totalValue: number;
  pendingValue: number;
  validatedValue: number;
  byStatus: Record<MeasurementStatus, number>;
  byContract: Array<{
    contractNumber: string;
    totalValue: number;
    count: number;
  }>;
  byClient: Array<{
    clientName: string;
    totalValue: number;
    count: number;
  }>;
} 