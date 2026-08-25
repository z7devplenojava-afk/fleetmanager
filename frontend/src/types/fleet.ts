export type VehicleType = 'BUS_ROAD' | 'BUS_LUXURY_TOURISM' | 'MINIBUS' | 'VAN' | 'BUS_URBAN' | 'CAR_UTILITY' | 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'PICKUP' | 'SUV' | 'OTHER';

export type BusType = 'RODOVIARIO' | 'LUXO_TURISMO' | 'DOUBLE_DECKER' | 'URBANO' | 'ARTICULADO' | 'BIARTICULADO' | 'MICRO_ONIBUS' | 'PADRON' | 'ELETRICO' | 'HIBRIDO' | 'ESCOLA' | 'FRETADO' | 'INTERMUNICIPAL';

export type FinancingStatus = 'OWNED' | 'FINANCED' | 'LEASED' | 'RENTED';

export type AggregatedPaymentType = 'DAILY' | 'MONTHLY' | 'PER_TRIP' | 'PERCENTAGE';

export interface Vehicle {
  id: string;
  plate: string;
  fleetNumber?: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  currentMileage: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RESERVED' | 'LEASED';
  capacity: number;
  vehicleType?: VehicleType;

  // Documentais
  chassisNumber?: string;
  renavan?: string;

  // Ônibus
  busType?: BusType;
  passengerCapacity?: number;
  standingCapacity?: number;
  totalDoors?: number;
  hasAccessibility?: boolean;
  hasAirConditioning?: boolean;
  hasWiFi?: boolean;
  hasCamera?: boolean;
  hasCctv?: boolean;
  busBodyType?: string;
  chassisBrand?: string;
  bodyBuilder?: string;
  engineModel?: string;
  enginePowerHp?: number;
  transmissionType?: string;
  axleCount?: number;
  totalWeightKg?: number;
  payloadKg?: number;
  fuelTankCapacityLiters?: number;
  routeNumber?: string;
  routeName?: string;
  assignedDriver?: string;
  department?: string;
  location?: string;
  acquisitionDate?: string;
  acquisitionValue?: number | string;
  averageConsumption?: number;
  averageCostPerKm?: number;
  notes?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiryDate?: string;
  documentationExpiryDate?: string;
  responsibleEmployeeId?: string;
  workPostId?: string;
  companyId?: string;
  departmentId?: string;
  photos?: FileList | null;

  // Financiamento
  financingStatus?: FinancingStatus;
  financingInstallmentValue?: number;
  financingRemainingInstallments?: number;
  financingPayoffBalance?: number;
  financingBankOrInstitution?: string;
  financingContractNumber?: string;
  financingStartDate?: string;
  financingEndDate?: string;

  // Valor de mercado
  marketValue?: number;

  // Seguros
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  insurancePremiumValue?: number;
  insuranceCoverageType?: string;
  insuranceSecondPolicyNumber?: string;
  insuranceSecondCompany?: string;
  insuranceSecondPremiumValue?: number;
  insuranceSecondExpiryDate?: string;

  // Cliente / Alocação
  clientName?: string;
  clientId?: string;
  allocationContractNumber?: string;
  allocationStartDate?: string;
  allocationEndDate?: string;

  // Agregado
  isAggregated?: boolean;
  aggregatedOwnerName?: string;
  aggregatedOwnerCpfCnpj?: string;
  aggregatedOwnerPhone?: string;
  aggregatedOwnerEmail?: string;
  aggregatedDailyRate?: number;
  aggregatedMonthlyRate?: number;
  aggregatedPaymentType?: AggregatedPaymentType;
  aggregatedContractStartDate?: string;
  aggregatedContractEndDate?: string;
  aggregatedNotes?: string;

  // Diferença financeira
  financialDifference?: number;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  quantity: number;
  cost: number;
  mileage: number;
  initialMileage: number;
  finalMileage: number;
  station: string;
  driver?: {
    id: string;
    name: string;
    document: string;
    status: string;
  };
  notes?: string;
  costCenter?: string;
  createdAt: string;
}

export interface Fine {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId?: string;
  driverName?: string;
  driverLicenseNumber?: string;
  driverPhone?: string; // WhatsApp do motorista para notificação
  date: string;
  description: string;
  amount: number;
  location: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  dueDate?: string;
  paymentDate?: string;
  points?: number; // Pontos na CNH
  createdAt: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  type: 'PREVENTIVE' | 'CORRECTIVE' | 'INSPECTION';
  description: string;
  cost: number;
  mileage: number;
  workshop: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  completionDate?: string;
  notes?: string;
  createdAt: string;
}

export interface FleetStats {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalFuelCost: number;
  totalFines: number;
  totalMaintenanceCost: number;
  averageMileage: number;
}

export type MaintenanceType = 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE' | 'IMPROVEMENT' | 'OTHER';

export interface VehicleMaintenance {
  id: string; // UUID
  vehicleId: string; // UUID
  vehiclePlate: string;
  date: string; // LocalDate
  maintenanceType: MaintenanceType;
  description: string;
  cost?: number;
  provider?: string;
  mileage?: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
  createdAt: string; // LocalDateTime
  updatedAt: string; // LocalDateTime
}

export type CreateVehicleMaintenanceDTO = Omit<VehicleMaintenance, 'id' | 'vehiclePlate' | 'createdAt' | 'updatedAt'>;

export interface KmControl {
  id: string;
  date: string;
  supervisor: string;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  initialKm: number; // permitir 0 quando sem leitura
  finalKm: number;   // permitir 0 quando sem leitura
  totalKm: number;
  value: number;
  shiftStart?: string; // opcional
  shiftEnd?: string; // opcional
  workPost: string;
  problemDescription?: string;
  workPostPerformance?: string;
  observations?: string; // Campo para observações gerais (problemas, manutenções, etc.)
  initialKmJustification?: string; // Justificativa quando não há KM inicial
  finalKmJustification?: string; // Justificativa quando não há KM final
  vehicleId?: string;
  vehiclePlate?: string;
  dashboardPhotoUrl?: string; // URL da foto do painel
  dashboardPhotoDescription?: string; // Descrição da foto do painel
  fuelQuantity?: string; // Campo para quantidade de combustível no formato "X/Y"
  createdAt: string;
  updatedAt: string;
} 