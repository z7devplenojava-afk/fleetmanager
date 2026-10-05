import api from '@/lib/axios';

export type DayType = 'DIA_UTIL' | 'SABADO' | 'DOMINGO_FERIADO';
export type SlotStatus = 'ATIVO' | 'INATIVO';

export interface LineTimeSlot {
    id?: string;
    companyId?: string;
    routeId?: string;
    route?: { id: string; name?: string; color?: string };
    dayType: DayType;
    departureTime: string; // HH:mm:ss
    status: SlotStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ScheduleDateOverride {
    id?: string;
    overrideDate: string; // yyyy-MM-dd
    appliesDayType: DayType;
    reason?: string;
}

export const dayTypeLabel: Record<DayType, string> = {
    DIA_UTIL: 'Dias úteis',
    SABADO: 'Sábado',
    DOMINGO_FERIADO: 'Domingo e feriados',
};

const lineTimeSlotService = {
    async getAll(routeId?: string, dayType?: string): Promise<LineTimeSlot[]> {
        const params: Record<string, string> = {};
        if (routeId) params.routeId = routeId;
        if (dayType) params.dayType = dayType;
        const response = await api.get('/api/line-time-slots', { params });
        return response.data;
    },

    async create(slot: Partial<LineTimeSlot>): Promise<LineTimeSlot> {
        const response = await api.post('/api/line-time-slots', slot);
        return response.data;
    },

    async update(id: string, slot: Partial<LineTimeSlot>): Promise<LineTimeSlot> {
        const response = await api.put(`/api/line-time-slots/${id}`, slot);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/api/line-time-slots/${id}`);
    },

    async resolveDayType(date: string): Promise<string> {
        const response = await api.get('/api/line-time-slots/resolve-day-type', { params: { date } });
        return response.data.dayType;
    },

    async activeForDate(date: string): Promise<LineTimeSlot[]> {
        const response = await api.get('/api/line-time-slots/active-for-date', { params: { date } });
        return response.data;
    },

    async getOverrides(): Promise<ScheduleDateOverride[]> {
        const response = await api.get('/api/line-time-slots/overrides');
        return response.data;
    },

    async saveOverride(override: Partial<ScheduleDateOverride>): Promise<ScheduleDateOverride> {
        const response = await api.post('/api/line-time-slots/overrides', override);
        return response.data;
    },

    async deleteOverride(id: string): Promise<void> {
        await api.delete(`/api/line-time-slots/overrides/${id}`);
    },
};

export default lineTimeSlotService;
