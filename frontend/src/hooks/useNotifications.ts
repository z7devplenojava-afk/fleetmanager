import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'MESSAGE' | 'EMAIL' | 'SYSTEM' | 'TICKET' | 'ALERT';
  title: string;
  message: string;
  sender?: string;
  timestamp: string;
  read: boolean;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  actionUrl?: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Mock data para demonstração - em produção, buscar da API
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'MESSAGE',
          title: 'Nova mensagem de João Silva',
          message: 'Olá! Preciso de ajuda com o relatório mensal...',
          sender: 'João Silva',
          timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min atrás
          read: false,
          priority: 'NORMAL',
          actionUrl: '/chat-interno'
        },
        {
          id: '2',
          type: 'EMAIL',
          title: 'Email de cliente importante',
          message: 'Recebemos uma solicitação urgente do cliente ABC...',
          sender: 'Sistema de Email',
          timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min atrás
          read: false,
          priority: 'HIGH',
          actionUrl: '/mensagens'
        },
        {
          id: '3',
          type: 'TICKET',
          title: 'Novo ticket de suporte',
          message: 'Ticket #1234 criado por Maria Santos',
          sender: 'Sistema de Tickets',
          timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min atrás
          read: true,
          priority: 'NORMAL',
          actionUrl: '/gestao-atendimento/tickets'
        },
        {
          id: '4',
          type: 'SYSTEM',
          title: 'Backup do sistema concluído',
          message: 'O backup automático foi executado com sucesso',
          sender: 'Sistema',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hora atrás
          read: true,
          priority: 'LOW'
        },
        {
          id: '5',
          type: 'ALERT',
          title: 'Alerta de estoque baixo',
          message: 'O produto "Equipamento de Segurança" está com estoque baixo',
          sender: 'Sistema de Estoque',
          timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 horas atrás
          read: false,
          priority: 'HIGH',
          actionUrl: '/estoque-simplificado'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      // Em produção, chamar API para marcar como lida
      // await api.markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );

      // Em produção, chamar API para marcar todas como lidas
      // await api.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, []);

  // Adicionar nova notificação
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  // Remover notificação
  const removeNotification = useCallback(async (notificationId: string) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Em produção, chamar API para remover notificação
      // await api.deleteNotification(notificationId);
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
    }
  }, []);

  // Atualizar contador de não lidas
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Carregar notificações iniciais
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Simular notificações em tempo real (para demonstração)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Simular nova notificação a cada 30 segundos (apenas para demonstração)
      const shouldAddNotification = Math.random() < 0.1; // 10% de chance
      
      if (shouldAddNotification) {
        const types: Notification['type'][] = ['MESSAGE', 'EMAIL', 'TICKET', 'SYSTEM', 'ALERT'];
        const priorities: Notification['priority'][] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
        
        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        
        const mockSenders = ['João Silva', 'Maria Santos', 'Sistema', 'Cliente ABC', 'Sistema de Estoque'];
        const randomSender = mockSenders[Math.floor(Math.random() * mockSenders.length)];
        
        const mockMessages = [
          'Nova mensagem recebida',
          'Email importante aguardando',
          'Ticket de suporte criado',
          'Atualização do sistema',
          'Alerta de segurança'
        ];
        
        const randomMessage = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        
        addNotification({
          type: randomType,
          title: `${randomMessage} - ${randomSender}`,
          message: `Detalhes da ${randomMessage.toLowerCase()}...`,
          sender: randomSender,
          priority: randomPriority
        });
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [user, addNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    loadNotifications
  };
};
