import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Route, 
  Car, 
  Users, 
  Eye,
  Download,
  Share2,
  Maximize2,
  Layers
} from 'lucide-react';
import { Route, WayPoint } from '@/services/corporateShuttleService';

interface RouteVisualizationProps {
  route: Route;
  showMap?: boolean;
  showDetails?: boolean;
  compact?: boolean;
}

export default function RouteVisualization({ 
  route, 
  showMap = true, 
  showDetails = true,
  compact = false 
}: RouteVisualizationProps) {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [showFullMap, setShowFullMap] = useState(false);

  useEffect(() => {
    if (route.wayPoints.length > 0) {
      // Calculate center point
      const avgLat = route.wayPoints.reduce((sum, wp) => sum + wp.latitude, 0) / route.wayPoints.length;
      const avgLng = route.wayPoints.reduce((sum, wp) => sum + wp.longitude, 0) / route.wayPoints.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
      
      // Calculate appropriate zoom based on route spread
      const maxLat = Math.max(...route.wayPoints.map(wp => wp.latitude));
      const minLat = Math.min(...route.wayPoints.map(wp => wp.latitude));
      const maxLng = Math.max(...route.wayPoints.map(wp => wp.longitude));
      const minLng = Math.min(...route.wayPoints.map(wp => wp.longitude));
      
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff < 0.01) setMapZoom(15);
      else if (maxDiff < 0.05) setMapZoom(13);
      else if (maxDiff < 0.1) setMapZoom(12);
      else if (maxDiff < 0.5) setMapZoom(11);
      else setMapZoom(10);
    }
  }, [route]);

  const getWayPointIcon = (type: string) => {
    switch (type) {
      case 'BOARDING':
        return '🚌';
      case 'DROPOFF':
        return '🏢';
      default:
        return '📍';
    }
  };

  const getWayPointTypeLabel = (type: string) => {
    switch (type) {
      case 'BOARDING':
        return 'Embarque';
      case 'DROPOFF':
        return 'Desembarque';
      case 'WAYPOINT':
        return 'Parada';
      default:
        return 'Ponto';
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const generateMapUrl = () => {
    if (!mapCenter) return '';
    
    const waypoints = route.wayPoints.map(wp => `${wp.latitude},${wp.longitude}`).join('/');
    return `https://www.google.com/maps/dir/${waypoints}`;
  };

  const generateStaticMapUrl = () => {
    if (!mapCenter) return '';
    
    const markers = route.wayPoints.map((wp, index) => {
      const color = wp.type === 'BOARDING' ? 'green' : wp.type === 'DROPOFF' ? 'red' : 'blue';
      const label = String(index + 1);
      return `${wp.latitude},${wp.longitude},${color},${label}`;
    }).join('|');
    
    const path = route.wayPoints.map(wp => `${wp.latitude},${wp.longitude}`).join('|');
    
    return `https://maps.googleapis.com/maps/api/staticmap?` +
      `center=${mapCenter.lat},${mapCenter.lng}&` +
      `zoom=${mapZoom}&` +
      `size=${compact ? '400x300' : showFullMap ? '1200x800' : '800x600'}&` +
      `maptype=roadmap&` +
      `markers=${markers}&` +
      `path=color:0x0000ff|weight:3|${path}&` +
      `key=YOUR_API_KEY`;
  };

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-bold text-sm">{route.name}</div>
                <div className="text-xs text-muted-foreground">{route.distance} km • {route.estimatedDuration} min</div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">
              {route.wayPoints.length} pontos
            </Badge>
          </div>
          
          <div className="space-y-2">
            {route.wayPoints.slice(0, 3).map((wayPoint, index) => (
              <div key={wayPoint.id} className="flex items-center gap-2 text-xs">
                <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="truncate">{wayPoint.address}</span>
                <span className="text-muted-foreground">{wayPoint.estimatedTime}</span>
              </div>
            ))}
            {route.wayPoints.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{route.wayPoints.length - 3} pontos adicionais
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Route Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Route className="h-6 w-6 text-blue-600" />
              <div>
                <div className="font-bold text-lg">{route.name}</div>
                <div className="text-sm text-muted-foreground">{route.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                {route.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
              </Badge>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>

          {/* Route Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{route.distance} km</div>
              <div className="text-sm text-muted-foreground">Distância Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{route.estimatedDuration} min</div>
              <div className="text-sm text-muted-foreground">Duração Estimada</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{route.wayPoints.length}</div>
              <div className="text-sm text-muted-foreground">Pontos de Parada</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{route.startTime}</div>
              <div className="text-sm text-muted-foreground">Horário de Início</div>
            </div>
          </div>

          {/* Vehicle and Driver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Car className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">{route.vehiclePlate}</div>
                <div className="text-sm text-muted-foreground">
                  {route.vehicleBrand} {route.vehicleModel}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-gray-600" />
              <div>
                <div className="font-medium">{route.driverName}</div>
                <div className="text-sm text-muted-foreground">Motorista</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Visualization */}
      {showMap && mapCenter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Visualização da Rota
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFullMap(!showFullMap)}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  {showFullMap ? 'Reduzir' : 'Ampliar'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(generateMapUrl(), '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Google Maps
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`relative ${showFullMap ? 'h-[600px]' : 'h-[400px]'} bg-gray-100 rounded-lg overflow-hidden`}>
              {/* Static Map Preview */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Navigation className="h-12 w-12 mx-auto mb-4" />
                  <p className="font-medium">Mapa da Rota</p>
                  <p className="text-sm mb-4">
                    {route.wayPoints.length} pontos • {route.distance} km
                  </p>
                  
                  {/* Route Path Visualization */}
                  <div className="relative w-64 h-32 mx-auto mb-4">
                    <svg className="w-full h-full" viewBox="0 0 256 128">
                      {/* Draw simplified path */}
                      <path
                        d={`M ${route.wayPoints.map((wp, i) => {
                          const x = (i / (route.wayPoints.length - 1)) * 240 + 8;
                          const y = 64 + (Math.sin(i * 0.5) * 20);
                          return `${x},${y}`;
                        }).join(' L ')}`}
                        stroke="#3b82f6"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray="5,5"
                      />
                      
                      {/* Draw waypoints */}
                      {route.wayPoints.map((wp, i) => {
                        const x = (i / (route.wayPoints.length - 1)) * 240 + 8;
                        const y = 64 + (Math.sin(i * 0.5) * 20);
                        const color = wp.type === 'BOARDING' ? '#10b981' : wp.type === 'DROPOFF' ? '#ef4444' : '#6366f1';
                        
                        return (
                          <g key={wp.id}>
                            <circle
                              cx={x}
                              cy={y}
                              r="8"
                              fill={color}
                              stroke="white"
                              strokeWidth="2"
                            />
                            <text
                              x={x}
                              y={y + 4}
                              textAnchor="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {i + 1}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  
                  <div className="flex justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Embarque</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Parada</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Desembarque</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button variant="outline" size="sm" className="bg-white">
                  <Layers className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-white">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* WayPoints Details */}
      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Pontos de Parada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {route.wayPoints.map((wayPoint, index) => (
                <div 
                  key={wayPoint.id} 
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      wayPoint.type === 'BOARDING' 
                        ? 'bg-green-500' 
                        : wayPoint.type === 'DROPOFF' 
                        ? 'bg-red-500' 
                        : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{wayPoint.address}</span>
                      <Badge variant="outline" className="text-xs">
                        {getWayPointTypeLabel(wayPoint.type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {wayPoint.estimatedTime}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {formatCoordinates(wayPoint.latitude, wayPoint.longitude)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span>{getWayPointIcon(wayPoint.type)}</span>
                      </div>
                    </div>
                    
                    {wayPoint.employeeName && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Funcionário:</span> {wayPoint.employeeName}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Opções de Exportação</h4>
              <p className="text-sm text-muted-foreground">
                Exporte esta rota em diferentes formatos
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                KML
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                GPX
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
