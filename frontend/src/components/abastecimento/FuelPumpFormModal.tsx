import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import fuelPumpService, { FuelTank } from '@/services/fuelPumpService';
import { useMutation } from '@tanstack/react-query';

interface FuelPumpFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tanks: FuelTank[];
}

const FuelPumpFormModal: React.FC<FuelPumpFormModalProps> = ({ isOpen, onClose, onSuccess, tanks }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        fuelTankId: '',
        lastMeterReading: ''
    });

    const mutation = useMutation({
        mutationFn: (data: any) => fuelPumpService.createPump(data),
        onSuccess: () => {
            toast({ title: 'Sucesso', description: 'Bomba cadastrada com sucesso!' });
            onSuccess();
            onClose();
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Ocorreu um erro ao cadastrar a bomba.', variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fuelTankId) {
            toast({ title: 'Erro', description: 'Selecione um tanque.', variant: 'destructive' });
            return;
        }
        mutation.mutate({
            ...formData,
            lastMeterReading: parseFloat(formData.lastMeterReading)
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle>Cadastrar Nova Bomba</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome/Identificação da Bomba</Label>
                        <Input
                            placeholder="ex: Bomba Diesel 01"
                            className="bg-seguranca-black border-gray-600"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tanque Alimentador</Label>
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
                                        {tank.name} ({tank.fuelType})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Leitura Atual do Encerrante (L)</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            className="bg-seguranca-black border-gray-600"
                            value={formData.lastMeterReading}
                            onChange={e => setFormData({ ...formData, lastMeterReading: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-400">Este valor será usado como ponto de partida para cálculos de saída.</p>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
                        <Button type="submit" className="bg-seguranca-yellow hover:bg-yellow-600 text-black" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Salvando...' : 'Salvar Bomba'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FuelPumpFormModal;
