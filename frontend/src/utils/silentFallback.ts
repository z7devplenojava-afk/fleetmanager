import type { AxiosRequestConfig } from 'axios';
import { isConnectionError } from './connectionError';

/**
 * Status HTTP que indicam que o endpoint não está disponível no backend
 * (build desatualizada, rota removida/renomeada, gateway fora do ar, etc.).
 * Nesses casos degradamos silenciosamente em vez de poluir o console.
 */
const UNAVAILABLE_STATUSES = new Set([400, 404, 405, 410, 501, 502, 503, 504]);

/**
 * Verifica se o erro indica que o endpoint está indisponível (e não um erro
 * legítimo de dados, autenticação ou permissão).
 */
export function isEndpointUnavailable(error: unknown): boolean {
  if (isConnectionError(error)) return true;
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  return typeof status === 'number' && UNAVAILABLE_STATUSES.has(status);
}

const warnedKeys = new Set<string>();

/** Emite um console.warn apenas na primeira vez para cada chave (evita spam). */
export function warnEndpointUnavailableOnce(key: string, message: string): void {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  console.warn(message);
}

/**
 * Config do Axios que impede o interceptor global de logar
 * "❌ Axios Response Error" para requisições que degradam silenciosamente.
 */
export function silentErrorLog(config?: AxiosRequestConfig): AxiosRequestConfig {
  return { ...(config ?? {}), silentErrorLog: true } as AxiosRequestConfig;
}

/**
 * Executa uma requisição e, se o endpoint estiver indisponível no backend,
 * retorna o fallback silenciosamente. Qualquer outro erro (401/403/500,
 * validação etc.) continua sendo propagado normalmente.
 */
export async function withSilentFallback<T>(
  request: () => Promise<T>,
  fallback: T,
  options: { key: string; message: string },
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isEndpointUnavailable(error)) {
      warnEndpointUnavailableOnce(options.key, options.message);
      return fallback;
    }
    throw error;
  }
}
