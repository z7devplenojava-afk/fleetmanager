import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    LogOut,
    User,
    LayoutDashboard,
    Building2,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    Shield
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
    children,
    title,
    subtitle,
    actions
}) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        // Clear admin session data
        sessionStorage.removeItem('admin_target_company_id');
        logout();
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Building2, label: 'Empresas', path: '/admin/companies' },
        { icon: Users, label: 'Usuários Globais', path: '/admin/users' },
        { icon: Settings, label: 'Configurações', path: '/admin/settings' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside
                className={`bg-slate-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 ${collapsed ? 'w-20' : 'w-64'
                    } border-r border-slate-800 shadow-xl`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-950">
                    <div className="flex items-center space-x-3 w-full overflow-hidden">
                        <div className={`p-2 bg-amber-500 rounded-lg shrink-0 flex items-center justify-center transition-all ${collapsed ? 'mx-auto' : ''}`}>
                            <Shield className="h-5 w-5 text-black" />
                        </div>
                        {!collapsed && (
                            <div className="flex flex-col animate-in fade-in duration-300">
                                <span className="font-bold text-lg leading-none tracking-tight">FlexBus</span>
                                <span className="text-xs text-amber-500 font-medium uppercase tracking-wider">Admin Area</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center px-3 py-3 rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-amber-500/10 text-amber-500 shadow-sm border border-amber-500/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } ${collapsed ? 'justify-center' : ''}`}
                                title={collapsed ? item.label : undefined}
                            >
                                <Icon size={20} className={`shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400 group-hover:text-white'}`} />
                                {!collapsed && (
                                    <span className="ml-3 font-medium text-sm truncate">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full text-slate-500 hover:text-white hover:bg-slate-800 p-0 h-8 flex justify-center"
                    >
                        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </Button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${collapsed ? 'ml-20' : 'ml-64'
                }`}>

                {/* Header */}
                <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 sm:px-8 shadow-sm">
                    <div className="flex items-center justify-between h-full max-w-7xl mx-auto w-full">
                        {/* Page Title (Breadcrumb-like) */}
                        <div className="flex items-center text-sm font-medium text-slate-500">
                            <span className="text-slate-900 font-semibold text-lg mr-2">Admin</span>
                            <ChevronRight size={14} className="mx-1" />
                            <span className="text-amber-600">{title || 'Dashboard'}</span>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-4">
                            {actions}

                            <div className="h-6 w-px bg-slate-200 mx-2"></div>

                            <div className="flex items-center space-x-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-semibold text-slate-900 leading-none">{user?.name}</p>
                                    <p className="text-xs text-amber-600 font-medium mt-1">Super Admin</p>
                                </div>
                                <div className="h-9 w-9 bg-slate-900 rounded-full flex items-center justify-center text-amber-500 border-2 border-amber-500 ring-2 ring-amber-500/20 shadow-sm">
                                    <User size={16} />
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-red-600 hover:bg-red-50 ml-2"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 p-6 sm:p-8 overflow-x-hidden container max-w-7xl mx-auto w-full">
                    {(title || subtitle) && (
                        <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {title && <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>}
                            {subtitle && <p className="text-slate-500 mt-2 text-lg">{subtitle}</p>}
                        </div>
                    )}

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};
