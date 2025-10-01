import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
    Bell,
    BellRing,
    Settings,
    Mail,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    X,
    Volume2,
    VolumeX,
    Clock,
    Users,
    Building,
    Zap,
    Send,
    Filter,
    Search
} from 'lucide-react';

interface DepartmentNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'message' | 'urgent';
    fromDepartment: string;
    toDepartment: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    timestamp: string;
    read: boolean;
    actionRequired?: boolean;
    sender: string;
    category: 'email' | 'system' | 'alert' | 'message' | 'task';
    attachments?: string[];
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    departmentFilter: string[];
    priorityFilter: string[];
    autoMarkAsRead: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
    };
}

const RealTimeNotifications: React.FC = () => {
    const [notifications, setNotifications] = useState<DepartmentNotification[]>([
        {
            id: '1',
            title: 'Incidente de Segurança Crítico',
            message: 'Detectada tentativa de acesso não autorizado no setor A. Ação imediata necessária.',
            type: 'urgent',
            fromDepartment: 'Segurança',
            toDepartment: 'TI',
            priority: 'urgent',
            timestamp: '2024-01-15T10:30:00Z',
            read: false,
            actionRequired: true,
            sender: 'João Silva - Supervisor de Segurança',
            category: 'alert'
        },
        {
            id: '2',
            title: 'Solicitação de Suporte Técnico',
            message: 'Sistema de ponto eletrônico apresentando falhas. Funcionários não conseguem registrar entrada.',
            type: 'warning',
            fromDepartment: 'RH',
            toDepartment: 'TI',
            priority: 'high',
            timestamp: '2024-01-15T09:45:00Z',
            read: false,
            actionRequired: true,
            sender: 'Maria Santos - Analista de RH',
            category: 'message'
        },
        {
            id: '3',
            title: 'Aprovação de Orçamento',
            message: 'Orçamento para aquisição de novos equipamentos de segurança foi aprovado.',
            type: 'success',
            fromDepartment: 'Financeiro',
            toDepartment: 'Segurança',
            priority: 'medium',
            timestamp: '2024-01-15T08:20:00Z',
            read: true,
            sender: 'Carlos Oliveira - Gerente Financeiro',
            category: 'email'
        },
        {
            id: '4',
            title: 'Manutenção Programada',
            message: 'Manutenção dos servidores agendada para este final de semana. Sistema ficará indisponível.',
            type: 'info',
            fromDepartment: 'TI',
            toDepartment: 'Todos',
            priority: 'medium',
            timestamp: '2024-01-15T07:15:00Z',
            read: false,
            sender: 'Pedro Costa - Administrador de Sistemas',
            category: 'system'
        },
        {
            id: '5',
            title: 'Relatório Mensal Concluído',
            message: 'Relatório de atividades operacionais do mês foi finalizado e está disponível.',
            type: 'success',
            fromDepartment: 'Operacional',
            toDepartment: 'Gerência',
            priority: 'low',
            timestamp: '2024-01-14T16:30:00Z',
            read: true,
            sender: 'Ana Paula - Coordenadora Operacional',
            category: 'task'
        }
    ]);

    const [settings, setSettings] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        soundEnabled: true,
        departmentFilter: [],
        priorityFilter: [],
        autoMarkAsRead: false,
        notificationFrequency: 'immediate',
        quietHours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
        }
    });

    const [showSettings, setShowSettings] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('all');

    const departments = ['Segurança', 'TI', 'RH', 'Financeiro', 'Operacional', 'Gerência', 'Suporte'];
    const priorities = ['low', 'medium', 'high', 'urgent'];

    const unreadCount = notifications.filter(n => !n.read).length;
    const urgentCount = notifications.filter(n => n.priority === 'urgent' && !n.read).length;
    const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'urgent': return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <X className="w-5 h-5 text-red-500" />;
            case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'bg-red-600 text-white';
            case 'high': return 'bg-orange-500 text-white';
            case 'medium': return 'bg-yellow-500 text-black';
            case 'low': return 'bg-green-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'email': return <Mail className="w-4 h-4" />;
            case 'alert': return <AlertTriangle className="w-4 h-4" />;
            case 'message': return <MessageSquare className="w-4 h-4" />;
            case 'task': return <CheckCircle className="w-4 h-4" />;
            default: return <Bell className="w-4 h-4" />;
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Agora mesmo';
        if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h atrás`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d atrás`;
        
        return date.toLocaleDateString('pt-BR');
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const filteredNotifications = notifications.filter(notification => {
        // Filtro por status
        if (filter === 'unread' && notification.read) return false;
        if (filter === 'urgent' && notification.priority !== 'urgent') return false;
        if (filter === 'action' && !notification.actionRequired) return false;
        
        // Filtro por departamento
        if (selectedDepartment !== 'all' && 
            notification.fromDepartment !== selectedDepartment && 
            notification.toDepartment !== selectedDepartment) return false;
        
        // Filtro por busca
        if (searchTerm && !(
            notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.sender.toLowerCase().includes(searchTerm.toLowerCase())
        )) return false;
        
        return true;
    });

    // Simular notificações em tempo real
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.85) { // 15% de chance a cada 15 segundos
                const randomDepartments = departments.filter(d => d !== 'Todos');
                const fromDept = randomDepartments[Math.floor(Math.random() * randomDepartments.length)];
                const toDept = randomDepartments[Math.floor(Math.random() * randomDepartments.length)];
                
                const newNotification: DepartmentNotification = {
                    id: Date.now().toString(),
                    title: 'Nova Notificação Interdepartamental',
                    message: `Mensagem automática do departamento ${fromDept} para ${toDept}`,
                    type: 'info',
                    fromDepartment: fromDept,
                    toDepartment: toDept,
                    priority: priorities[Math.floor(Math.random() * priorities.length)] as any,
                    timestamp: new Date().toISOString(),
                    read: false,
                    sender: 'Sistema Automático',
                    category: 'system'
                };
                
                setNotifications(prev => [newNotification, ...prev]);
                
                // Tocar som se habilitado
                if (settings.soundEnabled) {
                    console.log('🔔 Nova notificação interdepartamental!');
                }
            }
        }, 15000); // A cada 15 segundos

        return () => clearInterval(interval);
    }, [settings.soundEnabled]);

    return (
        <div className="space-y-6">
            {/* Header com estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="text-2xl font-bold">{notifications.length}</p>
                            </div>
                            <Bell className="w-8 h-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Não Lidas</p>
                                <p className="text-2xl font-bold text-orange-500">{unreadCount}</p>
                            </div>
                            <BellRing className="w-8 h-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Urgentes</p>
                                <p className="text-2xl font-bold text-red-500">{urgentCount}</p>
                            </div>
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Requer Ação</p>
                                <p className="text-2xl font-bold text-purple-500">{actionRequiredCount}</p>
                            </div>
                            <Zap className="w-8 h-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Departamentos</p>
                                <p className="text-2xl font-bold">{departments.length}</p>
                            </div>
                            <Building className="w-8 h-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Controles e Filtros */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center">
                            <Zap className="w-5 h-5 mr-2" />
                            Notificações Interdepartamentais em Tempo Real
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Configurações
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={markAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                Marcar Todas como Lidas
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Buscar notificações..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Notificações</SelectItem>
                                <SelectItem value="unread">Não Lidas ({unreadCount})</SelectItem>
                                <SelectItem value="urgent">Urgentes ({urgentCount})</SelectItem>
                                <SelectItem value="action">Requer Ação ({actionRequiredCount})</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filtrar por departamento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Departamentos</SelectItem>
                                {departments.map(dept => (
                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        <Button variant="outline" className="flex items-center">
                            <Filter className="w-4 h-4 mr-2" />
                            Filtros Avançados
                        </Button>
                    </div>

                    {/* Configurações */}
                    {showSettings && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg">Configurações de Notificação Interdepartamental</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Preferências de Notificação</h4>
                                        
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="email-notifications">Notificações por Email</Label>
                                            <Switch
                                                id="email-notifications"
                                                checked={settings.emailNotifications}
                                                onCheckedChange={(checked) => 
                                                    setSettings(prev => ({ ...prev, emailNotifications: checked }))
                                                }
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="push-notifications">Notificações Push</Label>
                                            <Switch
                                                id="push-notifications"
                                                checked={settings.pushNotifications}
                                                onCheckedChange={(checked) => 
                                                    setSettings(prev => ({ ...prev, pushNotifications: checked }))
                                                }
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="sound-enabled">Som de Notificação</Label>
                                            <Switch
                                                id="sound-enabled"
                                                checked={settings.soundEnabled}
                                                onCheckedChange={(checked) => 
                                                    setSettings(prev => ({ ...prev, soundEnabled: checked }))
                                                }
                                            />
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="auto-read">Marcar como Lida Automaticamente</Label>
                                            <Switch
                                                id="auto-read"
                                                checked={settings.autoMarkAsRead}
                                                onCheckedChange={(checked) => 
                                                    setSettings(prev => ({ ...prev, autoMarkAsRead: checked }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Configurações Avançadas</h4>
                                        
                                        <div>
                                            <Label>Frequência de Notificações</Label>
                                            <Select 
                                                value={settings.notificationFrequency} 
                                                onValueChange={(value: any) => 
                                                    setSettings(prev => ({ ...prev, notificationFrequency: value }))
                                                }
                                            >
                                                <SelectTrigger className="w-full mt-2">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="immediate">Imediata</SelectItem>
                                                    <SelectItem value="hourly">A cada hora</SelectItem>
                                                    <SelectItem value="daily">Diária</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="quiet-hours">Horário Silencioso</Label>
                                            <Switch
                                                id="quiet-hours"
                                                checked={settings.quietHours.enabled}
                                                onCheckedChange={(checked) => 
                                                    setSettings(prev => ({ 
                                                        ...prev, 
                                                        quietHours: { ...prev.quietHours, enabled: checked }
                                                    }))
                                                }
                                            />
                                        </div>
                                        
                                        {settings.quietHours.enabled && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-sm">Início</Label>
                                                    <Input
                                                        type="time"
                                                        value={settings.quietHours.start}
                                                        onChange={(e) => 
                                                            setSettings(prev => ({ 
                                                                ...prev, 
                                                                quietHours: { ...prev.quietHours, start: e.target.value }
                                                            }))
                                                        }
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm">Fim</Label>
                                                    <Input
                                                        type="time"
                                                        value={settings.quietHours.end}
                                                        onChange={(e) => 
                                                            setSettings(prev => ({ 
                                                                ...prev, 
                                                                quietHours: { ...prev.quietHours, end: e.target.value }
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lista de Notificações */}
                    <div className="space-y-3">
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">Nenhuma notificação encontrada</p>
                                <p className="text-sm">Tente ajustar os filtros ou aguarde novas notificações</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <Card 
                                    key={notification.id} 
                                    className={`transition-all hover:shadow-lg cursor-pointer ${
                                        !notification.read 
                                            ? 'border-l-4 border-l-blue-500 bg-blue-50 shadow-md' 
                                            : 'hover:bg-gray-50'
                                    } ${
                                        notification.priority === 'urgent' 
                                            ? 'border-l-4 border-l-red-500 bg-red-50' 
                                            : ''
                                    }`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-3 flex-1">
                                                <div className="flex-shrink-0">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className={`font-medium truncate ${
                                                            !notification.read ? 'font-bold text-gray-900' : 'text-gray-700'
                                                        }`}>
                                                            {notification.title}
                                                        </h4>
                                                        <Badge 
                                                            className={`text-xs flex-shrink-0 ${getPriorityColor(notification.priority)}`}
                                                        >
                                                            {notification.priority.toUpperCase()}
                                                        </Badge>
                                                        {notification.actionRequired && (
                                                            <Badge variant="destructive" className="text-xs flex-shrink-0">
                                                                Ação Requerida
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                {getCategoryIcon(notification.category)}
                                                                <span className="ml-1 capitalize">{notification.category}</span>
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Building className="w-3 h-3 mr-1" />
                                                                {notification.fromDepartment} → {notification.toDepartment}
                                                            </span>
                                                            <span className="flex items-center">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                {notification.sender}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {formatTimestamp(notification.timestamp)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                {!notification.read && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification.id);
                                                    }}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <X className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                    
                    {/* Paginação */}
                    {filteredNotifications.length > 10 && (
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" disabled>
                                    Anterior
                                </Button>
                                <span className="text-sm text-gray-600">Página 1 de 1</span>
                                <Button variant="outline" size="sm" disabled>
                                    Próxima
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default RealTimeNotifications;