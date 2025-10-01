import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Bot,
  User,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Search,
  Filter,
  Eye,
  UserCheck,
  Building2,
  Calendar,
  Star,
  Archive,
  Trash2,
  Download,
  FileText,
  Headphones,
  Users,
  Activity,
  TrendingUp,
  MessageCircle,
  PhoneCall,
  Video,
  Settings,
  Bell,
  RefreshCw,
  ExternalLink,
  Copy,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatbotConversation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startedAt: string;
  lastMessageAt: string;
  status: 'active' | 'waiting' | 'transferred' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department: string;
  assignedAgent?: string;
  messages: ChatMessage[];
  customerInfo: {
    company?: string;
    location?: string;
    previousInteractions: number;
    customerType: 'new' | 'existing' | 'vip';
  };
  tags: string[];
  satisfaction?: number;
  resolution?: string;
  estimatedWaitTime?: number;
}

interface ChatMessage {
  id: string;
  type: 'bot' | 'customer' | 'agent';
  content: string;
  timestamp: string;
  sender: string;
  isRead: boolean;
  attachments?: string[];
  quickReplies?: string[];
}

interface AgentPerformance {
  agentId: string;
  agentName: string;
  activeChats: number;
  totalChats: number;
  avgResponseTime: number;
  satisfactionRating: number;
  status: 'online' | 'busy' | 'away' | 'offline';
}

const ChatbotServiceIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('conversations');
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [newMessage, setNewMessage] = useState('');
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferDepartment, setTransferDepartment] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  // Departamentos disponíveis
  const departments = [
    { id: 'comercial', name: 'Comercial', color: 'bg-blue-500' },
    { id: 'suporte', name: 'Suporte Técnico', color: 'bg-green-500' },
    { id: 'financeiro', name: 'Financeiro', color: 'bg-yellow-500' },
    { id: 'operacional', name: 'Operacional', color: 'bg-purple-500' }
  ];

  // Dados mockados para demonstração
  useEffect(() => {
    const mockConversations: ChatbotConversation[] = [
      {
        id: 'conv-001',
        customerName: 'João Silva',
        customerEmail: 'joao.silva@empresa.com',
        customerPhone: '(11) 99999-9999',
        startedAt: '2024-01-15T10:30:00Z',
        lastMessageAt: '2024-01-15T10:45:00Z',
        status: 'waiting',
        priority: 'high',
        department: 'comercial',
        customerInfo: {
          company: 'Empresa ABC Ltda',
          location: 'São Paulo, SP',
          previousInteractions: 3,
          customerType: 'existing'
        },
        tags: ['orçamento', 'vigilância'],
        estimatedWaitTime: 5,
        messages: [
          {
            id: 'msg-001',
            type: 'bot',
            content: 'Olá! Bem-vindo à Promover Vigilância. Como posso ajudá-lo hoje?',
            timestamp: '2024-01-15T10:30:00Z',
            sender: 'Chatbot',
            isRead: true
          },
          {
            id: 'msg-002',
            type: 'customer',
            content: 'Olá, gostaria de solicitar um orçamento para serviços de vigilância patrimonial.',
            timestamp: '2024-01-15T10:31:00Z',
            sender: 'João Silva',
            isRead: true
          },
          {
            id: 'msg-003',
            type: 'bot',
            content: 'Perfeito! Vou conectá-lo com nossa equipe comercial para um atendimento personalizado.',
            timestamp: '2024-01-15T10:32:00Z',
            sender: 'Chatbot',
            isRead: true
          }
        ]
      },
      {
        id: 'conv-002',
        customerName: 'Maria Santos',
        customerEmail: 'maria.santos@gmail.com',
        customerPhone: '(11) 88888-8888',
        startedAt: '2024-01-15T11:00:00Z',
        lastMessageAt: '2024-01-15T11:15:00Z',
        status: 'active',
        priority: 'medium',
        department: 'suporte',
        assignedAgent: 'Carlos Atendente',
        customerInfo: {
          location: 'Rio de Janeiro, RJ',
          previousInteractions: 1,
          customerType: 'new'
        },
        tags: ['dúvida', 'serviços'],
        messages: [
          {
            id: 'msg-004',
            type: 'bot',
            content: 'Olá! Como posso ajudá-la hoje?',
            timestamp: '2024-01-15T11:00:00Z',
            sender: 'Chatbot',
            isRead: true
          },
          {
            id: 'msg-005',
            type: 'customer',
            content: 'Tenho dúvidas sobre os tipos de serviços oferecidos.',
            timestamp: '2024-01-15T11:01:00Z',
            sender: 'Maria Santos',
            isRead: true
          },
          {
            id: 'msg-006',
            type: 'agent',
            content: 'Olá Maria! Sou Carlos da equipe de suporte. Posso esclarecer suas dúvidas sobre nossos serviços.',
            timestamp: '2024-01-15T11:15:00Z',
            sender: 'Carlos Atendente',
            isRead: false
          }
        ]
      }
    ];

    const mockAgentPerformance: AgentPerformance[] = [
      {
        agentId: 'agent-001',
        agentName: 'Carlos Atendente',
        activeChats: 3,
        totalChats: 15,
        avgResponseTime: 45,
        satisfactionRating: 4.8,
        status: 'online'
      },
      {
        agentId: 'agent-002',
        agentName: 'Ana Suporte',
        activeChats: 2,
        totalChats: 12,
        avgResponseTime: 38,
        satisfactionRating: 4.9,
        status: 'busy'
      },
      {
        agentId: 'agent-003',
        agentName: 'Pedro Comercial',
        activeChats: 1,
        totalChats: 8,
        avgResponseTime: 52,
        satisfactionRating: 4.7,
        status: 'online'
      }
    ];

    setConversations(mockConversations);
    setAgentPerformance(mockAgentPerformance);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'waiting': return 'bg-yellow-500';
      case 'transferred': return 'bg-blue-500';
      case 'escalated': return 'bg-orange-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'agent',
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: 'Agente Atual',
      isRead: false
    };

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id
        ? {
            ...conv,
            messages: [...conv.messages, message],
            lastMessageAt: new Date().toISOString(),
            status: 'active'
          }
        : conv
    ));

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message],
      lastMessageAt: new Date().toISOString(),
      status: 'active'
    } : null);

    setNewMessage('');

    toast({
      title: "Mensagem Enviada",
      description: "Sua mensagem foi enviada para o cliente.",
      variant: "default"
    });
  };

  const handleTransferConversation = () => {
    if (!selectedConversation || !transferDepartment) return;

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id
        ? {
            ...conv,
            status: 'transferred',
            department: transferDepartment,
            assignedAgent: undefined
          }
        : conv
    ));

    setShowTransferModal(false);
    setTransferDepartment('');

    toast({
      title: "Conversa Transferida",
      description: "Conversa transferida para o departamento " + (departments.find(d => d.id === transferDepartment)?.name || '') + ".",
      variant: "default"
    });
  };

  const handleCloseConversation = () => {
    if (!selectedConversation) return;

    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id
        ? { ...conv, status: 'closed' }
        : conv
    ));

    setSelectedConversation(null);

    toast({
      title: "Conversa Encerrada",
      description: "A conversa foi encerrada com sucesso.",
      variant: "default"
    });
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || conv.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeConversations = conversations.filter(conv => conv.status === 'active').length;
  const waitingConversations = conversations.filter(conv => conv.status === 'waiting').length;
  const totalConversations = conversations.length;
  const avgResponseTime = 42; // Simulado

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Conversas Ativas</p>
                <p className="text-2xl font-bold">{activeConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Na Fila</p>
                <p className="text-2xl font-bold">{waitingConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Hoje</p>
                <p className="text-2xl font-bold">{totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Tempo Médio</p>
                <p className="text-2xl font-bold">{avgResponseTime}s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="agents">Agentes</TabsTrigger>
          <TabsTrigger value="analytics">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="waiting">Aguardando</SelectItem>
                <SelectItem value="transferred">Transferido</SelectItem>
                <SelectItem value="closed">Encerrado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de conversas */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5" />
                    <span>Conversas</span>
                    {waitingConversations > 0 && (
                      <Badge variant="destructive">{waitingConversations}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={"p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors " + 
                          (selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : '')
                        }
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold text-sm">{conversation.customerName}</span>
                              <div className={"w-2 h-2 rounded-full " + getStatusColor(conversation.status)} />
                              <div className={"w-2 h-2 rounded-full " + getPriorityColor(conversation.priority)} />
                            </div>
                            <p className="text-xs text-gray-600">{conversation.customerEmail}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(conversation.lastMessageAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {conversation.status === 'waiting' && conversation.estimatedWaitTime && (
                            <Badge variant="outline" className="text-xs">
                              {conversation.estimatedWaitTime}min
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Building2 className="h-3 w-3" />
                          <span>{departments.find(d => d.id === conversation.department)?.name}</span>
                          {conversation.assignedAgent && (
                            <>
                              <UserCheck className="h-3 w-3" />
                              <span>{conversation.assignedAgent}</span>
                            </>
                          )}
                        </div>
                        
                        {conversation.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conversation.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat ativo */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="h-full">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <div>
                            <p className="font-semibold">{selectedConversation.customerName}</p>
                            <p className="text-sm text-gray-600">{selectedConversation.customerEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={"w-3 h-3 rounded-full " + getStatusColor(selectedConversation.status)} />
                          <span className="text-sm capitalize">{selectedConversation.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4 mr-2" />
                              Transferir
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Transferir Conversa</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Departamento</Label>
                                <Select value={transferDepartment} onValueChange={setTransferDepartment}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o departamento" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {departments.map(dept => (
                                      <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                                  Cancelar
                                </Button>
                                <Button onClick={handleTransferConversation}>
                                  Transferir
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button variant="outline" size="sm" onClick={handleCloseConversation}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Encerrar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {/* Mensagens */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4">
                      {selectedConversation.messages.map((message) => (
                        <div
                          key={message.id}
                          className={"flex " + 
                            (message.type === 'customer' ? 'justify-start' : 'justify-end')
                          }
                        >
                          <div
                            className={"max-w-xs lg:max-w-md px-4 py-2 rounded-lg " + 
                               (message.type === 'customer'
                                 ? 'bg-gray-100 text-gray-900'
                                 : message.type === 'bot'
                                 ? 'bg-blue-100 text-blue-900'
                                 : 'bg-blue-600 text-white')
                             }
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              {message.type === 'bot' && <Bot className="h-4 w-4" />}
                              {message.type === 'customer' && <User className="h-4 w-4" />}
                              {message.type === 'agent' && <Headphones className="h-4 w-4" />}
                              <span className="text-xs font-medium">{message.sender}</span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    {/* Input de mensagem */}
                    {selectedConversation.status === 'active' && (
                      <div className="border-t p-4">
                        <div className="flex space-x-2">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                          />
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Selecione uma conversa para começar</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Performance dos Agentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div key={agent.agentId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={"w-3 h-3 rounded-full " + getAgentStatusColor(agent.status)} />
                      <div>
                        <p className="font-semibold">{agent.agentName}</p>
                        <p className="text-sm text-gray-600 capitalize">{agent.status}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-500">Chats Ativos</p>
                        <p className="font-bold">{agent.activeChats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Hoje</p>
                        <p className="font-bold">{agent.totalChats}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tempo Médio</p>
                        <p className="font-bold">{agent.avgResponseTime}s</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Satisfação</p>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-bold">{agent.satisfactionRating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversas por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {departments.map((dept) => {
                    const deptConversations = conversations.filter(conv => conv.department === dept.id).length;
                    const percentage = totalConversations > 0 ? (deptConversations / totalConversations) * 100 : 0;
                    
                    return (
                      <div key={dept.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={"w-3 h-3 rounded-full " + dept.color} />
                          <span className="text-sm">{dept.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={"h-2 rounded-full " + dept.color}
                              style={{ width: percentage + '%' }}
                            />
                          </div>
                          <span className="text-sm font-medium">{deptConversations}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Taxa de Resolução</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tempo Médio de Resposta</span>
                    <span className="font-bold">{avgResponseTime}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Satisfação do Cliente</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold">4.8</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Conversas Transferidas</span>
                    <span className="font-bold">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotServiceIntegration;