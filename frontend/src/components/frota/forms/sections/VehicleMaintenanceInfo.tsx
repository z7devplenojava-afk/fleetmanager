import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Wrench, CalendarDays, CheckCircle2, AlertTriangle, Clock, Plus, Sparkles, FileText, UserCheck, DollarSign, RefreshCw } from 'lucide-react';
import { VehicleFormSectionProps } from '../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ptBR } from 'date-fns/locale';
import { DEFAULT_DATE_PICKER_PROPS } from '@/utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { fleetWorkOrderService, FleetWorkOrder } from '@/services/fleetWorkOrderService';
import fleetService from '@/services/fleetService';
import { Maintenance } from '@/types/fleet';
import { formatCurrency } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

interface PreventivePlanItem {
    id: string;
    name: string;
    description: string;
    intervalKm: number;
    intervalMonths: number;
    lastDoneKm?: number;
    lastDoneDate?: string;
    targetKm?: number;
    status: 'OK' | 'WARNING' | 'OVERDUE';
}

export const VehicleMaintenanceInfo: React.FC<VehicleFormSectionProps> = ({ formData, handleInputChange }) => {
    const { toast } = useToast();
    const vehicleId = formData.vehicleId || '';
    const plate = formData.placa?.toUpperCase() || '';
    const currentKm = Number(formData.quilometragem) || 0;

    // Buscar Ordens de Serviço do Veículo
    const { data: workOrders, isLoading: woLoading, refetch: refetchWO } = useQuery({
        queryKey: ['vehicle-work-orders', vehicleId, plate],
        queryFn: async () => {
            const all = await fleetWorkOrderService.getWorkOrders();
            return all.filter(wo => (vehicleId && wo.vehicleId === vehicleId) || (plate && wo.vehiclePlate?.toUpperCase() === plate));
        },
        enabled: Boolean(vehicleId || plate),
        retry: 1
    });

    // Buscar Manutenções Gerais do Veículo
    const { data: maintenances, isLoading: maintLoading } = useQuery({
        queryKey: ['vehicle-maintenances', vehicleId, plate],
        queryFn: async () => {
            return fleetService.getMaintenances(vehicleId || undefined);
        },
        enabled: Boolean(vehicleId),
        retry: 1
    });

    // Identificar a Última OS Aberta / Em Andamento ou mais recente
    const latestWorkOrder = React.useMemo(() => {
        if (!workOrders || workOrders.length === 0) return null;
        // Priorizar status OPEN ou IN_PROGRESS
        const activeWO = workOrders.find(wo => wo.status === 'OPEN' || wo.status === 'IN_PROGRESS' || wo.status === 'PENDING');
        if (activeWO) return activeWO;
        // Caso contrário, pegar a mais recente
        return [...workOrders].sort((a, b) => new Date(b.entryDate || b.createdAt || 0).getTime() - new Date(a.entryDate || a.createdAt || 0).getTime())[0];
    }, [workOrders]);

    // Estado local para Planos Preventivos Gerados
    const [preventivePlans, setPreventivePlans] = useState<PreventivePlanItem[]>([
        {
            id: 'plan-1',
            name: 'Revisão Básica (Óleo & Filtro)',
            description: 'Troca de óleo do motor, filtro de óleo e inspeção geral de níveis',
            intervalKm: 10000,
            intervalMonths: 6,
            lastDoneKm: formData.lastOilChangeKm || (currentKm > 10000 ? currentKm - 8000 : 0),
            targetKm: (formData.lastOilChangeKm || currentKm) + 10000,
            status: currentKm - (formData.lastOilChangeKm || 0) >= 10000 ? 'OVERDUE' : currentKm - (formData.lastOilChangeKm || 0) >= 8500 ? 'WARNING' : 'OK'
        },
        {
            id: 'plan-2',
            name: 'Revisão Intermediária (Filtros & Freios)',
            description: 'Filtro de ar, combustível, ar-condicionado, pastilhas e fluído de freio',
            intervalKm: 20000,
            intervalMonths: 12,
            lastDoneKm: formData.lastAirFilterChangeKm || (currentKm > 20000 ? currentKm - 12000 : 0),
            targetKm: (formData.lastAirFilterChangeKm || currentKm) + 20000,
            status: currentKm - (formData.lastAirFilterChangeKm || 0) >= 20000 ? 'OVERDUE' : 'OK'
        },
        {
            id: 'plan-3',
            name: 'Revisão Pesada (Correias & Suspensão)',
            description: 'Correia dentada, correias auxiliares, amortecedores, buchas e alinhamento',
            intervalKm: 50000,
            intervalMonths: 24,
            lastDoneKm: formData.lastTimingBeltChangeKm || (currentKm > 50000 ? currentKm - 35000 : 0),
            targetKm: (formData.lastTimingBeltChangeKm || currentKm) + 50000,
            status: currentKm - (formData.lastTimingBeltChangeKm || 0) >= 50000 ? 'OVERDUE' : 'OK'
        }
    ]);

    // Ação: Aplicar Grade Padrão de Planos do Fabricante / Cliente
    const handleApplyRecommendedPlans = () => {
        const standardPlans: PreventivePlanItem[] = [
            {
                id: `rec-1-${Date.now()}`,
                name: 'Revisão A - 10.000 KM (Exigência Fabricante)',
                description: 'Troca de Óleo Lubrificante 5W30/15W40, Filtro de Óleo, Verificação de Fluidos e Checklist 30 itens',
                intervalKm: 10000,
                intervalMonths: 6,
                lastDoneKm: currentKm,
                targetKm: currentKm + 10000,
                status: 'OK'
            },
            {
                id: `rec-2-${Date.now()}`,
                name: 'Revisão B - 20.000 KM (Exigência Fabricante & Cliente)',
                description: 'Filtro de Ar do Motor, Filtro de Combustível, Filtro de Cabine AC, Pastilhas e Discos de Freio',
                intervalKm: 20000,
                intervalMonths: 12,
                lastDoneKm: currentKm,
                targetKm: currentKm + 20000,
                status: 'OK'
            },
            {
                id: `rec-3-${Date.now()}`,
                name: 'Revisão C - 40.000 KM (Sistema de Arrefecimento & Transmissão)',
                description: 'Líquido de Arrefecimento, Óleo de Câmbio/Diferencial, Velas de Ignição e Geometria Completa',
                intervalKm: 40000,
                intervalMonths: 24,
                lastDoneKm: currentKm,
                targetKm: currentKm + 40000,
                status: 'OK'
            },
            {
                id: `rec-4-${Date.now()}`,
                name: 'Revisão D - 50.000 KM (Correias & Tensores)',
                description: 'Kit de Correia Dentada / Correia de Acessórios, Tensores, Bomba d’Água e Válvula Termostática',
                intervalKm: 50000,
                intervalMonths: 36,
                lastDoneKm: currentKm,
                targetKm: currentKm + 50000,
                status: 'OK'
            }
        ];

        setPreventivePlans(standardPlans);
        toast({
            title: "Planos Recomendados Aplicados!",
            description: "A grade de 4 revisões preventivas do fabricante foi gerada para este veículo.",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
            case 'FINALIZADA':
            case 'CONCLUIDA':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">Concluída</span>;
            case 'IN_PROGRESS':
            case 'EM_ANDAMENTO':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/60 text-blue-300 border border-blue-700/50">Em Andamento</span>;
            case 'OVERDUE':
            case 'VENCIDA':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-900/60 text-red-300 border border-red-700/50">Vencido</span>;
            case 'WARNING':
            case 'ATENCAO':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-900/60 text-amber-300 border border-amber-700/50">Próximo</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-700 text-gray-300">Aberta / Agendada</span>;
        }
    };

    return (
        <div className="space-y-6">

            {/* 1. DESTAQUE: ÚLTIMA ORDEM DE SERVIÇO (OS) ABERTA / RECENTE */}
            <div className="p-4 bg-gradient-to-r from-gray-900/90 via-gray-800/60 to-gray-900/90 border border-orange-500/40 rounded-lg shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-700/60 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-orange-500/20 rounded-lg">
                            <Wrench className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                Última Ordem de Serviço (OS) do Veículo
                            </h4>
                            <p className="text-xs text-gray-400">Status atual de manutenção em oficina ou pátio</p>
                        </div>
                    </div>
                    {latestWorkOrder && getStatusBadge(latestWorkOrder.status)}
                </div>

                {latestWorkOrder ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-gray-300">
                        <div>
                            <span className="text-gray-400 block mb-0.5">Nº da OS:</span>
                            <span className="font-bold text-white text-sm">
                                {latestWorkOrder.orderNumber || (latestWorkOrder as any).code || 'OS-AUTOMÁTICA'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block mb-0.5">Data de Abertura:</span>
                            <span className="font-medium text-white">
                                {latestWorkOrder.entryDate ? new Date(latestWorkOrder.entryDate).toLocaleDateString('pt-BR') : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block mb-0.5">Tipo / Responsável:</span>
                            <span className="font-medium text-white truncate block">
                                {latestWorkOrder.maintenanceType || 'PREVENTIVA'} • {latestWorkOrder.mechanicName || 'Oficina Geral'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-400 block mb-0.5">KM Registrado:</span>
                            <span className="font-medium text-orange-400">
                                {latestWorkOrder.odometerIn ? `${latestWorkOrder.odometerIn.toLocaleString('pt-BR')} km` : `${currentKm.toLocaleString('pt-BR')} km`}
                            </span>
                        </div>
                        {latestWorkOrder.description && (
                            <div className="col-span-2 sm:col-span-4 mt-1 p-2 bg-gray-950/60 rounded border border-gray-800 text-[11px]">
                                <span className="text-gray-400 font-medium">Serviços / Descrição: </span>
                                <span className="text-gray-200">{latestWorkOrder.description}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-3 text-center text-xs text-gray-400">
                        Nenhuma Ordem de Serviço aberta no momento. O veículo encontra-se liberado para operação.
                    </div>
                )}
            </div>

            {/* 2. PLANOS DE MANUTENÇÃO PREVENTIVA (DO FABRICANTE E DO CLIENTE) */}
            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-700 pb-3">
                    <div>
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            Planos de Manutenção Preventiva do Veículo
                        </h4>
                        <p className="text-xs text-gray-400">
                            Revisões periódicas programadas de acordo com as exigências do fabricante e do contrato com o cliente.
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleApplyRecommendedPlans}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 flex items-center gap-1.5 shadow"
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                        Aplicar Planos Recomendados (Fabricante/Cliente)
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {preventivePlans.map((plan) => {
                        const kmRemaining = plan.targetKm ? plan.targetKm - currentKm : plan.intervalKm;
                        const isOverdue = kmRemaining <= 0;

                        return (
                            <div
                                key={plan.id}
                                className={`p-3 rounded-lg border transition-all ${
                                    isOverdue
                                        ? 'bg-red-950/20 border-red-800/50'
                                        : kmRemaining <= 1500
                                        ? 'bg-amber-950/20 border-amber-800/50'
                                        : 'bg-gray-800/40 border-gray-700'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <h5 className="font-semibold text-white text-xs">{plan.name}</h5>
                                    {isOverdue ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-900/80 text-red-300">
                                            VENCIDO ({Math.abs(kmRemaining).toLocaleString('pt-BR')} km)
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-900/60 text-emerald-300">
                                            Faltam {kmRemaining.toLocaleString('pt-BR')} km
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 mb-2">{plan.description}</p>
                                <div className="flex items-center justify-between text-[11px] text-gray-300 pt-1.5 border-t border-gray-700/50">
                                    <span>Intervalo: <strong>{plan.intervalKm.toLocaleString('pt-BR')} KM</strong> ({plan.intervalMonths} meses)</span>
                                    <span>Próxima: <strong>{plan.targetKm?.toLocaleString('pt-BR')} KM</strong></span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. HISTÓRICO COMPLETO DE MANUTENÇÕES */}
            <div className="p-4 bg-gray-900/40 border border-gray-700 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-400" />
                        Histórico de Manutenções Realizadas
                    </h4>
                    <span className="text-xs text-gray-400">
                        {maintenances?.length || workOrders?.length || 0} registro(s)
                    </span>
                </div>

                <div className="border border-gray-700 rounded-lg overflow-hidden bg-gray-900/60">
                    <div className="overflow-x-auto max-h-48">
                        <table className="w-full text-left text-xs text-gray-300">
                            <thead className="bg-gray-800 text-gray-400 sticky top-0 uppercase font-semibold text-[10px]">
                                <tr>
                                    <th className="px-3 py-2">Data</th>
                                    <th className="px-3 py-2">Tipo / Descrição</th>
                                    <th className="px-3 py-2">KM</th>
                                    <th className="px-3 py-2">Custo</th>
                                    <th className="px-3 py-2 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/60">
                                {workOrders && workOrders.length > 0 ? (
                                    workOrders.map((wo: FleetWorkOrder) => (
                                        <tr key={wo.id} className="hover:bg-gray-800/40">
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                {wo.entryDate ? new Date(wo.entryDate).toLocaleDateString('pt-BR') : '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                <span className="font-medium text-white">{wo.orderNumber || 'OS'}</span> — {wo.description || wo.maintenanceType}
                                            </td>
                                            <td className="px-3 py-2 text-gray-300">
                                                {wo.odometerIn ? `${wo.odometerIn.toLocaleString('pt-BR')} km` : '-'}
                                            </td>
                                            <td className="px-3 py-2 font-medium text-emerald-400">
                                                {formatCurrency(Number(wo.totalCost) || 0)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                {getStatusBadge(wo.status)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                                            Nenhum histórico prévio registrado para este veículo.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 4. DATAS DE CONTROLE E VENCIMENTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-900/30 border border-gray-700 rounded-lg">
                <div className="space-y-1.5">
                    <Label htmlFor="dataManutencao" className="text-gray-300 text-xs font-medium">
                        Data Última Manutenção
                    </Label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.dataManutencao}
                            onChange={(date: Date | null) => handleInputChange('dataManutencao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-9 bg-gray-900/70 border-gray-600 text-white text-xs rounded-md h-9 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="proximaManutencao" className="text-gray-300 text-xs font-medium">
                        Próxima Manutenção
                    </Label>
                    <div className="relative">
                        <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.proximaManutencao}
                            onChange={(date: Date | null) => handleInputChange('proximaManutencao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-9 bg-gray-900/70 border-gray-600 text-white text-xs rounded-md h-9 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="vencimentoSeguro" className="text-gray-300 text-xs font-medium">
                        Vencimento do Seguro
                    </Label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.vencimentoSeguro}
                            onChange={(date: Date | null) => handleInputChange('vencimentoSeguro', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-9 bg-gray-900/70 border-gray-600 text-white text-xs rounded-md h-9 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="vencimentoDocumentacao" className="text-gray-300 text-xs font-medium">
                        Vencimento Documentação
                    </Label>
                    <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <DatePicker
                            selected={formData.vencimentoDocumentacao}
                            onChange={(date: Date | null) => handleInputChange('vencimentoDocumentacao', date)}
                            {...DEFAULT_DATE_PICKER_PROPS}
                            locale={ptBR}
                            className="w-full pl-9 bg-gray-900/70 border-gray-600 text-white text-xs rounded-md h-9 border"
                            placeholderText="DD/MM/AAAA"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
