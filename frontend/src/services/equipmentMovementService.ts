import axios from '@/lib/axios';
import { 
  EquipmentMovement, 
  CreateEquipmentMovementRequest 
} from '@/types/equipmentMovement';

class EquipmentMovementService {
  private readonly baseUrl = '/equipment-movements';

  // Criar nova movimentação
  async createMovement(data: CreateEquipmentMovementRequest): Promise<EquipmentMovement> {
    try {
      const response = await axios.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      throw error;
    }
  }

  // Processar devolução
  async returnEquipment(
    movementId: string, 
    conditionOnReturn?: string, 
    notes?: string
  ): Promise<EquipmentMovement> {
    try {
      const params = new URLSearchParams();
      if (conditionOnReturn) params.append('conditionOnReturn', conditionOnReturn);
      if (notes) params.append('notes', notes);
      
      const response = await axios.post(`${this.baseUrl}/${movementId}/return?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
      throw error;
    }
  }

  // Histórico de um equipamento
  async getEquipmentHistory(equipmentId: string): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/equipment/${equipmentId}/history`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar histórico do equipamento:', error);
      throw error;
    }
  }

  // Movimentações de um funcionário
  async getEmployeeMovements(employeeId: string): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações do funcionário:', error);
      throw error;
    }
  }

  // Movimentações de um posto de trabalho
  async getWorkPostMovements(workPostId: string): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/work-post/${workPostId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações do posto:', error);
      throw error;
    }
  }

  // Movimentações ativas (equipamentos em uso)
  async getActiveMovements(): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/active`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações ativas:', error);
      throw error;
    }
  }

  // Movimentações em atraso
  async getOverdueMovements(): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/overdue`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações em atraso:', error);
      throw error;
    }
  }

  // Movimentações vencendo em breve
  async getMovementsDueSoon(days: number = 7): Promise<EquipmentMovement[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/due-soon?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar movimentações vencendo:', error);
      throw error;
    }
  }

  // Métodos utilitários
  formatDateTime(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('pt-BR');
  }

  formatDate(date: string | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Em uso':
        return 'bg-blue-100 text-blue-800';
      case 'Devolvido':
        return 'bg-green-100 text-green-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      case 'Vencendo em breve':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getMovementTypeColor(type: string): string {
    switch (type) {
      case 'WITHDRAWAL':
      case 'PERMANENT_ASSIGNMENT':
        return 'bg-blue-100 text-blue-800';
      case 'RETURN':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'TRANSFER':
        return 'bg-purple-100 text-purple-800';
      case 'TEMPORARY_USE':
        return 'bg-orange-100 text-orange-800';
      case 'INSPECTION':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}

export const equipmentMovementService = new EquipmentMovementService();
export default equipmentMovementService; 