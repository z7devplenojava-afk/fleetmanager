import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    Bus, 
    Users, 
    UserCheck, 
    MapPin, 
    Clock, 
    Eye, 
    Download, 
    Plus, 
    TrendingUp, 
    Calendar, 
    Warehouse, 
    DollarSign, 
    Gauge, 
    QrCode, 
    Filter,
    CheckCircle2
} from 'lucide-react';
import { TripDetailsModal, TripDetailData } from './TripDetailsModal';
import { PassengerQuickFormModal } from './PassengerQuickFormModal';
import { DriverQuickFormModal } from './DriverQuickFormModal';
import { useToast } from '@/hooks/use-toast';
import { generateQrCodeSvgUri } from '@/utils/qrCodeHelper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Dados operacionais padrão de demonstração / fallback (Imagem 1)
const INITIAL_TRIPS: TripDetailData[] = [
    {
        id: 'trip-1',
        time: '05:15',
        departureTime: '05:15',
        arrivalTime: '06:40',
        lineName: 'Verde',
        lineColor: '#16a34a',
        route: 'Farofa',
        origin: 'Farofa',
        destination: 'Centro - BH/MG',
        vehicleType: 'Micro Ônibus',
        vehiclePlate: 'SHZ-3A40',
        driverName: 'João Silva',
        passengersExpected: 50,
        passengersRealized: 45,
        kmStart: 1671,
        kmEnd: 1725,
        status: 'EM_ANDAMENTO',
        garageName: 'Garagem Central - VSS'
    },
    {
        id: 'trip-2',
        time: '05:15',
        departureTime: '05:15',
        arrivalTime: '06:30',
        lineName: 'Azul',
        lineColor: '#2563eb',
        route: 'Belo Vale',
        origin: 'Belo Vale',
        destination: 'Terminal Vilarinho',
        vehicleType: 'Van',
        vehiclePlate: 'RUR-7A78',
        driverName: 'Carlos Souza',
        passengersExpected: 50,
        passengersRealized: 42,
        kmStart: 2450,
        kmEnd: 2498,
        status: 'EM_ANDAMENTO',
        garageName: 'Garagem Norte'
    },
    {
        id: 'trip-3',
        time: '06:40',
        departureTime: '06:40',
        arrivalTime: '08:00',
        lineName: 'Rosa',
        lineColor: '#ec4899',
        route: 'Serra Verde',
        origin: 'Serra Verde',
        destination: 'Belo Horizonte',
        vehicleType: 'Micro Ônibus',
        vehiclePlate: 'SHZ-3A40',
        driverName: 'Ana Lima',
        passengersExpected: 60,
        passengersRealized: 56,
        kmStart: 1725,
        kmEnd: 1780,
        status: 'PROGRAMADO',
        garageName: 'Garagem Central - VSS'
    },
    {
        id: 'trip-4',
        time: '08:20',
        departureTime: '08:20',
        arrivalTime: '09:40',
        lineName: 'Amarela',
        lineColor: '#eab308',
        route: 'FHEMIG',
        origin: 'FHEMIG',
        destination: 'Hospital das Clínicas',
        vehicleType: 'Ônibus',
        vehiclePlate: 'RUR-7A78',
        driverName: 'Marcos Pereira',
        passengersExpected: 70,
        passengersRealized: 63,
        kmStart: 2498,
        kmEnd: 2560,
        status: 'EM_ANDAMENTO',
        garageName: 'Garagem Sul'
    },
    {
        id: 'trip-5',
        time: '11:00',
        departureTime: '11:00',
        arrivalTime: '12:15',
        lineName: 'Roxa',
        lineColor: '#a855f7',
        route: 'Primavera / Vale do Sol',
        origin: 'Primavera',
        destination: 'Vale do Sol',
        vehicleType: 'Micro Ônibus',
        vehiclePlate: 'SHZ-3A40',
        driverName: 'Juliana Costa',
        passengersExpected: 50,
        passengersRealized: 48,
        kmStart: 1780,
        kmEnd: 1832,
        status: 'PROGRAMADO',
        garageName: 'Garagem Central - VSS'
    },
    {
        id: 'trip-6',
        time: '12:30',
        departureTime: '12:30',
        arrivalTime: '13:50',
        lineName: 'Laranja',
        lineColor: '#f97316',
        route: 'Boa Esperança',
        origin: 'Boa Esperança',
        destination: 'Estação Central',
        vehicleType: 'Van',
        vehiclePlate: 'RUR-7A78',
        driverName: 'Roberto Alves',
        passengersExpected: 45,
        passengersRealized: 37,
        kmStart: 2560,
        kmEnd: 2614,
        status: 'PROGRAMADO',
        garageName: 'Garagem Leste'
    }
];

const OCCUPATION_DATA = [
    { name: 'Verde - Farofa', color: 'bg-emerald-500', percent: 92 },
    { name: 'Azul - Belo Vale', color: 'bg-blue-500', percent: 84 },
    { name: 'Rosa - Serra Verde', color: 'bg-pink-500', percent: 97 },
    { name: 'Amarela - FHEMIG', color: 'bg-yellow-500', percent: 89 },
    { name: 'Roxa - Primavera / Vale do Sol', color: 'bg-purple-500', percent: 76 },
    { name: 'Laranja - Boa Esperança', color: 'bg-orange-500', percent: 81 },
];

interface OperacaoDoDiaDashboardProps {
    filterGarage?: string;
    onSelectTripForDriver?: (trip: TripDetailData) => void;
}

export const OperacaoDoDiaDashboard: React.FC<OperacaoDoDiaDashboardProps> = ({
    filterGarage
}) => {
    const { toast } = useToast();
    const [trips, setTrips] = useState<TripDetailData[]>(INITIAL_TRIPS);
    const [selectedDate, setSelectedDate] = useState('2026-09-30');
    const [selectedPeriod, setSelectedPeriod] = useState('ALL');
    const [selectedLine, setSelectedLine] = useState('ALL');
    const [selectedGarage, setSelectedGarage] = useState<string>(filterGarage || 'ALL');

    const [selectedTrip, setSelectedTrip] = useState<TripDetailData | null>(null);
    const [isTripModalOpen, setIsTripModalOpen] = useState(false);
    const [isPassengerModalOpen, setIsPassengerModalOpen] = useState(false);
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
    const [qrCodeTrip, setQrCodeTrip] = useState<TripDetailData | null>(null);

    // Filtragem reativa de viagens
    const filteredTrips = useMemo(() => {
        return trips.filter(t => {
            if (selectedGarage !== 'ALL' && t.garageName !== selectedGarage) return false;
            if (selectedLine !== 'ALL' && !t.lineName.toLowerCase().includes(selectedLine.toLowerCase())) return false;
            return true;
        });
    }, [trips, selectedGarage, selectedLine]);

    const handleSaveKm = (tripId: string, kmStart: number, kmEnd: number) => {
        setTrips(prev => prev.map(t => t.id === tripId ? { ...t, kmStart, kmEnd } : t));
    };

    const handleExport = () => {
        toast({
            title: 'Exportando Operação do Dia',
            description: 'Relatório operacional diário gerado em PDF/Excel com sucesso.',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Saudação */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 rounded-2xl border border-slate-700/60 shadow-xl">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <span className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                            <Bus className="h-7 w-7" />
                        </span>
                        <span>Operação do Dia &mdash; <span className="text-blue-400">Viação São Silvestre</span></span>
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        Acompanhe em tempo real o resumo da operação das linhas, veículos, motoristas e passageiros.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button 
                        onClick={() => setIsPassengerModalOpen(true)}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-bold gap-2"
                    >
                        <Plus className="h-4 w-4 text-blue-400" /> Cadastro Passageiro
                    </Button>
                    <Button 
                        onClick={() => setIsDriverModalOpen(true)}
                        variant="outline"
                        className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700 text-xs font-bold gap-2"
                    >
                        <Plus className="h-4 w-4 text-emerald-400" /> Cadastro Motorista
                    </Button>
                    <Button 
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-2 shadow-lg shadow-blue-600/20"
                    >
                        <Download className="h-4 w-4" /> Exportar
                    </Button>
                </div>
            </div>

            {/* 5 Cards Superiores (Imagem 1) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Linhas Ativas</span>
                            <div className="text-2xl font-black text-white">6</div>
                            <span className="text-[10px] text-emerald-400 font-bold">+2 hoje</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Passageiros</span>
                            <div className="text-2xl font-black text-white">1.248</div>
                            <span className="text-[10px] text-emerald-400 font-bold">+12%</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-600/20 text-purple-400 rounded-xl">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Motoristas</span>
                            <div className="text-2xl font-black text-white">18</div>
                            <span className="text-[10px] text-purple-400 font-bold">🟢 Em operação</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-600/20 text-amber-400 rounded-xl">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Veículos</span>
                            <div className="text-2xl font-black text-white">14</div>
                            <span className="text-[10px] text-amber-400 font-bold">🟢 12 em operação</span>
                        </div>
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-4 rounded-xl shadow-md col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-pink-600/20 text-pink-400 rounded-xl">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Viagens</span>
                            <div className="text-2xl font-black text-white">32</div>
                            <span className="text-[10px] text-pink-400 font-bold">🟢 28 realizadas</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filtros da Operação (Data, Período, Linhas, Garagem) */}
            <div className="flex flex-wrap items-center gap-3 bg-slate-900/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <Input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="h-9 w-36 bg-slate-950 border-slate-700 text-xs font-bold text-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="h-9 w-32 bg-slate-950 border-slate-700 text-xs text-white">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700 text-white text-xs">
                            <SelectItem value="ALL">Todos Períodos</SelectItem>
                            <SelectItem value="MANHA">Manhã (05h-12h)</SelectItem>
                            <SelectItem value="TARDE">Tarde (12h-18h)</SelectItem>
                            <SelectItem value="NOITE">Noite (18h-00h)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select value={selectedLine} onValueChange={setSelectedLine}>
                        <SelectTrigger className="h-9 w-36 bg-slate-950 border-slate-700 text-xs text-white">
                            <SelectValue placeholder="Linhas" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700 text-white text-xs">
                            <SelectItem value="ALL">Todas as Linhas</SelectItem>
                            <SelectItem value="Verde">Verde (Farofa)</SelectItem>
                            <SelectItem value="Azul">Azul (Belo Vale)</SelectItem>
                            <SelectItem value="Rosa">Rosa (Serra Verde)</SelectItem>
                            <SelectItem value="Amarela">Amarela (FHEMIG)</SelectItem>
                            <SelectItem value="Roxa">Roxa (Primavera)</SelectItem>
                            <SelectItem value="Laranja">Laranja (Boa Esperança)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Filtro de Garagem */}
                <div className="flex items-center gap-2 ml-auto">
                    <Warehouse className="h-4 w-4 text-emerald-400" />
                    <Select value={selectedGarage} onValueChange={setSelectedGarage}>
                        <SelectTrigger className="h-9 w-52 bg-slate-950 border-slate-700 text-xs font-bold text-white">
                            <SelectValue placeholder="Garagem" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-950 border-slate-700 text-white text-xs">
                            <SelectItem value="ALL">🏢 Todas as Garagens</SelectItem>
                            <SelectItem value="Garagem Central - VSS">📍 Garagem Central - VSS</SelectItem>
                            <SelectItem value="Garagem Norte">📍 Garagem Norte</SelectItem>
                            <SelectItem value="Garagem Sul">📍 Garagem Sul</SelectItem>
                            <SelectItem value="Garagem Leste">📍 Garagem Leste</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Grid Principal: Tabela de Operação do Dia + Ocupação das Linhas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabela Operação do Dia (2 Colunas) */}
                <Card className="lg:col-span-2 bg-slate-900/90 border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <CardHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-black text-white flex items-center gap-2">
                            <Bus className="h-5 w-5 text-blue-400" /> Operação do Dia
                        </CardTitle>
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                            {filteredTrips.length} viagens encontradas
                        </Badge>
                    </CardHeader>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Horário</th>
                                    <th className="py-3 px-3">Linha</th>
                                    <th className="py-3 px-3">Trajeto</th>
                                    <th className="py-3 px-3">Veículo</th>
                                    <th className="py-3 px-3">Placa</th>
                                    <th className="py-3 px-3">Motorista</th>
                                    <th className="py-3 px-3">Passageiros</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-medium">
                                {filteredTrips.map((trip) => (
                                    <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                                        <td className="py-3.5 px-4 font-bold text-slate-200">{trip.time}</td>
                                        <td className="py-3.5 px-3">
                                            <span 
                                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-sm"
                                                style={{ backgroundColor: trip.lineColor }}
                                            >
                                                {trip.lineName}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-slate-300">{trip.route}</td>
                                        <td className="py-3.5 px-3 text-slate-400">{trip.vehicleType}</td>
                                        <td className="py-3.5 px-3 font-mono font-bold text-amber-400">{trip.vehiclePlate}</td>
                                        <td className="py-3.5 px-3 text-slate-200">{trip.driverName}</td>
                                        <td className="py-3.5 px-3 font-bold text-slate-300">
                                            <span className="text-emerald-400">{trip.passengersRealized}</span> / {trip.passengersExpected}
                                        </td>
                                        <td className="py-3.5 px-3">
                                            <Badge className={`text-[10px] font-bold ${
                                                trip.status === 'EM_ANDAMENTO'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                            }`}>
                                                <span className="w-1.5 h-1.5 rounded-full mr-1 inline-block bg-current" />
                                                {trip.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Programado'}
                                            </Badge>
                                        </td>
                                        <td className="py-3.5 px-3 text-right space-x-1">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => {
                                                    setSelectedTrip(trip);
                                                    setIsTripModalOpen(true);
                                                }}
                                                className="h-7 w-7 text-slate-400 hover:text-blue-400 hover:bg-slate-800"
                                                title="Ver Detalhes da Viagem"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                onClick={() => setQrCodeTrip(trip)}
                                                className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                                                title="Gerar QR Code de Embarque"
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Ocupação das Linhas (1 Coluna) */}
                <Card className="bg-slate-900/90 border-slate-800 text-white rounded-2xl shadow-xl p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                            <CardTitle className="text-base font-black text-white flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-emerald-400" /> Ocupação das Linhas
                            </CardTitle>
                            <span className="text-[11px] text-blue-400 font-bold cursor-pointer hover:underline">Ver detalhes ➔</span>
                        </div>

                        <div className="space-y-4 mt-5">
                            {OCCUPATION_DATA.map((item) => (
                                <div key={item.name} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                            {item.name}
                                        </span>
                                        <span className="text-white font-mono">{item.percent}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                                            style={{ width: `${item.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                        <span>Taxa média de ocupação operacional da frota em <strong>86.5%</strong> no período.</span>
                    </div>
                </Card>
            </div>

            {/* 4 Cards Inferiores (Imagem 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Passageiros Hoje</span>
                        <div className="text-2xl font-black text-white mt-1">1.248</div>
                        <span className="text-xs text-emerald-400 font-bold">+12% vs ontem</span>
                    </div>
                    <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
                        <Users className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Viagens Realizadas</span>
                        <div className="text-2xl font-black text-white mt-1">28 <span className="text-base text-slate-500 font-normal">/ 32</span></div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] mt-1">
                            87% Concluídas
                        </Badge>
                    </div>
                    <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
                        <MapPin className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">KM Rodados</span>
                        <div className="text-2xl font-black text-white mt-1">2.306 <span className="text-xs text-slate-400 font-normal">km</span></div>
                        <span className="text-xs text-purple-400 font-bold">+8% economia</span>
                    </div>
                    <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
                        <Gauge className="h-7 w-7" />
                    </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 text-white p-5 rounded-xl shadow-md flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Valor Arrecadado</span>
                        <div className="text-2xl font-black text-emerald-400 mt-1">R$ 70.211,40</div>
                        <span className="text-xs text-emerald-400 font-bold">+10% receita</span>
                    </div>
                    <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-xl">
                        <DollarSign className="h-7 w-7" />
                    </div>
                </Card>
            </div>

            {/* Modais */}
            <TripDetailsModal 
                isOpen={isTripModalOpen}
                onClose={() => setIsTripModalOpen(false)}
                trip={selectedTrip}
                onSaveKm={handleSaveKm}
                onOpenQrCode={(t) => setQrCodeTrip(t)}
            />

            <PassengerQuickFormModal 
                isOpen={isPassengerModalOpen}
                onClose={() => setIsPassengerModalOpen(false)}
            />

            <DriverQuickFormModal 
                isOpen={isDriverModalOpen}
                onClose={() => setIsDriverModalOpen(false)}
            />

            {/* Modal de Exibição do QR Code da Viagem */}
            <Dialog open={!!qrCodeTrip} onOpenChange={() => setQrCodeTrip(null)}>
                <DialogContent className="max-w-sm bg-[#0f172a] text-slate-100 border border-slate-700 p-6 rounded-2xl text-center">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black text-white">
                            QR Code de Embarque &mdash; Linha {qrCodeTrip?.lineName}
                        </DialogTitle>
                    </DialogHeader>
                    {qrCodeTrip && (
                        <div className="space-y-4 py-4">
                            <div className="bg-white p-4 rounded-2xl mx-auto w-56 h-56 flex items-center justify-center shadow-lg">
                                <img 
                                    src={generateQrCodeSvgUri(JSON.stringify({
                                        tripId: qrCodeTrip.id,
                                        line: qrCodeTrip.lineName,
                                        route: qrCodeTrip.route,
                                        plate: qrCodeTrip.vehiclePlate,
                                        time: qrCodeTrip.time
                                    }))}
                                    alt="QR Code da Viagem"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="text-xs text-slate-300">
                                <p className="font-bold text-white">{qrCodeTrip.route} &bull; {qrCodeTrip.time}</p>
                                <p className="text-slate-400">Veículo: {qrCodeTrip.vehiclePlate} ({qrCodeTrip.driverName})</p>
                                <p className="text-emerald-400 text-[11px] mt-2 font-semibold">
                                    Apresente para os passageiros escanearem ao embarcar.
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OperacaoDoDiaDashboard;
