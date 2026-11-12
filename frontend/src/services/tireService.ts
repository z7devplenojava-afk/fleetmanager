import api from '@/lib/axios';

export type TireLineType = 'URBANA' | 'METROPOLITANA' | 'RODOVIARIA';

export interface Tire {
    id: string;
    serialNumber: string; // Número de Série (Fabricante) / Código Interno
    fireNumber?: string; // Número de Fogo / ID Interno
    brand: string;
    model: string;
    size: string;
    status: 'AVAILABLE' | 'IN_USE' | 'RECAP' | 'SCRAPPED';
    currentMileage: number; // KM Total Acumulado
    currentLifeMileage?: number; // KM rodado na vida atual
    recapCount: number;
    lineType?: TireLineType | string;
    vehicleId?: string;
    vehiclePlate?: string;
    vehicleFleetNumber?: string;
    vehicleCurrentMileage?: number;
    vehicleModel?: string;
    vehicleRouteName?: string;
    axleNumber?: number;
    positionIndex?: number;
    dot?: string;
    initialTreadDepth?: number;
    currentTreadDepth?: number;
    acquisitionCost?: number;
    totalRepairCost?: number;
    cpk?: number;
    installKm?: number;
    installDate?: string;
    locationNotes?: string;
    recapVendor?: string;
    lastRecapDate?: string;
    scrapReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TireMovement {
    id: string;
    tireId: string;
    vehicleId?: string;
    type: 'PURCHASE' | 'INSTALLATION' | 'REMOVAL' | 'ROTATION' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP';
    position?: string;
    positionCode?: string;
    axleNumber?: number;
    positionIndex?: number;
    mileage: number;
    treadDepthMm?: number;
    kmDrivenCycle?: number;
    recapCountSnapshot?: number;
    authorizedByUserId?: string;
    authorizedByName?: string;
    notes?: string;
    movementDate: string;
    tireSerialNumber?: string;
    tireFireNumber?: string;
    tireBrand?: string;
    tireModel?: string;
    tireSize?: string;
    tireRecapCount?: number;
    tireCurrentMileage?: number;
    tireCurrentLifeMileage?: number;
    tireCurrentTreadDepth?: number;
    vehiclePlate?: string;
    vehicleFleetNumber?: string;
    vehicleCurrentMileage?: number;
}

export interface TireLifecycleConfig {
    id?: string;
    companyId?: string;
    firstLifeMinKm: number;
    firstLifeMaxKm: number;
    secondLifeMinKm: number;
    secondLifeMaxKm: number;
    thirdLifeMinKm: number;
    thirdLifeMaxKm: number;
    maxRecapCount: number;
    minTreadDepthTwi: number;
    alertTreadDepthMm: number;
    dotMaxAgeYears: number;
    urbanCalibrationFactor: number;
    metropolitanCalibrationFactor: number;
    roadCalibrationFactor: number;
    updatedAt?: string;
}

export interface TireFrontAxleException {
    id: string;
    companyId?: string;
    tireId: string;
    vehicleId: string;
    vehiclePlate?: string;
    vehicleFleetNumber?: string;
    axleNumber: number;
    positionCode?: string;
    tireFireNumber?: string;
    tireSerialNumber?: string;
    recapCount: number;
    vehicleKmAtMount?: number;
    authorizedByUserId: string;
    authorizedByName: string;
    authorizedByRole?: string;
    riskAcknowledged: boolean;
    notes?: string;
    emailSent: boolean;
    messageSent: boolean;
    active: boolean;
    approvedAt: string;
    clearedAt?: string;
}

export interface TireMountPayload {
    tireId: string;
    vehicleId: string;
    axleNumber: number;
    positionIndex: number;
    positionCode?: string;
    currentVehicleKm?: number;
    treadDepthMm?: number;
    lineType?: string;
    notes?: string;
    approverUsernameOrEmail?: string;
    approverPassword?: string;
    riskTermAccepted?: boolean;
}

export interface TireDismountPayload {
    tireId: string;
    currentVehicleKm?: number;
    treadDepthMm?: number;
    removalReason: 'ESTOQUE' | 'ENVIAR_REFORMA' | 'DESCARTE_SUCATA' | 'FURO_AVARIA';
    notes?: string;
}

export interface TireRecapActionPayload {
    recapVendor?: string;
    recapCost?: number;
    treadDepthMm?: number;
    mileage?: number;
    scrapReason?: string;
    locationNotes?: string;
    notes?: string;
}

class TireService {
    async findAll(): Promise<Tire[]> {
        const response = await api.get('/api/tires');
        return response.data;
    }

    async findAvailable(): Promise<Tire[]> {
        const response = await api.get('/api/tires/available');
        return response.data;
    }

    async findById(id: string): Promise<Tire> {
        const response = await api.get(`/api/tires/${id}`);
        return response.data;
    }

    async create(tire: Partial<Tire>): Promise<Tire> {
        const response = await api.post('/api/tires', tire);
        return response.data;
    }

    async update(id: string, tire: Partial<Tire>): Promise<Tire> {
        const response = await api.put(`/api/tires/${id}`, tire);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/tires/${id}`);
    }

    async mountTire(payload: TireMountPayload): Promise<Tire> {
        const response = await api.post('/api/tires/mount', payload);
        return response.data;
    }

    async dismountTire(payload: TireDismountPayload): Promise<Tire> {
        const response = await api.post('/api/tires/dismount', payload);
        return response.data;
    }

    async sendToRecap(id: string, payload?: TireRecapActionPayload): Promise<Tire> {
        const response = await api.post(`/api/tires/${id}/recap-send`, payload || {});
        return response.data;
    }

    async returnFromRecap(id: string, payload?: TireRecapActionPayload): Promise<Tire> {
        const response = await api.post(`/api/tires/${id}/recap-return`, payload || {});
        return response.data;
    }

    async scrapTire(id: string, payload?: TireRecapActionPayload): Promise<Tire> {
        const response = await api.post(`/api/tires/${id}/scrap`, payload || {});
        return response.data;
    }

    async getVehicleChassis(vehicleId: string): Promise<any> {
        const response = await api.get(`/api/tires/chassis/${vehicleId}`);
        return response.data;
    }

    async registerMovement(movement: Partial<TireMovement>): Promise<TireMovement> {
        const response = await api.post('/api/tires/movements', movement);
        return response.data;
    }

    async getAllMovements(): Promise<TireMovement[]> {
        const response = await api.get('/api/tires/movements');
        return response.data;
    }

    async getHistory(id: string): Promise<TireMovement[]> {
        const response = await api.get(`/api/tires/${id}/history`);
        return response.data;
    }

    async getLifecycleConfig(): Promise<TireLifecycleConfig> {
        const response = await api.get('/api/tires/lifecycle-config');
        return response.data;
    }

    async updateLifecycleConfig(config: TireLifecycleConfig): Promise<TireLifecycleConfig> {
        const response = await api.put('/api/tires/lifecycle-config', config);
        return response.data;
    }

    async getFrontAxleExceptions(activeOnly = false): Promise<TireFrontAxleException[]> {
        const response = await api.get('/api/tires/exceptions', { params: { activeOnly } });
        return response.data;
    }
}

export default new TireService();
