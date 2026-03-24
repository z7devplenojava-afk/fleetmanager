import React, { useState } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Filter, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import driverHourService, { DriverWorkHour } from '@/services/driverHourService';
import ControleHorasTable from '@/components/rh/ControleHorasTable';
import DriverHourFormModal from '@/components/rh/DriverHourFormModal';

const ControleHoras: React.FC = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<DriverWorkHour | undefined>(undefined);

    const { data: records = [], isLoading } = useQuery({
        queryKey: ['driverHours'],
        queryFn: () => driverHourService.getJornadaByPeriod(
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
            new Date().toISOString().split('T')[0]
        )
    });

    const handleEdit = (hour: DriverWorkHour) => {
        setSelectedHour(hour);
        setModalOpen(true);
    };

    const handleNew = () => {
        setSelectedHour(undefined);
        setModalOpen(true);
    };

    return (
        <StandardLayout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-seguranca-lightgray">Controle de Horas Motorista</h1>
                        <p className="text-gray-400 mt-1">Gestão de jornada e conformidade Lei 13.103</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Filter size={16} className="mr-2" />
                            Filtrar
                        </Button>
                        <Button variant="outline" className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black">
                            <Download size={16} className="mr-2" />
                            Exportar
                        </Button>
                        <Button onClick={handleNew} className="bg-seguranca-red hover:bg-seguranca-darkred">
                            <Plus size={16} className="mr-2" />
                            Novo Lançamento
                        </Button>
                    </div>
                </div>

                <Card className="bg-seguranca-graphite border-gray-600">
                    <CardHeader>
                        <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                            <Clock className="text-seguranca-yellow" />
                            Registros do Mês
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Listagem de jornadas realizadas e pendentes de fechamento
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                            </div>
                        ) : (
                            <ControleHorasTable data={records} onEdit={handleEdit} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <DriverHourFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                selectedHour={selectedHour}
            />
        </StandardLayout>
    );
};

export default ControleHoras;
