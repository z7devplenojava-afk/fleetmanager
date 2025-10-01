import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Calendar
} from 'lucide-react';
import { StockMovement, MovementType, MovementReason, MovementTypeLabels, MovementReasonLabels } from '@/types/stock';
import { stockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StockMovementsTableProps {
  onCreateMovement: () => void;
  onRefresh: () => void;
}

const StockMovementsTable: React.FC<StockMovementsTableProps> = ({
  onCreateMovement,
  onRefresh
}) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
      
      const result = await stockService.searchMovements(filters);
      setMovements(result.content);
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
              {movements.length} movimentação(ões) encontrada(s)
            </p>
            <Button variant="outline" size="sm" onClick={onRefresh} className="border-gray-600 text-seguranca-lightgray">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card className="bg-seguranca-graphite border-gray-600">
        <CardContent className="p-0">
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
                  <TableHead className="text-seguranca-lightgray">Data/Hora</TableHead>
                  <TableHead className="text-seguranca-lightgray">Item</TableHead>
                  <TableHead className="text-seguranca-lightgray">Tipo</TableHead>
                  <TableHead className="text-seguranca-lightgray">Motivo</TableHead>
                  <TableHead className="text-seguranca-lightgray">Quantidade</TableHead>
                  <TableHead className="text-seguranca-lightgray">Funcionário</TableHead>
                  <TableHead className="text-seguranca-lightgray">Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id} className="border-gray-600 hover:bg-seguranca-black/50">
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