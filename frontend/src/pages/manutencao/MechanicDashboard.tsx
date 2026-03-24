import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MechanicKanban } from "@/components/maintenance/MechanicKanban";
import { MechanicMobileFeed } from "@/components/maintenance/MechanicMobileFeed";
import { VehicleHealthModal } from "@/components/maintenance/VehicleHealthModal";
import { Button } from "@/components/ui/button";
import { RefreshCw, Menu, Loader2 } from "lucide-react";
import fleetWorkOrderService, { WorkOrderStatus } from "@/services/fleetWorkOrderService";
import { useToast } from "@/hooks/use-toast";
import { StandardLayout } from "@/components/StandardLayout";

export default function MechanicDashboard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [selectedTask, setSelectedTask] = useState<any>(null);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { data: workOrders = [], isLoading, refetch } = useQuery({
        queryKey: ['mechanic-work-orders'],
        queryFn: () => fleetWorkOrderService.findAll()
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: WorkOrderStatus }) =>
            fleetWorkOrderService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mechanic-work-orders'] });
            toast({ title: "Sucesso", description: "Status atualizado." });
        },
        onError: (error: any) => {
            toast({
                title: "Erro",
                description: error.message || "Falha ao atualizar status.",
                variant: "destructive"
            });
        }
    });

    const columns = useMemo(() => {
        const mappedTasks = workOrders.map(wo => ({
            id: wo.id,
            type: 'WORK_ORDER',
            title: wo.notes || 'Ordem de Serviço',
            vehiclePlate: wo.vehiclePlate,
            vehicleFleetNumber: wo.vehicleId.slice(0, 4), // Placeholder for fleet number
            priority: 'MEDIUM', // Data model doesn't have priority yet
            status: wo.status,
            description: wo.notes || '',
            vehicleId: wo.vehicleId,
            items: wo.items
        }));

        return [
            {
                id: 'todo',
                title: '📅 A Fazer',
                color: 'border-b-blue-500',
                tasks: mappedTasks.filter(t => t.status === WorkOrderStatus.APPROVED || t.status === WorkOrderStatus.DRAFT)
            },
            {
                id: 'doing',
                title: '🔨 Em Andamento',
                color: 'border-b-orange-500',
                tasks: mappedTasks.filter(t => t.status === WorkOrderStatus.IN_PROGRESS)
            },
            {
                id: 'done',
                title: '✅ Finalizado',
                color: 'border-b-green-500',
                tasks: mappedTasks.filter(t => t.status === WorkOrderStatus.COMPLETED)
            }
        ];
    }, [workOrders]);

    const handleMoveTask = (taskId: string, newStatus: string) => {
        let status: WorkOrderStatus;
        switch (newStatus) {
            case 'TODO': status = WorkOrderStatus.APPROVED; break;
            case 'DOING': status = WorkOrderStatus.IN_PROGRESS; break;
            case 'DONE': status = WorkOrderStatus.COMPLETED; break;
            default: return;
        }
        updateStatusMutation.mutate({ id: taskId, status });
    };

    const allTasks = useMemo(() => columns.flatMap(c => c.tasks), [columns]);

    return (
        <StandardLayout title="Mechanic OS">
            <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden transition-all duration-300">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-10 h-10 animate-spin text-seguranca-yellow" />
                    </div>
                ) : isMobileView ? (
                    <MechanicMobileFeed
                        tasks={allTasks}
                        onTaskClick={setSelectedTask}
                    />
                ) : (
                    <div className="flex-1 flex flex-col h-full">
                        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <h1 className="text-xl font-bold tracking-wider uppercase">Mechanic<span className="text-slate-600">OS</span></h1>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetch()}
                                    className="border-slate-700 text-slate-400 hover:text-white"
                                >
                                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sincronizar
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden p-0">
                            <MechanicKanban
                                columns={columns}
                                onMoveTask={handleMoveTask}
                                onTaskClick={setSelectedTask}
                            />
                        </div>
                    </div>
                )}

                <VehicleHealthModal
                    isOpen={!!selectedTask}
                    onClose={() => setSelectedTask(null)}
                    task={selectedTask}
                />
            </div>
        </StandardLayout>
    );
}
