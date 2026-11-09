import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Wrench,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Search,
    ChevronDown,
    ChevronUp,
    Filter,
    Plus,
    RotateCcw,
    Gauge,
    Calendar,
    Sparkles,
    ShieldAlert,
    ShieldCheck,
    FileText,
    ArrowRight
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import vehicleMaintenanceStatusService, {
    MaintenancePlanDTO,
    VehicleMaintenanceAlert
} from '@/services/vehicleMaintenanceStatusService';
import {
    MAINTENANCE_PLAN_PRESETS,
    MAINTENANCE_CATEGORIES,
    MaintenanceItemPreset
} from '@/data/maintenancePlanPresets';
import { Vehicle } from '@/types/fleet';
import { useToast } from '@/components/ui/use-toast';

interface GestaoPlanoManutencaoFrotaProps {
    veiculos: Vehicle[];
    onOpenOs?: (vehiclePlate: string, taskName: string) => void;
}

interface ItemStatusCalculated {
    presetId: string;
    taskName: string;
    category: string;
    categoryLabel: string;
    intervalKm: number;
    intervalDays?: number;
    lastKm: number;
    lastDate?: string;
    nextDueKm: number;
    nextDueDate?: string;
    kmRemaining: number;
    daysRemaining?: number;
    alertLevel: 'OVERDUE' | 'UPCOMING' | 'OK';
    planId?: string;
}

export const GestaoPlanoManutencaoFrota: React.FC<GestaoPlanoManutencaoFrotaProps> = ({
    veiculos,
    onOpenOs
}) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'UPCOMING' | 'OK'>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [regimeFilter, setRegimeFilter] = useState<'ALL' | 'URBAN' | 'ROAD'>('ALL');
    const [expandedVehicleIds, setExpandedVehicleIds] = useState<Record<string, boolean>>({});

    // Estado do Modal de Registro de Troca/Execução
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [selectedVehicleForExecution, setSelectedVehicleForExecution] = useState<Vehicle | null>(null);
    const [selectedItemForExecution, setSelectedItemForExecution] = useState<ItemStatusCalculated | null>(null);
    const [executionKm, setExecutionKm] = useState<number>(0);
    const [executionDate, setExecutionDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [executionNotes, setExecutionNotes] = useState<string>('');
    const [isSavingExecution, setIsSavingExecution] = useState(false);

    // Buscar planos cadastrados no banco
    const { data: serverPlans = [], isLoading: isLoadingPlans } = useQuery({
        queryKey: ['maintenance-plans-all'],
        queryFn: () => vehicleMaintenanceStatusService.getAllPlans(),
        retry: 1
    });

    // Mapeamento de planos por veículo e por taskName
    const plansByVehicleMap = useMemo(() => {
        const map = new Map<string, Map<string, MaintenancePlanDTO>>();
        serverPlans.forEach((plan) => {
            if (!plan.vehicleId) return;
            if (!map.has(plan.vehicleId)) {
                map.set(plan.vehicleId, new Map());
            }
            map.get(plan.vehicleId)!.set(plan.taskName.toLowerCase().trim(), plan);
        });
        return map;
    }, [serverPlans]);

    // Cálculo do status para cada veículo e seus 20 itens
    const vehicleCalculatedList = useMemo(() => {
        const today = new Date();

        return veiculos.map((v) => {
            const currentKm = v.currentMileage || v.mileage || (v as any).quilometragem || 0;
            const vehicleTypeUpper = (v.type || (v as any).tipo || '').toUpperCase();
            const isUrban =
                vehicleTypeUpper.includes('URBAN') ||
                vehicleTypeUpper.includes('MICRO') ||
                regimeFilter === 'URBAN';
            const vehicleRegime: 'URBAN' | 'ROAD' = isUrban ? 'URBAN' : 'ROAD';

            const vehiclePlanMap = plansByVehicleMap.get(v.id);

            const items: ItemStatusCalculated[] = MAINTENANCE_PLAN_PRESETS.map((preset) => {
                const intervalKm = isUrban ? preset.intervalKmUrban : preset.intervalKmRoad;
                const intervalDays = preset.intervalDays;

                const existingPlan = vehiclePlanMap?.get(preset.taskName.toLowerCase().trim());

                const lastKm = existingPlan?.lastExecutionKm || 0;
                const lastDate = existingPlan?.lastExecutionDate;

                const nextDueKm = existingPlan?.nextDueKm || lastKm + intervalKm;
                const kmRemaining = nextDueKm - currentKm;

                let nextDueDate = existingPlan?.nextDueDate;
                let daysRemaining: number | undefined = undefined;

                if (lastDate && intervalDays) {
                    const lDate = new Date(lastDate);
                    const dDate = new Date(lDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
                    nextDueDate = dDate.toISOString().slice(0, 10);
                    daysRemaining = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                }

                // Critério de alerta: Vencido se KM estourado OU dias vencidos
                let alertLevel: 'OVERDUE' | 'UPCOMING' | 'OK' = 'OK';

                const isKmOverdue = kmRemaining <= 0 && lastKm > 0;
                const isDaysOverdue = daysRemaining !== undefined && daysRemaining <= 0;

                const isKmUpcoming = kmRemaining > 0 && kmRemaining <= 1000;
                const isDaysUpcoming = daysRemaining !== undefined && daysRemaining > 0 && daysRemaining <= 15;

                if (isKmOverdue || isDaysOverdue) {
                    alertLevel = 'OVERDUE';
                } else if (isKmUpcoming || isDaysUpcoming) {
                    alertLevel = 'UPCOMING';
                } else {
                    alertLevel = 'OK';
                }

                return {
                    presetId: preset.id,
                    taskName: preset.taskName,
                    category: preset.category,
                    categoryLabel: preset.categoryLabel,
                    intervalKm,
                    intervalDays,
                    lastKm,
                    lastDate,
                    nextDueKm,
                    nextDueDate,
                    kmRemaining,
                    daysRemaining,
                    alertLevel,
                    planId: existingPlan?.id
                };
            });

            const overdueCount = items.filter((i) => i.alertLevel === 'OVERDUE').length;
            const upcomingCount = items.filter((i) => i.alertLevel === 'UPCOMING').length;

            const overallStatus: 'OVERDUE' | 'UPCOMING' | 'OK' =
                overdueCount > 0 ? 'OVERDUE' : upcomingCount > 0 ? 'UPCOMING' : 'OK';

            return {
                vehicle: v,
                currentKm,
                vehicleRegime,
                items,
                overdueCount,
                upcomingCount,
                overallStatus
            };
        });
    }, [veiculos, plansByVehicleMap, regimeFilter]);

    // Totais de Resumo
    const summaryStats = useMemo(() => {
        let totalOverdueVehicles = 0;
        let totalUpcomingVehicles = 0;
        let totalOkVehicles = 0;

        vehicleCalculatedList.forEach((v) => {
            if (v.overallStatus === 'OVERDUE') totalOverdueVehicles++;
            else if (v.overallStatus === 'UPCOMING') totalUpcomingVehicles++;
            else totalOkVehicles++;
        });

        return {
            totalOverdueVehicles,
            totalUpcomingVehicles,
            totalOkVehicles,
            totalVehicles: vehicleCalculatedList.length
        };
    }, [vehicleCalculatedList]);

    // Filtragem da Lista
    const filteredVehicles = useMemo(() => {
        return vehicleCalculatedList.filter((item) => {
            const plate = (item.vehicle.plate || (item.vehicle as any).placa || '').toLowerCase();
            const model = (item.vehicle.model || (item.vehicle as any).modelo || '').toLowerCase();
            const brand = (item.vehicle.brand || (item.vehicle as any).marca || '').toLowerCase();
            const search = searchTerm.toLowerCase();

            const matchesSearch = !search || plate.includes(search) || model.includes(search) || brand.includes(search);

            const matchesStatus =
                statusFilter === 'ALL' || item.overallStatus === statusFilter;

            const matchesRegime =
                regimeFilter === 'ALL' || item.vehicleRegime === regimeFilter;

            const matchesCategory =
                categoryFilter === 'ALL' ||
                item.items.some((i) => i.category === categoryFilter && (statusFilter === 'ALL' || i.alertLevel === statusFilter));

            return matchesSearch && matchesStatus && matchesRegime && matchesCategory;
        });
    }, [vehicleCalculatedList, searchTerm, statusFilter, regimeFilter, categoryFilter]);

    // Abrir Modal de Execução
    const handleOpenExecutionModal = (vehicle: Vehicle, item: ItemStatusCalculated) => {
        setSelectedVehicleForExecution(vehicle);
        setSelectedItemForExecution(item);
        const currentKm = vehicle.currentMileage || vehicle.mileage || (vehicle as any).quilometragem || 0;
        setExecutionKm(currentKm);
        setExecutionDate(new Date().toISOString().slice(0, 10));
        setExecutionNotes('');
        setIsRecordModalOpen(true);
    };

    // Salvar Registro de Execução
    const handleSaveExecution = async () => {
        if (!selectedVehicleForExecution || !selectedItemForExecution) return;

        try {
            setIsSavingExecution(true);
            const nextDueKm = executionKm + selectedItemForExecution.intervalKm;
            let nextDueDate: string | undefined = undefined;

            if (selectedItemForExecution.intervalDays) {
                const eDate = new Date(executionDate);
                const dDate = new Date(eDate.getTime() + selectedItemForExecution.intervalDays * 24 * 60 * 60 * 1000);
                nextDueDate = dDate.toISOString().slice(0, 10);
            }

            await vehicleMaintenanceStatusService.savePlan({
                id: selectedItemForExecution.planId,
                vehicleId: selectedVehicleForExecution.id,
                vehiclePlate: selectedVehicleForExecution.plate || (selectedVehicleForExecution as any).placa,
                taskName: selectedItemForExecution.taskName,
                intervalKm: selectedItemForExecution.intervalKm,
                intervalDays: selectedItemForExecution.intervalDays,
                lastExecutionKm: executionKm,
                lastExecutionDate: executionDate,
                nextDueKm,
                nextDueDate,
                isActive: true
            });

            toast({
                title: 'Manutenção Registrada!',
                description: `${selectedItemForExecution.taskName} atualizada para a placa ${selectedVehicleForExecution.plate || (selectedVehicleForExecution as any).placa}.`
            });

            queryClient.invalidateQueries({ queryKey: ['maintenance-plans-all'] });
            setIsRecordModalOpen(false);
        } catch (error: any) {
            toast({
                title: 'Erro ao salvar',
                description: error?.message || 'Falha ao registrar execução de manutenção.',
                variant: 'destructive'
            });
        } finally {
            setIsSavingExecution(false);
        }
    };

    const toggleVehicleExpand = (id: string) => {
        setExpandedVehicleIds((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header com Cards de Alertas de Vencimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
                    className={`bg-slate-900/90 border cursor-pointer transition-all ${
                        statusFilter === 'OVERDUE'
                            ? 'border-red-500 ring-2 ring-red-500/30'
                            : 'border-slate-800 hover:border-red-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold">
                                Vencidos (Por KM / Data)
                            </p>
                            <p className="text-2xl font-bold font-mono text-red-500 mt-0.5">
                                {summaryStats.totalOverdueVehicles}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Veículos com intervenção imediata</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                            <ShieldAlert size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'UPCOMING' ? 'ALL' : 'UPCOMING')}
                    className={`bg-slate-900/90 border cursor-pointer transition-all ${
                        statusFilter === 'UPCOMING'
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-slate-800 hover:border-amber-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                                Próximos do Vencimento
                            </p>
                            <p className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
                                {summaryStats.totalUpcomingVehicles}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">&lt; 1.000 km ou &lt; 15 dias</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <Clock size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card 
                    onClick={() => setStatusFilter(statusFilter === 'OK' ? 'ALL' : 'OK')}
                    className={`bg-slate-900/90 border cursor-pointer transition-all ${
                        statusFilter === 'OK'
                            ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                            : 'border-slate-800 hover:border-emerald-500/40'
                    }`}
                >
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                                Em Dia (Conformes)
                            </p>
                            <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                                {summaryStats.totalOkVehicles}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">Planos preventivos dentro do prazo</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <ShieldCheck size={22} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900/90 border border-slate-800">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                                Total da Frota Monitorada
                            </p>
                            <p className="text-2xl font-bold font-mono text-white mt-0.5">
                                {summaryStats.totalVehicles}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">20 itens de inspeção por veículo</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                            <Wrench size={22} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Barra de Filtros e Pesquisa */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <div className="relative flex-1 max-w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <Input
                            placeholder="Buscar por placa, modelo ou marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 h-10 bg-slate-950 border-slate-700 text-white text-xs rounded-lg"
                        />
                    </div>

                    {/* Filtro de Categoria */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="h-10 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 focus:ring-1 focus:ring-amber-500"
                    >
                        {MAINTENANCE_CATEGORIES.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                                {cat.label}
                            </option>
                        ))}
                    </select>

                    {/* Filtro de Regime Operacional */}
                    <select
                        value={regimeFilter}
                        onChange={(e) => setRegimeFilter(e.target.value as any)}
                        className="h-10 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 focus:ring-1 focus:ring-amber-500"
                    >
                        <option value="ALL">🌐 Todos os Regimes</option>
                        <option value="URBAN">🏙️ Urbano Severo (10k-15k km)</option>
                        <option value="ROAD">🛣️ Rodoviário (20k-40k km)</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    {statusFilter !== 'ALL' && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setStatusFilter('ALL')}
                            className="text-xs text-slate-400 hover:text-white h-9"
                        >
                            <RotateCcw size={13} className="mr-1.5" /> Limpar Filtro ({statusFilter})
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => navigate('/frota/ordens-servico')}
                        className="h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 rounded-lg shadow"
                    >
                        <Wrench size={14} className="mr-1.5" /> Abrir Chamado / O.S.
                    </Button>
                </div>
            </div>

            {/* Listagem de Veículos e seus Planos Preventivos */}
            <div className="space-y-4">
                {filteredVehicles.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl">
                        <CheckCircle2 size={36} className="mx-auto text-emerald-400 mb-2" />
                        <h4 className="text-sm font-bold text-white">Nenhum veículo encontrado com os filtros atuais</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            Altere os filtros de pesquisa ou regime para visualizar outros registros.
                        </p>
                    </div>
                ) : (
                    filteredVehicles.map((entry) => {
                        const { vehicle, currentKm, vehicleRegime, items, overdueCount, upcomingCount, overallStatus } = entry;
                        const isExpanded = !!expandedVehicleIds[vehicle.id];

                        const displayedItems = categoryFilter === 'ALL'
                            ? items
                            : items.filter((i) => i.category === categoryFilter);

                        return (
                            <div
                                key={vehicle.id}
                                className={`rounded-xl border transition-all overflow-hidden ${
                                    overallStatus === 'OVERDUE'
                                        ? 'bg-slate-900/90 border-red-500/40'
                                        : overallStatus === 'UPCOMING'
                                        ? 'bg-slate-900/90 border-amber-500/40'
                                        : 'bg-slate-900/70 border-slate-800'
                                }`}
                            >
                                {/* Cabeçalho do Card do Veículo */}
                                <div className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/40">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold text-xs ${
                                            overallStatus === 'OVERDUE'
                                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                : overallStatus === 'UPCOMING'
                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        }`}>
                                            <Gauge size={22} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-white font-mono">
                                                    {vehicle.plate || (vehicle as any).placa || 'SEM PLACA'}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className={`text-[10px] px-2 py-0 font-mono uppercase ${
                                                        vehicleRegime === 'URBAN'
                                                            ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                                                            : 'border-purple-500/40 text-purple-400 bg-purple-500/10'
                                                    }`}
                                                >
                                                    {vehicleRegime === 'URBAN' ? '🏙️ Urbano Severo' : '🛣️ Rodoviário'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {vehicle.brand || (vehicle as any).marca} {vehicle.model || (vehicle as any).modelo} • Odômetro Atual: <strong className="text-white font-mono">{currentKm.toLocaleString('pt-BR')} km</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges de Resumo e Ação de Expandir */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-xs">
                                            {overdueCount > 0 && (
                                                <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold flex items-center gap-1">
                                                    <AlertTriangle size={12} /> {overdueCount} Vencido{overdueCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {upcomingCount > 0 && (
                                                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold flex items-center gap-1">
                                                    <Clock size={12} /> {upcomingCount} Próximo{upcomingCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {overdueCount === 0 && upcomingCount === 0 && (
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                                                    <CheckCircle2 size={12} /> 100% Em Dia
                                                </span>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => toggleVehicleExpand(vehicle.id)}
                                            className="h-9 text-xs border-slate-700 bg-slate-900 text-slate-200 hover:text-white"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    Recolher Plano <ChevronUp size={14} className="ml-1.5" />
                                                </>
                                            ) : (
                                                <>
                                                    Ver 20 Itens <ChevronDown size={14} className="ml-1.5" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Conteúdo Expandido: Tabela dos 20 Itens de Manutenção Preventiva */}
                                {isExpanded && (
                                    <div className="p-4 bg-slate-950/60 overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead>
                                                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                                                    <th className="py-2.5 px-3">Item / Tarefa Preventiva</th>
                                                    <th className="py-2.5 px-3">Categoria</th>
                                                    <th className="py-2.5 px-3">Intervalo Recomendado</th>
                                                    <th className="py-2.5 px-3">Última Troca (KM / Data)</th>
                                                    <th className="py-2.5 px-3">Próximo Vencimento</th>
                                                    <th className="py-2.5 px-3">Tolerância / Restante</th>
                                                    <th className="py-2.5 px-3">Status</th>
                                                    <th className="py-2.5 px-3 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-850">
                                                {displayedItems.map((item) => {
                                                    const progressPercent = Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            Math.round(((item.intervalKm - Math.max(0, item.kmRemaining)) / item.intervalKm) * 100)
                                                        )
                                                    );

                                                    return (
                                                        <tr key={item.presetId} className="hover:bg-slate-900/40 transition-colors">
                                                            <td className="py-3 px-3 font-medium text-white">
                                                                <div className="font-semibold">{item.taskName}</div>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {item.intervalDays ? `${item.intervalDays / 30} meses` : 'Por quilometragem'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                                                    {item.categoryLabel}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 font-mono text-slate-300">
                                                                {item.intervalKm.toLocaleString('pt-BR')} km
                                                                {item.intervalDays && ` ou ${item.intervalDays} dias`}
                                                            </td>
                                                            <td className="py-3 px-3 font-mono text-slate-400">
                                                                {item.lastKm > 0 ? (
                                                                    <>
                                                                        <span className="text-slate-200">{item.lastKm.toLocaleString('pt-BR')} km</span>
                                                                        {item.lastDate && <div className="text-[10px] text-slate-400">{item.lastDate}</div>}
                                                                    </>
                                                                ) : (
                                                                    <span className="text-slate-400 italic">Pendente registro</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3 font-mono">
                                                                <span className="text-white font-bold">{item.nextDueKm.toLocaleString('pt-BR')} km</span>
                                                                {item.nextDueDate && (
                                                                    <div className="text-[10px] text-slate-400 font-normal">
                                                                        Previsto: {item.nextDueDate}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3 min-w-[140px]">
                                                                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                                                    <span className={item.kmRemaining <= 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
                                                                        {item.kmRemaining <= 0 ? `Vencido há ${Math.abs(item.kmRemaining)} km` : `Restam ${item.kmRemaining} km`}
                                                                    </span>
                                                                    {item.daysRemaining !== undefined && (
                                                                        <span className="text-slate-400">
                                                                            {item.daysRemaining <= 0 ? `${Math.abs(item.daysRemaining)}d atraso` : `${item.daysRemaining}d`}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all ${
                                                                            item.alertLevel === 'OVERDUE'
                                                                                ? 'bg-red-500'
                                                                                : item.alertLevel === 'UPCOMING'
                                                                                ? 'bg-amber-500'
                                                                                : 'bg-emerald-500'
                                                                        }`}
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                {item.alertLevel === 'OVERDUE' ? (
                                                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/40 text-[10px]">
                                                                        VENCIDO
                                                                    </Badge>
                                                                ) : item.alertLevel === 'UPCOMING' ? (
                                                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-[10px]">
                                                                        PRÓXIMO
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px]">
                                                                        EM DIA
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleOpenExecutionModal(vehicle, item)}
                                                                        className="h-7 px-2 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-medium"
                                                                        title="Registrar Troca ou Manutenção Realizada"
                                                                    >
                                                                        <RotateCcw size={12} className="mr-1" />
                                                                        Registrar
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => {
                                                                            if (onOpenOs) {
                                                                                onOpenOs(vehicle.plate || (vehicle as any).placa, item.taskName);
                                                                            } else {
                                                                                navigate(`/frota/ordens-servico?placa=${vehicle.plate || (vehicle as any).placa}&servico=${encodeURIComponent(item.taskName)}`);
                                                                            }
                                                                        }}
                                                                        className="h-7 px-2 text-[11px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 font-medium"
                                                                        title="Gerar Ordem de Serviço Preventiva"
                                                                    >
                                                                        <Wrench size={12} className="mr-1" />
                                                                        Criar O.S.
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal: Registrar Troca / Execução de Manutenção Preventiva */}
            <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
                <DialogContent className="max-w-md bg-slate-950 border border-slate-800 text-white rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                            <RotateCcw className="text-amber-400" size={18} />
                            Registrar Manutenção Realizada
                        </DialogTitle>
                    </DialogHeader>

                    {selectedVehicleForExecution && selectedItemForExecution && (
                        <div className="space-y-4 py-2">
                            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Veículo:</span>
                                    <span className="font-mono font-bold text-white">
                                        {selectedVehicleForExecution.plate || (selectedVehicleForExecution as any).placa}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Intervenção Preventiva:</span>
                                    <span className="font-semibold text-amber-400">
                                        {selectedItemForExecution.taskName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Intervalo do Plano:</span>
                                    <span className="font-mono text-slate-300">
                                        A cada {selectedItemForExecution.intervalKm.toLocaleString('pt-BR')} km
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-slate-300">Quilometragem (KM) no Momento da Troca *</Label>
                                    <Input
                                        type="number"
                                        value={executionKm}
                                        onChange={(e) => setExecutionKm(Number(e.target.value) || 0)}
                                        className="h-10 bg-slate-900 border-slate-700 text-white text-sm font-mono mt-1"
                                        placeholder="Ex: 85200"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-300">Data da Execução *</Label>
                                    <Input
                                        type="date"
                                        value={executionDate}
                                        onChange={(e) => setExecutionDate(e.target.value)}
                                        className="h-10 bg-slate-900 border-slate-700 text-white text-sm mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-slate-300">Observações / Detalhes (Opcional)</Label>
                                    <Input
                                        type="text"
                                        value={executionNotes}
                                        onChange={(e) => setExecutionNotes(e.target.value)}
                                        placeholder="Ex: Lubrificante sintético 15W40, Filtro Mann W950, NF 1234"
                                        className="h-10 bg-slate-900 border-slate-700 text-white text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
                                <Sparkles size={16} className="shrink-0 mt-0.5 text-blue-400" />
                                <div>
                                    Ao registrar, o próximo vencimento será calculado automaticamente para:{' '}
                                    <strong className="text-white font-mono">
                                        {(executionKm + selectedItemForExecution.intervalKm).toLocaleString('pt-BR')} km
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsRecordModalOpen(false)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSaveExecution}
                            disabled={isSavingExecution}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                        >
                            {isSavingExecution ? 'Salvando...' : 'Confirmar e Atualizar Plano'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GestaoPlanoManutencaoFrota;
