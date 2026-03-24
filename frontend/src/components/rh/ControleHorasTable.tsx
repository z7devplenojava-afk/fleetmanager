import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from 'lucide-react';
import { DriverWorkHour } from '@/services/driverHourService';

interface ControleHorasTableProps {
    data: DriverWorkHour[];
    onEdit: (hour: DriverWorkHour) => void;
}

const ControleHorasTable: React.FC<ControleHorasTableProps> = ({ data, onEdit }) => {
    return (
        <div className="rounded-md border border-gray-600 bg-seguranca-graphite overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-black">
                    <TableRow>
                        <TableHead className="text-seguranca-lightgray">Data</TableHead>
                        <TableHead className="text-seguranca-lightgray">Início</TableHead>
                        <TableHead className="text-seguranca-lightgray">Fim</TableHead>
                        <TableHead className="text-seguranca-lightgray">Noturno (min)</TableHead>
                        <TableHead className="text-seguranca-lightgray">Extra (min)</TableHead>
                        <TableHead className="text-seguranca-lightgray">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-400 italic">
                                Nenhum registro encontrado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => (
                            <TableRow key={row.id} className="cursor-pointer hover:bg-seguranca-black/50" onClick={() => onEdit(row)}>
                                <TableCell className="text-seguranca-lightgray">{row.referenceDate}</TableCell>
                                <TableCell className="text-seguranca-lightgray">{row.startTime.split('T')[1]?.substring(0, 5)}</TableCell>
                                <TableCell className="text-seguranca-lightgray">{row.endTime.split('T')[1]?.substring(0, 5)}</TableCell>
                                <TableCell className="text-seguranca-lightgray">{row.nightMinutes}</TableCell>
                                <TableCell className="text-seguranca-lightgray">{row.overtimeMinutes}</TableCell>
                                <TableCell>
                                    {row.isClosed ? (
                                        <Badge className="bg-green-100 text-green-800">Fechado</Badge>
                                    ) : (
                                        <Badge className="bg-seguranca-yellow/20 text-seguranca-yellow border-seguranca-yellow/50 flex w-fit items-center gap-1">
                                            <Clock size={12} /> Aberto
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ControleHorasTable;
