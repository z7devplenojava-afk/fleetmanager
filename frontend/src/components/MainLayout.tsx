import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bus,
  Building2,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { getRoleDisplayName, getRoleColor } from '@/utils/permissions';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';
import UserProfileModal from './UserProfileModal';
import { BottomNav } from './BottomNav';
import ThemeToggle from './ThemeToggle';
import chatIntegrationService from '@/services/chatIntegrationService';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { user, logout, empresa } = useAuth();
  const { collapsed, isMobile, toggleSidebar } = useSidebar();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  // Buscar conversas não lidas para o badge (poll leve, só quando aba visível)
  useEffect(() => {
    let mounted = true;
    const loadUnread = async () => {
      try {
        const stats = await chatIntegrationService.getStats();
        if (mounted) setUnreadChats(stats.unread);
      } catch {
        // silenciar
      }
    };

    const tick = () => {
      if (document.visibilityState === 'visible') {
        loadUnread();
      }
    };

    // Espera 5s antes do primeiro poll para não competir com o carregamento inicial
    const initialTimeout = setTimeout(tick, 5000);
    // A cada 60s — bem mais espaçado, o número de não lidas não muda tão rápido
    const interval = setInterval(tick, 60000);

    // Recarrega quando o usuário volta para a aba
    document.addEventListener('visibilitychange', tick);

    return () => {
      mounted = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* Sidebar colapsível */}
      <CollapsibleSidebar
        collapsed={collapsed}
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />

      {/* Conteúdo principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${isMobile ? 'ml-0' : (collapsed ? 'ml-16' : 'ml-64')
        }`}>
        {/* Header - Solid Dark Style */}
        <header className="bg-background border-b border-border sticky top-0 z-40 h-[64px] transition-all">
          <div className="flex items-center justify-between px-6 h-full">
            {/* Lado esquerdo */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-muted-foreground hover:text-white hover:bg-white/5 h-8 w-8 transition-all hidden md:flex"
              >
                {collapsed ? (
                  <ChevronRight size={18} />
                ) : (
                  <ChevronLeft size={18} />
                )}
              </Button>

              {/* Branding da empresa ou padrão */}
              {empresa?.logoUrl ? (
                <div className="flex items-center" data-animate="fadeRight">
                  <img
                    src={(() => {
                      if (!empresa.logoUrl) return '';
                      if (empresa.logoUrl.startsWith('http')) return empresa.logoUrl;
                      // Remover /api do final da URL base se existir
                      const baseUrl = getApiUrl().replace(/\/api\/?$/, '');
                      // Garantir que o path comece com /
                      const path = empresa.logoUrl.startsWith('/') ? empresa.logoUrl : `/${empresa.logoUrl}`;
                      return `${baseUrl}${path}`;
                    })()}
                    onError={(e) => {
                      console.error('Erro ao carregar logo da empresa:', empresa.logoUrl);
                      e.currentTarget.style.display = 'none';
                      // Tentar mostrar o fallback de texto
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const textElement = parent.querySelector('h2');
                        if (textElement) textElement.style.display = 'block';
                      }
                    }}
                    alt={empresa.nome || 'Empresa'}
                    className="h-10 w-auto object-contain rounded bg-white/5 border border-white/10 p-1 shadow-lg shadow-white/5"
                  />
                </div>
              ) : empresa?.nome ? (
                <div className="flex items-center space-x-3" data-animate="fadeRight">
                  <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-white truncate max-w-[160px]">
                    {empresa.nome}
                  </h2>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                    <Bus className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold tracking-tight text-white uppercase italic">
                    Flex<span className="text-white not-italic">Bus</span>
                  </h2>
                </div>
              )}
            </div>

            {/* Lado direito */}
            <div className="flex items-center space-x-4">
              {actions && (
                <div className="hidden md:block">
                  {actions}
                </div>
              )}

              <div
                className="flex items-center space-x-3 cursor-pointer p-1 rounded transition-all"
                onClick={handleProfileClick}
              >
                <div className="hidden md:block text-right">
                  <p className="text-xs font-medium text-white leading-none mb-1">
                    {user.name}
                  </p>
                  <Badge className="bg-primary/20 text-primary text-[9px] h-4 font-bold uppercase border-none rounded-sm px-1 italic">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-black" />
                </div>
              </div>

              {/* Botão de Chat WhatsApp - acesso rápido ao atendimento */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/gestao-atendimento/whatsapp')}
                className="relative text-muted-foreground hover:text-white hover:bg-white/5 h-8 px-2 rounded transition-all"
                title="Atendimento WhatsApp e Chatbot"
              >
                <Smartphone className="h-4 w-4" />
                {unreadChats > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center"
                  >
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </Badge>
                )}
              </Button>

              <NotificationBell />

              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-white hover:bg-white/5 h-8 px-3 rounded text-xs border border-white/10 transition-all"
              >
                <LogOut className="h-3.5 w-3.5 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-6 md:p-8 overflow-visible bg-background">
          {/* Breadcrumb */}
          <div className="mb-4">
            <Breadcrumb />
          </div>

          {/* Título da página */}
          {(title || subtitle) && (
            <div className="mb-6">
              {title && (
                <h1 className="text-2xl font-bold text-white mb-1">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          )}


          {/* Conteúdo principal - Solid Box Layering */}
          <div className="bg-card border border-border rounded-lg p-6 w-full shadow-sm">
            <div className="min-w-0 w-full">
              {children}
            </div>
          </div>
        </main>
      </div >

      {/* Bottom Navigation para Mobile */}
      {
        isMobile && (
          <BottomNav onToggleSidebar={toggleSidebar} />
        )
      }

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div >
  );
};