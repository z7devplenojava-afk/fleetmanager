import api from '@/lib/axios';

export interface DriverWorkHour {
    id: string;
    employeeId: string;
    employeeName?: string;
    employeeDocument?: string;
    referenceDate: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
    waitMinutes: number;
    nightMinutes: number;
    nightReducedMinutes?: number;
    overtimeMinutes: number;
    contractDailyMinutes?: number;

    // 4 Pegadas
    pegada1Start?: string;
    pegada1End?: string;
    pegada2Start?: string;
    pegada2End?: string;
    pegada3Start?: string;
    pegada3End?: string;
    pegada4Start?: string;
    pegada4End?: string;

    source?: 'PONTO' | 'PARTE_DIARIA' | 'HIBRIDO' | 'MANUAL';
    notes?: string;
    isClosed: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface DriverHourCalculationMemory {
    id: string;
    calculationLog: string;
    appliedRules: string;
    createdAt: string;
}

export interface DriverMonthlyClosing {
    employeeId: string;
    employeeName: string;
    employeeDocument?: string;
    registrationNumber?: string;
    positionName?: string;
    year: number;
    month: number;
    contractMonthlyMinutes: number;
    totalWorkedMinutes: number;
    totalOvertimeMinutes: number;
    totalNightMinutes: number;
    totalNightReducedMinutes: number;
    totalWaitMinutes: number;
    balanceMinutes: number;
    daysWorked: number;
    daysClosed: number;
    isMonthFullyClosed: boolean;
    dailyRecords: DriverWorkHour[];
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

    async syncJornadas(start?: string, end?: string): Promise<DriverWorkHour[]> {
        const response = await api.post('/api/hr/driver-hours/sync', null, {
            params: { start, end }
        });
        return response.data;
    }

    async getCalculationMemory(id: string): Promise<DriverHourCalculationMemory> {
        const response = await api.get(`/api/hr/driver-hours/${id}/memory`);
        return response.data;
    }

    async getMonthlySummary(year: number, month: number, employeeId?: string): Promise<DriverMonthlyClosing[]> {
        const response = await api.get('/api/hr/driver-hours/monthly-summary', {
            params: { year, month, employeeId }
        });
        return response.data;
    }

    async closeMonth(year: number, month: number, employeeId?: string): Promise<{ message: string }> {
        const response = await api.post('/api/hr/driver-hours/close-month', null, {
            params: { year, month, employeeId }
        });
        return response.data;
    }
}

export default new DriverHourService();
