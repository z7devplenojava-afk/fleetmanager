import React, { useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QuoteModal from '@/components/QuoteModal';
// import logoImage from '@/assets/logo.svg';

const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-2xl">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center py-1">
                <img
                  src="/fluxbus-logo.png"
                  alt="FluxBus - Gestão de Fretamento e Turismo"
                  className="h-12 sm:h-16 md:h-18 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform"
                />
              </a>
            </div>

            {/* Menu para desktop */}
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Home</a>
              <a href="/quem-somos" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Quem Somos</a>
              <a href="/servicos-publico" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Serviços</a>
              <a href="/trabalhe-conosco" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Trabalhe Conosco</a>
              <a href="/contato" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium text-sm">Contato</a>
            </nav>

            {/* Botões para desktop */}
            <div className="hidden md:flex items-center gap-3">
              <a 
                href="/login" 
                className="text-slate-200 hover:text-white transition-colors font-medium text-sm px-4 py-2 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 shadow-sm"
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

            {/* Botão do menu mobile */}
            <button
              className="md:hidden text-slate-200 p-2 rounded-lg hover:bg-slate-900"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col space-y-3">
                <a href="/" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base">Home</a>
                <a href="/quem-somos" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base">Quem Somos</a>
                <a href="/servicos-publico" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base">Serviços</a>
                <a href="/trabalhe-conosco" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base">Trabalhe Conosco</a>
                <a href="/contato" className="text-slate-300 hover:text-cyan-400 transition-colors font-medium px-2 py-2 text-base">Contato</a>
                <div className="flex flex-col space-y-3 pt-3 border-t border-slate-800/80">
                  <a href="/login" className="text-slate-200 hover:text-white transition-colors font-medium px-4 py-3 rounded-lg text-center border border-slate-700 bg-slate-900">
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
