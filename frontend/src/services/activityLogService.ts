import api from '@/lib/axios';

export interface UserActivityLog {
  id: string;
  userId?: string;
  username: string;
  action: string;
  module?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  status: string;
  executionTimeMs?: number;
  durationMs?: number;
  createdAt: string;
  endedAt?: string;
}

export interface ActivityLogFilters {
  userId?: string;
  username?: string;
  action?: string;
  module?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export const activityLogService = {
  /**
   * Busca logs com filtros e paginação
   */
  async getLogs(filters: ActivityLogFilters = {}): Promise<{ content: UserActivityLog[]; totalElements: number; totalPages: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.username) params.append('username', filters.username);
      if (filters.action) params.append('action', filters.action);
      if (filters.module) params.append('module', filters.module);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.size !== undefined) params.append('size', filters.size.toString());
      
      const response = await api.get(`/activity-logs?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      throw new Error('Falha ao buscar logs de atividade');
    }
  },

  /**
   * Busca logs por usuário
   */
  async getLogsByUser(userId: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por usuário:', error);
      throw new Error('Falha ao buscar logs por usuário');
    }
  },

  /**
   * Busca logs por username
   */
  async getLogsByUsername(username: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/username/${username}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por username:', error);
      throw new Error('Falha ao buscar logs por username');
    }
  },

  /**
   * Busca logs por período
   */
  async getLogsByPeriod(startDate: string, endDate: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/period?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por período:', error);
      throw new Error('Falha ao buscar logs por período');
    }
  },

  /**
   * Busca logs por ação
   */
  async getLogsByAction(action: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/action/${action}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por ação:', error);
      throw new Error('Falha ao buscar logs por ação');
    }
  },

  /**
   * Busca logs por módulo
   */
  async getLogsByModule(module: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/module/${module}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por módulo:', error);
      throw new Error('Falha ao buscar logs por módulo');
    }
  },

  /**
   * Busca logs por status
   */
  async getLogsByStatus(status: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por status:', error);
      throw new Error('Falha ao buscar logs por status');
    }
  },

  /**
   * Busca logs por IP
   */
  async getLogsByIpAddress(ipAddress: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/ip/${ipAddress}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por IP:', error);
      throw new Error('Falha ao buscar logs por IP');
    }
  },

  /**
   * Busca logs por sessão
   */
  async getLogsBySessionId(sessionId: string): Promise<UserActivityLog[]> {
    try {
      const response = await api.get(`/activity-logs/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar logs por sessão:', error);
      throw new Error('Falha ao buscar logs por sessão');
    }
  },

  /**
   * Inicia o registro de uma atividade
   */
  async startActivity(username: string, action: string, module?: string, details?: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('action', action);
      if (module) params.append('module', module);
      if (details) params.append('details', details);
      
      await api.post(`/activity-logs/start?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao iniciar atividade:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  },

  /**
   * Finaliza uma atividade
   */
  async endActivity(logId: string, status: string): Promise<void> {
    try {
      await api.post(`/activity-logs/end/${logId}?status=${status}`);
    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  },

  /**
   * Registra uma atividade completa
   */
  async logActivity(username: string, action: string, module?: string, details?: string, status: string): Promise<void> {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('action', action);
      params.append('status', status);
      if (module) params.append('module', module);
      if (details) params.append('details', details);
      
      await api.post(`/activity-logs/log?${params.toString()}`);
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      // Não lança erro para não interromper o fluxo principal
    }
  },

  /**
   * Registra uma atividade de forma simplificada
   */
  async logSimpleActivity(action: string, module?: string, details?: string): Promise<void> {
    try {
      // Obtém o username do localStorage ou contexto de autenticação
      const username = localStorage.getItem('username') || 'unknown';
      await this.logActivity(username, action, module, details, 'SUCCESS');
    } catch (error) {
      console.error('Erro ao registrar atividade simples:', error);
    }
  }
};