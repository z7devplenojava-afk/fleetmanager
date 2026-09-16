import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 6 (RF-06.4): Painel de Decisão de Substituição do Ativo — TCO.
 */

export type TcoRecommendation = 'REPLACE' | 'WATCH' | 'NONE';

export interface VehicleTco {
  vehicleId: string;
  plate: string;
  model?: string | null;
  brand?: string | null;
  year?: number | null;
  periodMonth?: number;
  periodYear?: number;
  kmRunInMonth?: number;
  maintenanceCostInMonth?: number;
  realCostPerKm?: number | null;
  budgetedCostPerKm?: number | null;
  costVariancePct?: number | null;
  daysWithLog?: number;
  daysInPeriod?: number;
  workOrdersInMonth?: number;
  downtimeHoursInMonth?: number;
  overBudget?: boolean;
  excessiveStops?: boolean;
  recommendation?: TcoRecommendation;
  recommendationMessage?: string | null;
}

export const tcoService = {
  getCurrentMonth: async (): Promise<VehicleTco[]> => {
    const { data } = await api.get<VehicleTco[]>('/api/tco');
    return Array.isArray(data) ? data : [];
  },

  getByPeriod: async (params: { plate?: string; start?: string; end?: string }): Promise<VehicleTco[]> => {
    const { data } = await api.get<VehicleTco[]>('/api/tco/period', { params });
    return Array.isArray(data) ? data : [];
  },

  recalculateOdometers: async (): Promise<{ vehiclesUpdated: number }> => {
    const { data } = await api.post<{ vehiclesUpdated: number }>('/api/tco/odometer/recalculate');
    return data;
  },

  seedPrdPlans: async (vehicleId: string, lastExecutionKm = 0): Promise<{ plansCreated: number }> => {
    const { data } = await api.post<{ plansCreated: number }>(
      `/api/tco/odometer/vehicle/${vehicleId}/seed-prd-plans`,
      { lastExecutionKm }
    );
    return data;
  },
};
