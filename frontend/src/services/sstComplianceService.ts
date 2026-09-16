import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 4: Gestão de RH, Departamento Pessoal & SST.
 * RF-04.3 (fumaça preta Ringelmann), RF-04.4 (dossiê de conformidade 1-clique).
 */

const BASE_URL = '/api/sst-compliance';

// ===== RF-04.3: Fumaça preta =====

export type OpacityResult = 'APPROVED' | 'RESTRICTED' | 'DISAPPROVED';

export const OPACITY_RESULT_LABELS: Record<OpacityResult, string> = {
  APPROVED: 'Aprovado',
  RESTRICTED: 'Restrito',
  DISAPPROVED: 'Reprovado',
};

export interface OpacityTest {
  id?: string;
  testDate?: string;
  vehicle?: { id: string } | null;
  vehiclePlate?: string;
  ringelmannScale?: number;
  result?: OpacityResult;
  laboratoryName?: string;
  certificateNumber?: string;
  certificateExpiresAt?: string;
  reportUrl?: string;
  notes?: string;
}

export interface OpacityCoverage {
  referenceMonth: string;
  activeVehicles: number;
  testedVehicles: number;
  coveragePct: number;
  pendingVehicles: { id: string; plate: string }[];
}

export const opacityService = {
  list: async (params?: { vehicleId?: string; start?: string; end?: string }): Promise<OpacityTest[]> => {
    const { data } = await api.get<OpacityTest[]>(`${BASE_URL}/opacity-tests`, { params });
    return Array.isArray(data) ? data : [];
  },

  create: async (test: OpacityTest): Promise<OpacityTest> => {
    const { data } = await api.post<OpacityTest>(`${BASE_URL}/opacity-tests`, test);
    return data;
  },

  getCoverage: async (yearMonth: string): Promise<OpacityCoverage> => {
    const { data } = await api.get<OpacityCoverage>(`${BASE_URL}/opacity-tests/coverage/${yearMonth}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/opacity-tests/${id}`);
  },
};

// ===== RF-04.4: Dossiê de conformidade =====

export interface ComplianceDossier {
  id?: string;
  referenceMonth?: string;
  client?: { id: string } | null;
  clientId?: string;
  contract?: { id: string } | null;
  // Checklist
  payrollSummaryOk?: boolean;
  payrollDepositOk?: boolean;
  benefitsProofOk?: boolean;
  fgtsGuideOk?: boolean;
  inssGuideOk?: boolean;
  cndtOk?: boolean;
  cndFgtsOk?: boolean;
  cndUnionOk?: boolean;
  opacityTestsOk?: boolean;
  attachments?: string;
  // Validade das certidões
  cndtValidUntil?: string;
  cndFgtsValidUntil?: string;
  cndUnionValidUntil?: string;
  // Geração
  generatedAt?: string | null;
  generatedBy?: string | null;
  status?: 'DRAFT' | 'COMPLETE' | 'ATTACHED_TO_BM';
  notes?: string;
}

export const DOSSIER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  COMPLETE: 'Completo',
  ATTACHED_TO_BM: 'Anexado ao BM',
};

export const dossierService = {
  list: async (clientId?: string): Promise<ComplianceDossier[]> => {
    const { data } = await api.get<ComplianceDossier[]>(`${BASE_URL}/dossiers`, {
      params: clientId ? { clientId } : {},
    });
    return Array.isArray(data) ? data : [];
  },

  createOrGet: async (referenceMonth: string, clientId: string): Promise<ComplianceDossier> => {
    const { data } = await api.post<ComplianceDossier>(`${BASE_URL}/dossiers`, null, {
      params: { referenceMonth, clientId },
    });
    return data;
  },

  update: async (id: string, dossier: ComplianceDossier): Promise<ComplianceDossier> => {
    const { data } = await api.put<ComplianceDossier>(`${BASE_URL}/dossiers/${id}`, dossier);
    return data;
  },

  generate: async (id: string, generatedBy = 'sistema'): Promise<ComplianceDossier> => {
    const { data } = await api.post<ComplianceDossier>(
      `${BASE_URL}/dossiers/${id}/generate?generatedBy=${encodeURIComponent(generatedBy)}`
    );
    return data;
  },

  downloadPdf: (id: string) => {
    return api.get(`${BASE_URL}/dossiers/${id}/pdf`, { responseType: 'blob' });
  },
};

// ===== RF-04.2: Alertas SST =====

export const sstAlertService = {
  runManualCheck: async (): Promise<{ asoAlerts: number; cnhAlerts: number }> => {
    const { data } = await api.post<{ asoAlerts: number; cnhAlerts: number }>(`${BASE_URL}/alerts/run`);
    return data;
  },
};
