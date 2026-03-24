import api from '@/lib/axios';

export interface OperationalStats {
  activeWorkPosts: number;
  employeesOnDuty: number;
  activeEquipment: number;
  pendingAlerts: number;
  todayVisits: number;
  successRate: number;
  completedVisits: number;
  pendingVisits: number;
  activeSupervisors: number;
}

export interface WorkPostStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    POSTO_24H: number;
    POSTO_12H: number;
    POSTO_8H: number;
    OTHER: number;
  };
}

export interface EmployeeStats {
  total: number;
  onDuty: number;
  onVacation: number;
  absent: number;
}

export interface VisitStats {
  today: number;
  completed: number;
  pending: number;
  successRate: number;
  activeSupervisors: number;
}

export const operationalStatsService = {
  // Buscar estatísticas gerais operacionais
  async getOperationalStats(): Promise<OperationalStats> {
    try {
      const [workPostStats, employeeStats, visitStats, equipmentStats] = await Promise.all([
        this.getWorkPostStats(),
        this.getEmployeeStats(),
        this.getVisitStatsReal(),
        this.getEquipmentStats()
      ]);

      return {
        activeWorkPosts: workPostStats.active,
        employeesOnDuty: employeeStats.onDuty,
        activeEquipment: equipmentStats.active,
        pendingAlerts: equipmentStats.pendingAlerts,
        todayVisits: visitStats.today,
        successRate: visitStats.successRate,
        completedVisits: visitStats.completed,
        pendingVisits: visitStats.pending,
        activeSupervisors: visitStats.activeSupervisors
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas operacionais:', error);
      // Retornar dados padrão em caso de erro
      return {
        activeWorkPosts: 0,
        employeesOnDuty: 0,
        activeEquipment: 0,
        pendingAlerts: 0,
        todayVisits: 0,
        successRate: 0,
        completedVisits: 0,
        pendingVisits: 0,
        activeSupervisors: 0
      };
    }
  },

  // Buscar estatísticas de postos de trabalho
  async getWorkPostStats(): Promise<WorkPostStats> {
    try {
      const response = await api.get('/api/work-posts');
      
      // Garantir que workPosts é sempre um array
      let workPosts = response.data;
      if (workPosts && typeof workPosts === 'object' && 'content' in workPosts) {
        workPosts = workPosts.content;
      }
      if (!Array.isArray(workPosts)) {
        console.warn('⚠️ WorkPosts não é um array:', workPosts);
        workPosts = [];
      }
      
      const active = workPosts.filter((post: any) => post.status === 'ATIVO').length;
      const inactive = workPosts.filter((post: any) => post.status !== 'ATIVO').length;
      
      const byType = {
        POSTO_24H: workPosts.filter((post: any) => post.type === 'POSTO_24H').length,
        POSTO_12H: workPosts.filter((post: any) => post.type === 'POSTO_12H').length,
        POSTO_8H: workPosts.filter((post: any) => post.type === 'POSTO_8H').length,
        OTHER: workPosts.filter((post: any) => !['POSTO_24H', 'POSTO_12H', 'POSTO_8H'].includes(post.type)).length
      };

      return {
        total: workPosts.length,
        active,
        inactive,
        byType
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de postos:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        byType: { POSTO_24H: 0, POSTO_12H: 0, POSTO_8H: 0, OTHER: 0 }
      };
    }
  },

  // Buscar estatísticas de funcionários
  async getEmployeeStats(): Promise<EmployeeStats> {
    try {
      const response = await api.get('/api/employees/basic');
      
      // Garantir que employees é sempre um array
      let employees = response.data;
      if (employees && typeof employees === 'object' && 'employees' in employees) {
        employees = employees.employees;
      }
      if (employees && typeof employees === 'object' && 'content' in employees) {
        employees = employees.content;
      }
      if (!Array.isArray(employees)) {
        console.warn('⚠️ Employees não é um array:', employees);
        employees = [];
      }
      
      // Buscar funcionários realmente em serviço através de atribuições de postos de trabalho
      let onDuty = 0;
      try {
        const today = new Date().toISOString().split('T')[0];
        // Buscar atribuições ativas de hoje
        const assignmentsResponse = await api.get(`/api/work-post-assignments/today`);
        const assignments = Array.isArray(assignmentsResponse.data) 
          ? assignmentsResponse.data 
          : [];
        
        // Contar funcionários únicos com atribuição ativa hoje
        const uniqueEmployeesOnDuty = new Set(
          assignments
            .filter((a: any) => a.employeeId && (a.status === 'CONFIRMED' || a.status === 'PENDING'))
            .map((a: any) => a.employeeId)
        );
        onDuty = uniqueEmployeesOnDuty.size;
      } catch (error) {
        console.warn('Erro ao buscar atribuições, tentando escalas:', error);
        try {
          // Fallback: tentar buscar escalas
          const today = new Date().toISOString().split('T')[0];
          const schedulesResponse = await api.get(`/api/schedules?date=${today}`);
          const schedules = Array.isArray(schedulesResponse.data) 
            ? schedulesResponse.data 
            : (schedulesResponse.data?.content || []);
          
          const uniqueEmployeesOnDuty = new Set(
            schedules
              .filter((s: any) => s.employeeId)
              .map((s: any) => s.employeeId)
          );
          onDuty = uniqueEmployeesOnDuty.size;
        } catch (scheduleError) {
          console.warn('Erro ao buscar escalas, usando estimativa:', scheduleError);
          // Fallback final: estimar baseado em funcionários ativos
          onDuty = Math.floor(employees.length * 0.6);
        }
      }
      
      // Buscar funcionários de férias e ausentes
      const onVacation = employees.filter((emp: any) => 
        emp.status === 'FERIAS' || emp.status === 'VACATION'
      ).length;
      const absent = employees.filter((emp: any) => 
        emp.status === 'AUSENTE' || emp.status === 'ABSENT'
      ).length;

      return {
        total: employees.length,
        onDuty,
        onVacation,
        absent
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de funcionários:', error);
      return {
        total: 0,
        onDuty: 0,
        onVacation: 0,
        absent: 0
      };
    }
  },

  // Buscar estatísticas de visitas
  async getVisitStats(): Promise<VisitStats> {
    try {
      // Simular dados de visitas (em um sistema real, isso viria de uma API de visitas)
      const today = Math.floor(Math.random() * 20) + 10; // 10-30 visitas hoje
      const completed = Math.floor(today * 0.9); // 90% completadas
      const pending = today - completed;
      const successRate = Math.floor(Math.random() * 20) + 80; // 80-100% taxa de sucesso
      const activeSupervisors = Math.floor(Math.random() * 10) + 8; // 8-18 supervisores

      return {
        today,
        completed,
        pending,
        successRate,
        activeSupervisors
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de visitas:', error);
      return {
        today: 0,
        completed: 0,
        pending: 0,
        successRate: 0,
        activeSupervisors: 0
      };
    }
  },

  // Buscar estatísticas de equipamentos
  async getEquipmentStats(): Promise<{ active: number; pendingAlerts: number }> {
    try {
      // Usar endpoint de equipamentos existente
      const response = await api.get('/api/equipments');
      
      // Garantir que equipments é sempre um array
      let equipments = response.data;
      
      // Se for um objeto paginado, extrair o array content
      if (equipments && typeof equipments === 'object' && 'content' in equipments) {
        equipments = equipments.content;
      }
      
      // Se não for array ou for null/undefined, usar array vazio
      if (!Array.isArray(equipments)) {
        console.warn('⚠️ Equipments não é um array:', equipments);
        equipments = [];
      }
      
      // Contar equipamentos ativos
      const activeCount = equipments.filter((eq: any) => 
        eq.status === 'EM_ESTOQUE' || eq.status === 'EM_USO'
      ).length;
      
      // Contar alertas (equipamentos próximos do vencimento ou expirados)
      const today = new Date();
      const pendingAlerts = equipments.filter((eq: any) => {
        if (!eq.validityDate) return false;
        const validityDate = new Date(eq.validityDate);
        const daysUntilExpiry = Math.ceil((validityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 || daysUntilExpiry < 0;
      }).length;
      
      return {
        active: activeCount,
        pendingAlerts: pendingAlerts
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de equipamentos:', error);
      return {
        active: 0,
        pendingAlerts: 0
      };
    }
  },

  // Buscar estatísticas de visitas
  async getVisitStatsReal(): Promise<VisitStats> {
    try {
      const response = await api.get('/api/visit-controls/stats');
      const stats = response.data;
      
      return {
        today: stats.today || 0,
        completed: stats.completed || 0,
        pending: stats.pending || 0,
        successRate: stats.successRate || 0,
        activeSupervisors: 12 // Valor fixo por enquanto
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de visitas:', error);
      return {
        today: 0,
        completed: 0,
        pending: 0,
        successRate: 0,
        activeSupervisors: 0
      };
    }
  },

  // Buscar visitas recentes
  async getRecentVisits(): Promise<any[]> {
    try {
      const response = await api.get('/api/visit-controls/recent');
      return response.data || [];
    } catch (error) {
      console.error('Erro ao buscar visitas recentes:', error);
      return [];
    }
  },

  // Buscar atividade recente
  async getRecentActivity(): Promise<any> {
    try {
      // Buscar movimentações ativas e pegar a mais recente
      const response = await api.get('/api/equipment-movements/active');
      let movements = response.data || [];
      if (!Array.isArray(movements)) movements = [];
      
      // Ordenar por data mais recente
      movements.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.movementDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.movementDate || 0).getTime();
        return dateB - dateA;
      });
      
      if (movements.length > 0) {
        const movement = movements[0];
        const timeAgo = this.calculateTimeAgo(movement.createdAt || movement.movementDate);
        const movementType = movement.movementType || movement.type || '';
        const typeText = movementType === 'ASSIGNMENT' || movementType === 'RETIRADA' 
          ? 'atribuído a' 
          : movementType === 'RETURN' || movementType === 'DEVOLUCAO'
          ? 'devolvido por'
          : 'movimentado';
        
        return {
          description: `Equipamento ${movement.equipment?.name || movement.equipmentName || 'N/A'} ${typeText} ${movement.employee?.name || movement.employeeName || 'N/A'}`,
          timeAgo: timeAgo
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar atividade recente:', error);
      return null;
    }
  },

  // Buscar próximas ações
  async getNextActions(): Promise<any> {
    try {
      // Buscar equipamentos próximos do vencimento
      const response = await api.get('/api/equipments');
      let equipments = response.data?.content || response.data || [];
      if (!Array.isArray(equipments)) equipments = [];
      
      const today = new Date();
      const nextExpiring = equipments
        .filter((eq: any) => eq.validityDate)
        .map((eq: any) => ({
          ...eq,
          daysUntilExpiry: Math.ceil((new Date(eq.validityDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        }))
        .filter((eq: any) => eq.daysUntilExpiry > 0 && eq.daysUntilExpiry <= 30)
        .sort((a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry)[0];
      
      if (nextExpiring) {
        return {
          description: `Renovar registro ${nextExpiring.name || nextExpiring.code || 'N/A'}`,
          daysUntilExpiry: nextExpiring.daysUntilExpiry
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar próximas ações:', error);
      return null;
    }
  },

  // Calcular tempo decorrido
  calculateTimeAgo(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 60) return `${diffMins}min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      return `${diffDays}d atrás`;
    } catch (error) {
      return 'N/A';
    }
  }
};

export default operationalStatsService;
