import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, Plus, RefreshCw, Layers, Gauge, Activity } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import tireService, { Tire } from '@/services/tireService';
import { TiresTable } from '@/components/pneus/TiresTable';
import { TireFormModal } from '@/components/pneus/TireFormModal';
import { TireMovementModal } from '@/components/pneus/TireMovementModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import { BusTireMapper } from '@/components/pneus/BusTireMapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const GestaoPneus: React.FC = () => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isMovementOpen, setIsMovementOpen] = useState(false);
    const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'map'>('map');

    const queryClient = useQueryClient();

    const { data: tires = [], isLoading, refetch } = useQuery({
        queryKey: ['tires'],
        queryFn: tireService.findAll
    });

    const handleSuccess = () => {
        setIsFormOpen(false);
        setIsMovementOpen(false);
        setSelectedTire(null);
        refetch();
    };

    if (isLoading) return <LoadingSpinner />;

    const availableCount = tires.filter(t => t.status === 'AVAILABLE').length;
    const inUseCount = tires.filter(t => t.status === 'IN_USE').length;
    const recapCount = tires.filter(t => t.status === 'RECAP').length;

    return (
        <StandardLayout title="Gestão de Pneus" subtitle="Controle de vida útil, recapagem e movimentação de pneus">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Disponíveis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-green-500">{availableCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Em Uso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-400">{inUseCount}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recapagem</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-seguranca-yellow">{recapCount}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetch()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button
                            onClick={() => { setSelectedTire(null); setIsFormOpen(true); }}
                            className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-900/20"
                        >
                            <Plus size={18} className="mr-2" />
                            Novo Pneu
                        </Button>
                    </div>
                </div>

                <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden">
                    <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20 flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                            <Database className="mr-2 text-seguranca-yellow" size={20} />
                            Inventário de Pneus
                        </CardTitle>

                        <div className="flex bg-seguranca-black/40 p-1 rounded-lg border border-gray-700">
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 ${viewMode === 'table' ? 'bg-seguranca-red hover:bg-seguranca-darkred' : 'text-gray-400'}`}
                                onClick={() => setViewMode('table')}
                            >
                                <Layers size={16} className="mr-2" />
                                Tabela
                            </Button>
                            <Button
                                variant={viewMode === 'map' ? 'default' : 'ghost'}
                                size="sm"
                                className={`h-8 px-3 ${viewMode === 'map' ? 'bg-seguranca-red hover:bg-seguranca-darkred' : 'text-gray-400'}`}
                                onClick={() => setViewMode('map')}
                            >
                                <Activity size={16} className="mr-2" />
                                Mapa Visual
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {viewMode === 'table' ? (
                            <TiresTable
                                data={tires}
                                onView={(tire) => { /* Implementar histórico view */ }}
                                onEdit={(tire) => { setSelectedTire(tire); setIsFormOpen(true); }}
                                onDelete={async (tire) => {
                                    if (confirm(`Excluir pneu ${tire.serialNumber}?`)) {
                                        await tireService.delete(tire.id);
                                        refetch();
                                    }
                                }}
                                onMovement={(tire) => { setSelectedTire(tire); setIsMovementOpen(true); }}
                            />
                        ) : (
                            <div className="p-6">
                                <BusTireMapper
                                    tires={tires}
                                    onTireClick={(tire) => { setSelectedTire(tire); setIsMovementOpen(true); }}
                                    onRotation={(tire, pos) => {
                                        // TODO: Implementar drag-and-drop rotation logic
                                        console.log('Rotation triggered:', tire, pos);
                                    }}
                                />
                            </div>
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
                onClose={() => setIsMovementOpen(false)}
                onSuccess={handleSuccess}
                tire={selectedTire}
            />
        </StandardLayout>
    );
};

export default GestaoPneus;
