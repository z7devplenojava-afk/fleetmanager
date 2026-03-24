import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';

export const VehicleFinancialInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
                <Label htmlFor="data_aquisicao" className="text-gray-300 font-medium">
                    Data de Aquisição
                </Label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                    <DatePicker
                        selected={formData.data_aquisicao}
                        onChange={(date: Date | null) => handleInputChange('data_aquisicao', date)}
                        {...DEFAULT_DATE_PICKER_PROPS}
                        locale={ptBR}
                        className="w-full pl-10 bg-gray-900/50 border-gray-600 text-white focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200 rounded-md h-10 border"
                        placeholderText="DD/MM/AAAA"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="valor_aquisicao" className="text-gray-300 font-medium">
                    Valor de Aquisição
                </Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold text-lg">R$</span>
                    <Input
                        id="valor_aquisicao"
                        type="number"
                        step="0.01"
                        value={formData.valor_aquisicao}
                        onChange={(e) => handleInputChange('valor_aquisicao', e.target.value)}
                        min="0"
                        placeholder="0,00"
                        className="pl-12 bg-gray-900/50 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20 transition-all duration-200"
                    />
                </div>
            </div>
        </div>
    );
};
