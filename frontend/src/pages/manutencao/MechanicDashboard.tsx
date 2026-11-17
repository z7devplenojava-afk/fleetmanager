import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MechanicKanban, KanbanTask, KanbanColumn } from "@/components/maintenance/MechanicKanban";
import { MechanicMobileFeed } from "@/components/maintenance/MechanicMobileFeed";
import { MechanicWorkOrderModal } from "@/components/maintenance/MechanicWorkOrderModal";
import FleetWorkOrderForm from "@/components/frota/FleetWorkOrderForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Loader2,
  Calendar,
  Wrench,
  Clock,
  Building,
  CheckCircle,
  LayoutGrid,
  User,
  Truck,
  Camera,
  AlertTriangle,
  Play,
  FileText,
  Search,
  Download,
  Filter,
  Check,
  Eye,
  X
} from "lucide-react";
import fleetWorkOrderService, {
  FleetWorkOrder,
  WorkOrderStatus,
  LaborType
} from "@/services/fleetWorkOrderService";
import { generateFleetWorkOrderPDFDownload } from "@/utils/fleetWorkOrderPDFGenerator";
import fleetService, { Vehicle } from "@/services/fleetService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { StandardLayout } from "@/components/StandardLayout";

type ViewTab = 'all' | 'my' | 'parts' | 'external' | 'done' | 'kanban' | 'report';

export default function MechanicDashboard() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<FleetWorkOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtros da aba de Relatório
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportStatus, setReportStatus] = useState('TODOS');
  const [reportVehicleId, setReportVehicleId] = useState('ALL');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Busca todas as Ordens de Serviço
  const { data: workOrders = [], isLoading, refetch } = useQuery<FleetWorkOrder[]>({
    queryKey: ['mechanic-work-orders'],
    queryFn: () => fleetWorkOrderService.findAll()
  });

  // Busca veículos da empresa para o filtro do relatório
  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ['mechanic-vehicles-list'],
    queryFn: () => fleetService.getVehicles()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkOrderStatus }) =>
      fleetWorkOrderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mechanic-work-orders'] });
      toast({ title: "Status atualizado com sucesso." });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar status.",
        variant: "destructive"
      });
    }
  });

  // Mapeamento das tarefas para o Kanban
  const mappedTasks = useMemo<KanbanTask[]>(() => {
    return workOrders.map(wo => ({
      id: wo.id,
      type: 'WORK_ORDER',
      title: wo.notes || wo.stopReason || 'Ordem de Serviço',
      vehiclePlate: wo.vehiclePlate || 'Sem Placa',
      vehicleFleetNumber: wo.vehicleFleetNumber || wo.vehicleId?.slice(0, 4) || 'VEIC',
      priority: wo.priority || 'MEDIUM',
      status: wo.status,
      description: wo.stopReason || wo.notes || 'Sem descrição cadastrada.',
      vehicleId: wo.vehicleId,
      mechanicName: wo.mechanicName,
      laborType: wo.laborType,
      photoCount: wo.photoAttachments ? wo.photoAttachments.length : 0,
      rawWorkOrder: wo
    }));
  }, [workOrders]);

  // Contadores dinâmicos e identificação do mecânico atual
  const currentUserId = currentUser?.id;
  const currentUserName = currentUser?.name?.toLowerCase();

  // Filtragem por termo de busca geral (placa, prefixo, número OS, motivo)
  const filteredWorkOrders = useMemo(() => {
    if (!searchTerm.trim()) return workOrders;
    const term = searchTerm.toLowerCase();
    return workOrders.filter(wo =>
      (wo.vehiclePlate && wo.vehiclePlate.toLowerCase().includes(term)) ||
      (wo.vehicleModel && wo.vehicleModel.toLowerCase().includes(term)) ||
      (wo.vehicleFleetNumber && wo.vehicleFleetNumber.toLowerCase().includes(term)) ||
      (wo.id && wo.id.toLowerCase().includes(term)) ||
      (wo.osNumber && wo.osNumber.toLowerCase().includes(term)) ||
      (wo.notes && wo.notes.toLowerCase().includes(term)) ||
      (wo.stopReason && wo.stopReason.toLowerCase().includes(term)) ||
      (wo.mechanicName && wo.mechanicName.toLowerCase().includes(term))
    );
  }, [workOrders, searchTerm]);

  // Todas as OS
  const allOrders = filteredWorkOrders;

  // Minhas OS (atribuídas ao mecânico logado, inclusive no status "A Fazer" para iniciar quando desejar)
  const myOrders = useMemo(() =>
    filteredWorkOrders.filter(wo => {
      if (wo.status === WorkOrderStatus.COMPLETED || wo.status === WorkOrderStatus.CANCELLED) return false;
      if (currentUserId && wo.mechanicId === currentUserId) return true;
      if (currentUserName && wo.mechanicName && wo.mechanicName.toLowerCase().includes(currentUserName)) return true;
      return false;
    }), [filteredWorkOrders, currentUserId, currentUserName]);

  // Aguardando Peças
  const waitingPartsOrders = useMemo(() =>
    filteredWorkOrders.filter(wo => wo.status === WorkOrderStatus.WAITING_PARTS), [filteredWorkOrders]);

  // Prestador Externo
  const externalOrders = useMemo(() =>
    filteredWorkOrders.filter(wo => wo.laborType === LaborType.EXTERNAL), [filteredWorkOrders]);

  // Finalizadas
  const completedOrders = useMemo(() =>
    filteredWorkOrders.filter(wo => wo.status === WorkOrderStatus.COMPLETED), [filteredWorkOrders]);

  // Ordens filtradas para a aba de Relatório
  const reportFilteredOrders = useMemo(() => {
    return workOrders.filter(wo => {
      // Filtro de Data Inicial
      if (reportStartDate) {
        const orderDate = wo.createdAt ? wo.createdAt.split('T')[0] : wo.requestDate;
        if (orderDate && orderDate < reportStartDate) return false;
      }
      // Filtro de Data Final
      if (reportEndDate) {
        const orderDate = wo.createdAt ? wo.createdAt.split('T')[0] : wo.requestDate;
        if (orderDate && orderDate > reportEndDate) return false;
      }
      // Filtro de Status
      if (reportStatus && reportStatus !== 'TODOS') {
        if (wo.status !== reportStatus) return false;
      }
      // Filtro de Veículo
      if (reportVehicleId && reportVehicleId !== 'ALL') {
        if (wo.vehicleId !== reportVehicleId) return false;
      }
      return true;
    });
  }, [workOrders, reportStartDate, reportEndDate, reportStatus, reportVehicleId]);

  // Colunas do Kanban
  const columns = useMemo<KanbanColumn[]>(() => {
    return [
      {
        id: 'todo',
        title: '📅 A Fazer',
        color: 'border-b-blue-500',
        tasks: mappedTasks.filter(t =>
          t.status === WorkOrderStatus.APPROVED ||
          t.status === WorkOrderStatus.DRAFT ||
          t.status === WorkOrderStatus.OPEN
        )
      },
      {
        id: 'doing',
        title: '🔨 Em Andamento',
        color: 'border-b-amber-500',
        tasks: mappedTasks.filter(t =>
          t.status === WorkOrderStatus.IN_PROGRESS && t.laborType !== LaborType.EXTERNAL
        )
      },
      {
        id: 'parts',
        title: '⏳ Aguardando Peças',
        color: 'border-b-purple-500',
        tasks: mappedTasks.filter(t => t.status === WorkOrderStatus.WAITING_PARTS)
      },
      {
        id: 'external',
        title: '🏢 Prestador Externo',
        color: 'border-b-cyan-500',
        tasks: mappedTasks.filter(t => t.laborType === LaborType.EXTERNAL)
      },
      {
        id: 'done',
        title: '✅ Finalizado',
        color: 'border-b-green-500',
        tasks: mappedTasks.filter(t => t.status === WorkOrderStatus.COMPLETED)
      }
    ];
  }, [mappedTasks]);

  const handleMoveTask = (taskId: string, newStatusStr: string) => {
    let newStatus: WorkOrderStatus;
    switch (newStatusStr) {
      case 'DOING':
        newStatus = WorkOrderStatus.IN_PROGRESS;
        break;
      case 'WAITING_PARTS':
        newStatus = WorkOrderStatus.WAITING_PARTS;
        break;
      case 'DONE':
        newStatus = WorkOrderStatus.COMPLETED;
        break;
      case 'TODO':
        newStatus = WorkOrderStatus.APPROVED;
        break;
      default:
        return;
    }
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleOpenTask = (taskOrId: any) => {
    const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    const found = workOrders.find(wo => wo.id === id);
    if (found) {
      setSelectedWorkOrder(found);
    }
  };

  // Ação de Assumir O.S. -> Atribui ao mecânico logado mantendo no status "A Fazer" e redireciona para "Minhas OS"
  const handleAssignToMe = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fleetWorkOrderService.assignMechanic(orderId);
      toast({
        title: "✅ O.S. Assumida (Status: A Fazer)!",
        description: "A O.S. foi movida para 'Minhas OS' no status 'A Fazer'. Inicie a execução ou edite os dados quando desejar.",
      });
      await refetch();
      setActiveTab('my');
    } catch (err: any) {
      toast({
        title: "Erro ao assumir O.S.",
        description: err?.message || "Falha na operação ao assumir ordem de serviço.",
        variant: "destructive"
      });
    }
  };

  // Ação de Iniciar Execução pelo mecânico quando desejar
  const handleStartExecution = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fleetWorkOrderService.updateStatus(orderId, WorkOrderStatus.IN_PROGRESS);
      toast({
        title: "🔧 Execução Iniciada!",
        description: "O status da O.S. foi alterado para 'Em Execução'.",
      });
      await refetch();
    } catch (err: any) {
      toast({
        title: "Erro ao iniciar execução",
        description: err?.message || "Não foi possível iniciar a execução da O.S.",
        variant: "destructive"
      });
    }
  };

  // Geração e Download das Fichas Completas em PDF
  const handleGeneratePdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const blob = await fleetWorkOrderService.downloadReportPdf({
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined,
        status: reportStatus !== 'TODOS' ? reportStatus : undefined,
        vehicleId: reportVehicleId !== 'ALL' ? reportVehicleId : undefined
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fichas-completas-os-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "📄 Fichas Completas Geradas!",
        description: "O PDF com as fichas completas das O.S. filtradas foi baixado.",
      });
    } catch (err: any) {
      toast({
        title: "Erro ao gerar PDF",
        description: err?.message || "Não foi possível gerar o PDF das fichas completas.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Renderização da lista de ordens por cards responsivos (Mobile-First / Tablet)
  const renderOrdersList = (orders: FleetWorkOrder[], emptyMsg: string) => {
    if (orders.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-500 px-4">
          <Wrench className="w-12 h-12 text-slate-700 mb-3" />
          <h3 className="text-base font-bold text-slate-400">Nenhuma Ordem de Serviço encontrada</h3>
          <p className="text-xs text-slate-600 mt-1 max-w-sm">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 overflow-y-auto">
        {orders.map((wo) => {
          const isAssignedToMe = Boolean(
            (currentUserId && wo.mechanicId === currentUserId) ||
            (currentUserName && wo.mechanicName && wo.mechanicName.toLowerCase().includes(currentUserName))
          );
          const photoCount = wo.photoAttachments ? wo.photoAttachments.length : 0;
          const isExternal = wo.laborType === LaborType.EXTERNAL;
          const isTodoStatus =
            wo.status === WorkOrderStatus.OPEN ||
            wo.status === WorkOrderStatus.APPROVED ||
            wo.status === WorkOrderStatus.DRAFT;

          return (
            <Card
              key={wo.id}
              onClick={() => setSelectedWorkOrder(wo)}
              className="bg-slate-900 border-slate-800 hover:border-slate-600 hover:scale-[1.01] transition-all cursor-pointer shadow-md flex flex-col justify-between rounded-xl overflow-hidden"
            >
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex justify-between items-start gap-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[11px] font-mono border-slate-700 text-slate-200 bg-slate-950/60">
                      #{wo.osNumber || wo.id.slice(0, 8).toUpperCase()}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-semibold ${
                        wo.status === WorkOrderStatus.COMPLETED
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : wo.status === WorkOrderStatus.IN_PROGRESS
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : wo.status === WorkOrderStatus.WAITING_PARTS
                          ? 'bg-orange-950 text-orange-300 border-orange-700'
                          : 'bg-sky-950 text-sky-300 border-sky-700'
                      }`}
                    >
                      {wo.status === WorkOrderStatus.COMPLETED
                        ? 'Finalizada'
                        : wo.status === WorkOrderStatus.IN_PROGRESS
                        ? 'Em Execução'
                        : wo.status === WorkOrderStatus.WAITING_PARTS
                        ? 'Aguardando Peças'
                        : 'A Fazer'}
                    </Badge>
                    {wo.maintenanceType === 'PREVENTIVA' && (
                      <Badge className="bg-teal-950/80 text-teal-300 border-teal-700 text-[10px]">
                        Preventiva
                      </Badge>
                    )}
                    {isExternal && (
                      <Badge className="bg-cyan-950/70 text-cyan-300 border-cyan-800 text-[10px]">
                        <Building className="w-2.5 h-2.5 mr-1" /> Externo
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant={wo.priority === 'HIGH' ? 'destructive' : 'secondary'}
                    className={`text-[10px] uppercase font-bold ${
                      wo.priority === 'HIGH' ? 'bg-red-950 text-red-400 border-red-800' :
                      wo.priority === 'MEDIUM' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                      'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {wo.priority === 'HIGH' ? 'ALTA' : wo.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                  </Badge>
                </div>

                <CardTitle className="text-sm sm:text-base font-bold text-white mt-2 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="font-mono tracking-wide">{wo.vehiclePlate || 'Sem Placa'}</span>
                  {wo.vehicleModel && (
                    <span className="text-xs font-normal text-slate-400 truncate">
                      • {wo.vehicleModel}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-3 sm:p-4 pt-1 space-y-2.5">
                <p className="text-xs text-slate-300 line-clamp-2 min-h-[32px]">
                  {wo.stopReason || wo.notes || 'Sem observações cadastradas.'}
                </p>

                <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {isAssignedToMe ? (
                      <span className="text-emerald-400 font-semibold truncate text-[11px]">
                        Você (Responsável)
                      </span>
                    ) : wo.mechanicName ? (
                      <span className="truncate max-w-[130px] text-[11px] text-slate-200">
                        {wo.mechanicName}
                      </span>
                    ) : (
                      <em className="text-slate-500 text-[11px]">Não atribuído</em>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {photoCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-sky-400 font-mono mr-1" title={`${photoCount} evidências fotográficas`}>
                        <Camera className="h-3 w-3" /> {photoCount}
                      </span>
                    )}

                    {!isAssignedToMe && wo.status !== WorkOrderStatus.COMPLETED && wo.status !== WorkOrderStatus.CANCELLED && (
                      <Button
                        size="sm"
                        onClick={(e) => handleAssignToMe(wo.id, e)}
                        className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition-all rounded-lg active:scale-95"
                      >
                        <Wrench className="w-3.5 h-3.5 mr-1" />
                        Assumir O.S.
                      </Button>
                    )}

                    {isAssignedToMe && isTodoStatus && (
                      <Button
                        size="sm"
                        onClick={(e) => handleStartExecution(wo.id, e)}
                        className="h-8 px-2.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow-sm transition-all rounded-lg active:scale-95"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Iniciar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkOrder(wo);
                      }}
                      className="h-8 px-2.5 text-xs border-slate-700 bg-slate-950 text-slate-200 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <FileText className="w-3 h-3 mr-1 text-red-400" />
                      Editar O.S.
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <StandardLayout title="Área do Mecânico">
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
        {/* Topbar com Título, Busca Rápida e Sincronização */}
        <div className="border-b border-slate-800 bg-slate-900/90 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap justify-between items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
                Mechanic<span className="text-red-500">OS</span>
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                Painel de Operações, Diagnóstico & Evidências da Oficina
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative w-full max-w-[200px] sm:max-w-[260px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <Input
                placeholder="Buscar placa, O.S...."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-500 w-full rounded-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-slate-700 text-slate-300 hover:text-white h-8 text-xs bg-slate-900 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar</span>
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Horizontal por Abas (Mobile-Friendly com Scroll Touch) */}
        <div className="border-b border-slate-800 bg-slate-950 px-3 py-1.5 overflow-x-auto shrink-0 flex items-center gap-1.5 scrollbar-thin scroll-smooth no-scrollbar">
          <Button
            size="sm"
            variant={activeTab === 'all' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('all')}
            className={activeTab === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
            Todas as OS ({allOrders.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'my' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('my')}
            className={activeTab === 'my' ? 'bg-amber-600 hover:bg-amber-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <Wrench className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Minhas OS ({myOrders.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'parts' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('parts')}
            className={activeTab === 'parts' ? 'bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <Clock className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
            Aguardando Peças ({waitingPartsOrders.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'external' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('external')}
            className={activeTab === 'external' ? 'bg-cyan-600 hover:bg-cyan-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <Building className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Prestador Externo ({externalOrders.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'done' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('done')}
            className={activeTab === 'done' ? 'bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            Finalizadas ({completedOrders.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'kanban' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('kanban')}
            className={activeTab === 'kanban' ? 'bg-red-600 hover:bg-red-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Kanban Completo
          </Button>

          <Button
            size="sm"
            variant={activeTab === 'report' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('report')}
            className={activeTab === 'report' ? 'bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs font-semibold rounded-lg shrink-0' : 'text-slate-400 hover:text-slate-200 h-8 text-xs rounded-lg shrink-0'}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
            Relatório de OS
          </Button>
        </div>

        {/* Área Principal de Conteúdo */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="flex-1 h-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-red-500" />
            </div>
          ) : activeTab === 'all' ? (
            renderOrdersList(allOrders, "Nenhuma Ordem de Serviço encontrada para os filtros selecionados.")
          ) : activeTab === 'my' ? (
            renderOrdersList(myOrders, "Você não possui nenhuma Ordem de Serviço em execução atribuída a você no momento. Clique na aba 'Todas as OS' para assumir uma O.S.")
          ) : activeTab === 'parts' ? (
            renderOrdersList(waitingPartsOrders, "Nenhuma Ordem de Serviço aguardando peças de estoque ou compras.")
          ) : activeTab === 'external' ? (
            renderOrdersList(externalOrders, "Nenhuma Ordem de Serviço direcionada para execução por terceiros ou prestadores externos.")
          ) : activeTab === 'done' ? (
            renderOrdersList(completedOrders, "Nenhuma Ordem de Serviço finalizada recentemente.")
          ) : activeTab === 'kanban' ? (
            isMobileView ? (
              <MechanicMobileFeed
                tasks={mappedTasks}
                onTaskClick={handleOpenTask}
              />
            ) : (
              <MechanicKanban
                columns={columns}
                onMoveTask={handleMoveTask}
                onTaskClick={handleOpenTask}
              />
            )
          ) : (
            /* ABA DE RELATÓRIO DE OS COM FILTROS (DATA, STATUS, VEÍCULO) */
            <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
              {/* Painel de Filtros do Relatório */}
              <Card className="bg-slate-900 border-slate-800 shadow-lg">
                <CardHeader className="p-4 pb-2 border-b border-slate-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-400" />
                      <div>
                        <CardTitle className="text-base sm:text-lg text-white font-bold">
                          Impressão de Fichas Completas de O.S. (PDF)
                        </CardTitle>
                        <p className="text-xs text-slate-400">
                          Filtre por período, status e veículo para imprimir as fichas completas das Ordens de Serviço
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleGeneratePdf}
                      disabled={isGeneratingPdf || reportFilteredOrders.length === 0}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs h-9 font-semibold shadow-md rounded-lg"
                    >
                      {isGeneratingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Gerando Fichas PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-1.5" />
                          Imprimir Fichas Completas ({reportFilteredOrders.length})
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Data Inicial */}
                    <div>
                      <Label className="text-xs text-slate-300 font-medium">Data Inicial</Label>
                      <Input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => setReportStartDate(e.target.value)}
                        className="h-9 text-xs bg-slate-950 border-slate-700 text-white mt-1 rounded-lg"
                      />
                    </div>

                    {/* Data Final */}
                    <div>
                      <Label className="text-xs text-slate-300 font-medium">Data Final</Label>
                      <Input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        className="h-9 text-xs bg-slate-950 border-slate-700 text-white mt-1 rounded-lg"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <Label className="text-xs text-slate-300 font-medium">Status da O.S.</Label>
                      <Select value={reportStatus} onValueChange={setReportStatus}>
                        <SelectTrigger className="h-9 text-xs bg-slate-950 border-slate-700 text-white mt-1 rounded-lg">
                          <SelectValue placeholder="Selecione o Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="TODOS">Todos os Status</SelectItem>
                          <SelectItem value="OPEN">Aberta</SelectItem>
                          <SelectItem value="DRAFT">Rascunho</SelectItem>
                          <SelectItem value="APPROVED">Aprovada</SelectItem>
                          <SelectItem value="IN_PROGRESS">Em Execução</SelectItem>
                          <SelectItem value="WAITING_PARTS">Aguardando Peças</SelectItem>
                          <SelectItem value="COMPLETED">Finalizada</SelectItem>
                          <SelectItem value="CANCELLED">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Veículo */}
                    <div>
                      <Label className="text-xs text-slate-300 font-medium">Veículo / Frota</Label>
                      <Select value={reportVehicleId} onValueChange={setReportVehicleId}>
                        <SelectTrigger className="h-9 text-xs bg-slate-950 border-slate-700 text-white mt-1 rounded-lg">
                          <SelectValue placeholder="Todos os Veículos" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white max-h-56">
                          <SelectItem value="ALL">Todos os Veículos</SelectItem>
                          {vehicles.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.plate} {v.fleetNumber ? `(${v.fleetNumber})` : ''} {v.model ? `- ${v.model}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Limpar Filtros */}
                  {(reportStartDate || reportEndDate || reportStatus !== 'TODOS' || reportVehicleId !== 'ALL') && (
                    <div className="flex justify-end mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReportStartDate('');
                          setReportEndDate('');
                          setReportStatus('TODOS');
                          setReportVehicleId('ALL');
                        }}
                        className="text-xs text-slate-400 hover:text-white h-7"
                      >
                        <X className="w-3 h-3 mr-1" /> Limpar Filtros
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KPIs de Resumo Executivo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="bg-slate-900/90 border-slate-800 p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Total Filtradas</span>
                  <div className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">
                    {reportFilteredOrders.length}
                  </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Concluídas</span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
                    {reportFilteredOrders.filter(o => o.status === WorkOrderStatus.COMPLETED).length}
                  </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Em Andamento</span>
                  <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">
                    {reportFilteredOrders.filter(o => o.status === WorkOrderStatus.IN_PROGRESS).length}
                  </div>
                </Card>

                <Card className="bg-slate-900/90 border-slate-800 p-3">
                  <span className="text-[11px] text-slate-400 font-medium">Aguardando Peças</span>
                  <div className="text-xl sm:text-2xl font-bold text-purple-400 mt-1">
                    {reportFilteredOrders.filter(o => o.status === WorkOrderStatus.WAITING_PARTS).length}
                  </div>
                </Card>
              </div>

              {/* Pré-visualização da Tabela do Relatório */}
              <Card className="bg-slate-900 border-slate-800 shadow-md">
                <CardHeader className="p-4 pb-2 border-b border-slate-800">
                  <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                    <span>Prévia dos Dados ({reportFilteredOrders.length} registros)</span>
                    <span className="text-xs text-slate-400 font-normal">
                      Serão exportados no PDF oficial da empresa
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  {reportFilteredOrders.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">
                      <FileText className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                      <p className="text-xs text-slate-400">Nenhuma Ordem de Serviço encontrada para os filtros aplicados.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">O.S. / Data</th>
                          <th className="py-3 px-4">Veículo</th>
                          <th className="py-3 px-4">Mão de Obra</th>
                          <th className="py-3 px-4">Mecânico</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Prioridade</th>
                          <th className="py-3 px-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {reportFilteredOrders.map((wo) => (
                          <tr key={wo.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-4">
                              <span className="font-mono font-bold text-white block">
                                #{wo.osNumber || wo.id.slice(0, 8).toUpperCase()}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString('pt-BR') : '-'}
                              </span>
                            </td>

                            <td className="py-2.5 px-4 font-semibold text-white font-mono">
                              {wo.vehiclePlate || 'Sem Placa'}
                              {wo.vehicleModel && (
                                <span className="text-[11px] font-normal text-slate-400 block font-sans">
                                  {wo.vehicleModel}
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-4">
                              <Badge className={wo.laborType === LaborType.EXTERNAL ? "bg-cyan-950 text-cyan-300 border-cyan-800 text-[10px]" : "bg-slate-800 text-slate-300 text-[10px]"}>
                                {wo.laborType === LaborType.EXTERNAL ? 'Externa' : 'Interna'}
                              </Badge>
                            </td>

                            <td className="py-2.5 px-4 text-slate-300">
                              {wo.mechanicName || <em className="text-slate-500">Não atribuído</em>}
                            </td>

                            <td className="py-2.5 px-4">
                              <Badge className={`text-[10px] ${
                                wo.status === WorkOrderStatus.COMPLETED ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                                wo.status === WorkOrderStatus.IN_PROGRESS ? 'bg-amber-950 text-amber-400 border-amber-800' :
                                wo.status === WorkOrderStatus.WAITING_PARTS ? 'bg-purple-950 text-purple-400 border-purple-800' :
                                'bg-slate-800 text-slate-300'
                              }`}>
                                {wo.status === WorkOrderStatus.COMPLETED ? 'Finalizada' :
                                 wo.status === WorkOrderStatus.IN_PROGRESS ? 'Em Execução' :
                                 wo.status === WorkOrderStatus.WAITING_PARTS ? 'Aguardando Peças' :
                                 wo.status === WorkOrderStatus.APPROVED ? 'Aprovada' :
                                 wo.status === WorkOrderStatus.CANCELLED ? 'Cancelada' : 'Aberta'}
                              </Badge>
                            </td>

                            <td className="py-2.5 px-4 text-slate-300">
                              {wo.priority || 'MÉDIA'}
                            </td>

                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => generateFleetWorkOrderPDFDownload(wo)}
                                  className="h-7 text-xs border-slate-700 bg-slate-950 text-slate-200 hover:text-white hover:bg-slate-800"
                                  title="Imprimir ficha completa desta O.S."
                                >
                                  <Download className="w-3.5 h-3.5 mr-1 text-red-400" />
                                  Ficha PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedWorkOrder(wo)}
                                  className="h-7 text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-950/40"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Editar
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Abre sempre o formulário completo da O.S. (Corretiva ou Preventiva) para o mecânico editar todos os dados de execução, checklist, peças e laudos */}
        {selectedWorkOrder && (
          <FleetWorkOrderForm
            isOpen={!!selectedWorkOrder}
            onClose={() => setSelectedWorkOrder(null)}
            order={selectedWorkOrder}
            onSuccess={() => {
              setSelectedWorkOrder(null);
              refetch();
            }}
          />
        )}
      </div>
    </StandardLayout>
  );
}
