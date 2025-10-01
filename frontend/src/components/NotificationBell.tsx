import React, { useState, useEffect } from 'react';
import { Bell, MessageSquare, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotificationBell } from '@/hooks/useNotificationBell';
import MessageItem from '@/components/MessageItem';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    systemMessages,
    unreadCount,
    isLoading,
    loadMessages,
    markAsRead,
    markAllAsRead,
    formatDate,
    getPriorityConfig
  } = useNotificationBell();

  // Carregar mensagens quando abrir o dropdown
  useEffect(() => {
    if (isOpen && systemMessages.length === 0) {
      loadMessages();
    }
  }, [isOpen, systemMessages.length, loadMessages]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-9 w-9 p-0 hover:bg-seguranca-graphite/50 text-seguranca-lightgray"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-seguranca-red"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-96 max-h-[500px] bg-seguranca-graphite border-gray-600 text-seguranca-lightgray"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-seguranca-yellow" />
            <h3 className="font-semibold text-seguranca-lightgray">Mensagens</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-seguranca-red text-white">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMessages()}
              disabled={isLoading}
              className="text-gray-400 hover:bg-seguranca-black/50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isLoading}
                className="text-seguranca-yellow hover:bg-seguranca-black/50"
              >
                <Check className="h-4 w-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Lista de Mensagens */}
        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-seguranca-yellow mr-2" />
              <div className="text-gray-400">Carregando mensagens...</div>
            </div>
          ) : systemMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-400">
              <MessageSquare className="h-12 w-12 mb-4 text-gray-500" />
              <p className="text-center">Nenhuma mensagem encontrada</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadMessages()}
                className="mt-2 text-seguranca-yellow hover:bg-seguranca-black/50"
              >
                Recarregar
              </Button>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {systemMessages.map((message, index) => (
                <div key={message.id}>
                  <MessageItem
                    message={message}
                    onMarkAsRead={markAsRead}
                    formatDate={formatDate}
                    getPriorityConfig={getPriorityConfig}
                    isCompact={true}
                  />
                  {index < systemMessages.length - 1 && (
                    <Separator className="my-2 bg-gray-600" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {systemMessages.length > 0 && (
          <div className="p-3 border-t border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsOpen(false);
                // Aqui você pode navegar para a página completa de mensagens
                window.location.href = '/mensagens';
              }}
              className="w-full text-seguranca-yellow hover:bg-seguranca-black/50"
            >
              Ver todas as mensagens
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
