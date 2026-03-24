import api from '@/lib/axios';

export interface WorkPost {
  id: string;
  postCode: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  clientId?: string;
  clientName?: string;
  contractId?: string;
  responsibleId?: string;
  status?: string;
  type?: string;
  requiredVigilantes?: number;
  workSchedule?: string;
  shiftStart?: string;
  shiftEnd?: string;
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

export interface CreateWorkPostRequest {
  postCode: string;
  name: string;
  description?: string;
  type: string;
  status: string;
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

export type UpdateWorkPostRequest = Partial<CreateWorkPostRequest>;

export const workPostService = {
  // Buscar todos os postos de trabalho
  async getAllWorkPosts(): Promise<WorkPost[]> {
    try {
      console.log('🔗 workPostService.getAllWorkPosts - Fazendo requisição para /api/work-posts/all');
      const response = await api.get('/api/work-posts/all');
      console.log('✅ workPostService.getAllWorkPosts - Resposta recebida:', response.data);
      console.log('✅ workPostService.getAllWorkPosts - Tipo de dados:', Array.isArray(response.data) ? 'Array' : typeof response.data);
      console.log('✅ workPostService.getAllWorkPosts - Quantidade:', Array.isArray(response.data) ? response.data.length : 'N/A');
      
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.content)) {
        return response.data.content;
      } else {
        console.warn('⚠️ workPostService.getAllWorkPosts - Formato de resposta inesperado:', response.data);
        return [];
      }
    } catch (error: any) {
      console.error('❌ workPostService.getAllWorkPosts - Erro:', error);
      console.error('❌ workPostService.getAllWorkPosts - Status:', error.response?.status);
      console.error('❌ workPostService.getAllWorkPosts - Data:', error.response?.data);
      console.error('❌ workPostService.getAllWorkPosts - Message:', error.message);
      throw error;
    }
  },

  // Alias para getAllWorkPosts para compatibilidade
  async getWorkPosts(): Promise<WorkPost[]> {
    return this.getAllWorkPosts();
  },

  // Buscar postos por cliente
  async getWorkPostsByClient(clientId: string): Promise<WorkPost[]> {
    try {
      const response = await api.get(`/api/work-posts/client/${clientId}/all`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar postos por cliente:', error);
      throw new Error('Falha ao buscar postos por cliente');
    }
  },

  // Buscar posto por ID
  async getWorkPostById(id: string): Promise<WorkPost> {
    try {
      const response = await api.get(`/api/work-posts/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar posto de trabalho:', error);
      throw new Error('Falha ao buscar posto de trabalho');
    }
  },

  // Criar posto de trabalho
  async createWorkPost(data: CreateWorkPostRequest): Promise<WorkPost> {
    try {
      const response = await api.post('/api/work-posts', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar posto de trabalho:', error);
      throw error;
    }
  },

  // Atualizar posto de trabalho
  async updateWorkPost(id: string, data: UpdateWorkPostRequest): Promise<WorkPost> {
    try {
      const response = await api.put(`/api/work-posts/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar posto de trabalho:', error);
      throw error;
    }
  },

  // Atualizar status do posto
  async updateWorkPostStatus(id: string, status: string): Promise<WorkPost> {
    try {
      const response = await api.put(`/api/work-posts/${id}/status`, null, { params: { status } });
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar status do posto:', error);
      throw error;
    }
  },

  // Excluir posto de trabalho
  async deleteWorkPost(id: string): Promise<void> {
    try {
      await api.delete(`/api/work-posts/${id}`);
    } catch (error) {
      console.error('Erro ao excluir posto de trabalho:', error);
      throw error;
    }
  }
};

export default workPostService;