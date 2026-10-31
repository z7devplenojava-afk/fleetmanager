import React, { useEffect, useMemo } from 'react';
import { getDefaultMapView } from '@/config/environment';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapPoint {
    id: string;
    latitude: number;
    longitude: number;
    label?: string;
    type?: 'START' | 'BOARDING' | 'DEBARKATION' | 'END';
    order?: number;
}

interface OpenMapInteractiveProps {
    initialViewState?: {
        latitude: number;
        longitude: number;
        zoom: number;
    };
    points?: MapPoint[];
    /** Polyline real da rota (coordenadas [lat, lng][] vindas do OSRM/Google) */
    routePolyline?: [number, number][];
    onPointClick?: (pointId: string) => void;
    onMapClick?: (event: any) => void;
    readOnly?: boolean;
    provider?: 'OSRM' | 'GOOGLE_MAPS';
}

// Component to update view when points change or initial view is set
const MapViewHandler: React.FC<{ points: MapPoint[]; initialViewState: any; routePolyline?: [number, number][] }> = ({ points, initialViewState, routePolyline }) => {
    const map = useMap();

    useEffect(() => {
        if (routePolyline && routePolyline.length > 1) {
            const bounds = L.latLngBounds(routePolyline);
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        } else if (points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (initialViewState) {
            map.setView([initialViewState.latitude, initialViewState.longitude], initialViewState.zoom);
        }
    }, [points, routePolyline, map, initialViewState]);

    return null;
};

// Component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick?: (e: any) => void; readOnly: boolean }> = ({ onMapClick, readOnly }) => {
    useMapEvents({
        click: (e) => {
            if (!readOnly && onMapClick) {
                onMapClick({
                    lngLat: {
                        lng: e.latlng.lng,
                        lat: e.latlng.lat
                    }
                });
            }
        },
    });
    return null;
};

export const OpenMapInteractive: React.FC<OpenMapInteractiveProps> = ({
    initialViewState: initialViewStateProp,
    points = [],
    routePolyline,
    onPointClick,
    onMapClick,
    readOnly = false,
    provider = 'OSRM'
}) => {
    const initialViewState = initialViewStateProp ?? getDefaultMapView();

    const polylinePositions = useMemo(() =>
        routePolyline && routePolyline.length > 1
            ? routePolyline
            : points.map(p => [p.latitude, p.longitude] as [number, number]),
        [points, routePolyline]);

    const isRealRoute = !!(routePolyline && routePolyline.length > 1);

    /**
     * Marcador inteligente e nítido:
     * - START (Origem / 1º Embarque): Verde Esmeralda (#10b981)
     * - BOARDING (Paradas Intermediárias): Azul Céu (#0284c7)
     * - DEBARKATION (Desembarque): Âmbar (#f59e0b)
     * - END (Destino Final onde todos descem): Vermelho (#ef4444)
     */
    const createCustomIcon = (point: MapPoint, index: number) => {
        const isStart = point.type === 'START' || index === 0;
        const isEnd = point.type === 'END' || (index === points.length - 1 && points.length > 1);

        let bg = '#0284c7'; // Azul padrão (Boarding)
        let border = '#38bdf8';
        let text = `${index + 1}`;
        let label = 'Embarque';

        if (isStart) {
            bg = '#10b981'; // Verde Esmeralda
            border = '#6ee7b7';
            text = '1';
            label = 'Origem';
        } else if (isEnd) {
            bg = '#ef4444'; // Vermelho
            border = '#fca5a5';
            text = '★';
            label = 'Destino';
        } else if (point.type === 'DEBARKATION') {
            bg = '#f59e0b';
            border = '#fcd34d';
            label = 'Descida';
        }

        return new L.DivIcon({
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
                <div style="
                  background: ${bg};
                  color: white;
                  width: 28px;
                  height: 28px;
                  border-radius: 50% 50% 50% 0;
                  transform: rotate(-45deg);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 2px solid white;
                  box-shadow: 0 3px 8px rgba(0,0,0,0.45);
                  font-weight: 800;
                  font-size: 12px;
                ">
                  <span style="transform: rotate(45deg); line-height: 1;">${text}</span>
                </div>
                <div style="
                  background: rgba(15, 23, 42, 0.85);
                  color: #e2e8f0;
                  font-size: 10px;
                  font-weight: 700;
                  padding: 1px 5px;
                  border-radius: 4px;
                  margin-top: 3px;
                  white-space: nowrap;
                  border: 1px solid rgba(255,255,255,0.15);
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">
                  ${label}
                </div>
              </div>
            `,
            className: 'custom-div-icon',
            iconSize: [28, 46],
            iconAnchor: [14, 26],
            popupAnchor: [0, -26]
        });
    };

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-gray-700 shadow-md relative group z-0 bg-slate-950">
            <MapContainer
                center={[initialViewState.latitude, initialViewState.longitude]}
                zoom={initialViewState.zoom}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapViewHandler points={points} initialViewState={initialViewState} routePolyline={routePolyline} />
                <MapClickHandler onMapClick={onMapClick} readOnly={readOnly} />

                {/* Traçado Nítido da Rota Viária: linha de contorno brilhante + linha central sólida */}
                {polylinePositions.length > 1 && (
                    <>
                        {isRealRoute && (
                            <Polyline
                                positions={polylinePositions}
                                pathOptions={{
                                    color: '#0284c7',
                                    weight: 8,
                                    opacity: 0.35,
                                    lineJoin: 'round',
                                    lineCap: 'round',
                                }}
                            />
                        )}
                        <Polyline
                            positions={polylinePositions}
                            pathOptions={{
                                color: isRealRoute ? '#2563eb' : '#64748b',
                                weight: isRealRoute ? 4.5 : 2.5,
                                opacity: 0.95,
                                lineJoin: 'round',
                                lineCap: 'round',
                                dashArray: isRealRoute ? undefined : '6 6',
                            }}
                        />
                    </>
                )}

                {/* Marcadores dos Pontos com Pins Diferenciados */}
                {points.map((point, index) => (
                    <Marker
                        key={point.id || index}
                        position={[point.latitude, point.longitude]}
                        icon={createCustomIcon(point, index)}
                        eventHandlers={{
                            click: () => onPointClick?.(point.id || String(index))
                        }}
                    >
                        <Popup>
                            <div className="p-1 text-slate-800 text-xs">
                                <div className="font-bold text-sm text-slate-950 mb-0.5">
                                    {point.type === 'START' ? '🟢 Ponto de Origem (1º Embarque)' :
                                     point.type === 'END' ? '🔴 Ponto de Destino (Todos descem)' :
                                     `🔵 Parada #${index + 1} (Embarque)`}
                                </div>
                                <div className="text-slate-600 font-medium mb-1">{point.label || 'Sem identificação'}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                    Lat: {point.latitude.toFixed(6)}, Lng: {point.longitude.toFixed(6)}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Aviso Superior: Clique no mapa para adicionar pontos */}
            {!readOnly && (
                <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-lg text-xs text-slate-200 border border-slate-700/80 z-[1000] pointer-events-none flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Clique no mapa para marcar novo ponto de embarque</span>
                </div>
            )}

            {/* Legenda Visual Inferior */}
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-slate-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-xl text-[11px] text-slate-300 border border-slate-700/80 z-[1000] flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                    <span className="font-semibold text-emerald-300">1º Embarque (Origem)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm shadow-sky-500/50"></span>
                    <span className="font-semibold text-sky-300">Embarques</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                    <span className="font-semibold text-red-300">Destino Final</span>
                </div>
                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-700 text-slate-400 text-[10px]">
                    <span>🛣️ {isRealRoute ? (provider === 'GOOGLE_MAPS' ? 'Google Maps (Tráfego)' : 'OSRM (Sentido das Vias)') : 'Linha Guia'}</span>
                </div>
            </div>
        </div>
    );
};

export default OpenMapInteractive;
