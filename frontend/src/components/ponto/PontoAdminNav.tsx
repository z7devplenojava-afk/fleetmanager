import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  AlertCircle, 
  BarChart3, 
  Activity,
  Clock,
  Building2,
  LogOut,
  AlertTriangle,
  Shield,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';
import timeRecordService from '@/services/timeRecordService';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const BASE_ITEMS: NavItem[] = [
  { label: 'Executivo', path: '/rh/ponto-admin/executive', icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: 'Dashboard', path: '/rh/ponto-admin/dashboard', icon: <BarChart3 className="h-4 w-4" /> },
  { label: 'Pendentes', path: '/rh/ponto-admin/pending', icon: <AlertCircle className="h-4 w-4" /> },
  { label: 'Relatórios', path: '/rh/ponto-admin/reports', icon: <Activity className="h-4 w-4" /> },
  { label: 'Indicadores', path: '/rh/ponto-admin/indicators', icon: <TrendingUp className="h-4 w-4" /> },
];

const SUPER_ADMIN_ITEMS: NavItem[] = [
  { label: 'Consolidado', path: '/rh/ponto-admin/consolidated', icon: <Shield className="h-4 w-4" /> },
  { label: 'Rel Consolidado', path: '/rh/ponto-admin/consolidated-report', icon: <FileText className="h-4 w-4" /> },
  { label: 'Jornada', path: '/rh/ponto-admin/journey-config', icon: <Settings className="h-4 w-4" /> },
];

const PENDING_PATH = '/rh/ponto-admin/pending';

interface Company {
  id: string;
  name: string;
  sigla?: string;
  cnpj?: string;
}

interface PontoAdminNavProps {
  title?: string;
  subtitle?: string;
}

const PontoAdminNav: React.FC<PontoAdminNavProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [targetCompanyId, setTargetCompanyId] = useState<string | null>(
    () => sessionStorage.getItem('admin_target_company_id')
  );

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN';

  // Auto-fetch pending count on mount for all pages
  useEffect(() => {
    let mounted = true;
    timeRecordService.getAdminDashboard()
      .then((res) => {
        if (mounted && res.success) {
          setPendingCount(res.data.registrosPendentes ?? 0);
        }
      })
      .catch(() => {
        if (mounted) setPendingCount(0);
      });
    return () => { mounted = false; };
  }, []);

  // Fetch companies on mount for SUPER_ADMIN impersonation
  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    setLoadingCompanies(true);
    api.get('/companies')
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data :
          (res.data.content ? res.data.content : []);
        setCompanies(data);
      })
      .catch((err) => {
        console.error('Erro ao carregar empresas:', err);
      })
      .finally(() => {
        if (mounted) setLoadingCompanies(false);
      });
    return () => { mounted = false; };
  }, [isSuperAdmin]);

  // Sync sessionStorage with local state
  useEffect(() => {
    if (targetCompanyId) {
      sessionStorage.setItem('admin_target_company_id', targetCompanyId);
    } else {
      sessionStorage.removeItem('admin_target_company_id');
    }
  }, [targetCompanyId]);

  const handleCompanyChange = (companyId: string) => {
    setTargetCompanyId(companyId);
    // Full navigation to apply new context (same pattern as CompanyList.tsx)
    window.location.href = '/rh/ponto-admin/dashboard';
  };

  const handleExitImpersonation = () => {
    setTargetCompanyId(null);
    sessionStorage.removeItem('admin_target_company_id');
    window.location.href = '/rh/ponto-admin/dashboard';
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getBadgeCount = (path: string): number | null => {
    if (path === PENDING_PATH && pendingCount !== null) {
      return pendingCount;
    }
    return null;
  };

  const navItems = isSuperAdmin ? [...BASE_ITEMS, ...SUPER_ADMIN_ITEMS] : BASE_ITEMS;
  const selectedCompany = companies.find(c => c.id === targetCompanyId);

  return (
    <div className="space-y-4">
      {/* Impersonation Banner */}
      {targetCompanyId && selectedCompany && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-amber-400 font-medium">
              Visualizando como <strong>{selectedCompany.name}</strong>
            </span>
            <span className="text-amber-500/60 text-xs ml-1">(Super Admin)</span>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            {title && (
              <h1 className="text-3xl font-bold text-seguranca-lightgray">{title}</h1>
            )}
            {subtitle && (
              <p className="text-seguranca-gray mt-1">{subtitle}</p>
            )}
          </div>

          {/* Company Selector (SUPER_ADMIN only) */}
          {isSuperAdmin && (
            <div className="relative">
              <select
                value={targetCompanyId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) handleCompanyChange(val);
                }}
                disabled={loadingCompanies}
                className="appearance-none bg-seguranca-black/80 border border-seguranca-gray/30 
                           rounded-lg px-3 py-2 pr-8 text-sm text-seguranca-lightgray
                           focus:border-seguranca-yellow/50 focus:outline-none cursor-pointer
                           hover:border-seguranca-yellow/30 transition-colors min-w-[200px]"
              >
                <option value="">
                  {targetCompanyId ? selectedCompany?.name || 'Carregando...' : '🔓 Todas as Empresas'}
                </option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.sigla ? `(${c.sigla})` : ''}
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-seguranca-gray pointer-events-none" />
            </div>
          )}
        </div>

        {/* Link para Meu Ponto (colaborador) */}
        <button
          onClick={() => navigate('/rh/ponto-eletronico')}
          className="flex items-center gap-2 px-4 py-2 text-sm text-seguranca-gray 
                     hover:text-seguranca-lightgray hover:bg-seguranca-gray/10 
                     rounded-lg transition-colors border border-seguranca-gray/20"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Meu Ponto</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap gap-1 p-1 rounded-xl bg-seguranca-black/50 border border-seguranca-gray/20">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const badgeCount = getBadgeCount(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium 
                transition-all duration-200 relative
                ${active 
                  ? 'bg-seguranca-yellow text-seguranca-black shadow-lg shadow-seguranca-yellow/20 scale-105' 
                  : 'text-seguranca-gray hover:text-seguranca-lightgray hover:bg-seguranca-gray/10'
                }
              `}
            >
              <span className={active ? 'text-seguranca-black' : ''}>{item.icon}</span>
              <span>{item.label}</span>
              {badgeCount !== null && badgeCount > 0 && (
                <span className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 
                  rounded-full text-[11px] font-bold leading-none
                  ${active
                    ? 'bg-seguranca-black/20 text-seguranca-black'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }
                `}>
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default PontoAdminNav;
