import api from '@/lib/axios';

export interface ArlaRecord {
    id: string;
    vehicleId: string;
    vehiclePlate?: string;
    driverId?: string;
    driverName?: string;
    date: string;
    quantity: number;
    cost: number;
    mileage: number;
    station?: string;
    notes?: string;
    createdAt?: string;
}

class ArlaService {
    async findAll(): Promise<ArlaRecord[]> {
        const response = await api.get('/api/arla-records');
        return response.data;
    }

    async findByVehicle(vehicleId: string): Promise<ArlaRecord[]> {
        const response = await api.get(`/api/arla-records/vehicle/${vehicleId}`);
        return response.data;
    }

    async create(record: Partial<ArlaRecord>): Promise<ArlaRecord> {
        const response = await api.post('/api/arla-records', record);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/arla-records/${id}`);
    }
}

export default new ArlaService();
