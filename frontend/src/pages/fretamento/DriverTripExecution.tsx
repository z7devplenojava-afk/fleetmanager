import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Play, Pause, Square, QrCode, MapPin, Users, X, Map as MapIcon } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import tripService, { Trip } from '@/services/tripService';
import { useToast } from '@/hooks/use-toast';

// Fix for default leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

import { StandardLayout } from '@/components/StandardLayout';

const DriverTripExecution: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);

    // Mock passenger list
    const passengers = [
        { id: '1', name: 'Ricardo Martins', boarded: true, time: '10:15' },
        { id: '2', name: 'Ana Oliveira', boarded: false },
        { id: '3', name: 'Carlos Santos', boarded: true, time: '10:18' },
    ];

    const startMutation = useMutation({
        mutationFn: () => tripService.startTrip(scheduleId!),
        onSuccess: (data) => setTrip(data),
    });

    const boardingMutation = useMutation({
        mutationFn: (qrData: any) => tripService.recordBoarding({
            tripId: trip?.id!,
            pointId: 'some-point-id', // Need to get current point
            passengerId: qrData.id,
            lat: -19.9167, // Get from geolocation
            lng: -43.9345
        }),
        onSuccess: (data) => {
            if (data.geofenceValidated) {
                toast({ title: "✅ Embarque Confirmado", description: "Passageiro validado com sucesso." });
            } else {
                toast({ title: "⚠️ Alerta de Geofence", description: "Embarque fora do raio permitido!", variant: "destructive" });
            }
            setIsScannerOpen(false);
        },
        onError: () => {
            toast({ title: "❌ Erro", description: "Falha ao registrar embarque.", variant: "destructive" });
        }
    });

    useEffect(() => {
        if (isScannerOpen) {
            const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }, false);
            scanner.render(
                (decodedText) => {
                    try {
                        const data = JSON.parse(decodedText);
                        boardingMutation.mutate(data);
                        scanner.clear();
                    } catch (e) {
                        toast({ title: "❌ QR Code Inválido", variant: "destructive" });
                    }
                },
                (error) => { /* quiet error */ }
            );
            return () => { scanner.clear(); };
        }
    }, [isScannerOpen]);

    if (!trip) {
        return (
            <StandardLayout title="Iniciar Viagem" subtitle="Prepare-se para começar o percurso">
                <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                    <div className="w-20 h-20 bg-seguranca-red/10 rounded-full flex items-center justify-center">
                        <Play size={40} className="text-seguranca-red ml-1" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-white">Preparado para iniciar?</h2>
                        <p className="text-gray-400">Verifique os itens de segurança antes de partir.</p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full max-w-xs bg-seguranca-red hover:bg-seguranca-darkred"
                        onClick={() => startMutation.mutate()}
                        disabled={startMutation.isPending}
                    >
                        {startMutation.isPending ? 'Iniciando...' : 'COMEÇAR VIAGEM'}
                    </Button>
                </div>
            </StandardLayout>
        );
    }

    return (
        <StandardLayout title="Viagem em Andamento" subtitle="Acompanhe o percurso e valide os embarques">
            <div className="p-4 space-y-4 max-w-md mx-auto min-h-screen bg-seguranca-black">
                <div className="flex justify-between items-center px-1">
                    <Badge className="bg-green-600 text-white animate-pulse">EM ANDAMENTO</Badge>
                    <div className="text-seguranca-lightgray text-sm font-mono bg-seguranca-graphite px-3 py-1 rounded-full border border-gray-700">00:15:22</div>
                </div>

                <Card className="bg-seguranca-graphite border-gray-600 shadow-xl overflow-hidden pb-0">
                    <div className="h-1 bg-seguranca-red w-[35%]" />
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-lg text-white font-semibold flex items-center justify-between">
                            <span>Próximo Ponto</span>
                            <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">2.4 km</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3 p-3 bg-seguranca-black/40 rounded-lg border border-gray-700/50">
                            <div className="bg-seguranca-red/20 p-2 rounded-lg">
                                <MapPin size={24} className="text-seguranca-red" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-white">Portaria Central - Vale</p>
                                <p className="text-xs text-seguranca-yellow font-medium">Previsão: 10:45</p>
                            </div>
                        </div>

                        <div className="h-48 w-full rounded-lg overflow-hidden border border-gray-700">
                            <MapContainer center={[-19.9167, -43.9345]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <Marker position={[-19.9167, -43.9345]}>
                                    <Popup>Próximo Ponto</Popup>
                                </Marker>
                                {/* Geofence indicator */}
                                <Circle center={[-19.9167, -43.9345]} radius={100} pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }} />
                            </MapContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        variant="outline"
                        className="border-gray-600 bg-seguranca-graphite text-white h-28 flex flex-col gap-2 hover:bg-gray-800 transition-all border-b-4 active:border-b-0 active:translate-y-1"
                        onClick={() => setIsListOpen(true)}
                    >
                        <div className="bg-seguranca-white/5 p-2 rounded-full">
                            <Users size={24} className="text-seguranca-yellow" />
                        </div>
                        <span className="text-sm font-medium">Lista ({passengers.filter(p => p.boarded).length}/{passengers.length})</span>
                    </Button>
                    <Button
                        className="bg-seguranca-red hover:bg-seguranca-darkred text-white h-28 flex flex-col gap-2 transition-all shadow-lg shadow-seguranca-red/20 border-b-4 border-seguranca-darkred active:border-b-0 active:translate-y-1"
                        onClick={() => setIsScannerOpen(true)}
                    >
                        <div className="bg-white/20 p-2 rounded-full">
                            <QrCode size={28} />
                        </div>
                        <span className="font-bold">SCAN QR</span>
                    </Button>
                </div>

                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogContent className="bg-seguranca-black border-gray-600 p-0 sm:max-w-md overflow-hidden">
                        <DialogHeader className="p-4 bg-seguranca-graphite border-b border-gray-700">
                            <DialogTitle className="text-white flex items-center justify-between">
                                <span>Escanear QR Code</span>
                                <Button variant="ghost" size="icon" onClick={() => setIsScannerOpen(false)} className="text-gray-400">
                                    <X size={20} />
                                </Button>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-square">
                            <div id="reader" className="w-full h-full"></div>
                            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/60 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-seguranca-yellow/80 rounded-2xl relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-seguranca-red -mt-1 -ml-1" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-seguranca-red -mt-1 -mr-1" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-seguranca-red -mb-1 -ml-1" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-seguranca-red -mb-1 -mr-1" />
                                    <div className="absolute left-0 right-0 h-0.5 bg-seguranca-yellow/40 animate-scan top-0" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-seguranca-graphite border-t border-gray-700 text-center">
                            <p className="text-sm text-gray-400">Aponte a câmera para o QR Code do passageiro</p>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                    <DialogContent className="bg-seguranca-black border-gray-600 p-0 sm:max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader className="p-4 bg-seguranca-graphite border-b border-gray-700">
                            <DialogTitle className="text-white flex items-center justify-between">
                                <span>Lista de Passageiros</span>
                                <Button variant="ghost" size="icon" onClick={() => setIsListOpen(false)} className="text-gray-400">
                                    <X size={20} />
                                </Button>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {passengers.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-seguranca-graphite/40 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${p.boarded ? 'bg-green-500' : 'bg-gray-600'}`} />
                                        <span className={`text-sm ${p.boarded ? 'text-white font-medium' : 'text-gray-500'}`}>{p.name}</span>
                                    </div>
                                    {p.boarded && <Badge variant="secondary" className="bg-green-950/40 text-green-500 border-green-900 text-[10px]">{p.time}</Badge>}
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
                    <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                        <Pause size={18} className="mr-2" /> Pausar
                    </Button>
                    <Button variant="ghost" className="text-red-500 hover:bg-red-950/20">
                        <Square size={18} className="mr-2" /> Finalizar
                    </Button>
                </div>
            </div>
        </StandardLayout>
    );
};

export default DriverTripExecution;
