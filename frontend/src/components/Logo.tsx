import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import { Building2 } from 'lucide-react';
import { companyService } from '@/services/companyService';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  src?: string;
  alt?: string;
  forceDefault?: boolean;
}

import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
export { resolveCompanyLogoUrl };

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  showText = true,
  src: propSrc,
  alt: propAlt,
  forceDefault = false
}) => {
  const { empresa, user, setEmpresa } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [fetchedCompany, setFetchedCompany] = useState<any | null>(null);

  const heightClasses = {
    sm: 'h-8 md:h-9',
    md: 'h-10 md:h-11',
    lg: 'h-12 sm:h-14 md:h-16',
    xl: 'h-16 sm:h-20 md:h-24'
  };

  // Se o usuário tem companyId mas empresa não tem logoUrl no estado, busca dados da empresa
  const companyId = (user as any)?.companyId || (user as any)?.company?.id;
  useEffect(() => {
    if (!forceDefault && companyId && (!empresa?.logoUrl || !empresa?.nome)) {
      companyService.getCompanyById(companyId)
        .then((comp) => {
          if (comp) {
            setFetchedCompany(comp);
            if (setEmpresa && (!empresa || !empresa.logoUrl)) {
              setEmpresa({
                id: comp.id || companyId,
                nome: comp.name || comp.nome || '',
                logoUrl: comp.logoUrl,
                temaCor: comp.temaCor,
                branchName: comp.branchName,
                unitName: comp.unitName,
                enabledFeatures: comp.enabledFeatures || []
              });
            }
          }
        })
        .catch(() => {
          // silenciar
        });
    }
  }, [companyId, empresa?.logoUrl, forceDefault, setEmpresa]);

  // Determinar fonte da imagem
  const rawCompanyLogo = !forceDefault
    ? propSrc ||
      empresa?.logoUrl ||
      fetchedCompany?.logoUrl ||
      (user as any)?.company?.logoUrl ||
      (user as any)?.empresa?.logoUrl ||
      (user as any)?.companyLogo ||
      (user as any)?.companyLogoUrl
    : null;

  const resolvedLogoUrl = resolveCompanyLogoUrl(rawCompanyLogo);
  const companyName =
    propAlt ||
    empresa?.nome ||
    fetchedCompany?.name ||
    (user as any)?.company?.name ||
    (user as any)?.companyName ||
    null;

  const companySigla =
    empresa?.sigla ||
    fetchedCompany?.sigla ||
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
          className={`${heightClasses[size]} w-auto max-w-[200px] object-contain drop-shadow-md hover:scale-[1.02] transition-all duration-300 rounded-md`}
        />
      </div>
    );
  }

  // Se o usuário tem empresa vinculada, mas não tem logo cadastrada (ou falhou ao carregar):
  if (!forceDefault && companyName && companyName !== 'FluxBus') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-seguranca-red to-red-700 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-red-950/40 flex-shrink-0 border border-red-500/30">
          {companySigla || <Building2 className="w-4 h-4" />}
        </div>
        {showText && (
          <div className="flex flex-col -space-y-0.5 justify-center">
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-widest leading-none">
              Empresa
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-[220px] leading-tight">
              {companyName}
            </span>
          </div>
        )}
      </div>
    );
  }

  // Fallback padrão do sistema FluxBus
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src="/fluxbus-logo.png"
        alt="FluxBus"
        className={`${heightClasses[size]} w-auto max-w-[190px] object-contain drop-shadow-md hover:scale-[1.03] transition-all duration-300`}
      />
    </div>
  );
};

export default Logo;
