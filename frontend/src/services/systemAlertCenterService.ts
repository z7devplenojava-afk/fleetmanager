import api from '@/lib/axios';

export type AlertEntityType = 'VEHICLE' | 'DRIVER' | 'COMPANY';
export type AlertCategory =
  | 'PREVENTIVE'
  | 'VEHICLE_DOCUMENT'
  | 'DRIVER_DOCUMENT'
  | 'TIRE_CHANGE'
  | 'OIL_CHANGE'
  | 'COMPANY_DOCUMENT';
export type AlertPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SystemAlertItem {
  id: string;
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
  visibleScopes: AlertEntityType[];
  alerts: SystemAlertItem[];
}

class SystemAlertCenterService {
  async getAlerts(): Promise<SystemAlertCenterResponse> {
    const response = await api.get<SystemAlertCenterResponse>('/api/system-alerts');
    return response.data;
  }
}

export default new SystemAlertCenterService();

