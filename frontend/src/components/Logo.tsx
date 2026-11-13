import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Building2 } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  src?: string;
  alt?: string;
  forceDefault?: boolean;
}

import { resolveCompanyLogoUrl, getStoredCompanyBranding } from '@/utils/logoUtils';
import { getFluxbusLogoSrc } from '@/lib/brandAssets';
export { resolveCompanyLogoUrl };

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
  src: propSrc,
  alt: propAlt,
  forceDefault = false
}) => {
  const { empresa, user } = useAuth();
  const { isDark } = useTheme();
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-7 sm:h-8 md:h-9',
    md: 'h-9 sm:h-10 md:h-11',
    lg: 'h-12 sm:h-14 md:h-16',
    xl: 'h-16 sm:h-20 md:h-24'
  };

  const maxWidthClasses = {
    sm: 'max-w-[120px] xs:max-w-[135px] sm:max-w-[180px]',
    md: 'max-w-[140px] xs:max-w-[160px] sm:max-w-[200px]',
    lg: 'max-w-[180px] sm:max-w-[240px]',
    xl: 'max-w-[240px] sm:max-w-[300px]'
  };

  // Determinar fonte da imagem (Logomarca da Empresa) sem mutação de estado global
  const storedBranding = getStoredCompanyBranding(empresa?.id || (user as any)?.companyId);
  const rawCompanyLogo = !forceDefault
    ? propSrc ||
      empresa?.logoUrl ||
      storedBranding.logoUrl ||
      (user as any)?.company?.logoUrl ||
      (user as any)?.empresa?.logoUrl ||
      (user as any)?.companyLogo ||
      (user as any)?.companyLogoUrl
    : null;

  const resolvedLogoUrl = resolveCompanyLogoUrl(rawCompanyLogo);
  const companyName =
    propAlt ||
    empresa?.nome ||
    (user as any)?.company?.name ||
    (user as any)?.companyName ||
    null;

  const companySigla =
    empresa?.sigla ||
    (user as any)?.company?.sigla ||
    (companyName ? companyName.slice(0, 3).toUpperCase() : '');

  // Resetar erro caso a URL mude
  useEffect(() => {
    setImgError(false);
  }, [resolvedLogoUrl]);

  // Se houver logo de empresa configurada e não deu erro de carregamento:
  // Regra: O nome da empresa só aparece quando NÃO tiver a logo
  if (!forceDefault && resolvedLogoUrl && !imgError) {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src={resolvedLogoUrl}
          alt={companyName || 'Empresa'}
          onError={() => setImgError(true)}
          className={`${heightClasses[size]} w-auto ${maxWidthClasses[size]} object-contain drop-shadow-md hover:scale-[1.02] transition-all duration-300 rounded-md shrink-0`}
        />
      </div>
    );
  }

  // Se o usuário tem empresa vinculada válida, mas não tem logo cadastrada (ou falhou ao carregar):
  if (!forceDefault && companyName && companyName !== 'FluxBus' && companyName !== 'Sem Empresa') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-seguranca-red to-red-700 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-red-950/40 flex-shrink-0 border border-red-500/30">
          {companySigla || <Building2 className="w-4 h-4" />}
        </div>
        {showText && (
          <div className="flex flex-col -space-y-0.5 justify-center">
            <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest leading-none">
              Empresa
            </span>
            <span className="text-xs font-bold text-sidebar-foreground truncate max-w-[160px] sm:max-w-[220px] leading-tight">
              {companyName}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback padrão do sistema FluxBus quando não tiver empresa definida:
  // Se showText for falso (ex: Topbar junto ao texto "FluxBus v2.0"), exibe o ícone oficial
  if (!showText) {
    return (
      <div className={`flex items-center select-none ${className}`}>
        <img
          src="/fluxbus-icon.png"
          alt="FluxBus Icon"
          className={`${heightClasses[size]} w-auto object-contain drop-shadow-md hover:scale-[1.05] transition-all duration-300`}
        />
      </div>
    );
  }

  // Se showText for verdadeiro (ex: Sidebar expandida, Login, telas públicas), exibe a logo completa horizontal transparente
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={getFluxbusLogoSrc(isDark)}
        alt="FluxBus - Transporte Corporativo e Fretamento"
        className={`${heightClasses[size]} w-auto max-w-[200px] object-contain drop-shadow-md hover:scale-[1.03] transition-all duration-300`}
      />
    </div>
  );
};

export default Logo;
