import React, { useEffect, useMemo, useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeReportFiltersModal from '@/components/funcionarios/EmployeeReportFiltersModal';
import { employeeService } from '@/services/employeeService';
import { Employee } from '@/types/employee';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  UserCheck,
  UserPlus,
  UserMinus,
  BarChart3,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { getEmployeeSector, getEmployeeCompany } from '@/utils/employeeReportFilters';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const monthLabel = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

const RelatorioFuncionarios: React.FC = () => {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await employeeService.getAllEmployees();
      setEmployees(data);
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os funcionários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  const kpis = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'ACTIVE').length;
    const admissions = employees.filter(e => (e.hireDate || '').startsWith(currentMonth)).length;
    const dismissals = employees.filter(e => {
      const term = e.terminationDate || e.dataRescisao || '';
      return term.startsWith(currentMonth);
    }).length;
    return { total, active, admissions, dismissals };
  }, [employees, currentMonth]);

  const departmentData = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach(e => {
      const key = getEmployeeSector(e) || 'Não informado';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [employees]);

  const admissionDismissalData = useMemo(() => {
    const buckets: { key: string; label: string; admissoes: number; demissoes: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({ key, label: monthLabel(d), admissoes: 0, demissoes: 0 });
    }
    const byKey = new Map(buckets.map(b => [b.key, b]));
    employees.forEach(e => {
      const hire = (e.hireDate || '').slice(0, 7);
      const term = (e.terminationDate || e.dataRescisao || '').slice(0, 7);
      if (hire && byKey.has(hire)) {
        const b = byKey.get(hire)!;
        b.admissoes += 1;
      }
      if (term && byKey.has(term)) {
        const b = byKey.get(term)!;
        b.demissoes += 1;
      }
    });
    return buckets;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees]);

  const salaryData = useMemo(() => {
    const ranges = [
      { name: 'Até 1.500', min: 0, max: 1500, value: 0 },
      { name: '1.501–2.500', min: 1500.01, max: 2500, value: 0 },
      { name: '2.501–4.000', min: 2500.01, max: 4000, value: 0 },
      { name: 'Acima de 4.000', min: 4000.01, max: Infinity, value: 0 },
      { name: 'Não informado', min: -1, max: -1, value: 0 },
    ];
    employees.forEach(e => {
      if (e.salario == null || Number.isNaN(Number(e.salario))) {
        ranges[4].value += 1;
        return;
      }
      const s = Number(e.salario);
      const match = ranges.find(r => s >= r.min && s <= r.max);
      if (match) match.value += 1;
    });
    return ranges
      .filter(r => r.value > 0)
      .map(r => ({ name: r.name, value: r.value }));
  }, [employees]);

  const unitData = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach(e => {
      const key = getEmployeeCompany(e) || e.unit?.name || 'Não informada';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [employees]);

  const kpiCards = [
    {
      title: 'Total de Funcionários',
      value: kpis.total,
      icon: Users,
      iconClass: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      valueClass: 'text-blue-400',
    },
    {
      title: 'Ativos',
      value: kpis.active,
      icon: UserCheck,
      iconClass: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      valueClass: 'text-emerald-400',
    },
    {
      title: 'Admissões (mês)',
      value: kpis.admissions,
      icon: UserPlus,
      iconClass: 'bg-seguranca-yellow/20 border-seguranca-yellow/30 text-seguranca-yellow',
      valueClass: 'text-seguranca-yellow',
    },
    {
      title: 'Demissões (mês)',
      value: kpis.dismissals,
      icon: UserMinus,
      iconClass: 'bg-red-500/20 border-red-500/30 text-red-400',
      valueClass: 'text-red-400',
    },
  ];

  if (loading && !employees.length) {
    return (
      <StandardLayout
        title="Relatórios de Funcionários"
        subtitle="Indicadores e análises do quadro de pessoal"
      >
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl bg-seguranca-graphite/80" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl bg-seguranca-graphite/80" />
            <Skeleton className="h-72 rounded-xl bg-seguranca-graphite/80" />
          </div>
        </div>
      </StandardLayout>
    );
  }

  return (
    <StandardLayout
      title="Relatórios de Funcionários"
      subtitle={`${employees.length} funcionário(s) no sistema`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="border-seguranca-yellow/40 text-seguranca-yellow text-xs px-3 py-1"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 inline" />
            Dashboard + Filtros Avançados
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={load}
              disabled={loading}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            <Button
              onClick={() => setFiltersOpen(true)}
              className="bg-seguranca-red hover:bg-seguranca-darkred text-white shadow-lg shadow-seguranca-red/20"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros / Exportar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpiCards.map(card => (
            <Card
              key={card.title}
              className="bg-gradient-to-br from-seguranca-graphite to-seguranca-black border-gray-600/50 hover:border-seguranca-red/40 transition-all"
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{card.title}</p>
                  <p className={`text-3xl font-bold mt-2 ${card.valueClass}`}>{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl border ${card.iconClass}`}>
                  <card.icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Distribuição por Departamento
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Top setores com mais colaboradores
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {departmentData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Sem dados de departamento
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {departmentData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #4b5563',
                        borderRadius: 8,
                        color: '#e5e7eb',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Admissões e Demissões (12 meses)
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Evolução mensal do quadro de pessoal
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={admissionDismissalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#18181b',
                      border: '1px solid #4b5563',
                      borderRadius: 8,
                      color: '#e5e7eb',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  <Bar dataKey="admissoes" name="Admissões" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demissoes" name="Demissões" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">
                Faixas Salariais
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Distribuição por faixa de salário
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {salaryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Sem dados salariais
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salaryData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {salaryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #4b5563',
                        borderRadius: 8,
                        color: '#e5e7eb',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-base">Por Unidade / Empresa</CardTitle>
              <CardDescription className="text-gray-400 text-sm">
                Colaboradores por unidade de negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {unitData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                  Sem dados de unidade
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" allowDecimals={false} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: '#9ca3af', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#18181b',
                        border: '1px solid #4b5563',
                        borderRadius: 8,
                        color: '#e5e7eb',
                      }}
                    />
                    <Bar dataKey="value" name="Colaboradores" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EmployeeReportFiltersModal
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
      />
    </StandardLayout>
  );
};

export default RelatorioFuncionarios;
