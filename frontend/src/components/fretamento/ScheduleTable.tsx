'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, Calendar, Clock, User, MapPin, Bus, Footprints, Building2 } from 'lucide-react';
import { Schedule } from '@/services/scheduleService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/date-utils';

interface ScheduleTableProps {
    data: Schedule[];
    onView: (schedule: Schedule) => void;
    onEdit: (schedule: Schedule) => void;
    onDelete: (schedule: Schedule) => void;
}

const getShiftBadge = (shift: string) => {
    switch (shift) {
        case 'DAY': return <Badge className="bg-blue-900/20 text-blue-400 border-blue-700/30">Diurno</Badge>;
        case 'NIGHT': return <Badge className="bg-purple-900/20 text-purple-400 border-purple-700/30">Noturno</Badge>;
        case 'MIXED': return <Badge className="bg-amber-900/20 text-amber-400 border-amber-700/30">Misto</Badge>;
        default: return <Badge>{shift}</Badge>;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'PENDING': return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Pendente</Badge>;
        case 'APPROVED': return <Badge variant="outline" className="text-blue-500 border-blue-500/30">Aprovada</Badge>;
        case 'CONFIRMED': return <Badge variant="outline" className="text-blue-500 border-blue-500/30">Confirmada</Badge>;
        case 'IN_PROGRESS': return <Badge variant="outline" className="text-green-400 border-green-400/30">Em Andamento</Badge>;
        case 'COMPLETED': return <Badge variant="outline" className="text-green-500 border-green-500/30">Concluída</Badge>;
        case 'CANCELLED': return <Badge variant="outline" className="text-red-500 border-red-500/30">Cancelada</Badge>;
        case 'REJECTED': return <Badge variant="outline" className="text-red-400 border-red-400/30">Rejeitada</Badge>;
        default: return <Badge>{status}</Badge>;
    }
};

const getTripTypeBadge = (tripType?: string) => {
    switch (tripType) {
        case 'FRETADO': return <Badge className="bg-seguranca-red/20 text-seguranca-red border-seguranca-red/30 text-[10px]">Fretado</Badge>;
        case 'TURISTICO': return <Badge className="bg-cyan-900/20 text-cyan-400 border-cyan-700/30 text-[10px]">Turístico</Badge>;
        default: return null;
    }
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ data, onView, onEdit, onDelete }) => {
    return (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-graphite">
                    <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray font-semibold">Funcionário</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Cliente</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Viagem / Posto</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Data</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Turno</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-center">Pegadas</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((schedule) => {
                            // Determinar nome do local/viagem/posto
                            const tripName = schedule.travelTrip?.name;
                            const postName = schedule.workPost?.name;
                            const locationName = schedule.location?.name;
                            const displayName = tripName || postName || locationName || 'Não informado';

                            // Cliente pode vir da viagem ou do posto
                            const clientName = schedule.client?.name
                                || schedule.travelTrip?.client?.name
                                || (schedule.workPost as any)?.client?.name
                                || '—';

                            // Pegadas
                            const legs = schedule.legs || schedule.travelTrip?.legs || null;

                            return (
                                <TableRow key={schedule.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                    {/* Funcionário */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <div className="flex items-center gap-2">
                                            <User size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="font-bold truncate max-w-[150px]">
                                                {schedule.employee?.name || 'Não informado'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Cliente */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm truncate max-w-[120px]">{clientName}</span>
                                        </div>
                                    </TableCell>

                                    {/* Viagem / Posto */}
                                    <TableCell className="text-seguranca-lightgray max-w-[200px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {tripName ? (
                                                    <Bus size={14} className="text-seguranca-red flex-shrink-0" />
                                                ) : (
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-sm truncate">{displayName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {tripName && getTripTypeBadge(schedule.travelTrip?.tripType)}
                                                {schedule.travelTrip?.code && (
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        {schedule.travelTrip.code}
                                                    </span>
                                                )}
                                                {!tripName && schedule.workPost?.postCode && (
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        Cód: {schedule.workPost.postCode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Data */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm">
                                                {format(parseLocalDate(schedule.scheduleDate), 'dd/MM/yyyy', { locale: ptBR })}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Turno */}
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {getShiftBadge(schedule.shift)}
                                            {schedule.workPost?.shiftStart && (
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {schedule.workPost.shiftStart} - {schedule.workPost.shiftEnd}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Pegadas */}
                                    <TableCell className="text-center">
                                        {legs ? (
                                            <div className="flex items-center justify-center gap-1">
                                                <Footprints size={14} className="text-seguranca-yellow" />
                                                <span className="text-seguranca-yellow font-bold">{legs}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>

                                    {/* Ações */}
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onView(schedule)}
                                                className="h-8 w-8 p-0 border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black"
                                                title="Visualizar"
                                            >
                                                <Eye size={14} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEdit(schedule)}
                                                className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                                                title="Editar"
                                            >
                                                <Edit size={14} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onDelete(schedule)}
                                                className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                                title="Excluir"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                                <div className="flex flex-col items-center gap-2">
                                    <Calendar size={32} className="text-gray-600" />
                                    <span>Nenhuma escala de trabalho encontrada para o período.</span>
                                    <span className="text-xs text-gray-600">Clique em "Nova Escala" para criar uma.</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
