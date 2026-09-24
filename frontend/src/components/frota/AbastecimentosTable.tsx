import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Trash2Icon, Edit3, Download, FileText, Eye, Building2, Car, X, Check, Filter, Fuel } from 'lucide-react';
import { FuelRecord } from '@/types/fleet';
import { format } from 'date-fns';
import AbastecimentoEditModal from './AbastecimentoEditModal';
import AbastecimentoDeleteDialog from './AbastecimentoDeleteDialog';
import AbastecimentoReportModal from './AbastecimentoReportModal';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resolveCompanyLogoUrl } from '@/utils/logoUtils';
import { downloadFuelReportsPDF, computeFuelReportsKpis } from '@/utils/fuelReportsPDFGenerator';
import api from '@/lib/axios';
import fleetService from '@/services/fleetService';
import garageService, { Garage } from '@/services/garageService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Badge } from '@/components/ui/badge';

interface Veiculo {
  id: string;
  placa: string;
  fleetNumber?: string;
  prefixo?: string;
  marca: string;
  modelo: string;
  status: string;
  garageId?: string;
  garageName?: string;
}

const getVehiclePlate = (v: Veiculo | undefined | null): string =>
  (v as any)?.placa || (v as any)?.plate || '';

const getVehicleLabel = (v: Veiculo): string => {
  const plate = getVehiclePlate(v);
  const prefix = (v as any).fleetNumber || (v as any).prefixo || '';
  const brand = (v as any).marca || (v as any).brand || '';
  const model = (v as any).modelo || (v as any).model || '';
  const garage = (v as any).garageName ? `(${ (v as any).garageName })` : '';

  const prefixPart = prefix ? `[Frota ${prefix}] ` : '';
  const vehicleText = [prefixPart + plate, brand, model].filter(Boolean).join(' - ');
  return [vehicleText, garage].filter(Boolean).join(' ') || 'Sem identificação';
};

interface AbastecimentosTableProps {
  abastecimentos: FuelRecord[];
  veiculos: Veiculo[];
  onRefresh: () => void;
}

export const AbastecimentosTable: React.FC<AbastecimentosTableProps> = ({
  abastecimentos,
  veiculos,
  onRefresh
}) => {
  const { user, empresa } = useAuth();
  const [editingAbastecimento, setEditingAbastecimento] = useState<FuelRecord | null>(null);
  const [deletingAbastecimento, setDeletingAbastecimento] = useState<FuelRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [viewingAbastecimento, setViewingAbastecimento] = useState<FuelRecord | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Estados para seleção
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { toast } = useToast();

  // Debug: Log dos dados recebidos
  console.log('🔍 AbastecimentosTable - Dados recebidos:', abastecimentos);
  if (abastecimentos && abastecimentos.length > 0) {
    console.log('🔍 AbastecimentosTable - Primeiro abastecimento:', abastecimentos[0]);
    console.log('🔍 AbastecimentosTable - Campos de quilometragem:', {
      mileage: abastecimentos[0].mileage,
      initialMileage: abastecimentos[0].initialMileage,
      finalMileage: abastecimentos[0].finalMileage,
      fuelType: abastecimentos[0].fuelType
    });
  }

  // Funções de seleção
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(abastecimentos.map(item => item.id));
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
    setSelectAll(newSelected.size === abastecimentos.length);
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

    // Confirmação antes de excluir
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.size} abastecimento(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const selectedIds = Array.from(selectedItems);
      console.log('🗑️ Excluindo abastecimentos:', selectedIds);

      const response = await api.delete('/fuel-records/batch', {
        data: selectedIds
      });

      console.log('✅ Resposta da exclusão em lote:', response.data);

      toast({
        title: "Sucesso",
        description: `${response.data.deletedCount} abastecimento(s) excluído(s) com sucesso!`,
        variant: "default"
      });

      // Limpar seleção e atualizar lista
      setSelectedItems(new Set());
      setSelectAll(false);
      onRefresh();

    } catch (error: unknown) {
      console.error('❌ Erro ao excluir em lote:', error);

      let errorMessage = 'Erro ao excluir abastecimentos';
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
    }
  };

  const handleBulkEdit = () => {
    // Implementar edição em lote
    console.log('Editando itens selecionados:', Array.from(selectedItems));
    // Aqui você pode implementar a lógica de edição em lote
  };

  const handleExport = () => {
    // Implementar exportação dos itens selecionados
    console.log('Exportando itens selecionados:', Array.from(selectedItems));
    // Aqui você pode implementar a lógica de exportação
  };

  const handleGenerateReport = () => {
    setIsReportModalOpen(true);
  };

  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [pdfFilters, setPdfFilters] = useState<{
    startDate: string;
    endDate: string;
    garageId: string;
    vehicleId: string;
    fuelType: string;
  }>({
    startDate: '',
    endDate: '',
    garageId: 'all',
    vehicleId: 'all',
    fuelType: 'all',
  });
  const [selectedVehiclesForPdf, setSelectedVehiclesForPdf] = useState<Veiculo[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfFallbackVehicles, setPdfFallbackVehicles] = useState<Veiculo[]>([]);
  const [isLoadingPdfVehicles, setIsLoadingPdfVehicles] = useState(false);
  const [garages, setGarages] = useState<Garage[]>([]);
  const [isLoadingGarages, setIsLoadingGarages] = useState(false);

  const normalizedPdfVehicles: Veiculo[] = React.useMemo(
    () =>
      veiculos.map((v) => ({
        ...v,
        placa: getVehiclePlate(v),
        fleetNumber: (v as any).fleetNumber || (v as any).prefixo || '',
        marca: (v as any).marca || (v as any).brand || '',
        modelo: (v as any).modelo || (v as any).model || '',
        status: (v as any).status || '',
        garageId: (v as any).garageId || '',
        garageName: (v as any).garageName || '',
      })),
    [veiculos]
  );

  // Carregar garagens quando abrir o modal de PDF
  React.useEffect(() => {
    if (!isPDFModalOpen) return;
    let cancelled = false;
    setIsLoadingGarages(true);
    garageService
      .list()
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setGarages(data);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar garagens para filtro:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGarages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPDFModalOpen]);

  // Carregar veículos caso veiculos venha vazio
  React.useEffect(() => {
    if (!isPDFModalOpen || normalizedPdfVehicles.length > 0) return;
    let cancelled = false;
    setIsLoadingPdfVehicles(true);
    fleetService
      .getVehicles()
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        setPdfFallbackVehicles(
          data.map((v: any) => ({
            id: v.id,
            placa: v.plate || v.placa || '',
            fleetNumber: v.fleetNumber || v.prefixo || '',
            marca: v.brand || v.marca || '',
            modelo: v.model || v.modelo || '',
            status: v.status || 'ATIVO',
            garageId: v.garageId || '',
            garageName: v.garageName || '',
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setPdfFallbackVehicles([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPdfVehicles(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isPDFModalOpen, normalizedPdfVehicles.length]);

  const allAvailableVehicles = React.useMemo(() => {
    return normalizedPdfVehicles.length > 0 ? normalizedPdfVehicles : pdfFallbackVehicles;
  }, [normalizedPdfVehicles, pdfFallbackVehicles]);

  // Garagens disponíveis consolidadas (do serviço + dos veículos)
  const availableGarages = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; vehicleCount: number }>();

    garages.forEach((g) => {
      if (g.id) {
        map.set(g.id, { id: g.id, name: g.name, vehicleCount: 0 });
      }
    });

    allAvailableVehicles.forEach((v) => {
      const gId = v.garageId || v.garageName;
      if (gId) {
        if (!map.has(gId)) {
          map.set(gId, { id: gId, name: v.garageName || `Garagem ${gId}`, vehicleCount: 1 });
        } else {
          const entry = map.get(gId)!;
          entry.vehicleCount += 1;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [garages, allAvailableVehicles]);

  // Veículos filtrados por garagem selecionada
  const vehiclesBySelectedGarage = React.useMemo(() => {
    if (!pdfFilters.garageId || pdfFilters.garageId === 'all') {
      return allAvailableVehicles;
    }
    const targetGarage = availableGarages.find((g) => g.id === pdfFilters.garageId);
    const targetName = targetGarage ? targetGarage.name : pdfFilters.garageId;
    return allAvailableVehicles.filter(
      (v) =>
        v.garageId === pdfFilters.garageId ||
        v.garageName === targetName ||
        v.garageName === pdfFilters.garageId
    );
  }, [allAvailableVehicles, pdfFilters.garageId, availableGarages]);

  // Opções para o Combobox de veículos
  const pdfVehicleOptions = React.useMemo(() => {
    return [
      {
        label:
          pdfFilters.garageId !== 'all'
            ? `Todos os veículos da garagem (${vehiclesBySelectedGarage.length})`
            : `Todos os veículos (${allAvailableVehicles.length})`,
        value: 'all',
        search: 'todos veiculos all'
      },
      ...vehiclesBySelectedGarage.map((v) => {
        const plate = getVehiclePlate(v);
        const prefix = (v as any).fleetNumber || (v as any).prefixo || '';
        const brand = v.marca || '';
        const model = v.modelo || '';
        return {
          label: getVehicleLabel(v),
          value: v.id,
          search: `${prefix} ${plate} ${brand} ${model} ${v.garageName || ''}`.trim()
        };
      })
    ];
  }, [vehiclesBySelectedGarage, allAvailableVehicles.length, pdfFilters.garageId]);

  // Adicionar veículo à lista de selecionados
  const handleAddVehicleToPdfFilter = (vehicleId: string) => {
    if (vehicleId === 'all') {
      setSelectedVehiclesForPdf([]);
      setPdfFilters((prev) => ({ ...prev, vehicleId: 'all' }));
      return;
    }
    const found = allAvailableVehicles.find((v) => v.id === vehicleId);
    if (!found) return;

    setSelectedVehiclesForPdf((prev) => {
      if (prev.some((v) => v.id === found.id)) return prev;
      return [...prev, found];
    });
    setPdfFilters((prev) => ({ ...prev, vehicleId: vehicleId }));
  };

  const handleRemoveVehicleFromPdfFilter = (id: string) => {
    setSelectedVehiclesForPdf((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      if (updated.length === 0) {
        setPdfFilters((p) => ({ ...p, vehicleId: 'all' }));
      } else {
        setPdfFilters((p) => ({ ...p, vehicleId: updated[updated.length - 1].id }));
      }
      return updated;
    });
  };

  const handleClearSelectedVehicles = () => {
    setSelectedVehiclesForPdf([]);
    setPdfFilters((prev) => ({ ...prev, vehicleId: 'all' }));
  };

  const handleGeneratePDF = async () => {
    if (!pdfFilters.startDate || !pdfFilters.endDate) {
      toast({
        title: "Filtros obrigatórios",
        description: "Por favor, selecione as datas de início e fim.",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const filters: {
        startDate?: string;
        endDate?: string;
        vehicleId?: string;
        driverId?: string;
      } = {
        startDate: pdfFilters.startDate,
        endDate: pdfFilters.endDate
      };

      // Se há exatamente 1 veículo selecionado via combobox ou lista
      if (selectedVehiclesForPdf.length === 1) {
        filters.vehicleId = selectedVehiclesForPdf[0].id;
      } else if (selectedVehiclesForPdf.length === 0 && pdfFilters.vehicleId && pdfFilters.vehicleId !== 'all') {
        filters.vehicleId = pdfFilters.vehicleId;
      }

      let records = await fleetService.getFilteredFuelRecords(filters);

      // Filtro por Garagem se selecionada
      let selectedGarageName: string | undefined = undefined;
      if (pdfFilters.garageId && pdfFilters.garageId !== 'all') {
        const gObj = availableGarages.find((g) => g.id === pdfFilters.garageId);
        selectedGarageName = gObj ? gObj.name : pdfFilters.garageId;

        const allowedVehicleIds = new Set(vehiclesBySelectedGarage.map((v) => v.id));
        records = records.filter((r) => allowedVehicleIds.has(r.vehicleId));
      }

      // Filtro por múltiplos veículos se selecionados
      if (selectedVehiclesForPdf.length > 1) {
        const allowedIds = new Set(selectedVehiclesForPdf.map((v) => v.id));
        records = records.filter((r) => allowedIds.has(r.vehicleId));
      }

      // Filtro por tipo de combustível
      if (pdfFilters.fuelType && pdfFilters.fuelType !== 'all') {
        records = records.filter((r) => r.fuelType === pdfFilters.fuelType);
      }

      if (records.length === 0) {
        toast({
          title: "Sem dados",
          description: "Nenhum abastecimento interno encontrado com os filtros aplicados.",
          variant: "destructive"
        });
        return;
      }

      // Determinar placa/descrição dos veículos para o cabeçalho do PDF
      let vehiclePlateLabel: string | undefined = undefined;
      let vehicleIdLabel: string | undefined = undefined;

      if (selectedVehiclesForPdf.length === 1) {
        vehiclePlateLabel = getVehiclePlate(selectedVehiclesForPdf[0]);
        vehicleIdLabel = selectedVehiclesForPdf[0].id;
      } else if (selectedVehiclesForPdf.length > 1) {
        vehiclePlateLabel = `${selectedVehiclesForPdf.length} veículos selecionados (${selectedVehiclesForPdf.map((v) => getVehiclePlate(v)).slice(0, 3).join(', ')}${selectedVehiclesForPdf.length > 3 ? '...' : ''})`;
        vehicleIdLabel = 'MULTI';
      } else if (pdfFilters.vehicleId && pdfFilters.vehicleId !== 'all') {
        const singleV = allAvailableVehicles.find((v) => v.id === pdfFilters.vehicleId);
        vehiclePlateLabel = singleV ? getVehiclePlate(singleV) : undefined;
        vehicleIdLabel = pdfFilters.vehicleId;
      } else if (pdfFilters.garageId !== 'all') {
        vehiclePlateLabel = `Todos os veículos da garagem ${selectedGarageName || ''} (${vehiclesBySelectedGarage.length})`;
      }

      await downloadFuelReportsPDF({
        reportView: pdfFilters.garageId !== 'all' ? 'garage' : (selectedVehiclesForPdf.length > 0 ? 'vehicle' : 'all'),
        reportTitle: 'RELATÓRIO DE ABASTECIMENTOS INTERNOS',
        fuelRecords: records,
        vehicles: allAvailableVehicles as any,
        kpis: computeFuelReportsKpis(records),
        filters: {
          startDate: pdfFilters.startDate || undefined,
          endDate: pdfFilters.endDate || undefined,
          garageId: pdfFilters.garageId !== 'all' ? pdfFilters.garageId : undefined,
          garageName: selectedGarageName,
          vehicleId: vehicleIdLabel,
          vehiclePlate: vehiclePlateLabel,
          fuelType: pdfFilters.fuelType && pdfFilters.fuelType !== 'all' ? pdfFilters.fuelType : undefined,
        },
        company: {
          name: empresa?.nome || (user as any)?.companyName || undefined,
          tradeName: (empresa as any)?.sigla || empresa?.nome || undefined,
          cnpj: (empresa as any)?.cnpj || (user as any)?.companyCnpj || undefined,
          logoUrl: resolveCompanyLogoUrl(empresa?.logoUrl),
          phone: (empresa as any)?.telefone,
          email: (empresa as any)?.email,
          address: (empresa as any)?.endereco,
        },
        userName: (user as any)?.name || (user as any)?.username || undefined,
      });

      toast({
        title: "Relatório gerado com sucesso!",
        description: "O relatório de abastecimentos internos foi baixado com sucesso.",
        variant: "default",
      });

      setIsPDFModalOpen(false);
    } catch (error: any) {
      console.error('Erro ao gerar relatório PDF:', error);
      const errorMessage = error?.message || 'Ocorreu um erro ao gerar o relatório PDF. Tente novamente.';
      toast({
        title: "Erro ao gerar relatório",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleEdit = (abastecimento: FuelRecord) => {
    console.log('Botão de edição clicado para:', abastecimento);
    setEditingAbastecimento(abastecimento);
    setIsEditModalOpen(true);
    console.log('Estado do modal de edição:', { editingAbastecimento: abastecimento, isEditModalOpen: true });
  };

  const handleDelete = (abastecimento: FuelRecord) => {
    setDeletingAbastecimento(abastecimento);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingAbastecimento(null);
    onRefresh();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setDeletingAbastecimento(null);
    onRefresh();
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditingAbastecimento(null);
  };

  const handleViewClose = () => {
    setIsViewModalOpen(false);
    setViewingAbastecimento(null);
  };

  const handleDeleteClose = () => {
    setIsDeleteDialogOpen(false);
    setDeletingAbastecimento(null);
  };

  const handleView = (abastecimento: FuelRecord) => {
    console.log('🔍 Visualizando abastecimento:', abastecimento);
    setViewingAbastecimento(abastecimento);
    setIsViewModalOpen(true);
  };

  return (
    <>
      {/* Cabeçalho com Estatísticas */}
      <div className="bg-seguranca-black border border-gray-600 rounded-lg p-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-seguranca-lightgray mb-2">
              Controle de Abastecimento
            </h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Total de registros:</span>
                <span className="text-seguranca-lightgray font-semibold">{abastecimentos.length}</span>
              </div>
              {abastecimentos.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Valor total:</span>
                    <span className="text-green-400 font-semibold">
                      R$ {abastecimentos.reduce((sum, item) => sum + (item.cost || 0), 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Litros totais:</span>
                    <span className="text-blue-400 font-semibold">
                      {abastecimentos.reduce((sum, item) => sum + (item.quantity || 0), 0).toFixed(2)} L
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
              onClick={() => setIsPDFModalOpen(true)}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              title="Gerar Relatório PDF de Abastecimentos Internos"
            >
              <FileText size={16} className="mr-2" />
              Gerar Relatório PDF de Abastecimentos Internos
            </Button>
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
                {selectedItems.size} item(s) selecionado(s)
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
                <FileText size={16} className="mr-2" />
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
              <TableHead className="text-seguranca-lightgray font-semibold">Data</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Veículo</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Cliente / Obra</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Contrato</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Motorista</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">KM (Ant / Atual)</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Combustível</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Litros</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Valor/Litro</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-center">Valor Total</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold">Posto</TableHead>
              <TableHead className="text-seguranca-lightgray font-semibold text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abastecimentos.map((abastecimento) => (
              <TableRow
                key={abastecimento.id}
                className="hover:bg-seguranca-graphite/50 transition-colors border-b border-gray-700"
              >
                <TableCell className="w-12 text-center">
                  <Checkbox
                    checked={selectedItems.has(abastecimento.id)}
                    onCheckedChange={(checked) => handleSelectItem(abastecimento.id, checked as boolean)}
                    aria-label={`Selecionar abastecimento ${abastecimento.vehiclePlate}`}
                    className="border-gray-500 data-[state=checked]:bg-seguranca-yellow data-[state=checked]:border-seguranca-yellow"
                  />
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-medium">
                    {(() => {
                      if (!abastecimento.date) return 'Data não informada';
                      try {
                        const date = new Date(abastecimento.date);
                        if (isNaN(date.getTime())) return 'Data inválida';
                        return format(date, 'dd/MM/yyyy');
                      } catch (error) {
                        console.warn('Erro ao formatar data:', abastecimento.date, error);
                        return 'Data inválida';
                      }
                    })()}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="font-mono font-semibold text-seguranca-yellow">
                    {abastecimento.vehiclePlate}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  <div className="flex flex-col">
                    <span className="font-medium text-white">{abastecimento.clientName || '-'}</span>
                    {abastecimento.obraName && (
                      <span className="text-xs text-gray-400">{abastecimento.obraName}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-seguranca-lightgray font-mono text-xs">
                  {abastecimento.contractNumber || '-'}
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  {abastecimento.driver ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{abastecimento.driver.name}</span>
                      <span className="text-xs text-gray-400">{abastecimento.driver.document}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Não informado</span>
                  )}
                </TableCell>
                <TableCell className="text-seguranca-lightgray font-mono text-xs">
                  {abastecimento.initialMileage !== undefined && abastecimento.initialMileage !== null ? (
                    <div className="flex flex-col">
                      <span className="text-gray-400">Ant: {abastecimento.initialMileage.toLocaleString('pt-BR')}</span>
                      <span className="text-yellow-400 font-semibold">Atual: {abastecimento.mileage?.toLocaleString('pt-BR')}</span>
                    </div>
                  ) : (
                    <span>{abastecimento.mileage?.toLocaleString('pt-BR') || '-'}</span>
                  )}
                </TableCell>
                <TableCell className="text-seguranca-lightgray">
                  {abastecimento.fuelType ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-900/20 text-blue-400 border border-blue-700/30">
                      {abastecimento.fuelType.toLowerCase() === 'gasoline' ? 'Gasolina' :
                        abastecimento.fuelType.toLowerCase() === 'ethanol' ? 'Etanol' :
                          abastecimento.fuelType.toLowerCase() === 'diesel' ? 'Diesel' :
                            abastecimento.fuelType.toLowerCase() === 'flex' ? 'Flex' :
                              abastecimento.fuelType}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-blue-400">
                    {abastecimento.quantity ? abastecimento.quantity.toFixed(2) + ' L' : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-green-400">
                    {abastecimento.quantity && abastecimento.cost ?
                      'R$ ' + (abastecimento.cost / abastecimento.quantity).toFixed(2).replace('.', ',') : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center text-seguranca-lightgray">
                  <span className="font-mono font-semibold text-seguranca-yellow">
                    {abastecimento.cost ? 'R$ ' + abastecimento.cost.toFixed(2).replace('.', ',') : '-'}
                  </span>
                </TableCell>
                <TableCell className="text-seguranca-lightgray max-w-[200px]">
                  <div className="truncate" title={abastecimento.station || 'Não informado'}>
                    {abastecimento.station || (
                      <span className="text-gray-400 italic">Não informado</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(abastecimento)}
                      className="h-8 w-8 p-0 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      title="Visualizar detalhes"
                    >
                      <Eye size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(abastecimento)}
                      className="h-8 w-8 p-0 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                      title="Editar"
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(abastecimento)}
                      className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {abastecimentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-16 h-16 border-2 border-dashed border-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⛽</span>
                    </div>
                    <p className="text-lg font-medium">Nenhum abastecimento encontrado</p>
                    <p className="text-sm">Comece registrando o primeiro abastecimento</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Rodapé com Informações Adicionais */}
      {abastecimentos.length > 0 && (
        <div className="mt-4 bg-seguranca-black border border-gray-600 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média por abastecimento:</span>
              <span className="text-seguranca-lightgray font-semibold">
                R$ {(abastecimentos.reduce((sum, item) => sum + (item.cost || 0), 0) / abastecimentos.length).toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Média de litros:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {(abastecimentos.reduce((sum, item) => sum + (item.quantity || 0), 0) / abastecimentos.length).toFixed(2)} L
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Última atualização:</span>
              <span className="text-seguranca-lightgray font-semibold">
                {new Date().toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      <AbastecimentoEditModal
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        abastecimento={editingAbastecimento}
        veiculos={veiculos}
      />

      {/* Modal de Visualização */}
      {viewingAbastecimento && isViewModalOpen && createPortal(
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[99999] transition-opacity duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleViewClose();
            }
          }}
        >
          <div 
            className="bg-seguranca-graphite border border-gray-600 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h3 className="text-xl font-semibold text-seguranca-lightgray flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-500" />
                Detalhes do Abastecimento
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-6">
              {/* Cabeçalho com Informações Principais */}
              <div className="bg-seguranca-black/30 rounded-lg p-4 border border-gray-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚗</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Veículo</p>
                      <p className="text-lg font-semibold text-seguranca-yellow">{viewingAbastecimento.vehiclePlate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">⛽</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Combustível</p>
                      <p className="text-lg font-semibold text-blue-400 capitalize">
                        {viewingAbastecimento.fuelType?.toLowerCase() === 'gasoline' ? 'Gasolina' :
                          viewingAbastecimento.fuelType?.toLowerCase() === 'ethanol' ? 'Etanol' :
                            viewingAbastecimento.fuelType?.toLowerCase() === 'diesel' ? 'Diesel' :
                              viewingAbastecimento.fuelType?.toLowerCase() === 'flex' ? 'Flex' :
                                viewingAbastecimento.fuelType || 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Detalhadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-4">
                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-seguranca-yellow mb-3 uppercase tracking-wide">Informações Básicas</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data:</span>
                        <span className="text-seguranca-lightgray font-medium">{format(new Date(viewingAbastecimento.date), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Motorista:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {(() => {
                            console.log('🔍 Motorista:', viewingAbastecimento.driver);
                            if (viewingAbastecimento.driver && viewingAbastecimento.driver.name) {
                              const driverName = viewingAbastecimento.driver.name.trim();
                              const driverDoc = viewingAbastecimento.driver.document ? viewingAbastecimento.driver.document.trim() : '';
                              if (driverDoc) {
                                return `${driverName} (${driverDoc})`;
                              }
                              return driverName;
                            }
                            return <span className="text-gray-400 italic">Não informado</span>;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Posto:</span>
                        <span className="text-seguranca-lightgray font-medium">{viewingAbastecimento.station || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3 uppercase tracking-wide">Quilometragem</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Km Anterior:</span>
                        <span className="text-seguranca-lightgray font-mono">
                          {(() => {
                            // Buscar o último abastecimento do mesmo veículo
                            const lastFuelRecord = abastecimentos
                              .filter(record => record.vehicleId === viewingAbastecimento.vehicleId && record.id !== viewingAbastecimento.id)
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                            if (lastFuelRecord && lastFuelRecord.mileage !== null && lastFuelRecord.mileage !== undefined && lastFuelRecord.mileage > 0) {
                              return lastFuelRecord.mileage.toLocaleString() + ' km';
                            }
                            return 'Primeiro abastecimento';
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quilometragem:</span>
                        <span className="text-seguranca-lightgray font-mono">
                          {(() => {
                            console.log('🔍 Quilometragem:', viewingAbastecimento.mileage, 'tipo:', typeof viewingAbastecimento.mileage);
                            if (viewingAbastecimento.mileage !== null && viewingAbastecimento.mileage !== undefined && viewingAbastecimento.mileage > 0) {
                              return viewingAbastecimento.mileage.toLocaleString() + ' km';
                            }
                            return 'Não informado';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coluna Direita */}
                <div className="space-y-4">
                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">Dados Financeiros</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Litros:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-blue-400">
                          {viewingAbastecimento.quantity ? viewingAbastecimento.quantity.toFixed(2) + ' L' : 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor por Litro:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-green-400">
                          {viewingAbastecimento.quantity && viewingAbastecimento.cost ?
                            'R$ ' + (viewingAbastecimento.cost / viewingAbastecimento.quantity).toFixed(2).replace('.', ',') : 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Valor Total:</span>
                        <span className="text-seguranca-lightgray font-mono font-semibold text-seguranca-yellow text-lg">
                          {viewingAbastecimento.cost ? 'R$ ' + viewingAbastecimento.cost.toFixed(2).replace('.', ',') : 'Não informado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-seguranca-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide">Informações Adicionais</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Observações:</span>
                        <span className="text-seguranca-lightgray font-medium max-w-[200px] text-right">
                          {viewingAbastecimento.notes || 'Nenhuma observação'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Data de Criação:</span>
                        <span className="text-seguranca-lightgray font-medium">
                          {(() => {
                            if (!viewingAbastecimento.createdAt) return 'Não informado';
                            try {
                              const date = new Date(viewingAbastecimento.createdAt);
                              if (isNaN(date.getTime())) return 'Data inválida';
                              return format(date, 'dd/MM/yyyy HH:mm');
                            } catch (error) {
                              console.warn('Erro ao formatar data:', viewingAbastecimento.createdAt, error);
                              return 'Data inválida';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-600">
              <Button
                variant="outline"
                onClick={() => {
                  handleViewClose();
                  handleEdit(viewingAbastecimento);
                }}
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white"
                title="Editar abastecimento"
              >
                <Edit size={16} className="mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleViewClose();
                  handleDelete(viewingAbastecimento);
                }}
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                title="Excluir abastecimento"
              >
                <Trash2 size={16} className="mr-2" />
                Excluir
              </Button>
              <Button
                variant="outline"
                onClick={handleViewClose}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dialog de Exclusão */}
      <AbastecimentoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteClose}
        onSuccess={handleDeleteSuccess}
        abastecimento={deletingAbastecimento}
      />

      {/* Modal de Relatório */}
      <AbastecimentoReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        veiculos={veiculos}
      />

      {/* Modal de Geração de PDF de Abastecimentos Internos */}
      <Dialog open={isPDFModalOpen} onOpenChange={setIsPDFModalOpen}>
        <DialogContent className="sm:max-w-lg bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
          <DialogHeader>
            <DialogTitle className="text-seguranca-lightgray flex items-center gap-2 text-lg">
              <FileText className="text-red-500 h-5 w-5" />
              Gerar Relatório PDF de Abastecimentos Internos
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Configure os filtros para emissão do relatório oficial de abastecimentos internos da frota.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Período: 2 colunas lado a lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-seguranca-lightgray text-xs font-semibold uppercase tracking-wider">
                  Data Início *
                </Label>
                <Input
                  type="date"
                  value={pdfFilters.startDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, startDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-red-500"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-seguranca-lightgray text-xs font-semibold uppercase tracking-wider">
                  Data Fim *
                </Label>
                <Input
                  type="date"
                  value={pdfFilters.endDate}
                  onChange={(e) => setPdfFilters({ ...pdfFilters, endDate: e.target.value })}
                  className="bg-seguranca-black border-gray-600 text-seguranca-lightgray focus:border-red-500"
                />
              </div>
            </div>

            {/* Filtro por Garagem */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-seguranca-lightgray text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 size={14} className="text-blue-400" />
                  Garagem
                </Label>
                {isLoadingGarages && (
                  <span className="text-[11px] text-gray-400">Carregando garagens...</span>
                )}
              </div>
              <Select
                value={pdfFilters.garageId}
                onValueChange={(value) => {
                  setPdfFilters((prev) => ({ ...prev, garageId: value }));
                  // Se mudar de garagem, limpar veículos selecionados que não façam parte da nova garagem
                  if (value !== 'all') {
                    const gObj = availableGarages.find((g) => g.id === value);
                    const gName = gObj ? gObj.name : value;
                    setSelectedVehiclesForPdf((prev) =>
                      prev.filter((v) => v.garageId === value || v.garageName === gName || v.garageName === value)
                    );
                  }
                }}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todas as garagens" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 max-h-60">
                  <SelectItem value="all">
                    Todas as garagens ({allAvailableVehicles.length} veículos)
                  </SelectItem>
                  {availableGarages.map((garage) => (
                    <SelectItem key={garage.id} value={garage.id}>
                      {garage.name} {garage.vehicleCount > 0 ? `(${garage.vehicleCount} veículos)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por Veículos */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-seguranca-lightgray text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={14} className="text-green-400" />
                  Veículo(s)
                </Label>
                {selectedVehiclesForPdf.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelectedVehicles}
                    className="text-[11px] text-yellow-400 hover:underline"
                  >
                    Limpar veículos selecionados ({selectedVehiclesForPdf.length})
                  </button>
                )}
              </div>

              {/* Combobox de Busca */}
              <Combobox
                options={pdfVehicleOptions}
                value={selectedVehiclesForPdf.length === 1 ? selectedVehiclesForPdf[0].id : (pdfFilters.vehicleId || 'all')}
                onChange={handleAddVehicleToPdfFilter}
                placeholder="Selecione um veículo ou busque..."
                searchPlaceholder="Buscar por frota/prefixo, placa, modelo..."
                emptyPlaceholder={
                  isLoadingPdfVehicles
                    ? 'Carregando veículos...'
                    : 'Nenhum veículo encontrado nesta garagem.'
                }
              />

              {/* Chips dos veículos selecionados para o PDF */}
              {selectedVehiclesForPdf.length > 0 ? (
                <div className="pt-2">
                  <div className="text-[11px] text-gray-400 mb-1 flex items-center justify-between">
                    <span>Veículos selecionados ({selectedVehiclesForPdf.length}):</span>
                    <span className="text-xs text-green-400 font-mono">Filtrando apenas estes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-seguranca-black/40 rounded border border-gray-700">
                    {selectedVehiclesForPdf.map((v) => {
                      const plate = getVehiclePlate(v);
                      const prefix = (v as any).fleetNumber || (v as any).prefixo || '';
                      return (
                        <Badge
                          key={v.id}
                          variant="secondary"
                          className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray pl-2 pr-1 py-0.5 text-xs flex items-center gap-1.5 hover:bg-gray-800"
                        >
                          <span className="font-mono text-seguranca-yellow font-semibold">
                            {prefix ? `[${prefix}] ` : ''}{plate}
                          </span>
                          <span className="text-gray-400 max-w-[100px] truncate">{v.modelo || v.marca}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVehicleFromPdfFilter(v.id)}
                            className="rounded-full hover:bg-red-900/50 p-0.5 text-gray-400 hover:text-red-400"
                            title="Remover veículo"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400 flex items-center gap-1 pt-0.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {pdfFilters.garageId !== 'all'
                    ? `Filtrando todos os ${vehiclesBySelectedGarage.length} veículos da garagem selecionada.`
                    : `Filtrando todos os ${allAvailableVehicles.length} veículos da frota.`}
                </div>
              )}
            </div>
            
            {/* Combustível */}
            <div className="space-y-1.5">
              <Label className="text-seguranca-lightgray text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Fuel size={14} className="text-yellow-400" />
                Combustível
              </Label>
              <Select 
                value={pdfFilters.fuelType} 
                onValueChange={(value) => setPdfFilters({ ...pdfFilters, fuelType: value })}
              >
                <SelectTrigger className="bg-seguranca-black border-gray-600 text-seguranca-lightgray">
                  <SelectValue placeholder="Todos os combustíveis" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600">
                  <SelectItem value="all">Todos os combustíveis</SelectItem>
                  <SelectItem value="DIESEL">Diesel</SelectItem>
                  <SelectItem value="GASOLINE">Gasolina</SelectItem>
                  <SelectItem value="ETHANOL">Etanol</SelectItem>
                  <SelectItem value="FLEX">Flex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Botões do Rodapé */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
              <Button
                variant="outline"
                onClick={() => setIsPDFModalOpen(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-seguranca-red hover:bg-seguranca-darkred font-semibold text-white px-5"
              >
                {isGeneratingPDF ? 'Gerando Relatório...' : 'Gerar PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AbastecimentosTable;
