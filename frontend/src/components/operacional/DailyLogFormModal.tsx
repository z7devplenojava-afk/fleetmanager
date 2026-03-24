import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Gauge } from 'lucide-react';
import { DailyLog } from '@/services/dailyLogService';
import { toast } from 'sonner';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';

interface DailyLogFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    log?: DailyLog | null;
    onSave: (data: any) => Promise<void>;
}

const DailyLogFormModal: React.FC<DailyLogFormProps> = ({ open, onOpenChange, log, onSave }) => {
    const [formData, setFormData] = useState<Partial<DailyLog>>({
        date: new Date().toISOString().split('T')[0],
        shift: 'DAY',
        initialKm: 0,
        finalKm: 0,
        discountedKm: 0,
        allowance: 0,
        notes: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (log) {
            setFormData(log);
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
    }, [log, open]);

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        if (!formData.vehicleId) {
            toast.error('Selecione um veículo.');
            return;
        }

        try {
            setIsSaving(true);
            await onSave(formData);
        } catch (error) {
            // Error handling usually done in parent
        } finally {
            setIsSaving(false);
        }
    };

    const totalKm = Math.max(0, (formData.finalKm || 0) - (formData.initialKm || 0));
    const consideredKm = Math.max(0, totalKm - (formData.discountedKm || 0));
    const excessKm = Math.max(0, consideredKm - (formData.allowance || 0));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Gauge className="text-seguranca-yellow" />
                        {log ? 'Editar Parte Diária' : 'Nova Parte Diária'}
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
                                onChange={(e) => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Turno</Label>
                            <Select value={formData.shift} onValueChange={(val) => handleChange('shift', val)}>
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
                        <VehicleCombobox
                            value={formData.vehicleId}
                            onChange={(id) => handleChange('vehicleId', id)}
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
                                onChange={(e) => handleChange('route', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client">Cliente (Opcional)</Label>
                            <Input
                                id="client"
                                className="bg-seguranca-black border-gray-600"
                                placeholder="Cliente..."
                                value={formData.clientId || ''}
                                onChange={(e) => handleChange('clientId', e.target.value)}
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
                                onChange={(e) => handleChange('initialKm', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>KM Final</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.finalKm}
                                onChange={(e) => handleChange('finalKm', parseInt(e.target.value) || 0)}
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
                                onChange={(e) => handleChange('discountedKm', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Franquia (KM)</Label>
                            <Input
                                type="number"
                                className="bg-seguranca-black border-gray-600 text-right"
                                value={formData.allowance}
                                onChange={(e) => handleChange('allowance', parseInt(e.target.value) || 0)}
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
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-gray-400 hover:text-white">Cancelar</Button>
                    <Button onClick={handleSave} className="bg-seguranca-red hover:bg-seguranca-darkred" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Lançamento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLogFormModal;
