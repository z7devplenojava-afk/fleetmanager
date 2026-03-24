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
  RefreshCw,
  Edit,
  Archive,
  TrendingUp,
  Mail,
  Bell,
  Users,
  Filter,
  SendHorizontal,
  Reply
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMessageStore, SystemMessage } from '../../stores/messageStore';
import { messageService, MessageServiceError } from '../../services/messageService';
import MessageFormModal from './MessageFormModal';
import ViewMessageModal from './ViewMessageModal';
import DeleteMessageModal from './DeleteMessageModal';

const MessageDashboard: React.FC = () => {
  // Estado local para UI
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SystemMessage | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<SystemMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<SystemMessage | null>(null);
  const [messageToReply, setMessageToReply] = useState<SystemMessage | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'reply'>('create');
  
  // Estatísticas de mensagens do backend
  const [messageStats, setMessageStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    archived: 0
  });

  const { toast } = useToast();

  // Estado global do store
  const {
    systemMessages,
    unreadSystemCount,
    loading,
    error,
    setSystemMessages,
    updateSystemMessage,
    setLoading,
    setError
  } = useMessageStore();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar estatísticas do backend
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
      
      // Carregar mensagens baseado na aba ativa (excluindo arquivadas)
      await loadMessages(activeTab, 0);
      
      console.log('✅ [MessageDashboard] Dashboard carregado:', {
        stats,
        activeTab
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
      
      // Buscar mensagens baseado na aba selecionada
      if (tab === 'sent') {
        messagesData = await messageService.getSentMessages(page, 10);
      } else if (tab === 'archived') {
        // Buscar mensagens arquivadas do backend
        messagesData = await messageService.getMessagesByStatus('ARCHIVED', page, 10);
      } else if (tab === 'unread') {
        // Buscar mensagens não lidas do backend
        messagesData = await messageService.getMessagesByStatus('UNREAD', page, 10);
      } else if (tab === 'read') {
        // Buscar mensagens lidas do backend
        messagesData = await messageService.getMessagesByStatus('READ', page, 10);
      } else {
        // 'received' - todas as mensagens recebidas
        messagesData = await messageService.getSystemMessages(page, 10);
      }
      
      if (page === 0) {
        setSystemMessages(messagesData.messages);
      } else {
        setSystemMessages([...systemMessages, ...messagesData.messages]);
      }
      
      setHasMore(messagesData.hasNext);
      setCurrentPage(page);
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao carregar mensagens:', error);
      
      if (error instanceof MessageServiceError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(0);
    setHasMore(true);
    
    // Recarregar estatísticas ao mudar de aba
    try {
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao carregar estatísticas:', error);
    }
    
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
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro na busca:', error);
      
      if (error instanceof MessageServiceError) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messageService.markSystemMessageAsRead(messageId);
      updateSystemMessage(messageId, { status: 'READ', readAt: new Date().toISOString() });
      
      // Atualizar estatísticas após marcar como lida
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
      
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
      }
    }
  };

  const handleDelete = async (reason: string) => {
    if (!messageToDelete) return;

    try {
      await messageService.deleteSystemMessage(messageToDelete.id, reason);
      
      toast({
        title: "Sucesso",
        description: "Mensagem excluída com sucesso"
      });

      // Remover mensagem do estado
      setSystemMessages(systemMessages.filter(m => m.id !== messageToDelete.id));
      setMessageToDelete(null);
    } catch (error: any) {
      console.error('❌ [MessageDashboard] Erro ao deletar:', error);
      
      toast({
        title: "Erro",
        description: error.message || "Erro ao deletar mensagem",
        variant: "destructive"
      });
    }
  };

  const handleArchive = async (messageId: string) => {
    try {
      await messageService.archiveSystemMessage(messageId);
      updateSystemMessage(messageId, { status: 'ARCHIVED' });
      
      toast({
        title: "Sucesso",
        description: "Mensagem arquivada com sucesso"
      });

      // Recarregar estatísticas e mensagens para atualizar a lista
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
      loadMessages(activeTab, 0);
    } catch (error: any) {
      console.error('❌ [MessageDashboard] Erro ao arquivar:', error);
      
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleRestore = async (messageId: string) => {
    try {
      await messageService.restoreSystemMessage(messageId);
      updateSystemMessage(messageId, { status: 'READ' });
      
      toast({
        title: "Sucesso",
        description: "Mensagem restaurada com sucesso"
      });

      // Recarregar estatísticas e mensagens para atualizar a lista
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
      loadMessages(activeTab, 0);
    } catch (error: any) {
      console.error('❌ [MessageDashboard] Erro ao restaurar:', error);
      
      if (error instanceof MessageServiceError) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleView = (message: SystemMessage) => {
    setSelectedMessage(message);
    setShowViewModal(true);
  };

  const handleEditClick = (message: SystemMessage) => {
    setMessageToEdit(message);
    setModalMode('edit');
    setShowMessageForm(true);
  };

  const handleDeleteClick = (message: SystemMessage) => {
    setMessageToDelete(message);
    setShowDeleteModal(true);
  };

  const handleNewMessage = () => {
    setMessageToEdit(null);
    setMessageToReply(null);
    setModalMode('create');
    setShowMessageForm(true);
  };

  const handleReplyClick = (message: SystemMessage) => {
    setMessageToReply(message);
    setMessageToEdit(null);
    setModalMode('reply');
    setShowMessageForm(true);
  };

  const handleFormSuccess = async () => {
    // Recarregar estatísticas e mensagens após criar/editar mensagem
    try {
      const stats = await messageService.getMessageStatistics();
      setMessageStats(stats);
    } catch (error) {
      console.error('❌ [MessageDashboard] Erro ao carregar estatísticas:', error);
    }
    loadDashboard();
  };

  // As mensagens já vêm filtradas do backend baseado na aba ativa
  // Não precisamos filtrar localmente, apenas usar systemMessages diretamente
  const filteredMessages = systemMessages;

  return (
    <div className="space-y-6">

      {/* Header Moderno */}
      <div className="bg-gradient-to-r from-seguranca-graphite to-seguranca-black rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Mensagens</h1>
              <p className="text-gray-400 text-sm md:text-base">Gerencie sua comunicação interna</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {unreadSystemCount > 0 && (
              <Badge className="bg-red-600 text-white px-3 py-1 animate-pulse shadow-lg">
                <Bell className="w-3 h-3 mr-1" />
                {unreadSystemCount} não lidas
              </Badge>
            )}
            <Button 
              onClick={handleNewMessage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Mensagem
            </Button>
            <Button 
              onClick={loadDashboard}
              variant="outline"
              disabled={loading}
              className="border-gray-600 text-white hover:bg-seguranca-black"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="border-red-500 bg-red-500/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards Responsivos - Integrados com Backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30 hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{messageStats.total}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Todas as mensagens
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30 hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Não Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{messageStats.unread}</div>
            <p className="text-xs text-gray-500 mt-1">Pendentes de leitura</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30 hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{messageStats.read}</div>
            <p className="text-xs text-gray-500 mt-1">Já visualizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30 hover:shadow-xl transition-all duration-200 hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Arquivadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{messageStats.archived}</div>
            <p className="text-xs text-gray-500 mt-1">Guardadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Responsivo */}
      <Card className="bg-seguranca-graphite border-gray-700 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Buscar mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-seguranca-black border-gray-600 text-white placeholder:text-gray-500"
            />
            <Button 
              onClick={handleSearch} 
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs Responsivos */}
      <Card className="bg-seguranca-graphite border-gray-700 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtrar Mensagens
          </CardTitle>
          <CardDescription className="text-gray-400">
            Visualize mensagens por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 bg-seguranca-black p-2">
              <TabsTrigger 
                value="received" 
                className="data-[state='active']:bg-blue-600 data-[state='active']:text-white transition-all text-xs sm:text-sm"
              >
                <Inbox className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Recebidas</span>
                <span className="sm:hidden">Inbox</span>
              </TabsTrigger>
              <TabsTrigger 
                value="sent"
                className="data-[state='active']:bg-cyan-600 data-[state='active']:text-white transition-all text-xs sm:text-sm"
              >
                <SendHorizontal className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Enviadas</span>
                <span className="sm:hidden">Enviadas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="unread"
                className="data-[state='active']:bg-red-600 data-[state='active']:text-white transition-all text-xs sm:text-sm"
              >
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Não Lidas</span>
                <span className="sm:hidden">Novas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="read"
                className="data-[state='active']:bg-green-600 data-[state='active']:text-white transition-all text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Lidas</span>
                <span className="sm:hidden">Lidas</span>
              </TabsTrigger>
              <TabsTrigger 
                value="archived"
                className="data-[state='active']:bg-purple-600 data-[state='active']:text-white transition-all text-xs sm:text-sm"
              >
                <Archive className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Arquivadas</span>
                <span className="sm:hidden">Arquiv.</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <MessageList 
                messages={filteredMessages}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                onView={handleView}
                onReply={handleReplyClick}
                onArchive={handleArchive}
                onRestore={handleRestore}
                loading={loading}
                activeTab={activeTab}
              />
            </TabsContent>
          </Tabs>

          {hasMore && filteredMessages.length > 0 && (
            <div className="mt-6 text-center">
              <Button 
                onClick={() => loadMessages(activeTab, currentPage + 1)}
                variant="outline"
                disabled={loading}
                className="border-gray-600 text-white hover:bg-seguranca-black"
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

      {/* Modais */}
      <MessageFormModal
        isOpen={showMessageForm}
        onClose={() => {
          setShowMessageForm(false);
          setMessageToReply(null);
        }}
        onSuccess={handleFormSuccess}
        message={messageToEdit || messageToReply}
        mode={modalMode}
        replyTo={messageToReply}
      />

      <ViewMessageModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        message={selectedMessage}
        onEdit={() => selectedMessage && handleEditClick(selectedMessage)}
        onDelete={() => selectedMessage && handleDeleteClick(selectedMessage)}
        onMarkAsRead={() => selectedMessage && handleMarkAsRead(selectedMessage.id)}
        onReply={() => selectedMessage && handleReplyClick(selectedMessage)}
        onArchive={() => selectedMessage && handleArchive(selectedMessage.id)}
        onRestore={() => selectedMessage && handleRestore(selectedMessage.id)}
      />

      <DeleteMessageModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        messageTitle={messageToDelete?.title || ''}
      />

    </div>
  );
};

interface MessageListProps {
  messages: SystemMessage[];
  onMarkAsRead: (id: string) => void;
  onDelete: (message: SystemMessage) => void;
  onEdit: (message: SystemMessage) => void;
  onView: (message: SystemMessage) => void;
  onReply: (message: SystemMessage) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
  loading: boolean;
  activeTab: string;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  onMarkAsRead,
  onDelete,
  onEdit,
  onView,
  onReply,
  onArchive,
  onRestore,
  loading,
  activeTab
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-400">Carregando mensagens...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-gray-600/20 inline-block mb-4">
          <MessageSquare className="w-12 h-12 text-gray-500" />
        </div>
        <p className="text-gray-400 text-lg font-medium">Nenhuma mensagem encontrada</p>
        <p className="text-gray-500 text-sm mt-2">Suas mensagens aparecerão aqui quando você tiver alguma</p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'NORMAL':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'LOW':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgente';
      case 'HIGH':
        return 'Alta';
      case 'NORMAL':
        return 'Normal';
      case 'LOW':
        return 'Baixa';
      default:
        return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'READ':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'ARCHIVED':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UNREAD':
        return 'Nova';
      case 'READ':
        return 'Lida';
      case 'ARCHIVED':
        return 'Arquivada';
      default:
        return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return 'Individual';
      case 'GROUP':
        return 'Grupo';
      case 'DEPARTMENT':
        return 'Departamento';
      case 'GLOBAL':
        return 'Global';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`group p-4 md:p-5 border rounded-xl hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-[1.02] ${
            message.status === 'UNREAD' 
              ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/5 border-blue-500/30 shadow-lg' 
              : 'bg-seguranca-black border-gray-700'
          }`}
          onClick={() => onView(message)}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="font-semibold text-white text-lg">{message.title}</h3>
                <Badge className={getPriorityColor(message.priority)}>
                  {getPriorityLabel(message.priority)}
                </Badge>
                <Badge className={getStatusColor(message.status)}>
                  {getStatusLabel(message.status)}
                </Badge>
                {message.type && (
                  <Badge variant="outline" className="border-gray-500 text-gray-300">
                    {getTypeLabel(message.type)}
                  </Badge>
                )}
              </div>
              
              <p className="text-gray-400 text-sm md:text-base mb-3 line-clamp-2">
                {message.content}
              </p>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {activeTab === 'sent' ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Para: {message.recipients && message.recipients.length > 0 
                        ? `${message.recipients.length} ${message.recipients.length === 1 ? 'destinatário' : 'destinatários'}`
                        : message.type === 'GLOBAL' ? 'Todos' : 'Nenhum'}</span>
                    </div>
                    {message.recipients && message.recipients.length > 0 && message.recipients.length <= 3 && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{message.recipients.map((r: any) => r.name || r.email).join(', ')}</span>
                      </div>
                    )}
                  </> 
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>De: {message.sender.name}</span>
                    </div>
                    {message.recipients && message.recipients.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        <span>{message.recipients.length} {message.recipients.length === 1 ? 'destinatário' : 'destinatários'}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(message.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
            
            <div className="flex md:flex-col gap-2">
              {message.status === 'UNREAD' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(message.id);
                  }}
                  className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                >
                  <CheckCircle className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Marcar como Lida</span>
                </Button>
              )}
              {message.status !== 'ARCHIVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(message.id);
                  }}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <Archive className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Arquivar</span>
                </Button>
              )}
              {message.status === 'ARCHIVED' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRestore(message.id);
                  }}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                >
                  <RefreshCw className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Restaurar</span>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onReply(message);
                }}
                className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              >
                <Reply className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Responder</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(message);
                }}
                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <Edit className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Editar</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(message);
                }}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Excluir</span>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageDashboard;