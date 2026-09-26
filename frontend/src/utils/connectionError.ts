/**
 * Utilitário para verificar se um erro é de conexão (backend não disponível)
 */

export interface ConnectionError extends Error {
  isConnectionError: boolean;
  apiUrl?: string;
  status?: number;
}

const SERVER_UNAVAILABLE_STATUSES = new Set([502, 503, 504, 522]);

export function isServerUnavailableStatus(status?: number | null): boolean {
  return status != null && SERVER_UNAVAILABLE_STATUSES.has(status);
}

/**
 * Verifica se o erro indica indisponibilidade temporária do servidor (proxy ou backend).
 */
export function isServerUnavailableError(error: unknown): boolean {
  const err = error as {
    response?: { status?: number; data?: unknown };
    status?: number;
    isConnectionError?: boolean;
    is522Error?: boolean;
  };

  if (err?.is522Error || err?.isConnectionError) {
    return true;
  }

  const status = err?.response?.status ?? err?.status;
  return isServerUnavailableStatus(status);
}

/**
 * Mensagem amigável para o usuário quando o backend/proxy está indisponível.
 */
export function getServerUnavailableMessage(error?: unknown): string {
  const err = error as { response?: { status?: number; data?: unknown }; status?: number };
  const status = err?.response?.status ?? err?.status;
  const data = err?.response?.data;

  if (data && typeof data === 'object' && !(data instanceof Blob)) {
    const obj = data as { message?: string; error?: string };
    if (obj.message) return obj.message;
    if (obj.error && status === 503) return obj.error;
  }

  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as { message?: string; error?: string };
      if (parsed.message) return parsed.message;
      if (parsed.error) return parsed.error;
    } catch {
      if (data.trim()) return data;
    }
  }

  if (status === 503) {
    return 'O servidor está reiniciando ou temporariamente indisponível. Aguarde 2–3 minutos após um deploy e tente novamente.';
  }
  if (status === 502 || status === 504) {
    return 'O servidor demorou para responder. Tente novamente em alguns instantes.';
  }
  if (status === 522) {
    return 'O servidor está temporariamente indisponível. Por favor, tente novamente em alguns instantes.';
  }

  return 'Não foi possível conectar ao servidor. Verifique sua conexão ou aguarde alguns instantes e tente novamente.';
}

/**
 * Verifica se um erro é de conexão (backend não disponível)
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;

  if (isServerUnavailableError(error)) {
    return true;
  }
  
  return (
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ERR_CONNECTION_REFUSED' ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ERR_CONNECTION_CLOSED' ||
    error?.code === 'ECONNABORTED' ||
    error?.code === 'ETIMEDOUT' ||
    error?.message?.includes('ERR_CONNECTION_CLOSED') ||
    error?.message?.includes('timeout of') ||
    error?.code === 'ERR_TOO_MANY_REDIRECTS' ||
    error?.message?.includes('too many redirects') ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('connection refused') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('Backend não está disponível') ||
    error?.message?.includes('servidor está temporariamente indisponível') ||
    error?.message?.includes('servidor está reiniciando') ||
    error?.isConnectionError === true ||
    error?.is522Error === true
  );
}

/**
 * Erros que podem ser enfileirados para sincronização offline posterior.
 */
export function isRetryableConnectionError(error: unknown): boolean {
  const err = error as {
    response?: { status?: number };
    request?: unknown;
    code?: string;
    message?: string;
    isConnectionError?: boolean;
    is522Error?: boolean;
  };

  if (isConnectionError(err)) {
    return true;
  }

  if (!err?.response && err?.request) {
    return true;
  }

  const status = err.response?.status;
  return status === 502 || status === 503 || status === 504 || status === 522;
}

/**
 * Cria um erro de conexão padronizado
 */
export function createConnectionError(apiUrl?: string): ConnectionError {
  const error = new Error('Backend não está disponível. Verifique se o servidor está rodando.') as ConnectionError;
  error.isConnectionError = true;
  error.apiUrl = apiUrl;
  return error;
}

/**
 * Trata erros de conexão de forma silenciosa (apenas loga warning)
 * Retorna true se o erro foi tratado, false caso contrário
 */
/**
 * Repete a operação quando falhar por indisponibilidade temporária do backend.
 */
export async function fetchWithConnectionRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
  delayMs = 800,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isConnectionError(error) || attempt >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  throw lastError;
}

export function handleConnectionErrorSilently(error: any, context?: string): boolean {
  if (isConnectionError(error) || isServerUnavailableError(error)) {
    const contextMsg = context ? `[${context}] ` : '';
    if (import.meta.env.DEV) {
      console.debug(`ℹ️ ${contextMsg}Servidor indisponível — ignorado (polling).`);
    }
    return true;
  }
  return false;
}

/**
 * Extrai message de erro JSON recebido como Blob (responseType: 'blob').
 * Retorna null quando não for JSON/erro legível.
 */
export async function extractMessageFromBlobError(error: unknown): Promise<string | null> {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;
  if (!(data instanceof Blob)) {
    if (data && typeof data === 'object') {
      const obj = data as { message?: string; error?: string };
      return obj.message || obj.error || null;
    }
    return null;
  }
  try {
    const type = (data.type || '').toLowerCase();
    if (type && !type.includes('json') && !type.includes('text')) {
      return null;
    }
    const text = await data.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text) as { message?: string; error?: string };
      return parsed.message || parsed.error || null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}
