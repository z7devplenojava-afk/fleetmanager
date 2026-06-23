import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  X, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  category: 'GENERAL' | 'PAYROLL' | 'VACATION' | 'TRAINING' | 'DOCUMENT' | 'TIME_RECORD';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  actionText?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

const Notifications: React.FC = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Dados mockados para funcionar offline
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Novo Holerite Disponível',
      message: 'Seu holerite de Dezembro/2024 já está disponível para consulta.',
      type: 'INFO',
      category: 'PAYROLL',
      isRead: false,
      createdAt: '2024-12-05T10:00:00Z',
      actionUrl: '/employee-portal/payslips',
      actionText: 'Ver Holerite'
    },
    {
      id: '2',
      title: 'Lembrete: Treinamento a Vencer',
      message: 'Seu treinamento "Segurança no Trabalho" vencerá em 30 dias. Renove sua certificação.',
      type: 'WARNING',
      category: 'TRAINING',
      isRead: false,
      createdAt: '2024-12-01T09:00:00Z',
      actionUrl: '/employee-portal/trainings',
      actionText: 'Ver Treinamento'
    },
    {
      id: '3',
      title: 'Solicitação de Férias Aprovada',
      message: 'Suas férias de 20/12/2024 a 31/12/2024 foram aprovadas pelo seu supervisor.',
      type: 'SUCCESS',
      category: 'VACATION',
      isRead: true,
      createdAt: '2024-11-20T14:30:00Z',
      readAt: '2024-11-20T15:00:00Z'
    },
    {
      id: '4',
      title: 'Documento Expirando',
      message: 'Seu documento "CTPS" vencerá em 60 dias. Por favor, atualize o documento.',
      type: 'WARNING',
      category: 'DOCUMENT',
      isRead: false,
      createdAt: '2024-11-15T11:00:00Z',
      actionUrl: '/employee-portal/documents',
      actionText: 'Ver Documentos'
    },
    {
      id: '5',
      title: 'Bater Ponto - Hoje',
      message: 'Não esqueça de bater o ponto de entrada hoje às 08:00.',
      type: 'INFO',
      category: 'TIME_RECORD',
      isRead: true,
      createdAt: '2024-11-10T07:00:00Z',
      readAt: '2024-11-10T08:30:00Z'
    },
    {
      id: '6',
      title: 'Erro no Registro de Ponto',
      message: 'Houve uma falha ao registrar seu ponto de saída ontem. Verifique seus registros.',
      type: 'ERROR',
      category: 'TIME_RECORD',
      isRead: true,
      createdAt: '2024-11-09T18:00:00Z',
      readAt: '2024-11-09T18:30:00Z',
      actionUrl: '/employee-portal/time-records',
      actionText: 'Ver Registros'
    },
    {
      id: '7',
      title: 'Bem-vindo ao Portal!',
      message: 'Seja bem-vindo ao novo Portal do Funcionário. Explore todas as funcionalidades disponíveis.',
      type: 'INFO',
      category: 'GENERAL',
      isRead: true,
      createdAt: '2024-11-01T08:00:00Z',
      readAt: '2024-11-01T08:15:00Z'
    }
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setNotifications(mockNotifications);
        setLoading(false);
      }, 500);
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Backend offline - exibindo dados mockados',
        variant: 'default',
      });
      setNotifications(mockNotifications);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setNotifications(notifications.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Notificação marcada como lida (Simulado - Backend offline)',
      });
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Ação simulada - Backend offline',
        variant: 'default',
      });
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      setNotifications(notifications.map(n => 
        n.id === notificationId 
          ? { ...n, isRead: false, readAt: undefined }
          : n
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Notificação marcada como não lida (Simulado - Backend offline)',
      });
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Ação simulada - Backend offline',
        variant: 'default',
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setNotifications(notifications.filter(n => n.id !== notificationId));
      
      toast({
        title: 'Sucesso',
        description: 'Notificação excluída (Simulado - Backend offline)',
      });
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Ação simulada - Backend offline',
        variant: 'default',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(notifications.map(n => ({
        ...n,
        isRead: true,
        readAt: new Date().toISOString()
      })));
      
      toast({
        title: 'Sucesso',
        description: 'Todas as notificações marcadas como lidas (Simulado - Backend offline)',
      });
    } catch (error) {
      toast({
        title: 'Informação',
        description: 'Ação simulada - Backend offline',
        variant: 'default',
      });
    }
  };

  const handleAction = (notification: Notification) => {
    if (notification.actionUrl) {
      toast({
        title: 'Informação',
        description: `Navegação simulada para: ${notification.actionUrl} (Backend offline)`,
        variant: 'default',
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
    const matchesRead = readFilter === 'all' || 
                        (readFilter === 'read' && notification.isRead) ||
                        (readFilter === 'unread' && !notification.isRead);
    return matchesSearch && matchesType && matchesCategory && matchesRead;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'SUCCESS':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'PAYROLL':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'VACATION':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'TRAINING':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'TIME_RECORD':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PAYROLL':
        return 'Holerites';
      case 'VACATION':
        return 'Férias';
      case 'TRAINING':
        return 'Treinamentos';
      case 'DOCUMENT':
        return 'Documentos';
      case 'TIME_RECORD':
        return 'Ponto';
      case 'GENERAL':
        return 'Geral';
      default:
        return category;
    }
  };

  const calculateStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const read = notifications.filter(n => n.isRead).length;
    
    return { total, unread, read };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificações</h1>
          <p className="text-muted-foreground">Gerencie suas notificações e mantenha-se atualizado</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="flex items-center space-x-2"
          >
            <Check className="h-4 w-4" />
            <span>Marcar Todas como Lidas</span>
          </Button>
        </div>
      </div>

      {/* Status do Sistema */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Status do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-700">
            🟡 <strong>Backend Offline:</strong> Funcionalidade simulada com dados mockados. Ações não serão processadas até que o backend esteja online.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Bell className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Todas as notificações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Não Lidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.unread}</div>
            <p className="text-xs text-muted-foreground">Aguardando leitura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lidas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.read}</div>
            <p className="text-xs text-muted-foreground">Já visualizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2 text-red-500" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="INFO">Informações</SelectItem>
                <SelectItem value="WARNING">Avisos</SelectItem>
                <SelectItem value="ERROR">Erros</SelectItem>
                <SelectItem value="SUCCESS">Sucessos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="GENERAL">Geral</SelectItem>
                <SelectItem value="PAYROLL">Holerites</SelectItem>
                <SelectItem value="VACATION">Férias</SelectItem>
                <SelectItem value="TRAINING">Treinamentos</SelectItem>
                <SelectItem value="DOCUMENT">Documentos</SelectItem>
                <SelectItem value="TIME_RECORD">Ponto</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Bell className="h-5 w-5 mr-2 text-red-500" />
            Minhas Notificações ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex justify-between items-start p-4 border rounded-lg hover:bg-accent ${
                  !notification.isRead ? 'bg-primary/10 border-primary/30' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="destructive" className="text-xs">Nova</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          {getCategoryIcon(notification.category)}
                          <span>{getCategoryLabel(notification.category)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(notification.createdAt).toLocaleDateString('pt-BR')} {new Date(notification.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        {notification.readAt && (
                          <span className="flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Lida em {new Date(notification.readAt).toLocaleDateString('pt-BR')}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {notification.actionUrl && (
                    <Button
                      size="sm"
                      onClick={() => handleAction(notification)}
                      className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      {notification.actionText || 'Ver'}
                    </Button>
                  )}
                  {!notification.isRead ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="flex items-center space-x-1"
                    >
                      <Check className="h-4 w-4" />
                      <span>Ler</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsUnread(notification.id)}
                      className="flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Não lida</span>
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="flex items-center space-x-1"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Excluir</span>
                  </Button>
                </div>
              </div>
            ))}
            {filteredNotifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>Nenhuma notificação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
