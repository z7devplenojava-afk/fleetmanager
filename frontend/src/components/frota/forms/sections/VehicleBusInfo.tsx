import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { VehicleFormSectionProps, BusType } from '../types';
import { Bus, Users, DoorOpen, Wifi, Camera, Accessibility, Thermometer, Route } from 'lucide-react';

const BUS_TYPE_OPTIONS: { value: BusType; label: string; icon: string }[] = [
    { value: 'CONVENCIONAL', label: 'Convencional', icon: '🚌' },
    { value: 'ARTICULADO', label: 'Articulado', icon: '🚌' },
    { value: 'BIARTICULADO', label: 'Biarticulado', icon: '🚌' },
    { value: 'MICROS', label: 'Micro-ônibus', icon: '🚐' },
    { value: 'PADRON', label: 'Padrão', icon: '🚌' },
    { value: 'ELETRICO', label: 'Elétrico', icon: '⚡' },
    { value: 'HIBRIDO', label: 'Híbrido', icon: '🔋' },
    { value: 'VIP', label: 'VIP/Leito', icon: '✨' },
    { value: 'ESCOLAR', label: 'Escolar', icon: '🏫' },
    { value: 'FRETADO', label: 'Fretado', icon: '🚍' },
    { value: 'URBANO', label: 'Urbano', icon: '🏙️' },
    { value: 'INTERMUNICIPAL', label: 'Intermunicipal', icon: '🗺️' },
    { value: 'RODOVIARIO', label: 'Rodoviário', icon: '🛣️' },
];

export const VehicleBusInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    const isBusType = formData.vehicleType === 'BUS' || formData.vehicleType === 'MINIBUS';

    if (!isBusType) {
        return null;
    }

    return (
        <div className="space-y-6 bg-gray-800/30 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                    <Bus className="h-5 w-5 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Dados do Ônibus</h3>
            </div>

            {/* Tipo de Ônibus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="busType" className="text-gray-300 font-medium">Tipo de Ônibus *</Label>
                    <Select value={formData.busType} onValueChange={(value) => handleInputChange('busType', value)}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            {BUS_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.icon} {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="busBodyType" className="text-gray-300 font-medium">Carroceria</Label>
                    <Input
                        id="busBodyType"
                        value={formData.busBodyType}
                        onChange={(e) => handleInputChange('busBodyType', e.target.value)}
                        placeholder="Ex: Marcopolo, Busscar"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="chassisBrand" className="text-gray-300 font-medium">Marca do Chassi</Label>
                    <Input
                        id="chassisBrand"
                        value={formData.chassisBrand}
                        onChange={(e) => handleInputChange('chassisBrand', e.target.value)}
                        placeholder="Ex: Mercedes-Benz, Volvo, Scania"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bodyBuilder" className="text-gray-300 font-medium">Fabricante da Carroceria</Label>
                    <Input
                        id="bodyBuilder"
                        value={formData.bodyBuilder}
                        onChange={(e) => handleInputChange('bodyBuilder', e.target.value)}
                        placeholder="Ex: Marcopolo, Busscar, CAIO"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Capacidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="passengerCapacity" className="text-gray-300 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-400" />
                        Capacidade Sentados
                    </Label>
                    <Input
                        id="passengerCapacity"
                        type="number"
                        value={formData.passengerCapacity}
                        onChange={(e) => handleInputChange('passengerCapacity', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 45"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="standingCapacity" className="text-gray-300 font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-yellow-400" />
                        Capacidade em Pé
                    </Label>
                    <Input
                        id="standingCapacity"
                        type="number"
                        value={formData.standingCapacity}
                        onChange={(e) => handleInputChange('standingCapacity', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 15"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="totalDoors" className="text-gray-300 font-medium flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-purple-400" />
                        Número de Portas
                    </Label>
                    <Input
                        id="totalDoors"
                        type="number"
                        value={formData.totalDoors}
                        onChange={(e) => handleInputChange('totalDoors', parseInt(e.target.value) || 0)}
                        min="1"
                        max="6"
                        placeholder="Ex: 2"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="axleCount" className="text-gray-300 font-medium">Eixos</Label>
                    <Input
                        id="axleCount"
                        type="number"
                        value={formData.axleCount}
                        onChange={(e) => handleInputChange('axleCount', parseInt(e.target.value) || 0)}
                        min="2"
                        max="6"
                        placeholder="Ex: 2 ou 3"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Comodidades */}
            <div className="space-y-3">
                <Label className="text-gray-300 font-medium text-sm uppercase tracking-wider">Comodidades</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                        <Switch
                            id="hasAccessibility"
                            checked={formData.hasAccessibility}
                            onCheckedChange={(checked) => handleInputChange('hasAccessibility', checked)}
                        />
                        <Label htmlFor="hasAccessibility" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                            <Accessibility className="h-4 w-4 text-blue-400" />
                            Acessível
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                        <Switch
                            id="hasAirConditioning"
                            checked={formData.hasAirConditioning}
                            onCheckedChange={(checked) => handleInputChange('hasAirConditioning', checked)}
                        />
                        <Label htmlFor="hasAirConditioning" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-cyan-400" />
                            Ar Condicionado
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                        <Switch
                            id="hasWiFi"
                            checked={formData.hasWiFi}
                            onCheckedChange={(checked) => handleInputChange('hasWiFi', checked)}
                        />
                        <Label htmlFor="hasWiFi" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                            <Wifi className="h-4 w-4 text-green-400" />
                            Wi-Fi
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                        <Switch
                            id="hasCamera"
                            checked={formData.hasCamera}
                            onCheckedChange={(checked) => handleInputChange('hasCamera', checked)}
                        />
                        <Label htmlFor="hasCamera" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                            <Camera className="h-4 w-4 text-red-400" />
                            Câmera Interna
                        </Label>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-900/30 p-3 rounded-lg border border-gray-700">
                        <Switch
                            id="hasCctv"
                            checked={formData.hasCctv}
                            onCheckedChange={(checked) => handleInputChange('hasCctv', checked)}
                        />
                        <Label htmlFor="hasCctv" className="text-gray-300 text-sm cursor-pointer flex items-center gap-2">
                            <Camera className="h-4 w-4 text-orange-400" />
                            CCTV
                        </Label>
                    </div>
                </div>
            </div>

            {/* Motor e Transmissão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="engineModel" className="text-gray-300 font-medium">Modelo do Motor</Label>
                    <Input
                        id="engineModel"
                        value={formData.engineModel}
                        onChange={(e) => handleInputChange('engineModel', e.target.value)}
                        placeholder="Ex: OM 457 LA"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="enginePowerHp" className="text-gray-300 font-medium">Potência (HP)</Label>
                    <Input
                        id="enginePowerHp"
                        type="number"
                        value={formData.enginePowerHp}
                        onChange={(e) => handleInputChange('enginePowerHp', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 300"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transmissionType" className="text-gray-300 font-medium">Câmbio</Label>
                    <Select value={formData.transmissionType} onValueChange={(value) => handleInputChange('transmissionType', value)}>
                        <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-green-500 focus:ring-green-500/20 transition-all duration-200">
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-600">
                            <SelectItem value="MANUAL">Manual</SelectItem>
                            <SelectItem value="AUTOMATICO">Automático</SelectItem>
                            <SelectItem value="AUTOMATIZADO">Automatizado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Peso e Capacidade do Tanque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="totalWeightKg" className="text-gray-300 font-medium">Peso Total (kg)</Label>
                    <Input
                        id="totalWeightKg"
                        type="number"
                        value={formData.totalWeightKg}
                        onChange={(e) => handleInputChange('totalWeightKg', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 18000"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payloadKg" className="text-gray-300 font-medium">Peso Útil (kg)</Label>
                    <Input
                        id="payloadKg"
                        type="number"
                        value={formData.payloadKg}
                        onChange={(e) => handleInputChange('payloadKg', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 8000"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="fuelTankCapacityLiters" className="text-gray-300 font-medium">Capacidade Tanque (L)</Label>
                    <Input
                        id="fuelTankCapacityLiters"
                        type="number"
                        value={formData.fuelTankCapacityLiters}
                        onChange={(e) => handleInputChange('fuelTankCapacityLiters', parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="Ex: 300"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Rota/Linha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="routeNumber" className="text-gray-300 font-medium flex items-center gap-2">
                        <Route className="h-4 w-4 text-indigo-400" />
                        Número da Rota/Linha
                    </Label>
                    <Input
                        id="routeNumber"
                        value={formData.routeNumber}
                        onChange={(e) => handleInputChange('routeNumber', e.target.value)}
                        placeholder="Ex: 123, 456A"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="routeName" className="text-gray-300 font-medium">Nome da Rota/Linha</Label>
                    <Input
                        id="routeName"
                        value={formData.routeName}
                        onChange={(e) => handleInputChange('routeName', e.target.value)}
                        placeholder="Ex: Centro - Bairro"
                        className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                    />
                </div>
            </div>
        </div>
    );
};
