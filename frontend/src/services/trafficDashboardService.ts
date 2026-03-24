import api from '@/lib/axios';

export interface TrafficDashboardStats {
  /** Viagens ativas (escalas em andamento + turnos em andamento) */
  activeTrips: number;
  /** Total de embarques/escalas do dia */
  boardingsToday: number;
  /** Alertas geofence (atrasos, cancelamentos) */
  geofenceAlerts: number;
  /** Taxa de ocupação (%) */
  occupancyRate: number;
  /** Total de viagens (TravelTrips) ativas cadastradas */
  totalActiveTravelTrips: number;
  /** Motoristas em turno hoje */
  driversOnShiftToday: number;
  /** Total de escalas do dia */
  totalSchedulesToday: number;
  /** Rotas concluídas hoje */
  completedRoutesToday: number;
  /** Rotas em execução agora */
  routesInProgressNow: number;
  /** Motoristas disponíveis para realocação */
  driversAvailableForReallocation: number;
}

export const trafficDashboardService = {
  /**
   * Busca as estatísticas do dashboard de tráfego.
   */
  async getStats(): Promise<TrafficDashboardStats> {
    const response = await api.get('/api/traffic-dashboard/stats');
    return response.data;
  },
};
