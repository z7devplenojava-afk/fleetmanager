import api from '@/lib/axios';

export interface DriverWorkHour {
    id: string;
    employeeId: string;
    referenceDate: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
    waitMinutes: number;
    nightMinutes: number;
    overtimeMinutes: number;
    notes?: string;
    isClosed: boolean;
}

export interface DriverHourCalculationMemory {
    id: string;
    calculationLog: string;
    appliedRules: string;
    createdAt: string;
}

export interface DriverHourCalculationMemory {
    id: string;
    calculationLog: string;
    appliedRules: string;
    createdAt: string;
}

class DriverHourService {
    async saveJornada(workHour: Partial<DriverWorkHour>): Promise<DriverWorkHour> {
        const response = await api.post('/api/hr/driver-hours', workHour);
        return response.data;
    }

    async getJornada(id: string): Promise<DriverWorkHour> {
        const response = await api.get(`/api/hr/driver-hours/${id}`);
        return response.data;
    }

    async getJornadaByPeriod(start: string, end: string): Promise<DriverWorkHour[]> {
        const response = await api.get('/api/hr/driver-hours/by-period', {
            params: { start, end }
        });
        return response.data;
    }
}

export default new DriverHourService();
