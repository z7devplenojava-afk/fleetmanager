import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  MessageCircle, 
  Send, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Reply, 
  X, 
  AlertCircle, 
  Wifi, 
  WifiOff,
  Loader2,
  Info,
  Archive,
  Copy,
  Forward,
  Pin,
  Star,
  CheckSquare,
  Flag,
  Heart,
  ThumbsUp,
  Smile,
  Plus,
  Check,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  File,
  Mic,
  Play,
  Download,
  Camera,
  Square,
  Menu
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';
import { useMessageStore, User, ChatMessage, Conversation } from '@/stores/messageStore';
import { messageService, MessageServiceError } from '@/services/messageService';
import { useWebSocket } from '@/hooks/useWebSocket';
import { groupService } from '@/services/groupService';
import api from '@/lib/axios';
import { getApiUrl, getChatFileUrl } from '@/config/environment';

const ChatInterno: React.FC = () => {
  const MIN_SEARCH_LENGTH = 3;
  // Estado local para UI
  const [newMessage, setNewMessage] = useState('');
  const [chatType, setChatType] = useState<'individual' | 'group' | 'department'>('individual');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingModalUsers, setLoadingModalUsers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loadingGroupMembers, setLoadingGroupMembers] = useState(false);
  const [showOnlyOnline, setShowOnlyOnline] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [favoriteMessages, setFavoriteMessages] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState<ChatMessage | null>(null);
  const [forwardRecipients, setForwardRecipients] = useState<string[]>([]);
  const [forwardGroups, setForwardGroups] = useState<string[]>([]);
  const [forwardDepartments, setForwardDepartments] = useState<string[]>([]);
  const [forwardShowOnlyOnline, setForwardShowOnlyOnline] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [messageToReport, setMessageToReport] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef<number>(0);
  const userStatusUpdatedRef = useRef<{ userId: string | null; isOnline: boolean | null }>({ userId: null, isOnline: null });
  const { toast } = useToast();
  
  // Estado global do store
  const {
    conversations,
    selectedConversation,
    chatMessages,
    availableUsers,
    loading,
    error,
    searchTerm,
    typingUsers,
    isConnected,
    setConversations,
    setSelectedConversation,
    setChatMessages,
    addChatMessage,
    updateChatMessage,
    removeChatMessage,
    setAvailableUsers,
    updateUserStatus,
    setLoading,
    setError,
    setSearchTerm,
    getFilteredConversations,
    getCurrentUser
  } = useMessageStore();

  const currentUser = getCurrentUser();
  const filteredConversationsRaw = getFilteredConversations();
  
  // Garantir que availableUsers, filteredConversations e chatMessages sejam sempre arrays
  const safeAvailableUsers = Array.isArray(availableUsers) ? availableUsers : [];
  const filteredConversations = Array.isArray(filteredConversationsRaw) ? filteredConversationsRaw : [];
  const namedConversations = filteredConversations.filter((conversation) => (
    conversation &&
    conversation.id &&
    conversation.name &&
    conversation.name.trim() !== '' &&
    conversation.name !== 'Conversa sem nome' &&
    (conversation.type !== 'individual' || conversation.id !== currentUser?.id)
  ));
  const individualConversations = namedConversations.filter((conversation) => conversation.type === 'individual');
  const groupConversations = namedConversations.filter((conversation) => conversation.type === 'group');
  const departmentConversations = namedConversations.filter((conversation) => conversation.type === 'department');
  const onlineGroupMembers = useMemo(() => (
    groupMembers.filter(member => member?.isOnline)
  ), [groupMembers]);
  const shouldFilterUsers = userSearchTerm.trim().length >= MIN_SEARCH_LENGTH;
  const shouldFilterGroups = groupSearchTerm.trim().length >= MIN_SEARCH_LENGTH;
  const shouldFilterDepartments = departmentSearchTerm.trim().length >= MIN_SEARCH_LENGTH;
  
  // Filtrar mensagens apenas da conversa selecionada
  const safeChatMessages = useMemo(() => {
    if (!selectedConversation || !Array.isArray(chatMessages)) return [];
    
    return chatMessages.filter((message) => {
      // Para conversas individuais, verificar se o remetente ou destinatário corresponde
      if (selectedConversation.type === 'individual') {
        return (
          message.recipient?.id === selectedConversation.id ||
          message.sender?.id === selectedConversation.id ||
          (message.recipient?.id === currentUser?.id && message.sender?.id === selectedConversation.id) ||
          (message.sender?.id === currentUser?.id && message.recipient?.id === selectedConversation.id)
        );
      }
      
      // Para grupos, verificar se o group.id corresponde
      if (selectedConversation.type === 'group') {
        return message.group?.id === selectedConversation.id;
      }
      
      // Para departamentos, verificar se o department.id corresponde
      if (selectedConversation.type === 'department') {
        return message.department?.id === selectedConversation.id;
      }
      
      return false;
    });
  }, [chatMessages, selectedConversation, currentUser?.id]);

  // WebSocket connection
  const { isConnected: wsConnected, sendTypingEvent } = useWebSocket({
    token: localStorage.getItem('token') || '',
    username: currentUser?.username || '',
    onMessage: (message) => {
      console.log('📨 [CHAT] Nova mensagem via WebSocket:', message);
      addChatMessage(message);
    },
    onTyping: (typing) => {
      console.log('⌨️ [CHAT] Evento de digitação:', typing);
      // Handled by store
    },
    onError: (error) => {
      console.error('❌ [CHAT] Erro WebSocket:', error);
      setError('Erro de conexão em tempo real');
    },
    onConnect: () => {
      console.log('✅ [CHAT] WebSocket conectado');
      setError(null);
      // Atualizar status online do usuário atual
      updateUserOnlineStatus(currentUser?.id || '', true);
    },
    onDisconnect: () => {
      console.log('🔌 [CHAT] WebSocket desconectado');
      // Atualizar status offline do usuário atual
      updateUserOnlineStatus(currentUser?.id || '', false);
    },
    onUserStatus: (event) => {
      updateUserOnlineStatus(event.userId, event.isOnline);
      setGroupMembers((prev) => prev.map(member => member.id === event.userId ? { ...member, isOnline: event.isOnline } : member));
    }
  });

  // Função para atualizar status online dos usuários
  const updateUserOnlineStatus = (userId: string, isOnline: boolean) => {
    // Verificar se já atualizamos este status para evitar loops infinitos
    if (userStatusUpdatedRef.current.userId === userId && 
        userStatusUpdatedRef.current.isOnline === isOnline) {
      return; // Já atualizado, não fazer nada
    }
    
    // Atualizar ref antes de chamar updateUserStatus
    userStatusUpdatedRef.current = { userId, isOnline };
    
    // Usar a função do store que já atualiza users e conversations
    updateUserStatus(userId, isOnline);
  };

  // Scroll automático para última mensagem (apenas quando novas mensagens são adicionadas)
  useEffect(() => {
    const currentMessageCount = safeChatMessages.length;
    
    // Só fazer scroll se houver novas mensagens
    if (currentMessageCount > lastMessageCountRef.current) {
      // Limpar timeout anterior se existir
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      // Usar timeout para evitar múltiplos scrolls durante renderizações rápidas
      scrollTimeoutRef.current = setTimeout(() => {
    scrollToBottom();
        lastMessageCountRef.current = currentMessageCount;
      }, 100);
    }
    
    // Cleanup
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [safeChatMessages.length]); // Usar apenas o comprimento, não o array inteiro

  useEffect(() => {
    if (selectedConversation?.type === 'group' && selectedConversation.id) {
      loadGroupMembers(selectedConversation.id);
    } else {
      setGroupMembers([]);
    }
  }, [selectedConversation?.id, selectedConversation?.type]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
    loadGroupsAndDepartments();
  }, []);

  // Recarregar dados quando o modal abrir
  useEffect(() => {
    if (showNewChatModal) {
      // Recarregar usuários, grupos e departamentos quando o modal abrir
      const reloadData = async () => {
        setLoadingModalUsers(true);
        try {
          // Sempre recarregar usuários quando o modal abrir para ter dados atualizados
          const users = await messageService.getAvailableUsers();
          const usersArray = Array.isArray(users) ? users : [];
          setAvailableUsers(usersArray);
          console.log('✅ [MODAL] Usuários carregados:', usersArray.length);
          
          // Recarregar grupos e departamentos se estiverem vazios
          if (groups.length === 0 || departments.length === 0) {
            await loadGroupsAndDepartments();
          }
        } catch (err) {
          console.error('❌ [MODAL] Erro ao recarregar dados:', err);
        } finally {
          setLoadingModalUsers(false);
        }
      };
      
      reloadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNewChatModal]);

  // Carregar grupos e departamentos
  const loadGroupsAndDepartments = async () => {
    setLoadingGroups(true);
    setLoadingDepartments(true);
    try {
      const [groupsData, departmentsData] = await Promise.all([
        groupService.getGroups(),
        api.get('/api/departments/active').then(res => res.data).catch(() => [])
      ]);
      setGroups(groupsData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar grupos e departamentos:', error);
    } finally {
      setLoadingGroups(false);
      setLoadingDepartments(false);
    }
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Carregar conversas recentes e usuários disponíveis em paralelo
      const [conversationsData, usersData] = await Promise.all([
        messageService.getRecentConversations(),
        messageService.getAvailableUsers()
      ]);

      const onlineMap = new Map((Array.isArray(usersData) ? usersData : []).map((user: any) => [user.id, Boolean(user.isOnline)]));

      // Marcar usuários como online se tiverem WebSocket conectado (heurística temporária)
      // TODO: Substituir por status real do backend quando implementado
      const usersWithOnlineStatus = Array.isArray(usersData) ? usersData.map(user => {
        // Heurística: se o usuário enviou mensagens recentemente ou está na lista de conversas recentes,
        // considerar como potencialmente online. Isso será substituído por status real do backend.
        const hasRecentActivity = Array.isArray(conversationsData) && conversationsData.some(
          (conv: any) => conv.sender?.id === user.id || conv.recipient?.id === user.id
        );
        return {
          ...user,
          isOnline: user.isOnline || hasRecentActivity || false
        };
      }) : [];

      const buildConversationsFromMessages = (messages: any[]): Conversation[] => {
        const conversationMap = new Map<string, Conversation>();

        messages.forEach((msg) => {
          let type: Conversation['type'] = 'individual';
          let id: string | undefined;
          let name: string | undefined;
          let isOnline = false;

          if (msg.group?.id) {
            type = 'group';
            id = msg.group.id;
            name = msg.group.name || msg.group.displayName || msg.group.groupName;
          } else if (msg.department?.id) {
            type = 'department';
            id = msg.department.id;
            name = msg.department.name;
          } else {
            const sender = msg.sender;
            const recipient = msg.recipient;
            const other = sender?.id === currentUser?.id ? recipient : sender;
            if (!other || other.id === currentUser?.id) {
              return;
            }
            id = other?.id;
            name = other?.name || other?.username || other?.email;
            isOnline = Boolean(other?.id && onlineMap.get(other.id));
          }

          if (!id || !name || name.trim() === '' || name === 'Conversa sem nome') {
            return;
          }

          const key = `${type}-${id}`;
          const existing = conversationMap.get(key);
          const messageCreatedAt = msg.createdAt ? new Date(msg.createdAt).getTime() : 0;
          const existingCreatedAt = existing?.lastMessage?.createdAt ? new Date(existing.lastMessage.createdAt).getTime() : 0;

          const normalizedMessage: ChatMessage = {
            id: msg.id,
            content: msg.content || (msg.fileName ? `📎 ${msg.fileName}` : ''),
            sender: msg.sender,
            recipient: msg.recipient || undefined,
            group: msg.group || undefined,
            department: msg.department || undefined,
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
          };

          const unreadIncrement = msg.recipient?.id === currentUser?.id && !msg.isRead ? 1 : 0;

          if (!existing) {
            conversationMap.set(key, {
              id,
              name,
              type,
              lastMessage: normalizedMessage,
              unreadCount: unreadIncrement,
              isOnline
            });
          } else {
            conversationMap.set(key, {
              ...existing,
              unreadCount: (existing.unreadCount || 0) + unreadIncrement,
              lastMessage: messageCreatedAt > existingCreatedAt ? normalizedMessage : existing.lastMessage,
              isOnline: existing.isOnline || isOnline
            });
          }
        });

        return Array.from(conversationMap.values()).sort((a, b) => {
          const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      };

      const isMessageList = Array.isArray(conversationsData) && conversationsData.some(
        (item: any) => item?.sender || item?.recipient || item?.group || item?.department
      );

      // Normalizar conversas: garantir que tenham nome e estrutura correta
      const normalizedConversations = isMessageList
        ? buildConversationsFromMessages(conversationsData)
        : (Array.isArray(conversationsData) ? conversationsData.map((conv: any) => {
            // Garantir que a conversa tenha um nome adequado
            let conversationName = conv.name || 'Conversa sem nome';
            
            // Se for conversa individual e não tiver nome, tentar pegar do recipient ou sender
            if (conversationName === 'Conversa sem nome' && conv.type === 'individual') {
              if (conv.recipient?.name) {
                conversationName = conv.recipient.name;
              } else if (conv.sender?.name) {
                conversationName = conv.sender.name;
              } else if (conv.participants && conv.participants.length > 0) {
                const otherParticipant = conv.participants.find((p: any) => p.id !== currentUser?.id);
                if (otherParticipant?.name) {
                  conversationName = otherParticipant.name;
                }
              }
            }

            if (conversationName === 'Conversa sem nome' && conv.type === 'group') {
              conversationName = conv.group?.name || conv.group?.displayName || conv.groupName || conv.name || 'Conversa sem nome';
            }

            if (conversationName === 'Conversa sem nome' && conv.type === 'department') {
              conversationName = conv.department?.name || conv.departmentName || conv.name || 'Conversa sem nome';
            }
            
            return {
              ...conv,
              name: conversationName,
              // Garantir que campos obrigatórios existam
              id: conv.id || conv.conversationId,
              type: conv.type || 'individual',
              unreadCount: conv.unreadCount || 0,
              isOnline: conv.isOnline || false
            };
          }).filter((conv: any) => conv && conv.id) : []);

      // Usar setConversations que já faz deduplicação
      setConversations(normalizedConversations);
      setAvailableUsers(usersWithOnlineStatus);
      
      console.log('✅ [CHAT] Dados iniciais carregados:', {
        conversations: normalizedConversations.length,
        users: usersWithOnlineStatus.length,
        normalizedConversations: normalizedConversations
      });
    } catch (error) {
      console.error('❌ [CHAT] Erro ao carregar dados iniciais:', error);
      if (error instanceof MessageServiceError) {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (conversationId: string, conversationType?: Conversation['type']) => {
    if (!conversationId) return;
    
    setLoading(true);
    console.log('💬 [CHAT] Carregando conversa:', conversationId);
    
    try {
      const type = conversationType || selectedConversation?.type || 'individual';
      const messages = type === 'group'
        ? await messageService.getGroupMessages(conversationId)
        : type === 'department'
          ? await messageService.getDepartmentMessages(conversationId)
          : await messageService.getConversationMessages(conversationId);
      setChatMessages(messages);
      console.log('✅ [CHAT] Mensagens carregadas:', messages.length);
      
      // Carregar estados de fixar e favoritar para todas as mensagens
      const pinnedSet = new Set<string>();
      const favoriteSet = new Set<string>();
      
      await Promise.all(
        messages.map(async (msg) => {
          try {
            const [isPinned, isFavorite] = await Promise.all([
              messageService.isPinned(msg.id),
              messageService.isFavorite(msg.id)
            ]);
            if (isPinned) pinnedSet.add(msg.id);
            if (isFavorite) favoriteSet.add(msg.id);
          } catch (error) {
            // Ignorar erros individuais
            console.warn(`Erro ao carregar estado de mensagem ${msg.id}:`, error);
          }
        })
      );
      
      setPinnedMessages(pinnedSet);
      setFavoriteMessages(favoriteSet);
    } catch (error) {
      console.error('❌ [CHAT] Erro ao carregar conversa:', error);
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
      setChatMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    if (!groupId) return;
    setLoadingGroupMembers(true);
    try {
      const members = await groupService.getUsersByGroup(groupId);
      setGroupMembers(Array.isArray(members) ? members : []);
    } catch (error) {
      console.error('❌ [CHAT] Erro ao carregar membros do grupo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os membros do grupo.",
        variant: "destructive"
      });
      setGroupMembers([]);
    } finally {
      setLoadingGroupMembers(false);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

    console.log('📤 [CHAT] Enviando mensagem:', newMessage, selectedFile ? 'com arquivo' : '');

    // Criar mensagem temporária para mostrar "enviando..."
    const tempMessageId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      content: newMessage || (selectedFile ? `Enviando ${selectedFile.name}...` : ''),
      sender: currentUser || { id: '', name: 'Você', email: '' },
      type: selectedFile ? (selectedFile.type.startsWith('image/') ? 'IMAGE' : selectedFile.type.startsWith('audio/') ? 'AUDIO' : selectedFile.type.startsWith('video/') ? 'VIDEO' : 'FILE') : 'TEXT',
      isRead: false,
      createdAt: new Date().toISOString(),
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      fileName: selectedFile?.name,
      fileSize: selectedFile?.size,
      fileContentType: selectedFile?.type
    };

    // Adicionar mensagem temporária
    addChatMessage(tempMessage);
    setSendingMessages(prev => new Set(prev).add(tempMessageId));

    try {
      setLoading(true);

      let sentMessage: ChatMessage;

      if (selectedFile) {
        // Enviar mensagem com arquivo
        const messageData = {
          content: newMessage || undefined,
          recipientId: selectedConversation.type === 'individual' ? selectedConversation.id : undefined,
          groupId: selectedConversation.type === 'group' ? selectedConversation.id : undefined,
          departmentId: selectedConversation.type === 'department' ? selectedConversation.id : undefined,
          replyToId: replyToMessage?.id
        };

        sentMessage = await messageService.sendChatMessageWithFile(selectedFile, messageData);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Enviar mensagem de texto
      const messageData = {
        content: newMessage,
        recipientId: selectedConversation.type === 'individual' ? selectedConversation.id : undefined,
        groupId: selectedConversation.type === 'group' ? selectedConversation.id : undefined,
        departmentId: selectedConversation.type === 'department' ? selectedConversation.id : undefined,
        type: 'TEXT' as const,
        replyToId: replyToMessage?.id
      };

        sentMessage = await messageService.sendChatMessage(messageData);
      }
      
      // Remover mensagem temporária e adicionar a mensagem real
      removeChatMessage(tempMessageId);
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempMessageId);
        return newSet;
      });
      
      // Garantir que todas as informações do arquivo estejam presentes
      console.log('📤 [CHAT] Mensagem enviada:', {
        id: sentMessage.id,
        type: sentMessage.type,
        fileUrl: sentMessage.fileUrl,
        fileName: sentMessage.fileName,
        fileSize: sentMessage.fileSize,
        fileContentType: sentMessage.fileContentType
      });
      
      addChatMessage(sentMessage);
      
      // Limpar campos
      setNewMessage('');
      setReplyToMessage(null);

      console.log('✅ [CHAT] Mensagem enviada com sucesso');
      
      toast({
        title: "Sucesso",
        description: "Mensagem enviada",
        variant: "default"
      });

    } catch (error) {
      console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
      
      // Remover mensagem temporária em caso de erro
      removeChatMessage(tempMessageId);
      setSendingMessages(prev => {
        const newSet = new Set(prev);
        newSet.delete(tempMessageId);
        return newSet;
      });
      
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (50MB máximo)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Máximo permitido: 50MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (10MB máximo para imagens)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Erro",
          description: "Imagem muito grande. Máximo permitido: 10MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  // Funções para gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `audio-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedFile(audioFile);
        
        // Parar todos os tracks do stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Atualizar tempo de gravação
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // Parar todos os tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (contentType?: string) => {
    if (!contentType) return <File className="w-4 h-4" />;
    if (contentType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (contentType.startsWith('audio/')) return <Mic className="w-4 h-4" />;
    if (contentType.startsWith('video/')) return <Play className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getFileUrl = (fileUrl?: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      return fileUrl;
    }
    // Usar getChatFileUrl para arquivos de chat
    try {
      return getChatFileUrl(fileUrl);
    } catch (error) {
      // Fallback para construção manual
      const apiUrl = getApiUrl();
      const baseUrl = apiUrl.replace('/api', '');
      return `${baseUrl}${fileUrl.startsWith('/') ? fileUrl : '/' + fileUrl}`;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      const updatedMessage = await messageService.editChatMessage(messageId, newContent);
      updateChatMessage(messageId, updatedMessage);
      
      setEditingMessage(null);
      setEditContent('');
      
      toast({
        title: "Sucesso",
        description: "Mensagem editada",
        variant: "default"
      });
    } catch (error) {
      console.error('❌ [CHAT] Erro ao editar mensagem:', error);
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await messageService.markChatMessageAsRead(messageId);
      updateChatMessage(messageId, { isRead: true, readAt: new Date().toISOString() });
    } catch (error) {
      console.error('❌ [CHAT] Erro ao marcar como lida:', error);
    }
  };

  const scrollToBottom = () => {
    // Verificar se o elemento existe antes de fazer scroll
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } catch (error) {
        // Fallback para scroll simples se smooth não funcionar
        messagesEndRef.current.scrollIntoView();
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (selectedConversation && currentUser && wsConnected) {
      sendTypingEvent(
        selectedConversation.id,
        selectedConversation.type === 'individual' ? selectedConversation.id : undefined,
        selectedConversation.type === 'group' ? selectedConversation.id : undefined,
        selectedConversation.type === 'department' ? selectedConversation.id : undefined
      );
    }
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderConversationItem = (conversation: Conversation) => (
    <div
      key={conversation.id}
      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
      }`}
      onClick={() => {
        setSelectedConversation(conversation);
        loadConversation(conversation.id, conversation.type);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
          </Avatar>
          {conversation.isOnline && conversation.type === 'individual' && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-sm truncate">{conversation.name}</p>
            {conversation.lastMessage && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(conversation.lastMessage.createdAt), 'HH:mm')}
              </span>
            )}
          </div>
          {conversation.lastMessage && (
            <p className="text-xs text-muted-foreground truncate">
              {conversation.lastMessage.content}
            </p>
          )}
        </div>
        {conversation.unreadCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {conversation.unreadCount}
          </Badge>
        )}
      </div>
    </div>
  );

  // Funções para ações do menu de contexto
  const handleCopyMessage = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copiado",
      description: "Mensagem copiada para a área de transferência",
      variant: "default"
    });
  };

  const handleForwardMessage = (message: ChatMessage) => {
    setMessageToForward(message);
    setShowForwardModal(true);
  };

  const confirmForward = async () => {
    if (!messageToForward) return;

    try {
      await messageService.forwardMessage(
        messageToForward.id,
        forwardRecipients.length > 0 ? forwardRecipients : undefined,
        forwardGroups.length > 0 ? forwardGroups : undefined,
        forwardDepartments.length > 0 ? forwardDepartments : undefined
      );

      toast({
        title: "Sucesso",
        description: "Mensagem encaminhada com sucesso",
        variant: "default"
      });

      setShowForwardModal(false);
      setMessageToForward(null);
      setForwardRecipients([]);
      setForwardGroups([]);
      setForwardDepartments([]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao encaminhar mensagem",
        variant: "destructive"
      });
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      const isPinned = await messageService.togglePin(messageId);
      
      setPinnedMessages(prev => {
        const newSet = new Set(prev);
        if (isPinned) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });

      toast({
        title: isPinned ? "Fixado" : "Desfixado",
        description: isPinned ? "Mensagem fixada" : "Mensagem desfixada",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar fixação",
        variant: "destructive"
      });
    }
  };

  const handleFavoriteMessage = async (messageId: string) => {
    try {
      const isFavorite = await messageService.toggleFavorite(messageId);
      
      setFavoriteMessages(prev => {
        const newSet = new Set(prev);
        if (isFavorite) {
          newSet.add(messageId);
        } else {
          newSet.delete(messageId);
        }
        return newSet;
      });

      toast({
        title: isFavorite ? "Adicionado aos favoritos" : "Removido dos favoritos",
        description: isFavorite ? "Mensagem adicionada aos favoritos" : "Mensagem removida dos favoritos",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar favorito",
        variant: "destructive"
      });
    }
  };

  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleReportMessage = (message: ChatMessage) => {
    setMessageToReport(message);
    setShowReportModal(true);
  };

  const confirmReport = async () => {
    if (!messageToReport || !reportReason.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o motivo da denúncia",
        variant: "destructive"
      });
      return;
    }

    try {
      await messageService.reportMessage(
        messageToReport.id,
        reportReason,
        reportDescription || undefined
      );

      toast({
        title: "Sucesso",
        description: "Mensagem denunciada. Nossa equipe irá analisar.",
        variant: "default"
      });

      setShowReportModal(false);
      setMessageToReport(null);
      setReportReason('');
      setReportDescription('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao denunciar mensagem",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Tem certeza que deseja apagar esta mensagem?')) {
      try {
        // TODO: Implementar chamada à API para deletar mensagem
        removeChatMessage(messageId);
        toast({
          title: "Sucesso",
          description: "Mensagem apagada",
          variant: "default"
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível apagar a mensagem",
          variant: "destructive"
        });
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Chamar API para adicionar/remover reação
      const reactionSummary = await messageService.toggleReaction(messageId, emoji);
      
      // Atualizar a mensagem no store com as novas reações
      const message = safeChatMessages.find(m => m.id === messageId);
      if (message) {
        // Buscar todas as reações atualizadas
        const allReactions = await messageService.getMessageReactions(messageId);
        
        // Atualizar mensagem no store
        updateChatMessage(messageId, {
          ...message,
          reactions: allReactions
        });
      }
    } catch (error: any) {
      console.error('Erro ao adicionar reação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar reação",
        variant: "destructive"
      });
    }
  };

  const startNewConversation = () => {
    let newConversation: Conversation | null = null;

    if (chatType === 'individual' && selectedUser) {
      newConversation = {
      id: selectedUser.id,
      name: selectedUser.name,
      type: 'individual' as const,
      unreadCount: 0,
      isOnline: selectedUser.isOnline
    };
    } else if (chatType === 'group' && selectedGroup) {
      newConversation = {
        id: selectedGroup.id,
        name: selectedGroup.name || selectedGroup.groupName || 'Grupo',
        type: 'group' as const,
        unreadCount: 0,
        isOnline: false
      };
    } else if (chatType === 'department' && selectedDepartment) {
      newConversation = {
        id: selectedDepartment.id,
        name: selectedDepartment.name || 'Departamento',
        type: 'department' as const,
        unreadCount: 0,
        isOnline: false
      };
    }

    if (!newConversation) return;

    setConversations([newConversation, ...conversations]);
    setSelectedConversation(newConversation);
    setShowNewChatModal(false);
    setSelectedUser(null);
    setSelectedGroup(null);
    setSelectedDepartment(null);
    loadConversation(newConversation.id, newConversation.type);
  };

  // Detectar tamanho da tela para responsividade (padrão SST)
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estado para controlar visibilidade da sidebar no mobile
  const [showSidebar, setShowSidebar] = useState(!isMobile);

  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);

  return (
    <MainLayout title="Chat Interno" subtitle="Converse em tempo real com colaboradores, grupos e departamentos">
      <div className={`flex h-full gap-2 sm:gap-4 lg:gap-6 ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {/* Sidebar - Lista de Conversas */}
        <Card className={`${isMobile ? (showSidebar ? 'w-full h-1/2' : 'hidden') : 'w-64 sm:w-72 lg:w-80'} flex flex-col transition-all duration-300`}>
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSidebar(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <CardTitle className="text-base sm:text-lg">Conversas</CardTitle>
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" title="Conectado" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" title="Desconectado" />
                )}
              </div>
              
              <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="text-xs sm:text-sm">
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Nova Conversa</span>
                    <span className="sm:hidden">Nova</span>
                  </Button>
                </DialogTrigger>
                <DialogContent 
                  className="bg-seguranca-darkgray border-seguranca-gray/30 max-w-md w-[90vw] sm:w-full overflow-visible"
                  style={{ zIndex: 10050 }}
                >
                  <DialogHeader className="pb-4 border-b border-seguranca-gray/20 mb-4">
                    <DialogTitle className="text-seguranca-lightgray text-xl font-semibold">Nova Conversa</DialogTitle>
                    <DialogDescription className="text-seguranca-gray text-sm">
                      Escolha o tipo de conversa e selecione um destinatário
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-seguranca-lightgray block">Tipo de Conversa</label>
                      <Select value={chatType} onValueChange={(value: 'individual' | 'group' | 'department') => {
                        setChatType(value);
                        setSelectedUser(null);
                        setSelectedGroup(null);
                        setSelectedDepartment(null);
                      }}>
                        <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50 shadow-2xl" style={{ backgroundColor: '#1f2937', opacity: 1, backdropFilter: 'none' }}>
                          <SelectItem value="individual" className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">Individual</SelectItem>
                          <SelectItem value="group" className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">Grupo</SelectItem>
                          <SelectItem value="department" className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">Departamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {chatType === 'individual' && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-seguranca-lightgray block">Selecionar Usuário</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="showOnlyOnline"
                              checked={showOnlyOnline}
                              onChange={(e) => setShowOnlyOnline(e.target.checked)}
                              className="w-4 h-4"
                            />
                            <label htmlFor="showOnlyOnline" className="text-xs text-seguranca-gray cursor-pointer">
                              Apenas online
                            </label>
                          </div>
                        </div>
                        <Input
                          placeholder="Digite o nome do usuário para filtrar..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                          autoComplete="off"
                        />
                        <Select 
                          value={selectedUser?.id || undefined}
                          onValueChange={(value) => {
                            const user = safeAvailableUsers.find(u => u.id === value);
                            setSelectedUser(user || null);
                          }}
                        >
                          <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                            <SelectValue placeholder="Escolha um usuário" />
                          </SelectTrigger>
                          <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50 shadow-2xl max-h-[300px]" style={{ backgroundColor: '#1f2937', opacity: 1, backdropFilter: 'none', zIndex: 10070 }}>
                            {loadingModalUsers ? (
                              <SelectItem value="loading" disabled className="text-seguranca-gray">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Carregando usuários...
                                </div>
                              </SelectItem>
                            ) : safeAvailableUsers.length === 0 ? (
                              <SelectItem value="no-users" disabled className="text-seguranca-gray">
                                Nenhum usuário disponível
                              </SelectItem>
                            ) : (
                              safeAvailableUsers
                                .filter(user => user && user.id && user.name)
                                .filter(user => !showOnlyOnline || user.isOnline)
                                .filter(user => {
                                  // Filtrar por termo de busca se fornecido (caso contrário, mostrar todos)
                                  const searchLower = userSearchTerm.trim().toLowerCase();
                                  return searchLower.length === 0 || user.name.toLowerCase().includes(searchLower);
                                })
                                .sort((a, b) => {
                                  // Ordenar: online primeiro, depois offline
                                  if (a.isOnline && !b.isOnline) return -1;
                                  if (!a.isOnline && b.isOnline) return 1;
                                  return a.name.localeCompare(b.name);
                                })
                                .map(user => (
                                  <SelectItem key={user.id} value={user.id} className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">
                                    <div className="flex items-center gap-2 w-full">
                                      <div className="relative flex-shrink-0">
                                      <Avatar className="w-6 h-6">
                                          <AvatarFallback className="bg-seguranca-yellow/20 text-seguranca-yellow">
                                            {getInitials(user.name)}
                                          </AvatarFallback>
                                      </Avatar>
                                        {user.isOnline && (
                                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-seguranca-darkgray" />
                                        )}
                                      </div>
                                      <span className="flex-1 truncate">{user.name}</span>
                                      {user.isOnline ? (
                                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500 border-green-500/30 flex-shrink-0">
                                          Online
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400 border-gray-500/30 flex-shrink-0">
                                          Offline
                                        </Badge>
                                      )}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {chatType === 'group' && (
                      <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium text-seguranca-lightgray block">Selecionar Grupo</label>
                        <Input
                          placeholder="Digite o nome do grupo..."
                          value={groupSearchTerm}
                          onChange={(e) => setGroupSearchTerm(e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                          autoComplete="off"
                        />
                        {!shouldFilterGroups && (
                          <p className="text-xs text-seguranca-gray">Digite pelo menos 3 caracteres para buscar.</p>
                        )}
                        <Select onValueChange={(value) => {
                          const group = groups.find(g => g.id === value);
                          setSelectedGroup(group || null);
                        }}>
                          <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                            <SelectValue placeholder={loadingGroups ? "Carregando grupos..." : "Escolha um grupo"} />
                          </SelectTrigger>
                        <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50 shadow-2xl" style={{ backgroundColor: '#1f2937', opacity: 1, backdropFilter: 'none', zIndex: 10070 }}>
                            {loadingGroups ? (
                              <SelectItem value="loading" disabled className="text-seguranca-gray">
                                Carregando...
                              </SelectItem>
                            ) : !shouldFilterGroups ? (
                              <SelectItem value="min-chars" disabled className="text-seguranca-gray">
                                Digite pelo menos 3 caracteres para buscar
                              </SelectItem>
                            ) : groups.length === 0 ? (
                              <SelectItem value="no-groups" disabled className="text-seguranca-gray">
                                Nenhum grupo disponível
                              </SelectItem>
                            ) : (
                              groups
                                .filter(group => shouldFilterGroups && (group.name || group.groupName || '').toLowerCase().includes(groupSearchTerm.toLowerCase()))
                                .map(group => (
                                <SelectItem key={group.id} value={group.id} className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">
                                  {group.name || group.groupName || 'Grupo sem nome'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {chatType === 'department' && (
                      <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium text-seguranca-lightgray block">Selecionar Departamento</label>
                        <Input
                          placeholder="Digite o nome do departamento..."
                          value={departmentSearchTerm}
                          onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                          className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                          autoComplete="off"
                        />
                        {!shouldFilterDepartments && (
                          <p className="text-xs text-seguranca-gray">Digite pelo menos 3 caracteres para buscar.</p>
                        )}
                        <Select onValueChange={(value) => {
                          const dept = departments.find(d => d.id === value);
                          setSelectedDepartment(dept || null);
                        }}>
                          <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                            <SelectValue placeholder={loadingDepartments ? "Carregando departamentos..." : "Escolha um departamento"} />
                          </SelectTrigger>
                        <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50 shadow-2xl" style={{ backgroundColor: '#1f2937', opacity: 1, backdropFilter: 'none', zIndex: 10070 }}>
                            {loadingDepartments ? (
                              <SelectItem value="loading" disabled className="text-seguranca-gray">
                                Carregando...
                              </SelectItem>
                            ) : !shouldFilterDepartments ? (
                              <SelectItem value="min-chars" disabled className="text-seguranca-gray">
                                Digite pelo menos 3 caracteres para buscar
                              </SelectItem>
                            ) : departments.length === 0 ? (
                              <SelectItem value="no-departments" disabled className="text-seguranca-gray">
                                Nenhum departamento disponível
                              </SelectItem>
                            ) : (
                              departments
                                .filter(dept => shouldFilterDepartments && (dept.name || '').toLowerCase().includes(departmentSearchTerm.toLowerCase()))
                                .map(dept => (
                                <SelectItem key={dept.id} value={dept.id} className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow hover:bg-seguranca-gray/30">
                                  {dept.name || 'Departamento sem nome'}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 border-t border-seguranca-gray/20 mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowNewChatModal(false);
                          setSelectedUser(null);
                          setSelectedGroup(null);
                          setSelectedDepartment(null);
                        }}
                        className="border-seguranca-gray/30 text-seguranca-lightgray hover:bg-seguranca-gray/10"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={startNewConversation} 
                        disabled={
                          (chatType === 'individual' && !selectedUser) ||
                          (chatType === 'group' && !selectedGroup) ||
                          (chatType === 'department' && !selectedDepartment)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Iniciar Conversa
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0">
            {error && (
              <Alert className="m-4 mb-2" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="h-full overflow-y-auto">
              <div className="space-y-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Carregando...</span>
                  </div>
                ) : namedConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">Inicie uma nova conversa</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-2">
                    <div className="px-4 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">Pessoas</div>
                    {individualConversations.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground">Nenhuma conversa individual</div>
                    ) : (
                      individualConversations.map(renderConversationItem)
                    )}

                    <div className="px-4 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">Grupos</div>
                    {groupConversations.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-muted-foreground">Nenhum grupo recente</div>
                    ) : (
                      groupConversations.map(renderConversationItem)
                    )}

                    {departmentConversations.length > 0 && (
                      <>
                        <div className="px-4 pt-3 text-[11px] uppercase tracking-wide text-muted-foreground">Departamentos</div>
                        {departmentConversations.map(renderConversationItem)}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área Principal do Chat */}
        <Card className={`flex-1 flex flex-col ${isMobile && !showSidebar ? 'w-full' : ''}`}>
          {selectedConversation && selectedConversation.id ? (
            <>
              {/* Header da Conversa */}
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSidebar(true)}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Menu className="w-4 h-4" />
                      </Button>
                    )}
                    <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                      <AvatarFallback className="text-xs sm:text-sm">{getInitials(selectedConversation.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm sm:text-base lg:text-lg truncate">{selectedConversation.name || 'Conversa sem nome'}</CardTitle>
                      <div className="flex items-center gap-2">
                        {selectedConversation.isOnline && (
                          <Badge variant="secondary" className="text-xs">Online</Badge>
                        )}
                        {typingUsers.size > 0 && (
                          <span className="text-xs text-muted-foreground">digitando...</span>
                        )}
                      </div>
                      {selectedConversation.type === 'group' && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {loadingGroupMembers ? (
                            <span>Carregando membros...</span>
                          ) : onlineGroupMembers.length === 0 ? (
                            <span>Nenhum membro online no momento</span>
                          ) : (
                            <>
                              <span>Online no grupo:</span>
                              <div className="flex items-center gap-1">
                                {onlineGroupMembers.slice(0, 6).map((member) => (
                                  <Avatar key={member.id} className="w-5 h-5">
                                    <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {onlineGroupMembers.length > 6 && (
                                  <span className="text-[11px] text-muted-foreground">+{onlineGroupMembers.length - 6}</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Opções da Conversa</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => {
                        if (selectedConversation) {
                          toast({
                            title: "Informações",
                            description: `Conversa: ${selectedConversation.name}\nTipo: ${selectedConversation.type}\nMensagens não lidas: ${selectedConversation.unreadCount}`,
                            variant: "default"
                          });
                        }
                      }}>
                        <Info className="mr-2 h-4 w-4" />
                        Informações
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        if (selectedConversation) {
                          // Marcar todas as mensagens como lidas
                          safeChatMessages.forEach(msg => {
                            if (!msg.isRead) {
                              markAsRead(msg.id);
                            }
                          });
                          toast({
                            title: "Sucesso",
                            description: "Todas as mensagens foram marcadas como lidas",
                            variant: "default"
                          });
                        }
                      }}>
                        <Archive className="mr-2 h-4 w-4" />
                        Marcar todas como lidas
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => {
                          if (selectedConversation && window.confirm('Tem certeza que deseja limpar esta conversa?')) {
                            setChatMessages([]);
                            toast({
                              title: "Sucesso",
                              description: "Conversa limpa",
                              variant: "default"
                            });
                          }
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar conversa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* Área de Mensagens */}
              <CardContent className="flex-1 p-0 flex flex-col">
                <div className="flex-1 px-2 sm:px-4 overflow-y-auto">
                  <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="ml-2">Carregando mensagens...</span>
                      </div>
                    ) : safeChatMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Inicie a conversa!</p>
                      </div>
                    ) : (
                      safeChatMessages.map((message) => {
                        const isCurrentUser = message.sender.id === currentUser?.id || message.sender.id === currentUser?.username;
                        const isSending = sendingMessages.has(message.id);
                        const isGroupOrDepartment = selectedConversation?.type === 'group' || selectedConversation?.type === 'department';
                        const shouldShowSender = !isCurrentUser || isGroupOrDepartment;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                              {shouldShowSender && (
                                <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">{message.sender.name}</span>
                                  {isSending && (
                                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                  )}
                                </div>
                              )}
                              {!shouldShowSender && isSending && (
                                <div className="flex items-center justify-end gap-2 mb-1">
                                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">Enviando...</span>
                                </div>
                              )}
                              
                              {message.replyToId && replyToMessage && (
                                <div className="bg-muted/50 p-2 rounded-t-lg border-l-2 border-primary mb-1">
                                  <p className="text-xs text-muted-foreground">Respondendo a {replyToMessage.sender.name}</p>
                                  <p className="text-xs truncate">{replyToMessage.content}</p>
                                </div>
                              )}
                              
                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                              <div
                                    className={`p-3 rounded-lg cursor-pointer transition-all hover:opacity-90 ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                    } ${selectedMessages.has(message.id) ? 'ring-2 ring-seguranca-yellow' : ''}`}
                              >
                                {editingMessage === message.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="min-h-[60px]"
                                    />
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => editMessage(message.id, editContent)}>
                                        Salvar
                                      </Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div>
                                        {/* Exibir arquivo se houver */}
                                        {message.fileUrl && (
                                          <div className="mb-2">
                                            {message.type === 'IMAGE' ? (
                                              <div className="rounded-lg overflow-hidden max-w-xs">
                                                <img 
                                                  src={getFileUrl(message.fileUrl)}
                                                  alt={message.fileName || 'Imagem'}
                                                  className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                                                  onClick={() => window.open(getFileUrl(message.fileUrl), '_blank')}
                                                />
                                              </div>
                                            ) : message.type === 'AUDIO' ? (
                                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg min-w-[200px]">
                                                <Mic className="w-5 h-5 flex-shrink-0 text-primary" />
                                                <audio 
                                                  controls 
                                                  src={getFileUrl(message.fileUrl)}
                                                  className="flex-1 h-8"
                                                  preload="metadata"
                                                  onError={(e) => {
                                                    console.error('Erro ao carregar áudio:', e);
                                                    toast({
                                                      title: "Erro",
                                                      description: "Não foi possível reproduzir o áudio",
                                                      variant: "destructive"
                                                    });
                                                  }}
                                                >
                                                  Seu navegador não suporta o elemento de áudio.
                                                </audio>
                                              </div>
                                            ) : message.type === 'VIDEO' ? (
                                              <div className="rounded-lg overflow-hidden max-w-xs">
                                                <video 
                                                  controls 
                                                  src={getFileUrl(message.fileUrl)}
                                                  className="max-w-full h-auto"
                                                />
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                                {getFileIcon(message.fileContentType)}
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">{message.fileName || 'Arquivo'}</p>
                                                  {message.fileSize && (
                                                    <p className="text-xs text-muted-foreground">{formatFileSize(message.fileSize)}</p>
                                                  )}
                                                </div>
                                                <a
                                                  href={getFileUrl(message.fileUrl)}
                                                  download
                                                  className="p-1 hover:bg-muted rounded transition-colors"
                                                  title="Baixar arquivo"
                                                >
                                                  <Download className="w-4 h-4" />
                                                </a>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        
                                        <div className="flex items-start justify-between gap-2">
                                          {message.content && (
                                            <p className={`text-sm flex-1 ${isSending ? 'opacity-70 italic' : ''}`}>
                                              {isSending && message.content.includes('Enviando') ? (
                                                <span className="flex items-center gap-2">
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                  {message.content}
                                                </span>
                                              ) : (
                                                message.content
                                              )}
                                            </p>
                                          )}
                                          {pinnedMessages.has(message.id) && (
                                            <Pin className="w-3 h-3 opacity-70 flex-shrink-0" />
                                          )}
                                          {favoriteMessages.has(message.id) && (
                                            <Star className="w-3 h-3 opacity-70 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                                          )}
                                        </div>
                                        
                                        {/* Exibir reações (estilo WhatsApp) */}
                                        {message.reactions && message.reactions.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2 mb-1">
                                            {message.reactions.map((reaction, index) => {
                                              const hasUserReaction = reaction.currentUserReacted || false;
                                              return (
                                                <button
                                                  key={index}
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReaction(message.id, reaction.emoji);
                                                  }}
                                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                                                    hasUserReaction
                                                      ? 'bg-blue-500/30 border border-blue-500/50'
                                                      : 'bg-gray-600/30 border border-gray-500/30 hover:bg-gray-500/40'
                                                  }`}
                                                  title={`${reaction.count} ${reaction.count === 1 ? 'reação' : 'reações'}`}
                                                >
                                                  <span className="text-sm">{reaction.emoji}</span>
                                                  {reaction.count > 1 && (
                                                    <span className="text-[10px] opacity-80">{reaction.count}</span>
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                        
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs opacity-70">
                                        {format(new Date(message.createdAt), 'HH:mm', { locale: ptBR })}
                                        {message.editedAt && ' (editada)'}
                                      </span>
                                      {isCurrentUser && (
                                        <span className="flex items-center gap-1 text-xs opacity-70">
                                          {message.isRead ? (
                                            <CheckCheck className="w-3 h-3 text-blue-400" />
                                          ) : (
                                            <Check className="w-3 h-3" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                      </div>
                                    )}
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-56 bg-seguranca-graphite border-seguranca-gray/50">
                                  {/* Reações rápidas */}
                                  <div className="flex items-center justify-around p-2 border-b border-seguranca-gray/30">
                                    <button
                                      onClick={() => handleReaction(message.id, '👍')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Curtir"
                                    >
                                      <span className="text-xl">👍</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '❤️')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Curtir com coração"
                                    >
                                      <span className="text-xl">❤️</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '😂')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Rir"
                                    >
                                      <span className="text-xl">😂</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '😮')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Surpreso"
                                    >
                                      <span className="text-xl">😮</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '😢')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Triste"
                                    >
                                      <span className="text-xl">😢</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '🙏')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Obrigado"
                                    >
                                      <span className="text-xl">🙏</span>
                                    </button>
                                    <button
                                      onClick={() => handleReaction(message.id, '+')}
                                      className="p-2 hover:bg-seguranca-gray/30 rounded-full transition-colors"
                                      title="Mais reações"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                  
                                  {/* Opções do menu */}
                                  <ContextMenuItem
                                    onClick={() => setReplyToMessage(message)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <Reply className="mr-2 h-4 w-4" />
                                    Responder
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleCopyMessage(message)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copiar
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleForwardMessage(message)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <Forward className="mr-2 h-4 w-4" />
                                    Encaminhar
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handlePinMessage(message.id)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <Pin className={`mr-2 h-4 w-4 ${pinnedMessages.has(message.id) ? 'fill-current' : ''}`} />
                                    {pinnedMessages.has(message.id) ? 'Desfixar' : 'Fixar'}
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleFavoriteMessage(message.id)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <Star className={`mr-2 h-4 w-4 ${favoriteMessages.has(message.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                    {favoriteMessages.has(message.id) ? 'Remover dos favoritos' : 'Favoritar'}
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={() => handleSelectMessage(message.id)}
                                    className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                  >
                                    <CheckSquare className={`mr-2 h-4 w-4 ${selectedMessages.has(message.id) ? 'fill-current' : ''}`} />
                                    {selectedMessages.has(message.id) ? 'Desselecionar' : 'Selecionar'}
                                  </ContextMenuItem>
                                  {!isCurrentUser && (
                                    <ContextMenuItem
                                      onClick={() => handleReportMessage(message)}
                                      className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                    >
                                      <Flag className="mr-2 h-4 w-4" />
                                      Denunciar
                                    </ContextMenuItem>
                                  )}
                                      {isCurrentUser && (
                                    <>
                                      <ContextMenuSeparator />
                                      <ContextMenuItem
                                            onClick={() => {
                                              setEditingMessage(message.id);
                                              setEditContent(message.content);
                                            }}
                                        className="text-seguranca-lightgray focus:bg-seguranca-yellow/20 focus:text-seguranca-yellow"
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </ContextMenuItem>
                                      <ContextMenuItem
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-red-600 focus:bg-red-600/20 focus:text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Apagar
                                      </ContextMenuItem>
                                    </>
                                  )}
                                </ContextMenuContent>
                              </ContextMenu>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Área de Input */}
                <div className="p-2 sm:p-4 border-t">
                  {replyToMessage && (
                    <div className="bg-muted/50 p-2 rounded-lg mb-2 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Respondendo a {replyToMessage.sender.name}</p>
                        <p className="text-sm truncate">{replyToMessage.content}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyToMessage(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {selectedFile && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getFileIcon(selectedFile.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  {/* Input estilo WhatsApp com ícones dentro */}
                  <div className="relative flex items-end gap-1 sm:gap-2 bg-muted/30 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1.5 sm:py-2 border border-border/50">
                    {/* Ícones à esquerda */}
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                      {/* Emoji */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted touch-manipulation"
                        title="Emoji"
                      >
                        <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </Button>
                      
                      {/* Anexo/Arquivo */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleFileButtonClick}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted touch-manipulation"
                        title="Anexar arquivo"
                      >
                        <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </Button>
                      
                      {/* Câmera */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleImageButtonClick}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-muted touch-manipulation"
                        title="Tirar foto"
                      >
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      </Button>
                    </div>

                    {/* Input de texto */}
                    <Textarea
                      placeholder="Mensagem"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      className="flex-1 min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-1.5 sm:px-2 py-1.5 sm:py-2 text-sm sm:text-base"
                      disabled={loading || isRecording}
                      rows={1}
                    />

                    {/* Botão de gravação ou envio */}
                    <div className="flex items-center">
                      {isRecording ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-red-500">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-xs font-medium">
                              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={cancelRecording}
                            className="h-8 w-8 p-0 hover:bg-red-500/20"
                            title="Cancelar gravação"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={stopRecording}
                            className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600 rounded-full"
                            title="Parar e enviar"
                          >
                            <Square className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      ) : newMessage.trim() || selectedFile ? (
                    <Button 
                      onClick={sendMessage} 
                          disabled={loading}
                          className="h-8 w-8 p-0 bg-primary hover:bg-primary/90 rounded-full"
                          title="Enviar"
                    >
                      {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                            <Send className="w-4 h-4 text-white" />
                      )}
                    </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            startRecording();
                          }}
                          onMouseUp={(e) => {
                            e.preventDefault();
                            if (isRecording) {
                              stopRecording();
                            }
                          }}
                          onMouseLeave={() => {
                            if (isRecording) {
                              cancelRecording();
                            }
                          }}
                          className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                          title="Gravar áudio (segure)"
                        >
                          <Mic className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      )}
                    </div>

                    {/* Inputs de arquivo ocultos */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.csv"
                    />
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">Selecione uma conversa</h3>
                <p>Escolha uma conversa existente ou inicie uma nova</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal de Encaminhar Mensagem */}
      <Dialog open={showForwardModal} onOpenChange={setShowForwardModal}>
        <DialogContent className="bg-seguranca-darkgray border-seguranca-gray/30 max-w-md w-[90vw] sm:w-full overflow-visible" style={{ zIndex: 10050 }}>
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Encaminhar Mensagem</DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Selecione os destinatários para encaminhar esta mensagem
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-seguranca-lightgray">Usuários</label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="forwardShowOnlyOnline"
                    checked={forwardShowOnlyOnline}
                    onChange={(e) => setForwardShowOnlyOnline(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="forwardShowOnlyOnline" className="text-xs text-seguranca-gray cursor-pointer">
                    Apenas online
                  </label>
                </div>
              </div>
              <Select
                onValueChange={(value) => {
                  if (!forwardRecipients.includes(value)) {
                    setForwardRecipients([...forwardRecipients, value]);
                  }
                }}
              >
                <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione usuários" />
                </SelectTrigger>
                <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50" style={{ backgroundColor: '#1f2937', opacity: 1, zIndex: 10070 }}>
                  {safeAvailableUsers
                    .filter(user => user.id !== currentUser?.id)
                    .filter(user => !forwardShowOnlyOnline || user.isOnline)
                    .sort((a, b) => {
                      // Ordenar: online primeiro, depois offline
                      if (a.isOnline && !b.isOnline) return -1;
                      if (!a.isOnline && b.isOnline) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map(user => (
                      <SelectItem key={user.id} value={user.id} className="text-seguranca-lightgray">
                        <div className="flex items-center gap-2 w-full">
                          <span className="flex-1">{user.name}</span>
                          {user.isOnline && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {forwardRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {forwardRecipients.map(recipientId => {
                    const user = safeAvailableUsers.find(u => u.id === recipientId);
                    return user ? (
                      <Badge key={recipientId} variant="secondary" className="flex items-center gap-1">
                        {user.name}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setForwardRecipients(forwardRecipients.filter(id => id !== recipientId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Grupos</label>
              <Select
                onValueChange={(value) => {
                  if (!forwardGroups.includes(value)) {
                    setForwardGroups([...forwardGroups, value]);
                  }
                }}
              >
                <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione grupos" />
                </SelectTrigger>
                <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50" style={{ backgroundColor: '#1f2937', opacity: 1, zIndex: 10070 }}>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id} className="text-seguranca-lightgray">
                      {group.name || group.groupName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {forwardGroups.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {forwardGroups.map(groupId => {
                    const group = groups.find(g => g.id === groupId);
                    return group ? (
                      <Badge key={groupId} variant="secondary" className="flex items-center gap-1">
                        {group.name || group.groupName}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setForwardGroups(forwardGroups.filter(id => id !== groupId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Departamentos</label>
              <Select
                onValueChange={(value) => {
                  if (!forwardDepartments.includes(value)) {
                    setForwardDepartments([...forwardDepartments, value]);
                  }
                }}
              >
                <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione departamentos" />
                </SelectTrigger>
                <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50" style={{ backgroundColor: '#1f2937', opacity: 1, zIndex: 10070 }}>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id} className="text-seguranca-lightgray">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {forwardDepartments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {forwardDepartments.map(deptId => {
                    const dept = departments.find(d => d.id === deptId);
                    return dept ? (
                      <Badge key={deptId} variant="secondary" className="flex items-center gap-1">
                        {dept.name}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => setForwardDepartments(forwardDepartments.filter(id => id !== deptId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-seguranca-gray/20">
            <Button
              variant="outline"
              onClick={() => {
                setShowForwardModal(false);
                setMessageToForward(null);
                setForwardRecipients([]);
                setForwardGroups([]);
                setForwardDepartments([]);
                setForwardShowOnlyOnline(false);
              }}
              className="border-seguranca-gray/30 text-seguranca-lightgray"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmForward}
              disabled={forwardRecipients.length === 0 && forwardGroups.length === 0 && forwardDepartments.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Encaminhar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Denunciar Mensagem */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="bg-seguranca-darkgray border-seguranca-gray/30 max-w-md w-[90vw] sm:w-full overflow-visible" style={{ zIndex: 10050 }}>
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray">Denunciar Mensagem</DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Informe o motivo da denúncia. Nossa equipe irá analisar o caso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Motivo *</label>
              <Select onValueChange={setReportReason} value={reportReason}>
                <SelectTrigger className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent className="!bg-seguranca-graphite !border-seguranca-gray/50" style={{ backgroundColor: '#1f2937', opacity: 1, zIndex: 10070 }}>
                  <SelectItem value="SPAM" className="text-seguranca-lightgray">Spam</SelectItem>
                  <SelectItem value="INAPPROPRIATE" className="text-seguranca-lightgray">Conteúdo Inadequado</SelectItem>
                  <SelectItem value="HARASSMENT" className="text-seguranca-lightgray">Assédio</SelectItem>
                  <SelectItem value="FAKE_NEWS" className="text-seguranca-lightgray">Informação Falsa</SelectItem>
                  <SelectItem value="OTHER" className="text-seguranca-lightgray">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Descrição (opcional)</label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Forneça mais detalhes sobre a denúncia..."
                className="bg-seguranca-darkgray border-seguranca-gray/30 text-seguranca-lightgray min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4 border-t border-seguranca-gray/20">
            <Button
              variant="outline"
              onClick={() => {
                setShowReportModal(false);
                setMessageToReport(null);
                setReportReason('');
                setReportDescription('');
              }}
              className="border-seguranca-gray/30 text-seguranca-lightgray"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmReport}
              disabled={!reportReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Denunciar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default ChatInterno;