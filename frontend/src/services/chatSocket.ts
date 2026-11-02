import { Client } from '@stomp/stompjs';
import { getWsUrl } from '../config/environment';

export function connectChatSocket(token: string, userId: string, onMessage: (msg: any) => void, onTyping?: (typing: any) => void) {
  // WebSocket nativo (sem SockJS): backend registra /ws nativo e /ws SockJS
  const wsUrl = getWsUrl() || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: { Authorization: `Bearer ${token}` },
    onConnect: () => {
      client.subscribe(`/user/${userId}/chat`, (message) => {
        onMessage(JSON.parse(message.body));
      });
      if (onTyping) {
        client.subscribe(`/user/${userId}/chat-typing`, (message) => {
          onTyping(JSON.parse(message.body));
        });
      }
    },
    debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000,
  });
  client.activate();

  // Permite envio de eventos customizados
  const sendEvent = (destination: string, body: any) => {
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
  };

  return { client, sendEvent };
} 