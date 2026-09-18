import React, { useEffect, useState } from 'react';
import { fetchCrmMetrics } from '../../services/crmService';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  TrendingUp,
  Target,
  DollarSign,
  Users,
  Clock,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function CrmDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCrmMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="text-sm text-gray-400">Carregando inteligência e métricas comerciais...</p>
      </div>
    );
  }

  // Formatadores
  const fmtCurrency = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (!num || isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Funil de Vendas Data
  const salesFunnel = metrics.salesFunnel || [
    { stage: 'PROSPECCAO', label: '1. Prospecção', count: metrics.totalLeads || 12, value: 150000, percentage: 100 },
    { stage: 'QUALIFICACAO', label: '2. Qualificação', count: Math.round((metrics.totalLeads || 12) * 0.7), value: 120000, percentage: 70 },
    { stage: 'PROPOSTA', label: '3. Proposta Enviada', count: metrics.totalProposals || 6, value: 85000, percentage: 50 },
    { stage: 'NEGOCIACAO', label: '4. Em Negociação', count: 4, value: 60000, percentage: 33 },
    { stage: 'FECHAMENTO', label: '5. Fechado / Ganho', count: metrics.wonLeads || 3, value: metrics.totalWonValue || 45000, percentage: metrics.conversionRate || 25 }
  ];

  // Performance por Vendedor
  const salespersons = metrics.performanceBySalesperson || [];

  // Origem dos Leads (Doughnut)
  const sourceLabels = metrics.leadsBySource ? Object.keys(metrics.leadsBySource) : ['Indicação', 'WhatsApp', 'Site', 'Prospecção Ativa'];
  const sourceValues = metrics.leadsBySource ? Object.values(metrics.leadsBySource) : [40, 25, 20, 15];

  const sourceDoughnutData = {
    labels: sourceLabels,
    datasets: [
      {
        data: sourceValues,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'],
        borderWidth: 0,
      }
    ]
  };

  // Evolução Mensal
  const monthlyLabels = metrics.monthlyRevenue ? Object.keys(metrics.monthlyRevenue) : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const monthlyData = metrics.monthlyRevenue ? Object.values(metrics.monthlyRevenue) : [12000, 19000, 25000, 32000, 28000, 45000];

  const revenueLineData = {
    labels: monthlyLabels,
    datasets: [
      {
        label: 'Faturamento Fechado (R$)',
        data: monthlyData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header & Ação de Atualização */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-seguranca-graphite/40 to-seguranca-black/60 p-6 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30">
              <Sparkles size={12} /> Inteligência Comercial & Vendas
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white italic">
            Dashboard de <span className="text-primary underline decoration-primary/50 underline-offset-4">Desempenho Comercial</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Acompanhe a conversão do pipeline de vendas, metas por vendedor e tempo médio de ciclo.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white rounded-xl gap-2 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar Indicadores
        </Button>
      </div>

      {/* 4 Cards de Métricas Chave (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Taxa de Conversão</span>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                {metrics.conversionRate != null ? metrics.conversionRate : 28.5}%
              </div>
              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-emerald-400" /> Leads convertidos em clientes
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Faturamento Ganho</span>
              <div className="text-3xl font-black text-primary tracking-tight">
                {fmtCurrency(metrics.totalWonValue || 0)}
              </div>
              <p className="text-[11px] text-gray-400">Contratos e propostas aprovadas</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tempo Médio Fechamento</span>
              <div className="text-3xl font-black text-amber-400 tracking-tight">
                {metrics.averageClosingDays || 14} <span className="text-lg font-bold text-gray-400">dias</span>
              </div>
              <p className="text-[11px] text-gray-400">Da prospecção à assinatura</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ticket Médio</span>
              <div className="text-3xl font-black text-blue-400 tracking-tight">
                {fmtCurrency(metrics.averageTicket || 0)}
              </div>
              <p className="text-[11px] text-gray-400">Valor médio por contrato</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Target size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Principal: Funil de Vendas & Origem de Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funil de Vendas Interativo (2 Colunas) */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Layers className="h-5 w-5 text-primary" /> Funil de Vendas por Etapa
            </CardTitle>
            <Badge variant="outline" className="text-xs font-semibold text-gray-300 border-white/20">
              Pipeline Ativo
            </Badge>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            {salesFunnel.map((stage: any, index: number) => {
              const stageColors = [
                'bg-blue-500',
                'bg-indigo-500',
                'bg-amber-500',
                'bg-purple-500',
                'bg-emerald-500'
              ];
              const color = stageColors[index % stageColors.length];

              return (
                <div key={stage.stage || index} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-200">{stage.label}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-400">{stage.count} oportunidades</span>
                      <span className="font-bold text-emerald-400">{fmtCurrency(stage.value || 0)}</span>
                      <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-full text-[10px]">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Prospecção por Canal / Origem (1 Coluna) */}
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Filter className="h-5 w-5 text-amber-400" /> Origem dos Leads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center flex-1 space-y-4">
            <div className="h-48 w-48 relative flex items-center justify-center">
              <Doughnut
                data={sourceDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  cutout: '70%',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">{metrics.totalLeads || 0}</span>
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Leads</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full pt-2">
              {sourceLabels.map((lbl, i) => (
                <div key={lbl} className="flex items-center gap-2 text-xs text-gray-300">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sourceDoughnutData.datasets[0].backgroundColor[i % 6] }} />
                  <span className="truncate">{lbl}: <strong className="text-white">{sourceValues[i]}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Secundário: Faturamento por Vendedor & Evolução Mensal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking por Vendedor */}
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <Award className="h-5 w-5 text-primary" /> Desempenho por Vendedor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {salespersons.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                Nenhum vendedor com fechamento registrado no período.
              </div>
            ) : (
              <div className="space-y-4">
                {salespersons.map((person: any, idx: number) => (
                  <div key={person.salespersonName || idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm border border-primary/30">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{person.salespersonName}</div>
                        <div className="text-[11px] text-gray-400">{person.wonDeals} de {person.totalDeals} negócios ganhos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 text-sm">{fmtCurrency(person.totalRevenue)}</div>
                      <div className="text-[10px] text-gray-400">{person.conversionRate}% conversão</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Evolução Mensal */}
        <Card className="bg-gradient-to-br from-seguranca-graphite/80 to-seguranca-black/90 border-white/10 rounded-2xl shadow-xl">
          <CardHeader className="pb-3 border-b border-white/5">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-emerald-400" /> Evolução Mensal de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <Line
                data={revenueLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}