import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isDriverUser } from '@/utils/roleRouting';
import { HistoryNavButtons } from './HistoryNavButtons';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  'driver-dashboard': 'Portal do Motorista',
  rh: 'Recursos Humanos',
  'ponto-eletronico': 'Ponto Eletrônico',
  funcionarios: 'Funcionários',
  financeiro: 'Financeiro',
  holerites: 'Holerites',
  frota: 'Frota',
  manutencao: 'Manutenção',
  filiais: 'Filiais',
  configuracoes: 'Configurações',
  usuarios: 'Usuários',
  grupos: 'Grupos de Usuários',
  operacional: 'Operacional',
  medicao: 'Medição',
  servicos: 'Serviços',
  leads: 'Leads',
  clientes: 'Clientes',
  propostas: 'Propostas',
  orcamentos: 'Orçamentos',
  contratos: 'Contratos',
  vagas: 'Vagas',
  fretamento: 'Fretamento',
  viagens: 'Viagens',
  linhas: 'Linhas & Rotas',
  checklist: 'Checklist',
  abastecimento: 'Abastecimento',
  compras: 'Compras',
  'estoque-simplificado': 'Estoque',
  crm: 'CRM',
  portaria: 'Portaria',
  sst: 'Segurança do Trabalho (SST)',
  'departamento-pessoal': 'Departamento Pessoal',
  'chat-interno': 'Chat Interno',
};

const breadcrumbMap: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [
    { label: 'Dashboard', path: '/dashboard', icon: Home }
  ],
  '/driver-dashboard': [
    { label: 'Portal do Motorista', path: '/driver-dashboard', icon: Home }
  ],
  '/rh/ponto-eletronico': [
    { label: 'Início', path: '/dashboard', icon: Home },
    { label: 'RH', path: '/rh' },
    { label: 'Ponto Eletrônico', path: '/rh/ponto-eletronico' }
  ],
  '/driver/checklist': [
    { label: 'Portal do Motorista', path: '/driver-dashboard', icon: Home },
    { label: 'Checklist do Veículo', path: '/driver/checklist' }
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
  '/manutencao': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Manutenção', path: '/manutencao' }
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
    { label: 'Administrativo', path: '/usuarios' },
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
  '/operacional/medicao': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Operacional', path: '/operacional' },
    { label: 'Medição', path: '/operacional/medicao' }
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
  '/fretamento': [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Fretamento & Tráfego', path: '/fretamento' }
  ]
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const pathname = location.pathname;

  const isDriver = isDriverUser(user);
  const homePath = isDriver ? '/driver-dashboard' : '/dashboard';
  const homeLabel = isDriver ? 'Portal do Motorista' : 'Início';

  const breadcrumbs = useMemo(() => {
    if (breadcrumbMap[pathname]) {
      const items = [...breadcrumbMap[pathname]];
      // Ajustar o primeiro item se for motorista
      if (isDriver && items.length > 0) {
        items[0] = { ...items[0], path: homePath, label: homeLabel };
      }
      return items;
    }

    // Gerador dinâmico a partir dos segmentos da URL
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) {
      return [{ label: homeLabel, path: homePath, icon: Home }];
    }

    const items: BreadcrumbItem[] = [
      { label: homeLabel, path: homePath, icon: Home }
    ];

    let currentPath = '';
    segments.forEach((seg, idx) => {
      currentPath += `/${seg}`;
      const isLast = idx === segments.length - 1;
      const label = segmentLabels[seg] || (seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '));
      items.push({
        label,
        path: isLast ? pathname : currentPath
      });
    });

    return items;
  }, [pathname, isDriver, homePath, homeLabel]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Controles táteis de Voltar e Avançar entre telas */}
        <HistoryNavButtons variant="breadcrumb" />

        {/* Trilha de Pão de Migalha */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-xs text-muted-foreground overflow-x-auto py-0.5 scrollbar-none">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${item.path}-${index}`}>
                {index > 0 && (
                  <ChevronRight size={13} className="text-muted-foreground/40 shrink-0" />
                )}
                <Link
                  to={item.path}
                  className={`
                    flex items-center space-x-1 transition-colors rounded-md px-1.5 py-0.5 shrink-0
                    ${
                      isLast
                        ? 'text-primary font-semibold hover:underline'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }
                  `}
                >
                  {item.icon && (
                    <item.icon
                      size={13}
                      className={`shrink-0 ${
                        isLast ? 'text-primary' : 'text-muted-foreground/70'
                      }`}
                    />
                  )}
                  <span className="tracking-tight whitespace-nowrap">{item.label}</span>
                </Link>
              </React.Fragment>
            );
          })}
        </nav>
      </div>
    </div>
  );
};