import api from '@/lib/axios';
import { SystemMessage, ChatMessage, User, Conversation } from '../stores/messageStore';
import { adaptPaginatedResponse, MessageResponseDTO, adaptMessageResponse, adaptMessageList } from '@/utils/messageAdapter';

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
      const response = await api.get('/api/v1/messages/received', {
        headers: getAuthHeaders(),
        params: { page, size, sort: 'createdAt,desc' }
      });

      // Usar o adaptador para converter a resposta do backend
      return adaptPaginatedResponse(response.data);
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

  async getSentMessages(page = 0, size = 10): Promise<{ messages: SystemMessage[]; totalPages: number; hasNext: boolean }> {
    try {
      const response = await api.get('/api/v1/messages/sent', {
        headers: getAuthHeaders(),
        params: { page, size, sort: 'createdAt,desc' }
      });

      // Usar o adaptador para converter a resposta do backend
      return adaptPaginatedResponse(response.data);
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar mensagens enviadas:', error);
      return {
        messages: [],
        totalPages: 0,
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
    groupIds?: string[];
    departmentIds?: string[];
    sendEmail?: boolean;
    sendNotification?: boolean;
    scheduledAt?: string;
    replyToId?: string;
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
        groupIds: messageData.groupIds && messageData.groupIds.length > 0
          ? messageData.groupIds.filter(id => id && id.trim())
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

      const response = await api.post('/api/v1/messages', requestData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });

      console.log('[MessageService] Resposta do backend:', response.data);
      return adaptMessageResponse(response.data);
    } catch (error) {
      console.error('[MessageService] Erro detalhado:', error);
      handleApiError(error, 'sendSystemMessage');
    }
  },

  async markSystemMessageAsRead(messageId: string): Promise<void> {
    try {
      await api.put(`/api/v1/messages/${messageId}/read`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      handleApiError(error, 'markSystemMessageAsRead');
    }
  },

  async getUnreadSystemCount(): Promise<number> {
    try {
      const response = await api.get('/api/v1/messages/unread/count', {
        headers: getAuthHeaders(),
        validateStatus: (status) => status < 500, // Não lançar erro para 401/403, apenas para 500+
        maxRedirects: 0 // Desabilitar redirecionamentos automáticos para evitar loops
      });
      return response.data || 0;
    } catch (error: any) {
      // Evitar loops de redirecionamento - retornar 0 silenciosamente
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('[MessageService] Usuário sem permissão ou não autenticado, retornando zero');
        return 0;
      }
      if (error?.code === 'ERR_TOO_MANY_REDIRECTS' || error?.message?.includes('redirect')) {
        console.warn('[MessageService] Loop de redirecionamento detectado, retornando zero');
        console.warn('[MessageService] Isso pode indicar problema na configuração do Traefik/nginx no servidor CI');
        return 0;
      }
      if (error?.response?.status === 500) {
        console.warn('[MessageService] Backend retornou erro 500, retornando zero');
        return 0;
      }
      console.warn('[MessageService] Erro ao buscar contagem de mensagens:', error?.message || error);
      return 0; // Sempre retornar 0 em caso de erro para evitar quebrar o frontend
    }
  },

  async getMessagesByStatus(status: 'UNREAD' | 'READ' | 'ARCHIVED', page = 0, size = 10): Promise<{ messages: SystemMessage[]; totalPages: number; hasNext: boolean }> {
    try {
      const response = await api.get(`/api/v1/messages/status/${status}`, {
        headers: getAuthHeaders(),
        params: { page, size, sort: 'createdAt,desc' }
      });

      // Usar o adaptador para converter a resposta do backend
      return adaptPaginatedResponse(response.data);
    } catch (error: any) {
      console.error('[MessageService] Erro ao buscar mensagens por status:', error);
      
      // Se for erro de conexão ou 500, retornar estrutura vazia
      if (!error?.response || error?.response?.status >= 500) {
        console.warn('[MessageService] Backend indisponível ou erro interno, retornando lista vazia');
        return {
          messages: [],
          totalPages: 0,
          hasNext: false
        };
      }
      
      // Para outros erros, lançar exceção para ser tratada pelo chamador
      handleApiError(error, 'getMessagesByStatus');
      // Nunca será alcançado, mas necessário para TypeScript
      return {
        messages: [],
        totalPages: 0,
        hasNext: false
      };
    }
  },

  async getMessageStatistics(): Promise<{ total: number; unread: number; read: number; archived: number }> {
    try {
      const response = await api.get('/api/v1/messages/stats', {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('[MessageService] Erro ao buscar estatísticas de mensagens:', error);
      
      // Retornar valores zero em caso de erro
      return {
        total: 0,
        unread: 0,
        read: 0,
        archived: 0
      };
    }
  },

  // ===== CHAT INTERNO =====

  async getAvailableUsers(): Promise<User[]> {
    try {
      // Tenta a API principal de usuários
      const response = await api.get('/api/users', {
        headers: getAuthHeaders()
      });

      console.log('[MessageService] Resposta da API /api/users:', response.data);

      // Garantir que response.data é um array
      if (!Array.isArray(response.data)) {
        console.warn('[MessageService] Resposta não é um array:', response.data);
        return [];
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const users = response.data
        .filter((u: { active?: boolean; username: string }) => {
          // Incluir usuários ativos ou sem campo active (assumir ativo)
          const isActive = u.active !== false;
          const isNotCurrentUser = u.username !== currentUser?.username;
          return isActive && isNotCurrentUser;
        })
        .map((u: { id: string; name?: string; username: string; email: string; isOnline?: boolean }) => ({
          id: u.id,
          name: u.name || u.username || 'Usuário sem nome',
          email: u.email || '',
          username: u.username || '',
          isOnline: u.isOnline || false
        }));

      console.log('[MessageService] Usuários disponíveis processados:', users.length);
      return users;
    } catch (error) {
      console.error('[MessageService] Erro ao buscar usuários disponíveis:', error);
      return [];
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
      
      // Mapear corretamente as mensagens, garantindo que informações de arquivo sejam preservadas
      return (response.data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content || '',
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
        reactions: msg.reactions || [],
        // Informações do arquivo - CRÍTICO para mensagens com arquivo
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileContentType: msg.fileContentType,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }));
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar mensagens da conversa:', error);
      return [];
    }
  },

  async getGroupMessages(groupId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/v1/chat/group/${groupId}`, {
        headers: getAuthHeaders()
      });
      
      return (response.data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content || '',
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
        reactions: msg.reactions || [],
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileContentType: msg.fileContentType,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }));
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar mensagens do grupo:', error);
      return [];
    }
  },

  async getDepartmentMessages(departmentId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/v1/chat/department/${departmentId}`, {
        headers: getAuthHeaders()
      });
      
      return (response.data || []).map((msg: any) => ({
        id: msg.id,
        content: msg.content || '',
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
        reactions: msg.reactions || [],
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        fileSize: msg.fileSize,
        fileContentType: msg.fileContentType,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }));
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar mensagens do departamento:', error);
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
        replyToId: response.data.replyToId,
        reactions: response.data.reactions || [],
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        fileContentType: response.data.fileContentType
      };
    } catch (error) {
      handleApiError(error, 'sendChatMessage');
    }
  },

  async sendChatMessageWithFile(
    file: File,
    messageData: {
      content?: string;
      recipientId?: string;
      groupId?: string;
      departmentId?: string;
      replyToId?: string;
    }
  ): Promise<ChatMessage> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (messageData.content) formData.append('content', messageData.content);
      if (messageData.recipientId) formData.append('recipientId', messageData.recipientId);
      if (messageData.groupId) formData.append('groupId', messageData.groupId);
      if (messageData.departmentId) formData.append('departmentId', messageData.departmentId);
      if (messageData.replyToId) formData.append('replyToId', messageData.replyToId);

      const response = await api.post('/v1/chat/send-with-file', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        id: response.data.id,
        content: response.data.content || '',
        sender: {
          id: response.data.sender.id,
          name: response.data.sender.name,
          email: response.data.sender.email
        },
        type: response.data.type,
        isRead: response.data.isRead || false,
        readAt: response.data.readAt,
        createdAt: response.data.createdAt,
        replyToId: response.data.replyToId,
        reactions: response.data.reactions || [],
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName,
        fileSize: response.data.fileSize,
        fileContentType: response.data.fileContentType
      };
    } catch (error) {
      handleApiError(error, 'sendChatMessageWithFile');
      throw error;
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

  // ===== REAÇÕES =====

  async toggleReaction(messageId: string, emoji: string): Promise<any> {
    try {
      const response = await api.post(`/v1/chat/${messageId}/reaction`, null, {
        headers: getAuthHeaders(),
        params: { emoji }
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'toggleReaction');
      throw error;
    }
  },

  async getMessageReactions(messageId: string): Promise<any[]> {
    try {
      const response = await api.get(`/v1/chat/${messageId}/reactions`, {
        headers: getAuthHeaders()
      });
      return response.data || [];
    } catch (error) {
      console.warn('[MessageService] Erro ao buscar reações:', error);
      return [];
    }
  },

  async deleteSystemMessage(messageId: string, reason: string): Promise<void> {
    try {
      await api.delete(`/api/v1/messages/${messageId}`, {
        headers: getAuthHeaders(),
        params: { reason }
      });
    } catch (error) {
      handleApiError(error, 'deleteSystemMessage');
    }
  },

  async archiveSystemMessage(messageId: string): Promise<void> {
    try {
      await api.put(`/api/v1/messages/${messageId}/archive`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      handleApiError(error, 'archiveSystemMessage');
    }
  },

  async restoreSystemMessage(messageId: string): Promise<void> {
    try {
      await api.put(`/api/v1/messages/${messageId}/restore`, {}, {
        headers: getAuthHeaders()
      });
    } catch (error) {
      handleApiError(error, 'restoreSystemMessage');
    }
  },

  // ===== BUSCA E FILTROS =====

  async searchMessages(query: string, type: 'system' | 'chat' = 'system'): Promise<SystemMessage[] | ChatMessage[]> {
    try {
      const endpoint = type === 'system' ? '/api/v1/messages/search' : '/api/v1/chat/search';
      const response = await api.get(endpoint, {
        headers: getAuthHeaders(),
        params: { q: query }
      });
      
      if (type === 'system') {
        return adaptMessageList(response.data || []);
      }
      
      return response.data || [];
    } catch (error) {
      console.warn('[MessageService] Erro na busca:', error);
      return [];
    }
  },

  // ===== AÇÕES DE MENSAGEM =====

  async togglePin(messageId: string): Promise<boolean> {
    try {
      const response = await api.post(`/v1/chat/${messageId}/pin`, null, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'togglePin');
    }
  },

  async isPinned(messageId: string): Promise<boolean> {
    try {
      const response = await api.get(`/v1/chat/${messageId}/pin`, {
        headers: getAuthHeaders()
      });
      return response.data || false;
    } catch (error) {
      console.warn('[MessageService] Erro ao verificar fixação:', error);
      return false;
    }
  },

  async toggleFavorite(messageId: string): Promise<boolean> {
    try {
      const response = await api.post(`/v1/chat/${messageId}/favorite`, null, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      handleApiError(error, 'toggleFavorite');
    }
  },

  async isFavorite(messageId: string): Promise<boolean> {
    try {
      const response = await api.get(`/v1/chat/${messageId}/favorite`, {
        headers: getAuthHeaders()
      });
      return response.data || false;
    } catch (error) {
      console.warn('[MessageService] Erro ao verificar favorito:', error);
      return false;
    }
  },

  async reportMessage(messageId: string, reason: string, description?: string): Promise<void> {
    try {
      await api.post(`/v1/chat/${messageId}/report`, null, {
        headers: getAuthHeaders(),
        params: { reason, description }
      });
    } catch (error) {
      handleApiError(error, 'reportMessage');
    }
  },

  async forwardMessage(
    messageId: string,
    recipientIds?: string[],
    groupIds?: string[],
    departmentIds?: string[]
  ): Promise<void> {
    try {
      const params: any = {};
      if (recipientIds && recipientIds.length > 0) {
        params.recipientIds = recipientIds;
      }
      if (groupIds && groupIds.length > 0) {
        params.groupIds = groupIds;
      }
      if (departmentIds && departmentIds.length > 0) {
        params.departmentIds = departmentIds;
      }

      await api.post(`/v1/chat/${messageId}/forward`, null, {
        headers: getAuthHeaders(),
        params
      });
    } catch (error) {
      handleApiError(error, 'forwardMessage');
    }
  }
}; 