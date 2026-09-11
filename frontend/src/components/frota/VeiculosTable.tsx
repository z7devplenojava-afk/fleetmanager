import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye, Download, Trash2Icon, Edit3, AlertTriangle, Clock, CheckCircle2, CalendarClock, Loader2 } from 'lucide-react';
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
import VeiculoDeleteDialog from './VeiculoDeleteDialog';
import VehicleDetailPanel from './VehicleDetailPanel';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
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

  // Função para verificar se um veículo está em manutenção
  const getVehicleMaintenance = (vehicleId: string): VehicleMaintenance | null => {
    if (!maintenances) return null;
    return maintenances.find(m => m.vehicleId === vehicleId && m.status === 'IN_PROGRESS') || null;
  };

  // Função para verificar se um veículo está em manutenção
  const isVehicleInMaintenance = (vehicleId: string): boolean => {
    return getVehicleMaintenance(vehicleId) !== null;
  };
  const [selectAll, setSelectAll] = useState(false);

  // Estados para visualização
  const [viewingVeiculo, setViewingVeiculo] = useState<Veiculo | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { toast } = useToast();

  // Debug dos estados do modal
  useEffect(() => {
    console.log('🔍 Estados do modal - isViewModalOpen:', isViewModalOpen, 'viewingVeiculo:', viewingVeiculo);
  }, [isViewModalOpen, viewingVeiculo]);

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
    console.log('🔍 handleView chamado com veículo:', veiculo);
    setViewingVeiculo(veiculo);
    setIsViewModalOpen(true);
    console.log('🔍 Estados definidos - viewingVeiculo:', veiculo, 'isViewModalOpen: true');
  };

  const handleViewClose = () => {
    console.log('🔍 handleViewClose chamado');
    setIsViewModalOpen(false);
    setViewingVeiculo(null);
    console.log('🔍 Estados limpos - isViewModalOpen: false, viewingVeiculo: null');
  };

  const handleDeleteSuccess = () => {
    onRefresh();
    setIsDeleteDialogOpen(false);
    setSelectedVeiculo(null);
  };

  const getStatusBadge = (status: string, vehicleId?: string) => {
    const statusLower = status.toLowerCase();

    // Verificar se o veículo está em manutenção
    if (vehicleId && isVehicleInMaintenance(vehicleId)) {
      const maintenance = getVehicleMaintenance(vehicleId);
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
            Em Manutenção
          </Badge>
          {maintenance && onViewMaintenance && (
            <button
              onClick={() => onViewMaintenance(maintenance)}
              className="text-xs text-red-400 hover:text-red-300 underline"
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
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }
  };

  return (
    <>
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2">
              Veículos da Frota
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de veículos:</span>
                <span className="text-seguranca-lightgray font-semibold">{filteredVeiculos.length}</span>
              </div>
              {filteredVeiculos.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Ativos:</span>
                    <span className="text-green-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'ativo' || v.status.toLowerCase() === 'active').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Em manutenção:</span>
                    <span className="text-yellow-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'manutencao' || v.status.toLowerCase() === 'maintenance').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Inativos:</span>
                    <span className="text-red-400 font-semibold">
                      {filteredVeiculos.filter(v => v.status.toLowerCase() === 'inativo' || v.status.toLowerCase() === 'inactive').length}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
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

      <div className="w-full overflow-auto bg-seguranca-black border border-gray-600 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-seguranca-graphite hover:bg-seguranca-graphite">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos"
                  className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                />
              </TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Placa</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Marca/Modelo</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Ano</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Tipo</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Combustível</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Quilometragem</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Status</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVeiculos.map((veiculo) => (
              <TableRow
                key={veiculo.id}
                className="hover:bg-seguranca-graphite/50 transition-colors border-b border-gray-700"
              >
                <TableCell className="w-12 text-center">
                  <Checkbox
                    checked={selectedItems.has(veiculo.id)}
                    onCheckedChange={(checked) => handleSelectItem(veiculo.id, checked as boolean)}
                    aria-label={`Selecionar veículo ${veiculo.placa}`}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                  />
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-mono font-semibold text-seguranca-yellow text-lg">
                    {veiculo.placa}
                  </div>
                  {(() => {
                    const alert = getMaintenanceAlert(veiculo.id);
                    if (!alert) return null;
                    const cfg = ALERT_BADGE[alert.alertLevel];
                    if (!cfg) return null;
                    const AlertIcon = cfg.icon;
                    return (
                      <div
                        className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.className}`}
                        title={alert.mostCriticalTaskName
                          ? `${alert.mostCriticalTaskName}${alert.mostCriticalMessage ? ` — ${alert.mostCriticalMessage}` : ''}`
                          : cfg.label}
                      >
                        <AlertIcon className="h-3 w-3" />
                        {cfg.label}
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="flex flex-col">
                    <span className="font-semibold">{veiculo.marca}</span>
                    <span className="text-sm text-gray-400">{veiculo.modelo}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-blue-400">
                    {veiculo.ano}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  {veiculo.vehicleType && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-700/30">
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
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                    {veiculo.combustivel.charAt(0).toUpperCase() + veiculo.combustivel.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-green-400">
                    {veiculo.quilometragem ? `${(Number(veiculo.quilometragem) / 1000).toFixed(3).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} km` : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(veiculo.status, veiculo.id)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(veiculo)}
                      className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      title="Visualizar detalhes"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(veiculo)}
                      className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(veiculo)}
                      className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </Button>
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
    </>
  );
};

export default VeiculosTable;
