import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Activity,
  CreditCard,
  BarChart3,
  Layers,
  FileText,
  Gauge,
  ChevronLeft,
  ChevronRight,
  Landmark
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FinanceiroDashboard } from '@/components/financeiro/FinanceiroDashboard';
import ContasAPagarTab from '@/components/financeiro/ContasAPagarTab';
import ContasAReceberTab from '@/components/financeiro/ContasAReceberTab';
import FluxoCaixaTab from '@/components/financeiro/FluxoCaixaTab';
import PagamentosTab from '@/components/financeiro/PagamentosTab';
import RelatoriosTab from '@/components/financeiro/RelatoriosTab';
import CentroCustosTab from '@/components/financeiro/CentroCustosTab';
import FaturasTab from '@/components/financeiro/FaturasTab';
import MedicoesTab from '@/components/financeiro/MedicoesTab';
import { PurchaseOrdersFinancialManager } from '@/components/financeiro/PurchaseOrdersFinancialManager';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | null;
  activeColor: string;
  iconColor: string;
}

const TABS_CONFIG: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:shadow-blue-600/25 data-[state=active]:border-blue-500/40',
    iconColor: 'text-blue-400'
  },
  {
    id: 'ordens-compra',
    label: 'Ordens de Compra',
    icon: ShoppingCart,
    badge: 'Novo',
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-700 data-[state=active]:shadow-amber-600/25 data-[state=active]:border-amber-500/40',
    iconColor: 'text-amber-400'
  },
  {
    id: 'contas-pagar',
    label: 'Contas a Pagar',
    icon: TrendingDown,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-rose-700 data-[state=active]:shadow-rose-600/25 data-[state=active]:border-rose-500/40',
    iconColor: 'text-rose-400'
  },
  {
    id: 'contas-receber',
    label: 'Contas a Receber',
    icon: TrendingUp,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:shadow-emerald-600/25 data-[state=active]:border-emerald-500/40',
    iconColor: 'text-emerald-400'
  },
  {
    id: 'fluxo-caixa',
    label: 'Fluxo de Caixa',
    icon: Activity,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-cyan-700 data-[state=active]:shadow-cyan-600/25 data-[state=active]:border-cyan-500/40',
    iconColor: 'text-cyan-400'
  },
  {
    id: 'pagamentos',
    label: 'Pagamentos',
    icon: CreditCard,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-indigo-700 data-[state=active]:shadow-indigo-600/25 data-[state=active]:border-indigo-500/40',
    iconColor: 'text-indigo-400'
  },
  {
    id: 'relatorios-financeiros',
    label: 'Relatórios',
    icon: BarChart3,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:shadow-purple-600/25 data-[state=active]:border-purple-500/40',
    iconColor: 'text-purple-400'
  },
  {
    id: 'centro-custos',
    label: 'Centro Custos',
    icon: Layers,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-700 data-[state=active]:shadow-orange-600/25 data-[state=active]:border-orange-500/40',
    iconColor: 'text-orange-400'
  },
  {
    id: 'faturas',
    label: 'Faturas',
    icon: FileText,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-600 data-[state=active]:to-yellow-700 data-[state=active]:shadow-yellow-600/25 data-[state=active]:border-yellow-500/40',
    iconColor: 'text-yellow-400'
  },
  {
    id: 'medicoes',
    label: 'Medições',
    icon: Gauge,
    activeColor: 'data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:shadow-teal-600/25 data-[state=active]:border-teal-500/40',
    iconColor: 'text-teal-400'
  },
];

const Financeiro: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sincronização da aba com URL (ou fallback 'dashboard')
  const validTabIds = TABS_CONFIG.map(t => t.id);
  const urlTab = searchParams.get('tab');
  const activeTab = urlTab && validTabIds.includes(urlTab) ? urlTab : 'dashboard';

  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab }, { replace: true });
  };

  // Monitor de scroll horizontal nas abas
  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollability, 300);
    }
  };

  // Mock data para o Dashboard
  const mockTransactions = [
    {
      id: '1',
      description: 'Pagamento de fornecedor',
      amount: 1500,
      type: 'EXPENSE',
      status: 'PENDING',
      category: 'Operacional',
      date: new Date().toISOString()
    },
    {
      id: '2',
      description: 'Recebimento de cliente',
      amount: 3000,
      type: 'INCOME',
      status: 'CONFIRMED',
      category: 'Vendas',
      date: new Date().toISOString()
    }
  ];

  const mockInvoices = [
    {
      id: '1',
      invoiceNumber: 'FAT-001',
      clientName: 'Cliente Teste',
      description: 'Serviços prestados',
      amount: 2500,
      status: 'PENDENTE',
      dueDate: new Date().toISOString(),
      issueDate: new Date().toISOString()
    }
  ];

  return (
    <StandardLayout>
      <div className="w-full max-w-[1750px] mx-auto space-y-6 px-1 sm:px-2">
        {/* Cabeçalho Executivo do Módulo Financeiro */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-red-600/20 via-red-500/15 to-amber-500/20 border border-red-500/30 rounded-xl text-red-400 shadow-inner">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Gestão Financeira & Controladoria
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Painel integrado de fluxo de caixa, pagamentos, cotações homologadas, faturamento e medições
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Modernas & Responsivas com Efeito Segmented Dock */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <div className="relative group">
            {/* Botão Scroll Esquerda */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-zinc-900/90 border border-gray-700 text-gray-200 hover:text-white hover:bg-zinc-800 shadow-xl flex items-center justify-center transition-all backdrop-blur-sm"
                title="Rolar abas para esquerda"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            {/* Container das Abas com Efeito Vidro Escuro */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollability}
              className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-1.5 bg-[#0b0c10]/95 backdrop-blur-md border border-gray-800/80 rounded-2xl shadow-2xl"
            >
              <TabsList className="bg-transparent h-auto p-0 flex items-center gap-1.5 w-max min-w-full">
                {TABS_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 select-none whitespace-nowrap border border-transparent ${
                        isActive
                          ? `${tab.activeColor} text-white shadow-lg border`
                          : 'text-gray-400 hover:text-gray-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 transition-transform ${isActive ? 'scale-110 text-white' : tab.iconColor}`} />
                      <span>{tab.label}</span>

                      {tab.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isActive
                            ? 'bg-black/30 text-white border border-white/20'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Botão Scroll Direita */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-zinc-900/90 border border-gray-700 text-gray-200 hover:text-white hover:bg-zinc-800 shadow-xl flex items-center justify-center transition-all backdrop-blur-sm"
                title="Rolar abas para direita"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Conteúdo das Abas */}
          <TabsContent value="dashboard" className="mt-6 focus-visible:outline-none">
            <FinanceiroDashboard
              transactions={mockTransactions}
              invoices={mockInvoices}
              refreshData={() => {
                toast({
                  title: 'Atualizado',
                  description: 'Dashboard atualizado com sucesso',
                });
              }}
            />
          </TabsContent>

          <TabsContent value="ordens-compra" className="mt-6 focus-visible:outline-none">
            <PurchaseOrdersFinancialManager />
          </TabsContent>

          <TabsContent value="contas-pagar" className="mt-6 focus-visible:outline-none">
            <ContasAPagarTab />
          </TabsContent>

          <TabsContent value="contas-receber" className="mt-6 focus-visible:outline-none">
            <ContasAReceberTab />
          </TabsContent>

          <TabsContent value="fluxo-caixa" className="mt-6 focus-visible:outline-none">
            <FluxoCaixaTab />
          </TabsContent>

          <TabsContent value="pagamentos" className="mt-6 focus-visible:outline-none">
            <PagamentosTab />
          </TabsContent>

          <TabsContent value="relatorios-financeiros" className="mt-6 focus-visible:outline-none">
            <RelatoriosTab />
          </TabsContent>

          <TabsContent value="centro-custos" className="mt-6 focus-visible:outline-none">
            <CentroCustosTab />
          </TabsContent>

          <TabsContent value="faturas" className="mt-6 focus-visible:outline-none">
            <FaturasTab />
          </TabsContent>

          <TabsContent value="medicoes" className="mt-6 focus-visible:outline-none">
            <MedicoesTab />
          </TabsContent>
        </Tabs>
      </div>
    </StandardLayout>
  );
};

export default Financeiro;