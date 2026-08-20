import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Plus,
  User,
  Package,
  Calendar,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Download,
  Trash2,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StockMovement, MovementType, MovementReason, MovementTypeLabels, MovementReasonLabels } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockMovementsTableProps {
  onCreateMovement: () => void;
  onRefresh: () => void;
}

type SortKey = 'movementDate' | 'stockItemName' | 'movementType' | 'reason' | 'quantity' | 'employeeName' | 'userName';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
  onCreateMovement,
  onRefresh
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'movementDate', direction: 'desc' });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (searchTerm) filters.searchTerm = searchTerm;
      if (typeFilter !== 'all') filters.movementType = typeFilter as MovementType;
      if (reasonFilter !== 'all') filters.reason = reasonFilter as MovementReason;
      if (startDate) filters.startDate = new Date(startDate).toISOString();
      if (endDate) filters.endDate = new Date(endDate).toISOString();
      
      const result = await stockService.searchMovements(filters, 0, 1000);
      setMovements(result.content);
      setTotalElements(result.totalElements || result.content.length);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar movimentações.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMovements();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setReasonFilter('all');
    setStartDate('');
    setEndDate('');
    setSelectedItems(new Set());
    loadMovements();
  };

  const handleRefresh = () => {
    setSelectedItems(new Set());
    onRefresh();
    loadMovements();
  };

  const getMovementBadge = (movement: StockMovement) => {
    if (movement.movementType === MovementType.ENTRADA) {
      return <Badge variant="default" className="bg-green-600">Entrada</Badge>;
    } else {
      return <Badge variant="secondary" className="border-red-500 text-red-600">Saída</Badge>;
    }
  };

  const getMovementIcon = (type: MovementType) => {
    return type === MovementType.ENTRADA ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon: React.FC<{ columnKey: SortKey }> = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="h-3.5 w-3.5 inline ml-1 opacity-40" />;
    }
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 inline ml-1 text-seguranca-yellow" />
      : <ArrowDown className="h-3.5 w-3.5 inline ml-1 text-seguranca-yellow" />;
  };

  const SortableHead: React.FC<{ columnKey: SortKey; children: React.ReactNode; className?: string }> = ({ columnKey, children, className }) => (
    <TableHead
      className={`cursor-pointer select-none text-seguranca-lightgray hover:text-white transition-colors ${className || ''}`}
      onClick={() => handleSort(columnKey)}
    >
      {children}
      <SortIcon columnKey={columnKey} />
    </TableHead>
  );

  const filteredMovements = useMemo(() => {
    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    return [...movements].sort((a, b) => {
      let result = 0;
      switch (key) {
        case 'movementDate':
          result = new Date(a.movementDate).getTime() - new Date(b.movementDate).getTime();
          break;
        case 'stockItemName':
          result = (a.stockItemName || '').localeCompare(b.stockItemName || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'movementType':
          result = (a.movementType || '').localeCompare(b.movementType || '', 'pt-BR');
          break;
        case 'reason':
          result = (MovementReasonLabels[a.reason] || a.reason || '').localeCompare(MovementReasonLabels[b.reason] || b.reason || '', 'pt-BR');
          break;
        case 'quantity':
          result = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'employeeName':
          result = (a.employeeName || '').localeCompare(b.employeeName || '', 'pt-BR', { sensitivity: 'base' });
          break;
        case 'userName':
          result = (a.userName || '').localeCompare(b.userName || '', 'pt-BR', { sensitivity: 'base' });
          break;
      }
      return result * dir;
    });
  }, [movements, sortConfig]);

  // ===== SELEÇÃO =====

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredMovements.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  // ===== EXCLUSÃO =====

  const handleBulkDelete = async (ids?: string[]) => {
    const targetIds = ids ?? Array.from(selectedItems);
    if (targetIds.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhuma movimentação selecionada para exclusão",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${targetIds.length} movimentação(ões)?\nO saldo de estoque dos itens será ajustado de volta. Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      const result = await stockService.deleteMovements(targetIds);
      const deleted = result?.deleted ?? 0;
      const failed = targetIds.length - deleted;

      if (failed > 0) {
        toast({
          title: "Exclusão parcial",
          description: `${deleted} excluída(s), ${failed} não puderam ser excluídas (verifique se o saldo permite).`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: `${deleted} movimentação(ões) excluída(s) e estoque ajustado.`,
        });
      }

      setSelectedItems(new Set());
      loadMovements();
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir movimentações em lote:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Erro ao excluir movimentações';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  // ===== EXPORTAÇÃO =====

  const handleExport = (onlySelected: boolean) => {
    try {
      const itemsToExport = onlySelected
        ? filteredMovements.filter(item => selectedItems.has(item.id))
        : filteredMovements;

      if (itemsToExport.length === 0) {
        toast({
          title: "Nenhuma movimentação para exportar",
          description: onlySelected
            ? "Selecione pelo menos uma movimentação para exportar"
            : "Não há movimentações para exportar",
          variant: "default"
        });
        return;
      }

      const dadosExportacao = itemsToExport.map(item => ({
        'Data': item.movementDate ? format(new Date(item.movementDate), 'dd/MM/yyyy', { locale: ptBR }) : '',
        'Hora': item.movementDate ? format(new Date(item.movementDate), 'HH:mm', { locale: ptBR }) : '',
        'Item': item.stockItemName || '',
        'Código': item.stockItemCode || '',
        'Tipo': item.movementType === MovementType.ENTRADA ? 'Entrada' : 'Saída',
        'Motivo': MovementReasonLabels[item.reason] || item.reason || '',
        'Quantidade': item.quantity,
        'Estoque Anterior': item.previousQuantity,
        'Estoque Novo': item.newQuantity,
        'Funcionário': item.employeeName || '',
        'Usuário': item.userName || '',
        'Documento': item.documentNumber || ''
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      ws['!cols'] = [
        { wch: 12 }, // Data
        { wch: 8 },  // Hora
        { wch: 30 }, // Item
        { wch: 16 }, // Código
        { wch: 10 }, // Tipo
        { wch: 24 }, // Motivo
        { wch: 10 }, // Quantidade
        { wch: 14 }, // Estoque Anterior
        { wch: 12 }, // Estoque Novo
        { wch: 22 }, // Funcionário
        { wch: 20 }, // Usuário
        { wch: 16 }  // Documento
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');

      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `estoque_movimentacoes_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportação realizada!",
        description: `${itemsToExport.length} movimentação(ões) exportada(s) para ${filename}`,
      });
    } catch (error) {
      console.error('Erro ao exportar movimentações:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar as movimentações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const allChecked = filteredMovements.length > 0 && selectedItems.size === filteredMovements.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-seguranca-lightgray">Movimentações de Estoque</h2>
          <p className="text-gray-400">
            Histórico completo de entradas e saídas
          </p>
        </div>
        <Button onClick={onCreateMovement} className="bg-seguranca-red hover:bg-seguranca-darkred">
          <Plus className="h-4 w-4 mr-2" />
          Nova Movimentação
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Item, funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(MovementTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Motivo</label>
              <Select value={reasonFilter} onValueChange={setReasonFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os motivos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os motivos</SelectItem>
                  {Object.entries(MovementReasonLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Inicial</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Data Final</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-seguranca-black border-gray-600 text-seguranca-lightgray"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Ações</label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading} className="bg-seguranca-red hover:bg-seguranca-darkred">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={clearFilters} className="border-gray-600 text-seguranca-lightgray">
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <p className="text-sm text-gray-400">
              {totalElements} movimentação(ões) encontrada(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(false)}
                className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="border-gray-600 text-seguranca-lightgray">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de ações em lote */}
      {selectedItems.size > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-seguranca-lightgray font-medium">
                {selectedItems.size} movimentação(ões) selecionada(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
                className="border-gray-600 text-gray-400 hover:bg-gray-700 text-xs"
              >
                Limpar Seleção
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport(true)}
                className="border-green-600 text-green-500 hover:bg-green-600 hover:text-white"
              >
                <Download size={16} className="mr-2" />
                Exportar Selecionadas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDelete()}
                disabled={deleting}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                {deleting ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Trash2 size={16} className="mr-2" />
                )}
                Excluir Selecionadas
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-seguranca-yellow mb-4" />
              <p className="text-seguranca-lightgray">Carregando movimentações...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Nenhuma movimentação encontrada
              </h3>
              <p className="text-gray-400 mb-4">
                Não há movimentações que correspondam aos filtros selecionados.
              </p>
              <Button onClick={onCreateMovement} className="bg-seguranca-red hover:bg-seguranca-darkred">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Movimentação
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      checked={allChecked}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos"
                      className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                    />
                  </TableHead>
                  <SortableHead columnKey="movementDate">Data/Hora</SortableHead>
                  <SortableHead columnKey="stockItemName">Item</SortableHead>
                  <SortableHead columnKey="movementType">Tipo</SortableHead>
                  <SortableHead columnKey="reason">Motivo</SortableHead>
                  <SortableHead columnKey="quantity">Quantidade</SortableHead>
                  <SortableHead columnKey="employeeName">Funcionário</SortableHead>
                  <SortableHead columnKey="userName">Usuário</SortableHead>
                  <TableHead className="text-seguranca-lightgray">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement) => (
                  <TableRow key={movement.id} className={`border-gray-600 hover:bg-seguranca-black/50 ${selectedItems.has(movement.id) ? 'bg-seguranca-black/30' : ''}`}>
                    <TableCell className="w-10 text-center">
                      <Checkbox
                        checked={selectedItems.has(movement.id)}
                        onCheckedChange={(checked) => handleSelectItem(movement.id, checked as boolean)}
                        aria-label={`Selecionar movimentação de ${movement.stockItemName}`}
                        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-seguranca-lightgray font-medium">
                            {format(new Date(movement.movementDate), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(movement.movementDate), 'HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-seguranca-lightgray">{movement.stockItemName}</p>
                          <p className="text-xs text-gray-400">{movement.stockItemCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.movementType)}
                        {getMovementBadge(movement)}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {MovementReasonLabels[movement.reason]}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <p className={`font-bold ${
                          movement.movementType === MovementType.ENTRADA ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {movement.movementType === MovementType.ENTRADA ? '+' : '-'}{movement.quantity}
                        </p>
                        <p className="text-xs text-gray-400">
                          {movement.previousQuantity} → {movement.newQuantity}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {movement.employeeName ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-seguranca-lightgray">{movement.employeeName}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-seguranca-lightgray">{movement.userName || '-'}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBulkDelete([movement.id])}
                          disabled={deleting}
                          className="text-red-500 hover:bg-seguranca-black"
                          title="Excluir movimentação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementsTable;
