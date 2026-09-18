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
  SlidersHorizontal
} from 'lucide-react';
import {
  procurementService,
  ProcurementPurchaseOrder
} from '@/services/procurementService';
import { FinancialPaymentProgrammingModal } from '@/components/financeiro/FinancialPaymentProgrammingModal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PurchaseOrdersFinancialManagerProps {
  embeddedInFinanceiro?: boolean;
}

export const PurchaseOrdersFinancialManager: React.FC<PurchaseOrdersFinancialManagerProps> = ({
  embeddedInFinanceiro = true
}) => {
  const [purchaseOrders, setPurchaseOrders] = useState<ProcurementPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('ALL');
  const [cardFilter, setCardFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Modal de Programação
  const [selectedPO, setSelectedPO] = useState<ProcurementPurchaseOrder | null>(null);
  const [isProgrammingModalOpen, setIsProgrammingModalOpen] = useState(false);
  const { toast } = useToast();

  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const data = await procurementService.listPurchaseOrders();
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Erro ao carregar ordens de compra:', error);
      toast({
        title: 'Erro ao carregar Ordens de Compra',
        description: 'Não foi possível carregar as ordens para o financeiro.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  // Lista única de cartões utilizados para popular o dropdown de filtro
  const uniqueCardsList = useMemo(() => {
    const cards = new Set<string>();
    purchaseOrders.forEach(po => {
      if (po.cardNumber && po.cardNumber.trim()) {
        cards.add(po.cardNumber.trim());
      }
    });
    return Array.from(cards);
  }, [purchaseOrders]);

  // Filtragem
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      const matchesSearch = 
        po.ocNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requisitionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.cardNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.paymentReference?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMethod = paymentMethodFilter === 'ALL' || po.paymentMethod === paymentMethodFilter;
      const matchesCard = cardFilter === 'ALL' || (po.cardNumber && po.cardNumber.trim() === cardFilter);
      const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;

      return matchesSearch && matchesMethod && matchesCard && matchesStatus;
    });
  }, [purchaseOrders, searchTerm, paymentMethodFilter, cardFilter, statusFilter]);

  // Estatísticas e KPIs
  const stats = useMemo(() => {
    const totalOrdersAmount = purchaseOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);
    
    // Total em Cartão de Crédito/Débito
    const cardOrders = purchaseOrders.filter(po => po.paymentMethod === 'CARTAO_CREDITO' || po.paymentMethod === 'CARTAO_DEBITO');
    const totalCardAmount = cardOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);
    
    // Total em PIX / Boleto / Outros
    const otherOrders = purchaseOrders.filter(po => po.paymentMethod && po.paymentMethod !== 'CARTAO_CREDITO' && po.paymentMethod !== 'CARTAO_DEBITO');
    const totalOtherAmount = otherOrders.reduce((acc, po) => acc + (po.totalAmount || 0), 0);

    // Pendentes de Programação Financeira
    const pendingProgrammingCount = purchaseOrders.filter(po => po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod).length;

    // Resumo por Cartão
    const cardSummary: Record<string, { count: number; total: number }> = {};
    cardOrders.forEach(po => {
      const cardKey = po.cardNumber || 'Cartão Não Identificado';
      if (!cardSummary[cardKey]) {
        cardSummary[cardKey] = { count: 0, total: 0 };
      }
      cardSummary[cardKey].count += 1;
      cardSummary[cardKey].total += (po.totalAmount || 0);
    });

    return {
      totalOrdersAmount,
      totalCardAmount,
      cardOrdersCount: cardOrders.length,
      totalOtherAmount,
      otherOrdersCount: otherOrders.length,
      pendingProgrammingCount,
      cardSummary
    };
  }, [purchaseOrders]);

  const handleOpenProgramming = (po: ProcurementPurchaseOrder) => {
    setSelectedPO(po);
    setIsProgrammingModalOpen(true);
  };

  const getPaymentMethodBadge = (po: ProcurementPurchaseOrder) => {
    if (!po.paymentMethod) {
      return (
        <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-400 gap-1 text-[11px]">
          <Clock className="h-3 w-3" /> Aguardando Programação
        </Badge>
      );
    }

    if (po.paymentMethod === 'CARTAO_CREDITO') {
      return (
        <div className="space-y-0.5">
          <Badge className="bg-blue-600 hover:bg-blue-600 text-white gap-1 text-[11px] font-semibold">
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
          <Badge className="bg-cyan-600 hover:bg-cyan-600 text-white gap-1 text-[11px] font-semibold">
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
        <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 text-[11px] font-semibold">
          <QrCode className="h-3 w-3" /> PIX Programado
        </Badge>
      );
    }

    if (po.paymentMethod === 'BOLETO') {
      return (
        <Badge className="bg-amber-600 hover:bg-amber-600 text-white gap-1 text-[11px] font-semibold">
          <FileText className="h-3 w-3" /> Boleto Bancário
        </Badge>
      );
    }

    if (po.paymentMethod === 'TRANSFERENCIA') {
      return (
        <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white gap-1 text-[11px] font-semibold">
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
        return <Badge className="bg-amber-600 text-white text-[11px]">Pendente Financeiro</Badge>;
      case 'FINANCIAL_APPROVED':
        return <Badge className="bg-blue-600 text-white text-[11px]">Programado / Aprovado</Badge>;
      case 'PURCHASED_IN_TRANSIT':
        return <Badge className="bg-purple-600 text-white text-[11px]">Em Trânsito</Badge>;
      case 'DELIVERED_IN_ALMOXARIFADO':
        return <Badge className="bg-emerald-600 text-white text-[11px]">Entregue (NF-e)</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive" className="text-[11px]">Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-blue-400" />
            Programação Financeira de Ordens de Compra & Gastos por Cartão
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Visualize todas as ordens de compra autorizadas após as cotações, programe pagamentos (Cartão Corporativo, Parcelas, PIX, Boleto) e rastreie os gastos por cartão.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadPurchaseOrders}
          disabled={loading}
          className="bg-zinc-800 border-gray-700 text-gray-300 hover:text-white text-xs gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Ordens
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-gray-800 text-zinc-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase">
              Total em Ordens de Compra
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-white">
              R$ {stats.totalOrdersAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {purchaseOrders.length} ordens de compra geradas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-950/60 to-zinc-900 border-blue-500/30 text-zinc-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-blue-300 uppercase">
              Total em Cartão Corporativo
            </CardTitle>
            <CreditCard className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-blue-400">
              R$ {stats.totalCardAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-blue-200/70 mt-1">
              {stats.cardOrdersCount} compras pagas/parceladas no cartão
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-gray-800 text-zinc-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase">
              PIX / Boleto / Transferência
            </CardTitle>
            <QrCode className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-400">
              R$ {stats.totalOtherAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              {stats.otherOrdersCount} compras programadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-gray-800 text-zinc-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-gray-400 uppercase">
              Aguardando Programação
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-amber-400">
              {stats.pendingProgrammingCount}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Ordens de compra aguardando o financeiro
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cartões Ativos e Gastos por Cartão */}
      {Object.keys(stats.cardSummary).length > 0 && (
        <Card className="bg-zinc-900/90 border-gray-800">
          <CardHeader className="pb-3 border-b border-gray-800">
            <CardTitle className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Gastos Consolidados por Cartão Corporativo
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Object.entries(stats.cardSummary).map(([cardName, summary]) => (
                <div
                  key={cardName}
                  onClick={() => setCardFilter(cardFilter === cardName ? 'ALL' : cardName)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    cardFilter === cardName
                      ? 'bg-blue-950/80 border-blue-400 shadow-md'
                      : 'bg-zinc-950/80 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]" title={cardName}>
                      💳 {cardName}
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-300 border-blue-500/30">
                      {summary.count} {summary.count === 1 ? 'compra' : 'compras'}
                    </Badge>
                  </div>
                  <div className="text-base font-extrabold text-emerald-400 mt-1.5">
                    R$ {summary.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barra de Filtros */}
      <Card className="bg-zinc-900 border-gray-800">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por OC, Fornecedor, Peça, Cartão, PIX..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-950 border-gray-700 text-xs text-white h-10"
              />
            </div>

            <div>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                  <SelectValue placeholder="Forma de Pagamento" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
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
                <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                  <SelectValue placeholder="Filtrar por Cartão" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
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
                <SelectTrigger className="bg-zinc-950 border-gray-700 text-xs text-white h-10">
                  <SelectValue placeholder="Status da Ordem" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-gray-700 text-white text-xs">
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

      {/* Tabela de Ordens de Compra */}
      <div className="border border-gray-800 rounded-xl overflow-hidden bg-zinc-900 shadow-xl">
        <Table>
          <TableHeader className="bg-zinc-950">
            <TableRow className="border-gray-800">
              <TableHead className="text-gray-300 text-[11px] font-bold">Nº DA OC / DATA</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold">FORNECEDOR VENCEDOR</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold">PEÇA / DESTINO</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold text-right">VALOR TOTAL</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold">FORMA DE PAGAMENTO & CARTÃO</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold text-center">STATUS</TableHead>
              <TableHead className="text-gray-300 text-[11px] font-bold text-center">AÇÕES FINANCEIRAS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                  Carregando ordens de compra...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  Nenhuma ordem de compra encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((po) => (
                <TableRow key={po.id} className="border-gray-800 hover:bg-zinc-800/60 transition-colors">
                  <TableCell className="font-mono text-xs">
                    <span className="font-bold text-white block">{po.ocNumber}</span>
                    <span className="text-[11px] text-gray-400">
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
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-mono">
                      <span>Qtd: {po.quantity}</span>
                      {po.vehiclePlate && (
                        <span>• Placa: <strong className="text-seguranca-yellow">{po.vehiclePlate}</strong></span>
                      )}
                      {po.workOrderNumber && (
                        <span>• OS: {po.workOrderNumber}</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-mono text-xs font-extrabold text-emerald-400">
                    R$ {po.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>

                  <TableCell className="text-xs">
                    {getPaymentMethodBadge(po)}
                  </TableCell>

                  <TableCell className="text-center">
                    {getStatusBadge(po.status)}
                  </TableCell>

                  <TableCell className="text-center">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenProgramming(po)}
                      className={`text-xs font-bold gap-1.5 h-8 ${
                        po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md animate-pulse'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200 border border-gray-700'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      {po.status === 'PENDING_FINANCIAL_APPROVAL' || !po.paymentMethod
                        ? 'Programar Pagamento'
                        : 'Ver / Ajustar Pagamento'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
    </div>
  );
};
