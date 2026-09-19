import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { companyService } from '@/services/companyService';
import { resolveCompanyBannerUrl } from '@/utils/logoUtils';
import { ChevronLeft, ChevronRight, Sparkles, Pause, Play } from 'lucide-react';

interface CompanyMotivationalCarouselProps {
  companyId?: string;
  companyName?: string;
}

export const CompanyMotivationalCarousel: React.FC<CompanyMotivationalCarouselProps> = ({
  companyId: propCompanyId,
  companyName: propCompanyName
}) => {
  const { user, empresa } = useAuth();
  const [banners, setBanners] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Resolver ID da empresa
  const resolvedCompanyId = propCompanyId || user?.companyId || empresa?.id || (() => {
    try {
      const saved = localStorage.getItem('empresa');
      if (saved) return JSON.parse(saved)?.id;
    } catch {}
    return null;
  })();

  // Carregar banners da empresa
  useEffect(() => {
    if (!resolvedCompanyId) return;

    let isMounted = true;
    setLoading(true);

    companyService.getCompanyById(resolvedCompanyId)
      .then((comp: any) => {
        if (!isMounted) return;
        const urls = comp?.bannerUrls || [];
        if (Array.isArray(urls)) {
          setBanners(urls.filter((u: any) => typeof u === 'string' && u.trim().length > 0));
        } else if (typeof urls === 'string' && urls.trim().length > 0) {
          try {
            const parsed = JSON.parse(urls);
            if (Array.isArray(parsed)) setBanners(parsed);
          } catch {
            setBanners(urls.split(',').map((s: string) => s.trim()).filter(Boolean));
          }
        }
      })
      .catch((err) => {
        console.warn('⚠️ Não foi possível carregar os banners da empresa:', err?.message || err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedCompanyId]);

  // Navegação
  const nextBanner = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevBanner = useCallback(() => {
    if (banners.length <= 1) return;
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Rotação automática suave a cada 5 segundos (pausa no hover ou botão)
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextBanner();
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isPaused, nextBanner]);

  // Se não houver banners cadastrados para a empresa, não renderiza
  if (!banners || banners.length === 0) {
    return null;
  }

  const currentBannerUrl = resolveCompanyBannerUrl(banners[currentIndex]) || banners[currentIndex];
  const displayName = propCompanyName || empresa?.nome || user?.companyName || 'Equipe';

  return (
    <div 
      className="relative w-full rounded-2xl overflow-hidden border border-zinc-700/80 bg-zinc-950/60 shadow-xl shadow-black/40 group transition-all duration-300 hover:border-amber-500/50"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Banners Motivacionais da Empresa"
    >
      {/* Container da Imagem com Altura Proporcional */}
      <div className="relative w-full h-44 sm:h-56 md:h-64 lg:h-72 bg-zinc-950 flex items-center justify-center overflow-hidden">
        {banners.map((url, idx) => {
          const bannerSrc = resolveCompanyBannerUrl(url) || url;
          const isActive = idx === currentIndex;
          return (
            <div
              key={`${url}-${idx}`}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <img
                src={bannerSrc}
                alt={`Banner motivacional ${idx + 1} - ${displayName}`}
                className="w-full h-full object-cover select-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              {/* Gradiente sutil nas bordas para integração com o tema escuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-black/20 pointer-events-none" />
            </div>
          );
        })}

        {/* Badge Flutuante de Motivação */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-black/70 backdrop-blur-md border border-amber-500/30 px-3 py-1 rounded-full shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
            Motivação {displayName}
          </span>
        </div>

        {/* Indicador de Pausa / Reprodução */}
        {banners.length > 1 && (
          <button
            type="button"
            onClick={() => setIsPaused(prev => !prev)}
            className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-zinc-700/80 text-zinc-300 hover:text-white transition-all shadow opacity-0 group-hover:opacity-100"
            title={isPaused ? 'Continuar rotação automática' : 'Pausar rotação automática'}
          >
            {isPaused ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3" />}
          </button>
        )}

        {/* Controles de Navegação Lateral (visíveis no hover) */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevBanner}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-zinc-700/80 text-white shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
              aria-label="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-zinc-700/80 text-white shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
              aria-label="Próximo banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicadores em Pontos (Dots) na parte inferior */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-zinc-800 shadow">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? 'w-6 h-2 bg-amber-400 shadow-sm shadow-amber-400/50'
                    : 'w-2 h-2 bg-zinc-500 hover:bg-zinc-300'
                }`}
                aria-label={`Ir para o banner ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyMotivationalCarousel;
