import api from '@/lib/axios';
import { 
  EPIControlRecord, 
  EPIControlFormData, 
  EPIControlFilters, 
  EPIControlStats,
  EPIControlReport 
} from '@/types/epiControl';

class EPIControlService {
  // Buscar todos os registros de controle de EPI
  async getEPIControlRecords(filters?: EPIControlFilters): Promise<EPIControlRecord[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeName) params.append('employeeName', filters.employeeName);
      if (filters?.employeeFunction) params.append('employeeFunction', filters.employeeFunction);
      if (filters?.deliveryDateFrom) params.append('deliveryDateFrom', filters.deliveryDateFrom);
      if (filters?.deliveryDateTo) params.append('deliveryDateTo', filters.deliveryDateTo);
      if (filters?.equipmentName) params.append('equipmentName', filters.equipmentName);

      const url = `/epi-control${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar registros de controle de EPI:', error);
      return this.getMockEPIControlRecords();
    }
  }

  // Buscar registro por ID
  async getEPIControlRecord(id: string): Promise<EPIControlRecord | null> {
    try {
      const response = await api.get(`/epi-control/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar registro de controle de EPI:', error);
      return this.getMockEPIControlRecord(id);
    }
  }

  // Criar novo registro
  async createEPIControlRecord(data: EPIControlFormData): Promise<EPIControlRecord> {
    try {
      const response = await api.post('/epi-control', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar registro de controle de EPI:', error);
      throw error;
    }
  }

  // Atualizar registro
  async updateEPIControlRecord(id: string, data: Partial<EPIControlFormData>): Promise<EPIControlRecord> {
    try {
      const response = await api.put(`/epi-control/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar registro de controle de EPI:', error);
      throw error;
    }
  }

  // Deletar registro
  async deleteEPIControlRecord(id: string): Promise<void> {
    try {
      await api.delete(`/epi-control/${id}`);
    } catch (error) {
      console.error('Erro ao deletar registro de controle de EPI:', error);
      throw error;
    }
  }

  // Buscar estatísticas
  async getEPIControlStats(): Promise<EPIControlStats> {
    try {
      const response = await api.get('/epi-control/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de controle de EPI:', error);
      return this.getMockEPIControlStats();
    }
  }

  // Gerar relatório PDF
  async generateEPIControlReport(recordId: string): Promise<Blob> {
    try {
      const response = await api.get(`/epi-control/${recordId}/report`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório de controle de EPI:', error);
      throw error;
    }
  }

  // Gerar relatório de múltiplos registros
  async generateEPIControlBulkReport(filters: EPIControlFilters): Promise<Blob> {
    try {
      const params = new URLSearchParams();
      if (filters?.employeeName) params.append('employeeName', filters.employeeName);
      if (filters?.employeeFunction) params.append('employeeFunction', filters.employeeFunction);
      if (filters?.deliveryDateFrom) params.append('deliveryDateFrom', filters.deliveryDateFrom);
      if (filters?.deliveryDateTo) params.append('deliveryDateTo', filters.deliveryDateTo);
      if (filters?.equipmentName) params.append('equipmentName', filters.equipmentName);

      const response = await api.get(`/epi-control/report/bulk?${params.toString()}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório em lote de controle de EPI:', error);
      throw error;
    }
  }

  // Dados mock para desenvolvimento
  private getMockEPIControlRecords(): EPIControlRecord[] {
    return [
      {
        id: '1',
        employeeId: 'emp-001',
        employeeName: 'EDUARDO JOSE GONCALVES DE SOUZA',
        employeeFunction: 'VIGIA',
        employeeCpf: '054.151.346-03',
        employeeRg: 'MG-10.864.970',
        admissionDate: '2025-05-28',
        dismissalDate: undefined,
        equipmentItems: [
          {
            id: 'eq-001',
            equipmentName: 'Capacete de Segurança',
            equipmentNumber: 'CAP-001',
            ca: '12345',
            quantity: 1,
            deliveryDate: '2025-05-28',
            replacedDate: undefined,
            replacementReason: undefined,
            signature: 'Eduardo J. G. Souza'
          },
          {
            id: 'eq-002',
            equipmentName: 'Óculos de Proteção',
            equipmentNumber: 'OCU-001',
            ca: '12346',
            quantity: 1,
            deliveryDate: '2025-05-28',
            replacedDate: undefined,
            replacementReason: undefined,
            signature: 'Eduardo J. G. Souza'
          }
        ],
        deliveryDate: '2025-05-28',
        responsibleDelivery: 'João Silva',
        signature: 'Eduardo J. G. Souza',
        observations: 'Entrega realizada conforme procedimento padrão',
        createdAt: '2025-05-28T10:00:00Z',
        updatedAt: '2025-05-28T10:00:00Z'
      },
      {
        id: '2',
        employeeId: 'emp-002',
        employeeName: 'MARIA SILVA SANTOS',
        employeeFunction: 'PORTEIRO',
        employeeCpf: '123.456.789-00',
        employeeRg: 'SP-12.345.678',
        admissionDate: '2025-04-15',
        dismissalDate: undefined,
        equipmentItems: [
          {
            id: 'eq-003',
            equipmentName: 'Uniforme de Trabalho',
            equipmentNumber: 'UNI-001',
            ca: '12347',
            quantity: 2,
            deliveryDate: '2025-04-15',
            replacedDate: undefined,
            replacementReason: undefined,
            signature: 'Maria S. Santos'
          }
        ],
        deliveryDate: '2025-04-15',
        responsibleDelivery: 'Ana Costa',
        signature: 'Maria S. Santos',
        observations: 'Uniforme entregue em perfeito estado',
        createdAt: '2025-04-15T14:30:00Z',
        updatedAt: '2025-04-15T14:30:00Z'
      }
    ];
  }

  private getMockEPIControlRecord(id: string): EPIControlRecord | null {
    const records = this.getMockEPIControlRecords();
    return records.find(record => record.id === id) || null;
  }

  private getMockEPIControlStats(): EPIControlStats {
    return {
      totalRecords: 2,
      activeEmployees: 2,
      dismissedEmployees: 0,
      totalEquipmentItems: 3,
      pendingReplacements: 0,
      expiredEquipment: 0
    };
  }
}

export const epiControlService = new EPIControlService();
export default epiControlService;
