import React, { useState, useEffect } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import driverService from '@/services/driverService';
import { costCenterService, CostCenterDTO } from '@/services/costCenterService';
import { Driver } from '@/types/driver';
import { FuelRecord } from '@/types/fleet';
import { Plus, User, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { contasAPagarService, Supplier, CreateSupplierRequest } from '@/services/contasAPagarService';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';

interface Veiculo {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  status: string;
}

interface AbastecimentoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  abastecimento: FuelRecord | null;
  veiculos: Veiculo[];
}

const AbastecimentoEditModal: React.FC<AbastecimentoEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  abastecimento,
  veiculos
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [showNewDriverModal, setShowNewDriverModal] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: '',
    licenseNumber: ''
  });
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const [formData, setFormData] = useState({
    veiculo_id: '',
    data_abastecimento: '',
    combustivel: 'GASOLINE',
    quilometragem: '',
    centro_custo: '',
    litros: '',
    valor_litro: '',
    valor_total: '',
    posto: '',
    driverId: '',
    observacoes: ''
  });

  // Preencher formulário quando o modal abrir
  useEffect(() => {
    console.log('Modal de edição - abastecimento:', abastecimento);
    console.log('Modal de edição - isOpen:', isOpen);

    if (abastecimento && isOpen) {
      const valorLitro = abastecimento.quantity > 0 ? (abastecimento.cost / abastecimento.quantity).toFixed(3) : '0';

      // Formatar a data corretamente
      let dataFormatada = '';
      if (abastecimento.date) {
        // Se a data já vem no formato YYYY-MM-DD, usar diretamente
        if (abastecimento.date.includes('-')) {
          dataFormatada = abastecimento.date;
        } else {
          // Se vier em outro formato, converter
          try {
            const data = new Date(abastecimento.date);
            if (!isNaN(data.getTime())) {
              dataFormatada = data.toISOString().split('T')[0];
            }
          } catch (error) {
            console.error('Erro ao converter data:', error);
            dataFormatada = '';
          }
        }
      }

      console.log('Data original:', abastecimento.date);
      console.log('Data formatada:', dataFormatada);

      setFormData({
        veiculo_id: abastecimento.vehicleId,
        data_abastecimento: dataFormatada,
        combustivel: abastecimento.fuelType || 'GASOLINE',
        quilometragem: abastecimento.mileage.toString(),
        centro_custo: abastecimento.costCenter || '',
        litros: abastecimento.quantity.toString(),
        valor_litro: valorLitro,
        valor_total: abastecimento.cost.toString(),
        posto: abastecimento.station,
        driverId: abastecimento.driver?.id || '',
        observacoes: abastecimento.notes || ''
      });

      console.log('Formulário preenchido:', {
        veiculo_id: abastecimento.vehicleId,
        data_abastecimento: dataFormatada,
        combustivel: abastecimento.fuelType || 'GASOLINE',
        quilometragem: abastecimento.mileage.toString(),
        centro_custo: abastecimento.costCenter || '',
        litros: abastecimento.quantity.toString(),
        valor_litro: valorLitro,
        valor_total: abastecimento.cost.toString(),
        posto: abastecimento.station,
        driverId: abastecimento.driver?.id || '',
        observacoes: abastecimento.notes || ''
      });

      console.log('🔍 Centro de Custo recebido:', abastecimento.costCenter);
      console.log('🔍 Centro de Custo no formData:', abastecimento.costCenter || '');
    }
  }, [abastecimento, isOpen]);

  // Query para buscar motoristas
  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: async () => {
      try {
        const response = await driverService.getDrivers();
        if (Array.isArray(response)) {
          return response;
        }
        return [];
      } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Query para buscar centros de custo
  const { data: costCenters = [], isLoading: costCentersLoading } = useQuery<CostCenterDTO[]>({
    queryKey: ['costCenters'],
    queryFn: async () => {
      try {
        const response = await costCenterService.list({ page: 0, size: 100 });
        if (response && typeof response === 'object' && 'content' in response) {
          return response.content || [];
        }
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Erro ao buscar centros de custo:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Nova query para buscar último abastecimento do veículo
  const { data: lastFuelRecord } = useQuery({
    queryKey: ['lastFuelRecord', formData.veiculo_id],
    queryFn: () => formData.veiculo_id ? fleetService.getLastFuelRecord(formData.veiculo_id) : null,
    enabled: !!formData.veiculo_id
  });

  // Filtrar motoristas ativos
  const motoristasAtivos = drivers.filter(d => d?.status === 'ATIVO');

  const driverOptions = motoristasAtivos.map(driver => ({
    label: driver.name || 'Nome não informado',
    value: driver.id || ''
  }));

  // Opções para centros de custo
  const costCenterOptions = costCenters.map(cc => ({
    label: `${cc.code} - ${cc.name}`,
    value: cc.id || ''
  }));

  // Query para carregar fornecedores ativos
  const { data: suppliers = [], isLoading: suppliersLoading, refetch: refetchSuppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers', 'active'],
    queryFn: async () => {
      try {
        const suppliers = await contasAPagarService.getFornecedoresAtivos();
        return suppliers || [];
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Handler para criar fornecedor
  const handleCreateSupplier = async (payload: CreateSupplierRequest) => {
    try {
      const newSupplier = await contasAPagarService.createFornecedor(payload);
      toast({
        title: "✅ Sucesso",
        description: "Fornecedor criado com sucesso!",
      });

      // Recarregar lista de fornecedores
      await refetchSuppliers();

      // Selecionar o novo fornecedor no formulário
      setFormData(prev => ({ ...prev, posto: newSupplier.name }));

      // Fechar modal
      setShowSupplierModal(false);
    } catch (error: any) {
      console.error('Erro ao criar fornecedor:', error);
      toast({
        title: "❌ Erro",
        description: error.response?.data?.message || "Erro ao criar fornecedor",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Criar novo motorista
  const createDriverMutation = useMutation({
    mutationFn: (driverData: any) => driverService.createDriver(driverData),
    onSuccess: (newDriver) => {
      toast({
        title: "Sucesso",
        description: "Motorista criado com sucesso!"
      });

      // Atualizar a lista de motoristas
      queryClient.invalidateQueries({ queryKey: ['drivers'] });

      // Selecionar o novo motorista automaticamente
      setFormData(prev => ({ ...prev, driverId: newDriver.id }));

      // Fechar modal e limpar dados
      setShowNewDriverModal(false);
      setNewDriverData({ name: '', licenseNumber: '' });
    },
    onError: (error: any) => {
      console.error('Erro ao criar motorista:', error);
      let errorMessage = "Erro ao criar motorista. Tente novamente.";

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });


  // Validação de quilometragem
  const validateMileage = (newMileage: number): string | null => {
    if (!lastFuelRecord) return null;

    // Se estamos editando o próprio registro que é o último, não validar
    if (abastecimento && lastFuelRecord.id === abastecimento.id) {
      return null;
    }

    console.log('🔍 Validando quilometragem (edição):', {
      novaQuilometragem: newMileage,
      ultimaQuilometragem: lastFuelRecord.mileage,
      diferenca: newMileage - lastFuelRecord.mileage,
      editandoProprioRegistro: abastecimento?.id === lastFuelRecord.id
    });

    if (newMileage <= lastFuelRecord.mileage) {
      return `⚠️ A quilometragem atual (${newMileage.toLocaleString()} km) não pode ser menor ou igual à quilometragem do último abastecimento (${lastFuelRecord.mileage.toLocaleString()} km). Por favor, informe o valor correto.`;
    }

    const difference = newMileage - lastFuelRecord.mileage;
    if (difference > 2000) {
      return `⚠️ Diferença muito alta (${difference.toLocaleString()} km). Verifique se a quilometragem está correta.`;
    }

    return null;
  };

  const [mileageError, setMileageError] = useState<string | null>(null);
  const [mileageWarning, setMileageWarning] = useState<string | null>(null);
  const [isTotalManuallyEdited, setIsTotalManuallyEdited] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Função para calcular o valor total
  const calculateTotal = (litros: number, valorLitro: number): number => {
    return Number((litros * valorLitro).toFixed(2));
  };

  // Função para marcar campo como tocado
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set([...prev, field]));
  };

  // Função para verificar se um campo é inválido
  const isFieldInvalid = (field: string): boolean => {
    if (!touchedFields.has(field)) return false;

    switch (field) {
      case 'veiculo_id':
        return !formData.veiculo_id;
      case 'data_abastecimento':
        return !formData.data_abastecimento;
      case 'combustivel':
        return !formData.combustivel;
      case 'quilometragem':
        return !formData.quilometragem || !!mileageError;
      case 'litros':
        return !formData.litros || Number(formData.litros) <= 0;
      case 'valor_litro':
        return !formData.valor_litro || Number(formData.valor_litro) <= 0;
      case 'posto':
        return !formData.posto.trim();
      default:
        return false;
    }
  };

  // Atualizar o handleInputChange para incluir validação e cálculo automático
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Calcular valor total automaticamente se não foi editado manualmente
      if (!isTotalManuallyEdited && (field === 'litros' || field === 'valor_litro')) {
        const litros = field === 'litros' ? Number(value) : Number(prev.litros);
        const valorLitro = field === 'valor_litro' ? Number(value) : Number(prev.valor_litro);

        if (litros > 0 && valorLitro > 0) {
          newData.valor_total = calculateTotal(litros, valorLitro);
        }
      }

      return newData;
    });

    // Marcar como editado manualmente se o usuário alterou o valor total
    if (field === 'valor_total') {
      setIsTotalManuallyEdited(true);
    }

    if (field === 'quilometragem') {
      const error = validateMileage(Number(value));
      if (error?.includes('deve ser maior') || error?.includes('não pode ser menor')) {
        setMileageError(error);
        setMileageWarning(null);
      } else if (error?.includes('muito alta')) {
        setMileageError(null);
        setMileageWarning(error);
      } else {
        setMileageError(null);
        setMileageWarning(null);
      }
    }
  };

  // Função para recalcular o valor total (botão de refresh)
  const recalculateTotal = () => {
    const litros = Number(formData.litros);
    const valorLitro = Number(formData.valor_litro);

    if (litros > 0 && valorLitro > 0) {
      setFormData(prev => ({
        ...prev,
        valor_total: calculateTotal(litros, valorLitro)
      }));
      setIsTotalManuallyEdited(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // setReceiptFile(e.target.files[0]); // This state was removed
    }
  };

  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do motorista é obrigatório",
        variant: "destructive"
      });
      return;
    }

    createDriverMutation.mutate({
      name: newDriverData.name.trim(),
      licenseNumber: newDriverData.licenseNumber.trim() || undefined,
      status: 'ATIVO'
    });
  };

  const updateFuelRecordMutation = useMutation({
    mutationFn: (fuelData: any) => {
      console.log('Chamando updateFuelRecord com ID:', abastecimento?.id);
      console.log('Dados para atualização:', fuelData);
      return fleetService.updateFuelRecord(abastecimento?.id || '', fuelData);
    },
    onSuccess: () => {
      console.log('Abastecimento atualizado com sucesso!');
      toast({
        title: "Sucesso",
        description: "Abastecimento atualizado com sucesso!",
      });

      // Invalidar queries para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });

      // Chamar callback de sucesso
      onSuccess();
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar abastecimento:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar abastecimento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar quilometragem antes de enviar
    if (mileageError) {
      toast({
        title: "❌ Erro de Validação",
        description: "A quilometragem informada não é válida. Por favor, corrija o valor antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 handleSubmit - formData completo:', formData);

    const fuelRecordData = {
      vehicleId: formData.veiculo_id,
      date: formData.data_abastecimento, // Já está no formato YYYY-MM-DD
      fuelType: formData.combustivel,
      quantity: Number(formData.litros),
      cost: Number(formData.valor_total),
      mileage: Number(formData.quilometragem),
      station: formData.posto,
      driverId: formData.driverId || null,
      notes: formData.observacoes || '',
      costCenter: formData.centro_custo || null
    };

    console.log('🔍 handleSubmit - fuelRecordData criado:', fuelRecordData);
    console.log('🔍 handleSubmit - Verificando campos obrigatórios:');
    console.log('  - vehicleId:', fuelRecordData.vehicleId, 'tipo:', typeof fuelRecordData.vehicleId);
    console.log('  - date:', fuelRecordData.date, 'tipo:', typeof fuelRecordData.date);
    console.log('  - fuelType:', fuelRecordData.fuelType, 'tipo:', typeof fuelRecordData.fuelType);
    console.log('  - quantity:', fuelRecordData.quantity, 'tipo:', typeof fuelRecordData.quantity);
    console.log('  - cost:', fuelRecordData.cost, 'tipo:', typeof fuelRecordData.cost);
    console.log('  - mileage:', fuelRecordData.mileage, 'tipo:', typeof fuelRecordData.mileage);

    // Validar campos obrigatórios
    if (!fuelRecordData.vehicleId || !fuelRecordData.date || !fuelRecordData.fuelType ||
      isNaN(fuelRecordData.quantity) || isNaN(fuelRecordData.cost) || isNaN(fuelRecordData.mileage)) {
      console.error('❌ Campos obrigatórios inválidos:', {
        vehicleId: fuelRecordData.vehicleId,
        date: fuelRecordData.date,
        fuelType: fuelRecordData.fuelType,
        quantity: fuelRecordData.quantity,
        cost: fuelRecordData.cost,
        mileage: fuelRecordData.mileage
      });

      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios corretamente.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 handleSubmit - Enviando dados como FormData para atualização:', fuelRecordData);

    // Enviar dados como FormData para atualização (igual ao create)
    const data = new FormData();
    data.append('fuelRecord', new Blob([JSON.stringify(fuelRecordData)], { type: 'application/json' }));

    updateFuelRecordMutation.mutate(data);
  };

  const veiculosAtivos = veiculos.filter(v =>
    v.status.toLowerCase() === 'active' ||
    v.status.toLowerCase() === 'ativo' ||
    v.status.toLowerCase() === 'activo'
  );

  console.log('Status dos veículos:', veiculos.map(v => ({ id: v.id, placa: v.placa, status: v.status })));

  const footer = (
    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="flex-1 sm:flex-none h-10 sm:h-11 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="fuel-edit-form"
        disabled={isLoading || !formData.veiculo_id || updateFuelRecordMutation.isPending}
        className="flex-1 sm:flex-none h-10 sm:h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50"
      >
        {isLoading || updateFuelRecordMutation.isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );

  const renderForm = () => (
    <form id="fuel-edit-form" onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* Veículo */}
      <div className="flex flex-col">
        <Label htmlFor="veiculo_id" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
          Veículo <span className="text-seguranca-red">*</span>
        </Label>
        <Select
          value={formData.veiculo_id}
          onValueChange={(value) => handleInputChange('veiculo_id', value)}
          onOpenChange={() => handleFieldBlur('veiculo_id')}
        >
          <SelectTrigger
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('veiculo_id')
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          >
            <SelectValue placeholder="Selecione um veículo" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
            {veiculosAtivos.length > 0 ? (
              veiculosAtivos.map((veiculo) => (
                <SelectItem key={veiculo.id} value={veiculo.id}>
                  {veiculo.placa} - {veiculo.marca} {veiculo.modelo}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-vehicles" disabled>
                Nenhum veículo ativo disponível
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {veiculosAtivos.length === 0 && (
          <p className="text-sm text-seguranca-red mt-1">
            Não há veículos ativos disponíveis para abastecimento.
          </p>
        )}
        {isFieldInvalid('veiculo_id') && (
          <p className="text-sm text-seguranca-red mt-1">Veículo é obrigatório</p>
        )}
      </div>

      {/* Data e Tipo de Combustível - Layout em Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <Label htmlFor="data_abastecimento" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Data <span className="text-seguranca-red">*</span>
          </Label>
          <Input
            id="data_abastecimento"
            type="date"
            value={formData.data_abastecimento}
            onChange={(e) => handleInputChange('data_abastecimento', e.target.value)}
            onBlur={() => handleFieldBlur('data_abastecimento')}
            required
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('data_abastecimento')
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          />
          {isFieldInvalid('data_abastecimento') && (
            <p className="text-sm text-seguranca-red mt-1">Data é obrigatória</p>
          )}
        </div>

        <div className="flex flex-col">
          <Label htmlFor="combustivel" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Tipo de Combustível <span className="text-seguranca-red">*</span>
          </Label>
          <Select
            value={formData.combustivel}
            onValueChange={(value) => handleInputChange('combustivel', value)}
            onOpenChange={() => handleFieldBlur('combustivel')}
          >
            <SelectTrigger
              className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('combustivel')
                ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
                : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
                }`}
            >
              <SelectValue placeholder="Selecione o tipo de combustível" />
            </SelectTrigger>
            <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
              <SelectItem value="GASOLINE">Gasolina</SelectItem>
              <SelectItem value="ETHANOL">Etanol</SelectItem>
              <SelectItem value="DIESEL">Diesel</SelectItem>
              <SelectItem value="FLEX">Flex</SelectItem>
            </SelectContent>
          </Select>
          {isFieldInvalid('combustivel') && (
            <p className="text-sm text-seguranca-red mt-1">Tipo de combustível é obrigatório</p>
          )}
        </div>
      </div>

      {/* Quilometragem - Layout em Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Km Anterior */}
        <div className="flex flex-col">
          <Label htmlFor="km_anterior" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Km Anterior
          </Label>
          <Input
            id="km_anterior"
            type="text"
            value={lastFuelRecord?.mileage ? lastFuelRecord.mileage.toLocaleString() : ''}
            disabled
            className="h-10 sm:h-11 border-2 border-gray-600 bg-seguranca-graphite text-gray-400 cursor-not-allowed"
            placeholder={lastFuelRecord ? lastFuelRecord.mileage.toLocaleString() : 'Nenhum registro anterior'}
          />
          <p className="text-xs text-gray-400 mt-1">
            {lastFuelRecord ? 'Quilometragem do último abastecimento' : 'Primeiro abastecimento do veículo'}
          </p>
        </div>

        {/* Quilometragem Atual */}
        <div className="flex flex-col">
          <Label htmlFor="quilometragem" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Quilometragem <span className="text-seguranca-red">*</span>
          </Label>
          <Input
            id="quilometragem"
            type="number"
            value={formData.quilometragem}
            onChange={(e) => handleInputChange('quilometragem', e.target.value)}
            onBlur={() => handleFieldBlur('quilometragem')}
            min="0"
            required
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('quilometragem') || mileageError
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : mileageWarning
                ? 'border-seguranca-yellow bg-seguranca-black text-seguranca-lightgray'
                : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          />

          {/* Informação da diferença de quilometragem */}
          {lastFuelRecord && formData.quilometragem && Number(formData.quilometragem) > 0 && (
            <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-400 font-medium">Informação:</p>
              <p className="text-xs text-blue-300">
                Diferença: {Number(formData.quilometragem) - lastFuelRecord.mileage} km
                {Number(formData.quilometragem) > lastFuelRecord.mileage && (
                  <span className="text-green-400 ml-2">✓ Válido</span>
                )}
              </p>
            </div>
          )}
          {mileageError && (
            <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                <span className="text-red-500">⚠️</span>
                Validação de Quilometragem
              </p>
              <p className="text-sm text-red-300 mt-1">{mileageError}</p>
            </div>
          )}
          {mileageWarning && (
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-400 font-medium flex items-center gap-2">
                <span className="text-yellow-500">⚠️</span>
                Aviso de Quilometragem
              </p>
              <p className="text-sm text-yellow-300 mt-1">{mileageWarning}</p>
            </div>
          )}
          {isFieldInvalid('quilometragem') && !mileageError && !mileageWarning && (
            <p className="text-sm text-seguranca-red mt-1">Quilometragem é obrigatória</p>
          )}
        </div>
      </div>

      {/* Centro de Custo */}
      <div className="flex flex-col">
        <Label htmlFor="centro_custo" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
          Centro de Custo
        </Label>
        <Select
          value={formData.centro_custo}
          onValueChange={(value) => handleInputChange('centro_custo', value)}
        >
          <SelectTrigger
            className="h-10 sm:h-11 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
          >
            <SelectValue placeholder="Selecionar centro de custo" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
            {costCenterOptions.map((costCenter) => (
              <SelectItem key={costCenter.value} value={costCenter.value}>
                {costCenter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {costCentersLoading && (
          <p className="text-xs text-gray-400 mt-1">Carregando centros de custo...</p>
        )}
      </div>

      {/* Motorista */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="driverId" className="text-sm sm:text-base text-seguranca-lightgray">
            Motorista
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowNewDriverModal(true)}
            className="h-7 px-2 text-xs border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black transition-colors"
          >
            <Plus size={12} className="mr-1" />
            Novo Motorista
          </Button>
        </div>
        <Select
          value={formData.driverId}
          onValueChange={(value) => handleInputChange('driverId', value)}
        >
          <SelectTrigger
            className="h-10 sm:h-11 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
          >
            <SelectValue placeholder="Selecionar motorista" />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray">
            {driverOptions.map((driver) => (
              <SelectItem key={driver.value} value={driver.value}>
                {driver.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {driversLoading && (
          <p className="text-xs text-gray-400 mt-1">Carregando motoristas...</p>
        )}
      </div>

      {/* Campos de Combustível - Layout em Grid para Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="flex flex-col">
          <Label htmlFor="litros" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Litros <span className="text-seguranca-red">*</span>
          </Label>
          <Input
            id="litros"
            type="number"
            step="0.01"
            value={formData.litros}
            onChange={(e) => handleInputChange('litros', e.target.value)}
            onBlur={() => handleFieldBlur('litros')}
            min="0"
            required
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('litros')
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          />
          {isFieldInvalid('litros') && (
            <p className="text-sm text-seguranca-red mt-1">Quantidade de litros é obrigatória</p>
          )}
        </div>

        <div className="flex flex-col">
          <Label htmlFor="valor_litro" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
            Valor por Litro <span className="text-seguranca-red">*</span>
          </Label>
          <Input
            id="valor_litro"
            type="number"
            step="0.01"
            value={formData.valor_litro}
            onChange={(e) => handleInputChange('valor_litro', e.target.value)}
            onBlur={() => handleFieldBlur('valor_litro')}
            min="0"
            required
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('valor_litro')
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          />
          {isFieldInvalid('valor_litro') && (
            <p className="text-sm text-seguranca-red mt-1">Valor por litro é obrigatório</p>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="valor_total" className="text-sm sm:text-base text-seguranca-lightgray">
              Valor Total
            </Label>
            {isTotalManuallyEdited && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={recalculateTotal}
                className="h-6 px-2 text-xs text-seguranca-yellow hover:text-seguranca-yellow/80 bg-transparent hover:bg-seguranca-graphite"
              >
                ↻ Recalcular
              </Button>
            )}
          </div>
          <div className="relative">
            <Input
              id="valor_total"
              type="number"
              step="0.01"
              value={formData.valor_total}
              onChange={(e) => handleInputChange('valor_total', e.target.value)}
              min="0"
              className={`h-10 sm:h-11 pr-8 border-2 transition-colors ${isTotalManuallyEdited
                ? 'border-seguranca-yellow bg-seguranca-yellow/10 text-seguranca-lightgray'
                : 'border-seguranca-yellow bg-seguranca-yellow/10 text-seguranca-lightgray'
                }`}
              placeholder="0.00"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-seguranca-yellow text-sm font-medium">
              R$
            </div>
          </div>
          {!isTotalManuallyEdited && formData.litros > 0 && formData.valor_litro > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              Calculado automaticamente: {formData.litros} × R$ {formData.valor_litro} = R$ {formData.valor_total}
            </p>
          )}
        </div>
      </div>

      {/* Posto */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="posto" className="text-sm sm:text-base text-seguranca-lightgray">
            Posto <span className="text-seguranca-red">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowSupplierModal(true)}
            className="h-8 px-3 text-xs border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black transition-colors"
          >
            <Plus size={14} className="mr-1" />
            Novo Fornecedor
          </Button>
        </div>
        <Select
          value={formData.posto}
          onValueChange={(value) => handleInputChange('posto', value)}
        >
          <SelectTrigger
            className={`h-10 sm:h-11 border-2 transition-colors ${isFieldInvalid('posto')
              ? 'border-seguranca-red bg-seguranca-black text-seguranca-lightgray'
              : 'border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow'
              }`}
          >
            <SelectValue placeholder={suppliersLoading ? "Carregando fornecedores..." : "Selecionar fornecedor"} />
          </SelectTrigger>
          <SelectContent className="bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-60">
            {suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.name}>
                  {supplier.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-suppliers" disabled>
                {suppliersLoading ? "Carregando fornecedores..." : "Nenhum fornecedor disponível"}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        {isFieldInvalid('posto') && (
          <p className="text-sm text-seguranca-red mt-1">Fornecedor é obrigatório</p>
        )}
      </div>

      {/* Upload do Recibo */}
      <div className="flex flex-col">
        <Label htmlFor="recibo" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
          Recibo de Abastecimento
        </Label>
        <Input
          id="recibo"
          type="file"
          onChange={handleFileChange}
          className="file:text-seguranca-lightgray file:bg-seguranca-graphite file:border file:border-gray-600 file:rounded file:px-3 file:py-1 file:hover:file:bg-seguranca-black file:hover:file:border-gray-500 transition-colors"
        />
        {abastecimento?.receiptUrl && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-400">Recibo atual: {abastecimento.receiptUrl.split('/').pop()}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowImagePreview(true)}
              className="h-8 px-3 text-xs border-seguranca-yellow text-seguranca-yellow hover:bg-seguranca-yellow hover:text-seguranca-black transition-colors"
            >
              <Eye size={14} className="mr-1" />
              Visualizar
            </Button>
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="flex flex-col">
        <Label htmlFor="observacoes" className="text-sm sm:text-base text-seguranca-lightgray mb-2">
          Observações
        </Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => handleInputChange('observacoes', e.target.value)}
          rows={3}
          className="resize-none border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
          placeholder="Ex: Calibragem de pneus, verificação de óleo..."
        />
      </div>
    </form>
  );

  const newDriverFooter = (
    <div className="flex gap-2 w-full">
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowNewDriverModal(false)}
        className="flex-1 border-gray-600 text-seguranca-lightgray hover:bg-seguranca-graphite"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        form="new-driver-form"
        disabled={createDriverMutation.isPending}
        className="flex-1 bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50"
      >
        {createDriverMutation.isPending ? 'Criando...' : 'Criar Motorista'}
      </Button>
    </div>
  );

  const renderNewDriverForm = () => (
    <form id="new-driver-form" onSubmit={handleCreateDriver} className="space-y-4 text-left">
      <div className="flex flex-col">
        <Label htmlFor="driverName" className="text-sm text-seguranca-lightgray mb-2">
          Nome <span className="text-seguranca-red">*</span>
        </Label>
        <Input
          id="driverName"
          value={newDriverData.name}
          onChange={(e) => setNewDriverData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
          placeholder="Nome completo do motorista"
        />
      </div>
      <div className="flex flex-col">
        <Label htmlFor="licenseNumber" className="text-sm text-seguranca-lightgray mb-2">
          Número da CNH
        </Label>
        <Input
          id="licenseNumber"
          value={newDriverData.licenseNumber}
          onChange={(e) => setNewDriverData(prev => ({ ...prev, licenseNumber: e.target.value }))}
          className="h-10 border-2 border-gray-600 bg-seguranca-black text-seguranca-lightgray hover:border-gray-500 focus:border-seguranca-yellow transition-colors"
          placeholder="Número da carteira de motorista"
        />
      </div>
    </form>
  );

  console.log('Modal renderizando - isOpen:', isOpen, 'abastecimento:', abastecimento);
  console.log('Veículos recebidos:', veiculos);
  console.log('Veículos ativos filtrados:', veiculosAtivos);
  console.log('Status dos veículos:', veiculos.map(v => ({ id: v.id, placa: v.placa, status: v.status })));

  return (
    <>
      <ResponsiveDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Abastecimento"
        description="Atualize os campos abaixo para modificar o registro de abastecimento."
        footer={footer}
        className="max-w-2xl"
      >
        {renderForm()}
      </ResponsiveDrawer>

      <ResponsiveDrawer
        isOpen={showNewDriverModal}
        onClose={() => setShowNewDriverModal(false)}
        title="Novo Motorista"
        description="Cadastre um novo motorista."
        footer={newDriverFooter}
        className="max-w-md"
      >
        {renderNewDriverForm()}
      </ResponsiveDrawer>

      <SupplierFormModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        onSave={handleCreateSupplier}
      />

      <ResponsiveDrawer
        isOpen={showImagePreview}
        onClose={() => setShowImagePreview(false)}
        title="Visualizar Recibo"
        description="Recibo de abastecimento"
        className="max-w-3xl"
      >
        <div className="flex justify-center items-center p-4">
          {abastecimento?.receiptUrl && (
            <div className="w-full max-h-[60vh] overflow-auto">
              <img
                src={abastecimento.receiptUrl}
                alt="Recibo de abastecimento"
                className="w-full h-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>
      </ResponsiveDrawer>
    </>
  );
};

export default AbastecimentoEditModal;
