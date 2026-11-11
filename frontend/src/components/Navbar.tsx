import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuoteModal from '@/components/QuoteModal';
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { getFluxbusLogoSrc } from '@/lib/brandAssets';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const { isDark } = useTheme();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const logoSrc = getFluxbusLogoSrc(isDark);
  const navLinkClass = isDark
    ? 'text-slate-200 hover:text-cyan-400 transition-colors font-medium text-sm'
    : 'text-slate-700 hover:text-red-600 transition-colors font-medium text-sm';
  const mobileNavLinkClass = isDark
    ? 'text-slate-200 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base'
    : 'text-slate-800 hover:text-red-600 transition-colors font-medium px-2 py-2 text-base';

  return (
    <>
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-lg transition-colors duration-300 ${
          isDark
            ? 'bg-slate-950/90 border-slate-800/80'
            : 'bg-white/95 border-slate-200'
        }`}
      >
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center space-x-3 shrink-0">
              <a href="/" className="flex items-center py-1">
                <img
                  src={logoSrc}
                  alt="FluxBus - Gestão de Fretamento e Turismo"
                  className="h-11 sm:h-14 md:h-16 w-auto object-contain hover:scale-105 transition-transform"
                />
              </a>
            </div>

            {/* Menu para desktop */}
            <nav className="hidden md:flex space-x-7">
              <a href="/" className={navLinkClass}>Home</a>
              <a href="/quem-somos" className={navLinkClass}>Quem Somos</a>
              <a href="/servicos-publico" className={navLinkClass}>Serviços</a>
              <a href="/trabalhe-conosco" className={navLinkClass}>Trabalhe Conosco</a>
              <a href="/contato" className={navLinkClass}>Contato</a>
            </nav>

            {/* Botões + Contraste para desktop */}
            <div className="hidden md:flex items-center gap-2.5 shrink-0">
              <ThemeToggle />
              <a
                href="/login"
                className={`transition-colors font-medium text-sm px-4 py-2 rounded-lg border shadow-sm ${
                  isDark
                    ? 'text-slate-200 hover:text-white border-slate-700/80 bg-slate-900/80 hover:bg-slate-800'
                    : 'text-slate-800 hover:text-slate-950 border-slate-300 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                Área Administrativa
              </a>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-900/30 px-5 py-2.5 rounded-lg transition-all hover:scale-105"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Controles Mobile (Contraste + Menu) */}
            <div className="flex md:hidden items-center gap-2">
              <ThemeToggle />
              <button
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-slate-200 hover:bg-slate-900' : 'text-slate-800 hover:bg-slate-100'
                }`}
                onClick={toggleMobileMenu}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className={`md:hidden py-4 border-t mt-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <nav className="flex flex-col space-y-3">
                <a href="/" className={mobileNavLinkClass}>Home</a>
                <a href="/quem-somos" className={mobileNavLinkClass}>Quem Somos</a>
                <a href="/servicos-publico" className={mobileNavLinkClass}>Serviços</a>
                <a href="/trabalhe-conosco" className={mobileNavLinkClass}>Trabalhe Conosco</a>
                <a href="/contato" className={mobileNavLinkClass}>Contato</a>
                <div className={`flex flex-col space-y-3 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-slate-200'}`}>
                  <a
                    href="/login"
                    className={`transition-colors font-medium px-4 py-3 rounded-lg text-center border ${
                      isDark
                        ? 'text-slate-200 hover:text-white border-slate-700 bg-slate-900'
                        : 'text-slate-800 hover:text-slate-950 border-slate-300 bg-slate-50'
                    }`}
                  >
                    Área Administrativa
                  </a>
                  <Button
                    className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-900/30 w-full py-3 rounded-lg"
                    onClick={() => setIsQuoteModalOpen(true)}
                  >
                    Solicitar Demonstração
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
      />
    </>
  );
};

export default Navbar;
