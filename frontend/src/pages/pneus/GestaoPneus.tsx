import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Plus, RefreshCw, Layers, Activity, Package, Bus, Wrench, AlertTriangle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import tireService, { Tire } from '@/services/tireService';
import fleetService from '@/services/fleetService';
import { TiresTable } from '@/components/pneus/TiresTable';
import { TireFormModal } from '@/components/pneus/TireFormModal';
import { TireMovementModal } from '@/components/pneus/TireMovementModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BusTireMapper } from '@/components/pneus/BusTireMapper';

const GestaoPneus: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'map'>('map');

    const queryClient = useQueryClient();

    // Busca pneus da empresa
    const { data: tires = [], isLoading: loadingTires, refetch } = useQuery({
        queryKey: ['tires'],
        queryFn: tireService.findAll,
    });

    // Busca veículos da frota
    const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
    });

    const handleSuccess = () => {
        setIsFormOpen(false);
        setIsMovementOpen(false);
        setSelectedTire(null);
        refetch();
        queryClient.invalidateQueries({ queryKey: ['tires'] });
    };

    if (loadingTires || loadingVehicles) return <LoadingSpinner />;

    const availableCount = tires.filter((t) => t.status === 'AVAILABLE').length;
    const inUseCount = tires.filter((t) => t.status === 'IN_USE').length;
    const recapCount = tires.filter((t) => t.status === 'RECAP').length;
    const scrappedCount = tires.filter((t) => t.status === 'SCRAPPED').length;

    return (
        <StandardLayout title="Gestão de Pneus" subtitle="Controle de estoque, localização em veículos, vida útil e movimentação">
            <div className="space-y-6">
                {/* Header Stats Bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-gray-700 min-w-[140px]">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Package size={14} className="text-green-400" />
                                    Em Estoque
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-green-400">{availableCount}</div>
                                <span className="text-[10px] text-gray-400">Pneus no Almoxarifado</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700 min-w-[140px]">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Bus size={14} className="text-blue-400" />
                                    Em Uso (Frota)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-blue-400">{inUseCount}</div>
                                <span className="text-[10px] text-gray-400">Instalados em Veículos</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700 min-w-[140px]">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Wrench size={14} className="text-yellow-400" />
                                    Para Recapagem
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-yellow-400">{recapCount}</div>
                                <span className="text-[10px] text-gray-400">Em Reforma / Oficina</span>
                            </CardContent>
                        </Card>

                        <Card className="bg-seguranca-graphite border-gray-700 min-w-[140px]">
                            <CardHeader className="pb-1 pt-3 px-3">
                                <CardTitle className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <AlertTriangle size={14} className="text-red-400" />
                                    Sucateados
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-3">
                                <div className="text-2xl font-bold font-mono text-red-400">{scrappedCount}</div>
                                <span className="text-[10px] text-gray-400">Descartados</span>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                            onClick={() => refetch()}
                        >
                            <RefreshCw size={16} className={`mr-2 ${loadingTires ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button
                            onClick={() => {
                                setSelectedTire(null);
                                setIsFormOpen(true);
                            }}
                            className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-950/30 text-xs font-semibold"
                        >
                            <Plus size={16} className="mr-1.5" />
                            Novo Pneu no Estoque
                        </Button>
                    </div>
                </div>

                {/* Main Card with Tabs: Mapa Visual vs Tabela */}
                <Card className="bg-seguranca-graphite border-gray-700 overflow-hidden shadow-xl">
                    <CardHeader className="border-b border-gray-700/70 bg-seguranca-black/30 flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-base font-semibold">
                            <Database className="mr-2 text-seguranca-yellow" size={20} />
                            Inventário de Pneus & Localização
                        </CardTitle>

                        <div className="flex bg-seguranca-black/60 p-1 rounded-lg border border-gray-700">
                            <Button
                                variant={viewMode === 'map' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'map' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('map')}
                            >
                                <Activity size={15} className="mr-1.5" />
                                Mapa Visual de Veículos
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 text-xs ${
                                    viewMode === 'table' ? 'bg-seguranca-red hover:bg-seguranca-darkred text-white' : 'text-gray-400 hover:text-gray-200'
                                }`}
                                onClick={() => setViewMode('table')}
                            >
                                <Layers size={15} className="mr-1.5" />
                                Tabela Completa (Estoque & Veículos)
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-4 sm:p-6">
                        {viewMode === 'table' ? (
                            <TiresTable
                                data={tires}
                                onView={(tire) => {
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onEdit={(tire) => {
                                    setSelectedTire(tire);
                                    setIsFormOpen(true);
                                }}
                                onDelete={async (tire) => {
                                    if (confirm(`Excluir pneu com código/série ${tire.serialNumber}?`)) {
                                        await tireService.delete(tire.id);
                                        refetch();
                                    }
                                }}
                                onMovement={(tire) => {
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                            />
                        ) : (
                            <BusTireMapper
                                tires={tires}
                                vehicles={vehicles}
                                onTireClick={(tire) => {
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onMountTireSlot={(slot) => {
                                    // Seleciona um pneu do estoque para montagem se disponível
                                    const available = tires.find((t) => t.status === 'AVAILABLE');
                                    if (available) {
                                        setSelectedTire(available);
                                    } else {
                                        setSelectedTire(null);
                                    }
                                    setIsMovementOpen(true);
                                }}
                                onDismountTire={(tire) => {
                                    setSelectedTire(tire);
                                    setIsMovementOpen(true);
                                }}
                                onRefresh={refetch}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            <TireFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} tire={selectedTire} />

            <TireMovementModal isOpen={isMovementOpen} onClose={() => setIsMovementOpen(false)} onSuccess={handleSuccess} tire={selectedTire} />
        </StandardLayout>
    );
};

export default GestaoPneus;
