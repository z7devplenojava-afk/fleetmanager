import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, Calendar, AlertTriangle, Clock, RefreshCw, Layers } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import maintenanceService from '@/services/maintenanceService';
import fleetService from '@/services/fleetService';
import { ManutencoesTable } from '@/components/frota/ManutencoesTable';
import ManutencaoFormModal from '@/components/frota/ManutencaoFormModal';
import { ManutencaoViewModal } from '@/components/frota/ManutencaoViewModal';
import { ManutencaoDeleteDialog } from '@/components/frota/ManutencaoDeleteDialog';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';

const ManutencaoDashboard: React.FC = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedManutencao, setSelectedManutencao] = useState<any>(null);

    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles
    });

    const { data: maintenances = [], isLoading: recordsLoading, refetch: refetchMaintenances } = useQuery({
        queryKey: ['maintenances'],
        queryFn: maintenanceService.getAllMaintenances,
        retry: 2
    });

    const handleSuccess = () => {
        refetchMaintenances();
        queryClient.invalidateQueries({ queryKey: ['maintenances'] });
        setIsFormModalOpen(false);
        setSelectedManutencao(null);
    };

    const handleView = (maintenance: any) => {
        setSelectedManutencao(maintenance);
        setIsViewModalOpen(true);
    };

    const handleEdit = (maintenance: any) => {
        setSelectedManutencao(maintenance);
        setIsFormModalOpen(true);
    };

    const handleDelete = (maintenance: any) => {
        setSelectedManutencao(maintenance);
        setIsDeleteModalOpen(true);
    };

    if (vehiclesLoading && recordsLoading && maintenances.length === 0) {
        return <LoadingSpinner />;
    }

    const scheduled = maintenances.filter(m => m.status === 'SCHEDULED').length;
    const inProgress = maintenances.filter(m => m.status === 'IN_PROGRESS').length;
    const urgent = maintenances.filter(m => m.priority === 'URGENT').length;
    const totalCost = maintenances.reduce((acc, m) => acc + (m.cost || 0), 0);

    return (
        <StandardLayout title="Gestão de Manutenção" subtitle="Controle e agendamento de manutenções da frota">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full md:w-auto">
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Agendadas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-seguranca-yellow">{scheduled}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Em Curso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-blue-400">{inProgress}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Urgentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-red-500">{urgent}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-seguranca-graphite border-gray-600 min-w-[150px]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-medium text-gray-400 uppercase tracking-wider">Custo Total</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold text-green-500">
                                    {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none border-gray-600 text-gray-400 hover:bg-gray-700"
                            onClick={() => refetchMaintenances()}
                        >
                            <RefreshCw size={18} className={`mr-2 ${recordsLoading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button onClick={() => { setSelectedManutencao(null); setIsFormModalOpen(true); }} className="flex-1 md:flex-none bg-seguranca-red hover:bg-seguranca-darkred shadow-lg shadow-red-900/20">
                            <Plus size={18} className="mr-2" />
                            Nova Manutenção
                        </Button>
                    </div>
                </div>

                <Card className="bg-seguranca-graphite border-gray-600 overflow-hidden">
                    <CardHeader className="border-b border-gray-600/50 bg-seguranca-black/20">
                        <CardTitle className="text-seguranca-lightgray flex items-center text-lg">
                            <Layers className="mr-2 text-seguranca-yellow" size={20} />
                            Ordens de Serviço e Manutenções
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ManutencoesTable
                            data={maintenances || []}
                            onRefresh={refetchMaintenances}
                            onView={handleView}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    </CardContent>
                </Card>
            </div>

            <ManutencaoFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSuccess={handleSuccess}
                veiculos={vehicles}
                manutencao={selectedManutencao}
            />

            {selectedManutencao && (
                <>
                    <ManutencaoViewModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        maintenance={selectedManutencao}
                        onEdit={() => {
                            setIsViewModalOpen(false);
                            setIsFormModalOpen(true);
                        }}
                    />
                    <ManutencaoDeleteDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onSuccess={handleSuccess}
                        maintenance={selectedManutencao}
                    />
                </>
            )}
        </StandardLayout>
    );
};

export default ManutencaoDashboard;
