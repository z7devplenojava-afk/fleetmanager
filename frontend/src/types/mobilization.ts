export type MobilizationType = 'GENERAL_INSPECTION' | 'BUS_RAC02';
export type SyncStatus = 'PENDING' | 'SYNCED';

export interface TransportMobilization {
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    driverId?: string;
    driverName?: string;
    type: MobilizationType;
    occurredAt: string;
    kmReading?: number;
    odometerPhotoUrl?: string;
    jsonData?: string;
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
    type: MobilizationType;
    occurredAt?: string;
    kmReading?: number;
    jsonData?: string;
    damageData?: string;
    partsRequestData?: string;
    observations?: string;
    companyId?: string;
    syncStatus?: SyncStatus;
}
