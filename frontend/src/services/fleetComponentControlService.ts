import api from '@/lib/axios';
import { FleetWorkOrder, MaintenanceType } from './fleetWorkOrderService';

export type ComponentControlType =
  | 'ALIGNMENT'
  | 'ENGINE_OIL'
  | 'PULLEY_BEARING'
  | 'STARTER'
  | 'ALTERNATOR'
  | 'ALTERNATOR_INSPECTION';

export const COMPONENT_CONTROLS_META: {
  type: ComponentControlType;
  label: string;
  shortLabel: string;
  defaultIntervalKm: number;
  recommendedMaintenanceType: MaintenanceType;
}[] = [
  {
    type: 'ALIGNMENT',
    label: 'Controle de Alinhamento',
    shortLabel: 'Alinhamento',
    defaultIntervalKm: 20000,
    recommendedMaintenanceType: MaintenanceType.PREVENTIVA,
  },
  {
    type: 'ENGINE_OIL',
    label: 'Troca de Óleo de Motor',
    shortLabel: 'Óleo de Motor',
    defaultIntervalKm: 25000,
    recommendedMaintenanceType: MaintenanceType.LUBRIFICACAO,
  },
  {
    type: 'PULLEY_BEARING',
    label: 'Rolamento da Polia',
    shortLabel: 'Rolamento Polia',
    defaultIntervalKm: 20000,
    recommendedMaintenanceType: MaintenanceType.PREVENTIVA,
  },
  {
    type: 'STARTER',
    label: 'Revisão - Arranque',
    shortLabel: 'Arranque',
    defaultIntervalKm: 200000,
    recommendedMaintenanceType: MaintenanceType.PREVENTIVA,
  },
  {
    type: 'ALTERNATOR_INSPECTION',
    label: 'Alternador - Inspeção Elétrica Rápida (15k)',
    shortLabel: 'Alternador 15k',
    defaultIntervalKm: 15000,
    recommendedMaintenanceType: MaintenanceType.PREVENTIVA,
  },
  {
    type: 'ALTERNATOR',
    label: 'Alternador - Revisão Geral / Troca (150k)',
    shortLabel: 'Alternador 150k',
    defaultIntervalKm: 150000,
    recommendedMaintenanceType: MaintenanceType.PREVENTIVA,
  },
];

export interface FleetComponentControlConfig {
  id?: string;
  companyId?: string;
  alignmentIntervalKm: number;
  engineOilIntervalKm: number;
  pulleyBearingIntervalKm: number;
  starterIntervalKm: number;
  alternatorIntervalKm: number;
  alternatorQuickCheckIntervalKm?: number;
  autoOpenPreventiveOs?: boolean;
  defaultPreventiveModel?: 'MODELO_1' | 'MODELO_2' | string;
  alertThresholdKm: number;
}

export interface FleetComponentControlRow {
  id?: string;
  vehicleId: string;
  fleetNumber?: string;
  plate: string;
  model?: string;
  controlType: ComponentControlType;
  controlLabel: string;
  workOrderId?: string;
  osNumber?: string;
  serviceDate?: string;
  serviceKm?: number;
  currentKm: number;
  nextDueKm: number;
  kmRemaining: number;
  intervalKm: number;
  oilFilterChanged?: boolean;
  dieselFilterChanged?: boolean;
  waterSeparatorFilterChanged?: boolean;
  airFilterChanged?: boolean;
  alertStatus: 'OVERDUE' | 'DUE_SOON' | 'OK';
  hasHistory?: boolean;
  notes?: string;
}

export interface FleetComponentControlDashboard {
  config: FleetComponentControlConfig;
  totalRows: number;
  overdueCount: number;
  dueSoonCount: number;
  okCount: number;
  rows: FleetComponentControlRow[];
  expiringAlerts: FleetComponentControlRow[];
}

export function buildWorkOrderPrefillFromComponentRow(
  row: FleetComponentControlRow,
): Partial<FleetWorkOrder> {
  const meta = COMPONENT_CONTROLS_META.find((m) => m.type === row.controlType);
  return {
    vehicleId: row.vehicleId,
    odometerIn: row.currentKm,
    maintenanceType: meta?.recommendedMaintenanceType || MaintenanceType.PREVENTIVA,
    preventiveControlTypes: [row.controlType],
    oilFilterChanged: row.controlType === 'ENGINE_OIL',
    dieselFilterChanged: row.controlType === 'ENGINE_OIL',
    waterSeparatorFilterChanged: row.controlType === 'ENGINE_OIL',
    airFilterChanged: row.controlType === 'ENGINE_OIL',
    anomaliesDescription: `${row.controlLabel} — Próx. vencimento: ${row.nextDueKm.toLocaleString('pt-BR')} km (KM atual: ${row.currentKm.toLocaleString('pt-BR')} km).`,
  };
}

class FleetComponentControlService {
  async getDashboard(params?: {
    controlType?: ComponentControlType | 'ALL';
    month?: number;
    year?: number;
  }): Promise<FleetComponentControlDashboard> {
    const queryParams: Record<string, any> = {};
    if (params?.controlType && params.controlType !== 'ALL') {
      queryParams.controlType = params.controlType;
    }
    if (params?.month) queryParams.month = params.month;
    if (params?.year) queryParams.year = params.year;
    const response = await api.get<FleetComponentControlDashboard>('/api/fleet-component-controls/dashboard', {
      params: queryParams,
    });
    return response.data;
  }

  async getAlerts(): Promise<FleetComponentControlRow[]> {
    const response = await api.get<FleetComponentControlRow[]>('/api/fleet-component-controls/alerts');
    return response.data;
  }

  async recordManual(payload: Partial<FleetComponentControlRow>): Promise<FleetComponentControlRow> {
    const response = await api.post<FleetComponentControlRow>('/api/fleet-component-controls/manual', payload);
    return response.data;
  }

  async updateConfig(config: FleetComponentControlConfig): Promise<FleetComponentControlConfig> {
    const response = await api.put<FleetComponentControlConfig>('/api/fleet-component-controls/config', config);
    return response.data;
  }

  async getHistory(vehicleId: string, controlType: ComponentControlType): Promise<any[]> {
    const response = await api.get(`/api/fleet-component-controls/history/${vehicleId}/${controlType}`);
    return response.data;
  }
}

export default new FleetComponentControlService();
