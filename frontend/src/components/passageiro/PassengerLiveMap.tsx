import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bus, Clock3, MapPin, Navigation, QrCode, Radio, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PassengerRouteTracking } from '@/services/passengerTrackingService';
import { smartRoutingService, RoutingPoint } from '@/services/smartRoutingService';

const busIcon = L.divIcon({
  html: '<div style="background:#0891b2;color:#fff;width:38px;height:38px;border-radius:14px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px #0f172a55;font-size:18px">🚌</div>',
  className: 'passenger-live-bus', iconSize: [38, 38], iconAnchor: [19, 19],
});
const boardingIcon = L.divIcon({
  html: '<div style="background:#4f46e5;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 3px 9px #0f172a55;font-size:15px">●</div>',
  className: 'passenger-boarding-point', iconSize: [32, 32], iconAnchor: [16, 16],
});
const stopIcon = L.divIcon({
  html: '<div style="background:#059669;color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 7px #0f172a55;font-size:11px">•</div>',
  className: 'passenger-route-stop', iconSize: [26, 26], iconAnchor: [13, 13],
});

const FollowVehicle: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.6 });
  }, [map, position?.[0], position?.[1]]);
  return null;
};

interface PassengerLiveMapProps {
  tracking?: PassengerRouteTracking | null;
  lineName?: string;
  lineColor?: string;
  onOpenBoardingQr?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  lastRefreshAt?: string | null;
}

export const PassengerLiveMap: React.FC<PassengerLiveMapProps> = ({
  tracking = null,
  lineName,
  lineColor = '#0891b2',
  onOpenBoardingQr,
  isRefreshing = false,
  isLoading = false,
  lastRefreshAt,
}) => {
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [arrivalMinutes, setArrivalMinutes] = useState<number | null>(null);
  const [calculatingEta, setCalculatingEta] = useState(false);

  const routePoints = useMemo(() => (tracking?.points || [])
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [tracking?.points]);
  const routeFingerprint = routePoints.map((point) => `${point.latitude},${point.longitude}`).join(';');
  const boardingPoint = tracking?.boardingPoint || routePoints.find((point) => point.type === 'BOARDING') || null;
  const busPosition: [number, number] | null = tracking?.vehicleLatitude != null && tracking.vehicleLongitude != null
    ? [tracking.vehicleLatitude, tracking.vehicleLongitude]
    : null;
  const mapCenter = busPosition || (boardingPoint ? [boardingPoint.latitude, boardingPoint.longitude] as [number, number]
    : routePoints[0] ? [routePoints[0].latitude, routePoints[0].longitude] as [number, number] : [-19.9227, -43.9451] as [number, number]);
  const displayLineName = tracking?.routeName || lineName || 'Rota não vinculada';
  const locationIsFresh = tracking?.locationUpdatedAt
    ? Date.now() - new Date(tracking.locationUpdatedAt).getTime() < 2 * 60 * 1000
    : false;

  useEffect(() => {
    let active = true;
    if (routePoints.length < 2) {
      setRoutePolyline(routePoints.map((point) => [point.latitude, point.longitude] as [number, number]));
      return () => { active = false; };
    }
    const points: RoutingPoint[] = routePoints.map((point) => ({
      latitude: point.latitude, longitude: point.longitude, name: point.name, type: point.type as RoutingPoint['type'],
    }));
    void smartRoutingService.calculateRoute(points).then((result) => {
      if (active) setRoutePolyline(result.polyline);
    }).catch(() => {
      if (active) setRoutePolyline(routePoints.map((point) => [point.latitude, point.longitude] as [number, number]));
    });
    return () => { active = false; };
  }, [tracking?.routeId, routeFingerprint]);

  useEffect(() => {
    let active = true;
    if (!busPosition || !boardingPoint) {
      setArrivalMinutes(null);
      return () => { active = false; };
    }
    setCalculatingEta(true);
    void smartRoutingService.calculateRoute([
      { latitude: busPosition[0], longitude: busPosition[1], type: 'START' },
      { latitude: boardingPoint.latitude, longitude: boardingPoint.longitude, type: 'END' },
    ]).then((result) => {
      if (active) setArrivalMinutes(result.durationMinutes);
    }).catch(() => {
      if (active) setArrivalMinutes(null);
    }).finally(() => { if (active) setCalculatingEta(false); });
    return () => { active = false; };
  }, [tracking?.locationUpdatedAt, tracking?.vehicleLatitude, tracking?.vehicleLongitude, boardingPoint?.latitude, boardingPoint?.longitude]);

  if (isLoading && !tracking) {
    return <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-7 text-center text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><RefreshCw className="h-7 w-7 animate-spin text-cyan-600"/><p className="mt-3 text-sm font-medium">Buscando sua rota e o veículo...</p></div>;
  }
  if (!tracking?.assigned) {
    return <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-7 text-center dark:border-slate-800 dark:bg-slate-900">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-200"><Bus className="h-6 w-6"/></span>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Nenhuma rota vinculada</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">Quando a empresa atribuir uma rota e um ponto de embarque ao seu cadastro, o acompanhamento aparecerá aqui.</p>
    </div>;
  }
  if (!busPosition && routePoints.length === 0 && !boardingPoint) {
    return <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-7 text-center dark:border-amber-900/60 dark:bg-amber-950/20">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"><MapPin className="h-6 w-6"/></span>
      <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Rota sem localização cadastrada</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-400">A rota {displayLineName} está vinculada, mas ainda não possui coordenadas dos pontos de embarque. A empresa precisa completar o traçado para liberar o mapa.</p>
    </div>;
  }

  return <div className="relative h-[68vh] max-h-[560px] min-h-[360px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-lg dark:border-slate-800 dark:bg-slate-900">
    <MapContainer key={`${tracking.routeId}-${tracking.direction}`} center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl>
      <FollowVehicle position={busPosition}/>
      <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}/>
      {routePolyline.length > 1 && <Polyline positions={routePolyline} color={tracking.color || lineColor} weight={6} opacity={0.82}/>}
      {routePoints.map((point, index) => <Marker key={point.id || `${point.latitude}-${point.longitude}-${index}`} position={[point.latitude, point.longitude]} icon={point.id === boardingPoint?.id ? boardingIcon : stopIcon}><Popup><strong>{point.name}</strong><br/>{point.type === 'BOARDING' ? 'Ponto de embarque' : point.type === 'DEBARKATION' ? 'Ponto de desembarque' : point.type === 'START' ? 'Origem' : 'Destino'}</Popup></Marker>)}
      {boardingPoint && !routePoints.some((point) => point.id === boardingPoint.id) && <Marker position={[boardingPoint.latitude, boardingPoint.longitude]} icon={boardingIcon}><Popup>Seu embarque: {boardingPoint.name}</Popup></Marker>}
      {busPosition && <Marker position={busPosition} icon={busIcon}><Popup><strong>{tracking.vehiclePlate || 'Veículo da rota'}</strong><br/>{tracking.driverName || 'Motorista não informado'}<br/>{arrivalMinutes != null ? `Chegada estimada: ${arrivalMinutes} min` : 'Calculando chegada…'}</Popup></Marker>}
    </MapContainer>

    <div className="pointer-events-none absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-start justify-between gap-2 sm:left-4 sm:right-4 sm:top-4">
      <Badge className="pointer-events-auto max-w-[75%] gap-2 truncate border border-white/20 bg-slate-950/90 px-3 py-2 text-white shadow-lg backdrop-blur"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tracking.color || lineColor }}/><span className="truncate">{displayLineName} · {tracking.direction}</span></Badge>
      <Badge className={`pointer-events-auto gap-1.5 border-0 px-2.5 py-1.5 shadow-lg ${locationIsFresh ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'}`}><Radio className={`h-3.5 w-3.5 ${locationIsFresh ? 'animate-pulse' : ''}`}/>{locationIsFresh ? 'Ao vivo' : 'Aguardando GPS'}</Badge>
    </div>

    <div className="absolute bottom-3 left-3 right-3 z-[1000] sm:bottom-4 sm:left-4 sm:right-4">
      <div className="space-y-3 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-xl sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300"><Bus className="h-5 w-5"/></span><div className="min-w-0"><p className="truncate text-sm font-bold">{tracking.vehiclePlate || 'Veículo ainda não iniciou'}</p><p className="truncate text-xs text-slate-400">{tracking.driverName ? `Motorista: ${tracking.driverName}` : tracking.executionStatus === 'SCHEDULED' ? 'Viagem programada' : 'Aguardando identificação do veículo'}</p></div></div>
          <div className="shrink-0 text-right"><p className="text-[10px] font-semibold uppercase text-slate-400">Até seu ponto</p><p className="text-lg font-black text-cyan-300">{arrivalMinutes != null ? `${arrivalMinutes} min` : calculatingEta ? '…' : '—'}</p></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-xs"><span className="flex min-w-0 items-center gap-1.5 truncate text-slate-300"><MapPin className="h-3.5 w-3.5 shrink-0 text-indigo-300"/>{boardingPoint?.name || 'Ponto de embarque não cadastrado'}</span><span className="flex shrink-0 items-center gap-1 text-slate-400">{isRefreshing ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Clock3 className="h-3 w-3"/>}{lastRefreshAt ? `Atualizado ${new Date(lastRefreshAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : tracking.locationUpdatedAt ? `GPS ${new Date(tracking.locationUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Sem posição recente'}</span></div>
        {onOpenBoardingQr && <Button onClick={onOpenBoardingQr} className="w-full gap-2 bg-cyan-600 font-semibold text-white hover:bg-cyan-500"><QrCode className="h-4 w-4"/>Abrir meu cartão de embarque</Button>}
      </div>
    </div>
    {!busPosition && <div className="pointer-events-none absolute inset-x-0 top-16 z-[900] flex justify-center px-4"><div className="rounded-lg bg-white/95 px-3 py-2 text-center text-xs font-medium text-slate-700 shadow dark:bg-slate-900/95 dark:text-slate-200"><Navigation className="mr-1 inline h-3.5 w-3.5"/>Rota carregada. O veículo aparecerá quando o motorista iniciar a viagem e compartilhar a localização.</div></div>}
  </div>;
};

export default PassengerLiveMap;
