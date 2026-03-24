import React, { useState } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import arlaService from '@/services/arlaService';
import { Droplets, Calendar, Gauge, DollarSign, MapPin } from 'lucide-react';

interface Veiculo {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
}

interface ArlaRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    veiculos: Veiculo[];
}

const ArlaRecordModal: React.FC<ArlaRecordModalProps> = ({ isOpen, onClose, onSuccess, veiculos }) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        vehicleId: '',
        date: new Date().toISOString().split('T')[0],
        quantity: '',
        cost: '',
        mileage: '',
        station: '',
        notes: ''
    });

    const mutation = useMutation({
        mutationFn: arlaService.create,
        onSuccess: () => {
            toast({ title: "Sucesso", description: "Consumo de Arla registrado com sucesso!" });
            queryClient.invalidateQueries({ queryKey: ['arlaRecords'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error.response?.data?.message || "Erro ao registrar consumo",
                variant: "destructive"
            });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vehicleId || !formData.quantity || !formData.mileage) {
            toast({ title: "Erro", description: "Preencha os campos obrigatórios", variant: "destructive" });
            return;
        }

        mutation.mutate({
            ...formData,
            quantity: Number(formData.quantity.replace(',', '.')),
            cost: Number(formData.cost.replace(',', '.')),
            mileage: Number(formData.mileage.replace(/\./g, ''))
        });
    };

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar Consumo de Arla 32"
            description="Informe os dados de abastecimento de reagente Arla 32"
        >
            <form onSubmit={handleSubmit} className="space-y-6 p-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Veículo <span className="text-seguranca-red">*</span></Label>
                        <Select onValueChange={(v) => setFormData(f => ({ ...f, vehicleId: v }))}>
                            <SelectTrigger className="bg-seguranca-black border-gray-700">
                                <SelectValue placeholder="Selecione o veículo" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700">
                                {veiculos.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data <span className="text-seguranca-red">*</span></Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="date"
                                    className="pl-9 bg-seguranca-black border-gray-700"
                                    value={formData.date}
                                    onChange={e => setFormData(f => ({ ...f, date: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Quilometragem <span className="text-seguranca-red">*</span></Label>
                            <div className="relative">
                                <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Ex: 120.000"
                                    className="pl-9 bg-seguranca-black border-gray-700"
                                    value={formData.mileage}
                                    onChange={e => setFormData(f => ({ ...f, mileage: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Litros <span className="text-seguranca-red">*</span></Label>
                            <div className="relative">
                                <Droplets className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="0,00"
                                    className="pl-9 bg-seguranca-black border-gray-700"
                                    value={formData.quantity}
                                    onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Custo Total (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="0,00"
                                    className="pl-9 bg-seguranca-black border-gray-700"
                                    value={formData.cost}
                                    onChange={e => setFormData(f => ({ ...f, cost: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Posto / Fornecedor</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Nome do posto"
                                className="pl-9 bg-seguranca-black border-gray-700"
                                value={formData.station}
                                onChange={e => setFormData(f => ({ ...f, station: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            className="bg-seguranca-black border-gray-700"
                            value={formData.notes}
                            onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 border-gray-700">
                        Cancelar
                    </Button>
                    <Button type="submit" className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Salvando...' : 'Registrar'}
                    </Button>
                </div>
            </form>
        </ResponsiveDrawer>
    );
};

export default ArlaRecordModal;
