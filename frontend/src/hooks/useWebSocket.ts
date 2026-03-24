import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useMessageStore } from '../stores/messageStore';
import { ChatMessage } from '../stores/messageStore';

interface WebSocketConfig {
  token: string;
  username: string;
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (typing: { userId: string; isTyping: boolean }) => void;
  onUserStatus?: (event: { userId: string; isOnline: boolean; timestamp?: number }) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const {
    setWsConnection,
    setIsConnected,
    addChatMessage,
    addTypingUser,
    removeTypingUser,
    setError
  } = useMessageStore();

  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('[WebSocket] Já conectado');
      return;
    }

    // Evitar múltiplas conexões simultâneas
    if (clientRef.current) {
      console.log('[WebSocket] Limpando conexão anterior...');
      clientRef.current.deactivate();
      clientRef.current = null;
    }

    console.log('[WebSocket] Iniciando conexão...');
    
    try {
      const socket = new SockJS('/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          'Authorization': `Bearer ${config.token}`,
          'X-Username': config.username
        },
        debug: (str) => {
          // Reduzir logs de debug para evitar spam
          if (str.includes('ERROR') || str.includes('CONNECTED') || str.includes('DISCONNECTED')) {
            console.log('[WebSocket Debug]', str);
          }
        },
        reconnectDelay: reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = (frame) => {
        console.log('[WebSocket] Conectado:', frame);
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setError(null);
        config.onConnect?.();

        // Subscrever aos tópicos de mensagens individuais
        client.subscribe(`/user/${config.username}/queue/messages`, (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            // Garantir que todas as informações do arquivo sejam preservadas
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };
            console.log('[WebSocket] Nova mensagem recebida (individual):', chatMessage);
            
            // Log detalhado para mensagens com arquivo
            if (chatMessage.fileUrl) {
              console.log('📎 Mensagem com arquivo recebida (individual):', {
                id: chatMessage.id,
                type: chatMessage.type,
                fileUrl: chatMessage.fileUrl,
                fileName: chatMessage.fileName,
                fileSize: chatMessage.fileSize,
                fileContentType: chatMessage.fileContentType
              });
            }
            
            addChatMessage(chatMessage);
            config.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem:', error);
          }
        });

        // Subscrever a tópicos de grupos (se o usuário estiver em grupos)
        client.subscribe('/topic/chat/group/*', (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            // Garantir que todas as informações do arquivo sejam preservadas
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };
            console.log('[WebSocket] Nova mensagem recebida (grupo):', chatMessage);
            
            // Log detalhado para mensagens com arquivo
            if (chatMessage.fileUrl) {
              console.log('📎 Mensagem com arquivo recebida (grupo):', {
                id: chatMessage.id,
                type: chatMessage.type,
                fileUrl: chatMessage.fileUrl,
                fileName: chatMessage.fileName,
                fileSize: chatMessage.fileSize,
                fileContentType: chatMessage.fileContentType
              });
            }
            
            addChatMessage(chatMessage);
            config.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem de grupo:', error);
          }
        });

        // Subscrever a tópicos de departamentos (se o usuário estiver em departamentos)
        client.subscribe('/topic/chat/department/*', (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            // Garantir que todas as informações do arquivo sejam preservadas
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };
            console.log('[WebSocket] Nova mensagem recebida (departamento):', chatMessage);
            
            // Log detalhado para mensagens com arquivo
            if (chatMessage.fileUrl) {
              console.log('📎 Mensagem com arquivo recebida (departamento):', {
                id: chatMessage.id,
                type: chatMessage.type,
                fileUrl: chatMessage.fileUrl,
                fileName: chatMessage.fileName,
                fileSize: chatMessage.fileSize,
                fileContentType: chatMessage.fileContentType
              });
            }
            
            addChatMessage(chatMessage);
            config.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem de departamento:', error);
          }
        });

        // Subscrever aos eventos de digitação
        client.subscribe(`/user/${config.username}/queue/typing`, (message) => {
          try {
            const typingEvent = JSON.parse(message.body);
            console.log('[WebSocket] Evento de digitação:', typingEvent);
            
            if (typingEvent.isTyping) {
              addTypingUser(typingEvent.userId);
              // Remove automaticamente após 3 segundos
              setTimeout(() => removeTypingUser(typingEvent.userId), 3000);
            } else {
              removeTypingUser(typingEvent.userId);
            }
            
            config.onTyping?.(typingEvent);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar evento de digitação:', error);
          }
        });

        // Subscrever a notificações gerais
        client.subscribe(`/user/${config.username}/queue/notifications`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            console.log('[WebSocket] Notificação recebida:', notification);
            // TODO: Implementar notificações do sistema
          } catch (error) {
            console.error('[WebSocket] Erro ao processar notificação:', error);
          }
        });

        // Subscrever a eventos de status de usuário (online/offline)
        client.subscribe(`/user/${config.username}/queue/user-status`, (message) => {
          try {
            const userStatusEvent = JSON.parse(message.body);
            console.log('[WebSocket] Evento de status de usuário:', userStatusEvent);
            // Atualizar o status online/offline no store
            const { updateUserStatus } = useMessageStore.getState();
            if (updateUserStatus && userStatusEvent.userId) {
              updateUserStatus(userStatusEvent.userId, userStatusEvent.isOnline);
            }
            if (userStatusEvent?.userId) {
              config.onUserStatus?.({
                userId: userStatusEvent.userId,
                isOnline: Boolean(userStatusEvent.isOnline),
                timestamp: userStatusEvent.timestamp
              });
            }
          } catch (error) {
            console.error('[WebSocket] Erro ao processar evento de status de usuário:', error);
          }
        });

        // Subscrever a tópico público de status de usuários (broadcast)
        client.subscribe('/topic/user-status', (message) => {
          try {
            const userStatusEvent = JSON.parse(message.body);
            console.log('[WebSocket] Broadcast de status de usuário:', userStatusEvent);
            // Atualizar o status online/offline no store
            const { updateUserStatus } = useMessageStore.getState();
            if (updateUserStatus && userStatusEvent.userId) {
              updateUserStatus(userStatusEvent.userId, userStatusEvent.isOnline);
            }
            if (userStatusEvent?.userId) {
              config.onUserStatus?.({
                userId: userStatusEvent.userId,
                isOnline: Boolean(userStatusEvent.isOnline),
                timestamp: userStatusEvent.timestamp
              });
            }
          } catch (error) {
            console.error('[WebSocket] Erro ao processar broadcast de status:', error);
          }
        });
      };

      client.onStompError = (frame) => {
        console.error('[WebSocket] Erro STOMP:', frame);
        setIsConnected(false);
        setError('Erro de conexão WebSocket');
        config.onError?.(frame);
        
        // Tentar reconectar
        scheduleReconnect();
      };

      client.onWebSocketClose = (event) => {
        console.log('[WebSocket] Conexão fechada:', event);
        setIsConnected(false);
        config.onDisconnect?.();
        
        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000) {
          scheduleReconnect();
        }
      };

      client.onWebSocketError = (error) => {
        console.error('[WebSocket] Erro de WebSocket:', error);
        setIsConnected(false);
        setError('Erro de conexão WebSocket');
        config.onError?.(error);
      };

      clientRef.current = client;
      client.activate();

    } catch (error) {
      console.error('[WebSocket] Erro ao criar conexão:', error);
      setError('Erro ao conectar WebSocket');
      config.onError?.(error);
      scheduleReconnect();
    }
  }, [config.token, config.username]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.error('[WebSocket] Máximo de tentativas de reconexão atingido');
      setError('Falha na conexão. Recarregue a página.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current); // Backoff exponencial
    console.log(`[WebSocket] Tentando reconectar em ${delay}ms (tentativa ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    console.log('[WebSocket] Desconectando...');
    
    // Limpar timeout de reconexão
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Desconectar cliente WebSocket
    if (clientRef.current) {
      try {
        // Desativar todas as subscrições primeiro
        if (clientRef.current.subscriptions) {
          Object.values(clientRef.current.subscriptions).forEach(subscription => {
            subscription.unsubscribe();
          });
        }
        clientRef.current.deactivate();
      } catch (error) {
        console.warn('[WebSocket] Erro ao desconectar:', error);
      } finally {
        clientRef.current = null;
      }
    }

    setIsConnected(false);
    setWsConnection(null);
    config.onDisconnect?.();
  }, [setIsConnected, setWsConnection, config]);

  const sendMessage = useCallback((destination: string, body: any) => {
    if (!clientRef.current?.connected) {
      console.warn('[WebSocket] Tentando enviar mensagem sem conexão ativa');
      return false;
    }

    try {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      });
      return true;
    } catch (error) {
      console.error('[WebSocket] Erro ao enviar mensagem:', error);
      return false;
    }
  }, []);

  const sendTypingEvent = useCallback((conversationId: string, recipientId?: string, groupId?: string, departmentId?: string) => {
    return sendMessage('/app/chat/typing', {
      conversationId,
      userId: config.username,
      userName: config.username,
      recipientId,
      groupId,
      departmentId,
      isTyping: true
    });
  }, [sendMessage, config.username]);

  // Configurar conexão WebSocket no store
  useEffect(() => {
    if (clientRef.current) {
      setWsConnection({
        client: clientRef.current,
        sendEvent: sendMessage,
        sendTyping: sendTypingEvent,
        isConnected: clientRef.current.connected
      });
    }
  }, [setWsConnection, sendMessage, sendTypingEvent]);

  // Conectar automaticamente quando o hook é montado
  useEffect(() => {
    // Só conectar se temos token e username válidos
    if (config.token && config.username && config.token !== 'null' && config.token !== 'undefined') {
      connect();
    } else {
      console.log('[WebSocket] Não conectando - token ou username inválidos');
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.token, config.username]); // Removido connect e disconnect para evitar loop

  return {
    isConnected: clientRef.current?.connected || false,
    connect,
    disconnect,
    sendMessage,
    sendTypingEvent
  };
};