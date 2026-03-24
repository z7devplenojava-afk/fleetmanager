import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bus, Users, MapPin, Activity, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StandardLayout } from '@/components/StandardLayout';
import { PlanningTab } from '@/components/fretamento/PlanningTab';
import ScheduleCalendarTab from '@/components/fretamento/ScheduleCalendarTab';
import { HistoryTab } from '@/components/fretamento/HistoryTab';
import { trafficDashboardService, type TrafficDashboardStats } from '@/services/trafficDashboardService';
import { useToast } from '@/hooks/use-toast';

const TrafficManagementDashboard: React.FC = () => {
    const { toast } = useToast();
    const [stats, setStats] = useState<TrafficDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const data = await trafficDashboardService.getStats();
            setStats(data);
            setLastSync(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Erro ao carregar estatísticas de tráfego:', error);
            if (!silent) {
                toast({
                    title: 'Erro',
                    description: 'Não foi possível carregar as estatísticas do dashboard.',
                    variant: 'destructive',
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [toast]);

    // Carregar na montagem
    useEffect(() => {
        loadStats();
    }, [loadStats]);

    // Auto-refresh a cada 60 segundos
    useEffect(() => {
        const interval = setInterval(() => {
            loadStats(true);
        }, 60000);
        return () => clearInterval(interval);
    }, [loadStats]);

    const handleRefresh = () => {
        loadStats(true);
    };

    const formatOccupancy = (rate: number) => {
        if (rate === 0) return '0%';
        return `${rate}%`;
    };

    const getOccupancyColor = (rate: number) => {
        if (rate >= 80) return 'text-green-500';
        if (rate >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getOccupancyBg = (rate: number) => {
        if (rate >= 80) return 'bg-green-500/20';
        if (rate >= 50) return 'bg-yellow-500/20';
        return 'bg-red-500/20';
    };

    const getOccupancyIcon = (rate: number) => {
        if (rate >= 80) return <CheckCircle2 className="text-green-500" />;
        if (rate >= 50) return <CheckCircle2 className="text-yellow-500" />;
        return <AlertCircle className="text-red-500" />;
    };

    return (
        <StandardLayout title="Gestão de Tráfego" subtitle="Acompanhamento em tempo real de viagens e embarques">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="text-seguranca-yellow border-seguranca-yellow">
                            Sincronizado: {lastSync}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="text-gray-400 hover:text-white"
                        >
                            {refreshing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <RefreshCw className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Card: Viagens Ativas */}
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-400">Viagens Ativas</p>
                                    {loading ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                        </div>
                                    ) : (
                                        <h3 className="text-3xl font-bold text-white">
                                            {stats?.activeTrips ?? 0}
                                        </h3>
                                    )}
                                    {!loading && stats && stats.routesInProgressNow > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {stats.routesInProgressNow} rota{stats.routesInProgressNow > 1 ? 's' : ''} em execução
                                        </p>
                                    )}
                                </div>
                                <div className="bg-seguranca-red/20 p-2 rounded-lg">
                                    <Bus className="text-seguranca-red" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Embarques Hoje */}
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-400">Embarques Hoje</p>
                                    {loading ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                        </div>
                                    ) : (
                                        <h3 className="text-3xl font-bold text-white">
                                            {stats?.boardingsToday ?? 0}
                                        </h3>
                                    )}
                                    {!loading && stats && stats.driversOnShiftToday > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {stats.driversOnShiftToday} motorista{stats.driversOnShiftToday > 1 ? 's' : ''} em turno
                                        </p>
                                    )}
                                </div>
                                <div className="bg-seguranca-yellow/20 p-2 rounded-lg">
                                    <Users className="text-seguranca-yellow" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Alertas Geofence */}
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-400">Alertas Geofence</p>
                                    {loading ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                        </div>
                                    ) : (
                                        <h3 className={`text-3xl font-bold ${(stats?.geofenceAlerts ?? 0) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {stats?.geofenceAlerts ?? 0}
                                        </h3>
                                    )}
                                    {!loading && stats && stats.geofenceAlerts === 0 && (
                                        <p className="text-xs text-green-500 mt-1">
                                            Sem alertas
                                        </p>
                                    )}
                                </div>
                                <div className={`p-2 rounded-lg ${(stats?.geofenceAlerts ?? 0) > 0 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                                    {(stats?.geofenceAlerts ?? 0) > 0 ? (
                                        <AlertCircle className="text-red-500" />
                                    ) : (
                                        <CheckCircle2 className="text-green-500" />
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Card: Taxa de Ocupação */}
                    <Card className="bg-seguranca-graphite border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-400">Taxa de Ocupação</p>
                                    {loading ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                                        </div>
                                    ) : (
                                        <h3 className={`text-3xl font-bold ${getOccupancyColor(stats?.occupancyRate ?? 0)}`}>
                                            {formatOccupancy(stats?.occupancyRate ?? 0)}
                                        </h3>
                                    )}
                                    {!loading && stats && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {stats.completedRoutesToday} rota{stats.completedRoutesToday !== 1 ? 's' : ''} concluída{stats.completedRoutesToday !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                <div className={`p-2 rounded-lg ${getOccupancyBg(stats?.occupancyRate ?? 0)}`}>
                                    {getOccupancyIcon(stats?.occupancyRate ?? 0)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="monitoring" className="w-full">
                    <TabsList className="bg-seguranca-graphite border-gray-700">
                        <TabsTrigger value="monitoring" className="data-[state=active]:bg-seguranca-red">
                            Monitoramento em Tempo Real
                        </TabsTrigger>
                        <TabsTrigger value="planning" className="data-[state=active]:bg-seguranca-red">
                            Planejamento / Escalas
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="data-[state=active]:bg-seguranca-red">
                            Calendário de Escalas
                        </TabsTrigger>
                        <TabsTrigger value="history" className="data-[state=active]:bg-seguranca-red">
                            Histórico / Eventos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="monitoring" className="mt-6">
                        <Card className="bg-seguranca-graphite border-gray-700 min-h-[400px]">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Activity size={20} className="text-seguranca-yellow" /> Status da Operação
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Resumo rápido com dados reais */}
                                    {stats && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="p-4 bg-seguranca-black/40 rounded-lg border border-gray-800">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Viagens Cadastradas</p>
                                                <p className="text-2xl font-bold text-white mt-1">{stats.totalActiveTravelTrips}</p>
                                                <p className="text-xs text-gray-500 mt-1">viagens ativas no sistema</p>
                                            </div>
                                            <div className="p-4 bg-seguranca-black/40 rounded-lg border border-gray-800">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Escalas do Dia</p>
                                                <p className="text-2xl font-bold text-white mt-1">{stats.totalSchedulesToday}</p>
                                                <p className="text-xs text-gray-500 mt-1">escalas agendadas para hoje</p>
                                            </div>
                                            <div className="p-4 bg-seguranca-black/40 rounded-lg border border-gray-800">
                                                <p className="text-xs text-gray-500 uppercase tracking-wider">Motoristas Disponíveis</p>
                                                <p className="text-2xl font-bold text-seguranca-yellow mt-1">
                                                    {stats.driversAvailableForReallocation}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">para realocação</p>
                                            </div>
                                        </div>
                                    )}

                                    {!stats && !loading && (
                                        <div className="text-center py-8 text-gray-500">
                                            <Activity size={48} className="mx-auto mb-4 opacity-50" />
                                            <p>Nenhum dado de operação disponível no momento.</p>
                                            <Button variant="outline" onClick={handleRefresh} className="mt-4">
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Tentar Novamente
                                            </Button>
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="text-center py-8">
                                            <Loader2 size={48} className="mx-auto mb-4 animate-spin text-seguranca-yellow" />
                                            <p className="text-gray-500">Carregando dados da operação...</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="planning" className="mt-6">
                        <PlanningTab />
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-6">
                        <ScheduleCalendarTab />
                    </TabsContent>

                    <TabsContent value="history" className="mt-6">
                        <HistoryTab />
                    </TabsContent>
                </Tabs>
            </div>
        </StandardLayout>
    );
};

export default TrafficManagementDashboard;
