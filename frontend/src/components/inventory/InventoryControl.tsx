import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Package, AlertTriangle, TrendingUp, TrendingDown, Filter, ArrowUpDown } from 'lucide-react';
import { InventoryItem, InventoryMovement, InventoryStats, ItemCategory, ItemType, ItemStatus, MovementType } from '@/types/inventory';
import { useInventoryNotifications } from '@/hooks/useInventoryNotifications';

const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    name: 'Filtro de Óleo Motor',
    description: 'Filtro de alta qualidade para motores diesel',
    category: ItemCategory.SUPPLIES,
    type: ItemType.MAINTENANCE_SUPPLY,
    brand: 'MANN-FILTER',
    model: 'HU 718/5 X',
    unitPrice: 45.90,
    quantity: 24,
    minimumQuantity: 10,
    location: 'Prateleira A-01',
    supplier: 'Auto Peças Ltda',
    status: ItemStatus.ACTIVE,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-03-10T14:20:00Z'
  },
  {
    id: '2',
    name: 'Pneu 205/75R16',
    description: 'Pneu para veículos de carga',
    category: ItemCategory.SUPPLIES,
    type: ItemType.MAINTENANCE_SUPPLY,
    brand: 'Michelin',
    model: 'XZY3',
    unitPrice: 380.50,
    quantity: 8,
    minimumQuantity: 4,
    location: 'Prateleira B-03',
    supplier: 'Pneus Center',
    status: ItemStatus.ACTIVE,
    createdAt: '2024-01-20T09:15:00Z',
    updatedAt: '2024-03-15T11:45:00Z'
  },
  {
    id: '3',
    name: 'Bateria 12V 80Ah',
    description: 'Bateria para caminhonetes',
    category: ItemCategory.SUPPLIES,
    type: ItemType.MAINTENANCE_SUPPLY,
    brand: 'Moura',
    model: 'M80',
    unitPrice: 285.00,
    quantity: 15,
    minimumQuantity: 5,
    location: 'Prateleira C-02',
    supplier: 'Baterias Moura',
    status: ItemStatus.ACTIVE,
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-20T16:30:00Z'
  },
  {
    id: '4',
    name: 'Extintor de Incêndio ABC 10kg',
    description: 'Extintor de pó químico tipo ABC',
    category: ItemCategory.SAFETY,
    type: ItemType.PROTECTIVE_EQUIPMENT,
    brand: 'Kidde',
    model: 'ABC-10',
    unitPrice: 89.90,
    quantity: 6,
    minimumQuantity: 2,
    location: 'Parede Segurança-01',
    supplier: 'Segurança Total',
    status: ItemStatus.ACTIVE,
    createdAt: '2024-01-25T13:45:00Z',
    updatedAt: '2024-03-18T09:10:00Z'
  },
  {
    id: '5',
    name: 'Furadeira Industrial 7mm',
    description: 'Furadeira para pneus',
    category: ItemCategory.TOOLS,
    type: ItemType.TOOL,
    brand: 'Pirelli',
    model: 'PF-7',
    unitPrice: 125.00,
    quantity: 12,
    minimumQuantity: 3,
    location: 'Ferramentaria-01',
    supplier: 'Ferramentas Pro',
    status: ItemStatus.ACTIVE,
    createdAt: '2024-02-10T11:20:00Z',
    updatedAt: '2024-03-22T14:15:00Z'
  }
];

const mockMovements: InventoryMovement[] = [
  {
    id: '1',
    itemId: '1',
    movementType: MovementType.ENTRY,
    quantity: 10,
    previousQuantity: 14,
    newQuantity: 24,
    unitPrice: 45.90,
    totalValue: 459.00,
    reason: 'Compra de lote para reposição',
    responsiblePerson: 'João Silva',
    movementDate: '2024-03-10T14:20:00Z',
    notes: 'Nota fiscal NF-12345',
    item: mockInventoryItems[0]
  },
  {
    id: '2',
    itemId: '2',
    movementType: MovementType.EXIT,
    quantity: 2,
    previousQuantity: 10,
    newQuantity: 8,
    unitPrice: 380.50,
    totalValue: 761.00,
    reason: 'Uso em manutenção preventiva',
    responsiblePerson: 'Carlos Santos',
    movementDate: '2024-03-15T09:30:00Z',
    notes: 'OS-2024-03-156',
    item: mockInventoryItems[1]
  },
  {
    id: '3',
    itemId: '4',
    movementType: MovementType.ADJUSTMENT,
    quantity: -1,
    previousQuantity: 7,
    newQuantity: 6,
    unitPrice: 89.90,
    totalValue: -89.90,
    reason: 'Ajuste de inventário - perda verificada',
    responsiblePerson: 'Maria Oliveira',
    movementDate: '2024-03-20T16:30:00Z',
    notes: 'Ajuste de perda',
    item: mockInventoryItems[3]
  }
];

const mockStats: InventoryStats = {
  totalItems: mockInventoryItems.length,
  lowStockItems: 2,
  totalValue: mockInventoryItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
  entriesThisMonth: 12,
  exitsThisMonth: 8,
  pendingRequests: 3
};

export default function InventoryControl() {
  const { checkLowStock } = useInventoryNotifications();
  const [items, setItems] = useState<InventoryItem[]>(mockInventoryItems);
  const [movements, setMovements] = useState<InventoryMovement[]>(mockMovements);
  const [stats, setStats] = useState<InventoryStats>(mockStats);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    // Verificar estoque baixo ao carregar o componente
    checkLowStock(items);
  }, [items, checkLowStock]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Ativo';
      case 'LOW_STOCK':
        return 'Estoque Baixo';
      case 'OUT_OF_STOCK':
        return 'Sem Estoque';
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case ItemCategory.UNIFORM:
        return 'Uniformes';
      case ItemCategory.EQUIPMENT:
        return 'Equipamentos';
      case ItemCategory.TOOLS:
        return 'Ferramentas';
      case ItemCategory.SUPPLIES:
        return 'Suprimentos';
      case ItemCategory.ELECTRONICS:
        return 'Eletrônicos';
      case ItemCategory.SAFETY:
        return 'Segurança';
      case ItemCategory.OFFICE:
        return 'Escritório';
      default:
        return category;
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case MovementType.ENTRY:
        return 'Entrada';
      case MovementType.EXIT:
        return 'Saída';
      case MovementType.ADJUSTMENT:
        return 'Ajuste';
      case MovementType.TRANSFER:
        return 'Transferência';
      case MovementType.LOSS:
        return 'Perda';
      case MovementType.EXPIRATION:
        return 'Vencimento';
      default:
        return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case MovementType.ENTRY:
        return 'text-green-600';
      case MovementType.EXIT:
        return 'text-red-600';
      case MovementType.ADJUSTMENT:
        return 'text-yellow-600';
      case MovementType.LOSS:
        return 'text-red-700';
      case MovementType.EXPIRATION:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Estoque</h1>
          <p className="text-muted-foreground">Gerencie peças, suprimentos e equipamentos</p>
        </div>
        <div className="flex space-x-2">
          <Button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4" />
            <span>Nova Peça</span>
          </Button>
          <Button variant="outline" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Movimentação</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Itens cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Abaixo do mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">R$ {stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Valor em estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requisições</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">Pendentes de aprovação</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar itens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value={ItemCategory.UNIFORM}>Uniformes</SelectItem>
                <SelectItem value={ItemCategory.EQUIPMENT}>Equipamentos</SelectItem>
                <SelectItem value={ItemCategory.TOOLS}>Ferramentas</SelectItem>
                <SelectItem value={ItemCategory.SUPPLIES}>Suprimentos</SelectItem>
                <SelectItem value={ItemCategory.ELECTRONICS}>Eletrônicos</SelectItem>
                <SelectItem value={ItemCategory.SAFETY}>Segurança</SelectItem>
                <SelectItem value={ItemCategory.OFFICE}>Escritório</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value={ItemStatus.ACTIVE}>Ativo</SelectItem>
                <SelectItem value="LOW_STOCK">Estoque Baixo</SelectItem>
                <SelectItem value={ItemStatus.OUT_OF_STOCK}>Sem Estoque</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="items">Itens</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="requests">Requisições</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Itens em Estoque ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-accent">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-red-500" />
                        <div>
                          <h3 className="font-medium text-foreground">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center space-x-1">
                              <Badge variant="outline">{getCategoryLabel(item.category)}</Badge>
                            </span>
                            <span>{item.brand} {item.model}</span>
                            <span>Qtd: {item.quantity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">R$ {item.unitPrice.toFixed(2)}</div>
                      <div className={`text-sm font-medium ${item.quantity <= item.minimumQuantity ? 'text-green-600' : 'text-red-600'}`}>
                        {item.quantity} unidades
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Movimentações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.map((movement) => (
                  <div key={movement.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <ArrowUpDown className={`h-5 w-5 ${getMovementTypeColor(movement.movementType)}`} />
                        <div>
                          <h3 className="font-medium text-foreground">{movement.item?.name}</h3>
                          <p className="text-sm text-muted-foreground">{movement.reason}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>{getMovementTypeLabel(movement.movementType)}</span>
                            <span>{movement.quantity} unidades</span>
                            <span>R$ {movement.totalValue?.toFixed(2)}</span>
                            <span>{new Date(movement.movementDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getMovementTypeColor(movement.movementType)}`}>
                        {movement.movementType === MovementType.ENTRY ? '+' : movement.movementType === MovementType.ADJUSTMENT && movement.quantity > 0 ? '+' : '-'}
                        {Math.abs(movement.quantity)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {movement.previousQuantity} → {movement.newQuantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Requisições de Peças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Módulo de Requisições</p>
                <p className="text-sm">Funcionalidade em desenvolvimento</p>
                <p className="text-xs text-muted-foreground">Clique aqui para acessar o sistema de requisições</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
