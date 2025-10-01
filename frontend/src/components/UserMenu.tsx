
import React, { useState } from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
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
    <div className="relative flex items-center gap-3">
      {/* Nome do usuário - CLICÁVEL */}
      <div 
        className="text-right hidden md:block cursor-pointer hover:text-seguranca-yellow transition-colors p-2 rounded-lg hover:bg-seguranca-black"
        onClick={handleProfileClick}
      >
        <div className="text-sm font-medium text-seguranca-lightgray">{displayName}</div>
        <div className="text-xs text-seguranca-yellow font-bold">SUPER_ADMIN</div>
      </div>
      
      {/* Botão Sair */}
      <button 
        onClick={() => signOut()}
        className="px-3 py-1 bg-seguranca-red text-white text-xs rounded hover:bg-red-700 transition-colors"
      >
        Sair
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
