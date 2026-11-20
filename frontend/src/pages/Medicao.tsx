import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Users,
  Building2,
  PieChart,
  Activity,
  RefreshCw,
  Plus,
  Database,
  BarChart,
  LineChart,
  Search,
  X,
  ArrowUpRight,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line
} from 'recharts';
import MeasurementCompleteTable from '@/components/financeiro/MeasurementCompleteTable';
import MeasurementSimpleTable from '@/components/financeiro/MeasurementSimpleTable';
import { MeasurementBulletinModal } from '@/components/financeiro/MeasurementBulletinModal';
import { SimplifiedMeasurementModal } from '@/components/financeiro/SimplifiedMeasurementModal';
import { MeasurementValidationModal } from '@/components/financeiro/MeasurementValidationModal';
import { MeasurementDeleteDialog } from '@/components/financeiro/MeasurementDeleteDialog';
import { MeasurementViewModal } from '@/components/financeiro/MeasurementViewModal';
import { MeasurementWizardModal } from '@/components/financeiro/MeasurementWizardModal';
import { MeasurementVersionDrawer } from '@/components/financeiro/MeasurementVersionDrawer';
import { ParteDiariaModal } from '@/components/financeiro/ParteDiariaModal';
import { ParteDiariaFinanceiroTab } from '@/components/financeiro/ParteDiariaFinanceiroTab';
import ClientContractMeasurementManager from '@/components/financeiro/ClientContractMeasurementManager';
import { useToast } from '@/hooks/use-toast';
import { measurementService } from '@/services/measurementService';
import { MeasurementBulletin, MeasurementStatus } from '@/types/measurement';

const Medicao: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showParteDiariaModal, setShowParteDiariaModal] = useState(false);
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showSimplifiedModal, setShowSimplifiedModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState<MeasurementBulletin | null>(null);
  const [editingBulletin, setEditingBulletin] = useState<MeasurementBulletin | null>(null);
  const [editingSimplifiedBulletin, setEditingSimplifiedBulletin] = useState<MeasurementBulletin | null>(null);
  const [bulletinToDelete, setBulletinToDelete] = useState<MeasurementBulletin | null>(null);
  const [loading, setLoading] = useState(false);
  const [allMeasurements, setAllMeasurements] = useState<any[]>([]);
  const [measurementSearchTerm, setMeasurementSearchTerm] = useState('');
  const [measurementStatusFilter, setMeasurementStatusFilter] = useState('ALL');
  const [dashboardData, setDashboardData] = useState({
    totalBulletins: 0,
    completeBulletins: 0,
    simplifiedBulletins: 0,
    pendingBulletins: 0,
    validatedBulletins: 0,
    totalValue: 0,
    monthlyData: [] as any[],
    statusDistribution: {} as Record<MeasurementStatus, number>,
    hasData: false
  });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const { toast } = useToast();

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const apiBulletins = await measurementService.getBulletins().catch(() => []);
      let localMeasurements: any[] = [];
      try {
        const raw = localStorage.getItem('fluxbus_generated_measurements_v1');
        if (raw) {
          localMeasurements = JSON.parse(raw);
        }
      } catch {
        localMeasurements = [];
      }

      const apiList = Array.isArray(apiBulletins) ? apiBulletins : [];
      const apiIds = new Set(apiList.map((b: any) => String(b.id)));
      const mergedLocalAsBulletins = (Array.isArray(localMeasurements) ? localMeasurements : [])
        .filter((lm: any) => !apiIds.has(String(lm.id)))
        .map((lm: any) => ({
          id: lm.id,
          measurementNumber: lm.measurementNumber,
          companyName: lm.clientName,
          clientName: lm.clientName,
          cnpj: lm.cnpj,
          contractNumber: lm.contractNumber,
          obraName: lm.obraName,
          periodStart: lm.periodStart,
          periodEnd: lm.periodEnd,
          status: lm.status || 'IN_PROGRESS',
          totalAmount: Number(lm.totals?.grandTotal || lm.invoice?.netValue || 0),
          notes: 'Medição completa por contrato',
          items: [
            {
              quantity: 1,
              unitPrice: Number(lm.totals?.grandTotal || lm.invoice?.netValue || 0)
            }
          ]
        }));

      const bulletins = [
        ...apiList.map((b: any) => ({
          ...b,
          totalAmount: b.totalAmount ?? b.items?.reduce((s: number, it: any) => s + (Number(it.quantity || 1) * Number(it.unitPrice || it.totalPrice || 0)), 0)
        })),
        ...mergedLocalAsBulletins
      ];

      setAllMeasurements(bulletins);

      // Calcular estatísticas com melhor diferenciação
      const totalBulletins = bulletins.length;

      // Diferenciação mais precisa entre tipos de medição
      const completeBulletins = bulletins.filter(b => {
        const hasMultipleItems = b.items && b.items.length > 1;
        const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada') || b.notes?.toLowerCase().includes('contrato');
        const hasHighValue = b.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || item.totalPrice || 0)), 0) > 10000;
        return hasMultipleItems || hasCompleteNote || hasHighValue;
      }).length;

      const simplifiedBulletins = Math.max(0, totalBulletins - completeBulletins);

      const pendingBulletins = bulletins.filter((b: any) =>
        b.status === 'PENDING' || b.status === 'IN_PROGRESS' || b.status === 'OPEN'
      ).length;
      const validatedBulletins = bulletins.filter((b: any) =>
        b.status === 'VALIDATED' || b.status === 'REVISADA' || b.status === 'LIBERADA'
      ).length;

      const totalValue = bulletins.reduce((sum: number, b: any) => {
        const itemsValue = b.items?.reduce((itemSum: number, item: any) => itemSum + (Number(item.quantity || 1) * Number(item.unitPrice || item.totalPrice || 0)), 0) || 0;
        return sum + itemsValue;
      }, 0);

      // Distribuição por status
      const statusDistribution = bulletins.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<MeasurementStatus, number>);

      // Dados mensais (últimos 6 meses) com separação por tipo
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        const monthBulletins = bulletins.filter(b => {
          const bulletinDate = new Date(b.periodStart);
          return bulletinDate.getMonth() === date.getMonth() && 
                 bulletinDate.getFullYear() === date.getFullYear();
        });
        
        const monthComplete = monthBulletins.filter(b => {
          const hasMultipleItems = b.items && b.items.length > 1;
          const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada');
          const hasHighValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) > 10000;
          return hasMultipleItems || hasCompleteNote || hasHighValue;
        }).length;
        
        const monthSimplified = monthBulletins.filter(b => {
          const hasSingleItem = b.items && b.items.length === 1;
          const hasSimplifiedNote = b.notes?.toLowerCase().includes('simplificada') || b.notes?.toLowerCase().includes('rápida');
          const hasLowValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) <= 10000;
          return hasSingleItem || hasSimplifiedNote || hasLowValue;
        }).length;
        
        monthlyData.push({
          month,
          total: monthBulletins.length,
          complete: monthComplete,
          simplified: monthSimplified,
          totalValue: monthBulletins.reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0),
          completeValue: monthBulletins.filter(b => {
            const hasMultipleItems = b.items && b.items.length > 1;
            const hasCompleteNote = b.notes?.toLowerCase().includes('completa') || b.notes?.toLowerCase().includes('detalhada');
            const hasHighValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) > 10000;
            return hasMultipleItems || hasCompleteNote || hasHighValue;
          }).reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0),
          simplifiedValue: monthBulletins.filter(b => {
            const hasSingleItem = b.items && b.items.length === 1;
            const hasSimplifiedNote = b.notes?.toLowerCase().includes('simplificada') || b.notes?.toLowerCase().includes('rápida');
            const hasLowValue = b.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) <= 10000;
            return hasSingleItem || hasSimplifiedNote || hasLowValue;
          }).reduce((sum, b) => {
            const itemsValue = b.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0;
            return sum + itemsValue;
          }, 0)
        });
      }

      setDashboardData({
        totalBulletins: Number(totalBulletins) || 0,
        completeBulletins: Number(completeBulletins) || 0,
        simplifiedBulletins: Number(simplifiedBulletins) || 0,
        pendingBulletins: Number(pendingBulletins) || 0,
        validatedBulletins: Number(validatedBulletins) || 0,
        totalValue: Number(totalValue) || 0,
        monthlyData: monthlyData || [],
        statusDistribution: statusDistribution || {},
        hasData: totalBulletins > 0
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard',
        variant: 'destructive'
      });
      
      // Garantir que o estado seja sempre válido mesmo em caso de erro
      setDashboardData({
        totalBulletins: 0,
        completeBulletins: 0,
        simplifiedBulletins: 0,
        pendingBulletins: 0,
        validatedBulletins: 0,
        totalValue: 0,
        monthlyData: [],
        statusDistribution: {},
        hasData: false
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleRefresh = () => {
      loadDashboardData();
    };
    window.addEventListener('fluxbus:measurement-generated', handleRefresh);
    window.addEventListener('fluxbus:measurements-updated', handleRefresh);
    return () => {
      window.removeEventListener('fluxbus:measurement-generated', handleRefresh);
      window.removeEventListener('fluxbus:measurements-updated', handleRefresh);
    };
  }, []);

  const formatMeasurementStatusBadge = (status: string) => {
    const st = String(status || '').toUpperCase();
    if (st === 'LIBERADA' || st === 'FATURADA' || st === 'APPROVED' || st === 'PAGA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          {st === 'FATURADA' ? 'Faturada' : 'Liberada'}
        </span>
      );
    }
    if (st === 'REVISADA' || st === 'VALIDATED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/40">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
          Revisada
        </span>
      );
    }
    if (st === 'CANCELLED' || st === 'CANCELADA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40">
          <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          Cancelada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        Em Andamento
      </span>
    );
  };

  const filteredMeasurements = useMemo(() => {
    const term = measurementSearchTerm.trim().toLowerCase();
    return allMeasurements.filter((m) => {
      if (term) {
        const num = String(m.measurementNumber || m.id || '').toLowerCase();
        const client = String(m.companyName || m.clientName || '').toLowerCase();
        const contract = String(m.contractNumber || '').toLowerCase();
        const cnpj = String(m.cnpj || '').toLowerCase();
        const match = num.includes(term) || client.includes(term) || contract.includes(term) || cnpj.includes(term);
        if (!match) return false;
      }

      if (measurementStatusFilter !== 'ALL') {
        const st = String(m.status || '').toUpperCase();
        if (measurementStatusFilter === 'LIBERADA' && st !== 'LIBERADA' && st !== 'FATURADA' && st !== 'APPROVED' && st !== 'PAGA') return false;
        if (measurementStatusFilter === 'REVISADA' && st !== 'REVISADA' && st !== 'VALIDATED') return false;
        if (measurementStatusFilter === 'PENDENTE' && st !== 'IN_PROGRESS' && st !== 'PENDING' && st !== 'OPEN' && st !== 'DRAFT') return false;
        if (measurementStatusFilter === 'CANCELADA' && st !== 'CANCELADA' && st !== 'CANCELLED') return false;
      }

      return true;
    });
  }, [allMeasurements, measurementSearchTerm, measurementStatusFilter]);

  // Handlers para as ações da tabela
  const handleViewBulletin = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowViewModal(true);
  };

  const handleEditBulletin = (bulletin: MeasurementBulletin) => {
    setEditingBulletin(bulletin);
    setShowBulletinModal(true);
  };

  const handleEditSimplifiedBulletin = (bulletin: MeasurementBulletin) => {
    setEditingSimplifiedBulletin(bulletin);
    setShowSimplifiedModal(true);
  };

  const handleDeleteBulletin = (bulletin: MeasurementBulletin) => {
    setBulletinToDelete(bulletin);
    setShowDeleteDialog(true);
  };

  const handleCreateBulletin = () => {
    setEditingBulletin(null);
    setShowBulletinModal(true);
  };

  const handleCreateSimplifiedBulletin = () => {
    setEditingSimplifiedBulletin(null);
    setShowSimplifiedModal(true);
  };

  const handleValidateBulletin = (bulletin: MeasurementBulletin) => {
    setSelectedBulletin(bulletin);
    setShowValidationModal(true);
  };

  const handleCloseModals = () => {
    setShowBulletinModal(false);
    setShowSimplifiedModal(false);
    setShowValidationModal(false);
    setShowViewModal(false);
    setShowDeleteDialog(false);
    setSelectedBulletin(null);
    setEditingBulletin(null);
    setEditingSimplifiedBulletin(null);
    setBulletinToDelete(null);
  };

  return (
    <StandardLayout>
      <div className="space-y-6">
        {/* Cabeçalho Principal com Ações */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-seguranca-black/90 via-seguranca-graphite/80 to-seguranca-black/90 p-6 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold px-2 py-0.5">
                PRD 1.0 — Gestão Financeira
              </Badge>
              <span className="text-xs text-gray-400">Processo Automatizado & Auditável</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-seguranca-yellow" />
              Medições Financeiras
            </h1>
            <p className="text-sm text-seguranca-lightgray mt-1">
              Geração de medições por contrato, apontamentos de frota, cortes por manutenção, excedentes e conciliação NFE/CTE
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowVersionDrawer(true)}
              className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black hover:text-white"
            >
              <Clock className="h-4 w-4 mr-2 text-seguranca-yellow" />
              Histórico & Versões
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowWizardModal(true)}
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Gerar Medição
            </Button>

            <Button
              onClick={() => setShowParteDiariaModal(true)}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-seguranca-black font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 px-5 py-2.5 text-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Lançar Parte Diária
            </Button>
          </div>
        </div>

        {/* KPI Cards de Resumo Executivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-amber-950/30 via-seguranca-black to-seguranca-graphite/40 border-amber-500/30 shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">Total Medido no Mês</p>
                  <p className="text-2xl font-extrabold text-white mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dashboardData.totalValue || 0)}
                  </p>
                  <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                    <TrendingUp size={12} /> +18.8% vs Mês Anterior
                  </span>
                </div>
                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                  <DollarSign className="h-6 w-6 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-950/30 via-seguranca-black to-seguranca-graphite/40 border-blue-500/30 shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-300 font-bold uppercase tracking-wider">Medições Cadastradas</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{dashboardData.totalBulletins}</p>
                  <span className="text-[11px] text-blue-300 font-medium flex items-center gap-1 mt-1">
                    <FileText size={12} /> {dashboardData.completeBulletins} Completas / {dashboardData.simplifiedBulletins} Simplificadas
                  </span>
                </div>
                <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-950/30 via-seguranca-black to-seguranca-graphite/40 border-purple-500/30 shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300 font-bold uppercase tracking-wider">Em Aprovação / Prévia</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{dashboardData.pendingBulletins}</p>
                  <span className="text-[11px] text-purple-300 font-medium flex items-center gap-1 mt-1">
                    <Clock size={12} /> Aguardando Validação
                  </span>
                </div>
                <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl">
                  <Clock className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-950/30 via-seguranca-black to-seguranca-graphite/40 border-emerald-500/30 shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider">Medições Aprovadas</p>
                  <p className="text-2xl font-extrabold text-white mt-1">{dashboardData.validatedBulletins}</p>
                  <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1 mt-1">
                    <CheckCircle size={12} /> Prontas p/ Faturamento
                  </span>
                </div>
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-seguranca-black/90 border border-gray-700/80 p-1.5 rounded-xl flex flex-wrap gap-1">
            <TabsTrigger value="dashboard" className="data-[state='active']:bg-amber-500 data-[state='active']:text-seguranca-black text-xs font-extrabold px-4 py-2 rounded-lg transition-all shadow-md">
              📊 Dashboard Geral
            </TabsTrigger>
            <TabsTrigger value="contrato-cliente" className="data-[state='active']:bg-emerald-500 data-[state='active']:text-black text-xs font-black px-4 py-2 rounded-lg transition-all">
              🏢 Medição por Contrato de Cliente & NF
            </TabsTrigger>
            <TabsTrigger value="parte-diaria" className="data-[state='active']:bg-amber-500 data-[state='active']:text-seguranca-black text-xs font-extrabold px-4 py-2 rounded-lg transition-all">
              📋 Parte Diária Operacional
            </TabsTrigger>
            <TabsTrigger value="completa" className="data-[state='active']:bg-amber-500 data-[state='active']:text-seguranca-black text-xs font-extrabold px-4 py-2 rounded-lg transition-all">
              📑 Medições Completas (GLOBAL)
            </TabsTrigger>
            <TabsTrigger value="simplificada" className="data-[state='active']:bg-amber-500 data-[state='active']:text-seguranca-black text-xs font-extrabold px-4 py-2 rounded-lg transition-all">
              ⚡ Medições Simplificadas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="space-y-6">
              {/* Estado Vazio Interativo e Fluido */}
              {!dashboardLoading && !dashboardData.hasData && (
                <div className="relative group p-8 md:p-12 text-center rounded-2xl bg-gradient-to-b from-seguranca-black/90 to-seguranca-graphite/60 border border-white/10 shadow-2xl backdrop-blur-xl">
                  <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border border-amber-500/30 flex items-center justify-center shadow-xl shadow-amber-500/10 mb-6 group-hover:scale-105 transition-transform duration-300">
                    <BarChart3 className="h-10 w-10 text-seguranca-yellow animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Módulo de Medições Financeiras (PRD 1.0)
                  </h3>
                  <p className="text-sm text-gray-300 max-w-xl mx-auto mb-8 leading-relaxed">
                    Gere medições de transporte automaticamente a partir dos contratos cadastrados, apontamento de frota, apuração de cortes por manutenção, excedentes de KM/diárias e conciliação NFE/CTE.
                  </p>

                  {/* Modelos de Medição Rápidos */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8 text-left">
                    <div onClick={() => setShowParteDiariaModal(true)} className="cursor-pointer p-4 rounded-xl bg-seguranca-black/80 border border-gray-700/80 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">Modelo Padronizado</span>
                      <h4 className="text-sm font-semibold text-white">Parte Diária Operacional</h4>
                      <p className="text-xs text-gray-400 mt-1">Lançamento universal de veículos, horários, atividades e hodômetro.</p>
                    </div>

                    <div onClick={() => setShowWizardModal(true)} className="cursor-pointer p-4 rounded-xl bg-seguranca-black/80 border border-gray-700/80 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Apuração Mensal</span>
                      <h4 className="text-sm font-semibold text-white">Consolidação de Medição</h4>
                      <p className="text-xs text-gray-400 mt-1">Frota agregada + apuração de cortes, diárias e excedentes de KM.</p>
                    </div>

                    <div onClick={() => setShowWizardModal(true)} className="cursor-pointer p-4 rounded-xl bg-seguranca-black/80 border border-gray-700/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Conciliação Fiscal</span>
                      <h4 className="text-sm font-semibold text-white">Vínculo NFE & CTE</h4>
                      <p className="text-xs text-gray-400 mt-1">Vinculação direta de chave de acesso sem duplicar faturamento.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 justify-center">
                    <Button onClick={() => setShowParteDiariaModal(true)} className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-seguranca-black font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20 px-6 py-2.5 text-sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Lançar Parte Diária
                    </Button>
                    <Button onClick={() => setActiveTab('contrato-cliente')} className="bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold px-6 py-2.5 text-sm">
                      🏢 Medição por Contrato
                    </Button>
                  </div>
                </div>
              )}

              {/* Dashboard com Dados */}
              {dashboardData.hasData && (
                <>
                  {/* Cards de Estatísticas Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total de Boletins */}
                    <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-300 font-medium">Total de Boletins</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.totalBulletins}</p>
                            <p className="text-xs text-blue-200">Todos os tipos</p>
                          </div>
                          <div className="p-3 bg-blue-500/20 rounded-full">
                            <FileText className="h-6 w-6 text-blue-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medições Completas */}
                    <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-300 font-medium">Medições Completas</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.completeBulletins}</p>
                            <p className="text-xs text-green-200">Detalhadas</p>
                          </div>
                          <div className="p-3 bg-green-500/20 rounded-full">
                            <BarChart3 className="h-6 w-6 text-green-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Medições Simplificadas */}
                    <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-purple-300 font-medium">Medições Simplificadas</p>
                            <p className="text-3xl font-bold text-white">{dashboardData.simplifiedBulletins}</p>
                            <p className="text-xs text-purple-200">Rápidas</p>
                          </div>
                          <div className="p-3 bg-purple-500/20 rounded-full">
                            <Clock className="h-6 w-6 text-purple-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Valor Total */}
                    <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-300 font-medium">Valor Total</p>
                            <p className="text-3xl font-bold text-white">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(dashboardData.totalValue)}
                            </p>
                            <p className="text-xs text-yellow-200">Acumulado</p>
                          </div>
                          <div className="p-3 bg-yellow-500/20 rounded-full">
                            <DollarSign className="h-6 w-6 text-yellow-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Comparação por Tipo */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-seguranca-yellow" />
                        Comparação: Completas vs Simplificadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsBarChart data={[
                            { 
                              name: 'Completas', 
                              value: Number(dashboardData.completeBulletins) || 0,
                              color: '#10b981'
                            },
                            { 
                              name: 'Simplificadas', 
                              value: Number(dashboardData.simplifiedBulletins) || 0,
                              color: '#8b5cf6'
                            }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </RechartsBarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Tendência Mensal */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-seguranca-yellow" />
                        Tendência Mensal (Últimos 6 Meses)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={dashboardData.monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="complete" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              name="Completas"
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="simplified" 
                              stroke="#8b5cf6" 
                              strokeWidth={3}
                              name="Simplificadas"
                              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cards de Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pendentes */}
                    <Card className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-orange-300 font-medium">Pendentes</p>
                            <p className="text-2xl font-bold text-white">{dashboardData.pendingBulletins}</p>
                            <p className="text-xs text-orange-200">Aguardando validação</p>
                          </div>
                          <div className="p-3 bg-orange-500/20 rounded-full">
                            <AlertCircle className="h-6 w-6 text-orange-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Validados */}
                    <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 border-emerald-500/30">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-emerald-300 font-medium">Validados</p>
                            <p className="text-2xl font-bold text-white">{dashboardData.validatedBulletins}</p>
                            <p className="text-xs text-emerald-200">Aprovados</p>
                          </div>
                          <div className="p-3 bg-emerald-500/20 rounded-full">
                            <CheckCircle className="h-6 w-6 text-emerald-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ações Rápidas */}
                    <Card className="bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 border-indigo-500/30">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <p className="text-sm text-indigo-300 font-medium">Ações Rápidas</p>
                          <div className="flex gap-2">
                            <Button
                              onClick={handleCreateBulletin}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Completa
                            </Button>
                            <Button
                              onClick={handleCreateSimplifiedBulletin}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Simplificada
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Gráfico de Pizza - Distribuição por Status */}
                  <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-seguranca-yellow" />
                        Distribuição por Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={Object.entries(dashboardData.statusDistribution).map(([status, count]) => ({
                                name: status === 'DRAFT' ? 'Rascunho' :
                                      status === 'PENDING' ? 'Pendente' :
                                      status === 'VALIDATED' ? 'Validado' : 'Cancelado',
                                value: count,
                                color: status === 'DRAFT' ? '#6b7280' :
                                       status === 'PENDING' ? '#f59e0b' :
                                       status === 'VALIDATED' ? '#10b981' : '#ef4444'
                              }))}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {Object.entries(dashboardData.statusDistribution).map(([status, count], index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={status === 'DRAFT' ? '#6b7280' :
                                        status === 'PENDING' ? '#f59e0b' :
                                        status === 'VALIDATED' ? '#10b981' : '#ef4444'} 
                                />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#ffffff'
                              }} 
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Seção Principal: Lista de Todas as Medições Geradas & Status */}
              <Card className="bg-gradient-to-b from-seguranca-black/95 to-seguranca-graphite/90 border border-gray-700/80 shadow-2xl rounded-2xl overflow-hidden">
                <CardHeader className="p-5 border-b border-gray-800 bg-seguranca-black/40">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-amber-400" />
                        <CardTitle className="text-lg font-extrabold text-white">
                          Todas as Medições Geradas & Status
                        </CardTitle>
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-bold px-2 py-0.5">
                          {filteredMeasurements.length} {filteredMeasurements.length === 1 ? 'medição' : 'medições'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Acompanhamento consolidado de boletins de medição gerados no sistema, contratos e status de liberação/faturamento
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={loadDashboardData}
                        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Atualizar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('contrato-cliente')}
                        className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs hover:brightness-110 shadow-md shadow-amber-500/20"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Nova Medição
                      </Button>
                    </div>
                  </div>

                  {/* Barra de Filtros e Pesquisa */}
                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por número da medição, cliente, contrato ou CNPJ..."
                        value={measurementSearchTerm}
                        onChange={(e) => setMeasurementSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-black/60 border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      {measurementSearchTerm && (
                        <button
                          onClick={() => setMeasurementSearchTerm('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'ALL', label: 'Todas' },
                        { id: 'LIBERADA', label: 'Liberadas' },
                        { id: 'REVISADA', label: 'Revisadas' },
                        { id: 'PENDENTE', label: 'Em Andamento' },
                        { id: 'CANCELADA', label: 'Canceladas' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setMeasurementStatusFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            measurementStatusFilter === tab.id
                              ? 'bg-amber-500 text-black font-bold shadow-sm'
                              : 'bg-black/40 text-gray-400 hover:text-white hover:bg-black/70 border border-gray-800'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {filteredMeasurements.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Nenhuma medição encontrada</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {measurementSearchTerm || measurementStatusFilter !== 'ALL'
                          ? 'Tente ajustar os filtros ou o termo de pesquisa.'
                          : 'Clique em "Nova Medição" para gerar sua primeira apuração contratual.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-800 bg-seguranca-black/60 text-gray-400 uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4 font-bold">Nº Medição / BM</th>
                            <th className="py-3 px-4 font-bold">Cliente / CNPJ</th>
                            <th className="py-3 px-4 font-bold">Contrato / Obra</th>
                            <th className="py-3 px-4 font-bold">Período de Apuração</th>
                            <th className="py-3 px-4 font-bold text-right">Valor Total (R$)</th>
                            <th className="py-3 px-4 font-bold text-center">Status</th>
                            <th className="py-3 px-4 font-bold text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                          {filteredMeasurements.map((m: any, idx: number) => {
                            const numMedicao = m.measurementNumber || (m.id ? `BM-${String(m.id).slice(0, 8)}` : `#${String(idx + 1).padStart(3, '0')}`);
                            const cliente = m.clientName || m.companyName || 'Cliente não identificado';
                            const valor = Number(m.totalAmount || m.totalValue || (m.items?.reduce((s: number, it: any) => s + (Number(it.quantity || 1) * Number(it.unitPrice || 0)), 0)) || 0);
                            
                            return (
                              <tr
                                key={m.id || idx}
                                className="hover:bg-amber-500/5 transition-colors group cursor-pointer"
                                onClick={() => setActiveTab('contrato-cliente')}
                              >
                                <td className="py-3.5 px-4 font-extrabold text-amber-400 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono">
                                      {numMedicao}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                                    {cliente}
                                  </div>
                                  {m.cnpj && (
                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      CNPJ: {m.cnpj}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-gray-300">
                                  <div className="font-medium text-gray-200">
                                    {m.contractNumber || 'Contrato Padrão'}
                                  </div>
                                  {m.obraName && (
                                    <div className="text-[10px] text-gray-400 mt-0.5">
                                      {m.obraName}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-gray-300 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 text-gray-300">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                    <span>
                                      {m.periodStart ? new Date(m.periodStart).toLocaleDateString('pt-BR') : 'Início N/D'}
                                      {' a '}
                                      {m.periodEnd ? new Date(m.periodEnd).toLocaleDateString('pt-BR') : 'Fim N/D'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-bold text-white text-right whitespace-nowrap font-mono">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                  {formatMeasurementStatusBadge(m.status)}
                                </td>
                                <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setActiveTab('contrato-cliente')}
                                    className="h-7 px-2.5 text-xs text-amber-400 hover:text-black hover:bg-amber-400 font-bold rounded-lg border border-amber-500/30 transition-all inline-flex items-center gap-1"
                                  >
                                    Ver Detalhes
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contrato-cliente">
            <ClientContractMeasurementManager />
          </TabsContent>

          <TabsContent value="completa">
            <MeasurementCompleteTable
              onView={handleViewBulletin}
              onEdit={handleEditBulletin}
              onDelete={handleDeleteBulletin}
              onCreate={handleCreateBulletin}
              onValidate={handleValidateBulletin}
            />
          </TabsContent>

          <TabsContent value="simplificada">
            <MeasurementSimpleTable
              onView={handleViewBulletin}
              onEdit={handleEditSimplifiedBulletin}
              onDelete={handleDeleteBulletin}
              onCreate={handleCreateSimplifiedBulletin}
              onValidate={handleValidateBulletin}
            />
          </TabsContent>

          <TabsContent value="parte-diaria">
            <ParteDiariaFinanceiroTab
              onOpenParteDiariaModal={() => setShowParteDiariaModal(true)}
              onOpenBulletinModal={handleCreateBulletin}
            />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        {showBulletinModal && (
          <MeasurementBulletinModal
            open={showBulletinModal}
            onOpenChange={setShowBulletinModal}
            bulletin={editingBulletin}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showSimplifiedModal && (
          <SimplifiedMeasurementModal
            open={showSimplifiedModal}
            onOpenChange={setShowSimplifiedModal}
            bulletin={editingSimplifiedBulletin}
            onSuccess={() => {
              handleCloseModals();
              setEditingSimplifiedBulletin(null);
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showValidationModal && selectedBulletin && (
          <MeasurementValidationModal
            open={showValidationModal}
            onOpenChange={setShowValidationModal}
            bulletin={selectedBulletin}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {showViewModal && selectedBulletin && (
          <MeasurementViewModal
            open={showViewModal}
            onOpenChange={setShowViewModal}
            bulletin={selectedBulletin}
          />
        )}

        {showDeleteDialog && bulletinToDelete && (
          <MeasurementDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            bulletin={bulletinToDelete}
            onSuccess={() => {
              handleCloseModals();
              // Aqui você pode adicionar lógica para recarregar as tabelas
            }}
          />
        )}

        {/* Modais do PRD 1.0 e 1.1 */}
        <ParteDiariaModal
          isOpen={showParteDiariaModal}
          onClose={() => setShowParteDiariaModal(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        <MeasurementWizardModal
          isOpen={showWizardModal}
          onClose={() => setShowWizardModal(false)}
          onSuccess={() => {
            loadDashboardData();
          }}
        />

        <MeasurementVersionDrawer
          isOpen={showVersionDrawer}
          onClose={() => setShowVersionDrawer(false)}
          bulletinId={selectedBulletin?.id || null}
        />
      </div>
    </StandardLayout>
  );
};

export default Medicao;
