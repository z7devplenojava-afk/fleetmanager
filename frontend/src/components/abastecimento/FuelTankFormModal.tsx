import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import fuelPumpService, { FuelTank } from '@/services/fuelPumpService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FuelTankFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const FuelTankFormModal: React.FC<FuelTankFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        capacity: '',
        currentLevel: '',
        fuelType: 'DIESEL'
    });

    const mutation = useMutation({
        mutationFn: (data: any) => fuelPumpService.createTank(data),
        onSuccess: () => {
            toast({ title: 'Sucesso', description: 'Tanque cadastrado com sucesso!' });
            onSuccess();
            onClose();
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Ocorreu um erro ao cadastrar o tanque.', variant: 'destructive' });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            ...formData,
            capacity: parseFloat(formData.capacity),
            currentLevel: parseFloat(formData.currentLevel)
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Tanque</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome do Tanque</Label>
                        <Input
                            placeholder="ex: Tanque Principal 01"
                            className="bg-seguranca-black border-gray-600"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Capacidade (L)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nível Atual (L)</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.currentLevel}
                                onChange={e => setFormData({ ...formData, currentLevel: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de Combustível</Label>
                        <Select
                            value={formData.fuelType}
                            onValueChange={val => setFormData({ ...formData, fuelType: val })}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                <SelectItem value="DIESEL">Diesel</SelectItem>
                                <SelectItem value="GASOLINA">Gasolina</SelectItem>
                                <SelectItem value="ETANOL">Etanol</SelectItem>
                                <SelectItem value="ARLA">Arla 32</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Salvando...' : 'Salvar Tanque'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FuelTankFormModal;
