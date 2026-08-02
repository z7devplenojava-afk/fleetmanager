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
  // IDs diretos do DTO
  clientId?: string;
  clientName?: string;
  contractId?: string;
  contractDescription?: string;
  unitId?: string;
  unitName?: string;
  // Objetos completos (para compatibilidade)
  client?: { id: number | string; name: string };
  contract?: { id: string; contractNumber: string; description: string };
  unit?: { id: string; name: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
  measurementType?: MeasurementType;
}

export enum MeasurementCategory {
  LEASE = 'LEASE',
  EXCESS_KM = 'EXCESS_KM',
  FUEL = 'FUEL',
  DRIVER_COST = 'DRIVER_COST',
  RETENTION = 'RETENTION',
  EXTRA_TRIP = 'EXTRA_TRIP',
  OTHER = 'OTHER'
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
  vehiclePlate?: string;
  tripCount?: number;
  isExtraTrip?: boolean;
  baseValue?: number;
  workingDays?: number;
  category?: MeasurementCategory;
  initialKm?: number;
  finalKm?: number;
  franchiseKm?: number;
  disregardedKm?: number;
  diaria?: number; // Diária (valor por dia)
  kmConsiderado?: number; // KM final - KM inicial
  kmExcedido?: number; // KM considerado - franquia - desconsiderado
  valorKmExcedido?: number; // KM excedido x preço unitário
  tripDate?: string; // Data da viagem extra
  route?: string; // Trajeto da viagem extra
  vehicleType?: string; // Tipo de veículo da viagem extra
}

export interface CalculationMemory {
  // ...
  // ...
}

export enum MeasurementStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  CANCELLED = 'CANCELLED'
}

export enum MeasurementType {
  GLOBAL = 'GLOBAL',
  NFE = 'NFE',
  CTE = 'CTE'
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
  measurementType?: MeasurementType;
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
  vehiclePlate?: string;
  tripCount?: number;
  isExtraTrip?: boolean;
  baseValue?: number;
  workingDays?: number;
  category?: MeasurementCategory;
  initialKm?: number;
  finalKm?: number;
  franchiseKm?: number;
  disregardedKm?: number;
  diaria?: number;
  kmConsiderado?: number;
  kmExcedido?: number;
  valorKmExcedido?: number;
  tripDate?: string;
  route?: string;
  vehicleType?: string;
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