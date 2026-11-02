import React, { useState, useEffect } from 'react';
import { Eye, SunMoon, RotateCcw, ZoomIn, ZoomOut, Accessibility } from 'lucide-react';

interface AccessibilityBarProps {
  className?: string;
  skipTargetId?: string;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  className = '',
  skipTargetId = 'main-content'
}) => {
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('pref_high_contrast') === 'true';
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('pref_font_scale');
    return saved ? parseFloat(saved) : 100;
  });

  // Aplicar alto contraste
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast-mode');
      localStorage.setItem('pref_high_contrast', 'true');
    } else {
      root.classList.remove('high-contrast-mode');
      localStorage.setItem('pref_high_contrast', 'false');
    }
  }, [highContrast]);

  // Aplicar escala de fonte
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontScale}%`;
    localStorage.setItem('pref_font_scale', fontScale.toString());
  }, [fontScale]);

  const toggleHighContrast = () => setHighContrast(prev => !prev);

  const increaseFont = () => {
    setFontScale(prev => Math.min(prev + 10, 140));
  };

  const decreaseFont = () => {
    setFontScale(prev => Math.max(prev - 10, 80));
  };

  const resetAll = () => {
    setHighContrast(false);
    setFontScale(100);
    const root = document.documentElement;
    root.classList.remove('high-contrast-mode');
    root.style.fontSize = '100%';
    localStorage.removeItem('pref_high_contrast');
    localStorage.removeItem('pref_font_scale');
  };

  return (
    <aside
      aria-label="Barra de Acessibilidade"
      className={`w-full bg-slate-900/90 text-slate-200 border-b border-slate-700/60 text-xs px-3 py-1.5 backdrop-blur-sm ${className}`}
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Atalho Pular para o Conteúdo */}
        <div className="flex items-center gap-2">
          <a
            href={`#${skipTargetId}`}
            className="sr-only focus:not-sr-only focus:bg-cyan-600 focus:text-white focus:px-3 focus:py-1 focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all font-semibold"
          >
            Ir para o Conteúdo Principal
          </a>
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Accessibility className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Acessibilidade Cidadã</span>
          </div>
        </div>

        {/* Controles de Acessibilidade */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Alto Contraste */}
          <button
            type="button"
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            aria-label={highContrast ? 'Desativar Alto Contraste' : 'Ativar Alto Contraste'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border ${
              highContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
            }`}
          >
            <SunMoon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Alto Contraste</span>
          </button>

          {/* Diminuir Fonte */}
          <button
            type="button"
            onClick={decreaseFont}
            aria-label="Diminuir tamanho do texto (A-)"
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all"
          >
            <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>A-</span>
          </button>

          {/* Indicador de Tamanho */}
          <span className="text-[11px] font-mono text-slate-400 px-1 hidden md:inline" aria-live="polite">
            {fontScale}%
          </span>

          {/* Aumentar Fonte */}
          <button
            type="button"
            onClick={increaseFont}
            aria-label="Aumentar tamanho do texto (A+)"
            className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white transition-all"
          >
            <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            <span>A+</span>
          </button>

          {/* Redefinir */}
          {(highContrast || fontScale !== 100) && (
            <button
              type="button"
              onClick={resetAll}
              aria-label="Redefinir padrões de acessibilidade"
              title="Redefinir tamanho e contraste"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Padrão</span>
            </button>
          )}

          {/* Badge VLibras Indicativo */}
          <span
            className="text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 rounded px-1.5 py-0.5 font-medium ml-1"
            title="Tradução em Libras disponível no botão lateral"
          >
            🤟 VLibras Ativo
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AccessibilityBar;

