import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, 
  Users, 
  MapPin, 
  Clock, 
  Calendar, 
  Navigation, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  Route,
  User,
  Car,
  QrCodeScanner,
  MessageSquare,
  FileText
} from 'lucide-react';
import corporateShuttleService from '@/services/corporateShuttleService';
import { Route, Employee, Driver, RouteTracking } from '@/services/corporateShuttleService';

export default function DriverPortal() {
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [routeEmployees, setRouteEmployees] = useState<Employee[]>([]);
  const [routeTracking, setRouteTracking] = useState<RouteTracking | null>(null);
  const [activeTab, setActiveTab] = useState('route');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      setLoading(true);
      // Simular motorista logado (em produção, viria do auth)
      const driverId = 'driver-001';
      const driver = await corporateShuttleService.getDriverById(driverId);
      
      if (driver) {
        setCurrentDriver(driver);
        
        // Carregar rota atual do motorista
        const routes = await corporateShuttleService.getRoutesByDriver(driverId);
        if (routes.length > 0) {
          const activeRoute = routes.find(r => r.status === 'ACTIVE') || routes[0];
          setCurrentRoute(activeRoute);
          
          // Carregar funcionários da rota
          const employees = await corporateShuttleService.getEmployeesByRoute(activeRoute.id);
          setRouteEmployees(employees);
          
          // Carregar rastreamento da rota
          const tracking = await corporateShuttleService.getRouteTracking(activeRoute.id);
          setRouteTracking(tracking);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do motorista:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (!currentRoute) return;
    
    try {
      // Simular início da rota
      await corporateShuttleService.updateRoute(currentRoute.id, { status: 'ACTIVE' });
      await loadDriverData();
      alert('Rota iniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao iniciar rota:', error);
      alert('Erro ao iniciar rota');
    }
  };

  const handleCompleteWayPoint = async (wayPointId: string) => {
    if (!currentRoute) return;
    
    try {
      const updatedWayPoints = currentRoute.wayPoints.map(wp => 
        wp.id === wayPointId ? { ...wp, status: 'COMPLETED' as const } : wp
      );
      
      await corporateShuttleService.updateRoute(currentRoute.id, { wayPoints: updatedWayPoints });
      await loadDriverData();
    } catch (error) {
      console.error('Erro ao completar waypoint:', error);
    }
  };

  const handleConfirmBoarding = async (employeeId: string) => {
    try {
      const employee = routeEmployees.find(e => e.id === employeeId);
      if (!employee || !currentRoute) return;

      const qrData = {
        employeeId: employee.id,
        employeeName: employee.name,
        routeId: currentRoute.id,
        routeName: currentRoute.name,
        driverId: currentDriver?.id || '',
        driverName: currentDriver?.name || '',
        vehicleId: currentRoute.vehicleId,
        vehiclePlate: currentRoute.vehiclePlate,
        timestamp: new Date().toISOString(),
        direction: 'GOING' as const,
        checksum: 'mock-checksum'
      };

      await corporateShuttleService.confirmBoarding(qrData, {
        latitude: -23.5505,
        longitude: -46.6333
      });

      await loadDriverData();
      alert(`${employee.name} confirmado no embarque!`);
    } catch (error) {
      console.error('Erro ao confirmar embarque:', error);
      alert('Erro ao confirmar embarque');
    }
  };

  const handleEmergencyContact = () => {
    if (currentDriver) {
      alert(`Contato de emergência: ${currentDriver.phone}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentDriver) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Motorista não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Motorista</h1>
          <p className="text-muted-foreground">Bem-vindo, {currentDriver.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEmergencyContact}>
            <Phone className="h-4 w-4 mr-2" />
            Emergência
          </Button>
          <Button>
            <MessageSquare className="h-4 w-4 mr-2" />
            Comunicar
          </Button>
        </div>
      </div>

      {/* Current Route Info */}
      {currentRoute && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Route className="h-6 w-6 text-blue-600" />
                  <div>
                    <div className="font-bold text-lg">{currentRoute.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentRoute.startTime} - {currentRoute.endTime}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">{currentRoute.vehiclePlate}</div>
                    <div className="text-sm text-muted-foreground">
                      {currentRoute.vehicleBrand} {currentRoute.vehicleModel}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <Badge variant="outline">
                    {routeEmployees.filter(e => e.status === 'ACTIVE').length} funcionários
                  </Badge>
                </div>
                
                <Badge className={currentRoute.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {currentRoute.status === 'ACTIVE' ? 'Em Andamento' : 'Pendente'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="route">Rota</TabsTrigger>
          <TabsTrigger value="employees">Funcionários</TabsTrigger>
          <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Detalhes da Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentRoute ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Distância</span>
                      <div className="text-lg font-bold">{currentRoute.distance} km</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Duração Estimada</span>
                      <div className="text-lg font-bold">{currentRoute.estimatedDuration} min</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Pontos de Parada</span>
                      <div className="text-lg font-bold">{currentRoute.wayPoints.length}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Pontos de Embarque</h4>
                    <div className="space-y-3">
                      {currentRoute.wayPoints.map((wayPoint, index) => (
                        <div 
                          key={wayPoint.id} 
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            wayPoint.status === 'COMPLETED' ? 'bg-green-50 border-green-200' : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              wayPoint.status === 'COMPLETED' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{wayPoint.address}</div>
                              <div className="text-sm text-muted-foreground">
                                {wayPoint.estimatedTime} - {wayPoint.type === 'BOARDING' ? 'Embarque' : wayPoint.type === 'DROPOFF' ? 'Desembarque' : 'Parada'}
                              </div>
                              {wayPoint.employeeName && (
                                <div className="text-sm text-blue-600">
                                  {wayPoint.employeeName}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={
                              wayPoint.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {wayPoint.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                            </Badge>
                            
                            {wayPoint.status !== 'COMPLETED' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleCompleteWayPoint(wayPoint.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={handleStartRoute} size="lg">
                      <Navigation className="h-5 w-5 mr-2" />
                      Iniciar Rota
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Route className="h-12 w-12 mx-auto mb-4" />
                  <p>Nenhuma rota atribuída</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Funcionários da Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routeEmployees.map((employee) => (
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
                        <Badge className={employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {employee.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{employee.boardingAddress}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Embarque: {employee.boardingTime}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{employee.phone}</span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleConfirmBoarding(employee.id)}
                        >
                          <QrCodeScanner className="h-4 w-4 mr-2" />
                          Confirmar Embarque
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
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
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Rastreamento em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              {routeTracking ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {routeTracking.speed} km/h
                      </div>
                      <div className="text-sm text-muted-foreground">Velocidade Atual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {routeTracking.passengers.boarded}/{routeTracking.passengers.expected}
                      </div>
                      <div className="text-sm text-muted-foreground">Passageiros</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {routeTracking.estimatedArrival}
                      </div>
                      <div className="text-sm text-muted-foreground">Próxima Parada</div>
                    </div>
                  </div>

                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Navigation className="h-12 w-12 mx-auto mb-4" />
                      <p>Mapa de rastreamento em tempo real</p>
                      <p className="text-sm">Posição: {routeTracking.currentPosition.latitude.toFixed(4)}, {routeTracking.currentPosition.longitude.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-4" />
                  <p>Rastreamento não disponível</p>
                  <p className="text-sm">Inicie a rota para começar o rastreamento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Histórico de Viagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>Histórico de viagens do motorista</p>
                <p className="text-sm">Rotas completadas, embarques, ocorrências</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
