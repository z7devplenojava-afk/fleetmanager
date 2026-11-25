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
            className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.25)] transition-colors duration-300"
        >
            <div className="grid grid-cols-4 items-center h-16 px-1.5 max-w-lg mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={item.onClick}
                        className={`flex flex-col items-center justify-center min-h-[48px] py-1 rounded-xl transition-all active:scale-90 ${
                            item.isActive
                                ? 'text-primary font-bold bg-primary/10'
                                : 'text-muted-foreground hover:text-foreground active:bg-muted/40'
                        }`}
                        aria-label={item.label}
                    >
                        <item.icon size={22} strokeWidth={item.isActive ? 2.5 : 2} className="transition-transform" />
                        <span className="text-[10px] tracking-tight font-medium leading-none mt-1">{item.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};
