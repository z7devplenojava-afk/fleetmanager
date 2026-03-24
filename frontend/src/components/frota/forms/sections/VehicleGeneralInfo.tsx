import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleFormSectionProps } from '../types';

export const VehicleGeneralInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
                <Label htmlFor="placa" className="text-gray-300 font-medium">Placa *</Label>
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
                <Label htmlFor="marca" className="text-gray-300 font-medium">Marca *</Label>
                <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) => handleInputChange('marca', e.target.value)}
                    placeholder="Ex: Toyota"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="modelo" className="text-gray-300 font-medium">Modelo *</Label>
                <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    placeholder="Ex: Corolla"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="ano" className="text-gray-300 font-medium">Ano *</Label>
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
                <Label htmlFor="cor" className="text-gray-300 font-medium">Cor</Label>
                <Input
                    id="cor"
                    value={formData.cor}
                    onChange={(e) => handleInputChange('cor', e.target.value)}
                    placeholder="Ex: Branco"
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="combustivel" className="text-gray-300 font-medium">Combustível *</Label>
                <Select value={formData.combustivel} onValueChange={(value) => handleInputChange('combustivel', value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione o combustível" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="GASOLINE">⛽ Gasolina</SelectItem>
                        <SelectItem value="ETHANOL">🌱 Etanol</SelectItem>
                        <SelectItem value="FLEX">🔄 Flex</SelectItem>
                        <SelectItem value="DIESEL">🚛 Diesel</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="quilometragem" className="text-gray-300 font-medium">Quilometragem</Label>
                <Input
                    id="quilometragem"
                    type="number"
                    step="0.000001"
                    value={formData.quilometragem}
                    onChange={(e) => handleInputChange('quilometragem', e.target.value)}
                    min="0"
                    placeholder="Ex: 120.236"
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="capacidade" className="text-gray-300 font-medium">Capacidade *</Label>
                <Input
                    id="capacidade"
                    type="number"
                    value={formData.capacidade}
                    onChange={(e) => handleInputChange('capacidade', e.target.value)}
                    min="1"
                    max="20"
                    placeholder="Ex: 5"
                    required
                    className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-300 font-medium">Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                        <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                        <SelectItem value="ACTIVE" className="text-green-400">✅ Ativo</SelectItem>
                        <SelectItem value="INACTIVE" className="text-red-400">❌ Inativo</SelectItem>
                        <SelectItem value="MAINTENANCE" className="text-yellow-400">🔧 Manutenção</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
