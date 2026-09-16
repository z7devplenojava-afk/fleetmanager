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
  const configRef = useRef<WebSocketConfig>(config);
  configRef.current = config;

  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const token = config.token;
  const username = config.username;

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
      return;
    }

    // Evitar múltiplas conexões simultâneas
    if (clientRef.current) {
      try {
        clientRef.current.deactivate();
      } catch {
        // silenciar
      }
      clientRef.current = null;
    }

    if (!token || !username || token === 'null' || token === 'undefined') {
      return;
    }

    try {
      const socket = new SockJS('/ws');
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          'X-Username': username
        },
        debug: () => {},
        reconnectDelay: reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      client.onConnect = (frame) => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        setError(null);
        configRef.current.onConnect?.();

        // Subscrever aos tópicos de mensagens individuais
        client.subscribe(`/user/${username}/queue/messages`, (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };

            addChatMessage(chatMessage);
            configRef.current.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem:', error);
          }
        });

        // Subscrever a tópicos de grupos
        client.subscribe('/topic/chat/group/*', (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };

            addChatMessage(chatMessage);
            configRef.current.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem de grupo:', error);
          }
        });

        // Subscrever a tópicos de departamentos
        client.subscribe('/topic/chat/department/*', (message) => {
          try {
            const rawMessage = JSON.parse(message.body);
            const chatMessage: ChatMessage = {
              ...rawMessage,
              fileUrl: rawMessage.fileUrl,
              fileName: rawMessage.fileName,
              fileSize: rawMessage.fileSize,
              fileContentType: rawMessage.fileContentType
            };

            addChatMessage(chatMessage);
            configRef.current.onMessage?.(chatMessage);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar mensagem de departamento:', error);
          }
        });

        // Subscrever aos eventos de digitação
        client.subscribe(`/user/${username}/queue/typing`, (message) => {
          try {
            const typingEvent = JSON.parse(message.body);
            if (typingEvent.isTyping) {
              addTypingUser(typingEvent.userId);
              setTimeout(() => removeTypingUser(typingEvent.userId), 3000);
            } else {
              removeTypingUser(typingEvent.userId);
            }

            configRef.current.onTyping?.(typingEvent);
          } catch (error) {
            console.error('[WebSocket] Erro ao processar evento de digitação:', error);
          }
        });

        // Subscrever a eventos de status de usuário (online/offline individual)
        client.subscribe(`/user/${username}/queue/user-status`, (message) => {
          try {
            const userStatusEvent = JSON.parse(message.body);
            const { updateUserStatus } = useMessageStore.getState();
            if (updateUserStatus && userStatusEvent.userId) {
              updateUserStatus(userStatusEvent.userId, userStatusEvent.isOnline);
            }
            if (userStatusEvent?.userId) {
              configRef.current.onUserStatus?.({
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
            const { updateUserStatus } = useMessageStore.getState();
            if (updateUserStatus && userStatusEvent.userId) {
              updateUserStatus(userStatusEvent.userId, userStatusEvent.isOnline);
            }
            if (userStatusEvent?.userId) {
              configRef.current.onUserStatus?.({
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
        setError('Erro na comunicação em tempo real.');
        configRef.current.onError?.(frame);
        handleReconnect();
      };

      client.onWebSocketClose = () => {
        setIsConnected(false);
        configRef.current.onDisconnect?.();
      };

      client.onWebSocketError = (event) => {
        setError('Erro de conexão WebSocket.');
        configRef.current.onError?.(event);
      };

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error('[WebSocket] Erro ao criar cliente:', error);
      setError('Falha ao inicializar comunicação.');
      handleReconnect();
    }
  }, [token, username, setIsConnected, setError, addChatMessage, addTypingUser, removeTypingUser]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      setError('Falha na conexão.');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++;
      connect();
    }, delay);
  }, [connect, setError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (clientRef.current) {
      try {
        if (clientRef.current.subscriptions) {
          Object.values(clientRef.current.subscriptions).forEach((subscription) => {
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
    configRef.current.onDisconnect?.();
  }, [setIsConnected, setWsConnection]);

  const sendMessage = useCallback(
    (destination: string, body: any) => {
      if (!clientRef.current?.connected) {
        console.warn('[WebSocket] Não conectado. Mensagem não enviada:', destination);
        return false;
      }

      try {
        clientRef.current.publish({
          destination,
          body: typeof body === 'string' ? body : JSON.stringify(body)
        });
        return true;
      } catch (error) {
        console.error('[WebSocket] Erro ao enviar mensagem:', error);
        return false;
      }
    },
    []
  );

  const sendTypingEvent = useCallback(
    (recipientId: string, isTyping: boolean) => {
      return sendMessage(`/app/chat/typing`, {
        userId: username,
        recipientId,
        isTyping
      });
    },
    [sendMessage, username]
  );

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

  // Conectar automaticamente apenas quando token e username existirem
  useEffect(() => {
    if (token && username && token !== 'null' && token !== 'undefined') {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, username, connect, disconnect]);

  return {
    isConnected: clientRef.current?.connected || false,
    connect,
    disconnect,
    sendMessage,
    sendTypingEvent
  };
};