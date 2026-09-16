import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 7: Boletim de Medição, Faturamento & Controladoria Financeira.
 * Cortes de oficina (RF-07.1), DRE por placa (RF-07.5), caução e boleto (RF-07.4).
 */

export interface VehicleDre {
  vehicleId: string;
  plate: string;
  model?: string | null;
  clientName?: string | null;
  clientId?: string | null;
  referenceMonth?: string | null;
  grossRevenue: number;
  extraTripsRevenue: number;
  excessKmRevenue: number;
  taxesPct?: number | null;
  taxesValue: number;
  netRevenue: number;
  fuelCost: number;
  maintenanceCost: number;
  payrollCost: number;
  depreciation: number;
  usefulLifeMonths?: number | null;
  totalCosts: number;
  netResult: number;
  resultMarginPct?: number | null;
  kmDriven?: number | null;
  realCostPerKm?: number | null;
}

export interface DreClientRow {
  clientName: string;
  vehicleCount: number;
  grossRevenue: number;
  taxesValue: number;
  totalCosts: number;
  netResult: number;
  marginPct: number;
}

export interface DreByClientResponse {
  referenceMonth: string;
  clients: DreClientRow[];
  totals: {
    grossRevenue: number;
    taxesValue: number;
    totalCosts: number;
    netResult: number;
  };
}

export interface VehicleCutResult {
  vehicleId: string;
  plate: string;
  daysStopped: number;
  reserveCovered: boolean;
  dailyRate: number;
  cutDays: number;
  cutAmount: number;
  reason: string;
}

export interface RetentionLedger {
  contractId: string;
  retentionRate: number;
  retainedValue: number;
  releasedValue: number;
  ledgerBalance: number;
}

export const financialClosingService = {
  getFleetDre: async (referenceMonth: string): Promise<VehicleDre[]> => {
    const { data } = await api.get<VehicleDre[]>('/api/financial-closing/dre/vehicles', {
      params: { referenceMonth },
    });
    return Array.isArray(data) ? data : [];
  },

  getDreByClient: async (referenceMonth: string): Promise<DreByClientResponse> => {
    const { data } = await api.get<DreByClientResponse>('/api/financial-closing/dre/clients', {
      params: { referenceMonth },
    });
    return data;
  },

  applyWorkshopCuts: async (bulletinId: string): Promise<VehicleCutResult[]> => {
    const { data } = await api.post<VehicleCutResult[]>(
      `/api/financial-closing/measurements/${bulletinId}/workshop-cuts`
    );
    return Array.isArray(data) ? data : [];
  },

  getWorkshopCuts: async (bulletinId: string): Promise<VehicleCutResult[]> => {
    const { data } = await api.get<VehicleCutResult[]>(
      `/api/financial-closing/measurements/${bulletinId}/workshop-cuts`
    );
    return Array.isArray(data) ? data : [];
  },

  getRetentionLedger: async (contractId: string): Promise<RetentionLedger> => {
    const { data } = await api.get<RetentionLedger>(
      `/api/financial-closing/retention-ledger/${contractId}`
    );
    return data;
  },

  registerBoleto: async (receivableId: string, contractualDays?: number) => {
    const { data } = await api.post(`/api/financial-closing/receivables/${receivableId}/boleto`, null, {
      params: contractualDays ? { contractualDays } : undefined,
    });
    return data;
  },

  getBoletoPdfUrl: (receivableId: string) =>
    `/api/financial-closing/receivables/${receivableId}/boleto-pdf`,
};
