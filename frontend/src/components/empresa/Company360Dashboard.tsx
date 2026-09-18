import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { companyService, CompanyOverviewDTO } from '@/services/companyService';
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
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  Building2,
  Users,
  Car,
  FileCheck2,
  Wrench,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  Activity,
} from 'lucide-react';

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

interface Company360DashboardProps {
  companyId?: string;
  companyName?: string;
}

export const Company360Dashboard: React.FC<Company360DashboardProps> = ({
  companyId,
  companyName,
}) => {
  const { toast } = useToast();
  const [data, setData] = useState<CompanyOverviewDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'rh' | 'frota' | 'contratos' | 'manutencao' | 'estoque' | 'financeiro'>('geral');

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const result = await companyService.getCompanyOverview(companyId);
      setData(result);
    } catch (error: any) {
      console.error('Error loading company overview:', error);
      toast({
        title: 'Erro ao carregar Visão 360°',
        description: error.response?.data?.message || 'Falha ao buscar dados consolidados da empresa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, [companyId]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-12 bg-gray-800/50 rounded-xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800/40 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-gray-800/40 rounded-xl" />
          <div className="h-72 bg-gray-800/40 rounded-xl" />
        </div>
      </div>
    );
  }

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Prepare chart datasets
  const departmentData = data?.headcountByDepartment
    ? Object.entries(data.headcountByDepartment).map(([name, value]) => ({ name, value }))
    : [];

  const fleetData = data?.fleetStatusDistribution
    ? Object.entries(data.fleetStatusDistribution).map(([status, value]) => ({
        name: status === 'ACTIVE' ? 'Operacional' : status === 'MAINTENANCE' ? 'Em Manutenção' : status === 'INACTIVE' ? 'Inativo' : status,
        value,
      }))
    : [];

  const financialEvolution = data?.revenueEvolutionLast6Months || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-seguranca-black via-seguranca-graphite to-seguranca-black border border-gray-700/60 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-seguranca-red via-red-600 to-orange-600 text-white shadow-xl shadow-seguranca-red/30">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {data?.companyName || companyName || 'Visão Executiva 360° da Empresa'}
              </h2>
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-2.5 py-0.5 font-bold">
                Multi-Tenant Ativo
              </Badge>
            </div>
            <p className="text-gray-400 text-xs mt-1 flex items-center gap-2">
              <span className="font-mono text-gray-300">CNPJ: {data?.cnpj || 'Consolidado'}</span>
              <span>•</span>
              <span>Visão holística de RH, Frota, Contratos, OS, Estoque e DRE Financeiro</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOverview}
            disabled={isLoading}
            className="border-gray-600/60 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Indicadores
          </Button>
        </div>
      </div>

      {/* Quick 6 Pillars KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* RH */}
        <Card className="bg-gradient-to-br from-blue-950/40 to-seguranca-black border-blue-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-blue-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Efetivo RH</span>
            <Users className="h-4 w-4 text-blue-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{data?.totalEmployees || 0}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{data?.activeEmployees || 0} ativos</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Colaboradores registrados</p>
        </Card>

        {/* Frota */}
        <Card className="bg-gradient-to-br from-amber-950/40 to-seguranca-black border-amber-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-amber-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Frota Total</span>
            <Car className="h-4 w-4 text-amber-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{data?.totalVehicles || 0}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{data?.activeVehicles || 0} rodando</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{data?.maintenanceVehicles || 0} em manutenção</p>
        </Card>

        {/* Clientes e Contratos */}
        <Card className="bg-gradient-to-br from-emerald-950/40 to-seguranca-black border-emerald-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-emerald-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Clientes / Obras</span>
            <Building2 className="h-4 w-4 text-emerald-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{data?.totalClients || 0}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">{data?.totalWorkPosts || 0} postos</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{data?.totalActiveContracts || 0} contratos ativos</p>
        </Card>

        {/* Manutenção / OS */}
        <Card className="bg-gradient-to-br from-purple-950/40 to-seguranca-black border-purple-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-purple-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Ordens Serviço</span>
            <Wrench className="h-4 w-4 text-purple-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{(data?.openServiceOrders || 0) + (data?.inProgressServiceOrders || 0)}</span>
            <span className="text-[10px] text-purple-300 font-semibold">{data?.inProgressServiceOrders || 0} em execução</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{data?.completedServiceOrdersMonth || 0} concluídas no mês</p>
        </Card>

        {/* Almoxarifado */}
        <Card className="bg-gradient-to-br from-cyan-950/40 to-seguranca-black border-cyan-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-cyan-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Almoxarifado</span>
            <Package className="h-4 w-4 text-cyan-400 opacity-80" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{data?.totalStockItems || 0}</span>
            {data?.lowStockItems ? (
              <span className="text-[10px] text-rose-400 font-bold">{data.lowStockItems} crítico(s)</span>
            ) : (
              <span className="text-[10px] text-emerald-400 font-semibold">Normal</span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{formatCurrency(data?.stockTotalValue)} em estoque</p>
        </Card>

        {/* Financeiro */}
        <Card className="bg-gradient-to-br from-rose-950/40 to-seguranca-black border-rose-500/30 p-4 rounded-xl shadow-lg relative overflow-hidden group hover:border-rose-400/60 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Faturamento Mês</span>
            <DollarSign className="h-4 w-4 text-rose-400 opacity-80" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-emerald-400 truncate block">
              {formatCurrency(data?.revenueCurrentMonth)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Rec. Recorrente: {formatCurrency(data?.monthlyContractValueTotal)}
          </p>
        </Card>
      </div>

      {/* Main Interactive Charts & Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Financial & Contractual Evolution */}
        <Card className="lg:col-span-2 bg-seguranca-black/80 border-gray-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Evolução Financeira da Empresa (Receitas x Despesas - 6 Meses)
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Visão consolidada de entradas, custos operacionais e margem líquida</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Receitas
              </span>
              <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> Despesas
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialEvolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDesp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={10}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                    formatter={(val: any) => formatCurrency(Number(val))}
                  />
                  <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
                  <Area type="monotone" dataKey="expenses" name="Despesa" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorDesp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Financial summary bar */}
            <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-gray-800 text-center">
              <div>
                <div className="text-xs text-gray-400">Contas a Receber Pendentes</div>
                <div className="text-base font-bold text-blue-400 mt-0.5">{formatCurrency(data?.accountsReceivablePending)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Contas a Pagar Pendentes</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">{formatCurrency(data?.accountsPayablePending)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Resultado Líquido do Mês</div>
                <div className={`text-base font-bold mt-0.5 ${(data?.netResultCurrentMonth || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(data?.netResultCurrentMonth)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Col: Fleet Status & Operational Availability */}
        <Card className="bg-seguranca-black/80 border-gray-800 p-6 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Car className="h-5 w-5 text-amber-400" />
                Disponibilidade da Frota
              </CardTitle>
              <p className="text-xs text-gray-400">Distribuição operacional por status de veículos</p>
            </CardHeader>

            <div className="h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetData.length > 0 ? fleetData : [{ name: 'Sem Veículos', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {fleetData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-800">
            {fleetData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-bold text-white">{item.value} unid.</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Department Headcount & Sectorial Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Headcount by Department */}
        <Card className="bg-seguranca-black/80 border-gray-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Alocação do Efetivo por Departamento / Setor
            </CardTitle>
            <p className="text-xs text-gray-400">Distribuição dos {data?.totalEmployees || 0} colaboradores por área</p>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" name="Funcionários" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Operational Scope & Contracts Breakdown */}
        <Card className="bg-seguranca-black/80 border-gray-800 p-6 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Matriz de Governança & Eficiência Operacional
            </CardTitle>
            <p className="text-xs text-gray-400">Resumo de desempenho transversal em todos os módulos da empresa</p>
          </CardHeader>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Taxa de Ocupação Frota</span>
              <div className="text-xl font-black text-amber-400">
                {data?.totalVehicles ? `${Math.round(((data.activeVehicles || 0) / data.totalVehicles) * 100)}%` : '100%'}
              </div>
              <p className="text-[10px] text-gray-500">Veículos ativos em campo</p>
            </div>

            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Resolução de Manutenção</span>
              <div className="text-xl font-black text-purple-400">
                {data?.completedServiceOrdersMonth ? `${data.completedServiceOrdersMonth} OS` : '0 OS'}
              </div>
              <p className="text-[10px] text-gray-500">Concluídas este mês</p>
            </div>

            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Postos por Contrato</span>
              <div className="text-xl font-black text-emerald-400">
                {data?.totalActiveContracts ? (data.totalWorkPosts / data.totalActiveContracts).toFixed(1) : '1.0'}
              </div>
              <p className="text-[10px] text-gray-500">Média de frentes de serviço</p>
            </div>

            <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800 space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Saúde do Estoque</span>
              <div className="text-xl font-black text-cyan-400">
                {data?.lowStockItems === 0 ? '100%' : `${Math.max(0, 100 - (data?.lowStockItems || 0) * 5)}%`}
              </div>
              <p className="text-[10px] text-gray-500">Níveis ideais de suprimentos</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-seguranca-red/10 to-orange-500/10 rounded-xl border border-seguranca-red/20 text-xs text-gray-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-seguranca-yellow" />
              Controle Total Corporativo Seguro
            </span>
            <Badge variant="outline" className="text-[10px] text-seguranca-yellow border-seguranca-yellow/40">
              100% Auditável
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
};
