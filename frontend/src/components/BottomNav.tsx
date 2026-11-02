import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Menu, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isDriverUser } from '@/utils/roleRouting';

interface BottomNavProps {
    onToggleSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isDriver = isDriverUser(user);

    const homePath = isDriver ? '/driver-dashboard' : '/dashboard';

    const navItems = [
        {
            id: 'home',
            icon: Home,
            label: 'Início',
            onClick: () => navigate(homePath),
            isActive: location.pathname === homePath || (location.pathname === '/' && !isDriver),
        },
        {
            id: 'menu',
            icon: Menu,
            label: 'Menu',
            onClick: onToggleSidebar,
            isActive: false,
        },
        {
            id: 'profile',
            icon: User,
            label: 'Perfil',
            onClick: () => navigate('/perfil'),
            isActive: location.pathname === '/perfil',
        },
        {
            id: 'messages',
            icon: MessageSquare,
            label: 'Mensagens',
            onClick: () => navigate('/mensagens'),
            isActive: location.pathname === '/mensagens',
        },
    ];

    return (
        <nav
            role="navigation"
            aria-label="Navegação inferior mobile"
            className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 dark:bg-[#0c0e14]/95 backdrop-blur-md border-t border-border z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]"
        >
            <div className="grid grid-cols-4 items-center h-16 px-1">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${
                            item.isActive
                                ? 'text-primary font-bold'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label={item.label}
                    >
                        <item.icon size={21} strokeWidth={item.isActive ? 2.5 : 2} />
                        <span className="text-[11px] tracking-tight">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
