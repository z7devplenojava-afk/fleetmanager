import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { isDriverUser } from '@/utils/roleRouting';
import systemAlertCenterService, {
  AlertCategory,
  AlertEntityType,
  AlertModule,
  AlertPriority,
  SystemAlertItem,
} from '@/services/systemAlertCenterService';
import {
  AlertTriangle,
  ArrowDownLeft,
  Bell,
  Building2,
  Bus,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  DollarSign,
  Droplet,
  FileWarning,
  HeartPulse,
  Home,
  Info,
  MessageSquare,
  Palmtree,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';

const PRIORITY_SECTIONS: {
  key: AlertPriority;
  title: string;
  headerBg: string;
  pillBg: string;
  cardBorder: string;
  accentText: string;
  iconBg: string;
}[] = [
  {
    key: 'CRITICAL',
    title: 'Prioridade Crítica',
    headerBg: 'bg-gradient-to-r from-red-700 to-red-600 border-red-500/70',
    pillBg: 'bg-red-950/60 text-red-100 border-red-400/50',
    cardBorder: 'border-red-500/40 hover:border-red-400',
    accentText: 'text-red-400',
    iconBg: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
  {
    key: 'HIGH',
    title: 'Prioridade Alta',
    headerBg: 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-400/70',
    pillBg: 'bg-orange-950/60 text-orange-100 border-orange-300/50',
    cardBorder: 'border-orange-500/40 hover:border-orange-400',
    accentText: 'text-orange-400',
    iconBg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  {
    key: 'MEDIUM',
    title: 'Prioridade Média',
    headerBg: 'bg-gradient-to-r from-blue-700 to-blue-600 border-blue-500/70',
    pillBg: 'bg-blue-950/60 text-blue-100 border-blue-400/50',
    cardBorder: 'border-blue-500/40 hover:border-blue-400',
    accentText: 'text-blue-400',
    iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  {
    key: 'LOW',
    title: 'Prioridade Baixa',
    headerBg: 'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500/70',
    pillBg: 'bg-gray-900/70 text-gray-100 border-gray-400/40',
    cardBorder: 'border-gray-600/70 hover:border-gray-400',
    accentText: 'text-gray-300',
    iconBg: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  },
];

const ENTITY_LABELS: Record<AlertEntityType, string> = {
  VEHICLE: 'Veículo',
  DRIVER: 'Motorista',
  COMPANY: 'Empresa',
  FINANCIAL: 'Financeiro',
  EMPLOYEE: 'Funcionário',
};

const CATEGORY_LABELS: Record<AlertCategory, string> = {
  PREVENTIVE: 'Vencimento de Preventiva',
  VEHICLE_DOCUMENT: 'Documentos do Veículo',
  DRIVER_DOCUMENT: 'Documentos do Motorista',
  TIRE_CHANGE: 'Troca de Pneu',
  OIL_CHANGE: 'Troca de Óleo de Motor',
  COMPANY_DOCUMENT: 'Empresa & Contratos',
  FINANCIAL_PAYABLE: 'Contas a Pagar',
  FINANCIAL_RECEIVABLE: 'Contas a Receber',
  RH_VACATION: 'Férias (Limite Concessivo)',
  RH_PROBATION: 'Contrato de Experiência',
  RH_EXAM: 'Exame ASO / Laudo',
};

const MODULE_OPTIONS: { id: AlertModule; label: string; icon: React.ElementType }[] = [
  { id: 'ALL', label: 'Todos os Módulos', icon: Bell },
  { id: 'FINANCEIRO', label: 'Financeiro (Pagar & Receber)', icon: DollarSign },
  { id: 'RH', label: 'RH & Pessoal (Férias, CNH, ASO)', icon: Users },
  { id: 'FROTA', label: 'Frota & Manutenção', icon: Bus },
  { id: 'EMPRESA', label: 'Empresa & Contratos', icon: Building2 },
];

const SystemAlertsCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isDriver = isDriverUser(user);

  const initialModParam = (searchParams.get('modulo') || searchParams.get('module') || 'ALL').toUpperCase();
  const initialModule: AlertModule = ['ALL', 'FINANCEIRO', 'RH', 'FROTA', 'EMPRESA'].includes(initialModParam)
    ? (initialModParam as AlertModule)
    : 'ALL';

  const [activeModule, setActiveModule] = useState<AlertModule>(initialModule);
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | AlertPriority>('ALL');
  const [entityFilter, setEntityFilter] = useState<'ALL' | AlertEntityType>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AlertCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['system-alerts-center', user?.id, activeModule],
    queryFn: () => systemAlertCenterService.getAlerts(activeModule),
    refetchInterval: 60000,
  });

  const alerts = data?.alerts || [];
  const visibleScopes = data?.visibleScopes || [];

  const handleModuleChange = (mod: AlertModule) => {
    setActiveModule(mod);
    if (mod === 'ALL') {
      searchParams.delete('modulo');
      searchParams.delete('module');
    } else {
      searchParams.set('modulo', mod.toLowerCase());
    }
    setSearchParams(searchParams);
  };

  const filteredAlerts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return alerts.filter((a) => {
      if (priorityFilter !== 'ALL' && a.priority !== priorityFilter) return false;
      if (entityFilter !== 'ALL' && a.entityType !== entityFilter) return false;
      if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        a.subjectTitle.toLowerCase().includes(q) ||
        (a.subjectSubtitle || '').toLowerCase().includes(q) ||
        a.categoryLabel.toLowerCase().includes(q) ||
        a.statusText.toLowerCase().includes(q)
      );
    });
  }, [alerts, priorityFilter, entityFilter, categoryFilter, searchTerm]);

  const groupedByPriority = useMemo(() => {
    const map: Record<AlertPriority, SystemAlertItem[]> = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    filteredAlerts.forEach((a) => {
      map[a.priority]?.push(a);
    });
    return map;
  }, [filteredAlerts]);

  const renderCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case 'PREVENTIVE':
        return <Wrench className="h-6 w-6" />;
      case 'VEHICLE_DOCUMENT':
        return <FileWarning className="h-6 w-6" />;
      case 'DRIVER_DOCUMENT':
        return <UserCheck className="h-6 w-6" />;
      case 'TIRE_CHANGE':
        return <CircleDot className="h-6 w-6" />;
      case 'OIL_CHANGE':
        return <Droplet className="h-6 w-6" />;
      case 'COMPANY_DOCUMENT':
        return <Building2 className="h-6 w-6" />;
      case 'FINANCIAL_PAYABLE':
        return <Receipt className="h-6 w-6 text-red-400" />;
      case 'FINANCIAL_RECEIVABLE':
        return <DollarSign className="h-6 w-6 text-emerald-400" />;
      case 'RH_VACATION':
        return <Palmtree className="h-6 w-6 text-amber-400" />;
      case 'RH_PROBATION':
        return <CalendarClock className="h-6 w-6 text-blue-400" />;
      case 'RH_EXAM':
        return <HeartPulse className="h-6 w-6 text-rose-400" />;
      default:
        return <Bell className="h-6 w-6" />;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <StandardLayout
      title="Central de Alertas do Sistema"
      subtitle="Fique atento aos vencimentos e avisos importantes ordenados por prioridade conforme seu perfil"
    >
      <div className="space-y-5 pb-20 md:pb-6">
        {/* Top Hero Strip */}
        <Card className="bg-seguranca-graphite border-gray-700 shadow-xl overflow-hidden">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative p-3 rounded-2xl bg-seguranca-black border border-gray-700 text-seguranca-yellow shrink-0">
                <Bell className="h-7 w-7" />
                {(data?.totalCount || 0) > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[11px] font-bold px-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-seguranca-graphite">
                    {data?.totalCount}
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Alertas do Sistema</h2>
                  {visibleScopes.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="text-[10px] border-gray-600 bg-seguranca-black/60 text-gray-200"
                    >
                      {ENTITY_LABELS[s]}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
                  Monitoramento inteligente de vencimentos por módulo: Financeiro (Pagar/Receber), RH (Férias, CNH, ASO), Frota e Contratos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              {(priorityFilter !== 'ALL' || entityFilter !== 'ALL' || categoryFilter !== 'ALL' || searchTerm) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPriorityFilter('ALL');
                    setEntityFilter('ALL');
                    setCategoryFilter('ALL');
                    setSearchTerm('');
                  }}
                  className="text-xs text-gray-300 hover:text-white"
                >
                  Limpar filtros
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
                className="border-gray-600 bg-seguranca-black text-white hover:bg-gray-800 text-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abas de Seleção de Módulo Contextual */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {MODULE_OPTIONS.map((m) => {
            const Icon = m.icon;
            const isSelected = activeModule === m.id;
            const count =
              m.id === 'ALL'
                ? data?.totalCount
                : m.id === 'FINANCEIRO'
                ? data?.financialCount
                : m.id === 'RH'
                ? data?.rhCount
                : m.id === 'FROTA'
                ? data?.vehicleCount
                : data?.companyCount;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleModuleChange(m.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                  isSelected
                    ? 'bg-seguranca-red text-white border-red-500 shadow-md shadow-red-950/40'
                    : 'bg-card hover:bg-accent text-muted-foreground hover:text-foreground border-border'
                }`}
              >
                <Icon className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-primary'}`} />
                <span>{m.label}</span>
                {count !== undefined && count > 0 && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4 Summary Priority Cards (Interactive Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setPriorityFilter((prev) => (prev === 'CRITICAL' ? 'ALL' : 'CRITICAL'))}
            className={`text-left rounded-xl p-3.5 border transition-all bg-seguranca-graphite ${
              priorityFilter === 'CRITICAL'
                ? 'border-red-500 ring-2 ring-red-500/40'
                : 'border-gray-700 hover:border-red-500/60'
            }`}
          >
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">{data?.criticalCount || 0}</span>
            </div>
            <span className="text-xs font-semibold text-gray-200 mt-1 block">Críticos</span>
            <span className="text-[10px] text-gray-400">Vencido ou &le; 3 dias</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter((prev) => (prev === 'HIGH' ? 'ALL' : 'HIGH'))}
            className={`text-left rounded-xl p-3.5 border transition-all bg-seguranca-graphite ${
              priorityFilter === 'HIGH'
                ? 'border-orange-500 ring-2 ring-orange-500/40'
                : 'border-gray-700 hover:border-orange-500/60'
            }`}
          >
            <div className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">{data?.highCount || 0}</span>
            </div>
            <span className="text-xs font-semibold text-gray-200 mt-1 block">Altos</span>
            <span className="text-[10px] text-gray-400">4 a 10 dias</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter((prev) => (prev === 'MEDIUM' ? 'ALL' : 'MEDIUM'))}
            className={`text-left rounded-xl p-3.5 border transition-all bg-seguranca-graphite ${
              priorityFilter === 'MEDIUM'
                ? 'border-blue-500 ring-2 ring-blue-500/40'
                : 'border-gray-700 hover:border-blue-500/60'
            }`}
          >
            <div className="flex items-center gap-2 text-blue-400">
              <Info className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">{data?.mediumCount || 0}</span>
            </div>
            <span className="text-xs font-semibold text-gray-200 mt-1 block">Médios</span>
            <span className="text-[10px] text-gray-400">11 a 20 dias</span>
          </button>

          <button
            type="button"
            onClick={() => setPriorityFilter((prev) => (prev === 'LOW' ? 'ALL' : 'LOW'))}
            className={`text-left rounded-xl p-3.5 border transition-all bg-seguranca-graphite ${
              priorityFilter === 'LOW'
                ? 'border-gray-400 ring-2 ring-gray-400/40'
                : 'border-gray-700 hover:border-gray-500'
            }`}
          >
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">{data?.lowCount || 0}</span>
            </div>
            <span className="text-xs font-semibold text-gray-200 mt-1 block">Baixos</span>
            <span className="text-[10px] text-gray-400">21 a 30 dias</span>
          </button>
        </div>

        {/* Entity & Category Filter Bar */}
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Entity Switch Pills */}
            <div className="flex flex-wrap gap-1.5 bg-seguranca-black/70 p-1 rounded-lg border border-gray-700">
              <Button
                size="sm"
                variant={entityFilter === 'ALL' ? 'default' : 'ghost'}
                onClick={() => setEntityFilter('ALL')}
                className={`h-8 px-3 text-xs ${entityFilter === 'ALL' ? 'bg-seguranca-red text-white' : 'text-gray-300'}`}
              >
                Todos ({data?.totalCount || 0})
              </Button>
              {visibleScopes.includes('VEHICLE') && (
                <Button
                  size="sm"
                  variant={entityFilter === 'VEHICLE' ? 'default' : 'ghost'}
                  onClick={() => setEntityFilter('VEHICLE')}
                  className={`h-8 px-3 text-xs ${entityFilter === 'VEHICLE' ? 'bg-seguranca-red text-white' : 'text-gray-300'}`}
                >
                  <Bus className="h-3.5 w-3.5 mr-1.5" />
                  Veículos ({data?.vehicleCount || 0})
                </Button>
              )}
              {visibleScopes.includes('DRIVER') && (
                <Button
                  size="sm"
                  variant={entityFilter === 'DRIVER' ? 'default' : 'ghost'}
                  onClick={() => setEntityFilter('DRIVER')}
                  className={`h-8 px-3 text-xs ${entityFilter === 'DRIVER' ? 'bg-seguranca-red text-white' : 'text-gray-300'}`}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" />
                  Motoristas ({data?.driverCount || 0})
                </Button>
              )}
              {visibleScopes.includes('COMPANY') && (
                <Button
                  size="sm"
                  variant={entityFilter === 'COMPANY' ? 'default' : 'ghost'}
                  onClick={() => setEntityFilter('COMPANY')}
                  className={`h-8 px-3 text-xs ${entityFilter === 'COMPANY' ? 'bg-seguranca-red text-white' : 'text-gray-300'}`}
                >
                  <Building2 className="h-3.5 w-3.5 mr-1.5" />
                  Empresa ({data?.companyCount || 0})
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 flex-1 lg:max-w-xl justify-end">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por placa, motorista, empresa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-seguranca-black border-gray-600 text-xs text-white"
                />
              </div>

              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger className="w-full sm:w-56 h-9 bg-seguranca-black border-gray-600 text-xs text-white">
                  <SelectValue placeholder="Tipo de Vencimento" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 text-xs text-white">
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  <SelectItem value="PREVENTIVE">{CATEGORY_LABELS.PREVENTIVE}</SelectItem>
                  <SelectItem value="VEHICLE_DOCUMENT">{CATEGORY_LABELS.VEHICLE_DOCUMENT}</SelectItem>
                  <SelectItem value="DRIVER_DOCUMENT">{CATEGORY_LABELS.DRIVER_DOCUMENT}</SelectItem>
                  <SelectItem value="TIRE_CHANGE">{CATEGORY_LABELS.TIRE_CHANGE}</SelectItem>
                  <SelectItem value="OIL_CHANGE">{CATEGORY_LABELS.OIL_CHANGE}</SelectItem>
                  <SelectItem value="COMPANY_DOCUMENT">{CATEGORY_LABELS.COMPANY_DOCUMENT}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredAlerts.length === 0 ? (
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardContent className="p-10 text-center space-y-2">
              <ShieldCheck className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Tudo em conformidade por aqui!</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Não há alertas pendentes ou vencimentos dentro dos próximos 30 dias para os filtros selecionados e para o seu perfil de acesso.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Grouped Priority Sections */
          <div className="space-y-5">
            {PRIORITY_SECTIONS.map((section) => {
              const items = groupedByPriority[section.key];
              if (!items || items.length === 0) return null;

              return (
                <div key={section.key} className="space-y-2.5">
                  {/* Colored Priority Banner */}
                  <div className={`rounded-xl px-4 py-2.5 border flex items-center justify-between shadow-md ${section.headerBg}`}>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      {section.key === 'LOW' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : section.key === 'MEDIUM' ? (
                        <Info className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{section.title}</span>
                    </div>
                    <Badge className={`text-[11px] font-semibold border ${section.pillBg}`}>
                      {items.length} {items.length === 1 ? 'alerta' : 'alertas'}
                    </Badge>
                  </div>

                  {/* Cards Grid (1 col mobile, 2 cols desktop) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {items.map((alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        onClick={() => navigate(alert.routeTo)}
                        className={`w-full text-left bg-seguranca-graphite hover:bg-seguranca-black/90 rounded-xl border p-3.5 transition-all flex items-center gap-3.5 shadow-md group ${section.cardBorder}`}
                      >
                        <div className={`p-3 rounded-xl border shrink-0 ${section.iconBg}`}>
                          {renderCategoryIcon(alert.category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-gray-600 text-gray-300 bg-seguranca-black/60">
                              {ENTITY_LABELS[alert.entityType]}
                            </Badge>
                            <span className="font-bold text-sm text-white truncate">
                              {alert.subjectTitle}
                            </span>
                          </div>

                          <p className={`text-xs font-semibold mt-0.5 truncate ${section.accentText}`}>
                            {alert.categoryLabel}
                          </p>

                          {alert.subjectSubtitle && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {alert.subjectSubtitle}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 text-xs text-gray-200 mt-1.5 font-mono">
                            <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{alert.statusText}</span>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile Sticky Bottom Navigation (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-seguranca-black/95 backdrop-blur-md border-t border-gray-800 px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => navigate(isDriver ? '/driver-dashboard' : '/dashboard')}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400 hover:text-white"
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Início</span>
        </button>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg bg-seguranca-red/20 text-seguranca-yellow border border-seguranca-red/40"
        >
          <Bell className="h-5 w-5" />
          <span className="text-[10px] font-bold">Alertas ({data?.totalCount || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => navigate(isDriver ? '/driver/checklist' : '/frota')}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400 hover:text-white"
        >
          <Bus className="h-5 w-5" />
          <span className="text-[10px] font-medium">{isDriver ? 'Checklist' : 'Veículos'}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/mensagens')}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-gray-400 hover:text-white"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mensagens</span>
        </button>
      </nav>
    </StandardLayout>
  );
};

export default SystemAlertsCenter;

