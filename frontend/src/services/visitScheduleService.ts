import axios from '@/lib/axios';
import { 
  VisitSchedule, 
  CreateVisitScheduleDTO, 
  EfficiencyReport,
  RouteOptimizationStats 
} from '@/types/visit';

const BASE_URL = '/visit-schedules';

export const visitScheduleService = {
  /**
   * Cria uma nova escala otimizada
   */
  async createOptimizedSchedule(data: CreateVisitScheduleDTO): Promise<VisitSchedule> {
    const params = new URLSearchParams({
      supervisorId: data.supervisorId,
      clientId: data.clientId,
      scheduleDate: data.scheduleDate,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    data.unitIds.forEach(unitId => {
      params.append('unitIds', unitId);
    });

    if (data.observations) {
      params.append('observations', data.observations);
    }

    const response = await axios.post(`${BASE_URL}/create-optimized?${params.toString()}`);
    return response.data;
  },

  /**
   * Re-otimiza uma escala existente
   */
  async reoptimizeSchedule(scheduleId: string): Promise<VisitSchedule> {
    const response = await axios.post(`${BASE_URL}/${scheduleId}/reoptimize`);
    return response.data;
  },

  /**
   * Lista escalas por supervisor e período
   */
  async getSchedulesBySupervisor(
    supervisorId: string, 
    startDate: string, 
    endDate: string
  ): Promise<VisitSchedule[]> {
    const response = await axios.get(`${BASE_URL}/supervisor/${supervisorId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  /**
   * Lista escalas por cliente e período
   */
  async getSchedulesByClient(
    clientId: string, 
    startDate: string, 
    endDate: string
  ): Promise<VisitSchedule[]> {
    const response = await axios.get(`${BASE_URL}/client/${clientId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  /**
   * Inicia uma escala
   */
  async startSchedule(scheduleId: string): Promise<VisitSchedule> {
    const response = await axios.post(`${BASE_URL}/${scheduleId}/start`);
    return response.data;
  },

  /**
   * Completa uma escala
   */
  async completeSchedule(scheduleId: string): Promise<VisitSchedule> {
    const response = await axios.post(`${BASE_URL}/${scheduleId}/complete`);
    return response.data;
  },

  /**
   * Cancela uma escala
   */
  async cancelSchedule(scheduleId: string, reason: string): Promise<VisitSchedule> {
    const response = await axios.post(`${BASE_URL}/${scheduleId}/cancel`, null, {
      params: { reason }
    });
    return response.data;
  },

  /**
   * Gera relatório de eficiência
   */
  async getEfficiencyReport(
    supervisorId: string, 
    startDate: string, 
    endDate: string
  ): Promise<EfficiencyReport> {
    const response = await axios.get(`${BASE_URL}/efficiency-report/${supervisorId}`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

export default visitScheduleService;
