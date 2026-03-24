import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Building, DollarSign, Wrench, Save, Loader2, FileText, ImageIcon, X, Trash2, RefreshCw } from 'lucide-react';
import { VehicleFormData } from './types';
import { VehicleGeneralInfo } from './sections/VehicleGeneralInfo';
import { VehicleAllocationInfo } from './sections/VehicleAllocationInfo';
import { VehicleFinancialInfo } from './sections/VehicleFinancialInfo';
import { VehicleMaintenanceInfo } from './sections/VehicleMaintenanceInfo';
import { Textarea } from '@/components/ui/textarea';

interface VehicleFormProps {
    initialData?: Partial<VehicleFormData>;
    onSubmit: (data: VehicleFormData) => void;
    isLoading: boolean;
    submitLabel?: string;
    isEditMode?: boolean;
}

const DEFAULT_FORM_DATA: VehicleFormData = {
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    cor: '',
    combustivel: 'FLEX',
    quilometragem: 0,
    status: 'ACTIVE',
    capacidade: 5,
    postoDeTrabalho: '',
    departamento: '',
    departmentId: '',
    empresa: '',
    empresaId: '',
    responsavel: '',
    dataManutencao: null,
    proximaManutencao: null,
    vencimentoSeguro: null,
    vencimentoDocumentacao: null,
    data_aquisicao: null,
    valor_aquisicao: 0,
    observacoes: '',
    fotos: null,
    existingPhotos: [],
    photosToDelete: new Set()
};

export const VehicleForm: React.FC<VehicleFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    submitLabel = 'Salvar Veículo',
    isEditMode = false
}) => {
    const [formData, setFormData] = useState<VehicleFormData>(DEFAULT_FORM_DATA);
    const [currentTab, setCurrentTab] = useState('general');

    // Load initial data
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                ...initialData,
                // Ensure sets are initialized correctly
                photosToDelete: initialData.photosToDelete || new Set()
            }));
        }
    }, [initialData]);

    const handleInputChange = (field: keyof VehicleFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Photo handlers for Edit Mode
    const handleDeleteExistingPhoto = (photoName: string) => {
        if (!formData.photosToDelete) return;

        const newPhotosToDelete = new Set(formData.photosToDelete);
        newPhotosToDelete.add(photoName);

        handleInputChange('photosToDelete', newPhotosToDelete);
    };

    const handleRestorePhoto = (photoName: string) => {
        if (!formData.photosToDelete) return;

        const newPhotosToDelete = new Set(formData.photosToDelete);
        newPhotosToDelete.delete(photoName);

        handleInputChange('photosToDelete', newPhotosToDelete);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-800/50 p-1 flex-none">
                        <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2 items-center">
                            <Car className="h-4 w-4" />
                            <span className="hidden sm:inline">Geral</span>
                        </TabsTrigger>
                        <TabsTrigger value="allocation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex gap-2 items-center">
                            <Building className="h-4 w-4" />
                            <span className="hidden sm:inline">Alocação</span>
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex gap-2 items-center">
                            <DollarSign className="h-4 w-4" />
                            <span className="hidden sm:inline">Financeiro</span>
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white flex gap-2 items-center">
                            <Wrench className="h-4 w-4" />
                            <span className="hidden sm:inline">Manutenção</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Car className="h-5 w-5 text-blue-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Informações do Veículo</h3>
                            </div>
                            <VehicleGeneralInfo formData={formData} handleInputChange={handleInputChange} />

                            {/* Observações e Fotos na aba Geral */}
                            <div className="mt-6 grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="observacoes" className="text-gray-300 font-medium">Observações</Label>
                                    <Textarea
                                        id="observacoes"
                                        value={formData.observacoes}
                                        onChange={(e) => handleInputChange('observacoes', e.target.value)}
                                        placeholder="Observações adicionais sobre o veículo..."
                                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 min-h-[100px]"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <Label htmlFor="fotos" className="text-gray-300 font-medium">Fotos do Veículo</Label>

                                    {/* Upload de novas fotos */}
                                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:border-blue-500 transition-colors bg-gray-900/30">
                                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-400 mb-2">
                                            Arraste e solte fotos ou clique para selecionar
                                        </p>
                                        <Input
                                            id="fotos"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => handleInputChange('fotos', e.target.files)}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('fotos')?.click()}
                                            className="bg-gray-800 border-gray-600 hover:bg-gray-700 text-gray-300"
                                        >
                                            Selecionar Arquivos
                                        </Button>

                                        {formData.fotos && formData.fotos.length > 0 && (
                                            <div className="mt-4 w-full">
                                                <p className="text-xs text-green-400 font-medium mb-2 text-left">
                                                    {formData.fotos.length} arquivo(s) selecionado(s):
                                                </p>
                                                <ul className="text-xs text-gray-300 text-left space-y-1 bg-gray-800/50 p-2 rounded">
                                                    {Array.from(formData.fotos).map((file, idx) => (
                                                        <li key={idx} className="flex items-center gap-2">
                                                            <FileText className="h-3 w-3" />
                                                            {file.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fotos existentes (Modo Edição) */}
                                    {isEditMode && formData.existingPhotos && formData.existingPhotos.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider">
                                                Fotos Cadastradas
                                            </Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {formData.existingPhotos.map((photo, index) => {
                                                    const isDeleted = formData.photosToDelete?.has(photo);
                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`relative group rounded-lg overflow-hidden border ${isDeleted ? 'border-red-500 opacity-60' : 'border-gray-700'}`}
                                                        >
                                                            <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                                                {/* Simulação de preview já que não temos URL real aqui facilmente sem o backend configurado para servir static files corretamente mapeados */}
                                                                <div className="flex flex-col items-center">
                                                                    <ImageIcon className="h-6 w-6 text-gray-500 mb-1" />
                                                                    <span className="text-[10px] text-gray-400 max-w-[90%] truncate px-1">{photo}</span>
                                                                </div>
                                                            </div>

                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                {isDeleted ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRestorePhoto(photo)}
                                                                        className="text-white hover:text-green-400 hover:bg-transparent"
                                                                        title="Restaurar foto"
                                                                    >
                                                                        <RefreshCw className="h-5 w-5" />
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteExistingPhoto(photo)}
                                                                        className="text-white hover:text-red-400 hover:bg-transparent"
                                                                        title="Remover foto"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            {isDeleted && (
                                                                <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
                                                                    REMOVIDO
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="allocation" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Building className="h-5 w-5 text-purple-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Alocação e Responsabilidade</h3>
                            </div>
                            <VehicleAllocationInfo formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>

                    <TabsContent value="financial" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <DollarSign className="h-5 w-5 text-yellow-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Dados Financeiros</h3>
                            </div>
                            <VehicleFinancialInfo formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <Wrench className="h-5 w-5 text-orange-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Manutenção e Documentação</h3>
                            </div>
                            <VehicleMaintenanceInfo formData={formData} handleInputChange={handleInputChange} />
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
