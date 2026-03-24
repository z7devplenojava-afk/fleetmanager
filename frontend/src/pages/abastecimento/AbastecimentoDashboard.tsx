import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Plus, Droplets, RefreshCw, Layers, Gauge, ShoppingCart, Settings } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { FuelConsumptionStats } from '@/components/frota/FuelConsumptionStats';
import { FuelConsumptionOverview } from '@/components/frota/FuelConsumptionOverview';
import { AbastecimentosTable } from '@/components/frota/AbastecimentosTable';
import AbastecimentoFormModal from '@/components/frota/AbastecimentoFormModal';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelInfraManagement } from '@/components/abastecimento/FuelInfraManagement';
import { FuelDeliveryManagement } from '@/components/abastecimento/FuelDeliveryManagement';
import { FuelReadingManagement } from '@/components/abastecimento/FuelReadingManagement';

const AbastecimentoDashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('vehicles');
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles
    });

    const { data: fuelRecords = [], isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
        queryKey: ['fuelRecords'],
        queryFn: () => fleetService.getFuelRecords(),
        retry: 2
    });

    const handleSuccess = () => {
        refetchRecords();
        queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
        setIsModalOpen(false);
    };

    const totalCost = fuelRecords.reduce((acc, curr) => acc + (curr.cost || 0), 0);
    const totalLiters = fuelRecords.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const averageLitros = fuelRecords.length > 0 ? totalLiters / fuelRecords.length : 0;

    if (vehiclesLoading && recordsLoading && fuelRecords.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <StandardLayout title="Controle de Abastecimento" subtitle="Gestão de consumo, estoque e infraestrutura de combustível">
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 bg-seguranca-graphite border-gray-600 p-1 mb-6">
                        <TabsTrigger value="vehicles" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <Fuel size={16} className="mr-2" /> Veículos
                        </TabsTrigger>
                        <TabsTrigger value="infra" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <Settings size={16} className="mr-2" /> Tanques & Bombas
                        </TabsTrigger>
                        <TabsTrigger value="deliveries" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <ShoppingCart size={16} className="mr-2" /> Entradas (NF)
                        </TabsTrigger>
                        <TabsTrigger value="readings" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <Gauge size={16} className="mr-2" /> Fechamentos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="vehicles" className="space-y-6 mt-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                                <Card className="bg-seguranca-graphite border-gray-600 min-w-[180px]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Gasto</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-seguranca-yellow">
                                            {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-seguranca-graphite border-gray-600 min-w-[180px]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Litros Totais</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-blue-400">
                                            {totalLiters.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-seguranca-graphite border-gray-600 min-w-[180px]">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Média Abast.</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-green-500">
                                            {averageLitros.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} L
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                                    onClick={() => refetchRecords()}
                                >
                                    <RefreshCw size={18} className={`mr-2 ${recordsLoading ? 'animate-spin' : ''}`} />
                                    Atualizar
                                </Button>
                                <Button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-900/20">
                                    <Plus size={18} className="mr-2" />
                                    Novo Registro
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <FuelConsumptionOverview vehicles={vehicles} />
                            <FuelConsumptionStats vehicles={vehicles} />
                        </div>

                        <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden">
                            <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20">
                                <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                                    <Layers className="mr-2 text-seguranca-yellow" size={20} />
                                    Histórico Detalhado de Abastecimentos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <AbastecimentosTable
                                    abastecimentos={fuelRecords}
                                    veiculos={vehicles}
                                    onRefresh={handleSuccess}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="infra" className="mt-0">
                        <FuelInfraManagement />
                    </TabsContent>

                    <TabsContent value="deliveries" className="mt-0">
                        <FuelDeliveryManagement />
                    </TabsContent>

                    <TabsContent value="readings" className="mt-0">
                        <FuelReadingManagement />
                    </TabsContent>
                </Tabs>
            </div>

            <AbastecimentoFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                veiculos={vehicles}
            />
        </StandardLayout>
    );
};

export default AbastecimentoDashboard;

