import React, { useState, useEffect, useRef } from 'react';
import { 
  Accessibility, 
  SunMoon, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  X, 
  ChevronDown, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface AccessibilityBarProps {
  className?: string;
  skipTargetId?: string;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  className = '',
  skipTargetId = 'login-card'
}) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('pref_high_contrast') === 'true';
  });

  const [fontScale, setFontScale] = useState<number>(() => {
    const saved = localStorage.getItem('pref_font_scale');
    return saved ? parseFloat(saved) : 100;
  });

  // Aplicar alto contraste no documento
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

  // Aplicar escala de fonte no documento
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${fontScale}%`;
    localStorage.setItem('pref_font_scale', fontScale.toString());
  }, [fontScale]);

  // Fechar ao clicar fora ou apertar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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

  const triggerVLibras = () => {
    const vLibrasBtn = document.querySelector('[vw-access-button]') as HTMLElement;
    if (vLibrasBtn) {
      vLibrasBtn.click();
      setIsOpen(false);
    } else {
      console.warn('Botão do VLibras ainda não carregado no DOM');
    }
  };

  const scrollToContent = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(skipTargetId) || document.getElementById('username') || document.querySelector('form');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      target.focus?.();
      setIsOpen(false);
    }
  };

  const hasModifications = highContrast || fontScale !== 100;

  return (
    <div ref={menuRef} className={`fixed top-3 right-3 sm:top-4 sm:right-4 z-50 ${className}`}>
      {/* Botão Flutuante Compacto Unificado */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Abrir Opções de Acessibilidade"
        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md transition-all duration-200 select-none ${
          hasModifications
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 ring-2 ring-amber-500/30'
            : 'bg-slate-900/85 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white hover:border-slate-600'
        }`}
      >
        <Accessibility className="h-4 w-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-200" />
        <span className="hidden xs:inline">Acessibilidade</span>
        
        {/* Indicador de Modificação Ativa */}
        {hasModifications && (
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Preferências ativas" />
        )}

        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Painel Suspenso de Acessibilidade Unificado */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="Painel de Acessibilidade"
          className="absolute right-0 mt-2 w-[290px] sm:w-[320px] bg-slate-950/95 text-slate-100 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Accessibility className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Acessibilidade
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar painel"
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* 0. Tema de Contraste (Escuro / Grafite / Branco) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <SunMoon className="h-3.5 w-3.5 text-cyan-400" />
                Tema / Contraste
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 uppercase">
                {theme === 'white' ? 'Branco' : theme === 'graphite' ? 'Grafite' : 'Escuro'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'dark'
                    ? 'bg-red-600 !text-white border-red-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                Escuro
              </button>
              <button
                type="button"
                onClick={() => setTheme('graphite')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'graphite'
                    ? 'bg-red-600 !text-white border-red-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                Grafite
              </button>
              <button
                type="button"
                onClick={() => setTheme('white')}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  theme === 'white'
                    ? 'bg-red-600 !text-white border-red-500 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                Branco
              </button>
            </div>
          </div>

          {/* 1. Alto Contraste */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <SunMoon className="h-3.5 w-3.5 text-amber-400" />
                Alto Contraste
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                highContrast ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {highContrast ? 'ATIVADO' : 'DESLIGADO'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:text-white'
              }`}
            >
              <SunMoon className="h-4 w-4" />
              <span>{highContrast ? 'Desativar Alto Contraste' : 'Ativar Alto Contraste'}</span>
            </button>
          </div>

          {/* 2. Tamanho da Fonte */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Tamanho do Texto</span>
              <span className="font-mono text-[11px] font-bold text-cyan-400">{fontScale}%</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={decreaseFont}
                disabled={fontScale <= 80}
                aria-label="Diminuir fonte"
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-700 transition-all"
              >
                <ZoomOut className="h-3.5 w-3.5" />
                <span>A-</span>
              </button>

              <button
                type="button"
                onClick={resetAll}
                disabled={!hasModifications}
                title="Redefinir tamanho para 100%"
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 transition-all"
              >
                <RotateCcw className="h-3 w-3 text-slate-400" />
                <span className="text-[11px]">100%</span>
              </button>

              <button
                type="button"
                onClick={increaseFont}
                disabled={fontScale >= 140}
                aria-label="Aumentar fonte"
                className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-700 transition-all"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                <span>A+</span>
              </button>
            </div>
          </div>

          {/* 3. Tradutor VLibras (Língua Brasileira de Sinais) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span>🤟</span> Tradução em Libras
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded">
                VLibras
              </span>
            </div>
            <button
              type="button"
              onClick={triggerVLibras}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600/90 hover:bg-blue-600 text-white shadow-md shadow-blue-900/30 border border-blue-500/40 transition-all"
            >
              <span>🤟</span>
              <span>Abrir Tradutor de Sinais</span>
              <ExternalLink className="h-3 w-3 opacity-70 ml-0.5" />
            </button>
          </div>

          {/* 4. Atalho Pular para o Conteúdo */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={scrollToContent}
              className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline py-1 transition-colors"
            >
              ↓ Ir direto para o Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityBar;
