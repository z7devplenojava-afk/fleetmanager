import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    MessageSquare,
    Plus,
    Search,
    Filter,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    User,
    Calendar,
    Tag,
    Send,
    Paperclip,
    Phone,
    Mail,
    MessageCircle,
    Headphones,
    FileText,
    Zap,
    Star,
    ThumbsUp,
    ThumbsDown,
    Eye,
    ArrowRight
} from 'lucide-react';
import { MainLayout } from '@/components/MainLayout';
import InternalMessagingSystem from '@/components/suporte/InternalMessagingSystem';
import ChatbotServiceIntegration from '@/components/suporte/ChatbotServiceIntegration';
import RealTimeNotifications from '@/components/RealTimeNotifications';

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: 'bug' | 'feature' | 'question' | 'technical' | 'account';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
    createdAt: string;
    updatedAt: string;
    assignedTo?: string;
    messages: TicketMessage[];
    attachments?: string[];
    rating?: number;
}

interface TicketMessage {
    id: string;
    content: string;
    author: string;
    isSupport: boolean;
    timestamp: string;
    attachments?: string[];
}

export default function Suporte() {
    const [activeTab, setActiveTab] = useState('tickets');
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPriority, setFilterPriority] = useState('all');
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);

    // Formulário de novo ticket
    const [newTicket, setNewTicket] = useState({
        title: '',
        description: '',
        category: '',
        priority: 'medium' as const
    });

    // Mensagem para resposta
    const [replyMessage, setReplyMessage] = useState('');

    // Dados mockados para demonstração
    useEffect(() => {
        const mockTickets: Ticket[] = [
            {
                id: 'TK-001',
                title: 'Erro ao gerar relatório financeiro',
                description: 'Quando tento gerar o relatório financeiro do mês atual, o sistema apresenta erro 500.',
                category: 'bug',
                priority: 'high',
                status: 'in_progress',
                createdAt: '2024-01-15T10:30:00Z',
                updatedAt: '2024-01-15T14:20:00Z',
                assignedTo: 'João Silva',
                messages: [
                    {
                        id: 'msg-1',
                        content: 'Quando tento gerar o relatório financeiro do mês atual, o sistema apresenta erro 500. Já tentei em diferentes navegadores.',
                        author: 'Maria Santos',
                        isSupport: false,
                        timestamp: '2024-01-15T10:30:00Z'
                    },
                    {
                        id: 'msg-2',
                        content: 'Olá Maria! Obrigado por reportar o problema. Estamos investigando a questão. Você poderia me informar qual período específico está tentando gerar?',
                        author: 'João Silva',
                        isSupport: true,
                        timestamp: '2024-01-15T11:15:00Z'
                    },
                    {
                        id: 'msg-3',
                        content: 'Estou tentando gerar o relatório de Janeiro de 2024. O erro acontece sempre que clico em "Gerar Relatório".',
                        author: 'Maria Santos',
                        isSupport: false,
                        timestamp: '2024-01-15T11:45:00Z'
                    }
                ]
            },
            {
                id: 'TK-002',
                title: 'Solicitação de nova funcionalidade - Backup automático',
                description: 'Gostaria de sugerir a implementação de backup automático diário dos dados.',
                category: 'feature',
                priority: 'medium',
                status: 'open',
                createdAt: '2024-01-14T09:15:00Z',
                updatedAt: '2024-01-14T09:15:00Z',
                messages: [
                    {
                        id: 'msg-4',
                        content: 'Seria muito útil ter um sistema de backup automático que rode todos os dias às 2h da manhã. Isso aumentaria a segurança dos nossos dados.',
                        author: 'Carlos Oliveira',
                        isSupport: false,
                        timestamp: '2024-01-14T09:15:00Z'
                    }
                ]
            },
            {
                id: 'TK-003',
                title: 'Dúvida sobre cadastro de funcionários',
                description: 'Como faço para cadastrar funcionários em lote?',
                category: 'question',
                priority: 'low',
                status: 'resolved',
                createdAt: '2024-01-13T16:20:00Z',
                updatedAt: '2024-01-13T17:30:00Z',
                assignedTo: 'Ana Costa',
                rating: 5,
                messages: [
                    {
                        id: 'msg-5',
                        content: 'Preciso cadastrar 50 funcionários novos. Existe alguma forma de fazer isso em lote ao invés de um por um?',
                        author: 'Pedro Almeida',
                        isSupport: false,
                        timestamp: '2024-01-13T16:20:00Z'
                    },
                    {
                        id: 'msg-6',
                        content: 'Olá Pedro! Sim, você pode usar a funcionalidade de importação em massa. Vá em RH > Funcionários > Importar Planilha. Você pode baixar o modelo de planilha e preencher com os dados.',
                        author: 'Ana Costa',
                        isSupport: true,
                        timestamp: '2024-01-13T16:45:00Z'
                    },
                    {
                        id: 'msg-7',
                        content: 'Perfeito! Funcionou perfeitamente. Muito obrigado pela ajuda!',
                        author: 'Pedro Almeida',
                        isSupport: false,
                        timestamp: '2024-01-13T17:30:00Z'
                    }
                ]
            }
        ];
        setTickets(mockTickets);
    }, []);

    // Filtrar tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Estatísticas dos tickets
    const ticketStats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        avgResponseTime: '2.5 horas',
        satisfaction: 4.8
    };

    // Handlers
    const handleCreateTicket = () => {
        if (!newTicket.title || !newTicket.description || !newTicket.category) {
            return;
        }

        const ticket: Ticket = {
            id: `TK-${String(tickets.length + 1).padStart(3, '0')}`,
            title: newTicket.title,
            description: newTicket.description,
            category: newTicket.category as any,
            priority: newTicket.priority,
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: `msg-${Date.now()}`,
                    content: newTicket.description,
                    author: 'Usuário Atual',
                    isSupport: false,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        setTickets([ticket, ...tickets]);
        setNewTicket({ title: '', description: '', category: '', priority: 'medium' });
        setShowNewTicketForm(false);
        setSelectedTicket(ticket);
    };

    const handleSendReply = () => {
        if (!selectedTicket || !replyMessage.trim()) return;

        const newMessage: TicketMessage = {
            id: `msg-${Date.now()}`,
            content: replyMessage,
            author: 'Usuário Atual',
            isSupport: false,
            timestamp: new Date().toISOString()
        };

        const updatedTicket = {
            ...selectedTicket,
            messages: [...selectedTicket.messages, newMessage],
            updatedAt: new Date().toISOString()
        };

        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t));
        setSelectedTicket(updatedTicket);
        setReplyMessage('');
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'waiting': return 'bg-orange-100 text-orange-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low': return 'bg-gray-100 text-gray-800';
            case 'medium': return 'bg-blue-100 text-blue-800';
            case 'high': return 'bg-orange-100 text-orange-800';
            case 'urgent': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open': return <AlertCircle className="w-4 h-4" />;
            case 'in_progress': return <Clock className="w-4 h-4" />;
            case 'resolved': return <CheckCircle className="w-4 h-4" />;
            case 'closed': return <XCircle className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    return (
        <MainLayout title="Central de Suporte" subtitle="Tire suas dúvidas e reporte problemas">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Central de Suporte</h1>
                        <p className="text-muted-foreground">
                            Tire suas dúvidas, reporte problemas e acompanhe seus tickets
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            (11) 9999-9999
                        </Button>
                        <Button onClick={() => setShowNewTicketForm(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Ticket
                        </Button>
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{ticketStats.total}</p>
                                    <p className="text-sm text-muted-foreground">Total</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <AlertCircle className="w-5 h-5 text-blue-600" />
                                <div>
                                    <p className="text-2xl font-bold">{ticketStats.open}</p>
                                    <p className="text-sm text-muted-foreground">Abertos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <p className="text-2xl font-bold">{ticketStats.inProgress}</p>
                                    <p className="text-sm text-muted-foreground">Em Andamento</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{ticketStats.resolved}</p>
                                    <p className="text-sm text-muted-foreground">Resolvidos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <div>
                                    <p className="text-lg font-bold">{ticketStats.avgResponseTime}</p>
                                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2">
                                <Star className="w-5 h-5 text-yellow-600" />
                                <div>
                                    <p className="text-2xl font-bold">{ticketStats.satisfaction}</p>
                                    <p className="text-sm text-muted-foreground">Satisfação</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="tickets">Meus Tickets</TabsTrigger>
                        <TabsTrigger value="knowledge">Base de Conhecimento</TabsTrigger>
                        <TabsTrigger value="contact">Contato Direto</TabsTrigger>
                        <TabsTrigger value="internal-messages">Mensagens Internas</TabsTrigger>
                        <TabsTrigger value="chatbot-service">Atendimento Chatbot</TabsTrigger>
                        <TabsTrigger value="notificacoes">Notificações Tempo Real</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tickets" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Lista de Tickets */}
                            <div className="lg:col-span-1 space-y-4">
                                {/* Filtros */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Filter className="w-5 h-5 mr-2" />
                                            Filtros
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                            <Input
                                                placeholder="Buscar tickets..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <div>
                                            <Label>Status</Label>
                                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todos</SelectItem>
                                                    <SelectItem value="open">Aberto</SelectItem>
                                                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                                                    <SelectItem value="waiting">Aguardando</SelectItem>
                                                    <SelectItem value="resolved">Resolvido</SelectItem>
                                                    <SelectItem value="closed">Fechado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Prioridade</Label>
                                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    <SelectItem value="low">Baixa</SelectItem>
                                                    <SelectItem value="medium">Média</SelectItem>
                                                    <SelectItem value="high">Alta</SelectItem>
                                                    <SelectItem value="urgent">Urgente</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Lista de Tickets */}
                                <div className="space-y-3">
                                    {filteredTickets.map((ticket) => (
                                        <Card
                                            key={ticket.id}
                                            className={`cursor-pointer transition-all hover:shadow-md ${selectedTicket?.id === ticket.id ? 'ring-2 ring-blue-500' : ''
                                                }`}
                                            onClick={() => setSelectedTicket(ticket)}
                                        >
                                            <CardContent className="p-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{ticket.id}</span>
                                                        <div className="flex items-center space-x-1">
                                                            <Badge className={getPriorityColor(ticket.priority)}>
                                                                {ticket.priority}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    <h4 className="font-semibold text-sm line-clamp-2">{ticket.title}</h4>

                                                    <div className="flex items-center justify-between">
                                                        <Badge className={getStatusColor(ticket.status)}>
                                                            {getStatusIcon(ticket.status)}
                                                            <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            {/* Detalhes do Ticket */}
                            <div className="lg:col-span-2">
                                {selectedTicket ? (
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle className="flex items-center">
                                                        {getStatusIcon(selectedTicket.status)}
                                                        <span className="ml-2">{selectedTicket.title}</span>
                                                    </CardTitle>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Ticket #{selectedTicket.id} • Criado em {new Date(selectedTicket.createdAt).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                                                        {selectedTicket.priority}
                                                    </Badge>
                                                    <Badge className={getStatusColor(selectedTicket.status)}>
                                                        {selectedTicket.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Mensagens */}
                                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                                {selectedTicket.messages.map((message) => (
                                                    <div
                                                        key={message.id}
                                                        className={`flex ${message.isSupport ? 'justify-start' : 'justify-end'}`}
                                                    >
                                                        <div className={`max-w-[80%] p-3 rounded-lg ${message.isSupport
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'bg-gray-50 border border-gray-200'
                                                            }`}>
                                                            <div className="flex items-center space-x-2 mb-2">
                                                                <User className="w-4 h-4" />
                                                                <span className="font-medium text-sm">{message.author}</span>
                                                                {message.isSupport && (
                                                                    <Badge variant="secondary" className="text-xs">Suporte</Badge>
                                                                )}
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(message.timestamp).toLocaleString('pt-BR')}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm">{message.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Resposta */}
                                            {selectedTicket.status !== 'closed' && (
                                                <div className="space-y-3 border-t pt-4">
                                                    <Label>Sua Resposta</Label>
                                                    <Textarea
                                                        placeholder="Digite sua mensagem..."
                                                        value={replyMessage}
                                                        onChange={(e) => setReplyMessage(e.target.value)}
                                                        rows={3}
                                                    />
                                                    <div className="flex items-center justify-between">
                                                        <Button variant="outline" size="sm">
                                                            <Paperclip className="w-4 h-4 mr-2" />
                                                            Anexar Arquivo
                                                        </Button>
                                                        <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Enviar Resposta
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Avaliação (se resolvido) */}
                                            {selectedTicket.status === 'resolved' && !selectedTicket.rating && (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <h4 className="font-semibold text-green-800 mb-2">Avalie nosso atendimento</h4>
                                                    <p className="text-sm text-green-700 mb-3">
                                                        Seu ticket foi resolvido. Como você avalia nosso suporte?
                                                    </p>
                                                    <div className="flex items-center space-x-2">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                className="w-5 h-5 text-yellow-400 cursor-pointer hover:fill-current"
                                                            />
                                                        ))}
                                                        <Button size="sm" className="ml-4">
                                                            Avaliar
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardContent className="p-8 text-center">
                                            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                            <h3 className="text-lg font-semibold mb-2">Selecione um ticket</h3>
                                            <p className="text-muted-foreground">
                                                Escolha um ticket da lista para ver os detalhes e histórico de mensagens.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="knowledge" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <FileText className="w-5 h-5 mr-2" />
                                        Guias de Uso
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Documentação completa sobre como usar cada módulo do sistema.
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Acessar Guias
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <MessageCircle className="w-5 h-5 mr-2" />
                                        Perguntas Frequentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Respostas para as dúvidas mais comuns dos usuários.
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Ver FAQ
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Zap className="w-5 h-5 mr-2" />
                                        Solução de Problemas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Guias para resolver os problemas mais comuns do sistema.
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full">
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Troubleshooting
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="contact" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Phone className="w-5 h-5 mr-2" />
                                        Suporte por Telefone
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="font-medium">Suporte Técnico</p>
                                        <p className="text-2xl font-bold text-blue-600">(11) 9999-9999</p>
                                        <p className="text-sm text-muted-foreground">
                                            Segunda a Sexta: 8h às 18h<br />
                                            Sábado: 8h às 12h
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-medium">Emergências 24h</p>
                                        <p className="text-xl font-bold text-red-600">(11) 8888-8888</p>
                                        <p className="text-sm text-muted-foreground">
                                            Para problemas críticos que impedem o funcionamento do sistema
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Mail className="w-5 h-5 mr-2" />
                                        Suporte por E-mail
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="font-medium">Suporte Geral</p>
                                        <p className="text-lg font-bold text-blue-600">suporte@fluxbus.com</p>
                                        <p className="text-sm text-muted-foreground">
                                            Resposta em até 4 horas úteis
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-medium">Suporte Técnico</p>
                                        <p className="text-lg font-bold text-green-600">tecnico@fluxbus.com</p>
                                        <p className="text-sm text-muted-foreground">
                                            Para problemas técnicos específicos
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="font-medium">Comercial</p>
                                        <p className="text-lg font-bold text-purple-600">comercial@fluxbus.com</p>
                                        <p className="text-sm text-muted-foreground">
                                            Dúvidas sobre planos e contratação
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Nova aba: Mensagens Internas */}
                    <TabsContent value="internal-messages">
                        <InternalMessagingSystem />
                    </TabsContent>

                    {/* Nova aba: Atendimento Chatbot */}
                    <TabsContent value="chatbot-service">
                        <ChatbotServiceIntegration />
                    </TabsContent>

                    {/* Nova aba: Notificações Tempo Real */}
                    <TabsContent value="notificacoes">
                        <RealTimeNotifications />
                    </TabsContent>
                </Tabs>

                {/* Modal de Novo Ticket */}
                {showNewTicketForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <Card className="w-full max-w-2xl mx-4">
                            <CardHeader>
                                <CardTitle>Criar Novo Ticket</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Título</Label>
                                    <Input
                                        placeholder="Descreva brevemente o problema ou dúvida"
                                        value={newTicket.title}
                                        onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Categoria</Label>
                                        <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bug">🐛 Bug/Erro</SelectItem>
                                                <SelectItem value="feature">✨ Nova Funcionalidade</SelectItem>
                                                <SelectItem value="question">❓ Dúvida</SelectItem>
                                                <SelectItem value="technical">🔧 Problema Técnico</SelectItem>
                                                <SelectItem value="account">👤 Conta/Acesso</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Prioridade</Label>
                                        <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({ ...newTicket, priority: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">🟢 Baixa</SelectItem>
                                                <SelectItem value="medium">🟡 Média</SelectItem>
                                                <SelectItem value="high">🟠 Alta</SelectItem>
                                                <SelectItem value="urgent">🔴 Urgente</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <Label>Descrição Detalhada</Label>
                                    <Textarea
                                        placeholder="Descreva o problema ou dúvida com o máximo de detalhes possível..."
                                        value={newTicket.description}
                                        onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        rows={5}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <Button variant="outline" onClick={() => setShowNewTicketForm(false)}>
                                        Cancelar
                                    </Button>
                                    <div className="flex items-center space-x-2">
                                        <Button variant="outline">
                                            <Paperclip className="w-4 h-4 mr-2" />
                                            Anexar Arquivo
                                        </Button>
                                        <Button onClick={handleCreateTicket}>
                                            <Send className="w-4 h-4 mr-2" />
                                            Criar Ticket
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}