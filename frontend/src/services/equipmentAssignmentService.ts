// import { api } from './api';

// Mock da API para desenvolvimento
const api = {
  post: async (url: string, data: any) => {
    console.log('POST', url, data);
    return { data: { id: '1', ...data, assignedAt: new Date().toISOString() } };
  },
  get: async (url: string) => {
    console.log('GET', url);
    return { data: [] };
  }
};

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  employeeId: string;
  assignedAt: string;
  assignedBy: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

export interface AssignEquipmentRequest {
  equipmentId: string;
  employeeId: string;
  notes?: string;
}

export interface UnassignEquipmentRequest {
  equipmentId: string;
  reason?: string;
}

export interface EquipmentAssignmentHistory {
  id: string;
  equipmentId: string;
  employeeId: string;
  employeeName: string;
  action: 'ASSIGNED' | 'UNASSIGNED' | 'TRANSFERRED';
  assignedAt: string;
  unassignedAt?: string;
  assignedBy: string;
  notes?: string;
}

class EquipmentAssignmentService {
  private baseUrl = '/equipment-assignments';

  /**
   * Atribuir equipamento a um funcionário
   */
  async assignEquipment(data: AssignEquipmentRequest): Promise<EquipmentAssignment> {
    try {
      const response = await api.post(`${this.baseUrl}/assign`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atribuir equipamento:', error);
      throw error;
    }
  }

  /**
   * Remover atribuição de equipamento
   */
  async unassignEquipment(data: UnassignEquipmentRequest): Promise<void> {
    try {
      await api.post(`${this.baseUrl}/unassign`, data);
    } catch (error) {
      console.error('Erro ao remover atribuição de equipamento:', error);
      throw error;
    }
  }

  /**
   * Transferir equipamento para outro funcionário
   */
  async transferEquipment(
    equipmentId: string, 
    fromEmployeeId: string, 
    toEmployeeId: string, 
    notes?: string
  ): Promise<EquipmentAssignment> {
    try {
      const response = await api.post(`${this.baseUrl}/transfer`, {
        equipmentId,
        fromEmployeeId,
        toEmployeeId,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao transferir equipamento:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de atribuições de um equipamento
   */
  async getEquipmentAssignmentHistory(equipmentId: string): Promise<EquipmentAssignmentHistory[]> {
    try {
      const response = await api.get(`${this.baseUrl}/equipment/${equipmentId}/history`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter histórico de atribuições:', error);
      throw error;
    }
  }

  /**
   * Obter equipamentos atribuídos a um funcionário
   */
  async getEmployeeAssignedEquipment(employeeId: string): Promise<EquipmentAssignment[]> {
    try {
      const response = await api.get(`${this.baseUrl}/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter equipamentos do funcionário:', error);
      throw error;
    }
  }

  /**
   * Obter todas as atribuições ativas
   */
  async getActiveAssignments(): Promise<EquipmentAssignment[]> {
    try {
      const response = await api.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter atribuições ativas:', error);
      throw error;
    }
  }

  /**
   * Verificar se um equipamento está disponível para atribuição
   */
  async isEquipmentAvailable(equipmentId: string): Promise<boolean> {
    try {
      const response = await api.get(`${this.baseUrl}/equipment/${equipmentId}/availability`);
      return response.data.available;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do equipamento:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas de atribuições
   */
  async getAssignmentStats(): Promise<{
    totalAssignments: number;
    activeAssignments: number;
    availableEquipment: number;
    assignedEquipment: number;
  }> {
    try {
      const response = await api.get(`${this.baseUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de atribuições:', error);
      throw error;
    }
  }

  /**
   * Formatar data para exibição
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatar data relativa (ex: "há 2 dias")
   */
  formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Hoje';
    } else if (diffInDays === 1) {
      return 'Ontem';
    } else if (diffInDays < 7) {
      return `Há ${diffInDays} dias`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `Há ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `Há ${months} mês${months > 1 ? 'es' : ''}`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `Há ${years} ano${years > 1 ? 's' : ''}`;
    }
  }
}

const equipmentAssignmentService = new EquipmentAssignmentService();
export { equipmentAssignmentService };
export default equipmentAssignmentService;
