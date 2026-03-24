import api from '../lib/axios';

export interface ChatbotConfig {
  id: string;
  name: string;
  welcomeMessage?: string;
  defaultResponse?: string;
  isActive: boolean;
  autoRespond: boolean;
  transferToHumanEnabled: boolean;
  workingHoursEnabled: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offlineMessage?: string;
  maxWaitTimeMinutes: number;
  autoEscalateEnabled: boolean;
  autoEscalateAfterMinutes: number;
  knowledgeBaseEnabled: boolean;
  sentimentAnalysisEnabled: boolean;
  language: string;
  createdAt: string;
  updatedAt?: string;
  createdByName?: string;
  updatedByName?: string;
}

export interface CreateChatbotConfigRequest {
  name: string;
  welcomeMessage?: string;
  defaultResponse?: string;
  isActive?: boolean;
  autoRespond?: boolean;
  transferToHumanEnabled?: boolean;
  workingHoursEnabled?: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offlineMessage?: string;
  maxWaitTimeMinutes?: number;
  autoEscalateEnabled?: boolean;
  autoEscalateAfterMinutes?: number;
  knowledgeBaseEnabled?: boolean;
  sentimentAnalysisEnabled?: boolean;
  language?: string;
}

export interface UpdateChatbotConfigRequest {
  name?: string;
  welcomeMessage?: string;
  defaultResponse?: string;
  isActive?: boolean;
  autoRespond?: boolean;
  transferToHumanEnabled?: boolean;
  workingHoursEnabled?: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  offlineMessage?: string;
  maxWaitTimeMinutes?: number;
  autoEscalateEnabled?: boolean;
  autoEscalateAfterMinutes?: number;
  knowledgeBaseEnabled?: boolean;
  sentimentAnalysisEnabled?: boolean;
  language?: string;
}

const chatbotService = {
  /**
   * Criar nova configuração do chatbot
   */
  async createConfig(request: CreateChatbotConfigRequest): Promise<ChatbotConfig> {
    const response = await api.post('/v1/support/chatbot/config', request);
    return response.data;
  },

  /**
   * Atualizar configuração do chatbot
   */
  async updateConfig(id: string, request: UpdateChatbotConfigRequest): Promise<ChatbotConfig> {
    const response = await api.put(`/v1/support/chatbot/config/${id}`, request);
    return response.data;
  },

  /**
   * Buscar todas as configurações
   */
  async getAllConfigs(): Promise<ChatbotConfig[]> {
    const response = await api.get('/v1/support/chatbot/config');
    return response.data;
  },

  /**
   * Buscar configuração por ID
   */
  async getConfig(id: string): Promise<ChatbotConfig> {
    const response = await api.get(`/v1/support/chatbot/config/${id}`);
    return response.data;
  },

  /**
   * Buscar configuração ativa
   */
  async getActiveConfig(): Promise<ChatbotConfig | null> {
    try {
      const response = await api.get('/v1/support/chatbot/config/active');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Deletar configuração
   */
  async deleteConfig(id: string): Promise<void> {
    await api.delete(`/v1/support/chatbot/config/${id}`);
  }
};

export default chatbotService;

