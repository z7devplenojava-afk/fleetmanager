import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import tireService, { Tire } from '@/services/tireService';

interface TireFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tire?: Tire | null;
}

export const TireFormModal: React.FC<TireFormModalProps> = ({ isOpen, onClose, onSuccess, tire }) => {
    const [formData, setFormData] = useState({
        serialNumber: '',
        brand: '',
        model: '',
        size: '',
        status: 'AVAILABLE',
        currentMileage: 0,
        recapCount: 0
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (tire) {
            setFormData({
                serialNumber: tire.serialNumber,
                brand: tire.brand,
                model: tire.model,
                size: tire.size,
                status: tire.status,
                currentMileage: tire.currentMileage,
                recapCount: tire.recapCount
            });
        } else {
            setFormData({
                serialNumber: '',
                brand: '',
                model: '',
                size: '',
                status: 'AVAILABLE',
                currentMileage: 0,
                recapCount: 0
            });
        }
    }, [tire, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: Partial<Tire>) => {
            if (tire?.id) return tireService.update(tire.id, data);
            return tireService.create(data);
        },
        onSuccess: () => {
            toast({ title: tire ? "Pneu atualizado!" : "Pneu cadastrado!" });
            queryClient.invalidateQueries({ queryKey: ['tires'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: "Erro ao salvar pneu", variant: "destructive" });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={tire ? "Editar Pneu" : "Novo Pneu"}
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="serialNumber">Série (DOT)</Label>
                        <Input id="serialNumber" value={formData.serialNumber} onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })} required className="bg-seguranca-black border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="size">Medida</Label>
                        <Input id="size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} required className="bg-seguranca-black border-gray-600" placeholder="Ex: 275/80 R22.5" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca</Label>
                        <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required className="bg-seguranca-black border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Modelo</Label>
                        <Input id="model" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} required className="bg-seguranca-black border-gray-600" />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                <SelectItem value="AVAILABLE">Disponível</SelectItem>
                                <SelectItem value="IN_USE">Em Uso</SelectItem>
                                <SelectItem value="RECAP">Para Recapagem</SelectItem>
                                <SelectItem value="SCRAPPED">Descartado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mileage">Km Atual</Label>
                        <Input id="mileage" type="number" value={formData.currentMileage} onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })} className="bg-seguranca-black border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recap">Recapagens</Label>
                        <Input id="recap" type="number" value={formData.recapCount} onChange={(e) => setFormData({ ...formData, recapCount: Number(e.target.value) })} className="bg-seguranca-black border-gray-600" />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">Cancelar</Button>
                    <Button type="submit" className="bg-seguranca-red hover:bg-seguranca-darkred" disabled={mutation.isPending}>
                        {mutation.isPending ? "Salvando..." : "Salvar Pneu"}
                    </Button>
                </div>
            </form>
        </ResponsiveDrawer>
    );
};
