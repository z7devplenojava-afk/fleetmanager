import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  Clock, AlertCircle, TrendingUp, Users, Loader2, GripVertical, Eye, EyeOff, Settings,
  BarChart3, Activity, CheckCircle, RefreshCw, Building2
} from 'lucide-react';
import timeRecordService from '@/services/timeRecordService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const COLORS = ['#eab308', '#22c55e', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
const STORAGE_KEY_PREFIX = 'ponto_exec_dashboard_';

interface WidgetDefinition {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultVisible: boolean;
  width: 'full' | 'half' | 'third';
  minHeight: number;
}

const ALL_WIDGETS: WidgetDefinition[] = [
  { id: 'kpi-records', title: 'Registros', description: 'Total de registros do período', icon: <Clock className="h-4 w-4" />, defaultVisible: true, width: 'third', minHeight: 120 },
  { id: 'kpi-pending', title: 'Pendentes', description: 'Registros aguardando aprovação', icon: <AlertCircle className="h-4 w-4" />, defaultVisible: true, width: 'third', minHeight: 120 },
  { id: 'kpi-employees', title: 'Funcionários', description: 'Funcionários com/sem registro', icon: <Users className="h-4 w-4" />, defaultVisible: true, width: 'third', minHeight: 120 },
  { id: 'chart-overtime', title: 'HE por Dia', description: 'Horas extras nos últimos dias', icon: <TrendingUp className="h-4 w-4" />, defaultVisible: true, width: 'half', minHeight: 280 },
  { id: 'chart-lateness', title: 'Atrasos por Depto', description: 'Distribuição de atrasos', icon: <BarChart3 className="h-4 w-4" />, defaultVisible: true, width: 'half', minHeight: 280 },
  { id: 'chart-overtime-dept', title: 'HE por Departamento', description: 'Horas extras por setor', icon: <Activity className="h-4 w-4" />, defaultVisible: false, width: 'half', minHeight: 280 },
  { id: 'chart-absence', title: 'Presença x Ausência', description: 'Funcionários presentes hoje', icon: <CheckCircle className="h-4 w-4" />, defaultVisible: false, width: 'third', minHeight: 250 },
  { id: 'summary-cards', title: 'Resumo Rápido', description: 'HE, atrasos e absenteísmo', icon: <Activity className="h-4 w-4" />, defaultVisible: true, width: 'full', minHeight: 100 },
  // Multi-company widgets (appear automatically for SUPER_ADMIN in consolidated mode)
  { id: 'kpi-companies', title: 'Empresas', description: 'Total de empresas no consolidado', icon: <Building2 className="h-4 w-4" />, defaultVisible: true, width: 'third', minHeight: 120 },
  { id: 'chart-he-company', title: 'HE por Empresa', description: 'Comparativo de HE entre empresas', icon: <TrendingUp className="h-4 w-4" />, defaultVisible: true, width: 'half', minHeight: 280 },
  { id: 'chart-lateness-company', title: 'Atrasos por Empresa', description: 'Comparativo de atrasos entre empresas', icon: <Clock className="h-4 w-4" />, defaultVisible: true, width: 'half', minHeight: 280 },
];

// Multi-company widget IDs (only shown in consolidated mode)
const MULTI_COMPANY_WIDGETS = new Set(['kpi-companies', 'chart-he-company', 'chart-lateness-company']);

interface DashboardData {
  stats: any;
  indicators: any;
  records: any[];
  loading: boolean;
  isConsolidated: boolean;
}

interface WidgetConfig {
  order: string[];
  visible: Record<string, boolean>;
}

// ===== Sortable Widget Card =====
const SortableWidget: React.FC<{
  id: string;
  widget: WidgetDefinition;
  data: DashboardData;
  onToggle: (id: string) => void;
}> = ({ id, widget, data, onToggle }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${
        widget.width === 'full' ? 'col-span-full' :
        widget.width === 'half' ? 'md:col-span-2 lg:col-span-1' :
        'col-span-full sm:col-span-1'
      }`}
    >
      <Card className="bg-seguranca-darkgray/50 border-seguranca-gray/20 h-full overflow-hidden">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-seguranca-gray/10 
                         opacity-0 group-hover:opacity-100 transition-opacity"
              title="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4 text-seguranca-gray" />
            </button>
            <span className="text-seguranca-yellow">{widget.icon}</span>
            <CardTitle className="text-sm font-semibold text-seguranca-lightgray">{widget.title}</CardTitle>
          </div>
          <button
            onClick={() => onToggle(id)}
            className="p-1 rounded hover:bg-seguranca-gray/10 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Ocultar widget"
          >
            <EyeOff className="h-3.5 w-3.5 text-seguranca-gray" />
          </button>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {data.loading ? (
            <div className="flex items-center justify-center" style={{ height: widget.minHeight - 60 }}>
              <Loader2 className="h-6 w-6 animate-spin text-seguranca-yellow" />
            </div>
          ) : (
            <WidgetContent id={id} data={data} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ===== Individual Widget Content =====
const WidgetContent: React.FC<{ id: string; data: DashboardData }> = ({ id, data }) => {
  const { stats, indicators, records } = data;

  switch (id) {
    case 'kpi-records':
      return (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-500">{stats?.totalRegistrosHoje || 0}</p>
            <p className="text-xs text-seguranca-gray mt-1">registros hoje</p>
          </div>
          <Clock className="h-10 w-10 text-blue-500/40" />
        </div>
      );

    case 'kpi-pending':
      return (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-yellow-500">{stats?.registrosPendentes || 0}</p>
            <p className="text-xs text-seguranca-gray mt-1">aguardando aprovação</p>
          </div>
          <AlertCircle className="h-10 w-10 text-yellow-500/40" />
        </div>
      );

    case 'kpi-employees':
      return (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-emerald-500">{stats?.funcionariosComRegistro || 0}</p>
            <p className="text-xs text-seguranca-gray mt-1">
              {stats?.funcionariosSemRegistro || 0} sem registro
            </p>
          </div>
          <Users className="h-10 w-10 text-emerald-500/40" />
        </div>
      );

    case 'chart-overtime': {
      const chartData = indicators?.overtimeByDay || [];
      return chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="heGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }}
              tickFormatter={(v) => format(new Date(v), 'dd/MM')} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelFormatter={(v) => format(new Date(v), 'dd/MM/yyyy')} />
            <Area type="monotone" dataKey="horas" stroke="#eab308" fill="url(#heGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ) : <p className="text-seguranca-gray text-sm text-center py-8">Sem dados de HE</p>;
    }

    case 'chart-lateness': {
      const chartData = indicators?.latenessByDepartment || [];
      return chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="departamento" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} width={80} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Bar dataKey="ocorrencias" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <p className="text-seguranca-gray text-sm text-center py-8">Sem dados de atrasos</p>;
    }

    case 'chart-overtime-dept': {
      const chartData = indicators?.overtimeByDepartment || [];
      return chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="departamento" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} width={80} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Bar dataKey="horas" fill="#eab308" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <p className="text-seguranca-gray text-sm text-center py-8">Sem dados</p>;
    }

    case 'chart-absence':
      return (
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={[
                { name: 'Com registro', value: stats?.funcionariosComRegistro || 0 },
                { name: 'Sem registro', value: stats?.funcionariosSemRegistro || 0 }
              ]}
              cx="50%" cy="50%" innerRadius={50} outerRadius={75}
              paddingAngle={4} dataKey="value"
              label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            >
              <Cell fill="#22c55e" />
              <Cell fill="#ef4444" />
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'summary-cards': {
      if (data.isConsolidated) {
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
              <Building2 className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-blue-500">{indicators?.totalCompanies || 0}</p>
              <p className="text-xs text-seguranca-gray">Empresas</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
              <p className="text-lg font-bold text-emerald-500">{indicators?.totalEmployees || 0}</p>
              <p className="text-xs text-seguranca-gray">Funcionários</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-500">{indicators?.totalRecords || 0}</p>
              <p className="text-xs text-seguranca-gray">Registros</p>
            </div>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold text-amber-500">{indicators?.totalOvertimeHours || 0}h</p>
            <p className="text-xs text-seguranca-gray">Horas Extras</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <Clock className="h-5 w-5 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold text-red-500">{indicators?.latenessCount || 0}</p>
            <p className="text-xs text-seguranca-gray">Atrasos</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
            <Activity className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-lg font-bold text-purple-500">{indicators?.absenteeismRate || 0}%</p>
            <p className="text-xs text-seguranca-gray">Absenteísmo</p>
          </div>
        </div>
      );
    }

    // Multi-company widgets (only in consolidated mode)
    case 'kpi-companies':
      return (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-blue-500">{stats?.totalCompanies || 0}</p>
            <p className="text-xs text-seguranca-gray mt-1">empresas no consolidado</p>
          </div>
          <Building2 className="h-10 w-10 text-blue-500/40" />
        </div>
      );

    case 'chart-he-company': {
      const chartData = stats?.overtimeByCompany || [];
      return chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="empresa" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} width={100} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Bar dataKey="horas" fill="#eab308" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <p className="text-seguranca-gray text-sm text-center py-8">Sem dados comparativos</p>;
    }

    case 'chart-lateness-company': {
      const chartData = stats?.latenessByCompany || [];
      return chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <YAxis dataKey="empresa" type="category" tick={{ fill: '#9ca3af', fontSize: 9 }} width={100} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
            <Bar dataKey="ocorrencias" fill="#ef4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : <p className="text-seguranca-gray text-sm text-center py-8">Sem dados comparativos</p>;
    }

    default:
      return <p className="text-seguranca-gray text-sm">Widget não reconhecido</p>;
  }
};

// ===== Main Executive Dashboard =====
const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || 'default'}`;
  const [data, setData] = useState<DashboardData>({ stats: null, indicators: null, records: [], loading: true, isConsolidated: false });
  const [config, setConfig] = useState<WidgetConfig>(() => loadConfig(storageKey));
  const [showSettings, setShowSettings] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'FLEX_ADMIN';
  const targetCompanyId = sessionStorage.getItem('admin_target_company_id');
  const isConsolidatedMode = isSuperAdmin && !targetCompanyId;

  useEffect(() => { loadAllData(); }, []);
  useEffect(() => { saveConfig(storageKey, config); }, [config, storageKey]);

  function loadConfig(key: string): WidgetConfig {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      order: ALL_WIDGETS.map(w => w.id),
      visible: Object.fromEntries(ALL_WIDGETS.map(w => [w.id, w.defaultVisible])),
    };
  }

  function saveConfig(key: string, cfg: WidgetConfig) {
    localStorage.setItem(key, JSON.stringify(cfg));
  }

  const loadAllData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

      if (isConsolidatedMode) {
        // SUPER_ADMIN sees ALL companies data via consolidated endpoint
        const consRes = await timeRecordService.getConsolidated(monthStart, today);
        if (consRes.success) {
          setData({
            stats: consRes.data,
            indicators: consRes.data,
            records: consRes.data?.companyBreakdown || [],
            loading: false,
            isConsolidated: true,
          });
        } else {
          setData(prev => ({ ...prev, loading: false, isConsolidated: true }));
        }
      } else {
        // Normal mode: single-company data
        const [statsRes, indicatorsRes] = await Promise.all([
          timeRecordService.getAdminDashboard(),
          timeRecordService.getIndicators(monthStart, today),
        ]);
        setData({
          stats: statsRes.success ? statsRes.data : null,
          indicators: indicatorsRes.success ? indicatorsRes.data : null,
          records: [],
          loading: false,
          isConsolidated: false,
        });
      }
    } catch {
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setConfig(prev => {
        const oldOrder = prev.order;
        const oldIdx = oldOrder.indexOf(active.id as string);
        const newIdx = oldOrder.indexOf(over.id as string);
        return { ...prev, order: arrayMove(oldOrder, oldIdx, newIdx) };
      });
    }
  };

  const toggleWidget = (id: string) => {
    setConfig(prev => ({
      ...prev,
      visible: { ...prev.visible, [id]: !prev.visible[id] },
    }));
  };

  const resetLayout = () => {
    setConfig({
      order: ALL_WIDGETS.map(w => w.id),
      visible: Object.fromEntries(ALL_WIDGETS.map(w => [w.id, w.defaultVisible])),
    });
  };

  // In consolidated mode, show multi-company widgets. In single mode, hide them.
  const visibleWidgets = config.order.filter(id => {
    if (!config.visible[id]) return false;
    if (MULTI_COMPANY_WIDGETS.has(id) && !isConsolidatedMode) return false;
    return true;
  });
  const hiddenWidgets = ALL_WIDGETS.filter(w => !config.visible[w.id]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-seguranca-gray">
          <GripVertical className="h-4 w-4" />
          Arraste os cards para reordenar
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}
            className="text-seguranca-gray hover:text-seguranca-lightgray">
            <Settings className="h-4 w-4 mr-1" /> Widgets
          </Button>
          <Button variant="ghost" size="sm" onClick={resetLayout}
            className="text-seguranca-gray hover:text-seguranca-lightgray">
            <RefreshCw className="h-4 w-4 mr-1" /> Resetar
          </Button>
        </div>
      </div>

      {/* Draggable Dashboard Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleWidgets.map(id => {
              const widget = ALL_WIDGETS.find(w => w.id === id);
              if (!widget) return null;
              return (
                <SortableWidget
                  key={id}
                  id={id}
                  widget={widget}
                  data={data}
                  onToggle={toggleWidget}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md bg-seguranca-darkgray border-seguranca-gray/20">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center">
              <Settings className="mr-2 h-5 w-5 text-seguranca-yellow" />
              Customizar Widgets
            </DialogTitle>
            <DialogDescription className="text-seguranca-gray">
              Ative ou desative os widgets do seu dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {ALL_WIDGETS.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 rounded-lg
                bg-seguranca-black/30 border border-seguranca-gray/20">
                <div className="flex items-center gap-3">
                  <span className="text-seguranca-yellow">{w.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-seguranca-lightgray">{w.title}</p>
                    <p className="text-xs text-seguranca-gray">{w.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleWidget(w.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    config.visible[w.id]
                      ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                      : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                  }`}
                >
                  {config.visible[w.id] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExecutiveDashboard;
