export type VehicleType = 'BUS_ROAD' | 'BUS_LUXURY_TOURISM' | 'MINIBUS' | 'VAN' | 'BUS_URBAN' | 'CAR_UTILITY' | 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'PICKUP' | 'SUV' | 'OTHER';

export type BusType = 'RODOVIARIO' | 'LUXO_TURISMO' | 'DOUBLE_DECKER' | 'URBANO' | 'ARTICULADO' | 'BIARTICULADO' | 'MICRO_ONIBUS' | 'PADRON' | 'ELETRICO' | 'HIBRIDO' | 'ESCOLA' | 'FRETADO' | 'INTERMUNICIPAL';

export type FinancingStatus = 'OWNED' | 'FINANCED' | 'LEASED' | 'RENTED';

export type AggregatedPaymentType = 'DAILY' | 'MONTHLY' | 'PER_TRIP' | 'PERCENTAGE';

export interface VehicleFormData {
    placa: string;
    chassi: string;
    renavan: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    combustivel: 'GASOLINE' | 'ETHANOL' | 'FLEX' | 'DIESEL';
    quilometragem: number;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | 'RESERVED' | 'LEASED';
    capacidade: number;
    vehicleType: VehicleType | '';

    // Campos específicos de Ônibus
    busType: BusType | '';
    passengerCapacity: number;
    standingCapacity: number;
    totalDoors: number;
    hasAccessibility: boolean;
    hasAirConditioning: boolean;
    hasWiFi: boolean;
    hasCamera: boolean;
    hasCctv: boolean;
    busBodyType: string;
    chassisBrand: string;
    bodyBuilder: string;
    engineModel: string;
    enginePowerHp: number;
    transmissionType: string;
    axleCount: number;
    totalWeightKg: number;
    payloadKg: number;
    fuelTankCapacityLiters: number;
    routeNumber: string;
    routeName: string;

    // Allocation
    postoDeTrabalho: string;
    departamento: string;
    departmentId: string;
    empresa: string;
    empresaId: string;
    responsavel: string;

    // Maintenance & Docs
    dataManutencao: Date | null;
    proximaManutencao: Date | null;
    vencimentoSeguro: Date | null;
    vencimentoDocumentacao: Date | null;

    // Financial
    data_aquisicao: Date | null;
    valor_aquisicao: number;

    // Financiamento
    financingStatus: FinancingStatus | '';
    financingInstallmentValue: number;
    financingRemainingInstallments: number;
    financingPayoffBalance: number;
    financingBankOrInstitution: string;
    financingContractNumber: string;
    financingStartDate: string;
    financingEndDate: string;

    // Valor de mercado
    marketValue: number;

    // Seguros - Apólice Principal
    insurancePolicyNumber: string;
    insuranceCompany: string;
    insurancePremiumValue: number;
    insuranceCoverageType: string;

    // Seguros - Segunda Apólice
    insuranceSecondPolicyNumber: string;
    insuranceSecondCompany: string;
    insuranceSecondPremiumValue: number;
    insuranceSecondExpiryDate: string;

    // Cliente / Alocação
    clientName: string;
    clientId: string;
    allocationContractNumber: string;
    allocationStartDate: string;
    allocationEndDate: string;

    // Agregado
    isAggregated: boolean;
    aggregatedOwnerName: string;
    aggregatedOwnerCpfCnpj: string;
    aggregatedOwnerPhone: string;
    aggregatedOwnerEmail: string;
    aggregatedDailyRate: number;
    aggregatedMonthlyRate: number;
    aggregatedPaymentType: AggregatedPaymentType | '';
    aggregatedContractStartDate: string;
    aggregatedContractEndDate: string;
    aggregatedNotes: string;

    // Diferença financeira
    financialDifference: number;

    // Misc
    observacoes: string;
    fotos: FileList | null;
    existingPhotos?: string[];
    photosToDelete?: Set<string>;
}

export interface MaintenanceFormData {
    vehicleId: string;
    date: Date | null;
    maintenanceType: string;
    description: string;
    cost: number;
    provider: string;
    mileage: number;
    status: string;
    priority: string;
    notes: string;
    files: FileList | null;
    existingPhotos?: string[];
    removedPhotos?: string[];
    existingDocuments?: string[];
    removedDocuments?: string[];
}

export interface RefuelingFormData {
    vehicleId: string;
    driverId: string;
    date: string; // YYYY-MM-DD
    fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
    mileage: number;
    liters: number;
    pricePerLiter: number;
    totalValue: number;
    station: string; // Supplier name
    costCenter: string;
    notes: string;
    receiptFile: File | null;
}

export interface InfractionFormData {
    id?: string;
    vehicleId: string;
    driverId?: string;
    driverPhone?: string; // WhatsApp do motorista para notificação
    date: string; // YYYY-MM-DD
    dueDate: string; // YYYY-MM-DD
    type: string;
    points: number;
    location: string;
    amount: number;
    status: 'pendente' | 'paga' | 'vencida';
    notes: string;
    file: File | null;
}

export interface VehicleFormSectionProps {
    formData: VehicleFormData;
    handleInputChange: (field: keyof VehicleFormData, value: any) => void;
    isLoading?: boolean;
}
