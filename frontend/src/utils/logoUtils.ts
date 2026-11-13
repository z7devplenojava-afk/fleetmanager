import { getApiUrl } from '@/config/environment';

/**
 * Verifica se um caminho não aponta para um arquivo real de imagem, mas sim para diretórios ou strings inválidas.
 */
function isInvalidImageTarget(path: string, invalidKeywords: string[]): boolean {
  const normalized = path.replace(/[?#].*$/, '').trim().toLowerCase();
  if (!normalized || normalized === 'null' || normalized === 'undefined' || normalized === '[object object]') {
    return true;
  }
  const clean = normalized.replace(/\/+$/, '');
  const segments = clean.split('/').filter(Boolean);
  if (segments.length === 0) return true;
  const lastSegment = segments[segments.length - 1];
  
  return invalidKeywords.includes(lastSegment);
}

/**
 * Normaliza e resolve a URL completa da logo da empresa para exibição no frontend (<img>, CSS, etc.).
 * Suporta:
 * - URLs absolutas (http/https/data:)
 * - Caminhos relativos (/api/uploads/companies/logos/..., /uploads/companies/logos/..., companies/logos/...)
 * - Apenas o nome do arquivo (ex: "78376e24-fce4-4b76-8140-3d6ddc2cf1f5.png")
 */
export function resolveCompanyLogoUrl(logoUrl?: string | null): string | null {
  if (!logoUrl || !logoUrl.trim()) return null;
  const trimmed = logoUrl.trim();

  // Ignorar logos órfãs conhecidas que não existem no disco do servidor
  if (trimmed.includes('e9654118-53a8-4dd8-b57c-bc50997f081b')) {
    return null;
  }

  // Interceptar logomarca da Viação São Silvestre para servir imagem sem fundo escuro em todos os contrastes
  if (trimmed.includes('78376e24-fce4-4b76-8140-3d6ddc2cf1f5')) {
    return '/images/sao-silvestre-logo.png';
  }

  // Ignorar caminhos que terminam em rota sem nome de arquivo (ex: /companies/logo ou /companies/logos)
  if (isInvalidImageTarget(trimmed, ['logo', 'logos', 'upload', 'uploads'])) {
    return null;
  }

  // URLs absolutas ou data URIs retornam imediatamente
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const apiUrl = getApiUrl();
  const origin = apiUrl.startsWith('http') ? new URL(apiUrl).origin : '';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (cleanPath.startsWith('/api/uploads/')) {
    return `${origin}${cleanPath}`;
  }
  if (cleanPath.startsWith('/uploads/')) {
    return `${origin}/api${cleanPath}`;
  }
  if (cleanPath.startsWith('/companies/logos/')) {
    return `${origin}/api/uploads${cleanPath}`;
  }

  // Se for apenas o nome do arquivo ou caminho relativo
  return `${origin}/api/uploads/companies/logos/${trimmed.replace(/^\/+/, '')}`;
}

export const COMPANY_BRANDING_STORAGE_KEY = 'fluxbus_company_branding_v1';

export interface StoredCompanyBranding {
  companyId?: string | null;
  iconUrl?: string | null;
  logoUrl?: string | null;
  updatedAt?: string;
}

export function getStoredCompanyBranding(companyId?: string | null): StoredCompanyBranding {
  if (typeof window === 'undefined') return {};
  try {
    const rawMap = localStorage.getItem(COMPANY_BRANDING_STORAGE_KEY);
    const map: Record<string, StoredCompanyBranding> = rawMap ? JSON.parse(rawMap) : {};
    const rawEmpresa = localStorage.getItem('empresa');
    const parsedEmpresa = rawEmpresa ? JSON.parse(rawEmpresa) : null;
    const targetId = companyId || parsedEmpresa?.id || 'default';
    const entry = map[targetId] || map.default || {};
    return {
      companyId: targetId,
      iconUrl: entry.iconUrl !== undefined ? entry.iconUrl : (parsedEmpresa?.iconUrl ?? null),
      logoUrl: entry.logoUrl !== undefined ? entry.logoUrl : (parsedEmpresa?.logoUrl ?? null),
      updatedAt: entry.updatedAt,
    };
  } catch {
    return {};
  }
}

export function saveStoredCompanyBranding(patch: {
  companyId?: string | null;
  iconUrl?: string | null;
  logoUrl?: string | null;
}): StoredCompanyBranding {
  if (typeof window === 'undefined') return patch;
  try {
    const rawEmpresa = localStorage.getItem('empresa');
    const parsedEmpresa = rawEmpresa ? JSON.parse(rawEmpresa) : null;
    const targetId = patch.companyId || parsedEmpresa?.id || 'default';

    const rawMap = localStorage.getItem(COMPANY_BRANDING_STORAGE_KEY);
    const map: Record<string, StoredCompanyBranding> = rawMap ? JSON.parse(rawMap) : {};
    const prev = map[targetId] || map.default || {};

    const next: StoredCompanyBranding = {
      companyId: targetId,
      iconUrl: patch.iconUrl !== undefined ? patch.iconUrl : (prev.iconUrl ?? parsedEmpresa?.iconUrl ?? null),
      logoUrl: patch.logoUrl !== undefined ? patch.logoUrl : (prev.logoUrl ?? parsedEmpresa?.logoUrl ?? null),
      updatedAt: new Date().toISOString(),
    };

    map[targetId] = next;
    map.default = next;
    localStorage.setItem(COMPANY_BRANDING_STORAGE_KEY, JSON.stringify(map));

    if (parsedEmpresa) {
      const updatedEmpresa = {
        ...parsedEmpresa,
        ...(patch.iconUrl !== undefined ? { iconUrl: patch.iconUrl } : {}),
        ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl } : {}),
      };
      localStorage.setItem('empresa', JSON.stringify(updatedEmpresa));
    }

    window.dispatchEvent(new CustomEvent('fluxbus:company-branding-updated', { detail: next }));
    return next;
  } catch {
    return patch;
  }
}

/**
 * Normaliza e resolve a URL do Ícone da empresa (exibido quando a sidebar está recolhida e em selos quadrados),
 * mantendo a logomarca separada.
 */
export function resolveCompanyIconUrl(
  iconUrl?: string | null,
  fallbackLogoUrl?: string | null
): string | null {
  const stored = getStoredCompanyBranding();
  const candidateIcon = iconUrl !== undefined ? iconUrl : stored.iconUrl;
  const resolvedIcon = resolveCompanyLogoUrl(candidateIcon);
  if (resolvedIcon) return resolvedIcon;

  const candidateLogo = fallbackLogoUrl !== undefined ? fallbackLogoUrl : stored.logoUrl;
  return resolveCompanyLogoUrl(candidateLogo);
}

/**
 * Normaliza e resolve a URL completa de banner motivacional para exibição no frontend.
 */
export function resolveCompanyBannerUrl(bannerUrl?: string | null): string | null {
  if (!bannerUrl || !bannerUrl.trim()) return null;
  const trimmed = bannerUrl.trim();

  if (isInvalidImageTarget(trimmed, ['banner', 'banners', 'banner-upload', 'upload', 'uploads'])) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const apiUrl = getApiUrl();
  const origin = apiUrl.startsWith('http') ? new URL(apiUrl).origin : '';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (cleanPath.startsWith('/api/uploads/')) {
    return `${origin}${cleanPath}`;
  }
  if (cleanPath.startsWith('/uploads/')) {
    return `${origin}/api${cleanPath}`;
  }
  if (cleanPath.startsWith('/companies/banners/')) {
    return `${origin}/api/uploads${cleanPath}`;
  }

  return `${origin}/api/uploads/companies/banners/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Normaliza e resolve a URL completa do avatar do usuário para exibição no frontend.
 */
export function resolveAvatarUrl(avatarUrl?: string | null): string | null {
  if (!avatarUrl || !avatarUrl.trim()) return null;
  const trimmed = avatarUrl.trim();

  if (isInvalidImageTarget(trimmed, ['avatar', 'avatars', 'upload', 'uploads'])) {
    return null;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const apiUrl = getApiUrl();
  const origin = apiUrl.startsWith('http') ? new URL(apiUrl).origin : '';
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (cleanPath.startsWith('/api/uploads/')) {
    return `${origin}${cleanPath}`;
  }
  if (cleanPath.startsWith('/uploads/')) {
    return `${origin}/api${cleanPath}`;
  }
  if (cleanPath.startsWith('/avatars/')) {
    return `${origin}/api/uploads${cleanPath}`;
  }

  return `${origin}/api/uploads/avatars/${trimmed.replace(/^\/+/, '')}`;
}
