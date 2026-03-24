import React, { useRef, useEffect, useState } from 'react';
import { getDefaultMapView } from '@/config/environment';
import Map, { Marker, NavigationControl, Source, Layer, MapRef } from 'react-map-gl/mapbox';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Fix for Mapbox worker
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
mapboxgl.workerClass = mapboxgl.workerClass || {};

interface InteractiveMapProps {
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  points?: Array<{ id: string; latitude: number; longitude: number; label?: string }>;
  routeGeoJson?: GeoJSON.Feature<GeoJSON.LineString> | null;
  onPointClick?: (pointId: string) => void;
  onMapClick?: (event: mapboxgl.MapLayerMouseEvent) => void;
  readOnly?: boolean;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  initialViewState: initialViewStateProp,
  points = [],
  routeGeoJson,
  onPointClick,
  onMapClick,
  readOnly = false
}) => {
  const initialViewState = initialViewStateProp ?? getDefaultMapView();
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState(initialViewState);

  useEffect(() => {
    if (points.length > 0 && mapRef.current) {
      // Auto-fit bounds if we have points
      const bounds = new mapboxgl.LngLatBounds();
      points.forEach(p => bounds.extend([p.longitude, p.latitude]));

      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 16
      });
    }
  }, [points]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 border rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-500 font-bold">Mapbox Token Missing</p>
          <p className="text-sm text-gray-500">Please add VITE_MAPBOX_TOKEN to your .env file</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border shadow-sm relative group">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11" // Premium Dark Mode
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={onMapClick}
        cursor={readOnly ? 'default' : 'crosshair'}
      >
        <NavigationControl position="top-right" />

        {/* Route Line Layer */}
        {routeGeoJson && (
          <Source id="route-source" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#3b82f6', // Bright Blue
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Points Markers */}
        {points.map((point, index) => (
          <Marker
            key={point.id || index}
            latitude={point.latitude}
            longitude={point.longitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              onPointClick?.(point.id);
            }}
          >
            <div className="relative group cursor-pointer transform transition-transform hover:scale-110">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs ring-2 ring-primary/20">
                {index + 1}
              </div>
              {point.label && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {point.label}
                </div>
              )}
            </div>
          </Marker>
        ))}
      </Map>

      {!readOnly && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-2 rounded shadow text-xs text-muted-foreground border border-border">
          Click on map to add points
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
