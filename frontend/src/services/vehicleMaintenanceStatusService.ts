/**
 * Serviço de status de manutenção (próxima manutenção) por veículo.
 * Backend: GET /api/maintenance-plans/vehicle/{vehicleId}/status
 */

import api from '@/lib/axios';

export type MaintenanceAlertLevel = 'OK' | 'UPCOMING' | 'OVERDUE' | 'NO_SCHEDULE';

export interface MaintenancePlanStatus {
  planId: string;
  taskName: string;
  intervalKm?: number;
  intervalDays?: number;
  lastExecutionKm?: number;
  lastExecutionDate?: string;
  nextDueKm?: number;
  nextDueDate?: string;
  currentMileage?: number;
  kmRemaining?: number | null;
  kmSinceLast?: number | null;
  daysRemaining?: number | null;
  alertLevel: MaintenanceAlertLevel;
  message?: string;
}

export interface VehicleMaintenanceStatus {
  vehicleId: string;
  plate: string;
  model: string;
  brand: string;
  currentMileage?: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  plans: MaintenancePlanStatus[];
  overallAlertLevel: MaintenanceAlertLevel;
  mostCriticalPlan?: MaintenancePlanStatus | null;
  overdueCount: number;
  upcomingCount: number;
}

export interface VehicleMaintenanceAlert {
  vehicleId: string;
  plate: string;
  alertLevel: MaintenanceAlertLevel;
  overdueCount: number;
  upcomingCount: number;
  mostCriticalTaskName?: string;
  mostCriticalMessage?: string;
}

class VehicleMaintenanceStatusService {
  /**
   * Busca o status de próxima manutenção do veículo: kmRemaining,
   * daysRemaining e nível de alerta por plano, consolidados.
   */
  async getStatus(vehicleId: string): Promise<VehicleMaintenanceStatus> {
    const response = await api.get(`/api/maintenance-plans/vehicle/${vehicleId}/status`);
    return response.data;
  }

  /**
   * Alerta consolidado de todos os veículos (uma requisição) —
   * para badges em listagens.
   */
  async getAllAlerts(): Promise<VehicleMaintenanceAlert[]> {
    const response = await api.get('/api/maintenance-plans/status/all');
    return response.data || [];
  }
}

export default new VehicleMaintenanceStatusService();
