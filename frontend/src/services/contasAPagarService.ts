import api from '@/lib/axios';
import { isConnectionError } from '@/utils/connectionError';
import { ContaAPagar } from '@/components/financeiro/ContasAPagarFormModal';
import { formatDateForBackend, parseDateFromBackend } from '@/utils/dateUtils';

export interface CreateContaAPagarRequest {
  invoiceNumber?: string;
  description: string;
  supplierId: string | null;
  clientId?: string | null;
  contractId?: string | null;
  workPostId?: string | null;
  garageId?: string | null;
  unitId: string;
  amount: number;
  type: 'FIXA' | 'VARIAVEL';
  status: 'ABERTA' | 'PAGA' | 'ATRASADA' | 'CANCELADA' | 'VENCIDA';
  dueDate: string;
  issueDate: string;
  paymentDate?: string;
  barcode?: string;
  category?: string;
  notes?: string;
  centroCusto?: string;
  companySigla?: string;
}

export interface UpdateContaAPagarRequest extends Partial<CreateContaAPagarRequest> {
  id: string;
}

export interface ContasAPagarFilters {
  status?: string;
  type?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export interface Supplier {
  id: string;
  name: string;
  tradeName?: string;
  contactName?: string;
  registrationNumber?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  notes?: string;
  documentType?: 'CPF' | 'CNPJ' | string;
  sinceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive: boolean;
}

export interface CreateSupplierRequest {
  name: string;
  tradeName?: string;
  contactName?: string;
  registrationNumber?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  category?: string;
  notes?: string;
  documentType?: 'CPF' | 'CNPJ' | string;
  sinceDate?: string;
}

export type UpdateSupplierRequest = Partial<CreateSupplierRequest> & {
  isActive?: boolean;
};

export interface ImportResultDto {
  inserted: number;
  updated: number;
  skipped: number;
  totalRows: number;
  errors: string[];
}

export interface ExpensePdfImportResultDTO {
  totalRead: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  items: any[];
}

export interface ContasAPagarReport {
  totalContas: number;
  totalValor: number;
  contasAbertas: number;
  valorAbertas: number;
  contasVencidas: number;
  valorVencidas: number;
  contasPagas: number;
  valorPagas: number;
  contasVencendoEm7Dias: number;
  valorVencendoEm7Dias: number;
  porTipo: {
    fixa: { count: number; valor: number };
    variavel: { count: number; valor: number };
  };
  porStatus: Array<{
    status: string;
    count: number;
    valor: number;
  }>;
}

export interface RelatorioDetalhado {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: ContasAPagarReport;
  analiseTemporalMensal: {
    mes: string;
    totalContas: number;
    valorTotal: number;
    contasPagas: number;
    valorPago: number;
    percentualPagamento: number;
  }[];
  analisePorFornecedor: {
    fornecedor: string;
    totalContas: number;
    valorTotal: number;
    valorMedio: number;
    diasMedioPagamento: number;
    contasAtrasadas: number;
  }[];
  analisePorCategoria: {
    categoria: string;
    totalContas: number;
    valorTotal: number;
    percentualTotal: number;
  }[];
  indicadores: {
    ticketMedio: number;
    diasMedioPagamento: number;
    taxaPagamentoNoPrazo: number;
    crescimentoMensal: number;
    concentracaoFornecedores: number;
  };
  alertas: {
    tipo: 'vencimento_proximo' | 'valor_alto' | 'fornecedor_concentracao' | 'atraso_recorrente';
    descricao: string;
    valor?: number;
    quantidade?: number;
    severidade: 'baixa' | 'media' | 'alta';
  }[];
}

export interface DashboardContasAPagar {
  resumoGeral: {
    totalAbertas: number;
    valorTotalAberto: number;
    vencendoHoje: number;
    valorVencendoHoje: number;
    vencidas: number;
    valorVencido: number;
    pagas30Dias: number;
    valorPago30Dias: number;
  };
  proximosVencimentos: ContaAPagar[];
  maioresFornecedores: {
    fornecedor: string;
    valorTotal: number;
    quantidadeContas: number;
  }[];
  evolucaoMensal: {
    mes: string;
    valorPago: number;
    quantidadePaga: number;
  }[];
  distribuicaoPorCategoria: {
    categoria: string;
    valor: number;
    percentual: number;
  }[];
  kpis: {
    prazoMedioPagamento: number;
    ticketMedio: number;
    taxaAdimplencia: number;
    economiaDesconto: number;
  };
}

export interface PrevisaoPagamento {
  data: string;
  valorPrevisto: number;
  contasPrevistas: number;
  liquidezNecessaria: number;
  saldoProjetado: number;
  alertaLiquidez: boolean;
}

export interface AnaliseFluxoPagamento {
  proximosDias: PrevisaoPagamento[];
  proximasSemanas: PrevisaoPagamento[];
  proximosMeses: PrevisaoPagamento[];
  cenarios: {
    otimista: { valor: number; descricao: string };
    realista: { valor: number; descricao: string };
    pessimista: { valor: number; descricao: string };
  };
}

export const contasAPagarService = {
  // ===== CONTAS A PAGAR =====
  
  // Buscar todas as contas
  async getContasAPagar(filters: ContasAPagarFilters = {}): Promise<ContaAPagar[]> {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.supplierId) params.append('supplierId', filters.supplierId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    console.log('🔍 DEBUG: Fazendo requisição para /invoices com params:', params.toString());
    const response = await api.get(`/api/invoices?${params.toString()}`);
    
    console.log('🔍 DEBUG: Resposta da API:', response.data);
    
    // Transformar dados do backend para o formato do frontend
    const invoices = Array.isArray(response.data) ? response.data : response.data.content || [];
    
    console.log('🔍 DEBUG: Invoices processados:', invoices);
    
    return invoices.map((invoice: any): ContaAPagar => {
      // Garantir que supplierId seja convertido para string
      const fornecedorId = invoice.supplierId 
        ? (typeof invoice.supplierId === 'string' ? invoice.supplierId : String(invoice.supplierId))
        : undefined;
      
      // Se não houver supplierName mas houver supplierId, usar 'Não informado' 
      // (o nome será preenchido quando o fornecedor for carregado)
      const fornecedorNome = invoice.supplierName || 'Não informado';
      
      return {
        id: invoice.id,
        dataEmissao: parseDateFromBackend(invoice.issueDate),
        vencimento: parseDateFromBackend(invoice.dueDate) || new Date(),
        fornecedor: fornecedorNome,
        fornecedorId: fornecedorId || '',
        empresa: invoice.companyName || (invoice.company && invoice.company.name) || undefined,
        empresaId: invoice.companyId || (invoice.company && invoice.company.id) || undefined,
        companySigla: invoice.companySigla || (invoice.company && invoice.company.sigla) || undefined,
        cliente: invoice.clientName,
        clienteId: invoice.clientId,
        contrato: invoice.contractNumber,
        contratoId: invoice.contractId,
        obra: invoice.workPostName,
        obraId: invoice.workPostId,
        descricao: invoice.description,
        tipo: invoice.type || 'VARIAVEL',
        valor: parseFloat(invoice.amount),
        codigoBarras: invoice.barcode,
        status: mapBackendStatusToFrontend(invoice.status),
        baixa: invoice.baixa || false,
        dataPagamento: parseDateFromBackend(invoice.paymentDate),
        observacoes: invoice.notes,
        categoria: invoice.category,
        centroCusto: invoice.centroCusto,
        expenseNumber: invoice.expenseNumber,
        installmentSeq: invoice.installmentSeq,
        supplierCode: invoice.supplierCode,
        supplierName: invoice.supplierName,
        interestAmount: invoice.interestAmount != null ? parseFloat(invoice.interestAmount) : undefined,
        fineAmount: invoice.fineAmount != null ? parseFloat(invoice.fineAmount) : undefined,
        discountAmount: invoice.discountAmount != null ? parseFloat(invoice.discountAmount) : undefined,
        adjustmentAmount: invoice.adjustmentAmount != null ? parseFloat(invoice.adjustmentAmount) : undefined,
        paidAmount: invoice.paidAmount != null ? parseFloat(invoice.paidAmount) : undefined,
        balanceAmount: invoice.balanceAmount != null ? parseFloat(invoice.balanceAmount) : undefined,
        bankAccountInfo: invoice.bankAccountInfo,
        isCanceled: invoice.isCanceled
      };
    });
  },

  // Buscar conta por ID
  async getContaAPagarById(id: string): Promise<ContaAPagar> {
      const response = await api.get(`/api/invoices/${id}`);
    const invoice = response.data;
    
    // Garantir que supplierId seja convertido para string
    const fornecedorId = invoice.supplierId 
      ? (typeof invoice.supplierId === 'string' ? invoice.supplierId : String(invoice.supplierId))
      : undefined;
    
    const fornecedorNome = invoice.supplierName || 'Não informado';
    
    return {
      id: invoice.id,
      dataEmissao: parseDateFromBackend(invoice.issueDate),
      vencimento: parseDateFromBackend(invoice.dueDate) || new Date(),
      fornecedor: fornecedorNome,
      fornecedorId: fornecedorId || '',
      empresa: invoice.companyName || (invoice.company && invoice.company.name) || undefined,
      empresaId: invoice.companyId || (invoice.company && invoice.company.id) || undefined,
      companySigla: invoice.companySigla || (invoice.company && invoice.company.sigla) || undefined,
      cliente: invoice.clientName,
      clienteId: invoice.clientId,
      contrato: invoice.contractNumber,
      contratoId: invoice.contractId,
      obra: invoice.workPostName,
      obraId: invoice.workPostId,
      garagem: invoice.garageName,
      garagemId: invoice.garageId,
      descricao: invoice.description,
      tipo: invoice.type || 'VARIAVEL',
      valor: parseFloat(invoice.amount),
      codigoBarras: invoice.barcode,
      status: mapBackendStatusToFrontend(invoice.status),
      baixa: invoice.baixa || false,
      dataPagamento: parseDateFromBackend(invoice.paymentDate),
      observacoes: invoice.notes,
      categoria: invoice.category,
      centroCusto: invoice.centroCusto,
      expenseNumber: invoice.expenseNumber,
      installmentSeq: invoice.installmentSeq,
      supplierCode: invoice.supplierCode,
      supplierName: invoice.supplierName,
      interestAmount: invoice.interestAmount != null ? parseFloat(invoice.interestAmount) : undefined,
      fineAmount: invoice.fineAmount != null ? parseFloat(invoice.fineAmount) : undefined,
      discountAmount: invoice.discountAmount != null ? parseFloat(invoice.discountAmount) : undefined,
      adjustmentAmount: invoice.adjustmentAmount != null ? parseFloat(invoice.adjustmentAmount) : undefined,
      paidAmount: invoice.paidAmount != null ? parseFloat(invoice.paidAmount) : undefined,
      balanceAmount: invoice.balanceAmount != null ? parseFloat(invoice.balanceAmount) : undefined,
      bankAccountInfo: invoice.bankAccountInfo,
      isCanceled: invoice.isCanceled
    };
  },

  // Criar nova conta
  async createContaAPagar(conta: Omit<ContaAPagar, 'id'>): Promise<ContaAPagar> {
    // Buscar uma unidade padrão ou usar UUID padrão
    let unitId = '11111111-1111-1111-1111-111111111111'; // UUID padrão
    
    try {
      const unitsResponse = await api.get('/api/units');
      if (unitsResponse.data && unitsResponse.data.length > 0) {
        unitId = unitsResponse.data[0].id;
      }
    } catch (error) {
      console.warn('Não foi possível buscar unidades, usando UUID padrão:', error);
    }

    const requestData: CreateContaAPagarRequest = {
      description: conta.descricao,
      supplierId: conta.fornecedorId || null, // Enviar null ao invés de string vazia
      clientId: conta.clienteId || null,
      contractId: conta.contratoId || null,
      workPostId: conta.obraId || null,
      garageId: conta.garagemId || null,
      unitId: unitId,
      amount: Number(conta.valor) || 0, // Garantir que seja um número
      type: conta.tipo,
      status: mapFrontendStatusToBackend(conta.status) as any,
      dueDate: formatDateForBackend(conta.vencimento) || '',
      issueDate: formatDateForBackend(conta.dataEmissao) || '',
      paymentDate: formatDateForBackend(conta.dataPagamento),
      barcode: conta.codigoBarras,
      category: conta.categoria === 'NENHUMA' ? undefined : conta.categoria,
      notes: conta.observacoes,
      centroCusto: conta.centroCusto === 'NENHUM' ? undefined : conta.centroCusto,
      companySigla: conta.companySigla
    };


    console.log('Dados da requisição:', requestData);

    try {
      const response = await api.post('/api/invoices', requestData);
      return this.getContaAPagarById(response.data.id);
    } catch (error: any) {
      console.error('Erro detalhado ao criar conta a pagar:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      throw error;
    }
  },

  // Atualizar conta
  async updateContaAPagar(id: string, conta: Partial<ContaAPagar>): Promise<ContaAPagar> {
    const requestData: Partial<CreateContaAPagarRequest> = {};
    
    if (conta.descricao) requestData.description = conta.descricao;
    if (conta.fornecedorId) requestData.supplierId = conta.fornecedorId;
    if (conta.clienteId !== undefined) requestData.clientId = conta.clienteId || null;
    if (conta.contratoId !== undefined) requestData.contractId = conta.contratoId || null;
    if (conta.obraId !== undefined) requestData.workPostId = conta.obraId || null;
    if (conta.garagemId !== undefined) requestData.garageId = conta.garagemId || null;
    if (conta.valor !== undefined) requestData.amount = conta.valor;
    if (conta.tipo) requestData.type = conta.tipo;
    if (conta.status) requestData.status = mapFrontendStatusToBackend(conta.status) as any;
    if (conta.dataEmissao) requestData.issueDate = formatDateForBackend(conta.dataEmissao);
    if (conta.vencimento) requestData.dueDate = formatDateForBackend(conta.vencimento);
    if (conta.dataPagamento) requestData.paymentDate = formatDateForBackend(conta.dataPagamento);
    if (conta.codigoBarras) requestData.barcode = conta.codigoBarras;
    if (conta.categoria !== undefined) requestData.category = conta.categoria === 'NENHUMA' ? undefined : conta.categoria;
    if (conta.observacoes) requestData.notes = conta.observacoes;
    if (conta.centroCusto !== undefined) requestData.centroCusto = conta.centroCusto === 'NENHUM' ? undefined : conta.centroCusto;
    if (conta.companySigla !== undefined) requestData.companySigla = conta.companySigla;
    
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
      const response = await api.put(`/api/invoices/${id}`, requestData);
      return this.getContaAPagarById(response.data.id);
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar conta a pagar:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Request data enviado:', requestData);
      throw error;
    }
  },

  // Excluir conta
  async deleteContaAPagar(id: string): Promise<void> {
    await api.delete(`/api/invoices/${id}`);
  },

  async getCategories(): Promise<string[]> {
    try {
      const response = await api.get('/api/invoices/categories');
      // Verificar se a resposta é um array válido
      if (Array.isArray(response.data)) {
        return response.data;
      }
      // Se não for array ou for HTML, usar fallback
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Retornar categorias padrão
      return [
        'Aluguel',
        'Energia Elétrica',
        'Telefone/Internet',
        'Material de Escritório',
        'Manutenção',
        'Combustível',
        'Alimentação',
        'Transporte',
        'Seguros',
        'Impostos',
        'Outros'
      ];
    }
  },

  async getCostCenters(): Promise<string[]> {
    try {
      const response = await api.get('/api/cost-centers');
      // Verificar se a resposta é um array válido
      if (Array.isArray(response.data)) {
        return response.data.map((center: any) => center.name);
      }
      // Se não for array ou for HTML, usar fallback
      throw new Error('Resposta inválida da API');
    } catch (error) {
      console.error('Erro ao carregar centros de custo:', error);
      // Retornar centros de custo padrão
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

  // Marcar conta como paga
  async marcarComoPaga(id: string, dataPagamento: Date): Promise<ContaAPagar> {
    const response = await api.patch(`/api/invoices/${id}/mark-as-paid`, {
      paymentDate: formatDateForBackend(dataPagamento)
    });
    return this.getContaAPagarById(response.data.id);
  },

  mapInvoiceToContaAPagar(invoice: any): ContaAPagar {
    const fornecedorId = invoice.supplierId 
      ? (typeof invoice.supplierId === 'string' ? invoice.supplierId : String(invoice.supplierId))
      : undefined;
    const fornecedorNome = invoice.supplierName || 'Não informado';

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      dataEmissao: parseDateFromBackend(invoice.issueDate),
      vencimento: parseDateFromBackend(invoice.dueDate) || new Date(),
      fornecedor: fornecedorNome,
      fornecedorId: fornecedorId || '',
      empresa: invoice.companyName || (invoice.company && invoice.company.name) || undefined,
      empresaId: invoice.companyId || (invoice.company && invoice.company.id) || undefined,
      companySigla: invoice.companySigla || (invoice.company && invoice.company.sigla) || undefined,
      cliente: invoice.clientName,
      clienteId: invoice.clientId,
      contrato: invoice.contractNumber,
      contratoId: invoice.contractId,
      obra: invoice.workPostName,
      obraId: invoice.workPostId,
      garagem: invoice.garageName,
      garagemId: invoice.garageId,
      descricao: invoice.description,
      tipo: invoice.type || 'VARIAVEL',
      valor: parseFloat(invoice.amount),
      codigoBarras: invoice.barcode,
      status: mapBackendStatusToFrontend(invoice.status),
      baixa: invoice.baixa || false,
      dataPagamento: parseDateFromBackend(invoice.paymentDate),
      observacoes: invoice.notes,
      categoria: invoice.category,
      centroCusto: invoice.centroCusto,
      expenseNumber: invoice.expenseNumber,
      installmentSeq: invoice.installmentSeq,
      supplierCode: invoice.supplierCode,
      supplierName: invoice.supplierName,
      interestAmount: invoice.interestAmount != null ? parseFloat(invoice.interestAmount) : undefined,
      fineAmount: invoice.fineAmount != null ? parseFloat(invoice.fineAmount) : undefined,
      discountAmount: invoice.discountAmount != null ? parseFloat(invoice.discountAmount) : undefined,
      adjustmentAmount: invoice.adjustmentAmount != null ? parseFloat(invoice.adjustmentAmount) : undefined,
      paidAmount: invoice.paidAmount != null ? parseFloat(invoice.paidAmount) : undefined,
      balanceAmount: invoice.balanceAmount != null ? parseFloat(invoice.balanceAmount) : undefined,
      bankAccountInfo: invoice.bankAccountInfo,
      isCanceled: invoice.isCanceled
    };
  },

  // Importar relatório de despesas PDF (SIGLO)
  async importarDespesasPdf(file: File): Promise<ExpensePdfImportResultDTO> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/api/invoices/import-expenses-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Buscar contas vencidas
  async getContasVencidas(): Promise<ContaAPagar[]> {
    const response = await api.get('/api/invoices/overdue');
    return (Array.isArray(response.data) ? response.data : []).map((invoice: any) => this.mapInvoiceToContaAPagar(invoice));
  },

  // Buscar contas vencendo em breve
  async getContasVencendoEmBreve(dias: number = 7): Promise<ContaAPagar[]> {
    const response = await api.get(`/api/invoices/due-soon/${dias}`);
    return (Array.isArray(response.data) ? response.data : []).map((invoice: any) => this.mapInvoiceToContaAPagar(invoice));
  },

  // ===== FORNECEDORES =====
  
  // Buscar todos os fornecedores
  async getFornecedores(): Promise<Supplier[]> {
    try {
      const response = await api.get('/api/suppliers/all');
      const data = response.data;
      const result = Array.isArray(data) ? data : [];
      console.log('contasAPagarService.getFornecedores:', result.length, 'fornecedores');
      return result;
    } catch (error: any) {
      console.error('contasAPagarService.getFornecedores error:', {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      if (isConnectionError(error)) {
        console.warn('Backend indisponível. Retornando array vazio para fornecedores.');
      }
      return [];
    }
  },

  // Buscar todas as empresas
  async getEmpresas(): Promise<any[]> {
    // Buscar diretamente da tabela de empresas para obter a sigla correta
    const response = await api.get('/api/companies');
    console.log('🔍 DEBUG: Resposta da API /api/companies:', response.data);
    const data = Array.isArray(response.data) ? response.data : (response.data?.content ?? []);
    // Normalizar para sempre conter id, name e sigla
    return data.map((c: any) => ({ id: c.id, name: c.name, sigla: c.sigla }));
  },

  // Criar fornecedor
  async createFornecedor(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await api.post('/api/suppliers', data);
    return response.data;
  },

  // Atualizar fornecedor
  async updateFornecedor(id: string, data: UpdateSupplierRequest): Promise<Supplier> {
    const response = await api.put(`/api/suppliers/${id}`, data);
    return response.data;
  },

  // Excluir fornecedor
  async deleteFornecedor(id: string): Promise<void> {
    await api.delete(`/api/suppliers/${id}`);
  },

  // Excluir múltiplos fornecedores em lote
  async deleteFornecedoresBatch(ids: string[]): Promise<void> {
    await api.post('/api/suppliers/batch-delete', ids);
  },

  // Alternar status (ativo/inativo)
  async toggleFornecedorStatus(id: string): Promise<Supplier> {
    const response = await api.patch(`/api/suppliers/${id}/toggle-status`);
    return response.data;
  },

  // Listar fornecedores ativos
  async getFornecedoresAtivos(): Promise<Supplier[]> {
    const response = await api.get('/api/suppliers/active');
    return response.data;
  },

  // Buscar por CNPJ
  async getFornecedorByCnpj(cnpj: string): Promise<Supplier | null> {
    try {
      const response = await api.get(`/api/suppliers/cnpj/${encodeURIComponent(cnpj)}`);
      return response.data;
    } catch {
      return null;
    }
  },

  // Buscar fornecedor por ID
  async getFornecedorById(id: string): Promise<Supplier> {
    const response = await api.get(`/api/suppliers/${id}`);
    return response.data;
  },

  // Importar fornecedores via planilha Excel ou PDF (upload direto de arquivo)
  async importarFornecedoresArquivo(file: File): Promise<ImportResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ImportResultDto>('/api/suppliers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Alias para retrocompatibilidade
  async importarFornecedoresExcel(file: File): Promise<ImportResultDto> {
    return this.importarFornecedoresArquivo(file);
  },

  // Importar lote estruturado de fornecedores (extraído de PDF ou Excel)
  async importarFornecedoresBatch(suppliers: any[]): Promise<ImportResultDto> {
    const response = await api.post<ImportResultDto>('/api/suppliers/batch', suppliers);
    return response.data;
  },

  // ===== RELATÓRIOS =====
  
  // Gerar relatório de contas a pagar
  async getRelatorioContasAPagar(startDate?: string, endDate?: string): Promise<ContasAPagarReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/api/invoices/reports/summary?${params.toString()}`);
    return response.data;
  },

  // Obter estatísticas rápidas
  async getEstatisticas(): Promise<any> {
    const [contasVencidas, contasVencendoEmBreve, resumo] = await Promise.all([
      this.getContasVencidas(),
      this.getContasVencendoEmBreve(),
      this.getRelatorioContasAPagar()
    ]);

    return {
      contasVencidas: contasVencidas.length,
      valorVencidas: contasVencidas.reduce((sum, c) => sum + c.valor, 0),
      contasVencendoEmBreve: contasVencendoEmBreve.length,
      valorVencendoEmBreve: contasVencendoEmBreve.reduce((sum, c) => sum + c.valor, 0),
      ...resumo
    };
  },

  // ===== RELATÓRIOS AVANÇADOS =====
  async getRelatorioDetalhado(periodo?: {
    dataInicio: string;
    dataFim: string;
  }): Promise<RelatorioDetalhado> {
    try {
      const response = await api.get('/contas-pagar/relatorio-detalhado', {
        params: periodo
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar relatório detalhado:', error);
      throw error;
    }
  },

  async getDashboard(): Promise<DashboardContasAPagar> {
    try {
      const response = await api.get('/contas-pagar/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar dashboard:', error);
      throw error;
    }
  },

  async getAnaliseFluxoPagamento(dias: number = 90): Promise<AnaliseFluxoPagamento> {
    try {
      const response = await api.get('/contas-pagar/analise-fluxo', {
        params: { dias }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise de fluxo de pagamento:', error);
      throw error;
    }
  },

  async getPrevisaoPagamentos(periodo: {
    dataInicio: string;
    dataFim: string;
  }): Promise<PrevisaoPagamento[]> {
    try {
      const response = await api.get('/contas-pagar/previsao-pagamentos', {
        params: periodo
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar previsão de pagamentos:', error);
      throw error;
    }
  },

  async getAnalisePorFornecedor(fornecedorId?: string): Promise<{
    fornecedor: Supplier;
    estatisticas: {
      totalContas: number;
      valorTotal: number;
      valorMedio: number;
      diasMedioPagamento: number;
      taxaAdimplencia: number;
      evolucaoMensal: { mes: string; valor: number; quantidade: number }[];
    };
    contasRecentes: ContaAPagar[];
  }> {
    try {
      const response = await api.get(`/contas-pagar/analise-fornecedor/${fornecedorId}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar análise por fornecedor:', error);
      throw error;
    }
  },

  async getComparativoMensal(meses: number = 12): Promise<{
    mes: string;
    valorPago: number;
    valorPrevisto: number;
    quantidadePaga: number;
    quantidadePrevista: number;
    variacao: number;
  }[]> {
    try {
      const response = await api.get('/contas-pagar/comparativo-mensal', {
        params: { meses }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar comparativo mensal:', error);
      throw error;
    }
  },

  // ===== FUNCIONALIDADES AVANÇADAS =====
  async processarPagamentoLote(contaIds: string[], dataPagamento: string): Promise<{
    processadas: number;
    erros: { id: string; erro: string }[];
  }> {
    try {
      const response = await api.post('/contas-pagar/pagamento-lote', {
        contaIds,
        dataPagamento: formatDateForBackend(new Date(dataPagamento))
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao processar pagamento em lote:', error);
      throw error;
    }
  },

  async agendarPagamento(contaId: string, dataAgendamento: string): Promise<ContaAPagar> {
    try {
      const response = await api.post(`/contas-pagar/${contaId}/agendar`, {
        dataAgendamento: formatDateForBackend(new Date(dataAgendamento))
      });
      return this.mapInvoiceToContaAPagar(response.data);
    } catch (error) {
      console.error('Erro ao agendar pagamento:', error);
      throw error;
    }
  },

  async aplicarDesconto(contaId: string, desconto: {
    tipo: 'percentual' | 'valor';
    valor: number;
    motivo: string;
  }): Promise<ContaAPagar> {
    try {
      const response = await api.post(`/contas-pagar/${contaId}/desconto`, desconto);
      return this.mapInvoiceToContaAPagar(response.data);
    } catch (error) {
      console.error('Erro ao aplicar desconto:', error);
      throw error;
    }
  },

  async duplicarConta(contaId: string, novaDataVencimento: string): Promise<ContaAPagar> {
    try {
      const response = await api.post(`/contas-pagar/${contaId}/duplicar`, {
        novaDataVencimento: formatDateForBackend(new Date(novaDataVencimento))
      });
      return this.mapInvoiceToContaAPagar(response.data);
    } catch (error) {
      console.error('Erro ao duplicar conta:', error);
      throw error;
    }
  },

  async gerarRelatorioPersonalizado(configuracao: {
    campos: string[];
    filtros: ContasAPagarFilters;
    agrupamento?: 'fornecedor' | 'categoria' | 'mes' | 'status';
    formato: 'pdf' | 'excel' | 'csv';
  }): Promise<Blob> {
    try {
      const response = await api.post('/contas-pagar/relatorio-personalizado', configuracao, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório personalizado:', error);
      throw error;
    }
  },

  async exportarDados(formato: 'excel' | 'csv' | 'pdf', filtros?: ContasAPagarFilters): Promise<Blob> {
    try {
      const response = await api.get('/contas-pagar/exportar', {
        params: { formato, ...filtros },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      throw error;
    }
  },

  async importarContas(arquivo: File): Promise<{
    importadas: number;
    erros: { linha: number; erro: string }[];
  }> {
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      const response = await api.post('/contas-pagar/importar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao importar contas:', error);
      throw error;
    }
  },

  async sincronizarComERP(): Promise<{
    sincronizadas: number;
    erros: number;
    detalhes: any[];
  }> {
    try {
      const response = await api.post('/contas-pagar/sincronizar-erp');
      return response.data;
    } catch (error) {
      console.error('Erro ao sincronizar com ERP:', error);
      throw error;
    }
  },

  async obterAuditoria(contaId: string): Promise<{
    id: string;
    acao: string;
    usuario: string;
    data: string;
    detalhes: any;
  }[]> {
    try {
      const response = await api.get(`/contas-pagar/${contaId}/auditoria`);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter auditoria:', error);
      throw error;
    }
  }
};

// Função auxiliar para mapear status do frontend para backend
function mapFrontendStatusToBackend(frontendStatus: 'ABERTA' | 'PAGA' | 'ATRASADA' | 'CANCELADA' | 'VENCIDA'): string {
  switch (frontendStatus) {
    case 'ABERTA':
      return 'PENDENTE';
    case 'PAGA':
      return 'PAGA';
    case 'CANCELADA':
      return 'CANCELADA';
    case 'ATRASADA':
      return 'PENDENTE'; // Mapear para PENDENTE ao invés de ERRO
    case 'VENCIDA':
      return 'PENDENTE'; // Mapear para PENDENTE ao invés de ERRO
    default:
      return 'PENDENTE';
  }
}

// Função auxiliar para mapear status do backend para frontend
function mapBackendStatusToFrontend(backendStatus: string): 'ABERTA' | 'PAGA' | 'ATRASADA' | 'CANCELADA' | 'VENCIDA' {
  switch (backendStatus) {
    case 'PENDENTE':
    case 'PENDENTE_ERRO':
    case 'SOLICITADA':
      return 'ABERTA';
    case 'PAGA':
    case 'PAGA_ANTERIORMENTE':
      return 'PAGA';
    case 'CANCELADA':
      return 'CANCELADA';
    case 'ERRO':
      return 'ATRASADA';
    default:
      return 'ABERTA';
  }
}