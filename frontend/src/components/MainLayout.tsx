import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';
import UserProfileModal from './UserProfileModal';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  title,
  subtitle 
}) => {
  const { user, logout } = useAuth();
  const { collapsed, isMobile, toggleSidebar } = useSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-seguranca-graphite">
      {/* Sidebar colapsível */}
      <CollapsibleSidebar 
        collapsed={collapsed} 
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />

      {/* Conteúdo principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isMobile ? 'ml-0' : (collapsed ? 'ml-16' : 'ml-64')
      }`}>
        {/* Header com botão de toggle */}
        <header className="bg-seguranca-black shadow-lg border-b border-gray-700 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Lado esquerdo - Botão toggle e título */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-seguranca-lightgray hover:text-seguranca-yellow hover:bg-seguranca-graphite"
              >
                {collapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-seguranca-yellow" />
                <span className="text-lg font-bold text-seguranca-lightgray">
                  Secure Guard
                </span>
              </div>
            </div>

            {/* Lado direito - Informações do usuário */}
            <div className="flex items-center space-x-4">
              <div 
                className="flex items-center space-x-2 cursor-pointer hover:bg-seguranca-black p-2 rounded-lg transition-colors"
                onClick={handleProfileClick}
              >
                <User className="h-4 w-4 text-seguranca-lightgray" />
                <span className="text-seguranca-lightgray text-sm hidden sm:block hover:text-seguranca-yellow transition-colors">
                  {user.name}
                </span>
                <Badge className={`${getRoleColor(user.role)} text-xs`}>
                  {getRoleDisplayName(user.role)}
                  {user.role === 'SUPER_ADMIN' && ' 🟥'}
                </Badge>
              </div>
              
              {/* Ícone de Notificações */}
              <NotificationBell />
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 md:p-6">
          {/* Breadcrumb */}
          <Breadcrumb />
          
          {/* Título da página (se fornecido) */}
          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl md:text-3xl font-bold text-seguranca-lightgray mb-2">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-seguranca-lightgray text-sm md:text-base">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Conteúdo principal */}
          <div className="bg-seguranca-black rounded-lg border border-gray-700 p-4 md:p-6" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            {children}
          </div>
        </main>
      </div>

      {/* Modal de Perfil */}
      <UserProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
}; 