import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileCheck,
    Loader2,
    Lock,
    Moon,
    User,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import driverHourService, { DriverMonthlyClosing } from '@/services/driverHourService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface DriverMonthlyClosingModalProps {
    open: boolean;
    onClose: () => void;
}

const DriverMonthlyClosingModal: React.FC<DriverMonthlyClosingModalProps> = ({ open, onClose }) => {
    const queryClient = useQueryClient();
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);

    const { data: closings = [], isLoading, refetch } = useQuery({
        queryKey: ['driverMonthlySummary', year, month],
        queryFn: () => driverHourService.getMonthlySummary(year, month),
        enabled: open
    });

    const closeMonthMutation = useMutation({
        mutationFn: (employeeId?: string) => driverHourService.closeMonth(year, month, employeeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['driverMonthlySummary'] });
            queryClient.invalidateQueries({ queryKey: ['driverHours'] });
            toast.success('Fechamento mensal registrado com sucesso!');
            refetch();
        },
        onError: () => {
            toast.error('Erro ao efetivar fechamento mensal.');
        }
    });

    const formatMinutes = (minutes?: number) => {
        if (minutes === undefined || minutes === null) return '0 min';
        const isNegative = minutes < 0;
        const abs = Math.abs(minutes);
        const h = Math.floor(abs / 60);
        const m = abs % 60;
        const sign = isNegative ? '-' : '';
        return `${sign}${h}h ${m}m`;
    };

    const handleExport = () => {
        if (closings.length === 0) {
            toast.error('Nenhum fechamento para exportar.');
            return;
        }

        const headers = [
            'Motorista', 'CPF', 'Matricula', 'Mes/Ano', 'Contrato (min)',
            'Total Trabalhado (min)', 'Horas Extras (min)', 'Noturno Relogio (min)',
            'Noturno Reduzido CLT (min)', 'Saldo Banco (min)', 'Dias Trabalhados', 'Status'
        ];

        const rows = [headers.join(';')];
        for (const c of closings) {
            rows.push([
                `"${c.employeeName}"`,
                `"${c.employeeDocument || ''}"`,
                `"${c.registrationNumber || ''}"`,
                `${c.month}/${c.year}`,
                c.contractMonthlyMinutes,
                c.totalWorkedMinutes,
                c.totalOvertimeMinutes,
                c.totalNightMinutes,
                c.totalNightReducedMinutes,
                c.balanceMinutes,
                c.daysWorked,
                c.isMonthFullyClosed ? 'Fechado' : 'Aberto'
            ].join(';'));
        }

        const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fechamento_mensal_motoristas_${month}_${year}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Espelho e fechamento exportado em CSV!');
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <DialogTitle className="flex items-center gap-2 text-lg">
                                <FileCheck className="text-seguranca-yellow" />
                                Fechamento Mensal & Espelho de Ponto (Lei 13.103)
                            </DialogTitle>
                            <p className="text-xs text-gray-400 mt-1">
                                Apuração das horas trabalhadas, horas extras, adicional noturno e saldo contratual
                            </p>
                        </div>

                        {/* Controles de Mês e Ano */}
                        <div className="flex items-center gap-2">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="bg-seguranca-black border border-gray-700 rounded-md px-2.5 py-1 text-xs text-seguranca-lightgray focus:outline-none"
                            >
                                <option value={1}>Janeiro</option>
                                <option value={2}>Fevereiro</option>
                                <option value={3}>Março</option>
                                <option value={4}>Abril</option>
                                <option value={5}>Maio</option>
                                <option value={6}>Junho</option>
                                <option value={7}>Julho</option>
                                <option value={8}>Agosto</option>
                                <option value={9}>Setembro</option>
                                <option value={10}>Outubro</option>
                                <option value={11}>Novembro</option>
                                <option value={12}>Dezembro</option>
                            </select>

                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="bg-seguranca-black border border-gray-700 rounded-md px-2 py-1 text-xs w-20 text-seguranca-lightgray focus:outline-none"
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExport}
                                className="border-gray-700 text-xs h-8 hover:bg-seguranca-black"
                            >
                                <Download size={13} className="mr-1" />
                                Exportar
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-2">
                        <Loader2 className="animate-spin text-seguranca-yellow" size={24} />
                        <span className="text-xs text-gray-400">Calculando horas do mês...</span>
                    </div>
                ) : closings.length === 0 ? (
                    <div className="bg-seguranca-black p-8 rounded-lg border border-gray-700 text-center space-y-2">
                        <Calendar size={28} className="mx-auto text-gray-500" />
                        <p className="text-sm font-medium">Nenhuma jornada encontrada para {month}/{year}.</p>
                        <p className="text-xs text-gray-400">Sincronize as batidas de ponto e partes diárias na tela principal.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-lg border border-gray-700 overflow-hidden bg-seguranca-black">
                            <Table>
                                <TableHeader className="bg-zinc-900">
                                    <TableRow className="border-gray-700 text-xs">
                                        <TableHead className="w-8"></TableHead>
                                        <TableHead className="text-gray-300">Motorista</TableHead>
                                        <TableHead className="text-gray-300">Contrato</TableHead>
                                        <TableHead className="text-gray-300">Trabalhado</TableHead>
                                        <TableHead className="text-gray-300">H. Extras</TableHead>
                                        <TableHead className="text-gray-300">Noturno (Relógio)</TableHead>
                                        <TableHead className="text-gray-300">Noturno (CLT 52m30s)</TableHead>
                                        <TableHead className="text-gray-300">Saldo/Banco</TableHead>
                                        <TableHead className="text-gray-300">Status</TableHead>
                                        <TableHead className="text-gray-300 text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {closings.map((c) => {
                                        const isExpanded = expandedDriverId === c.employeeId;
                                        return (
                                            <React.Fragment key={c.employeeId}>
                                                <TableRow className="border-gray-800 text-xs hover:bg-zinc-900/60 transition-colors">
                                                    <TableCell className="py-2.5">
                                                        <button
                                                            onClick={() => setExpandedDriverId(isExpanded ? null : c.employeeId)}
                                                            className="text-gray-400 hover:text-white"
                                                        >
                                                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                                        </button>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 font-medium text-seguranca-lightgray">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-seguranca-yellow font-bold text-[11px]">
                                                                {c.employeeName.charAt(0)}
                                                            </div>
                                                            <span>{c.employeeName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-gray-400">
                                                        {formatMinutes(c.contractMonthlyMinutes)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 font-semibold text-sky-400">
                                                        {formatMinutes(c.totalWorkedMinutes)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-amber-300 font-medium">
                                                        +{formatMinutes(c.totalOvertimeMinutes)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-amber-400 font-mono">
                                                        {formatMinutes(c.totalNightMinutes)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-emerald-400 font-mono font-semibold">
                                                        {formatMinutes(c.totalNightReducedMinutes)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 font-bold">
                                                        <span className={c.balanceMinutes >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                            {formatMinutes(c.balanceMinutes)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-2.5">
                                                        {c.isMonthFullyClosed ? (
                                                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                                                                Fechado
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px]">
                                                                {c.daysClosed}/{c.daysWorked} Dias
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={closeMonthMutation.isPending || c.isMonthFullyClosed}
                                                            onClick={() => closeMonthMutation.mutate(c.employeeId)}
                                                            className="h-7 text-xs border-gray-700 hover:bg-emerald-500/20 hover:text-emerald-300"
                                                        >
                                                            <Lock size={12} className="mr-1" />
                                                            {c.isMonthFullyClosed ? 'Encerrado' : 'Fechar Mês'}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>

                                                {/* Detalhamento expandido dos dias (Espelho de Ponto) */}
                                                {isExpanded && (
                                                    <TableRow className="bg-zinc-950/80 border-b border-gray-800">
                                                        <TableCell colSpan={10} className="p-3">
                                                            <div className="space-y-2">
                                                                <h5 className="text-[11px] font-bold text-seguranca-yellow uppercase tracking-wider">
                                                                    Espelho Diário de {c.employeeName} ({c.dailyRecords.length} dias registrados)
                                                                </h5>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                    {c.dailyRecords.map((d) => (
                                                                        <div key={d.id} className="p-2 bg-zinc-900 rounded border border-gray-800 text-[11px] space-y-1">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="font-bold text-gray-200">{d.referenceDate}</span>
                                                                                <Badge className="text-[9px] py-0 px-1.5">{d.source}</Badge>
                                                                            </div>
                                                                            <div className="text-gray-400">
                                                                                Total: <span className="text-white font-semibold">{formatMinutes(d.totalMinutes)}</span>
                                                                                {d.nightMinutes ? <span className="text-amber-400 ml-2">Noturno: {formatMinutes(d.nightMinutes)}</span> : null}
                                                                                {d.overtimeMinutes ? <span className="text-rose-400 ml-2">Extra: +{formatMinutes(d.overtimeMinutes)}</span> : null}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Rodapé com Fechamento Geral */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <div className="text-xs text-gray-400">
                                Ao fechar o mês, as jornadas são travadas como auditadas e validadas para emissão de folha e espelho de ponto.
                            </div>
                            <Button
                                onClick={() => closeMonthMutation.mutate(undefined)}
                                disabled={closeMonthMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-9 shadow"
                            >
                                {closeMonthMutation.isPending ? <Loader2 className="animate-spin mr-1.5" size={14} /> : <CheckCircle2 className="mr-1.5" size={14} />}
                                Fechar Mês de Todos os Motoristas
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DriverMonthlyClosingModal;
