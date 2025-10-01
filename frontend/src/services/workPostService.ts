import api from '@/lib/axios';

export interface WorkPost {
  id: string;
  postCode: string;
  name: string;
  description?: string;
  type: 'POSTO_24H' | 'POSTO_SDF' | 'POSTO_12H_NOTURNO' | 'POSTO_12H_DIURNO' | 'POSTO_6H' | 'POSTO_8H' | 'OUTROS';
  status: 'EM_IMPLANTACAO' | 'ATIVO' | 'INATIVO' | 'SUSPENSO' | 'CANCELADO' | 'EM_ANALISE' | 'PENDENTE';
  
  // Localização
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  
  // Relacionamentos
  clientId: string;
  contractId?: string;
  responsibleId?: string;
  
  // Configuração de Pessoal
  requiredVigilantes: number;
  workSchedule: string;
  shiftStart: string;
  shiftEnd: string;
  shiftDescription?: string;
  
  // Benefícios e Condições
  transportVoucher?: boolean;
  costAllowance?: boolean;
  costAllowanceValue?: number;
  intrajourney?: boolean;
  localMeal?: boolean;
  mealTicket?: boolean;
  healthPlan?: boolean;
  dentalPlan?: boolean;
  
  // Recursos e Equipamentos
  cars?: number;
  motorcycles?: number;
  radios?: number;
  corporates?: number;
  documentBank?: boolean;
  
  // Conformidade Legal
  nrs?: string[];
  pgr?: boolean;
  pcmso?: boolean;
  epis?: string[];
  trainings?: string[];
  
  // Implantação
  implementationDate?: string;
  implementationTime?: string;
  observations?: string;
  
  // Campos adicionais para resposta
  clientName?: string;
  clientCnpj?: string;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkPostRequest {
  postCode: string;
  name: string;
  description?: string;
  type: WorkPost['type'];
  status?: WorkPost['status'];
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  clientId: string;
  contractId?: string;
  responsibleId?: string;
  requiredVigilantes: number;
  workSchedule: string;
  shiftStart: string;
  shiftEnd: string;
  shiftDescription?: string;
  transportVoucher?: boolean;
  costAllowance?: boolean;
  costAllowanceValue?: number;
  intrajourney?: boolean;
  localMeal?: boolean;
  mealTicket?: boolean;
  healthPlan?: boolean;
  dentalPlan?: boolean;
  cars?: number;
  motorcycles?: number;
  radios?: number;
  corporates?: number;
  documentBank?: boolean;
  nrs?: string[];
  pgr?: boolean;
  pcmso?: boolean;
  epis?: string[];
  trainings?: string[];
  implementationDate?: string;
  implementationTime?: string;
  observations?: string;
}

export interface UpdateWorkPostRequest extends Partial<CreateWorkPostRequest> {
  id: string;
}

export interface WorkPostFilters {
  searchTerm?: string;
  status?: string;
  type?: string;
  clientId?: string;
  contractId?: string;
  responsibleId?: string;
  city?: string;
  state?: string;
  implementationDateStart?: string;
  implementationDateEnd?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'ASC' | 'DESC';
}

export const workPostService = {
  // Buscar todos os postos com filtros
  async getWorkPosts(filters: WorkPostFilters = {}): Promise<WorkPost[]> {
    const hasPagination = filters.page !== undefined && filters.size !== undefined;
    if (!hasPagination && Object.keys(filters).length === 0) {
      // Busca todos sem paginação
      const response = await api.get('/api/work-posts/all');
      return response.data;
    }
    
    const params = new URLSearchParams();
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.contractId) params.append('contractId', filters.contractId);
    if (filters.responsibleId) params.append('responsibleId', filters.responsibleId);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.implementationDateStart) params.append('implementationDateStart', filters.implementationDateStart);
    if (filters.implementationDateEnd) params.append('implementationDateEnd', filters.implementationDateEnd);
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDir) params.append('sortDir', filters.sortDir);

    const response = await api.get(`/api/work-posts?${params.toString()}`);
    return response.data;
  },

  // Buscar posto por ID
  async getWorkPostById(id: string): Promise<WorkPost> {
    const response = await api.get(`/api/work-posts/${id}`);
    return response.data;
  },

  // Buscar posto por código
  async getWorkPostByCode(postCode: string): Promise<WorkPost> {
    const response = await api.get(`/api/work-posts/code/${postCode}`);
    return response.data;
  },

  // Criar novo posto
  async createWorkPost(workPostData: CreateWorkPostRequest): Promise<WorkPost> {
    // Preparar dados para o backend
    const backendData = {
      ...workPostData,
      // Converter clientId de string para o formato correto
      clientId: workPostData.clientId,
      // Garantir que campos numéricos não sejam NaN ou undefined
      requiredVigilantes: workPostData.requiredVigilantes || 1,
      cars: workPostData.cars || 0,
      motorcycles: workPostData.motorcycles || 0,
      radios: workPostData.radios || 0,
      corporates: workPostData.corporates || 0,
      costAllowanceValue: workPostData.costAllowanceValue || 0,
      // Garantir que booleans tenham valores definidos
      transportVoucher: workPostData.transportVoucher || false,
      costAllowance: workPostData.costAllowance || false,
      intrajourney: workPostData.intrajourney || false,
      localMeal: workPostData.localMeal || false,
      mealTicket: workPostData.mealTicket || false,
      healthPlan: workPostData.healthPlan || false,
      dentalPlan: workPostData.dentalPlan || false,
      documentBank: workPostData.documentBank || false,
      pgr: workPostData.pgr || false,
      pcmso: workPostData.pcmso || false,
      // Garantir que arrays estejam definidos e sejam válidos
      nrs: Array.isArray(workPostData.nrs) ? workPostData.nrs : [],
      epis: Array.isArray(workPostData.epis) ? workPostData.epis : [],
      trainings: Array.isArray(workPostData.trainings) ? workPostData.trainings : [],
      // Converter horários para formato ISO (HH:mm:ss) que o backend espera
      shiftStart: workPostData.shiftStart ? this.formatTimeForBackend(workPostData.shiftStart) : '08:00:00',
      shiftEnd: workPostData.shiftEnd ? this.formatTimeForBackend(workPostData.shiftEnd) : '16:00:00',
    };
    
    console.log('Dados enviados para o backend:', backendData);
    
    const response = await api.post('/api/work-posts', backendData);
    return response.data;
  },

  // Atualizar posto
  async updateWorkPost(id: string, workPostData: UpdateWorkPostRequest): Promise<WorkPost> {
    // Preparar dados para o backend com formatação de horários
    const backendData = {
      ...workPostData,
      // Converter horários se fornecidos
      shiftStart: workPostData.shiftStart ? this.formatTimeForBackend(workPostData.shiftStart) : undefined,
      shiftEnd: workPostData.shiftEnd ? this.formatTimeForBackend(workPostData.shiftEnd) : undefined,
    };
    
    const response = await api.put(`/api/work-posts/${id}`, backendData);
    return response.data;
  },

  // Excluir posto
  async deleteWorkPost(id: string): Promise<void> {
    await api.delete(`/api/work-posts/${id}`);
  },

  // Atualizar status do posto
  async updateWorkPostStatus(id: string, status: string): Promise<WorkPost> {
    const response = await api.patch(`/api/work-posts/${id}/status?status=${status}`);
    return response.data;
  },

  // Buscar postos por status
  async getWorkPostsByStatus(status: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/status/${status}`);
    return response.data;
  },

  // Buscar postos por tipo
  async getWorkPostsByType(type: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/type/${type}`);
    return response.data;
  },

  // Buscar postos por cliente
  async getWorkPostsByClient(clientId: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/client/${clientId}`);
    return response.data;
  },

  // Buscar postos por contrato
  async getWorkPostsByContract(contractId: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/contract/${contractId}`);
    return response.data;
  },

  // Buscar postos para implantação em período
  async getWorkPostsToBeImplemented(startDate: string, endDate: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/implementation/period?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Verificar se código do posto já existe
  async checkPostCodeExists(postCode: string): Promise<boolean> {
    try {
      await api.get(`/api/work-posts/code/${postCode}`);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Buscar postos com filtros avançados
  async searchWorkPosts(query: string): Promise<WorkPost[]> {
    const response = await api.get(`/api/work-posts/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Buscar postos ativos
  async getActiveWorkPosts(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('ATIVO');
  },

  // Buscar postos em implantação
  async getWorkPostsInImplementation(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('EM_IMPLANTACAO');
  },

  // Buscar postos inativos
  async getInactiveWorkPosts(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('INATIVO');
  },

  // Buscar postos suspensos
  async getSuspendedWorkPosts(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('SUSPENSO');
  },

  // Buscar postos cancelados
  async getCancelledWorkPosts(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('CANCELADO');
  },

  // Buscar postos em análise
  async getWorkPostsInAnalysis(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('EM_ANALISE');
  },

  // Buscar postos pendentes
  async getPendingWorkPosts(): Promise<WorkPost[]> {
    return this.getWorkPostsByStatus('PENDENTE');
  },

  // Gerar relatório de postos
  async generateWorkPostsReport(filters: WorkPostFilters = {}): Promise<any> {
    const workPosts = await this.getWorkPosts(filters);
    
    const report = {
      totalWorkPosts: workPosts.length,
      byStatus: workPosts.reduce((acc, workPost) => {
        acc[workPost.status] = (acc[workPost.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byType: workPosts.reduce((acc, workPost) => {
        acc[workPost.type] = (acc[workPost.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byClient: workPosts.reduce((acc, workPost) => {
        acc[workPost.clientName || 'Sem cliente'] = (acc[workPost.clientName || 'Sem cliente'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byCity: workPosts.reduce((acc, workPost) => {
        if (workPost.city) {
          acc[workPost.city] = (acc[workPost.city] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      totalVigilantes: workPosts.reduce((total, workPost) => total + workPost.requiredVigilantes, 0),
      workPosts
    };

    return report;
  },

  // Obter estatísticas de postos
  async getWorkPostStats(): Promise<any> {
    const response = await api.get('/api/work-posts/stats/count');
    return response.data;
  },

  // Método auxiliar para formatar horário para o backend
  formatTimeForBackend(timeString: string): string {
    // Se já está no formato HH:mm:ss, retorna como está
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      if (parts.length === 2) {
        // Formato HH:mm -> converte para HH:mm:ss
        return `${timeString}:00`;
      } else if (parts.length === 3) {
        // Formato HH:mm:ss -> retorna como está
        return timeString;
      }
    }
    
    // Se não conseguir parsear, retorna horário padrão
    console.warn(`Formato de horário inválido: ${timeString}, usando 08:00:00`);
    return '08:00:00';
  }
}; 