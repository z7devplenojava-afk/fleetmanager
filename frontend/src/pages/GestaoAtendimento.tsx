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
import { 
  Phone, 
  Clock, 
  UserCog, 
  BarChart3, 
  Settings,
  Users,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'AWAY';
  department: string;
  lastActivity: string;
  totalTickets: number;
  resolvedTickets: number;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  assignedTo?: Agent;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface Metric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

const GestaoAtendimento: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determinar a página atual baseado na URL
  const pathParts = location.pathname.split('/');
  const currentPage = pathParts.length > 2 ? pathParts[2] : 'dashboard';
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  const { toast } = useToast();

  // Form state para novo ticket
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'NORMAL' as Ticket['priority'],
    category: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // Redirecionar para dashboard se estiver na rota raiz
  useEffect(() => {
    if (location.pathname === '/gestao-atendimento') {
      navigate('/gestao-atendimento/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Mock data para demonstração
      const mockAgents: Agent[] = [
        {
          id: '1',
          name: 'João Silva',
          email: 'joao.silva@empresa.com',
          status: 'ONLINE',
          department: 'Suporte Técnico',
          lastActivity: new Date().toISOString(),
          totalTickets: 45,
          resolvedTickets: 42
        },
        {
          id: '2',
          name: 'Maria Santos',
          email: 'maria.santos@empresa.com',
          status: 'BUSY',
          department: 'Atendimento ao Cliente',
          lastActivity: new Date(Date.now() - 300000).toISOString(),
          totalTickets: 38,
          resolvedTickets: 35
        },
        {
          id: '3',
          name: 'Pedro Costa',
          email: 'pedro.costa@empresa.com',
          status: 'OFFLINE',
          department: 'Suporte Técnico',
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          totalTickets: 52,
          resolvedTickets: 48
        }
      ];

      const mockTickets: Ticket[] = [
        {
          id: '1',
          title: 'Problema com login no sistema',
          description: 'Usuário não consegue acessar o sistema com suas credenciais',
          priority: 'HIGH',
          status: 'IN_PROGRESS',
          category: 'Acesso ao Sistema',
          assignedTo: mockAgents[0],
          customer: {
            name: 'Carlos Oliveira',
            email: 'carlos.oliveira@cliente.com',
            phone: '(11) 99999-9999'
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Dúvida sobre relatórios',
          description: 'Cliente precisa de ajuda para gerar relatórios mensais',
          priority: 'NORMAL',
          status: 'OPEN',
          category: 'Relatórios',
          customer: {
            name: 'Ana Paula',
            email: 'ana.paula@cliente.com'
          },
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString()
        }
      ];

      const mockMetrics: Metric[] = [
        { name: 'Tickets Abertos', value: 15, change: 2, trend: 'up' },
        { name: 'Tempo Médio de Resposta', value: 2.5, change: -0.5, trend: 'down' },
        { name: 'Taxa de Resolução', value: 94, change: 3, trend: 'up' },
        { name: 'Satisfação do Cliente', value: 4.8, change: 0.2, trend: 'up' }
      ];

      setAgents(mockAgents);
      setTickets(mockTickets);
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de atendimento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!formData.title || !formData.description || !formData.customerName || !formData.customerEmail) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock: criar novo ticket
      const newTicket: Ticket = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'OPEN',
        category: formData.category,
        customer: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setTickets([newTicket, ...tickets]);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'NORMAL',
      category: '',
      customerName: '',
      customerEmail: '',
      customerPhone: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return 'bg-green-100 text-green-800';
      case 'BUSY': return 'bg-yellow-100 text-yellow-800';
      case 'AWAY': return 'bg-orange-100 text-orange-800';
      case 'OFFLINE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para navegar entre as páginas
  const navigateToPage = (page: string) => {
    navigate(`/gestao-atendimento/${page}`);
  };

  return (
    <MainLayout title="Gestão de Atendimento" subtitle="Gerencie tickets, agentes e métricas de atendimento">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Atendimento</h1>
            <p className="text-muted-foreground">Gerencie tickets, agentes e métricas de atendimento</p>
          </div>
          <Button onClick={() => navigateToPage('tickets')}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Novo Ticket
          </Button>
        </div>

        {/* Navegação entre páginas */}
        <div className="flex space-x-2 border-b">
          <Button
            variant={currentPage === 'dashboard' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('dashboard')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </Button>
          <Button
            variant={currentPage === 'tickets' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('tickets')}
            className="flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Tickets
          </Button>
          <Button
            variant={currentPage === 'agentes' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('agentes')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Agentes
          </Button>
          <Button
            variant={currentPage === 'metricas' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('metricas')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Métricas
          </Button>
          <Button
            variant={currentPage === 'chatbot' ? 'default' : 'ghost'}
            onClick={() => navigateToPage('chatbot')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Chatbot
          </Button>
        </div>

        {/* Componentes das páginas */}
        {/* Dashboard */}
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{metric.name}</p>
                        <p className="text-2xl font-bold">{metric.value}</p>
                      </div>
                      <div className={`flex items-center text-sm ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.trend === 'up' && <CheckCircle className="w-4 h-4 mr-1" />}
                        {metric.trend === 'down' && <XCircle className="w-4 h-4 mr-1" />}
                        {metric.trend === 'stable' && <AlertCircle className="w-4 h-4 mr-1" />}
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Agentes online */}
            <Card>
              <CardHeader>
                <CardTitle>Agentes Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {agents.filter(agent => agent.status === 'ONLINE').map((agent) => (
                    <div key={agent.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">{agent.department}</p>
                      </div>
                      <Badge className={getStatusColor(agent.status)}>
                        {agent.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tickets recentes */}
            <Card>
              <CardHeader>
                <CardTitle>Tickets Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.customer.name} • {ticket.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getTicketStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Tickets */}
        {currentPage === 'tickets' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Novo Ticket</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Título *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="Digite o título do ticket"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Categoria</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="Ex: Suporte Técnico"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Descreva o problema ou solicitação"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(value: Ticket['priority']) => setFormData({...formData, priority: value})}>
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
                    <div>
                      <Label htmlFor="customerName">Nome do Cliente *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Telefone</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetForm}>Limpar</Button>
                    <Button onClick={handleCreateTicket}>Criar Ticket</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                         onClick={() => {
                           setSelectedTicket(ticket);
                           setShowTicketModal(true);
                         }}>
                      <div>
                        <p className="font-medium">{ticket.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.customer.name} • {ticket.category}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getTicketStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ticket.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Agentes */}
        {currentPage === 'agentes' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Agentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.email}</p>
                          <p className="text-sm text-muted-foreground">{agent.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total de Tickets</p>
                          <p className="font-medium">{agent.totalTickets}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Resolvidos</p>
                          <p className="font-medium">{agent.resolvedTickets}</p>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>
                          {agent.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <UserCog className="w-4 h-4 mr-2" />
                          Configurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Métricas */}
        {currentPage === 'metricas' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Funcionalidade em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá visualizar métricas detalhadas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Chatbot */}
        {currentPage === 'chatbot' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Chatbot</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Funcionalidade em desenvolvimento</p>
                  <p className="text-sm">Em breve você poderá configurar o chatbot</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Visualização de Ticket */}
        <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Ticket</DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-lg font-semibold">{selectedTicket.title}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Prioridade</Label>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getTicketStatusColor(selectedTicket.status)}>
                      {selectedTicket.status}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p>{selectedTicket.customer.name} ({selectedTicket.customer.email})</p>
                  {selectedTicket.customer.phone && (
                    <p className="text-sm text-muted-foreground">{selectedTicket.customer.phone}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p>{selectedTicket.category}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p>{format(new Date(selectedTicket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>

                {selectedTicket.assignedTo && (
                  <div>
                    <Label className="text-sm font-medium">Atendente</Label>
                    <p>{selectedTicket.assignedTo.name} ({selectedTicket.assignedTo.department})</p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setShowTicketModal(false)}>
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

export default GestaoAtendimento;
