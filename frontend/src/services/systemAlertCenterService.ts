import api from '@/lib/axios';

export type AlertEntityType = 'VEHICLE' | 'DRIVER' | 'COMPANY' | 'FINANCIAL' | 'EMPLOYEE';
export type AlertModule = 'ALL' | 'FINANCEIRO' | 'RH' | 'FROTA' | 'EMPRESA';
export type AlertCategory =
  | 'PREVENTIVE'
  | 'VEHICLE_DOCUMENT'
  | 'DRIVER_DOCUMENT'
  | 'TIRE_CHANGE'
  | 'OIL_CHANGE'
  | 'COMPANY_DOCUMENT'
  | 'FINANCIAL_PAYABLE'
  | 'FINANCIAL_RECEIVABLE'
  | 'RH_VACATION'
  | 'RH_PROBATION'
  | 'RH_EXAM';
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SystemAlertItem {
  id: string;
  module?: string;
  entityType: AlertEntityType;
  category: AlertCategory;
  categoryLabel: string;
  priority: AlertPriority;
  priorityRank: number;
  subjectTitle: string;
  subjectSubtitle?: string;
  dueDate?: string;
  daysRemaining?: number;
  kmRemaining?: number;
  statusText: string;
  routeTo: string;
}

export interface SystemAlertCenterResponse {
  totalCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  vehicleCount: number;
  driverCount: number;
  companyCount: number;
  financialCount?: number;
  rhCount?: number;
  visibleScopes: string[];
  alerts: SystemAlertItem[];
}

class SystemAlertCenterService {
  async getAlerts(module?: string): Promise<SystemAlertCenterResponse> {
    const params = module && module !== 'ALL' ? { module } : {};
    const response = await api.get<SystemAlertCenterResponse>('/api/system-alerts', { params });
    return response.data;
  }
}

export default new SystemAlertCenterService();

