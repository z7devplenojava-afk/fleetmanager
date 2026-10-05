import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Bus, 
    Clock, 
    User, 
    MapPin, 
    Gauge, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    QrCode, 
    X,
    TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface TripDetailData {
    id: string;
    lineName: string;
    lineColor: string;
    route: string;
    origin: string;
    destination: string;
    time: string;
    departureTime?: string;
    arrivalTime?: string;
    vehicleType: string;
    vehiclePlate: string;
    driverName: string;
    driverAvatar?: string;
    passengersExpected: number;
    passengersRealized: number;
    kmStart: number;
    kmEnd: number;
    status: 'EM_ANDAMENTO' | 'PROGRAMADO' | 'CONCLUIDO';
    garageName?: string;
}

interface TripDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trip: TripDetailData | null;
    onSaveKm?: (tripId: string, kmStart: number, kmEnd: number) => void;
    onOpenQrCode?: (trip: TripDetailData) => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
    isOpen,
    onClose,
    trip,
    onSaveKm,
    onOpenQrCode
}) => {
    const { toast } = useToast();
    const [kmStart, setKmStart] = useState<number>(trip?.kmStart || 0);
    const [kmEnd, setKmEnd] = useState<number>(trip?.kmEnd || 0);

    React.useEffect(() => {
        if (trip) {
            setKmStart(trip.kmStart || 0);
            setKmEnd(trip.kmEnd || 0);
        }
    }, [trip]);

    if (!trip) return null;

    const kmTotal = Math.max(0, kmEnd - kmStart);
    const occupancyPercentage = trip.passengersExpected > 0
        ? Math.round((trip.passengersRealized / trip.passengersExpected) * 100)
        : 0;

    const handleSave = () => {
        if (onSaveKm) {
            onSaveKm(trip.id, kmStart, kmEnd);
        }
        toast({
            title: 'KM Atualizado',
            description: `Quilometragem da viagem ${trip.lineName} salva com sucesso (${kmTotal} km rodados).`,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-[#0f172a] text-slate-100 border border-slate-700/60 p-0 rounded-2xl shadow-2xl overflow-hidden">
                <DialogHeader className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/60 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                            <Bus className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                                Detalhes da Viagem
                            </DialogTitle>
                            <p className="text-xs text-slate-400">
                                {trip.garageName ? `Garagem: ${trip.garageName}` : 'Gestão Integrada de Tráfego & Operação'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`px-3 py-1 font-bold text-xs rounded-full border ${
                            trip.status === 'EM_ANDAMENTO'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                                : trip.status === 'CONCLUIDO'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                            <span className="w-2 h-2 rounded-full mr-1.5 inline-block bg-current" />
                            {trip.status === 'EM_ANDAMENTO' ? 'Em andamento' : trip.status === 'CONCLUIDO' ? 'Concluído' : 'Programado'}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Linha, Horário, Veículo, Motorista */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Linha</span>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold text-white" style={{ backgroundColor: trip.lineColor || '#2563eb' }}>
                                <span>{trip.lineName}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Horário</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
                                <Clock className="h-4 w-4 text-blue-400" />
                                <span>{trip.time}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Veículo / Placa</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
                                <Bus className="h-4 w-4 text-amber-400" />
                                <span>{trip.vehiclePlate}</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Motorista</span>
                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200 truncate">
                                <User className="h-4 w-4 text-emerald-400" />
                                <span className="truncate">{trip.driverName}</span>
                            </div>
                        </div>
                    </div>

                    {/* Passageiros e Ocupação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <TrendingUp className="h-4 w-4 text-emerald-400" /> Passageiros
                                </div>
                                <div className="flex items-baseline gap-4 mt-2">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block">Previstos</span>
                                        <span className="text-2xl font-black text-slate-300">{trip.passengersExpected}</span>
                                    </div>
                                    <div className="text-slate-600 text-xl font-light">/</div>
                                    <div>
                                        <span className="text-[11px] text-emerald-400 font-bold block">Realizados</span>
                                        <span className="text-2xl font-black text-emerald-400">{trip.passengersRealized}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Gráfico circular simples de ocupação */}
                            <div className="relative flex items-center justify-center w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-slate-700"
                                        strokeWidth="3.5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="text-emerald-500"
                                        strokeDasharray={`${occupancyPercentage}, 100`}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="absolute text-xs font-black text-white">{occupancyPercentage}%</span>
                            </div>
                        </div>

                        {/* Trajeto */}
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/60">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-blue-400" /> Trajeto da Rota
                            </div>
                            <div className="space-y-2 mt-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Origem:</span>
                                    <span className="font-bold text-slate-200">{trip.origin || trip.route}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Destino:</span>
                                    <span className="font-bold text-slate-200">{trip.destination || 'Centro - BH/MG'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Horário Previsto:</span>
                                    <span className="font-bold text-blue-400">{trip.departureTime || trip.time} ➔ {trip.arrivalTime || '06:40'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Controle de Quilometragem (KM Inicial, KM Final, Total) */}
                    <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/60 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <Gauge className="h-4 w-4 text-amber-400" /> Controle de Odômetro (KM)
                            </div>
                            <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-400 font-mono">
                                Total: {kmTotal} KM
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">KM Inicial</label>
                                <Input
                                    type="number"
                                    value={kmStart}
                                    onChange={(e) => setKmStart(Number(e.target.value))}
                                    className="bg-slate-900 border-slate-700 text-white font-mono font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">KM Final</label>
                                <Input
                                    type="number"
                                    value={kmEnd}
                                    onChange={(e) => setKmEnd(Number(e.target.value))}
                                    className="bg-slate-900 border-slate-700 text-white font-mono font-bold"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-slate-400 block mb-1">KM Total Rodado</label>
                                <div className="h-10 rounded-md bg-slate-900/80 border border-slate-700 px-3 flex items-center font-mono font-black text-amber-400 text-base">
                                    {kmTotal} km
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    {onOpenQrCode && (
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenQrCode(trip)}
                            className="border-slate-700 text-slate-200 hover:bg-slate-800 gap-2 text-xs font-bold"
                        >
                            <QrCode className="h-4 w-4 text-blue-400" /> Exibir QR Code de Embarque
                        </Button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            Fechar
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold gap-1.5 shadow-lg shadow-blue-600/20"
                        >
                            <FileText className="h-4 w-4" /> Salvar / Visualizar Relatório
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TripDetailsModal;
