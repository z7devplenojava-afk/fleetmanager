import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Car, Fuel, Search, AlertTriangle, Loader2, Wrench, Calendar, DollarSign, Settings, FileText, Filter, RefreshCw, TrendingUp, Users, UserCheck, FileSpreadsheet } from 'lucide-react';
import { VehicleImportModal } from '@/components/frota/VehicleImportModal';
import VeiculosTable from '@/components/frota/VeiculosTable';
import AgregadosTable from '@/components/frota/AgregadosTable';
import AgregadosDashboard from '@/components/frota/AgregadosDashboard';
import AgregadosFormModal from '@/components/frota/AgregadosFormModal';
import AbastecimentosTable from '@/components/frota/AbastecimentosTable';
import MultasTable from '@/components/frota/MultasTable';
import { VehicleFineQueryModal } from '@/components/frota/VehicleFineQueryModal';
import BateriasTable from '@/components/frota/BateriasTable';
import VehicleDocumentsTable from '@/components/frota/VehicleDocumentsTable';
import MobilizationPanel from '@/components/frota/MobilizationPanel';
import VeiculoFormModal from '@/components/frota/VeiculoFormModal';
import VeiculoEditModal from '@/components/frota/VeiculoEditModal';
import AbastecimentoFormModal from '@/components/frota/AbastecimentoFormModal';
import MultaFormModal from '@/components/frota/MultaFormModal';
import MultaViewModal from '@/components/frota/MultaViewModal';
import MultaDeleteDialog from '@/components/frota/MultaDeleteDialog';
import { FuelConsumptionStats } from '@/components/frota/FuelConsumptionStats';
import { FuelConsumptionOverview } from '@/components/frota/FuelConsumptionOverview';
import { DriverFuelConsumptionStats } from '@/components/frota/DriverFuelConsumptionStats';
import { DriverRankingStats } from '@/components/frota/DriverRankingStats';
import { ManutencoesTable } from '@/components/frota/ManutencoesTable';
import ManutencaoFormModal from '@/components/frota/ManutencaoFormModal';
import { ManutencaoViewModal } from '@/components/frota/ManutencaoViewModal';
import { ManutencaoDeleteDialog } from '@/components/frota/ManutencaoDeleteDialog';
import MotoristasTable from '@/components/frota/MotoristasTable';
import DriverFormModal from '@/components/frota/DriverFormModal';
import { DriverDeleteDialog } from '@/components/frota/DriverDeleteDialog';
import KmControlTable from '@/components/frota/KmControlTable';
import KmControlFormModal from '@/components/frota/KmControlFormModal';
import KmControlViewModal from '@/components/frota/KmControlViewModal';
import KmControlDeleteDialog from '@/components/frota/KmControlDeleteDialog';
import VehicleReportModal from '@/components/frota/VehicleReportModal';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import driverService from '@/services/driverService';
import maintenanceService from '@/services/maintenanceService';
import kmControlService from '@/services/kmControlService';
import { Vehicle, FuelRecord, Fine, KmControl } from '@/types/fleet';
import { Driver } from '@/types/driver';
import { VehicleMaintenance } from '@/types/maintenance';
import { reportLayoutService } from '@/services/reportLayoutService';
import { StandardReportTemplate } from '@/components/reporting/StandardReportTemplate';
import { Company } from '@/types/company';
import { companyService } from '@/services/companyService';

// Tipos para os componentes existentes (mantendo compatibilidade)
interface VeiculoComponent {
  id: string; // UUID
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  combustivel: string;
  quilometragem?: number;
  quilometragemInicial?: number;
  status: string;
  vehicleType?: string;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  photos?: string; // URLs das fotos separadas por vírgula
  capacidade?: number;
  observacoes?: string;
  // Campos adicionais para edição
  workPostId?: string;
  companyId?: string;
  departmentId?: string;
  department?: string;
  responsibleEmployeeId?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  insuranceExpiryDate?: string;
  documentationExpiryDate?: string;
}

interface AbastecimentoComponent {
  id: UUID;
  veiculo_id: UUID;
  data_abastecimento: string;
  quilometragem: number;
  litros: number;
  valor_litro: number;
  valor_total: number;
  posto?: string;
  veiculos?: {
    placa: string;
    marca: string;
    modelo: string;
  };
}

import { UUID } from '@/types/employee';

interface MultaComponent {
  id: UUID;
  veiculo_id: UUID;
  placa: string;
  marca: string;
  modelo: string;
  motorista_id?: string;
  motorista_nome?: string;
  motorista_cnh?: string;
  data_infracao: string;
  data_vencimento: string;
  valor: number;
  pontos: number;
  tipo_infracao: string;
  local_infracao: string;
  status: 'pendente' | 'paga' | 'vencida';
  observacoes?: string;
  driverPhone?: string;
  created_at: string;
  updated_at: string;
}

// Funções de mapeamento
const mapVehicleToComponent = (vehicle: Vehicle): VeiculoComponent => {
  return {
    id: vehicle.id.toString(), // já é string UUID
    placa: vehicle.plate,
    marca: vehicle.brand,
    modelo: vehicle.model,
    ano: vehicle.year,
    cor: vehicle.color,
    combustivel: vehicle.fuelType.toLowerCase(),
    quilometragem: vehicle.currentMileage,
    quilometragemInicial: undefined, // Campo não existe na interface Vehicle
    status: vehicle.status.toLowerCase(),
    vehicleType: vehicle.vehicleType,
    data_aquisicao: vehicle.acquisitionDate,
    valor_aquisicao: vehicle.acquisitionValue ? Number(vehicle.acquisitionValue) : undefined,
    photos: vehicle.photos ? Array.from(vehicle.photos).map(file => file.name).join(',') : undefined,
    capacidade: vehicle.capacity,
    observacoes: vehicle.notes,
    // Campos adicionais para edição
    workPostId: vehicle.workPostId,
    companyId: vehicle.companyId,
    departmentId: vehicle.departmentId,
    department: vehicle.department,
    responsibleEmployeeId: vehicle.responsibleEmployeeId,
    lastMaintenanceDate: vehicle.lastMaintenanceDate,
    nextMaintenanceDate: vehicle.nextMaintenanceDate,
    insuranceExpiryDate: vehicle.insuranceExpiryDate,
    documentationExpiryDate: vehicle.documentationExpiryDate
  };
};

const mapFuelRecordToComponent = (record: FuelRecord): AbastecimentoComponent => ({
  id: record.id.toString(),
  veiculo_id: record.vehicleId.toString(),
  data_abastecimento: record.date,
  quilometragem: record.mileage,
  litros: record.quantity,
  valor_litro: record.cost / record.quantity,
  valor_total: record.cost,
  posto: record.station,
  veiculos: {
    placa: record.vehiclePlate,
    marca: '',
    modelo: ''
  }
});

const Frota: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [maintenanceAlertFilter, setMaintenanceAlertFilter] = useState<string>('ALL');
  const [isVeiculoModalOpen, setIsVeiculoModalOpen] = useState(false);
  const [isVeiculoEditModalOpen, setIsVeiculoEditModalOpen] = useState(false);
  const [isAbastecimentoModalOpen, setIsAbastecimentoModalOpen] = useState(false);
  const [isManutencaoModalOpen, setIsManutencaoModalOpen] = useState(false);
  const [isManutencaoViewModalOpen, setIsManutencaoViewModalOpen] = useState(false);
  const [isManutencaoDeleteDialogOpen, setIsManutencaoDeleteDialogOpen] = useState(false);
  const [isManutencaoDeleting, setIsManutencaoDeleting] = useState(false);
  const [isVehicleReportModalOpen, setIsVehicleReportModalOpen] = useState(false);
  const [isVehicleImportModalOpen, setIsVehicleImportModalOpen] = useState(false);
  const [isMultaModalOpen, setIsMultaModalOpen] = useState(false);
  const [isAgregadoModalOpen, setIsAgregadoModalOpen] = useState(false);
  const [selectedAgregado, setSelectedAgregado] = useState<Vehicle | null>(null);

  // Debug: Monitorar mudanças nos estados dos modais
  useEffect(() => {
    console.log('🔍 Estado isVehicleReportModalOpen:', isVehicleReportModalOpen);
  }, [isVehicleReportModalOpen]);

  useEffect(() => {
    console.log('🔍 Estado isVeiculoModalOpen:', isVeiculoModalOpen);
  }, [isVeiculoModalOpen]);
  const [isMultaViewModalOpen, setIsMultaViewModalOpen] = useState(false);
  const [isMultaDeleteDialogOpen, setIsMultaDeleteDialogOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [isDriverDeleteDialogOpen, setIsDriverDeleteDialogOpen] = useState(false);
  const [isKmControlModalOpen, setIsKmControlModalOpen] = useState(false);
  const [isKmControlViewModalOpen, setIsKmControlViewModalOpen] = useState(false);
  const [isKmControlDeleteDialogOpen, setIsKmControlDeleteDialogOpen] = useState(false);
  const [isKmControlDeleting, setIsKmControlDeleting] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<VeiculoComponent | null>(null);
  const [selectedMulta, setSelectedMulta] = useState<MultaComponent | null>(null);
  const [selectedManutencao, setSelectedManutencao] = useState<VehicleMaintenance | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);
  const [selectedKmControl, setSelectedKmControl] = useState<KmControl | null>(null);

  // Estados para consulta veicular de multas (Detran/Senatran & Parte Diária)
  const [isFineQueryModalOpen, setIsFineQueryModalOpen] = useState(false);
  const [fineQueryPlate, setFineQueryPlate] = useState('');
  const [fineQueryRenavam, setFineQueryRenavam] = useState('');
  const [fineQueryUf, setFineQueryUf] = useState('MG');

  // Estados para relatórios
  const [showMultaSelection, setShowMultaSelection] = useState(false);
  const [fineToDownload, setFineToDownload] = useState<any>(null);
  const [empresa, setEmpresa] = useState<Company | undefined>(undefined);

  useEffect(() => {
    // Carregar dados da empresa para o layout premium
    const fetchCompany = async () => {
      try {
        const companies = await companyService.getAllCompanies();
        if (companies && companies.length > 0) {
          setEmpresa(companies[0]);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      }
    };
    fetchCompany();
  }, []);

  // Buscar veículos
  const {
    data: vehicles,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles
  } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      try {
        console.log('🔍 Iniciando busca de veículos...');

        // Debug authentication
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        console.log('🔍 Debug Auth - Token exists:', !!token);
        console.log('🔍 Debug Auth - User exists:', !!user);
        if (user) {
          const userData = JSON.parse(user);
          console.log('🔍 Debug Auth - User role:', userData.role);
          console.log('🔍 Debug Auth - User permissions:', userData.permissions);
        }

        const data = await fleetService.getVehicles();
        console.log('✅ Veículos carregados:', data);
        return data;
      } catch (error) {
        console.error('❌ Erro ao carregar veículos:', error);
        console.error('❌ Detalhes do erro:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000
  });

  // Buscar registros de abastecimento
  const {
    data: fuelRecords,
    isLoading: fuelRecordsLoading,
    error: fuelRecordsError,
    refetch: refetchFuelRecords
  } = useQuery({
    queryKey: ['fuelRecords'],
    queryFn: () => fleetService.getFuelRecords()
  });

  // Buscar multas
  const {
    data: fines,
    isLoading: finesLoading,
    error: finesError,
    refetch: refetchFines
  } = useQuery({
    queryKey: ['fines'],
    queryFn: () => fleetService.getFines(),
    retry: 2,
    retryDelay: 1000,
    staleTime: 0, // Sempre considerar dados stale para forçar refetch
    refetchOnWindowFocus: true, // Refetch quando a janela recebe foco
    refetchOnMount: 'always', // Sempre refetch ao montar o componente
    onSuccess: (data) => {
      console.log('✅ React Query: Multas carregadas com sucesso:', data);
      console.log('📊 React Query: Total de multas:', data?.length || 0);
    },
    onError: (error) => {
      console.error('❌ React Query: Erro ao carregar multas:', error);
    }
  });

  // Buscar lista de motoristas
  const {
    data: drivers,
    isLoading: driversLoading,
    error: driversError,
    refetch: refetchDrivers
  } = useQuery({
    queryKey: ['drivers'],
    queryFn: driverService.getDrivers,
    retry: 2,
    retryDelay: 1000
  });

  // Exclusão de motoristas
  const deleteDriverMutation = useMutation<void, any, string>({
    mutationFn: async (id: string) => {
      console.log('🗑️ Frota - Tentando excluir motorista ID:', id);
      await driverService.deleteDriver(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: "✅ Sucesso",
        description: "Motorista excluído com sucesso!"
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erro ao excluir motorista';
      console.error('❌ Frota - Erro ao excluir motorista:', error);
      toast({
        title: "❌ Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  // Buscar registros de manutenção
  const {
    data: maintenances,
    isLoading: maintenancesLoading,
    error: maintenancesError,
    refetch: refetchMaintenances
  } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => maintenanceService.getAllMaintenances(),
    retry: 3,
    retryDelay: 1000
  });

  // Log para depurar a quantidade de manutenções carregadas
  console.log('🔍 Frota.tsx - Manutenções carregadas:', maintenances?.length, maintenances);

  // Buscar controle de km
  const {
    data: kmControls,
    isLoading: kmControlsLoading,
    error: kmControlsError,
    refetch: refetchKmControls
  } = useQuery({
    queryKey: ['kmControls'],
    queryFn: () => {
      console.log('🔄 React Query: Executando queryFn para kmControls');
      return kmControlService.getKmControls();
    },
    retry: 2,
    retryDelay: 1000,
    onSuccess: (data) => {
      console.log('✅ React Query: kmControls carregados com sucesso:', data);
      console.log('📊 React Query: Total de registros kmControls:', data?.length || 0);
    },
    onError: (error) => {
      console.error('❌ React Query: Erro ao carregar kmControls:', error);
    }
  });

  // Função de mapeamento de multas (dentro do componente para ter acesso aos dados)
  const mapFineToComponent = (fine: Fine): MultaComponent => {
    console.log('🔍 Mapeando multa:', fine);
    console.log('🔍 Dados do motorista na multa:', {
      driverId: fine.driverId,
      driverName: fine.driverName,
      driverLicenseNumber: fine.driverLicenseNumber
    });

    // Encontrar o veículo correspondente
    const vehicle = vehicles?.find(v => v.id === fine.vehicleId);
    console.log('🚗 Veículo encontrado para multa:', vehicle);

    const mappedMulta = {
      id: (fine?.id != null ? fine.id.toString() : ''),
      veiculo_id: (fine?.vehicleId != null ? fine.vehicleId.toString() : ''),
      placa: fine.vehiclePlate || '',
      marca: vehicle?.brand || '',
      modelo: vehicle?.model || '',
      motorista_id: fine.driverId || undefined,
      motorista_nome: fine.driverName || undefined,
      motorista_cnh: fine.driverLicenseNumber || undefined,
      data_infracao: fine.date,
      data_vencimento: fine.dueDate || fine.date,
      valor: fine.amount,
      pontos: fine.points || 0,
      tipo_infracao: fine.description,
      local_infracao: fine.location,
      status: fine.status === 'PAID' ? 'paga' : fine.status === 'PENDING' ? 'pendente' : 'vencida',
      observacoes: undefined,
      driverPhone: fine.driverPhone || undefined,
      created_at: fine.createdAt,
      updated_at: fine.createdAt
    };

    console.log('✅ Multa mapeada:', mappedMulta);
    console.log('✅ Dados do motorista mapeados:', {
      motorista_id: mappedMulta.motorista_id,
      motorista_nome: mappedMulta.motorista_nome,
      motorista_cnh: mappedMulta.motorista_cnh
    });
    return mappedMulta;
  };

  // Mapear dados para componentes
  const veiculosFiltrados = vehicles?.filter(v => {
    const temId = v && v.id;
    const temPlate = v && v.plate;
    const temModel = v && v.model;
    const temBrand = v && v.brand;

    return temId && temPlate && temModel && temBrand;
  });

  const veiculosComponent = veiculosFiltrados?.map(mapVehicleToComponent) || [];
  const abastecimentosComponent = fuelRecords?.map(mapFuelRecordToComponent) || [];
  const multasComponent = fines?.map(mapFineToComponent) || [];

  // Log para debug das multas
  console.log('🔍 Debug Multas:');
  console.log('  - fines (dados brutos):', fines);
  console.log('  - multasComponent (mapeadas):', multasComponent);
  console.log('  - Quantidade de multas:', multasComponent.length);

  // Error handling
  if (vehiclesError) {
    console.error('❌ Erro ao carregar veículos:', vehiclesError);
  }

  // Calcular estatísticas
  const vehiclesActive = vehicles?.filter(v => v.status === 'ACTIVE').length || 0;
  const totalFuelRecords = fuelRecords?.length || 0;
  const totalFuelCost = fuelRecords?.reduce((acc, curr) => acc + curr.cost, 0) || 0;
  const totalFines = fines?.length || 0;
  const totalFinesAmount = fines?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const pendingFines = fines?.filter(f => f.status === 'PENDING').length || 0;
  const aggregatedVehicles = vehicles?.filter(v => (v as any).isAggregated === true).length || 0;

  // Calcular multas próximas do vencimento (7 dias)
  const finesNearDue = multasComponent.filter(multa => {
    if (multa.status === 'paga') return false;
    const dueDate = new Date(multa.data_vencimento);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });

  // Calcular multas vencidas
  const overdueFines = multasComponent.filter(multa => {
    if (multa.status === 'paga') return false;
    const dueDate = new Date(multa.data_vencimento);
    const today = new Date();
    return dueDate < today;
  });

  const handleVeiculoSuccess = () => {
    refetchVehicles();
    setIsVeiculoModalOpen(false);
  };

  const handleVeiculoEdit = (veiculo: VeiculoComponent) => {
    setSelectedVeiculo(veiculo);
    setIsVeiculoEditModalOpen(true);
  };

  const handleVeiculoEditSuccess = () => {
    refetchVehicles();
    setIsVeiculoEditModalOpen(false);
    setSelectedVeiculo(null);
  };

  const handleDeleteVeiculo = (veiculo: VeiculoComponent) => {
    // O VeiculosTable já tem seu próprio modal de exclusão
    // Esta função é chamada mas o modal é gerenciado internamente pelo VeiculosTable
    console.log('🗑️ Exclusão de veículo solicitada:', veiculo.placa);
  };

  const handleViewVeiculo = (veiculo: VeiculoComponent) => {
    setSelectedVeiculo(veiculo);
    // Aqui você pode implementar a lógica de visualização
  };

  const handleAbastecimentoSuccess = () => {
    refetchFuelRecords();
    setIsAbastecimentoModalOpen(false);
  };

  const handleMultaSuccess = async () => {
    console.log('✅ Multa salva com sucesso! Atualizando lista...');

    try {
      // Pequeno delay para garantir que o backend processou a operação
      await new Promise(resolve => setTimeout(resolve, 200));

      // Invalidar queries para forçar atualização
      await queryClient.invalidateQueries({ queryKey: ['fines'], exact: true });

      // Refetch explícito e aguardar conclusão
      const result = await refetchFines();
      console.log('🔄 Refetch concluído. Novos dados:', result.data);
      console.log('📊 Total de multas após atualização:', result.data?.length || 0);

      // Fechar modal após atualizar os dados
      setIsMultaModalOpen(false);
      setSelectedMulta(null);

      // Mostrar toast de sucesso
      toast({
        title: 'Sucesso!',
        description: 'Multa salva e lista atualizada com sucesso.',
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar lista de multas:', error);
      // Fechar modal mesmo em caso de erro
      setIsMultaModalOpen(false);
      setSelectedMulta(null);
    }
  };

  const handleViewMulta = (multa: MultaComponent) => {
    setSelectedMulta(multa);
    setIsMultaViewModalOpen(true);
  };

  const handleEditMulta = (multa: MultaComponent) => {
    setSelectedMulta(multa);
    setIsMultaModalOpen(true);
  };

  const handleDeleteMulta = (multa: MultaComponent) => {
    setSelectedMulta(multa);
    setIsMultaDeleteDialogOpen(true);
  };

  const handleDeleteMultipleMultas = async (selectedIds: string[]) => {
    try {
      console.log('🗑️ Excluindo multas:', selectedIds);

      // Confirmar exclusão
      const confirmed = window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} multa(s) selecionada(s)?\n\nEsta ação não pode ser desfeita.`
      );

      if (!confirmed) {
        return;
      }

      // Excluir cada multa
      for (const id of selectedIds) {
        await fleetService.deleteFine(id);
      }

      console.log('✅ Multas excluídas! Atualizando lista...');

      // Invalidar queries para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['fines'] });

      // Atualizar lista
      await refetchFines();

      console.log('🔄 Lista de multas atualizada após exclusão múltipla!');

      toast({
        title: 'Sucesso!',
        description: `${selectedIds.length} multa(s) excluída(s) com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro ao excluir multas:', error);
      toast({
        title: 'Erro!',
        description: 'Erro ao excluir multas. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const generatePDFReport = async (multa: any) => {
    setFineToDownload(multa);
    // Wait for state to update and layout to render
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const printElement = document.getElementById('frota-multa-printable');
          if (!printElement) throw new Error('Elemento de impressão não encontrado');

          await reportLayoutService.generatePremiumPDF(printElement, {
            title: 'Relatório de Multa de Trânsito',
            filename: `relatorio_multa_${multa.placa}_${new Date().toISOString().split('T')[0]}.pdf`,
            company: empresa
          });

          setFineToDownload(null);
          resolve(true);
        } catch (error: any) {
          console.error('❌ Erro ao gerar PDF:', error);
          setFineToDownload(null);
          reject(error);
        }
      }, 100);
    });
  };

  const handleGenerateSingleFineReport = async (multaId: string, format: 'pdf' | 'excel') => {
    try {
      console.log(`📄 Gerando relatório ${format.toUpperCase()} para multa:`, multaId);

      // Encontrar a multa específica nos dados mapeados
      const multa = multasComponent?.find(m => m.id === multaId);
      if (!multa) {
        toast({
          title: 'Erro!',
          description: 'Multa não encontrada.',
          variant: 'destructive',
        });
        return;
      }

      if (format === 'pdf') {
        console.log('📄 Gerando PDF para multa:', multa);
        await generatePDFReport(multa);
        console.log('✅ PDF gerado com sucesso');
      } else {
        console.log('📊 Gerando Excel para multa:', multaId);
        // Para Excel, usar o serviço original
        const response = await fleetService.generateFineReportExcel({ selectedIds: [multaId] });

        // Criar blob e fazer download
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const filename = `relatorio_multa_${multa.placa}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Criar URL do blob e fazer download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('✅ Excel gerado com sucesso');
      }

      toast({
        title: 'Sucesso!',
        description: `Relatório ${format.toUpperCase()} da multa gerado com sucesso.`,
      });
    } catch (error) {
      console.error(`❌ Erro ao gerar relatório ${format.toUpperCase()}:`, error);
      toast({
        title: 'Erro!',
        description: `Erro ao gerar relatório ${format.toUpperCase()}.`,
        variant: 'destructive',
      });
    }
  };

  const handleOpenDriverModal = (driver: Driver | null = null) => {
    setSelectedDriver(driver);
    setIsDriverModalOpen(true);
  };

  const handleDriverSuccess = () => {
    refetchDrivers();
    setIsDriverModalOpen(false);
    setSelectedDriver(null);
  };

  const handleManutencaoSuccess = () => {
    refetchMaintenances();
    setIsManutencaoModalOpen(false);
    setSelectedManutencao(null);
  };

  // Funções para ações de manutenção
  const handleViewManutencao = (maintenance: VehicleMaintenance) => {
    console.log('🔍 handleViewManutencao - Dados originais:', maintenance);

    // Usar apenas os dados reais da manutenção
    setSelectedManutencao(maintenance);
    setIsManutencaoViewModalOpen(true);
  };

  const handleEditManutencao = (maintenance: VehicleMaintenance) => {
    console.log('🔧 handleEditManutencao - Iniciando edição:', {
      maintenance,
      isManutencaoModalOpen: isManutencaoModalOpen,
      isManutencaoViewModalOpen: isManutencaoViewModalOpen
    });

    setSelectedManutencao(maintenance);
    setIsManutencaoViewModalOpen(false);
    setIsManutencaoModalOpen(true);

    console.log('🔧 handleEditManutencao - Estados após mudança:', {
      selectedManutencao: maintenance,
      isManutencaoModalOpen: true,
      isManutencaoViewModalOpen: false
    });
  };

  const handleDeleteManutencao = async (maintenance: unknown) => {
    setIsManutencaoDeleting(true);
    try {
      await maintenanceService.deleteMaintenance(maintenance.id);
      toast({
        title: "Manutenção Excluída",
        description: "A manutenção foi excluída com sucesso!",
        variant: "default"
      });
      refetchMaintenances();
      setIsManutencaoDeleteDialogOpen(false);
      setSelectedManutencao(null);
    } catch (error: unknown) {
      console.error('Erro ao excluir manutenção:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao excluir manutenção",
        variant: "destructive"
      });
    } finally {
      setIsManutencaoDeleting(false);
    }
  };

  // Funções para controle de km
  const handleKmControlSuccess = (kmControl: KmControl) => {
    toast({
      title: "Sucesso",
      description: "Controle de km salvo com sucesso!",
      variant: "default"
    });
    refetchKmControls();
    setIsKmControlModalOpen(false);
    setSelectedKmControl(null);
  };

  const handleEditKmControl = (kmControl: KmControl) => {
    setSelectedKmControl(kmControl);
    setIsKmControlModalOpen(true);
  };

  const handleViewKmControl = (kmControl: KmControl) => {
    setSelectedKmControl(kmControl);
    setIsKmControlViewModalOpen(true);
  };

  const handleDeleteKmControl = (kmControl: KmControl) => {
    setSelectedKmControl(kmControl);
    setIsKmControlViewModalOpen(false);
    setIsKmControlDeleteDialogOpen(true);
  };

  const handleConfirmDeleteKmControl = async () => {
    if (!selectedKmControl) return;

    try {
      setIsKmControlDeleting(true);
      await kmControlService.deleteKmControl(selectedKmControl.id);
      toast({
        title: "Sucesso",
        description: "Controle de km excluído com sucesso!",
        variant: "default"
      });
      setIsKmControlDeleteDialogOpen(false);
      setSelectedKmControl(null);
      refetchKmControls();
    } catch (error: unknown) {
      console.error('Erro ao excluir controle de km:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao excluir controle de km",
        variant: "destructive"
      });
    } finally {
      setIsKmControlDeleting(false);
    }
  };

  // Função para criar dados de teste de KM
  const handleCreateKmTestData = async () => {
    try {
      console.log('🔧 Criando dados de teste de KM...');
      await kmControlService.createTestData();
      toast({
        title: "Sucesso",
        description: "Dados de teste criados com sucesso!",
        variant: "default"
      });
      refetchKmControls();
    } catch (error: unknown) {
      console.error('Erro ao criar dados de teste:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Erro ao criar dados de teste",
        variant: "destructive"
      });
    }
  };

  // Loading state
  if (vehiclesLoading || fuelRecordsLoading || finesLoading || driversLoading || maintenancesLoading || kmControlsLoading) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
          <span className="ml-2 text-seguranca-lightgray">Carregando dados da frota...</span>
        </div>
      </StandardLayout>
    );
  }

  // Error state para veículos
  if (vehiclesError) {
    return (
      <StandardLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-500 mb-2">Erro ao carregar veículos</h3>
            <p className="text-gray-400 mb-4">Não foi possível carregar a lista de veículos.</p>
            <Button onClick={() => refetchVehicles()} className="bg-seguranca-red hover:bg-seguranca-darkred">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Error state
  if (fuelRecordsError || finesError || driversError || maintenancesError || kmControlsError) {
    return (
      <StandardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-seguranca-red mx-auto mb-2" />
            <p className="text-seguranca-lightgray">Erro ao carregar dados da frota</p>
            <Button
              onClick={() => {
                refetchVehicles();
                refetchFuelRecords();
                refetchFines();
                refetchMaintenances();
                refetchKmControls();
              }}
              className="mt-2 bg-seguranca-red hover:bg-seguranca-darkred"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      </StandardLayout>
    );
  }

  // Função para gerar HTML do relatório
  const generateHTMLReport = (finesData: any[]) => {
    const currentDate = new Date().toLocaleDateString('pt-BR');

    let html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Multas</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #333; 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 10px;
        }
        .info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 12px; 
            text-align: left; 
        }
        th { 
            background-color: #dc2626; 
            color: white;
            font-weight: bold; 
        }
        tr:nth-child(even) { 
            background-color: #f9f9f9; 
        }
        tr:hover {
            background-color: #f0f0f0;
        }
        .status-paga { 
            color: #16a34a; 
            font-weight: bold; 
        }
        .status-pendente { 
            color: #ea580c; 
            font-weight: bold; 
        }
        .status-cancelada { 
            color: #dc2626; 
            font-weight: bold; 
        }
        .valor {
            text-align: right;
            font-weight: bold;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RELATÓRIO DE MULTAS</h1>
        
        <div class="info">
            <p><strong>Data de Geração:</strong> ${currentDate}</p>
            <p><strong>Total de Multas:</strong> ${finesData.length}</p>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Veículo</th>
                    <th>Motorista</th>
                    <th>Data Infração</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Vencimento</th>
                </tr>
            </thead>
            <tbody>`;

    finesData.forEach(fine => {
      const statusClass = fine.status === 'Paga' ? 'status-paga' :
        fine.status === 'Pendente' ? 'status-pendente' : 'status-cancelada';

      html += `
                <tr>
                    <td>${fine.vehiclePlate}</td>
                    <td>${fine.driverName || 'Não informado'}</td>
                    <td>${fine.infractionDate}</td>
                    <td>${fine.description}</td>
                    <td class="valor">R$ ${fine.amount}</td>
                    <td class="${statusClass}">${fine.status}</td>
                    <td>${fine.dueDate}</td>
                </tr>`;
    });

    html += `
            </tbody>
        </table>
        
        <div class="footer">
            <p>Relatório gerado automaticamente pelo sistema Secure Guard</p>
        </div>
    </div>
</body>
</html>`;

    return html;
  };

  // Função para gerar relatórios de multas
  const handleGenerateFineReport = async (format: 'pdf' | 'excel') => {
    try {
      console.log(`🔍 Gerando relatório ${format.toUpperCase()} de multas...`);

      const params = {
        // Adicionar filtros se necessário
        startDate: undefined,
        endDate: undefined,
        vehicleFilter: undefined,
        driverFilter: undefined,
        statusFilter: undefined
      };

      let blob: Blob;
      let filename: string;

      if (format === 'pdf') {
        // Usar dados das multas já carregadas
        const finesData = fines?.map(fine => ({
          id: fine.id,
          vehiclePlate: fine.placa,
          vehicleBrand: fine.marca,
          vehicleModel: fine.modelo,
          driverName: fine.motorista_nome || 'Não informado',
          driverLicenseNumber: fine.motorista_cnh || '',
          infractionDate: fine.data_infracao,
          description: fine.tipo_infracao,
          amount: fine.valor.toString(),
          location: fine.local_infracao,
          status: fine.status === 'paga' ? 'Paga' : fine.status === 'pendente' ? 'Pendente' : 'Cancelada',
          dueDate: fine.data_vencimento,
          paymentDate: null,
          createdAt: fine.created_at,
          overdue: false
        })) || [];

        // Gerar HTML do relatório
        const htmlContent = generateHTMLReport(finesData);

        // Criar blob com HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        filename = `relatorio_multas_${new Date().toISOString().split('T')[0]}.html`;

        // Criar URL do blob e fazer download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        blob = await fleetService.generateFineReportExcel(params);
        filename = `relatorio_multas_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Criar URL do blob e fazer download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      console.log(`✅ Relatório ${format.toUpperCase()} gerado com sucesso:`, filename);
    } catch (error) {
      console.error(`❌ Erro ao gerar relatório ${format.toUpperCase()}:`, error);
      // Aqui você pode adicionar uma notificação de erro
    }
  };


  const generateMultiplePDFReport = async (multas: any[]) => {
    try {
      // Criar elemento temporário para renderizar o relatório
      const reportElement = document.createElement('div');
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.top = '-9999px';
      reportElement.style.width = '800px';
      reportElement.style.backgroundColor = 'white';
      reportElement.style.padding = '20px';
      reportElement.style.fontFamily = 'Arial, sans-serif';

      const currentDate = new Date().toLocaleDateString('pt-BR');

      // Gerar HTML para múltiplas multas
      let multasHTML = '';
      multas.forEach((multa, index) => {
        multasHTML += `
          <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; page-break-inside: avoid;">
            <h4 style="color: #333; margin-top: 0; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
              MULTA ${index + 1} - ${multa.plate}
            </h4>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong style="color: #000000; font-weight: bold;">Placa do Veículo:</strong><br>
                <span style="font-size: 16px; color: #d32f2f; font-weight: bold;">${multa.plate}</span>
              </div>
              <div>
                <strong style="color: #000000; font-weight: bold;">Status:</strong><br>
                <span style="color: ${multa.status === 'PAID' ? '#2e7d32' : multa.status === 'PENDING' ? '#f57c00' : '#d32f2f'}; font-weight: bold;">
                  ${multa.status === 'PAID' ? 'PAGA' : multa.status === 'PENDING' ? 'PENDENTE' : 'CANCELADA'}
                </span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong style="color: #000000; font-weight: bold;">Marca/Modelo:</strong><br>
                <span style="color: #000000; font-weight: 500;">${multa.brand} ${multa.model}</span>
              </div>
              <div>
                <strong style="color: #000000; font-weight: bold;">Motorista:</strong><br>
                <span style="color: #000000; font-weight: 500;">${multa.driverName || 'Não informado'}</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong style="color: #000000; font-weight: bold;">Data da Infração:</strong><br>
                <span style="color: #000000; font-weight: 500;">${new Date(multa.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div>
                <strong style="color: #000000; font-weight: bold;">Data de Vencimento:</strong><br>
                <span style="color: #000000; font-weight: 500;">${new Date(multa.dueDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #000000; font-weight: bold;">Tipo de Infração:</strong><br>
              <span style="color: #000000; font-weight: 500;">${multa.description}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #000000; font-weight: bold;">Local da Infração:</strong><br>
              <span style="color: #000000; font-weight: 500;">${multa.location}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong style="color: #000000; font-weight: bold;">Valor da Multa:</strong><br>
                <span style="font-size: 18px; color: #d32f2f; font-weight: bold;">
                  R$ ${multa.amount.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div>
                <strong style="color: #000000; font-weight: bold;">Pontos na CNH:</strong><br>
                <span style="color: #000000; font-weight: 500;">${multa.points || 0} pontos</span>
              </div>
            </div>
          </div>
        `;
      });

      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; margin-bottom: 10px;">RELATÓRIO DE MULTAS</h1>
          <h2 style="color: #666; font-size: 18px; margin: 0;">PROMOVER - Vigilância Patrimonial LTDA</h2>
          <p style="color: #888; margin: 5px 0;">Data de Geração: ${currentDate}</p>
          <p style="color: #888; margin: 5px 0;">Total de Multas: ${multas.length}</p>
        </div>
        
        ${multasHTML}
        
        <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
          <p>Relatório gerado automaticamente pelo Sistema Secured Guard</p>
          <p>Data: ${currentDate} | Hora: ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      `;

      document.body.appendChild(reportElement);

      // Capturar como imagem
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      // Remover elemento temporário
      document.body.removeChild(reportElement);

      // Criar PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Salvar PDF
      const filename = `relatorio_multas_selecionadas_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      return true;
    } catch (error) {
      console.error('❌ Erro ao gerar PDF múltiplo:', error);
      throw error;
    }
  };

  // Função para geração de relatórios com seleção individual
  const handleGenerateReportWithSelection = async (selectedIds: string[], format: 'pdf' | 'excel') => {
    try {
      console.log(`Gerando relatório ${format} para multas selecionadas:`, selectedIds);

      // Filtrar multas selecionadas
      const selectedFines = fines?.filter(fine => selectedIds.includes(fine.id)) || [];

      if (selectedFines.length === 0) {
        toast({
          title: 'Atenção!',
          description: 'Nenhuma multa selecionada.',
          variant: 'destructive',
        });
        return;
      }

      if (format === 'pdf') {
        // Converter dados das multas selecionadas para o formato esperado
        const multasData = selectedFines.map(fine => ({
          id: fine.id,
          plate: fine.placa,
          brand: fine.marca,
          model: fine.modelo,
          driverName: fine.motorista_nome || 'Não informado',
          driverLicenseNumber: fine.motorista_cnh || '',
          date: fine.data_infracao,
          description: fine.tipo_infracao,
          amount: parseFloat(fine.valor) || 0,
          location: fine.local_infracao,
          status: fine.status === 'paga' ? 'PAID' : fine.status === 'pendente' ? 'PENDING' : 'CANCELLED',
          dueDate: fine.data_vencimento,
          points: fine.pontos || 0,
          createdAt: fine.created_at
        }));

        await generateMultiplePDFReport(multasData);
      } else {
        // Gerar relatório Excel
        const response = await fleetService.generateFineReportExcel({ selectedIds });

        // Criar blob e fazer download
        const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio_multas_selecionadas_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Sucesso!',
        description: `Relatório ${format.toUpperCase()} gerado com ${selectedFines.length} multa(s) selecionada(s).`,
      });
    } catch (error) {
      console.error(`Erro ao gerar relatório ${format}:`, error);
      toast({
        title: 'Erro!',
        description: `Erro ao gerar relatório ${format.toUpperCase()}.`,
        variant: 'destructive',
      });
    }
  };

  return (
    <StandardLayout title="Gestão de Frota" subtitle="Controle completo da frota de veículos">
      <div className="space-y-6">

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Veículos Ativos</CardTitle>
              <Car className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{vehiclesActive}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Total Abastecimentos</CardTitle>
              <Fuel className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{totalFuelRecords}</div>
              <p className="text-xs text-gray-400">R$ {totalFuelCost.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Multas Pendentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">{pendingFines}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Valor Total Multas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-seguranca-yellow" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-seguranca-lightgray">R$ {totalFinesAmount.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-seguranca-graphite border-gray-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-seguranca-lightgray">Veículos Agregados</CardTitle>
              <Users className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{aggregatedVehicles}</div>
              <p className="text-xs text-gray-400">Veículos de terceiros</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="veiculos" className="w-full">
          <TabsList className="flex items-center justify-start h-auto w-full bg-seguranca-graphite border-gray-600 overflow-x-auto overflow-y-hidden p-1 gap-1">
            <TabsTrigger value="veiculos" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Veículos
            </TabsTrigger>
            <TabsTrigger value="abastecimentos" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Abastecimentos
            </TabsTrigger>
            <TabsTrigger value="manutencoes" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Manutenções
            </TabsTrigger>
            <TabsTrigger value="controle-km" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Controle de KM
            </TabsTrigger>
            <TabsTrigger value="estatisticas" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Estatísticas
            </TabsTrigger>
            <TabsTrigger value="motoristas" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Motoristas
            </TabsTrigger>
            <TabsTrigger value="multas" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Multas
            </TabsTrigger>
            <TabsTrigger value="baterias" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Baterias
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Documentos
            </TabsTrigger>
            <TabsTrigger value="agregados" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              👥 Agregados
            </TabsTrigger>
            <TabsTrigger value="mobilizacao" className="flex-shrink-0 min-w-max px-4 py-2 data-[state='active']:bg-seguranca-black data-[state='active']:text-seguranca-yellow">
              Mobilização (PRD)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="veiculos" className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1 max-w-sm w-full">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Buscar por placa, marca ou modelo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 bg-seguranca-black border-gray-600 text-seguranca-lightgray"
                  />
                </div>
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2 text-sm focus:border-seguranca-yellow focus:ring-1 focus:ring-seguranca-yellow"
                >
                  <option value="ALL">🚌 Todos os Tipos</option>
                  <option value="BUS_ROAD">🚌 Ônibus Rodoviário</option>
                  <option value="BUS_LUXURY_TOURISM">🚌✨ Ônibus Luxo Turismo</option>
                  <option value="BUS_URBAN">🏙️ Ônibus Urbano</option>
                  <option value="MINIBUS">🚐 Micro-ônibus</option>
                  <option value="VAN">🚐 Van</option>
                  <option value="CAR_UTILITY">🚗 Carro Utilitário</option>
                  <option value="CAR">🚗 Carro</option>
                  <option value="TRUCK">🚛 Caminhão</option>
                  <option value="MOTORCYCLE">🏍️ Motocicleta</option>
                  <option value="PICKUP">🛻 Pickup</option>
                  <option value="SUV">🚙 SUV</option>
                  <option value="OTHER">❓ Outro</option>
                </select>
                <select
                  value={maintenanceAlertFilter}
                  onChange={(e) => setMaintenanceAlertFilter(e.target.value)}
                  className="bg-seguranca-black border border-gray-600 text-seguranca-lightgray rounded-md px-3 py-2 text-sm focus:border-seguranca-yellow focus:ring-1 focus:ring-seguranca-yellow"
                >
                  <option value="ALL">🔧 Manutenção: Todas</option>
                  <option value="OVERDUE">🔴 Vencida</option>
                  <option value="UPCOMING">🟡 Próxima</option>
                  <option value="OK">🟢 Em Dia</option>
                  <option value="NO_SCHEDULE">⚪ Sem Plano</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsVehicleImportModalOpen(true)}
                  variant="outline"
                  className="border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black font-semibold"
                >
                  <FileSpreadsheet size={16} className="mr-2" />
                  Importar Excel
                </Button>
                <Button
                  onClick={() => setIsVehicleReportModalOpen(true)}
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                >
                  <FileText size={16} className="mr-2" />
                  Relatório
                </Button>
                <Button
                  onClick={() => setIsVeiculoModalOpen(true)}
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  <Plus size={16} className="mr-2" />
                  Novo Veículo
                </Button>
              </div>
            </div>

            <VeiculosTable
              veiculos={vehicles ? vehicles.map(mapVehicleToComponent) : []}
              searchTerm={searchTerm}
              vehicleTypeFilter={vehicleTypeFilter}
              maintenanceAlertFilter={maintenanceAlertFilter}
              maintenances={maintenances}
              onRefresh={refetchVehicles}
              onEdit={handleVeiculoEdit}
              onDelete={handleDeleteVeiculo}
              onView={handleViewVeiculo}
              onViewMaintenance={(maintenance) => {
                setSelectedManutencao(maintenance);
                setIsManutencaoViewModalOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="abastecimentos" className="mt-6 space-y-4">
            <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold">Controle de Abastecimento</h3>
              <Button
                onClick={() => setIsAbastecimentoModalOpen(true)}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus size={16} className="mr-2" />
                Novo Abastecimento
              </Button>
            </div>
            <AbastecimentosTable
              abastecimentos={fuelRecords || []}
              veiculos={veiculosComponent}
              onRefresh={refetchFuelRecords}
            />
          </TabsContent>

          <TabsContent value="manutencoes" className="mt-6 space-y-4">
            <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Controle de Manutenção
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsManutencaoModalOpen(true)}
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  <Plus size={16} className="mr-2" />
                  Nova Manutenção
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-400 hover:bg-gray-700"
                  onClick={() => refetchMaintenances()}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>

            {/* Estatísticas rápidas de manutenção */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-sm text-gray-400">Agendadas</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {maintenances?.filter(m => m.status === 'SCHEDULED').length || 0}
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Em Andamento</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {maintenances?.filter(m => m.status === 'IN_PROGRESS').length || 0}
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-400">Urgentes</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {maintenances?.filter(m => m.priority === 'URGENT').length || 0}
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Custo Total</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  R$ {maintenances?.reduce((total, m) => total + (m.cost || 0), 0).toFixed(2) || '0,00'}
                </div>
              </div>
            </div>

            <ManutencoesTable
              data={maintenances || []}
              onRefresh={refetchMaintenances}
              onView={handleViewManutencao}
              onEdit={handleEditManutencao}
              onDelete={handleDeleteManutencao}
            />
          </TabsContent>

          <TabsContent value="controle-km" className="mt-6 space-y-4">
            <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                <Car className="h-5 w-5" />
                Controle de Quilometragem
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsKmControlModalOpen(true)}
                  className="bg-seguranca-red hover:bg-seguranca-darkred"
                >
                  <Plus size={16} className="mr-2" />
                  Novo Registro
                </Button>
              </div>
            </div>

            {/* Estatísticas rápidas de KM */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-seguranca-yellow" />
                  <span className="text-sm text-gray-400">Total Registros</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {kmControls?.length || 0}
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Este Mês</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {(() => {
                    const parseLocal = (v: string) => {
                      if (!v) return new Date(NaN);
                      const m1 = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      if (m1) return new Date(Number(m1[1]), Number(m1[2]) - 1, Number(m1[3]));
                      const m2 = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                      if (m2) return new Date(Number(m2[3]), Number(m2[2]) - 1, Number(m2[1]));
                      return new Date(v);
                    };
                    const cm = new Date().getMonth();
                    const cy = new Date().getFullYear();
                    return kmControls?.filter(km => {
                      const dt = parseLocal(km.date);
                      return dt.getMonth() === cm && dt.getFullYear() === cy;
                    }).length || 0;
                  })()}
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">KM Total</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {kmControls && Array.isArray(kmControls) && kmControls.length > 0
                    ? kmControls.reduce((total, km) => {
                      const kmTotal = km.totalKm || 0;
                      return total + (isNaN(kmTotal) ? 0 : kmTotal);
                    }, 0).toLocaleString()
                    : 0} km
                </div>
              </div>

              <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-gray-400">Veículos Ativos</span>
                </div>
                <div className="text-2xl font-bold text-seguranca-lightgray mt-1">
                  {(() => {
                    const idsOrPlates = (kmControls || []).map(km => km.vehicleId || km.vehiclePlate || '').filter(Boolean);
                    return new Set(idsOrPlates).size || 0;
                  })()}
                </div>
              </div>
            </div>

            <KmControlTable
              kmControls={kmControls || []}
              onRefresh={refetchKmControls}
              onCreate={() => setIsKmControlModalOpen(true)}
              onView={handleViewKmControl}
              onEdit={handleEditKmControl}
              onDelete={handleDeleteKmControl}
            />
          </TabsContent>

          <TabsContent value="estatisticas" className="mt-6 space-y-6">
            <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-seguranca-yellow" />
                Estatísticas e Relatórios
              </h3>
            </div>
            <FuelConsumptionOverview vehicles={veiculosComponent} />
            <FuelConsumptionStats vehicles={veiculosComponent} />
          </TabsContent>

          <TabsContent value="motoristas" className="mt-6 space-y-6">
            <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                <Plus size={16} className="text-seguranca-yellow" />
                Gestão de Motoristas
              </h3>
              <Button
                onClick={() => handleOpenDriverModal()}
                className="bg-seguranca-red hover:bg-seguranca-darkred"
              >
                <Plus size={16} className="mr-2" />
                Novo Motorista
              </Button>
            </div>

            {driversLoading && (
              <div className="flex items-center justify-center p-8 bg-seguranca-black border border-gray-600 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-seguranca-yellow" />
                <span className="ml-2 text-seguranca-lightgray">Carregando motoristas...</span>
              </div>
            )}

            {driversError && (
              <div className="text-red-500 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <AlertTriangle className="inline-block mr-2" />
                Erro ao carregar os motoristas.
              </div>
            )}

            {drivers && (
              <div className="space-y-6">
                <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
                  <MotoristasTable
                    drivers={drivers || []}
                    onAdd={() => handleOpenDriverModal()}
                    onEdit={handleOpenDriverModal}
                    onDelete={(driver) => {
                      setDriverToDelete(driver);
                      setIsDriverDeleteDialogOpen(true);
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DriverFuelConsumptionStats drivers={drivers || []} />
                  <DriverRankingStats drivers={drivers || []} />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="multas" className="mt-6">
            <div className="space-y-6">
              {/* Alertas de Multas */}
              {(finesNearDue.length > 0 || overdueFines.length > 0) && (
                <div className="space-y-4">
                  {/* Multas Vencidas */}
                  {overdueFines.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-800">
                          <AlertTriangle className="text-red-600" />
                          Multas Vencidas ({overdueFines.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {overdueFines.slice(0, 3).map(multa => (
                            <div key={multa.id} className="flex justify-between items-center p-2 bg-white rounded border">
                              <div>
                                <span className="font-medium">{multa.placa}</span>
                                <span className="text-sm text-gray-600 ml-2">{multa.tipo_infracao}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-red-700">
                                  R$ {multa.valor.toFixed(2)}
                                </div>
                                <div className="text-sm text-red-600">
                                  Venceu em {new Date(multa.data_vencimento).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          ))}
                          {overdueFines.length > 3 && (
                            <p className="text-sm text-red-600 text-center">
                              E mais {overdueFines.length - 3} multa(s) vencida(s)...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Multas Próximas do Vencimento */}
                  {finesNearDue.length > 0 && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="text-yellow-600" />
                          Multas Próximas do Vencimento ({finesNearDue.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {finesNearDue.slice(0, 3).map(multa => {
                            const dueDate = new Date(multa.data_vencimento);
                            const today = new Date();
                            const diffTime = dueDate.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            return (
                              <div key={multa.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                <div>
                                  <span className="font-medium">{multa.placa}</span>
                                  <span className="text-sm text-gray-600 ml-2">{multa.tipo_infracao}</span>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-yellow-700">
                                    R$ {multa.valor.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-yellow-600">
                                    Vence em {diffDays} dia(s) - {dueDate.toLocaleDateString('pt-BR')}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {finesNearDue.length > 3 && (
                            <p className="text-sm text-yellow-600 text-center">
                              E mais {finesNearDue.length - 3} multa(s) vencendo em breve...
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Tabela de Multas */}
              <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Gestão de Multas
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMultaSelection(!showMultaSelection)}
                    className={showMultaSelection ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-600 text-seguranca-lightgray hover:bg-seguranca-black"}
                  >
                    {showMultaSelection ? 'Desativar Seleção' : 'Ativar Seleção'}
                  </Button>
                </div>
                  <Button
                    onClick={() => {
                      setFineQueryPlate('');
                      setFineQueryRenavam('');
                      setFineQueryUf('MG');
                      setIsFineQueryModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
                  >
                    <Search size={16} />
                    Consultar Multas & Restrições (Governo/Brokers)
                  </Button>
                  <Button
                    onClick={() => setIsMultaModalOpen(true)}
                    className="bg-seguranca-red hover:bg-seguranca-darkred"
                  >
                    <Plus size={16} className="mr-2" />
                    Nova Multa
                  </Button>
                </div>

              <div className="bg-seguranca-black border border-gray-600 rounded-lg overflow-hidden">
                <MultasTable
                  multas={multasComponent}
                  onRefresh={refetchFines}
                  onView={handleViewMulta}
                  onEdit={handleEditMulta}
                  onDelete={handleDeleteMulta}
                  onDeleteMultiple={handleDeleteMultipleMultas}
                  onGenerateReport={handleGenerateReportWithSelection}
                  showSelection={showMultaSelection}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="baterias" className="mt-6 space-y-4">
            <BateriasTable />
          </TabsContent>

          <TabsContent value="documentos" className="mt-6 space-y-4">
            <VehicleDocumentsTable />
          </TabsContent>

          <TabsContent value="agregados" className="mt-6 space-y-4">
            <AgregadosDashboard veiculos={vehicles || []} />
            <div className="flex justify-between items-center bg-seguranca-graphite border border-gray-600 rounded-lg p-4">
              <h3 className="text-seguranca-lightgray font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-orange-400" />
                Gestão de Agregados
              </h3>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setSelectedAgregado(null);
                    setIsAgregadoModalOpen(true);
                  }}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Plus size={16} className="mr-2" />
                  Novo Agregado
                </Button>
              </div>
            </div>
            <AgregadosTable
              veiculos={vehicles || []}
              onRefresh={refetchVehicles}
              onEdit={(veiculo) => {
                setSelectedAgregado(veiculo);
                setIsAgregadoModalOpen(true);
              }}
            />
          </TabsContent>

          {/* PRD Módulo 3: Elegibilidade, Vistorias de Mobilização e Talões */}
          <TabsContent value="mobilizacao" className="mt-6">
            <MobilizationPanel />
          </TabsContent>
        </Tabs>

        {/* Modais */}
        <VeiculoFormModal
          isOpen={isVeiculoModalOpen}
          onClose={() => {
            console.log('🔍 Fechando modal de novo veículo');
            setIsVeiculoModalOpen(false);
          }}
          onSuccess={handleVeiculoSuccess}
        />

        <VeiculoEditModal
          isOpen={isVeiculoEditModalOpen}
          onClose={() => setIsVeiculoEditModalOpen(false)}
          onSuccess={handleVeiculoEditSuccess}
          veiculo={selectedVeiculo}
        />

        <AbastecimentoFormModal
          isOpen={isAbastecimentoModalOpen}
          onClose={() => setIsAbastecimentoModalOpen(false)}
          onSuccess={handleAbastecimentoSuccess}
          veiculos={vehicles ? vehicles.map(v => ({
            id: v.id,
            placa: v.plate,
            marca: v.brand,
            modelo: v.model,
            ano: v.year,
            cor: v.color || '',
            combustivel: v.fuelType.toLowerCase(),
            quilometragem: v.currentMileage || 0,
            status: v.status.toLowerCase(),
            data_aquisicao: v.acquisitionDate,
            valor_aquisicao: v.acquisitionValue ? Number(v.acquisitionValue) : undefined,
            photos: v.photos ? Array.from(v.photos).map(file => file.name).join(',') : undefined,
            capacidade: v.capacity,
            observacoes: v.notes
          })) : []}
        />

        <ManutencaoFormModal
          isOpen={isManutencaoModalOpen}
          onClose={() => setIsManutencaoModalOpen(false)}
          onSuccess={handleManutencaoSuccess}
          veiculos={vehicles || []}
          manutencao={selectedManutencao}
        />
        {console.log("🔍 Frota.tsx - Estado ManutencaoFormModal:", { isOpen: isManutencaoModalOpen, selectedManutencao: selectedManutencao })}

        <ManutencaoViewModal
          isOpen={isManutencaoViewModalOpen}
          onClose={() => {
            setIsManutencaoViewModalOpen(false);
          }}
          maintenance={selectedManutencao}
          onEdit={handleEditManutencao}
          onDelete={(maintenance) => {
            setSelectedManutencao(maintenance);
            setIsManutencaoViewModalOpen(false);
            setIsManutencaoDeleteDialogOpen(true);
          }}
        />

        <ManutencaoDeleteDialog
          isOpen={isManutencaoDeleteDialogOpen}
          onClose={() => {
            setIsManutencaoDeleteDialogOpen(false);
            setSelectedManutencao(null);
          }}
          maintenance={selectedManutencao}
          onConfirm={handleDeleteManutencao}
          isDeleting={isManutencaoDeleting}
        />

        <MultaFormModal
          isOpen={isMultaModalOpen}
          onClose={() => setIsMultaModalOpen(false)}
          onSuccess={handleMultaSuccess}
          multa={selectedMulta}
          veiculos={vehicles ? vehicles.map(v => ({
            id: v.id,
            placa: v.plate,
            marca: v.brand,
            modelo: v.model,
            ano: v.year,
            cor: v.color || '',
            combustivel: v.fuelType.toLowerCase(),
            quilometragem: v.currentMileage || 0,
            status: v.status.toLowerCase(),
            data_aquisicao: v.acquisitionDate,
            valor_aquisicao: v.acquisitionValue ? Number(v.acquisitionValue) : undefined,
            photos: v.photos ? Array.from(v.photos).map(file => file.name).join(',') : undefined,
            capacidade: v.capacity,
            observacoes: v.notes
          })) : []}
        />

        <MultaViewModal
          multa={selectedMulta}
          isOpen={isMultaViewModalOpen}
          onClose={() => {
            setIsMultaViewModalOpen(false);
            setSelectedMulta(null);
          }}
          onGenerateReport={handleGenerateSingleFineReport}
        />

        <MultaDeleteDialog
          multa={selectedMulta}
          isOpen={isMultaDeleteDialogOpen}
          onClose={() => {
            setIsMultaDeleteDialogOpen(false);
            setSelectedMulta(null);
          }}
          onDelete={() => {
            console.log('🗑️ Multa excluída! Atualizando lista...');

            // Invalidar queries para forçar atualização
            queryClient.invalidateQueries({ queryKey: ['fines'] });

            // Refetch explícito
            refetchFines();

            // Fechar dialog
            setIsMultaDeleteDialogOpen(false);
            setSelectedMulta(null);

            console.log('✅ Lista de multas atualizada após exclusão!');
          }}
        />

        <DriverFormModal
          isOpen={isDriverModalOpen}
          onOpenChange={setIsDriverModalOpen}
          onSuccess={handleDriverSuccess}
          driver={selectedDriver}
        />

        {/* Dialog de Exclusão de Motorista */}
        <DriverDeleteDialog
          isOpen={isDriverDeleteDialogOpen}
          onClose={() => {
            setIsDriverDeleteDialogOpen(false);
            setDriverToDelete(null);
          }}
          driver={driverToDelete}
          onConfirm={(driver) => {
            deleteDriverMutation.mutate(driver.id);
            setIsDriverDeleteDialogOpen(false);
            setDriverToDelete(null);
          }}
          isDeleting={deleteDriverMutation.isPending}
        />

        {/* Modais de Controle de KM */}
        <KmControlFormModal
          isOpen={isKmControlModalOpen}
          onClose={() => {
            setIsKmControlModalOpen(false);
            setSelectedKmControl(null);
          }}
          onSuccess={handleKmControlSuccess}
          kmControl={selectedKmControl}
          vehicles={vehicles || []}
        />

        <KmControlViewModal
          kmControl={selectedKmControl}
          isOpen={isKmControlViewModalOpen}
          onClose={() => {
            setIsKmControlViewModalOpen(false);
            setSelectedKmControl(null);
          }}
          onEdit={handleEditKmControl}
          onDelete={handleDeleteKmControl}
        />

        <KmControlDeleteDialog
          kmControl={selectedKmControl}
          isOpen={isKmControlDeleteDialogOpen}
          onClose={() => {
            setIsKmControlDeleteDialogOpen(false);
            setSelectedKmControl(null);
          }}
          onConfirm={handleConfirmDeleteKmControl}
          isDeleting={isKmControlDeleting}
        />

        <VehicleReportModal
          isOpen={isVehicleReportModalOpen}
          onClose={() => {
            console.log('🔍 Fechando modal de relatório');
            setIsVehicleReportModalOpen(false);
          }}
        />

        <VehicleImportModal
          open={isVehicleImportModalOpen}
          onOpenChange={setIsVehicleImportModalOpen}
          onSuccess={() => {
            refetchVehicles();
          }}
        />

        <VehicleFineQueryModal
          isOpen={isFineQueryModalOpen}
          onClose={() => setIsFineQueryModalOpen(false)}
          initialPlate={fineQueryPlate}
          initialRenavam={fineQueryRenavam}
          initialUf={fineQueryUf}
          onFinesUpdated={() => {
            refetchFines();
          }}
        />

        <AgregadosFormModal
          isOpen={isAgregadoModalOpen}
          onOpenChange={setIsAgregadoModalOpen}
          onSuccess={() => {
            refetchVehicles();
            setSelectedAgregado(null);
          }}
          vehicle={selectedAgregado}
          vehicles={vehicles || []}
        />

      </div>
      {/* Printable Area (Hidden) */}
      {fineToDownload && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div id="frota-multa-printable">
            <StandardReportTemplate title="Relatório de Multa de Trânsito" company={empresa}>
              <div className="space-y-8 text-black">
                <div className="border-b-2 border-seguranca-red pb-4">
                  <h3 className="text-seguranca-red font-bold text-xl uppercase">Informações da Infração</h3>
                  <p className="text-sm text-gray-600 mt-1">Status: <span className="font-bold uppercase">{fineToDownload.status}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-1 text-xs uppercase text-gray-500">Dados do Veículo</h4>
                    <p className="text-sm"><strong>Placa:</strong> <span className="text-lg font-bold text-seguranca-red">{fineToDownload.placa}</span></p>
                    <p className="text-sm"><strong>Marca/Modelo:</strong> {fineToDownload.marca} {fineToDownload.modelo}</p>
                    <p className="text-sm"><strong>Motorista:</strong> {fineToDownload.motorista_nome || 'Não informado'}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold border-b pb-1 text-xs uppercase text-gray-500">Detalhes da Multa</h4>
                    <p className="text-sm"><strong>Data da Infração:</strong> {new Date(fineToDownload.data_infracao).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm"><strong>Vencimento:</strong> {new Date(fineToDownload.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    <p className="text-sm"><strong>Valor:</strong> <span className="text-lg font-bold">R$ {fineToDownload.valor.toFixed(2).replace('.', ',')}</span></p>
                    <p className="text-sm"><strong>Pontos:</strong> {fineToDownload.pontos || 0} pontos</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold border-b pb-1 text-xs uppercase text-gray-500">Infração</h4>
                  <p className="text-sm"><strong>Tipo:</strong> {fineToDownload.tipo_infracao}</p>
                  <p className="text-sm"><strong>Local:</strong> {fineToDownload.local_infracao}</p>
                </div>

                <div className="mt-20 p-6 bg-gray-50 border-2 border-dashed rounded-lg text-center">
                  <p className="text-sm text-gray-500 mb-8">Responsável pela Frota</p>
                  <div className="w-64 h-px bg-gray-400 mx-auto"></div>
                  <p className="text-[10px] text-gray-400 mt-2">Assinatura</p>
                </div>
              </div>
            </StandardReportTemplate>
          </div>
        </div>
      )}
    </StandardLayout>
  );
};

export default Frota;
