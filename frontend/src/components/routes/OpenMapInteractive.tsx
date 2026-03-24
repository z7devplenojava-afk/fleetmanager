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

interface Point {
    id: string;
    latitude: number;
    longitude: number;
    label?: string;
}

interface OpenMapInteractiveProps {
    initialViewState?: {
        latitude: number;
        longitude: number;
        zoom: number;
    };
    points?: Point[];
    /** Polyline real da rota (coordenadas [lat, lng][] vindas do OSRM) */
    routePolyline?: [number, number][];
    onPointClick?: (pointId: string) => void;
    onMapClick?: (event: any) => void;
    readOnly?: boolean;
}

// Component to update view when points change or initial view is set
const MapViewHandler: React.FC<{ points: Point[]; initialViewState: any }> = ({ points, initialViewState }) => {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        } else if (initialViewState) {
            map.setView([initialViewState.latitude, initialViewState.longitude], initialViewState.zoom);
        }
    }, [points, map, initialViewState]);

    return null;
};

// Component to handle map clicks
const MapClickHandler: React.FC<{ onMapClick?: (e: any) => void; readOnly: boolean }> = ({ onMapClick, readOnly }) => {
    useMapEvents({
        click: (e) => {
            if (!readOnly && onMapClick) {
                // Adapt Leaflet event to look like what the form expects (lngLat property)
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
    readOnly = false
}) => {
    const initialViewState = initialViewStateProp ?? getDefaultMapView();
    // Se há polyline real da rota, usa ela; senão conecta marcadores em linha reta
    const polylinePositions = useMemo(() =>
        routePolyline && routePolyline.length > 1
            ? routePolyline
            : points.map(p => [p.latitude, p.longitude] as [number, number]),
        [points, routePolyline]);

    const createCustomIcon = (index: number) => {
        return new L.DivIcon({
            html: `
          <div style="
            background-color: #f59e0b;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            font-weight: bold;
            font-size: 12px;
          ">
            ${index + 1}
          </div>
        `,
            className: 'custom-div-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });
    };

    return (
        <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-sm relative group z-0">
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

                <MapViewHandler points={points} initialViewState={initialViewState} />
                <MapClickHandler onMapClick={onMapClick} readOnly={readOnly} />

                {/* Route Line - real route or point connection */}
                {polylinePositions.length > 1 && (
                    <Polyline
                        positions={polylinePositions}
                        pathOptions={{
                            color: routePolyline && routePolyline.length > 1 ? '#3b82f6' : '#6b7280',
                            weight: routePolyline && routePolyline.length > 1 ? 5 : 3,
                            opacity: 0.85,
                            lineJoin: 'round',
                            lineCap: 'round',
                            dashArray: routePolyline && routePolyline.length > 1 ? undefined : '8 6',
                        }}
                    />
                )}

                {/* Markers */}
                {points.map((point, index) => (
                    <Marker
                        key={point.id || index}
                        position={[point.latitude, point.longitude]}
                        icon={createCustomIcon(index)}
                        eventHandlers={{
                            click: () => onPointClick?.(point.id)
                        }}
                    >
                        {point.label && (
                            <Popup>
                                <div className="font-semibold">{point.label}</div>
                            </Popup>
                        )}
                    </Marker>
                ))}
            </MapContainer>

            {!readOnly && (
                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-2 rounded shadow text-xs text-muted-foreground border border-border z-[1000] pointer-events-none">
                    Clique no mapa para adicionar pontos
                </div>
            )}
        </div>
    );
};

export default OpenMapInteractive;
