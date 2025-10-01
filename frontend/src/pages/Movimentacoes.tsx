import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { StandardLayout } from '@/components/StandardLayout';
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
  User
} from 'lucide-react';

interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  userId: string;
  userName: string;
  unitId?: string;
  unitName?: string;
  costPrice?: number;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export default function Movimentacoes() {
  const { toast } = useToast();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  
  // Estatísticas
  const [stats, setStats] = useState({
    totalMovements: 0,
    entries: 0,
    exits: 0,
    adjustments: 0,
    transfers: 0,
  });

  useEffect(() => {
    loadMovements();
    loadStats();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, searchTerm, typeFilter, dateFilter, userFilter]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      // Mock data - substituir por chamada real da API
      const mockMovements: InventoryMovement[] = [
        {
          id: '1',
          productId: '1',
          productName: 'Produto A',
          type: 'ENTRY',
          quantity: 100,
          previousStock: 50,
          newStock: 150,
          reason: 'Compra',
          notes: 'Compra de fornecedor XYZ',
          userId: '1',
          userName: 'João Silva',
          costPrice: 10.50,
          totalValue: 1050.00,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          productId: '2',
          productName: 'Produto B',
          type: 'EXIT',
          quantity: 25,
          previousStock: 75,
          newStock: 50,
          reason: 'Venda',
          notes: 'Venda para cliente ABC',
          userId: '2',
          userName: 'Maria Santos',
          costPrice: 15.00,
          totalValue: 375.00,
          createdAt: '2024-01-15T14:20:00Z',
          updatedAt: '2024-01-15T14:20:00Z',
        },
        {
          id: '3',
          productId: '3',
          productName: 'Produto C',
          type: 'ADJUSTMENT',
          quantity: -5,
          previousStock: 30,
          newStock: 25,
          reason: 'Ajuste de estoque',
          notes: 'Produto com defeito',
          userId: '1',
          userName: 'João Silva',
          costPrice: 8.00,
          totalValue: -40.00,
          createdAt: '2024-01-15T16:45:00Z',
          updatedAt: '2024-01-15T16:45:00Z',
        },
      ];
      setMovements(mockMovements);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar movimentações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - substituir por chamada real da API
      setStats({
        totalMovements: movements.length,
        entries: movements.filter(m => m.type === 'ENTRY').length,
        exits: movements.filter(m => m.type === 'EXIT').length,
        adjustments: movements.filter(m => m.type === 'ADJUSTMENT').length,
        transfers: movements.filter(m => m.type === 'TRANSFER').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const filterMovements = () => {
    let filtered = movements;

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(movement =>
        movement.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(movement => movement.type === typeFilter);
    }

    // Filtro por usuário
    if (userFilter !== 'all') {
      filtered = filtered.filter(movement => movement.userId === userFilter);
    }

    setFilteredMovements(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ENTRY': return 'bg-green-100 text-green-800';
      case 'EXIT': return 'bg-red-100 text-red-800';
      case 'ADJUSTMENT': return 'bg-yellow-100 text-yellow-800';
      case 'TRANSFER': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTRY': return 'Entrada';
      case 'EXIT': return 'Saída';
      case 'ADJUSTMENT': return 'Ajuste';
      case 'TRANSFER': return 'Transferência';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ENTRY': return <ArrowDown className="w-4 h-4" />;
      case 'EXIT': return <ArrowUp className="w-4 h-4" />;
      case 'ADJUSTMENT': return <ArrowUpDown className="w-4 h-4" />;
      case 'TRANSFER': return <ArrowUpDown className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
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
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUsers = () => {
    const users = movements.map(m => ({ id: m.userId, name: m.userName }));
    return [...new Set(users.map(u => JSON.stringify(u)))].map(u => JSON.parse(u));
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ArrowUpDown className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Ajustes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.adjustments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Transferências</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.transfers}</p>
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