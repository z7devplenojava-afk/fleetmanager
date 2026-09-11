export type MobilizationType = 'GENERAL_INSPECTION' | 'BUS_RAC02' | 'PRE_USO';
export type SyncStatus = 'PENDING' | 'SYNCED';

export interface ChecklistItemDetail {
    id: string;
    label: string;
    category: string;
    positivo: number | null;
    negativo: number | null;
    observacao: string;
}

export interface TransportMobilization {
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    driverId?: string;
    driverName?: string;
    clientId?: string;
    clientName?: string;
    workPostId?: string;
    workPostName?: string;
    type: MobilizationType;
    occurredAt: string;
    kmReading?: number;
    odometerPhotoUrl?: string;
    jsonData?: string;
    checklistData?: string;
    damageData?: string;
    partsRequestData?: string;
    observations?: string;
    photos?: string;
    companyId?: string;
    syncStatus: SyncStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateTransportMobilizationDTO {
    vehicleId: string;
    driverId?: string;
    clientId?: string;
    workPostId?: string;
    type: MobilizationType;
    occurredAt?: string;
    kmReading?: number;
    jsonData?: string;
    checklistData?: string;
    damageData?: string;
    partsRequestData?: string;
    observations?: string;
    descricaoAvaria?: string;
    companyId?: string;
    syncStatus?: SyncStatus;
}
