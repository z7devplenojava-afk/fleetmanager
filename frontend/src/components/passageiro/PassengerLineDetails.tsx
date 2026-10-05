import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Bus, 
    Clock, 
    MapPin, 
    ChevronRight, 
    ChevronLeft, 
    Navigation, 
    Info, 
    Calendar,
    Radio
} from 'lucide-react';

interface ArrivalItem {
    id: string;
    statusBadge: 'CHEGANDO' | 'EM_ROTA' | 'PROGRAMADO';
    etaText: string;
    busPlate: string;
    time: string;
    location: string;
}

const LIVE_ARRIVALS: ArrivalItem[] = [
    {
        id: '1',
        statusBadge: 'CHEGANDO',
        etaText: 'Aprox. 12 min',
        busPlate: 'SHZ-3A40',
        time: '08:20',
        location: 'Av. Amazonas, 1200'
    },
    {
        id: '2',
        statusBadge: 'EM_ROTA',
        etaText: 'Aprox. 18 min',
        busPlate: 'RUR-7A78',
        time: '11:00',
        location: 'Av. do Contorno, 3450'
    },
    {
        id: '3',
        statusBadge: 'PROGRAMADO',
        etaText: 'Aprox. 24 min',
        busPlate: 'SHZ-3A40',
        time: '12:30',
        location: 'Av. Raja Gabaglia, 2100'
    }
];

const SCHEDULE_TIMES = [
    { time: '05:15', status: 'Em operação', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { time: '06:40', status: 'Em operação', badgeColor: 'bg-emerald-500/20 text-emerald-400' },
    { time: '08:20', status: 'Chegando em 12 min', badgeColor: 'bg-pink-500/20 text-pink-400 animate-pulse' },
    { time: '11:00', status: 'Em rota', badgeColor: 'bg-blue-500/20 text-blue-400' },
    { time: '12:30', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '15:15', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '17:15', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '18:15', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '19:10', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '20:00', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
    { time: '21:45', status: 'Programado', badgeColor: 'bg-slate-700 text-slate-300' },
];

interface PassengerLineDetailsProps {
    lineName?: string;
    route?: string;
    color?: string;
    onBack?: () => void;
    onSelectTrip?: (arrival: ArrivalItem) => void;
}

export const PassengerLineDetails: React.FC<PassengerLineDetailsProps> = ({
    lineName = 'Serra Verde',
    route = 'Belo Horizonte ➔ Serra Verde',
    color = '#ec4899',
    onBack,
    onSelectTrip
}) => {
    const [activeTab, setActiveTab] = useState('horarios');
    const [dayType, setDayType] = useState('weekday'); // weekday | saturday | sunday

    return (
        <div className="space-y-4 max-w-md mx-auto pb-6">
            {/* Header com Botão Voltar & Identificação da Linha */}
            <div className="flex items-center gap-3">
                {onBack && (
                    <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={onBack} 
                        className="h-9 w-9 rounded-full text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                )}
                <h2 className="text-lg font-black text-white tracking-tight">Detalhes da Linha</h2>
            </div>

            {/* Card Principal da Linha (Imagem 2 - Tela 3) */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700/80 text-white p-5 rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: color }}>
                        <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">Linha Rosa</span>
                        <h3 className="text-xl font-black text-white">{lineName}</h3>
                        <p className="text-xs text-slate-400">{route}</p>
                    </div>
                </div>
            </Card>

            {/* Abas: Horários, Trajeto, Informações */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                    <TabsTrigger value="horarios" className="text-xs font-bold data-[state='active']:bg-pink-600 data-[state='active']:text-white">
                        Horários
                    </TabsTrigger>
                    <TabsTrigger value="trajeto" className="text-xs font-bold data-[state='active']:bg-pink-600 data-[state='active']:text-white">
                        Trajeto
                    </TabsTrigger>
                    <TabsTrigger value="info" className="text-xs font-bold data-[state='active']:bg-pink-600 data-[state='active']:text-white">
                        Informações
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="horarios" className="space-y-4 mt-4">
                    {/* Próximas Chegadas (Tempo Real) */}
                    <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-pink-400" /> Próximas Chegadas
                            </h4>
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border-emerald-500/30 flex items-center gap-1">
                                <Radio className="h-3 w-3 animate-pulse" /> Em tempo real
                            </Badge>
                        </div>

                        <div className="space-y-2.5">
                            {LIVE_ARRIVALS.map((arrival) => (
                                <Card 
                                    key={arrival.id} 
                                    onClick={() => onSelectTrip && onSelectTrip(arrival)}
                                    className="bg-slate-900/90 hover:bg-slate-850 border-slate-800 text-white p-3.5 rounded-xl cursor-pointer transition-all hover:border-slate-700"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-[10px] font-bold ${
                                                arrival.statusBadge === 'CHEGANDO' 
                                                    ? 'bg-emerald-500 text-white'
                                                    : arrival.statusBadge === 'EM_ROTA'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-purple-600 text-white'
                                            }`}>
                                                {arrival.statusBadge === 'CHEGANDO' ? 'Chegando' : arrival.statusBadge === 'EM_ROTA' ? 'Em rota' : 'Programado'}
                                            </Badge>
                                            <span className="text-xs font-bold text-slate-300">{arrival.etaText}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Ônibus</span>
                                            <span className="font-bold text-slate-200">{arrival.busPlate}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Horário</span>
                                            <span className="font-bold text-slate-200">{arrival.time}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500 block">Localização</span>
                                            <span className="font-bold text-slate-400 truncate block">{arrival.location}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Timeline de Horários da Linha (Imagem 2 - Tela 4) */}
                    <div className="pt-3">
                        <h4 className="text-sm font-bold text-white mb-3 px-1">Horários da Linha</h4>
                        
                        {/* Seletor Seg a Sex / Sábado / Domingo */}
                        <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 rounded-xl mb-4 border border-slate-800 text-xs font-bold">
                            <button
                                onClick={() => setDayType('weekday')}
                                className={`py-2 rounded-lg transition-all ${dayType === 'weekday' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Seg a Sex
                            </button>
                            <button
                                onClick={() => setDayType('saturday')}
                                className={`py-2 rounded-lg transition-all ${dayType === 'saturday' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Sábado
                            </button>
                            <button
                                onClick={() => setDayType('sunday')}
                                className={`py-2 rounded-lg transition-all ${dayType === 'sunday' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Domingo
                            </button>
                        </div>

                        {/* Lista de Horários */}
                        <div className="space-y-2">
                            {SCHEDULE_TIMES.map((item, idx) => (
                                <div 
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                                        <span className="font-mono font-bold text-sm text-slate-200">{item.time}</span>
                                    </div>
                                    <Badge className={`${item.badgeColor} text-[10px] font-bold border-none`}>
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="trajeto" className="space-y-3 mt-4 text-xs text-slate-300">
                    <Card className="bg-slate-900 border-slate-800 p-4 space-y-3">
                        <div className="font-bold text-white flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-pink-400" /> Paradas do Itinerário
                        </div>
                        <ol className="relative border-l border-slate-700 ml-2 space-y-4 mt-2">
                            <li className="ml-4">
                                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-slate-900 bg-pink-500" />
                                <h5 className="font-bold text-white">Centro - Av. Santos Dumont</h5>
                                <p className="text-[11px] text-slate-400">Ponto 01 &bull; Partida Principal</p>
                            </li>
                            <li className="ml-4">
                                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-slate-900 bg-pink-500" />
                                <h5 className="font-bold text-white">Av. Amazonas, 1200</h5>
                                <p className="text-[11px] text-slate-400">Ponto 02 &bull; Praça Raul Soares</p>
                            </li>
                            <li className="ml-4">
                                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-slate-900 bg-pink-500" />
                                <h5 className="font-bold text-white">Av. Cristiano Machado, 1200</h5>
                                <p className="text-[11px] text-slate-400">Ponto 03 &bull; Estação São Gabriel</p>
                            </li>
                            <li className="ml-4">
                                <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-slate-900 bg-pink-500" />
                                <h5 className="font-bold text-white">Terminal Serra Verde</h5>
                                <p className="text-[11px] text-slate-400">Ponto Final</p>
                            </li>
                        </ol>
                    </Card>
                </TabsContent>

                <TabsContent value="info" className="space-y-3 mt-4 text-xs text-slate-300">
                    <Card className="bg-slate-900 border-slate-800 p-4 space-y-3">
                        <h4 className="font-bold text-white flex items-center gap-2">
                            <Info className="h-4 w-4 text-blue-400" /> Informações da Operação
                        </h4>
                        <p className="text-slate-400 leading-relaxed">
                            Linha operada pela <strong>Viação São Silvestre</strong> com veículos micro-ônibus e ônibus executivos equipados com ar-condicionado, Wi-Fi e rastreamento GPS em tempo real.
                        </p>
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                            Central de Atendimento ao Passageiro: <strong>0800 700 8090</strong>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PassengerLineDetails;
