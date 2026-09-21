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

  // --- Effects ---
  useEffect(() => {
    if (!formData.vehicleId || !veiculos.length) return;
    const v = veiculos.find(x => x.id === formData.vehicleId);
    if (!v) return;

    const prevKm = lastFuelRecord?.mileage ?? v.currentMileage ?? 0;

    setFormData(prev => ({
      ...prev,
      clientName: prev.clientName || v.clientName || (v as any).client?.name || '',
      obraName: prev.obraName || (v as any).workPostEntity?.name || v.location || '',
      fuelType: v.fuelType || prev.fuelType,
      initialMileage: prevKm,
      mileage: prev.mileage > 0 ? prev.mileage : prevKm,
    }));
  }, [formData.vehicleId, veiculos, lastFuelRecord]);

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

  const setField = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectedVehicle = veiculos.find(v => v.id === formData.vehicleId);
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
      cost: 0,
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
        {isLoading || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );

  const renderForm = () => (
    <div className="space-y-5">
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
            placeholder="Código do abastecimento"
            value={formData.fuelCode}
            onChange={e => setField('fuelCode', e.target.value)}
            className="bg-gray-900/80 border-gray-700 text-white h-11 placeholder:text-gray-600"
          />
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
          onChange={(val) => setField('responsibleId', val)}
          placeholder="Selecione o responsável..."
          searchPlaceholder="Buscar funcionário..."
          emptyPlaceholder="Nenhum funcionário encontrado."
        />
      </div>

      {/* Veículo */}
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
            placeholder="0"
            className="bg-gray-900/80 border-gray-700 text-white h-11"
          />
          <span className="absolute right-3 top-3 text-xs text-gray-500">L</span>
        </div>
        {selectedTank && formData.liters > 0 && (
          <div className={formData.liters > selectedTank.currentLevel
            ? 'flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-red-900/20 text-red-400 border border-red-800/30'
            : 'flex items-center gap-2 text-xs rounded-lg px-3 py-2 bg-emerald-900/20 text-emerald-400 border border-emerald-800/30'
          }>
            <Droplets className="h-3.5 w-3.5" />
            {formData.liters > selectedTank.currentLevel
              ? `Quantidade solicitada (${formData.liters}L) excede o nível atual do tanque (${selectedTank.currentLevel?.toFixed(0)}L)`
              : `Nível após abastecimento: ${(selectedTank.currentLevel - formData.liters).toFixed(0)}L restantes`
            }
          </div>
        )}
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label className="text-gray-300 font-medium">Observações</Label>
        <Textarea
          value={formData.notes}
          onChange={e => setField('notes', e.target.value)}
          rows={3}
          placeholder="Observações sobre o abastecimento..."
          className="bg-gray-900/80 border-gray-700 text-white resize-none placeholder:text-gray-600"
        />
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
        className="max-w-2xl"
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
