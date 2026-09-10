import axios from 'axios';
import { getApiUrl, isHttpDebugMode } from '../config/environment';
import { isConnectionError, createConnectionError } from '../utils/connectionError';

const api = axios.create({
  baseURL: getApiUrl(),
});

// Circuit breaker: enquanto "aberto", requisições falham imediatamente sem atacar o servidor
// (evita retry storm quando a origem VPS está fora e o dashboard dispara dezenas de requests)
let serverDownUntil = 0;
const SERVER_DOWN_COOLDOWN_MS = 30000;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Normaliza URLs para evitar duplicação de "/api/api/..."
    try {
      const base = (config.baseURL || '').replace(/\/$/, '');
      let url = config.url || '';
      if (typeof url === 'string') {
        // Remove base duplicada: base termina com /api e url começa com /api
        if (base.endsWith('/api') && url.startsWith('/api/')) {
          url = url.substring(4); // remove prefixo '/api'
        }
        // Garante que URLs relativas comecem com '/'
        if (!url.startsWith('/')) {
          url = `/${url}`;
        }
        config.url = url;
      }
    } catch (_) { }

    if (isHttpDebugMode()) {
      console.log('🔗 Axios Request:', config.method?.toUpperCase(), config.url);
      console.log('🔗 Base URL:', config.baseURL);
      console.log('🔗 Full URL:', config.baseURL + config.url);
    }

    // Tentar múltiplas chaves possíveis para o token
    const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'token';
    let token = localStorage.getItem(tokenKey);
    let tokenSource = tokenKey;

    // Se não encontrou ou está vazio, tentar outras chaves comuns
    if (!token || token.trim() === '') {
      token = localStorage.getItem('token');
      if (token && token.trim() !== '') {
        tokenSource = 'token';
      }
    }
    if (!token || token.trim() === '') {
      token = localStorage.getItem('authToken');
      if (token && token.trim() !== '') {
        tokenSource = 'authToken';
      }
    }

    // Verificar se o token não é 'fake-token' ou inválido
    if (token && token.trim() !== '' && token !== 'fake-token') {
      config.headers.Authorization = `Bearer ${token}`;

      // Multi-tenant: enviar empresa como header redundante (defesa em profundidade)
      try {
        const empresaRaw = localStorage.getItem('empresa');
        if (empresaRaw) {
          const empresa = JSON.parse(empresaRaw);
          if (empresa?.id) {
            config.headers['X-Company-Id'] = empresa.id;
          }
        }
      } catch (_e) { /* empresa não disponível */ }

      // Admin Impersonation Logic
      try {
        const targetCompanyId = sessionStorage.getItem('admin_target_company_id');
        if (targetCompanyId) {
          config.headers['X-Target-Company-ID'] = targetCompanyId;
          if (isHttpDebugMode()) {
            console.log('👑 Admin Impersonating Company:', targetCompanyId);
          }
        }
      } catch (_e) { /* ignore */ }
      if (isHttpDebugMode()) {
        console.log('🔗 Token adicionado ao header:', token.substring(0, 50) + '...');
        console.log('🔗 Token encontrado em:', tokenSource);
      }
    } else if (isHttpDebugMode()) {
      console.log('🔗 Nenhum token válido encontrado no localStorage');
      console.log('🔗 Chaves disponíveis:', Object.keys(localStorage));
      console.log('🔗 Tentando buscar token em:', tokenKey);
      const allKeys = ['token', 'authToken', tokenKey];
      allKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          console.log(`🔍 Chave "${key}":`, value.substring(0, 30) + '...', '(válido:', value !== 'fake-token' && value.trim() !== '', ')');
        }
      });
    }

    return config;
  },
  (error) => {
    console.error('❌ Erro no interceptor de requisição:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (isHttpDebugMode()) {
      console.log('✅ Axios Response:', response.status, response.config.url);
    }
    return response;
  },
  async (error) => {
    // Tratamento especial para erros de conexão (backend não disponível / conexão fechada)
    const connectionCause = error?.cause ?? error;
    if (!error.response && (isConnectionError(error) || isConnectionError(connectionCause))) {
      const apiUrl = error.config?.baseURL || getApiUrl();
      console.warn('⚠️ Falha de rede ou API indisponível:', apiUrl);

      return Promise.reject(createConnectionError(apiUrl, connectionCause));
    }

    // Tratamento unificado para 522/524 (Cloudflare: origem não responde) com circuit breaker global
    // Enquanto o servidor estiver fora, novas requisições falham rápido (sem retry storm de dezenas de endpoints)
    const status = error.response?.status;
    if (status === 522 || status === 524) {
      const now = Date.now();

      // Circuito aberto: falha imediata sem tocar o servidor
      if (serverDownUntil > now) {
        const errorOrigin = new Error('O servidor está temporariamente indisponível. Aguarde alguns instantes e tente novamente.');
        (errorOrigin as any).is522Error = true;
        (errorOrigin as any).isConnectionError = true;
        (errorOrigin as any).status = status;
        return Promise.reject(errorOrigin);
      }

      const originalRequest = error.config;
      const retryCount = (originalRequest as any).__retryCount || 0;
      const maxRetries = 2;

      if (retryCount < maxRetries) {
        (originalRequest as any).__retryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, retryCount), 4000); // Backoff: 2s, 4s
        console.warn(`⚠️ Erro ${status} (tentativa ${retryCount + 1}/${maxRetries}). Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }

      // Esgotou as tentativas: abre o circuito por 30s e falha rápido para todas as requisições
      serverDownUntil = Date.now() + SERVER_DOWN_COOLDOWN_MS;
      console.error('❌ Erro ' + status + ': origem (Cloudflare) não respondeu após ' + maxRetries + ' tentativas. Circuito aberto por ' + (SERVER_DOWN_COOLDOWN_MS / 1000) + 's.');
      const errorOrigin = new Error('O servidor está temporariamente indisponível. Por favor, tente novamente em alguns instantes.');
      (errorOrigin as any).is522Error = true;
      (errorOrigin as any).isConnectionError = true;
      (errorOrigin as any).status = status;
      return Promise.reject(errorOrigin);
    }

    console.error('❌ Axios Response Error:', error.response?.status, error.config?.url);
    if (isHttpDebugMode()) {
      console.error('❌ Error details:', error.response?.data);
    }
    const originalRequest = error.config;

    // Se o erro for 401 (não autorizado - token inválido/expirado)
    // 403 (Forbidden) é diferente - significa que o usuário está autenticado mas não tem permissão
    // Não devemos redirecionar para login em caso de 403, apenas em 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      const requestUrl = String(originalRequest?.url || '');
      // Falha de login/senha NÃO deve disparar redirect hard — deixa a tela mostrar o erro
      const isAuthCredentialRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/authenticate') ||
        requestUrl.includes('/auth/refresh-token');
      if (isAuthCredentialRequest) {
        return Promise.reject(error);
      }

      // Verificar se o problema é falta de token
      const tokenKey = import.meta.env.VITE_TOKEN_KEY || 'token';
      const token = localStorage.getItem(tokenKey) || localStorage.getItem('token') || localStorage.getItem('authToken');

      if (!token || token.trim() === '' || token === 'fake-token') {
        console.error('❌ Token inválido ou não encontrado. Redirecionando para login...');
        localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'token');
        localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken');
        localStorage.removeItem(import.meta.env.VITE_USER_KEY || 'user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      originalRequest._retry = true;

      try {

        const refreshToken = localStorage.getItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken');
        if (!refreshToken) {
          // Se não há refresh token, redirecionar para login
          console.error('❌ Refresh token não encontrado. Redirecionando para login...');
          localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'token');
          localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken');
          localStorage.removeItem(import.meta.env.VITE_USER_KEY || 'user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Tenta renovar o token
        const response = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh-token`, {
          refreshToken
        });

        const { token: newToken, refreshToken: newRefreshToken } = response.data;

        // Atualiza os tokens
        localStorage.setItem(import.meta.env.VITE_TOKEN_KEY || 'token', newToken);
        localStorage.setItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken', newRefreshToken);

        // Atualiza o header da requisição original
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Repete a requisição original
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar ao renovar o token, faz logout
        console.error('❌ Erro ao renovar token. Fazendo logout...', refreshError);
        localStorage.removeItem(import.meta.env.VITE_TOKEN_KEY || 'token');
        localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken');
        localStorage.removeItem(import.meta.env.VITE_USER_KEY || 'user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 