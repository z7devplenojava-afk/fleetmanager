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
      <header className="shadow-lg border-b border-red-800 sticky top-0 z-50 bg-gradient-to-r from-black via-red-950 to-black">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <a href="/" className="flex items-center py-1">
                <img
                  src="/fluxbus-logo.png"
                  alt="FluxBus - Gestão de Fretamento e Turismo"
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform"
                />
              </a>
            </div>

            {/* Menu para desktop */}
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="text-gray-300 hover:text-red-500 transition-colors font-medium">Home</a>
              <a href="/quem-somos" className="text-gray-300 hover:text-red-500 transition-colors font-medium">Quem Somos</a>
              <a href="/servicos-publico" className="text-gray-300 hover:text-red-500 transition-colors font-medium">Serviços</a>
              <a href="/trabalhe-conosco" className="text-gray-300 hover:text-red-500 transition-colors font-medium">Trabalhe Conosco</a>
              <a href="/contato" className="text-gray-300 hover:text-red-500 transition-colors font-medium">Contato</a>
            </nav>

            {/* Botões para desktop */}
            <div className="hidden md:flex items-center gap-3">
              <a href="/login" className="text-black hover:text-gray-800 transition-colors font-medium px-4 py-2 rounded bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">Área Administrativa</a>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2"
                onClick={() => setIsQuoteModalOpen(true)}
              >
                Solicitar Orçamento
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Botão do menu mobile */}
            <button
              className="md:hidden text-white p-2"
              onClick={toggleMobileMenu}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-red-800">
              <nav className="flex flex-col space-y-3">
                <a href="/" className="text-gray-300 hover:text-red-500 transition-colors font-medium px-2 py-2">Home</a>
                <a href="/quem-somos" className="text-gray-300 hover:text-red-500 transition-colors font-medium px-2 py-2">Quem Somos</a>
                <a href="/servicos-publico" className="text-gray-300 hover:text-red-500 transition-colors font-medium px-2 py-2">Serviços</a>
                <a href="/trabalhe-conosco" className="text-gray-300 hover:text-red-500 transition-colors font-medium px-2 py-2">Trabalhe Conosco</a>
                <a href="/contato" className="text-gray-300 hover:text-red-500 transition-colors font-medium px-2 py-2">Contato</a>
                <div className="flex flex-col space-y-3 pt-3">
                  <a href="/login" className="text-black hover:text-gray-800 transition-colors font-medium px-4 py-3 rounded text-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">Área Administrativa</a>
                  <Button
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 w-full py-3"
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
