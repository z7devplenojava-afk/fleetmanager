import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VehicleFormSectionProps } from '../types';
import { Droplet, Filter, Disc, ShieldCheck, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface WearItemConfig {
    id: string;
    title: string;
    icon: React.ReactNode;
    lastKmField: keyof import('../types').VehicleFormData;
    intervalField?: keyof import('../types').VehicleFormData;
    defaultInterval: number;
    color: string;
}

export const VehicleWearAndWarrantySection: React.FC<VehicleFormSectionProps> = ({
    formData,
    handleInputChange
}) => {
    const currentKm = Number(formData.quilometragem) || 0;

    // Função para calcular status de desgaste baseado na KM
    const getWearStatus = (lastKm?: number, intervalKm: number = 10000) => {
        if (!lastKm || lastKm <= 0) {
            return {
                status: 'UNKNOWN',
                label: 'Não informado',
                color: 'text-gray-400',
                bgColor: 'bg-gray-800/60 border-gray-700',
                badgeBg: 'bg-gray-700 text-gray-300',
                percent: 0,
                kmRemaining: intervalKm,
                nextKm: currentKm + intervalKm
            };
        }

        const kmDrivenSince = currentKm - lastKm;
        const kmRemaining = intervalKm - kmDrivenSince;
        const percent = Math.min(100, Math.max(0, Math.round((kmDrivenSince / intervalKm) * 100)));
        const nextKm = lastKm + intervalKm;

        if (kmRemaining <= 0) {
            return {
                status: 'OVERDUE',
                label: `Vencido (${Math.abs(kmRemaining).toLocaleString('pt-BR')} km atrás)`,
                color: 'text-red-400',
                bgColor: 'bg-red-950/30 border-red-800/50',
                badgeBg: 'bg-red-900/60 text-red-300 border border-red-700/60',
                percent: 100,
                kmRemaining,
                nextKm
            };
        }

        if (kmRemaining <= intervalKm * 0.15 || kmRemaining <= 1500) {
            return {
                status: 'WARNING',
                label: `Atenção: faltam ${kmRemaining.toLocaleString('pt-BR')} km`,
                color: 'text-amber-400',
                bgColor: 'bg-amber-950/30 border-amber-800/50',
                badgeBg: 'bg-amber-900/60 text-amber-300 border border-amber-700/60',
                percent,
                kmRemaining,
                nextKm
            };
        }

        return {
            status: 'OK',
            label: `Em dia (restam ${kmRemaining.toLocaleString('pt-BR')} km)`,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-950/30 border-emerald-800/50',
            badgeBg: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60',
            percent,
            kmRemaining,
            nextKm
        };
    };

    // Cálculos dos itens
    const oilInterval = Number(formData.oilChangeIntervalKm) || 10000;
    const oilStatus = getWearStatus(formData.lastOilChangeKm, oilInterval);

    const timingBeltInterval = Number(formData.timingBeltIntervalKm) || 50000;
    const timingBeltStatus = getWearStatus(formData.lastTimingBeltChangeKm, timingBeltInterval);

    const oilFilterStatus = getWearStatus(formData.lastOilFilterChangeKm, oilInterval);
    const airFilterStatus = getWearStatus(formData.lastAirFilterChangeKm, 15000);
    const fuelFilterStatus = getWearStatus(formData.lastFuelFilterChangeKm, 20000);
    const cabinFilterStatus = getWearStatus(formData.lastCabinFilterChangeKm, 15000);

    // Status da Garantia de Fábrica
    const getWarrantyStatus = () => {
        const warrantyDate = formData.warrantyExpiryDate ? new Date(formData.warrantyExpiryDate) : null;
        const warrantyKm = Number(formData.warrantyLimitKm) || 0;
        const today = new Date();

        if (!warrantyDate && !warrantyKm) {
            return { label: 'Não informado', badge: 'bg-gray-700 text-gray-300', active: false };
        }

        const isDateExpired = warrantyDate ? warrantyDate < today : false;
        const isKmExpired = warrantyKm > 0 ? currentKm > warrantyKm : false;

        if (isDateExpired || isKmExpired) {
            return {
                label: `Garantia Expirada ${isKmExpired ? `(KM excedida)` : `(Prazo vencido)`}`,
                badge: 'bg-red-900/60 text-red-300 border border-red-700/60',
                active: false
            };
        }

        return {
            label: 'Garantia Ativa de Fábrica',
            badge: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60',
            active: true
        };
    };

    const warrantyInfo = getWarrantyStatus();

    return (
        <div className="space-y-6">
            {/* Header com resumo de KM */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-900/60 border border-gray-700 rounded-lg">
                <div>
                    <h4 className="text-base font-semibold text-white flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-yellow-400" />
                        Troca Periódica de Óleo, Filtros, Correias e Garantia
                    </h4>
                    <p className="text-xs text-gray-400">
                        O sistema calcula a vida útil e emite alertas com base na quilometragem atual do veículo ({currentKm.toLocaleString('pt-BR')} km).
                    </p>
                </div>
                <div className="px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-lg text-xs flex items-center gap-2">
                    <span className="text-gray-400">Odômetro Atual:</span>
                    <span className="font-bold text-white text-sm">{currentKm.toLocaleString('pt-BR')} KM</span>
                </div>
            </div>

            {/* Grid dos Itens Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. ÓLEO DE MOTOR */}
                <div className={`p-4 rounded-lg border transition-all duration-200 ${oilStatus.bgColor}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-yellow-500/20 rounded-lg">
                                <Droplet className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white text-sm">Óleo do Motor</h5>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${oilStatus.badgeBg}`}>
                                    {oilStatus.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Barra de Progresso de Desgaste */}
                    <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                            <span>Vida útil do óleo</span>
                            <span className="font-medium text-white">{oilStatus.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    oilStatus.status === 'OVERDUE'
                                        ? 'bg-red-500'
                                        : oilStatus.status === 'WARNING'
                                        ? 'bg-amber-400'
                                        : 'bg-emerald-500'
                                }`}
                                style={{ width: `${oilStatus.percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="space-y-1">
                            <Label className="text-gray-400 text-[11px]">KM da Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastOilChangeKm || ''}
                                onChange={(e) => handleInputChange('lastOilChangeKm', Number(e.target.value))}
                                placeholder="Ex: 45000"
                                className="bg-gray-900/80 border-gray-600 text-white h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-400 text-[11px]">Intervalo (KM)</Label>
                            <Input
                                type="number"
                                value={formData.oilChangeIntervalKm || 10000}
                                onChange={(e) => handleInputChange('oilChangeIntervalKm', Number(e.target.value))}
                                placeholder="10000"
                                className="bg-gray-900/80 border-gray-600 text-white h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                            <Label className="text-gray-400 text-[11px]">Data da Troca</Label>
                            <Input
                                type="date"
                                value={formData.lastOilChangeDate || ''}
                                onChange={(e) => handleInputChange('lastOilChangeDate', e.target.value)}
                                className="bg-gray-900/80 border-gray-600 text-white h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. CORREIA DENTADA / ACESSÓRIOS */}
                <div className={`p-4 rounded-lg border transition-all duration-200 ${timingBeltStatus.bgColor}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-500/20 rounded-lg">
                                <Disc className="h-5 w-5 text-orange-400" />
                            </div>
                            <div>
                                <h5 className="font-semibold text-white text-sm">Correia Dentada / Acessórios</h5>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${timingBeltStatus.badgeBg}`}>
                                    {timingBeltStatus.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                            <span>Desgaste da correia</span>
                            <span className="font-medium text-white">{timingBeltStatus.percent}%</span>
                        </div>
                        <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    timingBeltStatus.status === 'OVERDUE'
                                        ? 'bg-red-500'
                                        : timingBeltStatus.status === 'WARNING'
                                        ? 'bg-amber-400'
                                        : 'bg-emerald-500'
                                }`}
                                style={{ width: `${timingBeltStatus.percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                            <Label className="text-gray-400 text-[11px]">KM da Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastTimingBeltChangeKm || ''}
                                onChange={(e) => handleInputChange('lastTimingBeltChangeKm', Number(e.target.value))}
                                placeholder="Ex: 80000"
                                className="bg-gray-900/80 border-gray-600 text-white h-8 text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-gray-400 text-[11px]">Intervalo (KM)</Label>
                            <Input
                                type="number"
                                value={formData.timingBeltIntervalKm || 50000}
                                onChange={(e) => handleInputChange('timingBeltIntervalKm', Number(e.target.value))}
                                placeholder="50000"
                                className="bg-gray-900/80 border-gray-600 text-white h-8 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid dos 4 Filtros */}
            <div>
                <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-cyan-400" />
                    Controle de Filtros
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Filtro de Óleo */}
                    <div className={`p-3 rounded-lg border ${oilFilterStatus.bgColor} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Filtro de Óleo</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${oilFilterStatus.badgeBg}`}>
                                {oilFilterStatus.status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-400">KM Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastOilFilterChangeKm || ''}
                                onChange={(e) => handleInputChange('lastOilFilterChangeKm', Number(e.target.value))}
                                placeholder="KM troca"
                                className="bg-gray-900/80 border-gray-600 text-white h-7 text-xs"
                            />
                        </div>
                    </div>

                    {/* Filtro de Ar do Motor */}
                    <div className={`p-3 rounded-lg border ${airFilterStatus.bgColor} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Filtro de Ar Motor</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${airFilterStatus.badgeBg}`}>
                                {airFilterStatus.status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-400">KM Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastAirFilterChangeKm || ''}
                                onChange={(e) => handleInputChange('lastAirFilterChangeKm', Number(e.target.value))}
                                placeholder="KM troca"
                                className="bg-gray-900/80 border-gray-600 text-white h-7 text-xs"
                            />
                        </div>
                    </div>

                    {/* Filtro de Combustível */}
                    <div className={`p-3 rounded-lg border ${fuelFilterStatus.bgColor} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Filtro de Combustível</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${fuelFilterStatus.badgeBg}`}>
                                {fuelFilterStatus.status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-400">KM Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastFuelFilterChangeKm || ''}
                                onChange={(e) => handleInputChange('lastFuelFilterChangeKm', Number(e.target.value))}
                                placeholder="KM troca"
                                className="bg-gray-900/80 border-gray-600 text-white h-7 text-xs"
                            />
                        </div>
                    </div>

                    {/* Filtro de Cabine */}
                    <div className={`p-3 rounded-lg border ${cabinFilterStatus.bgColor} space-y-2`}>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white">Filtro de Cabine (AC)</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${cabinFilterStatus.badgeBg}`}>
                                {cabinFilterStatus.status}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px] text-gray-400">KM Última Troca</Label>
                            <Input
                                type="number"
                                value={formData.lastCabinFilterChangeKm || ''}
                                onChange={(e) => handleInputChange('lastCabinFilterChangeKm', Number(e.target.value))}
                                placeholder="KM troca"
                                className="bg-gray-900/80 border-gray-600 text-white h-7 text-xs"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Garantia do Fabricante / Montadora */}
            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-indigo-400" />
                        <h5 className="font-semibold text-white text-sm">Garantia de Fábrica / Montadora</h5>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${warrantyInfo.badge}`}>
                        {warrantyInfo.label}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                        <Label htmlFor="warrantyExpiryDate" className="text-gray-300 font-medium">
                            Data Limite da Garantia
                        </Label>
                        <Input
                            id="warrantyExpiryDate"
                            type="date"
                            value={formData.warrantyExpiryDate || ''}
                            onChange={(e) => handleInputChange('warrantyExpiryDate', e.target.value)}
                            className="bg-gray-900/80 border-gray-600 text-white h-9"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="warrantyLimitKm" className="text-gray-300 font-medium">
                            Quilometragem Limite da Garantia (KM)
                        </Label>
                        <Input
                            id="warrantyLimitKm"
                            type="number"
                            value={formData.warrantyLimitKm || ''}
                            onChange={(e) => handleInputChange('warrantyLimitKm', Number(e.target.value))}
                            placeholder="Ex: 100000"
                            className="bg-gray-900/80 border-gray-600 text-white h-9"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
