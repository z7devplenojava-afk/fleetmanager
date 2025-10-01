import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  MessageSquare, 
  Send, 
  Inbox, 
  Search, 
  Plus,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMessageStore, SystemMessage } from '../../stores/messageStore';
import { messageService, MessageServiceError } from '../../services/messageService';

const MessageDashboard: React.FC = () => {
  // Estado local para UI
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const { toast } = useToast();

  // Estado global do store
  const {
    systemMessages,
    unreadSystemCount,
    loading,
    error,
    setSystemMessages,
    addSystemMessage,
    updateSystemMessage,
    setLoading,
    setError
  } = useMessageStore();

  // Cores do sistema
  const colors = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-500 hover:bg-blue-600'
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [messagesData, count] = await Promise.all([
        messageService.getSystemMessages(0, 20),
        messageService.getUnreadSystemCount()
      ]);
      
      setSystemMessages(messagesData.messages);
      
      console.log('✅ [MessageDashboard] Dados carregados:', {
        messages: messagesData.messages.length,
        unreadCount: count
      });
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao carregar dashboard:', error);
      
      if (error instanceof MessageServiceError) {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setError('Erro ao carregar mensagens');
        toast({
          title: "Erro",
          description: "Erro ao carregar mensagens",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadMessages = async (tab: string, page = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      let messagesData;
      
      if (tab === 'received' || tab === 'sent') {
        messagesData = await messageService.getSystemMessages(page, 10);
        
        if (page === 0) {
          setSystemMessages(messagesData.messages);
        } else {
          setSystemMessages([...systemMessages, ...messagesData.messages]);
        }
        
        setHasMore(messagesData.hasNext);
        setCurrentPage(page);
      } else if (tab === 'unread') {
        // Filtrar mensagens não lidas do estado atual
        const unreadMessages = systemMessages.filter(msg => msg.status === 'UNREAD');
        setHasMore(false);
      }
      
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao carregar mensagens:', error);
      
      if (error instanceof MessageServiceError) {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar mensagens",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(0);
    setHasMore(true);
    loadMessages(tab, 0);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMessages(activeTab, 0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const searchResults = await messageService.searchMessages(searchQuery, 'system') as SystemMessage[];
      setSystemMessages(searchResults);
      setHasMore(false);
      
      console.log('✅ [MessageDashboard] Busca realizada:', searchResults.length, 'resultados');
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro na busca:', error);
      
      if (error instanceof MessageServiceError) {
        setError(error.message);
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao buscar mensagens",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messageService.markSystemMessageAsRead(messageId);
      updateSystemMessage(messageId, { status: 'READ', readAt: new Date().toISOString() });
      
      toast({
        title: "Sucesso",
        description: "Mensagem marcada como lida"
      });
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao marcar como lida:', error);
      
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao marcar mensagem como lida",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // TODO: Implementar delete no backend
      console.warn('[MessageDashboard] Delete não implementado no backend ainda');
      
      toast({
        title: "Aviso",
        description: "Funcionalidade de exclusão será implementada em breve",
        variant: "default"
      });
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao deletar:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao deletar mensagem",
        variant: "destructive"
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'NORMAL':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'LOW':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READ':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filtrar mensagens baseado na aba ativa
  const getFilteredMessages = () => {
    switch (activeTab) {
      case 'received':
        return systemMessages;
      case 'sent':
        return systemMessages; // TODO: Filtrar por mensagens enviadas
      case 'unread':
        return systemMessages.filter(msg => msg.status === 'UNREAD');
      default:
        return systemMessages;
    }
  };

  const filteredMessages = getFilteredMessages();

  return (
    <div className="space-y-6" data-aos="fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${colors.primary} text-white`}>
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Mensagens</h1>
            <p className="text-gray-600">Gerencie suas mensagens e comunicações</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {unreadSystemCount > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unreadSystemCount} não lidas
            </Badge>
          )}
          <Button 
            onClick={() => setShowMessageForm(true)}
            className={colors.primary}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Mensagem
          </Button>
          <Button 
            onClick={loadDashboard}
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Mensagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{systemMessages.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unreadSystemCount}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemMessages.filter(m => m.status === 'read').length}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Arquivadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {systemMessages.filter(m => m.status === 'ARCHIVED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-2">
            <Input
              placeholder="Buscar mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} className={colors.info} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens</CardTitle>
          <CardDescription>
            Gerencie suas mensagens recebidas e enviadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received" className="flex items-center space-x-2">
                <Inbox className="w-4 h-4" />
                <span>Recebidas</span>
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <Send className="w-4 h-4" />
                <span>Enviadas</span>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>Não Lidas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-6">
              <MessageList 
                messages={filteredMessages}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteMessage}
                onView={(message) => setSelectedMessage(message)}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="sent" className="mt-6">
              <MessageList 
                messages={filteredMessages}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteMessage}
                onView={(message) => setSelectedMessage(message)}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="unread" className="mt-6">
              <MessageList 
                messages={filteredMessages}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteMessage}
                onView={(message) => setSelectedMessage(message)}
                getPriorityIcon={getPriorityIcon}
                getPriorityColor={getPriorityColor}
                getStatusColor={getStatusColor}
                loading={loading}
              />
            </TabsContent>
          </Tabs>

          {hasMore && (
            <div className="mt-4 text-center">
              <Button 
                onClick={() => loadMessages(activeTab, currentPage + 1)}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Carregando...
                  </>
                ) : (
                  'Carregar Mais'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TODO: Implementar modais quando necessário */}
      {showMessageForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Nova Mensagem</h2>
            <p className="text-gray-600 mb-4">Funcionalidade será implementada em breve.</p>
            <Button onClick={() => setShowMessageForm(false)}>Fechar</Button>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">{selectedMessage.title}</h2>
              <Button variant="ghost" onClick={() => setSelectedMessage(null)}>×</Button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {getPriorityIcon(selectedMessage.priority)}
                <Badge className={getPriorityColor(selectedMessage.priority)}>
                  {selectedMessage.priority}
                </Badge>
                <Badge className={getStatusColor(selectedMessage.status)}>
                  {selectedMessage.status === 'UNREAD' ? 'Nova' : 
                   selectedMessage.status === 'read' ? 'Lida' : 'Arquivada'}
                </Badge>
              </div>
              <p className="text-gray-700">{selectedMessage.content}</p>
              <div className="text-sm text-gray-500">
                <p>De: {selectedMessage.sender.name}</p>
                <p>Data: {new Date(selectedMessage.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex space-x-2">
                {selectedMessage.status === 'UNREAD' && (
                  <Button onClick={() => handleMarkAsRead(selectedMessage.id)}>
                    Marcar como Lida
                  </Button>
                )}
                <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MessageListProps {
  messages: SystemMessage[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (message: SystemMessage) => void;
  getPriorityIcon: (priority: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
  loading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMarkAsRead,
  onDelete,
  onView,
  getPriorityIcon,
  getPriorityColor,
  getStatusColor,
  loading
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando mensagens...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Nenhuma mensagem encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
            message.status === 'UNREAD' ? 'bg-blue-50 border-blue-200' : 'bg-white'
          }`}
          onClick={() => onView(message)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-gray-900">{message.title}</h3>
                {getPriorityIcon(message.priority)}
                <Badge className={getPriorityColor(message.priority)}>
                  {message.priority}
                </Badge>
                <Badge className={getStatusColor(message.status)}>
                  {message.status === 'UNREAD' ? 'Nova' : 
                   message.status === 'read' ? 'Lida' : 'Arquivada'}
                </Badge>
              </div>
              
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                {message.content}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>De: {message.sender.name}</span>
                  {message.recipients && message.recipients.length > 0 && (
                    <span>Para: {message.recipients.map(r => r.name).join(', ')}</span>
                  )}
                  {message.departments && message.departments.length > 0 && (
                    <span>Departamentos: {message.departments.map(d => d.name).join(', ')}</span>
                  )}
                </div>
                <span>{new Date(message.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              {message.status === 'UNREAD' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(message.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(message.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageDashboard;