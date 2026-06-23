import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Route, 
  Upload, 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Navigation, 
  Clock, 
  Users, 
  Car, 
  FileText,
  Download,
  Eye,
  Save,
  X
} from 'lucide-react';
import corporateShuttleService from '@/services/corporateShuttleService';
import { Route, WayPoint } from '@/services/corporateShuttleService';
import RouteVisualization from './RouteVisualization';

interface RouteFormData {
  name: string;
  description: string;
  vehicleId: string;
  driverId: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  distance: number;
  addresses: string[];
  schedule: {
    dayOfWeek: string;
    departureTime: string;
    returnTime: string;
    active: boolean;
  }[];
}

export default function RouteManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [viewingRoute, setViewingRoute] = useState<Route | null>(null);
  const [formData, setFormData] = useState<RouteFormData>({
    name: '',
    description: '',
    vehicleId: '',
    driverId: '',
    startTime: '',
    endTime: '',
    estimatedDuration: 0,
    distance: 0,
    addresses: [],
    schedule: [
      { dayOfWeek: 'MONDAY', departureTime: '08:00', returnTime: '18:00', active: true },
      { dayOfWeek: 'TUESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
      { dayOfWeek: 'WEDNESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
      { dayOfWeek: 'THURSDAY', departureTime: '08:00', returnTime: '18:00', active: true },
      { dayOfWeek: 'FRIDAY', departureTime: '08:00', returnTime: '18:00', active: true }
    ]
  });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const routesData = await corporateShuttleService.getAllRoutes();
      setRoutes(routesData);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
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
          setLoading(true);
          
          let kmlData: string;
          
          if (file.name.toLowerCase().endsWith('.kmz')) {
            // Handle KMZ file
            const arrayBuffer = await file.arrayBuffer();
            // Import KMZ parser service and parse
            const kmlParserService = await import('../../services/kmlParserService').then(m => m.default);
            const parsedKMZ = await kmlParserService.parseKMZ(arrayBuffer);
            
            // Convert parsed data back to KML string for the service
            kmlData = generateKMLStringFromParsed(parsedKMZ);
          } else {
            // Handle KML file
            kmlData = await file.text();
          }
          
          const newRoute = await corporateShuttleService.importRouteFromKML(kmlData);
          await loadRoutes();
          setShowImportModal(false);
          
          // Show detailed success message
          alert(`Rota "${newRoute.name}" importada com sucesso!\n\n` +
                `📍 ${newRoute.wayPoints.length} pontos de parada\n` +
                `📏 ${newRoute.distance} km\n` +
                `⏱️ ${newRoute.estimatedDuration} minutos\n` +
                `🚐 Veículo: ${newRoute.vehiclePlate}`);
        } catch (error) {
          console.error('Erro ao importar arquivo:', error);
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          alert(`Erro ao importar arquivo: ${errorMessage}\n\nVerifique se o arquivo contém coordenadas válidas e está no formato KML/KMZ correto.`);
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  // Helper function to generate KML string from parsed data (for KMZ handling)
  const generateKMLStringFromParsed = (parsedData: any): string => {
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${parsedData.name || 'Rota Importada'}</name>
    ${parsedData.description ? `<description>${parsedData.description}</description>` : ''}`;
    
    let placemarks = '';
    parsedData.wayPoints.forEach((wp: any, index: number) => {
      placemarks += `
    <Placemark>
      <name>${wp.name || `Ponto ${index + 1}`}</name>
      ${wp.description ? `<description>${wp.description}</description>` : ''}
      <Point>
        <coordinates>${wp.coordinates.longitude},${wp.coordinates.latitude}${wp.coordinates.altitude ? `,${wp.coordinates.altitude}` : ''}</coordinates>
      </Point>
    </Placemark>`;
    });
    
    parsedData.routes.forEach((route: any) => {
      const coords = route.coordinates.map((coord: any) => 
        `${coord.longitude},${coord.latitude}${coord.altitude ? `,${coord.altitude}` : ''}`
      ).join(' ');
      
      placemarks += `
    <Placemark>
      <name>${route.name}</name>
      ${route.description ? `<description>${route.description}</description>` : ''}
      <LineString>
        <coordinates>${coords}</coordinates>
      </LineString>
    </Placemark>`;
    });
    
    const kmlFooter = `
  </Document>
</kml>`;
    
    return kmlHeader + placemarks + kmlFooter;
  };

  const handleGenerateRoute = async () => {
    if (formData.addresses.length === 0) {
      alert('Adicione pelo menos um endereço para gerar a rota');
      return;
    }

    try {
      setLoading(true);
      const newRoute = await corporateShuttleService.generateRouteFromAddresses(formData.addresses);
      await loadRoutes();
      setShowCreateModal(false);
      resetForm();
      alert(`Rota "${newRoute.name}" gerada com sucesso!`);
    } catch (error) {
      console.error('Erro ao gerar rota:', error);
      alert('Erro ao gerar rota. Verifique os endereços informados.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      name: route.name,
      description: route.description,
      vehicleId: route.vehicleId,
      driverId: route.driverId,
      startTime: route.startTime,
      endTime: route.endTime,
      estimatedDuration: route.estimatedDuration,
      distance: route.distance,
      addresses: route.wayPoints.map(wp => wp.address),
      schedule: route.schedule
    });
    setShowCreateModal(true);
  };

  const handleViewRoute = (route: Route) => {
    setViewingRoute(route);
  };

  const handleCloseView = () => {
    setViewingRoute(null);
  };

  const handleSaveRoute = async () => {
    try {
      setLoading(true);
      
      if (editingRoute) {
        await corporateShuttleService.updateRoute(editingRoute.id, {
          name: formData.name,
          description: formData.description,
          vehicleId: formData.vehicleId,
          driverId: formData.driverId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          estimatedDuration: formData.estimatedDuration,
          distance: formData.distance,
          schedule: formData.schedule
        });
      } else {
        await corporateShuttleService.createRoute({
          name: formData.name,
          description: formData.description,
          vehicleId: formData.vehicleId,
          driverId: formData.driverId,
          startTime: formData.startTime,
          endTime: formData.endTime,
          estimatedDuration: formData.estimatedDuration,
          distance: formData.distance,
          wayPoints: [], // Será gerado automaticamente
          employees: [],
          status: 'ACTIVE',
          schedule: formData.schedule
        });
      }
      
      await loadRoutes();
      setShowCreateModal(false);
      resetForm();
      alert(editingRoute ? 'Rota atualizada com sucesso!' : 'Rota criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar rota:', error);
      alert('Erro ao salvar rota');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta rota?')) {
      return;
    }

    try {
      setLoading(true);
      await corporateShuttleService.deleteRoute(routeId);
      await loadRoutes();
      alert('Rota excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir rota:', error);
      alert('Erro ao excluir rota');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      vehicleId: '',
      driverId: '',
      startTime: '',
      endTime: '',
      estimatedDuration: 0,
      distance: 0,
      addresses: [],
      schedule: [
        { dayOfWeek: 'MONDAY', departureTime: '08:00', returnTime: '18:00', active: true },
        { dayOfWeek: 'TUESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
        { dayOfWeek: 'WEDNESDAY', departureTime: '08:00', returnTime: '18:00', active: true },
        { dayOfWeek: 'THURSDAY', departureTime: '08:00', returnTime: '18:00', active: true },
        { dayOfWeek: 'FRIDAY', departureTime: '08:00', returnTime: '18:00', active: true }
      ]
    });
    setEditingRoute(null);
  };

  const addAddress = () => {
    const newAddress = prompt('Digite o endereço:');
    if (newAddress && newAddress.trim()) {
      setFormData(prev => ({
        ...prev,
        addresses: [...prev.addresses, newAddress.trim()]
      }));
    }
  };

  const removeAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addresses: prev.addresses.filter((_, i) => i !== index)
    }));
  };

  const getRouteStatusColor = (status: Route['status']) => {
    return corporateShuttleService.getRouteStatusColor(status);
  };

  const getRouteStatusLabel = (status: Route['status']) => {
    return corporateShuttleService.getRouteStatusLabel(status);
  };

  if (loading && routes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Route className="h-5 w-5" />
            Gestão de Rotas
          </h3>
          <p className="text-sm text-muted-foreground">
            Importe rotas KML/KMZ ou gere por endereços
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setShowImportModal(true)} variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Importar KML
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Rota
          </Button>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {routes.map((route) => (
          <Card key={route.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Route className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-bold text-lg">{route.name}</div>
                      <div className="text-sm text-muted-foreground">{route.description}</div>
                    </div>
                    <Badge className={getRouteStatusColor(route.status)}>
                      {getRouteStatusLabel(route.status)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{route.vehiclePlate}</div>
                        <div className="text-muted-foreground">{route.vehicleBrand} {route.vehicleModel}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{route.driverName}</div>
                        <div className="text-muted-foreground">Motorista</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{route.startTime} - {route.endTime}</div>
                        <div className="text-muted-foreground">{route.estimatedDuration} min</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{route.distance} km</div>
                        <div className="text-muted-foreground">{route.wayPoints.length} pontos</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm font-medium mb-2">Pontos de Parada:</div>
                    <div className="flex flex-wrap gap-2">
                      {route.wayPoints.slice(0, 3).map((wayPoint, index) => (
                        <Badge key={wayPoint.id} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {wayPoint.address.split(',')[0]}
                        </Badge>
                      ))}
                      {route.wayPoints.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{route.wayPoints.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleViewRoute(route)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditRoute(route)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRoute(route.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Importar Rota (KML/KMZ)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Selecione um arquivo KML ou KMZ contendo os pontos da rota. 
                    O sistema irá processar e criar a rota automaticamente.
                  </AlertDescription>
                </Alert>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    Arraste um arquivo KML/KMZ aqui ou clique para selecionar
                  </p>
                  <Button onClick={handleImportKML} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivo
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowImportModal(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingRoute ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingRoute ? 'Editar Rota' : 'Nova Rota'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                  <TabsTrigger value="addresses">Endereços</TabsTrigger>
                  <TabsTrigger value="schedule">Horários</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Rota</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Rota Centro - Zona Sul"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Veículo</label>
                      <Select value={formData.vehicleId} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o veículo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="veh-001">ABC-1234 - Mercedes-Benz Sprinter</SelectItem>
                          <SelectItem value="veh-002">DEF-5678 - Volkswagen Constellation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Motorista</label>
                      <Select value={formData.driverId} onValueChange={(value) => setFormData(prev => ({ ...prev, driverId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motorista" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver-001">João Silva</SelectItem>
                          <SelectItem value="driver-002">Carlos Santos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Horário de Saída</label>
                      <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Horário de Chegada</label>
                      <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duração Estimada (min)</label>
                      <Input
                        type="number"
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                        placeholder="120"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Distância (km)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.distance}
                        onChange={(e) => setFormData(prev => ({ ...prev, distance: parseFloat(e.target.value) || 0 }))}
                        placeholder="25.5"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Descrição</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição detalhada da rota..."
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="addresses" className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">Endereços da Rota</label>
                      <Button onClick={addAddress} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Endereço
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.addresses.map((address, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <Input
                            value={address}
                            onChange={(e) => {
                              const newAddresses = [...formData.addresses];
                              newAddresses[index] = e.target.value;
                              setFormData(prev => ({ ...prev, addresses: newAddresses }));
                            }}
                            placeholder="Endereço completo"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAddress(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {formData.addresses.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-12 w-12 mx-auto mb-4" />
                          <p>Nenhum endereço adicionado</p>
                          <p className="text-sm">Clique em "Adicionar Endereço" para começar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Horários Semanais</label>
                    <div className="space-y-3">
                      {formData.schedule.map((schedule, index) => (
                        <div key={schedule.dayOfWeek} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="w-24">
                            <span className="text-sm font-medium">
                              {schedule.dayOfWeek === 'MONDAY' ? 'Segunda' :
                               schedule.dayOfWeek === 'TUESDAY' ? 'Terça' :
                               schedule.dayOfWeek === 'WEDNESDAY' ? 'Quarta' :
                               schedule.dayOfWeek === 'THURSDAY' ? 'Quinta' : 'Sexta'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={schedule.departureTime}
                              onChange={(e) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[index].departureTime = e.target.value;
                                setFormData(prev => ({ ...prev, schedule: newSchedule }));
                              }}
                            />
                            <span className="text-sm text-muted-foreground">Saída</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={schedule.returnTime}
                              onChange={(e) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[index].returnTime = e.target.value;
                                setFormData(prev => ({ ...prev, schedule: newSchedule }));
                              }}
                            />
                            <span className="text-sm text-muted-foreground">Retorno</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={schedule.active}
                              onChange={(e) => {
                                const newSchedule = [...formData.schedule];
                                newSchedule[index].active = e.target.checked;
                                setFormData(prev => ({ ...prev, schedule: newSchedule }));
                              }}
                            />
                            <span className="text-sm">Ativo</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                {editingRoute ? (
                  <Button onClick={handleSaveRoute} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Button>
                ) : (
                  <Button onClick={handleGenerateRoute} disabled={loading}>
                    <Navigation className="h-4 w-4 mr-2" />
                    {loading ? 'Gerando...' : 'Gerar Rota'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}</Card>

      {/* Route View Modal */}
      {viewingRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Visualização da Rota</h3>
                <Button variant="ghost" onClick={handleCloseView}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="p-6">
              <RouteVisualization 
                route={viewingRoute} 
                showMap={true}
                showDetails={true}
                compact={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
