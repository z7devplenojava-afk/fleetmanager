import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Archive, RefreshCw, Calendar, Gauge } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import fuelPumpService, { FuelPumpReading } from '@/services/fuelPumpService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import FuelReadingFormModal from './FuelReadingFormModal';

export const FuelReadingManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: readings = [], isLoading, refetch } = useQuery({
        queryKey: ['fuelReadings'],
        queryFn: fuelPumpService.getReadings
    });

    const { data: pumps = [] } = useQuery({
        queryKey: ['pumps'],
        queryFn: fuelPumpService.getPumps
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-lg text-seguranca-lightgray">
                        <Archive className="mr-2 text-purple-400" size={20} />
                        Fechamentos de Bomba (Leituras)
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600">
                            <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> Novo Fechamento
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Bomba</TableHead>
                                <TableHead>Leitura Inicial</TableHead>
                                <TableHead>Leitura Final</TableHead>
                                <TableHead>Total de Saída</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {readings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-4">Nenhum fechamento registrado</TableCell>
                                </TableRow>
                            ) : (
                                readings.map(reading => (
                                    <TableRow key={reading.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {format(new Date(reading.readingDate), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>{reading.fuelPumpName}</TableCell>
                                        <TableCell>{reading.initialValue.toLocaleString()} L</TableCell>
                                        <TableCell>{reading.finalValue.toLocaleString()} L</TableCell>
                                        <TableCell className="font-bold text-red-400 flex items-center gap-1">
                                            <Gauge size={14} />
                                            {reading.totalLiters.toLocaleString()} L
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FuelReadingFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
                pumps={pumps}
            />
        </>
    );
};
