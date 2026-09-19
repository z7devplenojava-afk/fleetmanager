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
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Shield
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

// Helper para normalizar texto removendo acentos e espaços extras
const normalizeText = (text?: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Helper para extrair número de CA do EPI (seja de caNumber, observações, descrição ou nome)
const extractCaNumber = (item: StockItem): string => {
  if ((item as any).caNumber && String((item as any).caNumber).trim()) {
    const raw = String((item as any).caNumber).trim();
    const digitsOnly = raw.replace(/\D/g, '');
    return digitsOnly || raw;
  }
  const combined = `${item.notes || ''} ${item.description || ''} ${item.name || ''}`;
  const match = combined.match(/\b(?:CA|C\.A\.?|CERTIFICADO)\s*:?\s*(\d{3,7})\b/i);
  return match ? match[1] : '';
};

const StockItemsTable: React.FC<StockItemsTableProps> = ({
  items: initialItems,
  onEdit,
  onCreateMovement,
  onRefresh
}) => {
  const [items, setItems] = useState<StockItem[]>(Array.isArray(initialItems) ? initialItems : []);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [lowStockFilter, setLowStockFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const { toast } = useToast();

  useEffect(() => {
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [initialItems]);

  // Resetar página ao mudar filtros ou termo de busca
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, lowStockFilter, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    toast({
      title: "Busca aplicada",
      description: `${filteredItems.length} item(ns) encontrado(s)`,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setLowStockFilter('all');
    setItems(Array.isArray(initialItems) ? initialItems : []);
    setSelectedItems(new Set());
    setCurrentPage(1);
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

  // Filtragem e ordenação instantânea com suporte a código, descrição, CA e categoria
  const filteredItems = useMemo(() => {
    const rawItems = Array.isArray(items) ? items : [];
    const normalizedSearch = normalizeText(searchTerm);
    const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);

    const filtered = rawItems.filter(item => {
      // 1. Filtro de Categoria pelo Select
      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      // 2. Filtro de Baixo Estoque
      if (lowStockFilter === 'true' && !item.isLowStock) return false;
      if (lowStockFilter === 'false' && item.isLowStock) return false;

      // 3. Filtro da Barra de Pesquisa Multi-Critérios
      if (searchTerms.length > 0) {
        const itemCode = normalizeText(item.code);
        const itemBarcode = normalizeText(item.barcode);
        const itemName = normalizeText(item.name);
        const itemFullName = normalizeText(item.fullName);
        const itemDesc = normalizeText(item.description);
        const itemNotes = normalizeText(item.notes);
        const itemSupplier = normalizeText(item.supplier);
        const itemCategoryKey = normalizeText(item.category);
        const itemCategoryLabel = normalizeText(StockCategoryLabels[item.category] || '');
        const itemCa = extractCaNumber(item);
        const isEpi = item.category === StockCategory.EPI || Boolean(itemCa);

        // Cada termo digitado deve bater com pelo menos um critério (E lógico)
        const allTermsMatch = searchTerms.every(term => {
          const cleanDigits = term.replace(/\D/g, '');
          const isCaOrEpiQuery = term.startsWith('ca') || term === 'epi';

          // Se pesquisou "ca" ou "ca 12345" ou "ca12345"
          if (isCaOrEpiQuery) {
            if (cleanDigits && itemCa) {
              return itemCa.includes(cleanDigits);
            }
            if (term === 'ca' || term === 'epi') {
              return isEpi || itemCategoryKey.includes(term) || itemCategoryLabel.includes(term);
            }
          }

          // Se digitou números que correspondem ao CA
          if (itemCa && cleanDigits.length >= 3 && itemCa.includes(cleanDigits)) {
            return true;
          }

          // Comparação padrão em Código, Barcode, Nome, Descrição, Notas, Fornecedor e Categoria
          return (
            itemCode.includes(term) ||
            itemBarcode.includes(term) ||
            itemName.includes(term) ||
            itemFullName.includes(term) ||
            itemDesc.includes(term) ||
            itemNotes.includes(term) ||
            itemSupplier.includes(term) ||
            itemCategoryKey.includes(term) ||
            itemCategoryLabel.includes(term)
          );
        });

        if (!allTermsMatch) return false;
      }

      return true;
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

  // Paginação de alta performance
  const totalItems = filteredItems.length;
  const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems;
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(startIndex, startIndex + pageSize);
  }, [filteredItems, safeCurrentPage, pageSize]);

  // Lista de páginas para paginação
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push('...');
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (safeCurrentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  // ===== SELEÇÃO =====

  const allCurrentPageChecked = paginatedItems.length > 0 && paginatedItems.every(item => selectedItems.has(item.id));

  const handleSelectAllCurrentPage = (checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      paginatedItems.forEach(item => newSelected.add(item.id));
    } else {
      paginatedItems.forEach(item => newSelected.delete(item.id));
    }
    setSelectedItems(newSelected);
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

      const dadosExportacao = itemsToExport.map(item => {
        const ca = extractCaNumber(item);
        return {
          'Código': item.code,
          'Item': item.fullName || item.name,
          'CA (EPI)': ca || '',
          'Categoria': StockCategoryLabels[item.category] || item.category,
          'Estoque': item.currentQuantity,
          'Mínimo': item.minimumQuantity,
          'Status': getStatusLabel(item),
          'Vr. Compra': item.unitCost ?? '',
          'Custo Médio': item.averageCost ?? '',
          'Cadastro': item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '',
          'Movimentações': item.movementCount ?? 0
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      ws['!cols'] = [
        { wch: 16 }, // Código
        { wch: 30 }, // Item
        { wch: 12 }, // CA (EPI)
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
                  placeholder="Nome, código, CA do EPI, categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  className="pl-10 pr-9 bg-seguranca-black border-gray-600 text-seguranca-lightgray placeholder:text-gray-500 focus:border-seguranca-red"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                    title="Limpar pesquisa"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
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
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todos os itens</SelectItem>
                  <SelectItem value="true">Baixo estoque</SelectItem>
                  <SelectItem value="false">Estoque normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-seguranca-lightgray">Ações</label>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="bg-seguranca-red hover:bg-seguranca-darkred">
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
                <Button variant="outline" onClick={clearFilters} className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                  Limpar
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-3 border-t border-gray-700/50">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="font-semibold text-white">{filteredItems.length}</span> item(ns) encontrado(s)
              {filteredItems.length !== (items?.length || 0) && (
                <span>(de um total de {items?.length || 0})</span>
              )}
            </div>
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
              <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
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
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-seguranca-lightgray font-medium">
                {selectedItems.size} item(ns) selecionado(s)
              </span>
              {selectedItems.size < filteredItems.length && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSelectedItems(new Set(filteredItems.map(i => i.id)))}
                  className="text-seguranca-yellow hover:underline p-0 h-auto text-xs"
                >
                  Selecionar todos os {filteredItems.length} itens filtrados
                </Button>
              )}
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
                Exportar Selecionados ({selectedItems.size})
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
                Excluir Selecionados ({selectedItems.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela de Itens */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0 overflow-x-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-seguranca-lightgray mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-400 mb-4">
                Não há itens que correspondam aos filtros selecionados.
              </p>
              {(searchTerm || categoryFilter !== 'all' || lowStockFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                >
                  Limpar Filtros de Busca
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-600">
                    <TableHead className="w-10 text-center">
                      <Checkbox
                        checked={allCurrentPageChecked}
                        onCheckedChange={handleSelectAllCurrentPage}
                        aria-label="Selecionar itens da página"
                        className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                      />
                    </TableHead>
                    <SortableHead columnKey="code">Código</SortableHead>
                    <SortableHead columnKey="name">Item / Descrição</SortableHead>
                    <SortableHead columnKey="category">Categoria</SortableHead>
                    <SortableHead columnKey="currentQuantity">Estoque</SortableHead>
                    <SortableHead columnKey="status">Status</SortableHead>
                    <SortableHead columnKey="unitCost">Vr. Compra</SortableHead>
                    <SortableHead columnKey="averageCost">Custo Médio</SortableHead>
                    <SortableHead columnKey="createdAt">Cadastro</SortableHead>
                    <SortableHead columnKey="movementCount">Mov.</SortableHead>
                    <TableHead className="text-seguranca-lightgray text-right pr-4">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => {
                    const caNumber = extractCaNumber(item);
                    return (
                      <TableRow 
                        key={item.id} 
                        className={`border-gray-600 hover:bg-seguranca-black/50 transition-colors ${selectedItems.has(item.id) ? 'bg-seguranca-black/30' : ''}`}
                      >
                        <TableCell className="w-10 text-center">
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            aria-label={`Selecionar item ${item.code}`}
                            className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                          />
                        </TableCell>
                        
                        <TableCell className="text-seguranca-lightgray font-mono text-xs">
                          {item.code}
                          {item.barcode && (
                            <span className="block text-[10px] text-gray-400 font-mono">
                              {item.barcode}
                            </span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-seguranca-lightgray">{item.name}</p>
                              {caNumber && (
                                <Badge 
                                  variant="outline" 
                                  className="border-amber-500/50 bg-amber-500/10 text-amber-300 text-[11px] px-1.5 py-0 h-5"
                                  title="Certificado de Aprovação (EPI)"
                                >
                                  <Shield className="h-3 w-3 mr-1 text-amber-400 inline" />
                                  CA {caNumber}
                                </Badge>
                              )}
                            </div>
                            {item.sizeVariation && (
                              <p className="text-xs text-gray-400">Tamanho: {item.sizeVariation}</p>
                            )}
                            {item.description && item.description !== item.name && (
                              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs whitespace-nowrap">
                            {StockCategoryLabels[item.category] || item.category}
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
                        
                        <TableCell className="text-seguranca-lightgray text-xs whitespace-nowrap">
                          {item.unitCost ? `R$ ${item.unitCost.toFixed(2)}` : '-'}
                        </TableCell>
                        
                        <TableCell className="text-seguranca-lightgray text-xs whitespace-nowrap">
                          {item.averageCost ? `R$ ${item.averageCost.toFixed(2)}` : '-'}
                        </TableCell>
                        
                        <TableCell className="text-seguranca-lightgray whitespace-nowrap">
                          <span className="text-xs text-gray-400">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-center text-seguranca-lightgray">
                          <span className="text-xs font-mono">{item.movementCount ?? 0}</span>
                        </TableCell>
                        
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(item)}
                              className="text-seguranca-lightgray hover:bg-seguranca-black h-8 w-8 p-0"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCreateMovement(item)}
                              className="text-seguranca-yellow hover:bg-seguranca-black h-8 w-8 p-0"
                              title="Movimentação"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBulkDelete([item.id])}
                              className="text-red-500 hover:bg-seguranca-black h-8 w-8 p-0"
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Barra de Paginação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-600/50 bg-seguranca-black/30">
                <div className="text-xs text-gray-400">
                  Mostrando <span className="font-semibold text-white">
                    {totalItems === 0 ? 0 : (safeCurrentPage - 1) * (pageSize === 'all' ? totalItems : pageSize) + 1}
                  </span> a{' '}
                  <span className="font-semibold text-white">
                    {pageSize === 'all' ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems)}
                  </span>{' '}
                  de <span className="font-semibold text-white">{totalItems}</span> itens
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={safeCurrentPage === 1}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black disabled:opacity-30 h-8 w-8 p-0"
                        title="Primeira Página"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={safeCurrentPage === 1}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black disabled:opacity-30 h-8 w-8 p-0"
                        title="Página Anterior"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      {getPageNumbers().map((pageNum, idx) =>
                        pageNum === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-1.5 text-gray-500 text-xs select-none">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={pageNum}
                            variant={safeCurrentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum as number)}
                            className={`h-8 w-8 p-0 text-xs font-semibold ${
                              safeCurrentPage === pageNum
                                ? 'bg-seguranca-yellow text-seguranca-black hover:bg-seguranca-yellow/90'
                                : 'border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black'
                            }`}
                          >
                            {pageNum}
                          </Button>
                        )
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={safeCurrentPage === totalPages}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black disabled:opacity-30 h-8 w-8 p-0"
                        title="Próxima Página"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={safeCurrentPage === totalPages}
                        className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black disabled:opacity-30 h-8 w-8 p-0"
                        title="Última Página"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Por pág:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => setPageSize(val === 'all' ? 'all' : Number(val))}
                    >
                      <SelectTrigger className="h-8 w-20 bg-seguranca-black border-gray-600 text-xs text-seguranca-lightgray">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-seguranca-graphite border-gray-600">
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="all">Todos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockItemsTable;
