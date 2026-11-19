import api from '@/lib/axios';

export interface NfseItemRequest {
    description: string;
    quantity: number;
    unitValue: number;
}

export interface NfseIbscbsRequest {
    finNFSe?: string;
    indFinal?: string;
    cIndOp?: string;
    tpOper?: string;
    tpEnteGov?: string;
    indDest?: string;
    cst?: string;
    cClassTrib?: string;
    cCredPres?: string;
}

export interface NfseCreateRequest {
    series?: string;
    competence?: string;
    clientId?: string;
    municipalityCode?: string;
    serviceLocationCode?: string;
    issuerMunicipalRegistration?: string;
    takerName: string;
    takerTaxId: string;
    takerMunicipalRegistration?: string;
    takerAddress?: string;
    takerAddressNumber?: string;
    takerNeighborhood?: string;
    takerMunicipalityCode?: string;
    takerCity?: string;
    takerState?: string;
    takerZip?: string;
    takerEmail?: string;
    serviceCode: string;
    municipalTaxCode?: string;
    nbsCode?: string;
    serviceDescription: string;
    discrimination?: string;
    grossAmount?: number;
    issTaxation?: string;
    issWithholdingType?: string;
    opSimpNac?: string;
    regEspTrib?: string;
    deductionAmount?: number;
    issRate?: number;
    issWithheld?: boolean;
    inssAmount?: number;
    irrfAmount?: number;
    csllAmount?: number;
    dueDate?: string;
    notes?: string;
    items?: NfseItemRequest[];
    ibscbs?: NfseIbscbsRequest;
}

export interface NfseResponse {
    id: string;
    fiscalDocumentId?: string;
    dpsNumber?: number;
    dpsId?: string;
    nfseKey?: string;
    number: string;
    series: string;
    verificationCode?: string;
    emissionDate: string;
    competence: string;
    competenceLabel: string;
    environment: string;
    takerName: string;
    takerTaxId?: string;
    grossAmount: number;
    issAmount: number;
    issRetainedAmount?: number;
    inssAmount?: number;
    netAmount: number;
    status: string;
    rejectionCode?: string;
    rejectionMessage?: string;
    ibscbsVTotNf?: number;
    ibscbsVIbs?: number;
    ibscbsVCbs?: number;
}

export interface NfseCancelRequest {
    reasonCode: string;
    justification: string;
}

export interface NfseEventResponse {
    id?: string;
    status?: string;
    message?: string;
    protocol?: string;
    responseXml?: string;
    success: boolean;
}

export interface NfsePreviewResponse {
    dpsId: string;
    xml: string;
    schemaValid: boolean;
    messages: string[];
    grossAmount: number;
    issAmount: number;
    netAmount: number;
}

export interface NfseConfig {
    companyId: string;
    name: string;
    cnpj?: string;
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    codigoMunicipio?: string;
    regimeTributario?: string;
    address?: string;
    addressNumber?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    certificateConfigured: boolean;
    certificateValidUntil?: string;
}

export interface NfseConfigRequest {
    inscricaoEstadual?: string;
    inscricaoMunicipal?: string;
    codigoMunicipio?: string;
    regimeTributario?: string;
}

export interface FiscalCertificate {
    id: string;
    alias?: string;
    fileName?: string;
    subject?: string;
    cnpj?: string;
    serialNumber?: string;
    validFrom?: string;
    validUntil?: string;
    active: boolean;
    expired: boolean;
    createdAt: string;
}

class NfseService {
    async list(): Promise<NfseResponse[]> {
        const response = await api.get('/api/fiscal/nfse');
        return response.data;
    }

    async get(id: string): Promise<NfseResponse> {
        const response = await api.get(`/api/fiscal/nfse/${id}`);
        return response.data;
    }

    async emit(request: NfseCreateRequest): Promise<NfseResponse> {
        const response = await api.post('/api/fiscal/nfse', request);
        return response.data;
    }

    async preview(request: NfseCreateRequest): Promise<NfsePreviewResponse> {
        const response = await api.post('/api/fiscal/nfse/preview', request);
        return response.data;
    }

    async consultar(id: string): Promise<NfseResponse> {
        const response = await api.post(`/api/fiscal/nfse/${id}/consultar`);
        return response.data;
    }

    async cancelar(id: string, request: NfseCancelRequest): Promise<NfseEventResponse> {
        const response = await api.post(`/api/fiscal/nfse/${id}/cancelar`, request);
        return response.data;
    }

    async xml(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/nfse/${id}/xml`, { responseType: 'blob' });
        return response.data;
    }

    async pdf(id: string): Promise<Blob> {
        const response = await api.get(`/api/fiscal/nfse/${id}/pdf`, { responseType: 'blob' });
        return response.data;
    }

    async getConfig(): Promise<NfseConfig> {
        const response = await api.get('/api/fiscal/nfse/config');
        return response.data;
    }

    async updateConfig(request: NfseConfigRequest): Promise<NfseConfig> {
        const response = await api.put('/api/fiscal/nfse/config', request);
        return response.data;
    }

    async listCertificates(): Promise<FiscalCertificate[]> {
        const response = await api.get('/api/fiscal/certificados');
        return response.data;
    }

    async uploadCertificate(file: File, password: string): Promise<FiscalCertificate> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);
        const response = await api.post('/api/fiscal/certificados', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    }

    async activateCertificate(id: string): Promise<FiscalCertificate> {
        const response = await api.post(`/api/fiscal/certificados/${id}/ativar`);
        return response.data;
    }

    async deleteCertificate(id: string): Promise<void> {
        await api.delete(`/api/fiscal/certificados/${id}`);
    }
}

export default new NfseService();
