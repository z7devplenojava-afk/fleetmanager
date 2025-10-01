import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Users, 
  User2, 
  ClipboardList, 
  DollarSign, 
  FileSpreadsheet, 
  Building2, 
  Settings,
  Truck,
  Route
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  active?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, text, to, active = false }) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={`flex items-center p-3 my-1 rounded-lg transition-colors ${active ? 'bg-seguranca-black text-seguranca-yellow' : 'text-seguranca-lightgray hover:bg-seguranca-black hover:text-seguranca-yellow'}`}>
      <div className="text-seguranca-yellow flex-shrink-0">
        {icon}
      </div>
      <span className="ml-3 truncate">{text}</span>
    </a>
  );
};

interface SidebarProps {
  activePage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage = 'dashboard' }) => {
  const menuItems = [
    { icon: <BarChart3 size={20} />, text: 'Dashboard', to: '/dashboard', id: 'dashboard' },
    { icon: <FileText size={20} />, text: 'Contratos', to: '/contratos', id: 'contratos' },
    { icon: <Calendar size={20} />, text: 'Escalas', to: '/escalas', id: 'escalas' },
    { icon: <Building2 size={20} />, text: 'Clientes', to: '/clientes', id: 'clientes' },
    { icon: <ClipboardList size={20} />, text: 'Serviços', to: '/operacional?tab=servicos', id: 'operacional-servicos' },
    { icon: <DollarSign size={20} />, text: 'Financeiro', to: '/financeiro', id: 'financeiro' },
    { icon: <FileSpreadsheet size={20} />, text: 'Holerites', to: '/holerites', id: 'holerites' },
    { icon: <Truck size={20} />, text: 'Frota', to: '/frota', id: 'frota' },
    { icon: <Building2 size={20} />, text: 'Filiais', to: '/filiais', id: 'filiais' },
    { icon: <Route size={20} />, text: 'Rota Semanal', to: '/rota-semanal-supervisao', id: 'rota-semanal' },
    { icon: <Settings size={20} />, text: 'Configurações', to: '/configuracoes', id: 'configuracoes' },
  ];

  return (
    <div className="w-64 h-screen bg-seguranca-graphite flex flex-col fixed left-0 top-0 z-50">
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <Logo />
      </div>

      <div className="flex flex-col p-4 flex-grow overflow-y-auto">
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              text={item.text} 
              to={item.to}
              active={activePage === item.id}
            />
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-seguranca-red flex items-center justify-center text-white font-bold flex-shrink-0">
            A
          </div>
          <div className="ml-3 min-w-0">
            <div className="text-sm font-medium text-seguranca-lightgray truncate">Admin</div>
            <div className="text-xs text-gray-400 truncate">Administrador</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
