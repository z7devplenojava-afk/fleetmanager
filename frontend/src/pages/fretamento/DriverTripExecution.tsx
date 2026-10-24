import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
    Play, 
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
    Eye,
    Search,
    Wifi,
    WifiOff,
    RotateCcw,
    ShieldCheck,
    Navigation,
    Warehouse,
    ArrowRight,
    Map as MapIcon,
    Camera,
    FileCheck
} from 'lucide-react';
import { UniversalQrScannerModal } from '@/components/common/UniversalQrScannerModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import { StandardLayout } from '@/components/StandardLayout';
import fretamentoCheckinService, { getCurrentGeoPosition, reverseGeocode } from '@/services/fretamentoCheckinService';

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

const busStopIcon = L.divIcon({
    html: `<div style="background-color:#2563eb; color:white; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:12px;">🚏</div>`,
    className: 'custom-stop-icon',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

interface PassengerBoardingItem {
    id: string;
    name: string;
    cpf?: string;
    matricula?: string;
    company?: string;
    boarded: boolean;
    time?: string;
    pointName?: string;
    address?: string;
    direction?: 'IDA' | 'VOLTA';
    synced?: boolean;
}

type TripPhase = 'PREPARATION' | 'IN_TRIP' | 'RETURNING_TO_GARAGE' | 'FINISHED';

const DriverTripExecution: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    // Sentido da Viagem: IDA vs VOLTA
    const [tripDirection, setTripDirection] = useState<'IDA' | 'VOLTA'>('IDA');
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Fases da viagem
    const [tripPhase, setTripPhase] = useState<TripPhase>('PREPARATION');
    const [isRouteValidated, setIsRouteValidated] = useState(false);
    const [isRouteValidationModalOpen, setIsRouteValidationModalOpen] = useState(false);

    // Dados da Rota e Veículo
    const [routeName] = useState('Linha Rosa - Serra Verde (Fretado)');
    const [vehiclePlate] = useState('SHZ-3A40');
    const [vehiclePrefix] = useState('5422');

    // Odômetros nas 3 etapas solicitadas pelo usuário:
    // 1. KM Inicial antes de iniciar a viagem
    const [kmStart, setKmStart] = useState<number>(1671);
    // 2. KM Final da viagem comercial (que vira o KM Inicial do deslocamento para a garagem)
    const [kmEndTrip, setKmEndTrip] = useState<number>(1725);
    // 3. KM Final ao chegar na garagem
    const [kmEndGarage, setKmEndGarage] = useState<number>(1742);

    // Modais
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isDriverQrOpen, setIsDriverQrOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);
    const [isArriveGarageModalOpen, setIsArriveGarageModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    
    // Busca e Check-in Manual
    const [passengerSearch, setPassengerSearch] = useState('');
    const [manualCpfOrMatricula, setManualCpfOrMatricula] = useState('');

    // Trajeto e Coordenadas do mapa
    const routeCoords: [number, number][] = [
        [-19.9191, -43.9386], // Ponto 01 - Centro BH
        [-19.9050, -43.9450], // Ponto 02 - Av. Amazonas
        [-19.8650, -43.9680], // Ponto 03 - Av. Cristiano Machado
        [-19.8300, -43.9750], // Ponto 04 - Terminal Vilarinho
        [-19.7950, -43.9850], // Ponto 05 - Serra Verde
    ];

    // Lista de passageiros da escala
    const initialPassengersList: PassengerBoardingItem[] = [
        { id: '1', name: 'Maria Aparecida Souza', cpf: '123.456.789-00', matricula: 'FUN-1002', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 01 - Centro BH' },
        { id: '2', name: 'João Carlos Silva', cpf: '234.567.890-11', matricula: 'FUN-1045', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 02 - Av. Amazonas' },
        { id: '3', name: 'Ana Paula Lima', cpf: '345.678.901-22', matricula: 'FUN-2018', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 03 - Av. Cristiano Machado' },
        { id: '4', name: 'Marcos Pereira Santos', cpf: '456.789.012-33', matricula: 'FUN-3041', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 04 - Terminal Vilarinho' },
        { id: '5', name: 'Juliana Costa Ribeiro', cpf: '567.890.123-44', matricula: 'FUN-4112', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 05 - Serra Verde' },
        { id: '6', name: 'Rodrigo Alves Ferreira', cpf: '678.901.234-55', matricula: 'FUN-5089', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 05 - Serra Verde' },
    ];

    const storageKey = `driver_trip_${scheduleId || 'default'}_${tripDirection}`;

    const [passengers, setPassengers] = useState<PassengerBoardingItem[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch {}
        return initialPassengersList;
    });

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(passengers));
        } catch (e) {
            console.error('Erro ao salvar passageiros:', e);
        }
    }, [passengers, storageKey]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const boardedCount = passengers.filter(p => p.boarded).length;
    const expectedCount = passengers.length;
    const pendingSyncCount = passengers.filter(p => p.boarded && !p.synced).length;

    // Cálculo dos trechos de KM
    const kmViagemComercial = Math.max(0, kmEndTrip - kmStart);
    const kmDeslocamentoGaragem = Math.max(0, kmEndGarage - kmEndTrip);
    const kmTotalGeral = Math.max(0, kmEndGarage - kmStart);

    // Validação da rota
    const handleValidateRoute = () => {
        setIsRouteValidated(true);
        setIsRouteValidationModalOpen(false);
        toast({
            title: '✅ Rota Validada com Sucesso!',
            description: 'Itinerário, paradas e veículo conferidos. Você já pode informar o KM Inicial e iniciar a viagem.',
        });
    };

    // Início da viagem comercial
    const handleStartTrip = () => {
        if (!isRouteValidated) {
            toast({
                title: 'Validação da Rota Obrigatória',
                description: 'Por favor, clique em "Validar Rota" antes de iniciar a viagem.',
                variant: 'destructive',
            });
            setIsRouteValidationModalOpen(true);
            return;
        }

        if (!kmStart || kmStart <= 0) {
            toast({
                title: 'KM Inicial Obrigatório',
                description: 'Por favor, informe o odômetro inicial do veículo.',
                variant: 'destructive',
            });
            return;
        }

        // Sugere o kmEndTrip com base na média da rota (54 km)
        setKmEndTrip(kmStart + 54);
        setTripPhase('IN_TRIP');
        toast({
            title: 'Viagem Iniciada!',
            description: `Viagem comercial iniciada no KM ${kmStart}. Embarque de colaboradores habilitado.`,
        });
    };

    // Confirmação de Check-in (por QR Code, Matrícula ou CPF) com captura de GPS e endereço
    const processBoarding = async (
        type: 'QR_SCAN_BY_DRIVER' | 'MANUAL_CPF' | 'MANUAL_MATRICULA',
        searchValue: string
    ) => {
        const raw = searchValue.trim();
        if (!raw) return;

        let matchedId = '';
        let passengerName = '';
        const nowTime = new Date().toLocaleTimeString().substring(0, 5);

        // Se for JSON do QR Code
        if (raw.startsWith('{')) {
            try {
                const parsed = JSON.parse(raw);
                passengerName = parsed.name || parsed.nome || '';
                matchedId = parsed.id || parsed.passengerId || parsed.cpf || parsed.matricula || '';
            } catch {}
        }

        const cleanRaw = raw.replace(/\D/g, '');
        const target = passengers.find(p => {
            if (matchedId && (p.id === matchedId || p.matricula === matchedId)) return true;
            if (cleanRaw && p.cpf && p.cpf.replace(/\D/g, '') === cleanRaw) return true;
            if (p.matricula && p.matricula.toLowerCase() === raw.toLowerCase()) return true;
            if (passengerName && p.name.toLowerCase().includes(passengerName.toLowerCase())) return true;
            if (p.name.toLowerCase().includes(raw.toLowerCase())) return true;
            return false;
        });

        // Captura geolocalização e endereço reverso
        const geo = await getCurrentGeoPosition();
        const address = await reverseGeocode(geo.latitude, geo.longitude);

        if (target) {
            setPassengers(prev => prev.map(p => 
                p.id === target.id 
                    ? { ...p, boarded: true, time: nowTime, address, direction: tripDirection, synced: isOnline } 
                    : p
            ));

            // Grava no serviço global de check-ins
            await fretamentoCheckinService.registerCheckin({
                passengerId: target.id,
                passengerName: target.name,
                cpf: target.cpf || '000.000.000-00',
                matricula: target.matricula || 'MAT-000',
                companyName: target.company || 'Empresa Contratante',
                lineName: routeName,
                vehiclePlate,
                driverName: 'Motorista VSS',
                checkinType: type,
                latitude: geo.latitude,
                longitude: geo.longitude,
                address,
            });

            toast({
                title: '✅ Check-in Confirmado!',
                description: `${target.name} embarcou às ${nowTime}. Local: ${address}`,
            });
        } else {
            // Embarque avulso
            const displayName = passengerName || (cleanRaw.length === 11 ? `CPF: ${raw}` : `Matrícula: ${raw}`);
            const newPassenger: PassengerBoardingItem = {
                id: `guest-${Date.now()}`,
                name: displayName,
                company: 'Embarque Confirmado',
                boarded: true,
                time: nowTime,
                address,
                pointName: 'Embarque Validado pelo Motorista',
                direction: tripDirection,
                synced: isOnline,
            };
            setPassengers(prev => [newPassenger, ...prev]);

            await fretamentoCheckinService.registerCheckin({
                passengerId: newPassenger.id,
                passengerName: displayName,
                cpf: cleanRaw.length === 11 ? raw : '000.000.000-00',
                matricula: cleanRaw.length !== 11 ? raw : 'MAT-AVULSO',
                companyName: 'Cliente Fretamento',
                lineName: routeName,
                vehiclePlate,
                driverName: 'Motorista VSS',
                checkinType: type,
                latitude: geo.latitude,
                longitude: geo.longitude,
                address,
            });

            toast({
                title: '⚡ Embarque Validado!',
                description: `${displayName} registrado às ${nowTime} em: ${address}`,
            });
        }

        setIsScannerOpen(false);
        setManualCpfOrMatricula('');
    };

    // Encerrar Viagem Comercial -> Passa para Deslocamento para Garagem
    const handleConfirmFinishTrip = () => {
        if (!kmEndTrip || kmEndTrip < kmStart) {
            toast({
                title: 'KM Final Inválido',
                description: `O KM Final da viagem deve ser maior ou igual ao KM Inicial (${kmStart} km).`,
                variant: 'destructive',
            });
            return;
        }

        setIsFinishTripModalOpen(false);
        // Sugere o KM Final da Garagem (+17 km de retorno à garagem)
        setKmEndGarage(kmEndTrip + 17);
        setTripPhase('RETURNING_TO_GARAGE');

        toast({
            title: 'Viagem Comercial Concluída!',
            description: `KM Final: ${kmEndTrip} km (Viagem: ${kmViagemComercial} km). Iniciando Deslocamento para a Garagem.`,
        });
    };

    // Confirmar Chegada na Garagem
    const handleConfirmArriveGarage = () => {
        if (!kmEndGarage || kmEndGarage < kmEndTrip) {
            toast({
                title: 'KM da Garagem Inválido',
                description: `O KM na Garagem deve ser maior ou igual ao KM de encerramento da viagem (${kmEndTrip} km).`,
                variant: 'destructive',
            });
            return;
        }

        setIsArriveGarageModalOpen(false);
        setTripPhase('FINISHED');
        setIsSummaryModalOpen(true);
    };

    // Concluir tudo e voltar
    const handleFinalizeAndExit = () => {
        setIsSummaryModalOpen(false);
        toast({
            title: 'Jornada Finalizada com Sucesso!',
            description: `Escala concluída. KM Total percorrido pelo veículo: ${kmTotalGeral} km.`,
        });
        navigate('/fretamento/minhas-escalas');
    };

    // QR Code do Motorista
    const driverQrPayload = generateQrCodeDataPayload('TRIP', {
        tripId: scheduleId || 'trip-vss-01',
        line: routeName,
        plate: vehiclePlate,
        kmStart,
        kmEnd: kmEndTrip,
        direction: tripDirection,
    });
    const driverQrSvg = generateQrCodeSvgUri(driverQrPayload, 260);

    // ==========================================
    // TELA 1: PREPARAÇÃO & VALIDAÇÃO DA ROTA
    // ==========================================
    if (tripPhase === 'PREPARATION') {
        return (
            <StandardLayout title="Área do Motorista" subtitle="Validação de Rota e Início de Viagem">
                <div className="p-4 max-w-xl mx-auto space-y-5">
                    {/* Card Principal da Escala */}
                    <Card className="bg-slate-900 border-slate-800 text-white p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                                    <Bus className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">{routeName}</h3>
                                    <p className="text-xs text-slate-400">
                                        Veículo: <span className="font-mono font-bold text-amber-400">{vehiclePlate}</span> (Prefixo {vehiclePrefix})
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/40 text-xs font-bold">
                                {shiftLabel(tripDirection)}
                            </Badge>
                        </div>

                        {/* Etapa 1: Validar Rota (Obrigatória) */}
                        <div className={`p-4 rounded-xl border transition-all ${
                            isRouteValidated 
                                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}>
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5">
                                    {isRouteValidated ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                                    ) : (
                                        <FileCheck className="h-5 w-5 text-amber-400 shrink-0" />
                                    )}
                                    <div>
                                        <h4 className="text-sm font-bold text-white">
                                            {isRouteValidated ? 'Rota Validada e Aprovada' : '1. Validação Obrigatória da Rota'}
                                        </h4>
                                        <p className="text-xs text-slate-400">
                                            {isRouteValidated 
                                                ? 'Itinerário, paradas e lista de colaboradores conferidos.' 
                                                : 'Confira o traçado, pontos de parada e veículo antes de iniciar.'}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    size="sm"
                                    onClick={() => setIsRouteValidationModalOpen(true)}
                                    className={`text-xs font-bold shrink-0 ${
                                        isRouteValidated
                                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                                    }`}
                                >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    {isRouteValidated ? 'Rever Rota' : 'Validar Rota'}
                                </Button>
                            </div>
                        </div>

                        {/* Etapa 2: KM Inicial */}
                        <div className="space-y-2 pt-1">
                            <label className="text-xs font-bold text-slate-300 block">
                                2. Odômetro / KM Inicial do Veículo <span className="text-red-500">*</span>
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
                            <p className="text-[11px] text-slate-400">
                                Informe a quilometragem marcada no painel do ônibus antes de iniciar o itinerário.
                            </p>
                        </div>
                    </Card>

                    {/* Botão de Iniciar Viagem (Só libera após validar rota) */}
                    <div className="space-y-2">
                        <Button
                            size="lg"
                            disabled={!isRouteValidated}
                            onClick={handleStartTrip}
                            className={`w-full text-white font-black py-4 rounded-2xl shadow-xl text-base uppercase tracking-wider transition-all ${
                                isRouteValidated
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <Play className="h-5 w-5 mr-2 fill-current" />
                            {isRouteValidated ? 'Iniciar Viagem' : 'Valide a Rota para Iniciar'}
                        </Button>
                        {!isRouteValidated && (
                            <p className="text-center text-xs text-amber-400/90 font-medium flex items-center justify-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Clique em "Validar Rota" acima para liberar o início da viagem.
                            </p>
                        )}
                    </div>

                    {/* Modal de Validação de Rota com Mapa e Paradas */}
                    <Dialog open={isRouteValidationModalOpen} onOpenChange={setIsRouteValidationModalOpen}>
                        <DialogContent className="max-w-xl bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                                    <MapIcon className="h-5 w-5 text-blue-400" /> Validação e Conferência da Rota
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    {routeName} &bull; Veículo: {vehiclePlate}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Mapa do Itinerário */}
                            <div className="h-60 w-full rounded-2xl overflow-hidden border border-slate-800">
                                <MapContainer center={[-19.8650, -43.9680]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <Polyline positions={routeCoords} color="#2563eb" weight={5} opacity={0.8} />
                                    {routeCoords.map((pos, i) => (
                                        <Marker key={i} position={pos} icon={busStopIcon}>
                                            <Popup>Ponto de Parada 0{i + 1}</Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

                            {/* Lista de Pontos de Parada Previstos */}
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                <span className="text-xs font-bold text-slate-400 uppercase">Itinerário de Paradas:</span>
                                <div className="space-y-1.5 text-xs">
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                                        <span>🚏 Ponto 01 - Centro BH (Saída Oficial)</span>
                                        <span className="font-bold text-blue-400">06:00</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                                        <span>🚏 Ponto 02 - Av. Amazonas</span>
                                        <span className="font-bold text-blue-400">06:15</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                                        <span>🚏 Ponto 03 - Av. Cristiano Machado</span>
                                        <span className="font-bold text-blue-400">06:35</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                                        <span>🚏 Ponto 04 - Terminal Vilarinho</span>
                                        <span className="font-bold text-blue-400">06:55</span>
                                    </div>
                                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex justify-between">
                                        <span>🏢 Ponto 05 - Portaria 1 Serra Verde (Destino)</span>
                                        <span className="font-bold text-emerald-400">07:20</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                                <Button variant="ghost" onClick={() => setIsRouteValidationModalOpen(false)} className="flex-1 text-slate-400">
                                    Voltar
                                </Button>
                                <Button onClick={handleValidateRoute} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                                    <CheckCircle2 className="h-4 w-4 mr-1.5" /> Confirmar Rota Validada
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </StandardLayout>
        );
    }

    // =======================================================
    // TELA 2: VIAGEM COMERCIAL EM ANDAMENTO (EMBARQUE ATIVO)
    // =======================================================
    if (tripPhase === 'IN_TRIP') {
        return (
            <StandardLayout title="Viagem em Andamento" subtitle="Registro de Embarque e Validação de Passageiros">
                <div className="p-4 space-y-4 max-w-xl mx-auto min-h-screen pb-24 text-white">
                    {/* Barra de Status */}
                    <div className="flex justify-between items-center bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-bold animate-pulse">
                                🟢 EM VIAGEM COMERCIAL
                            </Badge>
                            <span className="text-xs text-slate-400">KM Inicial: {kmStart} km</span>
                        </div>
                        <Badge className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                            isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                            {isOnline ? 'Online' : 'Offline'}
                        </Badge>
                    </div>

                    {/* Card de Ações Rápidas de Embarque */}
                    <Card className="bg-slate-900 border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Confirmação de Embarque de Passageiros
                            </h3>
                            <Badge className="bg-blue-600 text-white font-bold text-xs">
                                {boardedCount} / {expectedCount} Embarcados
                            </Badge>
                        </div>

                        {/* Botões Principais: Ler QR Code do Passageiro vs Informar Matrícula/CPF */}
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={() => setIsScannerOpen(true)}
                                className="bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs h-12 rounded-xl shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                Ler QR do Passageiro
                            </Button>
                            <Button
                                onClick={() => setIsDriverQrOpen(true)}
                                variant="outline"
                                className="border-slate-700 bg-slate-950 text-slate-200 hover:text-white font-bold text-xs h-12 rounded-xl flex items-center justify-center gap-2"
                            >
                                <QrCode className="h-4 w-4 text-blue-400" />
                                Exibir QR da Viagem
                            </Button>
                        </div>

                        {/* Campo de Busca / Check-in Rápido por Matrícula ou CPF com GPS */}
                        <div className="space-y-1.5 pt-1">
                            <label className="text-xs font-bold text-slate-400 block">
                                Check-in Rápido por Matrícula ou CPF:
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="Digite Matrícula ou CPF..."
                                        value={manualCpfOrMatricula}
                                        onChange={(e) => setManualCpfOrMatricula(e.target.value)}
                                        className="bg-slate-950 border-slate-700 pl-9 text-xs font-mono text-white"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                processBoarding('MANUAL_MATRICULA', manualCpfOrMatricula);
                                            }
                                        }}
                                    />
                                </div>
                                <Button
                                    onClick={() => processBoarding('MANUAL_MATRICULA', manualCpfOrMatricula)}
                                    disabled={!manualCpfOrMatricula.trim()}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 rounded-xl"
                                >
                                    Validar
                                </Button>
                            </div>
                        </div>

                        {/* Botão para ver Lista Completa */}
                        <Button
                            variant="ghost"
                            onClick={() => setIsListOpen(true)}
                            className="w-full text-xs text-blue-400 hover:text-blue-300"
                        >
                            Ver lista completa de passageiros da escala ({passengers.length})
                        </Button>
                    </Card>

                    {/* Botão de Encerrar Viagem */}
                    <Card className="bg-slate-900 border-slate-800 p-4 rounded-2xl">
                        <Button
                            onClick={() => setIsFinishTripModalOpen(true)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl shadow-lg shadow-red-600/30 text-sm uppercase tracking-wider"
                        >
                            <Square className="h-4 w-4 mr-2 fill-current" />
                            Encerrar Viagem Comercial
                        </Button>
                    </Card>

                    {/* Modal de Encerramento da Viagem (Solicita KM Final da Viagem) */}
                    <Dialog open={isFinishTripModalOpen} onOpenChange={setIsFinishTripModalOpen}>
                        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white">
                                    Encerrar Viagem Comercial
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Informe o odômetro final ao desembarcar todos os colaboradores no destino.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">
                                        Odômetro / KM Final da Viagem <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={kmEndTrip}
                                        onChange={(e) => setKmEndTrip(Number(e.target.value))}
                                        className="bg-slate-900 border-slate-700 font-mono text-white text-base font-bold"
                                        placeholder="Ex: 1725"
                                    />
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Inicial:</span>
                                        <span className="font-mono text-white">{kmStart} km</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800">
                                        <span>KM Comercial Percorrido:</span>
                                        <span className="font-mono text-sm">{kmViagemComercial} km</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Passageiros Transportados:</span>
                                        <span className="font-bold">{boardedCount} de {expectedCount}</span>
                                    </div>
                                </div>

                                <p className="text-[11px] text-blue-300 bg-blue-950/40 p-2.5 rounded-lg border border-blue-900/60">
                                    ℹ️ Após confirmar, o sistema entrará automaticamente na etapa de <strong>Deslocamento para a Garagem</strong>, usando este mesmo KM ({kmEndTrip} km) como KM Inicial de retorno.
                                </p>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                                <Button variant="ghost" onClick={() => setIsFinishTripModalOpen(false)} className="flex-1 text-slate-400">
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmFinishTrip} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold">
                                    Confirmar Término
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Scanner Universal de QR Code */}
                    <UniversalQrScannerModal
                        isOpen={isScannerOpen}
                        onClose={() => setIsScannerOpen(false)}
                        onScanSuccess={(decoded) => processBoarding('QR_SCAN_BY_DRIVER', decoded)}
                        title="Escanear QR Code do Colaborador"
                    />

                    {/* Modal do QR Code do Motorista */}
                    <Dialog open={isDriverQrOpen} onOpenChange={setIsDriverQrOpen}>
                        <DialogContent className="max-w-sm bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl text-center space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-base font-black text-white">QR Code da Viagem</DialogTitle>
                            </DialogHeader>
                            <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex items-center justify-center">
                                <img src={driverQrSvg} alt="QR Code" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-xs text-slate-400">
                                Os colaboradores podem escanear este código com o próprio celular para validar o check-in.
                            </p>
                        </DialogContent>
                    </Dialog>

                    {/* Modal Lista de Passageiros */}
                    <Dialog open={isListOpen} onOpenChange={setIsListOpen}>
                        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4 max-h-[85vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle className="text-base font-black text-white">Passageiros da Escala</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                {passengers.map((p) => (
                                    <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
                                        <div>
                                            <div className="font-bold text-white">{p.name}</div>
                                            <div className="text-[11px] text-slate-400">{p.matricula} &bull; {p.pointName}</div>
                                            {p.address && <div className="text-[10px] text-emerald-400">📍 {p.address}</div>}
                                        </div>
                                        <Badge className={p.boarded ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}>
                                            {p.boarded ? `Embarcado às ${p.time}` : 'Pendente'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </StandardLayout>
        );
    }

    // =========================================================================
    // TELA 3: DESLOCAMENTO PARA A GARAGEM (KM INICIAL = KM FINAL DA VIAGEM)
    // =========================================================================
    if (tripPhase === 'RETURNING_TO_GARAGE') {
        return (
            <StandardLayout title="Deslocamento para a Garagem" subtitle="Recolhimento do Veículo à Base da Viação São Silvestre">
                <div className="p-4 max-w-xl mx-auto space-y-5 text-white">
                    <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                            <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400">
                                <Warehouse className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-white">Recolhimento à Garagem Matriz VSS</h3>
                                <p className="text-xs text-slate-400">Veículo: {vehiclePlate} &bull; Destino: Garagem Central</p>
                            </div>
                        </div>

                        {/* Resumo do Trecho Anterior e Início do Deslocamento */}
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-300">
                                <span>Odômetro Inicial do Deslocamento:</span>
                                <span className="font-mono font-bold text-amber-400 text-sm">{kmEndTrip} km</span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                                (Equivalente exato ao KM Final da Viagem Comercial recém-encerrada)
                            </p>
                            <div className="flex justify-between text-slate-300 pt-2 border-t border-slate-800">
                                <span>KM Comercial Realizado:</span>
                                <span className="font-mono font-bold text-white">{kmViagemComercial} km</span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-purple-300">
                                <Navigation className="h-4 w-4" /> Em Trânsito de Retorno
                            </span>
                            <p>
                                Dirija com segurança até a garagem. Ao estacionar na vaga final, informe o odômetro de chegada para consolidar a jornada.
                            </p>
                        </div>

                        {/* Botão de Chegada na Garagem */}
                        <Button
                            onClick={() => setIsArriveGarageModalOpen(true)}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg shadow-purple-600/30 text-sm uppercase tracking-wider"
                        >
                            <Warehouse className="h-4 w-4 mr-2" />
                            Informar KM Final na Garagem
                        </Button>
                    </Card>

                    {/* Modal de Chegada na Garagem */}
                    <Dialog open={isArriveGarageModalOpen} onOpenChange={setIsArriveGarageModalOpen}>
                        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                                    <Warehouse className="h-5 w-5 text-purple-400" /> Confirmar Chegada na Garagem
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Informe a quilometragem final registrada no odômetro do veículo na garagem.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">
                                        Odômetro / KM Final na Garagem <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={kmEndGarage}
                                        onChange={(e) => setKmEndGarage(Number(e.target.value))}
                                        className="bg-slate-900 border-slate-700 font-mono text-white text-base font-bold"
                                        placeholder="Ex: 1742"
                                    />
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Saída do Destino (Início Garagem):</span>
                                        <span className="font-mono text-white">{kmEndTrip} km</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Chegada na Garagem:</span>
                                        <span className="font-mono text-white">{kmEndGarage} km</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-purple-400 pt-1 border-t border-slate-800">
                                        <span>KM Deslocamento Garagem:</span>
                                        <span className="font-mono text-sm">{kmDeslocamentoGaragem} km</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-emerald-400">
                                        <span>KM Total Geral do Veículo:</span>
                                        <span className="font-mono text-sm">{kmTotalGeral} km</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                                <Button variant="ghost" onClick={() => setIsArriveGarageModalOpen(false)} className="flex-1 text-slate-400">
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmArriveGarage} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold">
                                    Concluir e Salvar
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </StandardLayout>
        );
    }

    // ========================================================
    // TELA 4: RESUMO CONSOLIDADO FINAL DA JORNADA
    // ========================================================
    return (
        <StandardLayout title="Jornada Concluída" subtitle="Resumo Operacional e Quilometragem Consolidada">
            <div className="p-4 max-w-xl mx-auto space-y-5 text-white">
                <Card className="bg-slate-900 border-slate-800 p-6 rounded-3xl shadow-2xl space-y-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-white">Viagem e Recolhimento Concluídos!</h2>
                        <p className="text-xs text-slate-400">
                            Todos os registros operacionais foram salvos com sucesso na base central da Viação São Silvestre.
                        </p>
                    </div>

                    {/* Extrato Detalhado de Quilometragem */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">1. KM Inicial do Veículo:</span>
                            <span className="font-mono font-bold text-white text-sm">{kmStart} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">2. KM Final da Viagem (Comercial):</span>
                            <span className="font-mono font-bold text-white text-sm">{kmEndTrip} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-blue-400 font-bold">↳ KM Percorrido com Passageiros:</span>
                            <span className="font-mono font-bold text-blue-400 text-sm">{kmViagemComercial} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">3. KM Inicial Deslocamento Garagem:</span>
                            <span className="font-mono font-bold text-white text-sm">{kmEndTrip} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">4. KM Final na Chegada à Garagem:</span>
                            <span className="font-mono font-bold text-white text-sm">{kmEndGarage} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-purple-400 font-bold">↳ KM de Deslocamento para Garagem:</span>
                            <span className="font-mono font-bold text-purple-400 text-sm">{kmDeslocamentoGaragem} km</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 font-black text-amber-400 text-sm">
                            <span>TOTAL GERAL RODADO PELO ÔNIBUS:</span>
                            <span className="font-mono text-base">{kmTotalGeral} km</span>
                        </div>
                    </div>

                    {/* Resumo de Passageiros */}
                    <div className="flex justify-around items-center p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <div>
                            <span className="text-slate-400 block">Passageiros Transportados</span>
                            <span className="text-lg font-black text-emerald-400">{boardedCount}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div>
                            <span className="text-slate-400 block">Veículo Utilizado</span>
                            <span className="text-sm font-black text-white">{vehiclePlate}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleFinalizeAndExit}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 text-sm uppercase"
                    >
                        Retornar às Minhas Escalas
                    </Button>
                </Card>
            </div>
        </StandardLayout>
    );
};

const shiftLabel = (shift?: string) => {
    switch (shift) {
        case 'IDA':
            return 'Viagem de Ida';
        case 'VOLTA':
            return 'Viagem de Retorno';
        default:
            return shift || 'Viagem Programada';
    }
};

export default DriverTripExecution;
