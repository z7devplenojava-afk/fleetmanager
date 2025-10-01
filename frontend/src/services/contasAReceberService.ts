import api from '@/lib/axios';
import { ContaAReceber } from '@/components/financeiro/ContasAReceberFormModal';
import { formatDateForBackend, parseDateFromBackend } from '@/utils/dateUtils';

export interface CreateContaAReceberRequest {
  invoiceNumber?: string;
  description: string;
  clientId: string | null;
  unitId: string;
  amount: number;
  type: 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO';
  status: 'ABERTA' | 'RECEBIDA' | 'VENCIDA' | 'CANCELADA';
  dueDate: string;
  issueDate: string;
  paymentDate?: string;
  barcode?: string;
  category?: string;
  notes?: string;
  centroCusto?: string;
}

export interface UpdateContaAReceberRequest extends Partial<CreateContaAReceberRequest> {
  id: string;
}

export interface ContasAReceberFilters {
  status?: string;
  type?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface Client {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  category?: string;
  isActive: boolean;
}

export interface CreateClientRequest {
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  notes?: string;
}

export type UpdateClientRequest = Partial<CreateClientRequest> & {
  isActive?: boolean;
};

export interface ContasAReceberReport {
  totalContas: number;
  totalValor: number;
  contasAbertas: number;
  valorAbertas: number;
  contasVencidas: number;
  valorVencidas: number;
  contasRecebidas: number;
  valorRecebidas: number;
  contasVencendoEm7Dias: number;
  valorVencendoEm7Dias: number;
  porTipo: {
    fatura: { count: number; valor: number };
    medicao: { count: number; valor: number };
    servico: { count: number; valor: number };
    produto: { count: number; valor: number };
  };
  porStatus: Array<{
    status: string;
    count: number;
    valor: number;
  }>;
}

export const contasAReceberService = {
  // ===== CONTAS A RECEBER =====
  
  // Buscar todas as contas
  async getContasAReceber(filters: ContasAReceberFilters = {}): Promise<ContaAReceber[]> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    console.log('🔍 DEBUG: Fazendo requisição para /accounts-receivable com params:', params.toString());
    const response = await api.get(`/api/accounts-receivable?${params.toString()}`);
    
    console.log('🔍 DEBUG: Resposta da API:', response.data);
    
    // Transformar dados do backend para o formato do frontend
    const accounts = Array.isArray(response.data) ? response.data : response.data.content || [];
    
    console.log('🔍 DEBUG: Accounts processados:', accounts);
    
    return accounts.map((account: any): ContaAReceber => ({
      id: account.id,
      numeroFatura: account.invoiceNumber,
      dataEmissao: parseDateFromBackend(account.issueDate),
      vencimento: parseDateFromBackend(account.dueDate) || new Date(),
      cliente: account.clientName || 'Não informado',
      clienteId: account.clientId,
      empresa: account.unitName || 'Não informado',
      empresaId: account.unitId,
      descricao: account.description,
      tipo: mapBackendTypeToFrontend(account.type),
      valor: parseFloat(account.amount),
      codigoBarras: account.barcode,
      status: mapBackendStatusToFrontend(account.status),
      baixa: account.baixa || false,
      dataPagamento: parseDateFromBackend(account.paymentDate),
      observacoes: account.notes,
      categoria: account.category,
      centroCusto: account.centroCusto
    }));
  },

  // Buscar conta por ID
  async getContaAReceberById(id: string): Promise<ContaAReceber> {
    const response = await api.get(`/api/accounts-receivable/${id}`);
    const account = response.data;
    
    return {
      id: account.id,
      numeroFatura: account.invoiceNumber,
      dataEmissao: parseDateFromBackend(account.issueDate),
      vencimento: parseDateFromBackend(account.dueDate) || new Date(),
      cliente: account.clientName || 'Não informado',
      clienteId: account.clientId,
      empresa: account.unitName || 'Não informado',
      empresaId: account.unitId,
      descricao: account.description,
      tipo: mapBackendTypeToFrontend(account.type),
      valor: parseFloat(account.amount),
      codigoBarras: account.barcode,
      status: mapBackendStatusToFrontend(account.status),
      baixa: account.baixa || false,
      dataPagamento: parseDateFromBackend(account.paymentDate),
      observacoes: account.notes,
      categoria: account.category,
      centroCusto: account.centroCusto
    };
  },

  // Criar nova conta
  async createContaAReceber(conta: Omit<ContaAReceber, 'id'>): Promise<ContaAReceber> {
    // Buscar uma unidade padrão ou usar UUID padrão
    let unitId = '11111111-1111-1111-1111-111111111111'; // UUID padrão
    
    try {
      const unitsResponse = await api.get('/units');
      if (unitsResponse.data && unitsResponse.data.length > 0) {
        unitId = unitsResponse.data[0].id;
      }
    } catch (error) {
      console.warn('Não foi possível buscar unidades, usando UUID padrão:', error);
    }

    const requestData: CreateContaAReceberRequest = {
      description: conta.descricao,
      clientId: conta.clienteId || null,
      unitId: unitId,
      amount: Number(conta.valor) || 0,
      type: mapFrontendTypeToBackend(conta.tipo),
      status: mapFrontendStatusToBackend(conta.status) as any,
      dueDate: formatDateForBackend(conta.vencimento) || '',
      issueDate: formatDateForBackend(conta.dataEmissao) || '',
      paymentDate: formatDateForBackend(conta.dataPagamento),
      barcode: conta.codigoBarras,
      category: conta.categoria === 'NENHUMA' ? undefined : conta.categoria,
      notes: conta.observacoes,
      centroCusto: conta.centroCusto === 'NENHUM' ? undefined : conta.centroCusto
    };

    // Adicionar invoiceNumber apenas se fornecido
    if (conta.numeroFatura && conta.numeroFatura.trim()) {
      requestData.invoiceNumber = conta.numeroFatura;
    }

    console.log('Dados da requisição:', requestData);

    try {
      const response = await api.post('/api/accounts-receivable', requestData);
      return this.getContaAReceberById(response.data.id);
    } catch (error: any) {
      console.error('Erro detalhado ao criar conta a receber:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      throw error;
    }
  },

  // Atualizar conta
  async updateContaAReceber(id: string, conta: Partial<ContaAReceber>): Promise<ContaAReceber> {
    const requestData: Partial<CreateContaAReceberRequest> = {};
    
    if (conta.descricao) requestData.description = conta.descricao;
    if (conta.clienteId) requestData.clientId = conta.clienteId;
    if (conta.valor !== undefined) requestData.amount = conta.valor;
    if (conta.tipo) requestData.type = mapFrontendTypeToBackend(conta.tipo);
    if (conta.status) requestData.status = mapFrontendStatusToBackend(conta.status) as any;
    if (conta.dataEmissao) requestData.issueDate = formatDateForBackend(conta.dataEmissao);
    if (conta.vencimento) requestData.dueDate = formatDateForBackend(conta.vencimento);
    if (conta.dataPagamento) requestData.paymentDate = formatDateForBackend(conta.dataPagamento);
    if (conta.codigoBarras) requestData.barcode = conta.codigoBarras;
    if (conta.categoria !== undefined) requestData.category = conta.categoria === 'NENHUMA' ? undefined : conta.categoria;
    if (conta.observacoes) requestData.notes = conta.observacoes;
    if (conta.centroCusto !== undefined) requestData.centroCusto = conta.centroCusto === 'NENHUM' ? undefined : conta.centroCusto;
    
    // Se não há unitId, buscar uma unidade padrão
    if (!requestData.unitId) {
      try {
        const unitsResponse = await api.get('/api/units');
        if (unitsResponse.data && unitsResponse.data.length > 0) {
          requestData.unitId = unitsResponse.data[0].id;
        } else {
          requestData.unitId = '11111111-1111-1111-1111-111111111111'; // UUID padrão
        }
      } catch (error) {
        console.warn('Não foi possível buscar unidades, usando UUID padrão:', error);
        requestData.unitId = '11111111-1111-1111-1111-111111111111'; // UUID padrão
      }
    }

    console.log('Dados da requisição de atualização:', requestData);
    console.log('ID da conta:', id);

    try {
      const response = await api.put(`/api/accounts-receivable/${id}`, requestData);
      return this.getContaAReceberById(response.data.id);
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar conta a receber:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request data enviado:', requestData);
      throw error;
    }
  },

  // Excluir conta
  async deleteContaAReceber(id: string): Promise<void> {
    await api.delete(`/api/accounts-receivable/${id}`);
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/categories');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return [
        'Serviços de Segurança',
        'Consultoria',
        'Manutenção',
        'Equipamentos',
        'Treinamento',
        'Auditoria',
        'Outros'
      ];
    }
  },

  async getCostCenters(): Promise<string[]> {
    try {
      const response = await api.get('/api/accounts-receivable/cost-centers');
      if (Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
      return [
        'Administrativo',
        'Operacional',
        'Comercial',
        'Financeiro',
        'Recursos Humanos',
        'Tecnologia da Informação',
        'Marketing',
        'Vendas',
        'Produção',
        'Logística'
      ];
    }
  },

  // Marcar conta como recebida
  async marcarComoRecebida(id: string, dataPagamento: Date): Promise<ContaAReceber> {
    const response = await api.patch(`/api/accounts-receivable/${id}/mark-as-paid`, {
      paymentDate: formatDateForBackend(dataPagamento)
    });
    return this.getContaAReceberById(response.data.id);
  },

  // Buscar contas vencidas
  async getContasVencidas(): Promise<ContaAReceber[]> {
    const response = await api.get('/api/accounts-receivable/overdue');
    return (Array.isArray(response.data) ? response.data : []).map((account: any) => this.mapAccountToContaAReceber(account));
  },

  // Buscar contas vencendo em breve
  async getContasVencendoEmBreve(dias: number = 7): Promise<ContaAReceber[]> {
    const response = await api.get(`/api/accounts-receivable/due-soon/${dias}`);
    return (Array.isArray(response.data) ? response.data : []).map((account: any) => this.mapAccountToContaAReceber(account));
  },

  // ===== CLIENTES =====
  
  // Buscar todos os clientes
  async getClientes(): Promise<Client[]> {
    const response = await api.get('/api/clients/all');
    console.log('🔍 DEBUG: Resposta da API /api/clients/all:', response.data);
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  // Buscar todas as empresas
  async getEmpresas(): Promise<any[]> {
    const response = await api.get('/api/units');
    console.log('🔍 DEBUG: Resposta da API /api/units:', response.data);
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  // Criar cliente
  async createCliente(data: CreateClientRequest): Promise<Client> {
    const response = await api.post('/api/clients', data);
    return response.data;
  },

  // Atualizar cliente
  async updateCliente(id: string, data: UpdateClientRequest): Promise<Client> {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
  },

  // Excluir cliente
  async deleteCliente(id: string): Promise<void> {
    await api.delete(`/api/clients/${id}`);
  },

  // Alternar status (ativo/inativo)
  async toggleClienteStatus(id: string): Promise<Client> {
    const response = await api.patch(`/api/clients/${id}/toggle-status`);
    return response.data;
  },

  // Listar clientes ativos
  async getClientesAtivos(): Promise<Client[]> {
    const response = await api.get('/api/clients/active');
    return response.data;
  },

  // Buscar por CNPJ
  async getClienteByCnpj(cnpj: string): Promise<Client | null> {
    try {
      const response = await api.get(`/api/clients/cnpj/${encodeURIComponent(cnpj)}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // Buscar cliente por ID
  async getClienteById(id: string): Promise<Client> {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  // ===== RELATÓRIOS =====
  
  // Gerar relatório de contas a receber
  async getRelatorioContasAReceber(startDate?: string, endDate?: string): Promise<ContasAReceberReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/accounts-receivable/reports/summary?${params.toString()}`);
    return response.data;
  },

  // Obter estatísticas rápidas
  async getEstatisticas(): Promise<any> {
    const [contasVencidas, contasVencendoEmBreve, resumo] = await Promise.all([
      this.getContasVencidas(),
      this.getContasVencendoEmBreve(),
      this.getRelatorioContasAReceber()
    ]);

    return {
      contasVencidas: contasVencidas.length,
      valorVencidas: contasVencidas.reduce((sum, c) => sum + c.valor, 0),
      contasVencendoEmBreve: contasVencendoEmBreve.length,
      valorVencendoEmBreve: contasVencendoEmBreve.reduce((sum, c) => sum + c.valor, 0),
      ...resumo
    };
  },

  // Método auxiliar para mapear account para ContaAReceber
  mapAccountToContaAReceber(account: any): ContaAReceber {
    return {
      id: account.id,
      numeroFatura: account.invoiceNumber,
      dataEmissao: parseDateFromBackend(account.issueDate),
      vencimento: parseDateFromBackend(account.dueDate) || new Date(),
      cliente: account.clientName || 'Não informado',
      clienteId: account.clientId,
      empresa: account.unitName || 'Não informado',
      empresaId: account.unitId,
      descricao: account.description,
      tipo: mapBackendTypeToFrontend(account.type),
      valor: parseFloat(account.amount),
      codigoBarras: account.barcode,
      status: mapBackendStatusToFrontend(account.status),
      baixa: account.baixa || false,
      dataPagamento: parseDateFromBackend(account.paymentDate),
      observacoes: account.notes,
      categoria: account.category,
      centroCusto: account.centroCusto,
      createdAt: parseDateFromBackend(account.createdAt)
    };
  }
};

// Função auxiliar para mapear tipo do frontend para backend
function mapFrontendTypeToBackend(frontendType: 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO'): string {
  switch (frontendType) {
    case 'FATURA':
      return 'INVOICE';
    case 'MEDICAO':
      return 'MEASUREMENT';
    case 'SERVICO':
      return 'SERVICE';
    case 'PRODUTO':
      return 'PRODUCT';
    default:
      return 'INVOICE';
  }
}

// Função auxiliar para mapear tipo do backend para frontend
function mapBackendTypeToFrontend(backendType: string): 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO' {
  switch (backendType) {
    case 'INVOICE':
      return 'FATURA';
    case 'MEASUREMENT':
      return 'MEDICAO';
    case 'SERVICE':
      return 'SERVICO';
    case 'PRODUCT':
      return 'PRODUTO';
    default:
      return 'FATURA';
  }
}

// Função auxiliar para mapear status do frontend para backend
function mapFrontendStatusToBackend(frontendStatus: 'ABERTA' | 'RECEBIDA' | 'VENCIDA' | 'CANCELADA'): string {
  switch (frontendStatus) {
    case 'ABERTA':
      return 'PENDING';
    case 'RECEBIDA':
      return 'PAID';
    case 'CANCELADA':
      return 'CANCELLED';
    case 'VENCIDA':
      return 'OVERDUE';
    default:
      return 'PENDING';
  }
}

// Função auxiliar para mapear status do backend para frontend
function mapBackendStatusToFrontend(backendStatus: string): 'ABERTA' | 'RECEBIDA' | 'VENCIDA' | 'CANCELADA' {
  switch (backendStatus) {
    case 'PENDING':
    case 'PENDING_ERROR':
    case 'SOLICITADA':
      return 'ABERTA';
    case 'PAID':
    case 'PAID_PREVIOUSLY':
      return 'RECEBIDA';
    case 'CANCELLED':
      return 'CANCELADA';
    case 'OVERDUE':
      return 'VENCIDA';
    default:
      return 'ABERTA';
  }
}