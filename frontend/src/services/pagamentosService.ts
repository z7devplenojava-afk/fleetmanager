import axios from 'axios';
import { isConnectionError } from '@/utils/connectionError';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Interfaces baseadas no backend
export interface Pagamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail?: string;
  clienteTelefone?: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  formaPagamento: 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'CARTAO' | 'DINHEIRO';
  categoria: 'FORNECEDOR' | 'SERVICO' | 'EQUIPAMENTO' | 'IMPOSTO' | 'OUTROS';
  observacoes?: string;
  numeroDocumento?: string;
  centroCusto?: string;
  agendamento?: AgendamentoPagamento;
  createdAt: string;
  updatedAt: string;
}

export interface AgendamentoPagamento {
  id: string;
  pagamentoId: string;
  dataAgendamento: string;
  dataExecucao?: string;
  status: 'AGENDADO' | 'EXECUTADO' | 'CANCELADO';
  observacoes?: string;
  alertasEnviados: boolean;
  createdAt: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  documento?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativo: boolean;
}

export interface CreatePagamentoRequest {
  clienteId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  formaPagamento: 'PIX' | 'BOLETO' | 'TRANSFERENCIA' | 'CARTAO' | 'DINHEIRO';
  categoria: 'FORNECEDOR' | 'SERVICO' | 'EQUIPAMENTO' | 'IMPOSTO' | 'OUTROS';
  observacoes?: string;
  numeroDocumento?: string;
  centroCusto?: string;
  agendarPagamento?: boolean;
  dataAgendamento?: string;
}

export interface UpdatePagamentoRequest extends CreatePagamentoRequest {
  id: string;
}

export interface FiltrosPagamento {
  status?: string;
  categoria?: string;
  formaPagamento?: string;
  dataInicio?: string;
  dataFim?: string;
  clienteId?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  centroCusto?: string;
}

export interface RelatorioPagamentoRequest {
  filtros?: FiltrosPagamento;
  formato: 'PDF' | 'EXCEL';
  periodo?: {
    inicio: string;
    fim: string;
  };
}

class PagamentosService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // ===== PAGAMENTOS =====
  
  async getPagamentos(): Promise<Pagamento[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts-receivable/all`, {
        headers: this.getAuthHeaders()
      });
      // Garantir que sempre retornamos um array válido
      const pagamentos = Array.isArray(response.data) ? response.data : [];
      // Filtrar e validar cada pagamento
      return pagamentos
        .filter((p: any) => p && p.id) // Remover itens inválidos
        .map((p: any) => ({
          ...p,
          dataVencimento: p.dataVencimento || p.dueDate || '',
          clienteNome: p.clienteNome || p.clientName || '-',
          descricao: p.descricao || p.description || '-',
          valor: p.valor || p.amount || 0
        }));
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('⚠️ Backend não está disponível. Usando dados mockados para pagamentos.');
      } else {
        console.error('Erro ao buscar pagamentos:', error);
      }
      // Retornar dados mockados temporariamente
      return this.getMockPagamentos();
    }
  }

  private getMockPagamentos(): Pagamento[] {
    return [
      {
        id: 'PAG-001',
        clienteId: '11111111-1111-1111-1111-111111111111',
        clienteNome: 'Empresa ABC Ltda',
        clienteEmail: 'contato@empresaabc.com',
        clienteTelefone: '(11) 99999-9999',
        descricao: 'Serviços de consultoria - Janeiro 2025',
        valor: 15000.00,
        dataVencimento: '2025-02-15',
        dataPagamento: undefined,
        status: 'OVERDUE',
        formaPagamento: 'BOLETO',
        categoria: 'SERVICO',
        observacoes: 'Cliente solicitou prazo adicional',
        numeroDocumento: 'FAT-2025-001',
        centroCusto: 'CC-001',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 'PAG-002',
        clienteId: '22222222-2222-2222-2222-222222222222',
        clienteNome: 'João Silva ME',
        clienteEmail: 'joao@email.com',
        clienteTelefone: '(11) 77777-7777',
        descricao: 'Venda de produtos - Fevereiro 2025',
        valor: 8500.00,
        dataVencimento: '2025-02-16',
        dataPagamento: '2025-02-14',
        status: 'PAID',
        formaPagamento: 'PIX',
        categoria: 'EQUIPAMENTO',
        observacoes: undefined,
        numeroDocumento: 'FAT-2025-002',
        centroCusto: 'CC-002',
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-14T00:00:00Z'
      },
      {
        id: 'PAG-003',
        clienteId: '33333333-3333-3333-3333-333333333333',
        clienteNome: 'Tech Solutions Ltda',
        clienteEmail: 'contato@techsolutions.com',
        clienteTelefone: '(11) 55555-5555',
        descricao: 'Desenvolvimento de software - Abril 2025',
        valor: 25000.00,
        dataVencimento: '2025-05-01',
        dataPagamento: undefined,
        status: 'PENDING',
        formaPagamento: 'PIX',
        categoria: 'SERVICO',
        observacoes: 'Projeto em andamento',
        numeroDocumento: 'FAT-2025-004',
        centroCusto: 'CC-003',
        createdAt: '2024-04-01T00:00:00Z',
        updatedAt: '2024-04-01T00:00:00Z'
      }
    ];
  }

  async getPagamentoById(id: string): Promise<Pagamento> {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts-receivable/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pagamento:', error);
      throw error;
    }
  }

  async createPagamento(pagamento: CreatePagamentoRequest): Promise<Pagamento> {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts-receivable`, pagamento, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pagamento:', error);
      throw error;
    }
  }

  async updatePagamento(id: string, pagamento: UpdatePagamentoRequest): Promise<Pagamento> {
    try {
      const response = await axios.put(`${API_BASE_URL}/accounts-receivable/${id}`, pagamento, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      throw error;
    }
  }

  async deletePagamento(id: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/accounts-receivable/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao excluir pagamento:', error);
      throw error;
    }
  }

  async markAsPaid(id: string, dataPagamento: string): Promise<Pagamento> {
    try {
      const response = await axios.put(`${API_BASE_URL}/accounts-receivable/${id}/mark-paid`, null, {
        params: { paymentDate: dataPagamento },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
      throw error;
    }
  }

  // ===== AGENDAMENTO DE PAGAMENTOS =====
  
  async agendarPagamento(pagamentoId: string, dataAgendamento: string, observacoes?: string): Promise<AgendamentoPagamento> {
    try {
      const response = await axios.post(`${API_BASE_URL}/scheduled-payments`, {
        paymentId: pagamentoId,
        scheduledDate: dataAgendamento,
        notes: observacoes
      }, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao agendar pagamento:', error);
      throw error;
    }
  }

  async executarAgendamento(agendamentoId: string): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/scheduled-payments/${agendamentoId}/mark-executed`, null, {
        params: { executionDate: new Date().toISOString().split('T')[0] },
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao executar agendamento:', error);
      throw error;
    }
  }

  async cancelarAgendamento(agendamentoId: string): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/scheduled-payments/${agendamentoId}/cancel`, {}, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    }
  }

  async getAgendamentos(): Promise<AgendamentoPagamento[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/scheduled-payments/all`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('⚠️ Backend não está disponível. Usando dados mockados para agendamentos.');
      } else {
        console.error('Erro ao buscar agendamentos:', error);
      }
      // Retornar dados mockados temporariamente
      return this.getMockAgendamentos();
    }
  }

  private getMockAgendamentos(): AgendamentoPagamento[] {
    return [
      {
        id: 'AGD-001',
        pagamentoId: 'PAG-001',
        dataAgendamento: '2024-02-20',
        dataExecucao: undefined,
        status: 'AGENDADO',
        observacoes: 'Agendamento para próxima semana',
        alertasEnviados: true,
        createdAt: '2024-01-15T00:00:00Z'
      },
      {
        id: 'AGD-002',
        pagamentoId: 'PAG-003',
        dataAgendamento: '2024-05-05',
        dataExecucao: undefined,
        status: 'AGENDADO',
        observacoes: 'Agendamento após conclusão do projeto',
        alertasEnviados: false,
        createdAt: '2024-04-01T00:00:00Z'
      }
    ];
  }

  // ===== ALERTAS DE VENCIMENTO =====
  
  async getPagamentosProximosVencimento(dias: number = 3): Promise<Pagamento[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts-receivable/upcoming-due`, {
        params: { days: dias },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pagamentos próximos do vencimento:', error);
      throw error;
    }
  }

  async enviarAlertasVencimento(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/accounts-receivable/send-due-alerts`, {}, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao enviar alertas de vencimento:', error);
      throw error;
    }
  }

  // ===== CLIENTES =====
  
  async getClientes(): Promise<Cliente[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/all`, {
        headers: this.getAuthHeaders()
      });
      // Garantir que sempre retornamos um array válido
      const clientes = Array.isArray(response.data) ? response.data : [];
      // Filtrar clientes inválidos e garantir que têm nome
      return clientes
        .filter((c: any) => c && c.id && (c.name || c.nome))
        .map((c: any) => ({
          ...c,
          nome: c.nome || c.name || '-',
          id: c.id
        }));
    } catch (error: any) {
      if (isConnectionError(error)) {
        console.warn('⚠️ Backend não está disponível. Usando dados mockados para clientes.');
      } else {
        console.error('Erro ao buscar clientes:', error);
      }
      // Retornar dados mockados temporariamente
      return this.getMockClientes();
    }
  }

  private getMockClientes(): Cliente[] {
    return [
      {
        id: '11111111-1111-1111-1111-111111111111',
        nome: 'Empresa ABC Ltda',
        email: 'contato@empresaabc.com',
        telefone: '(11) 99999-9999',
        documento: '12.345.678/0001-90',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        ativo: true
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        nome: 'João Silva ME',
        email: 'joao@email.com',
        telefone: '(11) 77777-7777',
        documento: '123.456.789-00',
        endereco: 'Av. Principal, 456',
        cidade: 'Rio de Janeiro',
        estado: 'RJ',
        cep: '20000-000',
        ativo: true
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        nome: 'Tech Solutions Ltda',
        email: 'contato@techsolutions.com',
        telefone: '(11) 55555-5555',
        documento: '98.765.432/0001-10',
        endereco: 'Rua da Tecnologia, 789',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '04567-890',
        ativo: true
      }
    ];
  }

  async searchClientes(term: string): Promise<Cliente[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/clients/search`, {
        params: { term },
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS =====
  
  async generateRelatorioPagamentos(request: RelatorioPagamentoRequest): Promise<Blob> {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts-receivable/reports`, request, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  async generateRelatorioPagamentosPDF(filtros?: FiltrosPagamento): Promise<Blob> {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts-receivable/reports/pdf`, filtros || {}, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      throw error;
    }
  }

  async generateRelatorioPagamentosExcel(filtros?: FiltrosPagamento): Promise<Blob> {
    try {
      const response = await axios.post(`${API_BASE_URL}/accounts-receivable/reports/excel`, filtros || {}, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao gerar relatório Excel:', error);
      throw error;
    }
  }

  // ===== OPERAÇÕES EM LOTE =====
  
  async deletePagamentos(ids: string[]): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/accounts-receivable/batch`, {
        data: { ids },
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao excluir pagamentos:', error);
      throw error;
    }
  }

  async marcarComoPagos(ids: string[], dataPagamento: string): Promise<void> {
    try {
      await axios.put(`${API_BASE_URL}/accounts-receivable/batch/mark-paid`, {
        ids,
        dataPagamento
      }, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Erro ao marcar pagamentos como pagos:', error);
      throw error;
    }
  }

  // ===== ESTATÍSTICAS =====
  
  async getEstatisticasPagamentos(): Promise<{
    total: number;
    pendentes: number;
    pagos: number;
    vencidos: number;
    valorTotal: number;
    valorPendente: number;
    valorPago: number;
    valorVencido: number;
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/accounts-receivable/statistics`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }
}

export const pagamentosService = new PagamentosService();