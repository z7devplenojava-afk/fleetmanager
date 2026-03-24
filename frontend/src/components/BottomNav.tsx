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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-seguranca-graphite border-t border-gray-700 z-40 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center h-16">
                {items.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive(item.path)
                                ? 'text-seguranca-yellow'
                                : 'text-gray-400 hover:text-seguranca-lightgray'
                            }`}
                    >
                        <item.icon size={24} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                ))}
                <button
                    onClick={onToggleSidebar}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-seguranca-lightgray transition-colors"
                >
                    <Menu size={24} />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </div>
        </nav>
    );
};
