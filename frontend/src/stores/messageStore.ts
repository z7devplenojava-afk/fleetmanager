import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Interfaces unificadas
export interface WebSocketConnection {
    client: unknown;
    sendEvent: (destination: string, body: Record<string, unknown>) => boolean;
    sendTyping: (conversationId: string, recipientId?: string, groupId?: string, departmentId?: string) => boolean;
    isConnected: boolean;
}

export interface User {
    id: string;
    name: string;
    email: string;
    username?: string;
    avatar?: string;
    department?: string;
    isOnline?: boolean;
}

export interface ReactionSummary {
    emoji: string;
    count: number;
    userIds: string[];
    currentUserReacted?: boolean;
}

export interface ChatMessage {
    id: string;
    content: string;
    sender: User;
    recipient?: User;
    group?: { id: string; name: string };
    department?: { id: string; name: string };
    type: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'SYSTEM';
    isRead: boolean;
    readAt?: string;
    editedAt?: string;
    replyToId?: string;
    replyToMessage?: ChatMessage;
    reactions?: ReactionSummary[];
    // Informações do arquivo
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileContentType?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface Conversation {
    id: string;
    name: string;
    type: 'individual' | 'group' | 'department';
    lastMessage?: ChatMessage;
    unreadCount: number;
    isOnline?: boolean;
    participants?: User[];
}

export interface SystemMessage {
    id: string;
    title: string;
    content: string;
    type: 'INDIVIDUAL' | 'GROUP' | 'GLOBAL';
    /** Tipo original do backend (ex: 'NOTIFICATION', 'EMAIL') — usado para deep-links */
    rawType?: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'UNREAD' | 'READ' | 'ARCHIVED';
    sender: User;
    recipients?: User[];
    departments?: { id: string; name: string }[];
    createdAt: string;
    readAt?: string;
    scheduledAt?: string;
    sentAt?: string;
    replyToId?: string;
    replyTo?: SystemMessage;
}

interface MessageState {
    // Chat state
    conversations: Conversation[];
    selectedConversation: Conversation | null;
    chatMessages: ChatMessage[];
    availableUsers: User[];

    // System messages state
    systemMessages: SystemMessage[];
    unreadSystemCount: number;

    // UI state
    loading: boolean;
    error: string | null;
    searchTerm: string;
    typingUsers: Set<string>;

    // WebSocket connection
    wsConnection: WebSocketConnection | null;
    isConnected: boolean;

    // Actions
    setConversations: (conversations: Conversation[]) => void;
    setSelectedConversation: (conversation: Conversation | null) => void;
    setChatMessages: (messages: ChatMessage[]) => void;
    addChatMessage: (message: ChatMessage) => void;
    updateChatMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
    removeChatMessage: (messageId: string) => void;

    setAvailableUsers: (users: User[]) => void;
    updateUserStatus: (userId: string, isOnline: boolean) => void;
    setSystemMessages: (messages: SystemMessage[]) => void;
    addSystemMessage: (message: SystemMessage) => void;
    updateSystemMessage: (messageId: string, updates: Partial<SystemMessage>) => void;

    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setSearchTerm: (term: string) => void;

    addTypingUser: (userId: string) => void;
    removeTypingUser: (userId: string) => void;

    setWsConnection: (connection: WebSocketConnection | null) => void;
    setIsConnected: (connected: boolean) => void;

    // Computed getters
    getUnreadChatCount: () => number;
    getFilteredConversations: () => Conversation[];
    getCurrentUser: () => User | null;
}

export const useMessageStore = create<MessageState>()(
    devtools(
        (set, get) => ({
            // Initial state
            conversations: [],
            selectedConversation: null,
            chatMessages: [],
            availableUsers: [],
            systemMessages: [],
            unreadSystemCount: 0,
            loading: false,
            error: null,
            searchTerm: '',
            typingUsers: new Set(),
            wsConnection: null,
            isConnected: false,

            // Actions
            setConversations: (conversations) => {
                const validConversations = Array.isArray(conversations) ? conversations : [];
                // Deduplicar conversas por ID e tipo
                const uniqueConversations = validConversations.reduce((acc, conv) => {
                    if (!conv || !conv.id) return acc;
                    const key = `${conv.type}-${conv.id}`;
                    const existing = acc.find(c => `${c.type}-${c.id}` === key);
                    if (!existing) {
                        acc.push(conv);
                    } else {
                        // Manter a conversa com mais informações (nome, última mensagem, etc)
                        const betterConv = conv.name && conv.name !== 'Conversa sem nome' 
                            ? conv 
                            : existing.name && existing.name !== 'Conversa sem nome'
                                ? existing
                                : conv.lastMessage?.createdAt && existing.lastMessage?.createdAt
                                    ? (new Date(conv.lastMessage.createdAt) > new Date(existing.lastMessage.createdAt) ? conv : existing)
                                    : conv;
                        const index = acc.indexOf(existing);
                        acc[index] = betterConv;
                    }
                    return acc;
                }, [] as Conversation[]);
                // Ordenar por última mensagem (mais recente primeiro)
                uniqueConversations.sort((a, b) => {
                    const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                    const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                    return bTime - aTime;
                });
                set({ conversations: uniqueConversations });
            },

            setSelectedConversation: (conversation) => {
                set({ selectedConversation: conversation });
                // Clear messages when changing conversation
                if (conversation) {
                    set({ chatMessages: [] });
                }
            },

            setChatMessages: (messages) => set({ 
                chatMessages: Array.isArray(messages) ? messages : [] 
            }),

            addChatMessage: (message) => set((state) => {
                // Verificar se a mensagem já existe (evitar duplicatas)
                const messageExists = Array.isArray(state.chatMessages) && 
                    state.chatMessages.some(msg => msg.id === message.id);
                
                if (messageExists) {
                    console.log('[Store] Mensagem já existe, ignorando:', message.id);
                    return state;
                }
                
                // Determinar o ID e tipo da conversa baseado no tipo de mensagem
                let conversationId: string | undefined;
                let conversationType: 'individual' | 'group' | 'department' = 'individual';
                let conversationName: string = 'Conversa sem nome';
                
                if (message.recipient?.id) {
                    conversationId = message.recipient.id;
                    conversationType = 'individual';
                    conversationName = message.recipient.name || message.recipient.username || 'Usuário';
                } else if (message.group?.id) {
                    conversationId = message.group.id;
                    conversationType = 'group';
                    conversationName = message.group.name || 'Grupo';
                } else if (message.department?.id) {
                    conversationId = message.department.id;
                    conversationType = 'department';
                    conversationName = message.department.name || 'Departamento';
                }
                
                // Adicionar mensagem ao array
                const updatedMessages = Array.isArray(state.chatMessages) 
                    ? [...state.chatMessages, message]
                    : [message];
                
                // Verificar se a conversa já existe (usando chave única: type-id)
                const currentConversationId = state.selectedConversation?.id;
                const conversations = Array.isArray(state.conversations) ? state.conversations : [];
                const conversationKey = conversationId ? `${conversationType}-${conversationId}` : null;
                const existingConversationIndex = conversationKey ? conversations.findIndex(conv => {
                    const convKey = `${conv.type}-${conv.id}`;
                    return convKey === conversationKey;
                }) : -1;
                
                let updatedConversations: Conversation[];
                
                if (existingConversationIndex >= 0) {
                    // Conversa existe, atualizar
                    updatedConversations = conversations.map((conv, index) => {
                        if (index === existingConversationIndex) {
                            const shouldIncrementUnread = conv.id !== currentConversationId;
                            return {
                                ...conv,
                                lastMessage: message,
                                unreadCount: shouldIncrementUnread ? conv.unreadCount + 1 : conv.unreadCount,
                                isOnline: conversationType === 'individual' && message.sender?.isOnline ? true : conv.isOnline
                            };
                        }
                        return conv;
                    });
                    
                    // Mover conversa atualizada para o topo
                    const updatedConv = updatedConversations[existingConversationIndex];
                    updatedConversations.splice(existingConversationIndex, 1);
                    updatedConversations.unshift(updatedConv);
                } else if (conversationId) {
                    // Conversa não existe, criar nova apenas se tiver informações suficientes
                    // Não criar conversas vazias ou sem nome adequado
                    if (conversationName && conversationName !== 'Conversa sem nome') {
                        const newConversation: Conversation = {
                            id: conversationId,
                            name: conversationName,
                            type: conversationType,
                            lastMessage: message,
                            unreadCount: conversationId !== currentConversationId ? 1 : 0,
                            isOnline: conversationType === 'individual' && message.sender?.isOnline ? true : false
                        };
                        // Adicionar no início da lista
                        updatedConversations = [newConversation, ...conversations];
                        console.log('[Store] Nova conversa criada:', newConversation);
                    } else {
                        // Se não tem nome adequado, não criar a conversa ainda
                        // Ela será criada quando o backend retornar ou quando tiver mais informações
                        updatedConversations = conversations;
                        console.log('[Store] Conversa sem nome adequado, ignorando criação automática');
                    }
                } else {
                    updatedConversations = conversations;
                }
                
                return {
                    chatMessages: updatedMessages,
                    conversations: updatedConversations
                };
            }),

            updateChatMessage: (messageId, updates) => set((state) => ({
                chatMessages: Array.isArray(state.chatMessages) ? state.chatMessages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                ) : []
            })),

            removeChatMessage: (messageId) => set((state) => ({
                chatMessages: Array.isArray(state.chatMessages) ? state.chatMessages.filter(msg => msg.id !== messageId) : []
            })),

            setAvailableUsers: (users) => set({ 
                availableUsers: Array.isArray(users) ? users : [] 
            }),

            updateUserStatus: (userId, isOnline) => {
                if (!userId) return; // Ignorar se userId não for fornecido
                
                set((state) => {
                    // Verificar se o status já está atualizado para evitar atualizações desnecessárias
                    const currentUser = Array.isArray(state.availableUsers) 
                        ? state.availableUsers.find(user => user.id === userId)
                        : null;
                    
                    // Verificar se há conversas que precisam ser atualizadas
                    const needsConversationUpdate = Array.isArray(state.conversations) && 
                        state.conversations.some(conv => 
                            conv.type === 'individual' && conv.id === userId && conv.isOnline !== isOnline
                        );
                    
                    // Se o status já está correto e não há conversas para atualizar, não fazer nada
                    if (currentUser && currentUser.isOnline === isOnline && !needsConversationUpdate) {
                        return state; // Retornar estado inalterado para evitar re-renders
                    }
                    
                    // Se o usuário não existe no availableUsers, não fazer nada (não criar novo array)
                    if (!currentUser && !needsConversationUpdate) {
                        return state;
                    }
                    
                    // Atualizar usuários se necessário
                    const updatedUsers = currentUser && currentUser.isOnline !== isOnline && Array.isArray(state.availableUsers)
                        ? state.availableUsers.map(user =>
                            user.id === userId ? { ...user, isOnline } : user
                        )
                        : state.availableUsers;
                    
                    // Atualizar conversas se necessário
                    const updatedConversations = needsConversationUpdate && Array.isArray(state.conversations)
                        ? state.conversations.map(conv =>
                            conv.type === 'individual' && conv.id === userId
                                ? { ...conv, isOnline }
                                : conv
                        )
                        : state.conversations;
                    
                    // Só retornar novo objeto se houver mudanças reais
                    if (updatedUsers === state.availableUsers && updatedConversations === state.conversations) {
                        return state;
                    }
                    
                    return {
                        availableUsers: updatedUsers,
                        conversations: updatedConversations
                    };
                });
            },

            setSystemMessages: (messages) => set({ systemMessages: messages }),

            addSystemMessage: (message) => set((state) => ({
                systemMessages: [message, ...state.systemMessages],
                unreadSystemCount: message.status === 'UNREAD'
                    ? state.unreadSystemCount + 1
                    : state.unreadSystemCount
            })),

            updateSystemMessage: (messageId, updates) => set((state) => ({
                systemMessages: state.systemMessages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                unreadSystemCount: updates.status === 'READ' && state.systemMessages.find(m => m.id === messageId)?.status === 'UNREAD'
                    ? Math.max(0, state.unreadSystemCount - 1)
                    : state.unreadSystemCount
            })),

            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            setSearchTerm: (term) => set({ searchTerm: term }),

            addTypingUser: (userId) => set((state) => ({
                typingUsers: new Set([...state.typingUsers, userId])
            })),

            removeTypingUser: (userId) => set((state) => {
                const newTypingUsers = new Set(state.typingUsers);
                newTypingUsers.delete(userId);
                return { typingUsers: newTypingUsers };
            }),

            setWsConnection: (connection) => set({ wsConnection: connection }),
            setIsConnected: (connected) => set({ isConnected: connected }),

            // Computed getters
            getUnreadChatCount: () => {
                const state = get();
                const conversations = Array.isArray(state.conversations) ? state.conversations : [];
                return conversations.reduce((total, conv) => total + (conv?.unreadCount || 0), 0);
            },

            getFilteredConversations: () => {
                const state = get();
                const conversations = Array.isArray(state.conversations) ? state.conversations : [];
                if (!state.searchTerm) return conversations;

                return conversations.filter(conv =>
                    conv && conv.name && typeof conv.name === 'string' && conv.name.toLowerCase().includes(state.searchTerm.toLowerCase())
                );
            },

            getCurrentUser: () => {
                const userStr = localStorage.getItem('user');
                return userStr ? JSON.parse(userStr) : null;
            }
        }),
        {
            name: 'message-store'
        }
    )
);