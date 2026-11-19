import api from '@/lib/axios';

export interface CteCreateRequest {
    series?: string;
    cfop?: string;
    natureOperation?: string;
    serviceTaker?: string;
    issuerStateRegistration?: string;
    senderName: string;
    senderTaxId: string;
    senderAddress?: string;
    senderCity?: string;
    senderState?: string;
    senderZip?: string;
    senderStateRegistration?: string;
    recipientName: string;
    recipientTaxId: string;
    recipientAddress?: string;
    recipientCity?: string;
    recipientState?: string;
    recipientZip?: string;
    recipientStateRegistration?: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    vehiclePlate?: string;
    rntrc?: string;
    cargoDescription: string;
    cargoWeight?: number;
    cargoValue?: number;
    freightValue?: number;
    icmsRate?: number;
    notes?: string;
    clientId?: string;
}

/** Corpo aceito por POST /api/fiscal/cte (CteCreateRequest + códigos IBGE). */
export interface CteEmissionRequest extends CteCreateRequest {
    originMunicipalityCode?: string;
    destinationMunicipalityCode?: string;
    senderMunicipalityCode?: string;
    recipientMunicipalityCode?: string;
    environment?: string;
}

export interface CteResponse {
    id: string;
    fiscalDocumentId?: string;
    number: string;
    series: string;
    accessKey: string;
    emissionDate: string;
    senderName: string;
    recipientName: string;
    recipientTaxId?: string;
    originCity: string;
    originState: string;
    destinationCity: string;
    destinationState: string;
    freightValue: number;
    status: 'RASCUNHO' | 'PROCESSANDO' | 'EMITIDA' | 'ERRO' | string;
}

export interface CteCancelRequest {
    motivo: string;
}

class CteService {
    async list(): Promise<CteResponse[]> {
        const response = await api.get('/api/fiscal/cte');
        return response.data;
    }

    async get(id: string): Promise<CteResponse> {
        const response = await api.get(`/api/fiscal/cte/${id}`);
        return response.data;
    }

    async emit(request: CteEmissionRequest): Promise<CteResponse> {
        const response = await api.post('/api/fiscal/cte', request);
        return response.data;
    }

    async consultar(id: string): Promise<CteResponse> {
        const response = await api.post(`/api/fiscal/cte/${id}/consultar`);
        return response.data;
    }

    async cancelar(id: string, motivo: string): Promise<CteResponse> {
        const response = await api.post(`/api/fiscal/cte/${id}/cancelar`, { motivo });
        return response.data;
    }

    async xml(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/cte/${id}/xml`, { responseType: 'blob' });
        return response.data;
    }

    async pdf(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/cte/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    }
}

export default new CteService();
