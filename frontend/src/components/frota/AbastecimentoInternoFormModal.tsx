'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Fuel,
  Building2,
  Car,
  User,
  Calendar,
  Gauge,
  Hash,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Save,
  Loader2,
  ChevronRight,
  Info,
  MapPin,
  Briefcase,
  FileText,
} from 'lucide-react';
import fleetService from '@/services/fleetService';
import { employeeService } from '@/services/employeeService';
import { garageService } from '@/services/garageService';
import fuelPumpService, { FuelPump, FuelTank } from '@/services/fuelPumpService';
import { Vehicle } from '@/types/fleet';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';

interface InternalFuelFormData {
  // Localização
  garageId: string;
  garageName: string;
  pumpId: string;
  pumpName: string;
  tankId: string;
  tankName: string;
  fuelCode: string;

  // Informações do abastecimento
  date: string;
  responsibleId: string;
  responsibleName: string;

  // Veículo + Auto-fill
  vehicleId: string;
  vehiclePlate: string;
  clientName: string;
  obraName: string;

  // Combustível
  fuelType: 'GASOLINE' | 'ETHANOL' | 'DIESEL' | 'FLEX';
  initialMileage: number;
  mileage: number;
  liters: number;
  notes: string;
}

interface AbastecimentoInternoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  veiculos: Vehicle[];
}

const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  DIESEL: 'Diesel',
  FLEX: 'Flex',
};

const FUEL_TYPE_COLORS: Record<string, string> = {
  GASOLINE: 'bg-red-500/20 text-red-400 border-red-500/30',
  ETHANOL: 'bg-green-500/20 text-green-400 border-green-500/30',
  DIESEL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  FLEX: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const DEFAULT_FORM: InternalFuelFormData = {
  garageId: '',
  garageName: '',
  pumpId: '',
  pumpName: '',
  tankId: '',
  tankName: '',
  fuelCode: '',
  date: new Date().toISOString().split('T')[0],
  responsibleId: '',
  responsibleName: '',
  vehicleId: '',
  vehiclePlate: '',
  clientName: '',
  obraName: '',
  fuelType: 'DIESEL',
  initialMileage: 0,
  mileage: 0,
  liters: 0,
  notes: '',
};

type WizardStep = 'localizacao' | 'veiculo' | 'abastecimento' | 'revisao';

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'localizacao', label: 'Garagem / Bomba', icon: <Building2 className="h-4 w-4" /> },
  { id: 'veiculo', label: 'Veículo', icon: <Car className="h-4 w-4" /> },
  { id: 'abastecimento', label: 'Abastecimento', icon: <Fuel className="h-4 w-4" /> },
  { id: 'revisao', label: 'Revisão', icon: <CheckCircle2 className="h-4 w-4" /> },
];

const AbastecimentoInternoFormModal: React.FC<AbastecimentoInternoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  veiculos,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<WizardStep>('localizacao');
  const [formData, setFormData] = useState<InternalFuelFormData>(DEFAULT_FORM);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [mileageWarning, setMileageWarning] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('localizacao');
      setFormData({ ...DEFAULT_FORM, date: new Date().toISOString().split('T')[0] });
      setMileageError(null);
      setMileageWarning(null);
    }
  }, [isOpen]);

  // Queries
  const { data: garages = [] } = useQuery({
    queryKey: ['garages'],
    queryFn: garageService.list,
    enabled: isOpen,
  });

  const { data: pumps = [] } = useQuery({
    queryKey: ['fuelPumps'],
    queryFn: fuelPumpService.getPumps,
    enabled: isOpen,
  });

  const { data: tanks = [] } = useQuery({
    queryKey: ['fuelTanks'],
    queryFn: fuelPumpService.getTanks,
    enabled: isOpen,
  });

  const { data: lastFuelRecord } = useQuery({
    queryKey: ['lastFuelRecord', formData.vehicleId],
    queryFn: async () => {
      if (!formData.vehicleId) return null;
      try {
        return await fleetService.getLastFuelRecord(formData.vehicleId);
      } catch {
        return null;
      }
    },
    enabled: !!formData.vehicleId,
  });

  // Auto-fill vehicle info when vehicle changes
  useEffect(() => {
    if (!formData.vehicleId) return;
    const vehicle = veiculos.find(v => v.id === formData.vehicleId);
    if (vehicle) {
      const autoKm = lastFuelRecord?.mileage ?? vehicle.currentMileage ?? 0;
      setFormData(prev => ({
        ...prev,
        vehiclePlate: vehicle.plate || '',
        clientName: vehicle.clientName || (vehicle as any).client?.name || '',
        obraName: vehicle.postoDeTrabalho || (vehicle as any).workPostEntity?.name || '',
        fuelType: (vehicle.fuelType as any) || prev.fuelType,
        initialMileage: autoKm,
        mileage: prev.mileage > 0 ? prev.mileage : autoKm,
      }));
    }
  }, [formData.vehicleId, lastFuelRecord]);

  // Auto-fill pump/tank name
  useEffect(() => {
    if (formData.pumpId) {
      const pump = pumps.find(p => p.id === formData.pumpId);
      if (pump) {
        setFormData(prev => ({ ...prev, pumpName: pump.name, tankId: pump.fuelTankId, tankName: pump.fuelTankName }));
      }
    }
  }, [formData.pumpId, pumps]);

  // Auto-fill responsible name when responsibleId changes
  useEffect(() => {
    if (!formData.responsibleId) {
      setField('responsibleName', '');
      return;
    }
    employeeService.getEmployeeById(formData.responsibleId).then(emp => {
      if (emp) setField('responsibleName', emp.name || emp.fullName || '');
    }).catch(() => {});
  }, [formData.responsibleId]);

  // Validate mileage
  useEffect(() => {
    if (!formData.mileage || !lastFuelRecord?.mileage) {
      setMileageError(null);
      setMileageWarning(null);
      return;
    }
    const current = Number(formData.mileage);
    const last = lastFuelRecord.mileage;
    if (current <= last) {
      setMileageError(`KM deve ser maior que o anterior (${last.toLocaleString('pt-BR')} km).`);
      setMileageWarning(null);
    } else {
      setMileageError(null);
      const diff = current - last;
      if (diff > 2000) {
        setMileageWarning(`Diferença alta: ${diff.toLocaleString('pt-BR')} km. Confira o valor.`);
      } else {
        setMileageWarning(null);
      }
    }
  }, [formData.mileage, lastFuelRecord]);

  // --- Filtered pump/tank options ---
  const pumpOptions: SearchableOption[] = useMemo(() =>
    pumps.map(p => ({
      value: p.id,
      label: p.name,
      subtitle: p.fuelTankName || '',
      keywords: [p.name, p.fuelTankName || ''].filter(Boolean),
    })),
  [pumps]);

  const tankOptions: SearchableOption[] = useMemo(() =>
    tanks.map(t => ({
      value: t.id,
      label: t.name,
      subtitle: `${FUEL_TYPE_LABELS[t.fuelType] || t.fuelType} • ${t.currentLevel?.toFixed(0)}L disponíveis`,
      keywords: [t.name, t.fuelType, FUEL_TYPE_LABELS[t.fuelType] || ''].filter(Boolean),
    })),
  [tanks]);

  const setField = <K extends keyof InternalFuelFormData>(field: K, value: InternalFuelFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createMutation = useMutation({
    mutationFn: (data: FormData) => fleetService.createFuelRecord(data),
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Abastecimento interno registrado.' });
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao salvar abastecimento.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (mileageError) {
      toast({ title: 'Erro', description: 'Corrija o KM de abastecimento.', variant: 'destructive' });
      return;
    }

    const payload = {
      vehicleId: formData.vehicleId,
      date: formData.date,
      fuelType: formData.fuelType,
      quantity: formData.liters,
      cost: 0, // Abastecimento interno — sem custo externo
      mileage: formData.mileage,
      initialMileage: formData.initialMileage || null,
      station: formData.garageName || 'Abastecimento Interno',
      driverId: formData.responsibleId || null,
      notes: [
        `Código: ${formData.fuelCode || 'N/I'}`,
        `Garagem: ${formData.garageName || 'N/I'}`,
        `Bomba/Tanque: ${formData.pumpName || formData.tankName || 'N/I'}`,
        formData.notes,
      ].filter(Boolean).join(' | '),
      costCenter: null,
      clientId: null,
      clientName: formData.clientName || null,
      workPostId: null,
      obraName: formData.obraName || null,
      contractId: null,
      contractNumber: null,
      supplierId: null,
      isInternal: true,
    };

    const fd = new FormData();
    fd.append('fuelRecord', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    createMutation.mutate(fd as any);
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === step);
  const canGoNext = (): boolean => {
    if (step === 'localizacao') return !!formData.garageId && !!formData.date;
    if (step === 'veiculo') return !!formData.vehicleId;
    if (step === 'abastecimento') return formData.liters > 0 && !mileageError;
    return true;
  };

  const goNext = () => {
    const nextStep = STEPS[currentStepIndex + 1];
    if (nextStep) setStep(nextStep.id);
  };

  const goBack = () => {
    const prevStep = STEPS[currentStepIndex - 1];
    if (prevStep) setStep(prevStep.id);
  };

  const selectedVehicle = veiculos.find(v => v.id === formData.vehicleId);
  const selectedTank = tanks.find(t => t.id === formData.tankId);

  // Pre-compute to avoid > operator confusing Rollup's JSX parser
  const litersExceedsTank = selectedTank != null && formData.liters > 0 && formData.liters > selectedTank.currentLevel;
  const litersOk = selectedTank != null && formData.liters > 0 && formData.liters <= selectedTank.currentLevel;
  const tankStatusClass = litersExceedsTank
    ? 'flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-red-900/20 text-red-400 border border-red-800/30'
    : 'flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-800/30';
  const tankStatusMsg = litersExceedsTank
    ? `Quantidade solicitada (${formData.liters}L) excede o nível atual do tanque (${selectedTank?.currentLevel?.toFixed(0)}L)`
    : selectedTank
    ? `Nível após abastecimento: ${(selectedTank.currentLevel - formData.liters).toFixed(0)}L restantes`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-3xl !h-[92vh] flex flex-col !p-0 overflow-hidden bg-gray-950 text-white border border-gray-800 shadow-2xl">
        
        {/* ── HEADER ── */}
        <DialogHeader className="px-6 pt-5 pb-0 flex-none">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30">
              <Fuel className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white">Abastecimento Interno</DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                Registro de abastecimento em garagem / bomba própria
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── WIZARD STEPS ── */}
        <div className="px-6 pt-4 pb-2 flex-none">
          <div className="flex items-center gap-0">
            {STEPS.map((s, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <React.Fragment key={s.id}>
                  <button
                    onClick={() => isDone && setStep(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : isDone
                        ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60 cursor-pointer'
                        : 'bg-gray-800/50 text-gray-500 cursor-default'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={`h-3.5 w-3.5 mx-1 flex-none ${idx < currentStepIndex ? 'text-emerald-500' : 'text-gray-700'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ── STEP 1: Localização ── */}
          {step === 'localizacao' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-800/30 flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-none" />
                <p className="text-xs text-blue-300">
                  Selecione a garagem e a bomba/tanque de onde o abastecimento será realizado. O código de abastecimento é gerado automaticamente ou pode ser informado manualmente.
                </p>
              </div>

              {/* Garagem */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-400" />
                  Garagem *
                </Label>
                <Select
                  value={formData.garageId}
                  onValueChange={(val) => {
                    const garage = garages.find(g => g.id === val);
                    setField('garageId', val);
                    setField('garageName', garage?.name || '');
                  }}
                >
                  <SelectTrigger className="bg-gray-900/80 border-gray-700 text-white h-11">
                    <SelectValue placeholder="Selecione a garagem..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {garages.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        <span className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-blue-400" />
                          {g.name}
                          {g.address && <span className="text-gray-500 text-xs">• {g.address}</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bomba / Tanque */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-cyan-400" />
                    Bomba / Dispensador
                  </Label>
                  <SearchableSelect
                    value={formData.pumpId}
                    onChange={(val, opt) => {
                      setField('pumpId', val);
                      if (opt) {
                        const pump = pumps.find(p => p.id === val);
                        setField('pumpName', pump?.name || opt.label);
                        if (pump) {
                          setField('tankId', pump.fuelTankId || '');
                          setField('tankName', pump.fuelTankName || '');
                        }
                      }
                    }}
                    options={pumpOptions}
                    placeholder="Selecione a bomba..."
                    searchPlaceholder="Buscar bomba..."
                    emptyText="Nenhuma bomba encontrada."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-400" />
                    Tanque
                  </Label>
                  <SearchableSelect
                    value={formData.tankId}
                    onChange={(val, opt) => {
                      setField('tankId', val);
                      const tank = tanks.find(t => t.id === val);
                      setField('tankName', tank?.name || opt?.label || '');
                    }}
                    options={tankOptions}
                    placeholder="Selecione o tanque..."
                    searchPlaceholder="Buscar tanque..."
                    emptyText="Nenhum tanque encontrado."
                  />
                </div>
              </div>

              {/* Tanque info card */}
              {selectedTank && (
                <div className="p-3 rounded-lg bg-amber-900/10 border border-amber-700/30 flex items-center gap-3">
                  <Fuel className="h-5 w-5 text-amber-400 flex-none" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">{selectedTank.name}</p>
                    <p className="text-xs text-amber-400/70">
                      {FUEL_TYPE_LABELS[selectedTank.fuelType] || selectedTank.fuelType} •
                      Capacidade: {selectedTank.capacity?.toLocaleString('pt-BR')} L •
                      Nível atual: <strong>{selectedTank.currentLevel?.toFixed(0)} L</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Código e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Hash className="h-4 w-4 text-purple-400" />
                    Código de Abastecimento
                  </Label>
                  <Input
                    placeholder={`INT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-AUTO`}
                    value={formData.fuelCode}
                    onChange={e => setField('fuelCode', e.target.value)}
                    className="bg-gray-900/80 border-gray-700 text-white h-11 placeholder:text-gray-600"
                  />
                  <p className="text-xs text-gray-500">Deixe em branco para gerar automaticamente</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-400" />
                    Data do Abastecimento *
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={e => setField('date', e.target.value)}
                    className="bg-gray-900/80 border-gray-700 text-white h-11"
                  />
                </div>
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-green-400" />
                  Quem Abasteceu (Responsável) *
                </Label>
                <EmployeeCombobox
                  value={formData.responsibleId}
                  onChange={(val) => {
                    setField('responsibleId', val);
                  }}
                  placeholder="Selecione o responsável..."
                  searchPlaceholder="Buscar funcionário..."
                  emptyPlaceholder="Nenhum funcionário encontrado."
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Veículo ── */}
          {step === 'veiculo' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-start gap-3">
                <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-none" />
                <p className="text-xs text-emerald-300">
                  Ao selecionar o veículo, o cliente, obra e quilometragem anterior são preenchidos automaticamente com base na alocação atual.
                </p>
              </div>

              {/* Seleção do veículo */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Car className="h-4 w-4 text-blue-400" />
                  Veículo *
                </Label>
                <VehicleCombobox
                  value={formData.vehicleId}
                  onChange={(val) => setField('vehicleId', val)}
                />
              </div>

              {/* Auto-fill info card */}
              {selectedVehicle && (
                <div className="rounded-xl border border-gray-700/60 overflow-hidden">
                  <div className="px-4 py-2.5 bg-gray-800/60 border-b border-gray-700/60 flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">{selectedVehicle.plate}</span>
                    <span className="text-gray-400 text-sm">—</span>
                    <span className="text-gray-300 text-sm">{selectedVehicle.brand} {selectedVehicle.model}</span>
                    {selectedVehicle.fuelType && (
                      <Badge className={`ml-auto text-xs ${FUEL_TYPE_COLORS[selectedVehicle.fuelType] || 'bg-gray-700 text-gray-300'}`}>
                        {FUEL_TYPE_LABELS[selectedVehicle.fuelType] || selectedVehicle.fuelType}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-700/60">
                    <div className="px-4 py-3 bg-gray-900/40">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> Cliente
                      </p>
                      <p className="text-sm font-medium text-white">{formData.clientName || '—'}</p>
                    </div>
                    <div className="px-4 py-3 bg-gray-900/40">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Obra / Posto
                      </p>
                      <p className="text-sm font-medium text-white">{formData.obraName || '—'}</p>
                    </div>
                    <div className="px-4 py-3 bg-gray-900/40">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Gauge className="h-3 w-3" /> KM Anterior
                      </p>
                      <p className="text-sm font-medium text-yellow-400">
                        {formData.initialMileage?.toLocaleString('pt-BR') || '—'} km
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cliente / Obra overrides */}
              {selectedVehicle && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-400 font-medium text-sm">Cliente (editável)</Label>
                    <Input
                      value={formData.clientName}
                      onChange={e => setField('clientName', e.target.value)}
                      placeholder="Nome do cliente"
                      className="bg-gray-900/80 border-gray-700 text-white h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-400 font-medium text-sm">Obra / Setor (editável)</Label>
                    <Input
                      value={formData.obraName}
                      onChange={e => setField('obraName', e.target.value)}
                      placeholder="Nome da obra ou setor"
                      className="bg-gray-900/80 border-gray-700 text-white h-10"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Abastecimento ── */}
          {step === 'abastecimento' && (
            <div className="space-y-5">
              {/* Tipo de Combustível */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Fuel className="h-4 w-4 text-amber-400" />
                  Tipo de Combustível
                </Label>
                <div className="grid grid-cols-4 gap-2">
                  {(['DIESEL', 'GASOLINE', 'ETHANOL', 'FLEX'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setField('fuelType', type)}
                      className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                        formData.fuelType === type
                          ? FUEL_TYPE_COLORS[type]
                          : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      {FUEL_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* KMs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    KM Anterior (Leitura anterior)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      readOnly
                      value={formData.initialMileage || lastFuelRecord?.mileage || 0}
                      className="bg-gray-800 border-gray-700 text-yellow-400 font-semibold h-11 cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-3 text-xs text-gray-500">km</span>
                  </div>
                  <p className="text-xs text-gray-500">Preenchido automaticamente pelo sistema</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300 font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-blue-400" />
                    KM do Abastecimento *
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.mileage || ''}
                      onChange={e => setField('mileage', Number(e.target.value))}
                      placeholder="0"
                      className={`bg-gray-900/80 border-gray-700 text-white h-11 ${mileageError ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <span className="absolute right-3 top-3 text-xs text-gray-500">km</span>
                  </div>
                  {mileageError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                      {mileageError}
                    </div>
                  )}
                  {mileageWarning && !mileageError && (
                    <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                      <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                      {mileageWarning}
                    </div>
                  )}
                </div>
              </div>

              {/* Litros */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  Quantidade (Litros) *
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.liters || ''}
                    onChange={e => setField('liters', Number(e.target.value))}
                    placeholder="0.00"
                    className="bg-gray-900/80 border-gray-700 text-white h-11 text-lg font-semibold"
                  />
                  <span className="absolute right-3 top-3 text-sm text-cyan-400 font-medium">L</span>
                </div>

                {/* Tanque info */}
                {(litersExceedsTank || litersOk) && (
                  <div className={tankStatusClass}>
                    {litersExceedsTank
                      ? <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                      : <CheckCircle2 className="h-3.5 w-3.5 flex-none" />
                    }
                    {tankStatusMsg}
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  Observações
                </Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => setField('notes', e.target.value)}
                  placeholder="Adicione observações sobre este abastecimento..."
                  className="bg-gray-900/80 border-gray-700 text-white min-h-[80px] resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: Revisão ── */}
          {step === 'revisao' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-900/10 border border-emerald-800/30 flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-none" />
                <p className="text-xs text-emerald-300">
                  Revise os dados antes de confirmar. Após salvo, o abastecimento não pode ser editado nesta tela.
                </p>
              </div>

              {/* Summary grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: <Building2 className="h-4 w-4 text-blue-400" />, label: 'Garagem', value: formData.garageName || '—' },
                  { icon: <Droplets className="h-4 w-4 text-cyan-400" />, label: 'Bomba / Tanque', value: `${formData.pumpName || '—'} / ${formData.tankName || '—'}` },
                  { icon: <Hash className="h-4 w-4 text-purple-400" />, label: 'Código', value: formData.fuelCode || 'Gerado automaticamente' },
                  { icon: <Calendar className="h-4 w-4 text-green-400" />, label: 'Data', value: new Date(formData.date + 'T12:00:00').toLocaleDateString('pt-BR') },
                  { icon: <User className="h-4 w-4 text-green-400" />, label: 'Responsável', value: formData.responsibleName || '—' },
                  { icon: <Car className="h-4 w-4 text-blue-400" />, label: 'Veículo', value: `${formData.vehiclePlate} — ${selectedVehicle?.brand || ''} ${selectedVehicle?.model || ''}` },
                  { icon: <Briefcase className="h-4 w-4 text-orange-400" />, label: 'Cliente', value: formData.clientName || '—' },
                  { icon: <MapPin className="h-4 w-4 text-orange-400" />, label: 'Obra / Setor', value: formData.obraName || '—' },
                  { icon: <Fuel className="h-4 w-4 text-amber-400" />, label: 'Combustível', value: FUEL_TYPE_LABELS[formData.fuelType] },
                  { icon: <Gauge className="h-4 w-4 text-yellow-400" />, label: 'KM Anterior', value: `${formData.initialMileage?.toLocaleString('pt-BR') || '0'} km` },
                  { icon: <Gauge className="h-4 w-4 text-blue-400" />, label: 'KM Abastecimento', value: `${formData.mileage?.toLocaleString('pt-BR') || '0'} km` },
                  { icon: <Droplets className="h-4 w-4 text-cyan-400" />, label: 'Litros', value: `${formData.liters?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L` },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                    <div className="flex-none">{item.icon}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.label}</p>
                      <p className="text-sm font-medium text-white truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {formData.notes && (
                <div className="p-3 rounded-lg bg-gray-900/60 border border-gray-800">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Observações</p>
                  <p className="text-sm text-gray-300">{formData.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER NAVIGATION ── */}
        <div className="flex-none px-6 py-4 border-t border-gray-800 bg-gray-950 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={step === 'localizacao' ? onClose : goBack}
            className="text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500"
          >
            {step === 'localizacao' ? 'Cancelar' : '← Voltar'}
          </Button>

          <div className="flex items-center gap-2">
            {/* Progress dots */}
            <div className="flex gap-1.5 mr-2">
              {STEPS.map((s, idx) => (
                <div
                  key={s.id}
                  className={`h-1.5 rounded-full transition-all ${
                    idx <= currentStepIndex
                      ? idx < currentStepIndex ? 'w-4 bg-emerald-500' : 'w-4 bg-blue-500'
                      : 'w-1.5 bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {step !== 'revisao' ? (
              <Button
                type="button"
                onClick={goNext}
                disabled={!canGoNext()}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
              >
                Próximo →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending || !!mileageError}
                className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[160px]"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Confirmar Abastecimento
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AbastecimentoInternoFormModal;
