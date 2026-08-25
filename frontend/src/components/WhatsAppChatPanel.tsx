import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  User,
  Loader2,
  RefreshCw,
  CheckCheck,
  Check,
  Bot,
  UserCheck,
  Globe,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import chatIntegrationService, { ChatConversation, ChatMessage } from '@/services/chatIntegrationService';

interface WhatsAppChatPanelProps {
  agentId?: string;
  agentName?: string;
}

const WhatsAppChatPanel: React.FC<WhatsAppChatPanelProps> = ({ agentId = 'system', agentName = 'Atendente' }) => {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Carregar conversas
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatIntegrationService.listConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Erro ao carregar conversas', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar mensagens de uma conversa
  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const msgs = await chatIntegrationService.getMessages(conversationId);
      setMessages(msgs);
      // Marcar como lida
      await chatIntegrationService.markAsRead(conversationId);
    } catch (error) {
      console.error('Erro ao carregar mensagens', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Polling com backoff adaptativo:
  // - só roda quando a aba está visível
  // - aumenta o intervalo quando o backend começa a falhar (ERR_EMPTY_RESPONSE/RESET/500)
  const [pollInterval, setPollInterval] = useState(15000); // 15s padrão
  const failureCountRef = useRef(0);
  const lastFailureAtRef = useRef<number>(0);
  const tabVisibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);

  useEffect(() => {
    const onVisibility = () => {
      tabVisibleRef.current = !document.hidden;
      if (tabVisibleRef.current) {
        // Recarrega imediatamente ao voltar para a aba
        loadConversations();
        if (selectedConversation) loadMessages(selectedConversation.id);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [selectedConversation]);

  useEffect(() => {
    loadConversations();
    const interval = setInterval(async () => {
      // Pausa polling se a aba está oculta — evita gastar recursos
      if (!tabVisibleRef.current) return;

      // Backoff: se houve falha recente, dobra o intervalo
      const now = Date.now();
      if (lastFailureAtRef.current && now - lastFailureAtRef.current < pollInterval) {
        return;
      }

      try {
        await loadConversations();
        if (selectedConversation) {
          await loadMessages(selectedConversation.id);
        }
        // Sucesso: reseta contador e volta para 15s se estiver maior
        failureCountRef.current = 0;
        if (pollInterval > 15000) setPollInterval(15000);
      } catch (err) {
        failureCountRef.current += 1;
        lastFailureAtRef.current = now;
        // Aumenta o intervalo progressivamente: 15s → 30s → 60s → 120s (cap)
        if (failureCountRef.current >= 3) {
          setPollInterval(prev => Math.min(prev * 2, 120000));
        }
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [selectedConversation, pollInterval]);

  // Scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = async (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Adiciona a mensagem localmente para feedback instantâneo
    const optimisticMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation.id,
      content,
      senderType: 'AGENT',
      senderName: agentName,
      timestamp: new Date().toISOString(),
      read: false,
      messageType: 'TEXT',
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const sent = await chatIntegrationService.replyAsAgent(
        selectedConversation.id,
        content,
        agentId,
        agentName
      );
      // Substituir a mensagem otimista pela resposta do backend
      setMessages(prev => prev.map(m => m.id === optimisticMessage.id ? sent : m));
      toast({
        title: 'Mensagem enviada',
        description: `Enviada para ${selectedConversation.customerName}`,
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
      // Recarregar conversas para atualizar último message
      loadConversations();
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP': return <Smartphone className="h-4 w-4" />;
      case 'CHAT_WEB': return <Globe className="h-4 w-4" />;
      case 'CHATBOT': return <Bot className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'CHAT_WEB': return 'Chat Web';
      case 'CHATBOT': return 'Chatbot';
      default: return 'Mensagem';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Aberta';
      case 'IN_PROGRESS': return 'Em atendimento';
      case 'RESOLVED': return 'Resolvida';
      case 'CLOSED': return 'Fechada';
      default: return status;
    }
  };

  // Filtrar conversas pela busca
  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.customerName.toLowerCase().includes(term) ||
      c.customerPhone.toLowerCase().includes(term) ||
      (c.customerEmail && c.customerEmail.toLowerCase().includes(term)) ||
      (c.lastMessage && c.lastMessage.toLowerCase().includes(term))
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Coluna esquerda - Lista de conversas */}
      <Card className="lg:col-span-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5 text-green-600" />
              Conversas
              {totalUnread > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {totalUnread}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadConversations}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  As conversas do WhatsApp e Chatbot aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white flex-shrink-0">
                        {getChannelIcon(conversation.channel)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">
                            {conversation.customerName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage || 'Sem mensagens'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {getChannelLabel(conversation.channel)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {conversation.lastMessageAt
                              ? format(new Date(conversation.lastMessageAt), 'HH:mm', { locale: ptBR })
                              : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna direita - Mensagens */}
      <Card className="lg:col-span-2 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Selecione uma conversa para visualizar as mensagens
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                As mensagens do WhatsApp e Chatbot são exibidas em tempo real
              </p>
            </div>
          </div>
        ) : (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
                    {getChannelIcon(selectedConversation.channel)}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {selectedConversation.customerName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {selectedConversation.customerPhone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedConversation.status)}>
                    {getStatusLabel(selectedConversation.status)}
                  </Badge>
                  <Badge variant="outline">
                    {getChannelLabel(selectedConversation.channel)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma mensagem ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const isAgent = message.senderType === 'AGENT' || message.senderType === 'BOT';
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isAgent ? 'order-1' : 'order-2'}`}>
                            {isAgent && message.senderName && (
                              <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground justify-end">
                                {message.senderType === 'BOT' ? (
                                  <Bot className="h-3 w-3" />
                                ) : (
                                  <UserCheck className="h-3 w-3" />
                                )}
                                <span>{message.senderName}</span>
                              </div>
                            )}
                            <div
                              className={`rounded-lg px-3 py-2 ${
                                isAgent
                                  ? message.senderType === 'BOT'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-green-500 text-white'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className={`flex items-center gap-1 mt-1 text-xs ${
                                isAgent ? 'text-white/70' : 'text-muted-foreground'
                              }`}>
                                <span>
                                  {format(new Date(message.timestamp), 'HH:mm', { locale: ptBR })}
                                </span>
                                {isAgent && message.senderType === 'AGENT' && (
                                  message.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  className="resize-none"
                  disabled={sending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                  className="bg-green-600 hover:bg-green-700 h-10 w-10"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pressione Enter para enviar, Shift+Enter para quebrar linha
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default WhatsAppChatPanel;
