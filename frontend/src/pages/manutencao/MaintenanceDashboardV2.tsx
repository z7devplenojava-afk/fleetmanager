import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    Download,
    ChevronRight,
    Calendar
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
    RadialBar,
    Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import arlaService from '@/services/arlaService';
import fleetService from '@/services/fleetService';
import ArlaRecordModal from '@/components/frota/ArlaRecordModal';
import { useToast } from '@/components/ui/use-toast';

const data = [
    { name: '01/02', diesel: 4000, arla: 200 },
    { name: '02/02', diesel: 3000, arla: 150 },
    { name: '03/02', diesel: 2000, arla: 100 },
    { name: '04/02', diesel: 2780, arla: 140 },
    { name: '05/02', diesel: 1890, arla: 95 },
    { name: '06/02', diesel: 2390, arla: 110 },
    { name: '07/02', diesel: 3490, arla: 175 },
];

const healthData = [
    { name: 'Motor', value: 85, fill: '#ffcc00' },
    { name: 'Pneus', value: 62, fill: '#ef4444' },
    { name: 'Freios', value: 95, fill: '#22c55e' },
];

const MaintenanceDashboardV2: React.FC = () => {
    const [isArlaModalOpen, setIsArlaModalOpen] = useState(false);
    const { toast } = useToast();

    const { data: vehicles = [] } = useQuery({
        queryKey: ['vehicles'],
        queryFn: fleetService.getVehicles
    });

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
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
                        { label: 'DISPONIBILIDADE', value: '94%', icon: Activity, color: 'text-green-500' },
                        { label: 'OS EM ABERTO', value: '12', icon: Wrench, color: 'text-seguranca-yellow' },
                        { label: 'KM HOJE (AVG)', value: '342', icon: Gauge, color: 'text-blue-400' },
                        { label: 'ALOUC. CUSTO', value: 'R$ 4.2k', icon: Zap, color: 'text-purple-400' },
                    ].map((stat, i) => (
                        <motion.div key={i} variants={itemVariants}>
                            <Card className="bg-seguranca-graphite/50 border-gray-800 backdrop-blur-sm hover:border-gray-700 transition-all">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-mono text-gray-500 tracking-widest">{stat.label}</p>
                                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                                    </div>
                                    <div className="bg-seguranca-black/40 p-2 rounded-lg">
                                        <stat.icon size={20} className={stat.color} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Consumption HUD */}
                    <motion.div className="lg:col-span-2" variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-800 bg-seguranca-black/20">
                                <div>
                                    <CardTitle className="text-seguranca-lightgray text-sm flex items-center">
                                        <Droplets className="mr-2 text-seguranca-yellow" size={18} />
                                        MONITOR DE CONSUMO (DIESEL VS ARLA 32)
                                    </CardTitle>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1">REAL-TIME TELEMETRY INTEGRATION</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow/10 text-[10px] font-mono"
                                        onClick={() => toast({ title: 'Importação', description: 'Abrindo seletor de arquivo CSV/Excel para cartões de combustível...' })}
                                    >
                                        <FileUp className="mr-2 h-3 w-3" /> IMPORTAR
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 border-gray-700 text-[10px] font-mono" onClick={() => setIsArlaModalOpen(true)}>
                                        + ARLA 32
                                    </Button>
                                    <Button size="sm" className="h-8 bg-seguranca-red hover:bg-seguranca-darkred text-[10px] font-mono">
                                        + DIESEL
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 h-[350px]">
                                <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={data}>
                                            <defs>
                                                <linearGradient id="colorDiesel" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorArla" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffcc00" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#ffcc00" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="name" stroke="#666" fontSize={10} />
                                            <YAxis stroke="#666" fontSize={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="diesel" stroke="#ef4444" fillOpacity={1} fill="url(#colorDiesel)" />
                                            <Area type="monotone" dataKey="arla" stroke="#ffcc00" fillOpacity={1} fill="url(#colorArla)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Health Radars */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full">
                            <CardHeader className="border-b border-gray-800 bg-seguranca-black/20">
                                <CardTitle className="text-seguranca-lightgray text-sm flex items-center">
                                    <Activity className="mr-2 text-seguranca-red" size={18} />
                                    SISTEMAS CRÍTICOS (HEALTH SCORE)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center h-[350px]">
                                <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart innerRadius="30%" outerRadius="100%" data={healthData} startAngle={180} endAngle={0}>
                                            <RadialBar
                                                minAngle={15}
                                                label={{ fill: '#666', position: 'insideStart', fontSize: 10 }}
                                                background
                                                clockWise={true}
                                                dataKey="value"
                                            />
                                            <Tooltip />
                                            <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Row: OS Workflow & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Alerts Feed */}
                    <motion.div variants={itemVariants}>
                        <Card className="bg-seguranca-graphite border-gray-800 h-full">
                            <CardHeader className="border-b border-gray-800">
                                <CardTitle className="text-seguranca-lightgray text-xs font-mono tracking-widest flex items-center">
                                    <AlertCircle className="mr-2 text-seguranca-red" size={14} />
                                    ALERTA DE SISTEMA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                {[
                                    { title: 'Plano Vencido (Óleo)', vehicle: 'ABC-1234', priority: 'URGENT' },
                                    { title: 'CPK Elevado (Pneus Eixo 2)', vehicle: 'XYZ-9876', priority: 'WARNING' },
                                    { title: 'Baixo Arla 32 (Reserva)', vehicle: 'KJT-4422', priority: 'CRITICAL' },
                                ].map((alert, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-seguranca-black/30 border-l-2 border-seguranca-red rounded-r-lg group hover:bg-seguranca-black/50 transition-colors cursor-pointer">
                                        <div className="flex-1">
                                            <p className="text-[11px] font-bold text-seguranca-lightgray flex items-center justify-between">
                                                {alert.title}
                                                <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-mono mt-1">{alert.vehicle} • 2h atrás</p>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" className="text-[10px] text-seguranca-yellow font-mono w-full justify-center">
                                    VER TODOS OS EVENTOS <ChevronRight size={12} />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Access Grid */}
                    <motion.div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4" variants={itemVariants}>
                        {[
                            { label: 'PLANOS', icon: Calendar, color: 'hover:bg-blue-500/10 hover:border-blue-500/30' },
                            { label: 'ORDENS', icon: Wrench, color: 'hover:bg-seguranca-red/10 hover:border-seguranca-red/30', to: '/frota/ordens-servico' },
                            { label: 'PNEUS', icon: Gauge, color: 'hover:bg-seguranca-yellow/10 hover:border-seguranca-yellow/30', to: '/pneus' },
                            { label: 'FLEET', icon: Search, color: 'hover:bg-green-500/10 hover:border-green-500/30' },
                            { label: 'PEÇAS', icon: Plus, color: 'hover:bg-purple-500/10 hover:border-purple-500/30' },
                            { label: 'CUSTOS', icon: Zap, color: 'hover:bg-orange-500/10 hover:border-orange-500/30' },
                            { label: 'HISTÓRICO', icon: Clock, color: 'hover:bg-gray-500/10 hover:border-gray-500/30' },
                            { label: 'SETUP', icon: Fuel, color: 'hover:bg-cyan-500/10 hover:border-cyan-500/30' },
                        ].map((btn, i) => (
                            <Button
                                key={i}
                                variant="ghost"
                                onClick={() => btn.to && (window.location.href = btn.to)}
                                className={`h-24 flex flex-col items-center justify-center bg-seguranca-graphite border border-gray-800 rounded-xl transition-all group ${btn.color}`}
                            >
                                <btn.icon size={24} className="mb-2 text-gray-500 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-mono tracking-tighter text-gray-400 group-hover:text-seguranca-lightgray">{btn.label}</span>
                            </Button>
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            <ArlaRecordModal
                isOpen={isArlaModalOpen}
                onClose={() => setIsArlaModalOpen(false)}
                onSuccess={() => {
                    setIsArlaModalOpen(false);
                    // Refetch data if needed
                }}
                veiculos={vehicles.map((v: any) => ({
                    id: v.id,
                    placa: v.plate || v.placa,
                    marca: v.brand || v.marca,
                    modelo: v.model || v.modelo
                }))}
            />
        </StandardLayout>
    );
};

export default MaintenanceDashboardV2;
