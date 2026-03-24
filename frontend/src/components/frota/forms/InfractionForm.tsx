import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, DollarSign, FileText, MapPin, Calendar, CheckSquare, Save, Loader2, PlusCircle } from 'lucide-react';
import { InfractionFormData } from './types';
import { Vehicle } from '@/types/fleet';
import { Driver } from '@/types/driver';

interface InfractionFormProps {
    initialData?: Partial<InfractionFormData>;
    onSubmit: (data: InfractionFormData) => void;
    isLoading: boolean;
    vehicles: Vehicle[];
    drivers: Driver[];
    onOpenDriverModal?: () => void;
    submitLabel?: string;
}

const DEFAULT_FORM_DATA: InfractionFormData = {
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    type: '',
    points: 0,
    location: '',
    amount: 0,
    status: 'pendente',
    notes: '',
    file: null
};

export const InfractionForm: React.FC<InfractionFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    vehicles,
    drivers,
    onOpenDriverModal,
    submitLabel = 'Salvar Multa'
}) => {
    const [formData, setFormData] = useState<InfractionFormData>(DEFAULT_FORM_DATA);
    const [currentTab, setCurrentTab] = useState('details');

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleInputChange = (field: keyof InfractionFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const veiculosAtivos = vehicles; // Assuming parent filters or we show all? 
    // Usually we show all or just active. Let's show all for now or filter consistently.
    // MultaFormModal filtered status. Let's stick with received list for flexibility.

    const tiposInfracao = [
        'Excesso de Velocidade',
        'Avanço de Sinal Vermelho',
        'Estacionamento Irregular',
        'Dirigir sem CNH',
        'Veículo sem Documentação',
        'Ultrapassagem Irregular',
        'Não Uso do Cinto de Segurança',
        'Uso de Celular ao Volante',
        'Dirigir Sob Influência',
        'Outros'
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-seguranca-darkgray">
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-800/50 p-1 flex-none">
                        <TabsTrigger value="details" className="data-[state=active]:bg-red-600 data-[state=active]:text-white flex gap-2 items-center">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="hidden sm:inline">Detalhes</span>
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex gap-2 items-center">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Financeiro</span>
                        </TabsTrigger>
                        <TabsTrigger value="others" className="data-[state=active]:bg-gray-600 data-[state=active]:text-white flex gap-2 items-center">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Outros</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* --- DETAILS TAB --- */}
                    <TabsContent value="details" className="mt-0 space-y-6">
                        <div className="space-y-6">

                            {/* Vehicle */}
                            <div className="space-y-2">
                                <Label htmlFor="vehicleId" className="text-gray-300 font-medium">Veículo *</Label>
                                <Select value={formData.vehicleId} onValueChange={(val) => handleInputChange('vehicleId', val)}>
                                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                        <SelectValue placeholder="Selecione o veículo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-600">
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Driver */}
                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Motorista</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.driverId || ''} onValueChange={(val) => handleInputChange('driverId', val)}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white w-full">
                                            <SelectValue placeholder="Selecione o motorista (opcional)" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {drivers.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {onOpenDriverModal && (
                                        <Button type="button" variant="outline" onClick={onOpenDriverModal} className="border-gray-600 text-gray-300">
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Type, Points, Location */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Tipo *</Label>
                                    <Select value={formData.type} onValueChange={(val) => handleInputChange('type', val)}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {tiposInfracao.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Pontos</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="20"
                                        value={formData.points}
                                        onChange={(e) => handleInputChange('points', Number(e.target.value))}
                                        className="bg-gray-900/50 border-gray-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Local *</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                        className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                                        placeholder="Endereço ou rodovia..."
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- FINANCIAL TAB --- */}
                    <TabsContent value="financial" className="mt-0 space-y-6">
                        <div className="space-y-6">

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Valor (R$) *</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                                        className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Data da Infração *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => handleInputChange('date', e.target.value)}
                                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Data de Vencimento *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => handleInputChange('dueDate', e.target.value)}
                                            className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- OTHERS TAB --- */}
                    <TabsContent value="others" className="mt-0 space-y-6">
                        <div className="space-y-6">

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Status</Label>
                                <Select value={formData.status} onValueChange={(val) => handleInputChange('status', val)}>
                                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-600">
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="paga">Paga</SelectItem>
                                        <SelectItem value="vencida">Vencida</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Observações</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Anexo</Label>
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-900/30 hover:border-blue-500 transition-colors">
                                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleInputChange('file', e.target.files?.[0] || null)}
                                        className="bg-transparent border-none text-white file:text-blue-400 file:bg-gray-800 file:rounded-md file:border-0 file:px-2 file:py-1 cursor-pointer"
                                    />
                                    {formData.file && <p className="text-xs text-green-400 mt-2">{formData.file.name}</p>}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex-none p-6 pt-4 border-t border-gray-700 flex justify-end gap-3 bg-seguranca-darkgray">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {submitLabel}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};
