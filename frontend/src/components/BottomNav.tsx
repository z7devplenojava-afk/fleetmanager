import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Truck, ClipboardList, Menu } from 'lucide-react';

interface BottomNavProps {
    onToggleSidebar: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onToggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        { icon: Home, label: 'Início', path: '/dashboard' },
        { icon: Truck, label: 'Frota', path: '/frota' },
        { icon: ClipboardList, label: 'Operacional', path: '/operacional' },
    ];

    const isActive = (path: string) => {
        if (path === '/dashboard' && (location.pathname === '/' || location.pathname === '/dashboard')) return true;
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111319]/95 dark:bg-[#0c0e14]/95 backdrop-blur-md border-t border-[#262833] z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
            <div className="flex justify-around items-center h-16 px-2">
                {items.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all active:scale-95 ${
                                active
                                    ? 'text-yellow-400 font-bold'
                                    : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                        >
                            <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                            <span className="text-[11px] tracking-tight">{item.label}</span>
                        </button>
                    );
                })}
                <button
                    onClick={onToggleSidebar}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-zinc-400 hover:text-zinc-200 active:scale-95 transition-all"
                    aria-label="Abrir Menu"
                >
                    <Menu size={22} />
                    <span className="text-[11px] tracking-tight">Menu</span>
                </button>
            </div>
        </nav>
    );
};
