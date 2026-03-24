import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { clientAreaService, ClientRoute } from '@/services/clientAreaService';
import {
    Bus,
    MapPin,
    Users,
    Clock,
    Loader2,
    Navigation,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const routeStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Em Rota', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    SCHEDULED: { label: 'Agendada', color: 'text-sky-400', bg: 'bg-sky-500/15' },
    COMPLETED: { label: 'Finalizada', color: 'text-slate-400', bg: 'bg-slate-500/15' },
    DELAYED: { label: 'Atrasada', color: 'text-red-400', bg: 'bg-red-500/15' },
};

export const ClientVehiclesPage: React.FC = () => {
    const [routes, setRoutes] = useState<ClientRoute[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadRoutes();
    }, []);

    const loadRoutes = async () => {
        try {
            setLoading(true);
            const data = await clientAreaService.getActiveRoutes();
            setRoutes(data);
        } catch (err) {
            console.error('Failed to load routes', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout>
                <div className="flex items-center justify-center h-[60vh]">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout>
            <div className="px-4 py-5 space-y-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Bus className="w-5 h-5 text-emerald-400" />
                    Veículos
                </h1>

                {routes.map((route) => {
                    const st = routeStatusMap[route.status] || routeStatusMap.ACTIVE;
                    const isExpanded = expandedId === route.id;
                    return (
                        <div
                            key={route.id}
                            className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden"
                        >
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : route.id)}
                                className="w-full px-4 py-4 text-left"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center`}>
                                            <Bus className={`w-5 h-5 ${st.color}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{route.vehiclePlate}</p>
                                            <p className="text-xs text-slate-400">{route.driverName}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>
                                            {st.label}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-slate-500" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mt-3 w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${route.progress}%` }}
                                    />
                                </div>
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="px-4 pb-4 pt-0 border-t border-slate-800 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-2 gap-3 pt-3">
                                        <div className="bg-slate-800/50 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                                                <Users className="w-3 h-3" />
                                                Passageiros
                                            </div>
                                            <p className="text-sm font-semibold">{route.passengersOnBoard}/{route.totalSeats}</p>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-xl p-3">
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                                                <MapPin className="w-3 h-3" />
                                                Localização
                                            </div>
                                            <p className="text-sm font-semibold truncate">{route.currentLocation}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
                                            <Navigation className="w-3 h-3" />
                                            Próximas Paradas
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {route.nextStops.map((stop, i) => (
                                                <span
                                                    key={i}
                                                    className="px-2 py-0.5 text-[10px] bg-slate-700 rounded-full text-slate-300"
                                                >
                                                    {stop}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Início: {new Date(route.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Previsão: {new Date(route.estimatedEndTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {routes.length === 0 && (
                    <div className="text-center py-16 text-slate-500">
                        <Bus className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Nenhum veículo ativo no momento.</p>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
};
