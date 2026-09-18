import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, Building, DollarSign, Wrench, Save, Loader2, FileText, ImageIcon, X, Trash2, RefreshCw, Shield, Users, UserCheck, AlertTriangle, ShieldAlert } from 'lucide-react';
import { VehicleFormData } from './types';
import { VehicleGeneralInfo } from './sections/VehicleGeneralInfo';
import { VehicleAllocationInfo } from './sections/VehicleAllocationInfo';
import { VehicleFinancialInfo } from './sections/VehicleFinancialInfo';
import { VehicleMaintenanceInfo } from './sections/VehicleMaintenanceInfo';
import { VehicleBusInfo } from './sections/VehicleBusInfo';
import { VehicleFinancingSection } from './sections/VehicleFinancingSection';
import { VehicleInsuranceSection } from './sections/VehicleInsuranceSection';
import { VehicleClientSection } from './sections/VehicleClientSection';
import { VehicleAgregadoSection } from './sections/VehicleAgregadoSection';
import { VehicleFinesSection } from './sections/VehicleFinesSection';
import { VehicleWearAndWarrantySection } from './sections/VehicleWearAndWarrantySection';
import { useVehicleValidation, ValidationError } from './hooks/useVehicleValidation';
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
    chassi: '',
    renavan: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    cor: '',
    combustivel: 'FLEX',
    quilometragem: 0,
    status: 'ACTIVE',
    capacidade: 5,
    vehicleType: '',
    // Campos de Ônibus
    busType: '',
    passengerCapacity: 0,
    standingCapacity: 0,
    totalDoors: 2,
    hasAccessibility: false,
    hasAirConditioning: false,
    hasWiFi: false,
    hasCamera: false,
    hasCctv: false,
    busBodyType: '',
    chassisBrand: '',
    bodyBuilder: '',
    engineModel: '',
    enginePowerHp: 0,
    transmissionType: '',
    axleCount: 2,
    totalWeightKg: 0,
    payloadKg: 0,
    fuelTankCapacityLiters: 0,
    routeNumber: '',
    routeName: '',
    // Alocação
    postoDeTrabalho: '',
    garagem: '',
    garagemNome: '',
    departamento: '',
    departmentId: '',
    empresa: '',
    empresaId: '',
    responsavel: '',
    // Manutenção
    dataManutencao: null,
    proximaManutencao: null,
    vencimentoSeguro: null,
    vencimentoDocumentacao: null,
    // Financeiro
    data_aquisicao: null,
    valor_aquisicao: 0,
    // Financiamento
    financingStatus: '',
    financingInstallmentValue: 0,
    financingRemainingInstallments: 0,
    financingPayoffBalance: 0,
    financingBankOrInstitution: '',
    financingContractNumber: '',
    financingStartDate: '',
    financingEndDate: '',
    // Valor de mercado
    marketValue: 0,
    // Seguros - Apólice Principal
    insurancePolicyNumber: '',
    insuranceCompany: '',
    insurancePremiumValue: 0,
    insuranceCoverageType: '',
    // Seguros - Segunda Apólice
    insuranceSecondPolicyNumber: '',
    insuranceSecondCompany: '',
    insuranceSecondPremiumValue: 0,
    insuranceSecondExpiryDate: '',
    // Cliente / Alocação
    clientName: '',
    clientId: '',
    allocationContractNumber: '',
    allocationStartDate: '',
    allocationEndDate: '',
    // Agregado
    isAggregated: false,
    aggregatedOwnerName: '',
    aggregatedOwnerCpfCnpj: '',
    aggregatedOwnerPhone: '',
    aggregatedOwnerEmail: '',
    aggregatedDailyRate: 0,
    aggregatedMonthlyRate: 0,
    aggregatedPaymentType: '',
    aggregatedContractStartDate: '',
    aggregatedContractEndDate: '',
    aggregatedNotes: '',
    // Diferença financeira
    financialDifference: 0,
    // Outros
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
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const { validate, getFieldStatus } = useVehicleValidation();

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
        const errors = validate(formData);
        if (errors.length > 0) {
            setValidationErrors(errors);
            // Navegar para a aba que contém o primeiro erro
            const firstErrorField = errors[0].field;
            if (['placa', 'chassi', 'renavan', 'marca', 'modelo', 'ano', 'cor', 'combustivel', 'quilometragem', 'capacidade', 'status', 'vehicleType'].includes(firstErrorField)) {
                setCurrentTab('general');
            } else if (['busType', 'passengerCapacity', 'standingCapacity', 'totalDoors', 'chassisBrand', 'bodyBuilder', 'engineModel', 'routeNumber'].includes(firstErrorField)) {
                setCurrentTab('general');
            } else if (['financingStatus', 'financingInstallmentValue', 'financingBankOrInstitution', 'marketValue'].includes(firstErrorField)) {
                setCurrentTab('financial');
            } else if (['aggregatedOwnerName', 'aggregatedPaymentType'].includes(firstErrorField)) {
                setCurrentTab('agregado');
            }
            return;
        }
        setValidationErrors([]);
        onSubmit(formData);
    };

    const [newPhotoPreviews, setNewPhotoPreviews] = useState<{ file: File; url: string }[]>([]);

    // Preview de novas fotos selecionadas
    useEffect(() => {
        if (!formData.fotos || formData.fotos.length === 0) {
            setNewPhotoPreviews([]);
            return;
        }
        const previews = Array.from(formData.fotos).map(file => ({
            file,
            url: URL.createObjectURL(file)
        }));
        setNewPhotoPreviews(previews);

        return () => {
            previews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [formData.fotos]);

    const handleRemoveNewPhoto = (indexToRemove: number) => {
        if (!formData.fotos) return;
        const dt = new DataTransfer();
        Array.from(formData.fotos).forEach((file, index) => {
            if (index !== indexToRemove) {
                dt.items.add(file);
            }
        });
        handleInputChange('fotos', dt.files.length > 0 ? dt.files : null);
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
                    <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 mb-4 bg-gray-800/50 p-1 flex-none gap-1">
                        <TabsTrigger value="general" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <Car className="h-3 w-3" />
                            <span className="hidden lg:inline">Geral</span>
                        </TabsTrigger>
                        <TabsTrigger value="allocation" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <Building className="h-3 w-3" />
                            <span className="hidden lg:inline">Alocação</span>
                        </TabsTrigger>
                        <TabsTrigger value="financial" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <DollarSign className="h-3 w-3" />
                            <span className="hidden lg:inline">Financeiro</span>
                        </TabsTrigger>
                        <TabsTrigger value="insurance" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <Shield className="h-3 w-3" />
                            <span className="hidden lg:inline">Seguros</span>
                        </TabsTrigger>
                        <TabsTrigger value="client" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <Users className="h-3 w-3" />
                            <span className="hidden lg:inline">Cliente</span>
                        </TabsTrigger>
                        <TabsTrigger value="agregado" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <UserCheck className="h-3 w-3" />
                            <span className="hidden lg:inline">Agregado</span>
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <Wrench className="h-3 w-3" />
                            <span className="hidden lg:inline">Manutenção</span>
                        </TabsTrigger>
                        <TabsTrigger value="fines" className="data-[state=active]:bg-rose-600 data-[state=active]:text-white flex gap-1 items-center text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="hidden lg:inline">Multas</span>
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

                            {/* Controles de Desgaste, Troca de Óleo, Filtros, Correias e Garantia */}
                            <VehicleWearAndWarrantySection formData={formData} handleInputChange={handleInputChange} />

                            {/* Campos de Ônibus (condicional) */}
                            <VehicleBusInfo formData={formData} handleInputChange={handleInputChange} />

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
                                    </div>

                                    {/* Grid de Novas Fotos Selecionadas com Preview Real */}
                                    {newPhotoPreviews.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs text-green-400 font-medium text-left">
                                                {newPhotoPreviews.length} foto(s) nova(s) selecionada(s):
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {newPhotoPreviews.map((item, idx) => (
                                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-gray-700 bg-gray-900/80 shadow">
                                                        <div className="aspect-video w-full overflow-hidden bg-gray-950 flex items-center justify-center">
                                                            <img
                                                                src={item.url}
                                                                alt={item.file.name}
                                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                                                            />
                                                        </div>
                                                        <div className="p-1.5 bg-gray-900/90 text-left">
                                                            <p className="text-[11px] text-gray-200 truncate font-medium">{item.file.name}</p>
                                                            <p className="text-[10px] text-gray-400">{(item.file.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveNewPhoto(idx)}
                                                            className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                            title="Remover foto"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fotos existentes (Modo Edição) */}
                                    {isEditMode && formData.existingPhotos && formData.existingPhotos.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-gray-300 font-medium text-xs uppercase tracking-wider">
                                                Fotos Cadastradas ({formData.existingPhotos.length})
                                            </Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                {formData.existingPhotos.map((photo, index) => {
                                                    const isDeleted = formData.photosToDelete?.has(photo);
                                                    const photoSrc = photo.startsWith('http') || photo.startsWith('data:') || photo.startsWith('/')
                                                        ? photo
                                                        : `/api/vehicles/photos/${photo}`;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`relative group rounded-lg overflow-hidden border ${isDeleted ? 'border-red-500 opacity-60' : 'border-gray-700 bg-gray-900/80'}`}
                                                        >
                                                            <div className="aspect-video bg-gray-950 flex items-center justify-center overflow-hidden">
                                                                <img
                                                                    src={photoSrc}
                                                                    alt={photo}
                                                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                                                                    onError={(e) => {
                                                                        const target = e.currentTarget;
                                                                        target.style.display = 'none';
                                                                        const parent = target.parentElement;
                                                                        if (parent && !parent.querySelector('.img-fallback')) {
                                                                            const fallback = document.createElement('div');
                                                                            fallback.className = 'img-fallback flex flex-col items-center justify-center p-2 text-center text-gray-500';
                                                                            fallback.innerHTML = `<svg class="h-6 w-6 mb-1 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><span class="text-[10px] text-gray-400 truncate max-w-[100px]">${photo}</span>`;
                                                                            parent.appendChild(fallback);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="p-1.5 bg-gray-900/90 text-left">
                                                                <p className="text-[11px] text-gray-300 truncate">{photo}</p>
                                                            </div>

                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                {isDeleted ? (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRestorePhoto(photo)}
                                                                        className="text-white hover:text-green-400 hover:bg-transparent flex items-center gap-1 text-xs"
                                                                        title="Restaurar foto"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" /> Restaurar
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteExistingPhoto(photo)}
                                                                        className="text-white hover:text-red-400 hover:bg-transparent flex items-center gap-1 text-xs"
                                                                        title="Remover foto"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" /> Excluir
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
                            <VehicleFinancingSection formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>

                    <TabsContent value="insurance" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <VehicleInsuranceSection formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>

                    <TabsContent value="client" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <VehicleClientSection formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>

                    <TabsContent value="agregado" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <VehicleAgregadoSection formData={formData} handleInputChange={handleInputChange} />
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

                    <TabsContent value="fines" className="mt-0 focus-visible:ring-0 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="p-2 bg-rose-500/20 rounded-lg">
                                    <ShieldAlert className="h-5 w-5 text-rose-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Histórico de Multas e Infrações</h3>
                            </div>
                            <VehicleFinesSection formData={formData} handleInputChange={handleInputChange} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex-none p-6 pt-4 border-t border-gray-700 bg-seguranca-darkgray">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm font-medium text-red-400">
                                {validationErrors.length} campo(s) obrigatório(s) não preenchido(s)
                            </span>
                        </div>
                        <ul className="text-xs text-red-300 space-y-1 ml-6">
                            {validationErrors.slice(0, 5).map((error, index) => (
                                <li key={index}>• {error.message}</li>
                            ))}
                            {validationErrors.length > 5 && (
                                <li className="text-red-400">• ...e mais {validationErrors.length - 5} campo(s)</li>
                            )}
                        </ul>
                    </div>
                )}

                <div className="flex justify-end gap-3">
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
            </div>
        </form>
    );
};
