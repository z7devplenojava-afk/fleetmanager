import api from '@/lib/axios';
import { ContaAReceber as ContaAReceberForm } from '@/components/financeiro/ContasAReceberFormModal';
import { formatDateForBackend, parseDateFromBackend } from '@/utils/dateUtils';

// Interface estendida para Contas a Receber com campos adicionais do backend
export type ContaAReceber = ContaAReceberForm & {
  amount?: number; // Valor total (alias para valor)
  amountPaid?: number; // Valor já pago
  pendingAmount?: number; // Valor pendente
  overdueDays?: number; // Dias em atraso
  invoiceNumber?: string; // Número da fatura
  measurementNumber?: string; // Número da medição
  dueDate?: Date; // Data de vencimento
  contrato?: string;
  contratoId?: string;
  obra?: string;
  obraId?: string;
  client?: {
    id: string;
    name: string;
  };
};

export interface CreateContaAReceberRequest {
  invoiceNumber?: string;
  description: string;
  clientId: string | null;
  contractId?: string | null;
  workPostId?: string | null;
  unitId?: string; // ID da unidade/empresa
  amount: number;
  amountPaid?: number; // Valor pago (opcional, padrão 0)
  dueDate: string;
  issueDate: string;
  paymentDate?: string;
  barcode?: string;
  category: string; // ReceivableCategory enum: INVOICE, NOTE, ADVANCE, SERVICE, PRODUCT, OTHER
  paymentMethod: string; // PaymentMethod enum: PIX, BOLETO, TRANSFER, CASH, CARD
  status?: string; // ReceivableStatus enum: PENDING, PAID, OVERDUE, CANCELLED
  notes?: string;
  measurementNumber?: string;
  measurementId?: string;
  overdueDays?: number; // Dias em atraso
  lateFee?: number; // Taxa de atraso
  latePenalty?: number; // Multa de atraso
  centroCusto?: string; // Centro de custo
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

// Função auxiliar para mapear tipo/categoria do backend para tipo do frontend
function mapBackendTypeToFrontend(backendTypeOrCategory: string | undefined): 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO' {
  if (!backendTypeOrCategory) return 'FATURA';
  
  const upper = backendTypeOrCategory.toUpperCase();
  
  // Se for uma categoria (ReceivableCategory enum)
  switch (upper) {
    case 'INVOICE':
    case 'NOTE':
    case 'ADVANCE':
      return 'FATURA';
    case 'SERVICE':
      return 'SERVICO';
    case 'PRODUCT':
      return 'PRODUTO';
    case 'OTHER':
      return 'FATURA';
  }
  
  // Se for um tipo antigo (para compatibilidade)
  switch (upper) {
    case 'FATURA':
      return 'FATURA';
    case 'MEDICAO':
      return 'MEDICAO';
    case 'SERVICO':
      return 'SERVICO';
    case 'PRODUTO':
      return 'PRODUTO';
    default:
      return 'FATURA';
  }
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
    
    return accounts
      .filter((account: any) => account && account.id) // Filtrar itens inválidos
      .map((account: any): ContaAReceber => ({
        id: account.id,
        numeroFatura: account.invoiceNumber,
        dataEmissao: parseDateFromBackend(account.issueDate),
        vencimento: parseDateFromBackend(account.dueDate) || new Date(),
        cliente: account.clientName || account.client?.name || 'Não informado',
        clienteId: account.clientId || account.client?.id,
        contrato: account.contractNumber,
        contratoId: account.contractId,
        obra: account.workPostName,
        obraId: account.workPostId,
        empresa: account.unitSigla || account.unitName || 'Não informado',
        empresaId: account.unitId,
        descricao: account.description || '',
        tipo: mapBackendTypeToFrontend(account.type || account.category),
        valor: parseFloat(account.amount || 0),
        amount: parseFloat(account.amount || 0), // Campo adicional para compatibilidade
        amountPaid: parseFloat(account.amountPaid || 0), // Valor pago
        pendingAmount: parseFloat(account.pendingAmount || (parseFloat(account.amount || 0) - parseFloat(account.amountPaid || 0)) || 0), // Valor pendente
        overdueDays: account.overdueDays || 0, // Dias em atraso
        codigoBarras: account.barcode,
        status: mapBackendStatusToFrontend(account.status),
        baixa: account.baixa || false,
        dataPagamento: parseDateFromBackend(account.paymentDate),
        observacoes: account.notes,
        categoria: account.category,
        centroCusto: account.centroCusto,
        paymentMethod: account.paymentMethod || 'PIX', // Incluir paymentMethod do backend
        invoiceNumber: account.invoiceNumber, // Número da fatura
        measurementNumber: account.measurementNumber, // Número da medição
        dueDate: parseDateFromBackend(account.dueDate) || new Date(), // Data de vencimento
        client: account.client ? {
          id: account.client.id,
          name: account.client.name || account.clientName || 'Não informado'
        } : undefined
      }));
  },

  // Buscar conta por ID
  async getContaAReceberById(id: string): Promise<ContaAReceber> {
    const response = await api.get(`/api/accounts-receivable/${id}`);
    const account = response.data;
    
    console.log('📋 Dados recebidos do backend para conta:', id, account);
    
    return {
      id: account.id,
      numeroFatura: account.invoiceNumber,
      dataEmissao: parseDateFromBackend(account.issueDate),
      vencimento: parseDateFromBackend(account.dueDate) || new Date(),
      cliente: account.clientName || account.client?.name || 'Não informado',
      clienteId: account.clientId || account.client?.id,
      contrato: account.contractNumber,
      contratoId: account.contractId,
      obra: account.workPostName,
      obraId: account.workPostId,
      empresa: account.unit?.sigla || account.unit?.name || account.unitSigla || account.unitName || account.companySigla || undefined,
      empresaId: account.unitId || account.unit?.id || account.companyId || undefined,
      descricao: account.description,
      tipo: mapBackendTypeToFrontend(account.type || account.category),
      valor: parseFloat(account.amount),
      codigoBarras: account.barcode,
      status: mapBackendStatusToFrontend(account.status),
      baixa: account.baixa || false,
      dataPagamento: parseDateFromBackend(account.paymentDate),
      observacoes: account.notes,
      categoria: account.category || 'INVOICE', // Garantir categoria
      centroCusto: account.centroCusto || undefined,
      paymentMethod: account.paymentMethod || 'PIX' // Incluir paymentMethod do backend
    };
  },

  // Criar nova conta
  async createContaAReceber(conta: Omit<ContaAReceber, 'id'>): Promise<ContaAReceber> {
    const validCategories = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
    let category = conta.categoria && conta.categoria !== 'NENHUMA' && validCategories.includes(conta.categoria.toUpperCase())
      ? conta.categoria.toUpperCase() // Já deve ser um valor válido do enum
      : mapTypeToCategory(conta.tipo);
    
    // Garantir que seja um valor válido do enum
    if (!validCategories.includes(category)) {
      category = 'INVOICE'; // Valor padrão seguro
    }

    // Definir paymentMethod padrão se não fornecido
    const paymentMethod = conta.paymentMethod || 'PIX';

    const requestData: CreateContaAReceberRequest = {
      description: conta.descricao,
      clientId: conta.clienteId || null,
      contractId: conta.contratoId || null,
      workPostId: conta.obraId || null,
      unitId: conta.empresaId || undefined,
      amount: Number(conta.valor) || 0,
      dueDate: formatDateForBackend(conta.vencimento) || '',
      issueDate: formatDateForBackend(conta.dataEmissao) || '',
      paymentDate: formatDateForBackend(conta.dataPagamento),
      barcode: conta.codigoBarras,
      category: category,
      paymentMethod: paymentMethod,
      status: mapFrontendStatusToBackend(conta.status) || 'PENDING',
      notes: conta.observacoes,
      centroCusto: conta.centroCusto || undefined
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
    // Primeiro, buscar a conta existente para obter os valores atuais
    const contaExistente = await this.getContaAReceberById(id);
    
    // Construir requestData com todos os campos obrigatórios
    // Usar valores do formulário se fornecidos, senão usar valores existentes
    const requestData: CreateContaAReceberRequest = {
      description: (conta.descricao || contaExistente.descricao || '').trim(),
      clientId: conta.clienteId || contaExistente.clienteId || null,
      contractId: conta.contratoId !== undefined ? (conta.contratoId || null) : (contaExistente.contratoId || null),
      workPostId: conta.obraId !== undefined ? (conta.obraId || null) : (contaExistente.obraId || null),
      unitId: conta.empresaId || contaExistente.empresaId || undefined,
      amount: Number(conta.valor !== undefined ? conta.valor : (contaExistente.valor || contaExistente.amount || 0)),
      amountPaid: Number(contaExistente.amountPaid !== undefined ? contaExistente.amountPaid : 0),
      dueDate: conta.vencimento ? formatDateForBackend(conta.vencimento) : formatDateForBackend(contaExistente.dueDate || contaExistente.vencimento),
      issueDate: conta.dataEmissao ? formatDateForBackend(conta.dataEmissao) : formatDateForBackend(contaExistente.dataEmissao || new Date()),
      paymentDate: conta.dataPagamento ? formatDateForBackend(conta.dataPagamento) : (contaExistente.dataPagamento ? formatDateForBackend(contaExistente.dataPagamento) : undefined),
      barcode: conta.codigoBarras !== undefined ? conta.codigoBarras : contaExistente.codigoBarras,
      notes: conta.observacoes !== undefined ? conta.observacoes : contaExistente.observacoes,
      centroCusto: conta.centroCusto !== undefined ? conta.centroCusto : contaExistente.centroCusto,
      overdueDays: Number(contaExistente.overdueDays || 0),
      lateFee: Number(contaExistente.lateFee || 0),
      latePenalty: Number(contaExistente.latePenalty || 0)
    };
    
    // Número da fatura (obrigatório - @NotBlank)
    if (conta.numeroFatura || conta.invoiceNumber) {
      requestData.invoiceNumber = (conta.numeroFatura || conta.invoiceNumber || '').trim();
    } else if (contaExistente.numeroFatura || contaExistente.invoiceNumber) {
      requestData.invoiceNumber = (contaExistente.numeroFatura || contaExistente.invoiceNumber || '').trim();
    } else {
      // Se não houver número da fatura, gerar um temporário baseado no ID
      requestData.invoiceNumber = `FAT-${id.substring(0, 8).toUpperCase()}`;
    }
    
    // Mapear categoria (obrigatória - @NotNull)
    if (conta.categoria && conta.categoria !== 'NENHUMA' && conta.categoria !== '' && conta.categoria !== undefined) {
      const validCategories = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
      const catUpper = conta.categoria.toUpperCase();
      requestData.category = validCategories.includes(catUpper) ? catUpper : 'INVOICE';
    } else if (contaExistente.categoria && contaExistente.categoria !== 'NENHUMA' && contaExistente.categoria !== '' && contaExistente.categoria !== undefined) {
      const validCategories = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
      const catUpper = String(contaExistente.categoria).toUpperCase();
      requestData.category = validCategories.includes(catUpper) ? catUpper : 'INVOICE';
    } else if (conta.tipo) {
      requestData.category = mapTypeToCategory(conta.tipo);
    } else if (contaExistente.tipo) {
      requestData.category = mapTypeToCategory(contaExistente.tipo);
    } else {
      requestData.category = 'INVOICE'; // Valor padrão
    }
    
    // Forma de pagamento (obrigatória - @NotNull)
    if (conta.paymentMethod) {
      requestData.paymentMethod = conta.paymentMethod;
    } else if (contaExistente.paymentMethod) {
      requestData.paymentMethod = contaExistente.paymentMethod;
    } else {
      requestData.paymentMethod = 'PIX'; // Valor padrão
    }
    
    // Status (obrigatório - usar o existente se não fornecido)
    if (conta.status) {
      requestData.status = mapFrontendStatusToBackend(conta.status) || 'PENDING';
    } else if (contaExistente.status) {
      requestData.status = mapFrontendStatusToBackend(contaExistente.status) || 'PENDING';
    } else {
      requestData.status = 'PENDING'; // Valor padrão
    }

    // Validar campos obrigatórios antes de enviar
    if (!requestData.description || requestData.description.trim() === '') {
      throw new Error('Descrição é obrigatória');
    }
    if (!requestData.clientId) {
      throw new Error('Cliente é obrigatório');
    }
    if (!requestData.invoiceNumber || requestData.invoiceNumber.trim() === '') {
      throw new Error('Número da fatura é obrigatório');
    }
    if (!requestData.amount || requestData.amount <= 0) {
      throw new Error('Valor deve ser maior que zero');
    }
    if (!requestData.issueDate) {
      throw new Error('Data de emissão é obrigatória');
    }
    if (!requestData.dueDate) {
      throw new Error('Data de vencimento é obrigatória');
    }

    // Garantir que category e paymentMethod sejam strings válidas (enums)
    if (!requestData.category || requestData.category === 'NENHUMA') {
      requestData.category = 'INVOICE';
    }
    if (!requestData.paymentMethod) {
      requestData.paymentMethod = 'PIX';
    }
    
    // Validar clientId antes de enviar
    if (!requestData.clientId) {
      throw new Error('Cliente é obrigatório. Por favor, selecione um cliente.');
    }
    
    // Remover campos undefined para evitar problemas de serialização
    const cleanRequestData: any = {
      description: String(requestData.description || '').trim(),
      clientId: String(requestData.clientId), // Garantir que seja string (UUID)
      invoiceNumber: String(requestData.invoiceNumber || '').trim(),
      amount: Number(requestData.amount), // Garantir que seja número
      issueDate: String(requestData.issueDate), // Data no formato YYYY-MM-DD
      dueDate: String(requestData.dueDate), // Data no formato YYYY-MM-DD
      category: String(requestData.category).toUpperCase(), // Enum em maiúsculas
      paymentMethod: String(requestData.paymentMethod).toUpperCase(), // Enum em maiúsculas
      status: String(requestData.status || 'PENDING').toUpperCase() // Enum em maiúsculas
    };
    
    // Adicionar campos opcionais apenas se existirem e forem válidos
    if (requestData.unitId) {
      cleanRequestData.unitId = String(requestData.unitId);
    }
    if (requestData.paymentDate) {
      cleanRequestData.paymentDate = String(requestData.paymentDate);
    }
    if (requestData.amountPaid !== undefined && requestData.amountPaid !== null) {
      cleanRequestData.amountPaid = Number(requestData.amountPaid);
    }
    if (requestData.centroCusto && String(requestData.centroCusto).trim()) {
      cleanRequestData.centroCusto = String(requestData.centroCusto).trim();
    }
    if (requestData.barcode && String(requestData.barcode).trim()) {
      cleanRequestData.barcode = String(requestData.barcode).trim();
    }
    if (requestData.notes && String(requestData.notes).trim()) {
      cleanRequestData.notes = String(requestData.notes).trim();
    }
    if (requestData.measurementNumber && String(requestData.measurementNumber).trim()) {
      cleanRequestData.measurementNumber = String(requestData.measurementNumber).trim();
    }
    if (requestData.overdueDays !== undefined && requestData.overdueDays !== null) {
      cleanRequestData.overdueDays = Number(requestData.overdueDays);
    }
    if (requestData.lateFee !== undefined && requestData.lateFee !== null) {
      cleanRequestData.lateFee = Number(requestData.lateFee);
    }
    if (requestData.latePenalty !== undefined && requestData.latePenalty !== null) {
      cleanRequestData.latePenalty = Number(requestData.latePenalty);
    }

    console.log('📤 Dados da requisição de atualização (limpos):', JSON.stringify(cleanRequestData, null, 2));
    console.log('📋 ID da conta:', id);
    console.log('📋 Conta existente:', contaExistente);

    try {
      const response = await api.put(`/api/accounts-receivable/${id}`, cleanRequestData);
      console.log('✅ Resposta do servidor:', response.data);
      return this.getContaAReceberById(response.data.id);
    } catch (error: any) {
      console.error('❌ Erro detalhado ao atualizar conta a receber:', error);
      console.error('❌ Response data:', error.response?.data);
      console.error('❌ Response status:', error.response?.status);
      console.error('❌ Response headers:', error.response?.headers);
      console.error('❌ Request data enviado:', JSON.stringify(cleanRequestData, null, 2));
      if (error.response?.data?.message) {
        console.error('❌ Mensagem de erro do servidor:', error.response.data.message);
      }
      throw error;
    }
  },

  // Excluir conta
  async deleteContaAReceber(id: string): Promise<void> {
    await api.delete(`/api/accounts-receivable/${id}`);
  },

  async getCategories(): Promise<string[]> {
    try {
      // Usar endpoint de busca com termo vazio para obter todas as categorias
      // Ou retornar valores padrão do enum ReceivableCategory
      const enumValues = ['INVOICE', 'NOTE', 'ADVANCE', 'SERVICE', 'PRODUCT', 'OTHER'];
      return enumValues.map(value => {
        // Mapear para nomes amigáveis
        const nameMap: Record<string, string> = {
          'INVOICE': 'Fatura',
          'NOTE': 'Nota Fiscal',
          'ADVANCE': 'Adiantamento',
          'SERVICE': 'Serviço',
          'PRODUCT': 'Produto',
          'OTHER': 'Outros'
        };
        return nameMap[value] || value;
      });
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      return [
        'Fatura',
        'Nota Fiscal',
        'Adiantamento',
        'Serviço',
        'Produto',
        'Outros'
      ];
    }
  },

  async getCostCenters(): Promise<string[]> {
    try {
      const response = await api.get('/api/cost-centers');
      if (Array.isArray(response.data)) {
        return response.data.map((center: any) => center.name);
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
    const clientes = Array.isArray(data) ? data : [];
    // Filtrar clientes inválidos e garantir que têm nome
    return clientes
      .filter((c: any) => c && c.id && (c.name || c.nome))
      .map((c: any) => ({
        ...c,
        name: c.name || c.nome || '-',
        id: c.id
      }));
  },

  // Buscar todas as empresas
  async getEmpresas(): Promise<any[]> {
    try {
      const response = await api.get('/api/companies');
      console.log('🔍 DEBUG: Resposta da API /api/companies:', response.data);
      const data = Array.isArray(response.data) ? response.data : (response.data?.content ?? []);
      // Normalizar para sempre conter id, name e sigla
      return data.map((c: any) => ({ 
        id: c.id, 
        name: c.name || c.nome || '', 
        sigla: c.sigla || c.acronym || c.abbreviation || c.name?.substring(0, 3).toUpperCase() || ''
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error);
      return [];
    }
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
      cliente: account.clientName || account.client?.name || 'Não informado',
      clienteId: account.clientId || account.client?.id,
      empresa: account.unitSigla || account.unitName || 'Não informado',
      empresaId: account.unitId,
      descricao: account.description,
      tipo: mapBackendTypeToFrontend(account.type || account.category),
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

// Função auxiliar para mapear tipo do frontend para categoria do backend
function mapTypeToCategory(frontendType: 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO'): string {
  switch (frontendType) {
    case 'FATURA':
      return 'INVOICE';
    case 'MEDICAO':
      return 'INVOICE'; // Measurement não existe no enum, usar INVOICE
    case 'SERVICO':
      return 'SERVICE';
    case 'PRODUTO':
      return 'PRODUCT';
    default:
      return 'INVOICE';
  }
}

// Função auxiliar para mapear tipo do frontend para backend (mantida para compatibilidade)
function mapFrontendTypeToBackend(frontendType: 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO'): string {
  return mapTypeToCategory(frontendType);
}

// Função auxiliar para mapear categoria do backend para tipo do frontend (mantida para compatibilidade)
function mapCategoryToFrontendType(category: string | undefined): 'FATURA' | 'MEDICAO' | 'SERVICO' | 'PRODUTO' {
  return mapBackendTypeToFrontend(category);
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