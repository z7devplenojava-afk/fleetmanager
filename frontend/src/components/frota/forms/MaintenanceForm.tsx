import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Wrench, DollarSign, FileText, AlertTriangle, Save, Loader2, X, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { MaintenanceFormData } from './types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { Vehicle } from '@/types/fleet';
import { Supplier } from '@/services/contasAPagarService';

interface MaintenanceFormProps {
    initialData?: Partial<MaintenanceFormData>;
    onSubmit: (data: MaintenanceFormData) => void;
    isLoading: boolean;
    vehicles: Vehicle[];
    suppliers: Supplier[];
    onOpenSupplierModal: () => void;
    submitLabel?: string;
    isEditMode?: boolean;
}

const DEFAULT_FORM_DATA: MaintenanceFormData = {
    vehicleId: '',
    date: new Date(),
    maintenanceType: '',
    description: '',
    cost: 0,
    provider: '',
    mileage: 0,
    status: 'SCHEDULED',
    priority: 'MEDIUM',
    notes: '',
    files: null,
    existingPhotos: [],
    removedPhotos: [],
    existingDocuments: [],
    removedDocuments: []
};

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    vehicles,
    suppliers,
    onOpenSupplierModal,
    submitLabel = 'Salvar Manutenção',
    isEditMode = false
}) => {
    const [formData, setFormData] = useState<MaintenanceFormData>(DEFAULT_FORM_DATA);
    const [currentTab, setCurrentTab] = useState('details');

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData
            }));
        }
    }, [initialData]);

    const handleInputChange = (field: keyof MaintenanceFormData, value: any) => {
        if (field === 'mileage' || field === 'cost') {
            // Basic number validation could go here if needed, but Input type=number helps
            // Just ensure it's treated as number if string comes in
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Helper for photos removal in Edit Mode
    const handleRemoveExistingPhoto = (photoUrl: string) => {
        setFormData(prev => ({
            ...prev,
            removedPhotos: [...(prev.removedPhotos || []), photoUrl]
        }));
    };

    // Restore photo
    const handleRestorePhoto = (photoUrl: string) => {
        setFormData(prev => ({
            ...prev,
            removedPhotos: prev.removedPhotos?.filter(p => p !== photoUrl) || []
        }));
    };

    const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

    const TIPOS_MANUTENCAO = [
        { value: 'PREVENTIVE', label: 'Preventiva' },
        { value: 'CORRECTIVE', label: 'Corretiva' },
        { value: 'PREDICTIVE', label: 'Preditiva' },
        { value: 'IMPROVEMENT', label: 'Melhoria' },
        { value: 'OTHER', label: 'Outro' }
    ];

    const STATUS_MANUTENCAO = [
        { value: 'SCHEDULED', label: 'Agendada' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'COMPLETED', label: 'Concluída' },
        { value: 'CANCELLED', label: 'Cancelada' }
    ];

    const PRIORIDADES = [
        { value: 'LOW', label: 'Baixa' },
        { value: 'MEDIUM', label: 'Média' },
        { value: 'HIGH', label: 'Alta' },
        { value: 'URGENT', label: 'Urgente' }
    ];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-800/50 p-1 flex-none">
                        <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2 items-center">
                            <FileText className="h-4 w-4" />
                            <span className="hidden sm:inline">Detalhes</span>
                        </TabsTrigger>
                        <TabsTrigger value="costs" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex gap-2 items-center">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Custos e Fornecedor</span>
                        </TabsTrigger>
                        <TabsTrigger value="attachments" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white flex gap-2 items-center">
                            <ImageIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">Anexos</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* --- TAB: DETALHES --- */}
                    <TabsContent value="details" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div className="space-y-6">

                            {/* Veículo */}
                            <div className="space-y-2">
                                <Label htmlFor="vehicleId" className="text-gray-300 font-medium">Veículo *</Label>
                                <Select
                                    value={formData.vehicleId}
                                    onValueChange={(value) => handleInputChange('vehicleId', value)}
                                >
                                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                        <SelectValue placeholder="Selecione um veículo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-600">
                                        {vehicles.map((v) => (
                                            <SelectItem key={v.id} value={v.id}>
                                                {v.plate} - {v.brand} {v.model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedVehicle && (
                                    <div className="text-xs text-gray-400 mt-1 bg-gray-900/50 p-2 rounded">
                                        {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year}) -
                                        KM Atual: {selectedVehicle.currentMileage}
                                    </div>
                                )}
                            </div>

                            {/* Data e Tipo */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Data *</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 z-10" />
                                        <DatePicker
                                            selected={formData.date}
                                            onChange={(date) => handleInputChange('date', date)}
                                            {...DEFAULT_DATE_PICKER_PROPS}
                                            locale={ptBR}
                                            className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white h-10 rounded-md focus:border-blue-500"
                                            placeholderText="Selecione a data"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Tipo *</Label>
                                    <Select
                                        value={formData.maintenanceType}
                                        onValueChange={(value) => handleInputChange('maintenanceType', value)}
                                    >
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {TIPOS_MANUTENCAO.map(t => (
                                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-gray-300 font-medium">Descrição *</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Descreva o serviço..."
                                    className="bg-gray-900/50 border-gray-600 text-white min-h-[100px]"
                                />
                            </div>

                            {/* Status e Prioridade */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => handleInputChange('status', value)}
                                    >
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {STATUS_MANUTENCAO.map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Prioridade</Label>
                                    <Select
                                        value={formData.priority}
                                        onValueChange={(value) => handleInputChange('priority', value)}
                                    >
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {PRIORIDADES.map(p => (
                                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Quilometragem na manutenção */}
                            <div className="space-y-2">
                                <Label htmlFor="mileage" className="text-gray-300 font-medium">KM na Manutenção</Label>
                                <Input
                                    id="mileage"
                                    type="number"
                                    value={formData.mileage}
                                    onChange={(e) => handleInputChange('mileage', e.target.value)}
                                    className="bg-gray-900/50 border-gray-600 text-white"
                                />
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- TAB: CUSTOS --- */}
                    <TabsContent value="costs" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div className="space-y-6">

                            {/* Custo */}
                            <div className="space-y-2">
                                <Label htmlFor="cost" className="text-gray-300 font-medium">Custo Total (R$)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="cost"
                                        type="number"
                                        step="0.01"
                                        value={formData.cost}
                                        onChange={(e) => handleInputChange('cost', e.target.value)}
                                        className="pl-10 bg-gray-900/50 border-gray-600 text-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {/* Fornecedor */}
                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Fornecedor</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Select
                                            value={formData.provider}
                                            onValueChange={(value) => handleInputChange('provider', value)}
                                        >
                                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                                <SelectValue placeholder="Selecione um fornecedor" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-gray-600">
                                                {suppliers.map(s => (
                                                    <SelectItem key={s.id} value={s.name}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={onOpenSupplierModal}
                                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                                        title="Novo Fornecedor"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- TAB: ANEXOS --- */}
                    <TabsContent value="attachments" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div className="space-y-6">

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Observações Adicionais</Label>
                                <Textarea
                                    value={formData.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    placeholder="Notas extras..."
                                    className="bg-gray-900/50 border-gray-600 text-white"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-gray-300 font-medium">Fotos e Documentos</Label>
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-900/30 hover:border-blue-500 transition-colors">
                                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                    <Input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleInputChange('files', e.target.files)}
                                        className="bg-transparent border-none text-white file:text-blue-400 file:bg-gray-800 file:rounded-md file:border-0 file:px-2 file:py-1 cursor-pointer"
                                    />
                                </div>

                                {/* Preview de fotos existentes em Edição */}
                                {isEditMode && formData.existingPhotos && formData.existingPhotos.length > 0 && (
                                    <div className="grid grid-cols-4 gap-4 mt-4">
                                        {formData.existingPhotos.map((photo, idx) => {
                                            const isRemoved = formData.removedPhotos?.includes(photo);
                                            return (
                                                <div key={idx} className={`relative group border border-gray-700 rounded overflow-hidden aspect-square ${isRemoved ? 'opacity-40' : ''}`}>
                                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500 break-all p-1">
                                                        {/* Placeholder image logic since we have URLs */}
                                                        <img src={photo} alt="attachment" className="w-full h-full object-cover"
                                                            onError={(e) => { (e.target as HTMLImageElement).src = 'placeholder-image-url' }} // Simple fallback
                                                        />
                                                    </div>
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        {isRemoved ? (
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRestorePhoto(photo)} className="text-green-400 hover:text-green-300"><PlusCircle /></Button>
                                                        ) : (
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveExistingPhoto(photo)} className="text-red-400 hover:text-red-300"><X /></Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex-none p-6 pt-4 border-t border-gray-700 flex justify-end gap-3 bg-seguranca-darkgray">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
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
