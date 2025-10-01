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
  Eye
} from 'lucide-react';
import { messageService } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';

import { UUID } from '@/types/employee';

interface User {
  id: UUID;
  name: string;
  email: string;
  department?: string;
}

interface Department {
  id: UUID;
  name: string;
  description: string;
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
  const currentPage = pathParts.length > 2 ? pathParts[2] : 'enviar';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GLOBAL' as 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL',
    priority: 'NORMAL' as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
    recipientIds: [] as string[],
    departmentIds: [] as string[],
    sendEmail: false,
    sendNotification: true,
    scheduledAt: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Redirecionar para enviar se estiver na rota raiz
  useEffect(() => {
    if (location.pathname === '/gestao-mensagens') {
      navigate('/gestao-mensagens/enviar', { replace: true });
    }
  }, [location.pathname, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar mensagens recebidas
      const messagesResponse = await fetch('/api/v1/messages/received?page=0&size=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.content || []);
      }

      // Carregar contagem de não lidas
      const unreadResponse = await fetch('/api/v1/messages/unread/count', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (unreadResponse.ok) {
        const count = await unreadResponse.json();
        setUnreadCount(count);
      }

      // Carregar usuários e departamentos (simulado por enquanto)
      setUsers([
        { id: '1', name: 'João Silva', email: 'joao@empresa.com', department: 'TI' },
        { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', department: 'RH' }
      ]);
      
      setDepartments([
        { id: '1', name: 'TI', description: 'Tecnologia da Informação' },
        { id: '2', name: 'RH', description: 'Recursos Humanos' }
      ]);

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
        description: "Selecione pelo menos um destinatário para mensagens individuais",
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
      const response = await fetch(`/api/v1/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, readAt: new Date().toISOString() } : msg
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
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
      departmentIds: [],
      sendEmail: false,
      sendNotification: true,
      scheduledAt: ''
    });
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

  // Função para navegar entre as páginas
  const navigateToPage = (page: string) => {
    navigate(`/gestao-mensagens/${page}`);
  };

  return (
    <MainLayout title="Gestão de Mensagens" subtitle="Gerencie mensagens internas, notificações e comunicações">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Mensagens</h1>
            <p className="text-muted-foreground">Gerencie mensagens internas, notificações e comunicações</p>
          </div>
          <Button onClick={() => navigateToPage('enviar')}>
            <Send className="w-4 h-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>

        {/* Navegação entre páginas */}
        <div className="flex space-x-2 border-b">
          <Button
            variant={currentPage === 'enviar' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('enviar')}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Enviar Mensagens
          </Button>
          <Button
            variant={currentPage === 'grupos' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('grupos')}
            className="flex items-center gap-2"
          >
            <UsersIcon className="w-4 h-4" />
            Grupos de Mensagens
          </Button>
          <Button
            variant={currentPage === 'notificacoes' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('notificacoes')}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Notificações
          </Button>
        </div>

        {/* Componentes das páginas */}
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
                      <Select value={formData.type} onValueChange={(value: 'INDIVIDUAL' | 'GROUP' | 'DEPARTMENT' | 'GLOBAL') => setFormData({...formData, type: value})}>
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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Grupos de Mensagens</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <UsersIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Funcionalidade em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá gerenciar grupos de mensagens</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Notificações */}
        {currentPage === 'notificacoes' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Funcionalidade em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá gerenciar notificações</p>
                </div>
              </CardContent>
            </Card>
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