import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, User, FileText, Sparkles, AlertTriangle, Moon } from 'lucide-react';
import { DriverWorkHour } from '@/services/driverHourService';

interface ControleHorasTableProps {
    data: DriverWorkHour[];
    onEdit: (hour: DriverWorkHour) => void;
}

const ControleHorasTable: React.FC<ControleHorasTableProps> = ({ data, onEdit }) => {
    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '--:--';
        try {
            if (timeStr.includes('T')) {
                return timeStr.split('T')[1]?.substring(0, 5) || '--:--';
            }
            return timeStr.substring(0, 5);
        } catch {
            return '--:--';
        }
    };

    const formatPegada = (start?: string, end?: string) => {
        if (!start && !end) return <span className="text-gray-600">-</span>;
        const s = formatTime(start);
        const e = formatTime(end);
        return (
            <div className="flex items-center gap-1 font-mono text-xs text-gray-200">
                <span>{s}</span>
                <span className="text-gray-500">➔</span>
                <span className={end ? "text-gray-200" : "text-amber-400 font-semibold"}>
                    {end ? e : "Em curso"}
                </span>
            </div>
        );
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        try {
            const [year, month, day] = dateStr.split('-');
            if (year && month && day) {
                return `${day}/${month}/${year}`;
            }
            return dateStr;
        } catch {
            return dateStr;
        }
    };

    const formatMinutes = (minutes?: number) => {
        if (minutes === undefined || minutes === null || minutes === 0) return '0 min';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h === 0) return `${m}m`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}m`;
    };

    const renderSourceBadge = (source?: string) => {
        switch (source) {
            case 'PONTO':
                return (
                    <Badge className="bg-sky-500/15 text-sky-400 border border-sky-500/30 font-medium text-[11px] flex items-center gap-1 w-fit py-0.5">
                        <Clock size={11} /> Ponto
                    </Badge>
                );
            case 'PARTE_DIARIA':
                return (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium text-[11px] flex items-center gap-1 w-fit py-0.5">
                        <FileText size={11} /> P. Diária
                    </Badge>
                );
            case 'HIBRIDO':
                return (
                    <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium text-[11px] flex items-center gap-1 w-fit py-0.5">
                        <Sparkles size={11} /> Ponto+Parte
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-zinc-700/40 text-zinc-300 border border-zinc-600/40 font-medium text-[11px] flex items-center gap-1 w-fit py-0.5">
                        Manual
                    </Badge>
                );
        }
    };

    return (
        <div className="rounded-lg border border-gray-700/70 bg-seguranca-graphite overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-seguranca-black/90">
                        <TableRow className="border-gray-700/60 hover:bg-transparent text-xs">
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Motorista</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Data</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Origem</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">1ª Pegada</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">2ª Pegada</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">3ª Pegada</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">4ª Pegada</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Total</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Adic. Noturno</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">H. Extra</TableHead>
                            <TableHead className="text-gray-300 font-semibold py-3 whitespace-nowrap">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center py-12 text-gray-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Clock className="w-8 h-8 text-gray-500 stroke-[1.5]" />
                                        <p className="text-sm font-medium">Nenhum registro de jornada encontrado no período.</p>
                                        <p className="text-xs text-gray-500">
                                            Clique em &quot;Sincronizar Jornadas&quot; para apurar batidas e viagens dos motoristas.
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row) => (
                                <TableRow
                                    key={row.id}
                                    className="cursor-pointer border-b border-gray-700/40 transition-colors hover:bg-seguranca-black/50"
                                    onClick={() => onEdit(row)}
                                >
                                    {/* Motorista */}
                                    <TableCell className="py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-gray-700 flex items-center justify-center text-seguranca-yellow font-semibold text-xs shrink-0">
                                                {row.employeeName ? row.employeeName.charAt(0).toUpperCase() : <User size={12} />}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-seguranca-lightgray font-medium text-xs truncate max-w-[170px]">
                                                    {row.employeeName || 'Motorista'}
                                                </span>
                                                {row.notes && (
                                                    <span className="text-[10px] text-gray-400 truncate max-w-[170px]" title={row.notes}>
                                                        {row.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Data */}
                                    <TableCell className="text-seguranca-lightgray font-medium text-xs py-2.5 whitespace-nowrap">
                                        {formatDate(row.referenceDate)}
                                    </TableCell>

                                    {/* Origem */}
                                    <TableCell className="py-2.5">
                                        {renderSourceBadge(row.source)}
                                    </TableCell>

                                    {/* 1ª Pegada */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {formatPegada(row.pegada1Start || (row.startTime && !row.pegada2Start ? row.startTime : undefined),
                                                      row.pegada1End || (row.endTime && !row.pegada2Start ? row.endTime : undefined))}
                                    </TableCell>

                                    {/* 2ª Pegada */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {formatPegada(row.pegada2Start, row.pegada2End)}
                                    </TableCell>

                                    {/* 3ª Pegada */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {formatPegada(row.pegada3Start, row.pegada3End)}
                                    </TableCell>

                                    {/* 4ª Pegada */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {formatPegada(row.pegada4Start, row.pegada4End)}
                                    </TableCell>

                                    {/* Duração Total */}
                                    <TableCell className="text-seguranca-lightgray font-bold text-xs py-2.5 whitespace-nowrap">
                                        {formatMinutes(row.totalMinutes)}
                                    </TableCell>

                                    {/* Adicional Noturno */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {row.nightMinutes && row.nightMinutes > 0 ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-amber-400 font-semibold text-xs flex items-center gap-1">
                                                    <Moon size={11} className="shrink-0" />
                                                    {formatMinutes(row.nightMinutes)} <span className="text-[10px] text-gray-400 font-normal">(relógio)</span>
                                                </span>
                                                <span className="text-[10px] text-emerald-400 font-mono">
                                                    CLT: {formatMinutes(row.nightReducedMinutes || Math.round(row.nightMinutes * 1.142857))}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-600 text-xs">-</span>
                                        )}
                                    </TableCell>

                                    {/* Horas Extras */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {row.overtimeMinutes && row.overtimeMinutes > 0 ? (
                                            <span className={`font-semibold text-xs flex items-center gap-1 ${row.overtimeMinutes > 120 ? 'text-rose-400' : 'text-amber-300'}`}>
                                                {row.overtimeMinutes > 120 && <AlertTriangle size={12} className="shrink-0" />}
                                                +{formatMinutes(row.overtimeMinutes)}
                                            </span>
                                        ) : (
                                            <span className="text-gray-600 text-xs">-</span>
                                        )}
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell className="py-2.5 whitespace-nowrap">
                                        {row.isClosed ? (
                                            <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex w-fit items-center gap-1 text-[11px] py-0.5">
                                                <CheckCircle2 size={11} /> Fechado
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 flex w-fit items-center gap-1 text-[11px] py-0.5">
                                                <Clock size={11} /> Aberto
                                            </Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ControleHorasTable;
