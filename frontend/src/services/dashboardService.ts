import api from '@/lib/axios';

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  activeContracts: number;
  monthlyRevenue: number;
  totalEquipment: number;
  pendingTasks: number;
  totalAlerts: number;
  unreadAlerts: number;
  lastUpdate: string;
}

export interface ScheduleSummary {
  totalSchedules: number;
  confirmedSchedules: number;
  pendingSchedules: number;
  cancelledSchedules: number;
  dayShifts: number;
  nightShifts: number;
  mixedShifts: number;
  totalEmployees: number;
  totalLocations: number;
  expectedAbsences: number;
}

export interface OperationalSummary {
  totalEmployees: number;
  activeEmployees: number;
  onDutyEmployees: number;
  absentEmployees: number;
  totalWorkPosts: number;
  activeWorkPosts: number;
  totalEquipment: number;
  activeEquipment: number;
  pendingMaintenance: number;
  totalOccurrences: number;
  openOccurrences: number;
  resolvedOccurrences: number;
}

export interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | string;
  createdAt: string;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
}

class DashboardService {
  /**
   * Formata números para exibição
   */
  formatNumber(value: number | null | undefined): string {
    if (value == null || isNaN(Number(value))) return '0';
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  /**
   * Formata valores monetários para exibição
   */
  formatCurrency(value: number | null | undefined): string {
    if (value == null || isNaN(Number(value))) value = 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Busca resumo geral do dashboard
   */
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      console.log('🔗 Buscando resumo do dashboard no backend');
      const response = await api.get('/api/dashboard/summary');
      console.log('✅ Resumo do dashboard carregado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar resumo do dashboard:', error);
      throw new Error('Falha ao conectar com o servidor de dashboard');
    }
  }

  /**
   * Busca estatísticas rápidas para widgets
   */
  async getQuickStats(): Promise<DashboardSummary> {
    try {
      console.log('🔗 Buscando estatísticas rápidas no backend');
      const response = await api.get('/api/dashboard/stats/quick');
      console.log('✅ Estatísticas rápidas carregadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas rápidas:', error);
      throw new Error('Falha ao conectar com o servidor de estatísticas');
    }
  }

  /**
   * Busca resumo das escalas de trabalho
   */
  async getScheduleSummary(): Promise<ScheduleSummary> {
    try {
      console.log('🔗 Buscando resumo das escalas no backend');
      // Por enquanto, vamos calcular baseado nos dados das escalas
      const response = await api.get('/api/schedules');
      const schedules = response.data;
      
      const summary: ScheduleSummary = {
        totalSchedules: schedules.length,
        confirmedSchedules: schedules.filter((s: any) => s.status === 'CONFIRMED').length,
        pendingSchedules: schedules.filter((s: any) => s.status === 'PENDING').length,
        cancelledSchedules: schedules.filter((s: any) => s.status === 'CANCELLED').length,
        dayShifts: schedules.filter((s: any) => s.shift === 'DAY').length,
        nightShifts: schedules.filter((s: any) => s.shift === 'NIGHT').length,
        mixedShifts: schedules.filter((s: any) => s.shift === 'MIXED').length,
        totalEmployees: new Set(schedules.map((s: any) => s.employee?.id)).size,
        totalLocations: new Set(schedules.map((s: any) => s.location?.id)).size,
        expectedAbsences: 0 // TODO: Implementar quando tivermos dados de ausências
      };
      
      console.log('✅ Resumo das escalas calculado:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Erro ao buscar resumo das escalas:', error);
      throw new Error('Falha ao conectar com o servidor de escalas');
    }
  }

  /**
   * Busca resumo operacional
   */
  async getOperationalSummary(): Promise<OperationalSummary> {
    try {
      console.log('🔗 Buscando resumo operacional no backend');
      
      // Buscar dados de múltiplas APIs em paralelo
      const [employeesResponse, workPostsResponse, equipmentResponse, occurrencesResponse] = await Promise.all([
        api.get('/api/employees/count').catch(() => ({ data: { count: 0 } })),
        api.get('/api/work-posts/stats/count').catch(() => ({ data: { totalWorkPosts: 0, activeWorkPosts: 0 } })),
        api.get('/api/equipments/summary').catch(() => ({ data: { totalEquipments: 0, activeEquipments: 0 } })),
        api.get('/api/occurrences').catch(() => ({ data: [] }))
      ]);

      const employeesCount = employeesResponse.data.count || 0;
      const workPostsData = workPostsResponse.data;
      const equipmentData = equipmentResponse.data;
      const occurrences = occurrencesResponse.data || [];

      const summary: OperationalSummary = {
        totalEmployees: employeesCount,
        activeEmployees: Math.floor(employeesCount * 0.9), // Estimativa
        onDutyEmployees: Math.floor(employeesCount * 0.7), // Estimativa
        absentEmployees: Math.floor(employeesCount * 0.1), // Estimativa
        totalWorkPosts: workPostsData.totalWorkPosts || 0,
        activeWorkPosts: workPostsData.activeWorkPosts || 0,
        totalEquipment: equipmentData.totalEquipments || 0,
        activeEquipment: equipmentData.activeEquipments || 0,
        pendingMaintenance: equipmentData.inMaintenanceEquipments || 0,
        totalOccurrences: occurrences.length,
        openOccurrences: occurrences.filter((o: any) => o.status === 'open' || o.status === 'investigando').length,
        resolvedOccurrences: occurrences.filter((o: any) => o.status === 'resolved' || o.status === 'resolvida').length
      };

      console.log('✅ Resumo operacional calculado:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Erro ao buscar resumo operacional:', error);
      throw new Error('Falha ao conectar com o servidor operacional');
    }
  }

  /**
   * Verifica saúde do dashboard
   */
  async getDashboardHealth(): Promise<{ status: string; timestamp: string; service: string }> {
    try {
      console.log('🔗 Verificando saúde do dashboard');
      const response = await api.get('/api/dashboard/health');
      console.log('✅ Saúde do dashboard verificada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao verificar saúde do dashboard:', error);
      throw new Error('Falha ao verificar saúde do dashboard');
    }
  }

  /**
   * Busca notificações do sistema (deferido/assíncrono)
   */
  async getSystemAlerts(): Promise<SystemAlert[]> {
    try {
      const response = await api.get('/api/dashboard/alerts');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Falha ao buscar alerts, retornando vazio:', error);
      return [];
    }
  }

  /**
   * Busca atividades recentes (deferido/assíncrono)
   */
  async getRecentActivities(): Promise<RecentActivity[]> {
    try {
      const response = await api.get('/api/dashboard/activities');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Falha ao buscar atividades, retornando vazio:', error);
      return [];
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;