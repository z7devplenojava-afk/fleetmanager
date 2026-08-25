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
  Edit, 
  TrendingUp, 
  Package,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Loader2,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StockItem, StockCategory, StockCategoryLabels } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';

interface StockItemsTableProps {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onCreateMovement: (item: StockItem) => void;
  onRefresh: () => void;
}

type SortKey = 'code' | 'name' | 'category' | 'currentQuantity' | 'status' | 'createdAt' | 'movementCount' | 'unitCost' | 'averageCost';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

const StockItemsTable: React.FC<StockItemsTableProps> = ({
  items: initialItems,
  onEdit,
  onCreateMovement,
  onRefresh
}) => {
  const [items, setItems] = useState<StockItem[]>(Array.isArray(initialItems) ? initialItems : []);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [initialItems]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      
      if (searchTerm) filters.searchTerm = searchTerm;
      if (categoryFilter !== 'all') filters.category = categoryFilter as StockCategory;
      if (lowStockFilter === 'true') filters.lowStock = true;
      
      const result = await stockService.searchItems(filters);
      setItems(result.content);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao buscar itens.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setLowStockFilter('all');
    setItems(initialItems);
    setSelectedItems(new Set());
  };

  const getStatusKey = (item: StockItem): 'sem_estoque' | 'baixo' | 'normal' => {
    if (item.currentQuantity === 0) return 'sem_estoque';
    if (item.isLowStock) return 'baixo';
    return 'normal';
  };

  const getStatusLabel = (item: StockItem): string => {
    const labels: Record<string, string> = {
      sem_estoque: 'Sem Estoque',
      baixo: 'Baixo Estoque',
      normal: 'Normal'
    };
    return labels[getStatusKey(item)];
  };

  const getStockBadge = (item: StockItem) => {
    const key = getStatusKey(item);
    if (key === 'sem_estoque') {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    } else if (key === 'baixo') {
      return <Badge variant="secondary" className="border-orange-500 text-orange-600">Baixo Estoque</Badge>;
    } else {
      return <Badge variant="default" className="bg-green-600">Normal</Badge>;
    }
  };

  const getStatusValue = (item: StockItem): number => {
    const values: Record<string, number> = { sem_estoque: 0, baixo: 1, normal: 2 };
    return values[getStatusKey(item)];
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

  const filteredItems = useMemo(() => {
    const filtered = (Array.isArray(items) ? items : []).filter(item => {
      const matchesSearch = !searchTerm || 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesLowStock = lowStockFilter === 'all' || 
        (lowStockFilter === 'true' && item.isLowStock) ||
        (lowStockFilter === 'false' && !item.isLowStock);

      return matchesSearch && matchesCategory && matchesLowStock;
    });

    const { key, direction } = sortConfig;
    const dir = direction === 'asc' ? 1 : -1;

    return [...filtered].sort((a, b) => {
      let result = 0;
      switch (key) {
        case 'name':
          result = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'code':
          result = a.code.localeCompare(b.code, 'pt-BR', { sensitivity: 'base' });
          break;
        case 'category':
          result = (StockCategoryLabels[a.category] || a.category).localeCompare(StockCategoryLabels[b.category] || b.category, 'pt-BR');
          break;
        case 'currentQuantity':
          result = (a.currentQuantity || 0) - (b.currentQuantity || 0);
          break;
        case 'status':
          result = getStatusValue(a) - getStatusValue(b);
          break;
        case 'createdAt':
          result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'movementCount':
          result = (a.movementCount || 0) - (b.movementCount || 0);
          break;
        case 'unitCost':
          result = (a.unitCost || 0) - (b.unitCost || 0);
          break;
        case 'averageCost':
          result = (a.averageCost || 0) - (b.averageCost || 0);
          break;
      }
      return result * dir;
    });
  }, [items, searchTerm, categoryFilter, lowStockFilter, sortConfig]);

  // ===== SELEÇÃO =====

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
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

  const handleExport = (onlySelected: boolean) => {
    try {
      const itemsToExport = onlySelected
        ? filteredItems.filter(item => selectedItems.has(item.id))
        : filteredItems;

      if (itemsToExport.length === 0) {
        toast({
          title: "Nenhum item para exportar",
          description: onlySelected
            ? "Selecione pelo menos um item para exportar"
            : "Não há itens para exportar",
          variant: "default"
        });
        return;
      }

      const dadosExportacao = itemsToExport.map(item => ({
        'Código': item.code,
        'Item': item.fullName || item.name,
        'Categoria': StockCategoryLabels[item.category] || item.category,
        'Estoque': item.currentQuantity,
        'Mínimo': item.minimumQuantity,
        'Status': getStatusLabel(item),
        'Vr. Compra': item.unitCost ?? '',
        'Custo Médio': item.averageCost ?? '',
        'Cadastro': item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '',
        'Movimentações': item.movementCount ?? 0
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      ws['!cols'] = [
        { wch: 16 }, // Código
        { wch: 30 }, // Item
        { wch: 22 }, // Categoria
        { wch: 10 }, // Estoque
        { wch: 10 }, // Mínimo
        { wch: 14 }, // Status
        { wch: 12 }, // Vr. Compra
        { wch: 12 }, // Custo Médio
        { wch: 12 }, // Cadastro
        { wch: 14 }  // Movimentações
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Itens de Estoque');

      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `estoque_itens_${timestamp}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportação realizada!",
        description: `${itemsToExport.length} item(ns) exportado(s) para ${filename}`,
      });
    } catch (error) {
      console.error('Erro ao exportar itens:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar os itens. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async (ids?: string[] | React.MouseEvent) => {
    const isArrayArg = Array.isArray(ids);
    const targetIds = isArrayArg
      ? (ids as string[])
      : Array.from(selectedItems);
    if (targetIds.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum item selecionado para exclusão",
        variant: "destructive"
      });
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir ${targetIds.length} item(ns)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeleting(true);
    try {
      const selectedIds = targetIds;
      const results = await Promise.allSettled(
        selectedIds.map(id => stockService.deleteItem(id))
      );

      const failed = results.filter(r => r.status === 'rejected').length;
      const succeeded = selectedIds.length - failed;

      if (failed > 0) {
        toast({
          title: "Exclusão parcial",
          description: `${succeeded} excluído(s), ${failed} falharam.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso",
          description: `${succeeded} item(ns) excluído(s) com sucesso.`,
        });
      }

      setSelectedItems(new Set());
      onRefresh();
    } catch (error: any) {
      console.error('Erro ao excluir em lote:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao excluir itens';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  const allChecked = filteredItems.length > 0 && selectedItems.size === filteredItems.length;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-seguranca-lightgray">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome, código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(StockCategoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Estoque</label>
              <Select value={lowStockFilter} onValueChange={setLowStockFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os itens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os itens</SelectItem>
                  <SelectItem value="true">Baixo estoque</SelectItem>
                  <SelectItem value="false">Estoque normal</SelectItem>
                </SelectContent>
              </Select>
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
              {filteredItems.length} item(ns) encontrado(s)
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
              <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-600 text-seguranca-lightgray">
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
                {selectedItems.size} item(ns) selecionado(s)
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
                Exportar Selecionados
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
                Excluir Selecionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0 overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-400 mb-4">
                Não há itens que correspondam aos filtros selecionados.
              </p>
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
                  <SortableHead columnKey="code">Código</SortableHead>
                  <SortableHead columnKey="name">Item</SortableHead>
                  <SortableHead columnKey="category">Categoria</SortableHead>
                  <SortableHead columnKey="currentQuantity">Estoque</SortableHead>
                  <SortableHead columnKey="status">Status</SortableHead>
                  <SortableHead columnKey="unitCost">Vr. Compra</SortableHead>
                  <SortableHead columnKey="averageCost">Custo Médio</SortableHead>
                  <SortableHead columnKey="createdAt">Cadastro</SortableHead>
                  <SortableHead columnKey="movementCount">Mov.</SortableHead>
                  <TableHead className="text-seguranca-lightgray">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className={`border-gray-600 hover:bg-seguranca-black/50 ${selectedItems.has(item.id) ? 'bg-seguranca-black/30' : ''}`}>
                    <TableCell className="w-10 text-center">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        aria-label={`Selecionar item ${item.code}`}
                        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                      />
                    </TableCell>
                    
                    <TableCell className="text-seguranca-lightgray font-mono">
                      {item.code}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <p className="font-medium text-seguranca-lightgray">{item.name}</p>
                        {item.sizeVariation && (
                          <p className="text-sm text-gray-400">Tamanho: {item.sizeVariation}</p>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {StockCategoryLabels[item.category]}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-center">
                        <p className="font-bold text-seguranca-lightgray">{item.currentQuantity}</p>
                        <p className="text-xs text-gray-400">Mín: {item.minimumQuantity}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStockBadge(item)}
                    </TableCell>
                    
                    <TableCell className="text-seguranca-lightgray">
                      {item.unitCost ? `R$ ${item.unitCost.toFixed(2)}` : '-'}
                    </TableCell>
                    
                    <TableCell className="text-seguranca-lightgray">
                      {item.averageCost ? `R$ ${item.averageCost.toFixed(2)}` : '-'}
                    </TableCell>
                    
                    <TableCell className="text-seguranca-lightgray">
                      <span className="text-xs text-gray-400">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}
                      </span>
                    </TableCell>
                    
                    <TableCell className="text-center text-seguranca-lightgray">
                      <span className="text-sm font-mono">{item.movementCount ?? 0}</span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="text-seguranca-lightgray hover:bg-seguranca-black"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCreateMovement(item)}
                          className="text-seguranca-yellow hover:bg-seguranca-black"
                          title="Movimentação"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBulkDelete([item.id])}
                          className="text-red-500 hover:bg-seguranca-black"
                          title="Excluir"
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

export default StockItemsTable;
