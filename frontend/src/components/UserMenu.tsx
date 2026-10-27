
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
      {/* Nome do usuário e avatar - CLICÁVEL */}
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors p-1.5 rounded-xl hover:bg-accent active:scale-95"
        onClick={handleProfileClick}
        title="Ver meu perfil"
      >
        <div className="text-right hidden md:block">
          <div className="text-sm font-medium text-foreground truncate max-w-[150px]">{displayName}</div>
          <div className="text-xs text-primary font-bold">
            {user?.role && getRoleDisplayName(user.role as any)}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shadow-xs">
          {initials}
        </div>
      </div>

      {/* Modal de Perfil */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default UserMenu;
