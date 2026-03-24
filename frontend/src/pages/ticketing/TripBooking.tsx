import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, MapPin, Calendar, Armchair, User, CreditCard, CheckCircle2 } from 'lucide-react';
import ticketingService, { RegularTrip, SeatTemplate } from '@/services/ticketingService';
import { routeService, Route } from '@/services/routeService';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TripBooking: React.FC = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Search state
    const [routes, setRoutes] = useState<Route[]>([]);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [trips, setTrips] = useState<RegularTrip[]>([]);
    const [loading, setLoading] = useState(false);

    // Booking state
    const [selectedTrip, setSelectedTrip] = useState<RegularTrip | null>(null);
    const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
    const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
    const [tripTickets, setTripTickets] = useState<Ticket[]>([]); // Manifesto
    const [step, setStep] = useState(1); // 1: Search, 2: Seat Map, 3: Passenger Info, 4: Confirmation
    const [currentFloor, setCurrentFloor] = useState(1);

    // Passenger state
    const [passengerName, setPassengerName] = useState('');
    const [passengerDoc, setPassengerDoc] = useState('');

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            const data = await routeService.findAllRoutes();
            setRoutes(data);
        } catch (error) {
            console.error('Error loading routes', error);
        }
    };

    const handleSearch = async () => {
        if (!selectedRouteId) {
            toast({ title: "Selecione uma rota", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const data = await ticketingService.searchTrips(selectedRouteId, selectedDate + "T00:00:00");
            setTrips(data);
            if (data.length === 0) {
                toast({ title: "Nenhuma viagem encontrada para esta data" });
            }
        } catch (error) {
            toast({ title: "Erro ao buscar viagens", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const loadManifest = async (tripId: string) => {
        try {
            const tickets = await ticketingService.getTicketsByTrip(tripId);
            setTripTickets(tickets);
            // Also refresh occupied seats list just in case
            const occupied = tickets.map(t => t.seatNumber);
            setOccupiedSeats(occupied);
        } catch (error) {
            console.error('Error loading manifest', error);
        }
    };

    const selectTrip = async (trip: RegularTrip) => {
        setSelectedTrip(trip);
        setSelectedSeat(null);
        setCurrentFloor(1);
        try {
            await loadManifest(trip.id);
            setStep(2);
        } catch (error) {
            toast({ title: "Erro ao buscar mapa de assentos", variant: "destructive" });
        }
    };

    const reserve = async () => {
        if (!selectedSeat || !selectedTrip) return;
        if (!passengerName || !passengerDoc) {
            toast({ title: "Preencha os dados do passageiro", variant: "destructive" });
            return;
        }

        try {
            await ticketingService.reserveSeat({
                tripId: selectedTrip.id,
                seatNumber: selectedSeat,
                passengerName,
                passengerDoc,
                userId: user?.id || ''
            });

            // Refresh manifest before showing success? Or just move to success.
            // Move to success
            setStep(4);
            toast({ title: "Passagem reservada com sucesso!" });

            // Clear passenger info for next booking
            setPassengerName('');
            setPassengerDoc('');
        } catch (error) {
            toast({ title: "Assento indisponível ou erro na reserva", variant: "destructive" });
        }
    };

    const renderSeatMap = () => {
        if (!selectedTrip) return null;
        const layout = JSON.parse(selectedTrip.seatTemplate.layoutJson);
        const { rows, cols, seats, floors = 1 } = layout;

        return (
            <div className="flex flex-col items-center gap-6">
                {floors > 1 && (
                    <div className="flex gap-2 p-1 bg-seguranca-black rounded-lg border border-seguranca-graphite">
                        <Button
                            variant={currentFloor === 1 ? "default" : "ghost"}
                            className={currentFloor === 1 ? "bg-seguranca-yellow text-seguranca-black" : "text-seguranca-lightgray"}
                            onClick={() => setCurrentFloor(1)}
                            size="sm"
                        >
                            1º Andar
                        </Button>
                        <Button
                            variant={currentFloor === 2 ? "default" : "ghost"}
                            className={currentFloor === 2 ? "bg-seguranca-yellow text-seguranca-black" : "text-seguranca-lightgray"}
                            onClick={() => setCurrentFloor(2)}
                            size="sm"
                        >
                            2º Andar
                        </Button>
                    </div>
                )}
                <div className="bg-seguranca-black/50 p-6 rounded-[2.5rem] border-4 border-seguranca-graphite shadow-2xl relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-seguranca-graphite px-6 py-1 rounded-full text-[10px] uppercase font-bold text-seguranca-lightgray border-2 border-seguranca-black tracking-widest">
                        Frente do Veículo
                    </div>
                    <div
                        className="grid gap-3"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                    >
                        {Array.from({ length: rows }).map((_, r) => (
                            Array.from({ length: cols }).map((_, c) => {
                                const seatDef = seats.find((s: any) => s.row === r && s.col === c && s.floor === currentFloor);
                                if (!seatDef) return <div key={`${r}-${c}`} className="w-12 h-12" />;

                                const isOccupied = occupiedSeats.includes(seatDef.number);
                                const isSelected = selectedSeat === seatDef.number;

                                return (
                                    <button
                                        key={`${r}-${c}`}
                                        disabled={isOccupied}
                                        onClick={() => setSelectedSeat(seatDef.number)}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300 relative ${isOccupied
                                            ? 'bg-red-500/10 text-red-500/30 cursor-not-allowed border-2 border-red-500/20 shadow-inner'
                                            : isSelected
                                                ? 'bg-seguranca-yellow text-seguranca-black scale-110 shadow-[0_0_15px_rgba(255,191,0,0.4)] border-2 border-seguranca-yellow z-10'
                                                : 'bg-green-500/10 text-green-500 border-2 border-green-500/30 hover:bg-green-500/30 hover:scale-105 active:scale-95'
                                            }`}
                                    >
                                        <Armchair size={16} className={isSelected ? "opacity-100" : "opacity-40"} />
                                        <span className="absolute -bottom-1 text-[8px] font-black">{seatDef.number}</span>
                                    </button>
                                );
                            })
                        ))}
                    </div>
                </div>
                <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider bg-seguranca-black/30 px-6 py-2 rounded-full border border-seguranca-graphite">
                    <div className="flex items-center gap-2 text-green-500">
                        <div className="w-3 h-3 bg-green-500/20 border-2 border-green-500/30 rounded" /> Disponível
                    </div>
                    <div className="flex items-center gap-2 text-red-500/50">
                        <div className="w-3 h-3 bg-red-500/10 border-2 border-red-500/20 rounded" /> Ocupado
                    </div>
                    <div className="flex items-center gap-2 text-seguranca-yellow">
                        <div className="w-3 h-3 bg-seguranca-yellow rounded" /> Selecionado
                    </div>
                </div>
            </div>
        );
    };

    const renderManifest = () => {
        return (
            <Card className="bg-seguranca-black border-seguranca-graphite border-2 shadow-xl sticky top-6">
                <CardHeader className="border-b border-seguranca-graphite pb-4">
                    <CardTitle className="text-white text-base flex items-center gap-2">
                        <User size={18} className="text-seguranca-yellow" /> Manifesto de Passageiros
                    </CardTitle>
                    <p className="text-[10px] text-seguranca-lightgray uppercase tracking-widest">Conformidade DEER / ANTT</p>
                </CardHeader>
                <CardContent className="pt-4 px-0 max-h-[500px] overflow-auto">
                    {tripTickets.length === 0 ? (
                        <div className="p-8 text-center text-seguranca-lightgray italic text-sm">
                            Nenhuma passagem vendida ainda.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-seguranca-graphite/50 text-seguranca-lightgray text-[10px] uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left font-bold">Assento</th>
                                    <th className="px-2 py-2 text-left font-bold">Passageiro / Doc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-seguranca-graphite/30">
                                {tripTickets.sort((a, b) => Number(a.seatNumber) - Number(b.seatNumber)).map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-seguranca-graphite/20 transition-colors">
                                        <td className="px-4 py-3 font-black text-seguranca-yellow">{ticket.seatNumber}</td>
                                        <td className="px-2 py-3">
                                            <div className="font-bold text-white uppercase text-[11px] truncate max-w-[150px]">{ticket.passengerName}</div>
                                            <div className="text-[9px] text-seguranca-lightgray">{ticket.passengerDocument}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
                <div className="p-4 bg-seguranca-graphite/30 border-t border-seguranca-graphite rounded-b-xl flex justify-between items-center">
                    <div className="text-[10px] text-seguranca-lightgray font-bold uppercase">Total Vendido</div>
                    <div className="text-seguranca-yellow font-black">{tripTickets.length}</div>
                </div>
            </Card>
        );
    };

    return (
        <StandardLayout title="Venda de Passagens">
            <div className="max-w-7xl mx-auto space-y-6">
                {step === 1 && (
                    <div className="space-y-6">
                        <Card className="bg-seguranca-graphite border-seguranca-graphite shadow-xl border-2">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-bold text-white uppercase text-xs">
                                            <MapPin size={16} className="text-seguranca-yellow" /> Rota
                                        </Label>
                                        <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                                            <SelectTrigger className="bg-seguranca-black border-seguranca-black h-12">
                                                <SelectValue placeholder="Selecione a rota" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {routes.map(r => (
                                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2 font-bold text-white uppercase text-xs">
                                            <Calendar size={16} className="text-seguranca-yellow" /> Data de Partida
                                        </Label>
                                        <Input
                                            type="date"
                                            className="bg-seguranca-black border-seguranca-black h-12"
                                            value={selectedDate}
                                            onChange={e => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleSearch}
                                        disabled={loading}
                                        className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 h-12 font-bold shadow-lg shadow-seguranca-yellow/20"
                                    >
                                        {loading ? "Buscando..." : <><Search size={18} className="mr-2" /> Buscar Viagens</>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-4">
                            {trips.map(trip => (
                                <Card key={trip.id} className="bg-seguranca-graphite border-seguranca-graphite border-2 hover:border-seguranca-yellow/50 transition-all cursor-pointer group shadow-xl" onClick={() => selectTrip(trip)}>
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-8">
                                            <div className="bg-seguranca-black p-4 rounded-2xl shadow-inner border border-seguranca-graphite group-hover:bg-seguranca-yellow group-hover:text-seguranca-black transition-colors duration-300">
                                                <MapPin size={28} className="text-inherit" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-black">{format(new Date(trip.departureTime), 'HH:mm', { locale: ptBR })}</div>
                                                <div className="text-xs text-seguranca-lightgray font-bold uppercase tracking-widest">{trip.tripCode}</div>
                                            </div>
                                            <div className="hidden md:flex flex-col gap-1 border-l-2 border-seguranca-black pl-8">
                                                <div className="text-[10px] uppercase font-bold text-seguranca-lightgray">Tipo / Veículo</div>
                                                <div className="text-sm font-bold text-white">{trip.seatTemplate.vehicleType}</div>
                                            </div>
                                            <div className="hidden md:flex flex-col gap-1 border-l-2 border-seguranca-black pl-8">
                                                <div className="text-[10px] uppercase font-bold text-seguranca-lightgray">Status</div>
                                                <Badge className="bg-green-600/20 text-green-500 border border-green-600/50 text-[9px] h-5 tracking-tighter uppercase px-3">{trip.status}</Badge>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-3">
                                            <div className="text-2xl font-black text-seguranca-yellow">R$ {trip.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                            <Button size="sm" className="bg-seguranca-black hover:bg-seguranca-yellow hover:text-seguranca-black text-seguranca-yellow font-bold px-6">Selecionar</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {step >= 2 && step <= 3 && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                        {/* Central Area: Booking Flow */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card className="bg-seguranca-graphite border-seguranca-graphite shadow-2xl overflow-hidden border-2">
                                <CardHeader className="bg-seguranca-black/50 border-b-2 border-seguranca-graphite py-4">
                                    <div className="flex items-center justify-between">
                                        <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-seguranca-lightgray hover:text-white uppercase font-bold text-[10px]">
                                            ← Voltar
                                        </Button>
                                        <CardTitle className="text-seguranca-yellow flex items-center gap-3 text-lg font-black uppercase tracking-wider">
                                            {step === 2 ? <><Armchair size={22} /> Escolha sua Poltrona</> : <><User size={22} /> Dados do Passageiro</>}
                                        </CardTitle>
                                        <div className="text-xs bg-seguranca-black px-4 py-1.5 rounded-full text-seguranca-lightgray font-bold">
                                            PASSO {step} / 3
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10">
                                    {step === 2 ? (
                                        <div className="space-y-10">
                                            {renderSeatMap()}
                                            <div className="flex justify-center">
                                                <Button
                                                    disabled={!selectedSeat}
                                                    onClick={() => setStep(3)}
                                                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 px-16 h-12 font-black shadow-xl shadow-seguranca-yellow/20 uppercase tracking-widest disabled:opacity-20"
                                                >
                                                    Próximo Passo: Passageiro
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <Label className="uppercase text-[10px] font-black text-seguranca-lightgray tracking-widest">Nome Completo</Label>
                                                    <Input
                                                        placeholder="Como consta no documento"
                                                        value={passengerName}
                                                        onChange={e => setPassengerName(e.target.value.toUpperCase())}
                                                        className="h-12 bg-seguranca-black border-seguranca-black text-lg font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <Label className="uppercase text-[10px] font-black text-seguranca-lightgray tracking-widest">CPF / Identidade</Label>
                                                    <Input
                                                        placeholder="000.000.000-00"
                                                        value={passengerDoc}
                                                        onChange={e => setPassengerDoc(e.target.value)}
                                                        className="h-12 bg-seguranca-black border-seguranca-black text-lg font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-seguranca-black p-6 rounded-2xl flex items-center justify-between border-2 border-seguranca-graphite shadow-inner">
                                                <div className="flex items-center gap-6">
                                                    <div className="bg-seguranca-yellow/10 p-4 rounded-xl border border-seguranca-yellow/20">
                                                        <Armchair size={32} className="text-seguranca-yellow" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black text-seguranca-lightgray uppercase tracking-widest">Poltrona</div>
                                                        <div className="text-3xl font-black text-white">{selectedSeat}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-seguranca-lightgray uppercase tracking-widest leading-none mb-1">Total a pagar</div>
                                                    <div className="text-3xl font-black text-seguranca-yellow">R$ {selectedTrip?.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                                </div>
                                            </div>

                                            <div className="flex justify-center">
                                                <Button
                                                    onClick={reserve}
                                                    className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 w-full md:w-1/2 h-14 font-black shadow-2xl shadow-seguranca-yellow/20 uppercase tracking-widest text-lg"
                                                >
                                                    <CheckCircle2 size={24} className="mr-3" /> Finalizar Reserva
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar Manifest */}
                        <div className="lg:col-span-1">
                            {renderManifest()}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="flex flex-col items-center justify-center p-20 text-center animate-in zoom-in duration-500 bg-seguranca-graphite/30 rounded-[3rem] border-2 border-dashed border-seguranca-graphite">
                        <div className="bg-green-500 p-8 rounded-full text-seguranca-black mb-8 shadow-2xl shadow-green-500/40 animate-bounce">
                            <CheckCircle2 size={80} />
                        </div>
                        <h2 className="text-5xl font-black mb-4 uppercase tracking-tighter">Reserva Sucesso!</h2>
                        <p className="text-seguranca-lightgray max-w-lg mb-12 text-lg font-medium">
                            A poltrona <span className="text-seguranca-yellow font-black text-xl">{tripTickets[0]?.seatNumber || selectedSeat}</span> do passageiro <span className="text-white font-bold">{passengerName}</span> foi bloqueada por 10 minutos para pagamento.
                        </p>
                        <div className="flex gap-4">
                            <Button
                                className="bg-seguranca-yellow text-seguranca-black hover:bg-yellow-500 font-black uppercase tracking-widest px-10 h-14"
                                onClick={async () => {
                                    if (selectedTrip) await loadManifest(selectedTrip.id);
                                    setStep(2);
                                }}
                            >
                                Nova Venda nesta Viagem
                            </Button>
                            <Button
                                variant="outline"
                                className="border-seguranca-graphite text-seguranca-lightgray hover:bg-seguranca-black h-14 font-black uppercase"
                                onClick={() => window.location.reload()}
                            >
                                Voltar para Início
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </StandardLayout>
    );
};

export default TripBooking;

// Helper Badge component since it might not be exported from ui/badge correctly or used differently
const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${className}`}>
        {children}
    </span>
);
