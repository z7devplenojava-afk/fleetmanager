import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { clientAreaService, ClientRoute } from '@/services/clientAreaService';
import {
    MapPin,
    Bus,
    Loader2,
    Navigation2
} from 'lucide-react';

export const ClientMapPage: React.FC = () => {
    const [routes, setRoutes] = useState<ClientRoute[]>([]);
    const [loading, setLoading] = useState(true);

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
            <div className="flex flex-col h-[calc(100vh-7.5rem)]">
                {/* Simplified Map Placeholder */}
                <div className="flex-1 bg-slate-900 relative overflow-hidden">
                    {/* Map background texture */}
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '40px 40px'
                        }}
                    />

                    {/* Vehicle markers (simulated) */}
                    {routes.map((route, idx) => (
                        <div
                            key={route.id}
                            className="absolute"
                            style={{
                                top: `${30 + idx * 25}%`,
                                left: `${20 + idx * 30}%`,
                            }}
                        >
                            <div className="relative group">
                                {/* Pulse ring */}
                                {route.status === 'ACTIVE' && (
                                    <div className="absolute inset-0 w-12 h-12 -m-2 bg-emerald-500/20 rounded-full animate-ping" />
                                )}
                                {/* Marker */}
                                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${route.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-sky-500'
                                    }`}>
                                    <Bus className="w-4 h-4 text-white" />
                                </div>
                                {/* Label */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap border border-slate-700">
                                    {route.vehiclePlate}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Center compass */}
                    <div className="absolute bottom-4 right-4 w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                        <Navigation2 className="w-5 h-5 text-emerald-400" />
                    </div>

                    {/* Map info overlay */}
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-700">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Veículos ativos</p>
                        <p className="text-lg font-bold text-emerald-400">{routes.filter(r => r.status === 'ACTIVE').length}</p>
                    </div>
                </div>

                {/* Bottom Sheet — Route list */}
                <div className="bg-slate-950 border-t border-slate-800 px-4 py-3">
                    <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {routes.map((route) => (
                            <div key={route.id} className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${route.status === 'ACTIVE' ? 'bg-emerald-500/15' : 'bg-sky-500/15'
                                    }`}>
                                    <Bus className={`w-4 h-4 ${route.status === 'ACTIVE' ? 'text-emerald-400' : 'text-sky-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium truncate">{route.name}</p>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <MapPin className="w-2.5 h-2.5" />
                                        {route.currentLocation}
                                    </p>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">{route.vehiclePlate}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
};
