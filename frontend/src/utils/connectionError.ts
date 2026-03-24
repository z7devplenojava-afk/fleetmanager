/**
 * Utilitário para verificar se um erro é de conexão (backend não disponível)
 */

export interface ConnectionError extends Error {
  isConnectionError: boolean;
  apiUrl?: string;
}

/** true = localhost / rede local (mensagens podem citar Gradle e proxy Vite). */
export function isLikelyLocalDevHostname(): boolean {
  if (typeof globalThis.window === 'undefined') return true;
  const h = globalThis.window.location.hostname;
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    /^192\.168\./.test(h) ||
    /^10\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

/**
 * Verifica se um erro é de conexão (backend não disponível)
 */
export function isConnectionError(error: any): boolean {
  if (!error) return false;

  const msg = String(error?.message || '');
  const code = String(error?.code || '');

  return (
    error?.code === 'ECONNREFUSED' ||
    error?.code === 'ERR_CONNECTION_REFUSED' ||
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ERR_CONNECTION_CLOSED' ||
    error?.code === 'ECONNRESET' ||
    code === 'ERR_CERT_AUTHORITY_INVALID' ||
    code === 'ERR_SSL_PROTOCOL_ERROR' ||
    msg.includes('ERR_CERT_AUTHORITY_INVALID') ||
    msg.includes('CERT_AUTHORITY_INVALID') ||
    msg.includes('ERR_SSL_PROTOCOL_ERROR') ||
    msg.includes('SSL_PROTOCOL_ERROR') ||
    msg.includes('ERR_CONNECTION_CLOSED') ||
    msg.includes('CONNECTION_CLOSED') ||
    msg.includes('net::ERR_') ||
    error?.message?.includes('Network Error') ||
    error?.message?.includes('connection refused') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('Backend não está disponível') ||
    error?.message?.includes('Load failed') ||
    error?.isConnectionError === true
  );
}

/**
 * Cria um erro de conexão padronizado
 */
export function createConnectionError(apiUrl?: string, cause?: unknown): ConnectionError {
  const c = cause as {
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
  } | undefined;
  const certCode =
    c?.code === 'ERR_CERT_AUTHORITY_INVALID' ||
    c?.cause?.code === 'ERR_CERT_AUTHORITY_INVALID' ||
    c?.code === 'ERR_SSL_PROTOCOL_ERROR' ||
    c?.cause?.code === 'ERR_SSL_PROTOCOL_ERROR';
  const certMsg =
    (c?.message && c.message.includes('ERR_CERT_AUTHORITY_INVALID')) ||
    (c?.cause?.message && c.cause.message.includes('ERR_CERT_AUTHORITY_INVALID')) ||
    (c?.message && c.message.includes('ERR_SSL_PROTOCOL_ERROR')) ||
    (c?.cause?.message && c.cause.message.includes('ERR_SSL_PROTOCOL_ERROR'));
  let message: string;
  if (certCode || certMsg) {
    message =
      'HTTPS/SSL em conflito com o servidor de dev (HTTP). Abra exatamente http://localhost:3000 (ou o IP com http://, não https). ' +
      'Remova Service Workers antigos: DevTools → Application → Service Workers → Unregister; limpe cache do site. ' +
      'Não defina VITE_DEV_HTTPS salvo se precisar de HTTPS. Backend: http://localhost:8083.';
  } else if (!isLikelyLocalDevHostname()) {
    message =
      'Não foi possível conectar ao servidor (conexão recusada ou encerrada). Tente atualizar a página em instantes. ' +
      'Se o problema continuar, o serviço pode estar em manutenção — contacte o suporte técnico.';
  } else {
    message =
      'Backend não está disponível no ambiente local. Inicie a API Spring Boot (pasta backend: gradlew.bat bootRun ou ./gradlew bootRun) ' +
      'e confirme a porta no proxy (ex.: Vite em /api → localhost:8083).';
  }
  const error = new Error(message) as ConnectionError;
  error.isConnectionError = true;
  error.apiUrl = apiUrl;
  return error;
}

/**
 * Trata erros de conexão de forma silenciosa (apenas loga warning)
 * Retorna true se o erro foi tratado, false caso contrário
 */
export function handleConnectionErrorSilently(error: any, context?: string): boolean {
  if (isConnectionError(error)) {
    const contextMsg = context ? `[${context}] ` : '';
    console.warn(`⚠️ ${contextMsg}Backend não está disponível. Continuando sem dados.`);
    return true;
  }
  return false;
}

