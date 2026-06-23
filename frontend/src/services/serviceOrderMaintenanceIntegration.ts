import { ServiceOrder, ServiceOrderItem } from '@/types/inventory';
import { VehicleMaintenance, CreateVehicleMaintenanceDTO, MaintenanceType } from '@/types/fleet';
import maintenanceService from '@/services/maintenanceService';
import fleetService from '@/services/fleetService';

interface MaintenanceIntegrationData {
  serviceOrder: ServiceOrder;
  vehicleId: string;
  maintenanceType: MaintenanceType;
  provider?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

interface ServiceOrderToMaintenance {
  id: string;
  serviceOrderId: string;
  maintenanceId: string;
  integrationType: 'FULL' | 'PARTIAL' | 'REFERENCE';
  createdAt: string;
}

class ServiceOrderMaintenanceIntegration {
  private static instance: ServiceOrderMaintenanceIntegration;

  private constructor() {}

  static getInstance(): ServiceOrderMaintenanceIntegration {
    if (!ServiceOrderMaintenanceIntegration.instance) {
      ServiceOrderMaintenanceIntegration.instance = new ServiceOrderMaintenanceIntegration();
    }
    return ServiceOrderMaintenanceIntegration.instance;
  }

  /**
   * Converte uma Ordem de Serviço em uma Manutenção de Veículo
   */
  async convertServiceOrderToMaintenance(data: MaintenanceIntegrationData): Promise<{
    maintenance: VehicleMaintenance;
    integration: ServiceOrderToMaintenance;
  }> {
    try {
      // 1. Buscar informações do veículo
      const vehicle = await fleetService.getVehicleById(data.vehicleId);
      
      // 2. Calcular custo total da ordem de serviço
      const totalCost = data.serviceOrder.totalCost || 0;
      
      // 3. Criar descrição detalhada da manutenção
      const description = this.buildMaintenanceDescription(data.serviceOrder);
      
      // 4. Determinar prioridade baseada no custo e tipo
      const priority = data.priority || this.determinePriority(totalCost, data.maintenanceType);
      
      // 5. Criar DTO de manutenção
      const maintenanceData: CreateVehicleMaintenanceDTO = {
        vehicleId: data.vehicleId,
        date: new Date().toISOString().split('T')[0],
        maintenanceType: data.maintenanceType,
        description,
        cost: totalCost,
        provider: data.provider || 'Serviço Interno',
        mileage: vehicle.currentMileage,
        status: 'SCHEDULED',
        priority,
        notes: data.notes || `Gerado a partir da Ordem de Serviço ${data.serviceOrder.orderNumber}`
      };

      // 6. Criar manutenção
      const maintenance = await maintenanceService.createMaintenance(maintenanceData);

      // 7. Criar registro de integração
      const integration: ServiceOrderToMaintenance = {
        id: Date.now().toString(),
        serviceOrderId: data.serviceOrder.id,
        maintenanceId: maintenance.id,
        integrationType: 'FULL',
        createdAt: new Date().toISOString()
      };

      return {
        maintenance,
        integration
      };
    } catch (error) {
      console.error('Erro ao converter Ordem de Serviço para Manutenção:', error);
      throw new Error('Não foi possível converter a Ordem de Serviço para Manutenção');
    }
  }

  /**
   * Sincroniza atualizações entre Ordem de Serviço e Manutenção
   */
  async syncServiceOrderWithMaintenance(
    serviceOrderId: string, 
    maintenanceId: string
  ): Promise<void> {
    try {
      // Buscar dados atuais
      const serviceOrder = await this.getServiceOrderById(serviceOrderId);
      const maintenance = await maintenanceService.getMaintenanceById(maintenanceId);

      if (!serviceOrder || !maintenance) {
        throw new Error('Ordem de Serviço ou Manutenção não encontrada');
      }

      // Atualizar status da manutenção baseado no status da ordem de serviço
      const newMaintenanceStatus = this.mapServiceOrderStatusToMaintenance(serviceOrder.status);
      
      if (newMaintenanceStatus !== maintenance.status) {
        await maintenanceService.updateMaintenance(maintenanceId, {
          status: newMaintenanceStatus,
          notes: `Status atualizado via sincronização com Ordem de Serviço ${serviceOrder.orderNumber}`
        });
      }

      // Atualizar custo se necessário
      if (serviceOrder.totalCost !== maintenance.cost) {
        await maintenanceService.updateMaintenance(maintenanceId, {
          cost: serviceOrder.totalCost,
          notes: `Custo atualizado via sincronização com Ordem de Serviço ${serviceOrder.orderNumber}`
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar Ordem de Serviço com Manutenção:', error);
      throw error;
    }
  }

  /**
   * Busca manutenções relacionadas a uma ordem de serviço
   */
  async getMaintenancesByServiceOrder(serviceOrderId: string): Promise<VehicleMaintenance[]> {
    try {
      // Em um ambiente real, isso buscaria do backend
      // Por enquanto, vamos simular a busca
      const allMaintenances = await maintenanceService.getAllMaintenances();
      
      // Filtrar manutenções que possuem referência à ordem de serviço nas notas
      return allMaintenances.filter(maintenance => 
        maintenance.notes?.includes(`Ordem de Serviço`) || 
        maintenance.notes?.includes(`O.S.`)
      );
    } catch (error) {
      console.error('Erro ao buscar manutenções da Ordem de Serviço:', error);
      return [];
    }
  }

  /**
   * Busca ordens de serviço relacionadas a uma manutenção
   */
  async getServiceOrdersByMaintenance(maintenanceId: string): Promise<ServiceOrder[]> {
    try {
      // Em um ambiente real, isso buscaria do backend
      // Por enquanto, vamos retornar array vazio
      return [];
    } catch (error) {
      console.error('Erro ao buscar Ordens de Serviço da Manutenção:', error);
      return [];
    }
  }

  /**
   * Gera relatório de integração entre ordens de serviço e manutenções
   */
  async generateIntegrationReport(startDate?: string, endDate?: string): Promise<{
    totalIntegrations: number;
    serviceOrders: ServiceOrder[];
    maintenances: VehicleMaintenance[];
    summary: {
      totalCost: number;
      averageCost: number;
      byType: Record<string, number>;
      byStatus: Record<string, number>;
    };
  }> {
    try {
      // Buscar todas as manutenções no período
      const allMaintenances = await maintenanceService.getAllMaintenances();
      
      // Filtrar por data se fornecida
      const filteredMaintenances = allMaintenances.filter(maintenance => {
        if (!startDate && !endDate) return true;
        const maintenanceDate = new Date(maintenance.date);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return maintenanceDate >= start && maintenanceDate <= end;
      });

      // Buscar ordens de serviço relacionadas
      const relatedServiceOrders: ServiceOrder[] = [];
      
      // Simular busca de ordens de serviço relacionadas
      filteredMaintenances.forEach(maintenance => {
        if (maintenance.notes?.includes('Ordem de Serviço')) {
          // Extrair número da ordem de serviço das notas
          const match = maintenance.notes.match(/O\.S\. ([\w-]+)/);
          if (match) {
            // Aqui buscaríamos a ordem de serviço real
            // Por enquanto, vamos criar uma mock
            relatedServiceOrders.push({
              id: Date.now().toString(),
              orderNumber: match[1],
              clientId: 'mock-client',
              clientName: 'Cliente Mock',
              vehicleId: maintenance.vehicleId,
              vehiclePlate: maintenance.vehiclePlate,
              items: [],
              laborCost: 0,
              partsCost: 0,
              totalCost: maintenance.cost || 0,
              status: this.mapMaintenanceStatusToServiceOrder(maintenance.status),
              createdBy: 'Sistema',
              createdAt: maintenance.createdAt
            });
          }
        }
      });

      // Calcular resumo
      const totalCost = filteredMaintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
      const averageCost = filteredMaintenances.length > 0 ? totalCost / filteredMaintenances.length : 0;
      
      const byType = filteredMaintenances.reduce((acc, m) => {
        acc[m.maintenanceType] = (acc[m.maintenanceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const byStatus = filteredMaintenances.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalIntegrations: relatedServiceOrders.length,
        serviceOrders: relatedServiceOrders,
        maintenances: filteredMaintenances,
        summary: {
          totalCost,
          averageCost,
          byType,
          byStatus
        }
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de integração:', error);
      throw error;
    }
  }

  // Métodos privados auxiliares

  private buildMaintenanceDescription(serviceOrder: ServiceOrder): string {
    const parts = serviceOrder.items.filter(item => item.type === 'PART');
    const labor = serviceOrder.items.filter(item => item.type === 'LABOR');
    
    let description = `Manutenção gerada da O.S. ${serviceOrder.orderNumber}\n`;
    description += `Cliente: ${serviceOrder.clientName} | Veículo: ${serviceOrder.vehiclePlate}\n\n`;
    
    if (parts.length > 0) {
      description += 'Peças utilizadas:\n';
      parts.forEach(part => {
        description += `- ${part.description} (${part.quantity}x) - R$ ${part.totalPrice.toFixed(2)}\n`;
      });
    }
    
    if (labor.length > 0) {
      description += '\nServiços executados:\n';
      labor.forEach(service => {
        description += `- ${service.description} (${service.quantity}x) - R$ ${service.totalPrice.toFixed(2)}\n`;
      });
    }
    
    description += `\nCusto total: R$ ${serviceOrder.totalCost.toFixed(2)}`;
    
    if (serviceOrder.observations) {
      description += `\n\nObservações: ${serviceOrder.observations}`;
    }
    
    return description;
  }

  private determinePriority(cost: number, type: MaintenanceType): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    if (type === 'CORRECTIVE') return 'HIGH';
    if (cost > 1000) return 'HIGH';
    if (cost > 500) return 'MEDIUM';
    return 'LOW';
  }

  private mapServiceOrderStatusToMaintenance(serviceOrderStatus: string): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
    const statusMap: Record<string, 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'> = {
      'OPEN': 'SCHEDULED',
      'IN_PROGRESS': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
      'ON_HOLD': 'SCHEDULED'
    };
    return statusMap[serviceOrderStatus] || 'SCHEDULED';
  }

  private mapMaintenanceStatusToServiceOrder(maintenanceStatus: string): string {
    const statusMap: Record<string, string> = {
      'SCHEDULED': 'OPEN',
      'IN_PROGRESS': 'IN_PROGRESS',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED'
    };
    return statusMap[maintenanceStatus] || 'OPEN';
  }

  private async getServiceOrderById(id: string): Promise<ServiceOrder | null> {
    // Em um ambiente real, isso buscaria do serviço de ordens de serviço
    // Por enquanto, vamos retornar null
    return null;
  }
}

export default ServiceOrderMaintenanceIntegration.getInstance();
