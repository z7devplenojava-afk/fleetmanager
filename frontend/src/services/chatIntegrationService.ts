import publicApi from '@/lib/publicApi';
import api from '@/lib/axios';

export interface ChatConversation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  channel: 'WHATSAPP' | 'CHAT_WEB' | 'CHATBOT';
  assignedAgentId?: string;
  assignedAgentName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'BOT';
  senderName?: string;
  senderId?: string;
  timestamp: string;
  read: boolean;
  messageType: 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  metadata?: Record<string, any>;
}

export interface SendMessageRequest {
  conversationId?: string;
  customerPhone: string;
  customerName: string;
  customerEmail?: string;
  content: string;
  channel?: 'WHATSAPP' | 'CHAT_WEB' | 'CHATBOT';
  metadata?: Record<string, any>;
}

export interface ChatConversationListResponse {
  conversations: ChatConversation[];
  total: number;
  unread: number;
}

/**
 * Serviço para integração do chat (WhatsApp/Web/Chatbot) com o painel administrativo.
 * Usa a instância pública do axios (sem redirect para /login) para que o widget
 * público funcione mesmo quando o backend retorna 401/500.
 */
export const chatIntegrationService = {
  // ============ CONVERSAS ============

  /**
   * Listar todas as conversas
   */
  async listConversations(params?: { status?: string; channel?: string; search?: string }): Promise<ChatConversationListResponse> {
    try {
      const response = await publicApi.get('/api/v1/chat/conversations', { params });
      return response.data;
    } catch (error) {
      console.warn('[ChatIntegration] Backend indisponível, usando dados de demonstração');
      return this.getMockConversations();
    }
  },

  /**
   * Buscar uma conversa por ID
   */
  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      const response = await publicApi.get(`/api/v1/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.warn('[ChatIntegration] Erro ao buscar conversa', error);
      return null;
    }
  },

  /**
   * Criar uma nova conversa
   */
  async createConversation(data: { customerName: string; customerPhone: string; customerEmail?: string; channel?: string }): Promise<ChatConversation> {
    try {
      const response = await publicApi.post('/api/v1/chat/conversations', data);
      return response.data;
    } catch (error) {
      // Fallback para desenvolvimento: criar localmente
      const newConversation: ChatConversation = {
        id: `local-${Date.now()}`,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        unreadCount: 0,
        status: 'OPEN',
        channel: (data.channel as any) || 'CHAT_WEB',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.saveLocalConversation(newConversation);
      return newConversation;
    }
  },

  // ============ MENSAGENS ============

  /**
   * Listar mensagens de uma conversa
   */
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const response = await publicApi.get(`/api/v1/chat/conversations/${conversationId}/messages`);
      return response.data.messages || response.data || [];
    } catch (error) {
      console.warn('[ChatIntegration] Usando mensagens locais mockadas');
      return this.getLocalMessages(conversationId);
    }
  },

  /**
   * Enviar mensagem (do cliente via widget público OU do agente via painel)
   */
  async sendMessage(data: SendMessageRequest): Promise<ChatMessage> {
    try {
      const response = await publicApi.post('/api/v1/chat/messages', data);
      return response.data;
    } catch (error) {
      // Fallback local: registrar a mensagem para que apareça no painel
      return this.saveLocalMessage(data);
    }
  },

  /**
   * Responder como agente (do painel administrativo)
   */
  async replyAsAgent(conversationId: string, content: string, agentId: string, agentName: string): Promise<ChatMessage> {
    return this.sendMessage({
      conversationId,
      customerPhone: '',
      customerName: '',
      content,
      metadata: { agentId, agentName, senderType: 'AGENT' },
    });
  },

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(conversationId: string): Promise<void> {
    try {
      await publicApi.post(`/api/v1/chat/conversations/${conversationId}/read`);
    } catch (error) {
      const local = this.getLocalConversations();
      const updated = local.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      localStorage.setItem('chat_conversations', JSON.stringify(updated));
    }
  },

  // ============ ESTATÍSTICAS ============

  /**
   * Obter contadores rápidos para badges do painel
   *
   * Usa a instância autenticada (api) porque o badge do painel é de usuário logado.
   * A instância pública (publicApi) não envia JWT e receberia 403.
   */
  async getStats(): Promise<{ total: number; unread: number; open: number }> {
    try {
      const response = await api.get('/api/v1/chat/stats');
      return response.data;
    } catch (error) {
      const conversations = this.getLocalConversations();
      return {
        total: conversations.length,
        unread: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
        open: conversations.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length,
      };
    }
  },

  // ============ FALLBACK LOCAL (DESENVOLVIMENTO) ============

  getLocalConversations(): ChatConversation[] {
    try {
      const stored = localStorage.getItem('chat_conversations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLocalConversation(conversation: ChatConversation) {
    const conversations = this.getLocalConversations();
    const existing = conversations.findIndex(c => c.id === conversation.id);
    if (existing >= 0) {
      conversations[existing] = conversation;
    } else {
      conversations.unshift(conversation);
    }
    localStorage.setItem('chat_conversations', JSON.stringify(conversations));
  },

  getLocalMessages(conversationId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(`chat_messages_${conversationId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveLocalMessage(data: SendMessageRequest): ChatMessage {
    const conversationId = data.conversationId || `local-${Date.now()}`;
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      content: data.content,
      senderType: (data.metadata?.senderType as any) || 'CUSTOMER',
      senderName: data.customerName,
      timestamp: new Date().toISOString(),
      read: data.metadata?.senderType === 'AGENT',
      messageType: 'TEXT',
      metadata: data.metadata,
    };

    const messages = this.getLocalMessages(conversationId);
    messages.push(message);
    localStorage.setItem(`chat_messages_${conversationId}`, JSON.stringify(messages));

    const conversations = this.getLocalConversations();
    let conv = conversations.find(c => c.id === conversationId);
    if (!conv) {
      conv = {
        id: conversationId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        unreadCount: message.senderType === 'CUSTOMER' ? 1 : 0,
        status: 'OPEN',
        channel: (data.channel as any) || 'CHAT_WEB',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      conversations.unshift(conv);
    } else {
      conv.lastMessage = data.content;
      conv.lastMessageAt = message.timestamp;
      conv.updatedAt = message.timestamp;
      if (message.senderType === 'CUSTOMER') {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
    }
    localStorage.setItem('chat_conversations', JSON.stringify(conversations));

    return message;
  },

  getMockConversations(): ChatConversationListResponse {
    return {
      conversations: this.getLocalConversations(),
      total: this.getLocalConversations().length,
      unread: this.getLocalConversations().reduce((sum, c) => sum + c.unreadCount, 0),
    };
  },
};

export default chatIntegrationService;
