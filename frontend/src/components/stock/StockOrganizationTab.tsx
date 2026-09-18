import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  MapPin, 
  Package, 
  FolderTree, 
  Search, 
  Plus, 
  RefreshCw, 
  Warehouse,
  Boxes,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { stockService } from '@/services/stockService';
import { StockItem } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';

export const StockOrganizationTab: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await stockService.getAllItems();
      setItems(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Erro ao carregar organização do estoque:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar os itens.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Agrupamentos por Categoria e por Localização
  const categoryGroups = useMemo(() => {
    const map = new Map<string, StockItem[]>();
    items.forEach(it => {
      const cat = it.category || 'Geral';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(it);
    });
    return map;
  }, [items]);

  const locationGroups = useMemo(() => {
    const map = new Map<string, StockItem[]>();
    items.forEach(it => {
      const loc = it.location || 'Sem Localização Definida';
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(it);
    });
    return map;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (selectedCategory !== 'ALL' && (it.category || 'Geral') !== selectedCategory) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mName = it.name?.toLowerCase().includes(q);
        const mCode = it.code?.toLowerCase().includes(q);
        const mLoc = it.location?.toLowerCase().includes(q);
        const mCat = it.category?.toLowerCase().includes(q);
        if (!mName && !mCode && !mLoc && !mCat) return false;
      }
      return true;
    });
  }, [items, selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-seguranca-graphite p-5 rounded-2xl border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-seguranca-yellow/20 border border-seguranca-yellow/50 flex items-center justify-center text-seguranca-yellow">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-seguranca-lightgray flex items-center gap-2">
              Organização do Almoxarifado
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Estrutura de categorias, subitens, prateleiras e setores de armazenagem física.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          className="border-gray-600 text-gray-200 hover:bg-gray-800 text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo Organizacional */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total de Categorias</p>
              <p className="text-2xl font-bold font-mono text-seguranca-yellow mt-1">{categoryGroups.size}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-950/60 border border-yellow-800 flex items-center justify-center text-seguranca-yellow">
              <Tag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Locais de Armazenagem</p>
              <p className="text-2xl font-bold font-mono text-blue-400 mt-1">{locationGroups.size}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800 flex items-center justify-center text-blue-400">
              <Warehouse className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-seguranca-graphite border-gray-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Itens Cadastrados</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">{items.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Categorias & Tabela */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Categorias */}
        <div className="md:col-span-4 space-y-2">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Categorias</h3>
          <div className="bg-gray-900/60 p-2 rounded-xl border border-gray-800 space-y-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                selectedCategory === 'ALL'
                  ? 'bg-seguranca-yellow text-seguranca-black font-bold'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <span>Todas as Categorias</span>
              <Badge variant="outline" className={`text-[10px] ${selectedCategory === 'ALL' ? 'border-black text-black' : 'border-gray-700 text-gray-400'}`}>
                {items.length}
              </Badge>
            </button>

            {Array.from(categoryGroups.entries()).map(([cat, itList]) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                  selectedCategory === cat
                    ? 'bg-seguranca-yellow text-seguranca-black font-bold'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="truncate max-w-[200px]">{cat}</span>
                <Badge variant="outline" className={`text-[10px] ${selectedCategory === cat ? 'border-black text-black' : 'border-gray-700 text-gray-400'}`}>
                  {itList.length}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Painel Direito: Lista de Itens na Categoria */}
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nome, código ou localização..."
                className="pl-9 bg-seguranca-black border-gray-700 text-xs h-9 text-gray-100"
              />
            </div>
          </div>

          <div className="bg-seguranca-graphite border border-gray-700 rounded-xl overflow-hidden shadow-xl">
            <Table>
              <TableHeader className="bg-seguranca-black/80">
                <TableRow className="border-b border-gray-700">
                  <TableHead className="text-gray-300 font-semibold text-xs">Item / Código</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs">Categoria</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs">Localização Física</TableHead>
                  <TableHead className="text-gray-300 font-semibold text-xs text-center">Estoque Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.slice(0, 50).map(it => (
                  <TableRow key={it.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                    <TableCell>
                      <div className="font-semibold text-gray-100 text-xs">{it.name}</div>
                      {it.code && <div className="text-[10px] text-gray-400 font-mono">Cód: {it.code}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-gray-700 text-gray-300 text-[10px]">
                        {it.category || 'Geral'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-gray-300 font-medium">
                        <MapPin className="h-3 w-3 text-seguranca-yellow" />
                        {it.location || 'Sem prateleira'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono font-bold text-xs text-blue-400">
                      {it.currentQuantity || 0} {it.unit || 'UN'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOrganizationTab;
