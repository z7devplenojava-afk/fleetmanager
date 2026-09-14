import React, { useState } from 'react';
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
  ArrowUpDown,
  Building2,
  Tag
} from 'lucide-react';
import { ContaAPagar } from './ContasAPagarFormModal';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [fornecedorFilter, setFornecedorFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [centroCustoFilter, setCentroCustoFilter] = useState('');

  // Ordenação interativa (ASC / DESC)
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

  // Filtrar contas
  const contasFiltradas = contas.filter(conta => {
    const matchesSearch = 
      conta.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.fornecedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.codigoBarras?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'ALL' || conta.status === statusFilter;
    const matchesTipo = !tipoFilter || tipoFilter === 'ALL' || conta.tipo === tipoFilter;
    const matchesFornecedor = !fornecedorFilter || conta.fornecedor.toLowerCase().includes(fornecedorFilter.toLowerCase());
    const matchesObra = !obraFilter || (conta.obra || conta.cliente || '').toLowerCase().includes(obraFilter.toLowerCase());
    const matchesCategoria = !categoriaFilter || (conta.categoria || '').toLowerCase().includes(categoriaFilter.toLowerCase());
    const matchesCentroCusto = !centroCustoFilter || (conta.centroCusto || '').toLowerCase().includes(centroCustoFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesTipo && matchesFornecedor && matchesObra && matchesCategoria && matchesCentroCusto;
  });

  // Ordenar contas filtradas
  const sortedContas = [...contasFiltradas].sort((a, b) => {
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

  const renderSortHeader = (label: string, field: SortField) => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className="text-gray-200 font-semibold cursor-pointer hover:bg-gray-600/70 transition-colors select-none py-3"
        onClick={() => handleSort(field)}
        title={`Clique para ordenar por ${label} (${isActive && sortDirection === 'asc' ? 'Decrescente' : 'Crescente'})`}
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
            <ArrowUpDown size={14} className="text-gray-400 opacity-60 hover:opacity-100" />
          )}
        </div>
      </TableHead>
    );
  };

  const getStatusBadge = (status: string, vencimento: Date) => {
    if ((status === 'ABERTA' || status === 'ATRASADA') && isBefore(vencimento, new Date())) {
      return <Badge className="bg-seguranca-red text-white flex items-center gap-1">
        <AlertTriangle size={12} />
        Vencida
      </Badge>;
    }

    switch (status) {
      case 'PAGA':
        return <Badge className="bg-green-600 text-white flex items-center gap-1">
          <CheckCircle size={12} />
          Paga
        </Badge>;
      case 'ABERTA':
        return <Badge className="bg-seguranca-lightgray text-seguranca-black flex items-center gap-1">
          <Clock size={12} />
          Aberta
        </Badge>;
      case 'ATRASADA':
        return <Badge className="bg-seguranca-yellow text-seguranca-black flex items-center gap-1">
          <AlertTriangle size={12} />
          Atrasada
        </Badge>;
      case 'CANCELADA':
        return <Badge className="bg-seguranca-graphite text-seguranca-lightgray border border-gray-600 flex items-center gap-1">
          <XCircle size={12} />
          Cancelada
        </Badge>;
      default:
        return <Badge className="bg-seguranca-lightgray text-seguranca-black">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'FIXA' 
      ? <Badge className="bg-seguranca-yellow text-seguranca-black font-semibold">Fixa</Badge>
      : <Badge className="bg-seguranca-graphite text-seguranca-lightgray border border-gray-600">Variável</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isVencendoEmBreve = (vencimento: Date) => {
    const hoje = new Date();
    const em7Dias = addDays(hoje, 7);
    return isAfter(vencimento, hoje) && isBefore(vencimento, em7Dias);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando contas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Listagem de Contas */}
      <Card className="bg-gray-800 border-gray-700 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-600 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-white flex items-center gap-2 text-xl font-bold">
              <Calendar size={22} className="text-amber-400" />
              Listagem de Contas a Pagar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 transition-colors"
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
                <Download size={16} className="mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>

          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-600/50">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar descrição/fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-900 border-gray-600 text-gray-200 text-xs focus:border-amber-400"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200 text-xs">
                  <SelectValue placeholder="Status: Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600 text-gray-200 text-xs">
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
                <SelectTrigger className="bg-gray-900 border-gray-600 text-gray-200 text-xs">
                  <SelectValue placeholder="Tipo: Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-600 text-gray-200 text-xs">
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
                className="bg-gray-900 border-gray-600 text-gray-200 text-xs focus:border-amber-400"
              />
            </div>

            <div>
              <Input
                placeholder="Plano de Contas..."
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="bg-gray-900 border-gray-600 text-gray-200 text-xs focus:border-amber-400"
              />
            </div>

            <div>
              <Input
                placeholder="Centro de Custo..."
                value={centroCustoFilter}
                onChange={(e) => setCentroCustoFilter(e.target.value)}
                className="bg-gray-900 border-gray-600 text-gray-200 text-xs focus:border-amber-400"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="bg-gray-800 p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600 bg-gray-700">
                  {renderSortHeader('Vencimento', 'vencimento')}
                  {renderSortHeader('Fornecedor', 'fornecedor')}
                  {renderSortHeader('Descrição', 'descricao')}
                  {renderSortHeader('Empresa', 'empresa')}
                  {renderSortHeader('Obra / Setor', 'obra')}
                  {renderSortHeader('Plano de Contas', 'categoria')}
                  {renderSortHeader('Centro de Custo', 'centroCusto')}
                  {renderSortHeader('Tipo', 'tipo')}
                  {renderSortHeader('Valor', 'valor')}
                  {renderSortHeader('Status', 'status')}
                  {renderSortHeader('Baixa', 'baixa')}
                  {renderSortHeader('Dt. Pagamento', 'dataPagamento')}
                  <TableHead className="text-gray-200 font-semibold text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedContas.map((conta) => (
                  <TableRow 
                    key={conta.id} 
                    className={`
                      border-gray-600 hover:bg-gray-700/80 transition-colors duration-150
                      ${isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                      ${isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' ? 'bg-red-500/10 border-red-500/30' : ''}
                    `}
                  >
                    <TableCell className="text-gray-300 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' && (
                          <AlertTriangle size={16} className="text-yellow-500" />
                        )}
                        {isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' && (
                          <AlertTriangle size={16} className="text-red-500" />
                        )}
                        <span className={`
                          ${isBefore(conta.vencimento, new Date()) && conta.status === 'ABERTA' ? 'text-red-400 font-medium' : 'text-gray-300'}
                          ${isVencendoEmBreve(conta.vencimento) && conta.status === 'ABERTA' ? 'text-yellow-400' : ''}
                        `}>
                          {format(conta.vencimento, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-gray-200 whitespace-nowrap">{conta.fornecedor}</TableCell>

                    <TableCell className="text-gray-300">
                      <div className="max-w-xs truncate" title={conta.descricao}>
                        {conta.descricao}
                      </div>
                    </TableCell>

                    <TableCell className="font-medium text-gray-200 whitespace-nowrap">{conta.companySigla || conta.empresa || '-'}</TableCell>

                    {/* Obra / Setor de Trabalho */}
                    <TableCell className="text-gray-300 whitespace-nowrap">
                      {conta.obra ? (
                        <span className="font-medium text-blue-300">{conta.obra}</span>
                      ) : conta.cliente ? (
                        <span className="text-gray-300">{conta.cliente}</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>

                    {/* Plano de Contas (Categoria) */}
                    <TableCell className="text-gray-300 whitespace-nowrap">
                      {conta.categoria ? (
                        <Badge variant="outline" className="border-gray-500 text-gray-300 bg-gray-900/60 font-medium">
                          {conta.categoria}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>

                    {/* Centro de Custo */}
                    <TableCell className="text-gray-300 whitespace-nowrap">
                      {conta.centroCusto ? (
                        <Badge variant="outline" className="border-purple-500/40 text-purple-300 bg-purple-950/40 font-medium">
                          {conta.centroCusto}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap">{getTipoBadge(conta.tipo)}</TableCell>

                    <TableCell className="font-semibold text-amber-300 whitespace-nowrap">{formatCurrency(conta.valor)}</TableCell>

                    <TableCell className="whitespace-nowrap">{getStatusBadge(conta.status, conta.vencimento)}</TableCell>

                    <TableCell className="text-center whitespace-nowrap">
                      {conta.baixa ? (
                        <CheckCircle size={16} className="text-green-500 inline-block" />
                      ) : (
                        <XCircle size={16} className="text-gray-500 inline-block" />
                      )}
                    </TableCell>

                    <TableCell className="text-gray-300 whitespace-nowrap">
                      {conta.dataPagamento ? format(new Date(conta.dataPagamento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                    </TableCell>

                    <TableCell className="text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onView(conta)} 
                          className="text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 p-1.5 h-8 w-8"
                          title="Visualizar Detalhes"
                        >
                          <Eye size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onEdit(conta)} 
                          className="text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 p-1.5 h-8 w-8"
                          title="Editar Conta"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onDelete(conta.id!)}
                          className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 h-8 w-8"
                          title="Excluir Conta"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {sortedContas.length === 0 && (
              <div className="text-center py-12 bg-gray-800">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-300 text-lg font-medium">Nenhuma conta encontrada</p>
                    <p className="text-gray-500 text-sm mt-1">Ajuste os filtros para ver mais resultados</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};