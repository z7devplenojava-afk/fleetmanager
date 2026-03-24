import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import fuelPumpService, { FuelTank } from '@/services/fuelPumpService';
import { useMutation } from '@tanstack/react-query';

interface FuelDeliveryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tanks: FuelTank[];
}

const FuelDeliveryFormModal: React.FC<FuelDeliveryFormModalProps> = ({ isOpen, onClose, onSuccess, tanks }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        deliveryDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        supplier: '',
        liters: '',
        pricePerLiter: '',
        totalPrice: '',
        fuelTankId: ''
    });

    const mutation = useMutation({
        mutationFn: (data: any) => fuelPumpService.recordDelivery(data),
        onSuccess: () => {
            toast({ title: 'Sucesso', description: 'Nota Fiscal registrada e estoque atualizado!' });
            onSuccess();
            onClose();
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Ocorreu um erro ao registrar a entrega.', variant: 'destructive' });
        }
    });

    const handleLitersOrPriceChange = (field: string, value: string) => {
        const nextData = { ...formData, [field]: value };
        const liters = parseFloat(field === 'liters' ? value : formData.liters);
        const price = parseFloat(field === 'pricePerLiter' ? value : formData.pricePerLiter);

        if (!isNaN(liters) && !isNaN(price)) {
            nextData.totalPrice = (liters * price).toFixed(2);
        }
        setFormData(nextData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fuelTankId) {
            toast({ title: 'Erro', description: 'Selecione um tanque.', variant: 'destructive' });
            return;
        }
        mutation.mutate({
            ...formData,
            liters: parseFloat(formData.liters),
            pricePerLiter: parseFloat(formData.pricePerLiter),
            totalPrice: parseFloat(formData.totalPrice)
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-w-lg">
                <DialogHeader>
                    <DialogTitle>Registrar Entrada de Combustível (NF)</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data da Entrega</Label>
                            <Input
                                type="date"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.deliveryDate}
                                onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Número da NF</Label>
                            <Input
                                placeholder="000.000.000"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.invoiceNumber}
                                onChange={e => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Input
                            placeholder="Nome do Posto / Distribuidora"
                            className="bg-seguranca-black border-gray-600"
                            value={formData.supplier}
                            onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Tanque de Destino</Label>
                        <Select
                            value={formData.fuelTankId}
                            onValueChange={val => setFormData({ ...formData, fuelTankId: val })}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Selecione o tanque" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                {tanks.map(tank => (
                                    <SelectItem key={tank.id} value={tank.id}>
                                        {tank.name} ({tank.fuelType}) - Saldo: {tank.currentLevel}L
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Quantidade (L)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.liters}
                                onChange={e => handleLitersOrPriceChange('liters', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Preço/Litro (R$)</Label>
                            <Input
                                type="number"
                                step="0.001"
                                placeholder="0,000"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.pricePerLiter}
                                onChange={e => handleLitersOrPriceChange('pricePerLiter', e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor Total (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                className="bg-seguranca-black border-gray-600 font-bold text-seguranca-yellow"
                                value={formData.totalPrice}
                                onChange={e => setFormData({ ...formData, totalPrice: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Processando...' : 'Confirmar Entrada'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FuelDeliveryFormModal;
