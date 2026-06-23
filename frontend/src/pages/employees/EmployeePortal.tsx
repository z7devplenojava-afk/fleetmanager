import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Bus, 
  MapPin, 
  Clock, 
  Calendar, 
  Navigation, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  QrCode,
  Route,
  Car,
  MessageSquare,
  Bell,
  History
} from 'lucide-react';
import corporateShuttleService from '@/services/corporateShuttleService';
import { Employee, Route, Driver, BoardingConfirmation } from '@/services/corporateShuttleService';

export default function EmployeePortal() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [boardingHistory, setBoardingHistory] = useState<BoardingConfirmation[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, []);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      // Simular funcionário logado (em produção, viria do auth)
      const employeeId = 'emp-001';
      const employee = await corporateShuttleService.getEmployeeById(employeeId);
      
      if (employee) {
        setCurrentEmployee(employee);
        setQrCode(employee.qrCode);
        
        // Carregar rota do funcionário
        const route = await corporateShuttleService.getRouteById(employee.routeId);
        if (route) {
          setCurrentRoute(route);
          
          // Carregar motorista da rota
          const driver = await corporateShuttleService.getDriverById(route.driverId);
          setCurrentDriver(driver || null);
        }
        
        // Carregar histórico de embarques
        const history = await corporateShuttleService.getBoardingConfirmations(undefined, employeeId);
        setBoardingHistory(history);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do funcionário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShowQRCode = () => {
    if (currentEmployee) {
      alert(`Seu QR Code: ${currentEmployee.qrCode}\n\nApresente este código ao motorista para confirmar seu embarque.`);
    }
  };

  const handleContactDriver = () => {
    if (currentDriver) {
      alert(`Contato do motorista: ${currentDriver.phone}`);
    }
  };

  const handleEmergencyContact = () => {
    alert('Contato de emergência: 0800-123-4567');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTodayBoarding = () => {
    const today = new Date().toDateString();
    return boardingHistory.filter(c => {
      const confirmationDate = new Date(c.confirmedAt).toDateString();
      return today === confirmationDate;
    });
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'GOING' ? 'Ida' : 'Volta';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentEmployee) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Funcionário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portal do Funcionário</h1>
          <p className="text-muted-foreground">Bem-vindo, {currentEmployee.name}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleEmergencyContact}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergência
          </Button>
          <Button onClick={handleShowQRCode}>
            <QrCode className="h-4 w-4 mr-2" />
            Meu QR Code
          </Button>
        </div>
      </div>

      {/* Today's Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Bus className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="font-bold text-lg">Status do Dia</div>
                  <div className="text-sm text-muted-foreground">
                    {getTodayBoarding().length > 0 ? 'Embarque confirmado' : 'Aguardando embarque'}
                  </div>
                </div>
              </div>
            </div>
            
            {getTodayBoarding().length > 0 && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                Embarque Confirmado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Minha Rota</TabsTrigger>
          <TabsTrigger value="tracking">Rastreamento</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          {/* Route Info */}
          {currentRoute && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Minha Rota
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Nome da Rota</span>
                      <div className="text-lg font-bold">{currentRoute.name}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Horário</span>
                      <div className="text-lg font-bold">{currentRoute.startTime} - {currentRoute.endTime}</div>
                    </div>
                  </div>

                  {/* Driver Info */}
                  {currentDriver && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <User className="h-8 w-8 text-green-600" />
                            <div>
                              <div className="font-bold">{currentDriver.name}</div>
                              <div className="text-sm text-muted-foreground">Motorista</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800">
                              Ativo
                            </Badge>
                            <Button variant="outline" size="sm" onClick={handleContactDriver}>
                              <Phone className="h-4 w-4 mr-2" />
                              Contatar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Vehicle Info */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-bold">{currentRoute.vehiclePlate}</div>
                          <div className="text-sm text-muted-foreground">
                            {currentRoute.vehicleBrand} {currentRoute.vehicleModel}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Boarding Info */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-8 w-8 text-orange-600" />
                        <div className="flex-1">
                          <div className="font-bold">Ponto de Embarque</div>
                          <div className="text-sm">{currentEmployee.boardingAddress}</div>
                          <div className="text-sm text-muted-foreground">
                            Horário: {currentEmployee.boardingTime}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code de Embarque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="bg-gray-100 rounded-lg p-8">
                  <QrCode className="h-32 w-32 mx-auto text-gray-600" />
                </div>
                <div>
                  <div className="font-mono text-sm mb-2">{qrCode}</div>
                  <p className="text-sm text-muted-foreground">
                    Apresente este QR Code ao motorista para confirmar seu embarque
                  </p>
                </div>
                <Button onClick={handleShowQRCode} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Exibir QR Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Rastreamento da Rota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">--</div>
                    <div className="text-sm text-muted-foreground">Velocidade do Veículo</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">--</div>
                    <div className="text-sm text-muted-foreground">Próximo Ponto</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">--</div>
                    <div className="text-sm text-muted-foreground">Previsão de Chegada</div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Navigation className="h-12 w-12 mx-auto mb-4" />
                    <p>Mapa de rastreamento em tempo real</p>
                    <p className="text-sm">Acompanhe a posição do veículo</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notificações</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Você receberá notificações quando o veículo estiver próximo ao seu ponto de embarque
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Embarques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {boardingHistory.length > 0 ? (
                  boardingHistory.map((confirmation) => (
                    <Card key={confirmation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <div className="font-bold">{confirmation.routeName}</div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(confirmation.confirmedAt)}
                              </div>
                              <div className="text-sm">
                                {getDirectionLabel(confirmation.direction)} - Veículo: {confirmation.vehiclePlate}
                              </div>
                            </div>
                          </div>
                          
                          <Badge className="bg-green-100 text-green-800">
                            Confirmado
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum histórico de embarques encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Nome</span>
                    <div className="text-lg font-bold">{currentEmployee.name}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">CPF</span>
                    <div className="text-lg font-bold">{currentEmployee.cpf}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Empresa</span>
                    <div className="text-lg font-bold">{currentEmployee.clientCompany}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Departamento</span>
                    <div className="text-lg font-bold">{currentEmployee.department}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Cargo</span>
                    <div className="text-lg font-bold">{currentEmployee.position}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Telefone</span>
                    <div className="text-lg font-bold">{currentEmployee.phone}</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Informações da Rota</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Ponto de Embarque</span>
                      <div className="text-sm">{currentEmployee.boardingAddress}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Horário de Embarque</span>
                      <div className="text-sm">{currentEmployee.boardingTime}</div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Suporte
                  </Button>
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Configurar Notificações
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
