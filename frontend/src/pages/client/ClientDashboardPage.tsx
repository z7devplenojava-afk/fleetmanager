import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { clientAreaService, ClientRoute, ClientTimelineEvent } from '@/services/clientAreaService';
import {
    Clock,
    MapPin,
    Users,
    Bus,
    CheckCircle,
    AlertTriangle,
    Info,
    Loader2,
    ChevronRight,
    Navigation,
    PlayCircle,
    UserPlus
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
    person_add: UserPlus,
    play_circle: PlayCircle,
    check_circle: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    navigation: Navigation,
};

const statusColorMap: Record<string, string> = {
    SUCCESS: 'text-emerald-400 bg-emerald-500/10',
    WARNING: 'text-amber-400 bg-amber-500/10',
    DANGER: 'text-red-400 bg-red-500/10',
    INFO: 'text-sky-400 bg-sky-500/10',
};

const routeStatusMap: Record<string, { label: string; color: string }> = {
    ACTIVE: { label: 'Em Rota', color: 'bg-emerald-500' },
    SCHEDULED: { label: 'Agendada', color: 'bg-sky-500' },
    COMPLETED: { label: 'Finalizada', color: 'bg-slate-500' },
    DELAYED: { label: 'Atrasada', color: 'bg-red-500' },
};

export const ClientDashboardPage: React.FC = () => {
    const [routes, setRoutes] = useState<ClientRoute[]>([]);
    const [timeline, setTimeline] = useState<ClientTimelineEvent[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<ClientRoute | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const routesData = await clientAreaService.getActiveRoutes();
            setRoutes(routesData);
            if (routesData.length > 0) {
                setSelectedRoute(routesData[0]);
                const timelineData = await clientAreaService.getRouteTimeline(routesData[0].id);
                setTimeline(timelineData);
            }
        } catch (err) {
            console.error('Failed to load client area data', err);
        } finally {
            setLoading(false);
        }
    };

    const selectRoute = async (route: ClientRoute) => {
        setSelectedRoute(route);
        try {
            const timelineData = await clientAreaService.getRouteTimeline(route.id);
            setTimeline(timelineData);
        } catch (err) {
            console.error('Failed to load timeline', err);
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
            <div className="px-4 py-5 space-y-5">
                {/* Greeting */}
                <div>
                    <p className="text-slate-400 text-sm">Boa noite 👋</p>
                    <h1 className="text-xl font-bold">Suas Rotas</h1>
                </div>

                {/* Route Cards — Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    {routes.map((route) => {
                        const st = routeStatusMap[route.status] || routeStatusMap.ACTIVE;
                        const isSelected = selectedRoute?.id === route.id;
                        return (
                            <button
                                key={route.id}
                                onClick={() => selectRoute(route)}
                                className={`flex-shrink-0 w-64 rounded-2xl p-4 text-left transition-all duration-200 border ${isSelected
                                        ? 'bg-slate-800 border-emerald-500/50 ring-1 ring-emerald-500/30'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full text-white ${st.color}`}>
                                        {st.label}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                </div>
                                <p className="font-semibold text-sm mb-1 truncate">{route.name}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                    <Bus className="w-3.5 h-3.5" />
                                    <span>{route.vehiclePlate}</span>
                                    <span className="mx-1">•</span>
                                    <span>{route.driverName}</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${route.progress}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        <span>{route.passengersOnBoard}/{route.totalSeats}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate max-w-[100px]">{route.currentLocation}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Timeline Feed */}
                <div>
                    <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" />
                        Atividade Recente
                    </h2>

                    {timeline.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <Info className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Nenhum evento registrado ainda.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-0">
                            {/* Vertical line */}
                            <div className="absolute left-5 top-3 bottom-3 w-px bg-slate-800" />
                            {timeline.map((event, index) => {
                                const IconComponent = iconMap[event.icon] || Info;
                                const statusColor = statusColorMap[event.status] || statusColorMap.INFO;
                                return (
                                    <div key={event.id} className="relative flex gap-4 py-3">
                                        {/* Dot */}
                                        <div className={`z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColor}`}>
                                            <IconComponent className="w-4.5 h-4.5" />
                                        </div>
                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">{event.title}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{event.description}</p>
                                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-600">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                {event.vehiclePlate && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{event.vehiclePlate}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
};
