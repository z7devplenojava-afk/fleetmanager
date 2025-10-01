import React, { createContext, useContext, useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
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

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, removeNotification, markAllAsRead, clearAll } = useNotifications();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-seguranca-black border-gray-600 text-seguranca-lightgray">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-seguranca-red text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-seguranca-graphite border-gray-600" align="end">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-seguranca-lightgray">Notificações</h4>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-seguranca-lightgray hover:text-white"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-400 hover:text-red-300"
              onClick={clearAll}
            >
              Limpar
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notification.read
                      ? 'bg-seguranca-black border-gray-700'
                      : 'bg-seguranca-black border-gray-600'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          notification.read ? 'text-gray-400' : 'text-seguranca-lightgray'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        {notification.action && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs mt-2 text-seguranca-red hover:text-seguranca-darkred"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action!.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

// Hook para criar notificações comerciais
export const useCommercialNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyNewLead = (leadName: string, company: string) => {
    addNotification({
      type: 'info',
      title: 'Novo Lead',
      message: `${leadName} da empresa ${company} foi adicionado como novo lead.`,
      action: {
        label: 'Ver Lead',
        onClick: () => window.location.href = '/leads'
      }
    });
  };

  const notifyProposalStatusChange = (proposalNumber: string, status: string) => {
    addNotification({
      type: 'success',
      title: 'Status da Proposta Atualizado',
      message: `A proposta ${proposalNumber} foi atualizada para ${status}.`,
      action: {
        label: 'Ver Proposta',
        onClick: () => window.location.href = '/propostas'
      }
    });
  };

  const notifyQuoteExpiring = (quoteNumber: string, daysLeft: number) => {
    addNotification({
      type: 'warning',
      title: 'Orçamento Expirando',
      message: `O orçamento ${quoteNumber} expira em ${daysLeft} dias.`,
      action: {
        label: 'Ver Orçamento',
        onClick: () => window.location.href = '/orcamentos'
      }
    });
  };

  const notifyProposalConverted = (proposalNumber: string, clientName: string) => {
    addNotification({
      type: 'success',
      title: 'Proposta Convertida!',
      message: `A proposta ${proposalNumber} foi convertida para o cliente ${clientName}.`,
      action: {
        label: 'Ver Contrato',
        onClick: () => window.location.href = '/contratos'
      }
    });
  };

  return {
    notifyNewLead,
    notifyProposalStatusChange,
    notifyQuoteExpiring,
    notifyProposalConverted
  };
}; 