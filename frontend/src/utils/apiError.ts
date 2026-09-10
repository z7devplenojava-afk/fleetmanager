/**
 * Extrai a mensagem de erro mais útil possível de uma resposta de erro do backend.
 * Suporta:
 * - ValidationErrorResponse (VALIDATION_ERROR / CONSTRAINT_VIOLATION) -> junta os fieldErrors
 * - ErrorResponse (INVALID_ARGUMENT, BUSINESS_ERROR, etc.) -> usa "message"
 * - Erros genéricos do axios
 */
export function extractApiErrorMessage(error: any, fallback = 'Ocorreu um erro inesperado.'): string {
  const data = error?.response?.data;

  if (!data) {
    if (error?.message) {
      return error.message;
    }
    return fallback;
  }

  // data pode ser string (HTML de gateway, texto puro etc.)
  if (typeof data === 'string') {
    return data.length > 0 && data.length < 300 ? data : fallback;
  }

  // Junta os fieldErrors (Map<campo, mensagem>) vindos da validação do backend
  if (data.fieldErrors && typeof data.fieldErrors === 'object') {
    const parts = Object.entries(data.fieldErrors as Record<string, string>).map(
      ([field, message]) => `${field}: ${message}`
    );
    if (parts.length > 0) {
      return parts.join(' | ');
    }
  }

  if (data.message && typeof data.message === 'string') {
    return data.message;
  }

  if (data.error && typeof data.error === 'string') {
    return data.error;
  }

  return fallback;
}
