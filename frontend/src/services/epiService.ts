import api from '@/lib/axios';
import { EPI, EPIType, EPIStatus } from '../types/epi';

// Tipos para a API
interface EPIAPI {
  id: number;
  name: string;
  description?: string;
  type: 'HELMET' | 'GLOVES' | 'SAFETY_GLASSES' | 'SAFETY_SHOES' | 'UNIFORM' | 'RESPIRATOR' | 'OTHER';
  brand: string;
  model: string;
  size?: string;
  color?: string;
  certification: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'EXPIRED';
  quantity: number;
  availableQuantity: number;
  unitPrice: number;
  supplier: string;
  purchaseDate: string;
  expiryDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EPIAssignmentAPI {
  id: number;
  epiId: number;
  epiName: string;
  employeeId: number;
  employeeName: string;
  assignedDate: string;
  returnDate?: string;
  status: 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';
  assignedBy: string;
  returnedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

class EPIService {
  // Buscar todos os EPIs
  async getEPIs(filters?: {
    type?: EPIType;
    status?: EPIStatus;
    supplier?: string;
  }): Promise<EPI[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.supplier) params.append('supplier', filters.supplier);

      const url = `/epis${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      return response.data.map((epi: EPIAPI) => ({
        id: epi.id,
        name: epi.name,
        description: epi.description,
        type: epi.type,
        brand: epi.brand,
        model: epi.model,
        size: epi.size,
        color: epi.color,
        certification: epi.certification,
        status: epi.status,
        quantity: epi.quantity,
        availableQuantity: epi.availableQuantity,
        unitPrice: epi.unitPrice,
        supplier: epi.supplier,
        purchaseDate: epi.purchaseDate,
        expiryDate: epi.expiryDate,
        lastMaintenanceDate: epi.lastMaintenanceDate,
        nextMaintenanceDate: epi.nextMaintenanceDate,
        location: epi.location,
        notes: epi.notes,
        createdAt: epi.createdAt,
        updatedAt: epi.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar EPIs:', error);
      return this.getMockEPIs();
    }
  }

  // Buscar EPI por ID
  async getEPI(id: number): Promise<EPI | null> {
    try {
      const response = await api.get(`/epis/${id}`);
      const epi: EPIAPI = response.data;
      
      return {
        id: epi.id,
        name: epi.name,
        description: epi.description,
        type: epi.type,
        brand: epi.brand,
        model: epi.model,
        size: epi.size,
        color: epi.color,
        certification: epi.certification,
        status: epi.status,
        quantity: epi.quantity,
        availableQuantity: epi.availableQuantity,
        unitPrice: epi.unitPrice,
        supplier: epi.supplier,
        purchaseDate: epi.purchaseDate,
        expiryDate: epi.expiryDate,
        lastMaintenanceDate: epi.lastMaintenanceDate,
        nextMaintenanceDate: epi.nextMaintenanceDate,
        location: epi.location,
        notes: epi.notes,
        createdAt: epi.createdAt,
        updatedAt: epi.updatedAt
      };
    } catch (error) {
      console.error('Erro ao buscar EPI:', error);
      return null;
    }
  }

  // Criar novo EPI
  async createEPI(epi: Omit<EPI, 'id' | 'createdAt' | 'updatedAt'>): Promise<EPI> {
    try {
      const response = await api.post('/epis', epi);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar EPI:', error);
      throw new Error('Erro ao criar EPI');
    }
  }

  // Atualizar EPI
  async updateEPI(id: number, epi: Partial<EPI>): Promise<EPI> {
    try {
      const response = await api.put(`/epis/${id}`, epi);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar EPI:', error);
      throw new Error('Erro ao atualizar EPI');
    }
  }

  // Deletar EPI
  async deleteEPI(id: number): Promise<void> {
    try {
      await api.delete(`/epis/${id}`);
    } catch (error) {
      console.error('Erro ao deletar EPI:', error);
      throw new Error('Erro ao deletar EPI');
    }
  }

  // Buscar atribuições de EPIs
  async getEPIAssignments(filters?: {
    epiId?: number;
    employeeId?: number;
    status?: 'ASSIGNED' | 'RETURNED' | 'LOST' | 'DAMAGED';
  }): Promise<EPIAssignmentAPI[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.epiId) params.append('epiId', filters.epiId.toString());
      if (filters?.employeeId) params.append('employeeId', filters.employeeId.toString());
      if (filters?.status) params.append('status', filters.status);

      const url = `/epi-assignments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar atribuições de EPIs:', error);
      return this.getMockEPIAssignments();
    }
  }

  // Atribuir EPI a funcionário
  async assignEPI(assignment: {
    epiId: number;
    employeeId: number;
    assignedBy: string;
    notes?: string;
  }): Promise<EPIAssignmentAPI> {
    try {
      const response = await api.post('/epi-assignments', assignment);
      return response.data;
    } catch (error) {
      console.error('Erro ao atribuir EPI:', error);
      throw new Error('Erro ao atribuir EPI');
    }
  }

  // Retornar EPI
  async returnEPI(assignmentId: number, returnedBy: string, notes?: string): Promise<EPIAssignmentAPI> {
    try {
      const response = await api.patch(`/epi-assignments/${assignmentId}/return`, {
        returnedBy,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao retornar EPI:', error);
      throw new Error('Erro ao retornar EPI');
    }
  }

  // Marcar EPI como perdido/danificado
  async markEPIAsLostOrDamaged(assignmentId: number, status: 'LOST' | 'DAMAGED', notes?: string): Promise<EPIAssignmentAPI> {
    try {
      const response = await api.patch(`/epi-assignments/${assignmentId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar EPI como perdido/danificado:', error);
      throw new Error('Erro ao marcar EPI como perdido/danificado');
    }
  }

  // Buscar estatísticas de EPIs
  async getEPIStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    expired: number;
    totalValue: number;
    assigned: number;
    available: number;
    byType: Record<EPIType, number>;
  }> {
    try {
      const response = await api.get('/epis/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return this.getMockEPIStats();
    }
  }

  // Dados mock para fallback
  private getMockEPIs(): EPI[] {
    return [
      {
        id: 1,
        name: 'Capacete de Segurança',
        description: 'Capacete de segurança industrial com regulagem',
        type: 'HELMET',
        brand: '3M',
        model: 'SecureFit Pro',
        size: 'M',
        color: 'Amarelo',
        certification: 'ABNT NBR 8221',
        status: 'ACTIVE',
        quantity: 50,
        availableQuantity: 35,
        unitPrice: 89.90,
        supplier: 'Segurança Total Ltda',
        purchaseDate: '2024-01-15',
        expiryDate: '2027-01-15',
        location: 'Almoxarifado A',
        notes: 'Capacetes com proteção UV',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Luvas de Proteção',
        description: 'Luvas resistentes a cortes e produtos químicos',
        type: 'GLOVES',
        brand: 'Ansell',
        model: 'HyFlex 11-800',
        size: 'L',
        color: 'Azul',
        certification: 'EN 388',
        status: 'ACTIVE',
        quantity: 200,
        availableQuantity: 150,
        unitPrice: 45.50,
        supplier: 'Proteção Industrial',
        purchaseDate: '2024-01-20',
        location: 'Almoxarifado B',
        notes: 'Luvas descartáveis',
        createdAt: '2024-01-20T14:20:00Z',
        updatedAt: '2024-01-20T14:20:00Z'
      },
      {
        id: 3,
        name: 'Óculos de Proteção',
        description: 'Óculos de segurança com proteção UV',
        type: 'SAFETY_GLASSES',
        brand: 'Uvex',
        model: 'Genesis XC',
        size: 'Único',
        color: 'Transparente',
        certification: 'ANSI Z87.1',
        status: 'ACTIVE',
        quantity: 100,
        availableQuantity: 75,
        unitPrice: 32.80,
        supplier: 'Ótica Segura',
        purchaseDate: '2024-01-10',
        location: 'Almoxarifado A',
        notes: 'Óculos com proteção contra riscos',
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-10T09:15:00Z'
      },
      {
        id: 4,
        name: 'Calçado de Segurança',
        description: 'Tênis de segurança com biqueira de aço',
        type: 'SAFETY_SHOES',
        brand: 'Safety',
        model: 'Steel Toe Pro',
        size: '42',
        color: 'Preto',
        certification: 'ABNT NBR 20345',
        status: 'ACTIVE',
        quantity: 80,
        availableQuantity: 60,
        unitPrice: 189.90,
        supplier: 'Calçados Seguros',
        purchaseDate: '2024-01-25',
        location: 'Almoxarifado C',
        notes: 'Calçados impermeáveis',
        createdAt: '2024-01-25T16:45:00Z',
        updatedAt: '2024-01-25T16:45:00Z'
      },
      {
        id: 5,
        name: 'Uniforme de Trabalho',
        description: 'Uniforme corporativo com tecido resistente',
        type: 'UNIFORM',
        brand: 'WorkWear',
        model: 'Corporate Pro',
        size: 'M',
        color: 'Azul Marinho',
        certification: 'ABNT NBR 15777',
        status: 'ACTIVE',
        quantity: 120,
        availableQuantity: 90,
        unitPrice: 75.00,
        supplier: 'Uniformes Express',
        purchaseDate: '2024-01-30',
        location: 'Almoxarifado A',
        notes: 'Uniformes com identificação da empresa',
        createdAt: '2024-01-30T11:20:00Z',
        updatedAt: '2024-01-30T11:20:00Z'
      }
    ];
  }

  private getMockEPIAssignments(): EPIAssignmentAPI[] {
    return [
      {
        id: 1,
        epiId: 1,
        epiName: 'Capacete de Segurança',
        employeeId: 1,
        employeeName: 'João Silva',
        assignedDate: '2024-01-15',
        status: 'ASSIGNED',
        assignedBy: 'admin@empresa.com',
        notes: 'Capacete para trabalho em altura',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        epiId: 2,
        epiName: 'Luvas de Proteção',
        employeeId: 2,
        employeeName: 'Maria Santos',
        assignedDate: '2024-01-20',
        returnDate: '2024-01-25',
        status: 'RETURNED',
        assignedBy: 'admin@empresa.com',
        returnedBy: 'maria.santos@empresa.com',
        notes: 'Luvas para manuseio de produtos químicos',
        createdAt: '2024-01-20T14:20:00Z',
        updatedAt: '2024-01-25T16:30:00Z'
      },
      {
        id: 3,
        epiId: 3,
        epiName: 'Óculos de Proteção',
        employeeId: 3,
        employeeName: 'Pedro Oliveira',
        assignedDate: '2024-01-10',
        status: 'ASSIGNED',
        assignedBy: 'admin@empresa.com',
        notes: 'Óculos para soldagem',
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-10T09:15:00Z'
      }
    ];
  }

  private getMockEPIStats() {
    return {
      total: 5,
      active: 5,
      inactive: 0,
      maintenance: 0,
      expired: 0,
      totalValue: 22450.00,
      assigned: 15,
      available: 410,
      byType: {
        HELMET: 1,
        GLOVES: 1,
        SAFETY_GLASSES: 1,
        SAFETY_SHOES: 1,
        UNIFORM: 1,
        RESPIRATOR: 0,
        OTHER: 0
      }
    };
  }
}

export default new EPIService(); 