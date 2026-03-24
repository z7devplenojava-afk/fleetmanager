import api from '@/lib/axios';

export interface CharterContract {
    id: string;
    name: string;
    clientId: string;
    clientName?: string;
    value: number;
    startDate: string;
    endDate?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'FINISHED' | 'SUSPENDED';
    notes?: string;
}

class CharterService {
    async findAllContracts(): Promise<CharterContract[]> {
        const response = await api.get('/api/charter/contracts');
        return response.data;
    }

    async findContractById(id: string): Promise<CharterContract> {
        const response = await api.get(`/api/charter/contracts/${id}`);
        return response.data;
    }

    async createContract(contract: Partial<CharterContract>): Promise<CharterContract> {
        const response = await api.post('/api/charter/contracts', contract);
        return response.data;
    }

    async updateContract(id: string, contract: Partial<CharterContract>): Promise<CharterContract> {
        const response = await api.put(`/api/charter/contracts/${id}`, contract);
        return response.data;
    }

    async deleteContract(id: string): Promise<void> {
        await api.delete(`/api/charter/contracts/${id}`);
    }
}

export default new CharterService();
