import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bus, Clock, MapPin, QrCode, Navigation, Sparkles } from 'lucide-react';

// Custom icons
const busIcon = L.divIcon({
    html: `<div style="background-color:#ec4899; color:white; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:18px;">🚍</div>`,
    className: 'custom-bus-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
});

const passengerIcon = L.divIcon({
    html: `<div style="background-color:#2563eb; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:16px;">🚶</div>`,
    className: 'custom-passenger-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
});

const stopIcon = L.divIcon({
    html: `<div style="background-color:#10b981; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.2); font-size:12px;">🚏</div>`,
    className: 'custom-stop-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

interface PassengerLiveMapProps {
    lineName?: string;
    lineColor?: string;
    onOpenBoardingQr?: () => void;
}

export const PassengerLiveMap: React.FC<PassengerLiveMapProps> = ({
    lineName = 'Rosa - Serra Verde',
    lineColor = '#ec4899',
    onOpenBoardingQr
}) => {
    // Coordenadas simuladas para o trajeto da Linha Rosa (Belo Horizonte -> Serra Verde)
    const routeCoords: [number, number][] = [
        [-19.9191, -43.9386], // Centro BH
        [-19.9050, -43.9450], // Av. Amazonas
        [-19.8900, -43.9550], // Av. do Contorno
        [-19.8650, -43.9680], // Av. Cristiano Machado
        [-19.8300, -43.9750], // Vilarinho
        [-19.7950, -43.9850], // Serra Verde
    ];

    // Posição atual do ônibus em tempo real (simulando deslocamento suave)
    const [busPos, setBusPos] = useState<[number, number]>([-19.8900, -43.9550]);
    const passengerPos: [number, number] = [-19.8650, -43.9680]; // Ponto de embarque do passageiro

    useEffect(() => {
        const interval = setInterval(() => {
            setBusPos(prev => {
                const nextLat = prev[0] + (passengerPos[0] - prev[0]) * 0.05;
                const nextLng = prev[1] + (passengerPos[1] - prev[1]) * 0.05;
                return [nextLat, nextLng];
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl">
            {/* Mapa Leaflet */}
            <MapContainer
                center={[-19.8650, -43.9600]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Linha do Trajeto */}
                <Polyline positions={routeCoords} color={lineColor} weight={6} opacity={0.8} />

                {/* Marcadores de Paradas */}
                <Marker position={routeCoords[0]} icon={stopIcon}>
                    <Popup>Partida: Centro BH</Popup>
                </Marker>

                <Marker position={passengerPos} icon={passengerIcon}>
                    <Popup>Seu Ponto de Embarque: Av. Cristiano Machado, 1200</Popup>
                </Marker>

                <Marker position={routeCoords[routeCoords.length - 1]} icon={stopIcon}>
                    <Popup>Destino Final: Serra Verde</Popup>
                </Marker>

                {/* Ônibus em tempo real */}
                <Marker position={busPos} icon={busIcon}>
                    <Popup>
                        <div className="text-xs font-bold">
                            <p className="text-pink-600">Ônibus SHZ-3A40</p>
                            <p className="text-slate-600">Chegando em aprox. 12 min</p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>

            {/* Floating Top Header: Linha Selecionada */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
                <Badge className="bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700 shadow-lg text-xs font-bold pointer-events-auto flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lineColor }} />
                    <span>{lineName}</span>
                </Badge>
                <Badge className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-auto flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>Em deslocamento</span>
                </Badge>
            </div>

            {/* Floating Bottom Card: Resumo da Chegada & Botão de Embarque (Imagem 2) */}
            <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                <Card className="bg-slate-900/95 backdrop-blur-xl border-slate-700/80 text-white p-4 rounded-2xl shadow-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                                <Bus className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white">SHZ-3A40 &bull; Micro Ônibus</h4>
                                <p className="text-[11px] text-slate-400">Motorista: João Silva</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Chegada em</span>
                            <span className="text-base font-black text-pink-400">12 min</span>
                        </div>
                    </div>

                    {/* Barra de Trajeto */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-1">
                        <span>Início (BH)</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                            <Navigation className="h-3 w-3 animate-spin" /> Em rota
                        </span>
                        <span>Destino (Serra Verde)</span>
                    </div>

                    {/* Botão de Ação: Confirmar Embarque por QR Code */}
                    <Button 
                        onClick={onOpenBoardingQr}
                        className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-black py-2.5 rounded-xl shadow-lg shadow-pink-600/30 gap-2 text-xs uppercase tracking-wider"
                    >
                        <QrCode className="h-4 w-4" /> Confirmar Embarque via QR Code
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default PassengerLiveMap;
