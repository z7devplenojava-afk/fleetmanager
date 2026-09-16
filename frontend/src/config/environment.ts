/**
 * Sistema de detecção automática de ambiente
 * Detecta automaticamente se está rodando em:
 * - Desenvolvimento local (localhost)
 * - CI (ci.z7botsolutions.com.br)
 * - Produção (domínio principal)
 */

export interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  wsUrl: string;
  debug: boolean;
  features: {
    notifications: boolean;
    chat: boolean;
    facialRecognition: boolean;
  };
}

type AppEnvironment = 'local' | 'ci' | 'dev' | 'test' | 'prod';

let cachedEnvironment: AppEnvironment | null = null;
let cachedConfig: EnvironmentConfig | null = null;
let environmentLogged = false;

/**
 * Detecta o ambiente atual baseado na URL
 */
export function detectEnvironment(): AppEnvironment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  if (typeof window === 'undefined') {
    cachedEnvironment = 'local';
    return cachedEnvironment;
  }

  const hostname = window.location.hostname;

  // Ambiente CI
  if (hostname.includes('ci.z7botsolutions.com.br')) {
    cachedEnvironment = 'ci';
  } else if (hostname.includes('dev.z7botsolutions.com.br')) {
    cachedEnvironment = 'dev';
  } else if (hostname.includes('test.z7botsolutions.com.br') || hostname.includes('testing.z7botsolutions.com.br')) {
    cachedEnvironment = 'test';
  } else if (hostname.includes('fluxbus.com.br') || (hostname.includes('z7botsolutions.com.br') && !hostname.includes('ci.') && !hostname.includes('dev.') && !hostname.includes('test.'))) {
    cachedEnvironment = 'prod';
  } else if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    cachedEnvironment = 'local';
  } else {
    console.warn('⚠️ Não foi possível detectar o ambiente, usando LOCAL como fallback');
    cachedEnvironment = 'local';
  }

  return cachedEnvironment;
}

/**
 * Obtém o host do backend baseado no host do frontend
 * Se acessar via IP (ex: 192.168.1.116), usa o mesmo IP para o backend
 */
function getBackendHost(): string {
  if (typeof window === 'undefined') {
    return 'localhost';
  }

  const hostname = window.location.hostname;

  // Se for IP local (192.168.x.x, 10.x.x.x, etc), usa o mesmo IP
  if (hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
    return hostname;
  }

  // Se for localhost ou 127.0.0.1, mantém localhost
  return 'localhost';
}

/**
 * Configurações por ambiente
 */
const environments: Record<string, EnvironmentConfig> = {
  local: {
    name: 'Desenvolvimento Local',
    apiUrl: `http://${getBackendHost()}:8081/api`,
    wsUrl: `ws://${getBackendHost()}:8081/ws`,
    debug: true,
    features: {
      notifications: true,
      chat: true,
      facialRecognition: false,
    },
  },
  ci: {
    name: 'CI - Integração Contínua',
    apiUrl: 'https://ci.z7botsolutions.com.br/api',
    wsUrl: 'wss://ci.z7botsolutions.com.br/ws',
    debug: true,
    features: {
      notifications: true,
      chat: true,
      facialRecognition: false,
    },
  },
  dev: {
    name: 'Desenvolvimento',
    apiUrl: 'https://dev.z7botsolutions.com.br/api',
    wsUrl: 'wss://dev.z7botsolutions.com.br/ws',
    debug: true,
    features: {
      notifications: true,
      chat: true,
      facialRecognition: false,
    },
  },
  test: {
    name: 'Teste',
    apiUrl: 'https://test.z7botsolutions.com.br/api',
    wsUrl: 'wss://test.z7botsolutions.com.br/ws',
    debug: true,
    features: {
      notifications: true,
      chat: true,
      facialRecognition: true,
    },
  },
  prod: {
    name: 'Produção',
    apiUrl: 'https://fluxbus.com.br/api',
    wsUrl: 'wss://fluxbus.com.br/ws',
    debug: false,
    features: {
      notifications: true,
      chat: true,
      facialRecognition: true,
    },
  },
};

/**
 * Obtém a configuração do ambiente atual
 */
export function getCurrentEnvironmentConfig(): EnvironmentConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = detectEnvironment();
  cachedConfig = environments[env];

  if (!environmentLogged && cachedConfig.debug) {
    environmentLogged = true;
    console.info(`🌍 Ambiente: ${env} | API: ${import.meta.env.VITE_API_URL || cachedConfig.apiUrl}`);
  }

  return cachedConfig;
}

/**
 * Obtém a URL da API para o ambiente atual
 */
export function getApiUrl(): string {
  // Primeiro tenta usar variável de ambiente (para builds específicos)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Senão, usa detecção automática
  return getCurrentEnvironmentConfig().apiUrl;
}

/**
 * Obtém a URL do WebSocket para o ambiente atual
 */
export function getWsUrl(): string {
  // Primeiro tenta usar variável de ambiente
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  // Senão, usa detecção automática
  const config = getCurrentEnvironmentConfig();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

  // Se estiver em local, garante que usa o host correto detectado
  if (detectEnvironment() === 'local') {
    return `${protocol}//${getBackendHost()}:8083/ws`;
  }

  // Para outros ambientes, usa a URL configurada mas ajusta o protocolo se necessário
  return config.wsUrl.replace(/^ws(s)?\:/, protocol);
}

/**
 * Verifica se está em modo debug
 */
export function isDebugMode(): boolean {
  if (import.meta.env.VITE_DEBUG !== undefined) {
    return import.meta.env.VITE_DEBUG === 'true';
  }

  const config = getCurrentEnvironmentConfig();
  return config.debug;
}

/** Logs HTTP detalhados (request/response). Ative com VITE_DEBUG_HTTP=true */
export function isHttpDebugMode(): boolean {
  return import.meta.env.VITE_DEBUG_HTTP === 'true';
}

/**
 * Obtém informações do ambiente para debug
 */
export function getEnvironmentInfo() {
  const env = detectEnvironment();
  const config = getCurrentEnvironmentConfig();

  return {
    environment: env,
    config,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Obtém a URL completa para arquivos de chat
 */
export function getChatFileUrl(filePath: string): string {
  const config = getCurrentEnvironmentConfig();
  const baseUrl = config.apiUrl.replace('/api', ''); // Remove /api para obter base URL

  // Se o filePath já for uma URL completa, retorna como está
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Constrói a URL completa para arquivos de chat
  // Ex: http://localhost:8083/uploads/chat/images/filename.jpg
  // ou http://localhost:8083/api/uploads/chat/images/filename.jpg
  if (filePath.startsWith('/uploads/')) {
    return `${baseUrl}${filePath}`;
  }

  if (filePath.startsWith('/api/uploads/')) {
    return `${baseUrl}${filePath.replace('/api', '')}`;
  }

  // Se não começar com /, adiciona o caminho completo
  return `${baseUrl}/uploads/chat/${filePath}`;
}

/** Centro aproximado de Minas Gerais (Belo Horizonte) — usado quando o mapa ainda não tem pontos/rota. */
const DEFAULT_MAP_LAT_MG = -19.9166813;
const DEFAULT_MAP_LNG_MG = -43.9344931;
const DEFAULT_MAP_ZOOM_MG = 11;

/**
 * Centro inicial dos mapas (Leaflet/Mapbox) quando não há pontos para dar fitBounds.
 * Override: `VITE_DEFAULT_MAP_LAT`, `VITE_DEFAULT_MAP_LNG`, `VITE_DEFAULT_MAP_ZOOM` no `.env`.
 */
export function getDefaultMapView(): { latitude: number; longitude: number; zoom: number } {
  const lat = Number(import.meta.env.VITE_DEFAULT_MAP_LAT);
  const lng = Number(import.meta.env.VITE_DEFAULT_MAP_LNG);
  const zoom = Number(import.meta.env.VITE_DEFAULT_MAP_ZOOM);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      latitude: lat,
      longitude: lng,
      zoom: Number.isFinite(zoom) && zoom > 0 ? zoom : DEFAULT_MAP_ZOOM_MG,
    };
  }
  return {
    latitude: DEFAULT_MAP_LAT_MG,
    longitude: DEFAULT_MAP_LNG_MG,
    zoom: DEFAULT_MAP_ZOOM_MG,
  };
}
