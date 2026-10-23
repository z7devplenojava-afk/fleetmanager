import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Check, RefreshCw, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotificationBell } from '@/hooks/useNotificationBell';
import MessageItem from '@/components/MessageItem';
import '@/styles/notifications.css';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hasLoadedRef = useRef(false);
  const navigate = useNavigate();

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
        aria-label="Abrir notificações"
        className={`relative h-11 w-11 p-0 hover:bg-accent active:scale-95 text-muted-foreground transition-all duration-200 ${
          isAnimating ? 'animate-pulse' : ''
        }`}
      >
        <Bell className={`h-5 w-5 transition-transform duration-200 ${isAnimating ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute top-1 right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-red-600 shadow-lg animate-pulse border-2 border-card font-bold"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Backdrop transparente/escuro no mobile para fechamento fácil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10040] sm:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <div
          className="fixed left-3 right-3 top-16 sm:static sm:inset-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 z-[10050] mx-auto max-w-[420px] sm:w-[400px] max-h-[85vh] sm:max-h-[600px] flex flex-col bg-background/95 border border-border/80 text-foreground shadow-2xl backdrop-blur-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-border/80 bg-card/60 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <MessageSquare size={19} />
                </div>
                <div>
                  <h3 className="font-bold text-base tracking-tight text-foreground">Notificações</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {unreadCount > 0 ? (
                      <span className="text-xs font-semibold text-primary">
                        {unreadCount} {unreadCount === 1 ? 'nova mensagem' : 'novas mensagens'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Nenhuma não lida</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  title="Atualizar"
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60"
                >
                  <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={isLoading}
                    className="h-9 px-2.5 text-xs font-bold text-primary hover:bg-primary/15 rounded-lg"
                  >
                    <Check size={14} className="mr-1" />
                    Lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground sm:hidden"
                  title="Fechar"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          </div>

          {/* Body com padding agradável e espaço entre os cards */}
          <div className="flex-1 max-h-[calc(80vh-130px)] sm:max-h-[380px] overflow-y-auto p-3 space-y-2.5 overscroll-contain">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-12 opacity-60">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
                <div className="text-xs font-medium text-muted-foreground">Sincronizando mensagens...</div>
              </div>
            ) : systemMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <div className="p-4 rounded-full bg-accent/60 mb-3">
                  <Bell size={28} className="opacity-40" />
                </div>
                <p className="text-sm font-medium">Tudo limpo por aqui!</p>
                <p className="text-xs text-muted-foreground mt-1">Você não possui novas notificações</p>
              </div>
            ) : (
              systemMessages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onMarkAsRead={markAsRead}
                  formatDate={formatDate}
                  getPriorityConfig={getPriorityConfig}
                  isCompact={true}
                  onNavigate={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer com link direto para Gestão de Mensagens */}
          {systemMessages.length > 0 && (
            <div className="p-3 border-t border-border/80 bg-card/60 backdrop-blur-md flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/mensagens');
                }}
                className="w-full h-9 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span>VER TODAS AS MENSAGENS</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
