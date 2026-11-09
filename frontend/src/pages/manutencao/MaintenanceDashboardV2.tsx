import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Wrench,
    Droplets,
    Zap,
    AlertCircle,
    Activity,
    Gauge,
    ArrowUpRight,
    Clock,
    Fuel,
    Plus,
    Search,
    FileUp,
    ChevronRight,
    Calendar,
    RefreshCw
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import arlaService from '@/services/arlaService';
import fleetService from '@/services/fleetService';
import fleetWorkOrderService, { WorkOrderStatus, WorkOrderPriority } from '@/services/fleetWorkOrderService';
import vehicleInspectionService from '@/services/vehicleInspectionService';
import tireService from '@/services/tireService';
import kmControlService from '@/services/kmControlService';
import ArlaRecordModal from '@/components/frota/ArlaRecordModal';
import AbastecimentoInternoFormModal from '@/components/frota/AbastecimentoInternoFormModal';
import { useToast } from '@/components/ui/use-toast';

const MaintenanceDashboardV2: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const [isArlaModalOpen, setIsArlaModalOpen] = useState(false);
    const [isDieselModalOpen, setIsDieselModalOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Queries com dados reais
    const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles,
        retry: 1
    });

    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ['fleet-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll(),
        retry: 1
    });

    const { data: fuelRecords = [] } = useQuery({
        queryKey: ['fuelRecords'],
        queryFn: () => fleetService.getFuelRecords(),
        retry: 1
    });

    const { data: arlaRecords = [] } = useQuery({
        queryKey: ['arlaRecords'],
        queryFn: () => arlaService.findAll(),
        retry: 1
    });

    const { data: inspectionData } = useQuery({
        queryKey: ['inspections'],
        queryFn: () => vehicleInspectionService.getInspections(),
        retry: 1
    });
    const inspections = inspectionData?.inspections || [];

    const { data: tires = [] } = useQuery({
        queryKey: ['tires'],
        queryFn: () => tireService.findAll(),
        retry: 1
    });

    const { data: kmControls = [] } = useQuery({
        queryKey: ['kmControls'],
        queryFn: () => kmControlService.getKmControls(),
        retry: 1
    });

    // Função de recarregar todos os dados
    const handleRefreshAll = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
                queryClient.invalidateQueries({ queryKey: ['fleet-work-orders'] }),
                queryClient.invalidateQueries({ queryKey: ['fuelRecords'] }),
                queryClient.invalidateQueries({ queryKey: ['arlaRecords'] }),
                queryClient.invalidateQueries({ queryKey: ['inspections'] }),
                queryClient.invalidateQueries({ queryKey: ['tires'] }),
                queryClient.invalidateQueries({ queryKey: ['kmControls'] })
            ]);
            toast({ title: 'Atualizado', description: 'Dados do Centro de Comando sincronizados.' });
        } finally {
            setIsRefreshing(false);
        }
    };

    // Cálculos de Indicadores Operacionais
    const openOrders = useMemo(() => {
        return orders.filter(
            (o) => o.status !== WorkOrderStatus.COMPLETED && o.status !== WorkOrderStatus.CANCELLED
        );
    }, [orders]);

    const availabilityStats = useMemo(() => {
        const total = vehicles.length;
        if (total === 0) return { percent: 100, active: 0, total: 0 };

        // Veículos em manutenção (ou por status da frota ou com OS aberta em andamento)
        const vehiclesInRepairSet = new Set<string>();
        vehicles.forEach((v) => {
            const statusUpper = (v.status || '').toUpperCase();
            if (statusUpper === 'MAINTENANCE' || statusUpper === 'MANUTENCAO' || statusUpper === 'IN_REPAIR') {
                vehiclesInRepairSet.add(v.id);
            }
        });
        openOrders.forEach((o) => {
            if (o.vehicleId) vehiclesInRepairSet.add(o.vehicleId);
        });

        const activeCount = Math.max(0, total - vehiclesInRepairSet.size);
        const percent = Math.round((activeCount / total) * 100);
        return { percent, active: activeCount, total };
    }, [vehicles, openOrders]);

    const avgKmStats = useMemo(() => {
        if (kmControls.length > 0) {
            const validRuns = kmControls.filter(
                (k) => typeof k.finalKm === 'number' && typeof k.initialKm === 'number' && k.finalKm >= k.initialKm
            );
            if (validRuns.length > 0) {
                const totalKm = validRuns.reduce((acc, curr) => acc + ((curr.finalKm || 0) - (curr.initialKm || 0)), 0);
                return `${Math.round(totalKm / validRuns.length)} km`;
            }
        }
        if (vehicles.length > 0) {
            const withKm = vehicles.filter((v: any) => v.mileage || v.currentKm || v.quilometragem);
            if (withKm.length > 0) {
                const sum = withKm.reduce((acc: number, v: any) => acc + (v.mileage || v.currentKm || v.quilometragem || 0), 0);
                return `${Math.round(sum / withKm.length)} km`;
            }
        }
        return '0 km';
    }, [kmControls, vehicles]);

    const totalCostAllocated = useMemo(() => {
        const sum = orders.reduce((acc, curr) => acc + (Number(curr.totalCost) || 0), 0);
        if (sum >= 1000000) return `R$ ${(sum / 1000000).toFixed(1)}M`;
        if (sum >= 1000) return `R$ ${(sum / 1000).toFixed(1)}k`;
        return `R$ ${sum.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }, [orders]);

    // Dados de Consumo (Últimos 7 dias)
    const consumptionChartData = useMemo(() => {
        const daysMap = new Map<string, { name: string; diesel: number; arla: number }>();
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            daysMap.set(key, { name: key, diesel: 0, arla: 0 });
        }

        (fuelRecords || []).forEach((r: any) => {
            const dateStr = r.date || r.createdAt;
            if (!dateStr) return;
            const d = new Date(dateStr);
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (daysMap.has(key)) {
                const item = daysMap.get(key)!;
                item.diesel += Number(r.liters || r.quantity || 0);
            }
        });

        (arlaRecords || []).forEach((r: any) => {
            const dateStr = r.date || r.createdAt;
            if (!dateStr) return;
            const d = new Date(dateStr);
            const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            if (daysMap.has(key)) {
                const item = daysMap.get(key)!;
                item.arla += Number(r.quantity || 0);
            }
        });

        return Array.from(daysMap.values());
    }, [fuelRecords, arlaRecords]);

    const totalDieselPeriod = useMemo(
        () => consumptionChartData.reduce((acc, c) => acc + c.diesel, 0),
        [consumptionChartData]
    );
    const totalArlaPeriod = useMemo(
        () => consumptionChartData.reduce((acc, c) => acc + c.arla, 0),
        [consumptionChartData]
    );

    // Health Score Real
    const motorHealth = useMemo(() => {
        if (vehicles.length === 0) return 100;
        const motorOrders = openOrders.filter(
            (o) => o.maintenanceType === 'CORRETIVA' || o.maintenanceType === 'CORRECTIVE'
        ).length;
        return Math.max(0, Math.round(((vehicles.length - motorOrders) / vehicles.length) * 100));
    }, [vehicles, openOrders]);

    const tireHealth = useMemo(() => {
        if (tires.length === 0) return 100;
        const criticalTires = tires.filter(
            (t) => t.status === 'SCRAPPED' || (t.currentTreadDepth !== undefined && t.currentTreadDepth <= 3)
        ).length;
        return Math.max(0, Math.round(((tires.length - criticalTires) / tires.length) * 100));
    }, [tires]);

    const brakesHealth = useMemo(() => {
        if (inspections.length === 0) return 100;
        const blockedInspections = inspections.filter((i) => i.releaseStatus === 'NAO_LIBERADO').length;
        return Math.max(0, Math.round(((inspections.length - blockedInspections) / inspections.length) * 100));
    }, [inspections]);

    const healthData = useMemo(() => [
        {
            name: 'Freios & Segurança',
            value: brakesHealth,
            fill: brakesHealth >= 80 ? '#22c55e' : brakesHealth >= 60 ? '#eab308' : '#ef4444'
        },
        {
            name: 'Motor & Câmbio',
            value: motorHealth,
            fill: motorHealth >= 80 ? '#3b82f6' : motorHealth >= 60 ? '#f59e0b' : '#ef4444'
        },
        {
            name: 'Pneus & Rodagem',
            value: tireHealth,
            fill: tireHealth >= 80 ? '#10b981' : tireHealth >= 60 ? '#f97316' : '#ef4444'
        }
    ], [brakesHealth, motorHealth, tireHealth]);

    // Alertas do Sistema Dinâmicos
    const systemAlerts = useMemo(() => {
        const list: Array<{
            id: string;
            title: string;
            subtitle: string;
            vehicle: string;
            time: string;
            priority: 'CRITICAL' | 'URGENT' | 'WARNING';
            to: string;
        }> = [];

        // 1. Ordens de Serviço urgentes ou prioritárias
        openOrders
            .filter((o) => o.priority === WorkOrderPriority.URGENT || o.priority === WorkOrderPriority.HIGH)
            .slice(0, 3)
            .forEach((o) => {
                list.push({
                    id: `os-${o.id}`,
                    title: `O.S. ${o.priority === WorkOrderPriority.URGENT ? 'Urgente' : 'Alta'}: ${o.anomaliesDescription || o.maintenancePerformed || o.maintenanceType || 'Manutenção Pendente'}`,
                    subtitle: `OS #${o.osNumber || o.id.slice(0, 6)} • ${o.status}`,
                    vehicle: o.vehiclePlate || 'Veículo',
                    time: o.createdAt ? new Date(o.createdAt).toLocaleDateString('pt-BR') : 'Recente',
                    priority: o.priority === WorkOrderPriority.URGENT ? 'CRITICAL' : 'URGENT',
                    to: '/frota/ordens-servico'
                });
            });

        // 2. Laudos com restrição ou bloqueio
        inspections
            .filter((i) => i.releaseStatus === 'NAO_LIBERADO' || i.releaseStatus === 'LIBERADO_COM_RESTRICAO')
            .slice(0, 2)
            .forEach((i) => {
                list.push({
                    id: `insp-${i.id}`,
                    title: i.releaseStatus === 'NAO_LIBERADO' ? 'Veículo Bloqueado em Laudo' : 'Liberado com Restrição',
                    subtitle: i.restrictionDescription || i.occurrenceDescription || `Laudo #${i.registryNumber}`,
                    vehicle: i.vehiclePlate || 'Veículo',
                    time: i.inspectionDate ? new Date(i.inspectionDate).toLocaleDateString('pt-BR') : 'Hoje',
                    priority: i.releaseStatus === 'NAO_LIBERADO' ? 'CRITICAL' : 'WARNING',
                    to: '/manutencao/laudos'
                });
            });

        // 3. Pneus em condição crítica
        tires
            .filter((t) => t.currentTreadDepth !== undefined && t.currentTreadDepth <= 3)
            .slice(0, 2)
            .forEach((t) => {
                list.push({
                    id: `tire-${t.id}`,
                    title: `Pneu com Sulco Crítico (${t.currentTreadDepth}mm)`,
                    subtitle: `Fogo/DOT: ${t.serialNumber} • ${t.brand || ''} ${t.model || ''}`,
                    vehicle: t.vehiclePlate || 'Almoxarifado',
                    time: 'Atenção',
                    priority: 'WARNING',
                    to: '/pneus'
                });
            });

        // 4. Veículos com status MANUTENCAO
        vehicles
            .filter((v: any) => {
                const st = (v.status || '').toUpperCase();
                return st === 'MAINTENANCE' || st === 'MANUTENCAO';
            })
            .slice(0, 2)
            .forEach((v: any) => {
                const plate = v.plate || v.placa;
                if (!list.some((a) => a.vehicle === plate)) {
                    list.push({
                        id: `veh-${v.id}`,
                        title: 'Veículo em Manutenção / Oficina',
                        subtitle: `${v.model || v.modelo || 'Frota'} • Retido na Oficina`,
                        vehicle: plate || 'Frota',
                        time: 'Ativo',
                        priority: 'WARNING',
                        to: '/frota'
                    });
                }
            });

        return list.slice(0, 5);
    }, [openOrders, inspections, tires, vehicles]);

    // Botões de Acesso Rápido
    const quickActions = [
        { label: 'PLANOS', icon: Calendar, color: 'hover:bg-blue-500/10 hover:border-blue-500/30', to: '/manutencao' },
        { label: 'ORDENS', icon: Wrench, color: 'hover:bg-seguranca-red/10 hover:border-seguranca-red/30', to: '/frota/ordens-servico' },
        { label: 'PNEUS', icon: Gauge, color: 'hover:bg-seguranca-yellow/10 hover:border-seguranca-yellow/30', to: '/pneus' },
        { label: 'FLEET', icon: Search, color: 'hover:bg-green-500/10 hover:border-green-500/30', to: '/frota' },
        { label: 'PEÇAS', icon: Plus, color: 'hover:bg-purple-500/10 hover:border-purple-500/30', to: '/estoque-simplificado' },
        { label: 'CUSTOS', icon: Zap, color: 'hover:bg-orange-500/10 hover:border-orange-500/30', to: '/manutencao/despesas' },
        { label: 'HISTÓRICO', icon: Clock, color: 'hover:bg-gray-500/10 hover:border-gray-500/30', to: '/manutencao/laudos' },
        { label: 'SETUP', icon: Fuel, color: 'hover:bg-cyan-500/10 hover:border-cyan-500/30', to: '/abastecimento' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    };

    const itemVariants = {
        hidden: { y: 15, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <StandardLayout title="Centro de Comando de Manutenção" subtitle="Operação em Tempo Real • Shop-Floor HUD">
            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header Stats HUD */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: 'DISPONIBILIDADE DA FROTA',
                            value: `${availabilityStats.percent}%`,
                            sub: `${availabilityStats.active} de ${availabilityStats.total} veículos aptos`,
                            icon: Activity,
                            color: availabilityStats.percent >= 85 ? 'text-green-500' : 'text-amber-500',
                            to: '/frota'
                        },
                        {
                            label: 'ORDENS DE SERVIÇO ABERTAS',
                            value: `${openOrders.length}`,
                            sub: `${orders.filter((o) => o.status === WorkOrderStatus.IN_PROGRESS).length} em execução`,
                            icon: Wrench,
                            color: openOrders.length > 0 ? 'text-seguranca-yellow' : 'text-green-500',
                            to: '/frota/ordens-servico'
                        },
                        {
                            label: 'KM HOJE (MÉDIA)',
                            value: avgKmStats,
                            sub: `${kmControls.length} registros de controle`,
                            icon: Gauge,
                            color: 'text-blue-400',
                            to: '/frota'
                        },
                        {
                            label: 'ALOCAÇÃO DE CUSTOS (TOTAL)',
                            value: totalCostAllocated,
                            sub: `${orders.length} O.S. registradas`,
                            icon: Zap,
                            color: 'text-amber-400',
                            to: '/manutencao/despesas'
                        },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <Card 
                                onClick={() => navigate(stat.to)}
                                className="bg-seguranca-graphite/50 border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-all cursor-pointer group"
                            >
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-mono text-gray-500 tracking-wider uppercase">{stat.label}</p>
                                        <p className={`text-2xl font-bold font-mono ${stat.color} group-hover:scale-105 transition-transform origin-left`}>
                                            {stat.value}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
                                    </div>
                                    <div className="bg-seguranca-black/40 p-2.5 rounded-lg group-hover:bg-seguranca-black/60 transition-colors">
                                        <stat.icon size={22} className={stat.color} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Consumption HUD */}
                    <motion.div className="lg:col-span-2" variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full overflow-hidden flex flex-col justify-between">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800 bg-seguranca-black/20 pb-3">
                                <div>
                                    <CardTitle className="text-seguranca-lightgray text-sm flex items-center gap-2">
                                        <Droplets className="text-seguranca-yellow" size={18} />
                                        MONITOR DE CONSUMO (DIESEL VS ARLA 32)
                                    </CardTitle>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-400 font-mono mt-1">
                                        <span>7 DIAS: Diesel <strong className="text-red-400">{totalDieselPeriod.toLocaleString('pt-BR')} L</strong></span>
                                        <span>•</span>
                                        <span>Arla 32 <strong className="text-blue-400">{totalArlaPeriod.toLocaleString('pt-BR')} L</strong></span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isRefreshing}
                                        className="h-8 border-gray-700 text-gray-300 hover:text-white text-[10px] font-mono"
                                        onClick={handleRefreshAll}
                                        title="Atualizar dados"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 text-[10px] font-mono"
                                        onClick={() => navigate('/abastecimento')}
                                    >
                                        <FileUp className="mr-1.5 h-3 w-3" /> IMPORTAR
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 text-[10px] font-mono"
                                        onClick={() => setIsArlaModalOpen(true)}
                                    >
                                        + ARLA 32
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 bg-seguranca-red hover:bg-seguranca-darkred text-white text-[10px] font-mono"
                                        onClick={() => setIsDieselModalOpen(true)}
                                    >
                                        + DIESEL
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[340px] flex flex-col justify-center">
                                <ResponsiveContainer width="100%" height={290}>
                                    <AreaChart data={consumptionChartData}>
                                        <defs>
                                            <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                                            </linearGradient>
                                            <linearGradient id="colorArla" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                                        <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#737373" fontSize={11} tickLine={false} unit="L" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#171717',
                                                border: '1px solid #333',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ fontSize: '12px' }}
                                            formatter={(value: any) => [`${Number(value || 0).toLocaleString('pt-BR')} L`]}
                                        />
                                        <Area
                                            type="monotone"
                                            name="Diesel"
                                            dataKey="diesel"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorDiesel)"
                                        />
                                        <Area
                                            type="monotone"
                                            name="Arla 32"
                                            dataKey="arla"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorArla)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                                {totalDieselPeriod === 0 && totalArlaPeriod === 0 && (
                                    <p className="text-center text-xs text-gray-500 font-mono mt-1">
                                        Nenhum consumo registrado nos últimos 7 dias. Use "+ DIESEL" ou "+ ARLA 32" para lançar abastecimentos.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Health Radars */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full flex flex-col justify-between">
                            <CardHeader className="border-b border-gray-800 bg-seguranca-black/20 pb-3">
                                <CardTitle className="text-seguranca-lightgray text-sm flex items-center">
                                    <Activity className="mr-2 text-seguranca-red" size={18} />
                                    SISTEMAS CRÍTICOS (HEALTH SCORE)
                                </CardTitle>
                                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                                    Índice de conformidade da frota ativa
                                </p>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center p-4">
                                <div className="w-full h-[220px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart
                                            cx="50%"
                                            cy="70%"
                                            innerRadius="40%"
                                            outerRadius="100%"
                                            data={healthData}
                                            startAngle={180}
                                            endAngle={0}
                                        >
                                            <RadialBar
                                                minAngle={15}
                                                background={{ fill: '#1f2937' }}
                                                clockWise={true}
                                                dataKey="value"
                                                cornerRadius={6}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '8px' }}
                                                formatter={(val: any) => [`${val}%`, 'Saúde']}
                                            />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-3 gap-2 w-full mt-2 pt-2 border-t border-gray-800">
                                    {healthData.map((item, idx) => (
                                        <div key={idx} className="text-center p-2 rounded-lg bg-seguranca-black/40 border border-gray-800/80">
                                            <span className="text-[10px] text-gray-400 block truncate font-mono">{item.name}</span>
                                            <span className="text-sm font-bold font-mono" style={{ color: item.fill }}>
                                                {item.value}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Row: OS Workflow & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alerts Feed */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full flex flex-col justify-between">
                            <CardHeader className="border-b border-gray-800 py-3 px-4 flex flex-row items-center justify-between">
                                <CardTitle className="text-seguranca-lightgray text-xs font-mono tracking-widest flex items-center">
                                    <AlertCircle className="mr-2 text-seguranca-red" size={14} />
                                    ALERTA DE SISTEMA
                                </CardTitle>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                                    {systemAlerts.length} ATIVOS
                                </span>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                <div className="space-y-2.5">
                                    {systemAlerts.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <p className="text-xs">✅ Nenhum alerta crítico ativo</p>
                                            <p className="text-[10px] mt-1 text-gray-600">Frota e sistemas operando em conformidade</p>
                                        </div>
                                    ) : (
                                        systemAlerts.map((alert) => (
                                            <div
                                                key={alert.id}
                                                onClick={() => navigate(alert.to)}
                                                className={`flex items-start gap-3 p-3 bg-seguranca-black/30 border-l-2 rounded-r-lg group hover:bg-seguranca-black/50 transition-colors cursor-pointer ${
                                                    alert.priority === 'CRITICAL'
                                                        ? 'border-red-500'
                                                        : alert.priority === 'URGENT'
                                                        ? 'border-amber-500'
                                                        : 'border-yellow-500'
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[11px] font-bold text-seguranca-lightgray flex items-center justify-between truncate">
                                                        <span className="truncate">{alert.title}</span>
                                                        <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{alert.subtitle}</p>
                                                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">{alert.vehicle} • {alert.time}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <Button
                                    variant="link"
                                    onClick={() => navigate('/frota/ordens-servico')}
                                    className="text-[10px] text-seguranca-yellow hover:text-yellow-400 font-mono w-full justify-center p-0 h-auto pt-2"
                                >
                                    VER TODAS AS ORDENS E EVENTOS <ChevronRight size={12} className="ml-1" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Access Grid */}
                    <motion.div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4" variants={itemVariants}>
                        {quickActions.map((btn, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                onClick={() => navigate(btn.to)}
                                className={`h-24 flex flex-col items-center justify-center bg-seguranca-graphite border border-gray-800 rounded-xl transition-all group ${btn.color}`}
                            >
                                <btn.icon size={24} className="mb-2 text-gray-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono tracking-wider text-gray-400 group-hover:text-seguranca-lightgray">{btn.label}</span>
                            </Button>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Modal de Registro de Arla 32 */}
            <ArlaRecordModal
                isOpen={isArlaModalOpen}
                onClose={() => setIsArlaModalOpen(false)}
                onSuccess={() => {
                    setIsArlaModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['arlaRecords'] });
                    toast({ title: 'Sucesso', description: 'Registro de Arla 32 salvo com sucesso.' });
                }}
                veiculos={vehicles.map((v: any) => ({
                    id: v.id,
                    placa: v.plate || v.placa,
                    marca: v.brand || v.marca,
                    modelo: v.model || v.modelo
                }))}
            />

            {/* Modal de Registro de Abastecimento Interno (Diesel) */}
            <AbastecimentoInternoFormModal
                isOpen={isDieselModalOpen}
                onClose={() => setIsDieselModalOpen(false)}
                onSuccess={() => {
                    setIsDieselModalOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
                    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
                    toast({ title: 'Sucesso', description: 'Abastecimento de Diesel registrado com sucesso.' });
                }}
                veiculos={vehicles}
            />
        </StandardLayout>
    );
};

export default MaintenanceDashboardV2;
