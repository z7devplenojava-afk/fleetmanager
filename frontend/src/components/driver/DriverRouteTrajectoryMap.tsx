import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/button';
import {
  MapPin,
  Navigation,
  ArrowRight,
  ArrowLeftRight,
  Gauge,
  Clock,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { Schedule, inferDirectionFromRouteCode } from '@/services/scheduleService';

interface DriverRouteTrajectoryMapProps {
  schedules: Schedule[];
  selectedScheduleId?: string;
  driverName?: string;
  height?: string;
}

interface TrajectoryLeg {
  id: string;
  direction: 'IDA' | 'RETORNO';
  routeCode: string;
  clientName: string;
  startTime: string;
  endTime: string;
  initialKm?: number;
  finalKm?: number;
  startLat: number;
  startLng: number;
  startAddress: string;
  endLat: number;
  endLng: number;
  endAddress: string;
  hasEndPoint: boolean;
}

export const DriverRouteTrajectoryMap: React.FC<DriverRouteTrajectoryMapProps> = ({
  schedules,
  selectedScheduleId,
  driverName,
  height = '340px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IDA' | 'RETORNO'>('ALL');

  const legs: TrajectoryLeg[] = useMemo(() => {
    const valid = schedules.filter(
      (s) => s.initialKm != null || s.startLatitude != null || s.pointStatus === 'APPROVED' || s.pointStatus === 'PENDING_TRAFFIC_APPROVAL'
    );

    const listToMap = valid.length > 0 ? valid : schedules.slice(0, 2);

    return listToMap.map((s, idx) => {
      const dir = s.direction || inferDirectionFromRouteCode(s.routeCode || s.route?.name);
      const defaultStart =
        dir === 'IDA'
          ? { lat: -19.9386, lng: -44.0528, addr: 'Av. Babita Camargos, 1295 - Cidade Industrial, Contagem/MG' }
          : { lat: -19.9668, lng: -44.1984, addr: 'Rod. Fernão Dias, KM 492 - Distrito Industrial, Betim/MG' };

      const defaultEnd =
        dir === 'IDA'
          ? { lat: -19.9668, lng: -44.1984, addr: 'Rod. Fernão Dias, KM 492 - Distrito Industrial, Betim/MG' }
          : { lat: -19.9386, lng: -44.0528, addr: 'Av. Babita Camargos, 1295 - Cidade Industrial, Contagem/MG' };

      const sLat = s.startLatitude ?? defaultStart.lat + idx * 0.004;
      const sLng = s.startLongitude ?? defaultStart.lng + idx * 0.004;
      const sAddr = s.startAddress || defaultStart.addr;

      const hasEnd = s.finalKm != null || s.endLatitude != null;
      const eLat = s.endLatitude ?? (hasEnd ? defaultEnd.lat : sLat - 0.025);
      const eLng = s.endLongitude ?? (hasEnd ? defaultEnd.lng : sLng - 0.038);
      const eAddr = s.endAddress || (hasEnd ? defaultEnd.addr : 'Em deslocamento (aguardando KM Final)');

      return {
        id: s.id,
        direction: dir,
        routeCode: s.routeCode || s.route?.name || '01 - CASA/PONTO',
        clientName: s.clientName || s.workPost?.client?.name || s.location?.name || 'Operação',
        startTime: s.startTime || '--:--',
        endTime: s.endTime || (hasEnd ? '--:--' : 'Em curso'),
        initialKm: s.initialKm,
        finalKm: s.finalKm,
        startLat: sLat,
        startLng: sLng,
        startAddress: sAddr,
        endLat: eLat,
        endLng: eLng,
        endAddress: eAddr,
        hasEndPoint: hasEnd,
      };
    });
  }, [schedules]);

  const filteredLegs = useMemo(() => {
    if (directionFilter === 'ALL') return legs;
    return legs.filter((l) => l.direction === directionFilter);
  }, [legs, directionFilter]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-19.945, -44.08],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const lg = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = lg;
    }

    const map = mapInstanceRef.current;
    const lg = layerGroupRef.current;
    if (!map || !lg) return;

    lg.clearLayers();

    if (filteredLegs.length === 0) return;

    const boundsPoints: L.LatLngExpression[] = [];

    const drawLeg = async (leg: TrajectoryLeg) => {
      const isIda = leg.direction === 'IDA';
      const primaryColor = isIda ? '#10b981' : '#f59e0b'; // Verde Esmeralda para IDA, Âmbar/Laranja para RETORNO

      const startIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `<div style="background:${primaryColor};color:#090d16;font-weight:900;font-size:10px;padding:3px 7px;border-radius:999px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.6);white-space:nowrap;">
          ${leg.direction}: KM Ini ${leg.initialKm ?? '—'}
        </div>`,
        iconSize: [95, 24],
        iconAnchor: [47, 12],
      });

      const startMarker = L.marker([leg.startLat, leg.startLng], { icon: startIcon });
      startMarker.bindPopup(
        `<div style="font-size:12px;line-height:1.4;min-width:210px;">
          <strong>🟢 Ponto Inicial (${leg.direction})</strong><br/>
          <b>Percurso:</b> ${leg.routeCode}<br/>
          <b>Cliente:</b> ${leg.clientName}<br/>
          <b>Horário Inicial:</b> ${leg.startTime}<br/>
          <b>KM Inicial:</b> ${leg.initialKm ?? '—'} km<br/>
          <b>Endereço GPS:</b> ${leg.startAddress}
        </div>`
      );
      startMarker.addTo(lg);
      boundsPoints.push([leg.startLat, leg.startLng]);

      if (leg.hasEndPoint) {
        const endIcon = L.divIcon({
          className: 'custom-driver-pin-end',
          html: `<div style="background:#0f172a;color:${primaryColor};font-weight:900;font-size:10px;padding:3px 7px;border-radius:999px;border:2px solid ${primaryColor};box-shadow:0 2px 8px rgba(0,0,0,0.6);white-space:nowrap;">
            🏁 KM Fim ${leg.finalKm ?? '—'}
          </div>`,
          iconSize: [95, 24],
          iconAnchor: [47, 12],
        });

        const endMarker = L.marker([leg.endLat, leg.endLng], { icon: endIcon });
        endMarker.bindPopup(
          `<div style="font-size:12px;line-height:1.4;min-width:210px;">
            <strong>🏁 Ponto Final (${leg.direction})</strong><br/>
            <b>Percurso:</b> ${leg.routeCode}<br/>
            <b>Horário Final:</b> ${leg.endTime}<br/>
            <b>KM Final:</b> ${leg.finalKm ?? '—'} km (${
            leg.initialKm != null && leg.finalKm != null ? `${leg.finalKm - leg.initialKm} km rodados` : ''
          })<br/>
            <b>Endereço GPS:</b> ${leg.endAddress}
          </div>`
        );
        endMarker.addTo(lg);
        boundsPoints.push([leg.endLat, leg.endLng]);

        // Tenta buscar geometria real de rua via OSRM
        let routeLatLngs: L.LatLngExpression[] = [
          [leg.startLat, leg.startLng],
          [leg.endLat, leg.endLng],
        ];
        try {
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${leg.startLng},${leg.startLat};${leg.endLng},${leg.endLat}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl);
          if (res.ok) {
            const data = await res.json();
            const coords = data?.routes?.[0]?.geometry?.coordinates;
            if (Array.isArray(coords) && coords.length > 1) {
              routeLatLngs = coords.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            }
          }
        } catch {
          // Fallback para linha direta/curva suave
        }

        const polyline = L.polyline(routeLatLngs, {
          color: primaryColor,
          weight: selectedScheduleId === leg.id ? 6 : 4,
          opacity: 0.9,
          dashArray: isIda ? undefined : '8, 6',
        });
        polyline.addTo(lg);
      }
    };

    Promise.all(filteredLegs.map(drawLeg)).then(() => {
      if (!mapInstanceRef.current) return;
      try {
        const container = map.getContainer();
        if (!container || !document.body.contains(container) || container.clientHeight === 0) return;
        if (boundsPoints.length === 1) {
          map.setView(boundsPoints[0], 14);
        } else if (boundsPoints.length > 1) {
          const bounds = L.latLngBounds(boundsPoints);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
          }
        }
      } catch (err) {
        console.warn('DriverRouteTrajectoryMap fitBounds ignored:', err);
      }
    });

    setTimeout(() => {
      try {
        if (mapInstanceRef.current && map.getContainer() && document.body.contains(map.getContainer())) {
          map.invalidateSize();
        }
      } catch {}
    }, 150);
  }, [filteredLegs, selectedScheduleId]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="rounded-xl bg-slate-950/90 border border-emerald-500/30 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            Mapa do Trajeto da Rota (Sentido Ida e Sentido Retorno)
            {driverName ? ` — ${driverName}` : ''}
          </h4>
          <p className="text-xs text-gray-300">
            Geolocalização e endereço capturados automaticamente no registro do Ponto/KM Inicial e no KM Final.
          </p>
        </div>

        {/* Filtro Rápido de Sentido: Todos | Sentido Ida | Sentido Retorno */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-gray-800 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setDirectionFilter('ALL')}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center text-center leading-tight ${
              directionFilter === 'ALL'
                ? 'bg-seguranca-yellow text-black shadow-sm'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Ida + Retorno ({legs.length})
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('IDA')}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 text-center leading-tight ${
              directionFilter === 'IDA'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-emerald-400 hover:bg-emerald-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
            <span>Sentido Ida</span>
          </button>
          <button
            type="button"
            onClick={() => setDirectionFilter('RETORNO')}
            className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 text-center leading-tight ${
              directionFilter === 'RETORNO'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current shrink-0" />
            <span>Sentido Retorno</span>
          </button>
        </div>
      </div>

      {/* Mapa Interativo Leaflet */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="rounded-xl overflow-hidden border border-gray-700 z-0"
      />

      {/* Cartões de Endereço Capturado (KM Inicial -> KM Final) por Sentido */}
      {filteredLegs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {filteredLegs.map((leg) => {
            const isIda = leg.direction === 'IDA';
            const kmDiff =
              leg.initialKm != null && leg.finalKm != null && leg.finalKm >= leg.initialKm
                ? leg.finalKm - leg.initialKm
                : null;
            const gmapsUrl = leg.hasEndPoint
              ? `https://www.google.com/maps/dir/?api=1&origin=${leg.startLat},${leg.startLng}&destination=${leg.endLat},${leg.endLng}&travelmode=driving`
              : `https://www.google.com/maps/search/?api=1&query=${leg.startLat},${leg.startLng}`;

            return (
              <div
                key={leg.id}
                className={`rounded-xl p-3 border text-xs space-y-2 ${
                  isIda
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-white truncate">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black ${
                        isIda ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      SENTIDO {leg.direction}
                    </span>
                    <span className="truncate">{leg.routeCode}</span>
                  </div>
                  <a
                    href={gmapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 shrink-0"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="space-y-1.5 text-gray-200">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-gray-400 font-semibold">
                        Partida ({leg.startTime} • KM Inicial: {leg.initialKm ?? '—'}):{' '}
                      </span>
                      <span className="text-white font-medium">{leg.startAddress}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-gray-400 font-semibold">
                        Chegada ({leg.endTime} • KM Final: {leg.finalKm ?? 'em curso'}
                        {kmDiff != null ? ` • +${kmDiff} km` : ''}):{' '}
                      </span>
                      <span className="text-white font-medium">{leg.endAddress}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

