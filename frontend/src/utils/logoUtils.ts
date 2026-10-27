import { getApiUrl } from '@/config/environment';

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

/**
 * Normaliza e resolve a URL completa de banner motivacional para exibição no frontend.
 */
export function resolveCompanyBannerUrl(bannerUrl?: string | null): string | null {
  if (!bannerUrl || !bannerUrl.trim()) return null;
  const trimmed = bannerUrl.trim();

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

