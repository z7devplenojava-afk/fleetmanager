import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, MessageSquare, Check, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificationBell } from '@/hooks/useNotificationBell';
import MessageItem from '@/components/MessageItem';
import '@/styles/notifications.css';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasLoadedRef = useRef(false);

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

  useEffect(() => {
    if (isOpen && systemMessages.length === 0 && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadMessages();
    }
    if (!isOpen) {
      hasLoadedRef.current = false;
    }
  }, [isOpen, systemMessages.length, loadMessages]);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleRefresh = async () => {
    await loadMessages();
  };

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-popover-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative notification-popover-container">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className={`relative h-11 w-11 p-0 hover:bg-accent active:scale-95 text-muted-foreground transition-all duration-200 ${isAnimating ? 'animate-pulse' : ''
          }`}
      >
        <Bell className={`h-5 w-5 transition-transform duration-200 ${isAnimating ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-1 right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-600 shadow-lg animate-pulse border-2 border-card"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-[10050] w-[320px] sm:w-[400px] max-h-[600px] bg-background border border-border text-foreground shadow-2xl backdrop-blur-md rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200"
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-9 w-9 text-muted-foreground hover:text-primary"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="h-9 text-xs font-bold text-primary hover:bg-primary/10"
                  >
                    <Check size={14} className="mr-1" />
                    Lidas
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[350px] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 opacity-50">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-4" />
                <div className="text-xs font-medium">Sincronizando...</div>
              </div>
            ) : systemMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <div className="p-4 rounded-full bg-accent mb-4">
                  <Bell size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium">Tudo limpo por aqui!</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {systemMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    onMarkAsRead={markAsRead}
                    formatDate={formatDate}
                    getPriorityConfig={getPriorityConfig}
                    isCompact={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {systemMessages.length > 0 && (
            <div className="p-3 border-t border-border bg-card/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/mensagens';
                }}
                className="w-full text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                VER TUDO
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
