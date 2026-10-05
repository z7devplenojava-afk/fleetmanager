import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
    Play, 
    Pause, 
    Square, 
    QrCode, 
    MapPin, 
    Users, 
    X, 
    Gauge, 
    Bus, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Share2, 
    Eye 
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import tripService, { Trip } from '@/services/tripService';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import { StandardLayout } from '@/components/StandardLayout';

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

interface PassengerBoardingItem {
    id: string;
    name: string;
    boarded: boolean;
    time?: string;
    pointName?: string;
}

const DriverTripExecution: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Estados da viagem
    const [isTripActive, setIsTripActive] = useState(false);
    const [routeName, setRouteName] = useState('Linha Rosa - Serra Verde');
    const [vehiclePlate, setVehiclePlate] = useState('SHZ-3A40');
    const [kmStart, setKmStart] = useState<number>(1671);
    const [kmEnd, setKmEnd] = useState<number>(1725);
    const kmTotal = Math.max(0, kmEnd - kmStart);

    // Modais
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isDriverQrOpen, setIsDriverQrOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

    // Lista de passageiros da escala
    const [passengers, setPassengers] = useState<PassengerBoardingItem[]>([
        { id: '1', name: 'Maria Aparecida Souza', boarded: true, time: '08:15', pointName: 'Centro BH' },
        { id: '2', name: 'João Carlos Silva', boarded: true, time: '08:18', pointName: 'Av. Amazonas' },
        { id: '3', name: 'Ana Paula Lima', boarded: false, pointName: 'Av. Cristiano Machado' },
        { id: '4', name: 'Marcos Pereira Santos', boarded: false, pointName: 'Terminal Vilarinho' },
        { id: '5', name: 'Juliana Costa Ribeiro', boarded: false, pointName: 'Serra Verde' },
    ]);

    const boardedCount = passengers.filter(p => p.boarded).length;
    const expectedCount = passengers.length;

    // QR Code do Motorista / Viagem
    const driverQrPayload = generateQrCodeDataPayload('TRIP', {
        tripId: scheduleId || 'trip-vss-01',
        line: routeName,
        plate: vehiclePlate,
        kmStart,
        kmEnd
    });
    const driverQrSvg = generateQrCodeSvgUri(driverQrPayload, 260);

    // Leitor de QR Code para ler passageiros
    useEffect(() => {
        if (isScannerOpen) {
            const scanner = new Html5QrcodeScanner("driver-reader", { fps: 10, qrbox: 240 }, false);
            scanner.render(
                (decodedText) => {
                    try {
                        const parsed = JSON.parse(decodedText);
                        const passengerName = parsed.name || 'Passageiro Validado';
                        
                        setPassengers(prev => {
                            const exists = prev.find(p => p.id === parsed.passengerId || p.name === passengerName);
                            if (exists) {
                                return prev.map(p => (p.id === exists.id ? { ...p, boarded: true, time: new Date().toLocaleTimeString().substring(0, 5) } : p));
                            }
                            return [...prev, {
                                id: parsed.passengerId || String(Date.now()),
                                name: passengerName,
                                boarded: true,
                                time: new Date().toLocaleTimeString().substring(0, 5),
                                pointName: 'Embarque Direto'
                            }];
                        });

                        toast({
                            title: '✅ Embarque Validado!',
                            description: `${passengerName} registrado com sucesso.`,
                        });
                        scanner.clear();
                        setIsScannerOpen(false);
                    } catch {
                        toast({ title: '❌ QR Code Inválido', variant: 'destructive' });
                    }
                },
                () => { /* quiet */ }
            );
            return () => {
                try { scanner.clear(); } catch { /* ignore */ }
            };
        }
    }, [isScannerOpen, toast]);

    const handleStartTrip = () => {
        if (!kmStart || kmStart <= 0) {
            toast({
                title: 'KM Inicial Obrigatório',
                description: 'Por favor, informe o odômetro inicial do veículo.',
                variant: 'destructive',
            });
            return;
        }
        setIsTripActive(true);
        toast({
            title: 'Viagem Iniciada',
            description: `Viagem na ${routeName} iniciada no KM ${kmStart}.`,
        });
    };

    const handleFinishTrip = () => {
        setIsTripActive(false);
        setIsFinishModalOpen(false);
        toast({
            title: 'Viagem Concluída',
            description: `Viagem finalizada! KM Total percorrido: ${kmTotal} km.`,
        });
        navigate('/driver-dashboard');
    };

    if (!isTripActive) {
        return (
            <StandardLayout title="Área do Motorista" subtitle="Preparação e Início de Viagem">
                <div className="p-4 max-w-md mx-auto min-h-[75vh] flex flex-col justify-between space-y-6">
                    <Card className="bg-slate-900 border-slate-800 text-white p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl">
                                <Bus className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">{routeName}</h3>
                                <p className="text-xs text-slate-400">Veículo: <span className="font-mono font-bold text-amber-400">{vehiclePlate}</span></p>
                            </div>
                        </div>

                        {/* Campos de KM Inicial & Configuração */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Odômetro / KM Inicial <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Gauge className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                                    <Input
                                        type="number"
                                        value={kmStart}
                                        onChange={(e) => setKmStart(Number(e.target.value))}
                                        className="bg-slate-950 border-slate-700 pl-9 font-mono text-white text-base font-bold"
                                        placeholder="Ex: 1671"
                                    />
                                </div>
                            </div>

                            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                                <p className="flex items-center gap-1.5 font-bold text-slate-200">
                                    <Clock className="h-4 w-4 text-blue-400" /> Horário Previsto: 08:20 ➔ 09:40
                                </p>
                                <p className="text-slate-400">Origem: Centro BH &bull; Destino: Serra Verde</p>
                                <p className="text-emerald-400 font-semibold">{expectedCount} passageiros previstos na lista.</p>
                            </div>
                        </div>
                    </Card>

                    <Button
                        size="lg"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 text-base uppercase tracking-wider"
                        onClick={handleStartTrip}
                    >
                        <Play className="h-5 w-5 mr-2 fill-current" /> Iniciar Viagem
                    </Button>
                </div>
            </StandardLayout>
        );
    }

    return (
        <StandardLayout title="Viagem em Andamento" subtitle="Acompanhamento e Registro de Embarque">
            <div className="p-4 space-y-4 max-w-md mx-auto min-h-screen bg-[#090e1a] text-white pb-20">
                {/* Header com Status e Cronômetro */}
                <div className="flex justify-between items-center px-1">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-black animate-pulse px-3 py-1">
                        🟢 EM ANDAMENTO
                    </Badge>
                    <div className="text-xs font-mono font-bold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-300">
                        {routeName}
                    </div>
                </div>

                {/* Card de Controle de Odômetro (KM Inicial, KM Final, Total) */}
                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-2xl shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-amber-400" /> Odômetro da Rota
                        </span>
                        <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-black">
                            Total: {kmTotal} KM
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">KM Inicial</span>
                            <Input
                                type="number"
                                value={kmStart}
                                onChange={(e) => setKmStart(Number(e.target.value))}
                                className="bg-slate-950 border-slate-700 h-9 text-xs font-mono font-bold text-slate-300"
                            />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 block mb-0.5">KM Atual / Final</span>
                            <Input
                                type="number"
                                value={kmEnd}
                                onChange={(e) => setKmEnd(Number(e.target.value))}
                                className="bg-slate-950 border-slate-700 h-9 text-xs font-mono font-bold text-amber-400"
                            />
                        </div>
                    </div>
                </Card>

                {/* Mapa e Próximo Ponto */}
                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-2xl shadow-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-400" />
                            <span className="text-xs font-black text-white">Próximo Ponto: Av. Cristiano Machado, 1200</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400">
                            1.8 km
                        </Badge>
                    </div>

                    <div className="h-40 w-full rounded-xl overflow-hidden border border-slate-800">
                        <MapContainer center={[-19.8650, -43.9680]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[-19.8650, -43.9680]}>
                                <Popup>Próxima Parada</Popup>
                            </Marker>
                            <Circle center={[-19.8650, -43.9680]} radius={100} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />
                        </MapContainer>
                    </div>
                </Card>

                {/* 3 Botões de Ação Rápida */}
                <div className="grid grid-cols-3 gap-2.5">
                    {/* Lista de Passageiros */}
                    <Button
                        variant="outline"
                        onClick={() => setIsListOpen(true)}
                        className="bg-slate-900 border-slate-800 text-white h-24 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-850 rounded-2xl"
                    >
                        <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-black">Lista ({boardedCount}/{expectedCount})</span>
                    </Button>

                    {/* Escanear QR Code do Passageiro */}
                    <Button
                        onClick={() => setIsScannerOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white h-24 flex flex-col items-center justify-center gap-1.5 rounded-2xl shadow-lg shadow-emerald-600/20"
                    >
                        <div className="p-2 rounded-xl bg-white/20">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-black uppercase">Escanear</span>
                    </Button>

                    {/* Exibir QR Code do Motorista */}
                    <Button
                        variant="outline"
                        onClick={() => setIsDriverQrOpen(true)}
                        className="bg-slate-900 border-slate-800 text-white h-24 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-850 rounded-2xl"
                    >
                        <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400">
                            <QrCode className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-black">Meu QR</span>
                    </Button>
                </div>

                {/* Botão Finalizar Viagem */}
                <div className="pt-4">
                    <Button
                        onClick={() => setIsFinishModalOpen(true)}
                        className="w-full bg-red-600/90 hover:bg-red-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-red-600/20 gap-2 text-sm uppercase"
                    >
                        <Square className="h-4 w-4 fill-current" /> Finalizar Viagem
                    </Button>
                </div>

                {/* Modal: Scanner da Câmera do Motorista */}
                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-0 rounded-3xl overflow-hidden">
                        <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800">
                            <DialogTitle className="text-base font-black text-white flex items-center justify-between">
                                <span>Validar Embarque de Passageiro</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-4 space-y-3">
                            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-700 bg-black">
                                <div id="driver-reader" className="w-full h-full"></div>
                            </div>
                            <p className="text-xs text-center text-slate-400">
                                Aponte a câmera para o QR Code no celular do passageiro.
                            </p>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal: QR Code do Motorista (para passageiros lerem) */}
                <Dialog open={isDriverQrOpen} onOpenChange={setIsDriverQrOpen}>
                    <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-5 rounded-3xl text-center space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-base font-black text-white">
                                QR Code da Viagem &bull; {vehiclePlate}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-2xl">
                            <img src={driverQrSvg} alt="QR Code do Motorista" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-xs text-slate-300">
                            <p className="font-bold text-white">{routeName}</p>
                            <p className="text-slate-400">Peça para os passageiros apontarem a câmera para este QR Code.</p>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal: Lista de Passageiros */}
                <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                    <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-0 rounded-3xl overflow-hidden max-h-[80vh] flex flex-col">
                        <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800">
                            <DialogTitle className="text-base font-black text-white flex items-center justify-between">
                                <span>Passageiros ({boardedCount}/{expectedCount})</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="p-4 space-y-2.5 flex-1 overflow-y-auto">
                            {passengers.map((p) => (
                                <div 
                                    key={p.id}
                                    className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                                >
                                    <div>
                                        <h5 className="font-bold text-white">{p.name}</h5>
                                        <p className="text-[10px] text-slate-400">{p.pointName}</p>
                                    </div>
                                    <Badge className={`${p.boarded ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-none'}`}>
                                        {p.boarded ? `Embarcou (${p.time})` : 'Aguardando'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal de Finalização de Viagem com Odômetro Final */}
                <Dialog open={isFinishModalOpen} onOpenChange={setIsFinishModalOpen}>
                    <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-6 rounded-3xl space-y-4">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-black text-white">
                                Encerrar Viagem
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-400 block mb-1">
                                    Odômetro / KM Final <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    value={kmEnd}
                                    onChange={(e) => setKmEnd(Number(e.target.value))}
                                    className="bg-slate-950 border-slate-700 font-mono text-white text-base font-bold"
                                />
                            </div>

                            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
                                <div className="flex justify-between text-slate-400">
                                    <span>KM Inicial:</span>
                                    <span className="font-mono text-white">{kmStart} km</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>KM Final:</span>
                                    <span className="font-mono text-white">{kmEnd} km</span>
                                </div>
                                <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800">
                                    <span>Total Percorrido:</span>
                                    <span className="font-mono text-sm">{kmTotal} km</span>
                                </div>
                                <div className="flex justify-between font-bold text-emerald-400">
                                    <span>Passageiros Embarcados:</span>
                                    <span>{boardedCount} de {expectedCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setIsFinishModalOpen(false)} className="flex-1 text-slate-400">
                                Cancelar
                            </Button>
                            <Button onClick={handleFinishTrip} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
                                Confirmar Término
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </StandardLayout>
    );
};

export default DriverTripExecution;
