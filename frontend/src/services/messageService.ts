import api from '@/lib/axios';
import { SystemMessage, ChatMessage, User, Conversation } from '../stores/messageStore';

// Classe de erro customizada para mensagens
export class MessageServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'MessageServiceError';
  }
}

// Utilitário para tratamento de erros
const handleApiError = (error: unknown, context: string): never => {
  console.error(`[MessageService] Erro em ${context}:`, error);

  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response: { status: number; data?: { message?: string }; statusText: string } };
    const status = axiosError.response.status;
    const message = axiosError.response.data?.message || axiosError.response.statusText || 'Erro desconhecido';

    switch (status) {
      case 401:
        throw new MessageServiceError('Sessão expirada. Faça login novamente.', status, error);
      case 403:
        throw new MessageServiceError('Você não tem permissão para esta ação.', status, error);
      case 404:
        throw new MessageServiceError('Recurso não encontrado.', status, error);
      case 422:
        throw new MessageServiceError('Dados inválidos fornecidos.', status, error);
      case 500:
        throw new MessageServiceError('Erro interno do servidor. Tente novamente.', status, error);
      default:
        throw new MessageServiceError(message, status, error);
    }
  } else if (error && typeof error === 'object' && 'request' in error) {
    throw new MessageServiceError('Erro de conexão. Verifique sua internet.', 0, error);
  } else {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new MessageServiceError(errorMessage, 0, error);
  }
};

// Utilitário para obter token de autenticação
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const messageService = {
  // ===== SISTEMA DE MENSAGENS =====

  async getSystemMessages(page = 0, size = 10): Promise<{ messages: SystemMessage[]; totalPages: number; hasNext: boolean }> {
    try {
      const response = await api.get('/v1/messages/received', {
        headers: getAuthHeaders(),
        params: { page, size, sort: 'createdAt,desc' }
      });

      return {
        messages: response.data.content || [],
        totalPages: response.data.totalPages || 0,
        hasNext: !response.data.last
      };
    } catch (error) {
      console.warn('[MessageService] Backend indisponível, usando dados de demonstração');
      // Retornar dados de demonstração para mostrar como funcionaria
      const demoMessages: SystemMessage[] = [
        {
          id: 'demo-1',
          title: 'Bem-vindo ao Sistema de Mensagens',
          content: 'Este é um exemplo de como as mensagens aparecerão quando o backend estiver funcionando. O sistema permite enviar mensagens individuais, para grupos ou globais.',
          type: 'GLOBAL',
          priority: 'NORMAL',
          status: 'UNREAD',
          sender: {
            id: 'demo-sender',
            name: 'Sistema Secure Guard',
            email: 'sistema@secureguard.com'
          },
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo-2',
          title: 'Mensagem de Alta Prioridade',
          content: 'Esta é uma mensagem de exemplo com alta prioridade. Observe como ela é destacada visualmente.',
          type: 'INDIVIDUAL',
          priority: 'HIGH',
          status: 'UNREAD',
          sender: {
            id: 'demo-sender-2',
            name: 'Administrador',
            email: 'admin@secureguard.com'
          },
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
        }
      ];

      return {
        messages: demoMessages,
        totalPages: 1,
        hasNext: false
      };
    }
  },

  async sendSystemMessage(messageData: {
    title: string;
    content: string;
    type: 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL';
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    recipientIds?: string[];
    departmentIds?: string[];
    sendEmail?: boolean;
    sendNotification?: boolean;
    scheduledAt?: string;
  }): Promise<SystemMessage> {
    try {
      // Transformar os dados para o formato esperado pelo backend
      const requestData = {
        title: messageData.title.trim(),
        content: messageData.content.trim(),
        type: messageData.type,
        priority: messageData.priority || 'NORMAL',
        recipientIds: messageData.recipientIds && messageData.recipientIds.length > 0
          ? messageData.recipientIds.filter(id => id && id.trim())
          : undefined,
        departmentIds: messageData.departmentIds && messageData.departmentIds.length > 0
          ? messageData.departmentIds.filter(id => id && id.trim())
          : undefined,
        sendEmail: messageData.sendEmail || false,
        sendNotification: messageData.sendNotification !== false,
        scheduledAt: messageData.scheduledAt && messageData.scheduledAt.trim()
          ? messageData.scheduledAt
          : undefined
      };

      console.log('[MessageService] Enviando dados para o backend:', requestData);

      const response = await api.post('/v1/messages', requestData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });

      console.log('[MessageService] Resposta do backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('[MessageService] Erro detalhado:', error);
      handleApiError(error, 'sendSystemMessage');
    }
  },

  async markSystemMessageAsRead(messageId: string): Promise<void> {
    try {
      await api.put(`/v1/messages/${messageId}/read`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      handleApiError(error, 'markSystemMessageAsRead');
    }
  },

  async getUnreadSystemCount(): Promise<number> {
    try {
      const response = await api.get('/v1/messages/unread/count', {
        headers: getAuthHeaders()
      });
      return response.data || 0;
    } catch (error) {
      console.warn('[MessageService] Backend indisponível, usando contagem de demonstração');
      return 2; // Corresponde às mensagens de demo
    }
  },

  // ===== CHAT INTERNO =====

  async getAvailableUsers(): Promise<User[]> {
    try {
      // Primeiro tenta a API principal de usuários
      const response = await api.get('/users', {
        headers: getAuthHeaders()
      });

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      return response.data
        .filter((u: { active: boolean; username: string }) => u.active && u.username !== currentUser?.username)
        .map((u: { id: string; name?: string; username: string; email: string }) => ({
          id: u.id,
          name: u.name || u.username,
          email: u.email,
          username: u.username,
          isOnline: false // TODO: implementar status online
        }));
    } catch (error) {
      console.warn('[MessageService] API principal falhou, tentando fallback...');

      try {
        // Fallback para API de teste
        const response = await api.get('/test/users', {
          headers: getAuthHeaders()
        });

        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

        return response.data
          .filter((u: { active: boolean; username: string }) => u.active && u.username !== currentUser?.username)
          .map((u: { username: string; email: string }) => ({
            id: u.username, // Usar username como ID temporariamente
            name: u.username,
            email: u.email,
            username: u.username,
            isOnline: false
          }));
      } catch (fallbackError) {
        console.error('[MessageService] Ambas APIs falharam:', fallbackError);
        return [];
      }
    }
  },

  async getRecentConversations(): Promise<Conversation[]> {
    try {
      const response = await api.get('/v1/chat/recent', {
        headers: getAuthHeaders()
      });
      return response.data || [];
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar conversas recentes:', error);
      return [];
    }
  },

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/v1/chat/conversation/${conversationId}`, {
        headers: getAuthHeaders()
      });

      return (response.data || []).map((msg: {
        id: string;
        content: string;
        sender: { id: string; name: string; email: string };
        recipient?: { id: string; name: string; email: string };
        group?: { id: string; name: string };
        department?: { id: string; name: string };
        type: string;
        isRead?: boolean;
        readAt?: string;
        editedAt?: string;
        replyToId?: string;
        createdAt: string;
      }) => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender.id,
          name: msg.sender.name,
          email: msg.sender.email
        },
        recipient: msg.recipient ? {
          id: msg.recipient.id,
          name: msg.recipient.name,
          email: msg.recipient.email
        } : undefined,
        group: msg.group,
        department: msg.department,
        type: msg.type,
        isRead: msg.isRead || false,
        readAt: msg.readAt,
        editedAt: msg.editedAt,
        replyToId: msg.replyToId,
        createdAt: msg.createdAt
      }));
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar mensagens da conversa:', error);
      return [];
    }
  },

  async sendChatMessage(messageData: {
    content: string;
    recipientId?: string;
    groupId?: string;
    departmentId?: string;
    type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
    replyToId?: string;
  }): Promise<ChatMessage> {
    try {
      const response = await api.post('/v1/chat/send', messageData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });

      return {
        id: response.data.id,
        content: response.data.content,
        sender: {
          id: response.data.sender.id,
          name: response.data.sender.name,
          email: response.data.sender.email
        },
        type: response.data.type,
        isRead: response.data.isRead || false,
        readAt: response.data.readAt,
        createdAt: response.data.createdAt,
        replyToId: response.data.replyToId
      };
    } catch (error) {
      handleApiError(error, 'sendChatMessage');
    }
  },

  async editChatMessage(messageId: string, content: string): Promise<ChatMessage> {
    try {
      const response = await api.put(`/v1/chat/${messageId}/edit`, null, {
        headers: getAuthHeaders(),
        params: { content }
      });

      return response.data;
    } catch (error) {
      handleApiError(error, 'editChatMessage');
    }
  },

  async markChatMessageAsRead(messageId: string): Promise<void> {
    try {
      await api.put(`/v1/chat/${messageId}/read`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      handleApiError(error, 'markChatMessageAsRead');
    }
  },

  async getUnreadChatCount(): Promise<number> {
    try {
      const response = await api.get('/v1/chat/unread/count', {
        headers: getAuthHeaders()
      });
      return response.data || 0;
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar contagem de chat não lidas:', error);
      return 0;
    }
  },

  // ===== BUSCA E FILTROS =====

  async searchMessages(query: string, type: 'system' | 'chat' = 'system'): Promise<SystemMessage[] | ChatMessage[]> {
    try {
      const endpoint = type === 'system' ? '/v1/messages/search' : '/v1/chat/search';
      const response = await api.get(endpoint, {
        headers: getAuthHeaders(),
        params: { q: query }
      });
      return response.data || [];
    } catch (error) {
      console.warn('[MessageService] Erro na busca:', error);
      return [];
    }
  }
}; 