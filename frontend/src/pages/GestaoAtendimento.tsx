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
  XCircle,
  Loader2,
  Hash,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MainLayout } from '@/components/MainLayout';
import supportService, {
  Agent,
  Ticket,
  TicketMetrics,
  CreateTicketRequest,
  TicketPriority,
  TicketCategory
} from '@/services/supportService';
import employeeService, { SimpleEmployee } from '@/services/employeeService'; // Mudança: usar employeeService
import chatbotService, { ChatbotConfig, CreateChatbotConfigRequest, UpdateChatbotConfigRequest } from '@/services/chatbotService';

const GestaoAtendimento: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determinar a página atual baseado na URL
  const pathParts = location.pathname.split('/');
  const currentPage = pathParts.length > 2 ? pathParts[2] : 'dashboard';
  
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metrics, setMetrics] = useState<TicketMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<SimpleEmployee[]>([]); // Mudança: usar SimpleEmployee
  const [protocol, setProtocol] = useState<string>(''); // Novo: campo protocolo
  const [chatbotConfigs, setChatbotConfigs] = useState<ChatbotConfig[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ChatbotConfig | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configFormData, setConfigFormData] = useState<CreateChatbotConfigRequest>({
    name: '',
    welcomeMessage: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
    defaultResponse: 'Desculpe, não entendi sua mensagem. Poderia reformular?',
    isActive: true,
    autoRespond: true,
    transferToHumanEnabled: true,
    workingHoursEnabled: false,
    workingHoursStart: '08:00',
    workingHoursEnd: '18:00',
    offlineMessage: 'No momento estamos fora do horário de atendimento. Nossa equipe retornará em breve.',
    maxWaitTimeMinutes: 30,
    autoEscalateEnabled: false,
    autoEscalateAfterMinutes: 15,
    knowledgeBaseEnabled: false,
    sentimentAnalysisEnabled: false,
    language: 'pt-BR'
  });
  
  const { toast } = useToast();

  // Form state para novo ticket
  const [formData, setFormData] = useState<CreateTicketRequest>({
    title: '',
    description: '',
    priority: 'NORMAL' as TicketPriority,
    category: 'GENERAL_INQUIRY' as TicketCategory,
    customerName: '', // Mudança: removido obrigatoriedade
    customerEmail: '', // Mudança: removido obrigatoriedade
    customerPhone: '',
    customerUserId: undefined
  });

  useEffect(() => {
    loadData();
    loadChatbotConfigs();
  }, []);

  const loadChatbotConfigs = async () => {
    try {
      const configs = await chatbotService.getAllConfigs();
      setChatbotConfigs(configs);
      const activeConfig = configs.find(c => c.isActive);
      if (activeConfig) {
        setSelectedConfig(activeConfig);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do chatbot:', error);
    }
  };

  // Redirecionar para dashboard se estiver na rota raiz
  useEffect(() => {
    if (location.pathname === '/gestao-atendimento') {
      navigate('/gestao-atendimento/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const loadData = async () => {
    setLoading(true);
    
    // Carregar funcionários independentemente (prioridade)
    try {
      const employeesData = await employeeService.getSimpleEmployees();
      setUsers(employeesData);
      console.log('✅ Funcionários carregados:', employeesData.length);
    } catch (error) {
      console.error('❌ Erro ao carregar funcionários:', error);
      setUsers([]);
    }
    
    // Carregar outros dados em paralelo
    try {
      const [agentsData, ticketsData, metricsData] = await Promise.allSettled([
        supportService.getAllAgents(),
        supportService.getAllTickets(0, 50),
        supportService.getTicketMetrics()
      ]);
      
      if (agentsData.status === 'fulfilled') {
        const agentsList = Array.isArray(agentsData.value) ? agentsData.value : [];
        setAgents(agentsList);
        console.log('✅ Agentes carregados:', agentsList.length);
        console.log('📊 Status dos agentes:', agentsList.map(a => ({ name: a.name, status: a.status })));
        const onlineAgents = agentsList.filter(a => a.status === 'ONLINE');
        console.log('🟢 Agentes online:', onlineAgents.length);
      } else {
        console.error('❌ Erro ao carregar agentes:', agentsData.reason);
        setAgents([]);
      }
      
      if (ticketsData.status === 'fulfilled') {
        const ticketsList = ticketsData.value?.content || (Array.isArray(ticketsData.value) ? ticketsData.value : []);
        setTickets(ticketsList);
        console.log('✅ Tickets carregados:', ticketsList.length);
        console.log('📊 Estrutura do primeiro ticket:', ticketsList.length > 0 ? ticketsList[0] : 'Nenhum ticket');
      } else {
        console.error('❌ Erro ao carregar tickets:', ticketsData.reason);
        console.error('❌ Detalhes do erro:', ticketsData.reason?.response?.data || ticketsData.reason?.message);
        setTickets([]);
      }
      
      if (metricsData.status === 'fulfilled') {
        setMetrics(metricsData.value);
        console.log('✅ Métricas carregadas');
      } else {
        console.error('❌ Erro ao carregar métricas:', metricsData.reason);
        setMetrics({
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          closedTickets: 0,
          averageResolutionTimeHours: 0,
          resolutionRatePercentage: 0
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados de atendimento:', error);
      toast({
        title: "Aviso",
        description: "Alguns dados de atendimento não puderam ser carregados.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar protocolo baseado no título e data
  const generateProtocol = () => {
    const now = new Date();
    const dateStr = format(now, 'yyyyMMdd');
    const timeStr = format(now, 'HHmmss');
    
    // Criar protocolo baseado no título (primeiras letras) + data + hora
    const titleWords = formData.title.split(' ').filter(word => word.length > 0);
    const titlePrefix = titleWords.map(word => word.charAt(0).toUpperCase()).join('').substring(0, 3);
    
    const newProtocol = `${titlePrefix}-${dateStr}-${timeStr}`;
    setProtocol(newProtocol);
    
    toast({
      title: "Protocolo gerado",
      description: `Protocolo: ${newProtocol}`,
      variant: "default"
    });
  };

  const handleCreateTicket = async () => {
    if (!formData.title || !formData.description) { // Mudança: removido obrigatoriedade de customerName e customerEmail
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos o título e descrição",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const newTicket = await supportService.createTicket(formData);
      
      setTickets([newTicket, ...tickets]);
      resetForm();
      
      toast({
        title: "Sucesso",
        description: "Ticket criado com sucesso",
      });
      
      // Recarregar métricas
      const metricsData = await supportService.getTicketMetrics();
      setMetrics(metricsData);
      
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o ticket",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'NORMAL',
      category: 'GENERAL_INQUIRY',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerUserId: undefined
    });
    setProtocol(''); // Novo: limpar protocolo
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
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para navegar entre as páginas
  const navigateToPage = (page: string) => {
    navigate(`/gestao-atendimento/${page}`);
  };

  if (loading && tickets.length === 0) {
    return (
      <MainLayout title="Gestão de Atendimento" subtitle="Gerencie tickets, agentes e métricas de atendimento">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Carregando dados...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gestão de Atendimento" subtitle="Gerencie tickets, agentes e métricas de atendimento">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Gestão de Atendimento</h1>
            <p className="text-muted-foreground">Gerencie tickets, agentes e métricas de atendimento</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={() => navigateToPage('tickets')}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Novo Ticket
            </Button>
          </div>
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

        {/* Dashboard */}
        {currentPage === 'dashboard' && (
          <div className="space-y-6">
            {/* Métricas principais */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total de Tickets</p>
                        <p className="text-2xl font-bold">{metrics.totalTickets}</p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tickets Abertos</p>
                        <p className="text-2xl font-bold text-orange-600">{metrics.openTickets}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tempo Médio Resolução</p>
                        <p className="text-2xl font-bold">{metrics.averageResolutionTimeHours.toFixed(1)}h</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Taxa de Resolução</p>
                        <p className="text-2xl font-bold text-green-600">{metrics.resolutionRatePercentage.toFixed(1)}%</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Agentes online */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Agentes Online</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {(() => {
                  const onlineAgents = agents.filter(agent => agent && agent.status === 'ONLINE');
                  console.log('🔍 Verificando agentes online:', { 
                    total: agents.length, 
                    online: onlineAgents.length, 
                    agents: agents.map(a => ({ name: a?.name, status: a?.status, id: a?.id })) 
                  });
                  return onlineAgents.length > 0;
                })() ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {agents.filter(agent => agent && agent.status === 'ONLINE').map((agent) => (
                      <div key={agent.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">{agent.department || 'Sem departamento'}</p>
                        </div>
                        <Badge className={getStatusColor(agent.status)}>
                          {supportService.getAgentStatusLabel(agent.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum agente online no momento</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total de agentes: {agents.length}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tickets recentes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tickets Recentes</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={loadData}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </CardHeader>
              <CardContent>
                {(() => {
                  console.log('🔍 Verificando tickets:', { 
                    total: tickets.length, 
                    tickets: tickets.slice(0, 3).map(t => ({ 
                      id: t?.id, 
                      title: t?.title, 
                      customer: t?.customer,
                      customerName: t?.customerName,
                      status: t?.status
                    })) 
                  });
                  return tickets.length > 0;
                })() ? (
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                           onClick={() => {
                             setSelectedTicket(ticket);
                             setShowTicketModal(true);
                           }}>
                        <div className="flex-1">
                          <p className="font-medium">{ticket.title || 'Sem título'}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.customer?.name || ticket.customerName || 'Cliente não informado'} • {supportService.getCategoryLabel(ticket.category)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {supportService.getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={getTicketStatusColor(ticket.status)}>
                            {supportService.getStatusLabel(ticket.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {ticket.createdAt ? format(new Date(ticket.createdAt), 'dd/MM HH:mm', { locale: ptBR }) : 'Data não disponível'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigateToPage('tickets')}
                      className="mt-4"
                    >
                      Criar Primeiro Ticket
                    </Button>
                  </div>
                )}
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
                      <Label htmlFor="protocol">Protocolo</Label>
                      <div className="flex gap-2">
                        <Input
                          id="protocol"
                          value={protocol}
                          onChange={(e) => setProtocol(e.target.value)}
                          placeholder="Protocolo será gerado automaticamente"
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateProtocol}
                          disabled={!formData.title}
                          className="px-3"
                        >
                          <Hash className="w-4 h-4 mr-1" />
                          Gerar
                        </Button>
                      </div>
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

                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value: TicketCategory) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SYSTEM_ACCESS">Acesso ao Sistema</SelectItem>
                        <SelectItem value="TECHNICAL_SUPPORT">Suporte Técnico</SelectItem>
                        <SelectItem value="BILLING">Financeiro</SelectItem>
                        <SelectItem value="REPORTS">Relatórios</SelectItem>
                        <SelectItem value="GENERAL_INQUIRY">Dúvida Geral</SelectItem>
                        <SelectItem value="BUG_REPORT">Relato de Bug</SelectItem>
                        <SelectItem value="FEATURE_REQUEST">Solicitação de Funcionalidade</SelectItem>
                        <SelectItem value="OTHER">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="priority">Prioridade</Label>
                      <Select value={formData.priority} onValueChange={(value: TicketPriority) => setFormData({...formData, priority: value})}>
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
                      <Label htmlFor="customerName">Nome do Cliente</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                        placeholder="Nome completo (opcional)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                        placeholder="email@exemplo.com (opcional)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerUserId">Funcionário</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={formData.customerUserId || undefined} 
                          onValueChange={(value) => setFormData({...formData, customerUserId: value || undefined})}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione um funcionário (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.name} - {employee.email || employee.phone || 'Sem contato'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.customerUserId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFormData({...formData, customerUserId: undefined})}
                            className="px-2"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Telefone</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone || ''}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={resetForm}>Limpar</Button>
                    <Button onClick={handleCreateTicket} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Criar Ticket
                    </Button>
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
                {tickets.length > 0 ? (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                           onClick={() => {
                             setSelectedTicket(ticket);
                             setShowTicketModal(true);
                           }}>
                        <div className="flex-1">
                          <p className="font-medium">{ticket.title || 'Sem título'}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.customer?.name || ticket.customerName || 'Cliente não informado'} • {supportService.getCategoryLabel(ticket.category)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {supportService.getPriorityLabel(ticket.priority)}
                          </Badge>
                          <Badge className={getTicketStatusColor(ticket.status)}>
                            {supportService.getStatusLabel(ticket.status)}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum ticket encontrado</p>
                )}
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
                {agents.length > 0 ? (
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
                            <p className="text-sm text-muted-foreground">{agent.department || 'Sem departamento'}</p>
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
                            {supportService.getAgentStatusLabel(agent.status)}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <UserCog className="w-4 h-4 mr-2" />
                            Configurar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhum agente cadastrado</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Métricas */}
        {currentPage === 'metricas' && metrics && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Total de Tickets</p>
                    <p className="text-3xl font-bold">{metrics.totalTickets}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tickets Abertos</p>
                    <p className="text-3xl font-bold text-orange-600">{metrics.openTickets}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Em Andamento</p>
                    <p className="text-3xl font-bold text-blue-600">{metrics.inProgressTickets}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Resolvidos</p>
                    <p className="text-3xl font-bold text-green-600">{metrics.resolvedTickets}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Fechados</p>
                    <p className="text-3xl font-bold text-gray-600">{metrics.closedTickets}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Taxa de Resolução</p>
                    <p className="text-3xl font-bold text-green-600">{metrics.resolutionRatePercentage.toFixed(1)}%</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg col-span-full">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Tempo Médio de Resolução</p>
                    <p className="text-3xl font-bold text-purple-600">{metrics.averageResolutionTimeHours.toFixed(2)} horas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Página de Chatbot */}
        {currentPage === 'chatbot' && (
          <div className="space-y-4">
            {/* Lista de Configurações */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Configurações do Chatbot</CardTitle>
                <Button onClick={() => {
                  setConfigFormData({
                    name: '',
                    welcomeMessage: 'Olá! Bem-vindo ao nosso atendimento. Como posso ajudá-lo hoje?',
                    defaultResponse: 'Desculpe, não entendi sua mensagem. Poderia reformular?',
                    isActive: true,
                    autoRespond: true,
                    transferToHumanEnabled: true,
                    workingHoursEnabled: false,
                    workingHoursStart: '08:00',
                    workingHoursEnd: '18:00',
                    offlineMessage: 'No momento estamos fora do horário de atendimento. Nossa equipe retornará em breve.',
                    maxWaitTimeMinutes: 30,
                    autoEscalateEnabled: false,
                    autoEscalateAfterMinutes: 15,
                    knowledgeBaseEnabled: false,
                    sentimentAnalysisEnabled: false,
                    language: 'pt-BR'
                  });
                  setSelectedConfig(null);
                  setShowConfigModal(true);
                }}>
                  <Settings className="w-4 h-4 mr-2" />
                  Nova Configuração
                </Button>
              </CardHeader>
              <CardContent>
                {chatbotConfigs.length > 0 ? (
                  <div className="space-y-3">
                    {chatbotConfigs.map((config) => (
                      <div 
                        key={config.id} 
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedConfig?.id === config.id 
                            ? 'bg-blue-50 border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          setSelectedConfig(config);
                          setConfigFormData({
                            name: config.name,
                            welcomeMessage: config.welcomeMessage || '',
                            defaultResponse: config.defaultResponse || '',
                            isActive: config.isActive,
                            autoRespond: config.autoRespond,
                            transferToHumanEnabled: config.transferToHumanEnabled,
                            workingHoursEnabled: config.workingHoursEnabled,
                            workingHoursStart: config.workingHoursStart || '08:00',
                            workingHoursEnd: config.workingHoursEnd || '18:00',
                            offlineMessage: config.offlineMessage || '',
                            maxWaitTimeMinutes: config.maxWaitTimeMinutes,
                            autoEscalateEnabled: config.autoEscalateEnabled,
                            autoEscalateAfterMinutes: config.autoEscalateAfterMinutes,
                            knowledgeBaseEnabled: config.knowledgeBaseEnabled,
                            sentimentAnalysisEnabled: config.sentimentAnalysisEnabled,
                            language: config.language
                          });
                          setShowConfigModal(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <div>
                            <p className="font-medium">{config.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {config.isActive ? 'Ativo' : 'Inativo'} • 
                              {config.autoRespond ? ' Resposta Automática' : ' Manual'} • 
                              Idioma: {config.language}
                            </p>
                          </div>
                        </div>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p>Nenhuma configuração encontrada</p>
                    <p className="text-sm">Clique em "Nova Configuração" para criar uma</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de Configuração */}
            <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedConfig ? 'Editar Configuração do Chatbot' : 'Nova Configuração do Chatbot'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="config-name">Nome da Configuração *</Label>
                    <Input
                      id="config-name"
                      value={configFormData.name}
                      onChange={(e) => setConfigFormData({...configFormData, name: e.target.value})}
                      placeholder="Ex: Chatbot Principal"
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                    <Textarea
                      id="welcome-message"
                      value={configFormData.welcomeMessage || ''}
                      onChange={(e) => setConfigFormData({...configFormData, welcomeMessage: e.target.value})}
                      placeholder="Mensagem exibida quando o cliente inicia uma conversa"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="default-response">Resposta Padrão</Label>
                    <Textarea
                      id="default-response"
                      value={configFormData.defaultResponse || ''}
                      onChange={(e) => setConfigFormData({...configFormData, defaultResponse: e.target.value})}
                      placeholder="Mensagem quando o chatbot não entende a pergunta"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is-active"
                        checked={configFormData.isActive || false}
                        onChange={(e) => setConfigFormData({...configFormData, isActive: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="is-active" className="cursor-pointer">Configuração Ativa</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-respond"
                        checked={configFormData.autoRespond || false}
                        onChange={(e) => setConfigFormData({...configFormData, autoRespond: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="auto-respond" className="cursor-pointer">Resposta Automática</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="transfer-human"
                        checked={configFormData.transferToHumanEnabled || false}
                        onChange={(e) => setConfigFormData({...configFormData, transferToHumanEnabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="transfer-human" className="cursor-pointer">Permitir Transferência para Humano</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="working-hours"
                        checked={configFormData.workingHoursEnabled || false}
                        onChange={(e) => setConfigFormData({...configFormData, workingHoursEnabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="working-hours" className="cursor-pointer">Respeitar Horário de Funcionamento</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="auto-escalate"
                        checked={configFormData.autoEscalateEnabled || false}
                        onChange={(e) => setConfigFormData({...configFormData, autoEscalateEnabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="auto-escalate" className="cursor-pointer">Escalação Automática</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="knowledge-base"
                        checked={configFormData.knowledgeBaseEnabled || false}
                        onChange={(e) => setConfigFormData({...configFormData, knowledgeBaseEnabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="knowledge-base" className="cursor-pointer">Base de Conhecimento</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="sentiment-analysis"
                        checked={configFormData.sentimentAnalysisEnabled || false}
                        onChange={(e) => setConfigFormData({...configFormData, sentimentAnalysisEnabled: e.target.checked})}
                        className="rounded"
                      />
                      <Label htmlFor="sentiment-analysis" className="cursor-pointer">Análise de Sentimento</Label>
                    </div>
                  </div>

                  {configFormData.workingHoursEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hours-start">Horário de Início</Label>
                        <Input
                          id="hours-start"
                          type="time"
                          value={configFormData.workingHoursStart || '08:00'}
                          onChange={(e) => setConfigFormData({...configFormData, workingHoursStart: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hours-end">Horário de Fim</Label>
                        <Input
                          id="hours-end"
                          type="time"
                          value={configFormData.workingHoursEnd || '18:00'}
                          onChange={(e) => setConfigFormData({...configFormData, workingHoursEnd: e.target.value})}
                        />
                      </div>
                    </div>
                  )}

                  {configFormData.workingHoursEnabled && (
                    <div>
                      <Label htmlFor="offline-message">Mensagem Fora do Horário</Label>
                      <Textarea
                        id="offline-message"
                        value={configFormData.offlineMessage || ''}
                        onChange={(e) => setConfigFormData({...configFormData, offlineMessage: e.target.value})}
                        placeholder="Mensagem exibida quando está fora do horário de funcionamento"
                        rows={2}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="max-wait">Tempo Máximo de Espera (minutos)</Label>
                      <Input
                        id="max-wait"
                        type="number"
                        value={configFormData.maxWaitTimeMinutes || 30}
                        onChange={(e) => setConfigFormData({...configFormData, maxWaitTimeMinutes: parseInt(e.target.value) || 30})}
                        min="1"
                      />
                    </div>

                    {configFormData.autoEscalateEnabled && (
                      <div>
                        <Label htmlFor="escalate-after">Escalar Após (minutos)</Label>
                        <Input
                          id="escalate-after"
                          type="number"
                          value={configFormData.autoEscalateAfterMinutes || 15}
                          onChange={(e) => setConfigFormData({...configFormData, autoEscalateAfterMinutes: parseInt(e.target.value) || 15})}
                          min="1"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="language">Idioma</Label>
                      <Select 
                        value={configFormData.language || 'pt-BR'} 
                        onValueChange={(value) => setConfigFormData({...configFormData, language: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowConfigModal(false);
                      setSelectedConfig(null);
                    }}>
                      Cancelar
                    </Button>
                    {selectedConfig && (
                      <Button 
                        variant="destructive" 
                        onClick={async () => {
                          try {
                            await chatbotService.deleteConfig(selectedConfig.id);
                            toast({
                              title: "Sucesso",
                              description: "Configuração deletada com sucesso.",
                            });
                            await loadChatbotConfigs();
                            setShowConfigModal(false);
                            setSelectedConfig(null);
                          } catch (error) {
                            toast({
                              title: "Erro",
                              description: "Não foi possível deletar a configuração.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Deletar
                      </Button>
                    )}
                    <Button 
                      onClick={async () => {
                        try {
                          if (!configFormData.name) {
                            toast({
                              title: "Erro",
                              description: "Nome da configuração é obrigatório.",
                              variant: "destructive"
                            });
                            return;
                          }

                          if (selectedConfig) {
                            await chatbotService.updateConfig(selectedConfig.id, configFormData as UpdateChatbotConfigRequest);
                            toast({
                              title: "Sucesso",
                              description: "Configuração atualizada com sucesso.",
                            });
                          } else {
                            await chatbotService.createConfig(configFormData);
                            toast({
                              title: "Sucesso",
                              description: "Configuração criada com sucesso.",
                            });
                          }
                          await loadChatbotConfigs();
                          setShowConfigModal(false);
                          setSelectedConfig(null);
                        } catch (error: any) {
                          toast({
                            title: "Erro",
                            description: error.response?.data?.message || "Não foi possível salvar a configuração.",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {selectedConfig ? 'Atualizar' : 'Criar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
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
                      {supportService.getPriorityLabel(selectedTicket.priority)}
                    </Badge>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getTicketStatusColor(selectedTicket.status)}>
                      {supportService.getStatusLabel(selectedTicket.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p>{selectedTicket.customer?.name || selectedTicket.customerName || 'Cliente não informado'} ({selectedTicket.customer?.email || selectedTicket.customerEmail || 'Email não informado'})</p>
                  {(selectedTicket.customer?.phone || selectedTicket.customerPhone) && (
                    <p className="text-sm text-muted-foreground">{selectedTicket.customer?.phone || selectedTicket.customerPhone}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Categoria</Label>
                  <p>{supportService.getCategoryLabel(selectedTicket.category)}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p>{format(new Date(selectedTicket.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>

                {selectedTicket.assignedTo && (
                  <div>
                    <Label className="text-sm font-medium">Atendente</Label>
                    <p>{selectedTicket.assignedTo.name} ({selectedTicket.assignedTo.department || 'Sem departamento'})</p>
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
