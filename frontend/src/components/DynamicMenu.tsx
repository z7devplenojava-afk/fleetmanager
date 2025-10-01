import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MENU_CONFIG, MenuItem } from '@/types/user';
import { hasPermission } from '@/utils/permissions';
import { 
  BarChart3, 
  Users, 
  FileText, 
  PieChart, 
  Settings, 
  User, 
  Building, 
  DollarSign, 
  Truck, 
  Folder 
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  BarChart3,
  Users,
  FileText,
  PieChart,
  Settings,
  User,
  Building,
  FileContract: FileText,
  DollarSign,
  Truck,
  Folder,
};

const DynamicMenu: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const menuItems = MENU_CONFIG[user.role] || [];

  const renderMenuItem = (item: MenuItem) => {
    // Verificar se o usuário tem permissão para este item
    if (item.requiredPermission && !hasPermission(user.permissions, item.requiredPermission)) {
      return null;
    }

    const IconComponent = iconMap[item.icon];
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-red-600 text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`}
      >
        {IconComponent && <IconComponent className="h-5 w-5" />}
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="space-y-2">
      {menuItems.map(renderMenuItem)}
    </nav>
  );
};

export default DynamicMenu; 