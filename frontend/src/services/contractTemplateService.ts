import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 2: Gestão de Propostas Comerciais & Minutas Contratuais.
 * Templates com cláusulas obrigatórias e geração de minutas a partir da
 * precificação aprovada no Módulo 1.
 */

export type ContractTemplateType = 'FRANCHISE_KM' | 'DEDICATED_ROUTES' | 'DRY_LEASE';

export const TEMPLATE_TYPE_LABELS: Record<ContractTemplateType, string> = {
  FRANCHISE_KM: 'Franquia de KM (Padrão Reframax/Vale)',
  DEDICATED_ROUTES: 'Rotas e Linhas Dedicadas (Padrão Mineração)',
  DRY_LEASE: 'Locação Seca sem Mão de Obra (Padrão Coopersind/Aterpa)',
};

export type GeneratedContractStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'CANCELLED';

export const CONTRACT_STATUS_LABELS: Record<GeneratedContractStatus, string> = {
  DRAFT: 'Rascunho',
  SENT: 'Enviada para Assinatura',
  SIGNED: 'Assinada',
  CANCELLED: 'Cancelada',
};

export interface ContractTemplate {
  id: string;
  name: string;
  templateType: ContractTemplateType;
  description?: string | null;
  defaultRetentionPct?: number;
  defaultAdjustmentIndex?: string;
  defaultPaymentDays?: number;
  dieselTriggerPct?: number;
  isActive?: boolean;
}

export interface GeneratedContract {
  id?: string;
  templateId: string;
  clientId: string;
  costSimulationId: string;
  templateType?: ContractTemplateType;
  templateName?: string;
  referenceNumber?: string;
  title?: string;
  renderedBody?: string;
  renderedClauses?: string;
  contractorName?: string;
  contractorCnpj?: string;
  contractorAddress?: string;
  clientName?: string;
  clientCnpj?: string;
  clientAddress?: string;
  electedForum?: string;
  monthlyPrice?: number;
  franchiseKm?: number;
  excessKmRate?: number;
  dailyRate?: number;
  extraTripRate?: number;
  retentionPct?: number;
  adjustmentIndex?: string;
  paymentDays?: number;
  version?: number;
  status?: GeneratedContractStatus;
  signatureProvider?: string | null;
  signedAt?: string | null;
  createdAt?: string;
}

export const contractTemplateService = {
  // ===== Templates (RF-02.1) =====
  listTemplates: async (): Promise<ContractTemplate[]> => {
    const { data } = await api.get<ContractTemplate[]>('/api/contract-templates');
    return Array.isArray(data) ? data : [];
  },

  // ===== Minutas geradas =====
  generate: async (request: GeneratedContract): Promise<GeneratedContract> => {
    const { data } = await api.post<GeneratedContract>('/api/contract-templates/generate', request);
    return data;
  },

  listGenerated: async (params: { clientId?: string; costSimulationId?: string }): Promise<GeneratedContract[]> => {
    const { data } = await api.get<GeneratedContract[]>('/api/contract-templates/generated', { params });
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string): Promise<GeneratedContract> => {
    const { data } = await api.get<GeneratedContract>(`/api/contract-templates/generated/${id}`);
    return data;
  },

  downloadPdf: (id: string) => {
    return api.get(`/api/contract-templates/generated/${id}/pdf`, { responseType: 'blob' });
  },

  markSent: async (id: string, provider = 'DocuSign'): Promise<GeneratedContract> => {
    const { data } = await api.post<GeneratedContract>(
      `/api/contract-templates/generated/${id}/send?provider=${encodeURIComponent(provider)}`
    );
    return data;
  },

  markSigned: async (id: string): Promise<GeneratedContract> => {
    const { data } = await api.post<GeneratedContract>(`/api/contract-templates/generated/${id}/sign`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/contract-templates/generated/${id}`);
  },
};
