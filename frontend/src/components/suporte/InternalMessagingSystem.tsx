import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Send,
  Inbox,
  Users,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  Search,
  Filter,
  Plus,
  Eye,
  Reply,
  Forward,
  Archive,
  Trash2,
  Bell,
  Settings,
  UserCheck,
  MessageSquare,
  Calendar,
  Paperclip,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  email: string;
  color: string;
  icon: React.ComponentType<any>;
  members: string[];
}

interface InternalMessage {
  id: string;
  subject: string;
  content: string;
  fromDepartment: string;
  toDepartment: string;
  fromUser: string;
  toUsers: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'sent' | 'delivered' | 'read' | 'replied';
  createdAt: string;
  readAt?: string;
  repliedAt?: string;
  attachments?: string[];
  isEmailSent: boolean;
  emailDeliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  tags: string[];
  thread?: InternalMessage[];
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  urgentOnly: boolean;
  departmentFilter: string[];
}

const InternalMessagingSystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState<InternalMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<InternalMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    urgentOnly: false,
    departmentFilter: []
  });

  const { toast } = useToast();

  // Departamentos disponíveis
  const departments: Department[] = [
    {
      id: 'rh',
      name: 'Recursos Humanos',
      email: 'rh@promovervigilancia.com.br',
      color: 'bg-seguranca-darkred',
      icon: Users,
      members: ['Ana Silva', 'Carlos Santos', 'Maria Oliveira']
    },
    {
      id: 'financeiro',
      name: 'Financeiro',
      email: 'financeiro@promovervigilancia.com.br',
      color: 'bg-seguranca-yellow',
      icon: Building2,
      members: ['João Costa', 'Pedro Almeida', 'Lucia Ferreira']
    },
    {
      id: 'operacional',
      name: 'Operacional',
      email: 'operacional@promovervigilancia.com.br',
      color: 'bg-seguranca-red',
      icon: UserCheck,
      members: ['Roberto Lima', 'Sandra Rocha', 'Miguel Torres']
    },
    {
      id: 'comercial',
      name: 'Comercial',
      email: 'comercial@promovervigilancia.com.br',
      color: 'bg-seguranca-graphite',
      icon: MessageSquare,
      members: ['Fernanda Dias', 'Ricardo Moura', 'Camila Souza']
    },
    {
      id: 'ti',
      name: 'Tecnologia da Informação',
      email: 'ti@promovervigilancia.com.br',
      color: 'bg-seguranca-darkred',
      icon: Settings,
      members: ['Bruno Tech', 'Julia Dev', 'André Sys']
    }
  ];

  // Formulário de nova mensagem
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    toDepartment: '',
    toUsers: [] as string[],
    priority: 'medium' as const,
    tags: [] as string[],
    attachments: [] as string[]
  });

  // Dados mockados para demonstração
  useEffect(() => {
    const mockMessages: InternalMessage[] = [
      {
        id: 'msg-001',
        subject: 'Atualização de Políticas de RH',
        content: 'Informamos sobre as novas políticas de recursos humanos que entrarão em vigor no próximo mês. Por favor, revisar o documento anexo.',
        fromDepartment: 'rh',
        toDepartment: 'all',
        fromUser: 'Ana Silva',
        toUsers: ['all'],
        priority: 'high',
        status: 'delivered',
        createdAt: '2024-01-15T10:30:00Z',
        isEmailSent: true,
        emailDeliveryStatus: 'delivered',
        tags: ['política', 'rh', 'importante'],
        attachments: ['politicas_rh_2024.pdf']
      },
      {
        id: 'msg-002',
        subject: 'Relatório Financeiro Mensal',
        content: 'Segue o relatório financeiro do mês de janeiro. Favor analisar os números e enviar feedback até sexta-feira.',
        fromDepartment: 'financeiro',
        toDepartment: 'operacional',
        fromUser: 'João Costa',
        toUsers: ['Roberto Lima', 'Sandra Rocha'],
        priority: 'medium',
        status: 'read',
        createdAt: '2024-01-14T14:20:00Z',
        readAt: '2024-01-14T15:30:00Z',
        isEmailSent: true,
        emailDeliveryStatus: 'delivered',
        tags: ['relatório', 'financeiro', 'mensal']
      },
      {
        id: 'msg-003',
        subject: 'URGENTE: Problema no Sistema',
        content: 'Identificamos um problema crítico no sistema que está afetando as operações. Equipe de TI já foi acionada.',
        fromDepartment: 'ti',
        toDepartment: 'all',
        fromUser: 'Bruno Tech',
        toUsers: ['all'],
        priority: 'urgent',
        status: 'delivered',
        createdAt: '2024-01-15T16:45:00Z',
        isEmailSent: true,
        emailDeliveryStatus: 'delivered',
        tags: ['urgente', 'sistema', 'ti']
      }
    ];
    setMessages(mockMessages);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-seguranca-red';
      case 'high': return 'bg-seguranca-darkred';
      case 'medium': return 'bg-seguranca-yellow';
      case 'low': return 'bg-seguranca-graphite';
      default: return 'bg-seguranca-lightgray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Clock className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'read': return <Eye className="h-4 w-4" />;
      case 'replied': return <Reply className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getDepartmentInfo = (departmentId: string) => {
    return departments.find(dept => dept.id === departmentId) || {
      id: 'unknown',
      name: 'Desconhecido',
      email: '',
      color: 'bg-seguranca-lightgray',
      icon: Building2,
      members: []
    };
  };

  const handleSendMessage = async () => {
    try {
      const messageData: InternalMessage = {
        id: `msg-${Date.now()}`,
        subject: newMessage.subject,
        content: newMessage.content,
        fromDepartment: 'ti', // Usuário atual
        toDepartment: newMessage.toDepartment,
        fromUser: 'Usuário Atual',
        toUsers: newMessage.toUsers,
        priority: newMessage.priority,
        status: 'sent',
        createdAt: new Date().toISOString(),
        isEmailSent: false,
        emailDeliveryStatus: 'pending',
        tags: newMessage.tags,
        attachments: newMessage.attachments
      };

      // Simular envio de email
      setTimeout(() => {
        messageData.isEmailSent = true;
        messageData.emailDeliveryStatus = 'sent';
        messageData.status = 'delivered';
        setMessages(prev => [messageData, ...prev]);
        
        toast({
          title: "Mensagem Enviada",
          description: "Mensagem enviada com sucesso e email disparado para o departamento.",
          variant: "default"
        });
      }, 1000);

      setMessages(prev => [messageData, ...prev]);
      setShowComposeModal(false);
      setNewMessage({
        subject: '',
        content: '',
        toDepartment: '',
        toUsers: [],
        priority: 'medium',
        tags: [],
        attachments: []
      });

      toast({
        title: "Enviando Mensagem",
        description: "Mensagem está sendo processada e email será enviado.",
        variant: "default"
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'read', readAt: new Date().toISOString() }
        : msg
    ));
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || 
                             message.fromDepartment === filterDepartment ||
                             message.toDepartment === filterDepartment;
    const matchesPriority = filterPriority === 'all' || message.priority === filterPriority;
    
    return matchesSearch && matchesDepartment && matchesPriority;
  });

  const unreadCount = messages.filter(msg => msg.status !== 'read').length;
  const urgentCount = messages.filter(msg => msg.priority === 'urgent').length;

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Inbox className="h-5 w-5 text-seguranca-yellow" />
              <div>
                <p className="text-sm font-medium">Total de Mensagens</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-seguranca-yellow" />
              <div>
                <p className="text-sm font-medium">Não Lidas</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-seguranca-red" />
              <div>
                <p className="text-sm font-medium">Urgentes</p>
                <p className="text-2xl font-bold">{urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-seguranca-yellow" />
              <div>
                <p className="text-sm font-medium">Departamentos</p>
                <p className="text-2xl font-bold">{departments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-seguranca-lightgray h-4 w-4" />
            <Input
              placeholder="Buscar mensagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filtrar por departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Departamentos</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept.id} value={dept.id}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                    <span>{dept.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurações de Notificação</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Notificações por Email</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      emailNotifications: e.target.checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notificações Push</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      pushNotifications: e.target.checked
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Apenas Urgentes</Label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.urgentOnly}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev,
                      urgentOnly: e.target.checked
                    }))}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
            <DialogTrigger asChild>
              <Button className="bg-seguranca-darkred hover:bg-seguranca-red">
                <Plus className="h-4 w-4 mr-2" />
                Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nova Mensagem Interna</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Departamento Destinatário</Label>
                    <Select value={newMessage.toDepartment} onValueChange={(value) => 
                      setNewMessage(prev => ({ ...prev, toDepartment: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Departamentos</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            <div className="flex items-center space-x-2">
                              <dept.icon className="h-4 w-4" />
                              <span>{dept.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={newMessage.priority} onValueChange={(value: any) => 
                      setNewMessage(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Assunto</Label>
                  <Input
                    value={newMessage.subject}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Assunto da mensagem"
                  />
                </div>
                
                <div>
                  <Label>Mensagem</Label>
                  <Textarea
                    value={newMessage.content}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Digite sua mensagem..."
                    rows={6}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowComposeModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSendMessage} className="bg-seguranca-darkred hover:bg-seguranca-red">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Mensagem
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de mensagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Mensagens Internas</span>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-seguranca-lightgray">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const fromDept = getDepartmentInfo(message.fromDepartment);
                const toDept = getDepartmentInfo(message.toDepartment);
                
                return (
                  <div
                    key={message.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-seguranca-lightgray/10 ${
                      message.status === 'read' ? 'bg-seguranca-black' : 'bg-seguranca-graphite/20 border-seguranca-yellow'
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (message.status !== 'read') {
                        handleMarkAsRead(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(message.priority)}`} />
                          <span className="font-semibold">{message.subject}</span>
                          {message.status !== 'read' && (
                            <Badge variant="secondary" className="text-xs">Nova</Badge>
                          )}
                          {message.priority === 'urgent' && (
                            <Badge variant="destructive" className="text-xs">Urgente</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-seguranca-lightgray mb-2">
                          <div className="flex items-center space-x-1">
                            <fromDept.icon className="h-4 w-4" />
                            <span>De: {fromDept.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <toDept.icon className="h-4 w-4" />
                            <span>Para: {toDept.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(message.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        <p className="text-seguranca-lightgray text-sm line-clamp-2">{message.content}</p>
                        
                        {message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(message.status)}
                          <span className="text-xs text-seguranca-lightgray capitalize">{message.status}</span>
                        </div>
                        
                        {message.isEmailSent && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-seguranca-yellow">Email enviado</span>
                          </div>
                        )}
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <Paperclip className="h-3 w-3 text-seguranca-lightgray" />
                            <span className="text-xs text-seguranca-lightgray">{message.attachments.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de visualização de mensagem */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedMessage.priority)}`} />
                <span>{selectedMessage.subject}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-seguranca-lightgray">De:</Label>
                  <p className="font-medium">{getDepartmentInfo(selectedMessage.fromDepartment).name}</p>
                  <p className="text-seguranca-lightgray">{selectedMessage.fromUser}</p>
                </div>
                <div>
                  <Label className="text-seguranca-lightgray">Para:</Label>
                  <p className="font-medium">{getDepartmentInfo(selectedMessage.toDepartment).name}</p>
                </div>
                <div>
                  <Label className="text-seguranca-lightgray">Data:</Label>
                  <p>{new Date(selectedMessage.createdAt).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-seguranca-lightgray">Status:</Label>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(selectedMessage.status)}
                    <span className="capitalize">{selectedMessage.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>
              </div>
              
              {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-seguranca-lightgray mb-2 block">Anexos:</Label>
                  <div className="space-y-2">
                    {selectedMessage.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-seguranca-graphite/20 rounded">
                        <Paperclip className="h-4 w-4 text-seguranca-lightgray" />
                        <span className="flex-1">{attachment}</span>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline">
                  <Reply className="h-4 w-4 mr-2" />
                  Responder
                </Button>
                <Button variant="outline">
                  <Forward className="h-4 w-4 mr-2" />
                  Encaminhar
                </Button>
                <Button variant="outline">
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default InternalMessagingSystem;