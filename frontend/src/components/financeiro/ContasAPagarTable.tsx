import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  ArrowUp,
  ArrowDown,
  Building2,
  Tag,
  Receipt,
  Layers,
  FileSpreadsheet,
  X,
  ChevronRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import {
  CLASSIFICACOES_PADRAO,
  GRUPOS_CLASSIFICACAO,
  getClassificacaoStyle
} from '@/constants/classificacaoContasPagar';

interface ContasAPagarTableProps {
  contas: ContaAPagar[];
  onEdit: (conta: ContaAPagar) => void;
  onDelete: (id: string) => void;
  onView: (conta: ContaAPagar) => void;
  onRefresh: () => void;
  loading?: boolean;
}

type SortField = 
  | 'vencimento' 
  | 'fornecedor' 
  | 'descricao' 
  | 'empresa' 
  | 'obra' 
  | 'categoria' 
  | 'centroCusto' 
  | 'tipo' 
  | 'valor' 
  | 'status' 
  | 'baixa' 
  | 'dataPagamento';

type SortDirection = 'asc' | 'desc';

export const ContasAPagarTable: React.FC<ContasAPagarTableProps> = ({
  contas,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tipoFilter, setTipoFilter] = useState('ALL');
  const [fornecedorFilter, setFornecedorFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [centroCustoFilter, setCentroCustoFilter] = useState('');

  // Ordenação interativa
  const [sortField, setSortField] = useState<SortField>('vencimento');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTipoFilter('ALL');
    setFornecedorFilter('');
    setObraFilter('');
    setCategoriaFilter('');
    setCentroCustoFilter('');
  };

  const hasActiveFilters = Boolean(
    searchTerm || 
    (statusFilter && statusFilter !== 'ALL') || 
    (tipoFilter && tipoFilter !== 'ALL') || 
    fornecedorFilter || 
    obraFilter || 
    categoriaFilter || 
    centroCustoFilter
  );

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      const desc = (conta.descricao || '').toLowerCase();
      const forn = (conta.fornecedor || '').toLowerCase();
      const code = (conta.codigoBarras || '').toLowerCase();
      const st = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || desc.includes(st) || forn.includes(st) || code.includes(st);
      const matchesStatus = !statusFilter || statusFilter === 'ALL' || conta.status === statusFilter;
      const matchesTipo = !tipoFilter || tipoFilter === 'ALL' || conta.tipo === tipoFilter;
      const matchesFornecedor = !fornecedorFilter || forn.includes(fornecedorFilter.toLowerCase());
      const matchesObra = !obraFilter || (conta.obra || conta.cliente || '').toLowerCase().includes(obraFilter.toLowerCase());
      const matchesCategoria = !categoriaFilter || (conta.categoria || '').toLowerCase().includes(categoriaFilter.toLowerCase());
      const matchesCentroCusto = !centroCustoFilter || (conta.centroCusto || '').toLowerCase().includes(centroCustoFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesTipo && matchesFornecedor && matchesObra && matchesCategoria && matchesCentroCusto;
    });
  }, [contas, searchTerm, statusFilter, tipoFilter, fornecedorFilter, obraFilter, categoriaFilter, centroCustoFilter]);

  // Ordenar contas filtradas
  const sortedContas = useMemo(() => {
    return [...contasFiltradas].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'vencimento':
          aVal = a.vencimento ? new Date(a.vencimento).getTime() : 0;
          bVal = b.vencimento ? new Date(b.vencimento).getTime() : 0;
          break;
        case 'fornecedor':
          aVal = (a.fornecedor || '').toLowerCase();
          bVal = (b.fornecedor || '').toLowerCase();
          break;
        case 'descricao':
          aVal = (a.descricao || '').toLowerCase();
          bVal = (b.descricao || '').toLowerCase();
          break;
        case 'empresa':
          aVal = (a.companySigla || a.empresa || '').toLowerCase();
          bVal = (b.companySigla || b.empresa || '').toLowerCase();
          break;
        case 'obra':
          aVal = (a.obra || a.cliente || '').toLowerCase();
          bVal = (b.obra || b.cliente || '').toLowerCase();
          break;
        case 'categoria':
          aVal = (a.categoria || '').toLowerCase();
          bVal = (b.categoria || '').toLowerCase();
          break;
        case 'centroCusto':
          aVal = (a.centroCusto || '').toLowerCase();
          bVal = (b.centroCusto || '').toLowerCase();
          break;
        case 'tipo':
          aVal = (a.tipo || '').toLowerCase();
          bVal = (b.tipo || '').toLowerCase();
          break;
        case 'valor':
          aVal = a.valor || 0;
          bVal = b.valor || 0;
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        case 'baixa':
          aVal = a.baixa ? 1 : 0;
          bVal = b.baixa ? 1 : 0;
          break;
        case 'dataPagamento':
          aVal = a.dataPagamento ? new Date(a.dataPagamento).getTime() : 0;
          bVal = b.dataPagamento ? new Date(b.dataPagamento).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contasFiltradas, sortField, sortDirection]);

  const totalValorFiltrado = useMemo(() => {
    return sortedContas.reduce((acc, c) => acc + (Number(c.valor) || 0), 0);
  }, [sortedContas]);

  const renderSortHeader = (label: string, field: SortField, className: string = "") => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className={`text-zinc-200 font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-700/60 transition-colors select-none py-3.5 ${className}`}
        onClick={() => handleSort(field)}
        title={`Ordenar por ${label}`}
      >
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span>{label}</span>
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp size={14} className="text-amber-400 font-bold" />
            ) : (
              <ArrowDown size={14} className="text-amber-400 font-bold" />
            )
          ) : (
            <span className="text-zinc-600 opacity-50 group-hover:opacity-100">↕</span>
          )}
        </div>
      </TableHead>
    );
  };

  const getStatusBadge = (status: string, vencimento: Date | string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    const isVencida = (status === 'ABERTA' || status === 'ATRASADA') && isBefore(dataVenc, hoje);

    if (isVencida || status === 'VENCIDA') {
      return (
        <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 text-xs shadow-sm">
          <AlertTriangle size={12} className="text-rose-400" />
          Vencida
        </Badge>
      );
    }
    switch (status) {
      case 'PAGA':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 text-xs shadow-sm">
            <CheckCircle size={12} className="text-emerald-400" />
            Paga
          </Badge>
        );
      case 'ABERTA':
        return (
          <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 text-xs shadow-sm">
            <Clock size={12} className="text-sky-400" />
            Aberta
          </Badge>
        );
      case 'ATRASADA':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1.5 px-2.5 py-0.5 text-xs shadow-sm">
            <AlertTriangle size={12} className="text-amber-400" />
            Atrasada
          </Badge>
        );
      case 'CANCELADA':
        return (
          <Badge className="bg-zinc-800 text-zinc-400 border border-zinc-700 font-medium flex items-center gap-1.5 px-2.5 py-0.5 text-xs">
            <XCircle size={12} />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 px-2.5 py-0.5 text-xs">
            {status}
          </Badge>
        );
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'FIXA' 
      ? <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold text-xs">Fixa</Badge>
      : <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs">Variável</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const isVencendoEmBreve = (vencimento: Date | string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataVenc = new Date(vencimento);
    dataVenc.setHours(0, 0, 0, 0);
    const em7Dias = addDays(hoje, 7);
    return isAfter(dataVenc, hoje) && isBefore(dataVenc, em7Dias);
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/90 border-zinc-800 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-sm font-medium text-zinc-400">Carregando contas a pagar...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-zinc-900 border-zinc-800/80 shadow-2xl overflow-hidden rounded-2xl">
        {/* Top Header Card */}
        <CardHeader className="bg-gradient-to-r from-zinc-900 via-zinc-800/80 to-zinc-900 border-b border-zinc-800 p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-tight">
                <Receipt className="text-emerald-400 h-6 w-6" />
                Listagem de Contas a Pagar
              </CardTitle>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Exibindo <span className="text-white font-semibold">{sortedContas.length}</span> conta(s) • Total filtrado: <span className="text-emerald-400 font-bold font-mono">{formatCurrency(totalValorFiltrado)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-700"
                >
                  <X size={14} className="mr-1.5" />
                  Limpar Filtros
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/40 transition-colors text-xs font-semibold"
                onClick={() => {
                  const csvRows = [
                    ['Vencimento', 'Fornecedor', 'Descrição', 'Empresa', 'Obra/Setor', 'Plano de Contas', 'Centro de Custo', 'Tipo', 'Valor', 'Status', 'Data Pagamento'].join(';'),
                    ...sortedContas.map(c => [
                      c.vencimento ? format(new Date(c.vencimento), 'dd/MM/yyyy') : '',
                      `"${c.fornecedor || ''}"`,
                      `"${c.descricao || ''}"`,
                      `"${c.companySigla || c.empresa || ''}"`,
                      `"${c.obra || c.cliente || ''}"`,
                      `"${c.categoria || ''}"`,
                      `"${c.centroCusto || ''}"`,
                      c.tipo || '',
                      c.valor || 0,
                      c.status || '',
                      c.dataPagamento ? format(new Date(c.dataPagamento), 'dd/MM/yyyy') : ''
                    ].join(';'))
                  ];
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `contas-a-pagar-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
              >
                <Download size={15} className="mr-1.5" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Barra de Filtros Responsiva */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-zinc-800/80">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Buscar descrição/fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs focus:border-emerald-500 h-9 rounded-lg"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="Status: Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
                  <SelectItem value="ALL">Status: Todos</SelectItem>
                  <SelectItem value="ABERTA">Aberta</SelectItem>
                  <SelectItem value="PAGA">Paga</SelectItem>
                  <SelectItem value="VENCIDA">Vencida</SelectItem>
                  <SelectItem value="ATRASADA">Atrasada</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="Tipo: Todos" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs">
                  <SelectItem value="ALL">Tipo: Todos</SelectItem>
                  <SelectItem value="FIXA">Fixa</SelectItem>
                  <SelectItem value="VARIAVEL">Variável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                placeholder="Obra/Setor..."
                value={obraFilter}
                onChange={(e) => setObraFilter(e.target.value)}
                className="bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs focus:border-emerald-500 h-9 rounded-lg"
              />
            </div>

            <div>
              <Select value={categoriaFilter || 'ALL'} onValueChange={(v) => setCategoriaFilter(v === 'ALL' ? '' : v)}>
                <SelectTrigger className="bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs h-9 rounded-lg">
                  <SelectValue placeholder="Classificação: Todas" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100 text-xs max-h-[300px]">
                  <SelectItem value="ALL">Classificação: Todas</SelectItem>
                  {GRUPOS_CLASSIFICACAO.map(grupo => {
                    const itens = CLASSIFICACOES_PADRAO.filter(item => item.grupo === grupo.id);
                    if (itens.length === 0) return null;
                    return (
                      <div key={grupo.id} className="py-0.5">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase bg-zinc-950/60">
                          {grupo.label}
                        </div>
                        {itens.map(item => {
                          const val = `${item.codigo} - ${item.nome}`;
                          return (
                            <SelectItem key={val} value={val} className="text-xs pl-4">
                              [{item.codigo}] {item.nome}
                            </SelectItem>
                          );
                        })}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Input
                placeholder="Centro de Custo..."
                value={centroCustoFilter}
                onChange={(e) => setCentroCustoFilter(e.target.value)}
                className="bg-zinc-950/80 border-zinc-700 text-zinc-100 text-xs focus:border-emerald-500 h-9 rounded-lg"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* VISUALIZAÇÃO MOBILE (CARDS RESPONSIVOS) */}
          <div className="block lg:hidden divide-y divide-zinc-800">
            {sortedContas.map((conta) => {
              const venc = new Date(conta.vencimento);
              const vencida = (conta.status === 'ABERTA' || conta.status === 'ATRASADA') && isBefore(venc, new Date());
              const emBreve = isVencendoEmBreve(conta.vencimento);

              return (
                <div 
                  key={conta.id} 
                  className={`p-4 transition-all duration-200 hover:bg-zinc-800/50 ${
                    vencida ? 'bg-rose-950/15 border-l-4 border-l-rose-500' :
                    emBreve ? 'bg-amber-950/15 border-l-4 border-l-amber-500' :
                    'bg-zinc-900/60'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-base truncate">
                          {conta.fornecedor || 'Fornecedor Não Informado'}
                        </span>
                        {getStatusBadge(conta.status, conta.vencimento)}
                        {getTipoBadge(conta.tipo)}
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-2">
                        {conta.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <span className="text-base font-bold font-mono text-emerald-400 block">
                        {formatCurrency(conta.valor)}
                      </span>
                      <span className={`text-xs font-medium flex items-center justify-end gap-1 mt-0.5 ${
                        vencida ? 'text-rose-400' : emBreve ? 'text-amber-400' : 'text-zinc-400'
                      }`}>
                        <Calendar size={12} />
                        {format(venc, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-zinc-800/80 text-xs text-zinc-400">
                    {(conta.companySigla || conta.empresa) && (
                      <span className="inline-flex items-center gap-1 bg-zinc-800 px-2 py-0.5 rounded text-zinc-200 border border-zinc-700">
                        <Building2 size={11} className="text-zinc-400" />
                        {conta.companySigla || conta.empresa}
                      </span>
                    )}
                    {(conta.obra || conta.cliente) && (
                      <span className="inline-flex items-center gap-1 bg-sky-950/50 px-2 py-0.5 rounded text-sky-300 border border-sky-800/40">
                        <Tag size={11} className="text-sky-400" />
                        {conta.obra || conta.cliente}
                      </span>
                    )}
                    {conta.categoria && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border font-medium ${getClassificacaoStyle(conta.categoria).bg} ${getClassificacaoStyle(conta.categoria).text} ${getClassificacaoStyle(conta.categoria).border}`}>
                        <Tag size={11} />
                        {conta.categoria}
                      </span>
                    )}
                    {conta.centroCusto && (
                      <span className="inline-flex items-center gap-1 bg-purple-950/50 px-2 py-0.5 rounded text-purple-300 border border-purple-800/40">
                        CC: {conta.centroCusto}
                      </span>
                    )}
                  </div>

                  {/* Ações Mobile */}
                  <div className="flex justify-end items-center gap-1 mt-3 pt-2 border-t border-zinc-800/60">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onView(conta)} 
                      className="text-zinc-300 hover:text-sky-400 hover:bg-sky-500/10 h-8 px-2.5 text-xs gap-1"
                    >
                      <Eye size={14} />
                      Ver
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(conta)} 
                      className="text-zinc-300 hover:text-amber-400 hover:bg-amber-500/10 h-8 px-2.5 text-xs gap-1"
                    >
                      <Edit size={14} />
                      Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(conta.id!)}
                      className="text-zinc-300 hover:text-rose-400 hover:bg-rose-500/10 h-8 px-2.5 text-xs gap-1"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* VISUALIZAÇÃO DESKTOP (TABELA MODERNA) */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 bg-zinc-950/90 sticky top-0 z-10">
                  {renderSortHeader('Vencimento', 'vencimento')}
                  {renderSortHeader('Fornecedor', 'fornecedor')}
                  {renderSortHeader('Descrição', 'descricao')}
                  {renderSortHeader('Empresa', 'empresa')}
                  {renderSortHeader('Obra / Setor', 'obra')}
                  {renderSortHeader('Classificação', 'categoria')}
                  {renderSortHeader('Centro de Custo', 'centroCusto')}
                  {renderSortHeader('Tipo', 'tipo')}
                  {renderSortHeader('Valor', 'valor')}
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Baixa', 'baixa', 'text-center')}
                  {renderSortHeader('Dt. Pagamento', 'dataPagamento')}
                  <TableHead className="text-zinc-200 font-bold text-xs uppercase tracking-wider text-center py-3.5">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedContas.map((conta) => {
                  const venc = new Date(conta.vencimento);
                  const vencida = (conta.status === 'ABERTA' || conta.status === 'ATRASADA') && isBefore(venc, new Date());
                  const emBreve = isVencendoEmBreve(conta.vencimento);

                  return (
                    <TableRow 
                      key={conta.id} 
                      className={`
                        border-zinc-800/80 hover:bg-zinc-800/70 transition-colors duration-150
                        ${vencida ? 'bg-rose-950/15' : ''}
                        ${emBreve && conta.status === 'ABERTA' ? 'bg-amber-950/15' : ''}
                      `}
                    >
                      <TableCell className="whitespace-nowrap py-3">
                        <div className="flex items-center gap-1.5">
                          {vencida && <AlertTriangle size={15} className="text-rose-400 shrink-0" />}
                          {emBreve && conta.status === 'ABERTA' && <AlertTriangle size={15} className="text-amber-400 shrink-0" />}
                          <span className={`font-semibold text-xs ${
                            vencida ? 'text-rose-300 font-bold' :
                            emBreve && conta.status === 'ABERTA' ? 'text-amber-300 font-bold' :
                            'text-zinc-200'
                          }`}>
                            {format(venc, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="font-bold text-white whitespace-nowrap text-xs max-w-[200px] truncate">
                        {conta.fornecedor || '-'}
                      </TableCell>

                      <TableCell className="text-zinc-300 text-xs">
                        <div className="max-w-xs truncate font-medium" title={conta.descricao}>
                          {conta.descricao || '-'}
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold text-zinc-200 whitespace-nowrap text-xs">
                        {conta.companySigla || conta.empresa || '-'}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs">
                        {conta.obra ? (
                          <span className="font-semibold text-sky-300">{conta.obra}</span>
                        ) : conta.cliente ? (
                          <span className="text-zinc-300">{conta.cliente}</span>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs">
                        {conta.categoria ? (
                          <Badge variant="outline" className={`font-medium text-[11px] border ${getClassificacaoStyle(conta.categoria).bg} ${getClassificacaoStyle(conta.categoria).text} ${getClassificacaoStyle(conta.categoria).border}`}>
                            {conta.categoria}
                          </Badge>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs">
                        {conta.centroCusto ? (
                          <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-950/40 font-medium text-[11px]">
                            {conta.centroCusto}
                          </Badge>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{getTipoBadge(conta.tipo)}</TableCell>

                      <TableCell className="font-bold text-emerald-400 font-mono whitespace-nowrap text-xs tracking-tight">
                        {formatCurrency(conta.valor)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{getStatusBadge(conta.status, conta.vencimento)}</TableCell>

                      <TableCell className="text-center whitespace-nowrap">
                        {conta.baixa ? (
                          <CheckCircle size={17} className="text-emerald-400 inline-block" />
                        ) : (
                          <XCircle size={17} className="text-zinc-600 inline-block" />
                        )}
                      </TableCell>

                      <TableCell className="text-zinc-300 whitespace-nowrap text-xs font-medium">
                        {conta.dataPagamento ? format(new Date(conta.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>

                      <TableCell className="text-center whitespace-nowrap py-2">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onView(conta)} 
                            className="text-zinc-400 hover:text-sky-300 hover:bg-sky-500/15 p-1 h-8 w-8 rounded-lg transition-colors"
                            title="Visualizar Detalhes"
                          >
                            <Eye size={15} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEdit(conta)} 
                            className="text-zinc-400 hover:text-amber-300 hover:bg-amber-500/15 p-1 h-8 w-8 rounded-lg transition-colors"
                            title="Editar Conta"
                          >
                            <Edit size={15} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onDelete(conta.id!)}
                            className="text-zinc-400 hover:text-rose-300 hover:bg-rose-500/15 p-1 h-8 w-8 rounded-lg transition-colors"
                            title="Excluir Conta"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {sortedContas.length === 0 && (
            <div className="text-center py-16 px-4 bg-zinc-900/50">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                  <Receipt className="w-7 h-7 text-zinc-400" />
                </div>
                <p className="text-white text-base font-bold">Nenhuma conta a pagar encontrada</p>
                <p className="text-zinc-400 text-xs max-w-sm">
                  Não há registros para os filtros selecionados ou para o período ativo.
                </p>
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearAllFilters}
                    className="mt-2 text-xs border-zinc-700 text-zinc-200 hover:bg-zinc-800"
                  >
                    Limpar Filtros de Busca
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};