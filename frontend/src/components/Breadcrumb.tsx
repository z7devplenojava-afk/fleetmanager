import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, LucideIcon } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', path: '/dashboard', icon: Home }
  ],
  '/funcionarios': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Funcionários', path: '/funcionarios' }
  ],
  '/financeiro': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Financeiro', path: '/financeiro' }
  ],
  '/holerites': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Holerites', path: '/holerites' }
  ],
  '/frota': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Frota', path: '/frota' }
  ],
  '/filiais': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Filiais', path: '/filiais' }
  ],
  '/configuracoes': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Configurações', path: '/configuracoes' }
  ],
  '/usuarios': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Administrativo', path: '/administrativo' },
    { label: 'Usuários', path: '/usuarios' }
  ],
  '/grupos': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Administrativo', path: '/grupos' },
    { label: 'Grupos de Usuários', path: '/grupos' }
  ],
  '/operacional': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Operacional', path: '/operacional' }
  ],
  '/servicos': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Operacional', path: '/operacional' },
    { label: 'Serviços', path: '/servicos' }
  ],
  '/leads': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Comercial', path: '/leads' },
    { label: 'Leads', path: '/leads' }
  ],
  '/clientes': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Comercial', path: '/clientes' },
    { label: 'Clientes', path: '/clientes' }
  ],
  '/propostas': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Comercial', path: '/propostas' },
    { label: 'Propostas', path: '/propostas' }
  ],
  '/orcamentos': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Comercial', path: '/orcamentos' },
    { label: 'Orçamentos', path: '/orcamentos' }
  ],
  '/contratos': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Comercial', path: '/contratos' },
    { label: 'Contratos', path: '/contratos' }
  ],
  '/vagas': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'RH', path: '/vagas' },
    { label: 'Vagas', path: '/vagas' }
  ],
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  const breadcrumbs = breadcrumbMap[pathname] || [
    { label: 'Dashboard', path: '/dashboard', icon: Home }
  ];

  return (
    <nav className="flex items-center space-x-1 text-sm text-seguranca-lightgray mb-4">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={`${item.path}-${index}`}>
          {index > 0 && (
            <ChevronRight size={16} className="text-gray-500" />
          )}
          <Link
            to={item.path}
            className={`
              flex items-center space-x-1 hover:text-seguranca-yellow transition-colors
              ${index === breadcrumbs.length - 1 ? 'text-seguranca-yellow font-medium' : ''}
            `}
          >
            {item.icon && <item.icon size={16} />}
            <span>{item.label}</span>
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}; 