
import React from 'react';
import { Bell, Mail, Search, ArrowLeft, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserMenu from './UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const { profile } = useAuth();
  const username = profile?.full_name || profile?.username || 'Usuário';

  return (
    <header className="h-16 bg-seguranca-graphite shadow-md px-4 flex items-center justify-between flex-shrink-0 z-40 border-b border-gray-700">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <SidebarTrigger className="text-seguranca-lightgray hover:text-seguranca-yellow" />
        
        {/* Logo e Nome do Sistema - Igual à imagem */}
        <div className="flex items-center gap-2">
          <ArrowLeft className="text-seguranca-lightgray" size={20} />
          <BarChart3 className="text-seguranca-yellow" size={24} />
          <h2 className="text-lg font-medium text-seguranca-lightgray">
            Secure Guard
          </h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Campo de Pesquisa */}
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-seguranca-black text-seguranca-lightgray pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-seguranca-yellow w-64"
          />
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
        </div>
        
        {/* Ícones de Notificação e Mensagens */}
        <div className="flex gap-2">
          {/* Ícone de Mensagens */}
          <button className="relative p-2 rounded-full hover:bg-seguranca-black transition-colors">
            <Mail className="text-seguranca-lightgray" size={20} />
            <span className="absolute top-0 right-0 h-4 w-4 bg-seguranca-red rounded-full text-xs flex items-center justify-center text-white">3</span>
          </button>
          
          {/* Centro de Notificações - Modal com mensagens e notificações */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* Menu do Usuário */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
