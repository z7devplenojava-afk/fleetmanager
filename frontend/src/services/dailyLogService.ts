import api from '@/lib/axios';

export interface DailyLog {
    id: string;
    date: string;
    vehicleId: string;
    vehiclePlate: string;
    clientId?: string;
    route?: string;
    shift: string;
    initialKm: number;
    finalKm: number;
    totalKmRun: number;
    discountedKm: number;
    consideredKm: number;
    allowance: number;
    excessKm: number;
    notes?: string;
}

class DailyLogService {
    async getAll(): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs');
        return response.data;
    }

    async getByPeriod(start: string, end: string): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/by-period', {
            params: { start, end }
        });
        return response.data;
    }

    async save(log: Partial<DailyLog>): Promise<DailyLog> {
        if (log.id) {
            const response = await api.put(`/api/daily-logs/${log.id}`, log);
            return response.data;
        } else {
            const response = await api.post('/api/daily-logs', log);
            return response.data;
        }
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/daily-logs/${id}`);
    }
}

export default new DailyLogService();
