import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapWithPinProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: string;
  className?: string;
  showControls?: boolean;
}

// Componente para atualizar o centro do mapa quando as coordenadas mudam
const MapUpdater: React.FC<{ latitude: number; longitude: number }> = ({ latitude, longitude }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);
  
  return null;
};

const MapWithPin: React.FC<MapWithPinProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = '400px',
  className = '',
  showControls = true
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.561500, -46.640800]); // São Paulo como padrão
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      const newCenter: [number, number] = [latitude, longitude];
      setMapCenter(newCenter);
      setMarkerPosition(newCenter);
    }
  }, [latitude, longitude]);

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
      setMarkerPosition([lat, lng]);
    }
  };

  const customIcon = new L.DivIcon({
    html: `
      <div style="
        background-color: #f59e0b;
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: 16px;
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  return (
    <div className={`relative ${className}`}>
      <div 
        style={{ height }} 
        className="w-full rounded-lg overflow-hidden border border-gray-600"
      >
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
          eventHandlers={{
            click: handleMapClick
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markerPosition && (
            <Marker position={markerPosition} icon={customIcon}>
              <Popup>
                <div className="text-center p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-orange-500" />
                    <span className="font-semibold">Localização Capturada</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>Latitude:</strong> {markerPosition[0].toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {markerPosition[1].toFixed(6)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {latitude && longitude && (
            <MapUpdater latitude={latitude} longitude={longitude} />
          )}
        </MapContainer>
      </div>
      
      {showControls && (
        <div className="absolute top-2 right-2 bg-black/80 text-white p-2 rounded-lg text-xs">
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={12} />
            <span>Clique no mapa para marcar</span>
          </div>
          {markerPosition && (
            <div className="text-gray-300">
              <div>Lat: {markerPosition[0].toFixed(6)}</div>
              <div>Lng: {markerPosition[1].toFixed(6)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapWithPin;
