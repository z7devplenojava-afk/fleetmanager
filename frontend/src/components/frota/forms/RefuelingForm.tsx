import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fuel, DollarSign, FileText, Calendar, User, Truck, Gauge, AlertTriangle, Save, Loader2, PlusCircle } from 'lucide-react';
import { RefuelingFormData } from './types';
import { Vehicle } from '@/types/fleet';
import { Driver } from '@/types/driver';
import { CostCenterDTO } from '@/services/costCenterService';
import { Supplier } from '@/services/contasAPagarService';

interface RefuelingFormProps {
    initialData?: Partial<RefuelingFormData>;
    onSubmit: (data: RefuelingFormData) => void;
    isLoading: boolean;
    vehicles: Vehicle[];
    drivers: Driver[];
    costCenters: CostCenterDTO[];
    suppliers: Supplier[];
    lastFuelRecord?: any;
    onOpenDriverModal: () => void;
    onOpenSupplierModal: () => void;
    submitLabel?: string;
    onVehicleChange?: (vehicleId: string) => void;
}

const DEFAULT_FORM_DATA: RefuelingFormData = {
    vehicleId: '',
    driverId: '',
    date: new Date().toISOString().split('T')[0],
    fuelType: 'GASOLINE',
    mileage: 0,
    liters: 0,
    pricePerLiter: 0,
    totalValue: 0,
    station: '',
    costCenter: '',
    notes: '',
    receiptFile: null
};

export const RefuelingForm: React.FC<RefuelingFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    vehicles,
    drivers,
    costCenters,
    suppliers,
    lastFuelRecord,
    onOpenDriverModal,
    onOpenSupplierModal,
    submitLabel = 'Registrar Abastecimento',
    onVehicleChange
}) => {
    const [formData, setFormData] = useState<RefuelingFormData>(DEFAULT_FORM_DATA);
    const [currentTab, setCurrentTab] = useState('details');
    const [mileageError, setMileageError] = useState<string | null>(null);
    const [mileageWarning, setMileageWarning] = useState<string | null>(null);
    const [isTotalManuallyEdited, setIsTotalManuallyEdited] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    // Validation for mileage
    useEffect(() => {
        if (!formData.mileage || !lastFuelRecord) {
            setMileageError(null);
            setMileageWarning(null);
            return;
        }

        const currentKm = Number(formData.mileage);
        const lastKm = lastFuelRecord.mileage;

        if (currentKm <= lastKm) {
            setMileageError(`A quilometragem deve ser maior que a anterior (${lastKm.toLocaleString('pt-BR')} km).`);
            setMileageWarning(null);
        } else {
            setMileageError(null);
            const diff = currentKm - lastKm;
            if (diff > 2000) {
                setMileageWarning(`Diferença alta de quilometragem: ${diff.toLocaleString('pt-BR')} km.`);
            } else {
                setMileageWarning(null);
            }
        }
    }, [formData.mileage, lastFuelRecord]);

    const handleInputChange = (field: keyof RefuelingFormData, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Auto-calculate total
            if (!isTotalManuallyEdited && (field === 'liters' || field === 'pricePerLiter')) {
                const liters = field === 'liters' ? Number(value) : Number(prev.liters);
                const price = field === 'pricePerLiter' ? Number(value) : Number(prev.pricePerLiter);

                if (liters > 0 && price > 0) {
                    newData.totalValue = Number((liters * price).toFixed(2));
                }
            }

            // If user manually edits total, stop auto-calculation
            if (field === 'totalValue') {
                setIsTotalManuallyEdited(true);
            }

            return newData;
        });
    };

    const handleRecalculateTotal = () => {
        const liters = Number(formData.liters);
        const price = Number(formData.pricePerLiter);
        if (liters > 0 && price > 0) {
            setFormData(prev => ({ ...prev, totalValue: Number((liters * price).toFixed(2)) }));
            setIsTotalManuallyEdited(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mileageError) return;
        onSubmit(formData);
    };

    const veiculosAtivos = vehicles.filter(v => v.status === 'ACTIVE' || v.status === 'ATIVO');
    const motoristasAtivos = drivers.filter(d => d.status === 'ACTIVE' || d.status === 'ATIVO');
    const fornecedoresAtivos = suppliers;

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full bg-seguranca-darkgray">
            <div className="flex-1 overflow-y-auto px-6 py-4">
                <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-800/50 p-1 flex-none">
                        <TabsTrigger value="details" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex gap-2 items-center">
                            <Truck className="h-4 w-4" />
                            <span className="hidden sm:inline">Detalhes</span>
                        </TabsTrigger>
                        <TabsTrigger value="supply" className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex gap-2 items-center">
                            <Fuel className="h-4 w-4" />
                            <span className="hidden sm:inline">Abastecimento</span>
                        </TabsTrigger>
                        <TabsTrigger value="others" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex gap-2 items-center">
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
                                <Select value={formData.vehicleId} onValueChange={(val) => {
                                    handleInputChange('vehicleId', val);
                                    if (onVehicleChange) onVehicleChange(val);
                                }}>
                                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                        <SelectValue placeholder="Selecione o veículo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-600">
                                        {veiculosAtivos.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Driver */}
                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Motorista *</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.driverId} onValueChange={(val) => handleInputChange('driverId', val)}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white w-full">
                                            <SelectValue placeholder="Selecione o motorista" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            {motoristasAtivos.map(d => (
                                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={onOpenDriverModal} className="border-gray-600 text-gray-300">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Date & Mileage */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Data *</Label>
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
                                    <Label className="text-gray-300 font-medium">Quilometragem *</Label>
                                    <div className="relative">
                                        <Gauge className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            type="number"
                                            value={formData.mileage}
                                            onChange={(e) => handleInputChange('mileage', Number(e.target.value))}
                                            className={`pl-10 bg-gray-900/50 text-white ${mileageError ? 'border-red-500' : 'border-gray-600'}`}
                                        />
                                    </div>
                                    {lastFuelRecord && (
                                        <p className="text-xs text-gray-400">Último: {lastFuelRecord.mileage} km</p>
                                    )}
                                    {mileageError && <p className="text-xs text-red-400">{mileageError}</p>}
                                    {mileageWarning && <p className="text-xs text-yellow-400">{mileageWarning}</p>}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- SUPPLY TAB --- */}
                    <TabsContent value="supply" className="mt-0 space-y-6">
                        <div className="space-y-6">

                            {/* Fuel Type & Station */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Combustível *</Label>
                                    <Select value={formData.fuelType} onValueChange={(val) => handleInputChange('fuelType', val)}>
                                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 border-gray-600">
                                            <SelectItem value="GASOLINE">Gasolina</SelectItem>
                                            <SelectItem value="ETHANOL">Etanol</SelectItem>
                                            <SelectItem value="DIESEL">Diesel</SelectItem>
                                            <SelectItem value="FLEX">Flex</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Posto *</Label>
                                    <div className="flex gap-2">
                                        <Select value={formData.station} onValueChange={(val) => handleInputChange('station', val)}>
                                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white w-full">
                                                <SelectValue placeholder="Selecione o posto" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-gray-600">
                                                {fornecedoresAtivos.map(s => (
                                                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" variant="outline" onClick={onOpenSupplierModal} className="border-gray-600 text-gray-300">
                                            <PlusCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Liters & Price */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Litros *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.liters}
                                        onChange={(e) => handleInputChange('liters', e.target.value)}
                                        className="bg-gray-900/50 border-gray-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Valor Unitário (R$) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.pricePerLiter}
                                        onChange={(e) => handleInputChange('pricePerLiter', e.target.value)}
                                        className="bg-gray-900/50 border-gray-600 text-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-300 font-medium">Valor Total (R$) *</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.totalValue}
                                            onChange={(e) => handleInputChange('totalValue', e.target.value)}
                                            className={`bg-gray-900/50 border-gray-600 text-white ${isTotalManuallyEdited ? 'border-yellow-600' : ''}`}
                                        />
                                        {isTotalManuallyEdited && (
                                            <Button type="button" size="icon" variant="ghost" onClick={handleRecalculateTotal} title="Recalcular">
                                                <DollarSign className="h-4 w-4 text-green-400" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* --- OTHERS TAB --- */}
                    <TabsContent value="others" className="mt-0 space-y-6">
                        <div className="space-y-6">

                            <div className="space-y-2">
                                <Label className="text-gray-300 font-medium">Centro de Custo</Label>
                                <Select value={formData.costCenter} onValueChange={(val) => handleInputChange('costCenter', val)}>
                                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                                        <SelectValue placeholder="Selecione centro de custo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-600">
                                        {costCenters.map(cc => (
                                            <SelectItem key={cc.id} value={cc.id || ''}>{cc.code} - {cc.name}</SelectItem>
                                        ))}
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
                                <Label className="text-gray-300 font-medium">Comprovante</Label>
                                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-900/30 hover:border-blue-500 transition-colors">
                                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                    <Input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={(e) => handleInputChange('receiptFile', e.target.files?.[0] || null)}
                                        className="bg-transparent border-none text-white file:text-blue-400 file:bg-gray-800 file:rounded-md file:border-0 file:px-2 file:py-1 cursor-pointer"
                                    />
                                    {formData.receiptFile && <p className="text-xs text-green-400 mt-2">{formData.receiptFile.name}</p>}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <div className="flex-none p-6 pt-4 border-t border-gray-700 flex justify-end gap-3 bg-seguranca-darkgray">
                <Button
                    type="submit"
                    disabled={isLoading || !!mileageError}
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
