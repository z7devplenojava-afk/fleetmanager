'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
    scheduleService,
    Schedule,
    CreateScheduleDTO,
    matchesScheduleModeFilter,
    resolveScheduleRecurrence,
} from '@/services/scheduleService';
import { ScheduleTable } from './ScheduleTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, FileText, Calendar as CalendarIcon, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EscalaFormModal from '@/components/EscalaFormModal';

export const PlanningTab: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
    const [searchQuery, setSearchQuery] = useState('');
    const [recurrenceFilter, setRecurrenceFilter] = useState<'ALL' | 'WEEKLY_FIXED' | 'WEEKEND'>('ALL');

    const { data: schedules = [], isLoading, refetch } = useQuery({
        queryKey: ['schedules'],
        queryFn: scheduleService.findAll,
        refetchInterval: 3000,
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        const handleRealtimeUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            refetch();
        };
        window.addEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
        window.addEventListener('storage', handleRealtimeUpdate);
        let bc: BroadcastChannel | null = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                bc = new BroadcastChannel('fluxbus_realtime_sync');
                bc.onmessage = () => handleRealtimeUpdate();
            }
        } catch {
            // ignore
        }
        return () => {
            window.removeEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
            window.removeEventListener('storage', handleRealtimeUpdate);
            if (bc) bc.close();
        };
    }, [queryClient, refetch]);

    const createMutation = useMutation({
        mutationFn: (data: any) => scheduleService.create(data),
        onSuccess: async (createdSchedule) => {
            if (createdSchedule?.id) {
                queryClient.setQueryData<Schedule[]>(['schedules'], (old = []) => {
                    const filtered = old.filter((s) => s.id !== createdSchedule.id);
                    return [createdSchedule, ...filtered];
                });
            }
            await queryClient.invalidateQueries({ queryKey: ['schedules'] });
            await refetch();
            toast({ title: "Sucesso", description: "Escala criada com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao criar escala", variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => scheduleService.update(id, data),
        onSuccess: async (updatedSchedule) => {
            if (updatedSchedule?.id) {
                queryClient.setQueryData<Schedule[]>(['schedules'], (old = []) =>
                    old.map((s) => (s.id === updatedSchedule.id ? updatedSchedule : s))
                );
            }
            await queryClient.invalidateQueries({ queryKey: ['schedules'] });
            await refetch();
            toast({ title: "Sucesso", description: "Escala atualizada com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao atualizar escala", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => scheduleService.delete(id),
        onSuccess: async (_, deletedId) => {
            queryClient.setQueryData<Schedule[]>(['schedules'], (old = []) =>
                old.filter((s) => s.id !== deletedId)
            );
            await queryClient.invalidateQueries({ queryKey: ['schedules'] });
            await refetch();
            toast({ title: "Sucesso", description: "Escala excluída com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Falha ao excluir escala", variant: "destructive" });
        }
    });

    const handleCreate = () => {
        setSelectedSchedule(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEdit = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleView = (schedule: Schedule) => {
        setSelectedSchedule(schedule);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const handleDelete = (schedule: Schedule) => {
        if (confirm(`Deseja realmente excluir a escala de ${schedule.employee?.name}?`)) {
            deleteMutation.mutate(schedule.id);
        }
    };

    const handleSave = async (formData: any) => {
        const payload: CreateScheduleDTO & {
            employeeName?: string;
            workPostName?: string;
            routeName?: string;
            vehiclePlate?: string;
            vehicleModel?: string;
            travelTripName?: string;
        } = {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            scheduleDate: formData.scheduleDate instanceof Date
                ? format(formData.scheduleDate, 'yyyy-MM-dd')
                : String(formData.scheduleDate || '').substring(0, 10),
            scheduleRecurrence: formData.scheduleRecurrence || 'WEEKLY_FIXED',
            shift: formData.shift,
            startTime: formData.startTime,
            endTime: formData.endTime,
            legs: formData.legs || 1,
            status: formData.status || 'PENDING',
            observations: formData.observations,
            routeId: formData.routeId,
            routeName: formData.routeName,
            routeCode: formData.routeName,
            vehicleId: formData.vehicleId,
            vehiclePlate: formData.vehiclePlate,
            vehicleModel: formData.vehicleModel,
            clientName: formData.clientName,
            workPostName: formData.workPostName,
        };

        if (formData.workPostId && formData.workPostId.trim() !== '' && formData.workPostId !== 'none') {
            payload.workPostId = formData.workPostId;
        }

        if (formData.travelTripId && formData.travelTripId.trim() !== '' && formData.travelTripId !== 'none') {
            payload.travelTripId = formData.travelTripId;
            payload.travelTripName = formData.travelTripName;
        }

        if (!payload.workPostId && !payload.travelTripId) {
            if (formData.locationId && formData.locationId.trim() !== '' && formData.locationId !== 'none') {
                payload.workPostId = formData.locationId;
                payload.locationId = formData.locationId;
            }
        }

        if (modalMode === 'create' && !selectedSchedule?.id) {
            await createMutation.mutateAsync(payload);
        } else if (selectedSchedule?.id) {
            await updateMutation.mutateAsync({ id: selectedSchedule.id, data: payload });
        }
    };

    const handleExportPDF = async () => {
        try {
            const blob = await scheduleService.generatePDFReport({});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `escalas-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            toast({ title: "Erro", description: "Falha ao gerar relatório", variant: "destructive" });
        }
    };

    const filteredSchedules = useMemo(() => {
        return schedules.filter((s) => {
            if (!matchesScheduleModeFilter(s, recurrenceFilter)) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (
                (s.employee?.name || '').toLowerCase().includes(q) ||
                (s.vehicle?.plate || s.vehiclePlate || '').toLowerCase().includes(q) ||
                (s.routeCode || s.route?.name || s.travelTrip?.name || s.workPost?.name || '').toLowerCase().includes(q) ||
                (s.clientName || s.client?.name || s.workPost?.client?.name || '').toLowerCase().includes(q)
            );
        });
    }, [schedules, recurrenceFilter, searchQuery]);

    const weeklyCount = useMemo(
        () => schedules.filter((s) => resolveScheduleRecurrence(s) !== 'WEEKEND').length,
        [schedules]
    );
    const weekendCount = useMemo(
        () => schedules.filter((s) => resolveScheduleRecurrence(s) === 'WEEKEND').length,
        [schedules]
    );

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            {/* Barra de Regime Semanal vs Final de Semana (FDS) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-seguranca-graphite/80 border border-gray-700 p-3.5 rounded-xl">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5 mr-1">
                        <CalendarIcon className="h-3.5 w-3.5 text-seguranca-yellow" />
                        Regime da Escala:
                    </span>
                    <button
                        type="button"
                        onClick={() => setRecurrenceFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            recurrenceFilter === 'ALL'
                                ? 'bg-seguranca-yellow text-seguranca-black border-seguranca-yellow'
                                : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                    >
                        Todas ({schedules.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrenceFilter('WEEKLY_FIXED')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            recurrenceFilter === 'WEEKLY_FIXED'
                                ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500'
                                : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                    >
                        📅 Escala Fixa Semanal — Seg a Sex ({weeklyCount})
                    </button>
                    <button
                        type="button"
                        onClick={() => setRecurrenceFilter('WEEKEND')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            recurrenceFilter === 'WEEKEND'
                                ? 'bg-amber-500/25 text-amber-300 border-amber-500'
                                : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-gray-500'
                        }`}
                    >
                        🗓️ Escala Final de Semana — FDS ({weekendCount})
                    </button>
                </div>

                <Badge variant="outline" className="text-[11px] border-emerald-500/30 text-emerald-300 bg-emerald-500/10 self-start lg:self-auto">
                    A escala semanal fica fixa durante toda a semana até que o gestor edite
                </Badge>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por motorista, veículo, rota, cliente ou posto..."
                        className="w-full bg-seguranca-black border border-gray-600 rounded-md pl-10 pr-4 py-2 text-sm text-seguranca-lightgray focus:border-seguranca-yellow outline-none transition-colors"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-seguranca-black border-gray-600 text-gray-400 hover:text-white"
                        onClick={() => refetch()}
                    >
                        <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-seguranca-black border-gray-600 text-gray-400 hover:text-white"
                        onClick={handleExportPDF}
                    >
                        <FileText size={16} className="mr-2" />
                        PDF
                    </Button>
                    <Button
                        size="sm"
                        className="bg-seguranca-red hover:bg-seguranca-darkred text-white shadow-lg shadow-red-900/20"
                        onClick={handleCreate}
                    >
                        <Plus size={16} className="mr-2" />
                        Nova Escala
                    </Button>
                </div>
            </div>

            <ScheduleTable
                data={filteredSchedules}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRefresh={() => refetch()}
            />

            <EscalaFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSave={handleSave}
                initialData={selectedSchedule}
                mode={modalMode}
                existingSchedules={schedules}
            />
        </div>
    );
};
