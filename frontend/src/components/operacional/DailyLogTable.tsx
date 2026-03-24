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
import { Edit, Trash2, Plus, FileText, RefreshCw, Loader2 } from "lucide-react";
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
}

const DailyLogTable: React.FC<DailyLogTableProps> = ({
    data,
    isLoading = false,
    onEdit,
    onDelete,
    onCreate,
    onRefresh,
    onExportPDF
}) => {
    return (
        <Card className="bg-seguranca-graphite border-gray-700">
            <CardHeader className="border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-seguranca-lightgray flex items-center gap-2">
                        <FileText className="h-5 w-5 text-seguranca-yellow" />
                        Parte Diária
                    </CardTitle>
                    <div className="flex gap-2">
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
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
                                className="border-gray-600 text-gray-300 hover:bg-seguranca-black"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Exportar PDF
                            </Button>
                        )}
                        {onCreate && (
                            <Button
                                size="sm"
                                onClick={onCreate}
                                className="bg-seguranca-red hover:bg-seguranca-darkred"
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
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-seguranca-black">
                            <TableRow className="border-gray-700 hover:bg-transparent">
                                <TableHead className="text-gray-400">Data</TableHead>
                                <TableHead className="text-gray-400">Veículo</TableHead>
                                <TableHead className="text-gray-400">Rota / Cliente</TableHead>
                                <TableHead className="text-gray-400">Turno</TableHead>
                                <TableHead className="text-right text-gray-400">KM Total</TableHead>
                                <TableHead className="text-right text-gray-400">Franquia</TableHead>
                                <TableHead className="text-right text-gray-400">Excedente</TableHead>
                                <TableHead className="text-right text-gray-400">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow className="border-gray-700 hover:bg-transparent">
                                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                                        Nenhum registro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((log) => (
                                    <TableRow key={log.id} className="border-gray-700 hover:bg-seguranca-black/50 transition-colors">
                                        <TableCell className="font-medium text-slate-200">
                                            {format(new Date(log.date), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            <div className="font-bold">{log.vehiclePlate}</div>
                                        </TableCell>
                                        <TableCell className="text-slate-400 text-xs">
                                            <div>{log.route || '-'}</div>
                                            {log.clientId && <div className="text-gray-500">{log.clientId}</div>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-gray-600 text-gray-400">
                                                {log.shift}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-slate-200 font-mono">
                                            {log.totalKmRun} km
                                        </TableCell>
                                        <TableCell className="text-right text-slate-400 font-mono text-xs">
                                            {log.allowance} km
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold">
                                            {log.excessKm > 0 ? (
                                                <span className="text-red-500">+{log.excessKm} km</span>
                                            ) : (
                                                <span className="text-green-500">OK</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                                    onClick={() => onEdit(log)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                                    onClick={() => onDelete(log.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default DailyLogTable;
