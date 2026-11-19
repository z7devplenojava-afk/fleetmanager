import api from '@/lib/axios';

export interface NfeItemRequest {
    code?: string;
    description: string;
    ncm: string;
    cfop: string;
    unit?: string;
    quantity: number;
    unitValue: number;
    icmsOrig?: string;
    icmsCst?: string;
    icmsRate?: number;
    pisCst?: string;
    pisRate?: number;
    cofinsCst?: string;
    cofinsRate?: number;
}

export interface NfeCreateRequest {
    series?: string;
    natureOperation?: string;
    tpNf?: string;
    idDest?: string;
    tpImp?: string;
    tpEmis?: string;
    finNfe?: string;
    indFinal?: string;
    indPres?: string;
    procEmi?: string;
    verProc?: string;

    issuerStateRegistration?: string;
    issuerAddress?: string;
    issuerAddressNumber?: string;
    issuerNeighborhood?: string;
    issuerCity?: string;
    issuerState?: string;
    issuerZip?: string;
    issuerMunicipalityCode?: string;
    issuerPhone?: string;
    issuerEmail?: string;
    issuerCrt?: string;

    recipientName: string;
    recipientTaxId: string;
    recipientStateRegistration?: string;
    recipientIndIeDest?: string;
    recipientEmail?: string;
    recipientAddress: string;
    recipientAddressNumber?: string;
    recipientNeighborhood?: string;
    recipientCity: string;
    recipientState: string;
    recipientZip: string;
    recipientMunicipalityCode: string;

    paymentType?: string;
    paymentInd?: string;
    freightModality?: string;
    notes?: string;

    respTechCnpj?: string;
    respTechContact?: string;
    respTechEmail?: string;
    respTechPhone?: string;

    items: NfeItemRequest[];
}

export interface NfeItemResponse {
    itemNumber: number;
    code: string;
    description: string;
    ncm: string;
    cfop: string;
    quantity: number;
    unitValue: number;
    totalValue: number;
    icmsCst: string;
}

export interface NfeResponse {
    id: string;
    fiscalDocumentId?: string;
    number: string;
    series: string;
    accessKey: string;
    protocolNumber?: string;
    protocolStatus?: string;
    protocolMessage?: string;
    emissionDate: string;
    environment: string;
    natureOperation: string;
    issuerName: string;
    issuerTaxId: string;
    recipientName?: string;
    recipientTaxId?: string;
    totalAmount: number;
    icmsAmount: number;
    pisAmount: number;
    cofinsAmount: number;
    status: string;
    rejectionCode?: string;
    rejectionMessage?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    items?: NfeItemResponse[];
}

class NfeService {
    async list(): Promise<NfeResponse[]> {
        const response = await api.get('/api/fiscal/nfe');
        return response.data;
    }

    async get(id: string): Promise<NfeResponse> {
        const response = await api.get(`/api/fiscal/nfe/${id}`);
        return response.data;
    }

    async emit(request: NfeCreateRequest): Promise<NfeResponse> {
        const response = await api.post('/api/fiscal/nfe', request);
        return response.data;
    }

    async consultar(id: string): Promise<NfeResponse> {
        const response = await api.post(`/api/fiscal/nfe/${id}/consultar`);
        return response.data;
    }

    async cancelar(id: string, justificativa: string): Promise<NfeResponse> {
        const response = await api.post(`/api/fiscal/nfe/${id}/cancelar`, null, {
            params: { justificativa },
        });
        return response.data;
    }

    async xml(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/nfe/${id}/xml`, { responseType: 'blob' });
        return response.data;
    }

    async pdf(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/nfe/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    }
}

export default new NfeService();
