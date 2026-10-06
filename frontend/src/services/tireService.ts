import api from '@/lib/axios';

export interface Tire {
    id: string;
    serialNumber: string; // Código / DOT / Fogo do pneu
    brand: string;
    model: string;
    size: string;
    status: 'AVAILABLE' | 'IN_USE' | 'RECAP' | 'SCRAPPED';
    currentMileage: number;
    recapCount: number;
    vehicleId?: string;
    vehiclePlate?: string;
    axleNumber?: number;
    positionIndex?: number;
    dot?: string;
    initialTreadDepth?: number;
    currentTreadDepth?: number;
    acquisitionCost?: number;
    cpk?: number;
    locationNotes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface TireMovement {
    id: string;
    tireId: string;
    vehicleId?: string;
    type: 'PURCHASE' | 'INSTALLATION' | 'REMOVAL' | 'ROTATION' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP';
    position?: string;
    axleNumber?: number;
    positionIndex?: number;
    mileage: number;
    notes?: string;
    movementDate: string;
}

export interface TireMountPayload {
    tireId: string;
    vehicleId: string;
    axleNumber: number;
    positionIndex: number;
    positionCode?: string;
    currentVehicleKm?: number;
    treadDepthMm?: number;
    notes?: string;
}

export interface TireDismountPayload {
    tireId: string;
    currentVehicleKm?: number;
    treadDepthMm?: number;
    removalReason: 'ESTOQUE' | 'ENVIAR_REFORMA' | 'DESCARTE_SUCATA' | 'FURO_AVARIA';
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

    async getVehicleChassis(vehicleId: string): Promise<any> {
        const response = await api.get(`/api/tires/chassis/${vehicleId}`);
        return response.data;
    }

    async registerMovement(movement: Partial<TireMovement>): Promise<TireMovement> {
        const response = await api.post('/api/tires/movements', movement);
        return response.data;
    }

    async getHistory(id: string): Promise<TireMovement[]> {
        const response = await api.get(`/api/tires/${id}/history`);
        return response.data;
    }
}

export default new TireService();
