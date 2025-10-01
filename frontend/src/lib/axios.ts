import axios from 'axios';
import { config } from '../../env.config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

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
    } catch (_) {}

    console.log('🔗 Axios Request:', config.method?.toUpperCase(), config.url);
    console.log('🔗 Base URL:', config.baseURL);
    console.log('🔗 Full URL:', config.baseURL + config.url);
    
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_KEY || 'token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔗 Token adicionado ao header');
    } else {
      console.log('🔗 Nenhum token encontrado');
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
    console.log('✅ Axios Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ Axios Response Error:', error.response?.status, error.config?.url);
    console.error('❌ Error details:', error.response?.data);
    const originalRequest = error.config;

    // Se o erro for 401 e não for uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem(import.meta.env.VITE_REFRESH_TOKEN_KEY || 'refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
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