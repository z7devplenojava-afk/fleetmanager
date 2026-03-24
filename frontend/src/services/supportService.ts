import api from '../lib/axios';

/**
 * Tipos e interfaces
 */

export type AgentStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AWAY';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory = 
  | 'SYSTEM_ACCESS' 
  | 'TECHNICAL_SUPPORT' 
  | 'BILLING' 
  | 'REPORTS' 
  | 'GENERAL_INQUIRY' 
  | 'BUG_REPORT' 
  | 'FEATURE_REQUEST' 
  | 'OTHER';

export interface Agent {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: AgentStatus;
  department: string;
  lastActivity: string;
  totalTickets: number;
  resolvedTickets: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  senderName: string;
  senderEmail?: string;
  isSupport: boolean;
  agentId?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  assignedTo?: Agent;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  companyId?: string;
  messages?: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  assignedToAgentId?: string;
  customerUserId?: string; // Campo para funcionário
  companyId?: string;
}

export interface UpdateTicketRequest {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  category?: TicketCategory;
  assignedToAgentId?: string;
  customerPhone?: string;
}

export interface CreateAgentRequest {
  userId: string;
  department?: string;
  active?: boolean;
}

export interface AddTicketMessageRequest {
  content: string;
  senderName: string;
  senderEmail?: string;
  isSupport?: boolean;
}

export interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  averageResolutionTimeHours: number;
  resolutionRatePercentage: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Serviço de Suporte - Backend Integration
 */
export const supportService = {
  // ===== AGENTS =====
  
  /**
   * Listar todos os agentes
   */
  async getAllAgents(): Promise<Agent[]> {
    const response = await api.get('/v1/support/agents');
    return response.data;
  },

  /**
   * Listar agentes ativos
   */
  async getActiveAgents(): Promise<Agent[]> {
    const response = await api.get('/v1/support/agents/active');
    return response.data;
  },

  /**
   * Buscar agente por ID
   */
  async getAgentById(id: string): Promise<Agent> {
    const response = await api.get(`/v1/support/agents/${id}`);
    return response.data;
  },

  /**
   * Buscar agente por ID do usuário
   */
  async getAgentByUserId(userId: string): Promise<Agent> {
    const response = await api.get(`/v1/support/agents/user/${userId}`);
    return response.data;
  },

  /**
   * Buscar agentes por status
   */
  async getAgentsByStatus(status: AgentStatus): Promise<Agent[]> {
    const response = await api.get(`/v1/support/agents/status/${status}`);
    return response.data;
  },

  /**
   * Buscar agente disponível
   */
  async getAvailableAgent(): Promise<Agent> {
    const response = await api.get('/v1/support/agents/available');
    return response.data;
  },

  /**
   * Criar novo agente
   */
  async createAgent(request: CreateAgentRequest): Promise<Agent> {
    const response = await api.post('/v1/support/agents', request);
    return response.data;
  },

  /**
   * Atualizar status do agente
   */
  async updateAgentStatus(id: string, status: AgentStatus): Promise<Agent> {
    const response = await api.put(`/v1/support/agents/${id}/status`, null, {
      params: { status }
    });
    return response.data;
  },

  /**
   * Atualizar departamento do agente
   */
  async updateAgentDepartment(id: string, department: string): Promise<Agent> {
    const response = await api.put(`/v1/support/agents/${id}/department`, null, {
      params: { department }
    });
    return response.data;
  },

  /**
   * Ativar/desativar agente
   */
  async toggleAgentActive(id: string): Promise<Agent> {
    const response = await api.put(`/v1/support/agents/${id}/toggle-active`);
    return response.data;
  },

  /**
   * Deletar agente
   */
  async deleteAgent(id: string): Promise<void> {
    await api.delete(`/v1/support/agents/${id}`);
  },

  // ===== TICKETS =====

  /**
   * Listar todos os tickets (paginado)
   */
  async getAllTickets(
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    direction: 'ASC' | 'DESC' = 'DESC'
  ): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get('/v1/support/tickets', {
      params: { page, size, sortBy, direction }
    });
    return response.data;
  },

  /**
   * Buscar ticket por ID
   */
  async getTicketById(id: string): Promise<Ticket> {
    const response = await api.get(`/v1/support/tickets/${id}`);
    return response.data;
  },

  /**
   * Buscar tickets por status
   */
  async getTicketsByStatus(
    status: TicketStatus,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get(`/v1/support/tickets/status/${status}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Buscar tickets por agente
   */
  async getTicketsByAgent(
    agentId: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get(`/v1/support/tickets/agent/${agentId}`, {
      params: { page, size }
    });
    return response.data;
  },

  /**
   * Buscar tickets com filtros
   */
  async getTicketsWithFilters(
    filters: {
      status?: TicketStatus;
      priority?: TicketPriority;
      category?: TicketCategory;
      agentId?: string;
    },
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get('/v1/support/tickets/filter', {
      params: { ...filters, page, size }
    });
    return response.data;
  },

  /**
   * Buscar tickets por texto
   */
  async searchTickets(
    searchTerm: string,
    page = 0,
    size = 10
  ): Promise<PaginatedResponse<Ticket>> {
    const response = await api.get('/v1/support/tickets/search', {
      params: { q: searchTerm, page, size }
    });
    return response.data;
  },

  /**
   * Criar novo ticket
   */
  async createTicket(request: CreateTicketRequest): Promise<Ticket> {
    const response = await api.post('/v1/support/tickets', request);
    return response.data;
  },

  /**
   * Atualizar ticket
   */
  async updateTicket(id: string, request: UpdateTicketRequest): Promise<Ticket> {
    const response = await api.put(`/v1/support/tickets/${id}`, request);
    return response.data;
  },

  /**
   * Atribuir ticket a um agente
   */
  async assignTicketToAgent(ticketId: string, agentId: string): Promise<Ticket> {
    const response = await api.put(`/v1/support/tickets/${ticketId}/assign/${agentId}`);
    return response.data;
  },

  /**
   * Adicionar mensagem ao ticket
   */
  async addMessageToTicket(
    ticketId: string,
    request: AddTicketMessageRequest
  ): Promise<TicketMessage> {
    const response = await api.post(`/v1/support/tickets/${ticketId}/messages`, request);
    return response.data;
  },

  /**
   * Buscar mensagens de um ticket
   */
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const response = await api.get(`/v1/support/tickets/${ticketId}/messages`);
    return response.data;
  },

  /**
   * Deletar ticket
   */
  async deleteTicket(id: string): Promise<void> {
    await api.delete(`/v1/support/tickets/${id}`);
  },

  /**
   * Obter métricas de atendimento
   */
  async getTicketMetrics(): Promise<TicketMetrics> {
    const response = await api.get('/v1/support/tickets/metrics');
    return response.data;
  },

  // ===== HELPER FUNCTIONS =====

  /**
   * Mapeia o enum do backend para label em português
   */
  getPriorityLabel(priority: TicketPriority): string {
    const labels: Record<TicketPriority, string> = {
      LOW: 'Baixa',
      NORMAL: 'Normal',
      HIGH: 'Alta',
      URGENT: 'Urgente'
    };
    return labels[priority] || priority;
  },

  /**
   * Mapeia o enum do backend para label em português
   */
  getStatusLabel(status: TicketStatus): string {
    const labels: Record<TicketStatus, string> = {
      OPEN: 'Aberto',
      IN_PROGRESS: 'Em Andamento',
      RESOLVED: 'Resolvido',
      CLOSED: 'Fechado',
      CANCELLED: 'Cancelado'
    };
    return labels[status] || status;
  },

  /**
   * Mapeia o enum do backend para label em português
   */
  getCategoryLabel(category: TicketCategory): string {
    const labels: Record<TicketCategory, string> = {
      SYSTEM_ACCESS: 'Acesso ao Sistema',
      TECHNICAL_SUPPORT: 'Suporte Técnico',
      BILLING: 'Financeiro',
      REPORTS: 'Relatórios',
      GENERAL_INQUIRY: 'Dúvida Geral',
      BUG_REPORT: 'Relato de Bug',
      FEATURE_REQUEST: 'Solicitação de Funcionalidade',
      OTHER: 'Outros'
    };
    return labels[category] || category;
  },

  /**
   * Mapeia o status do agente para label em português
   */
  getAgentStatusLabel(status: AgentStatus): string {
    const labels: Record<AgentStatus, string> = {
      ONLINE: 'Online',
      OFFLINE: 'Offline',
      BUSY: 'Ocupado',
      AWAY: 'Ausente'
    };
    return labels[status] || status;
  }
};

export default supportService;

