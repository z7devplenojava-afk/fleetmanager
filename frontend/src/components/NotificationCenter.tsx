import React, { useEffect, useState } from 'react';
import { Bell, X, MessageCircle, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useMessageStore } from '../stores/messageStore';
import { messageService } from '../services/messageService';

interface Notification {
  id: string;
  type: 'chat' | 'system' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const { 
    unreadSystemCount, 
    getUnreadChatCount,
    chatMessages,
    systemMessages 
  } = useMessageStore();

  const totalUnread = unreadSystemCount + getUnreadChatCount();

  useEffect(() => {
    // Simular notificações baseadas no estado global
    const newNotifications: Notification[] = [];

    // Adicionar notificações de mensagens do sistema não lidas
    systemMessages
      .filter(msg => msg.status === 'UNREAD')
      .slice(0, 5) // Limitar a 5 mais recentes
      .forEach(msg => {
        newNotifications.push({
          id: `system-${msg.id}`,
          type: 'system',
          title: 'Nova mensagem do sistema',
          message: msg.title,
          timestamp: new Date(msg.createdAt),
          read: false,
          actionUrl: '/mensagens'
        });
      });

    // Adicionar notificações de chat não lidas
    chatMessages
      .filter(msg => !msg.isRead)
      .slice(0, 5) // Limitar a 5 mais recentes
      .forEach(msg => {
        newNotifications.push({
          id: `chat-${msg.id}`,
          type: 'chat',
          title: 'Nova mensagem de chat',
          message: `${msg.sender.name}: ${msg.content.substring(0, 50)}...`,
          timestamp: new Date(msg.createdAt),
          read: false,
          actionUrl: '/chat'
        });
      });

    // Ordenar por timestamp (mais recentes primeiro)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setNotifications(newNotifications);
  }, [systemMessages, chatMessages, unreadSystemCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'system':
        return <Bell className="w-4 h-4 text-purple-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== notificationId)
    );
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.actionUrl) {
      // Navegar para a URL da ação
      window.location.href = notification.actionUrl;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  return (
    <div className="relative">
      {/* Botão de notificação */}
      <button 
        className="relative p-2 rounded-full hover:bg-seguranca-black transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="text-seguranca-lightgray hover:text-seguranca-yellow" size={20} />
        {totalUnread > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-seguranca-red rounded-full text-xs flex items-center justify-center text-white">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg border bg-white dark:bg-seguranca-graphite dark:border-gray-700">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-seguranca-lightgray">Notificações</h3>
                <div className="flex items-center space-x-2">
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma notificação</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-600'
                              }`}>
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>

            {notifications.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsOpen(false);
                    // Navegar para página de notificações completa
                    window.location.href = '/notificacoes';
                  }}
                >
                  Ver todas as notificações
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Overlay para fechar quando clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationCenter;