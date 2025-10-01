import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Shield, FileText, Calendar, Building2, Users, ClipboardList, DollarSign, FileSpreadsheet, Truck, Settings, Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menu = [
  { icon: Home, label: 'Dashboard', to: '/dashboard', permission: 'DASHBOARD_READ' },
  { icon: Shield, label: 'Operacional', to: '/operacional', permission: 'EMPLOYEES_READ' },
  { icon: FileText, label: 'Contratos', to: '/contratos', permission: 'CONTRACTS_READ' },
  { icon: Calendar, label: 'Escalas', to: '/escalas', permission: 'EMPLOYEES_READ' },
  { icon: Building2, label: 'Clientes', to: '/clientes', permission: 'CLIENTS_READ' },
  { icon: ClipboardList, label: 'Serviços', to: '/operacional?tab=servicos', permission: 'CONTRACTS_READ' },
  { icon: DollarSign, label: 'Financeiro', to: '/financeiro', permission: 'FINANCIAL_READ' },
  { icon: FileSpreadsheet, label: 'Holerites', to: '/holerites', permission: 'PAYSLIPS_READ' },
  { icon: Truck, label: 'Frota', to: '/frota', permission: 'FINANCIAL_READ' },
  { icon: Building2, label: 'Filiais', to: '/filiais', permission: 'CLIENTS_READ' },
  { icon: Settings, label: 'Configurações', to: '/configuracoes', permission: 'SYSTEM_CONFIG' },
];

export const SimpleSidebar = () => {
  const [open, setOpen] = useState(true); // true: expandido, false: compacto
  const { user } = useAuth();
  const location = useLocation();

  // Filtra itens conforme permissões
  const filteredMenu = menu.filter(item => {
    if (!user?.permissions) return false;
    return user.permissions[item.permission] || user.permissions.ALL_PERMISSIONS;
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-zinc-900 text-white flex flex-col justify-between transition-all duration-300 z-50
        ${open ? 'w-64' : 'w-20'}
      `}
    >
      {/* Topo apenas com ícone e título */}
      <div>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="bg-red-600 rounded-lg p-2">
            <Briefcase size={28} className="text-white" />
          </div>
          {open && <span className="text-xl font-bold tracking-wide">Secure Guard</span>}
        </div>
        <nav className="flex flex-col gap-1 mt-2">
          {filteredMenu.map(item => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`
                  flex items-center gap-3 px-6 py-3 rounded-l-full transition
                  ${isActive ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-yellow-400'}
                  ${open ? 'justify-start' : 'justify-center'}
                `}
                title={!open ? item.label : undefined}
              >
                <item.icon size={22} className="text-yellow-400 flex-shrink-0" />
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Rodapé */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-zinc-800">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user?.role === 'SUPER_ADMIN' ? 'bg-yellow-400 text-black' : 'bg-red-600 text-white'}`}>
          {user?.name?.charAt(0) || 'A'}
        </div>
        {open && (
          <div className="min-w-0">
            <div className="font-bold truncate">{user?.name || 'Admin'}</div>
            <div className="text-xs text-gray-400 truncate">{user?.role ? (user.role.charAt(0) + user.role.slice(1).toLowerCase()) : 'Administrador'}</div>
          </div>
        )}
      </div>
    </aside>
  );
}; 