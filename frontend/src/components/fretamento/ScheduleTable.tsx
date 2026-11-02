'use client';

import React, { useState, useEffect } from 'react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
    Edit,
    Trash2,
    Eye,
    Calendar,
    Clock,
    User,
    MapPin,
    Bus,
    Footprints,
    Building2,
    Camera,
    Gauge,
    Users,
    CheckCircle2,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import {
    Schedule,
    scheduleService,
    resolveScheduleRecurrence,
    resolveScheduleStartTime,
    resolveScheduleEndTime,
} from '@/services/scheduleService';
import { DriverActivityInspectorModal } from '@/components/driver/DriverActivityInspectorModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseLocalDate } from '@/utils/date-utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleTableProps {
    data: Schedule[];
    onView: (schedule: Schedule) => void;
    onEdit: (schedule: Schedule) => void;
    onDelete: (schedule: Schedule) => void;
    onRefresh?: () => void;
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

export const ScheduleTable: React.FC<ScheduleTableProps> = ({ data, onView, onEdit, onDelete, onRefresh }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [selectedScheduleForPhotos, setSelectedScheduleForPhotos] = useState<Schedule | null>(null);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [inspectedDriver, setInspectedDriver] = useState<{ id?: string; name: string } | null>(null);

    useEffect(() => {
        const handleRealtimeDriverUpdate = () => {
            if (onRefresh) onRefresh();
        };
        window.addEventListener('fluxbus:driver-records-updated', handleRealtimeDriverUpdate);
        window.addEventListener('storage', handleRealtimeDriverUpdate);
        return () => {
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtimeDriverUpdate);
            window.removeEventListener('storage', handleRealtimeDriverUpdate);
        };
    }, [onRefresh]);

    const handleApprovePoint = async (schedule: Schedule, approved: boolean) => {
        setApprovingId(schedule.id);
        try {
            await scheduleService.approvePoint(schedule.id, {
                approved,
                approvedBy: user?.name || user?.email || 'Gestor de Tráfego'
            });
            toast({
                title: approved ? 'Ponto Aprovado pelo Tráfego!' : 'Ponto Rejeitado',
                description: approved
                    ? `O registro de ponto de ${schedule.employee?.name || 'motorista'} foi aprovado e o horário liberado.`
                    : `O registro de ponto de ${schedule.employee?.name || 'motorista'} foi rejeitado.`,
                variant: approved ? 'default' : 'destructive',
            });
            if (onRefresh) onRefresh();
        } catch (err: any) {
            toast({
                title: 'Erro ao processar aprovação',
                description: err?.message || 'Não foi possível concluir a operação.',
                variant: 'destructive',
            });
        } finally {
            setApprovingId(null);
        }
    };

    return (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
            <Table>
                <TableHeader className="bg-seguranca-graphite">
                    <TableRow className="border-gray-600">
                        <TableHead className="text-seguranca-lightgray font-semibold">Motorista</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Cliente</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Percurso / Veículo</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Data & Horário</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Ponto, KM, Passag. & Fotos</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-center">Pegadas</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold">Status</TableHead>
                        <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0 ? (
                        data.map((schedule) => {
                            const tripName = schedule.routeCode || schedule.route?.name || schedule.travelTrip?.name;
                            const postName = schedule.workPost?.name;
                            const locationName = schedule.location?.name;
                            const displayName = tripName || postName || locationName || 'Não informado';

                            const clientName = schedule.clientName
                                || schedule.client?.name
                                || schedule.travelTrip?.client?.name
                                || (schedule.workPost as any)?.client?.name
                                || '—';

                            const legs = schedule.legs || schedule.travelTrip?.legs || null;
                            const isPendingPoint = schedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL';

                            let photosCount = 0;
                            if (schedule.tripPhotosJson) {
                                try {
                                    const parsed = JSON.parse(schedule.tripPhotosJson);
                                    if (Array.isArray(parsed)) photosCount = parsed.length;
                                } catch {
                                    photosCount = 0;
                                }
                            }

                            return (
                                <TableRow key={schedule.id} className="border-gray-600 hover:bg-seguranca-graphite/50 transition-colors">
                                    {/* Motorista (Clicável pelo Gestor de Tráfego / Encarregado) */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInspectedDriver({
                                                    id: schedule.employeeId || schedule.employee?.id,
                                                    name: schedule.employee?.name || 'Motorista',
                                                })
                                            }
                                            title="Clique no nome do motorista para ver todas as atividades, fotos, endereços GPS e mapa do trajeto (Ida/Retorno)"
                                            className="flex flex-col items-start gap-0.5 text-left group hover:bg-seguranca-yellow/10 p-1.5 -m-1.5 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-seguranca-yellow flex-shrink-0" />
                                                <span className="font-bold truncate max-w-[150px] group-hover:text-seguranca-yellow underline decoration-dotted underline-offset-4">
                                                    {schedule.employee?.name || 'Não informado'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-emerald-400 flex items-center gap-1 pl-5">
                                                <MapPin size={10} /> Ver atividades & trajeto
                                            </span>
                                        </button>
                                    </TableCell>

                                    {/* Cliente */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <div className="flex items-center gap-2">
                                            <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                                            <span className="text-sm truncate max-w-[140px]">{clientName}</span>
                                        </div>
                                    </TableCell>

                                    {/* Percurso / Veículo */}
                                    <TableCell className="text-seguranca-lightgray max-w-[220px]">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                {tripName ? (
                                                    <Bus size={14} className="text-seguranca-red flex-shrink-0" />
                                                ) : (
                                                    <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                                )}
                                                <span className="font-semibold text-sm truncate">{displayName}</span>
                                            </div>
                                            {(schedule.vehicle?.plate || schedule.vehiclePlate) && (
                                                <span className="text-xs text-emerald-400 font-mono">
                                                    🚌 {schedule.vehicle?.plate || schedule.vehiclePlate}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1">
                                                {tripName && getTripTypeBadge(schedule.travelTrip?.tripType)}
                                                {schedule.travelTrip?.code && (
                                                    <span className="text-[10px] text-gray-500 font-mono">
                                                        {schedule.travelTrip.code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Data & Horário */}
                                    <TableCell className="text-seguranca-lightgray">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={13} className="text-gray-400 flex-shrink-0" />
                                                <span className="text-xs font-semibold">
                                                    {format(parseLocalDate(schedule.scheduleDate), 'dd/MM/yyyy', { locale: ptBR })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                                                <Clock size={12} />
                                                <span>
                                                    {isPendingPoint
                                                        ? 'Aguard. Gestor'
                                                        : `${resolveScheduleStartTime(schedule)} às ${resolveScheduleEndTime(schedule)}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {getShiftBadge(schedule.shift)}
                                                {(() => {
                                                    const rec = resolveScheduleRecurrence(schedule);
                                                    if (rec === 'WEEKEND') {
                                                        return (
                                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                                                                🗓️ FDS
                                                            </Badge>
                                                        );
                                                    }
                                                    if (rec === 'SINGLE_DAY') {
                                                        return (
                                                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px]">
                                                                📌 Data Única
                                                            </Badge>
                                                        );
                                                    }
                                                    return (
                                                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                                                            📅 Fixa Semanal
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </TableCell>

                                    {/* Ponto, KM, Passageiros & Fotos no Ônibus */}
                                    <TableCell className="text-seguranca-lightgray">
                                        {(() => {
                                            const hasPoint =
                                                Boolean(schedule.pointRegisteredAt) ||
                                                schedule.pointStatus === 'APPROVED' ||
                                                schedule.status === 'IN_PROGRESS' ||
                                                schedule.status === 'COMPLETED' ||
                                                schedule.initialKm != null;
                                            const pointTimeStr = schedule.pointRegisteredAt
                                                ? (() => {
                                                      try {
                                                          return new Date(schedule.pointRegisteredAt).toLocaleTimeString('pt-BR', {
                                                              hour: '2-digit',
                                                              minute: '2-digit',
                                                          });
                                                      } catch {
                                                          return resolveScheduleStartTime(schedule);
                                                      }
                                                  })()
                                                : resolveScheduleStartTime(schedule);
                                            const hasKm = schedule.initialKm != null || schedule.finalKm != null;
                                            const hasPax = schedule.passengersCount != null && (schedule.passengersCount > 0 || hasKm || hasPoint);
                                            const hasGps = Boolean(schedule.startAddress || schedule.endAddress);
                                            const hasAnyExecutionData =
                                                hasPoint || hasKm || hasPax || photosCount > 0 || hasGps || isPendingPoint;

                                            return (
                                                <div className="space-y-1 text-xs">
                                                    {hasPoint && !isPendingPoint && (
                                                        <div className="flex items-center gap-1 text-emerald-300 font-semibold">
                                                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                                                            <span>Ponto: {pointTimeStr} • Registrado</span>
                                                        </div>
                                                    )}
                                                    {hasKm && (
                                                        <div className="flex items-center gap-1 text-gray-200 font-mono">
                                                            <Gauge size={13} className="text-blue-400 shrink-0" />
                                                            <span>
                                                                KM: {schedule.initialKm ?? '-'} → {schedule.finalKm ?? 'em curso'}
                                                                {schedule.initialKm != null &&
                                                                    schedule.finalKm != null &&
                                                                    schedule.finalKm >= schedule.initialKm && (
                                                                        <span className="text-emerald-400 ml-1">
                                                                            (+{schedule.finalKm - schedule.initialKm} km)
                                                                        </span>
                                                                    )}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {hasPax && (
                                                        <div className="flex items-center gap-1 text-purple-300">
                                                            <Users size={13} className="text-purple-400 shrink-0" />
                                                            <span>Passageiros: {schedule.passengersCount ?? 0}</span>
                                                        </div>
                                                    )}
                                                    {hasGps && (
                                                        <div
                                                            className="flex items-center gap-1 text-[11px] text-emerald-300/90 max-w-[210px] truncate"
                                                            title={schedule.endAddress || schedule.startAddress}
                                                        >
                                                            <MapPin size={11} className="text-emerald-400 shrink-0" />
                                                            <span className="truncate">
                                                                {schedule.endAddress || schedule.startAddress}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {photosCount > 0 && (
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setSelectedScheduleForPhotos(schedule)}
                                                            className="h-6 px-2 text-[11px] border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/20"
                                                        >
                                                            <Camera size={12} className="mr-1" />
                                                            Fotos no Ônibus ({photosCount})
                                                        </Button>
                                                    )}
                                                    {isPendingPoint && (
                                                        <div className="pt-1 space-y-1">
                                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                                                                <AlertTriangle size={11} className="mr-1" />
                                                                Aprovar Ponto
                                                            </Badge>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    disabled={approvingId === schedule.id}
                                                                    onClick={() => handleApprovePoint(schedule, true)}
                                                                    className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white"
                                                                >
                                                                    Aprovar
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={approvingId === schedule.id}
                                                                    onClick={() => handleApprovePoint(schedule, false)}
                                                                    className="h-6 px-2 text-[10px] border-red-500/50 text-red-300"
                                                                >
                                                                    Rejeitar
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!hasAnyExecutionData && (
                                                        <span className="text-gray-500 text-[11px]">Aguardando registro</span>
                                                    )}
                                                </div>
                                            );
                                        })()}
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
                                    <TableCell>
                                        {isPendingPoint ? (
                                            <Badge variant="outline" className="text-amber-400 border-amber-500/40">
                                                Aguard. Tráfego
                                            </Badge>
                                        ) : (
                                            getStatusBadge(schedule.status)
                                        )}
                                    </TableCell>

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

            {/* Modal de Verificação de Fotos no Ônibus pelo Gestor de Tráfego */}
            <Dialog
                open={Boolean(selectedScheduleForPhotos)}
                onOpenChange={(open) => !open && setSelectedScheduleForPhotos(null)}
            >
                <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-seguranca-yellow">
                            <Camera className="h-5 w-5" />
                            Verificação do Gestor de Tráfego • Fotos do Motorista no Ônibus
                        </DialogTitle>
                        <DialogDescription className="text-gray-300">
                            Fotos capturadas pela câmera do celular no Ponto Eletrônico do Motorista.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedScheduleForPhotos && (() => {
                        let photosList: string[] = [];
                        if (selectedScheduleForPhotos.tripPhotosJson) {
                            try {
                                const parsed = JSON.parse(selectedScheduleForPhotos.tripPhotosJson);
                                if (Array.isArray(parsed)) photosList = parsed;
                            } catch {
                                photosList = [];
                            }
                        }
                        return (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/50 border border-gray-800 text-xs">
                                    <div>
                                        <span className="text-gray-400 block">Motorista</span>
                                        <span className="font-bold text-white">{selectedScheduleForPhotos.employee?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">Cliente</span>
                                        <span className="font-bold text-white">
                                            {selectedScheduleForPhotos.clientName || selectedScheduleForPhotos.location?.name || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">Percurso</span>
                                        <span className="font-bold text-blue-300">
                                            {selectedScheduleForPhotos.routeCode || selectedScheduleForPhotos.route?.name || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">Horário</span>
                                        <span className="font-bold text-amber-300">
                                            {selectedScheduleForPhotos.startTime || '--:--'} às {selectedScheduleForPhotos.endTime || 'em curso'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">KM Inicial → Final</span>
                                        <span className="font-bold text-white">
                                            {selectedScheduleForPhotos.initialKm ?? '-'} → {selectedScheduleForPhotos.finalKm ?? 'em curso'} km
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400 block">Passageiros</span>
                                        <span className="font-bold text-purple-300">
                                            {selectedScheduleForPhotos.passengersCount ?? 0}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {photosList.map((src, i) => (
                                        <div key={i} className="rounded-xl overflow-hidden border border-gray-700 bg-black">
                                            <img src={src} alt={`Foto ${i + 1}`} className="w-full h-56 object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            {/* Dossiê Completo por Motorista (Ao clicar no nome do motorista: Atividades, Fotos, Informações e Mapa de Trajeto Ida/Retorno) */}
            <DriverActivityInspectorModal
                isOpen={Boolean(inspectedDriver)}
                onClose={() => setInspectedDriver(null)}
                driverId={inspectedDriver?.id}
                driverName={inspectedDriver?.name || ''}
                initialSchedules={data.filter(
                    (s) =>
                        (inspectedDriver?.id && (s.employeeId === inspectedDriver.id || s.employee?.id === inspectedDriver.id)) ||
                        (inspectedDriver?.name &&
                            (s.employee?.name || '').trim().toLowerCase() === inspectedDriver.name.trim().toLowerCase())
                )}
                onScheduleUpdated={onRefresh}
            />
        </div>
    );
};
