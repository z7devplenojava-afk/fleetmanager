'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { scheduleService, Schedule, CreateScheduleDTO } from '@/services/scheduleService';
import { ScheduleTable } from './ScheduleTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw, Filter, FileText, Calendar as CalendarIcon, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EscalaFormModal from '@/components/EscalaFormModal';

export const PlanningTab: React.FC = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');

    const { data: schedules = [], isLoading, refetch } = useQuery({
        queryKey: ['schedules'],
        queryFn: scheduleService.findAll
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateScheduleDTO) => scheduleService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast({ title: "Sucesso", description: "Escala criada com sucesso!" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: "Falha ao criar escala", variant: "destructive" });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => scheduleService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast({ title: "Sucesso", description: "Escala atualizada com sucesso!" });
        },
        onError: (error) => {
            toast({ title: "Erro", description: "Falha ao atualizar escala", variant: "destructive" });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => scheduleService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast({ title: "Sucesso", description: "Escala excluída com sucesso!" });
        },
        onError: (error) => {
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
        const payload: CreateScheduleDTO = {
            employeeId: formData.employeeId,
            scheduleDate: formData.scheduleDate instanceof Date
                ? formData.scheduleDate.toISOString().split('T')[0]
                : formData.scheduleDate,
            shift: formData.shift,
            status: formData.status || 'PENDING',
            observations: formData.observations
        };

        // Adicionar workPostId se disponível
        if (formData.workPostId && formData.workPostId.trim() !== '' && formData.workPostId !== 'none') {
            payload.workPostId = formData.workPostId;
        }

        // Adicionar travelTripId se disponível
        if (formData.travelTripId && formData.travelTripId.trim() !== '' && formData.travelTripId !== 'none') {
            payload.travelTripId = formData.travelTripId;
            if (formData.legs) {
                payload.legs = formData.legs;
            }
        }

        // Se não tem workPostId nem travelTripId, tentar usar locationId
        if (!payload.workPostId && !payload.travelTripId) {
            if (formData.locationId && formData.locationId.trim() !== '' && formData.locationId !== 'none') {
                payload.workPostId = formData.locationId;
                payload.locationId = formData.locationId;
            }
        }

        console.log('📤 PlanningTab - Payload para envio:', JSON.stringify(payload, null, 2));

        if (modalMode === 'create') {
            createMutation.mutate(payload);
        } else if (modalMode === 'edit' && selectedSchedule) {
            updateMutation.mutate({ id: selectedSchedule.id, data: payload });
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
        } catch (error) {
            toast({ title: "Erro", description: "Falha ao gerar relatório", variant: "destructive" });
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar por funcionário ou posto..."
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
                data={schedules}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <EscalaFormModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSave={handleSave}
                initialData={selectedSchedule}
                mode={modalMode}
            />
        </div>
    );
};
