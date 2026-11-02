import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye, Download, Trash2Icon, Edit3, AlertTriangle, Clock, CheckCircle2, CalendarClock, Loader2, QrCode, Wrench, FileText, MoreHorizontal, Car, Bus, Truck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import VeiculoDeleteDialog from './VeiculoDeleteDialog';
import VehicleDetailPanel from './VehicleDetailPanel';
import VehicleQRCodeModal from './VehicleQRCodeModal';
import { FleetWorkOrderViewModal } from './FleetWorkOrderViewModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import fleetWorkOrderService, { FleetWorkOrder, WorkOrderStatus } from '@/services/fleetWorkOrderService';
import api from '@/lib/axios';
import * as XLSX from 'xlsx';
import vehicleMaintenanceStatusService, { VehicleMaintenanceAlert, MaintenanceAlertLevel } from '@/services/vehicleMaintenanceStatusService';

interface Veiculo {
  id: string; // UUID
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  combustivel: string;
  quilometragem?: number;
  quilometragemInicial?: number; // This field was later removed from display
  status: string;
  vehicleType?: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  photos?: string; // URLs das fotos separadas por vírgula
  capacidade?: number; // Adicionado para armazenar capacidade
  observacoes?: string; // Adicionado para armazenar observações
}

interface VehicleMaintenance {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  date: string;
  maintenanceType: string;
  description: string;
  cost?: number;
  provider?: string;
  mileage?: number;
  status: string;
  priority: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface VeiculosTableProps {
  veiculos: Veiculo[];
  searchTerm: string;
  vehicleTypeFilter?: string;
  maintenanceAlertFilter?: string;
  maintenances?: VehicleMaintenance[];
  onRefresh: () => void;
  onEdit: (veiculo: Veiculo) => void;
  onDelete: (veiculo: Veiculo) => void;
  onView: (veiculo: Veiculo) => void;
  onViewMaintenance?: (maintenance: VehicleMaintenance) => void;
}

// Badge de alerta de manutenção por nível (próxima manutenção)
const ALERT_BADGE: Record<MaintenanceAlertLevel, { label: string; icon: React.ElementType; className: string }> = {
  OVERDUE: { label: 'Manutenção Vencida', icon: AlertTriangle, className: 'bg-red-900/40 text-red-300 border border-red-700/50' },
  UPCOMING: { label: 'Manutenção Próxima', icon: Clock, className: 'bg-yellow-900/40 text-yellow-300 border border-yellow-700/50' },
  OK: { label: 'Manutenção em Dia', icon: CheckCircle2, className: 'bg-green-900/30 text-green-400 border border-green-700/40' },
  NO_SCHEDULE: { label: 'Sem Plano de Manutenção', icon: CalendarClock, className: 'bg-gray-800 text-gray-400 border border-gray-600' },
};

const VeiculosTable: React.FC<VeiculosTableProps> = ({ veiculos, searchTerm, vehicleTypeFilter, maintenanceAlertFilter, maintenances, onRefresh, onEdit, onDelete, onView, onViewMaintenance }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<Veiculo | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Alertas de próxima manutenção por veículo (1 requisição para a lista toda)
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<Record<string, VehicleMaintenanceAlert>>({});

  useEffect(() => {
    let cancelled = false;
    vehicleMaintenanceStatusService.getAllAlerts()
      .then(alerts => {
        if (cancelled) return;
        const map: Record<string, VehicleMaintenanceAlert> = {};
        for (const a of alerts) map[a.vehicleId] = a;
        setMaintenanceAlerts(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const getMaintenanceAlert = (vehicleId: string): VehicleMaintenanceAlert | null =>
    maintenanceAlerts[vehicleId] || null;

  // Estados para seleção em lote
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Estado para visualização de OS
  const [selectedWorkOrderForView, setSelectedWorkOrderForView] = useState<FleetWorkOrder | null>(null);

  // Buscar Ordens de Serviço (OS) ativas da frota
  const { data: workOrders = [] } = useQuery({
    queryKey: ['fleet-work-orders'],
    queryFn: () => fleetWorkOrderService.findAll(),
    retry: 2,
    refetchOnWindowFocus: true,
  });

  // Função para obter a OS ativa do veículo
  const getVehicleWorkOrder = (vehicleId: string, vehiclePlate?: string): FleetWorkOrder | null => {
    if (!workOrders || workOrders.length === 0) return null;
    const cleanPlate = vehiclePlate ? vehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    return workOrders.find(wo => {
      const isActive = wo.status !== WorkOrderStatus.COMPLETED && wo.status !== WorkOrderStatus.CANCELLED;
      if (!isActive) return false;

      const matchId = Boolean(wo.vehicleId && String(wo.vehicleId) === String(vehicleId));
      const woPlate = wo.vehiclePlate ? wo.vehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
      const matchPlate = Boolean(cleanPlate && woPlate && cleanPlate === woPlate);

      return matchId || matchPlate;
    }) || null;
  };

  // Função para obter manutenção legada
  const getVehicleLegacyMaintenance = (vehicleId: string, vehiclePlate?: string): VehicleMaintenance | null => {
    if (!maintenances || maintenances.length === 0) return null;
    const cleanPlate = vehiclePlate ? vehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';

    return maintenances.find(m => {
      if (m.status !== 'IN_PROGRESS') return false;
      const matchId = Boolean(m.vehicleId && String(m.vehicleId) === String(vehicleId));
      const mPlate = m.vehiclePlate ? m.vehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
      const matchPlate = Boolean(cleanPlate && mPlate && cleanPlate === mPlate);

      return matchId || matchPlate;
    }) || null;
  };

  // Função para verificar se um veículo está em manutenção (OS ativa, manutenção legada ou status manutencao)
  const isVehicleInMaintenance = (vehicleId: string, vehiclePlate?: string, vehicleStatus?: string): boolean => {
    if (vehicleStatus) {
      const statusLower = vehicleStatus.toLowerCase();
      if (statusLower === 'manutencao' || statusLower === 'maintenance') return true;
    }
    if (getVehicleWorkOrder(vehicleId, vehiclePlate)) return true;
    if (getVehicleLegacyMaintenance(vehicleId, vehiclePlate)) return true;
    return false;
  };
  const [selectAll, setSelectAll] = useState(false);

  // Estados para visualização
  const [viewingVeiculo, setViewingVeiculo] = useState<Veiculo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [qrModalVehicle, setQrModalVehicle] = useState<Veiculo | null>(null);

  const { toast } = useToast();

  const filteredVeiculos = veiculos.filter(veiculo => {
    const matchesSearch = veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !vehicleTypeFilter || vehicleTypeFilter === 'ALL' || veiculo.vehicleType === vehicleTypeFilter;
    const matchesAlert = !maintenanceAlertFilter || maintenanceAlertFilter === 'ALL'
      || getMaintenanceAlert(veiculo.id)?.alertLevel === maintenanceAlertFilter;
    return matchesSearch && matchesType && matchesAlert;
  });

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredVeiculos.map(item => item.id));
      setSelectedItems(allIds);
      setSelectAll(true);
    } else {
      setSelectedItems(new Set());
      setSelectAll(false);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
    setSelectAll(newSelected.size === filteredVeiculos.length);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum item selecionado para exclusão",
        variant: "destructive"
      });
      return;
    }

    // Abre o diálogo de confirmação estilizado
    setIsBulkDeleteDialogOpen(true);
  };

  const executeBulkDelete = async () => {
    try {
      const selectedIds = Array.from(selectedItems);
      console.log('🗑️ Excluindo veículos:', selectedIds);

      setIsBulkDeleting(true);
      const result = await fleetService.bulkDeleteVehicles(selectedIds);

      if (result.deleted === result.requested) {
        toast({
          title: "Sucesso",
          description: `${result.deleted} veículo(s) excluído(s) com sucesso.`,
          variant: "default"
        });
      } else {
        // Alguns não foram encontrados ou já estavam excluídos
        toast({
          title: "Concluído com ressalvas",
          description: `${result.deleted} de ${result.requested} veículo(s) excluído(s). Os demais não foram encontrados ou já estavam excluídos.`,
          variant: "default"
        });
      }

      // Limpar seleção e atualizar lista
      setSelectedItems(new Set());
      setSelectAll(false);
      onRefresh();

    } catch (error: any) {
      console.error('❌ Erro ao excluir em lote:', error);

      let errorMessage = 'Erro ao excluir veículos';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsBulkDeleting(false);
      setIsBulkDeleteDialogOpen(false);
    }
  };

  const handleBulkEdit = () => {
    // Implementar edição em lote
    console.log('Editando itens selecionados:', Array.from(selectedItems));
    toast({
      title: "Funcionalidade",
      description: "Edição em lote será implementada em breve",
      variant: "default"
    });
  };

  const handleExport = () => {
    try {
      // Determinar quais veículos exportar (selecionados ou todos)
      const veiculosParaExportar = selectedItems.size > 0
        ? veiculos.filter(v => selectedItems.has(v.id))
        : filteredVeiculos;

      if (veiculosParaExportar.length === 0) {
        toast({
          title: "Nenhum veículo para exportar",
          description: selectedItems.size > 0
            ? "Selecione pelo menos um veículo para exportar"
            : "Não há veículos para exportar",
          variant: "default"
        });
        return;
      }

      // Preparar dados para exportação
      const dadosExportacao = veiculosParaExportar.map(veiculo => ({
        'Placa': veiculo.placa,
        'Marca': veiculo.marca,
        'Modelo': veiculo.modelo,
        'Ano': veiculo.ano,
        'Cor': veiculo.cor || 'N/A',
        'Combustível': veiculo.combustivel,
        'Quilometragem': veiculo.quilometragem ? `${veiculo.quilometragem.toLocaleString('pt-BR')} km` : 'N/A',
        'Status': veiculo.status,
        'Capacidade': veiculo.capacidade || 'N/A',
        'Data de Aquisição': veiculo.data_aquisicao ? new Date(veiculo.data_aquisicao).toLocaleDateString('pt-BR') : 'N/A',
        'Valor de Aquisição': veiculo.valor_aquisicao ? `R$ ${veiculo.valor_aquisicao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A',
        'Observações': veiculo.observacoes || ''
      }));

      // Criar workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);

      // Configurar larguras das colunas
      const colWidths = [
        { wch: 12 }, // Placa
        { wch: 15 }, // Marca
        { wch: 20 }, // Modelo
        { wch: 8 },  // Ano
        { wch: 12 }, // Cor
        { wch: 12 }, // Combustível
        { wch: 15 }, // Quilometragem
        { wch: 12 }, // Status
        { wch: 10 }, // Capacidade
        { wch: 18 }, // Data de Aquisição
        { wch: 18 }, // Valor de Aquisição
        { wch: 30 }  // Observações
      ];
      ws['!cols'] = colWidths;

      // Adicionar worksheet ao workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Veículos');

      // Gerar nome do arquivo
      const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `veiculos_${timestamp}.xlsx`;

      // Salvar arquivo
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportação realizada com sucesso!",
        description: `${veiculosParaExportar.length} veículo(s) exportado(s) para ${filename}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erro ao exportar veículos:', error);
      toast({
        title: "Erro ao exportar",
        description: "Ocorreu um erro ao exportar os veículos. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateReport = () => {
    // Implementar geração de relatório
    console.log('Gerando relatório para itens selecionados:', Array.from(selectedItems));
    toast({
      title: "Funcionalidade",
      description: "Relatório será implementado em breve",
      variant: "default"
    });
  };

  const handleDelete = (veiculo: Veiculo) => {
    setSelectedVeiculo(veiculo);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (veiculo: Veiculo) => {
    onEdit(veiculo);
  };

  const handleView = (veiculo: Veiculo) => {
    setViewingVeiculo(veiculo);
    setIsViewModalOpen(true);
  };

  const handleViewClose = () => {
    setIsViewModalOpen(false);
    setViewingVeiculo(null);
  };

  const handleDeleteSuccess = () => {
    onRefresh();
    setIsDeleteDialogOpen(false);
    setSelectedVeiculo(null);
  };

  // Helper para calcular e formatar o tempo de parada para manutenção
  const getVehicleDowntimeInfo = (
    workOrder?: FleetWorkOrder | null,
    legacyMaintenance?: VehicleMaintenance | null
  ) => {
    let startDate: Date | null = null;
    let hasSpecificTime = false;

    if (workOrder) {
      const rawDate = workOrder.stopDate || workOrder.startDate || workOrder.plannedDate || workOrder.createdAt;
      if (rawDate) {
        const datePart = rawDate.split('T')[0];
        const parts = datePart.split('-').map(Number);
        if (parts.length === 3) {
          let h = 0, m = 0, s = 0;
          if (workOrder.stopTime && workOrder.stopTime.trim()) {
            const timeParts = workOrder.stopTime.trim().split(':').map(Number);
            if (!isNaN(timeParts[0])) h = timeParts[0];
            if (!isNaN(timeParts[1])) m = timeParts[1];
            if (!isNaN(timeParts[2])) s = timeParts[2];
            hasSpecificTime = true;
          } else if (rawDate.includes('T')) {
            const temp = new Date(rawDate);
            if (!isNaN(temp.getTime())) {
              h = temp.getHours();
              m = temp.getMinutes();
              s = temp.getSeconds();
              hasSpecificTime = true;
            }
          }
          startDate = new Date(parts[0], parts[1] - 1, parts[2], h, m, s);
        }
      }
    }

    if (!startDate && legacyMaintenance) {
      const rawDate = legacyMaintenance.date || legacyMaintenance.createdAt;
      if (rawDate) {
        const dt = new Date(rawDate);
        if (!isNaN(dt.getTime())) {
          startDate = dt;
          hasSpecificTime = rawDate.includes('T') || rawDate.includes(':');
        }
      }
    }

    if (!startDate || isNaN(startDate.getTime())) {
      return null;
    }

    let endDate: Date | null = null;
    let isCompleted = false;

    if (workOrder) {
      if (workOrder.status === WorkOrderStatus.COMPLETED || workOrder.status === WorkOrderStatus.CANCELLED) {
        isCompleted = true;
      }
      if (workOrder.exitDate) {
        const exitPart = workOrder.exitDate.split('T')[0];
        const parts = exitPart.split('-').map(Number);
        if (parts.length === 3) {
          let h = 23, m = 59, s = 59;
          if (workOrder.exitTime && workOrder.exitTime.trim()) {
            const timeParts = workOrder.exitTime.trim().split(':').map(Number);
            if (!isNaN(timeParts[0])) h = timeParts[0];
            if (!isNaN(timeParts[1])) m = timeParts[1];
            if (!isNaN(timeParts[2])) s = timeParts[2];
          }
          endDate = new Date(parts[0], parts[1] - 1, parts[2], h, m, s);
        }
      } else if (workOrder.completionDate) {
        const dt = new Date(workOrder.completionDate);
        if (!isNaN(dt.getTime())) endDate = dt;
      }
    }

    const effectiveEnd = endDate || new Date();
    const diffMs = effectiveEnd.getTime() - startDate.getTime();

    if (diffMs < 0) {
      return null;
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    const remainingMinutes = totalMinutes % 60;

    let durationFormatted = '';
    if (days > 0) {
      durationFormatted = `${days}d ${remainingHours}h`;
    } else if (totalHours > 0) {
      durationFormatted = `${totalHours}h ${remainingMinutes}m`;
    } else {
      durationFormatted = `${Math.max(1, remainingMinutes)}m`;
    }

    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    if (totalHours >= 24) {
      severity = 'critical';
    } else if (totalHours >= 4) {
      severity = 'warning';
    }

    const startFormatted = hasSpecificTime
      ? `${startDate.toLocaleDateString('pt-BR')} às ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
      : startDate.toLocaleDateString('pt-BR');

    const label = endDate || isCompleted ? 'Ficou parado' : 'Parado há';

    const fullDetails = endDate
      ? `Veículo parado de ${startFormatted} até ${endDate.toLocaleDateString('pt-BR')} (Total: ${days > 0 ? `${days}d ` : ''}${remainingHours}h ${remainingMinutes}m)`
      : `Veículo parado desde ${startFormatted} • Tempo decorrido: ${days > 0 ? `${days}d ` : ''}${remainingHours}h ${remainingMinutes}m`;

    return {
      label,
      durationFormatted,
      startFormatted,
      severity,
      fullDetails,
    };
  };

  const getStatusBadge = (veiculo: Veiculo) => {
    const statusLower = (veiculo.status || '').toLowerCase();
    const workOrder = getVehicleWorkOrder(veiculo.id, veiculo.placa);
    const legacyMaintenance = getVehicleLegacyMaintenance(veiculo.id, veiculo.placa);
    const inMaintenance = isVehicleInMaintenance(veiculo.id, veiculo.placa, veiculo.status);

    if (inMaintenance) {
      const osNumber = workOrder?.osNumber || (workOrder?.id ? `OS-${workOrder.id.slice(0, 8)}` : null);
      const osType = workOrder?.maintenanceType || legacyMaintenance?.maintenanceType || '';
      const osDesc = workOrder?.anomaliesDescription || workOrder?.stopReason || workOrder?.otherDescription || workOrder?.notes || legacyMaintenance?.description || '';
      const downtime = getVehicleDowntimeInfo(workOrder, legacyMaintenance);

      const typeLabel = osType ? (
        osType === 'CORRETIVA' ? 'Corretiva' :
        osType === 'PREVENTIVA' ? 'Preventiva' :
        osType === 'PREDITIVA' ? 'Preditiva' :
        osType === 'INSPECAO' ? 'Inspeção' :
        osType === 'LUBRIFICACAO' ? 'Lubrificação' :
        osType === 'LIMPEZA' ? 'Limpeza' : osType
      ) : '';

      return (
        <div className="flex flex-col items-center gap-1 py-1">
          <Badge variant="destructive" className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-2.5 py-0.5 shadow-sm flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            Em Manutenção
          </Badge>

          {workOrder && (
            <div className="flex flex-col items-center text-xs">
              <button
                type="button"
                onClick={() => setSelectedWorkOrderForView(workOrder)}
                className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 font-mono font-semibold bg-amber-950/80 border border-amber-600/60 rounded px-2 py-0.5 hover:bg-amber-900 transition-colors shadow-sm"
                title="Clique para abrir e visualizar a Ordem de Serviço"
              >
                <FileText className="w-3 h-3 text-amber-400" />
                <span>{osNumber}</span>
                {typeLabel && <span className="opacity-80">• {typeLabel}</span>}
              </button>
              {osDesc && (
                <span className="text-[11px] text-gray-300 max-w-[190px] truncate mt-0.5 text-center" title={osDesc}>
                  {osDesc}
                </span>
              )}
            </div>
          )}

          {downtime && (
            <div
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border shadow-xs transition-colors ${
                downtime.severity === 'critical'
                  ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                  : downtime.severity === 'warning'
                  ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                  : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
              }`}
              title={downtime.fullDetails}
            >
              <Clock
                className={`w-3 h-3 ${
                  downtime.severity === 'critical'
                    ? 'text-rose-400 animate-pulse'
                    : downtime.severity === 'warning'
                    ? 'text-amber-400'
                    : 'text-amber-400/90'
                }`}
              />
              <span className="opacity-80">{downtime.label}:</span>
              <span className="font-bold font-mono tracking-tight">{downtime.durationFormatted}</span>
            </div>
          )}

          {!workOrder && legacyMaintenance && (
            <button
              type="button"
              onClick={() => onViewMaintenance?.(legacyMaintenance)}
              className="text-xs text-amber-400 hover:text-amber-300 underline mt-0.5"
            >
              Ver Manutenção
            </button>
          )}
        </div>
      );
    }

    if (statusLower === 'ativo' || statusLower === 'active') {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          Ativo
        </Badge>
      );
    } else if (statusLower === 'inativo' || statusLower === 'inactive') {
      return (
        <Badge variant="destructive">
          Inativo
        </Badge>
      );
    } else if (statusLower === 'manutencao' || statusLower === 'maintenance') {
      return (
        <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700 text-white">
          Manutenção
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary">
          {veiculo.status.charAt(0).toUpperCase() + veiculo.status.slice(1)}
        </Badge>
      );
    }
  };

  return (
    <>
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-700/80 rounded-xl p-3 sm:p-4 mb-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-base sm:text-xl font-bold text-seguranca-lightgray mb-2.5">
              Veículos da Frota
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-seguranca-graphite/60 border border-gray-700/60 rounded-lg p-2 flex flex-col">
                <span className="text-[11px] text-gray-400">Total</span>
                <span className="text-white font-extrabold text-base sm:text-lg">{filteredVeiculos.length}</span>
              </div>
              <div className="bg-green-950/20 border border-green-800/40 rounded-lg p-2 flex flex-col">
                <span className="text-[11px] text-green-400/80">Ativos</span>
                <span className="text-green-400 font-extrabold text-base sm:text-lg">
                  {filteredVeiculos.filter(v => !isVehicleInMaintenance(v.id, v.placa, v.status) && (v.status.toLowerCase() === 'ativo' || v.status.toLowerCase() === 'active')).length}
                </span>
              </div>
              <div className="bg-amber-950/20 border border-amber-800/40 rounded-lg p-2 flex flex-col">
                <span className="text-[11px] text-amber-400/80">Em Manutenção</span>
                <span className="text-amber-400 font-extrabold text-base sm:text-lg">
                  {filteredVeiculos.filter(v => isVehicleInMaintenance(v.id, v.placa, v.status)).length}
                </span>
              </div>
              <div className="bg-red-950/20 border border-red-800/40 rounded-lg p-2 flex flex-col">
                <span className="text-[11px] text-red-400/80">Inativos</span>
                <span className="text-red-400 font-extrabold text-base sm:text-lg">
                  {filteredVeiculos.filter(v => v.status.toLowerCase() === 'inativo' || v.status.toLowerCase() === 'inactive').length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-green-500/60 text-green-500 hover:bg-green-500 hover:text-white w-full sm:w-auto h-10 sm:h-9"
            >
              <Download size={16} className="mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de ações em lote */}
      {selectedItems.size > 0 && (
        <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-seguranca-lightgray font-medium">
                {selectedItems.size} veículo(s) selecionado(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedItems(new Set());
                  setSelectAll(false);
                }}
                className="border-gray-600 text-gray-400 hover:bg-gray-700 text-xs"
              >
                Limpar Seleção
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkEdit}
                className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              >
                <Edit3 size={16} className="mr-2" />
                Editar Selecionados
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReport}
                className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
              >
                <Edit3 size={16} className="mr-2" />
                Relatório
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkDelete()}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                <Trash2Icon size={16} className="mr-2" />
                Excluir Selecionados
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. VISUALIZAÇÃO MOBILE (CARDS INDIVIDUAIS COM DESIGN RESPONSIVO)           */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-3">
        {filteredVeiculos.length > 0 && (
          <div className="flex items-center justify-between bg-seguranca-graphite border border-gray-700/80 rounded-lg px-3 py-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-300">
              <Checkbox
                checked={selectAll}
                onCheckedChange={handleSelectAll}
                className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
              />
              <span>Selecionar todos ({filteredVeiculos.length})</span>
            </label>
            {selectedItems.size > 0 && (
              <span className="text-seguranca-yellow font-bold">
                {selectedItems.size} selecionado(s)
              </span>
            )}
          </div>
        )}

        {filteredVeiculos.map((veiculo) => {
          const alert = getMaintenanceAlert(veiculo.id);
          const alertCfg = alert ? ALERT_BADGE[alert.alertLevel] : null;
          const AlertIcon = alertCfg ? alertCfg.icon : null;

          const workOrder = getVehicleWorkOrder(veiculo.id, veiculo.placa);
          const legacyMaintenance = getVehicleLegacyMaintenance(veiculo.id, veiculo.placa);
          const inMaintenance = isVehicleInMaintenance(veiculo.id, veiculo.placa, veiculo.status);
          const osNumber = workOrder?.osNumber || (workOrder?.id ? `OS-${workOrder.id.slice(0, 8)}` : null);
          const osType = workOrder?.maintenanceType || legacyMaintenance?.maintenanceType || '';
          const osDesc = workOrder?.anomaliesDescription || workOrder?.stopReason || workOrder?.otherDescription || workOrder?.notes || legacyMaintenance?.description || '';
          const downtime = getVehicleDowntimeInfo(workOrder, legacyMaintenance);
          const typeLabel = osType ? (
            osType === 'CORRETIVA' ? 'Corretiva' :
            osType === 'PREVENTIVA' ? 'Preventiva' :
            osType === 'PREDITIVA' ? 'Preditiva' :
            osType === 'INSPECAO' ? 'Inspeção' :
            osType === 'LUBRIFICACAO' ? 'Lubrificação' :
            osType === 'LIMPEZA' ? 'Limpeza' : osType
          ) : '';

          const statusLower = (veiculo.status || '').toLowerCase();
          const isAtivo = statusLower === 'ativo' || statusLower === 'active';
          const isInativo = statusLower === 'inativo' || statusLower === 'inactive';

          return (
            <div
              key={`mobile-vehicle-${veiculo.id}`}
              className="bg-seguranca-black border border-gray-700/80 hover:border-gray-600 rounded-xl p-3.5 space-y-3 shadow-md transition-all"
            >
              {/* Header do Card Mobile: Checkbox + Ícone Veículo + Placa + Status */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Checkbox
                    checked={selectedItems.has(veiculo.id)}
                    onCheckedChange={(checked) => handleSelectItem(veiculo.id, checked as boolean)}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow h-4 w-4 shrink-0"
                  />
                  
                  {/* Ícone estilizado do tipo de veículo */}
                  <div className="w-9 h-9 rounded-lg bg-seguranca-graphite border border-gray-700/80 flex items-center justify-center shrink-0 text-seguranca-yellow shadow-inner">
                    {veiculo.vehicleType === 'ONIBUS' || veiculo.vehicleType === 'BUS' ? (
                      <Bus className="w-5 h-5 text-seguranca-yellow" />
                    ) : veiculo.vehicleType === 'CAMINHAO' || veiculo.vehicleType === 'TRUCK' ? (
                      <Truck className="w-5 h-5 text-seguranca-yellow" />
                    ) : (
                      <Car className="w-5 h-5 text-seguranca-yellow" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-mono font-extrabold text-seguranca-yellow text-base tracking-wider leading-none truncate">
                      {veiculo.placa}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 truncate leading-none">
                      {veiculo.marca} {veiculo.modelo}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-gray-700 text-gray-400">
                    {veiculo.ano}
                  </Badge>

                  {inMaintenance ? (
                    <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[10px] px-2 py-0.5 flex items-center gap-1 shadow-xs">
                      <Wrench className="w-2.5 h-2.5" />
                      <span>Em Manutenção</span>
                    </Badge>
                  ) : isAtivo ? (
                    <Badge className="bg-emerald-600 text-white font-semibold text-[10px] px-2 py-0.5">
                      Ativo
                    </Badge>
                  ) : isInativo ? (
                    <Badge variant="destructive" className="font-semibold text-[10px] px-2 py-0.5">
                      Inativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {veiculo.status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Seção Exclusiva de Manutenção / Ordem de Serviço (Largura total, sem quebra horizontal) */}
              {inMaintenance && (
                <div className="bg-amber-950/30 border border-amber-600/40 rounded-lg p-2.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {workOrder ? (
                        <button
                          type="button"
                          onClick={() => setSelectedWorkOrderForView(workOrder)}
                          className="inline-flex items-center gap-1 font-mono font-bold text-xs text-amber-300 hover:text-amber-200 underline decoration-amber-500/50"
                          title="Clique para abrir e visualizar a Ordem de Serviço"
                        >
                          <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{osNumber}</span>
                          {typeLabel && <span className="font-normal opacity-80">• {typeLabel}</span>}
                        </button>
                      ) : legacyMaintenance ? (
                        <button
                          type="button"
                          onClick={() => onViewMaintenance?.(legacyMaintenance)}
                          className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
                        >
                          Ver Manutenção
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-amber-300">Veículo em Manutenção</span>
                      )}
                    </div>

                    {downtime && (
                      <div
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                          downtime.severity === 'critical'
                            ? 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                            : downtime.severity === 'warning'
                            ? 'bg-amber-950/80 border-amber-500/60 text-amber-200'
                            : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                        }`}
                        title={downtime.fullDetails}
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{downtime.label}: {downtime.durationFormatted}</span>
                      </div>
                    )}
                  </div>

                  {osDesc && (
                    <p className="text-[11px] text-gray-300 bg-black/40 rounded p-1.5 border border-amber-500/20 line-clamp-2">
                      {osDesc}
                    </p>
                  )}
                </div>
              )}

              {/* Informações detalhadas do Veículo */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-seguranca-graphite/40 rounded-lg p-2.5 border border-gray-800">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">KM Atual</span>
                  <span className="font-mono font-bold text-green-400">
                    {veiculo.quilometragem ? `${(Number(veiculo.quilometragem) / 1000).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Combustível</span>
                  <span className="text-gray-200 capitalize">
                    {veiculo.combustivel || '—'}
                  </span>
                </div>
              </div>

              {/* Badge de Alerta de Manutenção */}
              {alert && alertCfg && AlertIcon && (
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold w-full ${alertCfg.className}`}
                  title={alert.mostCriticalTaskName
                    ? `${alert.mostCriticalTaskName}${alert.mostCriticalMessage ? ` — ${alert.mostCriticalMessage}` : ''}`
                    : alertCfg.label}
                >
                  <AlertIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{alertCfg.label}</span>
                </div>
              )}

              {/* Barra de Ações Mobile com toque confortável */}
              <div className="flex items-center justify-between gap-1.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrModalVehicle(veiculo)}
                  className="flex-1 h-9 border-amber-500/50 text-amber-400 hover:bg-amber-950/30 text-xs font-semibold"
                  title="Ver QR Code do veículo"
                >
                  <QrCode size={14} className="mr-1" />
                  QR Code
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(veiculo)}
                  className="flex-1 h-9 border-gray-700 text-gray-300 hover:bg-gray-800 text-xs"
                >
                  <Eye size={14} className="mr-1" />
                  Detalhes
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(veiculo)}
                  className="flex-1 h-9 border-yellow-600/50 text-yellow-400 hover:bg-yellow-950/30 text-xs"
                >
                  <Edit size={14} className="mr-1" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(veiculo)}
                  className="h-9 w-9 p-0 border-red-700/50 text-red-400 hover:bg-red-950/30 shrink-0"
                  title="Excluir Veículo"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          );
        })}

        {filteredVeiculos.length === 0 && (
          <div className="text-center py-12 bg-seguranca-black border border-gray-700 rounded-xl p-4">
            <div className="w-14 h-14 mx-auto mb-2 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center text-2xl">
              🚗
            </div>
            <p className="text-base font-semibold text-gray-200">Nenhum veículo encontrado</p>
            <p className="text-xs text-gray-400 mt-1">Ajuste os filtros ou cadastre um novo veículo na frota.</p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. VISUALIZAÇÃO DESKTOP (TABELA DENSA COMPLETA)                            */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full overflow-auto bg-seguranca-black border border-gray-600 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-graphite hover:bg-seguranca-graphite">
              <TableHead className="w-10 text-center">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                />
              </TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-xs sm:text-sm">Placa</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-xs sm:text-sm">Marca/Modelo</TableHead>
              <TableHead className="hidden lg:table-cell text-seguranca-lightgray font-semibold text-center text-xs sm:text-sm">Ano</TableHead>
              <TableHead className="hidden lg:table-cell text-seguranca-lightgray font-semibold text-center text-xs sm:text-sm">Tipo</TableHead>
              <TableHead className="hidden xl:table-cell text-seguranca-lightgray font-semibold text-center text-xs sm:text-sm">Combustível</TableHead>
              <TableHead className="hidden md:table-cell text-seguranca-lightgray font-semibold text-center text-xs sm:text-sm">Quilometragem</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center text-xs sm:text-sm">Status</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-right text-xs sm:text-sm">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVeiculos.map((veiculo) => (
              <TableRow
                key={veiculo.id}
                className="hover:bg-seguranca-graphite/50 transition-colors border-b border-gray-700"
              >
                <TableCell className="w-10 text-center px-2">
                  <Checkbox
                    checked={selectedItems.has(veiculo.id)}
                    onCheckedChange={(checked) => handleSelectItem(veiculo.id, checked as boolean)}
                    aria-label={`Selecionar veículo ${veiculo.placa}`}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                  />
                </TableCell>
                <TableCell className="text-seguranca-lightgray py-3 px-2">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className="font-mono font-bold text-seguranca-yellow text-base sm:text-lg leading-tight">
                        {veiculo.placa}
                      </div>
                      <Badge variant="outline" className="md:hidden text-[9px] px-1 h-4 border-gray-600 text-gray-400">
                        {veiculo.ano}
                      </Badge>
                    </div>
                    <div className="md:hidden flex flex-col mt-0.5">
                        <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                          {veiculo.marca} {veiculo.modelo}
                        </span>
                    </div>
                    {(() => {
                      const alert = getMaintenanceAlert(veiculo.id);
                      if (!alert) return null;
                      const cfg = ALERT_BADGE[alert.alertLevel];
                      if (!cfg) return null;
                      const AlertIcon = cfg.icon;
                      return (
                        <div
                          className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold w-fit ${cfg.className}`}
                          title={alert.mostCriticalTaskName
                            ? `${alert.mostCriticalTaskName}${alert.mostCriticalMessage ? ` — ${alert.mostCriticalMessage}` : ''}`
                            : cfg.label}
                        >
                          <AlertIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {cfg.label}
                        </div>
                      );
                    })()}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-seguranca-lightgray">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{veiculo.marca}</span>
                    <span className="text-xs text-gray-400">{veiculo.modelo}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-blue-400 text-sm">
                    {veiculo.ano}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-center text-seguranca-lightgray">
                  {veiculo.vehicleType && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
                      {veiculo.vehicleType === 'BUS_ROAD' ? '🚌 Rodoviário' :
                       veiculo.vehicleType === 'BUS_LUXURY_TOURISM' ? '🚌✨ Luxo Turismo' :
                       veiculo.vehicleType === 'BUS_URBAN' ? '🏙️ Urbano' :
                       veiculo.vehicleType === 'MINIBUS' ? '🚐 Micro-ônibus' :
                       veiculo.vehicleType === 'VAN' ? '🚐 Van' :
                       veiculo.vehicleType === 'CAR_UTILITY' ? '🚗 Utilitário' :
                       veiculo.vehicleType === 'CAR' ? '🚗 Carro' :
                       veiculo.vehicleType === 'TRUCK' ? '🚛 Caminhão' :
                       veiculo.vehicleType === 'MOTORCYCLE' ? '🏍️ Moto' :
                       veiculo.vehicleType === 'PICKUP' ? '🛻 Pickup' :
                       veiculo.vehicleType === 'SUV' ? '🚙 SUV' :
                       veiculo.vehicleType || '—'}
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-center text-seguranca-lightgray">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                    {veiculo.combustivel.charAt(0).toUpperCase() + veiculo.combustivel.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="hidden md:table-cell text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-green-400 text-xs sm:text-sm">
                    {veiculo.quilometragem ? `${(Number(veiculo.quilometragem) / 1000).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center py-3 px-2">
                  <div className="scale-90 sm:scale-100 origin-center">
                    {getStatusBadge(veiculo)}
                  </div>
                </TableCell>
                <TableCell className="text-right py-3 px-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrModalVehicle(veiculo)}
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0 border-yellow-500/60 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                      title="Ver QR Code do veículo"
                    >
                      <QrCode size={14} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-700">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-seguranca-graphite border-gray-600 z-[10100]">
                        <DropdownMenuItem onClick={() => handleView(veiculo)} className="text-gray-200">
                          <Eye className="mr-2 h-4 w-4" /> Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(veiculo)} className="text-yellow-400">
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(veiculo)} className="text-red-400">
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredVeiculos.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <p className="text-lg font-medium">Nenhum veículo encontrado</p>
                    <p className="text-sm">Comece registrando o primeiro veículo da frota</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>



      {/* Modal de Exclusão */}
      <VeiculoDeleteDialog
        veiculo={selectedVeiculo}
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedVeiculo(null);
        }}
        onDelete={handleDeleteSuccess}
      />

      {/* Diálogo de confirmação — Exclusão em massa */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-seguranca-graphite border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão em Massa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-seguranca-lightgray">
              Esta ação não pode ser desfeita. {selectedItems.size} veículo(s) serão removidos da listagem.
              O histórico (abastecimentos, manutenções, multas, OSs) será preservado.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <p className="font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Veículos selecionados: {selectedItems.size}
            </p>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault(); // impede o AlertDialog de fechar antes da conclusão
                executeBulkDelete();
              }}
              disabled={isBulkDeleting || selectedItems.size === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isBulkDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir {selectedItems.size} veículo(s)
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Visualização */}
      {isViewModalOpen && viewingVeiculo && (
        <VehicleDetailPanel
          veiculo={viewingVeiculo}
          isOpen={isViewModalOpen}
          onClose={handleViewClose}
          onEdit={onEdit}
        />
      )}

      {/* Modal de QR Code do Veículo */}
      {qrModalVehicle && (
        <VehicleQRCodeModal
          vehicleId={qrModalVehicle.id}
          plateFallback={qrModalVehicle.placa}
          isOpen={!!qrModalVehicle}
          onClose={() => setQrModalVehicle(null)}
        />
      )}
      {/* Modal de Visualização de Ordem de Serviço (OS) */}
      {selectedWorkOrderForView && (
        <FleetWorkOrderViewModal
          isOpen={!!selectedWorkOrderForView}
          onClose={() => setSelectedWorkOrderForView(null)}
          order={selectedWorkOrderForView}
        />
      )}
    </>
  );
};

export default VeiculosTable;
