import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveDrawer } from '@/components/ResponsiveDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import fleetService from '@/services/fleetService';
import { employeeService } from '@/services/employeeService';
import { garageService } from '@/services/garageService';
import fuelPumpService from '@/services/fuelPumpService';
import { FuelRecord, Vehicle } from '@/types/fleet';
import {
  Fuel, Building2, Car, User, Calendar, Gauge, Hash, Droplets,
  AlertTriangle, CheckCircle2, Info, MapPin, Briefcase, Eye,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { EmployeeCombobox } from '@/components/ui/employee-combobox';
import { VehicleCombobox } from '@/components/ui/vehicle-combobox';
import { workPostService, WorkPost } from '@/services/workPostService';
import { clientService, Client } from '@/services/clientService';

interface AbastecimentoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  abastecimento: FuelRecord | null;
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

const AbastecimentoEditModal: React.FC<AbastecimentoEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  abastecimento,
  veiculos,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [mileageWarning, setMileageWarning] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedVehicleObj, setSelectedVehicleObj] = useState<any>(null);

  const [formData, setFormData] = useState({
    garageId: '',
    garageName: '',
    pumpId: '',
    pumpName: '',
    tankId: '',
    tankName: '',
    fuelCode: '',
    date: '',
    responsibleId: '',
    responsibleName: '',
    vehicleId: '',
    vehiclePlate: '',
    clientName: '',
    obraName: '',
    fuelType: 'DIESEL' as string,
    initialMileage: 0,
    mileage: 0,
    liters: 0,
    notes: '',
  });

  // Preencher formulário quando o modal abrir
  useEffect(() => {
    if (abastecimento && isOpen) {
      let dataFormatada = '';
      if (abastecimento.date) {
        if (abastecimento.date.includes('-')) {
          dataFormatada = abastecimento.date;
        } else {
          try {
            const data = new Date(abastecimento.date);
            if (!isNaN(data.getTime())) {
              dataFormatada = data.toISOString().split('T')[0];
            }
          } catch {
            dataFormatada = '';
          }
        }
      }

      // Parse notes for garage/pump info
      const notesStr = abastecimento.notes || '';
      const garageMatch = notesStr.match(/Garagem: ([^|]+)/);
      const pumpMatch = notesStr.match(/Bomba\/Tanque: ([^|]+)/);
      const codeMatch = notesStr.match(/Código: ([^|]+)/);

      setSelectedVehicleObj(null);
      setFormData({
        garageId: '',
        garageName: garageMatch?.[1]?.trim() || '',
        pumpId: '',
        pumpName: pumpMatch?.[1]?.trim() || '',
        tankId: '',
        tankName: '',
        fuelCode: codeMatch?.[1]?.trim() || '',
        date: dataFormatada,
        responsibleId: abastecimento.driver?.id || '',
        responsibleName: abastecimento.driver?.name || '',
        vehicleId: abastecimento.vehicleId || '',
        vehiclePlate: abastecimento.vehicle?.plate || '',
        clientName: abastecimento.clientName || '',
        obraName: abastecimento.obraName || '',
        fuelType: abastecimento.fuelType || 'DIESEL',
        initialMileage: abastecimento.initialMileage || 0,
        mileage: abastecimento.mileage || 0,
        liters: abastecimento.quantity || 0,
        notes: notesStr,
      });
    }
  }, [abastecimento, isOpen]);

  // --- Queries ---
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

  const { data: workPostsData = [] } = useQuery({
    queryKey: ['workPostsAll'],
    queryFn: () => workPostService.getAllWorkPosts(),
    enabled: isOpen,
  });

  const { data: clientsData = [] } = useQuery({
    queryKey: ['clientsAll'],
    queryFn: () => clientService.getAllClients(),
    enabled: isOpen,
  });

  const workPosts: WorkPost[] = useMemo(() => {
    if (Array.isArray(workPostsData)) return workPostsData;
    if (workPostsData && Array.isArray((workPostsData as any).content)) return (workPostsData as any).content;
    return [];
  }, [workPostsData]);

  const clients: Client[] = useMemo(() => {
    if (Array.isArray(clientsData)) return clientsData;
    if (clientsData && Array.isArray((clientsData as any).content)) return (clientsData as any).content;
    return [];
  }, [clientsData]);

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
    enabled: !!formData.vehicleId && isOpen,
  });

  // Função inteligente para resolver Cliente e Obra/Setor do veículo
  const resolveVehicleClientAndObra = React.useCallback((vehicle: any, lastFuel?: any) => {
    if (!vehicle) return { clientName: '', obraName: '' };

    // 1. Resolver Cliente
    let resolvedClient = vehicle.clientName || vehicle.client?.name || vehicle.cliente || '';

    if (!resolvedClient && vehicle.clientId && clients.length > 0) {
      const foundClient = clients.find((c: any) => c.id === vehicle.clientId);
      if (foundClient) {
        resolvedClient = foundClient.name || (foundClient as any).corporateReason || (foundClient as any).tradeName || '';
      }
    }

    if (vehicle.workPostId && workPosts.length > 0) {
      const foundWp = workPosts.find((w: any) => w.id === vehicle.workPostId);
      if (foundWp && foundWp.clientName) {
        resolvedClient = foundWp.clientName;
      }
    }

    if (!resolvedClient && (lastFuel?.clientName || lastFuelRecord?.clientName)) {
      resolvedClient = lastFuel?.clientName || lastFuelRecord?.clientName || '';
    }

    // 2. Resolver Obra / Setor
    let resolvedObra = vehicle.workPostName || vehicle.postoDeTrabalho || vehicle.obraName || (vehicle as any).workPostEntity?.name || '';

    if (!resolvedObra && vehicle.workPostId && workPosts.length > 0) {
      const foundWp = workPosts.find((w: any) => w.id === vehicle.workPostId);
      if (foundWp) {
        resolvedObra = foundWp.name || foundWp.description || '';
      }
    }

    if (!resolvedObra) {
      resolvedObra = vehicle.location || vehicle.projectName || vehicle.operationName || '';
    }

    if (!resolvedObra && resolvedClient && workPosts.length > 0) {
      const clientUpper = resolvedClient.trim().toUpperCase();
      const matchingWp = workPosts.find((w: any) => {
        const wpClient = (w.clientName || '').toUpperCase();
        return wpClient && (wpClient.includes(clientUpper) || clientUpper.includes(wpClient));
      });
      if (matchingWp) {
        resolvedObra = matchingWp.name || matchingWp.description || '';
      }
    }

    if (!resolvedObra && (lastFuel?.obraName || lastFuelRecord?.obraName)) {
      resolvedObra = lastFuel?.obraName || lastFuelRecord?.obraName || '';
    }

    if (!resolvedClient && vehicle.garageName) {
      resolvedClient = 'OPERACIONAL';
      resolvedObra = resolvedObra || vehicle.garageName;
    }

    return {
      clientName: resolvedClient,
      obraName: resolvedObra,
    };
  }, [clients, workPosts, lastFuelRecord]);

  // --- Effects ---
  useEffect(() => {
    if (!formData.vehicleId) return;
    const v = (selectedVehicleObj && selectedVehicleObj.id === formData.vehicleId)
      ? selectedVehicleObj
      : veiculos.find(x => x.id === formData.vehicleId);
    if (!v) return;

    const prevKm = lastFuelRecord?.mileage ?? v.currentMileage ?? 0;
    const { clientName, obraName } = resolveVehicleClientAndObra(v, lastFuelRecord);

    setFormData(prev => ({
      ...prev,
      vehiclePlate: v.plate || (v as any).placa || prev.vehiclePlate,
      clientName: prev.clientName || clientName || '',
      obraName: prev.obraName || obraName || '',
      fuelType: (v.fuelType as any) || prev.fuelType,
      initialMileage: prev.initialMileage || prevKm,
      mileage: prev.mileage > 0 ? prev.mileage : prevKm,
    }));
  }, [formData.vehicleId, selectedVehicleObj, veiculos, lastFuelRecord, resolveVehicleClientAndObra]);

  useEffect(() => {
    if (formData.pumpId) {
      const pump = pumps.find(p => p.id === formData.pumpId);
      if (pump) {
        setFormData(prev => ({ ...prev, pumpName: pump.name, tankId: pump.fuelTankId, tankName: pump.fuelTankName }));
      }
    }
  }, [formData.pumpId, pumps]);

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

  useEffect(() => {
    if (!formData.responsibleId) {
      setField('responsibleName', '');
      return;
    }
    employeeService.getEmployeeById(formData.responsibleId).then(emp => {
      if (emp) setField('responsibleName', emp.name || '');
    }).catch(() => {});
  }, [formData.responsibleId]);

  // --- Options ---
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

  const clientOptions = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c: any) => {
      const n = c.name || c.corporateReason || c.tradeName;
      if (n) set.add(n);
    });
    workPosts.forEach((w: any) => {
      if (w.clientName) set.add(w.clientName);
    });
    return Array.from(set).sort();
  }, [clients, workPosts]);

  const obraOptions = useMemo(() => {
    const currentClient = formData.clientName?.trim().toUpperCase();
    const set = new Set<string>();

    workPosts.forEach((w: any) => {
      const wpClient = (w.clientName || '').toUpperCase();
      if (!currentClient || wpClient.includes(currentClient) || currentClient.includes(wpClient)) {
        if (w.name) set.add(w.name);
        if (w.description) set.add(w.description);
      }
    });

    if (set.size === 0) {
      workPosts.forEach((w: any) => {
        if (w.name) set.add(w.name);
        if (w.description) set.add(w.description);
      });
    }

    return Array.from(set).sort();
  }, [workPosts, formData.clientName]);

  const setField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedVehicle = (selectedVehicleObj && selectedVehicleObj.id === formData.vehicleId)
    ? selectedVehicleObj
    : veiculos.find(v => v.id === formData.vehicleId);
  const selectedTank = tanks.find(t => t.id === formData.tankId);

  // --- Submit ---
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => fleetService.updateFuelRecord(abastecimento?.id || '', data),
    onSuccess: () => {
      toast({ title: 'Sucesso!', description: 'Abastecimento atualizado.' });
      queryClient.invalidateQueries({ queryKey: ['fuelRecords'] });
      onSuccess();
    },
    onError: (err: any) => {
      toast({
        title: 'Erro',
        description: err.response?.data?.message || 'Erro ao atualizar.',
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
      cost: abastecimento?.cost ? Number(abastecimento.cost) : 0,
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
    updateMutation.mutate(fd);
  };

  // ─── Footer ─────────────────────────────────────────────────────────────────
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
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || !formData.vehicleId || updateMutation.isPending}
        className="flex-1 sm:flex-none h-10 sm:h-11 bg-seguranca-red hover:bg-seguranca-darkred text-white disabled:opacity-50"
      >
        {isLoading || updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );

  // ─── Helpers de UI ──────────────────────────────────────────────────────────
  const SectionHeader = ({
    icon: Icon,
    iconColor,
    bgColor,
    borderColor,
    title,
    subtitle,
  }: {
    icon: React.ElementType;
    iconColor: string;
    bgColor: string;
    borderColor: string;
    title: string;
    subtitle: string;
  }) => (
    <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-800/70 border-b border-gray-700/50">
      <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${bgColor} border ${borderColor}`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-[11px] text-gray-500">{subtitle}</p>
      </div>
    </div>
  );

  const FieldLabel = ({
    icon: Icon,
    iconColor,
    children,
    required,
  }: {
    icon?: React.ElementType;
    iconColor?: string;
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className={`h-3 w-3 ${iconColor}`} />}
      {children}
      {required && <span className="text-red-400">*</span>}
    </Label>
  );

  // ─── Formulário ─────────────────────────────────────────────────────────────
  const renderForm = () => (
    <div className="space-y-5 pb-2 min-w-0 max-w-full overflow-x-hidden">

      {/* ══ Seção 1: Localização ════════════════════════════════ */}
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <SectionHeader
          icon={Building2}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/15"
          borderColor="border-blue-500/25"
          title="Localização"
          subtitle="Garagem, bomba e tanque utilizados"
        />
        <div className="p-4 space-y-4">

          {/* Garagem */}
          <div className="space-y-1.5">
            <FieldLabel icon={Building2} iconColor="text-blue-400" required>Garagem</FieldLabel>
            <Select
              value={formData.garageId}
              onValueChange={(val) => {
                const garage = garages.find(g => g.id === val);
                setField('garageId', val);
                setField('garageName', garage?.name || '');
              }}
            >
              <SelectTrigger className="bg-gray-900/80 border-gray-700/60 text-white h-10 hover:border-gray-500 transition-colors">
                <SelectValue placeholder="Selecione a garagem..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {garages.map(g => (
                  <SelectItem key={g.id} value={g.id}>
                    <span className="flex items-center gap-2 min-w-0">
                      <Building2 className="h-3.5 w-3.5 text-blue-400 flex-none" />
                      <span className="truncate">{g.name}</span>
                      {g.address && <span className="text-gray-500 text-xs truncate">• {g.address}</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bomba / Tanque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel icon={Droplets} iconColor="text-cyan-400">Bomba / Dispensador</FieldLabel>
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
            <div className="space-y-1.5">
              <FieldLabel icon={Fuel} iconColor="text-amber-400">Tanque</FieldLabel>
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

          {/* Tanque info pill */}
          {selectedTank && (
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-amber-900/10 border border-amber-600/20">
              <Fuel className="h-4 w-4 text-amber-400 flex-none" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-300 truncate">{selectedTank.name}</p>
                <p className="text-[11px] text-amber-400/70">
                  {FUEL_TYPE_LABELS[selectedTank.fuelType] || selectedTank.fuelType}
                  {' • '}Cap: {selectedTank.capacity?.toLocaleString('pt-BR')} L
                  {' • '}Disponível:{' '}
                  <strong className="text-amber-300">{selectedTank.currentLevel?.toFixed(0)} L</strong>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ Seção 2: Identificação ══════════════════════════════ */}
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <SectionHeader
          icon={Hash}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/15"
          borderColor="border-purple-500/25"
          title="Identificação"
          subtitle="Código, data e responsável"
        />
        <div className="p-4 space-y-4">

          {/* Código + Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <FieldLabel icon={Hash} iconColor="text-purple-400">Código de Abastecimento</FieldLabel>
              <Input
                placeholder="Código do abastecimento"
                value={formData.fuelCode}
                onChange={e => setField('fuelCode', e.target.value)}
                className="bg-gray-900/80 border-gray-700/60 text-white h-10 placeholder:text-gray-600 hover:border-gray-500 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel icon={Calendar} iconColor="text-green-400" required>Data do Abastecimento</FieldLabel>
              <Input
                type="date"
                value={formData.date}
                onChange={e => setField('date', e.target.value)}
                className="bg-gray-900/80 border-gray-700/60 text-white h-10 hover:border-gray-500 transition-colors"
              />
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-1.5">
            <FieldLabel icon={User} iconColor="text-green-400" required>Quem Abasteceu</FieldLabel>
            <EmployeeCombobox
              value={formData.responsibleId}
              onChange={(val) => setField('responsibleId', val)}
              placeholder="Selecione o responsável..."
              searchPlaceholder="Buscar funcionário..."
              emptyPlaceholder="Nenhum funcionário encontrado."
            />
          </div>
        </div>
      </div>

      {/* ══ Seção 3: Veículo ════════════════════════════════════ */}
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <SectionHeader
          icon={Car}
          iconColor="text-cyan-400"
          bgColor="bg-cyan-500/15"
          borderColor="border-cyan-500/25"
          title="Veículo"
          subtitle="Seleção do veículo e dados vinculados"
        />
        <div className="p-4 space-y-4">

          <div className="space-y-1.5">
            <FieldLabel icon={Car} iconColor="text-cyan-400" required>Veículo</FieldLabel>
            <VehicleCombobox
              value={formData.vehicleId}
              onChange={(val, veh) => {
                setSelectedVehicleObj(veh);
                setField('vehicleId', val);
                if (veh) {
                  const { clientName, obraName } = resolveVehicleClientAndObra(veh);
                  setFormData(prev => ({
                    ...prev,
                    vehicleId: val,
                    vehiclePlate: veh.plate || (veh as any).placa || '',
                    clientName: clientName || '',
                    obraName: obraName || '',
                    fuelType: (veh.fuelType as any) || prev.fuelType,
                    initialMileage: veh.currentMileage || prev.initialMileage,
                    mileage: prev.mileage > 0 ? prev.mileage : (veh.currentMileage || 0),
                  }));
                }
              }}
            />
          </div>

          {/* Info card do veículo */}
          {selectedVehicle && (
            <div className="rounded-lg border border-gray-700/60 overflow-hidden">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-800/60 border-b border-gray-700/60 min-w-0">
                <Car className="h-4 w-4 text-cyan-400 flex-none" />
                <span className="text-sm font-bold text-white tracking-wider flex-none">{selectedVehicle.plate}</span>
                <span className="text-gray-500 text-xs">—</span>
                <span className="text-gray-300 text-sm truncate">{selectedVehicle.brand} {selectedVehicle.model}</span>
                {selectedVehicle.fuelType && (
                  <Badge className={`ml-auto text-[10px] shrink-0 ${FUEL_TYPE_COLORS[selectedVehicle.fuelType] || 'bg-gray-700 text-gray-300'}`}>
                    {FUEL_TYPE_LABELS[selectedVehicle.fuelType] || selectedVehicle.fuelType}
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700/60 bg-gray-900/40 min-w-0">
                <div className="px-3.5 py-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" /> Cliente
                  </p>
                  <p className="text-sm font-medium text-white truncate">{formData.clientName || '—'}</p>
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Obra / Posto
                  </p>
                  <p className="text-sm font-medium text-white truncate">{formData.obraName || '—'}</p>
                </div>
                <div className="px-3.5 py-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> KM Anterior
                  </p>
                  <p className="text-sm font-bold text-yellow-400">
                    {formData.initialMileage?.toLocaleString('pt-BR') || '—'} km
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cliente / Obra editáveis */}
          {selectedVehicle && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-gray-400" />
                    Cliente
                  </span>
                  <span className="text-[10px] text-emerald-400 normal-case font-normal">(autocompletado / editável)</span>
                </Label>
                <Input
                  list="edit-clients-list"
                  value={formData.clientName}
                  onChange={e => setField('clientName', e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-gray-900/80 border-gray-700/60 text-white h-10 hover:border-gray-500 focus:border-emerald-500/50 transition-colors"
                />
                <datalist id="edit-clients-list">
                  {clientOptions.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    Obra / Setor
                  </span>
                  <span className="text-[10px] text-emerald-400 normal-case font-normal">(autocompletado / editável)</span>
                </Label>
                <Input
                  list="edit-obras-list"
                  value={formData.obraName}
                  onChange={e => setField('obraName', e.target.value)}
                  placeholder="Nome da obra ou setor"
                  className="bg-gray-900/80 border-gray-700/60 text-white h-10 hover:border-gray-500 focus:border-emerald-500/50 transition-colors"
                />
                <datalist id="edit-obras-list">
                  {obraOptions.map((opt, i) => (
                    <option key={i} value={opt} />
                  ))}
                </datalist>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ Seção 4: Combustível & Quilometragem ════════════════ */}
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <SectionHeader
          icon={Fuel}
          iconColor="text-amber-400"
          bgColor="bg-amber-500/15"
          borderColor="border-amber-500/25"
          title="Combustível & Quilometragem"
          subtitle="Tipo, litros e leitura do hodômetro"
        />
        <div className="p-4 space-y-4">

          {/* Tipo de Combustível */}
          <div className="space-y-2">
            <FieldLabel icon={Fuel} iconColor="text-amber-400">Tipo de Combustível</FieldLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['DIESEL', 'GASOLINE', 'ETHANOL', 'FLEX'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setField('fuelType', type)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                    formData.fuelType === type
                      ? FUEL_TYPE_COLORS[type]
                      : 'bg-gray-800/50 text-gray-400 border-gray-700/60 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  {FUEL_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* KMs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* KM Anterior (readonly) */}
            <div className="space-y-1.5">
              <FieldLabel icon={Gauge} iconColor="text-gray-500">KM Anterior</FieldLabel>
              <div className="relative">
                <Input
                  type="number"
                  readOnly
                  value={formData.initialMileage || lastFuelRecord?.mileage || 0}
                  className="bg-gray-800/60 border-gray-700/40 text-yellow-400 font-semibold h-10 cursor-not-allowed pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">km</span>
              </div>
              <p className="text-[10px] text-gray-600">Preenchido automaticamente</p>
            </div>

            {/* KM Abastecimento */}
            <div className="space-y-1.5">
              <FieldLabel icon={Gauge} iconColor="text-blue-400" required>KM do Abastecimento</FieldLabel>
              <div className="relative">
                <Input
                  type="number"
                  value={formData.mileage || ''}
                  onChange={e => setField('mileage', Number(e.target.value))}
                  placeholder="0"
                  className={`bg-gray-900/80 text-white h-10 pr-10 transition-colors ${
                    mileageError
                      ? 'border-red-500/70 focus:ring-red-500'
                      : 'border-gray-700/60 hover:border-gray-500'
                  }`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">km</span>
              </div>
              {mileageError && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-400 bg-red-900/15 rounded-md px-2.5 py-1.5 border border-red-800/30">
                  <AlertTriangle className="h-3.5 w-3.5 flex-none mt-px" />
                  {mileageError}
                </div>
              )}
              {mileageWarning && !mileageError && (
                <div className="flex items-start gap-1.5 text-[11px] text-yellow-400 bg-yellow-900/15 rounded-md px-2.5 py-1.5 border border-yellow-800/30">
                  <AlertTriangle className="h-3.5 w-3.5 flex-none mt-px" />
                  {mileageWarning}
                </div>
              )}
            </div>
          </div>

          {/* Litros */}
          <div className="space-y-1.5">
            <FieldLabel icon={Droplets} iconColor="text-cyan-400" required>Quantidade (Litros)</FieldLabel>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={formData.liters || ''}
                onChange={e => setField('liters', Number(e.target.value))}
                placeholder="0.00"
                className="bg-gray-900/80 border-gray-700/60 text-white h-10 pr-10 hover:border-gray-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">L</span>
            </div>
            {selectedTank && formData.liters > 0 && (
              <div className={`flex items-center gap-2 text-[11px] rounded-md px-3 py-2 border ${
                formData.liters > selectedTank.currentLevel
                  ? 'bg-red-900/15 text-red-400 border-red-800/30'
                  : 'bg-emerald-900/15 text-emerald-400 border-emerald-800/30'
              }`}>
                <Droplets className="h-3.5 w-3.5 flex-none" />
                {formData.liters > selectedTank.currentLevel
                  ? `Quantidade (${formData.liters}L) excede o nível atual do tanque (${selectedTank.currentLevel?.toFixed(0)}L)`
                  : `Saldo após abastecimento: ${(selectedTank.currentLevel - formData.liters).toFixed(0)} L restantes`
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ Seção 5: Observações ════════════════════════════════ */}
      <div className="rounded-xl border border-gray-700/50 overflow-hidden">
        <SectionHeader
          icon={Info}
          iconColor="text-gray-400"
          bgColor="bg-gray-500/15"
          borderColor="border-gray-500/25"
          title="Observações"
          subtitle="Informações adicionais opcionais"
        />
        <div className="p-4">
          <Textarea
            value={formData.notes}
            onChange={e => setField('notes', e.target.value)}
            rows={3}
            placeholder="Observações sobre o abastecimento..."
            className="bg-gray-900/80 border-gray-700/60 text-white resize-none placeholder:text-gray-600 hover:border-gray-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <ResponsiveDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Abastecimento Interno"
        description="Atualize os campos abaixo para modificar o registro de abastecimento."
        footer={footer}
        className="max-w-5xl max-w-[calc(100vw-2rem)] w-full"
      >
        {renderForm()}
      </ResponsiveDrawer>

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
