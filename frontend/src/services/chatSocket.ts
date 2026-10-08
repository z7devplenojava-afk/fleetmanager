import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getWsUrl } from '../config/environment';

export function connectChatSocket(token: string, userId: string, onMessage: (msg: any) => void, onTyping?: (typing: any) => void) {
  const wsUrl = getWsUrl();
  const httpWsUrl = wsUrl ? wsUrl.replace(/^wss:\/\//i, 'https://').replace(/^ws:\/\//i, 'http://') : '/ws';

  const client = new Client({
    webSocketFactory: () => new SockJS(httpWsUrl, null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'] }),
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