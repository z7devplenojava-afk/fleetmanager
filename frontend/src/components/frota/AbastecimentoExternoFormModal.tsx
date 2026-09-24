import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import fleetService from '@/services/fleetService';
import { garageService } from '@/services/garageService';
import { contasAPagarService } from '@/services/contasAPagarService';
import { clientService } from '@/services/clientService';
import { contractService } from '@/services/contractService';
import { workPostService } from '@/services/workPostService';
import { employeeService } from '@/services/employeeService';
import { FuelRecord, Vehicle } from '@/types/fleet';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';
import {
  Fuel, Gauge, Truck, MapPin, User, Calendar, DollarSign,
  Save, Loader2, PlusCircle, Building2, FileText, Droplets, Upload, X
} from 'lucide-react';
import { SupplierFormModal } from '@/components/estoque/SupplierFormModal';

interface AbastecimentoExternoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
  abastecimento?: FuelRecord | null;
}

interface ExternoFormData {
  vehicleId: string;
  date: string;
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  liters: number;
  pricePerLiter: number;
  totalValue: number;
  station: string;
  supplierId: string;
  mileage: number;
  initialMileage: number;
  clientName: string;
  clientId: string;
  obraName: string;
  workPostId: string;
  contractNumber: string;
  contractId: string;
  garageId: string;
  garageName: string;
  responsibleName: string;
  responsibleEmployeeId: string;
  notes: string;
  receiptFile: File | null;
}

const DEFAULT_FORM: ExternoFormData = {
  vehicleId: '',
  date: new Date().toISOString().split('T')[0],
  fuelType: 'DIESEL',
  liters: 0,
  pricePerLiter: 0,
  totalValue: 0,
  station: '',
  supplierId: '',
  mileage: 0,
  initialMileage: 0,
  clientName: '',
  clientId: '',
  obraName: '',
  workPostId: '',
  contractNumber: '',
  contractId: '',
  garageId: '',
  garageName: '',
  responsibleName: '',
  responsibleEmployeeId: '',
  notes: '',
  receiptFile: null,
};

const EMPTY_LIST: any[] = [];

const AbastecimentoExternoFormModal: React.FC<AbastecimentoExternoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos,
  abastecimento = null,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!abastecimento;
  const [formData, setFormData] = useState<ExternoFormData>(DEFAULT_FORM);
  const [isTotalManual, setIsTotalManual] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preencher formulário quando em modo de edição
  useEffect(() => {
    if (!abastecimento || !isOpen) return;

    let dataFormatada = abastecimento.date || '';
    if (dataFormatada && !dataFormatada.includes('-')) {
      try {
        const d = new Date(abastecimento.date);
        if (!isNaN(d.getTime())) dataFormatada = d.toISOString().split('T')[0];
      } catch { /* mantém valor original */ }
    }

    const notesStr = abastecimento.notes || '';
    const garageMatch = notesStr.match(/Garagem: ([^|]+)/);
    const respMatch = notesStr.match(/Resp: ([^|]+)/);

    setFormData({
      vehicleId: abastecimento.vehicleId || '',
      date: dataFormatada,
      fuelType: abastecimento.fuelType || 'DIESEL',
      liters: abastecimento.quantity || 0,
      pricePerLiter: abastecimento.pricePerLiter || 0,
      totalValue: abastecimento.cost || 0,
      station: abastecimento.station || '',
      supplierId: '',
      mileage: abastecimento.mileage || 0,
      initialMileage: abastecimento.initialMileage || 0,
      clientName: abastecimento.clientName || '',
      clientId: abastecimento.clientId || '',
      obraName: abastecimento.obraName || '',
      workPostId: abastecimento.workPostId || '',
      contractNumber: abastecimento.contractNumber || '',
      contractId: abastecimento.contractId || '',
      garageId: '',
      garageName: garageMatch?.[1]?.trim() || '',
      responsibleName: respMatch?.[1]?.trim() || '',
      responsibleEmployeeId: '',
      notes: notesStr.includes('|') ? notesStr : notesStr,
      receiptFile: null,
    });
    setIsTotalManual(true);
  }, [abastecimento, isOpen]);

  // --- Data Queries ---

  const { data: garages = EMPTY_LIST } = useQuery({
    queryKey: ['garages'],
    queryFn: () => garageService.list(),
    enabled: isOpen
  });

  const { data: suppliers = EMPTY_LIST, refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers', 'active'],
    queryFn: contasAPagarService.getFornecedoresAtivos,
    enabled: isOpen
  });

  const { data: clients = EMPTY_LIST } = useQuery({
    queryKey: ['clients-for-externo'],
    queryFn: () => clientService.getClientsForSelect(),
    enabled: isOpen
  });

  const { data: allWorkPosts = EMPTY_LIST } = useQuery({
    queryKey: ['workPosts-for-externo'],
    queryFn: () => workPostService.getAllWorkPosts(),
    enabled: isOpen
  });

  const { data: allContracts = EMPTY_LIST } = useQuery({
    queryKey: ['contracts-for-externo'],
    queryFn: () => contractService.getAllContracts(),
    enabled: isOpen
  });

  const { data: lastFuelRecord } = useQuery({
    queryKey: ['lastFuelRecord', formData.vehicleId],
    queryFn: async () => {
      if (!formData.vehicleId) return null;
      try {
        const last = await fleetService.getLastFuelRecord(formData.vehicleId);
        if (last) return last;
        const v = veiculos.find(x => x.id === formData.vehicleId);
        if (v?.currentMileage) return { mileage: v.currentMileage, initialMileage: v.currentMileage };
        return null;
      } catch { return null; }
    },
    enabled: !!formData.vehicleId && isOpen
  });

  // --- Filtered options based on selected client ---

  const filteredWorkPosts = useMemo(() => {
    if (!formData.clientId) return allWorkPosts;
    return allWorkPosts.filter(wp => wp.clientId === formData.clientId);
  }, [allWorkPosts, formData.clientId]);

  const filteredContracts = useMemo(() => {
    if (!formData.clientId) return allContracts;
    return allContracts.filter(c => c.clientId === formData.clientId);
  }, [allContracts, formData.clientId]);

  // --- SearchableSelect Options ---

  const clientOptions: SearchableOption[] = useMemo(() =>
    clients.map(c => ({
      value: c.id,
      label: c.name,
      subtitle: c.cnpj || '',
      keywords: [c.name, c.cnpj || ''].filter(Boolean),
    })),
  [clients]);

  const workPostOptions: SearchableOption[] = useMemo(() =>
    filteredWorkPosts.map(wp => ({
      value: wp.id,
      label: wp.name,
      subtitle: wp.postCode ? `Cód: ${wp.postCode}` : wp.address || '',
      keywords: [wp.name, wp.postCode || '', wp.address || ''].filter(Boolean),
    })),
  [filteredWorkPosts]);

  const contractOptions: SearchableOption[] = useMemo(() =>
    filteredContracts.map(c => ({
      value: c.id,
      label: c.contractNumber,
      subtitle: c.description || c.obraName || '',
      keywords: [c.contractNumber, c.description || '', c.obraName || ''].filter(Boolean),
    })),
  [filteredContracts]);

  const garageOptions: SearchableOption[] = useMemo(() =>
    garages.map(g => ({
      value: g.id,
      label: g.name,
      subtitle: g.responsibleName || '',
      keywords: [g.name, g.responsibleName || ''].filter(Boolean),
    })),
  [garages]);

  const supplierOptions: SearchableOption[] = useMemo(() =>
    suppliers.map(s => ({
      value: s.id,
      label: s.name,
      subtitle: s.cnpj || '',
      keywords: [s.name, s.cnpj || ''].filter(Boolean),
    })),
  [suppliers]);

  // --- Effects ---

  useEffect(() => {
    // Em modo de edição, não sobrescrever os dados pré-preenchidos do registro
    if (isEditing) return;
    if (!formData.vehicleId || !veiculos.length) return;
    const v = veiculos.find(x => x.id === formData.vehicleId);
    if (!v) return;

    const prevKm = lastFuelRecord?.mileage ?? v.currentMileage ?? 0;

    setFormData(prev => {
      const nextClientName = prev.clientName || v.clientName || (v as any).client?.name || '';
      const nextClientId = prev.clientId || v.clientId || '';
      const nextObra = prev.obraName || (v as any).workPostEntity?.name || v.location || '';
      const nextContractId = prev.contractId || v.contractId || '';
      const nextContractNum = prev.contractNumber || v.allocationContractNumber || '';
      const nextMileage = prev.mileage > 0 ? prev.mileage : prevKm;
      const nextFuelType = v.fuelType || 'DIESEL';

      if (
        prev.initialMileage === prevKm &&
        prev.mileage === nextMileage &&
        prev.clientId === nextClientId &&
        prev.clientName === nextClientName &&
        prev.obraName === nextObra &&
        prev.contractId === nextContractId &&
        prev.contractNumber === nextContractNum &&
        prev.fuelType === nextFuelType
      ) {
        return prev;
      }

      return {
        ...prev,
        clientId: nextClientId,
        clientName: nextClientName,
        obraName: nextObra,
        contractId: nextContractId,
        contractNumber: nextContractNum,
        initialMileage: prevKm,
        mileage: nextMileage,
        fuelType: nextFuelType,
      };
    });
  }, [formData.vehicleId, veiculos, lastFuelRecord, isEditing]);

  useEffect(() => {
    if (!formData.garageId || !garages.length) {
      setFormData(prev => (prev.responsibleName ? { ...prev, responsibleName: '' } : prev));
      return;
    }
    const garage = garages.find(g => g.id === formData.garageId);
    if (garage) {
      setFormData(prev => {
        const nextResp = prev.responsibleName || garage.responsibleName || '';
        if (prev.garageName === garage.name && prev.responsibleName === nextResp) return prev;
        return {
          ...prev,
          garageName: garage.name,
          responsibleName: nextResp
        };
      });
    }
  }, [formData.garageId, garages]);

  useEffect(() => {
    if (!formData.responsibleEmployeeId) return;
    employeeService.getEmployeeById(formData.responsibleEmployeeId).then(emp => {
      if (emp) setFormData(prev => (prev.responsibleName === emp.name ? prev : { ...prev, responsibleName: emp.name }));
    }).catch(() => {});
  }, [formData.responsibleEmployeeId]);

  useEffect(() => {
    // Em edição, ignorar o próprio registro como "KM anterior" (a API pode retorná-lo)
    if (isEditing) {
      setMileageError(null);
      return;
    }
    if (!formData.mileage || !lastFuelRecord?.mileage) {
      setMileageError(null);
      return;
    }
    const current = Number(formData.mileage);
    const last = Number(lastFuelRecord.mileage);
    if (current <= last) {
      setMileageError(`KM deve ser maior que o anterior (${last.toLocaleString('pt-BR')} km)`);
    } else {
      setMileageError(null);
    }
  }, [formData.mileage, lastFuelRecord, isEditing]);

  useEffect(() => {
    if (!isTotalManual && formData.liters > 0 && formData.pricePerLiter > 0) {
      const calc = Number((formData.liters * formData.pricePerLiter).toFixed(2));
      setFormData(prev => (prev.totalValue === calc ? prev : { ...prev, totalValue: calc }));
    }
  }, [formData.liters, formData.pricePerLiter, isTotalManual]);

  // --- Handlers ---

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing && abastecimento
        ? fleetService.updateFuelRecord(abastecimento.id, data as any)
        : fleetService.createFuelRecord(data),
    onSuccess: () => {
      toast({
        title: 'Sucesso',
        description: isEditing ? 'Abastecimento externo atualizado!' : 'Abastecimento externo registrado!',
      });
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess();
      onClose();
      setFormData(DEFAULT_FORM);
      setIsTotalManual(false);
    },
    onError: (err: any) => {
      toast({ title: 'Erro', description: err.response?.data?.message || 'Erro ao salvar', variant: 'destructive' });
    }
  });

  const handleField = (field: keyof ExternoFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      // When client changes, clear obra and contract
      if (field === 'clientId') {
        const client = clients.find(c => c.id === value);
        next.clientName = client?.name || '';
        next.workPostId = '';
        next.obraName = '';
        next.contractId = '';
        next.contractNumber = '';
      }
      return next;
    });
    if (field === 'totalValue') setIsTotalManual(true);
  };

  const handleRecalculate = () => {
    if (formData.liters > 0 && formData.pricePerLiter > 0) {
      setFormData(prev => ({ ...prev, totalValue: Number((prev.liters * prev.pricePerLiter).toFixed(2)) }));
      setIsTotalManual(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.vehicleId || !formData.date || !formData.liters || !formData.station) {
      toast({ title: 'Erro', description: 'Preencha os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (mileageError) return;

    const computedCost = formData.totalValue || formData.liters * formData.pricePerLiter;
    if (!computedCost || computedCost <= 0) {
      toast({ title: 'Erro', description: 'Informe o Valor Total ou o Valor Unitário (R$/L) maior que zero', variant: 'destructive' });
      return;
    }
    const safeCost = Math.max(computedCost, 0.01);

    const payload = {
      vehicleId: formData.vehicleId,
      date: formData.date,
      fuelType: formData.fuelType,
      quantity: formData.liters,
      cost: safeCost,
      pricePerLiter: formData.pricePerLiter || null,
      mileage: formData.mileage,
      initialMileage: formData.initialMileage || null,
      station: formData.station,
      driverId: null,
      notes: formData.notes || `Abastecimento Externo | Garagem: ${formData.garageName} | Resp: ${formData.responsibleName}`,
      costCenter: null,
      clientId: formData.clientId || null,
      clientName: formData.clientName || null,
      workPostId: formData.workPostId || null,
      obraName: formData.obraName || null,
      contractId: formData.contractId || null,
      contractNumber: formData.contractNumber || null,
      supplierId: formData.supplierId || null,
    };

    const fd = new FormData();
    fd.append('fuelRecord', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (formData.receiptFile) {
      fd.append('receipt', formData.receiptFile);
    }
    saveMutation.mutate(fd as any);
  };

  const selectedVehicle = veiculos.find(v => v.id === formData.vehicleId);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="!max-w-3xl !max-h-[92vh] flex flex-col !p-0 overflow-hidden bg-seguranca-darkgray text-seguranca-white border-gray-700">
          <DialogHeader className="p-6 pb-3 border-b border-gray-700/50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-green-400" />
              {isEditing ? 'Editar Abastecimento Externo' : 'Abastecimento Externo - Posto de Gasolina'}
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              {isEditing
                ? 'Altere os dados do registro de abastecimento realizado em posto externo.'
                : 'Registro de abastecimento realizado em posto externo. Dados do veículo, cliente e contrato.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Veículo */}
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Veículo (Placa) *
              </Label>
              <VehicleCombobox
                value={formData.vehicleId}
                onChange={(vId) => handleField('vehicleId', vId)}
                className="w-full"
              />
              {selectedVehicle && (
                <div className="text-xs text-gray-500 flex gap-3 mt-1">
                  <span>Modelo: {selectedVehicle.brand} {selectedVehicle.model}</span>
                  <span>KM Atual: {(selectedVehicle.currentMileage || 0).toLocaleString('pt-BR')} km</span>
                </div>
              )}
            </div>

            {/* Cliente / Obra / Contrato */}
            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-blue-400" /> Dados do Cliente / Contrato
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Cliente</Label>
                  <SearchableSelect
                    value={formData.clientId}
                    onChange={(val) => handleField('clientId', val)}
                    options={clientOptions}
                    placeholder="Buscar cliente..."
                    searchPlaceholder="Digite o nome do cliente..."
                    emptyText="Nenhum cliente encontrado"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Obra / Setor</Label>
                  <SearchableSelect
                    value={formData.workPostId}
                    onChange={(val, opt) => {
                      handleField('workPostId', val);
                      handleField('obraName', opt?.label || '');
                    }}
                    options={workPostOptions}
                    placeholder={formData.clientId ? "Buscar obra..." : "Selecione o cliente primeiro"}
                    searchPlaceholder="Digite o nome da obra..."
                    emptyText="Nenhuma obra encontrada"
                    disabled={!formData.clientId}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Contrato</Label>
                  <SearchableSelect
                    value={formData.contractId}
                    onChange={(val, opt) => {
                      handleField('contractId', val);
                      handleField('contractNumber', opt?.label || '');
                    }}
                    options={contractOptions}
                    placeholder={formData.clientId ? "Buscar contrato..." : "Selecione o cliente primeiro"}
                    searchPlaceholder="Digite o nº do contrato..."
                    emptyText="Nenhum contrato encontrado"
                    disabled={!formData.clientId}
                  />
                </div>
              </div>
            </div>

            {/* Garagem e Responsável */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Garagem
                </Label>
                <SearchableSelect
                  value={formData.garageId}
                  onChange={(val) => handleField('garageId', val)}
                  options={garageOptions}
                  placeholder="Buscar garagem..."
                  searchPlaceholder="Digite o nome da garagem..."
                  emptyText="Nenhuma garagem encontrada"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Encarregado Responsável
                </Label>
                <EmployeeCombobox
                  value={formData.responsibleEmployeeId}
                  onChange={(empId) => {
                    handleField('responsibleEmployeeId', empId);
                  }}
                  placeholder="Buscar encarregado..."
                  searchPlaceholder="Digite o nome..."
                />
              </div>
            </div>

            {/* Data e KM */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Data *
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleField('date', e.target.value)}
                  className="bg-gray-900/50 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" /> KM Anterior (Auto)
                </Label>
                <Input
                  type="number"
                  readOnly
                  value={formData.initialMileage || 0}
                  className="bg-gray-800/80 border-gray-700 text-yellow-400 font-semibold cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                  <Gauge className="h-4 w-4" /> KM Atual *
                </Label>
                <Input
                  type="number"
                  value={formData.mileage || ''}
                  onChange={(e) => handleField('mileage', Number(e.target.value))}
                  className={`bg-gray-900/50 text-white ${mileageError ? 'border-red-500' : 'border-gray-600'}`}
                />
                {mileageError && <p className="text-xs text-red-400">{mileageError}</p>}
              </div>
            </div>

            {/* Dados do Abastecimento */}
            <div className="bg-gray-900/40 p-4 rounded-lg border border-gray-700/50 space-y-3">
              <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                <Fuel className="h-4 w-4 text-green-400" /> Dados do Abastecimento
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Combustível *</Label>
                  <Select value={formData.fuelType} onValueChange={(v) => handleField('fuelType', v)}>
                    <SelectTrigger className="bg-gray-900/50 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-600">
                      <SelectItem value="DIESEL">Diesel</SelectItem>
                      <SelectItem value="GASOLINE">Gasolina</SelectItem>
                      <SelectItem value="ETHANOL">Etanol</SelectItem>
                      <SelectItem value="FLEX">Flex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-gray-400 text-xs">Posto de Gasolina *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SearchableSelect
                        value={formData.supplierId}
                        onChange={(val, opt) => {
                          handleField('supplierId', val);
                          handleField('station', opt?.label || '');
                        }}
                        options={supplierOptions}
                        placeholder="Buscar posto..."
                        searchPlaceholder="Digite o nome do posto..."
                        emptyText="Nenhum posto encontrado"
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(true)} className="border-gray-600 text-gray-300 h-9 px-2 shrink-0">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Quantidade (Litros) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.liters || ''}
                    onChange={(e) => handleField('liters', Number(e.target.value))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Valor Unitário (R$/L) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.pricePerLiter || ''}
                    onChange={(e) => handleField('pricePerLiter', Number(e.target.value))}
                    className="bg-gray-900/50 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-400 text-xs">Valor Total (R$) *</Label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalValue || ''}
                      onChange={(e) => handleField('totalValue', Number(e.target.value))}
                      className={`bg-gray-900/50 border-gray-600 text-white ${isTotalManual ? 'border-yellow-600' : ''}`}
                    />
                    {isTotalManual && (
                      <Button type="button" size="sm" variant="ghost" onClick={handleRecalculate} title="Recalcular" className="h-9 px-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comprovante do Posto */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                <Upload className="h-4 w-4" /> Comprovante do Posto (PDF)
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 border-2 border-dashed border-gray-600 rounded-lg p-4 cursor-pointer hover:border-green-500/60 hover:bg-green-500/5 transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleField('receiptFile', file);
                    if (file) {
                      setReceiptPreview(file.name);
                    } else {
                      setReceiptPreview(null);
                    }
                  }}
                />
                {receiptPreview ? (
                  <>
                    <FileText className="h-8 w-8 text-green-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{receiptPreview}</p>
                      <p className="text-xs text-gray-400">Clique para trocar o arquivo</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleField('receiptFile', null);
                        setReceiptPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-400 hover:text-red-300 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-500 shrink-0" />
                    <div>
                      <p className="text-sm text-gray-300">Clique para selecionar o comprovante em PDF</p>
                      <p className="text-xs text-gray-500">Arquivo PDF (máx. 10MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <Label className="text-gray-300 font-medium flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Observações
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleField('notes', e.target.value)}
                placeholder="Observações sobre o abastecimento..."
                className="bg-gray-900/50 border-gray-600 text-white min-h-[70px]"
              />
            </div>
          </div>

          <div className="flex-none p-4 border-t border-gray-700 flex justify-end gap-3 bg-seguranca-darkgray">
            <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-400">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending || !!mileageError || !formData.vehicleId || !formData.liters || !formData.station}
              className="bg-green-600 hover:bg-green-700 text-white min-w-[160px]"
            >
              {saveMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> {isEditing ? 'Salvar Alterações' : 'Registrar Abastecimento'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSave={async (payload) => {
          try {
            await contasAPagarService.createFornecedor(payload);
            refetchSuppliers();
            setIsSupplierModalOpen(false);
            toast({ title: 'Sucesso', description: 'Posto cadastrado' });
          } catch {
            toast({ title: 'Erro', description: 'Erro ao cadastrar posto', variant: 'destructive' });
          }
        }}
      />
    </>
  );
};

export default AbastecimentoExternoFormModal;
