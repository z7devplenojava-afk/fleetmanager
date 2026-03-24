import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Calculator, Save, X, Loader2 } from 'lucide-react';
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
    const [formData, setFormData] = useState<Partial<DriverWorkHour>>(
        selectedHour || {
            referenceDate: new Date().toISOString().split('T')[0],
            startTime: '',
            endTime: '',
            waitMinutes: 0,
            notes: '',
        }
    );

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

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="text-seguranca-yellow" />
                        {selectedHour ? 'Editar Jornada' : 'Nova Jornada Motorista'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="entry" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-seguranca-black border-gray-600">
                        <TabsTrigger value="entry">Lançamento</TabsTrigger>
                        <TabsTrigger value="calculation">Memória de Cálculo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="entry" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Data de Referência</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    className="bg-seguranca-black border-gray-600"
                                    value={formData.referenceDate}
                                    onChange={(e) => setFormData({ ...formData, referenceDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="driver">Motorista</Label>
                                <EmployeeCombobox
                                    value={formData.employeeId || ''}
                                    onChange={(val) => setFormData({ ...formData, employeeId: val })}
                                    disabled={!!selectedHour}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Início da Jornada</Label>
                                <Input
                                    id="start"
                                    type="datetime-local"
                                    className="bg-seguranca-black border-gray-600"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Fim da Jornada</Label>
                                <Input
                                    id="end"
                                    type="datetime-local"
                                    className="bg-seguranca-black border-gray-600"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wait">Tempo de Espera (min)</Label>
                                <Input
                                    id="wait"
                                    type="number"
                                    className="bg-seguranca-black border-gray-600"
                                    value={formData.waitMinutes}
                                    onChange={(e) => setFormData({ ...formData, waitMinutes: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações</Label>
                            <textarea
                                id="notes"
                                className="w-full p-2 bg-seguranca-black border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-seguranca-yellow"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="calculation" className="mt-4">
                        <CalculationMemoryPanel selectedHourId={selectedHour?.id} />
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="ghost" onClick={onClose} className="text-seguranca-lightgray hover:bg-seguranca-black">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-seguranca-red hover:bg-seguranca-darkred"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={16} />}
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
                A memória de cálculo será gerada após salvar o registro.
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
                <h4 className="font-bold text-seguranca-yellow mb-2">Log de Processamento (Backend)</h4>
                <pre className="whitespace-pre-wrap">{memory?.calculationLog}</pre>
            </div>
            <div className="bg-seguranca-black p-4 rounded-md border border-gray-600 text-xs">
                <h4 className="font-bold text-seguranca-yellow mb-2">Regras Aplicadas</h4>
                <p>{memory?.appliedRules}</p>
            </div>
        </div>
    );
};

export default DriverHourFormModal;
