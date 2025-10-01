import { useState, useEffect, useCallback } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { messageService } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';

export const useNotificationBell = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const {
    systemMessages,
    unreadSystemCount,
    setSystemMessages,
    updateSystemMessage,
    addSystemMessage,
    setLoading: setStoreLoading
  } = useMessageStore();

  // Carregar mensagens
  const loadMessages = useCallback(async (page = 0, size = 20) => {
    try {
      setIsLoading(true);
      setStoreLoading(true);
      
      const result = await messageService.getSystemMessages(page, size);
      setSystemMessages(result.messages);
      setLastUpdate(new Date());
      
      return result;
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar mensagens",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
      setStoreLoading(false);
    }
  }, [setSystemMessages, setStoreLoading, toast]);

  // Carregar contagem de não lidas
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await messageService.getUnreadSystemCount();
      // A contagem será calculada a partir das mensagens no store
      return count;
    } catch (error) {
      console.error('Erro ao carregar contagem de mensagens:', error);
      return 0;
    }
  }, []);

  // Marcar mensagem como lida
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await messageService.markSystemMessageAsRead(messageId);
      updateSystemMessage(messageId, { 
        status: 'read', 
        readAt: new Date().toISOString() 
      });
      
      toast({
        title: "Sucesso",
        description: "Mensagem marcada como lida",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao marcar mensagem como lida:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar mensagem como lida",
        variant: "destructive"
      });
      throw error;
    }
  }, [updateSystemMessage, toast]);

  // Marcar todas as mensagens como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadMessages = systemMessages.filter(msg => msg.status === 'UNREAD');
      
      if (unreadMessages.length === 0) {
        toast({
          title: "Info",
          description: "Não há mensagens não lidas",
          variant: "default"
        });
        return;
      }

      setIsLoading(true);
      
      // Marcar todas como lidas em paralelo
      const promises = unreadMessages.map(async (message) => {
        await messageService.markSystemMessageAsRead(message.id);
        updateSystemMessage(message.id, { 
          status: 'read', 
          readAt: new Date().toISOString() 
        });
      });

      await Promise.all(promises);
      
      toast({
        title: "Sucesso",
        description: `${unreadMessages.length} mensagens marcadas como lidas`,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao marcar mensagens como lidas",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [systemMessages, updateSystemMessage, toast]);

  // Atualizar mensagens periodicamente
  useEffect(() => {
    const updateInterval = setInterval(async () => {
      try {
        await loadUnreadCount();
        
        // Se faz mais de 5 minutos desde a última atualização, recarregar mensagens
        const now = new Date();
        const diffInMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        
        if (diffInMinutes > 5) {
          await loadMessages(0, 10); // Carregar apenas as 10 mais recentes
        }
      } catch (error) {
        console.warn('Backend indisponível, tentando novamente em 2 minutos');
      }
    }, 120000); // A cada 2 minutos quando há problemas

    return () => clearInterval(updateInterval);
  }, [lastUpdate, loadMessages, loadUnreadCount]);

  // Calcular contagem de não lidas a partir do store
  const unreadCount = systemMessages.filter(msg => msg.status === 'UNREAD').length;

  // Utilitários para formatação
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes <= 0 ? 'Agora' : `${diffInMinutes}m atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  }, []);

  const getPriorityConfig = useCallback((priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          color: 'text-red-500',
          bg: 'bg-red-500/10 border-red-500/20',
          label: 'Urgente'
        };
      case 'HIGH':
        return {
          color: 'text-orange-500',
          bg: 'bg-orange-500/10 border-orange-500/20',
          label: 'Alta'
        };
      case 'NORMAL':
        return {
          color: 'text-blue-500',
          bg: 'bg-blue-500/10 border-blue-500/20',
          label: 'Normal'
        };
      case 'LOW':
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-500/10 border-gray-500/20',
          label: 'Baixa'
        };
      default:
        return {
          color: 'text-gray-500',
          bg: 'bg-gray-500/10 border-gray-500/20',
          label: 'Normal'
        };
    }
  }, []);

  return {
    // Estado
    systemMessages,
    unreadCount,
    isLoading,
    lastUpdate,

    // Ações
    loadMessages,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,

    // Utilitários
    formatDate,
    getPriorityConfig
  };
};

export default useNotificationBell;