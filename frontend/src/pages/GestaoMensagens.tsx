import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, 
  Inbox, 
  Plus, 
  Bell, 
  Users as UsersIcon, 
  Settings,
  Eye,
  Mail,
  RefreshCw,
  CheckCircle,
  CheckCheck,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { groupService } from '@/services/groupService';
import { departmentService } from '@/services/departmentService';
import { useToast } from '@/hooks/use-toast';
import { useNotificationBell } from '@/hooks/useNotificationBell';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';
import MessageGroupsManagement from '@/components/mensagens/MessageGroupsManagement';
import { UserGroupData } from '@/types/user';
import { Search, X } from 'lucide-react';

import { UUID } from '@/types/employee';

interface User {
  id: UUID;
  name: string;
  email: string;
  department?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface Message {
  id: UUID;
  title: string;
  content: string;
  type: 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL' | 'NOTIFICATION' | 'EMAIL';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  sender: User;
  recipients: User[];
  departments: Department[];
  sendEmail: boolean;
  sendNotification: boolean;
  scheduledAt?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
}

const GestaoMensagens: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determinar a página atual baseado na URL
  const pathParts = location.pathname.split('/');
  const currentPage = pathParts.length > 2 && pathParts[2] ? pathParts[2] : 'inbox';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<UserGroupData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sistema de Notificações em tempo real sincronizado com o NotificationBell
  const {
    systemMessages,
    unreadCount: notifUnreadCount,
    isLoading: notifLoading,
    loadMessages: reloadNotifications,
    markAsRead: markNotifAsRead,
    markAllAsRead: markAllNotifsAsRead,
    formatDate: formatNotifDate,
    getPriorityConfig: getNotifPriorityConfig
  } = useNotificationBell();

  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notifSearch, setNotifSearch] = useState('');
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread'>('all');
  const [inboxSearch, setInboxSearch] = useState('');
  
  // Estados para busca e seleção
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GLOBAL' as 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    recipientIds: [] as string[],
    groupIds: [] as string[],
    departmentIds: [] as string[],
    sendEmail: false,
    sendNotification: true,
    scheduledAt: ''
  });

  useEffect(() => {
    loadData();
    reloadNotifications();
  }, []);

  // Redirecionar para inbox se estiver na rota raiz
  useEffect(() => {
    if (location.pathname === '/gestao-mensagens') {
      navigate('/gestao-mensagens/inbox', { replace: true });
    }
  }, [location.pathname, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar mensagens recebidas usando messageService
      const messagesData = await messageService.getSystemMessages(0, 50);
      setMessages(messagesData.messages || []);

      // Carregar contagem de não lidas usando messageService (já trata ERR_TOO_MANY_REDIRECTS)
      const count = await messageService.getUnreadSystemCount();
      setUnreadCount(count);

      // Carregar usuários, grupos e departamentos
      const [usersData, groupsData, departmentsData] = await Promise.all([
        userService.getAllUsers().catch(() => []),
        groupService.getGroups().catch(() => []),
        departmentService.listActive().catch(() => [])
      ]);
      
      setUsers(usersData);
      setGroups(groupsData);
      setDepartments(departmentsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    // Validações básicas
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    // Validações específicas por tipo
    if (formData.type === 'INDIVIDUAL' && (!formData.recipientIds || formData.recipientIds.length === 0)) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um usuário para mensagens individuais",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'GROUP' && (!formData.groupIds || formData.groupIds.length === 0)) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um grupo para mensagens de grupo",
        variant: "destructive"
      });
      return;
    }

    if (formData.type === 'DEPARTMENT' && (!formData.departmentIds || formData.departmentIds.length === 0)) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um departamento para mensagens de departamento",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await messageService.sendSystemMessage({
        title: formData.title,
        content: formData.content,
        type: formData.type,
        priority: formData.priority,
        recipientIds: formData.recipientIds,
        groupIds: formData.groupIds,
        departmentIds: formData.departmentIds,
        sendEmail: formData.sendEmail,
        sendNotification: formData.sendNotification,
        scheduledAt: formData.scheduledAt || undefined
      });

      toast({
        title: "Sucesso",
        description: "Mensagem enviada com sucesso"
      });
      resetForm();
      navigate('/gestao-mensagens/inbox');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      // Usar messageService que já trata erros adequadamente
      await messageService.markSystemMessageAsRead(messageId);
      
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'GLOBAL',
      priority: 'NORMAL',
      recipientIds: [],
      groupIds: [],
      departmentIds: [],
      sendEmail: false,
      sendNotification: true,
      scheduledAt: ''
    });
    setSelectedUserIds([]);
    setSelectedGroupIds([]);
    setSelectedDepartmentIds([]);
    setUserSearchTerm('');
    setGroupSearchTerm('');
    setDepartmentSearchTerm('');
  };

  // Funções auxiliares para filtragem
  const filteredUsers = users.filter(user => {
    if (!userSearchTerm.trim()) return true;
    const search = userSearchTerm.toLowerCase();
    return user.name?.toLowerCase().includes(search) || 
           user.email?.toLowerCase().includes(search);
  });

  const filteredGroups = groups.filter(group => {
    if (!groupSearchTerm.trim()) return true;
    const search = groupSearchTerm.toLowerCase();
    return group.displayName?.toLowerCase().includes(search) || 
           group.groupName?.toLowerCase().includes(search);
  });

  const filteredDepartments = departments.filter(dept => {
    if (!departmentSearchTerm.trim()) return true;
    const search = departmentSearchTerm.toLowerCase();
    return dept.name?.toLowerCase().includes(search) || 
           dept.description?.toLowerCase().includes(search);
  });

  // Funções para adicionar/remover seleções
  const toggleUserSelection = (userId: string) => {
    const newSelection = formData.recipientIds.includes(userId)
      ? formData.recipientIds.filter(id => id !== userId)
      : [...formData.recipientIds, userId];
    setFormData({ ...formData, recipientIds: newSelection });
  };

  const toggleGroupSelection = (groupId: string) => {
    const newSelection = formData.groupIds.includes(groupId)
      ? formData.groupIds.filter(id => id !== groupId)
      : [...formData.groupIds, groupId];
    setFormData({ ...formData, groupIds: newSelection });
  };

  const toggleDepartmentSelection = (departmentId: string) => {
    const newSelection = formData.departmentIds.includes(departmentId)
      ? formData.departmentIds.filter(id => id !== departmentId)
      : [...formData.departmentIds, departmentId];
    setFormData({ ...formData, departmentIds: newSelection });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'LOW': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Send className="w-4 h-4" />;
      case 'NOTIFICATION': return <Bell className="w-4 h-4" />;
      case 'GROUP': return <UsersIcon className="w-4 h-4" />;
      case 'DEPARTMENT': return <UsersIcon className="w-4 h-4" />;
      default: return <Send className="w-4 h-4" />;
    }
  };

  // Filtragem de notificações em tempo real
  const filteredNotifications = systemMessages.filter(msg => {
    if (notifFilter === 'unread' && msg.status !== 'UNREAD') return false;
    if (notifFilter === 'read' && msg.status === 'UNREAD') return false;
    if (notifSearch.trim()) {
      const q = notifSearch.toLowerCase();
      const matchTitle = msg.title?.toLowerCase().includes(q);
      const matchContent = msg.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

  // Filtragem de mensagens na caixa de entrada
  const filteredInboxMessages = messages.filter(msg => {
    if (inboxFilter === 'unread' && msg.readAt) return false;
    if (inboxSearch.trim()) {
      const q = inboxSearch.toLowerCase();
      const matchTitle = msg.title?.toLowerCase().includes(q);
      const matchContent = msg.content?.toLowerCase().includes(q);
      const matchSender = msg.sender?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchSender) return false;
    }
    return true;
  });

  // Função para navegar entre as páginas
  const navigateToPage = (page: string) => {
    navigate(`/gestao-mensagens/${page}`);
  };

  return (
    <MainLayout title="Gestão de Mensagens" subtitle="Gerencie mensagens internas, notificações e comunicações">
      <div className="space-y-6">
        {/* Barra de Ações Rápidas (sem duplicar o título do MainLayout) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Central de Mensageria & Notificações</p>
              <p className="text-xs text-muted-foreground">Envio de comunicados, alertas de sistema e gestão de grupos</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadData();
                reloadNotifications();
              }}
              disabled={loading || notifLoading}
              className="text-xs border-slate-700 hover:bg-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading || notifLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            {currentPage !== 'enviar' && (
              <Button
                size="sm"
                onClick={() => navigateToPage('enviar')}
                className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Nova Mensagem
              </Button>
            )}
          </div>
        </div>

        {/* Navegação entre abas */}
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          <Button
            variant={currentPage === 'inbox' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('inbox')}
            className={`flex items-center gap-2 text-xs sm:text-sm ${currentPage === 'inbox' ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
          >
            <Inbox className="w-4 h-4" />
            Caixa de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] font-bold">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={currentPage === 'enviar' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('enviar')}
            className={`flex items-center gap-2 text-xs sm:text-sm ${currentPage === 'enviar' ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
          >
            <Send className="w-4 h-4" />
            Enviar Mensagens
          </Button>
          <Button
            variant={currentPage === 'notificacoes' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('notificacoes')}
            className={`flex items-center gap-2 text-xs sm:text-sm ${currentPage === 'notificacoes' ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
          >
            <Bell className="w-4 h-4" />
            Notificações
            {notifUnreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px] font-bold animate-pulse">
                {notifUnreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={currentPage === 'grupos' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('grupos')}
            className={`flex items-center gap-2 text-xs sm:text-sm ${currentPage === 'grupos' ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
          >
            <UsersIcon className="w-4 h-4" />
            Grupos de Mensagens
          </Button>
        </div>

        {/* Componentes das páginas */}
        {/* Página de Caixa de Entrada (Mensagens Recebidas) */}
        {currentPage === 'inbox' && (
          <div className="space-y-4">
            {/* Header de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total de Mensagens</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{messages.length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Inbox className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Não Lidas</p>
                    <p className={`text-2xl font-bold mt-0.5 ${unreadCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                      {unreadCount}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${unreadCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Lidas</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                      {Math.max(0, messages.length - unreadCount)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Barra de Busca e Filtros */}
            <Card className="bg-slate-900/80 border-slate-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar por assunto, remetente..."
                        value={inboxSearch}
                        onChange={(e) => setInboxSearch(e.target.value)}
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-background/50">
                      <Button
                        size="sm"
                        variant={inboxFilter === 'all' ? 'default' : 'ghost'}
                        onClick={() => setInboxFilter('all')}
                        className="h-7 text-xs px-2.5"
                      >
                        Todas
                      </Button>
                      <Button
                        size="sm"
                        variant={inboxFilter === 'unread' ? 'default' : 'ghost'}
                        onClick={() => setInboxFilter('unread')}
                        className="h-7 text-xs px-2.5"
                      >
                        Não Lidas ({unreadCount})
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      size="sm"
                      onClick={() => navigateToPage('enviar')}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium h-9 text-xs"
                    >
                      <Plus className="w-4 h-4 mr-1.5" />
                      Nova Mensagem
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadData()}
                      disabled={loading}
                      className="h-9 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Mensagens Recebidas */}
            <div className="space-y-2">
              {filteredInboxMessages.length === 0 ? (
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3">
                      <Inbox className="w-7 h-7 text-slate-500" />
                    </div>
                    <p className="text-base font-semibold text-slate-200">
                      {messages.length === 0 ? "Nenhuma mensagem na caixa de entrada" : "Nenhuma mensagem encontrada no filtro"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {messages.length === 0
                        ? "Quando outros usuários enviarem comunicados ou mensagens diretas, elas aparecerão aqui."
                        : "Tente alterar o filtro ou limpar o campo de busca."}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigateToPage('enviar')}
                      className="mt-4 text-xs bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Enviar uma Mensagem
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredInboxMessages.map((msg) => {
                  const isUnread = !msg.readAt;
                  return (
                    <Card
                      key={msg.id}
                      className={`transition-all duration-200 border cursor-pointer hover:border-slate-700 ${
                        isUnread
                          ? 'bg-slate-900/90 border-blue-500/30 shadow-md shadow-blue-950/20'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-90 hover:opacity-100'
                      }`}
                      onClick={() => {
                        setSelectedMessage(msg);
                        setShowViewModal(true);
                        if (isUnread) handleMarkAsRead(msg.id);
                      }}
                    >
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                            isUnread ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className={`text-sm font-semibold truncate ${isUnread ? 'text-white font-bold' : 'text-slate-300'}`}>
                                {msg.title}
                              </h4>
                              {isUnread && (
                                <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40 text-[10px] font-bold px-1.5 py-0">
                                  NÃO LIDA
                                </Badge>
                              )}
                              <Badge className={getPriorityColor(msg.priority)}>
                                {msg.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                                {msg.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {msg.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                              <span>Remetente: <strong className="text-slate-400">{msg.sender?.name || 'Sistema'}</strong></span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-center" onClick={(e) => e.stopPropagation()}>
                          {isUnread && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(msg.id)}
                              className="h-8 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                              title="Marcar como lida"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Marcar Lida
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMessage(msg);
                              setShowViewModal(true);
                            }}
                            className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Abrir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Página de Enviar Mensagem */}
        {currentPage === 'enviar' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enviar Nova Mensagem</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="Digite o título da mensagem"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">Conteúdo *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      placeholder="Digite o conteúdo da mensagem"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Tipo</Label>
                      <Select value={formData.type} onValueChange={(value: 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL') => {
                        setFormData({...formData, type: value, recipientIds: [], groupIds: [], departmentIds: []});
                        setSelectedUserIds([]);
                        setSelectedGroupIds([]);
                        setSelectedDepartmentIds([]);
                      }}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                          <SelectItem value="GROUP">Grupo</SelectItem>
                          <SelectItem value="DEPARTMENT">Departamento</SelectItem>
                          <SelectItem value="GLOBAL">Global</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(value: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') => setFormData({...formData, priority: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Baixa</SelectItem>
                          <SelectItem value="NORMAL">Normal</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                          <SelectItem value="URGENT">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Seleção de destinatários baseado no tipo */}
                  {formData.type === 'INDIVIDUAL' && (
                    <div>
                      <Label>Selecionar Usuários *</Label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Buscar usuários..."
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredUsers.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário encontrado</p>
                        ) : (
                          filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                                formData.recipientIds.includes(user.id) ? 'bg-accent' : ''
                              }`}
                              onClick={() => toggleUserSelection(user.id)}
                            >
                              <div>
                                <p className="text-sm font-medium">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                              <Checkbox
                                checked={formData.recipientIds.includes(user.id)}
                                onCheckedChange={() => toggleUserSelection(user.id)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                      {formData.recipientIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.recipientIds.map((userId) => {
                            const user = users.find(u => u.id === userId);
                            return user ? (
                              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                {user.name}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => toggleUserSelection(userId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.type === 'GROUP' && (
                    <div>
                      <Label>Selecionar Grupos *</Label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Buscar grupos..."
                          value={groupSearchTerm}
                          onChange={(e) => setGroupSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredGroups.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum grupo encontrado</p>
                        ) : (
                          filteredGroups.map((group) => (
                            <div
                              key={group.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                                formData.groupIds.includes(group.id) ? 'bg-accent' : ''
                              }`}
                              onClick={() => toggleGroupSelection(group.id)}
                            >
                              <div>
                                <p className="text-sm font-medium">{group.displayName}</p>
                                {group.description && (
                                  <p className="text-xs text-muted-foreground">{group.description}</p>
                                )}
                              </div>
                              <Checkbox
                                checked={formData.groupIds.includes(group.id)}
                                onCheckedChange={() => toggleGroupSelection(group.id)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                      {formData.groupIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.groupIds.map((groupId) => {
                            const group = groups.find(g => g.id === groupId);
                            return group ? (
                              <Badge key={groupId} variant="secondary" className="flex items-center gap-1">
                                {group.displayName}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => toggleGroupSelection(groupId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.type === 'DEPARTMENT' && (
                    <div>
                      <Label>Selecionar Departamentos *</Label>
                      <div className="relative mt-2">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Buscar departamentos..."
                          value={departmentSearchTerm}
                          onChange={(e) => setDepartmentSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                        {filteredDepartments.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">Nenhum departamento encontrado</p>
                        ) : (
                          filteredDepartments.map((dept) => (
                            <div
                              key={dept.id}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-accent ${
                                formData.departmentIds.includes(dept.id) ? 'bg-accent' : ''
                              }`}
                              onClick={() => toggleDepartmentSelection(dept.id)}
                            >
                              <div>
                                <p className="text-sm font-medium">{dept.name}</p>
                                {dept.description && (
                                  <p className="text-xs text-muted-foreground">{dept.description}</p>
                                )}
                              </div>
                              <Checkbox
                                checked={formData.departmentIds.includes(dept.id)}
                                onCheckedChange={() => toggleDepartmentSelection(dept.id)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                      {formData.departmentIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {formData.departmentIds.map((deptId) => {
                            const dept = departments.find(d => d.id === deptId);
                            return dept ? (
                              <Badge key={deptId} variant="secondary" className="flex items-center gap-1">
                                {dept.name}
                                <X
                                  className="w-3 h-3 cursor-pointer"
                                  onClick={() => toggleDepartmentSelection(deptId)}
                                />
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {formData.type === 'GLOBAL' && (
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Mensagem global será enviada para todos os usuários do sistema.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onCheckedChange={(checked) => setFormData({...formData, sendEmail: checked as boolean})}
                    />
                    <Label htmlFor="sendEmail">Enviar por email</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendNotification"
                      checked={formData.sendNotification}
                      onCheckedChange={(checked) => setFormData({...formData, sendNotification: checked as boolean})}
                    />
                    <Label htmlFor="sendNotification">Enviar notificação</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => navigateToPage('inbox')}>
                      Cancelar
                    </Button>
                    <Button onClick={() => handleSendMessage()}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Grupos */}
        {currentPage === 'grupos' && (
          <MessageGroupsManagement />
        )}

        {/* Página de Notificações */}
        {currentPage === 'notificacoes' && (
          <div className="space-y-4">
            {/* Header de Estatísticas e Ações */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total de Notificações</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{systemMessages.length}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Bell className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Não Lidas</p>
                    <p className={`text-2xl font-bold mt-0.5 ${notifUnreadCount > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                      {notifUnreadCount}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${notifUnreadCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Lidas / Arquivadas</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-0.5">
                      {Math.max(0, systemMessages.length - notifUnreadCount)}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Barra de Filtro e Ações */}
            <Card className="bg-slate-900/80 border-slate-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Buscar nas notificações..."
                        value={notifSearch}
                        onChange={(e) => setNotifSearch(e.target.value)}
                        className="pl-8 h-9 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-background/50">
                      <Button
                        size="sm"
                        variant={notifFilter === 'all' ? 'default' : 'ghost'}
                        onClick={() => setNotifFilter('all')}
                        className="h-7 text-xs px-2.5"
                      >
                        Todas
                      </Button>
                      <Button
                        size="sm"
                        variant={notifFilter === 'unread' ? 'default' : 'ghost'}
                        onClick={() => setNotifFilter('unread')}
                        className="h-7 text-xs px-2.5"
                      >
                        Não Lidas ({notifUnreadCount})
                      </Button>
                      <Button
                        size="sm"
                        variant={notifFilter === 'read' ? 'default' : 'ghost'}
                        onClick={() => setNotifFilter('read')}
                        className="h-7 text-xs px-2.5"
                      >
                        Lidas
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {notifUnreadCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAllNotifsAsRead()}
                        className="h-9 text-xs border-slate-700 hover:bg-slate-800 text-slate-200"
                      >
                        <CheckCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Marcar todas como lidas
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => reloadNotifications()}
                      disabled={notifLoading}
                      className="h-9 text-xs text-muted-foreground hover:text-white"
                      title="Sincronizar notificações"
                    >
                      <RefreshCw className={`w-4 h-4 ${notifLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Notificações */}
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <Card className="bg-slate-900/60 border-slate-800">
                  <CardContent className="py-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-7 h-7 text-slate-500" />
                    </div>
                    <p className="text-base font-semibold text-slate-200">
                      {systemMessages.length === 0 ? "Nenhuma notificação no momento" : "Nenhuma notificação encontrada no filtro"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {systemMessages.length === 0
                        ? "Você receberá avisos operacionais, alertas de manutenções e mensagens internas aqui."
                        : "Tente alterar o filtro ou limpar o campo de busca."}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setNotifFilter('all'); setNotifSearch(''); reloadNotifications(); }}
                      className="mt-4 text-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Atualizar Notificações
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredNotifications.map((notif) => {
                  const isUnread = notif.status === 'UNREAD';
                  const priorityCfg = getNotifPriorityConfig(notif.priority);
                  return (
                    <Card
                      key={notif.id}
                      className={`transition-all duration-200 border ${
                        isUnread
                          ? 'bg-slate-900/90 border-red-500/30 shadow-md shadow-red-950/20'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <CardContent className="p-4 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            notif.priority === 'URGENT'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : notif.priority === 'HIGH'
                              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                              : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className={`text-sm font-semibold truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>
                                {notif.title}
                              </h4>
                              {isUnread && (
                                <Badge className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold px-1.5 py-0">
                                  NOVA
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-[10px] uppercase font-bold ${priorityCfg.bg} ${priorityCfg.color}`}>
                                {priorityCfg.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                              {notif.content}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatNotifDate(notif.createdAt)}
                              </span>
                              {notif.sender && (
                                <span>Por: <strong className="text-slate-400">{notif.sender.name}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-center">
                          {isUnread && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markNotifAsRead(notif.id)}
                              className="h-8 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                              title="Marcar como lida"
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              Lida
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedMessage(notif as any);
                              setShowViewModal(true);
                            }}
                            className="h-8 text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Ver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}



        {/* Modal de Visualização */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Visualizar Mensagem</DialogTitle>
            </DialogHeader>
            {selectedMessage && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-lg font-semibold">{selectedMessage.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Conteúdo</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tipo</Label>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedMessage.type)}
                      <span>{selectedMessage.type}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Prioridade</Label>
                    <Badge className={getPriorityColor(selectedMessage.priority)}>
                      {selectedMessage.priority}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Remetente</Label>
                  <p>{selectedMessage.sender.name} ({selectedMessage.sender.email})</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Data de Envio</Label>
                  <p>{format(new Date(selectedMessage.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>

                {selectedMessage.sentAt && (
                  <div>
                    <Label className="text-sm font-medium">Data de Envio Real</Label>
                    <p>{format(new Date(selectedMessage.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                )}

                {selectedMessage.readAt && (
                  <div>
                    <Label className="text-sm font-medium">Data de Leitura</Label>
                    <p>{format(new Date(selectedMessage.readAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowViewModal(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default GestaoMensagens;