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

  const isVss = useMemo(() => {
    const raw = `${empresa?.sigla || ''} ${empresa?.nome || ''} ${empresa?.name || ''} ${empresa?.tradeName || ''} ${(user as any)?.company?.name || ''} ${(user as any)?.companyName || ''}`.toUpperCase();
    return raw.includes('VSS') || raw.includes('SILVESTRE') || raw.includes('SAO SILVESTRE') || raw.includes('SÃO SILVESTRE');
  }, [empresa, user]);

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
                className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 w-8 transition-all hidden md:flex shrink-0"
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>

              {/* Logo Dinâmica (Logo da Empresa logada ou FluxBus) */}
              <div className="flex items-center space-x-3 shrink-0">
                <Logo
                  showText={false}
                  size="sm"
                  className="transition-transform hover:scale-105"
                  iconClassName="h-7 w-7 text-primary"
                />
                <div className="hidden sm:block">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold tracking-tight text-foreground">
                      {companyName || 'FluxBus'}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1.5 py-0 font-medium border-border text-muted-foreground">
                      v2.0
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">
                    Gestão Integrada de Frotas & Operações
                  </p>
                </div>
              </div>
            </div>

            {/* Centro: Data do dia formatada */}
            <div className="hidden sm:flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/80 border border-border text-[11px] text-foreground font-medium shadow-sm shrink-0">
                <CalendarDays className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                <span>{formattedDate}</span>
              </div>
            </div>

            {/* Lado direito: Ações, Perfil e Notificações */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {actions && (
                <div className="hidden lg:block">
                  {actions}
                </div>
              )}

              {/* Botão de Ajuda / Suporte */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-2 sm:px-2.5 rounded-lg text-xs gap-1.5 transition-all"
                title="Central de Ajuda e Suporte"
              >
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="hidden md:inline text-[11px] font-medium">Ajuda</span>
              </Button>

              {/* Botão de Chat Interno */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/chat-interno')}
                className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-2 sm:px-2.5 rounded-lg text-xs gap-1.5 transition-all relative"
                title="Chat e Mensagens Internas"
              >
                <Headphones className="h-4 w-4 text-primary" />
                <span className="hidden md:inline text-[11px] font-medium">Chat</span>
                {unreadChats > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                    {unreadChats > 99 ? '99+' : unreadChats}
                  </span>
                )}
              </Button>

              {/* Perfil do Usuário */}
              <div
                className="flex items-center space-x-2 cursor-pointer p-1 rounded-lg hover:bg-accent/60 transition-all"
                onClick={handleProfileClick}
                title="Ver meu perfil"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-foreground leading-none mb-0.5 truncate max-w-[130px]">
                    {user.name}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {companyName && (
                      <span className="text-[9px] text-muted-foreground font-medium truncate max-w-[80px]">
                        {companyName}
                      </span>
                    )}
                    <Badge className="bg-primary/15 text-primary text-[8px] h-3.5 font-bold uppercase border-none rounded-sm px-1 italic">
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
                className="text-muted-foreground hover:text-foreground hover:bg-accent h-8 px-2 sm:px-3 rounded-lg text-xs border border-border transition-all"
                title="Encerrar Sessão"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-visible bg-background relative z-10">
          {/* Fundo Personalizado VSS (Viação São Silvestre) */}
          {isVss && (
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
              {/* Imagem de Fundo Fotográfica */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-700"
                style={{
                  backgroundImage: `url('/vss-bg.jpg')`,
                  filter: 'blur(1.5px) brightness(0.60) saturate(0.85)',
                  opacity: 0.16,
                }}
              />
              {/* Camadas de Gradiente Suave para Máxima Legibilidade dos Textos e Métricas */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/88 to-background/98" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background/40 to-background/95" />
            </div>
          )}

          {/* Breadcrumb */}
          <div className="mb-4 relative z-10">
            <Breadcrumb />
          </div>

          {/* Título da página */}
          {(title || subtitle) && (
            <div className="mb-6 relative z-10">
              {title && (
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 tracking-tight">
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

          {/* Conteúdo principal */}
          <div className="w-full min-w-0 relative z-10">
            {children}
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