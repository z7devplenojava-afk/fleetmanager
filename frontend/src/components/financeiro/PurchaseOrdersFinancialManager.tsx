import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  FileText,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  QrCode,
  ArrowUpDown,
  FileCheck2,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Download,
  BarChart3,
  PieChart as PieIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Package,
  FileSpreadsheet,
  X,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  procurementService,
  ProcurementPurchaseOrder
} from '@/services/procurementService';
import { FinancialPaymentProgrammingModal } from '@/components/financeiro/FinancialPaymentProgrammingModal';
import { PurchaseOrderDetailsModal } from '@/components/financeiro/PurchaseOrderDetailsModal';
import { exportToCSV } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseOrdersFinancialManagerProps {
  embeddedInFinanceiro?: boolean;
}

// Cores temáticas para gráficos e categorias
const THEME_COLORS = {
  CREDIT_CARD: '#3b82f6',    // Azul Royal
  DEBIT_CARD: '#06b6d4',     // Ciano
  PIX: '#10b981',            // Esmeralda
  BOLETO: '#f59e0b',         // Âmbar
  TRANSFER: '#6366f1',       // Índigo
  PENDING: '#f43f5e',        // Rosa/Vermelho alerta
  OTHER: '#8b5cf6',          // Roxo suave
  APPROVED: '#3b82f6',
  IN_TRANSIT: '#a855f7',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444'
};

// Dados demonstrativos elegantes caso o banco não possua ordens de compra ainda
const DEMO_PURCHASE_ORDERS: ProcurementPurchaseOrder[] = [
  {
    id: 'demo-1',
    companyId: 'demo',
    ocNumber: 'OC-2026-000104',
    requisitionId: 'req-1',
    requisitionNumber: 'REQ-2026-000088',
    workOrderNumber: 'OS-2026-000104',
    vehiclePlate: 'BRA-2E19',
    supplierName: 'Distribuidora Scania Diesel Peças Ltda',
    supplierCnpj: '12.345.678/0001-90',
    supplierContact: 'Carlos Mendes',
    supplierPhone: '(11) 98765-4321',
    itemName: 'Pastilha de Freio Dianteira Cerâmica',
    itemCode: 'BRK-5520',
    quantity: 4,
    unitPrice: 385.00,
    totalAmount: 1540.00,
    paymentTerms: 'CARTÃO 3X',
    urgency: 'ALTA',
    justification: 'Veículo em manutenção preventiva urgente',
    status: 'FINANCIAL_APPROVED',
    statusDescription: 'Programado no Cartão',
    paymentMethod: 'CARTAO_CREDITO',
    installmentsCount: 3,
    cardNumber: 'Mastercard Final 4821',
    cardFlag: 'MASTERCARD',
    paymentScheduledDate: '2026-09-25T10:00:00Z',
    paymentStatus: 'PROGRAMMED',
    createdAt: '2026-09-18T14:30:00Z',
    updatedAt: '2026-09-18T16:00:00Z'
  },
  {
    id: 'demo-2',
    companyId: 'demo',
    ocNumber: 'OC-2026-000105',
    requisitionId: 'req-2',
    requisitionNumber: 'REQ-2026-000092',
    workOrderNumber: 'OS-2026-000102',
    vehiclePlate: 'MER-8840',
    supplierName: 'Auto Peças & Filtros Brasil Sul',
    supplierCnpj: '98.765.432/0001-11',
    supplierContact: 'Fernanda Rocha',
    supplierPhone: '(41) 3322-1100',
    itemName: 'Kit Filtros Combustível e Óleo Lubrificante',
    itemCode: 'FLT-8890',
    quantity: 2,
    unitPrice: 420.00,
    totalAmount: 840.00,
    paymentTerms: 'À VISTA',
    urgency: 'MEDIA',
    justification: 'Troca periódica de filtros',
    status: 'FINANCIAL_APPROVED',
    statusDescription: 'PIX Programado',
    paymentMethod: 'PIX',
    paymentReference: '98.765.432/0001-11 (Chave CNPJ)',
    paymentScheduledDate: '2026-09-20T12:00:00Z',
    paymentStatus: 'PROGRAMMED',
    createdAt: '2026-09-19T09:15:00Z',
    updatedAt: '2026-09-19T10:30:00Z'
  },
  {
    id: 'demo-3',
    companyId: 'demo',
    ocNumber: 'OC-2026-000106',
    requisitionId: 'req-3',
    requisitionNumber: 'REQ-2026-000095',
    workOrderNumber: 'OS-2026-000108',
    vehiclePlate: 'VOL-4412',
    supplierName: 'Pneus Rodoviários Michelin & Cia',
    supplierCnpj: '45.123.789/0001-55',
    supplierContact: 'Marcos Vinicius',
    supplierPhone: '(19) 3456-7890',
    itemName: 'Pneu Radial Aro 22.5 295/80 Linha Pesada',
    itemCode: 'PNE-2295',
    quantity: 4,
    unitPrice: 2150.00,
    totalAmount: 8600.00,
    paymentTerms: 'BOLETO 30 DIAS',
    urgency: 'ALTA',
    justification: 'Pneus com desgaste crítico na tração',
    status: 'PURCHASED_IN_TRANSIT',
    statusDescription: 'Em Trânsito pelo Fornecedor',
    paymentMethod: 'BOLETO',
    paymentDueDate: '2026-10-18T00:00:00Z',
    paymentStatus: 'PROGRAMMED',
    createdAt: '2026-09-17T11:00:00Z',
    updatedAt: '2026-09-18T08:00:00Z'
  },
  {
    id: 'demo-4',
    companyId: 'demo',
    ocNumber: 'OC-2026-000107',
    requisitionId: 'req-4',
    requisitionNumber: 'REQ-2026-000099',
    workOrderNumber: 'OS-2026-000110',
    vehiclePlate: 'TRK-9090',
    supplierName: 'Turbinas & Injeção Eletrônica Diesel Tech',
    supplierCnpj: '33.221.100/0001-44',
    supplierContact: 'Roberto Lima',
    supplierPhone: '(31) 3211-9988',
    itemName: 'Turbocompressor Garret Bi-Turbo Completo',
    itemCode: 'TRB-4001',
    quantity: 1,
    unitPrice: 5400.00,
    totalAmount: 5400.00,
    paymentTerms: 'A DEFINIR',
    urgency: 'EMERGENCIA',
    justification: 'Falha grave no turbo com perda de potência',
    status: 'PENDING_FINANCIAL_APPROVAL',
    statusDescription: 'Aguardando Aprovação Financeira',
    createdAt: '2026-09-19T11:45:00Z',
    updatedAt: '2026-09-19T11:45:00Z'
  },
  {
    id: 'demo-5',
    companyId: 'demo',
    ocNumber: 'OC-2026-000108',
    requisitionId: 'req-5',
    requisitionNumber: 'REQ-2026-000101',
    workOrderNumber: 'OS-2026-000099',
    vehiclePlate: 'BUS-1020',
    supplierName: 'Distribuidora Scania Diesel Peças Ltda',
    supplierCnpj: '12.345.678/0001-90',
    supplierContact: 'Carlos Mendes',
    itemName: 'Válvula Reguladora de Pressão de Ar',
    itemCode: 'VLV-3301',
    quantity: 2,
    unitPrice: 620.00,
    totalAmount: 1240.00,
    paymentTerms: 'CARTÃO 2X',
    urgency: 'NORMAL',
    justification: 'Reposição de estoque preventivo',
    status: 'DELIVERED_IN_ALMOXARIFADO',
    statusDescription: 'Entregue com NF-e',
    paymentMethod: 'CARTAO_CREDITO',
    installmentsCount: 2,
    cardNumber: 'Visa Compras Final 9102',
    cardFlag: 'VISA',
    paymentStatus: 'PAID',
    invoiceNumber: 'NF-e 044.891',
    invoiceReceivedAt: '2026-09-16T15:00:00Z',
    createdAt: '2026-09-14T08:00:00Z',
    updatedAt: '2026-09-16T16:00:00Z'
  }
];

export const PurchaseOrdersFinancialManager: React.FC<PurchaseOrdersFinancialManagerProps> = ({
  embeddedInFinanceiro = true
}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<ProcurementPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [useDemoData, setUseDemoData] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [cardFilter, setCardFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<string>('ALL');

  // Ordenação
  const [sortField, setSortField] = useState<'createdAt' | 'totalAmount' | 'ocNumber' | 'supplierName'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Alternador de Visualização
  const [viewMode, setViewMode] = useState<'ALL' | 'CHARTS_ONLY' | 'TABLE_ONLY'>('ALL');

  // Modais
  const [selectedPO, setSelectedPO] = useState<ProcurementPurchaseOrder | null>(null);
  const [isProgrammingModalOpen, setIsProgrammingModalOpen] = useState(false);
  const [detailsPO, setDetailsPO] = useState<ProcurementPurchaseOrder | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { toast } = useToast();

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await procurementService.listPurchaseOrders();
      if (data && data.length > 0) {
        setPurchaseOrders(data);
        setUseDemoData(false);
      } else {
        setPurchaseOrders([]);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens de compra:', error);
      toast({
        title: 'Erro ao carregar Ordens de Compra',
        description: 'Não foi possível carregar as ordens reais do servidor.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Dados ativos (reais ou demonstrativos)
  const activeOrders = useMemo(() => {
    if (useDemoData) return DEMO_PURCHASE_ORDERS;
    return purchaseOrders;
  }, [purchaseOrders, useDemoData]);

  // Lista única de cartões
  const uniqueCardsList = useMemo(() => {
    const cards = new Set<string>();
    activeOrders.forEach(po => {
      if (po.cardNumber && po.cardNumber.trim()) {
        cards.add(po.cardNumber.trim());
      }
    });
    return Array.from(cards);
  }, [activeOrders]);

  // Aplicar Quick Filter
  const handleQuickFilterClick = (filterKey: string) => {
    setQuickFilter(filterKey);
    if (filterKey === 'ALL') {
      setStatusFilter('ALL');
      setPaymentMethodFilter('ALL');
      setCardFilter('ALL');
    } else if (filterKey === 'PENDING') {
      setStatusFilter('PENDING_FINANCIAL_APPROVAL');
      setPaymentMethodFilter('ALL');
    } else if (filterKey === 'CARD_CREDIT') {
      setPaymentMethodFilter('CARTAO_CREDITO');
      setStatusFilter('ALL');
    } else if (filterKey === 'CARD_DEBIT') {
      setPaymentMethodFilter('CARTAO_DEBITO');
      setStatusFilter('ALL');
    } else if (filterKey === 'PIX_BOLETO') {
      setPaymentMethodFilter('PIX_BOLETO');
      setStatusFilter('ALL');
    } else if (filterKey === 'IN_TRANSIT') {
      setStatusFilter('PURCHASED_IN_TRANSIT');
      setPaymentMethodFilter('ALL');
    } else if (filterKey === 'DELIVERED') {
      setStatusFilter('DELIVERED_IN_ALMOXARIFADO');
      setPaymentMethodFilter('ALL');
    }
  };

  // Filtragem e Ordenação
  const filteredOrders = useMemo(() => {
    const list = activeOrders.filter(po => {
      const matchesSearch =
        po.ocNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requisitionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesMethod = true;
      if (paymentMethodFilter === 'PIX_BOLETO') {
        matchesMethod = po.paymentMethod === 'PIX' || po.paymentMethod === 'BOLETO' || po.paymentMethod === 'TRANSFERENCIA';
      } else if (paymentMethodFilter !== 'ALL') {
        matchesMethod = po.paymentMethod === paymentMethodFilter;
      }

      const matchesCard = cardFilter === 'ALL' || (po.cardNumber && po.cardNumber.trim() === cardFilter);
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

      return matchesSearch && matchesMethod && matchesCard && matchesStatus;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortField === 'totalAmount') {
        comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else if (sortField === 'ocNumber') {
        comparison = (a.ocNumber || '').localeCompare(b.ocNumber || '');
      } else if (sortField === 'supplierName') {
        comparison = (a.supplierName || '').localeCompare(b.supplierName || '');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activeOrders, searchTerm, paymentMethodFilter, cardFilter, statusFilter, sortField, sortDirection]);

  // Estatísticas e Métricas Gerais
  const stats = useMemo(() => {
    const totalOrdersAmount = activeOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);
    const totalOrdersCount = activeOrders.length;
    const averageOrderValue = totalOrdersCount > 0 ? totalOrdersAmount / totalOrdersCount : 0;

    // Cartão de Crédito e Débito
    const cardOrders = activeOrders.filter(
      po => po.paymentMethod === 'CARTAO_CREDITO' || po.paymentMethod === 'CARTAO_DEBITO'
    );
    const totalCardAmount = cardOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);

    // PIX / Boleto / Transferência
    const otherOrders = activeOrders.filter(
      po => po.paymentMethod && po.paymentMethod !== 'CARTAO_CREDITO' && po.paymentMethod !== 'CARTAO_DEBITO'
    );
    const totalOtherAmount = otherOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);

    // Pendentes de Programação
    const pendingOrders = activeOrders.filter(
      po => po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
    );
    const pendingAmount = pendingOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);

    // Resumo por Cartão
    const cardSummary: Record<string, { count: number; total: number; flag?: string }> = {};
    cardOrders.forEach(po => {
      const cardKey = po.cardNumber || 'Cartão Não Identificado';
      if (!cardSummary[cardKey]) {
        cardSummary[cardKey] = { count: 0, total: 0, flag: po.cardFlag };
      }
      cardSummary[cardKey].count += 1;
      cardSummary[cardKey].total += (po.totalAmount || 0);
    });

    return {
      totalOrdersAmount,
      totalOrdersCount,
      averageOrderValue,
      totalCardAmount,
      cardOrdersCount: cardOrders.length,
      totalOtherAmount,
      otherOrdersCount: otherOrders.length,
      pendingOrdersCount: pendingOrders.length,
      pendingAmount,
      cardSummary
    };
  }, [activeOrders]);

  // Dados para Gráfico de Distribuição por Forma de Pagamento
  const chartPaymentMethodData = useMemo(() => {
    const summary: Record<string, { name: string; value: number; count: number; color: string }> = {
      CARTAO_CREDITO: { name: 'Cartão Crédito', value: 0, count: 0, color: THEME_COLORS.CREDIT_CARD },
      CARTAO_DEBITO: { name: 'Cartão Débito', value: 0, count: 0, color: THEME_COLORS.DEBIT_CARD },
      PIX: { name: 'PIX', value: 0, count: 0, color: THEME_COLORS.PIX },
      BOLETO: { name: 'Boleto Bancário', value: 0, count: 0, color: THEME_COLORS.BOLETO },
      TRANSFERENCIA: { name: 'Transferência TED', value: 0, count: 0, color: THEME_COLORS.TRANSFER },
      PENDING: { name: 'Aguardando Pgto', value: 0, count: 0, color: THEME_COLORS.PENDING },
    };

    activeOrders.forEach(po => {
      if (!po.paymentMethod || po.status === 'PENDING_FINANCIAL_APPROVAL') {
        summary.PENDING.value += (po.totalAmount || 0);
        summary.PENDING.count += 1;
      } else if (summary[po.paymentMethod]) {
        summary[po.paymentMethod].value += (po.totalAmount || 0);
        summary[po.paymentMethod].count += 1;
      } else {
        if (!summary.OTHER) {
          summary.OTHER = { name: 'Outros Meios', value: 0, count: 0, color: THEME_COLORS.OTHER };
        }
        summary.OTHER.value += (po.totalAmount || 0);
        summary.OTHER.count += 1;
      }
    });

    return Object.values(summary).filter(item => item.value > 0 || item.count > 0);
  }, [activeOrders]);

  // Dados para Gráfico de Evolução / Volume de Compras
  const chartMonthlyEvolution = useMemo(() => {
    const monthsMap: Record<string, { mes: string; cartao: number; outros: number; pendente: number; total: number }> = {};

    // Cria os últimos 6 meses para visualização contínua
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      const label = format(date, 'MMM/yy', { locale: ptBR });
      monthsMap[key] = { mes: label, cartao: 0, outros: 0, pendente: 0, total: 0 };
    }

    activeOrders.forEach(po => {
      const date = po.createdAt ? new Date(po.createdAt) : new Date();
      const key = format(date, 'yyyy-MM');
      if (monthsMap[key]) {
        const amount = po.totalAmount || 0;
        monthsMap[key].total += amount;

        if (po.paymentMethod === 'CARTAO_CREDITO' || po.paymentMethod === 'CARTAO_DEBITO') {
          monthsMap[key].cartao += amount;
        } else if (po.paymentMethod) {
          monthsMap[key].outros += amount;
        } else {
          monthsMap[key].pendente += amount;
        }
      }
    });

    return Object.values(monthsMap);
  }, [activeOrders]);

  // Dados para Top 5 Fornecedores Vencedores
  const chartTopSuppliers = useMemo(() => {
    const supplierMap: Record<string, { name: string; total: number; count: number }> = {};

    activeOrders.forEach(po => {
      const name = po.supplierName?.trim() || 'Fornecedor Não Informado';
      if (!supplierMap[name]) {
        supplierMap[name] = { name, total: 0, count: 0 };
      }
      supplierMap[name].total += (po.totalAmount || 0);
      supplierMap[name].count += 1;
    });

    return Object.values(supplierMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [activeOrders]);

  // Ordenação ao clicar no cabeçalho
  const handleSort = (field: 'createdAt' | 'totalAmount' | 'ocNumber' | 'supplierName') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Exportar Listagem Filtrada para CSV / Excel
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Não há ordens de compra exibidas nos filtros atuais.',
        variant: 'destructive'
      });
      return;
    }

    const exportData = filteredOrders.map(po => ({
      'Nº da OC': po.ocNumber || '',
      'Data de Emissão': po.createdAt ? format(new Date(po.createdAt), 'dd/MM/yyyy HH:mm') : '',
      'Fornecedor': po.supplierName || '',
      'CNPJ Fornecedor': po.supplierCnpj || '',
      'Peça / Insumo': po.itemName || '',
      'Código Peça': po.itemCode || '',
      'Quantidade': po.quantity || 1,
      'Valor Total (R$)': (po.totalAmount || 0).toFixed(2),
      'Forma de Pagamento': po.paymentMethod || 'Aguardando Programação',
      'Cartão Utilizado': po.cardNumber || '',
      'Parcelas': po.installmentsCount || 1,
      'Status': po.status || '',
      'Veículo / Placa': po.vehiclePlate || '',
      'Ordem de Serviço': po.workOrderNumber || '',
      'Requisição': po.requisitionNumber || ''
    }));

    exportToCSV(exportData, `Ordens_de_Compra_Financeiro_${format(new Date(), 'yyyyMMdd_HHmm')}`);
    toast({
      title: 'Exportação Concluída',
      description: `${filteredOrders.length} ordens de compra exportadas com sucesso.`
    });
  };

  // Abrir Modal de Programação
  const handleOpenProgramming = (po: ProcurementPurchaseOrder) => {
    setSelectedPO(po);
    setIsProgrammingModalOpen(true);
  };

  // Abrir Modal de Detalhes
  const handleOpenDetails = (po: ProcurementPurchaseOrder) => {
    setDetailsPO(po);
    setIsDetailsModalOpen(true);
  };

  // Formatação de Valores
  const formatBRL = (val?: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getPaymentMethodBadge = (po: ProcurementPurchaseOrder) => {
    if (!po.paymentMethod) {
      return (
        <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 gap-1 text-[11px] animate-pulse">
          <Clock className="h-3 w-3" /> Aguardando Programação
        </Badge>
      );
    }

    if (po.paymentMethod === 'CARTAO_CREDITO') {
      return (
        <div className="space-y-0.5">
          <Badge className="bg-blue-600/90 hover:bg-blue-600 text-white gap-1 text-[11px] font-semibold shadow-sm">
            <CreditCard className="h-3 w-3" />
            {po.installmentsCount && po.installmentsCount > 1
              ? `${po.installmentsCount}x Cartão Crédito`
              : 'Cartão Crédito (1x)'}
          </Badge>
          {po.cardNumber && (
            <span className="text-[10px] text-blue-300 font-mono block truncate max-w-[190px]" title={po.cardNumber}>
              💳 {po.cardNumber}
            </span>
          )}
        </div>
      );
    }

    if (po.paymentMethod === 'CARTAO_DEBITO') {
      return (
        <div className="space-y-0.5">
          <Badge className="bg-cyan-600/90 hover:bg-cyan-600 text-white gap-1 text-[11px] font-semibold">
            <CreditCard className="h-3 w-3" /> Cartão Débito
          </Badge>
          {po.cardNumber && (
            <span className="text-[10px] text-cyan-300 font-mono block truncate max-w-[190px]">
              💳 {po.cardNumber}
            </span>
          )}
        </div>
      );
    }

    if (po.paymentMethod === 'PIX') {
      return (
        <Badge className="bg-emerald-600/90 hover:bg-emerald-600 text-white gap-1 text-[11px] font-semibold">
          <QrCode className="h-3 w-3" /> PIX Programado
        </Badge>
      );
    }

    if (po.paymentMethod === 'BOLETO') {
      return (
        <Badge className="bg-amber-600/90 hover:bg-amber-600 text-white gap-1 text-[11px] font-semibold">
          <FileText className="h-3 w-3" /> Boleto Bancário
        </Badge>
      );
    }

    if (po.paymentMethod === 'TRANSFERENCIA') {
      return (
        <Badge className="bg-indigo-600/90 hover:bg-indigo-600 text-white gap-1 text-[11px] font-semibold">
          <Building2 className="h-3 w-3" /> Transferência TED
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-[11px]">
        {po.paymentMethod}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_FINANCIAL_APPROVAL':
        return <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px]">Pendente Financeiro</Badge>;
      case 'FINANCIAL_APPROVED':
        return <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px]">Programado / Aprovado</Badge>;
      case 'PURCHASED_IN_TRANSIT':
        return <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px]">Em Trânsito</Badge>;
      case 'DELIVERED_IN_ALMOXARIFADO':
        return <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px]">Entregue (NF-e)</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="text-[11px]">Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  // Tooltip customizado para Recharts
  const CustomRechartsTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-3 shadow-2xl text-xs space-y-1.5 z-50">
          <p className="font-bold text-white border-b border-gray-800 pb-1">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 text-gray-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {typeof entry.value === 'number' ? formatBRL(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior & Ações Principais */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-blue-950/40 border border-gray-800/80 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="p-2 bg-blue-500/15 border border-blue-500/30 rounded-xl text-blue-400">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Programação Financeira de Ordens de Compra
              </h2>
              {useDemoData && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-bold tracking-wider">
                  <Sparkles className="h-3 w-3 mr-1" /> Modo Demonstração Ativo
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
              Monitore despesas de suprimentos e peças autorizadas após as cotações, gerencie cartões corporativos corporativos, parcelamentos e fluxos PIX/Boleto em tempo real.
            </p>
          </div>

          {/* Botões de Ação na Direita */}
          <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
            {purchaseOrders.length === 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setUseDemoData(!useDemoData)}
                className={`text-xs gap-1.5 border transition-all ${
                  useDemoData
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                    : 'bg-zinc-800 border-gray-700 text-gray-300 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {useDemoData ? 'Ocultar Demonstração' : 'Ver Demonstração'}
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="bg-zinc-800/80 border-gray-700 text-gray-200 hover:text-white hover:bg-zinc-700 text-xs gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              Exportar Excel
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadPurchaseOrders}
              disabled={loading}
              className="bg-zinc-800/80 border-gray-700 text-gray-200 hover:text-white hover:bg-zinc-700 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {/* Alternador de Visualização */}
            <div className="flex items-center bg-zinc-950 border border-gray-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('ALL')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                  viewMode === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Visão Geral Completa"
              >
                Completo
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CHARTS_ONLY')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                  viewMode === 'CHARTS_ONLY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Somente Gráficos"
              >
                Gráficos
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE_ONLY')}
                className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                  viewMode === 'TABLE_ONLY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Somente Tabela"
              >
                Tabela
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Interativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total em Ordens de Compra */}
        <Card
          onClick={() => handleQuickFilterClick('ALL')}
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gray-800 hover:border-gray-700 transition-all duration-300 shadow-lg hover:shadow-emerald-950/20 cursor-pointer group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
              Total em Ordens de Compra
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-white font-mono">
              {formatBRL(stats.totalOrdersAmount)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400">
              <span>{stats.totalOrdersCount} ordens geradas</span>
              <span>Méd: <strong className="text-gray-300">{formatBRL(stats.averageOrderValue)}</strong></span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total em Cartão Corporativo */}
        <Card
          onClick={() => handleQuickFilterClick('CARD_CREDIT')}
          className="bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950 border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 shadow-lg hover:shadow-blue-950/30 cursor-pointer group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-blue-300 uppercase tracking-wider group-hover:text-blue-200 transition-colors">
              Total em Cartão Corporativo
            </CardTitle>
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 group-hover:scale-110 transition-transform">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
              {formatBRL(stats.totalCardAmount)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-900/30 text-[11px] text-blue-200/70">
              <span>{stats.cardOrdersCount} compras programadas</span>
              <span>
                {stats.totalOrdersAmount > 0
                  ? `${Math.round((stats.totalCardAmount / stats.totalOrdersAmount) * 100)}% do total`
                  : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: PIX / Boleto / Transferência */}
        <Card
          onClick={() => handleQuickFilterClick('PIX_BOLETO')}
          className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-gray-800 hover:border-emerald-500/40 transition-all duration-300 shadow-lg hover:shadow-emerald-950/20 cursor-pointer group"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase tracking-wider group-hover:text-emerald-300 transition-colors">
              PIX / Boleto / Transferência
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <QrCode className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {formatBRL(stats.totalOtherAmount)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400">
              <span>{stats.otherOrdersCount} compras programadas</span>
              <span>
                {stats.totalOrdersAmount > 0
                  ? `${Math.round((stats.totalOtherAmount / stats.totalOrdersAmount) * 100)}% do total`
                  : '0%'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Aguardando Programação */}
        <Card
          onClick={() => handleQuickFilterClick('PENDING')}
          className={`bg-gradient-to-br from-zinc-900 to-zinc-950 border-gray-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg cursor-pointer group ${
            stats.pendingOrdersCount > 0 ? 'border-amber-500/40 shadow-amber-950/20' : ''
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-amber-300 uppercase tracking-wider group-hover:text-amber-200 transition-colors flex items-center gap-1.5">
              <span>Aguardando Programação</span>
              {stats.pendingOrdersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </CardTitle>
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {stats.pendingOrdersCount}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80 text-[11px] text-amber-200/80">
              <span>Total pendente:</span>
              <strong className="text-amber-300 font-mono">{formatBRL(stats.pendingAmount)}</strong>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEÇÃO ANALÍTICA COM GRÁFICOS (RECHARTS) */}
      {viewMode !== 'TABLE_ONLY' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Gráfico 1: Distribuição por Forma de Pagamento (Donut) */}
          <Card className="bg-[#0e1017] border-gray-800/90 shadow-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <PieIcon className="h-4 w-4 text-blue-400" />
                  Distribuição por Forma de Pagamento
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-800">
                  {chartPaymentMethodData.length} categorias
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {chartPaymentMethodData.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-500 text-xs text-center space-y-2">
                  <PieIcon className="h-8 w-8 text-gray-700" />
                  <p>Sem dados financeiros para o gráfico.</p>
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartPaymentMethodData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        onClick={(data) => {
                          if (data.name === 'Cartão Crédito') setPaymentMethodFilter('CARTAO_CREDITO');
                          else if (data.name === 'Cartão Débito') setPaymentMethodFilter('CARTAO_DEBITO');
                          else if (data.name === 'PIX') setPaymentMethodFilter('PIX');
                          else if (data.name === 'Boleto Bancário') setPaymentMethodFilter('BOLETO');
                        }}
                        cursor="pointer"
                      >
                        {chartPaymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomRechartsTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Legenda Dinâmica Interativa */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-800/60">
                {chartPaymentMethodData.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      if (item.name === 'Cartão Crédito') setPaymentMethodFilter('CARTAO_CREDITO');
                      else if (item.name === 'Cartão Débito') setPaymentMethodFilter('CARTAO_DEBITO');
                      else if (item.name === 'PIX') setPaymentMethodFilter('PIX');
                      else if (item.name === 'Boleto Bancário') setPaymentMethodFilter('BOLETO');
                      else if (item.name === 'Aguardando Pgto') setStatusFilter('PENDING_FINANCIAL_APPROVAL');
                    }}
                    className="p-1.5 rounded-lg bg-zinc-950/60 border border-gray-800/60 hover:border-gray-700 cursor-pointer text-[11px] transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-medium">{item.name}</span>
                    </div>
                    <div className="font-mono font-bold text-white text-[11px] mt-0.5 pl-3.5">
                      {formatBRL(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Gráfico 2: Volume Financeiro por Período (Bar Chart / Evolução) */}
          <Card className="bg-[#0e1017] border-gray-800/90 shadow-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-emerald-400" />
                  Evolução de Compras (Últimos 6 Meses)
                </CardTitle>
                <span className="text-[10px] text-gray-400">Cartão vs Outros</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartMonthlyEvolution} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                    <XAxis dataKey="mes" stroke="#6b7280" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomRechartsTooltip />} />
                    <Bar dataKey="cartao" name="Cartão Corporativo" fill="#3b82f6" stackId="a" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="outros" name="Outros Meios (PIX/Boleto)" fill="#10b981" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Resumo do Período */}
              <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span>Cartão Corporativo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span>PIX, Boleto & TED</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico 3: Top Fornecedores Homologados */}
          <Card className="bg-[#0e1017] border-gray-800/90 shadow-xl overflow-hidden">
            <CardHeader className="pb-2 border-b border-gray-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-amber-400" />
                  Top Fornecedores Vencedores
                </CardTitle>
                <span className="text-[10px] text-gray-400">Volume Homologado</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {chartTopSuppliers.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-gray-500 text-xs text-center space-y-2">
                  <Building2 className="h-8 w-8 text-gray-700" />
                  <p>Nenhum fornecedor registrado ainda.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[224px] overflow-y-auto pr-1">
                  {chartTopSuppliers.map((supplier, idx) => {
                    const percent = stats.totalOrdersAmount > 0
                      ? Math.round((supplier.total / stats.totalOrdersAmount) * 100)
                      : 0;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSearchTerm(supplier.name)}
                        className="p-2.5 rounded-xl bg-zinc-950/70 border border-gray-800/80 hover:border-amber-500/40 cursor-pointer transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white truncate max-w-[190px]" title={supplier.name}>
                            {idx + 1}. {supplier.name}
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatBRL(supplier.total)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(percent, 5)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{supplier.count} {supplier.count === 1 ? 'pedido' : 'pedidos'}</span>
                          <span>{percent}% do volume</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cartões Corporativos Consolidados (Estilo Cartão Físico) */}
      {Object.keys(stats.cardSummary).length > 0 && (
        <Card className="bg-[#0e1017] border-gray-800/90 shadow-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Gastos Consolidados por Cartão Corporativo
            </CardTitle>
            {cardFilter !== 'ALL' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCardFilter('ALL')}
                className="text-[11px] text-blue-400 hover:text-white h-7 gap-1"
              >
                <X className="h-3 w-3" /> Limpar Filtro de Cartão
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats.cardSummary).map(([cardName, summary]) => {
                const isSelected = cardFilter === cardName;
                return (
                  <div
                    key={cardName}
                    onClick={() => setCardFilter(isSelected ? 'ALL' : cardName)}
                    className={`relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-900/80 via-blue-950/60 to-zinc-950 border-blue-400 shadow-xl shadow-blue-950/40 ring-1 ring-blue-400'
                        : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-gray-800 hover:border-blue-500/40 hover:scale-[1.02]'
                    }`}
                  >
                    {/* Detalhe do Chip de Cartão */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-6 rounded-md bg-gradient-to-tr from-amber-400 to-amber-200 shadow-sm flex items-center justify-center opacity-85">
                        <div className="w-6 h-4 border border-amber-600/50 rounded-sm" />
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold tracking-wider ${
                          isSelected
                            ? 'bg-blue-400/20 text-blue-200 border-blue-300/40'
                            : 'bg-zinc-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        {summary.flag || 'CORPORATIVO'}
                      </Badge>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-gray-200 block truncate" title={cardName}>
                        💳 {cardName}
                      </span>
                      <div className="text-lg font-black text-emerald-400 font-mono">
                        {formatBRL(summary.total)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-800/80 text-[10px] text-gray-400">
                      <span>{summary.count} {summary.count === 1 ? 'compra realizada' : 'compras realizadas'}</span>
                      {isSelected && (
                        <span className="text-blue-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-blue-400" /> Ativo
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pílulas de Filtro Rápido (Quick Filter Chips) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
          <Filter className="h-3.5 w-3.5 text-blue-400" /> Filtros Rápidos:
        </span>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('ALL')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'ALL'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-zinc-900 border-gray-800 text-gray-300 hover:border-gray-700'
          }`}
        >
          Todas as Ordens ({activeOrders.length})
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('PENDING')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'PENDING'
              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20'
              : 'bg-zinc-900 border-gray-800 text-amber-400 hover:border-amber-500/40'
          }`}
        >
          ⚠️ Aguardando Programação ({stats.pendingOrdersCount})
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('CARD_CREDIT')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'CARD_CREDIT'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-zinc-900 border-gray-800 text-blue-400 hover:border-blue-500/40'
          }`}
        >
          💳 Cartão de Crédito ({activeOrders.filter(po => po.paymentMethod === 'CARTAO_CREDITO').length})
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('PIX_BOLETO')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'PIX_BOLETO'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-zinc-900 border-gray-800 text-emerald-400 hover:border-emerald-500/40'
          }`}
        >
          ⚡ PIX / Boleto / TED ({stats.otherOrdersCount})
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('IN_TRANSIT')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'IN_TRANSIT'
              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
              : 'bg-zinc-900 border-gray-800 text-purple-400 hover:border-purple-500/40'
          }`}
        >
          🚚 Em Trânsito ({activeOrders.filter(po => po.status === 'PURCHASED_IN_TRANSIT').length})
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilterClick('DELIVERED')}
          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all ${
            quickFilter === 'DELIVERED'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-zinc-900 border-gray-800 text-emerald-300 hover:border-emerald-500/40'
          }`}
        >
          📦 Entregue no Almoxarifado ({activeOrders.filter(po => po.status === 'DELIVERED_IN_ALMOXARIFADO').length})
        </button>
      </div>

      {/* Barra de Filtros Tradicionais */}
      {viewMode !== 'CHARTS_ONLY' && (
        <Card className="bg-[#0e1017] border-gray-800">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por OC, Fornecedor, Peça, Cartão, PIX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-zinc-950 border-gray-800 text-xs text-white h-10 placeholder:text-gray-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <div>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger className="bg-zinc-950 border-gray-800 text-xs text-white h-10">
                    <SelectValue placeholder="Forma de Pagamento" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-gray-800 text-white text-xs">
                    <SelectItem value="ALL">Todas as Formas de Pgto</SelectItem>
                    <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                    <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto Bancário</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência TED</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro / Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={cardFilter} onValueChange={setCardFilter}>
                  <SelectTrigger className="bg-zinc-950 border-gray-800 text-xs text-white h-10">
                    <SelectValue placeholder="Filtrar por Cartão" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-gray-800 text-white text-xs">
                    <SelectItem value="ALL">Todos os Cartões</SelectItem>
                    {uniqueCardsList.map(card => (
                      <SelectItem key={card} value={card}>
                        💳 {card}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-zinc-950 border-gray-800 text-xs text-white h-10">
                    <SelectValue placeholder="Status da Ordem" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-gray-800 text-white text-xs">
                    <SelectItem value="ALL">Todos os Status</SelectItem>
                    <SelectItem value="PENDING_FINANCIAL_APPROVAL">Pendente Financeiro</SelectItem>
                    <SelectItem value="FINANCIAL_APPROVED">Programado / Aprovado</SelectItem>
                    <SelectItem value="PURCHASED_IN_TRANSIT">Em Trânsito</SelectItem>
                    <SelectItem value="DELIVERED_IN_ALMOXARIFADO">Entregue no Almoxarifado</SelectItem>
                    <SelectItem value="CANCELLED">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Ordens de Compra */}
      {viewMode !== 'CHARTS_ONLY' && (
        <div className="border border-gray-800 rounded-2xl overflow-hidden bg-[#0e1017] shadow-xl">
          <div className="p-3 bg-zinc-950/80 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold">
              Exibindo <strong className="text-white">{filteredOrders.length}</strong> de{' '}
              <strong className="text-white">{activeOrders.length}</strong> ordens de compra
            </span>

            {(searchTerm || paymentMethodFilter !== 'ALL' || cardFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPaymentMethodFilter('ALL');
                  setCardFilter('ALL');
                  setStatusFilter('ALL');
                  setQuickFilter('ALL');
                }}
                className="h-7 text-xs text-amber-400 hover:text-white"
              >
                Limpar Filtros Ativos
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-950">
                <TableRow className="border-gray-800">
                  <TableHead
                    onClick={() => handleSort('ocNumber')}
                    className="text-gray-300 text-[11px] font-bold cursor-pointer hover:text-white select-none"
                  >
                    <div className="flex items-center gap-1">
                      Nº DA OC / DATA
                      <ArrowUpDown className="h-3 w-3 text-gray-500" />
                    </div>
                  </TableHead>

                  <TableHead
                    onClick={() => handleSort('supplierName')}
                    className="text-gray-300 text-[11px] font-bold cursor-pointer hover:text-white select-none"
                  >
                    <div className="flex items-center gap-1">
                      FORNECEDOR VENCEDOR
                      <ArrowUpDown className="h-3 w-3 text-gray-500" />
                    </div>
                  </TableHead>

                  <TableHead className="text-gray-300 text-[11px] font-bold">PEÇA / DESTINO</TableHead>

                  <TableHead
                    onClick={() => handleSort('totalAmount')}
                    className="text-gray-300 text-[11px] font-bold text-right cursor-pointer hover:text-white select-none"
                  >
                    <div className="flex items-center justify-end gap-1">
                      VALOR TOTAL
                      <ArrowUpDown className="h-3 w-3 text-gray-500" />
                    </div>
                  </TableHead>

                  <TableHead className="text-gray-300 text-[11px] font-bold">FORMA DE PAGAMENTO & CARTÃO</TableHead>
                  <TableHead className="text-gray-300 text-[11px] font-bold text-center">STATUS</TableHead>
                  <TableHead className="text-gray-300 text-[11px] font-bold text-center">AÇÕES</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-gray-400">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                      <p className="font-semibold text-sm">Carregando ordens de compra...</p>
                      <p className="text-xs text-gray-500 mt-1">Conectando ao módulo de suprimentos e financeiro</p>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-14 h-14 bg-zinc-800/80 border border-gray-700 rounded-2xl flex items-center justify-center mx-auto text-gray-500 shadow-inner">
                          <CreditCard className="h-7 w-7" />
                        </div>
                        <h4 className="font-bold text-white text-base">Nenhuma ordem de compra encontrada</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          As ordens de compra são geradas automaticamente quando o gestor aprova as cotações no Almoxarifado para atendimento de O.S. ou reposição.
                        </p>
                        {activeOrders.length === 0 && (
                          <div className="pt-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setUseDemoData(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-lg shadow-blue-600/20"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Visualizar Demonstração com Gráficos
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((po) => (
                    <TableRow key={po.id} className="border-gray-800 hover:bg-zinc-800/40 transition-colors">
                      <TableCell className="font-mono text-xs">
                        <span className="font-bold text-white block">{po.ocNumber}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3 text-gray-500" />
                          {po.createdAt ? format(new Date(po.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="font-bold text-gray-200 block truncate max-w-[200px]" title={po.supplierName}>
                          {po.supplierName}
                        </span>
                        {po.supplierCnpj && (
                          <span className="text-[11px] text-gray-400 font-mono block">{po.supplierCnpj}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs space-y-0.5">
                        <span className="font-medium text-white block truncate max-w-[220px]" title={po.itemName}>
                          {po.itemName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono flex-wrap">
                          <span>Qtd: <strong className="text-gray-300">{po.quantity}</strong></span>
                          {po.vehiclePlate && (
                            <span className="bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px] text-amber-300 border border-gray-700">
                              🚚 {po.vehiclePlate}
                            </span>
                          )}
                          {po.workOrderNumber && (
                            <span className="text-gray-400 text-[10px]">
                              OS: {po.workOrderNumber}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-mono text-xs font-black text-emerald-400">
                        {formatBRL(po.totalAmount)}
                      </TableCell>

                      <TableCell className="text-xs">
                        {getPaymentMethodBadge(po)}
                      </TableCell>

                      <TableCell className="text-center">
                        {getStatusBadge(po.status)}
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetails(po)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-zinc-800"
                            title="Ver Detalhes da Ordem de Compra"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenProgramming(po)}
                            className={`text-xs font-bold gap-1.5 h-8 px-2.5 ${
                              po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border border-gray-700'
                            }`}
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            {po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
                              ? 'Programar'
                              : 'Ajustar'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal de Programação Financeira */}
      {selectedPO && (
        <FinancialPaymentProgrammingModal
          isOpen={isProgrammingModalOpen}
          onClose={() => {
            setIsProgrammingModalOpen(false);
            setSelectedPO(null);
          }}
          purchaseOrder={selectedPO}
          onSuccess={loadPurchaseOrders}
        />
      )}

      {/* Modal de Detalhes da Ordem de Compra */}
      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setDetailsPO(null);
        }}
        purchaseOrder={detailsPO}
        onOpenProgramming={handleOpenProgramming}
      />
    </div>
  );
};

export default PurchaseOrdersFinancialManager;
