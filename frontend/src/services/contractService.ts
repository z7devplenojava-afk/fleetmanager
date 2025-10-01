import api from '@/lib/axios';

export interface Contract {
  id: string;
  contractNumber: string;
  description: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING';
  notes?: string;
  // Dados do cliente vêm como campos separados do backend
  clientId: string;
  clientName: string;
  clientCnpj?: string;
  // Campos adicionais para relacionamentos
  client?: {
    id: string;
    name: string;
    cnpj?: string;
  };
  unit?: {
    id: string;
    name: string;
    code?: string;
  };
  unitId?: string;
  unitName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContractRequest {
  contractNumber: string;
  description: string;
  startDate: string;
  endDate?: string;
  value: number;
  status: 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'PENDING';
  clientId: string;
  notes?: string;
}

export interface UpdateContractRequest extends Partial<CreateContractRequest> {
  id: string;
}

export interface ContractFilters {
  searchTerm?: string;
  status?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const contractService = {
  // Buscar todos os contratos com filtros
  async getContracts(filters: ContractFilters = {}): Promise<Contract[]> {
    const hasPagination = filters.page !== undefined && filters.size !== undefined;
    if (!hasPagination && Object.keys(filters).length === 0) {
      // Busca todos sem paginação
      try {
        const response = await api.get('/contracts/all');
        return Array.isArray(response.data) ? response.data : this.getMockContracts();
      } catch (error) {
        console.error('Erro ao buscar contratos:', error);
        return this.getMockContracts();
      }
    }
    const params = new URLSearchParams();
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.status) params.append('status', filters.status);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);
    const response = await api.get(`/api/contracts?${params.toString()}`);
    return response.data;
  },

  // Buscar contrato por ID
  async getContractById(id: string): Promise<Contract> {
    const response = await api.get(`/api/contracts/${id}`);
    return response.data;
  },

  // Buscar contratos por número
  async getContractByNumber(contractNumber: string): Promise<Contract> {
    const response = await api.get(`/api/contracts/number/${contractNumber}`);
    return response.data;
  },

  // Buscar contratos por cliente
  async getContractsByClient(clientId: string): Promise<Contract[]> {
    const response = await api.get(`/api/contracts/client/${clientId}`);
    if (response.data && Array.isArray(response.data.content)) {
      return response.data.content; // Extrai o array de contratos da resposta paginada
    } else if (Array.isArray(response.data)) {
      return response.data; // Caso o backend retorne um array direto
    } else {
      return []; // Retorna um array vazio se o formato for inesperado
    }
  },

  // Buscar contratos por status
  async getContractsByStatus(status: string): Promise<Contract[]> {
    const response = await api.get(`/api/contracts/status/${status}`);
    return response.data;
  },

  // Buscar contratos por período
  async getContractsByDateRange(startDate: string, endDate: string): Promise<Contract[]> {
    const response = await api.get(`/api/contracts/date-range?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Criar novo contrato
  async createContract(contractData: CreateContractRequest): Promise<Contract> {
    const response = await api.post('/contracts', contractData);
    return response.data;
  },

  // Atualizar contrato
  async updateContract(id: string, contractData: UpdateContractRequest): Promise<Contract> {
    const response = await api.put(`/api/contracts/${id}`, contractData);
    return response.data;
  },

  // Excluir contrato
  async deleteContract(id: string): Promise<void> {
    await api.delete(`/api/contracts/${id}`);
  },

  // Atualizar status do contrato
  async updateContractStatus(id: string, status: string): Promise<Contract> {
    const response = await api.put(`/api/contracts/${id}/status?status=${status}`);
    return response.data;
  },

  // Verificar se número do contrato já existe
  async checkContractNumberExists(contractNumber: string): Promise<boolean> {
    try {
      await api.get(`/api/contracts/number/${contractNumber}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Buscar contratos com filtros avançados
  async searchContracts(query: string): Promise<Contract[]> {
    const response = await api.get(`/api/contracts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Buscar contratos ativos
  async getActiveContracts(): Promise<Contract[]> {
    return this.getContractsByStatus('ACTIVE');
  },

  // Buscar contratos inativos
  async getInactiveContracts(): Promise<Contract[]> {
    return this.getContractsByStatus('INACTIVE');
  },

  // Buscar contratos pendentes
  async getPendingContracts(): Promise<Contract[]> {
    return this.getContractsByStatus('PENDING');
  },

  // Buscar contratos finalizados
  async getTerminatedContracts(): Promise<Contract[]> {
    return this.getContractsByStatus('TERMINATED');
  },

  // Buscar contratos que vencem em breve
  async getContractsExpiringSoon(days: number = 30): Promise<Contract[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split('T')[0];
    
    return this.getContractsByDateRange(new Date().toISOString().split('T')[0], endDateStr);
  },

  // Calcular valor total dos contratos ativos
  async getTotalActiveContractsValue(): Promise<number> {
    const activeContracts = await this.getActiveContracts();
    return activeContracts.reduce((total, contract) => total + contract.value, 0);
  },

  // Gerar relatório de contratos
  async generateContractsReport(filters: ContractFilters = {}): Promise<any> {
    const contracts = await this.getContracts(filters);
    
    const report = {
      totalContracts: contracts.length,
      totalValue: contracts.reduce((total, contract) => total + contract.value, 0),
      byStatus: contracts.reduce((acc, contract) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byClient: contracts.reduce((acc, contract) => {
        acc[contract.client.name] = (acc[contract.client.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      contracts
    };

    return report;
  },

  // Método para retornar dados mockados temporariamente
  getMockContracts(): Contract[] {
    return [
      {
        id: 'CON-001',
        contractNumber: 'CON-2024-001',
        description: 'Contrato de prestação de serviços de segurança',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        value: 50000.00,
        status: 'ACTIVE',
        notes: 'Contrato principal da empresa',
        clientId: 'CLI-001',
        clientName: 'Empresa ABC Ltda',
        clientCnpj: '12.345.678/0001-90',
        client: {
          id: 'CLI-001',
          name: 'Empresa ABC Ltda',
          cnpj: '12.345.678/0001-90'
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 'CON-002',
        contractNumber: 'CON-2024-002',
        description: 'Contrato de manutenção de equipamentos',
        startDate: '2024-02-01',
        endDate: '2024-11-30',
        value: 25000.00,
        status: 'ACTIVE',
        notes: 'Contrato de manutenção preventiva',
        clientId: 'CLI-002',
        clientName: 'Tech Solutions S.A.',
        clientCnpj: '98.765.432/0001-10',
        client: {
          id: 'CLI-002',
          name: 'Tech Solutions S.A.',
          cnpj: '98.765.432/0001-10'
        },
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-01T00:00:00Z'
      }
    ];
  }
}; 