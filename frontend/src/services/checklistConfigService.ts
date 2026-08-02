import api from '@/lib/axios';

export interface ChecklistConfigItem {
    id?: string;
    vehicleId?: string;
    title: string;
    category: string;
    required: boolean;
    sortOrder?: number;
    isActive?: boolean;
    companyId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ChecklistConfigCopyResult {
    copied: number;
    vehicleIds: string[];
    itemsCount: number;
}

class ChecklistConfigService {
    /** Itens efetivos para um veículo (customizados ou template padrão global). */
    async getForVehicle(vehicleId?: string): Promise<ChecklistConfigItem[]> {
        const params = vehicleId ? { vehicleId } : {};
        const response = await api.get('/frota/checklist-configs', { params });
        return response.data || [];
    }

    /** Template padrão global (aplicado a veículos sem configuração própria). */
    async getDefaultTemplate(): Promise<ChecklistConfigItem[]> {
        const response = await api.get('/frota/checklist-configs/default');
        return response.data || [];
    }

    /** Substitui os itens do checklist de um veículo (ou do padrão global quando vehicleId é nulo). */
    async replace(vehicleId: string | undefined, items: ChecklistConfigItem[]): Promise<ChecklistConfigItem[]> {
        const params = vehicleId ? { vehicleId } : {};
        const response = await api.put('/frota/checklist-configs', items, { params });
        return response.data || [];
    }

    /** Copia a configuração para vários veículos em uma única requisição (substitui a existente de cada destino). */
    async copyToVehicles(targetVehicleIds: string[], items: ChecklistConfigItem[]): Promise<ChecklistConfigCopyResult> {
        const response = await api.post('/frota/checklist-configs/copy', {
            targetVehicleIds,
            items,
        });
        return response.data || { copied: 0, vehicleIds: [], itemsCount: 0 };
    }
}

export default new ChecklistConfigService();
