import api from '@/lib/axios';

export interface AccessRecord {
    id: string;
    companyId: string;
    type: 'VISITOR' | 'EMPLOYEE';
    name: string;
    documentNumber?: string;
    vehiclePlate?: string;
    purposeOfVisit?: string;
    entryTime: string;
    exitTime?: string;
    status: 'IN' | 'OUT';
    authorizedBy?: string;
    unitId?: string;
    observations?: string;
}

const accessRecordService = {
    async findAll(companyId?: string): Promise<AccessRecord[]> {
        const response = await api.get('/api/gatehouse/access-records', {
            params: { companyId }
        });
        return response.data;
    },

    async registerEntry(data: Partial<AccessRecord>): Promise<AccessRecord> {
        const response = await api.post('/api/gatehouse/access-records/entry', data);
        return response.data;
    },

    async registerExit(id: string): Promise<AccessRecord> {
        const response = await api.post(`/api/gatehouse/access-records/${id}/exit`);
        return response.data;
    },

    async findActive(): Promise<AccessRecord[]> {
        const response = await api.get('/api/gatehouse/access-records/active');
        return response.data;
    }
};

export default accessRecordService;
