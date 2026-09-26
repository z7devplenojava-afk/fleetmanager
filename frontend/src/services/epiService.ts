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
      // Usar o novo endpoint de estoque que retorna dados no formato correto
      const url = `/api/sst/epis/stock-inventory`;
      const response = await api.get(url);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Resposta inválida do backend, usando dados mock');
        return this.getMockEPIs();
      }

      if (response.data.length === 0) {
        console.warn('Nenhum EPI retornado do backend, usando dados mock');
        return this.getMockEPIs();
      }
      
      // O backend já retorna no formato correto via EPIStockDTO
      let epis = response.data.map((epi: any) => ({
        id: typeof epi.id === 'string' ? parseInt(epi.id.replace(/-/g, '').substring(0, 8), 16) : (epi.id || 0),
        uuid: typeof epi.id === 'string' ? epi.id : undefined, // Manter UUID original
        stockItemId: epi.stockItemId || undefined,
        name: epi.name || 'EPI',
        description: epi.description || '',
        type: epi.type || 'OTHER',
        brand: epi.brand || 'N/A',
        model: epi.model || 'N/A',
        size: epi.size,
        color: epi.color,
        certification: epi.certification || '',
        status: epi.status || 'ACTIVE',
        quantity: epi.quantity || 0,
        availableQuantity: epi.availableQuantity || 0,
        unitPrice: epi.unitPrice || 0,
        supplier: epi.supplier || 'N/A',
        purchaseDate: epi.purchaseDate || new Date().toISOString().split('T')[0],
        expiryDate: epi.expiryDate,
        lastMaintenanceDate: epi.lastMaintenanceDate,
        nextMaintenanceDate: epi.nextMaintenanceDate,
        location: epi.location || 'Almoxarifado',
        notes: epi.notes || epi.description || '',
        createdAt: epi.createdAt || new Date().toISOString(),
        updatedAt: epi.updatedAt || new Date().toISOString()
      }));

      // Aplicar filtros se fornecidos
      if (filters) {
        if (filters.status) {
          epis = epis.filter(epi => epi.status === filters.status);
        }
        if (filters.type) {
          epis = epis.filter(epi => epi.type === filters.type);
        }
        if (filters.supplier) {
          epis = epis.filter(epi => 
            epi.supplier?.toLowerCase().includes(filters.supplier!.toLowerCase())
          );
        }
      }

      console.log('✅ EPIService.getEPIs - Processados', epis.length, 'EPIs do backend');
      return epis;
    } catch (error: any) {
      console.error('❌ Erro ao buscar EPIs do backend:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      console.warn('⚠️ Usando dados mock como fallback devido ao erro');
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
      // Mapear do formato frontend para o formato backend
      const backendEPI = {
        name: epi.name,
        description: epi.description || '',
        category: this.mapTypeToCategory(epi.type),
        caNumber: epi.certification || '',
        caValidity: epi.expiryDate || null,
        manufacturer: epi.brand || epi.supplier || '',
        model: epi.model || '',
        unitOfMeasurement: 'UNIDADE',
        minimumStock: 0,
        currentStock: epi.quantity || 0,
        unitCost: epi.unitPrice || 0,
        isActive: epi.status === 'ACTIVE'
      };

      const response = await api.post('/api/sst/epis', backendEPI);
      
      // Converter resposta do backend para formato frontend
      const createdEPI = response.data;
      return {
        id: typeof createdEPI.id === 'string' ? parseInt(createdEPI.id.replace(/-/g, '').substring(0, 8), 16) : (createdEPI.id || 0),
        name: createdEPI.name,
        description: createdEPI.description,
        type: this.mapCategoryToType(createdEPI.category),
        brand: createdEPI.manufacturer || 'N/A',
        model: createdEPI.model || 'N/A',
        size: undefined,
        color: undefined,
        certification: createdEPI.caNumber || '',
        status: createdEPI.isActive ? 'ACTIVE' : 'INACTIVE',
        quantity: createdEPI.currentStock || 0,
        availableQuantity: createdEPI.currentStock || 0,
        unitPrice: createdEPI.unitCost || 0,
        supplier: createdEPI.manufacturer || 'N/A',
        purchaseDate: new Date().toISOString().split('T')[0],
        expiryDate: createdEPI.caValidity || undefined,
        lastMaintenanceDate: undefined,
        nextMaintenanceDate: undefined,
        location: 'Almoxarifado',
        notes: createdEPI.description,
        createdAt: createdEPI.createdAt || new Date().toISOString(),
        updatedAt: createdEPI.updatedAt || new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao criar EPI:', error);
      throw new Error('Erro ao criar EPI');
    }
  }

  // Função auxiliar para mapear tipo do frontend para categoria do backend
  private mapTypeToCategory(type: EPIType): string {
    const mapping: Record<EPIType, string> = {
      'HELMET': 'CABECA',
      'GLOVES': 'MAOS',
      'SAFETY_GLASSES': 'OLHOS',
      'SAFETY_SHOES': 'PES',
      'UNIFORM': 'CORPO',
      'RESPIRATOR': 'RESPIRATORIO',
      'OTHER': 'CORPO'
    };
    return mapping[type] || 'CORPO';
  }

  // Função auxiliar para mapear categoria do backend para tipo do frontend
  private mapCategoryToType(category: string): EPIType {
    const mapping: Record<string, EPIType> = {
      'CABECA': 'HELMET',
      'MAOS': 'GLOVES',
      'OLHOS': 'SAFETY_GLASSES',
      'PES': 'SAFETY_SHOES',
      'CORPO': 'UNIFORM',
      'RESPIRATORIO': 'RESPIRATOR'
    };
    return mapping[category] || 'OTHER';
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
      await api.delete(`/api/epis/${id}`);
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
      const response = await api.post('/api/epi-assignments', assignment);
      return response.data;
    } catch (error) {
      console.error('Erro ao atribuir EPI:', error);
      throw new Error('Erro ao atribuir EPI');
    }
  }

  // Retornar EPI
  async returnEPI(assignmentId: number, returnedBy: string, notes?: string): Promise<EPIAssignmentAPI> {
    try {
      const response = await api.patch(`/api/epi-assignments/${assignmentId}/return`, {
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
      // Calcular estatísticas a partir dos EPIs retornados
      const allEPIs = await this.getEPIs();
      return this.calculateStats(allEPIs);
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

  // Calcular estatísticas a partir dos EPIs
  private calculateStats(epis: EPI[]): {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    expired: number;
    totalValue: number;
    assigned: number;
    available: number;
    byType: Record<EPIType, number>;
  } {
    const stats = {
      total: epis.length,
      active: 0,
      inactive: 0,
      maintenance: 0,
      expired: 0,
      totalValue: 0,
      assigned: 0,
      available: 0,
      byType: {
        HELMET: 0,
        GLOVES: 0,
        SAFETY_GLASSES: 0,
        SAFETY_SHOES: 0,
        UNIFORM: 0,
        RESPIRATOR: 0,
        OTHER: 0
      } as Record<EPIType, number>
    };

    epis.forEach(epi => {
      // Contar por status
      switch (epi.status) {
        case 'ACTIVE':
          stats.active++;
          break;
        case 'INACTIVE':
          stats.inactive++;
          break;
        case 'MAINTENANCE':
          stats.maintenance++;
          break;
        case 'EXPIRED':
          stats.expired++;
          break;
      }

      // Calcular valores
      stats.totalValue += epi.unitPrice * epi.quantity;
      stats.assigned += epi.quantity - epi.availableQuantity;
      stats.available += epi.availableQuantity;

      // Contar por tipo
      if (stats.byType[epi.type] !== undefined) {
        stats.byType[epi.type]++;
      } else {
        stats.byType.OTHER++;
      }
    });

    return stats;
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