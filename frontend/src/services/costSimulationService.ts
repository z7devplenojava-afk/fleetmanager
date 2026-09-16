import api from '@/lib/axios';

/**
 * PRD 1.0 - Módulo 1: Engenharia de Custos, Orçamento & Precificação Paramétrica.
 * Percentuais são frações decimais (0.10 = 10%).
 */

export type VehicleCategory = 'BUS' | 'MICRO_BUS' | 'VAN';

export const VEHICLE_CATEGORIES: { value: VehicleCategory; label: string; coefficient: number }[] = [
  { value: 'BUS', label: 'Ônibus Rodoviário com Ar (2,2 km/l)', coefficient: 0.4545 },
  { value: 'MICRO_BUS', label: 'Micro-ônibus (2,5 km/l)', coefficient: 0.4 },
  { value: 'VAN', label: 'Van Sprinter (4,5 km/l)', coefficient: 0.2222 },
];

export type CostSimulationStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export const STATUS_LABELS: Record<CostSimulationStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING_APPROVAL: 'Aguardando Aprovação',
  APPROVED: 'Aprovado',
  REJECTED: 'Reprovado',
};

export interface CostSimulation {
  id?: string;
  itemNumber?: number;
  name: string;
  origin?: string;
  destination?: string;
  shift?: string;
  scale?: string;
  vehicleTypeLabel?: string;
  version?: number;
  clientId?: string | null;
  clientName?: string | null;
  contractId?: string | null;
  contractDescription?: string | null;
  vehicleCategory: VehicleCategory;
  driverCount: number;
  operatingDays: number;
  dieselPrice: number;
  fuelConsumptionKmL?: number;
  arlaCostPerKm?: number;
  baseSalary: number;
  payrollChargesPct: number;
  mealAllowance?: number;
  healthPlanCost?: number;
  nightShiftExtra?: number;
  overtimeExtra?: number;
  dailyKm: number;
  productivityFactor?: number;
  maintenancePerKm?: number;
  tiresPerKm?: number;
  lubricantsPerKm?: number;
  partsPerKm?: number;
  fixedCosts?: number;
  depreciationMonthly?: number;
  ipvaInsuranceMonthly?: number;
  trackingMonthly?: number;
  adminExpensesMonthly?: number;
  issPct?: number;
  icmsPct?: number;
  pisPct?: number;
  cofinsPct?: number;
  irpjPct?: number;
  csllPct?: number;
  profitMarginPct?: number;
  bdiPct?: number;
  extraTripMarginPct?: number;
  // Resultados calculados
  fixedDriverCost?: number;
  totalFixedCost?: number;
  variableCostPerKm?: number;
  franchiseKm?: number;
  totalMonthlyCost?: number;
  monthlyPrice?: number;
  dailyRate?: number;
  excessKmRate?: number;
  extraTripRate?: number;
  taxesTotalPct?: number;
  // Gestão
  status?: CostSimulationStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvalNotes?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

const BASE_URL = '/api/cost-simulations';

export const costSimulationService = {
  getAll: async (): Promise<CostSimulation[]> => {
    const { data } = await api.get<CostSimulation[]>(BASE_URL);
    return Array.isArray(data) ? data : [];
  },

  getById: async (id: string): Promise<CostSimulation> => {
    const { data } = await api.get<CostSimulation>(`${BASE_URL}/${id}`);
    return data;
  },

  getByClient: async (clientId: string): Promise<CostSimulation[]> => {
    const { data } = await api.get<CostSimulation[]>(`${BASE_URL}/client/${clientId}`);
    return Array.isArray(data) ? data : [];
  },

  create: async (simulation: CostSimulation): Promise<CostSimulation> => {
    const { data } = await api.post<CostSimulation>(BASE_URL, simulation);
    return data;
  },

  update: async (id: string, simulation: CostSimulation): Promise<CostSimulation> => {
    const { data } = await api.put<CostSimulation>(`${BASE_URL}/${id}`, simulation);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}/${id}`);
  },

  submitForApproval: async (id: string): Promise<CostSimulation> => {
    const { data } = await api.post<CostSimulation>(`${BASE_URL}/${id}/submit`);
    return data;
  },

  approve: async (id: string, approvedBy: string, notes?: string): Promise<CostSimulation> => {
    const { data } = await api.post<CostSimulation>(`${BASE_URL}/${id}/approve`, {
      approvedBy,
      notes,
    });
    return data;
  },

  reject: async (id: string, approvedBy: string, notes?: string): Promise<CostSimulation> => {
    const { data } = await api.post<CostSimulation>(`${BASE_URL}/${id}/reject`, {
      approvedBy,
      notes,
    });
    return data;
  },
};

/**
 * Motor de cálculo espelhado no backend para pré-visualização em tempo real.
 * Fórmulas do PRD Módulo 1 (idênticas a CostSimulationService.calculate).
 */
export function calculateSimulation(s: CostSimulation): {
  fixedDriverCost: number;
  totalFixedCost: number;
  variableCostPerKm: number;
  franchiseKm: number;
  totalMonthlyCost: number;
  monthlyPrice: number;
  dailyRate: number;
  excessKmRate: number;
  extraTripRate: number;
  taxesTotalPct: number;
  productiveKm: number;
} {
  const category = VEHICLE_CATEGORIES.find((c) => c.value === s.vehicleCategory) ?? VEHICLE_CATEGORIES[0];
  const nvl = (v?: number) => (typeof v === 'number' && isFinite(v) ? v : 0);

  // 1. CV/KM = (Coef Diesel × Preço Litro) + Man/KM + Pneus/KM + Lub/KM + Peças/KM
  const dieselPerKm = category.coefficient * nvl(s.dieselPrice);
  const cvPerKm =
    dieselPerKm + nvl(s.maintenancePerKm) + nvl(s.tiresPerKm) + nvl(s.lubricantsPerKm) + nvl(s.partsPerKm);

  // 2. KM produtivo mensal
  const productiveKm = nvl(s.dailyKm) * Math.max(1, s.operatingDays || 22);

  // 3. Franquia = KM produtivo × fator (padrão 1,10)
  const franchiseKm = productiveKm * (s.productivityFactor || 1.1);

  // 4. Custo fixo de mão de obra
  const driverCost = nvl(s.baseSalary) * (1 + nvl(s.payrollChargesPct)) + nvl(s.mealAllowance) + nvl(s.healthPlanCost);
  const drivers = Math.max(1, Math.min(3, s.driverCount || 1));
  const fixedDriverCost = driverCost * drivers;

  const totalFixedCost = fixedDriverCost + nvl(s.fixedCosts);

  // 5. CTM = Fixo + (Franquia × CV/KM)
  const totalMonthlyCost = totalFixedCost + franchiseKm * cvPerKm;

  // 6. Impostos
  const taxes =
    nvl(s.issPct) + nvl(s.icmsPct) + nvl(s.pisPct) + nvl(s.cofinsPct) + nvl(s.irpjPct) + nvl(s.csllPct);

  // 7. Preço mensal
  const markup = nvl(s.profitMarginPct) + nvl(s.bdiPct);
  const divisor = 1 - taxes;
  const monthlyPrice = divisor > 0 ? (totalMonthlyCost * (1 + markup)) / divisor : totalMonthlyCost * (1 + markup);

  // 8. Diária
  const dailyRate = monthlyPrice / Math.max(1, s.operatingDays || 22);

  // 9. Tarifa KM excedente
  const excessKmRate = productiveKm > 0 ? (totalMonthlyCost / productiveKm) * (1 + taxes) : 0;

  // 10. Viagem extra
  const extraTripRate = dailyRate * (1 + nvl(s.extraTripMarginPct));

  return {
    fixedDriverCost,
    totalFixedCost,
    variableCostPerKm: cvPerKm,
    franchiseKm,
    totalMonthlyCost,
    monthlyPrice,
    dailyRate,
    excessKmRate,
    extraTripRate,
    taxesTotalPct: taxes,
    productiveKm,
  };
}
