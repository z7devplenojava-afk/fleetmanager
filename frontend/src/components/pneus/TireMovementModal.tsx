import React, { useState } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import tireService, { Tire, TireMovement } from '@/services/tireService';
import fleetService from '@/services/fleetService';

interface TireMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    tire: Tire | null;
}

export const TireMovementModal: React.FC<TireMovementModalProps> = ({ isOpen, onClose, onSuccess, tire }) => {
    const [formData, setFormData] = useState({
        type: 'INSTALLATION',
        vehicleId: '',
        position: 'SPARE',
        mileage: 0,
        notes: '',
        movementDate: new Date().toISOString().split('T')[0]
    });

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
        enabled: isOpen
    });

    const mutation = useMutation({
        mutationFn: (data: Partial<TireMovement>) => tireService.registerMovement({ ...data, tireId: tire?.id }),
        onSuccess: () => {
            toast({ title: "Movimentação registrada!" });
            queryClient.invalidateQueries({ queryKey: ['tires'] });
            onSuccess();
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData as any);
    };

    if (!tire) return null;

    return (
        <ResponsiveDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={`Movimentação - ${tire.serialNumber}`}
        >
            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                <div className="space-y-2">
                    <Label>Tipo de Movimentação</Label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                        <SelectTrigger className="bg-seguranca-black border-gray-600">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-seguranca-graphite border-gray-600">
                            <SelectItem value="INSTALLATION">Instalação no Veículo</SelectItem>
                            <SelectItem value="REMOVAL">Remoção do Veículo</SelectItem>
                            <SelectItem value="ROTATION">Rodízio</SelectItem>
                            <SelectItem value="RECAP_SEND">Enviar para Recapagem</SelectItem>
                            <SelectItem value="RECAP_RETURN">Retorno de Recapagem</SelectItem>
                            <SelectItem value="SCRAP">Descarte (Sucatear)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {(formData.type === 'INSTALLATION' || formData.type === 'ROTATION') && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Veículo</Label>
                            <Select value={formData.vehicleId} onValueChange={(val) => setFormData({ ...formData, vehicleId: val })}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    {vehicles.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Posição</Label>
                            <Select value={formData.position} onValueChange={(val) => setFormData({ ...formData, position: val })}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-graphite border-gray-600">
                                    <SelectItem value="FRONT_LEFT">Dianteiro Esquerdo</SelectItem>
                                    <SelectItem value="FRONT_RIGHT">Dianteiro Direito</SelectItem>
                                    <SelectItem value="REAR_LEFT_INTERNAL">Tras. Esq. Interno</SelectItem>
                                    <SelectItem value="REAR_LEFT_EXTERNAL">Tras. Esq. Externo</SelectItem>
                                    <SelectItem value="REAR_RIGHT_INTERNAL">Tras. Dir. Interno</SelectItem>
                                    <SelectItem value="REAR_RIGHT_EXTERNAL">Tras. Dir. Externo</SelectItem>
                                    <SelectItem value="SPARE">Estepe</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <Input type="date" value={formData.movementDate} onChange={(e) => setFormData({ ...formData, movementDate: e.target.value })} className="bg-seguranca-black border-gray-600" />
                    </div>
                    <div className="space-y-2">
                        <Label>Km do Veículo / Pneu</Label>
                        <Input type="number" value={formData.mileage} onChange={(e) => setFormData({ ...formData, mileage: Number(e.target.value) })} className="bg-seguranca-black border-gray-600" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-seguranca-black border-gray-600 min-h-[80px]" />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} className="border-gray-600">Cancelar</Button>
                    <Button type="submit" className="bg-seguranca-red hover:bg-seguranca-darkred" disabled={mutation.isPending}>
                        Confirmar Movimentação
                    </Button>
                </div>
            </form>
        </ResponsiveDrawer>
    );
};
