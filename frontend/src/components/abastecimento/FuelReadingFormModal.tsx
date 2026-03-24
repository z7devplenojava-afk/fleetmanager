import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import fuelPumpService, { FuelPump } from '@/services/fuelPumpService';
import { useMutation } from '@tanstack/react-query';

interface FuelReadingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    pumps: FuelPump[];
}

const FuelReadingFormModal: React.FC<FuelReadingFormModalProps> = ({ isOpen, onClose, onSuccess, pumps }) => {
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        readingDate: new Date().toISOString().split('T')[0],
        fuelPumpId: '',
        initialValue: '',
        finalValue: '',
        totalLiters: ''
    });

    const mutation = useMutation({
        mutationFn: (data: any) => fuelPumpService.recordReading(data),
        onSuccess: () => {
            toast({ title: 'Sucesso', description: 'Leitura registrada e estoque deduzido!' });
            onSuccess();
            onClose();
        },
        onError: () => {
            toast({ title: 'Erro', description: 'Ocorreu um erro ao registrar a leitura.', variant: 'destructive' });
        }
    });

    // Auto-preencher valor inicial quando a bomba é selecionada
    useEffect(() => {
        if (formData.fuelPumpId) {
            const pump = pumps.find(p => p.id === formData.fuelPumpId);
            if (pump) {
                setFormData(prev => ({
                    ...prev,
                    initialValue: pump.lastMeterReading.toString()
                }));
            }
        }
    }, [formData.fuelPumpId, pumps]);

    const handleFinalValueChange = (value: string) => {
        const initial = parseFloat(formData.initialValue);
        const final = parseFloat(value);

        let total = '';
        if (!isNaN(initial) && !isNaN(final)) {
            total = (final - initial).toFixed(2);
        }

        setFormData(prev => ({
            ...prev,
            finalValue: value,
            totalLiters: total
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fuelPumpId) {
            toast({ title: 'Erro', description: 'Selecione uma bomba.', variant: 'destructive' });
            return;
        }

        const total = parseFloat(formData.totalLiters);
        if (total < 0) {
            toast({ title: 'Erro', description: 'O valor final não pode ser menor que o inicial.', variant: 'destructive' });
            return;
        }

        mutation.mutate({
            ...formData,
            initialValue: parseFloat(formData.initialValue),
            finalValue: parseFloat(formData.finalValue),
            totalLiters: total
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle>Registrar Leitura de Encerrante</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Data da Leitura</Label>
                        <Input
                            type="date"
                            className="bg-seguranca-black border-gray-600"
                            value={formData.readingDate}
                            onChange={e => setFormData({ ...formData, readingDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Bomba de Combustível</Label>
                        <Select
                            value={formData.fuelPumpId}
                            onValueChange={val => setFormData({ ...formData, fuelPumpId: val })}
                        >
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Selecione a bomba" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                {pumps.map(pump => (
                                    <SelectItem key={pump.id} value={pump.id}>
                                        {pump.name} ({pump.fuelTankName})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Leitura Inicial (L)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                className="bg-seguranca-black border-gray-600 opacity-70"
                                value={formData.initialValue}
                                readOnly
                            />
                            <p className="text-[10px] text-gray-500 italic">Vindo do último fechamento</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Leitura Final (L)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.finalValue}
                                onChange={e => handleFinalValueChange(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-seguranca-black/30 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Total Descarregado/Saída:</span>
                            <span className="text-2xl font-bold text-red-400">
                                {formData.totalLiters || '0'} L
                            </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">Este volume será automaticamente deduzido do estoque do tanque associado.</p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-gray-400">Cancelar</Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Gravando...' : 'Confirmar Fechamento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FuelReadingFormModal;
