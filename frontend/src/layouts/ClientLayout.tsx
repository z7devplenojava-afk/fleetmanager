import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Clock,
    MapPin,
    Bus,
    Camera,
    FileText,
    LogOut,
    Menu,
    X,
    Bell,
    User
} from 'lucide-react';

interface ClientLayoutProps {
    children: React.ReactNode;
}

const bottomNavItems = [
    { icon: Clock, label: 'Timeline', path: '/client' },
    { icon: Bus, label: 'Veículos', path: '/client/vehicles' },
    { icon: Camera, label: 'Câmeras', path: '/client/cameras' },
    { icon: MapPin, label: 'Mapa', path: '/client/map' },
    { icon: FileText, label: 'Documentação', path: '/client/documentacao' },
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 text-white">
            {/* Top Header — Compact */}
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                        <Bus className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold leading-none tracking-tight">FluxBus</span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest">Client Portal</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
                        <Bell className="w-5 h-5 text-slate-400" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                    </button>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            {/* Dropdown Menu */}
            {menuOpen && (
                <div className="absolute top-14 right-0 z-50 w-56 m-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                                <User className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">{user?.name || 'Cliente'}</p>
                                <p className="text-xs text-slate-400">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sair
                    </button>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-bottom">
                <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
                    {bottomNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${isActive
                                        ? 'text-emerald-400 scale-110'
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-emerald-500/15' : ''}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {isActive && (
                                    <div className="absolute -bottom-0 w-8 h-0.5 bg-emerald-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
