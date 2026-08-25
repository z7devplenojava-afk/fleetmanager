import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleFormSectionProps } from '../types';
import { Shield, FileText } from 'lucide-react';

export const VehicleInsuranceSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="space-y-6">
            {/* Apólice Principal */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                        <Shield className="h-5 w-5 text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Apólice de Seguro Principal</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="insurancePolicyNumber" className="text-gray-300 font-medium">Nº Apólice</Label>
                        <Input
                            id="insurancePolicyNumber"
                            value={formData.insurancePolicyNumber}
                            onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                            placeholder="Número da apólice"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insuranceCompany" className="text-gray-300 font-medium">Seguradora</Label>
                        <Input
                            id="insuranceCompany"
                            value={formData.insuranceCompany}
                            onChange={(e) => handleInputChange('insuranceCompany', e.target.value)}
                            placeholder="Ex: Porto Seguro, Bradesco"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insurancePremiumValue" className="text-gray-300 font-medium">Prêmio Anual (R$)</Label>
                        <Input
                            id="insurancePremiumValue"
                            type="number"
                            step="0.01"
                            value={formData.insurancePremiumValue}
                            onChange={(e) => handleInputChange('insurancePremiumValue', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 8500.00"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insuranceCoverageType" className="text-gray-300 font-medium">Tipo de Cobertura</Label>
                        <Input
                            id="insuranceCoverageType"
                            value={formData.insuranceCoverageType}
                            onChange={(e) => handleInputChange('insuranceCoverageType', e.target.value)}
                            placeholder="Ex: Todo risco, Colisão, RC"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vencimentoSeguro" className="text-gray-300 font-medium">Data Vencimento</Label>
                        <Input
                            id="vencimentoSeguro"
                            type="date"
                            value={formData.vencimentoSeguro ? formData.vencimentoSeguro.toISOString().split('T')[0] : ''}
                            onChange={(e) => handleInputChange('vencimentoSeguro', e.target.value ? new Date(e.target.value) : null)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            {/* Segunda Apólice */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Segunda Apólice (Opcional)</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="insuranceSecondPolicyNumber" className="text-gray-300 font-medium">Nº Apólice 2</Label>
                        <Input
                            id="insuranceSecondPolicyNumber"
                            value={formData.insuranceSecondPolicyNumber}
                            onChange={(e) => handleInputChange('insuranceSecondPolicyNumber', e.target.value)}
                            placeholder="Número da segunda apólice"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insuranceSecondCompany" className="text-gray-300 font-medium">Seguradora 2</Label>
                        <Input
                            id="insuranceSecondCompany"
                            value={formData.insuranceSecondCompany}
                            onChange={(e) => handleInputChange('insuranceSecondCompany', e.target.value)}
                            placeholder="Segunda seguradora"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insuranceSecondPremiumValue" className="text-gray-300 font-medium">Prêmio Anual 2 (R$)</Label>
                        <Input
                            id="insuranceSecondPremiumValue"
                            type="number"
                            step="0.01"
                            value={formData.insuranceSecondPremiumValue}
                            onChange={(e) => handleInputChange('insuranceSecondPremiumValue', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Valor do prêmio"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="insuranceSecondExpiryDate" className="text-gray-300 font-medium">Vencimento Apólice 2</Label>
                        <Input
                            id="insuranceSecondExpiryDate"
                            type="date"
                            value={formData.insuranceSecondExpiryDate}
                            onChange={(e) => handleInputChange('insuranceSecondExpiryDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
