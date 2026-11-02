import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calculator, Save, Loader2, Moon, CheckCircle2 } from 'lucide-react';
import driverHourService, { DriverWorkHour } from '@/services/driverHourService';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';

interface DriverHourFormModalProps {
    open: boolean;
    onClose: () => void;
    selectedHour?: DriverWorkHour;
}

const DriverHourFormModal: React.FC<DriverHourFormModalProps> = ({ open, onClose, selectedHour }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<Partial<DriverWorkHour>>({
        referenceDate: new Date().toISOString().split('T')[0],
        waitMinutes: 0,
        notes: '',
        isClosed: false,
    });

    useEffect(() => {
        if (selectedHour) {
            setFormData({ ...selectedHour });
        } else {
            setFormData({
                referenceDate: new Date().toISOString().split('T')[0],
                waitMinutes: 0,
                notes: '',
                isClosed: false,
            });
        }
    }, [selectedHour, open]);

    const mutation = useMutation({
        mutationFn: (data: Partial<DriverWorkHour>) => driverHourService.saveJornada(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driverHours'] });
            toast.success('Jornada salva com sucesso!');
            onClose();
        },
        onError: () => {
            toast.error('Erro ao salvar jornada.');
        }
    });

    const handleSave = () => {
        mutation.mutate(formData);
    };

    const formatInputDateTime = (val?: string) => {
        if (!val) return '';
        if (val.length >= 16) return val.substring(0, 16);
        return val;
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="text-seguranca-yellow" />
                        {selectedHour ? 'Editar Jornada do Motorista' : 'Nova Jornada Motorista'}
                        {formData.source && (
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 border border-gray-700 text-gray-300 font-normal">
                                Origem: {formData.source}
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="entry" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-seguranca-black border-gray-600">
                        <TabsTrigger value="entry">Pegadas & Lançamento</TabsTrigger>
                        <TabsTrigger value="calculation">Memória de Cálculo (Lei 13.103 / CLT)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entry" className="space-y-4 mt-4">
                        {/* Top: Motorista e Data */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="driver" className="text-xs text-gray-300">Motorista</Label>
                                <EmployeeCombobox
                                    value={formData.employeeId || ''}
                                    onChange={(val) => setFormData({ ...formData, employeeId: val })}
                                    disabled={!!selectedHour}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="date" className="text-xs text-gray-300">Data de Referência</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="bg-seguranca-black border-gray-600 text-xs h-9"
                                    value={formData.referenceDate || ''}
                                    onChange={(e) => setFormData({ ...formData, referenceDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* As 4 Pegadas */}
                        <div className="bg-seguranca-black/60 p-4 rounded-lg border border-gray-700/70 space-y-3">
                            <h4 className="text-xs font-semibold text-seguranca-yellow uppercase tracking-wider flex items-center gap-1.5">
                                <Clock size={14} /> Turnos de Jornada (Pegadas 1 a 4)
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Pegada 1 */}
                                <div className="p-3 bg-zinc-900/80 rounded border border-gray-700/60 space-y-2">
                                    <span className="text-xs font-bold text-sky-400">1ª Pegada</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Início</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada1Start)}
                                                onChange={(e) => setFormData({ ...formData, pegada1Start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Fim</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada1End)}
                                                onChange={(e) => setFormData({ ...formData, pegada1End: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pegada 2 */}
                                <div className="p-3 bg-zinc-900/80 rounded border border-gray-700/60 space-y-2">
                                    <span className="text-xs font-bold text-sky-400">2ª Pegada</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Início</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada2Start)}
                                                onChange={(e) => setFormData({ ...formData, pegada2Start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Fim</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada2End)}
                                                onChange={(e) => setFormData({ ...formData, pegada2End: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pegada 3 */}
                                <div className="p-3 bg-zinc-900/80 rounded border border-gray-700/60 space-y-2">
                                    <span className="text-xs font-bold text-amber-400">3ª Pegada</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Início</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada3Start)}
                                                onChange={(e) => setFormData({ ...formData, pegada3Start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Fim</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada3End)}
                                                onChange={(e) => setFormData({ ...formData, pegada3End: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Pegada 4 */}
                                <div className="p-3 bg-zinc-900/80 rounded border border-gray-700/60 space-y-2">
                                    <span className="text-xs font-bold text-purple-400">4ª Pegada</span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Início</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada4Start)}
                                                onChange={(e) => setFormData({ ...formData, pegada4Start: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[11px] text-gray-400">Fim</Label>
                                            <Input
                                                type="datetime-local"
                                                className="bg-seguranca-black border-gray-700 text-xs h-8"
                                                value={formatInputDateTime(formData.pegada4End)}
                                                onChange={(e) => setFormData({ ...formData, pegada4End: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Parâmetros adicionais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="wait" className="text-xs text-gray-300">Tempo de Espera (min)</Label>
                                <Input
                                    id="wait"
                                    type="number"
                                    className="bg-seguranca-black border-gray-600 text-xs h-9"
                                    value={formData.waitMinutes || 0}
                                    onChange={(e) => setFormData({ ...formData, waitMinutes: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="isClosed"
                                    checked={Boolean(formData.isClosed)}
                                    onChange={(e) => setFormData({ ...formData, isClosed: e.target.checked })}
                                    className="rounded border-gray-700 bg-seguranca-black w-4 h-4 text-emerald-500"
                                />
                                <Label htmlFor="isClosed" className="text-xs text-gray-300 cursor-pointer">
                                    Marcar jornada como fechada (aprovada para folha)
                                </Label>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="notes" className="text-xs text-gray-300">Observações</Label>
                            <textarea
                                id="notes"
                                className="w-full p-2 bg-seguranca-black border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-seguranca-yellow text-xs"
                                rows={2}
                                value={formData.notes || ''}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="calculation" className="mt-4">
                        <CalculationMemoryPanel selectedHourId={selectedHour?.id} />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-700/60">
                    <Button variant="ghost" onClick={onClose} className="text-seguranca-lightgray hover:bg-seguranca-black">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                        Salvar Registro
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const CalculationMemoryPanel = ({ selectedHourId }: { selectedHourId?: string }) => {
    const { data: memory, isLoading } = useQuery({
        queryKey: ['driverHourMemory', selectedHourId],
        queryFn: () => driverHourService.getCalculationMemory(selectedHourId!),
        enabled: !!selectedHourId
    });

    if (!selectedHourId) {
        return (
            <div className="bg-seguranca-black p-4 rounded-md border border-gray-600 font-mono text-sm text-gray-400 italic">
                A memória de cálculo legal será gerada após salvar o registro.
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin text-seguranca-yellow" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-seguranca-black p-4 rounded-md border border-gray-600 font-mono text-xs overflow-auto max-h-[300px]">
                <h4 className="font-bold text-seguranca-yellow mb-2 flex items-center gap-1.5">
                    <Calculator size={14} /> Log de Processamento Legal (Lei 13.103 & CLT Art. 73)
                </h4>
                <pre className="whitespace-pre-wrap leading-relaxed text-gray-300">{memory?.calculationLog}</pre>
            </div>
            <div className="bg-seguranca-black p-4 rounded-md border border-gray-600 text-xs">
                <h4 className="font-bold text-seguranca-yellow mb-1">Regras e Enquadramento Jurídico</h4>
                <p className="text-gray-300">{memory?.appliedRules}</p>
            </div>
        </div>
    );
};

export default DriverHourFormModal;
