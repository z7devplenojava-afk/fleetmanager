import { VehicleMaintenance, CreateVehicleMaintenanceDTO } from '@/types/fleet';
import api from '@/lib/axios';

class MaintenanceService {
  // Buscar todas as manutenções
  async getAllMaintenances(): Promise<VehicleMaintenance[]> {
    try {
      console.log('🔗 MaintenanceService: Buscando manutenções...');
      const response = await api.get('/api/maintenances');
      console.log('✅ MaintenanceService: Manutenções carregadas:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('❌ MaintenanceService: Erro ao buscar manutenções:', error);
      
      // Fallback com dados de exemplo para teste
      const fallbackData: VehicleMaintenance[] = [
        {
          id: '1',
          vehicleId: '1',
          vehiclePlate: 'ABC-1234',
          date: '2025-01-20',
          maintenanceType: 'PREVENTIVE',
          description: 'Manutenção preventiva programada - troca de óleo e filtros',
          cost: 450.00,
          provider: 'Oficina Central',
          mileage: 15000,
          status: 'SCHEDULED',
          priority: 'MEDIUM',
          notes: 'Verificar também o sistema de freios',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          vehicleId: '2',
          vehiclePlate: 'DEF-5678',
          date: '2025-01-18',
          maintenanceType: 'CORRECTIVE',
          description: 'Limpeza interna lavagem do motor, alinhamento e balanceamento',
          cost: 24999.98,
          provider: 'Auto Center Silva',
          mileage: 22000,
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          createdAt: '2024-01-16T14:30:00Z',
          updatedAt: '2024-01-17T09:15:00Z'
        }
      ];
      
      console.log('📱 MaintenanceService: Usando dados de fallback:', fallbackData.length);
      return fallbackData;
    }
  }

  // Buscar manutenção por ID
  async getMaintenanceById(id: string): Promise<VehicleMaintenance | null> {
    try {
      const response = await api.get(`/maintenances/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenção:', error);
      return null;
    }
  }

  // Buscar manutenções por veículo
  async getMaintenancesByVehicle(vehicleId: string): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get(`/maintenances/vehicle/${vehicleId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções do veículo:', error);
      return [];
    }
  }

  // Criar nova manutenção
  async createMaintenance(data: CreateVehicleMaintenanceDTO, files?: File[]): Promise<VehicleMaintenance> {
    try {
      if (files && files.length > 0) {
        // Usar endpoint com upload de arquivos
        const formData = new FormData();
        formData.append('vehicleId', data.vehicleId);
        formData.append('date', data.date);
        formData.append('maintenanceType', data.maintenanceType);
        formData.append('description', data.description);
        formData.append('status', data.status || 'SCHEDULED');
        formData.append('priority', data.priority || 'MEDIUM');
        
        if (data.cost) formData.append('cost', data.cost.toString());
        if (data.provider) formData.append('provider', data.provider);
        if (data.mileage) formData.append('mileage', data.mileage.toString());
        if (data.notes) formData.append('notes', data.notes);
        
        // Adicionar arquivos
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await api.post('/api/maintenances/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Usar endpoint padrão sem arquivos
        const response = await api.post('/api/maintenances', data);
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao criar manutenção:', error);
      throw new Error('Falha ao criar manutenção');
    }
  }

  // Atualizar manutenção
  async updateMaintenance(id: string, data: Partial<CreateVehicleMaintenanceDTO>, files?: File[]): Promise<VehicleMaintenance> {
    try {
      if (files && files.length > 0) {
        // Usar endpoint com upload de arquivos
        const formData = new FormData();
        formData.append('vehicleId', data.vehicleId!);
        formData.append('date', data.date!);
        formData.append('maintenanceType', data.maintenanceType!);
        formData.append('description', data.description!);
        formData.append('status', data.status || 'SCHEDULED');
        formData.append('priority', data.priority || 'MEDIUM');
        
        if (data.cost) formData.append('cost', data.cost.toString());
        if (data.provider) formData.append('provider', data.provider);
        if (data.mileage) formData.append('mileage', data.mileage.toString());
        if (data.notes) formData.append('notes', data.notes);
        
        // Adicionar arquivos para remoção
        if (data.removedPhotos) {
          data.removedPhotos.forEach(photo => {
            formData.append('removedPhotos', photo);
          });
        }
        if (data.removedDocuments) {
          data.removedDocuments.forEach(doc => {
            formData.append('removedDocuments', doc);
          });
        }
        
        // Adicionar novos arquivos
        files.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await api.put(`/maintenances/${id}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } else {
        // Usar endpoint padrão sem arquivos
        const response = await api.put(`/maintenances/${id}`, data);
        return response.data;
      }
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      throw new Error('Falha ao atualizar manutenção');
    }
  }

  // Deletar manutenção
  async deleteMaintenance(id: string): Promise<void> {
    try {
      await api.delete(`/maintenances/${id}`);
    } catch (error) {
      console.error('Erro ao deletar manutenção:', error);
      throw new Error('Falha ao deletar manutenção');
    }
  }

  // Buscar manutenções por status
  async getMaintenancesByStatus(status: string): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get(`/maintenances/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções por status:', error);
      return [];
    }
  }

  // Buscar manutenções por prioridade
  async getMaintenancesByPriority(priority: string): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get(`/maintenances/priority/${priority}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções por prioridade:', error);
      return [];
    }
  }

  // Buscar manutenções por tipo
  async getMaintenancesByType(type: string): Promise<VehicleMaintenance[]> {
    try {
      // Como não há endpoint específico para tipo, filtramos no frontend
      const allMaintenances = await this.getAllMaintenances();
      return allMaintenances.filter(m => m.maintenanceType === type);
    } catch (error) {
      console.error('Erro ao buscar manutenções por tipo:', error);
      return [];
    }
  }

  // Buscar manutenções por período
  async getMaintenancesByPeriod(startDate: string, endDate: string): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get('/api/maintenances/period', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções por período:', error);
      return [];
    }
  }

  // Buscar manutenções agendadas para hoje
  async getScheduledForToday(): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get('/api/maintenances/scheduled/today');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções agendadas para hoje:', error);
      return [];
    }
  }

  // Buscar manutenções urgentes
  async getUrgentMaintenances(): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get('/api/maintenances/urgent');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções urgentes:', error);
      return [];
    }
  }

  // Buscar manutenções vencidas
  async getOverdueMaintenances(): Promise<VehicleMaintenance[]> {
    try {
      const response = await api.get('/api/maintenances/overdue');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar manutenções vencidas:', error);
      return [];
    }
  }

  // Estatísticas de manutenção
  async getMaintenanceStats(): Promise<{
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    urgent: number;
    high: number;
    totalCost: number;
    averageCost: number;
  }> {
    try {
      const response = await api.get('/api/maintenances/stats');
      const stats = response.data;
      
      // Calcular custo total e médio (se não estiver disponível no backend)
      const allMaintenances = await this.getAllMaintenances();
      const totalCost = allMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
      const averageCost = stats.total > 0 ? totalCost / stats.total : 0;

      return {
        total: stats.total,
        scheduled: stats.scheduled,
        inProgress: stats.inProgress,
        completed: stats.completed,
        cancelled: stats.cancelled,
        urgent: stats.urgent,
        high: stats.high,
        totalCost,
        averageCost
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de manutenção:', error);
      return {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        urgent: 0,
        high: 0,
        totalCost: 0,
        averageCost: 0
      };
    }
  }

  // Atualizar apenas o status
  async updateMaintenanceStatus(id: string, status: string): Promise<VehicleMaintenance> {
    try {
      const response = await api.patch(`/maintenances/${id}/status?status=${status}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status da manutenção:', error);
      throw new Error('Falha ao atualizar status da manutenção');
    }
  }

  // Atualizar apenas a prioridade
  async updateMaintenancePriority(id: string, priority: string): Promise<VehicleMaintenance> {
    try {
      const response = await api.patch(`/maintenances/${id}/priority?priority=${priority}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar prioridade da manutenção:', error);
      throw new Error('Falha ao atualizar prioridade da manutenção');
    }
  }
}

export default new MaintenanceService();
