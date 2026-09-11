import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleFormSectionProps, FinancingStatus } from '../types';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

const FINANCING_STATUS_OPTIONS: { value: FinancingStatus; label: string; icon: string }[] = [
    { value: 'OWNED', label: 'Próprio / Quitado', icon: '✅' },
    { value: 'FINANCED', label: 'Financiado', icon: '🏦' },
    { value: 'LEASED', label: 'Alugado / Locação', icon: '📋' },
    { value: 'RENTED', label: 'Cedido / Empréstimo', icon: '🤝' },
];

export const VehicleFinancingSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="space-y-6">
            {/* Valor de Mercado */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Valor de Mercado</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="marketValue" className="text-gray-300 font-medium">Valor de Mercado (R$)</Label>
                        <Input
                            id="marketValue"
                            type="number"
                            step="0.01"
                            value={formData.marketValue}
                            onChange={(e) => handleInputChange('marketValue', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 250000.00"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="acquisitionValue" className="text-gray-300 font-medium">Valor de Aquisição (R$)</Label>
                        <Input
                            id="acquisitionValue"
                            type="number"
                            step="0.01"
                            value={formData.valor_aquisicao}
                            onChange={(e) => handleInputChange('valor_aquisicao', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 300000.00"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
                        />
                    </div>
                </div>
            </div>

            {/* Status do Financiamento */}
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Status do Financiamento</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="financingStatus" className="text-gray-300 font-medium">Status</Label>
                        <Select value={formData.financingStatus} onValueChange={(value) => handleInputChange('financingStatus', value)}>
                            <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-600">
                                {FINANCING_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.icon} {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingBankOrInstitution" className="text-gray-300 font-medium">Banco / Instituição</Label>
                        <Input
                            id="financingBankOrInstitution"
                            value={formData.financingBankOrInstitution}
                            onChange={(e) => handleInputChange('financingBankOrInstitution', e.target.value)}
                            placeholder="Ex: Itaú, Bradesco"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingContractNumber" className="text-gray-300 font-medium">Nº Contrato</Label>
                        <Input
                            id="financingContractNumber"
                            value={formData.financingContractNumber}
                            onChange={(e) => handleInputChange('financingContractNumber', e.target.value)}
                            placeholder="Número do contrato"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingInstallmentValue" className="text-gray-300 font-medium">Valor da Parcela (R$)</Label>
                        <Input
                            id="financingInstallmentValue"
                            type="number"
                            step="0.01"
                            value={formData.financingInstallmentValue}
                            onChange={(e) => handleInputChange('financingInstallmentValue', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 3500.00"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingRemainingInstallments" className="text-gray-300 font-medium">Parcelas Restantes</Label>
                        <Input
                            id="financingRemainingInstallments"
                            type="number"
                            value={formData.financingRemainingInstallments}
                            onChange={(e) => handleInputChange('financingRemainingInstallments', parseInt(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 36"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingPayoffBalance" className="text-gray-300 font-medium">Saldo para Quitação (R$)</Label>
                        <Input
                            id="financingPayoffBalance"
                            type="number"
                            step="0.01"
                            value={formData.financingPayoffBalance}
                            onChange={(e) => handleInputChange('financingPayoffBalance', parseFloat(e.target.value) || 0)}
                            min="0"
                            placeholder="Ex: 126000.00"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingStartDate" className="text-gray-300 font-medium">Data Início</Label>
                        <Input
                            id="financingStartDate"
                            type="date"
                            value={formData.financingStartDate}
                            onChange={(e) => handleInputChange('financingStartDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financingEndDate" className="text-gray-300 font-medium">Data Término</Label>
                        <Input
                            id="financingEndDate"
                            type="date"
                            value={formData.financingEndDate}
                            onChange={(e) => handleInputChange('financingEndDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financialDifference" className="text-gray-300 font-medium">Diferença (R$)</Label>
                        <Input
                            id="financialDifference"
                            type="number"
                            step="0.01"
                            value={formData.financialDifference}
                            onChange={(e) => handleInputChange('financialDifference', parseFloat(e.target.value) || 0)}
                            placeholder="Valor mercado - Saldo quitação"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
