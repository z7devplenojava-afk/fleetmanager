import React from 'react';
import { Label } from '@/components/ui/label';
import { Wrench, CalendarDays } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';

export const VehicleMaintenanceInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="space-y-6">
            {/* Manutenção */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="dataManutencao" className="text-gray-300 font-medium">
                        Data da Última Manutenção
                    </Label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.dataManutencao}
                            onChange={(date: Date | null) => handleInputChange('dataManutencao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 rounded-md h-10 border"
                            placeholderText="Auto preenchimento"
                            readOnly
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <span className="text-orange-400">ℹ️</span>
                        Buscada automaticamente da tabela de manutenções
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proximaManutencao" className="text-gray-300 font-medium">
                        Próxima Manutenção
                    </Label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.proximaManutencao}
                            onChange={(date: Date | null) => handleInputChange('proximaManutencao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 rounded-md h-10 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>
            </div>

            {/* Vencimentos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="vencimentoSeguro" className="text-gray-300 font-medium">
                        Vencimento do Seguro
                    </Label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.vencimentoSeguro}
                            onChange={(date: Date | null) => handleInputChange('vencimentoSeguro', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 rounded-md h-10 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="vencimentoDocumentacao" className="text-gray-300 font-medium">
                        Vencimento da Documentação
                    </Label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.vencimentoDocumentacao}
                            onChange={(date: Date | null) => handleInputChange('vencimentoDocumentacao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200 rounded-md h-10 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
