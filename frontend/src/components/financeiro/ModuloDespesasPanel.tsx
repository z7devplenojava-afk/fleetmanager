import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  Edit, 
  Wrench, 
  Truck, 
  Receipt,
  Layers,
  Tag,
  Filter
} from 'lucide-react';
import { contasAPagarService } from '@/services/contasAPagarService';
import { ContasAPagarFormModal, ContaAPagar } from '@/components/financeiro/ContasAPagarFormModal';
import { ContasAPagarViewModal } from '@/components/financeiro/ContasAPagarViewModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export type ModuloSetor = 
  | 'MANUTENCAO' 
  | 'FROTA' 
  | 'RH' 
  | 'DP' 
  | 'SST' 
  | 'OPERACIONAL' 
  | 'ALMOXARIFADO';

export interface ModuloDespesasPanelProps {
  modulo: ModuloSetor;
  titulo?: string;
  subtitulo?: string;
  centroCustoDefault?: string;
  categoriaDefault?: string;
  hideHeaderTitle?: boolean;
  defaultWorkOrderId?: string;
  defaultWorkOrderNumber?: string;
  defaultVehiclePlate?: string;
}

const MODULO_CONFIG: Record<ModuloSetor, {
  nome: string;
  centroCustoPadrao: string;
  categoriaPadrao: string;
  icon: any;
  cor: string;
}> = {
  MANUTENCAO: {
    nome: 'Manutenção',
    centroCustoPadrao: 'Manutenção e Frotas',
    categoriaPadrao: '1.02 - FROTA (PEÇAS,SERVIÇOS,IPVA)',
    icon: Wrench,
    cor: 'border-l-blue-500'
  },
  FROTA: {
    nome: 'Frota',
    centroCustoPadrao: 'Manutenção e Frotas',
    categoriaPadrao: '1.03 - LOCACAO DE VEICULOS',
    icon: Truck,
    cor: 'border-l-blue-500'
  },
  RH: {
    nome: 'Recursos Humanos',
    centroCustoPadrao: 'Recursos Humanos',
    categoriaPadrao: '2.01 - FOLHA DE PAGAMENTO / SALÁRIOS',
    icon: Layers,
    cor: 'border-l-amber-500'
  },
  DP: {
    nome: 'Departamento Pessoal',
    centroCustoPadrao: 'Recursos Humanos',
    categoriaPadrao: '2.08 - ENCARGOS SOCIAIS (FGTS / INSS / PIS)',
    icon: Building2,
    cor: 'border-l-amber-500'
  },
  SST: {
    nome: 'Segurança do Trabalho (SST)',
    centroCustoPadrao: 'Operacional',
    categoriaPadrao: '2.11 - EPIs, UNIFORMES E SST',
    icon: ShieldCheckIconFallback,
    cor: 'border-l-emerald-500'
  },
  OPERACIONAL: {
    nome: 'Operacional',
    centroCustoPadrao: 'Operacional',
    categoriaPadrao: '1.01 - COMBUSTIVEL',
    icon: Receipt,
    cor: 'border-l-orange-500'
  },
  ALMOXARIFADO: {
    nome: 'Almoxarifado & Estoque',
    centroCustoPadrao: 'Operacional',
    categoriaPadrao: '1.02 - FROTA (PEÇAS,SERVIÇOS,IPVA)',
    icon: Layers,
    cor: 'border-l-cyan-500'
  }
};

function ShieldCheckIconFallback(props: any) {
  return <Building2 {...props} />;
}

export const ModuloDespesasPanel: React.FC<ModuloDespesasPanelProps> = ({
  modulo,
  titulo,
  subtitulo,
  centroCustoDefault,
  categoriaDefault,
  hideHeaderTitle = false,
  defaultWorkOrderId,
  defaultWorkOrderNumber,
  defaultVehiclePlate
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<ContaAPagar | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ABERTA' | 'PAGA' | 'VENCIDA' | 'CANCELADA'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const config = MODULO_CONFIG[modulo] || MODULO_CONFIG.MANUTENCAO;
  const displayTitle = titulo || `Despesas com ${config.nome}`;
  const displaySubtitle = subtitulo || `Acompanhamento e lançamento de despesas financeiras vinculadas ao setor de ${config.nome}`;
  const finalCentroCusto = centroCustoDefault || config.centroCustoPadrao;
  const finalCategoria = categoriaDefault || config.categoriaPadrao;

  // Verificação de alçada/permissão de lançamento
  const canCreateExpense = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    const isBasicOperator = ['MOTORISTA', 'LAVADOR', 'MECANICO', 'VIGILANTE', 'COLABORADOR'].includes(role);
    if (isBasicOperator) return false;
    return true;
  }, [user]);

  // Carregar faturas do backend
  const { data: allInvoices = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['invoices-modulo', modulo],
    queryFn: () => contasAPagarService.getContasAPagar({ size: 10000 }),
    staleTime: 1000 * 60 * 2 // 2 minutos
  });

  // Filtro Estrito por Módulo (Regra de Negócio: Isolamento entre setores)
  const moduleInvoices = useMemo(() => {
    return allInvoices.filter(inv => {
      const cc = (inv.centroCusto || '').toUpperCase();
      const cat = (inv.categoria || '').toUpperCase();
      const desc = (inv.descricao || '').toUpperCase();

      switch (modulo) {
        case 'MANUTENCAO':
          // Qualquer despesa com Centro de Custo Manutenção, peças, ou que tenha Ordem de Serviço vinculada
          return (
            Boolean(inv.workOrderId || inv.workOrderNumber) ||
            cc.includes('MANUTEN') ||
            cc.includes('FROT') ||
            cat.includes('PEÇAS') ||
            cat.includes('MECÂNICA') ||
            cat.includes('BORRACHARIA') ||
            cat.includes('LAVAGEM') ||
            cat.includes('FROTA') ||
            desc.includes('MANUTEN') ||
            desc.includes('O.S') ||
            desc.includes('ORDEM DE SERVIÇO')
          );

        case 'FROTA':
          return (
            cc.includes('FROT') ||
            cat.includes('LOCACAO') ||
            cat.includes('RASTREA') ||
            cat.includes('SEGURO') ||
            cat.includes('COMBUSTIVEL') ||
            cat.includes('MULTAS') ||
            desc.includes('LOCAÇÃO') ||
            desc.includes('PLACA')
          );

        case 'RH':
          return (
            cc.includes('RECURSOS HUMANOS') ||
            cc.includes('RH') ||
            cat.includes('FOLHA') ||
            cat.includes('SALÁRIO') ||
            cat.includes('BENEFÍCIO') ||
            cat.includes('ALIMENTAÇÃO') ||
            cat.includes('TRANSPORTE') ||
            cat.includes('SAÚDE')
          );

        case 'DP':
          return (
            cc.includes('RECURSOS HUMANOS') ||
            cc.includes('DEPTO') ||
            cc.includes('DEPARTAMENTO PESSOAL') ||
            cat.includes('RESCISÃO') ||
            cat.includes('FÉRIAS') ||
            cat.includes('13º') ||
            cat.includes('ENCARGOS') ||
            cat.includes('FGTS') ||
            cat.includes('INSS')
          );

        case 'SST':
          return (
            cc.includes('SST') ||
            cc.includes('SEGURANÇA') ||
            cat.includes('EPI') ||
            cat.includes('SST') ||
            cat.includes('UNIFORME') ||
            cat.includes('EXAME') ||
            cat.includes('MÉDICO') ||
            cat.includes('TREINAMENTO') ||
            cat.includes('CIPA')
          );

        case 'OPERACIONAL':
          return (
            cc.includes('OPERACIONAL') ||
            cat.includes('COMBUSTIVEL') ||
            cat.includes('PEDÁGIO') ||
            cat.includes('MOBILIZAÇÃO')
          );

        case 'ALMOXARIFADO':
          return (
            cc.includes('ALMOXARIFADO') ||
            cc.includes('ESTOQUE') ||
            cc.includes('LOGÍSTICA') ||
            cat.includes('ESTOQUE') ||
            cat.includes('MATERIAIS') ||
            cat.includes('SUPRIMENTOS')
          );

        default:
          return true;
      }
    });
  }, [allInvoices, modulo]);

  // Filtros de busca, status e data
  const filteredInvoices = useMemo(() => {
    return moduleInvoices.filter(inv => {
      // Filtro de status
      if (statusFilter !== 'ALL') {
        const isPaid = inv.baixa || inv.status === 'PAGA';
        if (statusFilter === 'PAGA' && !isPaid) return false;
        if (statusFilter === 'ABERTA' && (isPaid || inv.status === 'CANCELADA')) return false;
        if (statusFilter === 'VENCIDA' && (isPaid || inv.status !== 'VENCIDA')) return false;
        if (statusFilter === 'CANCELADA' && inv.status !== 'CANCELADA') return false;
      }

      // Filtro de datas
      if (dateFrom && inv.vencimento) {
        const d = new Date(inv.vencimento);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo && inv.vencimento) {
        const d = new Date(inv.vencimento);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        if (d > to) return false;
      }

      // Filtro de busca textual
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const forn = (inv.fornecedor || '').toLowerCase();
        const desc = (inv.descricao || '').toLowerCase();
        const num = (inv.invoiceNumber || '').toLowerCase();
        const osNum = (inv.workOrderNumber || '').toLowerCase();
        const cat = (inv.categoria || '').toLowerCase();

        if (
          !forn.includes(q) &&
          !desc.includes(q) &&
          !num.includes(q) &&
          !osNum.includes(q) &&
          !cat.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [moduleInvoices, statusFilter, dateFrom, dateTo, searchTerm]);

  // Totalizadores / KPIs
  const stats = useMemo(() => {
    let total = 0;
    let abertas = 0;
    let valorAbertas = 0;
    let pagas = 0;
    let valorPagas = 0;
    let vencidas = 0;
    let valorVencidas = 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    moduleInvoices.forEach(inv => {
      const val = Number(inv.valor) || 0;
      total += val;

      const isPaid = inv.baixa || inv.status === 'PAGA';
      if (isPaid) {
        pagas++;
        valorPagas += val;
      } else if (inv.status === 'CANCELADA') {
        // Ignora canceladas nos totais a pagar
      } else {
        const due = inv.vencimento ? new Date(inv.vencimento) : null;
        if (due && due < now) {
          vencidas++;
          valorVencidas += val;
        } else {
          abertas++;
          valorAbertas += val;
        }
      }
    });

    return { total, abertas, valorAbertas, pagas, valorPagas, vencidas, valorVencidas };
  }, [moduleInvoices]);

  const handleOpenNew = () => {
    setSelectedConta({
      descricao: defaultWorkOrderNumber ? `Despesa referente à OS ${defaultWorkOrderNumber}` : '',
      valor: 0,
      vencimento: new Date(),
      status: 'ABERTA',
      baixa: false,
      tipo: 'VARIAVEL',
      fornecedor: '',
      centroCusto: finalCentroCusto,
      categoria: finalCategoria,
      workOrderId: defaultWorkOrderId,
      workOrderNumber: defaultWorkOrderNumber
    });
    setEditMode(false);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (conta: ContaAPagar) => {
    setSelectedConta(conta);
    setEditMode(true);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (conta: ContaAPagar) => {
    setSelectedConta(conta);
    setIsViewModalOpen(true);
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return format(d, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Ações */}
      {!hideHeaderTitle && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/60 border border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <config.icon className="h-5 w-5 text-amber-400" />
              {displayTitle}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{displaySubtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="border-zinc-700 hover:bg-zinc-800 text-zinc-200 h-9"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {canCreateExpense ? (
              <Button
                onClick={handleOpenNew}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-9 shadow-md"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Despesa
              </Button>
            ) : (
              <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs py-1.5">
                🔒 Lançamento restrito a gestores
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-zinc-900/80 border-l-4 border-l-amber-500 border-zinc-800 shadow-sm">
          <CardHeader className="pb-1 p-3.5">
            <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total no Setor</span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-lg sm:text-xl font-bold text-zinc-100">{formatBRL(stats.total)}</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{moduleInvoices.length} título(s) registrado(s)</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-l-4 border-l-blue-500 border-zinc-800 shadow-sm">
          <CardHeader className="pb-1 p-3.5">
            <CardTitle className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center justify-between">
              <span>Em Aberto</span>
              <Clock className="h-4 w-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-lg sm:text-xl font-bold text-zinc-100">{formatBRL(stats.valorAbertas)}</div>
            <div className="text-[11px] text-blue-300 mt-0.5">{stats.abertas} conta(s) a vencer</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-l-4 border-l-emerald-500 border-zinc-800 shadow-sm">
          <CardHeader className="pb-1 p-3.5">
            <CardTitle className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pagas (Liquidadas)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-lg sm:text-xl font-bold text-zinc-100">{formatBRL(stats.valorPagas)}</div>
            <div className="text-[11px] text-emerald-300 mt-0.5">{stats.pagas} conta(s) quitada(s)</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-l-4 border-l-red-500 border-zinc-800 shadow-sm">
          <CardHeader className="pb-1 p-3.5">
            <CardTitle className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-between">
              <span>Vencidas / Em Atraso</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-lg sm:text-xl font-bold text-red-400">{formatBRL(stats.valorVencidas)}</div>
            <div className="text-[11px] text-red-300 mt-0.5">{stats.vencidas} título(s) pendente(s)</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/70 p-3.5 rounded-xl border border-zinc-800">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por fornecedor, descrição, nota fiscal, OS..."
            className="pl-9 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 h-9 text-xs rounded-lg"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[140px] h-9 bg-zinc-950 border-zinc-700 text-zinc-100 text-xs rounded-lg">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="ABERTA">Em Aberto</SelectItem>
              <SelectItem value="PAGA">Pagas</SelectItem>
              <SelectItem value="VENCIDA">Vencidas</SelectItem>
              <SelectItem value="CANCELADA">Canceladas</SelectItem>
            </SelectContent>
          </Select>

          {/* Data De */}
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[130px] h-9 bg-zinc-950 border-zinc-700 text-zinc-100 text-xs rounded-lg"
            placeholder="De"
          />

          {/* Data Até */}
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[130px] h-9 bg-zinc-950 border-zinc-700 text-zinc-100 text-xs rounded-lg"
            placeholder="Até"
          />

          {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setDateFrom('');
                setDateTo('');
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 h-9 px-2"
            >
              Limpar
            </Button>
          )}

          {hideHeaderTitle && canCreateExpense && (
            <Button
              onClick={handleOpenNew}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold h-9 shadow-md ml-auto"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Lançar Despesa
            </Button>
          )}
        </div>
      </div>

      {/* Tabela de Despesas */}
      <Card className="bg-zinc-900/60 border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-950/80">
              <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400 text-xs font-semibold">Fornecedor / Favorecido</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold">Descrição da Despesa</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold">Vencimento</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold text-right">Valor</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold text-center">Status</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold text-center">Vínculo / OS</TableHead>
                <TableHead className="text-zinc-400 text-xs font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Carregando despesas do setor...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-zinc-400 text-xs">
                    <Receipt className="h-7 w-7 mx-auto mb-2 text-zinc-600" />
                    Nenhuma despesa encontrada para este filtro.
                    {canCreateExpense && (
                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleOpenNew}
                          className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 text-xs"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" /> Registrar Primeira Despesa
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((inv) => {
                  const isPaid = inv.baixa || inv.status === 'PAGA';
                  const isOverdue = !isPaid && inv.status === 'VENCIDA';

                  return (
                    <TableRow key={inv.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/40 transition-colors">
                      {/* Fornecedor */}
                      <TableCell className="text-xs font-medium text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate max-w-[200px]" title={inv.fornecedor}>
                            {inv.fornecedor || 'Fornecedor não informado'}
                          </span>
                        </div>
                        {inv.invoiceNumber && (
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Doc: {inv.invoiceNumber}
                          </div>
                        )}
                      </TableCell>

                      {/* Descrição */}
                      <TableCell className="text-xs text-zinc-300">
                        <div className="truncate max-w-[260px]" title={inv.descricao}>
                          {inv.descricao}
                        </div>
                        {inv.categoria && (
                          <div className="text-[10px] text-amber-400/80 truncate max-w-[260px] mt-0.5">
                            {inv.categoria}
                          </div>
                        )}
                      </TableCell>

                      {/* Vencimento */}
                      <TableCell className="text-xs text-zinc-300 font-mono">
                        {formatDate(inv.vencimento)}
                        {isPaid && inv.dataPagamento && (
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Pago em: {formatDate(inv.dataPagamento)}
                          </div>
                        )}
                      </TableCell>

                      {/* Valor */}
                      <TableCell className="text-xs font-bold text-zinc-100 text-right font-mono">
                        {formatBRL(inv.valor)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {isPaid ? (
                          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paga
                          </Badge>
                        ) : isOverdue ? (
                          <Badge className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px]">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Vencida
                          </Badge>
                        ) : inv.status === 'CANCELADA' ? (
                          <Badge className="bg-zinc-700/40 text-zinc-400 border border-zinc-700 text-[10px]">
                            <XCircle className="h-3 w-3 mr-1" /> Cancelada
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]">
                            <Clock className="h-3 w-3 mr-1" /> Aberta
                          </Badge>
                        )}
                      </TableCell>

                      {/* Vínculo OS / Veículo */}
                      <TableCell className="text-center">
                        {inv.workOrderNumber || inv.workOrderId ? (
                          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-300 font-mono text-[10px]">
                            <Wrench className="h-3 w-3 mr-1 text-blue-400" />
                            {inv.workOrderNumber || `OS #${inv.workOrderId?.slice(0, 8)}`}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-zinc-600">-</span>
                        )}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenView(inv)}
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                            title="Visualizar Detalhes"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {!isPaid && canCreateExpense && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(inv)}
                              className="h-7 w-7 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
                              title="Editar Lançamento"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Formulário de Contas a Pagar */}
      <ContasAPagarFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['invoices-modulo', modulo] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          setIsFormModalOpen(false);
          setSelectedConta(null);
        }}
        editMode={editMode}
        initialData={selectedConta}
      />

      {/* Modal de Visualização da Conta a Pagar */}
      <ContasAPagarViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedConta(null);
        }}
        conta={selectedConta}
        onEdit={(conta) => {
          setIsViewModalOpen(false);
          handleOpenEdit(conta);
        }}
      />
    </div>
  );
};

export default ModuloDespesasPanel;
