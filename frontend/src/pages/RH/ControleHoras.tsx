import React, { useState, useMemo } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    Clock,
    Download,
    RefreshCw,
    Search,
    AlertCircle,
    Moon,
    TrendingUp,
    Calendar,
    Users,
    FileCheck
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import driverHourService, { DriverWorkHour } from '@/services/driverHourService';
import ControleHorasTable from '@/components/rh/ControleHorasTable';
import DriverHourFormModal from '@/components/rh/DriverHourFormModal';
import DriverMonthlyClosingModal from '@/components/rh/DriverMonthlyClosingModal';
import { toast } from 'sonner';

const ControleHoras: React.FC = () => {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [closingModalOpen, setClosingModalOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState<DriverWorkHour | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');

    // Default: first day of current month to today
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const defaultEnd = now.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);

    const { data: records = [], isLoading, isRefetching } = useQuery({
        queryKey: ['driverHours', startDate, endDate],
        queryFn: () => driverHourService.getJornadaByPeriod(startDate, endDate)
    });

    const syncMutation = useMutation({
        mutationFn: () => driverHourService.syncJornadas(startDate, endDate),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['driverHours'] });
            toast.success(`Sincronização concluída! ${data.length} jornadas processadas.`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Erro ao sincronizar jornadas do ponto e partes diárias.');
        }
    });

    const filteredRecords = useMemo(() => {
        if (!searchTerm.trim()) return records;
        const lower = searchTerm.toLowerCase();
        return records.filter(r =>
            r.employeeName?.toLowerCase().includes(lower) ||
            r.notes?.toLowerCase().includes(lower) ||
            r.referenceDate?.includes(lower)
        );
    }, [records, searchTerm]);

    // KPI computations
    const kpis = useMemo(() => {
        let totalMinutes = 0;
        let nightMinutes = 0;
        let overtimeMinutes = 0;
        const driverSet = new Set<string>();

        for (const r of filteredRecords) {
            totalMinutes += r.totalMinutes || 0;
            nightMinutes += r.nightMinutes || 0;
            overtimeMinutes += r.overtimeMinutes || 0;
            if (r.employeeId) driverSet.add(r.employeeId);
        }

        const formatH = (min: number) => {
            const h = Math.floor(min / 60);
            const m = min % 60;
            return `${h}h ${m}m`;
        };

        return {
            totalJornadas: filteredRecords.length,
            totalMotoristas: driverSet.size,
            horasTrabalhadas: formatH(totalMinutes),
            horasNoturnas: formatH(nightMinutes),
            horasExtras: formatH(overtimeMinutes),
        };
    }, [filteredRecords]);

    const handleEdit = (hour: DriverWorkHour) => {
        setSelectedHour(hour);
        setModalOpen(true);
    };

    const handleNew = () => {
        setSelectedHour(undefined);
        setModalOpen(true);
    };

    const handleExport = () => {
        if (filteredRecords.length === 0) {
            toast.error('Nenhum registro para exportar.');
            return;
        }

        const headers = ['ID', 'Motorista', 'Data', 'Origem', 'Inicio', 'Fim', 'Total (min)', 'Espera (min)', 'Noturno (min)', 'Extra (min)', 'Status', 'Observacoes'];
        const csvRows = [headers.join(';')];

        for (const r of filteredRecords) {
            csvRows.push([
                r.id,
                `"${r.employeeName || ''}"`,
                r.referenceDate,
                r.source || 'MANUAL',
                r.startTime || '',
                r.endTime || '',
                r.totalMinutes || 0,
                r.waitMinutes || 0,
                r.nightMinutes || 0,
                r.overtimeMinutes || 0,
                r.isClosed ? 'Fechado' : 'Aberto',
                `"${(r.notes || '').replace(/"/g, '""')}"`
            ].join(';'));
        }

        const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `controle_horas_motoristas_${startDate}_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Arquivo CSV exportado com sucesso!');
    };

    return (
        <StandardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-seguranca-lightgray flex items-center gap-2">
                            Controle de Horas Motorista
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-seguranca-yellow/20 text-seguranca-yellow border border-seguranca-yellow/40">
                                Lei 13.103
                            </span>
                        </h1>
                        <p className="text-gray-400 text-sm mt-1">
                            Consolidação inteligente de jornadas a partir do Ponto Eletrônico e das Partes Diárias
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        <Button
                            onClick={() => syncMutation.mutate()}
                            disabled={syncMutation.isPending || isLoading}
                            className="bg-seguranca-blue hover:bg-seguranca-blue/80 text-white font-medium shadow-sm transition-all"
                        >
                            <RefreshCw size={16} className={`mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                            {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Jornadas'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => setClosingModalOpen(true)}
                            className="border-emerald-600/60 text-emerald-400 hover:bg-emerald-950/40 shadow-sm"
                        >
                            <FileCheck size={16} className="mr-2 text-emerald-400" />
                            Fechamento Mensal
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleExport}
                            className="border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"
                        >
                            <Download size={16} className="mr-2" />
                            Exportar CSV
                        </Button>

                        <Button
                            onClick={handleNew}
                            className="bg-seguranca-red hover:bg-seguranca-darkred text-white font-medium shadow-sm"
                        >
                            <Plus size={16} className="mr-2" />
                            Novo Lançamento
                        </Button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-seguranca-graphite border-gray-700/60 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Total de Jornadas</span>
                            <Calendar size={18} className="text-seguranca-yellow" />
                        </div>
                        <div className="text-2xl font-bold text-seguranca-lightgray mt-2">
                            {kpis.totalJornadas}
                        </div>
                        <span className="text-xs text-gray-500 mt-1 block">
                            {kpis.totalMotoristas} motorista(s) ativo(s)
                        </span>
                    </Card>

                    <Card className="bg-seguranca-graphite border-gray-700/60 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Horas Trabalhadas</span>
                            <Clock size={18} className="text-sky-400" />
                        </div>
                        <div className="text-2xl font-bold text-seguranca-lightgray mt-2">
                            {kpis.horasTrabalhadas}
                        </div>
                        <span className="text-xs text-sky-400/80 mt-1 block">
                            Jornada computada
                        </span>
                    </Card>

                    <Card className="bg-seguranca-graphite border-gray-700/60 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Horas Extras</span>
                            <TrendingUp size={18} className="text-amber-400" />
                        </div>
                        <div className="text-2xl font-bold text-seguranca-lightgray mt-2">
                            {kpis.horasExtras}
                        </div>
                        <span className="text-xs text-amber-400/80 mt-1 block">
                            Excedente &gt; 8h
                        </span>
                    </Card>

                    <Card className="bg-seguranca-graphite border-gray-700/60 p-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">Horas Noturnas</span>
                            <Moon size={18} className="text-emerald-400" />
                        </div>
                        <div className="text-2xl font-bold text-seguranca-lightgray mt-2">
                            {kpis.horasNoturnas}
                        </div>
                        <span className="text-xs text-emerald-400/80 mt-1 block">
                            Entre 22:00 e 05:00
                        </span>
                    </Card>
                </div>

                {/* Filters & Table Card */}
                <Card className="bg-seguranca-graphite border-gray-700/70 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-seguranca-lightgray flex items-center gap-2 text-lg">
                                    <Clock className="text-seguranca-yellow" size={20} />
                                    Registros de Jornada
                                    {isRefetching && <RefreshCw size={14} className="animate-spin text-gray-400" />}
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs mt-0.5">
                                    Listagem consolidada com conformidade e memória de cálculo
                                </CardDescription>
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-wrap items-center gap-2.5">
                                <div className="relative min-w-[200px]">
                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        placeholder="Buscar motorista..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 h-9 bg-seguranca-black border-gray-700 text-xs text-seguranca-lightgray focus:border-seguranca-yellow"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 bg-seguranca-black border border-gray-700 rounded-md px-2 py-1">
                                    <span className="text-xs text-gray-400">De:</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-xs text-seguranca-lightgray focus:outline-none"
                                    />
                                    <span className="text-xs text-gray-400 ml-1">Até:</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-xs text-seguranca-lightgray focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-seguranca-yellow"></div>
                                <p className="text-xs text-gray-400">Carregando jornadas dos motoristas...</p>
                            </div>
                        ) : (
                            <ControleHorasTable data={filteredRecords} onEdit={handleEdit} />
                        )}
                    </CardContent>
                </Card>
            </div>

            <DriverHourFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                selectedHour={selectedHour}
            />

            <DriverMonthlyClosingModal
                open={closingModalOpen}
                onClose={() => setClosingModalOpen(false)}
            />
        </StandardLayout>
    );
};

export default ControleHoras;
