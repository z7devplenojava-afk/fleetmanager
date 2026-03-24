import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Gauge } from 'lucide-react';
import dailyLogService, { DailyLog } from '@/services/dailyLogService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox'; // Assuming this exists or similar

interface DailyLogFormProps {
    open: boolean;
    onClose: () => void;
    selectedLog?: DailyLog;
}

const DailyLogForm: React.FC<DailyLogFormProps> = ({ open, onClose, selectedLog }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<DailyLog>>({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        initialKm: 0,
        finalKm: 0,
        discountedKm: 0,
        allowance: 0,
        notes: ''
    });

    useEffect(() => {
        if (selectedLog) {
            setFormData(selectedLog);
        } else {
            setFormData({
                date: new Date().toISOString().split('T')[0],
                shift: 'DAY',
                initialKm: 0,
                finalKm: 0,
                discountedKm: 0,
                allowance: 0,
                notes: ''
            });
        }
    }, [selectedLog, open]);

    const mutation = useMutation({
        mutationFn: (data: Partial<DailyLog>) => dailyLogService.save(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dailyLogs'] });
            toast.success('Parte Diária salva com sucesso!');
            onClose();
        },
        onError: () => {
            toast.error('Erro ao salvar Parte Diária.');
        }
    });

    const handleSave = () => {
        if (!formData.vehicleId) {
            toast.error('Selecione um veículo.');
            return;
        }
        mutation.mutate(formData);
    };

    // Calculate derived metrics for display
    const totalKm = Math.max(0, (formData.finalKm || 0) - (formData.initialKm || 0));
    const consideredKm = Math.max(0, totalKm - (formData.discountedKm || 0));
    const excessKm = Math.max(0, consideredKm - (formData.allowance || 0));

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gauge className="text-seguranca-yellow" />
                        {selectedLog ? 'Editar Parte Diária' : 'Nova Parte Diária'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                className="bg-seguranca-black border-gray-600"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Turno</Label>
                            <Select value={formData.shift} onValueChange={(val) => setFormData({ ...formData, shift: val })}>
                                <SelectTrigger className="bg-seguranca-black border-gray-600">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent className="bg-seguranca-black border-gray-600">
                                    <SelectItem value="DAY">Diurno</SelectItem>
                                    <SelectItem value="NIGHT">Noturno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Veículo</Label>
                        {/* Assuming VehicleCombobox exists, otherwise simple input or fetch */}
                        <VehicleCombobox
                            value={formData.vehicleId}
                            onChange={(id) => setFormData({ ...formData, vehicleId: id })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="route">Rota</Label>
                            <Input
                                id="route"
                                className="bg-seguranca-black border-gray-600"
                                placeholder="Ex: Rota 01"
                                value={formData.route || ''}
                                onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client">Cliente (Opcional)</Label>
                            {/* Future: ClientCombobox */}
                            <Input
                                id="client"
                                className="bg-seguranca-black border-gray-600"
                                placeholder="Cliente..."
                                value={formData.clientId || ''} // clientId might need to be just a string 'client' name for now if backend expects Object
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} // Simplification
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-gray-700 rounded-md bg-seguranca-black/30">
                        <div className="space-y-2">
                            <Label>KM Inicial</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.initialKm}
                                onChange={(e) => setFormData({ ...formData, initialKm: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>KM Final</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.finalKm}
                                onChange={(e) => setFormData({ ...formData, finalKm: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-seguranca-yellow font-bold">Total Percorrido</Label>
                            <div className="h-10 flex items-center justify-end px-3 font-mono text-xl font-bold border-b border-gray-600">
                                {totalKm} km
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>KM Descontado</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.discountedKm}
                                onChange={(e) => setFormData({ ...formData, discountedKm: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Franquia (KM)</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.allowance}
                                onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {excessKm > 0 && (
                        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded flex justify-between items-center animate-pulse">
                            <span className="text-red-400 font-bold uppercase text-xs tracking-wider">Limite Excedido</span>
                            <span className="text-red-400 font-mono font-bold text-lg">+{excessKm} km</span>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-seguranca-red hover:bg-seguranca-darkred" disabled={mutation.isPending}>
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Lançamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLogForm;
