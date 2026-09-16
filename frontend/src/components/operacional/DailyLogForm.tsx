import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2, Gauge, AlertCircle, CheckCircle2, Route, Calendar, Clock, Car, MapPin, UserCheck, ShieldAlert } from 'lucide-react';
import dailyLogService, { DailyLog } from '@/services/dailyLogService';
import { clientService, Client } from '@/services/clientService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';

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
    const [clients, setClients] = useState<Client[]>([]);

    useEffect(() => {
        if (open) {
            loadClients();
        }
    }, [open]);

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

    const loadClients = async () => {
        try {
            const data = await clientService.getAllClients();
            setClients(data || []);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

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
            <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl rounded-2xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 space-y-4">
                <DialogHeader className="border-b border-slate-800/80 pb-3.5">
                    <DialogTitle className="flex items-center gap-2.5 text-white font-extrabold text-base sm:text-lg">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shadow-md">
                            <Gauge className="w-5 h-5" />
                        </div>
                        <span>{selectedLog ? 'Editar Parte Diária' : 'Nova Parte Diária'}</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-400 mt-1">
                        Preencha os dados da operação diária do veículo e apuração de quilometragem.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4">
                    {/* Data e Turno */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                Data da Operação
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                className="bg-slate-950 border-slate-700/80 text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm [color-scheme:dark] shadow-inner"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                Turno de Operação
                            </Label>
                            <Select value={formData.shift} onValueChange={(val) => setFormData({ ...formData, shift: val })}>
                                <SelectTrigger className="bg-slate-950 border-slate-700/80 text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm shadow-inner">
                                    <SelectValue placeholder="Selecione o turno" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white">
                                    <SelectItem value="DAY">☀️ Diurno</SelectItem>
                                    <SelectItem value="NIGHT">🌙 Noturno</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Cliente & Veículo / Placa em Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Seleção de Cliente da Tabela de Clientes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                Cliente (Alocação)
                            </Label>
                            <Select
                                value={formData.clientId || 'ALL'}
                                onValueChange={(val) => {
                                    const selectedId = val === 'ALL' ? undefined : val;
                                    setFormData({ ...formData, clientId: selectedId });
                                }}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-700/80 text-white font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm shadow-inner">
                                    <SelectValue placeholder="Selecione um cliente..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[220px]">
                                    <SelectItem value="ALL">🏢 Todos os Clientes (Sem Filtro)</SelectItem>
                                    {clients.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Veículo / Placa Filtrado por Cliente */}
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                                <Car className="w-3.5 h-3.5 text-amber-400" />
                                Veículo / Placa
                            </Label>
                            <VehicleCombobox
                                value={formData.vehicleId}
                                clientId={formData.clientId}
                                onChange={(id, selectedVehicle) => {
                                    const vClientId = selectedVehicle?.clientId || selectedVehicle?.client?.id;
                                    setFormData(prev => ({
                                        ...prev,
                                        vehicleId: id,
                                        clientId: prev.clientId || vClientId
                                    }));
                                }}
                            />
                        </div>
                    </div>

                    {/* Rota / Trajeto */}
                    <div className="space-y-1.5">
                        <Label htmlFor="route" className="text-xs uppercase text-slate-300 font-semibold tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            Rota / Trajeto
                        </Label>
                        <Input
                            id="route"
                            className="bg-slate-950 border-slate-700/80 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 text-sm font-medium shadow-inner"
                            placeholder="Ex: Rota 01"
                            value={formData.route || ''}
                            onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                        />
                    </div>

                    {/* Bloco de Leitura de Odômetro */}
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3.5 shadow-inner">
                        <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                                <Route className="w-4 h-4 text-amber-400" /> Apuração do Odômetro
                            </span>
                            <span className="text-[11px] text-slate-400">Leitura Automática</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-medium">KM Inicial</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                    value={formData.initialKm}
                                    onChange={(e) => setFormData({ ...formData, initialKm: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-slate-300 font-medium">KM Final</Label>
                                <Input
                                    type="number"
                                    className="bg-slate-900 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                    value={formData.finalKm}
                                    onChange={(e) => setFormData({ ...formData, finalKm: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-emerald-400 font-bold">Total Percorrido</Label>
                                <div className="h-10 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-end px-3 font-mono text-base font-extrabold text-emerald-400 shadow-sm">
                                    {totalKm.toLocaleString('pt-BR')} km
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Descontos e Franquia */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider">KM Descontado</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                value={formData.discountedKm}
                                onChange={(e) => setFormData({ ...formData, discountedKm: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-slate-300 font-semibold tracking-wider">Franquia do Contrato (KM)</Label>
                            <Input
                                type="number"
                                className="bg-slate-950 border-slate-700/80 text-white font-mono font-semibold text-right focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl h-10 px-3 shadow-inner"
                                value={formData.allowance}
                                onChange={(e) => setFormData({ ...formData, allowance: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {/* Status de Franquia */}
                    {excessKm > 0 ? (
                        <div className="bg-red-950/50 border border-red-500/50 p-3.5 rounded-xl flex flex-wrap justify-between items-center gap-2 shadow-inner">
                            <span className="text-red-400 font-bold uppercase text-xs tracking-wider flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4" /> Excesso de Franquia Detectado
                            </span>
                            <span className="text-red-400 font-mono font-extrabold text-base">+{excessKm.toLocaleString('pt-BR')} km</span>
                        </div>
                    ) : (
                        <div className="bg-emerald-950/40 border border-emerald-500/40 p-3 rounded-xl flex justify-between items-center shadow-inner">
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Rodagem dentro do limite da franquia
                            </span>
                            <span className="text-emerald-400 font-mono font-bold text-xs bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40">OK</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="border-t border-slate-800/80 pt-3.5 flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="w-full sm:w-auto border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10 font-medium px-4 transition-all"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl h-10 px-5 shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        <span>Salvar Parte Diária</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DailyLogForm;
