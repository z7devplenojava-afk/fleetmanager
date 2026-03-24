'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import tripService, { TripEventDTO } from '@/services/tripService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
    Play,
    Square,
    Pause,
    RefreshCcw,
    UserCheck,
    UserX,
    Navigation,
    AlertTriangle,
    Clock,
    UserCircle,
    Truck,
    Info,
    Search,
    RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const HistoryTab: React.FC = () => {
    const { data: events = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['trip-events'],
        queryFn: tripService.getEvents
    });

    const getEventConfig = (type: string) => {
        switch (type) {
            case 'TRIP_START':
                return { label: 'Início de Viagem', color: 'bg-green-500', icon: <Play size={14} className="text-white" /> };
            case 'TRIP_END':
                return { label: 'Fim de Viagem', color: 'bg-gray-500', icon: <Square size={14} className="text-white" /> };
            case 'TRIP_PAUSE':
                return { label: 'Pausa', color: 'bg-yellow-500', icon: <Pause size={14} className="text-white" /> };
            case 'TRIP_RESUME':
                return { label: 'Retomada', color: 'bg-blue-500', icon: <RefreshCcw size={14} className="text-white" /> };
            case 'BOARDING':
                return { label: 'Embarque', color: 'bg-seguranca-yellow', icon: <UserCheck size={14} className="text-black" /> };
            case 'BOARDING_DENIED_GEOFENCE':
                return { label: 'Embarque Bloqueado (Geofence)', color: 'bg-red-500', icon: <UserX size={14} className="text-white" /> };
            case 'DEVIATION':
                return { label: 'Desvio de Rota', color: 'bg-orange-500', icon: <Navigation size={14} className="text-white" /> };
            case 'BREAKDOWN':
                return { label: 'Pane / Quebra', color: 'bg-red-600', icon: <AlertTriangle size={14} className="text-white" /> };
            case 'TRAFFIC_JAM':
                return { label: 'Trânsito Intenso', color: 'bg-orange-600', icon: <Clock size={14} className="text-white" /> };
            case 'DRIVER_SWAP':
                return { label: 'Troca de Motorista', color: 'bg-purple-500', icon: <UserCircle size={14} className="text-white" /> };
            case 'VEHICLE_SWAP':
                return { label: 'Troca de Veículo', color: 'bg-indigo-500', icon: <Truck size={14} className="text-white" /> };
            case 'OPERATIONAL_PAUSE':
                return { label: 'Pausa Operacional', color: 'bg-stone-500', icon: <Info size={14} className="text-white" /> };
            default:
                return { label: type, color: 'bg-gray-400', icon: <Info size={14} className="text-white" /> };
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <Card className="bg-seguranca-graphite border-gray-700 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-lg">Histórico de Eventos</CardTitle>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Pesquisar eventos..."
                            className="bg-seguranca-black border border-gray-600 rounded-md pl-10 pr-4 py-1.5 text-xs text-white focus:border-seguranca-yellow outline-none"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-seguranca-black border-gray-600 text-gray-400"
                        onClick={() => refetch()}
                    >
                        <RefreshCw size={14} className={`mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="px-4 py-3 font-medium">Evento</th>
                                <th className="px-4 py-3 font-medium">Data / Hora</th>
                                <th className="px-4 py-3 font-medium">Rota</th>
                                <th className="px-4 py-3 font-medium">Motorista</th>
                                <th className="px-4 py-3 font-medium">Veículo</th>
                                <th className="px-4 py-3 font-medium">Observações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500 italic">
                                        Nenhum evento registrado até o momento.
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => {
                                    const config = getEventConfig(event.type);
                                    return (
                                        <tr key={event.id} className="hover:bg-seguranca-black/30 transition-colors text-sm">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg ${config.color} shadow-lg shadow-black/20`}>
                                                        {config.icon}
                                                    </div>
                                                    <span className="font-semibold text-gray-200">{config.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400">
                                                {format(new Date(event.timestamp), "dd/MM HH:mm", { locale: ptBR })}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-seguranca-lightgray border-gray-600">
                                                    {event.tripName}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">
                                                {event.driverName}
                                            </td>
                                            <td className="px-4 py-3 text-seguranca-yellow font-mono">
                                                {event.vehiclePlate}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 italic text-xs truncate max-w-[200px]">
                                                {event.observations || '-'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};
