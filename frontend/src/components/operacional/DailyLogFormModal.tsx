import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Gauge, AlertCircle, CheckCircle2, Route } from 'lucide-react';
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
            <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 shadow-2xl">
                <DialogHeader className="border-b border-slate-800 pb-3">
                    <DialogTitle className="flex items-center gap-2 text-white font-bold text-lg">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                            <Gauge className="w-5 h-5" />
                        </div>
                        {log ? 'Editar Parte Diária' : 'Nova Parte Diária'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-xs uppercase text-slate-400 font-semibold">Data da Operação</Label>
                            <Input
                                id="date"
                                type="date"
                                className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500 rounded-xl"
                                value={formData.date}
                                onChange={(e) => handleChange('date', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-400 font-semibold">Turno de Operação</Label>
                            <Select value={formData.shift} onValueChange={(val) => handleChange('shift', val)}>
                                <SelectTrigger className="bg-slate-950 border-slate-700 text-white focus:border-emerald-500 rounded-xl">
                                    <SelectValue placeholder="Selecione o turno" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    <SelectItem value="DAY">Diurno</SelectItem>
                                    <SelectItem value="NIGHT">Noturno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs uppercase text-slate-400 font-semibold">Veículo / Placa</Label>
                        <VehicleCombobox
                            value={formData.vehicleId}
                            onChange={(id) => handleChange('vehicleId', id)}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="route" className="text-xs uppercase text-slate-400 font-semibold">Rota / Trajeto</Label>
                            <Input
                                id="route"
                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 rounded-xl"
                                placeholder="Ex: Rota Ibirité - BH"
                                value={formData.route || ''}
                                onChange={(e) => handleChange('route', e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="client" className="text-xs uppercase text-slate-400 font-semibold">Cliente (Opcional)</Label>
                            <Input
                                id="client"
                                className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-emerald-500 rounded-xl"
                                placeholder="Nome do cliente..."
                                value={formData.clientId || ''}
                                onChange={(e) => handleChange('clientId', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Bloco de Leitura de Odômetro */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <p className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                            <Route className="w-4 h-4" /> Apuração do Odômetro
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">KM Inicial</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700 text-white font-mono text-right focus:border-emerald-500 rounded-xl"
                                    value={formData.initialKm}
                                    onChange={(e) => handleChange('initialKm', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-400">KM Final</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700 text-white font-mono text-right focus:border-emerald-500 rounded-xl"
                                    value={formData.finalKm}
                                    onChange={(e) => handleChange('finalKm', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-emerald-400 font-semibold">Total Percorrido</Label>
                                <div className="h-10 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-end px-3 font-mono text-lg font-bold text-emerald-400">
                                    {totalKm.toLocaleString('pt-BR')} km
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-400 font-semibold">KM Descontado</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700 text-white font-mono text-right focus:border-emerald-500 rounded-xl"
                                value={formData.discountedKm}
                                onChange={(e) => handleChange('discountedKm', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-400 font-semibold">Franquia do Contrato (KM)</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700 text-white font-mono text-right focus:border-emerald-500 rounded-xl"
                                value={formData.allowance}
                                onChange={(e) => handleChange('allowance', parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {excessKm > 0 ? (
                        <div className="bg-red-950/40 border border-red-500/50 p-3 rounded-xl flex justify-between items-center">
                            <span className="text-red-400 font-bold uppercase text-xs tracking-wider flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" /> Excesso de Franquia Detectado
                            </span>
                            <span className="text-red-400 font-mono font-bold text-lg">+{excessKm.toLocaleString('pt-BR')} km</span>
                        </div>
                    ) : (
                        <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl flex justify-between items-center">
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" /> Rodagem dentro do limite da franquia
                            </span>
                            <span className="text-emerald-400 font-mono font-bold text-sm">OK</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-800 pt-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold" disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Parte Diária
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLogFormModal;

