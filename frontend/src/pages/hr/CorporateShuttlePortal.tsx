import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, 
  Users, 
  MapPin, 
  Clock, 
  Calendar, 
  Download, 
  Upload, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  QrCode,
  Navigation,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Car,
  User,
  Route
} from 'lucide-react';
import corporateShuttleService from '@/services/corporateShuttleService';
import { Route, Employee, Driver, BoardingConfirmation } from '@/services/corporateShuttleService';

export default function CorporateShuttlePortal() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [confirmations, setConfirmations] = useState<BoardingConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('routes');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, confirmationsData] = await Promise.all([
        corporateShuttleService.getAllRoutes(),
        corporateShuttleService.getBoardingConfirmations()
      ]);
      
      setRoutes(routesData);
      setConfirmations(confirmationsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportKML = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kml,.kmz';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const newRoute = await corporateShuttleService.importRouteFromKML(text);
          await loadData();
          alert(`Rota "${newRoute.name}" importada com sucesso!`);
        } catch (error) {
          console.error('Erro ao importar KML:', error);
          alert('Erro ao importar arquivo KML');
        }
      }
    };
    input.click();
  };

  const handleGenerateRoute = async () => {
    const addresses = prompt('Digite os endereços separados por vírgula:');
    if (addresses) {
      try {
        const addressArray = addresses.split(',').map(addr => addr.trim());
        const newRoute = await corporateShuttleService.generateRouteFromAddresses(addressArray);
        await loadData();
        alert(`Rota "${newRoute.name}" gerada com sucesso!`);
      } catch (error) {
        console.error('Erro ao gerar rota:', error);
        alert('Erro ao gerar rota');
      }
    }
  };

  const handleViewRoute = async (route: Route) => {
    setSelectedRoute(route);
    const routeEmployees = await corporateShuttleService.getEmployeesByRoute(route.id);
    setEmployees(routeEmployees);
  };

  const getRouteStatusColor = (status: Route['status']) => {
    return corporateShuttleService.getRouteStatusColor(status);
  };

  const getRouteStatusLabel = (status: Route['status']) => {
    return corporateShuttleService.getRouteStatusLabel(status);
  };

  const getEmployeeStatusColor = (status: Employee['status']) => {
    return corporateShuttleService.getEmployeeStatusColor(status);
  };

  const getEmployeeStatusLabel = (status: Employee['status']) => {
    return corporateShuttleService.getEmployeeStatusLabel(status);
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = !searchTerm || 
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.driverName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const todayConfirmations = confirmations.filter(c => {
    const today = new Date().toDateString();
    const confirmationDate = new Date(c.confirmedAt).toDateString();
    return today === confirmationDate;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portal RH - Fretamento Corporativo</h1>
          <p className="text-muted-foreground">Gestão completa de rotas, veículos, motoristas e funcionários</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleImportKML}>
            <Upload className="h-4 w-4 mr-2" />
            Importar KML
          </Button>
          <Button onClick={handleGenerateRoute}>
            <Route className="h-4 w-4 mr-2" />
            Gerar Rota
          </Button>
        </div>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rotas Ativas</CardTitle>
            <Route className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {routes.filter(r => r.status === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {routes.reduce((sum, route) => sum + route.employees.length, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Embarques Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {todayConfirmations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Pontualidade</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">95.5%</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="routes">Rotas</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="drivers">Motoristas</TabsTrigger>
          <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Rotas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Buscar rotas..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="ACTIVE">Ativas</SelectItem>
                      <SelectItem value="INACTIVE">Inativas</SelectItem>
                      <SelectItem value="CANCELLED">Canceladas</SelectItem>
                      <SelectItem value="DELAYED">Atrasadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Routes Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Nome da Rota</th>
                        <th className="text-left p-2">Veículo</th>
                        <th className="text-left p-2">Motorista</th>
                        <th className="text-left p-2">Horário</th>
                        <th className="text-left p-2">Funcionários</th>
                        <th className="text-left p-2">Distância</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-center p-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoutes.map((route) => (
                        <tr key={route.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{route.name}</div>
                              <div className="text-sm text-muted-foreground">{route.description}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{route.vehiclePlate}</div>
                                <div className="text-sm text-muted-foreground">
                                  {route.vehicleBrand} {route.vehicleModel}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div>{route.driverName}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div>Saída: {route.startTime}</div>
                              <div>Chegada: {route.endTime}</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <Badge variant="outline">{route.employees.length}</Badge>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="text-sm">
                              <div>{route.distance} km</div>
                              <div className="text-muted-foreground">{route.estimatedDuration} min</div>
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge className={getRouteStatusColor(route.status)}>
                              {getRouteStatusLabel(route.status)}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewRoute(route)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Funcionários por Rota</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRoute ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedRoute.name}</h3>
                      <p className="text-muted-foreground">
                        {selectedRoute.employees.length} funcionários nesta rota
                      </p>
                    </div>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Funcionário
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {employees.map((employee) => (
                      <Card key={employee.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <User className="h-8 w-8 text-blue-600" />
                              <div>
                                <div className="font-bold">{employee.name}</div>
                                <div className="text-sm text-muted-foreground">{employee.position}</div>
                              </div>
                            </div>
                            <Badge className={getEmployeeStatusColor(employee.status)}>
                              {getEmployeeStatusLabel(employee.status)}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Empresa:</span> {employee.clientCompany}
                            </div>
                            <div>
                              <span className="font-medium">Departamento:</span> {employee.department}
                            </div>
                            <div>
                              <span className="font-medium">Endereço:</span> {employee.boardingAddress}
                            </div>
                            <div>
                              <span className="font-medium">Horário:</span> {employee.boardingTime}
                            </div>
                            <div>
                              <span className="font-medium">Contato:</span> {employee.phone}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              <QrCode className="h-4 w-4" />
                              <span className="text-sm font-mono">{employee.qrCode}</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="h-12 w-12 mx-auto mb-4" />
                  <p>Selecione uma rota para ver os funcionários</p>
                  <p className="text-sm">Clique no ícone de visualização na tabela de rotas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Motoristas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <Card key={route.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <User className="h-8 w-8 text-green-600" />
                          <div>
                            <div className="font-bold">{route.driverName}</div>
                            <div className="text-sm text-muted-foreground">Motorista</div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Ativo
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Rota Atual:</span> {route.name}
                        </div>
                        <div>
                          <span className="font-medium">Veículo:</span> {route.vehiclePlate}
                        </div>
                        <div>
                          <span className="font-medium">Horário:</span> {route.startTime} - {route.endTime}
                        </div>
                        <div>
                          <span className="font-medium">Funcionários:</span> {route.employees.length}
                        </div>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Navigation className="h-4 w-4 mr-2" />
                          Rastrear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rastreamento em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="h-12 w-12 mx-auto mb-4" />
                <p>Rastreamento em tempo real das rotas</p>
                <p className="text-sm">Posição atual, velocidade, próximos pontos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Relatório de Embarques</div>
                    <p className="text-sm text-muted-foreground">Detalhes de todos os embarques</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">Relatório de Eficiência</div>
                    <p className="text-sm text-muted-foreground">Análise de performance</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                    <div className="font-medium">Relatório de Ocorrências</div>
                    <p className="text-sm text-muted-foreground">Atrasos e problemas</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
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
