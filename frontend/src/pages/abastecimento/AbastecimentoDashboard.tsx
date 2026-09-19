import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Fuel, Plus, Droplets, RefreshCw, Layers, Gauge, ShoppingCart, Settings, BarChart3, MapPin, Sparkles } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { FuelConsumptionStats } from '@/components/frota/FuelConsumptionStats';
import { FuelConsumptionOverview } from '@/components/frota/FuelConsumptionOverview';
import { AbastecimentosTable } from '@/components/frota/AbastecimentosTable';
import AbastecimentoInternoFormModal from '@/components/frota/AbastecimentoInternoFormModal';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FuelInfraManagement } from '@/components/abastecimento/FuelInfraManagement';
import { FuelDeliveryManagement } from '@/components/abastecimento/FuelDeliveryManagement';
import { FuelReadingManagement } from '@/components/abastecimento/FuelReadingManagement';
import FuelReportsDashboard from '@/components/frota/FuelReportsDashboard';
import EfficiencyAlerts from '@/components/frota/EfficiencyAlerts';
import AbastecimentoExternoFormModal from '@/components/frota/AbastecimentoExternoFormModal';
import AbastecimentoExternoReport, { AbastExternoSubTab } from '@/components/frota/AbastecimentoExternoReport';

const AbastecimentoDashboard: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExternoModalOpen, setIsExternoModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('vehicles');
    const [externoSubTab, setExternoSubTab] = useState<AbastExternoSubTab>('lancamentos');
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
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 bg-seguranca-graphite border-gray-600 p-1 mb-6">
                        <TabsTrigger value="vehicles" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <Fuel size={16} className="mr-2" /> Veículos
                        </TabsTrigger>
                        <TabsTrigger value="externo" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-green-600">
                            <MapPin size={16} className="mr-2" /> Abast. Externo
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
                        <TabsTrigger value="reports" className="text-xs sm:text-sm text-seguranca-lightgray data-[state='active']:bg-seguranca-red">
                            <BarChart3 size={16} className="mr-2" /> Relatórios
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
                                <Button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
                                    <Plus size={18} className="mr-2" />
                                    Abastecimento Interno
                                </Button>
                            </div>
                        </div>

                        <EfficiencyAlerts compact />

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

                    <TabsContent value="externo" className="space-y-6 mt-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-seguranca-lightgray flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-green-400" />
                                    Abastecimento Externo - Postos de Gasolina
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Registros de abastecimento realizados em postos externos, com vínculo ao cliente e contrato.
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5 w-full md:w-auto">
                                <Button
                                    variant="outline"
                                    onClick={() => setExternoSubTab('relatorio-inteligente')}
                                    className="flex-1 md:flex-none border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-emerald-500/10 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 font-semibold text-xs h-9 shadow-sm"
                                >
                                    <Sparkles size={16} className="mr-2 text-amber-400" />
                                    Relatório Inteligente
                                </Button>
                                <Button
                                    onClick={() => setIsExternoModalOpen(true)}
                                    className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 text-xs h-9 font-semibold"
                                >
                                    <Plus size={18} className="mr-2" />
                                    Novo Abastecimento Externo
                                </Button>
                            </div>
                        </div>
                        <AbastecimentoExternoReport
                            fuelRecords={fuelRecords}
                            activeSubTab={externoSubTab}
                            onSubTabChange={setExternoSubTab}
                        />
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

                    <TabsContent value="reports" className="mt-0">
                        <FuelReportsDashboard fuelRecords={fuelRecords} vehicles={vehicles} />
                    </TabsContent>
                </Tabs>
            </div>

            <AbastecimentoInternoFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                veiculos={vehicles}
            />

            <AbastecimentoExternoFormModal
                isOpen={isExternoModalOpen}
                onClose={() => setIsExternoModalOpen(false)}
                onSuccess={handleSuccess}
                veiculos={vehicles}
            />
        </StandardLayout>
    );
};

export default AbastecimentoDashboard;

