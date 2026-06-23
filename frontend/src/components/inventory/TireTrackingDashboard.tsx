import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Car, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RotateCw,
  Wrench,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Filter,
  Settings,
  Truck,
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react';
import tireTrackingService from '@/services/tireTrackingService';
import { Tire, TireMovement, TireInspection, TireInventory } from '@/services/tireTrackingService';

export default function TireTrackingDashboard() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [tireInventory, setTireInventory] = useState<TireInventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
  const [showTireModal, setShowTireModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    loadTireInventory();
  }, []);

  const loadTireInventory = async () => {
    try {
      setLoading(true);
      const inventory = await tireTrackingService.getTireInventory();
      setTireInventory(inventory);
      setTires(inventory.availableTires);
    } catch (error) {
      console.error('Erro ao carregar inventário de pneus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadTireInventory();
      return;
    }

    try {
      setLoading(true);
      const searchResults = await tireTrackingService.searchTires(searchTerm);
      setTires(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByStatus = async (status: string) => {
    try {
      setLoading(true);
      if (status === 'all') {
        const inventory = await tireTrackingService.getTireInventory();
        setTires(inventory.availableTires);
      } else {
        const filteredTires = await tireTrackingService.getTiresByStatus(status as Tire['status']);
        setTires(filteredTires);
      }
    } catch (error) {
      console.error('Erro ao filtrar por status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTire = (tire: Tire) => {
    setSelectedTire(tire);
    setShowTireModal(true);
  };

  const handleViewMovements = async (tire: Tire) => {
    try {
      const movements = await tireTrackingService.getTireMovements(tire.id);
      // Implementar modal de movimentações
      console.log('Movimentações:', movements);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const handleViewInspections = async (tire: Tire) => {
    try {
      const inspections = await tireTrackingService.getTireInspections(tire.id);
      // Implementar modal de inspeções
      console.log('Inspeções:', inspections);
    } catch (error) {
      console.error('Erro ao carregar inspeções:', error);
    }
  };

  const getTireStatusColor = (status: Tire['status']) => {
    return tireTrackingService.getTireStatusColor(status);
  };

  const getTireStatusLabel = (status: Tire['status']) => {
    return tireTrackingService.getTireStatusLabel(status);
  };

  const getPositionLabel = (position?: string) => {
    return tireTrackingService.getPositionLabel(position);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateTireWear = (tire: Tire) => {
    return tireTrackingService.calculateTireWear(tire);
  };

  const getTireWearColor = (wearPercentage: number) => {
    if (wearPercentage <= 25) return 'text-green-600';
    if (wearPercentage <= 50) return 'text-yellow-600';
    if (wearPercentage <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredTires = tires.filter(tire => {
    const matchesSearch = !searchTerm || 
      tire.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.currentVehiclePlate?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tire.status === statusFilter;
    const matchesType = typeFilter === 'all' || tire.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Pneus</h1>
          <p className="text-muted-foreground">Rastreamento completo de pneus por código e veículo</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Pneu
        </Button>
      </div>

      {/* Dashboard Summary */}
      {tireInventory && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Pneus</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tireInventory.summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Em Uso</CardTitle>
              <Truck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{tireInventory.summary.inUse}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reserva</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{tireInventory.summary.available}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Precisam Substituição</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {tireInventory.summary.maintenance + tireInventory.summary.damaged}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, marca, modelo, placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={handleFilterByStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="IN_USE">Em Uso</SelectItem>
                <SelectItem value="SPARE">Reserva</SelectItem>
                <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                <SelectItem value="DAMAGED">Danificado</SelectItem>
                <SelectItem value="RETIRED">Aposentado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="FRONT">Dianteiros</SelectItem>
                <SelectItem value="REAR">Traseiros</SelectItem>
                <SelectItem value="SPARE">Reserva</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="inventory">Inventário</TabsTrigger>
          <TabsTrigger value="vehicles">Por Veículo</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventário de Pneus</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Código</th>
                        <th className="text-left p-2">Marca/Modelo</th>
                        <th className="text-left p-2">Tamanho</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Veículo</th>
                        <th className="text-left p-2">Posição</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">KM</th>
                        <th className="text-left p-2">Sulco</th>
                        <th className="text-left p-2">Desgaste</th>
                        <th className="text-left p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTires.map((tire) => (
                        <tr key={tire.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="font-mono text-sm font-bold">{tire.code}</div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div className="font-medium">{tire.brand}</div>
                              <div className="text-muted-foreground">{tire.model}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm font-medium">{tire.size}</div>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {tire.type === 'FRONT' ? 'Dianteiro' : 
                               tire.type === 'REAR' ? 'Traseiro' : 'Reserva'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {tire.currentVehiclePlate ? (
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                <span className="text-sm">{tire.currentVehiclePlate}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2">
                            <div className="text-sm">{getPositionLabel(tire.position)}</div>
                          </td>
                          <td className="p-2">
                            <Badge className={getTireStatusColor(tire.status)}>
                              {getTireStatusLabel(tire.status)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {tire.currentMileage?.toLocaleString('pt-BR')} km
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              {tire.treadDepth} mm
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm font-medium">
                              <span className={getTireWearColor(calculateTireWear(tire))}>
                                {calculateTireWear(tire).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTire(tire)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewMovements(tire)}
                              >
                                <RotateCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewInspections(tire)}
                              >
                                <Activity className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pneus por Veículo</CardTitle>
            </CardHeader>
            <CardContent>
              {tireInventory?.vehiclesWithTires.map((vehicleInfo) => (
                <Card key={vehicleInfo.vehicleId} className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Truck className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="font-bold text-lg">
                            {vehicleInfo.vehicleBrand} {vehicleInfo.vehicleModel}
                          </div>
                          <div className="text-muted-foreground">
                            {vehicleInfo.vehiclePlate}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800">
                          {vehicleInfo.tireCount} pneus
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {vehicleInfo.tires.map((tire) => (
                        <div key={tire.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-bold">{tire.code}</div>
                            <Badge className={getTireStatusColor(tire.status)}>
                              {getTireStatusLabel(tire.status)}
                            </Badge>
                          </div>
                          <div className="text-sm">
                            <div>{tire.brand} {tire.model}</div>
                            <div className="text-muted-foreground">{tire.size}</div>
                            <div>Posição: {getPositionLabel(tire.position)}</div>
                            <div>KM: {tire.currentMileage?.toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Última rotação:</div>
                          <div className="font-medium">{vehicleInfo.lastRotation}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Próxima rotação em:</div>
                          <div className="font-medium text-orange-600">
                            {vehicleInfo.nextRotationMileage?.toLocaleString('pt-BR')} km
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <RotateCw className="h-8 w-8 mx-auto mb-4" />
                <p>Selecione um pneu para ver suas movimentações</p>
                <p className="text-sm">Clique no ícone de rotação na tabela de inventário</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de Pneus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <div className="font-bold text-lg">Investimento Total</div>
                        <div className="text-2xl text-green-600">
                          {formatCurrency(
                            tires.reduce((sum, tire) => sum + tire.purchaseValue, 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-bold text-lg">Previsão de Substituição</div>
                        <div className="text-2xl text-blue-600">
                          {tires.filter(tire => {
                            const wear = calculateTireWear(tire);
                            return wear > 75; // Precisa substituição
                          }).length} pneus
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Package className="h-8 w-8 text-orange-600" />
                      <div>
                        <div className="font-bold text-lg">Custo Médio por Pneu</div>
                        <div className="text-2xl text-orange-600">
                          {formatCurrency(
                            tires.length > 0 
                              ? tires.reduce((sum, tire) => sum + tire.purchaseValue, 0) / tires.length 
                              : 0
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                      <div>
                        <div className="font-bold text-lg">Pneus Críticos</div>
                        <div className="text-2xl text-red-600">
                          {tires.filter(tire => {
                            const wear = calculateTireWear(tire);
                            return wear > 90; // Crítico
                          }).length} pneus
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
