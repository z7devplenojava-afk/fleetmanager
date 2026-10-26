
import React, { useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { getRoleDisplayName } from '@/utils/permissions';
import UserProfileModal from './UserProfileModal';

const UserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'Usuário';
  const initials = displayName.substring(0, 2).toUpperCase();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleProfileClick = () => {
    closeMenu();
    setIsProfileModalOpen(true);
  };

  return (
    <div className="relative flex items-center gap-2 sm:gap-3">
      {/* Nome do usuário - CLICÁVEL */}
      <div
        className="text-right hidden md:block cursor-pointer hover:text-primary transition-colors p-2 rounded-xl hover:bg-accent active:scale-95"
        onClick={handleProfileClick}
      >
        <div className="text-sm font-medium text-foreground truncate max-w-[150px]">{displayName}</div>
        <div className="text-xs text-primary font-bold">
          {user?.role && getRoleDisplayName(user.role as any)}
        </div>
      </div>

      {/* Botão Sair - Sempre visível com ícone */}
      <button
        onClick={() => signOut()}
        title="Sair do sistema"
        aria-label="Sair do sistema"
        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm shadow-red-600/30 whitespace-nowrap"
      >
        <LogOut size={15} />
        <span>Sair</span>
      </button>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default UserMenu;
