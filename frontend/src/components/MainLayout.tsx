import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  HelpCircle,
  Headphones,
  CalendarDays,
  Building2
} from 'lucide-react';
import { getRoleDisplayName } from '@/utils/permissions';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { Breadcrumb } from './Breadcrumb';
import { NotificationBell } from './NotificationBell';
import UserProfileModal from './UserProfileModal';
import { BottomNav } from './BottomNav';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import WelcomeModal from './WelcomeModal';
import HelpModal from './HelpModal';
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
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState(0);
  const navigate = useNavigate();

  // Data formatada em português (ex: Quarta-feira, 16 de Setembro)
  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      const raw = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      }).format(now);
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    } catch {
      return 'Hoje';
    }
  }, []);

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  // Verificar se é primeiro acesso para abrir WelcomeModal
  useEffect(() => {
    if (user?.id) {
      const welcomeKey = `welcome_shown_${user.id}`;
      const alreadyShown = localStorage.getItem(welcomeKey);
      if (!alreadyShown && !user.firstAccessCompleted) {
        setIsWelcomeModalOpen(true);
      }
    }
  }, [user?.id, user?.firstAccessCompleted]);

  // Buscar conversas não lidas para o badge
  useEffect(() => {
    let mounted = true;
    const loadUnread = async () => {
      try {
        const stats = await chatIntegrationService.getStats();
        if (mounted && stats && typeof stats.unread === 'number') {
          setUnreadChats((prev) => (prev !== stats.unread ? stats.unread : prev));
        }
      } catch {
        // silenciar
      }
    };

    const tick = () => {
      if (document.visibilityState === 'visible') {
        loadUnread();
      }
    };

    const initialTimeout = setTimeout(tick, 4000);
    const interval = setInterval(tick, 60000);
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

  const companyName = empresa?.nome || (user as any)?.company?.name || (user as any)?.companyName || '';

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 relative">
      {/* Sidebar colapsível */}
      <CollapsibleSidebar
        collapsed={collapsed}
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />

      {/* Conteúdo principal */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
        isMobile ? 'ml-0' : (collapsed ? 'ml-16' : 'ml-64')
      }`}>
        {/* Header Interativo e Moderno */}
        <header className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-40 h-[64px] transition-all">
          <div className="flex items-center justify-between px-4 sm:px-6 h-full gap-2 sm:gap-4">
            {/* Lado esquerdo: Toggle + Logo Dinâmica + Título */}
            <div className="flex items-center space-x-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-muted-foreground hover:text-white hover:bg-white/5 h-8 w-8 transition-all hidden md:flex shrink-0"
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>

              {/* Logo Dinâmica (Logo da Empresa logada ou FluxBus) */}
              <div className="flex items-center space-x-3 shrink-0">
                <Logo size="sm" className="h-7 md:h-8" />
              </div>
            </div>

            {/* Centro: Data do dia formatada */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-medium shadow-inner shrink-0">
                <CalendarDays className="h-3.5 w-3.5 text-red-500 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Lado direito: Ações + Ajuda + Atendimento + Perfil + Notificações + Sair */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
              {actions && (
                <div className="hidden lg:block">
                  {actions}
                </div>
              )}

              {/* Botão de Ajuda e Suporte (Novo) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHelpModalOpen(true)}
                className="relative text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 h-8 px-2 sm:px-2.5 rounded-lg transition-all flex items-center gap-1.5"
                title="Central de Ajuda, Tutoriais e Suporte"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-[11px] font-medium hidden md:inline">Ajuda</span>
              </Button>

              {/* Botão de Gestão de Atendimento & WhatsApp (Melhorado) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/gestao-atendimento/whatsapp')}
                className="relative text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 h-8 px-2 sm:px-2.5 rounded-lg transition-all flex items-center gap-1.5"
                title="Gestão de Atendimento, Chatbot e WhatsApp"
              >
                <Headphones className="h-4 w-4 text-purple-400" />
                <span className="text-[11px] font-medium hidden md:inline">Atendimento</span>
                {unreadChats > 0 && (
                  <Badge
                    variant="destructive"
                    className="h-4 min-w-[16px] px-1 text-[9px] font-bold flex items-center justify-center animate-pulse"
                  >
                    {unreadChats > 9 ? '9+' : unreadChats}
                  </Badge>
                )}
              </Button>

              {/* Perfil do Usuário */}
              <div
                className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-white/5 transition-all"
                onClick={handleProfileClick}
                title="Ver meu perfil"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-medium text-white leading-none mb-0.5 truncate max-w-[130px]">
                    {user.name}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {companyName && (
                      <span className="text-[9px] text-zinc-400 font-medium truncate max-w-[80px]">
                        {companyName}
                      </span>
                    )}
                    <Badge className="bg-primary/20 text-primary text-[8px] h-3.5 font-bold uppercase border-none rounded-sm px-1 italic">
                      {getRoleDisplayName(user.role)}
                    </Badge>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-md">
                  <User className="h-4 w-4 text-black font-bold" />
                </div>
              </div>

              <NotificationBell />

              <ThemeToggle />

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-muted-foreground hover:text-white hover:bg-white/5 h-8 px-2 sm:px-3 rounded-lg text-xs border border-white/10 transition-all"
                title="Encerrar Sessão"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-visible bg-background">
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
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 w-full shadow-sm">
            <div className="min-w-0 w-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation para Mobile */}
      {isMobile && (
        <BottomNav onToggleSidebar={toggleSidebar} />
      )}

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Modal de Boas-Vindas (Primeiro Acesso ou Tour) */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        user={user}
        companyName={companyName}
      />

      {/* Modal de Ajuda & Suporte */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onOpenWelcomeTour={() => setIsWelcomeModalOpen(true)}
      />
    </div>
  );
};

export default MainLayout;