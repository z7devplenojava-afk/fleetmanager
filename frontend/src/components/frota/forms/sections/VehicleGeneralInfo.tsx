import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleFormSectionProps } from '../types';
import { useVehicleValidation } from '../hooks/useVehicleValidation';

// Componente para indicar status do campo
const FieldLabel: React.FC<{ label: string; field: string; vehicleType: string; required?: boolean }> = ({ label, field, vehicleType, required }) => {
    const { getFieldStatus } = useVehicleValidation();
    const status = required ? 'required' : getFieldStatus(field, { vehicleType } as any);

    return (
        <Label htmlFor={field} className="text-gray-300 font-medium flex items-center gap-1.5">
            {label}
            {status === 'required' && <span className="text-red-400 text-xs">*obrig.</span>}
            {status === 'recommended' && <span className="text-yellow-400 text-xs">*recom.</span>}
        </Label>
    );
};

export const VehicleGeneralInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
                <FieldLabel label="Placa" field="plate" vehicleType={formData.vehicleType} required />
                <Input
                    id="placa"
                    value={formData.placa}
                    onChange={(e) => handleInputChange('placa', e.target.value)}
                    placeholder="ABC-1234"
                    maxLength={8}
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Chassi" field="chassisNumber" vehicleType={formData.vehicleType} />
                <Input
                    id="chassi"
                    value={formData.chassi}
                    onChange={(e) => handleInputChange('chassi', e.target.value)}
                    placeholder="Número do chassi (17 caracteres)"
                    maxLength={17}
                    className={`bg-gray-900/50 text-white placeholder-gray-400 transition-all duration-200 ${
                        formData.vehicleType && ['BUS_ROAD', 'BUS_LUXURY_TOURISM', 'BUS_URBAN', 'MINIBUS', 'VAN', 'TRUCK', 'CAR_UTILITY'].includes(formData.vehicleType)
                            ? 'border-yellow-500/50 focus:border-yellow-500'
                            : 'border-gray-600 focus:border-blue-500'
                    }`}
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="RENAVAN" field="renavan" vehicleType={formData.vehicleType} />
                <Input
                    id="renavan"
                    value={formData.renavan}
                    onChange={(e) => handleInputChange('renavan', e.target.value)}
                    placeholder="Número do RENAVAN"
                    maxLength={11}
                    className={`bg-gray-900/50 text-white placeholder-gray-400 transition-all duration-200 ${
                        formData.vehicleType && ['BUS_ROAD', 'BUS_LUXURY_TOURISM', 'BUS_URBAN', 'MINIBUS', 'VAN', 'TRUCK', 'CAR_UTILITY'].includes(formData.vehicleType)
                            ? 'border-yellow-500/50 focus:border-yellow-500'
                            : 'border-gray-600 focus:border-blue-500'
                    }`}
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Marca" field="brand" vehicleType={formData.vehicleType} required />
                <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    placeholder="Ex: Toyota, Mercedes-Benz"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Modelo" field="model" vehicleType={formData.vehicleType} required />
                <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    placeholder="Ex: Corolla, O 500 R"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Ano" field="ano" vehicleType={formData.vehicleType} required />
                <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) => handleInputChange('ano', e.target.value)}
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Cor" field="color" vehicleType={formData.vehicleType} />
                <Input
                    id="cor"
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                    placeholder="Ex: Branco"
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Combustível" field="fuelType" vehicleType={formData.vehicleType} required />
                <Select value={formData.combustivel} onValueChange={(value) => handleInputChange('combustivel', value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="DIESEL">🚛 Diesel</SelectItem>
                        <SelectItem value="FLEX">🔄 Flex</SelectItem>
                        <SelectItem value="GASOLINE">⛽ Gasolina</SelectItem>
                        <SelectItem value="ETHANOL">🌱 Etanol</SelectItem>
                        <SelectItem value="ELECTRIC">⚡ Elétrico</SelectItem>
                        <SelectItem value="HYBRID">🔋 Híbrido</SelectItem>
                        <SelectItem value="CNG">💨 GNV</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <FieldLabel label="Quilometragem" field="currentMileage" vehicleType={formData.vehicleType} />
                <Input
                    id="quilometragem"
                    type="number"
                    value={formData.quilometragem}
                    onChange={(e) => handleInputChange('quilometragem', e.target.value)}
                    min="0"
                    placeholder="Ex: 120236"
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Capacidade" field="capacity" vehicleType={formData.vehicleType} required />
                <Input
                    id="capacidade"
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => handleInputChange('capacidade', e.target.value)}
                    min="1"
                    placeholder="Ex: 5"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <FieldLabel label="Status" field="status" vehicleType={formData.vehicleType} required />
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="ACTIVE" className="text-green-400">✅ Ativo</SelectItem>
                        <SelectItem value="INACTIVE" className="text-red-400">❌ Inativo</SelectItem>
                        <SelectItem value="MAINTENANCE" className="text-yellow-400">🔧 Manutenção</SelectItem>
                        <SelectItem value="OUT_OF_SERVICE" className="text-orange-400">⚠️ Fora de Serviço</SelectItem>
                        <SelectItem value="RESERVED" className="text-blue-400">📋 Reservado</SelectItem>
                        <SelectItem value="LEASED" className="text-purple-400">🏷️ Alugado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <FieldLabel label="Tipo de Veículo" field="vehicleType" vehicleType={formData.vehicleType} required />
                <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="BUS_ROAD">🚌 Ônibus Rodoviário</SelectItem>
                        <SelectItem value="BUS_LUXURY_TOURISM">🚌✨ Ônibus Luxo Turismo (Double Decker)</SelectItem>
                        <SelectItem value="BUS_URBAN">🏙️ Ônibus Urbano</SelectItem>
                        <SelectItem value="MINIBUS">🚐 Micro-ônibus</SelectItem>
                        <SelectItem value="VAN">🚐 Van</SelectItem>
                        <SelectItem value="CAR_UTILITY">🚗 Carro Utilitário</SelectItem>
                        <SelectItem value="CAR">🚗 Carro</SelectItem>
                        <SelectItem value="TRUCK">🚛 Caminhão</SelectItem>
                        <SelectItem value="MOTORCYCLE">🏍️ Motocicleta</SelectItem>
                        <SelectItem value="PICKUP">🛻 Pickup</SelectItem>
                        <SelectItem value="SUV">🚙 SUV</SelectItem>
                        <SelectItem value="OTHER">❓ Outro</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
