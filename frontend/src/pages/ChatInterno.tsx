import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';
import { useMessageStore, User, ChatMessage } from '@/stores/messageStore';
import { messageService, MessageServiceError } from '@/services/messageService';
import { useWebSocket } from '@/hooks/useWebSocket';

const ChatInterno: React.FC = () => {
  // Estado local para UI
  const [newMessage, setNewMessage] = useState('');
  const [chatType, setChatType] = useState<'individual' | 'group' | 'department'>('individual');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    setLoading,
    setError,
    setSearchTerm,
    getFilteredConversations,
    getCurrentUser
  } = useMessageStore();

  const currentUser = getCurrentUser();
  const filteredConversations = getFilteredConversations();

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
    },
    onDisconnect: () => {
      console.log('🔌 [CHAT] WebSocket desconectado');
    }
  });

  // Scroll automático para última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Carregar conversas recentes e usuários disponíveis em paralelo
      const [conversationsData, usersData] = await Promise.all([
        messageService.getRecentConversations(),
        messageService.getAvailableUsers()
      ]);

      setConversations(conversationsData);
      setAvailableUsers(usersData);
      
      console.log('✅ [CHAT] Dados iniciais carregados:', {
        conversations: conversationsData.length,
        users: usersData.length,
        conversationsData: conversationsData,
        usersData: usersData
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

  const loadConversation = async (conversationId: string) => {
    if (!conversationId) return;
    
    setLoading(true);
    console.log('💬 [CHAT] Carregando conversa:', conversationId);
    
    try {
      const messages = await messageService.getConversationMessages(conversationId);
      setChatMessages(messages);
      console.log('✅ [CHAT] Mensagens carregadas:', messages.length);
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    console.log('📤 [CHAT] Enviando mensagem:', newMessage);

    try {
      const messageData = {
        content: newMessage,
        recipientId: selectedConversation.type === 'individual' ? selectedConversation.id : undefined,
        groupId: selectedConversation.type === 'group' ? selectedConversation.id : undefined,
        departmentId: selectedConversation.type === 'department' ? selectedConversation.id : undefined,
        type: 'TEXT' as const,
        replyToId: replyToMessage?.id
      };

      const sentMessage = await messageService.sendChatMessage(messageData);
      
      // Adicionar mensagem localmente (otimistic update)
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
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const startNewConversation = () => {
    if (!selectedUser) return;

    const newConversation = {
      id: selectedUser.id,
      name: selectedUser.name,
      type: 'individual' as const,
      unreadCount: 0,
      isOnline: selectedUser.isOnline
    };

    setConversations([newConversation, ...conversations]);
    setSelectedConversation(newConversation);
    setShowNewChatModal(false);
    setSelectedUser(null);
    loadConversation(selectedUser.id);
  };

  return (
    <MainLayout title="Chat Interno" subtitle="Converse em tempo real com colaboradores, grupos e departamentos">
      <div className="flex h-full gap-6">
        {/* Sidebar - Lista de Conversas */}
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Conversas</CardTitle>
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" title="Conectado" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" title="Desconectado" />
                )}
              </div>
              
              <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Nova Conversa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Tipo de Conversa</label>
                      <Select value={chatType} onValueChange={(value: 'individual' | 'group' | 'department') => setChatType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="group">Grupo</SelectItem>
                          <SelectItem value="department">Departamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {chatType === 'individual' && (
                      <div>
                        <label className="text-sm font-medium">Selecionar Usuário</label>
                        <Select onValueChange={(value) => {
                          const user = availableUsers.find(u => u.id === value);
                          setSelectedUser(user || null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers.length === 0 ? (
                              <SelectItem value="no-users" disabled>
                                Nenhum usuário disponível
                              </SelectItem>
                            ) : (
                              availableUsers
                                .filter(user => user && user.id && user.name) // Filtrar usuários válidos
                                .map(user => (
                                  <SelectItem key={user.id} value={user.id}>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="w-6 h-6">
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                      </Avatar>
                                      <span>{user.name}</span>
                                      {user.isOnline && <Badge variant="secondary" className="text-xs">Online</Badge>}
                                    </div>
                                  </SelectItem>
                                ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowNewChatModal(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={startNewConversation} disabled={!selectedUser}>
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
            
            <ScrollArea className="h-full">
              <div className="space-y-1">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="ml-2">Carregando...</span>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>Nenhuma conversa encontrada</p>
                    <p className="text-sm">Inicie uma nova conversa</p>
                  </div>
                ) : (
                  filteredConversations
                    .filter(conversation => conversation && conversation.id) // Filtrar conversas válidas
                    .map((conversation) => (
                    <div
                      key={conversation.id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conversation);
                        loadConversation(conversation.id);
                      }}
                    >
                                              <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
                            </Avatar>
                            {conversation.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{conversation.name || 'Conversa sem nome'}</p>
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
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área Principal do Chat */}
        <Card className="flex-1 flex flex-col">
          {selectedConversation && selectedConversation.id ? (
            <>
              {/* Header da Conversa */}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{getInitials(selectedConversation.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedConversation.name || 'Conversa sem nome'}</CardTitle>
                      <div className="flex items-center gap-2">
                        {selectedConversation.isOnline && (
                          <Badge variant="secondary" className="text-xs">Online</Badge>
                        )}
                        {typingUsers.size > 0 && (
                          <span className="text-xs text-muted-foreground">digitando...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Área de Mensagens */}
              <CardContent className="flex-1 p-0 flex flex-col">
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-4 py-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="ml-2">Carregando mensagens...</span>
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p>Nenhuma mensagem ainda</p>
                        <p className="text-sm">Inicie a conversa!</p>
                      </div>
                    ) : (
                      chatMessages.map((message) => {
                        const isCurrentUser = message.sender.id === currentUser?.id || message.sender.id === currentUser?.username;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${isCurrentUser ? 'order-2' : 'order-1'}`}>
                              {!isCurrentUser && (
                                <div className="flex items-center gap-2 mb-1">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs font-medium">{message.sender.name}</span>
                                </div>
                              )}
                              
                              {message.replyToId && replyToMessage && (
                                <div className="bg-muted/50 p-2 rounded-t-lg border-l-2 border-primary mb-1">
                                  <p className="text-xs text-muted-foreground">Respondendo a {replyToMessage.sender.name}</p>
                                  <p className="text-xs truncate">{replyToMessage.content}</p>
                                </div>
                              )}
                              
                              <div
                                className={`p-3 rounded-lg ${
                                  isCurrentUser
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
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
                                    <p className="text-sm">{message.content}</p>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs opacity-70">
                                        {format(new Date(message.createdAt), 'HH:mm', { locale: ptBR })}
                                        {message.editedAt && ' (editada)'}
                                      </span>
                                      {isCurrentUser && (
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                              setEditingMessage(message.id);
                                              setEditContent(message.content);
                                            }}
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0"
                                            onClick={() => setReplyToMessage(message)}
                                          >
                                            <Reply className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Área de Input */}
                <div className="p-4 border-t">
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
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyPress={handleKeyPress}
                      className="min-h-[60px] resize-none"
                      disabled={loading}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || loading}
                      className="self-end"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
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
    </MainLayout>
  );
};

export default ChatInterno;