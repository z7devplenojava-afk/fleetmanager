import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Plus, FileText, RefreshCw, Loader2, Gauge, Truck, Calendar, MapPin, AlertCircle, CheckCircle2, FileSignature } from "lucide-react";
import { DailyLog } from '@/services/dailyLogService';
import { format } from 'date-fns';

interface DailyLogTableProps {
    data: DailyLog[];
    isLoading?: boolean;
    onEdit: (log: DailyLog) => void;
    onDelete: (id: string) => void;
    onCreate?: () => void;
    onRefresh?: () => void;
    onExportPDF?: () => void;
    /** PRD Módulo 5: auditoria (assinatura fiscal + telemetria + viagem extra). */
    onAudit?: (log: DailyLog) => void;
}

const DailyLogTable: React.FC<DailyLogTableProps> = ({
    data,
    isLoading = false,
    onEdit,
    onDelete,
    onCreate,
    onAudit,
    onRefresh,
    onExportPDF
}) => {
    // Calculando métricas resumidas
    const totalKm = data.reduce((sum, item) => sum + (item.totalKmRun || 0), 0);
    const totalExcess = data.reduce((sum, item) => sum + (item.excessKm || 0), 0);
    const logsWithExcess = data.filter(item => (item.excessKm || 0) > 0).length;

    return (
        <div className="space-y-4">
            {/* KPI Quick Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">Total de Lançamentos</p>
                        <p className="text-2xl font-mono font-bold text-white mt-0.5">{data.length}</p>
                    </div>
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">KM Total Percorrido</p>
                        <p className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">{totalKm.toLocaleString('pt-BR')} km</p>
                    </div>
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                        <Gauge className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl shadow-lg flex items-center justify-between">
                    <div>
                        <p className="text-xs uppercase text-slate-400 font-semibold tracking-wider">KM Excedente Total</p>
                        <p className="text-2xl font-mono font-bold text-red-400 mt-0.5">+{totalExcess.toLocaleString('pt-BR')} km</p>
                        <p className="text-xs text-slate-400">{logsWithExcess} partes com excesso</p>
                    </div>
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Container Principal */}
            <Card className="bg-slate-900/90 border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
                <CardHeader className="border-b border-slate-800/80 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-bold text-white tracking-tight">Parte Diária (Operacional)</CardTitle>
                                <p className="text-xs text-slate-400">Controle diário de rodagem de frota, turnos e franquias de quilometragem</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {onRefresh && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRefresh}
                                    disabled={isLoading}
                                    className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                            {onExportPDF && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onExportPDF}
                                    className="border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
                                >
                                    <FileText className="h-4 w-4 mr-2 text-amber-400" />
                                    Exportar PDF
                                </Button>
                            )}
                            {onCreate && (
                                <Button
                                    size="sm"
                                    onClick={onCreate}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-950/40"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Parte Diária
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                            <p className="text-sm font-medium">Carregando partes diárias...</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-60" />
                            <h4 className="text-lg font-bold text-white mb-1">Nenhuma Parte Diária Registrada</h4>
                            <p className="text-sm text-slate-400 max-w-md mx-auto mb-4">
                                Clique no botão abaixo para lançar o primeiro registro diário da frota.
                            </p>
                            {onCreate && (
                                <Button
                                    onClick={onCreate}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Cadastrar Primeira Parte Diária
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Card View para Dispositivos Móveis (Mobile) */}
                            <div className="block md:hidden divide-y divide-slate-800/80">
                                {data.map((log) => (
                                    <div key={log.id} className="p-4 space-y-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400">
                                                    <Truck className="w-4 h-4" />
                                                </div>
                                                <span className="font-mono font-bold text-white text-base">{log.vehiclePlate}</span>
                                            </div>
                                            <Badge className="bg-slate-800 text-slate-300 border-slate-700">
                                                {log.shift === 'DAY' ? 'Diurno' : 'Noturno'}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <span className="text-slate-500 uppercase font-semibold">Data</span>
                                                <p className="text-slate-300 font-medium">{format(new Date(log.date), 'dd/MM/yyyy')}</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-500 uppercase font-semibold">Rota / Cliente</span>
                                                <p className="text-slate-300 font-medium truncate">{log.route || log.clientId || '-'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                                            <div>
                                                <span className="text-slate-400">Rodagem Total</span>
                                                <p className="font-mono font-bold text-emerald-400 text-sm">{log.totalKmRun} km</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Franquia</span>
                                                <p className="font-mono font-medium text-slate-300 text-sm">{log.allowance} km</p>
                                            </div>
                                            <div>
                                                <span className="text-slate-400">Situação</span>
                                                <div>
                                                    {log.excessKm > 0 ? (
                                                        <Badge className="bg-red-950/80 text-red-400 border-red-500/40 text-xs">
                                                            +{log.excessKm} km
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-500/40 text-xs">
                                                            OK
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-1">
                                            {onAudit && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                                    onClick={() => onAudit(log)}
                                                >
                                                    <FileSignature className="h-3.5 w-3.5 mr-1" /> Auditar
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                                                onClick={() => onEdit(log)}
                                            >
                                                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-red-900/50 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                                                onClick={() => onDelete(log.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Table View para Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table className="w-full text-left text-slate-200">
                                    <TableHeader className="bg-slate-950 border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="px-5 py-4">Data</TableHead>
                                            <TableHead className="px-5 py-4">Veículo</TableHead>
                                            <TableHead className="px-5 py-4">Rota / Cliente</TableHead>
                                            <TableHead className="px-5 py-4">Turno</TableHead>
                                            <TableHead className="px-5 py-4 text-right">KM Total</TableHead>
                                            <TableHead className="px-5 py-4 text-right">Franquia</TableHead>
                                            <TableHead className="px-5 py-4 text-right">Situação</TableHead>
                                            <TableHead className="px-5 py-4 text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-slate-800/80 bg-slate-900/40">
                                        {data.map((log) => (
                                            <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/60 transition-colors">
                                                <TableCell className="px-5 py-4 font-medium text-white text-sm">
                                                    {format(new Date(log.date), 'dd/MM/yyyy')}
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-emerald-400">
                                                            <Truck className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-mono font-bold text-white text-sm">{log.vehiclePlate}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-sm text-slate-300">
                                                    <div className="font-semibold text-slate-200">{log.route || '-'}</div>
                                                    {log.clientId && <div className="text-xs text-slate-400">{log.clientId}</div>}
                                                </TableCell>
                                                <TableCell className="px-5 py-4">
                                                    <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-300">
                                                        {log.shift === 'DAY' ? 'Diurno' : 'Noturno'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                                                    {log.totalKmRun?.toLocaleString('pt-BR')} km
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-right font-mono text-slate-400 text-xs">
                                                    {log.allowance?.toLocaleString('pt-BR')} km
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-right">
                                                    {log.excessKm > 0 ? (
                                                        <Badge className="bg-red-950/80 text-red-400 border border-red-500/40 font-semibold">
                                                            +{log.excessKm} km
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold">
                                                            Dento da Franquia
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="px-5 py-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        {onAudit && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 text-slate-400 hover:text-purple-400 hover:bg-slate-800"
                                                                onClick={() => onAudit(log)}
                                                                title="Auditar (assinatura, telemetria, viagem extra)"
                                                            >
                                                                <FileSignature className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                                                            onClick={() => onEdit(log)}
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-slate-800"
                                                            onClick={() => onDelete(log.id)}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DailyLogTable;

