/**
 * Serviço de consulta de CEP.
 *
 * A API oficial dos Correios (buscacepinter.correios.com.br) exige cookies de
 * sessão e bloqueia requisições diretas do navegador (302 para /redirect.php).
 * Por isso usamos o ViaCEP, que devolve os mesmos dados de endereço dos
 * Correios com CORS liberado, e o BrasilAPI como fallback.
 */

export interface CepAddress {
  cep: string;
  street: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

interface BrasilApiResponse {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const normalizeCep = (cep: string): string => cep.replace(/\D/g, '');

const isValidCep = (cep: string): boolean => /^\d{8}$/.test(cep);

const fetchJson = async <T>(url: string, timeoutMs = 8000): Promise<T> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeout);
  }
};

/**
 * Busca o endereço de um CEP.
 * @returns os dados do endereço, ou `null` quando o CEP é inválido, não existe
 *          ou nenhum provedor responde.
 */
export const lookupCep = async (cep: string): Promise<CepAddress | null> => {
  const digits = normalizeCep(cep);
  if (!isValidCep(digits)) {
    return null;
  }

  // 1) ViaCEP (dados dos Correios)
  try {
    const data = await fetchJson<ViaCepResponse>(
      `https://viacep.com.br/ws/${digits}/json/`,
    );
    if (!data.erro) {
      return {
        cep: digits,
        street: data.logradouro || '',
        complement: data.complemento || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      };
    }
    // CEP inexistente no ViaCEP: não tenta o fallback para evitar trazer
    // resultado divergente de um CEP que realmente não existe.
    return null;
  } catch {
    // ViaCEP indisponível: tenta BrasilAPI.
  }

  // 2) BrasilAPI (fallback)
  try {
    const data = await fetchJson<BrasilApiResponse>(
      `https://brasilapi.com.br/api/cep/v1/${digits}`,
    );
    if (data.city || data.street) {
      return {
        cep: digits,
        street: data.street || '',
        complement: '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
      };
    }
  } catch {
    // Silenciado: retorna null abaixo.
  }

  return null;
};
