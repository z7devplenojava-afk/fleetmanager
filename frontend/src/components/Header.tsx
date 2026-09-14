
import React from 'react';
import { Mail, Search, Bus, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import UserMenu from './UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ui/theme-toggle';

const Header: React.FC = () => {
  const { profile, empresa } = useAuth();
  const username = profile?.full_name || profile?.username || 'Usuário';

  // Monta URL completa da logo da empresa (se relativa)
  const logoSrc = empresa?.logoUrl
    ? empresa.logoUrl.startsWith('http')
      ? empresa.logoUrl
      : `${getApiUrl().replace(/\/api\/?$/, '')}${empresa.logoUrl.startsWith('/') ? '' : '/'}${empresa.logoUrl}`
    : null;

  return (
    <header
      className="h-16 bg-gradient-to-r from-card via-card/95 to-card shadow-sm px-4 flex items-center justify-between flex-shrink-0 z-40 border-b border-border/50 backdrop-blur-md transition-colors duration-300"
      style={{ borderBottomColor: empresa?.temaCor || 'var(--primary)' }}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <SidebarTrigger className="text-muted-foreground hover:text-primary active:scale-90 transition-all h-11 w-11" />

        {/* Logo e Nome - empresa ou padrão */}
        {logoSrc ? (
          <div className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-all" data-animate="fadeRight">
            <div className="p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform shadow-lg shadow-white/5 flex items-center gap-3">
              <img
                src={logoSrc}
                alt={empresa?.nome || 'Empresa'}
                className="h-10 md:h-12 w-auto object-contain min-w-[36px] max-h-12"
              />
              {empresa?.nome && (
                <div className="flex flex-col -space-y-1">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">
                    {empresa.branchName ? (empresa.unitName ? 'Empresa / Filial / Unidade' : 'Empresa / Filial') : 'Empresa'}
                  </span>
                  <h2 className="text-lg md:text-xl font-black tracking-tighter text-foreground truncate max-w-[350px] drop-shadow-sm">
                    {empresa.nome}
                    {empresa.branchName && <span className="text-muted-foreground font-normal text-sm"> / {empresa.branchName}</span>}
                    {empresa.unitName && <span className="text-seguranca-yellow font-normal text-sm"> ({empresa.unitName})</span>}
                  </h2>
                </div>
              )}
            </div>
          </div>
        ) : empresa?.nome ? (
          <div className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-all" data-animate="fadeRight">
            <div
              className="p-2.5 rounded-xl border transition-all group-hover:scale-110 shadow-md shadow-primary/20"
              style={{ backgroundColor: `${empresa?.temaCor}20`, borderColor: `${empresa?.temaCor}40` }}
            >
              <Building2 className="text-primary" size={28} />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70">
                {empresa.branchName ? (empresa.unitName ? 'Empresa / Filial / Unidade' : 'Empresa / Filial') : 'Empresa'}
              </span>
              <h2 className="text-xl md:text-2xl font-black tracking-tighter text-foreground truncate max-w-[400px] drop-shadow-sm">
                {empresa.nome}
                {empresa.branchName && <span className="text-muted-foreground font-normal"> / {empresa.branchName}</span>}
                {empresa.unitName && <span className="text-seguranca-yellow font-normal"> ({empresa.unitName})</span>}
              </h2>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 group cursor-pointer active:scale-95 transition-all">
            <img
              src="/fluxbus-logo.png"
              alt="FluxBus - Gestão de Fretamento e Turismo"
              className="h-14 md:h-16 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Campo de Pesquisa */}
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Pesquisar..."
            className="bg-accent/50 text-foreground pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary w-64 border border-border/50 transition-all focus:bg-accent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        </div>

        {/* Ícones de Notificação e Mensagens */}
        <div className="flex gap-2">
          {/* Ícone de Mensagens */}
          <button className="relative p-2.5 rounded-full hover:bg-accent active:scale-95 transition-all outline-none">
            <Mail className="text-muted-foreground" size={20} />
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-card">3</span>
          </button>

          {/* Centro de Notificações - Modal com mensagens e notificações */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* Seletor de Tema/Contraste */}
          <ThemeToggle />

          {/* Menu do Usuário */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
