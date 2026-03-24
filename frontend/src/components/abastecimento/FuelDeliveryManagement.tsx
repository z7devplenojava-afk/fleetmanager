import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, RefreshCw, Calendar, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import fuelPumpService, { FuelDelivery } from '@/services/fuelPumpService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import FuelDeliveryFormModal from './FuelDeliveryFormModal';

export const FuelDeliveryManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: deliveries = [], isLoading, refetch } = useQuery({
        queryKey: ['fuelDeliveries'],
        queryFn: fuelPumpService.getDeliveries
    });

    const { data: tanks = [] } = useQuery({
        queryKey: ['fuelTanks'],
        queryFn: fuelPumpService.getTanks
    });

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-lg text-seguranca-lightgray">
                        <ShoppingCart className="mr-2 text-green-400" size={20} />
                        Entradas de Combustível (Compras)
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-600">
                            <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> Nova NF
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>NF</TableHead>
                                <TableHead>Fornecedor</TableHead>
                                <TableHead>Tanque</TableHead>
                                <TableHead>Liters</TableHead>
                                <TableHead>Preço/L</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliveries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-gray-500 py-4">Nenhuma entrada registrada</TableCell>
                                </TableRow>
                            ) : (
                                deliveries.map(delivery => (
                                    <TableRow key={delivery.id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            {format(new Date(delivery.deliveryDate), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <FileText size={14} className="text-gray-400" />
                                                {delivery.invoiceNumber}
                                            </div>
                                        </TableCell>
                                        <TableCell>{delivery.supplier}</TableCell>
                                        <TableCell>{delivery.fuelTankName}</TableCell>
                                        <TableCell className="font-bold text-blue-400">{delivery.liters.toLocaleString()} L</TableCell>
                                        <TableCell>{delivery.pricePerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                        <TableCell className="font-bold text-seguranca-yellow">
                                            {delivery.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FuelDeliveryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => refetch()}
                tanks={tanks}
            />
        </>
    );
};

