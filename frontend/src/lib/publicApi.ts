import axios from 'axios';
import { getApiUrl, isHttpDebugMode } from '../config/environment';
import { isConnectionError, createConnectionError } from '../utils/connectionError';

/**
 * Instância pública do axios usada para endpoints que NÃO exigem autenticação.
 *
 * Usada por:
 *  - Chatbot público (WhatsAppChatbot) e painel de atendimento
 *  - Outras integrações abertas para o público
 *
 * Diferente do `api` em `axios.ts`, esta instância:
 *  - NÃO injeta token JWT no header
 *  - NÃO redireciona para /login em 401
 *  - Apenas normaliza URLs e loga em modo debug
 */
const publicApi = axios.create({
  baseURL: getApiUrl(),
  // Não enviar credenciais por padrão
  withCredentials: false,
});

// Request interceptor
publicApi.interceptors.request.use(
  (config) => {
    try {
      const base = (config.baseURL || '').replace(/\/$/, '');
      let url = config.url || '';
      if (typeof url === 'string') {
        if (base.endsWith('/api') && url.startsWith('/api/')) {
          url = url.substring(4);
        }
        if (!url.startsWith('/')) {
          url = `/${url}`;
        }
        config.url = url;
      }
    } catch (_) { /* ignore */ }

    if (isHttpDebugMode()) {
      console.log('🌐 [publicApi] Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — apenas normaliza erros de conexão, NÃO redireciona
publicApi.interceptors.response.use(
  (response) => {
    if (isHttpDebugMode()) {
      console.log('✅ [publicApi] Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    const connectionCause = error?.cause ?? error;
    if (!error.response && (isConnectionError(error) || isConnectionError(connectionCause))) {
      const apiUrl = error.config?.baseURL || getApiUrl();
      console.warn('⚠️ [publicApi] Falha de rede ou API indisponível:', apiUrl);
      return Promise.reject(createConnectionError(apiUrl, connectionCause));
    }

    if (isHttpDebugMode()) {
      console.warn('❌ [publicApi] Response Error:', error.response?.status, error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default publicApi;
