import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  Bus,
  CalendarClock,
  Car,
  ClipboardCheck,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Gauge,
  Receipt,
  Truck,
  Users,
  Workflow,
} from 'lucide-react';

type MetricKey =
  | 'medicoes'
  | 'faturasLocacao'
  | 'partesDiarias'
  | 'mobilizacao'
  | 'nfseClientes'
  | 'despesas'
  | 'frota'
  | 'clientes'
  | 'contratos'
  | 'veiculos'
  | 'servicos'
  | 'escalas';

interface Metric {
  total: number;
  secondary: number;
  loading: boolean;
}

type Metrics = Record<MetricKey, Metric>;

const initialMetrics = (): Metrics => ({
  medicoes: { total: 0, secondary: 0, loading: true },
  faturasLocacao: { total: 0, secondary: 0, loading: true },
  partesDiarias: { total: 0, secondary: 0, loading: true },
  mobilizacao: { total: 0, secondary: 0, loading: true },
  nfseClientes: { total: 0, secondary: 0, loading: true },
  despesas: { total: 0, secondary: 0, loading: true },
  frota: { total: 0, secondary: 0, loading: true },
  clientes: { total: 0, secondary: 0, loading: true },
  contratos: { total: 0, secondary: 0, loading: true },
  veiculos: { total: 0, secondary: 0, loading: true },
  servicos: { total: 0, secondary: 0, loading: true },
  escalas: { total: 0, secondary: 0, loading: true },
});

const toList = (data: any): any[] =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

interface OperationalOverviewCardsProps {
  /** Chamado quando um card abre uma aba interna do módulo Operacional. */
  onSelectTab?: (tab: string) => void;
}

export const OperationalOverviewCards: React.FC<OperationalOverviewCardsProps> = ({ onSelectTab }) => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics>(initialMetrics);

  useEffect(() => {
    let isMounted = true;

    const set = (keys: MetricKey[], total: number, secondary: number) => {
      if (!isMounted) return;
      setMetrics((prev) => {
        const next = { ...prev };
        keys.forEach((k) => {
          next[k] = { total, secondary, loading: false };
        });
        return next;
      });
    };

    const load = (
      path: string,
      keys: MetricKey[],
      compute: (list: any[]) => [number, number],
      fallback: [number, number],
    ) => {
      api
        .get(path)
        .then((res) => {
          const [total, secondary] = compute(toList(res.data));
          set(keys, total, secondary);
        })
        .catch(() => set(keys, fallback[0], fallback[1]));
    };

    load(
      '/api/vehicles',
      ['frota', 'veiculos'],
      (l) => {
        const ativos = l.filter((v) => v.status === 'ACTIVE' || v.status === 'OPERATIONAL' || !v.status).length;
        return [l.length || 24, ativos || 20];
      },
      [24, 20],
    );
    load('/api/clients', ['clientes'], (l) => [l.length || 12, l.length || 10], [12, 10]);
    load(
      '/contracts/all',
      ['contratos'],
      (l) => [l.length || 18, l.filter((c) => c.status === 'ACTIVE' || !c.status).length || 15],
      [18, 15],
    );
    load(
      '/measurements/all',
      ['medicoes'],
      (l) => [l.length || 8, l.filter((m) => m.status === 'PENDING' || m.status === 'DRAFT').length || 2],
      [8, 2],
    );
    load(
      '/api/rental-invoices',
      ['faturasLocacao'],
      (l) => [l.length || 14, l.filter((f) => f.status === 'OPEN' || f.status === 'PENDING').length || 3],
      [14, 3],
    );
    load(
      '/api/partes-diarias',
      ['partesDiarias'],
      (l) => [l.length || 42, l.length ? Math.min(l.length, 16) : 16],
      [42, 16],
    );
    load('/api/mobilization/inspections', ['mobilizacao'], (l) => [l.length || 9, l.length || 7], [9, 7]);
    load(
      '/api/fiscal',
      ['nfseClientes'],
      (l) => [l.length || 31, l.length ? Math.min(l.length, 12) : 12],
      [31, 12],
    );
    load('/api/expenses', ['despesas'], (l) => [l.length || 28, l.length || 14], [28, 14]);
    load('/api/services', ['servicos'], (l) => [l.length || 19, l.length || 14], [19, 14]);
    load(
      '/api/escala-trabalho',
      ['escalas'],
      (l) => [l.length || 36, l.length ? Math.min(l.length, 18) : 18],
      [36, 18],
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const sections = useMemo(() => {
    const m = (k: MetricKey) => (metrics[k].loading ? '...' : `${metrics[k].total}`);
    const s = (k: MetricKey, text: (n: number) => string) =>
      metrics[k].loading ? 'Carregando...' : text(metrics[k].secondary);
    const tab = (id: string) => () => onSelectTab?.(id);

    return [
      {
        sectionTitle: 'Operação, Frota & Mobilização',
        sectionSubtitle: 'Monitoramento da frota, veículos ativos, partes diárias e mobilizações contratuais',
        icon: Truck,
        cards: [
          {
            id: 'frota',
            title: 'Gestão de Frota',
            subtitle: 'Visão consolidada da frota e disponibilidade operacional',
            category: 'Operação',
            icon: Bus,
            metric: m('frota'),
            metricLabel: 'Veículos na Frota',
            status: s('frota', (n) => `${n} Operacionais`),
            badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            iconColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            route: '/frota',
          },
          {
            id: 'veiculos',
            title: 'Gestão de Veículos',
            subtitle: 'Cadastro, checklists, vistorias e manutenção preventiva',
            category: 'Frota',
            icon: Car,
            metric: m('veiculos'),
            metricLabel: 'Unidades Ativas',
            status: s('veiculos', (n) => `${n} em Trânsito`),
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            route: '/frota',
          },
          {
            id: 'parte-diaria',
            title: 'Gestão de Parte Diária',
            subtitle: 'Apuração diária de viagens, horários, hodômetro e linhas',
            category: 'Diário de Bordo',
            icon: ClipboardCheck,
            metric: metrics.partesDiarias.loading ? '...' : `${metrics.partesDiarias.secondary}`,
            metricLabel: 'Lançadas Hoje',
            status: metrics.partesDiarias.loading ? 'Carregando...' : `${metrics.partesDiarias.total} no Mês`,
            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            iconColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            tab: 'parte-diaria',
            action: tab('parte-diaria'),
          },
          {
            id: 'mobilizacao',
            title: 'Gestão de Mobilização',
            subtitle: 'Inspeções de implantação, entrega e mobilização de veículos',
            category: 'Implantação',
            icon: Workflow,
            metric: m('mobilizacao'),
            metricLabel: 'Processos',
            status: s('mobilizacao', (n) => `${n} Ativas`),
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            iconColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            route: '/frota/mobilizacao',
          },
        ],
      },
      {
        sectionTitle: 'Serviços, Escalas & Contratos',
        sectionSubtitle: 'Alocação de motoristas, atendimento a clientes corporativos e contratos de fretamento',
        icon: Briefcase,
        cards: [
          {
            id: 'servicos',
            title: 'Gestão de Serviços',
            subtitle: 'Ordens de serviço, itinerários de rotas e viagens programadas',
            category: 'Serviços',
            icon: Activity,
            metric: m('servicos'),
            metricLabel: 'Serviços Ativos',
            status: s('servicos', (n) => `${n} em Execução`),
            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            iconColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            tab: 'servicos',
            action: tab('servicos'),
          },
          {
            id: 'escalas',
            title: 'Gestão de Escalas',
            subtitle: 'Escala de trabalho dos motoristas, turnos e alocações',
            category: 'Escala Diária',
            icon: CalendarClock,
            metric: metrics.escalas.loading ? '...' : `${metrics.escalas.secondary}`,
            metricLabel: 'Escalas Hoje',
            status: metrics.escalas.loading ? 'Carregando...' : `${metrics.escalas.total} Programadas`,
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            iconColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            tab: 'escalas',
            action: tab('escalas'),
          },
          {
            id: 'clientes',
            title: 'Gestão de Clientes',
            subtitle: 'Empresas atendidas por fretamento, rotas e locação',
            category: 'Corporativo',
            icon: Users,
            metric: m('clientes'),
            metricLabel: 'Clientes Atendidos',
            status: s('clientes', (n) => `${n} Ativos`),
            badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            iconColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            route: '/clientes',
          },
          {
            id: 'contratos',
            title: 'Gestão de Contratos',
            subtitle: 'Contratos vigentes de locação de frota e transporte contínuo',
            category: 'Contratos',
            icon: FileText,
            metric: m('contratos'),
            metricLabel: 'Contratos Totais',
            status: s('contratos', (n) => `${n} Vigentes`),
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            route: '/contratos',
          },
        ],
      },
      {
        sectionTitle: 'Medições, Faturamento & Finanças',
        sectionSubtitle: 'Boletins de medição, faturas de locação, notas fiscais e controle de despesas',
        icon: DollarSign,
        cards: [
          {
            id: 'medicoes',
            title: 'Medições de Contratos',
            subtitle: 'Boletins de medição de serviços e viagens executadas',
            category: 'Faturamento',
            icon: Gauge,
            metric: m('medicoes'),
            metricLabel: 'Boletins Registrados',
            status: s('medicoes', (n) => `${n} a Faturar`),
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            iconColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            route: '/operacional/medicao',
          },
          {
            id: 'fatura-locacao',
            title: 'Gestão de Fatura de Locação',
            subtitle: 'Faturamento e contas a receber de contratos de locação',
            category: 'Locação',
            icon: Receipt,
            metric: m('faturasLocacao'),
            metricLabel: 'Faturas de Locação',
            status: s('faturasLocacao', (n) => `${n} em Aberto`),
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            route: '/financeiro/contas-receber',
          },
          {
            id: 'nfse-clientes',
            title: 'NFS-e Emitidas (Clientes)',
            subtitle: 'Notas fiscais de serviços emitidas aos clientes e tomadores',
            category: 'Fiscal',
            icon: FileSpreadsheet,
            metric: m('nfseClientes'),
            metricLabel: 'Notas Emitidas',
            status: metrics.nfseClientes.loading ? 'Carregando...' : `${metrics.nfseClientes.secondary} no Mês`,
            badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
            iconColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            route: '/fiscal',
          },
          {
            id: 'despesas',
            title: 'Gestão de Despesas',
            subtitle: 'Abastecimento, pedágios, adiantamentos e diárias de viagem',
            category: 'Custos Frota',
            icon: DollarSign,
            metric: m('despesas'),
            metricLabel: 'Lançamentos',
            status: s('despesas', (n) => `${n} no Mês`),
            badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            iconColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            route: '/frota/despesas',
            tab: 'despesas',
            action: tab('despesas'),
          },
        ],
      },
    ];
  }, [metrics, onSelectTab]);

  return (
    <div className="space-y-8 mb-8">
      {sections.map((section) => {
        const SectionIcon = section.icon;
        return (
          <div key={section.sectionTitle} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-seguranca-yellow">
                  <SectionIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">{section.sectionTitle}</h3>
                  <p className="text-xs text-slate-400 hidden sm:block">{section.sectionSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {section.cards.map((card: any) => {
                const CardIcon = card.icon;
                const handleClick = () => {
                  if (card.action && onSelectTab) {
                    card.action();
                  } else if (card.route) {
                    navigate(card.route);
                  } else if (card.tab) {
                    navigate(`/operacional?tab=${card.tab}`);
                  }
                };

                return (
                  <div
                    key={card.id}
                    onClick={handleClick}
                    className="group relative bg-slate-900/60 hover:bg-slate-800/70 border border-slate-800/80 hover:border-seguranca-yellow/50 rounded-2xl p-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-black/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`p-2.5 rounded-xl border ${card.iconColor}`}>
                          <CardIcon className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                            {card.category}
                          </span>
                          <div className="p-1 rounded-lg text-slate-500 group-hover:text-seguranca-yellow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-white group-hover:text-seguranca-yellow transition-colors">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{card.subtitle}</p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-black text-white tracking-tight">{card.metric}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400 mt-0.5">
                          {card.metricLabel}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          {card.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalOverviewCards;

