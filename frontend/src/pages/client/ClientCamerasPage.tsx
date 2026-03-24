import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/layouts/ClientLayout';
import { clientAreaService, ClientSnapshot } from '@/services/clientAreaService';
import {
    Camera,
    Wifi,
    WifiOff,
    Battery,
    MapPin,
    RefreshCw,
    Loader2,
    Maximize2
} from 'lucide-react';

export const ClientCamerasPage: React.FC = () => {
    const [snapshot, setSnapshot] = useState<ClientSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    useEffect(() => {
        loadSnapshot();
    }, []);

    const loadSnapshot = async () => {
        try {
            setLoading(true);
            const data = await clientAreaService.getCameraSnapshot('default');
            setSnapshot(data);
        } catch (err) {
            console.error('Failed to load snapshot', err);
        } finally {
            setLoading(false);
        }
    };

    const refreshSnapshot = async () => {
        setRefreshing(true);
        try {
            const data = await clientAreaService.getCameraSnapshot('default');
            setSnapshot(data);
        } catch (err) {
            console.error('Failed to refresh snapshot', err);
        } finally {
            setRefreshing(false);
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
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Camera className="w-5 h-5 text-emerald-400" />
                        Câmeras
                    </h1>
                    <button
                        onClick={refreshSnapshot}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>

                {snapshot && (
                    <div className="space-y-4">
                        {/* Snapshot Card */}
                        <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
                            {/* Camera Header */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${snapshot.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-sm font-medium">{snapshot.cameraLabel}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-400">
                                    {snapshot.status === 'ONLINE' ? (
                                        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                        <WifiOff className="w-3.5 h-3.5 text-red-400" />
                                    )}
                                    <div className="flex items-center gap-1">
                                        <Battery className="w-3.5 h-3.5" />
                                        <span>{snapshot.batteryLevel}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Image Snapshot */}
                            <div className="relative aspect-video bg-slate-950">
                                <img
                                    src={snapshot.imageUrl}
                                    alt={snapshot.cameraLabel}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iIzFhMWEyZSIvPjx0ZXh0IHg9IjMyMCIgeT0iMTgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjQ2NDgwIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+U2VtIEltYWdlbTwvdGV4dD48L3N2Zz4=';
                                    }}
                                />
                                {/* Overlay timestamp */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-[10px] text-white font-mono">
                                    {new Date(snapshot.timestamp).toLocaleString('pt-BR')}
                                </div>
                                <button
                                    onClick={() => setFullscreen(!fullscreen)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-lg hover:bg-black/90 transition-colors"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Info Footer */}
                            <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{snapshot.lastPosition}</span>
                                </div>
                                <span className="font-mono">{snapshot.vehiclePlate}</span>
                            </div>
                        </div>

                        {/* Info note */}
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3">
                            <p className="text-xs text-sky-300">
                                📸 Os snapshots são atualizados periodicamente. Clique em "Atualizar" para obter a imagem mais recente.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ClientLayout>
    );
};
