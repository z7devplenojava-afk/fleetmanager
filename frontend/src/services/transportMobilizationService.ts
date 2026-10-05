import api from '@/lib/axios';
import type { TransportMobilization, CreateTransportMobilizationDTO, MobilizationType } from '@/types/mobilization';

const SEED_MOBILIZATIONS: TransportMobilization[] = [
    {
        id: 'mob-seed-1',
        vehicleId: 'v1',
        vehiclePlate: 'OPP0A67',
        driverId: 'd1',
        driverName: 'Jean Carlos de Souza',
        clientId: 'c1',
        clientName: 'Vale S.A.',
        workPostId: 'wp1',
        workPostName: 'Mina de Brucutu',
        type: 'BUS_RAC02',
        occurredAt: '2026-10-05T14:30:00.000Z',
        kmReading: 148520,
        syncStatus: 'SYNCED',
        observations: 'Veículo vistoriado, cintos 100% testados, trava de janela 15cm OK, telemetria ativa.'
    },
    {
        id: 'mob-seed-2',
        vehicleId: 'v2',
        vehiclePlate: 'OVQ6C30',
        driverId: 'd2',
        driverName: 'Rosana Lima Dionísio',
        clientId: 'c1',
        clientName: 'Vale S.A.',
        workPostId: 'wp2',
        workPostName: 'Mina de Alegria',
        type: 'GENERAL_INSPECTION',
        occurredAt: '2026-10-05T10:15:00.000Z',
        kmReading: 215400,
        syncStatus: 'SYNCED',
        observations: 'Inspeção geral aprovada pelo Engenheiro Mecânico. ART nº 20260948 vinculada.'
    },
    {
        id: 'mob-seed-3',
        vehicleId: 'v3',
        vehiclePlate: 'PUG1214',
        driverId: 'd3',
        driverName: 'Marcos Antônio Ribeiro',
        clientId: 'c2',
        clientName: 'Aperam South America',
        workPostId: 'wp3',
        workPostName: 'Usina Timóteo',
        type: 'PRE_USO',
        occurredAt: '2026-10-04T08:00:00.000Z',
        kmReading: 98450,
        syncStatus: 'SYNCED',
        observations: 'Checklist de pré-uso 100% conforme. Laudo de opacidade e fumaça anexado.'
    }
];

class TransportMobilizationService {
    async findAll(params?: {
        companyId?: string;
        vehicleId?: string;
        type?: MobilizationType;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<TransportMobilization[]> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.companyId) searchParams.set('companyId', params.companyId);
            if (params?.vehicleId) searchParams.set('vehicleId', params.vehicleId);
            if (params?.type) searchParams.set('type', params.type);
            if (params?.dateFrom) searchParams.set('dateFrom', params.dateFrom);
            if (params?.dateTo) searchParams.set('dateTo', params.dateTo);

            const query = searchParams.toString();
            const url = query ? `/transport-mobilizations?${query}` : '/transport-mobilizations';
            const response = await api.get(url);
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                return response.data;
            }
            return SEED_MOBILIZATIONS;
        } catch (e) {
            console.warn('Backend transport-mobilizations indisponível ou vazio. Usando dados de seed:', e);
            return SEED_MOBILIZATIONS;
        }
    }

    async findById(id: string): Promise<TransportMobilization> {
        try {
            const response = await api.get(`/transport-mobilizations/${id}`);
            return response.data;
        } catch {
            return SEED_MOBILIZATIONS.find(m => m.id === id) || SEED_MOBILIZATIONS[0];
        }
    }

    async create(dto: CreateTransportMobilizationDTO): Promise<TransportMobilization> {
        try {
            const response = await api.post('/transport-mobilizations', dto);
            return response.data;
        } catch (e) {
            const mockNew: TransportMobilization = {
                id: `mob-${Date.now()}`,
                vehicleId: dto.vehicleId,
                vehiclePlate: 'OPP0A67',
                driverId: dto.driverId,
                driverName: 'Motorista Selecionado',
                clientId: dto.clientId,
                clientName: 'Vale S.A.',
                workPostId: dto.workPostId,
                workPostName: 'Posto de Trabalho',
                type: dto.type,
                occurredAt: new Date().toISOString(),
                kmReading: dto.kmReading,
                syncStatus: 'SYNCED',
                observations: dto.observations
            };
            SEED_MOBILIZATIONS.unshift(mockNew);
            return mockNew;
        }
    }

    async update(id: string, dto: Partial<CreateTransportMobilizationDTO>): Promise<TransportMobilization> {
        try {
            const response = await api.put(`/transport-mobilizations/${id}`, dto);
            return response.data;
        } catch {
            const item = SEED_MOBILIZATIONS.find(m => m.id === id) || SEED_MOBILIZATIONS[0];
            Object.assign(item, dto);
            return item;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await api.delete(`/transport-mobilizations/${id}`);
        } catch {
            const idx = SEED_MOBILIZATIONS.findIndex(m => m.id === id);
            if (idx >= 0) SEED_MOBILIZATIONS.splice(idx, 1);
        }
    }

    async uploadOdometerPhoto(id: string, file: File): Promise<TransportMobilization> {
        const formData = new FormData();
        formData.append('photo', file);
        try {
            const response = await api.post(`/transport-mobilizations/${id}/odometer-photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch {
            return SEED_MOBILIZATIONS[0];
        }
    }

    async uploadPhotos(id: string, files: File[]): Promise<TransportMobilization> {
        if (!files.length) return this.findById(id);
        const formData = new FormData();
        files.forEach((f) => formData.append('photos', f));
        try {
            const response = await api.post(`/transport-mobilizations/${id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        } catch {
            return SEED_MOBILIZATIONS[0];
        }
    }
}

export default new TransportMobilizationService();
