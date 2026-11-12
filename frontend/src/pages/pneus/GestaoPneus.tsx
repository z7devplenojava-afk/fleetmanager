import React, { useState, useEffect, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Database,
    Plus,
    RefreshCw,
    Layers,
    Activity,
    Package,
    Bus,
    Wrench,
    AlertTriangle,
    FileText,
    ShieldAlert,
    Sliders,
    Repeat,
    Gauge,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import tireService, { Tire } from '@/services/tireService';
import fleetService from '@/services/fleetService';
import { TiresTable } from '@/components/pneus/TiresTable';
import { TireFormModal } from '@/components/pneus/TireFormModal';
import { TireMovementModal, TireMovementInitialSlot } from '@/components/pneus/TireMovementModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BusTireMapper } from '@/components/pneus/BusTireMapper';
import { TireExchangeControlTab } from '@/components/pneus/TireExchangeControlTab';
import { TireExceptionsReportTab } from '@/components/pneus/TireExceptionsReportTab';
import { TireLifecycleConfigTab } from '@/components/pneus/TireLifecycleConfigTab';
import { TireShopServicesTab } from '@/components/pneus/TireShopServicesTab';
import { StockNfeImportModal } from '@/components/stock/StockNfeImportModal';
import { computeTireLiveMetrics, DEFAULT_TIRE_LIFECYCLE_CONFIG } from '@/utils/tireLifecycle';

type ViewTab = 'map' | 'table' | 'exchange' | 'tireshop' | 'exceptions' | 'config';

const GestaoPneus: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [isNfeOpen, setIsNfeOpen] = useState(false);
    const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
    const [initialSlot, setInitialSlot] = useState<TireMovementInitialSlot | null>(null);
    const [initialAction, setInitialAction] = useState<'MOUNT' | 'DISMOUNT' | 'RECAP_SEND' | 'RECAP_RETURN' | 'SCRAP' | 'HISTORY' | undefined>(undefined);
    const [viewMode, setViewMode] = useState<ViewTab>('map');

    const queryClient = useQueryClient();

    const { data: tires = [], isLoading: loadingTires } = useQuery({
        queryKey: ['tires'],
        queryFn: tireService.findAll,
        staleTime: 30_000,
    });

    const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: () => fleetService.getVehicles(false),
        staleTime: 60_000,
    });

    const { data: lifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG } = useQuery({
        queryKey: ['tire-lifecycle-config'],
        queryFn: tireService.getLifecycleConfig,
        staleTime: 60_000,
    });

    const { data: exceptions = [] } = useQuery({
        queryKey: ['tire-exceptions'],
        queryFn: () => tireService.getFrontAxleExceptions(false),
        staleTime: 30_000,
    });

    const { data: movements = [] } = useQuery({
        queryKey: ['tire-movements'],
        queryFn: tireService.getAllMovements,
        staleTime: 30_000,
    });

    const refreshAll = () => {
        fleetService.invalidateVehiclesCache();
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['tires'] });
        queryClient.invalidateQueries({ queryKey: ['tire-movements'] });
        queryClient.invalidateQueries({ queryKey: ['tire-exceptions'] });
        queryClient.invalidateQueries({ queryKey: ['tire-lifecycle-config'] });
        queryClient.invalidateQueries({ queryKey: ['tire-shop-services'] });
    };

    useEffect(() => {
        const onStockChanged = () => refreshAll();
        window.addEventListener('stock-data-changed', onStockChanged);
        return () => window.removeEventListener('stock-data-changed', onStockChanged);
    }, []);

    const handleSuccess = () => {
        setIsFormOpen(false);
        setIsMovementOpen(false);
        setSelectedTire(null);
        setInitialSlot(null);
        setInitialAction(undefined);
        refreshAll();
    };

    const stats = useMemo(() => {
        let available = 0;
        let inUse = 0;
        let recap = 0;
        let scrapped = 0;
        let criticalAlerts = 0;
        let totalFleetKm = 0;

        tires.forEach((t) => {
            if (t.status === 'AVAILABLE') available++;
            if (t.status === 'IN_USE') inUse++;
            if (t.status === 'RECAP') recap++;
            if (t.status === 'SCRAPPED') scrapped++;

            const m = computeTireLiveMetrics(t, lifecycleConfig);
            totalFleetKm += m.totalCarcassKm;
            if (m.treadAlert || m.dotInfo.expired || m.kmThresholdReached) {
                criticalAlerts++;
            }
        });

        const activeExceptions = exceptions.filter((e) => e.active).length;

        return {
            available,
            inUse,
            recap,
            scrapped,
            criticalAlerts,
            activeExceptions,
            totalFleetKm,
        };
    }, [tires, lifecycleConfig, exceptions]);

    const availableTires = useMemo(
        () => tires.filter((t) => t.status === 'AVAILABLE'),
        [tires]
    );

    if (loadingTires || loadingVehicles) return <LoadingSpinner />;

    return (
        <StandardLayout
            title="Gestão de Pneus"
            subtitle="Controle de estoque sincronizado, importação de NF-e, ciclos de recapagem, segurança do eixo dianteiro e rastreabilidade"
        >
            <div className="space-y-5">
                {/* Header Action Bar & KPI Strip */}
                <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 flex-1">
                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Package size={13} className="text-green-400" />
                                    Em Estoque
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-green-400">{stats.available}</div>
                                <span className="text-[10px] text-gray-400">Almoxarifado</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Bus size={13} className="text-blue-400" />
                                    Em Uso (Frota)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-blue-400">{stats.inUse}</div>
                                <span className="text-[10px] text-gray-400">Nos Veículos</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Wrench size={13} className="text-yellow-400" />
                                    Em Recapagem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-yellow-400">{stats.recap}</div>
                                <span className="text-[10px] text-gray-400">Na Reforma</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle size={13} className="text-amber-400" />
                                    Alertas TWI/DOT/KM
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-amber-400">{stats.criticalAlerts}</div>
                                <span className="text-[10px] text-gray-400">Inspeção/Troca</span>
                            </CardContent>
                        </Card>

                        <Card
                            className={`cursor-pointer transition-all ${
                                stats.activeExceptions > 0
                                    ? 'bg-red-950/40 border-red-600/80'
                                    : 'bg-seguranca-graphite border-gray-700'
                            }`}
                            onClick={() => setViewMode('exceptions')}
                        >
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <ShieldAlert size={13} className="text-red-400" />
                                    Exceção Dianteiro
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-red-400">{stats.activeExceptions}</div>
                                <span className="text-[10px] text-gray-400">Recapados Eixo 1</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Gauge size={13} className="text-emerald-400" />
                                    KM Acumulado
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-xl font-bold font-mono text-emerald-300">
                                    {(stats.totalFleetKm / 1000).toFixed(0)}k
                                </div>
                                <span className="text-[10px] text-gray-400">{stats.scrapped} sucateado(s)</span>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:flex-col xl:w-52 justify-end">
                        <Button
                            onClick={() => setIsNfeOpen(true)}
                            className="flex-1 bg-seguranca-yellow hover:bg-yellow-500 text-seguranca-black font-bold text-xs shadow-lg"
                        >
                            <FileText size={15} className="mr-1.5" />
                            Importar NF-e (XML / PDF)
                        </Button>
                        <div className="flex gap-2 flex-1">
                            <Button
                                variant="outline"
                                className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs px-3"
                                onClick={refreshAll}
                                title="Atualizar dados"
                            >
                                <RefreshCw size={15} className={loadingTires ? 'animate-spin' : ''} />
                            </Button>
                            <Button
                                onClick={() => {
                                    setSelectedTire(null);
                                    setIsFormOpen(true);
                                }}
                                className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold"
                            >
                                <Plus size={15} className="mr-1" />
                                Novo Pneu
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Card com Abas */}
                <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden shadow-xl">
                    <CardHeader className="border-b border-gray-700/70 bg-seguranca-black/40 flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3 px-4">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-base font-semibold">
                            <Database className="mr-2 text-seguranca-yellow" size={20} />
                            Inventário, Rastreabilidade & Segurança de Pneus
                        </CardTitle>

                        <div className="flex flex-wrap bg-seguranca-black/70 p-1 rounded-lg border border-gray-700 gap-1">
                            <Button
                                variant={viewMode === 'map' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'map' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('map')}
                            >
                                <Activity size={14} className="mr-1.5" />
                                Mapa de Chassi
                            </Button>

                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'table' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('table')}
                            >
                                <Layers size={14} className="mr-1.5" />
                                Estoque Completo ({tires.length})
                            </Button>

                            <Button
                                variant={viewMode === 'exchange' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'exchange' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('exchange')}
                            >
                                <Repeat size={14} className="mr-1.5" />
                                Troca & Recapagem
                            </Button>

                            <Button
                                variant={viewMode === 'tireshop' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'tireshop' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('tireshop')}
                            >
                                <Wrench size={14} className="mr-1.5" />
                                Serviços de Borracharia
                            </Button>

                            <Button
                                variant={viewMode === 'exceptions' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'exceptions' ? 'bg-red-700 hover:bg-red-800 text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('exceptions')}
                            >
                                <ShieldAlert size={14} className="mr-1.5" />
                                Exceções Dianteiro
                                {stats.activeExceptions > 0 && (
                                    <Badge className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0">
                                        {stats.activeExceptions}
                                    </Badge>
                                )}
                            </Button>

                            <Button
                                variant={viewMode === 'config' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'config' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('config')}
                            >
                                <Sliders size={14} className="mr-1.5" />
                                Parâmetros
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-5">
                        {viewMode === 'map' && (
                            <BusTireMapper
                                tires={tires}
                                vehicles={vehicles}
                                lifecycleConfig={lifecycleConfig}
                                onTireClick={(tire) => {
                                    setInitialSlot(null);
                                    setInitialAction('DISMOUNT');
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onMountTireSlot={(slot) => {
                                    setSelectedTire(availableTires[0] || null);
                                    setInitialSlot(slot);
                                    setInitialAction('MOUNT');
                                    setIsMovementOpen(true);
                                }}
                                onMountSpecificTire={(tire, vId) => {
                                    setSelectedTire(tire);
                                    setInitialSlot({ vehicleId: vId, axleNumber: 1, positionIndex: 0, positionCode: 'DE' });
                                    setInitialAction('MOUNT');
                                    setIsMovementOpen(true);
                                }}
                                onDismountTire={(tire) => {
                                    setInitialSlot(null);
                                    setInitialAction('DISMOUNT');
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onRefresh={refreshAll}
                            />
                        )}

                        {viewMode === 'table' && (
                            <TiresTable
                                data={tires}
                                lifecycleConfig={lifecycleConfig}
                                onView={(tire) => {
                                    setInitialSlot(null);
                                    setInitialAction('HISTORY');
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onEdit={(tire) => {
                                    setSelectedTire(tire);
                                    setIsFormOpen(true);
                                }}
                                onDelete={async (tire) => {
                                    if (confirm(`Excluir pneu ${tire.fireNumber || tire.serialNumber}?`)) {
                                        await tireService.delete(tire.id);
                                        window.dispatchEvent(new CustomEvent('stock-data-changed'));
                                        refreshAll();
                                    }
                                }}
                                onMovement={(tire) => {
                                    setInitialSlot(null);
                                    setInitialAction(undefined);
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                            />
                        )}

                        {viewMode === 'exchange' && (
                            <TireExchangeControlTab
                                tires={tires}
                                vehicles={vehicles}
                                movements={movements}
                                lifecycleConfig={lifecycleConfig}
                                onOpenMovement={(tire, action) => {
                                    setInitialSlot(null);
                                    setInitialAction(action);
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                            />
                        )}

                        {viewMode === 'tireshop' && (
                            <TireShopServicesTab
                                tires={tires}
                                vehicles={vehicles}
                            />
                        )}

                        {viewMode === 'exceptions' && (
                            <TireExceptionsReportTab exceptions={exceptions} />
                        )}

                        {viewMode === 'config' && (
                            <TireLifecycleConfigTab config={lifecycleConfig} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <TireFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={handleSuccess}
                tire={selectedTire}
            />

            <TireMovementModal
                isOpen={isMovementOpen}
                onClose={() => {
                    setIsMovementOpen(false);
                    setInitialSlot(null);
                    setInitialAction(undefined);
                }}
                onSuccess={handleSuccess}
                tire={selectedTire}
                availableTires={availableTires}
                initialSlot={initialSlot}
                initialAction={initialAction}
                lifecycleConfig={lifecycleConfig}
                onRequestRegisterTire={() => {
                    setIsMovementOpen(false);
                    setInitialSlot(null);
                    setInitialAction(undefined);
                    setSelectedTire(null);
                    setIsFormOpen(true);
                }}
            />

            <StockNfeImportModal
                open={isNfeOpen}
                onOpenChange={setIsNfeOpen}
                onSuccess={handleSuccess}
            />
        </StandardLayout>
    );
};

export default GestaoPneus;
