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
        dot: '',
        brand: '',
        model: '',
        size: '',
        status: 'AVAILABLE',
        currentMileage: 0,
        recapCount: 0,
        currentTreadDepth: 14.0,
        initialTreadDepth: 14.0,
        locationNotes: 'Almoxarifado Principal',
        acquisitionCost: 0,
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (tire) {
            setFormData({
                serialNumber: tire.serialNumber || '',
                dot: tire.dot || '',
                brand: tire.brand || '',
                model: tire.model || '',
                size: tire.size || '',
                status: tire.status || 'AVAILABLE',
                currentMileage: tire.currentMileage || 0,
                recapCount: tire.recapCount || 0,
                currentTreadDepth: tire.currentTreadDepth != null ? tire.currentTreadDepth : 14.0,
                initialTreadDepth: tire.initialTreadDepth != null ? tire.initialTreadDepth : 14.0,
                locationNotes: tire.locationNotes || 'Almoxarifado Principal',
                acquisitionCost: tire.acquisitionCost || 0,
            });
        } else {
            setFormData({
                serialNumber: '',
                dot: '',
                brand: '',
                model: '',
                size: '',
                status: 'AVAILABLE',
                currentMileage: 0,
                recapCount: 0,
                currentTreadDepth: 14.0,
                initialTreadDepth: 14.0,
                locationNotes: 'Almoxarifado Principal',
                acquisitionCost: 0,
            });
        }
    }, [tire, isOpen]);

    const mutation = useMutation({
        mutationFn: (data: Partial<Tire>) => {
            if (tire?.id) return tireService.update(tire.id, data);
            return tireService.create(data);
        },
        onSuccess: () => {
            toast({ title: tire ? 'Pneu atualizado com sucesso!' : 'Pneu cadastrado no estoque!' });
            queryClient.invalidateQueries({ queryKey: ['tires'] });
            onSuccess();
        },
        onError: (error: any) => {
            toast({ title: 'Erro ao salvar pneu', description: error.message, variant: 'destructive' });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.serialNumber.trim()) {
            toast({ title: 'Campo Obrigatório', description: 'Informe o Código/Série (DOT/Fogo) do pneu.', variant: 'destructive' });
            return;
        }
        mutation.mutate(formData as any);
    };

    return (
        <ResponsiveDrawer isOpen={isOpen} onClose={onClose} title={tire ? 'Editar Cadastro de Pneu' : 'Cadastrar Pneu no Estoque'}>
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div className="bg-seguranca-black/40 border border-gray-700/60 p-3 rounded-lg text-xs text-gray-300">
                    💡 <strong className="text-seguranca-yellow">Identificação no Estoque:</strong> Cadastre o código de série / fogo do pneu para facilitar a localização e controle de montagem nos veículos.
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="serialNumber" className="text-seguranca-yellow font-semibold">
                            Código / Série (Fogo/DOT) *
                        </Label>
                        <Input
                            id="serialNumber"
                            value={formData.serialNumber}
                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                            required
                            placeholder="Ex: PN-98742 ou DOT 4523"
                            className="bg-seguranca-black border-gray-600 font-mono font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="size">Medida do Pneu *</Label>
                        <Input
                            id="size"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            required
                            className="bg-seguranca-black border-gray-600"
                            placeholder="Ex: 275/80 R22.5"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="brand">Marca *</Label>
                        <Input
                            id="brand"
                            value={formData.brand}
                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            required
                            className="bg-seguranca-black border-gray-600"
                            placeholder="Ex: Michelin, Bridgestone, Goodyear"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="model">Modelo *</Label>
                        <Input
                            id="model"
                            value={formData.model}
                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            required
                            className="bg-seguranca-black border-gray-600"
                            placeholder="Ex: X Multi Z"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status / Situação</Label>
                        <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                            <SelectTrigger className="bg-seguranca-black border-gray-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-600">
                                <SelectItem value="AVAILABLE">📦 Em Estoque (Disponível)</SelectItem>
                                <SelectItem value="IN_USE">🚌 Em Uso (Instalado)</SelectItem>
                                <SelectItem value="RECAP">🔄 Para Recapagem</SelectItem>
                                <SelectItem value="SCRAPPED">🗑️ Sucateado (Descarte)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="currentTreadDepth">Sulco Atual (mm)</Label>
                        <Input
                            id="currentTreadDepth"
                            type="number"
                            step="0.1"
                            value={formData.currentTreadDepth}
                            onChange={(e) => setFormData({ ...formData, currentTreadDepth: Number(e.target.value) })}
                            className="bg-seguranca-black border-gray-600 font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="recapCount">Nº de Recapagens</Label>
                        <Input
                            id="recapCount"
                            type="number"
                            value={formData.recapCount}
                            onChange={(e) => setFormData({ ...formData, recapCount: Number(e.target.value) })}
                            className="bg-seguranca-black border-gray-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="locationNotes">Local de Armazenamento no Estoque</Label>
                        <Input
                            id="locationNotes"
                            value={formData.locationNotes}
                            onChange={(e) => setFormData({ ...formData, locationNotes: e.target.value })}
                            className="bg-seguranca-black border-gray-600"
                            placeholder="Ex: Almoxarifado Garagem - Prateleira B3"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="acquisitionCost">Custo de Aquisição (R$)</Label>
                        <Input
                            id="acquisitionCost"
                            type="number"
                            step="0.01"
                            value={formData.acquisitionCost}
                            onChange={(e) => setFormData({ ...formData, acquisitionCost: Number(e.target.value) })}
                            className="bg-seguranca-black border-gray-600 font-mono"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">
                        Cancelar
                    </Button>
                    <Button type="submit" className="bg-seguranca-red hover:bg-seguranca-darkred font-semibold" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Salvando...' : 'Salvar Pneu'}
                    </Button>
                </div>
            </form>
        </ResponsiveDrawer>
    );
};
