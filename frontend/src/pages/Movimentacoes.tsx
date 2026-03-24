import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StandardLayout } from '@/components/StandardLayout';
import { stockService } from '@/services/stockService';
import { StockMovement, MovementType, MovementReason, MovementTypeLabels, MovementReasonLabels, MovementFilters } from '@/types/stock';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  TrendingUp
} from 'lucide-react';

export default function Movimentacoes() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalMovements: 0,
    entries: 0,
    exits: 0,
  });

  useEffect(() => {
    loadMovements();
  }, [currentPage, typeFilter, reasonFilter, startDate, endDate]);

  useEffect(() => {
    // Recarregar quando o termo de busca mudar (com debounce)
    const timeoutId = setTimeout(() => {
      if (currentPage === 0) {
        loadMovements();
      } else {
        setCurrentPage(0);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      const filters: MovementFilters = {
        searchTerm: searchTerm || undefined,
        movementType: typeFilter !== 'all' ? typeFilter as MovementType : undefined,
        reason: reasonFilter !== 'all' ? reasonFilter as MovementReason : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      console.log('🔍 Buscando movimentações com filtros:', filters);
      const result = await stockService.searchMovements(filters, currentPage, pageSize);
      console.log('✅ Resultado da busca:', {
        totalElements: result.totalElements,
        contentLength: result.content?.length || 0,
        content: result.content
      });
      
      setMovements(result.content || []);
      setTotalElements(result.totalElements || 0);
      
      // Calcular estatísticas
      const entries = result.content?.filter(m => m.movementType === MovementType.ENTRADA).length || 0;
      const exits = result.content?.filter(m => m.movementType === MovementType.SAIDA).length || 0;
      
      setStats({
        totalMovements: result.totalElements || 0,
        entries: entries,
        exits: exits,
      });
    } catch (error: any) {
      console.error('❌ Erro ao carregar movimentações:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao carregar movimentações.",
        variant: "destructive",
      });
      setMovements([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadMovements();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setReasonFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(0);
  };

  const getTypeColor = (type: MovementType) => {
    switch (type) {
      case MovementType.ENTRADA: return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case MovementType.SAIDA: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeLabel = (type: MovementType) => {
    return MovementTypeLabels[type] || type;
  };

  const getTypeIcon = (type: MovementType) => {
    switch (type) {
      case MovementType.ENTRADA: return <ArrowDown className="w-4 h-4" />;
      case MovementType.SAIDA: return <ArrowUp className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getReasonLabel = (reason: MovementReason) => {
    return MovementReasonLabels[reason] || reason;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <StandardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Movimentações de Estoque</h1>
            <p className="text-muted-foreground">
              Controle de entradas, saídas e ajustes de estoque
            </p>
          </div>
          <Button onClick={() => {}}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Movimentação
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total de Movimentações</p>
                  <p className="text-2xl font-bold">{stats.totalMovements}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowDown className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Entradas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.entries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUp className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Saídas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.exits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar movimentações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="ENTRY">Entrada</SelectItem>
                  <SelectItem value="EXIT">Saída</SelectItem>
                  <SelectItem value="ADJUSTMENT">Ajuste</SelectItem>
                  <SelectItem value="TRANSFER">Transferência</SelectItem>
                </SelectContent>
              </Select>

              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Usuários</SelectItem>
                  {getUsers().map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadMovements}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Movimentações */}
        <Card>
          <CardHeader>
            <CardTitle>Movimentações ({filteredMovements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Estoque Anterior</TableHead>
                      <TableHead>Novo Estoque</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{formatDate(movement.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{movement.productName}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(movement.type)}
                            <Badge className={getTypeColor(movement.type)}>
                              {getTypeLabel(movement.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)}
                          </span>
                        </TableCell>
                        <TableCell>{formatNumber(movement.previousStock)}</TableCell>
                        <TableCell>{formatNumber(movement.newStock)}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{movement.reason}</div>
                            {movement.notes && (
                              <div className="text-sm text-muted-foreground">{movement.notes}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{movement.userName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${movement.totalValue && movement.totalValue > 0 ? 'text-green-600' : movement.totalValue && movement.totalValue < 0 ? 'text-red-600' : ''}`}>
                            {movement.totalValue ? formatCurrency(movement.totalValue) : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
} 