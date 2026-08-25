import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleFormSectionProps } from '../types';
import { Users, MapPin } from 'lucide-react';

export const VehicleClientSection: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Users className="h-5 w-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Cliente / Alocação do Veículo</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="clientName" className="text-gray-300 font-medium">Nome do Cliente</Label>
                        <Input
                            id="clientName"
                            value={formData.clientName}
                            onChange={(e) => handleInputChange('clientName', e.target.value)}
                            placeholder="Nome do cliente onde está alocado"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allocationContractNumber" className="text-gray-300 font-medium">Nº Contrato Alocação</Label>
                        <Input
                            id="allocationContractNumber"
                            value={formData.allocationContractNumber}
                            onChange={(e) => handleInputChange('allocationContractNumber', e.target.value)}
                            placeholder="Número do contrato"
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allocationStartDate" className="text-gray-300 font-medium">Data Início Alocação</Label>
                        <Input
                            id="allocationStartDate"
                            type="date"
                            value={formData.allocationStartDate}
                            onChange={(e) => handleInputChange('allocationStartDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allocationEndDate" className="text-gray-300 font-medium">Data Término Alocação</Label>
                        <Input
                            id="allocationEndDate"
                            type="date"
                            value={formData.allocationEndDate}
                            onChange={(e) => handleInputChange('allocationEndDate', e.target.value)}
                            className="bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                        />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-900/20 border border-indigo-700/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-indigo-300">
                            Informe o nome do cliente e detalhes do contrato de alocação para controle de onde o veículo está alocado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
