import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Play,
    Square,
    QrCode,
    Users,
    Gauge,
    Bus,
    CheckCircle2,
    AlertCircle,
    Clock,
    Eye,
    Search,
    Wifi,
    WifiOff,
    Navigation,
    Warehouse,
    ArrowRight,
    Map as MapIcon,
    Camera,
    FileCheck,
    ListFilter,
    Plus,
    RefreshCw,
    Route as RouteIcon,
    Building2,
    Calendar
} from 'lucide-react';
import { UniversalQrScannerModal } from '@/components/common/UniversalQrScannerModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeSvgUri, generateQrCodeDataPayload } from '@/utils/qrCodeHelper';
import { StandardLayout } from '@/components/StandardLayout';
import fretamentoCheckinService, { getCurrentGeoPosition, reverseGeocode } from '@/services/fretamentoCheckinService';
import { scheduleService, Schedule } from '@/services/scheduleService';
import driverRouteCodeService, { DriverRouteCode, DEFAULT_DRIVER_ROUTE_CODES } from '@/services/driverRouteCodeService';

// Fix for default leaflet icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
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
type TripStatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type PassengerFilter = 'ALL' | 'BOARDED' | 'PENDING';

const INITIAL_PASSENGERS_LIST: PassengerBoardingItem[] = [
    { id: '1', name: 'Maria Aparecida Souza', cpf: '123.456.789-00', matricula: '1002', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 01 - Centro BH' },
    { id: '2', name: 'João Carlos Silva', cpf: '234.567.890-11', matricula: '1045', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 02 - Av. Amazonas' },
    { id: '3', name: 'Ana Paula Lima', cpf: '345.678.901-22', matricula: '2018', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 03 - Av. Cristiano Machado' },
    { id: '4', name: 'Marcos Pereira Santos', cpf: '456.789.012-33', matricula: '3041', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 04 - Terminal Vilarinho' },
    { id: '5', name: 'Juliana Costa Ribeiro', cpf: '567.890.123-44', matricula: '4112', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 05 - Serra Verde' },
    { id: '6', name: 'Rodrigo Alves Ferreira', cpf: '678.901.234-55', matricula: '5089', company: 'Mineração Vale Verde', boarded: false, pointName: 'Ponto 05 - Serra Verde' },
    { id: '7', name: 'Ruan Antonio Murilo da Mata - teste', cpf: '000.000.000-00', matricula: '7695', company: 'Transporte Público / Fretado', boarded: false, pointName: 'Ponto 01 - Centro BH' },
];

const DriverTripExecution: React.FC = () => {
    const { scheduleId } = useParams<{ scheduleId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    // Lista de todas as viagens do motorista com seus status
    const [driverTrips, setDriverTrips] = useState<Schedule[]>(() => {
        try {
            const cached = scheduleService.getCachedMySchedules();
            if (cached && cached.length > 0) return cached;
        } catch {}
        return [];
    });
    const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
    const [tripStatusFilter, setTripStatusFilter] = useState<TripStatusFilter>('ALL');
    const [selectedTripId, setSelectedTripId] = useState<string>(scheduleId || '');

    // Códigos de Percurso / Tipo de Deslocamento
    const [routeCodes, setRouteCodes] = useState<DriverRouteCode[]>(DEFAULT_DRIVER_ROUTE_CODES);
    const [selectedDisplacementCode, setSelectedDisplacementCode] = useState<string>('12 - FÁBRICA/GARAGEM');
    const [isCreateCodeOpen, setIsCreateCodeOpen] = useState<boolean>(false);
    const [newCodeNumber, setNewCodeNumber] = useState<string>('');
    const [newCodeOrigin, setNewCodeOrigin] = useState<string>('');
    const [newCodeDestination, setNewCodeDestination] = useState<string>('');

    // Sentido da Viagem: IDA (Verde) vs VOLTA / RETORNO (Roxo)
    const [tripDirection, setTripDirection] = useState<'IDA' | 'VOLTA'>('IDA');
    const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Fases da viagem
    const [tripPhase, setTripPhase] = useState<TripPhase>('PREPARATION');
    const [isRouteValidated, setIsRouteValidated] = useState(true);
    const [isRouteValidationModalOpen, setIsRouteValidationModalOpen] = useState(false);

    // Dados da Rota e Veículo (atualizados conforme viagem selecionada)
    const [routeName, setRouteName] = useState('Linha Rosa - Serra Verde (Fretado)');
    const [clientName, setClientName] = useState('Mineração Vale Verde');
    const [vehiclePlate, setVehiclePlate] = useState('SHZ-3A40');
    const [vehiclePrefix, setVehiclePrefix] = useState('5422');

    // Odômetros nas etapas da viagem
    const [kmStart, setKmStart] = useState<number>(167189);
    const [kmEndTrip, setKmEndTrip] = useState<number>(167243);
    const [kmEndGarage, setKmEndGarage] = useState<number>(167260);

    // Modais
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isDriverQrOpen, setIsDriverQrOpen] = useState(false);
    const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);
    const [isArriveGarageModalOpen, setIsArriveGarageModalOpen] = useState(false);

    // Busca e Check-in Manual + Filtro de Passageiros em Tempo Real
    const [passengerSearch, setPassengerSearch] = useState('');
    const [passengerFilter, setPassengerFilter] = useState<PassengerFilter>('ALL');
    const [manualCpfOrMatricula, setManualCpfOrMatricula] = useState('');

    // Trajeto e Coordenadas do mapa
    const routeCoords: [number, number][] = [
        [-19.9191, -43.9386], // Ponto 01 - Centro BH
        [-19.9050, -43.9450], // Ponto 02 - Av. Amazonas
        [-19.8650, -43.9680], // Ponto 03 - Av. Cristiano Machado
        [-19.8300, -43.9750], // Ponto 04 - Terminal Vilarinho
        [-19.7950, -43.9850], // Ponto 05 - Serra Verde
    ];

    const activeScheduleKey = selectedTripId || scheduleId || 'default';
    const storageKey = `driver_trip_${activeScheduleKey}_${tripDirection}`;

    const [passengers, setPassengers] = useState<PassengerBoardingItem[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch {}
        return INITIAL_PASSENGERS_LIST;
    });

    // Recarrega passageiros ao trocar viagem ou sentido
    useEffect(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                setPassengers(JSON.parse(saved));
                return;
            }
        } catch {}
        setPassengers(INITIAL_PASSENGERS_LIST);
    }, [storageKey]);

    // Salva passageiros no localStorage sempre que atualizar
    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(passengers));
        } catch (e) {
            console.error('Erro ao salvar passageiros:', e);
        }
    }, [passengers, storageKey]);

    // Sincronização em tempo real: escuta leituras de QR Code feitas por passageiros ou outros terminais
    useEffect(() => {
        const syncRealtimeCheckins = () => {
            try {
                const allCheckins = fretamentoCheckinService.getAllCheckins();
                if (!allCheckins || allCheckins.length === 0) return;

                const todayPrefix = new Date().toISOString().slice(0, 10);
                const relevantCheckins = allCheckins.filter(c => {
                    const sameDay = !c.timestamp || c.timestamp.startsWith(todayPrefix);
                    const matchesSchedule = !selectedTripId || !c.scheduleId || String(c.scheduleId) === String(selectedTripId);
                    const matchesPlate = !c.vehiclePlate || c.vehiclePlate === vehiclePlate;
                    return sameDay && (matchesSchedule || matchesPlate);
                });

                if (relevantCheckins.length === 0) return;

                setPassengers(prev => {
                    let changed = false;
                    const updated = prev.map(p => {
                        const pCpfClean = (p.cpf || '').replace(/\D/g, '');
                        const pMatClean = (p.matricula || '').replace(/\D/g, '');
                        const match = relevantCheckins.find(c => {
                            const cCpf = (c.cpf || '').replace(/\D/g, '');
                            const cMat = (c.matricula || '').replace(/\D/g, '');
                            if (c.passengerId && String(c.passengerId) === String(p.id)) return true;
                            if (pCpfClean && cCpf && pCpfClean === cCpf && pCpfClean !== '00000000000') return true;
                            if (pMatClean && cMat && pMatClean === cMat) return true;
                            if (c.passengerName && p.name.toLowerCase() === c.passengerName.toLowerCase()) return true;
                            return false;
                        });

                        if (match && (!p.boarded || p.direction !== match.direction)) {
                            changed = true;
                            const timeStr = match.timestamp
                                ? new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : new Date().toLocaleTimeString().substring(0, 5);
                            return {
                                ...p,
                                boarded: true,
                                time: p.time || timeStr,
                                address: match.address || p.address,
                                direction: (match.direction === 'VOLTA' ? 'VOLTA' : 'IDA') as 'IDA' | 'VOLTA',
                                synced: match.synced ?? true,
                            };
                        }
                        return p;
                    });
                    return changed ? updated : prev;
                });
            } catch {}
        };

        const interval = setInterval(syncRealtimeCheckins, 2000);
        window.addEventListener('storage', syncRealtimeCheckins);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', syncRealtimeCheckins);
        };
    }, [selectedTripId, vehiclePlate]);

    // Carrega códigos de percurso (CÓDIGO - PERCURSO)
    useEffect(() => {
        let mounted = true;
        driverRouteCodeService.getAll().then(codes => {
            if (mounted && Array.isArray(codes) && codes.length > 0) {
                setRouteCodes(codes);
            }
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    // Carrega todas as viagens do motorista
    const loadDriverTrips = useCallback(async () => {
        setLoadingTrips(true);
        try {
            const list = await scheduleService.findMySchedules();
            if (Array.isArray(list) && list.length > 0) {
                setDriverTrips(list);
                if (!selectedTripId) {
                    const active = list.find(t => t.status === 'IN_PROGRESS') || list[0];
                    if (active?.id) {
                        applyTripToState(active, false);
                    }
                } else {
                    const matched = list.find(t => String(t.id) === String(selectedTripId));
                    if (matched) {
                        applyTripToState(matched, false);
                    }
                }
            }
        } catch (e) {
            console.warn('Erro ao carregar viagens do motorista:', e);
        } finally {
            setLoadingTrips(false);
        }
    }, [selectedTripId]);

    useEffect(() => {
        loadDriverTrips();
        const onUpdated = () => loadDriverTrips();
        window.addEventListener('fluxbus:driver-records-updated', onUpdated);
        return () => window.removeEventListener('fluxbus:driver-records-updated', onUpdated);
    }, [loadDriverTrips]);

    const applyTripToState = (trip: Schedule, switchPhase = true) => {
        setSelectedTripId(String(trip.id || ''));
        setRouteName(trip.routeName || trip.line || trip.workstation || 'Linha Rosa - Serra Verde (Fretado)');
        setClientName(trip.clientName || trip.companyName || 'Mineração Vale Verde');
        setVehiclePlate(trip.vehiclePlate || 'SHZ-3A40');
        setVehiclePrefix(trip.vehiclePrefix || '5422');

        const dir: 'IDA' | 'VOLTA' =
            trip.direction === 'RETORNO' || trip.direction === 'VOLTA' ||
            (trip.routeName || '').toUpperCase().includes('RETORNO') ||
            (trip.routeName || '').toUpperCase().includes('VOLTA')
                ? 'VOLTA'
                : 'IDA';
        setTripDirection(dir);

        if (trip.routeCode) {
            setSelectedDisplacementCode(trip.routeCode);
        }

        const initKm = Number(trip.initialKm ?? trip.kmStart ?? 167189) || 167189;
        const finKm = Number(trip.finalKm ?? trip.kmEnd ?? (initKm + 54)) || (initKm + 54);
        setKmStart(initKm);
        setKmEndTrip(finKm);
        setKmEndGarage(finKm + 17);

        if (switchPhase) {
            if (trip.status === 'IN_PROGRESS') {
                setTripPhase('IN_TRIP');
            } else if (trip.status === 'COMPLETED') {
                setTripPhase('FINISHED');
            } else {
                setTripPhase('PREPARATION');
            }
        }
    };

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

    // Filtragem de passageiros para exibição em tempo real
    const filteredPassengers = useMemo(() => {
        return passengers.filter(p => {
            if (passengerFilter === 'BOARDED' && !p.boarded) return false;
            if (passengerFilter === 'PENDING' && p.boarded) return false;
            if (passengerSearch.trim()) {
                const q = passengerSearch.toLowerCase().trim();
                const matchName = p.name.toLowerCase().includes(q);
                const matchMat = (p.matricula || '').toLowerCase().includes(q);
                const matchCpf = (p.cpf || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
                const matchPoint = (p.pointName || '').toLowerCase().includes(q);
                return matchName || matchMat || matchCpf || matchPoint;
            }
            return true;
        });
    }, [passengers, passengerFilter, passengerSearch]);

    // Filtragem da lista de viagens do motorista
    const filteredDriverTrips = useMemo(() => {
        return driverTrips.filter(t => {
            if (tripStatusFilter === 'ALL') return true;
            if (tripStatusFilter === 'PENDING') return t.status === 'PENDING' || t.status === 'CONFIRMED';
            if (tripStatusFilter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
            if (tripStatusFilter === 'COMPLETED') return t.status === 'COMPLETED';
            return true;
        });
    }, [driverTrips, tripStatusFilter]);

    const tripCounts = useMemo(() => {
        const total = driverTrips.length;
        const pending = driverTrips.filter(t => t.status === 'PENDING' || t.status === 'CONFIRMED').length;
        const inProgress = driverTrips.filter(t => t.status === 'IN_PROGRESS').length;
        const completed = driverTrips.filter(t => t.status === 'COMPLETED').length;
        return { total, pending, inProgress, completed };
    }, [driverTrips]);

    // Cálculo dos trechos de KM
    const kmViagemComercial = Math.max(0, kmEndTrip - kmStart);
    const kmDeslocamentoGaragem = Math.max(0, kmEndGarage - kmEndTrip);
    const kmTotalGeral = Math.max(0, kmEndGarage - kmStart);

    // Criar novo código de percurso (CÓDIGO - PERCURSO)
    const handleCreateRouteCode = async () => {
        if (!newCodeNumber.trim() || !newCodeOrigin.trim() || !newCodeDestination.trim()) {
            toast({
                title: 'Campos obrigatórios',
                description: 'Informe o código, origem e destino (ex: 16, GARAGEM, OBRA).',
                variant: 'destructive',
            });
            return;
        }
        try {
            const created = await driverRouteCodeService.create({
                code: newCodeNumber.trim(),
                origin: newCodeOrigin.trim(),
                destination: newCodeDestination.trim(),
            });
            const updated = await driverRouteCodeService.getAll();
            setRouteCodes(updated);
            setSelectedDisplacementCode(created.formatted);
            setIsCreateCodeOpen(false);
            setNewCodeNumber('');
            setNewCodeOrigin('');
            setNewCodeDestination('');
            toast({
                title: '✅ Código de Percurso Criado!',
                description: `O código "${created.formatted}" foi selecionado.`,
            });
        } catch (err: any) {
            toast({
                title: 'Erro ao criar código',
                description: err?.message || 'Não foi possível salvar o código.',
                variant: 'destructive',
            });
        }
    };

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
    const handleStartTrip = async () => {
        if (!kmStart || kmStart <= 0) {
            toast({
                title: 'KM Inicial Obrigatório',
                description: 'Por favor, informe o odômetro inicial do veículo.',
                variant: 'destructive',
            });
            return;
        }

        setKmEndTrip(kmStart + 54);
        setKmEndGarage(kmStart + 71);
        setTripPhase('IN_TRIP');

        if (selectedTripId) {
            try {
                await scheduleService.startTrip(selectedTripId, {
                    initialKm: kmStart,
                    checklistOk: true,
                    passengersBoarded: boardedCount,
                    direction: tripDirection === 'VOLTA' ? 'RETORNO' : 'IDA',
                });
                loadDriverTrips();
            } catch (e) {
                console.warn('Falha ao atualizar status de início da viagem:', e);
            }
        }

        toast({
            title: 'Viagem Iniciada!',
            description: `Viagem comercial (${tripDirection === 'IDA' ? 'IDA - Verde' : 'RETORNO - Roxo'}) iniciada no KM ${kmStart}. Embarque em tempo real habilitado.`,
        });
    };

    // Confirmação de Check-in (por QR Code, Matrícula, CPF ou Clique Direto) com captura de GPS e endereço
    const processBoarding = async (
        type: 'QR_SCAN_BY_DRIVER' | 'MANUAL_CPF' | 'MANUAL_MATRICULA',
        searchValue: string,
        directPassenger?: PassengerBoardingItem
    ) => {
        const raw = searchValue.trim();
        if (!raw && !directPassenger) return;

        let matchedId = directPassenger?.id || '';
        let passengerName = directPassenger?.name || '';
        let passengerCpf = directPassenger?.cpf || '';
        let passengerMatricula = directPassenger?.matricula || '';
        let isJson = false;
        const nowTime = new Date().toLocaleTimeString().substring(0, 5);

        if (!directPassenger && raw.startsWith('{') && raw.endsWith('}')) {
            try {
                const parsed = JSON.parse(raw);
                isJson = true;
                passengerName = parsed.nom || parsed.name || parsed.nome || '';
                matchedId = String(parsed.id || parsed.passengerId || '');
                passengerCpf = parsed.cpf || '';
                passengerMatricula = String(parsed.mat || parsed.matricula || parsed.registration || '').replace(/\D/g, '');
            } catch {}
        }

        if (!directPassenger && !isJson) {
            const digits = raw.replace(/\D/g, '');
            if (digits.length === 11) {
                passengerCpf = raw;
            } else {
                passengerMatricula = raw;
            }
        }

        const cleanCpf = passengerCpf.replace(/\D/g, '');
        const target = directPassenger || passengers.find(p => {
            if (matchedId && p.id === matchedId) return true;
            if (cleanCpf && p.cpf && p.cpf.replace(/\D/g, '') === cleanCpf) return true;
            const pMat = (p.matricula || '').replace(/\D/g, '');
            if (passengerMatricula && pMat && pMat === passengerMatricula) return true;
            if (passengerName && p.name.toLowerCase().includes(passengerName.toLowerCase())) return true;
            if (raw && p.name.toLowerCase().includes(raw.toLowerCase())) return true;
            return false;
        });

        const geo = await getCurrentGeoPosition();
        const address = await reverseGeocode(geo.latitude, geo.longitude);

        const finalId = target ? target.id : (matchedId || `guest-${Date.now()}`);
        const finalName = target ? target.name : (passengerName || (cleanCpf.length === 11 ? `CPF: ${passengerCpf}` : (passengerMatricula ? `Matrícula: ${passengerMatricula}` : 'Colaborador')));
        const finalCpf = target ? (target.cpf || passengerCpf) : (passengerCpf || '000.000.000-00');
        const finalMatricula = target ? (target.matricula || passengerMatricula) : (passengerMatricula || 'MAT-AVULSO');
        const finalCompany = target ? (target.company || clientName) : clientName;

        try {
            await fretamentoCheckinService.registerCheckin({
                passengerId: finalId,
                passengerName: finalName,
                cpf: finalCpf,
                matricula: finalMatricula,
                companyName: finalCompany,
                lineName: routeName,
                vehiclePlate,
                driverName: 'Motorista VSS',
                direction: tripDirection,
                checkinType: type,
                latitude: geo.latitude,
                longitude: geo.longitude,
                address,
                scheduleId: selectedTripId || scheduleId,
            });

            if (target) {
                setPassengers(prev => prev.map(p =>
                    p.id === target.id
                        ? { ...p, boarded: true, time: nowTime, address, direction: tripDirection, synced: isOnline }
                        : p
                ));
            } else {
                const newPassenger: PassengerBoardingItem = {
                    id: finalId,
                    name: finalName,
                    cpf: finalCpf,
                    matricula: finalMatricula,
                    company: finalCompany,
                    boarded: true,
                    time: nowTime,
                    address,
                    pointName: 'Embarque Validado via QR Code',
                    direction: tripDirection,
                    synced: isOnline,
                };
                setPassengers(prev => [newPassenger, ...prev]);
            }

            toast({
                title: `✅ Embarque Confirmado (${tripDirection === 'IDA' ? 'IDA • Verde' : 'RETORNO • Roxo'})`,
                description: `${finalName} embarcou às ${nowTime}. Local: ${address}`,
            });
        } catch (err: any) {
            // Mesmo se já houver check-in prévio no serviço local, atualizamos visualmente em tempo real com a cor do sentido atual
            if (target) {
                setPassengers(prev => prev.map(p =>
                    p.id === target.id
                        ? { ...p, boarded: true, time: p.time || nowTime, address: p.address || address, direction: tripDirection, synced: isOnline }
                        : p
                ));
                toast({
                    title: `✅ Passageiro Marcado (${tripDirection === 'IDA' ? 'IDA • Verde' : 'RETORNO • Roxo'})`,
                    description: `${finalName} atualizado na lista em tempo real (${nowTime}).`,
                });
            } else {
                const errorMsg = err?.message || 'Falha ao registrar embarque.';
                toast({
                    title: '🚫 EMBARQUE RECUSADO',
                    description: errorMsg,
                    variant: 'destructive',
                });
            }
        }

        setIsScannerOpen(false);
        setManualCpfOrMatricula('');
    };

    // Encerrar Viagem Comercial -> Salva KM Final da Rota e Tipo de Deslocamento (CÓDIGO - PERCURSO)
    const handleConfirmFinishTrip = async () => {
        if (!kmEndTrip || kmEndTrip < kmStart) {
            toast({
                title: 'KM Final Inválido',
                description: `O KM Final da rota deve ser maior ou igual ao KM Inicial (${kmStart} km).`,
                variant: 'destructive',
            });
            return;
        }

        setIsFinishTripModalOpen(false);
        if (kmEndGarage < kmEndTrip) {
            setKmEndGarage(kmEndTrip + 17);
        }

        if (selectedTripId) {
            try {
                await scheduleService.finishTrip(selectedTripId, {
                    finalKm: kmEndTrip,
                    passengersCount: boardedCount,
                    direction: tripDirection === 'VOLTA' ? 'RETORNO' : 'IDA',
                    routeCode: selectedDisplacementCode,
                    occurrences: `Código de Percurso: ${selectedDisplacementCode}`,
                });
                loadDriverTrips();
            } catch (e) {
                console.warn('Erro ao salvar conclusão parcial da viagem:', e);
            }
        }

        setTripPhase('RETURNING_TO_GARAGE');

        toast({
            title: 'Viagem Concluída! Informe o Deslocamento',
            description: `KM Final da Rota: ${kmEndTrip} km | Deslocamento: ${selectedDisplacementCode}.`,
        });
    };

    // Confirmar Conclusão do Deslocamento / Chegada no Destino do Código de Percurso
    const handleConfirmArriveGarage = async () => {
        if (!kmEndGarage || kmEndGarage < kmEndTrip) {
            toast({
                title: 'KM Final do Deslocamento Inválido',
                description: `O KM Final do deslocamento deve ser maior ou igual ao KM Final da rota (${kmEndTrip} km).`,
                variant: 'destructive',
            });
            return;
        }

        if (selectedTripId) {
            try {
                await scheduleService.finishTrip(selectedTripId, {
                    finalKm: kmEndGarage,
                    passengersCount: boardedCount,
                    direction: tripDirection === 'VOLTA' ? 'RETORNO' : 'IDA',
                    routeCode: selectedDisplacementCode,
                    occurrences: `KM Final Rota: ${kmEndTrip} km | KM Final Deslocamento (${selectedDisplacementCode}): ${kmEndGarage} km`,
                });
                loadDriverTrips();
            } catch (e) {
                console.warn('Erro ao consolidar viagem final:', e);
            }
        }

        setIsArriveGarageModalOpen(false);
        setTripPhase('FINISHED');
        toast({
            title: '✅ Viagem e Deslocamento Consolidados!',
            description: `Percurso ${selectedDisplacementCode} registrado com KM Final ${kmEndGarage} km.`,
        });
    };

    // Concluir tudo e voltar para a lista de viagens
    const handleFinalizeAndExit = () => {
        toast({
            title: 'Jornada Finalizada com Sucesso!',
            description: `Escala concluída (${selectedDisplacementCode}). KM Total percorrido: ${kmTotalGeral} km.`,
        });
        setTripPhase('PREPARATION');
        loadDriverTrips();
    };

    // QR Code do Motorista
    const driverQrPayload = generateQrCodeDataPayload('TRIP', {
        tripId: selectedTripId || scheduleId || 'trip-vss-01',
        line: routeName,
        plate: vehiclePlate,
        kmStart,
        kmEnd: kmEndTrip,
        direction: tripDirection,
    });
    const driverQrSvg = generateQrCodeSvgUri(driverQrPayload, 260);

    // Helper para renderizar badge de status da viagem
    const renderStatusBadge = (status?: string) => {
        switch (status) {
            case 'IN_PROGRESS':
                return (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold animate-pulse">
                        🟢 Em Andamento
                    </Badge>
                );
            case 'COMPLETED':
                return (
                    <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-bold">
                        ✅ Concluída
                    </Badge>
                );
            case 'CONFIRMED':
                return (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                        Confirmada
                    </Badge>
                );
            case 'CANCELLED':
                return (
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                        Cancelada
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                        ⏳ Pendente
                    </Badge>
                );
        }
    };

    // Helper para renderizar seletor de CÓDIGO - PERCURSO (idêntico à imagem enviada pelo usuário)
    const renderDisplacementCodeSelector = (compact = false) => (
        <div className="rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-inner">
            <div className="bg-amber-500/20 border-b border-amber-500/30 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-black tracking-wider uppercase text-amber-300 flex items-center gap-1.5">
                    <RouteIcon className="h-3.5 w-3.5 text-amber-400" />
                    CÓDIGO - PERCURSO (Tipo de Deslocamento)
                </span>
                <Badge className="bg-amber-500 text-slate-950 font-mono font-black text-[10px]">
                    {selectedDisplacementCode}
                </Badge>
            </div>
            <div className={`${compact ? 'max-h-44' : 'max-h-56'} overflow-y-auto divide-y divide-slate-800/80`}>
                {routeCodes.map((rc) => {
                    const isSelected = selectedDisplacementCode === rc.formatted;
                    return (
                        <button
                            key={rc.id || rc.formatted}
                            type="button"
                            onClick={() => setSelectedDisplacementCode(rc.formatted)}
                            className={`w-full text-left px-3.5 py-2 text-xs font-mono transition-colors flex items-center justify-between ${
                                isSelected
                                    ? 'bg-amber-500/25 text-amber-200 font-black border-l-4 border-amber-400'
                                    : 'text-slate-300 hover:bg-slate-900/90'
                            }`}
                        >
                            <span>{rc.formatted}</span>
                            {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="p-2 bg-slate-900/90 border-t border-slate-800">
                {!isCreateCodeOpen ? (
                    <button
                        type="button"
                        onClick={() => setIsCreateCodeOpen(true)}
                        className="w-full py-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1"
                    >
                        <Plus className="h-3.5 w-3.5" /> Criar código
                    </button>
                ) : (
                    <div className="space-y-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                        <div className="grid grid-cols-3 gap-1.5">
                            <Input
                                placeholder="Cód (16)"
                                value={newCodeNumber}
                                onChange={e => setNewCodeNumber(e.target.value)}
                                className="h-8 text-xs bg-slate-900 border-slate-700 font-mono text-white"
                            />
                            <Input
                                placeholder="Origem"
                                value={newCodeOrigin}
                                onChange={e => setNewCodeOrigin(e.target.value)}
                                className="h-8 text-xs bg-slate-900 border-slate-700 uppercase text-white"
                            />
                            <Input
                                placeholder="Destino"
                                value={newCodeDestination}
                                onChange={e => setNewCodeDestination(e.target.value)}
                                className="h-8 text-xs bg-slate-900 border-slate-700 uppercase text-white"
                            />
                        </div>
                        <div className="flex justify-end gap-1.5">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsCreateCodeOpen(false)}
                                className="h-7 text-xs text-slate-400"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleCreateRouteCode}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                            >
                                Salvar Código
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Helper para renderizar a Lista de Todas as Viagens do Motorista com seus Status
    const renderDriverTripsListSection = () => (
        <Card className="bg-slate-900 border-slate-800 text-white p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                        <ListFilter className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white">Lista de Todas as Viagens e Status</h3>
                        <p className="text-[11px] text-slate-400">
                            Selecione uma viagem para iniciar, acompanhar o embarque ou informar o KM Final e deslocamento
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={loadDriverTrips}
                    disabled={loadingTrips}
                    className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white"
                >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingTrips ? 'animate-spin' : ''}`} />
                    Atualizar ({tripCounts.total})
                </Button>
            </div>

            {/* Abas de Filtro por Status */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                    type="button"
                    onClick={() => setTripStatusFilter('ALL')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        tripStatusFilter === 'ALL'
                            ? 'bg-blue-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Todas ({tripCounts.total})
                </button>
                <button
                    type="button"
                    onClick={() => setTripStatusFilter('PENDING')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        tripStatusFilter === 'PENDING'
                            ? 'bg-amber-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Pendentes ({tripCounts.pending})
                </button>
                <button
                    type="button"
                    onClick={() => setTripStatusFilter('IN_PROGRESS')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        tripStatusFilter === 'IN_PROGRESS'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Em Viagem ({tripCounts.inProgress})
                </button>
                <button
                    type="button"
                    onClick={() => setTripStatusFilter('COMPLETED')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        tripStatusFilter === 'COMPLETED'
                            ? 'bg-purple-600 text-white shadow'
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    Concluídas ({tripCounts.completed})
                </button>
            </div>

            {/* Lista de Viagens */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {filteredDriverTrips.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-950 rounded-xl border border-slate-800">
                        Nenhuma viagem encontrada para este filtro.
                    </div>
                ) : (
                    filteredDriverTrips.map((trip) => {
                        const isSelected = String(trip.id) === String(selectedTripId);
                        const isReturn =
                            trip.direction === 'RETORNO' ||
                            trip.direction === 'VOLTA' ||
                            (trip.routeName || '').toUpperCase().includes('RETORNO') ||
                            (trip.routeName || '').toUpperCase().includes('VOLTA');
                        const initKmVal = trip.initialKm ?? trip.kmStart;
                        const finalKmVal = trip.finalKm ?? trip.kmEnd;

                        return (
                            <div
                                key={trip.id}
                                onClick={() => applyTripToState(trip, true)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-blue-950/40 border-blue-500/70 ring-1 ring-blue-500/40'
                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs font-black text-white">
                                                {trip.routeName || trip.line || trip.workstation || 'Rota Operacional'}
                                            </span>
                                            {/* Badge de Sentido: IDA (Verde) vs RETORNO (Roxo) */}
                                            <Badge
                                                className={`text-[10px] font-black border ${
                                                    isReturn
                                                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                                                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                }`}
                                            >
                                                {isReturn ? '🟣 RETORNO' : '🟢 IDA'}
                                            </Badge>
                                            {trip.routeCode && (
                                                <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                                                    {trip.routeCode}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Building2 className="h-3 w-3 text-slate-500" />
                                                {trip.clientName || trip.companyName || 'Cliente Contratante'}
                                            </span>
                                            <span className="flex items-center gap-1 font-mono text-amber-400 font-bold">
                                                <Bus className="h-3 w-3" />
                                                {trip.vehiclePlate || vehiclePlate}
                                            </span>
                                            {(trip.startTime || trip.time) && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-blue-400" />
                                                    {trip.startTime || trip.time}
                                                    {trip.endTime ? ` - ${trip.endTime}` : ''}
                                                </span>
                                            )}
                                            {trip.date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-slate-500" />
                                                    {trip.date}
                                                </span>
                                            )}
                                        </div>
                                        {(initKmVal !== undefined || finalKmVal !== undefined) && (
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-300 pt-0.5">
                                                {initKmVal !== undefined && <span>KM Inicial: <strong>{initKmVal}</strong></span>}
                                                {finalKmVal !== undefined && <span>KM Final: <strong className="text-emerald-400">{finalKmVal}</strong></span>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-end gap-1.5">
                                        {renderStatusBadge(trip.status)}
                                        <div className="flex items-center gap-1">
                                            {trip.status === 'IN_PROGRESS' ? (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        applyTripToState(trip, false);
                                                        setTripPhase('IN_TRIP');
                                                    }}
                                                    className="h-7 px-2.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
                                                >
                                                    Ver Embarque em Andamento
                                                </Button>
                                            ) : trip.status === 'COMPLETED' ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        applyTripToState(trip, false);
                                                        setTripPhase('RETURNING_TO_GARAGE');
                                                    }}
                                                    className="h-7 px-2.5 text-[10px] font-bold border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/50"
                                                >
                                                    KM Final / Deslocamento
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        applyTripToState(trip, false);
                                                        setTripPhase('PREPARATION');
                                                    }}
                                                    className="h-7 px-2.5 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white"
                                                >
                                                    Preparar / Iniciar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </Card>
    );

    // ==========================================
    // TELA 1: PREPARAÇÃO & VALIDAÇÃO DA ROTA
    // ==========================================
    if (tripPhase === 'PREPARATION') {
        return (
            <StandardLayout title="Gestão de Viagens" subtitle="Lista de Viagens do Motorista, Validação de Rota e Início de Operação">
                <div className="p-4 max-w-3xl mx-auto space-y-5">
                    {/* Lista de Todas as Viagens do Motorista com seus Status */}
                    {renderDriverTripsListSection()}

                    {/* Card Principal da Viagem Selecionada */}
                    <Card className="bg-slate-900 border-slate-800 text-white p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                                    <Bus className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">{routeName}</h3>
                                    <p className="text-xs text-slate-400">
                                        Cliente: <span className="text-slate-200 font-semibold">{clientName}</span> &bull; Veículo:{' '}
                                        <span className="font-mono font-bold text-amber-400">{vehiclePlate}</span> (Prefixo {vehiclePrefix})
                                    </p>
                                </div>
                            </div>

                            {/* Seletor de Sentido (IDA = Verde, RETORNO = Roxo) */}
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setTripDirection('IDA')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        tripDirection === 'IDA'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                                            : 'text-slate-400 hover:text-emerald-300'
                                    }`}
                                >
                                    🟢 IDA
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTripDirection('VOLTA')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                        tripDirection === 'VOLTA'
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                            : 'text-slate-400 hover:text-purple-300'
                                    }`}
                                >
                                    🟣 RETORNO
                                </button>
                            </div>
                        </div>

                        {/* Etapa 1: Validar Rota */}
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
                                    Visualizar Rota
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
                                    placeholder="Ex: 167189"
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">
                                Informe a quilometragem marcada no painel do ônibus antes de iniciar o itinerário.
                            </p>
                        </div>
                    </Card>

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            onClick={handleStartTrip}
                            className={`w-full text-white font-black py-4 rounded-2xl shadow-xl text-sm uppercase tracking-wider transition-all ${
                                isRouteValidated
                                    ? tripDirection === 'IDA'
                                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 ring-2 ring-emerald-400'
                                        : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/30 ring-2 ring-purple-400'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                            }`}
                        >
                            <Play className="h-5 w-5 mr-2 fill-current" />
                            Iniciar Viagem ({tripDirection === 'IDA' ? 'IDA' : 'RETORNO'})
                        </Button>

                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => setTripPhase('RETURNING_TO_GARAGE')}
                            className="w-full border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/50 text-purple-200 font-black py-4 rounded-2xl text-sm uppercase tracking-wider"
                        >
                            <Warehouse className="h-5 w-5 mr-2 text-purple-400" />
                            Informar KM Final & Deslocamento
                        </Button>
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

                            <div className="h-60 w-full rounded-2xl overflow-hidden border border-slate-800">
                                <MapContainer center={[-19.8650, -43.9680]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
                                    <TileLayer
                                        attribution='&copy; Google Maps'
                                        url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                                        subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                                        maxZoom={20}
                                    />
                                    <Polyline positions={routeCoords} color="#2563eb" weight={5} opacity={0.8} />
                                    {routeCoords.map((pos, i) => (
                                        <Marker key={i} position={pos} icon={busStopIcon}>
                                            <Popup>Ponto de Parada 0{i + 1}</Popup>
                                        </Marker>
                                    ))}
                                </MapContainer>
                            </div>

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
        const isIda = tripDirection === 'IDA';
        return (
            <StandardLayout title="Gestão de Viagens" subtitle="Viagem em Andamento — Lista de Funcionários Embarcados em Tempo Real">
                <div className="p-4 space-y-4 max-w-3xl mx-auto min-h-screen pb-24 text-white">
                    {/* Lista resumida de Todas as Viagens para troca rápida */}
                    {renderDriverTripsListSection()}

                    {/* Barra de Status + Seletor de Sentido com Cores (IDA = Verde, RETORNO = Roxo) */}
                    <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${
                                isIda
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                            } border text-xs font-bold animate-pulse`}>
                                {isIda ? '🟢 EM VIAGEM (SENTIDO IDA)' : '🟣 EM VIAGEM (SENTIDO RETORNO)'}
                            </Badge>
                            <span className="text-xs text-slate-400 font-mono">KM Inicial: {kmStart} km</span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Botões de Sentido: IDA (Verde) e RETORNO (Roxo) */}
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setTripDirection('IDA')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                        isIda
                                            ? 'bg-emerald-600 text-white shadow shadow-emerald-600/40'
                                            : 'text-slate-400 hover:text-emerald-300'
                                    }`}
                                >
                                    🟢 IDA (Verde)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTripDirection('VOLTA')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                                        !isIda
                                            ? 'bg-purple-600 text-white shadow shadow-purple-600/40'
                                            : 'text-slate-400 hover:text-purple-300'
                                    }`}
                                >
                                    🟣 RETORNO (Roxa)
                                </button>
                            </div>

                            <Badge className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                                isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                                {isOnline ? 'Online' : 'Offline'}
                            </Badge>
                        </div>
                    </div>

                    {/* Card de Confirmação de Embarque + Lista de Funcionários em Tempo Real */}
                    <Card className="bg-slate-900 border-slate-800 p-4 rounded-2xl shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Confirmação de Embarque de Passageiros (Tempo Real)
                            </h3>
                            <div className="flex items-center gap-2">
                                <Badge className={`${
                                    isIda ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                                } font-black text-xs`}>
                                    {boardedCount} / {expectedCount} Embarcados
                                </Badge>
                            </div>
                        </div>

                        {/* Botões Principais: Ler QR Code do Passageiro vs Exibir QR da Viagem */}
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

                        {/* Campo de Busca / Check-in Rápido por Matrícula ou CPF */}
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

                        {/* Legenda das Cores de Sentido (Ida = Verde / Retorno = Roxo) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                            <span className="font-bold text-slate-300 flex items-center gap-1.5">
                                <QrCode className="h-3.5 w-3.5 text-pink-400" />
                                Lista de Funcionários em Tempo Real (leitura automática de QR Code):
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                                    Sentido IDA (Verde)
                                </span>
                                <span className="flex items-center gap-1 text-purple-400 font-bold">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                                    Sentido RETORNO (Roxo)
                                </span>
                            </div>
                        </div>

                        {/* Filtros e Pesquisa da Lista de Funcionários */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setPassengerFilter('ALL')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                        passengerFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Todos ({passengers.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPassengerFilter('BOARDED')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                        passengerFilter === 'BOARDED'
                                            ? isIda ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                                            : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Embarcados ({boardedCount})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPassengerFilter('PENDING')}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                        passengerFilter === 'PENDING' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Aguardando ({expectedCount - boardedCount})
                                </button>
                            </div>

                            <div className="relative flex-1 min-w-[180px]">
                                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
                                <Input
                                    placeholder="Filtrar funcionário por nome ou matrícula..."
                                    value={passengerSearch}
                                    onChange={e => setPassengerSearch(e.target.value)}
                                    className="h-8 bg-slate-950 border-slate-800 pl-8 text-xs text-white"
                                />
                            </div>
                        </div>

                        {/* LISTA DE FUNCIONÁRIOS VISÍVEL EM TEMPO REAL */}
                        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                            {filteredPassengers.map((p) => {
                                const effectiveDirection = p.direction || tripDirection;
                                const isBoardedReturn = p.boarded && effectiveDirection === 'VOLTA';
                                const isBoardedIda = p.boarded && effectiveDirection !== 'VOLTA';

                                return (
                                    <div
                                        key={p.id}
                                        className={`p-3 rounded-xl border transition-all flex flex-wrap justify-between items-center gap-2 text-xs ${
                                            isBoardedIda
                                                ? 'bg-emerald-950/50 border-emerald-500/70 shadow-sm shadow-emerald-500/10'
                                                : isBoardedReturn
                                                ? 'bg-purple-950/50 border-purple-500/70 shadow-sm shadow-purple-500/10'
                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                                    isBoardedIda
                                                        ? 'bg-emerald-400 ring-4 ring-emerald-500/20'
                                                        : isBoardedReturn
                                                        ? 'bg-purple-400 ring-4 ring-purple-500/20'
                                                        : 'bg-slate-600'
                                                }`} />
                                                <span className="font-bold text-white text-sm">{p.name}</span>
                                                {p.boarded && (
                                                    <Badge className={`text-[10px] font-black border ${
                                                        isBoardedIda
                                                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                                            : 'bg-purple-600 text-white border-purple-400'
                                                    }`}>
                                                        {isBoardedIda ? 'SENTIDO IDA (VERDE)' : 'SENTIDO RETORNO (ROXO)'}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-300 pl-4">
                                                Matrícula: <span className="font-mono font-bold text-amber-300">{p.matricula || '—'}</span>
                                                {p.cpf ? ` • CPF: ${p.cpf}` : ''} &bull; {p.pointName}
                                            </div>
                                            {p.address && (
                                                <div className={`text-[10px] pl-4 font-medium ${
                                                    isBoardedIda ? 'text-emerald-300' : 'text-purple-300'
                                                }`}>
                                                    📍 {p.address}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {p.boarded ? (
                                                <Badge className={`px-2.5 py-1 text-[11px] font-black border ${
                                                    isBoardedIda
                                                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400/60'
                                                        : 'bg-purple-500/25 text-purple-200 border-purple-400/60'
                                                }`}>
                                                    ✓ Embarcado às {p.time}
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => processBoarding('QR_SCAN_BY_DRIVER', p.matricula || p.cpf || p.name, p)}
                                                    className={`h-8 px-3 text-[11px] font-bold text-white ${
                                                        isIda
                                                            ? 'bg-emerald-600 hover:bg-emerald-500'
                                                            : 'bg-purple-600 hover:bg-purple-500'
                                                    }`}
                                                >
                                                    <QrCode className="h-3.5 w-3.5 mr-1" />
                                                    Confirmar QR ({isIda ? 'Ida' : 'Retorno'})
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Botão de Concluir Viagem Comercial */}
                    <Card className="bg-slate-900 border-slate-800 p-4 rounded-2xl">
                        <Button
                            onClick={() => setIsFinishTripModalOpen(true)}
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-xl shadow-lg shadow-red-600/30 text-sm uppercase tracking-wider"
                        >
                            <Square className="h-4 w-4 mr-2 fill-current" />
                            Concluir Viagem e Informar KM Final / Deslocamento
                        </Button>
                    </Card>

                    {/* Modal de Encerramento da Viagem (Solicita KM Final da Rota e Código de Percurso / Tipo de Deslocamento) */}
                    <Dialog open={isFinishTripModalOpen} onOpenChange={setIsFinishTripModalOpen}>
                        <DialogContent className="max-w-lg bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4 max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white">
                                    Concluir Viagem — KM Final da Rota e Tipo de Deslocamento
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Informe o odômetro final da rota e selecione o tipo de deslocamento conforme o Código de Percurso.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">
                                        1. Odômetro / KM Final da Rota <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={kmEndTrip}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setKmEndTrip(val);
                                            if (kmEndGarage < val) setKmEndGarage(val + 17);
                                        }}
                                        className="bg-slate-900 border-slate-700 font-mono text-white text-base font-bold"
                                        placeholder="Ex: 167243"
                                    />
                                </div>

                                {/* Seletor de Tipo de Deslocamento conforme Código de Percurso */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-300 block">
                                        2. Tipo de Deslocamento conforme Código de Percurso <span className="text-red-500">*</span>
                                    </label>
                                    {renderDisplacementCodeSelector(true)}
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Inicial da Rota:</span>
                                        <span className="font-mono text-white">{kmStart} km</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-slate-800">
                                        <span>KM Comercial Percorrido na Rota:</span>
                                        <span className="font-mono text-sm">{kmViagemComercial} km</span>
                                    </div>
                                    <div className="flex justify-between text-purple-300">
                                        <span>Código de Percurso / Deslocamento:</span>
                                        <span className="font-mono font-bold">{selectedDisplacementCode}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-400">
                                        <span>Funcionários Embarcados:</span>
                                        <span className="font-bold">{boardedCount} de {expectedCount}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2 border-t border-slate-800">
                                <Button variant="ghost" onClick={() => setIsFinishTripModalOpen(false)} className="flex-1 text-slate-400">
                                    Cancelar
                                </Button>
                                <Button onClick={handleConfirmFinishTrip} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                                    Confirmar e Prosseguir
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
                                Os colaboradores podem escanear este código com o próprio celular para validar o check-in em tempo real.
                            </p>
                        </DialogContent>
                    </Dialog>
                </div>
            </StandardLayout>
        );
    }

    // =========================================================================
    // TELA 3: PÓS-VIAGEM — INFORMAR KM FINAL DA ROTA E TIPO DE DESLOCAMENTO (CÓDIGO - PERCURSO)
    // =========================================================================
    if (tripPhase === 'RETURNING_TO_GARAGE') {
        return (
            <StandardLayout title="Gestão de Viagens" subtitle="Conclusão da Viagem — Informar KM Final da Rota e Tipo de Deslocamento (Código de Percurso)">
                <div className="p-4 max-w-3xl mx-auto space-y-5 text-white">
                    {/* Lista de Todas as Viagens */}
                    {renderDriverTripsListSection()}

                    <Card className="bg-slate-900 border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-purple-600/20 text-purple-400">
                                    <Warehouse className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white">
                                        Fechamento de KM Final da Rota & Deslocamento ({selectedDisplacementCode})
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Veículo: <span className="font-mono font-bold text-amber-400">{vehiclePlate}</span> &bull; Rota: {routeName}
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold">
                                {selectedDisplacementCode}
                            </Badge>
                        </div>

                        {/* Campos diretos de KM Final da Rota e KM Final do Deslocamento */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                <label className="text-xs font-bold text-slate-300 block">
                                    KM Final da Rota (Encerramento da Viagem) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    value={kmEndTrip}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        setKmEndTrip(val);
                                        if (kmEndGarage < val) setKmEndGarage(val);
                                    }}
                                    className="bg-slate-900 border-slate-700 font-mono text-amber-400 text-base font-bold"
                                />
                                <p className="text-[11px] text-slate-400">
                                    KM Inicial: <strong className="text-white">{kmStart} km</strong> &bull; KM Comercial: <strong className="text-emerald-400">{kmViagemComercial} km</strong>
                                </p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                                <label className="text-xs font-bold text-slate-300 block">
                                    KM Final do Deslocamento ({selectedDisplacementCode}) <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="number"
                                    value={kmEndGarage}
                                    onChange={(e) => setKmEndGarage(Number(e.target.value))}
                                    className="bg-slate-900 border-slate-700 font-mono text-purple-300 text-base font-bold"
                                />
                                <p className="text-[11px] text-slate-400">
                                    KM Deslocamento: <strong className="text-purple-400">{kmDeslocamentoGaragem} km</strong> &bull; Total Geral: <strong className="text-amber-400">{kmTotalGeral} km</strong>
                                </p>
                            </div>
                        </div>

                        {/* Seletor de Tipo de Deslocamento conforme o Código de Percurso */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-200 block">
                                Selecione o Tipo de Deslocamento conforme o Código de Percurso:
                            </label>
                            {renderDisplacementCodeSelector(false)}
                        </div>

                        <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 space-y-1">
                            <span className="font-bold flex items-center gap-1.5 text-purple-300">
                                <Navigation className="h-4 w-4" /> Registro de Deslocamento ({selectedDisplacementCode})
                            </span>
                            <p>
                                Confira o KM Final da rota ({kmEndTrip} km), o tipo de deslocamento selecionado ({selectedDisplacementCode}) e o KM Final de chegada ({kmEndGarage} km) para concluir a viagem.
                            </p>
                        </div>

                        {/* Botões de Confirmação */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button
                                onClick={() => setIsArriveGarageModalOpen(true)}
                                variant="outline"
                                className="w-full border-purple-500/40 bg-slate-950 hover:bg-slate-800 text-purple-300 font-bold py-4 rounded-xl text-xs uppercase tracking-wider"
                            >
                                <Gauge className="h-4 w-4 mr-2" />
                                Conferir Resumo no Modal
                            </Button>
                            <Button
                                onClick={handleConfirmArriveGarage}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-4 rounded-xl shadow-lg shadow-purple-600/30 text-sm uppercase tracking-wider"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Salvar KM Final e Deslocamento
                            </Button>
                        </div>
                    </Card>

                    {/* Modal de Confirmação Final */}
                    <Dialog open={isArriveGarageModalOpen} onOpenChange={setIsArriveGarageModalOpen}>
                        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border border-slate-800 p-6 rounded-3xl space-y-4">
                            <DialogHeader>
                                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                                    <Warehouse className="h-5 w-5 text-purple-400" /> Confirmar KM Final e Deslocamento
                                </DialogTitle>
                                <DialogDescription className="text-xs text-slate-400">
                                    Confirme o odômetro final e o código de percurso selecionado ({selectedDisplacementCode}).
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-300 block mb-1">
                                        Odômetro / KM Final <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="number"
                                        value={kmEndGarage}
                                        onChange={(e) => setKmEndGarage(Number(e.target.value))}
                                        className="bg-slate-900 border-slate-700 font-mono text-white text-base font-bold"
                                        placeholder="Ex: 167260"
                                    />
                                </div>

                                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-slate-400">
                                        <span>Código de Percurso:</span>
                                        <span className="font-mono font-bold text-amber-400">{selectedDisplacementCode}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Final da Rota:</span>
                                        <span className="font-mono text-white">{kmEndTrip} km</span>
                                    </div>
                                    <div className="flex justify-between text-slate-400">
                                        <span>KM Final do Deslocamento:</span>
                                        <span className="font-mono text-white">{kmEndGarage} km</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-purple-400 pt-1 border-t border-slate-800">
                                        <span>KM Deslocamento:</span>
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
        <StandardLayout title="Gestão de Viagens" subtitle="Jornada Concluída — Resumo Operacional e Quilometragem Consolidada">
            <div className="p-4 max-w-3xl mx-auto space-y-5 text-white">
                {/* Lista de Todas as Viagens atualizada */}
                {renderDriverTripsListSection()}

                <Card className="bg-slate-900 border-slate-800 p-6 rounded-3xl shadow-2xl space-y-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-white">Viagem e Deslocamento Concluídos!</h2>
                        <p className="text-xs text-slate-400">
                            Todos os registros operacionais foram salvos com sucesso na base central da Viação São Silvestre.
                        </p>
                    </div>

                    {/* Extrato Detalhado de Quilometragem e Código de Percurso */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Sentido da Viagem:</span>
                            <Badge className={tripDirection === 'IDA' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'}>
                                {tripDirection === 'IDA' ? '🟢 IDA (Verde)' : '🟣 RETORNO (Roxo)'}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">Tipo de Deslocamento (Código - Percurso):</span>
                            <span className="font-mono font-black text-amber-400 text-sm">{selectedDisplacementCode}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">1. KM Inicial do Veículo:</span>
                            <span className="font-mono font-bold text-white text-sm">{kmStart} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">2. KM Final da Rota (Comercial):</span>
                            <span className="font-mono font-bold text-white text-sm">{kmEndTrip} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-blue-400 font-bold">↳ KM Percorrido com Passageiros:</span>
                            <span className="font-mono font-bold text-blue-400 text-sm">{kmViagemComercial} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-slate-400">3. KM Final do Deslocamento ({selectedDisplacementCode}):</span>
                            <span className="font-mono font-bold text-white text-sm">{kmEndGarage} km</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                            <span className="text-purple-400 font-bold">↳ KM de Deslocamento:</span>
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
                            <span className="text-slate-400 block">Passageiros Embarcados</span>
                            <span className="text-lg font-black text-emerald-400">{boardedCount}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div>
                            <span className="text-slate-400 block">Veículo Utilizado</span>
                            <span className="text-sm font-black text-white">{vehiclePlate}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                            onClick={handleFinalizeAndExit}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/30 text-sm uppercase"
                        >
                            Selecionar Outra Viagem
                        </Button>
                        <Button
                            onClick={() => navigate('/fretamento/minhas-escalas')}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/30 text-sm uppercase"
                        >
                            Ir para Minhas Escalas
                        </Button>
                    </div>
                </Card>
            </div>
        </StandardLayout>
    );
};

export default DriverTripExecution;
