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
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    status: 'UNREAD' | 'READ' | 'ARCHIVED';
    sender: User;
    recipients?: User[];
    departments?: { id: string; name: string }[];
    createdAt: string;
    readAt?: string;
    scheduledAt?: string;
    sentAt?: string;
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
            setConversations: (conversations) => set({ conversations }),

            setSelectedConversation: (conversation) => {
                set({ selectedConversation: conversation });
                // Clear messages when changing conversation
                if (conversation) {
                    set({ chatMessages: [] });
                }
            },

            setChatMessages: (messages) => set({ chatMessages: messages }),

            addChatMessage: (message) => set((state) => ({
                chatMessages: [...state.chatMessages, message],
                conversations: state.conversations.map(conv =>
                    conv.id === (message.recipient?.id || message.group?.id || message.department?.id)
                        ? { ...conv, lastMessage: message, unreadCount: conv.unreadCount + 1 }
                        : conv
                )
            })),

            updateChatMessage: (messageId, updates) => set((state) => ({
                chatMessages: state.chatMessages.map(msg =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                )
            })),

            removeChatMessage: (messageId) => set((state) => ({
                chatMessages: state.chatMessages.filter(msg => msg.id !== messageId)
            })),

            setAvailableUsers: (users) => set({ availableUsers: users }),

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
                return state.conversations.reduce((total, conv) => total + conv.unreadCount, 0);
            },

            getFilteredConversations: () => {
                const state = get();
                if (!state.searchTerm) return state.conversations;

                return state.conversations.filter(conv =>
                    conv.name.toLowerCase().includes(state.searchTerm.toLowerCase())
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