import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ShoppingCart, RefreshCw, Calendar, FileText, Barcode, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import fuelPumpService, { FuelDelivery } from '@/services/fuelPumpService';
import contasAPagarService from '@/services/contasAPagarService';
import LoadingSpinner from '@/components/LoadingSpinner';
import { format } from 'date-fns';
import FuelDeliveryFormModal from './FuelDeliveryFormModal';
import BoletoViewerModal from './BoletoViewerModal';

export const FuelDeliveryManagement: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingBoleto, setViewingBoleto] = useState<{
        isOpen: boolean;
        boletoUrl?: string;
        fileName?: string;
        invoiceNumber?: string;
        installmentText?: string;
        supplier?: string;
        amount?: number;
        dueDate?: string;
        barcode?: string;
    }>({ isOpen: false });

    const { data: deliveries = [], isLoading, refetch } = useQuery({
        queryKey: ['fuelDeliveries'],
        queryFn: fuelPumpService.getDeliveries
    });

    const { data: tanks = [] } = useQuery({
        queryKey: ['fuelTanks'],
        queryFn: fuelPumpService.getTanks
    });

    // Buscar Contas a Pagar para cruzar os boletos anexados a cada NF
    const { data: contas = [], refetch: refetchContas } = useQuery({
        queryKey: ['contas-a-pagar'],
        queryFn: () => contasAPagarService.getContasAPagar(),
        retry: 1
    });

    const handleRefreshAll = () => {
        refetch();
        refetchContas();
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <Card className="bg-seguranca-graphite border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center text-lg text-seguranca-lightgray">
                            <ShoppingCart className="mr-2 text-green-400" size={20} />
                            Entradas de Combustível (Compras)
                        </CardTitle>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Gestão de NF de compra, estoque nos tanques e boletos vinculados ao Contas a Pagar.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRefreshAll} className="border-gray-600">
                            <RefreshCw size={16} className={`mr-1 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setIsModalOpen(true)}>
                            <Plus size={16} className="mr-1" /> Nova NF & Boletos
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>NF</TableHead>
                                <TableHead>Fornecedor</TableHead>
                                <TableHead>Tanque</TableHead>
                                <TableHead>Litros</TableHead>
                                <TableHead>Preço/L</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-center">Boletos Contas a Pagar</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deliveries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-gray-500 py-4">Nenhuma entrada registrada</TableCell>
                                </TableRow>
                            ) : (
                                deliveries.map(delivery => {
                                    // Localizar faturas vinculadas a esta NF no Contas a Pagar
                                    const matchingInvoices = contas.filter(c =>
                                        c.invoiceNumber && c.invoiceNumber.includes(delivery.invoiceNumber)
                                    );
                                    const withBoleto = matchingInvoices.filter(c => Boolean(c.boletoUrl));

                                    return (
                                        <TableRow key={delivery.id}>
                                            <TableCell className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                {delivery.deliveryDate ? format(new Date(delivery.deliveryDate), 'dd/MM/yyyy') : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-mono font-bold text-white">
                                                    <FileText size={14} className="text-purple-400" />
                                                    {delivery.invoiceNumber}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{delivery.supplier}</TableCell>
                                            <TableCell>{delivery.fuelTankName}</TableCell>
                                            <TableCell className="font-bold text-blue-400">{delivery.liters.toLocaleString()} L</TableCell>
                                            <TableCell>{delivery.pricePerLiter.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                            <TableCell className="font-bold text-seguranca-yellow">
                                                {delivery.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {withBoleto.length > 0 ? (
                                                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                                        {withBoleto.map((inv, idx) => (
                                                            <Button
                                                                key={inv.id || idx}
                                                                size="sm"
                                                                onClick={() =>
                                                                    setViewingBoleto({
                                                                        isOpen: true,
                                                                        boletoUrl: inv.boletoUrl,
                                                                        fileName: inv.boletoOriginalName,
                                                                        invoiceNumber: inv.invoiceNumber,
                                                                        installmentText: `Parc ${inv.installmentSeq || idx + 1}/${inv.totalInstallments || withBoleto.length}`,
                                                                        supplier: inv.fornecedor || delivery.supplier,
                                                                        amount: Number(inv.valor) || 0,
                                                                        dueDate: inv.vencimento ? new Date(inv.vencimento).toISOString().slice(0, 10) : undefined,
                                                                        barcode: inv.codigoBarras
                                                                    })
                                                                }
                                                                className="h-7 px-2 text-[11px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30"
                                                                title={`Visualizar Boleto ${inv.installmentSeq ? `Parcela ${inv.installmentSeq}` : ''}`}
                                                            >
                                                                <Barcode size={12} className="mr-1" />
                                                                {withBoleto.length > 1 ? `Boleto ${inv.installmentSeq || idx + 1}/${withBoleto.length}` : 'Ver Boleto'}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                ) : matchingInvoices.length > 0 ? (
                                                    <span className="text-[11px] text-amber-400 font-mono">
                                                        {matchingInvoices.length}x no Contas a Pagar
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-gray-500 font-mono">
                                                        Sem Boleto Anexo
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <FuelDeliveryFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleRefreshAll}
                tanks={tanks}
            />

            <BoletoViewerModal
                isOpen={viewingBoleto.isOpen}
                onClose={() => setViewingBoleto({ isOpen: false })}
                boletoUrl={viewingBoleto.boletoUrl}
                fileName={viewingBoleto.fileName}
                invoiceNumber={viewingBoleto.invoiceNumber}
                installmentText={viewingBoleto.installmentText}
                supplier={viewingBoleto.supplier}
                amount={viewingBoleto.amount}
                dueDate={viewingBoleto.dueDate}
                barcode={viewingBoleto.barcode}
            />
        </>
    );
};
