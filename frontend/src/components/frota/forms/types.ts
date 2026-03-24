export interface VehicleFormData {
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    combustivel: 'GASOLINE' | 'ETHANOL' | 'FLEX' | 'DIESEL';
    quilometragem: number;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    capacidade: number;

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

    // Misc
    observacoes: string;
    fotos: FileList | null;
    existingPhotos?: string[]; // For edit mode
    photosToDelete?: Set<string>; // For edit mode
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
