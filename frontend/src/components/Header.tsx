
import React from 'react';
import { Mail, Search, Bus, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiUrl } from '@/config/environment';
import UserMenu from './UserMenu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ui/theme-toggle';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';

const Header: React.FC = () => {
  const { profile, empresa, user } = useAuth();
  const username = profile?.full_name || profile?.username || 'Usuário';
  const [logoError, setLogoError] = React.useState(false);

  // Se o usuário não tiver empresa associada (ou for SUPER_ADMIN sem empresa selecionada), usa o padrão FluxBus
  const hasSelectedCompany = Boolean(empresa?.id || (user as any)?.companyId || (user as any)?.company?.id);

  // Monta URL completa da logo da empresa (se relativa)
  const resolvedLogo = (hasSelectedCompany && empresa?.logoUrl)
    ? resolveCompanyLogoUrl(empresa.logoUrl)
    : null;
  const logoSrc = (!logoError && resolvedLogo) ? resolvedLogo : null;

  return (
    <header
      className="h-16 bg-gradient-to-r from-card via-card/95 to-card shadow-sm px-2.5 sm:px-4 flex items-center justify-between flex-shrink-0 z-40 border-b border-border/50 backdrop-blur-md transition-colors duration-300"
      style={{ borderBottomColor: empresa?.temaCor || 'var(--primary)' }}
    >
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <SidebarTrigger className="text-muted-foreground hover:text-primary active:scale-90 transition-all h-10 w-10 sm:h-11 sm:w-11 flex-shrink-0" />

        {/* Logo e Nome - empresa ou padrão */}
        {logoSrc ? (
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer active:scale-95 transition-all min-w-0" data-animate="fadeRight">
            <div className="p-1 sm:p-1.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform shadow-lg shadow-white/5 flex items-center gap-2 sm:gap-3 min-w-0">
              <img
                src={logoSrc}
                alt={empresa?.nome || 'Empresa'}
                onError={() => setLogoError(true)}
                className="h-8 sm:h-10 md:h-12 w-auto object-contain min-w-[28px] max-h-12 flex-shrink-0"
              />
              {empresa?.nome && (
                <div className="hidden sm:flex flex-col -space-y-1 min-w-0">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70 truncate">
                    {empresa.branchName ? (empresa.unitName ? 'Empresa / Filial / Unidade' : 'Empresa / Filial') : 'Empresa'}
                  </span>
                  <h2 className="text-sm md:text-xl font-black tracking-tighter text-foreground truncate max-w-[200px] md:max-w-[350px] drop-shadow-sm">
                    {empresa.nome}
                    {empresa.branchName && <span className="text-muted-foreground font-normal text-sm"> / {empresa.branchName}</span>}
                    {empresa.unitName && <span className="text-seguranca-yellow font-normal text-sm"> ({empresa.unitName})</span>}
                  </h2>
                </div>
              )}
            </div>
          </div>
        ) : (hasSelectedCompany && empresa?.nome) ? (
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer active:scale-95 transition-all min-w-0" data-animate="fadeRight">
            <div
              className="p-1.5 sm:p-2.5 rounded-xl border transition-all group-hover:scale-110 shadow-md shadow-primary/20 flex-shrink-0"
              style={{ backgroundColor: `${empresa?.temaCor}20`, borderColor: `${empresa?.temaCor}40` }}
            >
              <Building2 className="text-primary h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="hidden sm:flex flex-col -space-y-1 min-w-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest opacity-70 truncate">
                {empresa.branchName ? (empresa.unitName ? 'Empresa / Filial / Unidade' : 'Empresa / Filial') : 'Empresa'}
              </span>
              <h2 className="text-sm md:text-2xl font-black tracking-tighter text-foreground truncate max-w-[200px] md:max-w-[400px] drop-shadow-sm">
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
              className="h-8 sm:h-12 md:h-16 w-auto object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
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
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Ícone de Mensagens */}
          <button className="hidden sm:flex relative p-2.5 rounded-full hover:bg-accent active:scale-95 transition-all outline-none">
            <Mail className="text-muted-foreground" size={20} />
            <span className="absolute top-1 right-1 h-4 w-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-card">3</span>
          </button>

          {/* Centro de Notificações - Modal com mensagens e notificações */}
          <div className="relative">
            <NotificationBell />
          </div>

          {/* Seletor de Tema/Contraste */}
          <div className="hidden xs:block">
            <ThemeToggle />
          </div>

          {/* Menu do Usuário */}
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
