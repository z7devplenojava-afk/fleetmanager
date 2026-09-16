import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  src?: string;
  alt?: string;
  forceDefault?: boolean;
}

export const resolveCompanyLogoUrl = (logoUrl?: string | null): string | null => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:')) {
    return logoUrl;
  }
  const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
  return `${baseUrl}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  src: propSrc,
  alt: propAlt,
  forceDefault = false
}) => {
  const { empresa, user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-7 md:h-8',
    md: 'h-9 md:h-10',
    lg: 'h-12 sm:h-14 md:h-16',
    xl: 'h-16 sm:h-20 md:h-24'
  };

  // Determinar fonte da imagem
  const rawCompanyLogo = !forceDefault
    ? propSrc ||
      empresa?.logoUrl ||
      (user as any)?.company?.logoUrl ||
      (user as any)?.empresa?.logoUrl ||
      (user as any)?.companyLogo
    : null;

  const resolvedLogoUrl = resolveCompanyLogoUrl(rawCompanyLogo);
  const companyName =
    propAlt ||
    empresa?.nome ||
    (user as any)?.company?.name ||
    (user as any)?.companyName ||
    'FluxBus';

  const finalSrc = !imgError && resolvedLogoUrl ? resolvedLogoUrl : '/fluxbus-logo.png';

  // Resetar erro caso a URL mude
  useEffect(() => {
    setImgError(false);
  }, [resolvedLogoUrl]);

  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={finalSrc}
        alt={companyName}
        onError={() => {
          if (!imgError && resolvedLogoUrl) {
            setImgError(true);
          }
        }}
        className={`${heightClasses[size]} w-auto max-w-[190px] object-contain drop-shadow-md hover:scale-[1.03] transition-all duration-300`}
      />
    </div>
  );
};

export default Logo;
