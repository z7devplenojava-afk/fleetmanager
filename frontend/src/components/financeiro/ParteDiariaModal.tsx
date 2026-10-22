import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, Plus, Trash2, CheckCircle2, Clock, User, FileText, Loader2, Save, Search, Sparkles } from 'lucide-react';
import { clientService, Client } from '@/services/clientService';
import { fleetService } from '@/services/fleetService';
import { parteDiariaService, ParteDiaria, ParteDiariaAtividade } from '@/services/parteDiariaService';
import driverService, { Driver } from '@/services/driverService';
import { employeeService, Employee } from '@/services/employeeService';
import { contractService } from '@/services/contractService';

interface ParteDiariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialClientId?: string;
  initialClientName?: string;
  initialDriverName?: string;
  initialDriverId?: string;
  parteDiariaToEdit?: ParteDiaria | null;
  isReadOnly?: boolean;
}

export const ParteDiariaModal: React.FC<ParteDiariaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialClientId,
  initialClientName,
  initialDriverName,
  initialDriverId,
  parteDiariaToEdit,
  isReadOnly = false
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [motoristasFuncionarios, setMotoristasFuncionarios] = useState<{ id: string; name: string; cargo: string }[]>([]);

  // Dados do Cabeçalho da Parte Diária (Preenchido com base na Ficha Física Nº 13102 da Viação São Silvestre)
  const [docNumber, setDocNumber] = useState<string>('13102');
  const [docDate, setDocDate] = useState<string>('2025-12-12');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('FM2C');
  const [manualClientMode, setManualClientMode] = useState<boolean>(false);
  const [contractNumber, setContractNumber] = useState<string>('CT-2025/FM2C');
  const [obraName, setObraName] = useState<string>('FM2C IBIRITÉ');
  const [vehicleType, setVehicleType] = useState<string>('MICRO'); // CARRO, ÔNIBUS, MICRO, VAN
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('QMR-2E82');
  const [manualPlateMode, setManualPlateMode] = useState<boolean>(false);
  const [driverName, setDriverName] = useState<string>(initialDriverName || 'João da Silva (Motorista)');
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialDriverId || '');
  const [dpSignature, setDpSignature] = useState<string>('José Mário Ramos (DP)');

  // Linha em digitação para rápido lançamento
  const [newActivity, setNewActivity] = useState<{
    startTime: string;
    endTime: string;
    description: string;
    startKm: number | string;
    endKm: number | string;
  }>({
    startTime: '14:30',
    endTime: '15:50',
    description: 'Ibirité FM2C',
    startKm: 403834,
    endKm: 403869
  });

  // Atividades do dia com KM de início/fim por trajeto conforme ficha física
  const [activities, setActivities] = useState<ParteDiariaAtividade[]>([
    { startTime: '14:30', endTime: '15:50', description: 'Ibirité FM2C', startKm: 403834, endKm: 403869, activityType: 'REGULAR' },
    { startTime: '16:00', endTime: '17:47', description: 'FM2C Ibirité', startKm: 403969, endKm: 404017, activityType: 'REGULAR' }
  ]);

  // Hodômetro e KM
  const [startKm, setStartKm] = useState<number>(403834);
  const [endKm, setEndKm] = useState<number>(404017);
  const [disregardedKm, setDisregardedKm] = useState<number>(0);
  const [disregardReason, setDisregardReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('Operação realizada com sucesso conforme parte diária física.');

  // Controle de filtro no motorista
  const [driverSearchFilter, setDriverSearchFilter] = useState('');
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [rawClients, rawVehicles, rawDrivers, rawEmployees] = await Promise.all([
        clientService.getAllClients().catch(() => []),
        fleetService.getVehicles().catch(() => []),
        driverService.getDrivers().catch(() => []),
        employeeService.getAllEmployees().catch(() => [])
      ]);

      const clientList = Array.isArray(rawClients) ? rawClients : (rawClients as any)?.content || [];
      setClients(clientList);

      const vehicleList = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles as any)?.content || [];
      setVehicles(vehicleList);

      const driverList = Array.isArray(rawDrivers) ? rawDrivers : (rawDrivers as any)?.content || [];
      setDrivers(driverList);

      const employeeList = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees as any)?.content || [];

      // Helper para extrair o cargo em formato texto com segurança
      const getCargoText = (e: any): string => {
        if (!e) return '';
        const rawPos = e.position || e.cargo || e.jobTitle;
        if (typeof rawPos === 'string') return rawPos;
        if (rawPos && typeof rawPos === 'object') {
          return rawPos.name || rawPos.title || rawPos.cargo || rawPos.description || '';
        }
        return '';
      };

      // Filtrar funcionários que têm cargo/função de Motorista
      const motoristasEmp = employeeList
        .filter((e: any) => {
          const cargo = getCargoText(e).toLowerCase();
          return cargo.includes('motorista') || cargo.includes('condutor') || cargo.includes('driver');
        })
        .map((e: any) => ({
          id: e.id,
          name: e.name || e.nome || 'Funcionário Motorista',
          cargo: getCargoText(e) || 'Motorista'
        }));

      setMotoristasFuncionarios(motoristasEmp);

      // Se for edição, carregar dados da parte diária existente
      if (parteDiariaToEdit) {
        setDocNumber(parteDiariaToEdit.number || '13103');
        setDocDate(parteDiariaToEdit.date || new Date().toISOString().split('T')[0]);
        setSelectedClientId(parteDiariaToEdit.clientId || '');
        setClientName(parteDiariaToEdit.clientName || 'FMQC');
        setContractNumber(parteDiariaToEdit.contractNumber || 'CT-2025/FMQC');
        setObraName(parteDiariaToEdit.obraName || 'FMQC IBIRITÉ');
        setVehicleType(parteDiariaToEdit.vehicleModel || 'MICRO');
        setSelectedVehicleId(parteDiariaToEdit.vehicleId || '');
        setVehiclePlate(parteDiariaToEdit.vehiclePlate || 'QMR-2F82');
        setDriverName(parteDiariaToEdit.driverName || 'João da Silva (Motorista)');
        setSelectedDriverId(parteDiariaToEdit.driverId || '');
        setStartKm(parteDiariaToEdit.startKm ?? 404014);
        setEndKm(parteDiariaToEdit.endKm ?? 404085);
        setDisregardedKm(parteDiariaToEdit.disregardedKm ?? 0);
        setDisregardReason(parteDiariaToEdit.disregardReason || '');
        setNotes(parteDiariaToEdit.notes || 'Operação realizada com sucesso conforme parte diária física.');
        if (parteDiariaToEdit.atividades && parteDiariaToEdit.atividades.length > 0) {
          setActivities(parteDiariaToEdit.atividades);
        }
      } else if (initialClientId) {
        setSelectedClientId(initialClientId);
        const cli = clientList.find((c: any) => c.id === initialClientId);
        if (cli) {
          setClientName(cli.name);
        } else if (initialClientName) {
          setClientName(initialClientName);
        }
        const qmrVehicle = vehicleList.find((v: any) => (v.placa || v.plate || '').toUpperCase().includes('QMR'));
        if (qmrVehicle) {
          setSelectedVehicleId(qmrVehicle.id);
          setVehiclePlate(qmrVehicle.placa || qmrVehicle.plate);
        }
      } else {
        const qmrVehicle = vehicleList.find((v: any) => (v.placa || v.plate || '').toUpperCase().includes('QMR'));
        if (qmrVehicle) {
          setSelectedVehicleId(qmrVehicle.id);
          setVehiclePlate(qmrVehicle.placa || qmrVehicle.plate);
        }
        const fmqcClient = clientList.find((c: any) => (c.name || '').toUpperCase().includes('FMQC') || (c.name || '').toUpperCase().includes('FM2C'));
        if (fmqcClient) {
          setSelectedClientId(fmqcClient.id);
          setClientName(fmqcClient.name);
        }
      }
      if (initialDriverName) {
        setDriverName(initialDriverName);
      }
      if (initialDriverId) {
        setSelectedDriverId(initialDriverId);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do formulário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const detectVehicleType = (v: any): string => {
    if (!v) return 'MICRO';
    const typeStr = (
      v.vehicleType ||
      v.busType ||
      v.tipo ||
      v.type ||
      v.categoria ||
      v.modelo ||
      v.model ||
      ''
    ).toString().toUpperCase();

    if (typeStr.includes('MICRO') || typeStr.includes('MINIBUS')) {
      return 'MICRO';
    } else if (typeStr.includes('VAN')) {
      return 'VAN';
    } else if (typeStr.includes('ONIBUS') || typeStr.includes('ÔNIBUS') || typeStr.includes('BUS')) {
      return 'ÔNIBUS';
    } else if (
      typeStr.includes('CARRO') || 
      typeStr.includes('CAR') || 
      typeStr.includes('PICKUP') || 
      typeStr.includes('UTILITARIO') || 
      typeStr.includes('SUV')
    ) {
      return 'CARRO';
    }
    return 'MICRO';
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setClientName(selected.name);
    }
    try {
      const rawContracts = await contractService.getContracts({ clientId }).catch(() => []);
      const contractsList = Array.isArray(rawContracts) ? rawContracts : (rawContracts as any)?.content || [];
      if (contractsList.length > 0) {
        const firstContract = contractsList[0];
        setContractNumber(firstContract.contractNumber || `CT-2025/${selected?.name?.substring(0, 6).toUpperCase() || 'FM2C'}`);
        setObraName(firstContract.description || firstContract.obraName || 'FM2C IBIRITÉ');
      }
    } catch (err) {
      console.warn('Erro ao carregar contratos do cliente:', err);
    }
  };

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const found = vehicles.find(v => v.id === vId);
    if (found) {
      setVehiclePlate(found.placa || found.plate || '');
      setVehicleType(detectVehicleType(found));
    }
  };

  const handlePlateChange = (plateText: string) => {
    setVehiclePlate(plateText);
    const cleanPlate = plateText.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const found = vehicles.find(v => {
      const p = (v.placa || v.plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      return p === cleanPlate || (cleanPlate.length >= 4 && p.includes(cleanPlate));
    });
    if (found) {
      setSelectedVehicleId(found.id);
      setVehicleType(detectVehicleType(found));
    }
  };

  const handleAddActivity = () => {
    const last = activities[activities.length - 1];
    const newStartKm = last?.endKm || startKm;
    setActivities([
      ...activities,
      { startTime: '16:00', endTime: '17:47', description: '', startKm: newStartKm, endKm: newStartKm + 10, activityType: 'REGULAR' }
    ]);
  };

  const handleCommitNewActivity = () => {
    if (!newActivity.startTime || !newActivity.endTime) {
      toast({
        title: 'Horário Obrigatório',
        description: 'Informe a Hora Início e Hora Fim.',
        variant: 'destructive'
      });
      return;
    }
    const startNum = parseFloat(String(newActivity.startKm)) || 0;
    const endNum = parseFloat(String(newActivity.endKm)) || 0;
    if (endNum > 0 && startNum > 0 && endNum < startNum) {
      toast({
        title: 'KM Inválido',
        description: 'KM Fim não pode ser menor que o KM Início.',
        variant: 'destructive'
      });
      return;
    }

    const activityToAdd: ParteDiariaAtividade = {
      startTime: newActivity.startTime,
      endTime: newActivity.endTime,
      description: newActivity.description || 'Trajeto',
      startKm: startNum,
      endKm: endNum,
      activityType: 'REGULAR'
    };

    setActivities(prev => {
      const next = [...prev, activityToAdd];
      if (next.length === 1 || startKm === 0) {
        setStartKm(startNum);
      }
      setEndKm(endNum);
      return next;
    });

    setNewActivity({
      startTime: newActivity.endTime,
      endTime: '',
      description: '',
      startKm: endNum,
      endKm: endNum
    });

    toast({
      title: 'Trajeto Lançado!',
      description: `${activityToAdd.description} (${activityToAdd.startTime} - ${activityToAdd.endTime}) adicionado à lista abaixo.`,
    });
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: keyof ParteDiariaAtividade, value: any) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);

    // Se alterou KM na primeira ou última atividade, atualizar o hodômetro geral
    if (index === 0 && field === 'startKm') {
      setStartKm(parseFloat(String(value)) || 0);
    }
    if (index === updated.length - 1 && field === 'endKm') {
      setEndKm(parseFloat(String(value)) || 0);
    }
  };

  // Preencher com dados reais da Ficha Física da Viação São Silvestre (Ficha Nº 13102)
  const handleFillSampleData = () => {
    setDocNumber('13102');
    setDocDate('2025-12-12');
    setClientName('FM2C');
    setContractNumber('CT-2025/FM2C');
    setObraName('FM2C IBIRITÉ');
    setVehicleType('MICRO');
    setVehiclePlate('QMR-2E82');
    if (!initialDriverName) {
      setDriverName('João da Silva (Motorista)');
    }
    setStartKm(403834);
    setEndKm(404017);
    setDisregardedKm(0);
    setDpSignature('José Mário Ramos (DP)');
    setNotes('Parte Diária de Veículos Nº 13102 - Viação São Silvestre.');
    setActivities([
      { startTime: '14:30', endTime: '15:50', description: 'Ibirité FM2C', startKm: 403834, endKm: 403869, activityType: 'REGULAR' },
      { startTime: '16:00', endTime: '17:47', description: 'FM2C Ibirité', startKm: 403969, endKm: 404017, activityType: 'REGULAR' }
    ]);
    toast({
      title: 'Dados da Ficha Carregados!',
      description: 'Campos preenchidos com os dados da Parte Diária Nº 13102 (FM2C - QMR-2E82).',
    });
  };

  // Cálculos Automáticos de KM (com suporte a números decimais)
  const drivenKm = Math.max(0, Number(((endKm || 0) - (startKm || 0)).toFixed(2)));
  const consideredKm = Math.max(0, Number((drivenKm - (disregardedKm || 0)).toFixed(2)));

  // Lista unificada de motoristas sugeridos (Funcionários com cargo Motorista + Motoristas Cadastrados)
  const combinedMotoristas = [
    ...motoristasFuncionarios.map(m => ({ id: m.id, name: m.name, sub: `Funcionário — ${m.cargo}` })),
    ...drivers.map(d => ({ id: d.id, name: d.name, sub: d.licenseNumber ? `CNH: ${d.licenseNumber}` : 'Motorista Cadastrado' }))
  ];

  const filteredMotoristas = combinedMotoristas.filter(m => 
    !driverSearchFilter || m.name.toLowerCase().includes(driverSearchFilter.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      onClose();
      return;
    }

    if (endKm < startKm) {
      toast({
        title: 'KM Inválido',
        description: 'O KM Final não pode ser menor do que o KM Inicial.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      const payload: ParteDiaria = {
        number: docNumber,
        date: docDate,
        clientId: selectedClientId || undefined,
        clientName: clientName || 'FMQC',
        contractNumber: contractNumber || 'CT-2025/FMQC',
        obraName: obraName || 'FMQC IBIRITÉ',
        vehicleId: selectedVehicleId || undefined,
        vehiclePlate: vehiclePlate || 'QMR-2F82',
        vehicleModel: vehicleType,
        driverName: driverName || 'João da Silva (Motorista)',
        startTime: activities[0]?.startTime || '05:20',
        endTime: activities[activities.length - 1]?.endTime || '08:05',
        startKm,
        endKm,
        drivenKm,
        disregardedKm,
        consideredKm,
        disregardReason: disregardedKm > 0 ? disregardReason : undefined,
        status: 'VALIDADA',
        notes,
        createdBy: dpSignature || 'José Mário Ramos (DP)',
        atividades: activities
      };

      if (parteDiariaToEdit?.id) {
        await parteDiariaService.updateParteDiaria(parteDiariaToEdit.id, payload);
        toast({
          title: 'Parte Diária Atualizada!',
          description: `Parte Diária Nº ${docNumber} atualizada com sucesso.`,
        });
      } else {
        await parteDiariaService.createParteDiaria(payload);
        toast({
          title: 'Parte Diária Registrada!',
          description: `Parte Diária Nº ${docNumber} (${vehiclePlate}) salva com sucesso. KM Considerado: ${consideredKm} km.`,
        });
      }

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar Parte Diária:', err);
      toast({
        title: 'Erro ao Salvar',
        description: err.message || 'Falha ao conectar com o servidor.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-900 border-slate-800 text-slate-100 max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Parte Diária de Veículos — Viação São Silvestre</DialogTitle>
          <DialogDescription>Lançamento completo de horários, motorista, cliente e hodômetro</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Cabeçalho Ficha Física Real */}
          <div className="bg-slate-950 p-5 sm:p-6 border-b border-slate-800 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">VIAÇÃO SÃO SILVESTRE</span>
                    <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-500/40 text-[10px]">
                      {isReadOnly ? 'Visualização de Parte Diária' : parteDiariaToEdit ? 'Editar Parte Diária' : 'Formulário Oficial de Campo'}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                    PARTE DIÁRIA DE VEÍCULOS
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {!isReadOnly && !parteDiariaToEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFillSampleData}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8 rounded-xl"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Exemplo (Ficha 13103)
                  </Button>
                )}

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-semibold block">Nº PARTE DIÁRIA</span>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-28 bg-slate-900 border-amber-500/50 text-amber-400 font-mono font-bold text-center h-8 text-sm rounded-lg"
                  />
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-semibold block">DATA DO APONTAMENTO</span>
                  <Input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-36 bg-slate-900 border-slate-700 text-white font-bold h-8 text-xs rounded-lg [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Seção 1: Cliente, Contrato, Obra, Tipo Veículo, Placa e Motorista */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-400 font-semibold uppercase">CLIENTE</Label>
                  <button
                    type="button"
                    onClick={() => setManualClientMode(!manualClientMode)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    {manualClientMode ? 'Buscar na Base' : 'Digitar Nome'}
                  </button>
                </div>
                {!manualClientMode && clients.length > 0 ? (
                  <Select value={selectedClientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 mt-1 rounded-xl">
                      <SelectValue placeholder="Selecione o cliente da base..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60 overflow-y-auto">
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: FM2C"
                    className="bg-slate-900 border-slate-700 text-white font-bold h-9 mt-1 rounded-xl"
                  />
                )}
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">NÚMERO DO CONTRATO</Label>
                <Input
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="Ex: CT-2025/FM2C"
                  className="bg-slate-900 border-slate-700 text-amber-400 font-bold h-9 mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">OBRA / SETOR DE TRABALHO</Label>
                <Input
                  value={obraName}
                  onChange={(e) => setObraName(e.target.value)}
                  placeholder="Ex: FM2C IBIRITÉ"
                  className="bg-slate-900 border-slate-700 text-white font-semibold h-9 mt-1 rounded-xl"
                />
              </div>

              {/* Seleção do Tipo de Veículo (Auto-detectado pela placa ou selecionável) */}
              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">
                  TIPO DE VEÍCULO <span className="text-[10px] text-amber-400 font-normal">(Auto-detectado pela Placa)</span>
                </Label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {['CARRO', 'ÔNIBUS', 'MICRO', 'VAN'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                        vehicleType === type
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/70 shadow-sm ring-1 ring-amber-500/50'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      ({vehicleType === type ? 'X' : ' '}) {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* PLACA DO VEÍCULO (Busca da base de dados e detecção automática do tipo de veículo) */}
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-slate-400 font-semibold uppercase">PLACA DO VEÍCULO</Label>
                  <button
                    type="button"
                    onClick={() => setManualPlateMode(!manualPlateMode)}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    {manualPlateMode ? 'Buscar na Frota' : 'Digitar Placa Livre'}
                  </button>
                </div>
                {!manualPlateMode && vehicles.length > 0 ? (
                  <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 mt-1 rounded-xl">
                      <SelectValue placeholder="Selecione o veículo da frota..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60 overflow-y-auto">
                      {vehicles.slice(0, 100).map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.placa || v.plate} — {v.modelo || v.model || 'Veículo'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={vehiclePlate}
                    onChange={(e) => handlePlateChange(e.target.value)}
                    placeholder="Ex: QMR-2E82"
                    className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 mt-1 rounded-xl"
                  />
                )}
              </div>

              {/* MOTORISTA RESPONSÁVEL */}
              <div className="relative">
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-amber-400 font-bold uppercase">MOTORISTA RESPONSÁVEL</Label>
                </div>

                <div className="relative mt-1">
                  <Input
                    value={driverName}
                    onChange={(e) => {
                      setDriverName(e.target.value);
                      setDriverSearchFilter(e.target.value);
                      setShowDriverDropdown(true);
                    }}
                    onFocus={() => setShowDriverDropdown(true)}
                    placeholder="Nome do motorista..."
                    className="bg-slate-900 border-slate-700 text-white font-semibold h-9 pr-8 rounded-xl"
                  />
                  <User className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />

                  {showDriverDropdown && combinedMotoristas.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-10 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1">
                      <div className="px-2 py-1 border-b border-slate-800 text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        Motoristas Cadastrados ({combinedMotoristas.length})
                      </div>
                      {filteredMotoristas.length === 0 ? (
                        <div className="p-2 text-xs text-slate-400 text-center">
                          Usar digitado: <strong className="text-white">"{driverName}"</strong>
                        </div>
                      ) : (
                        filteredMotoristas.slice(0, 50).map((m, idx) => (
                          <div
                            key={m.id || idx}
                            onClick={() => {
                              setDriverName(m.name);
                              setSelectedDriverId(m.id);
                              setShowDriverDropdown(false);
                            }}
                            className="p-2 hover:bg-amber-500/20 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <span className="text-white font-semibold">{m.name}</span>
                            <span className="text-[10px] text-slate-400">{m.sub}</span>
                          </div>
                        ))
                      )}
                      <div
                        onClick={() => setShowDriverDropdown(false)}
                        className="p-1.5 border-t border-slate-800 text-center text-[11px] text-amber-400 font-bold hover:underline cursor-pointer"
                      >
                        ✓ Confirmar Nome Digitado Manualmente
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seção 2: Lançamento de Atividades (conforme vai lançando vai listando abaixo) */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Descrição das Atividades, Horários e Hodômetro
                </h3>
                <Button
                  type="button"
                  onClick={handleAddActivity}
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-amber-400 hover:bg-amber-500/10 text-xs h-8 rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Linha Vazia
                </Button>
              </div>

              {/* Formulário de Lançamento Rápido */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/80 border border-amber-500/30 rounded-xl p-4 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Plus className="h-4 w-4" /> Lançar Nova Atividade / Trajeto
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Preencha os campos e lance para alimentar a lista abaixo
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2.5 items-end">
                  <div>
                    <Label className="text-[11px] text-slate-300 font-semibold uppercase">Hora Início (Time)</Label>
                    <Input
                      type="time"
                      value={newActivity.startTime}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, startTime: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 text-xs rounded-lg mt-1 [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-slate-300 font-semibold uppercase">Hora Término (Time)</Label>
                    <Input
                      type="time"
                      value={newActivity.endTime}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, endTime: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 text-xs rounded-lg mt-1 [color-scheme:dark]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-[11px] text-slate-300 font-semibold uppercase">Descrição das Atividades</Label>
                    <Input
                      type="text"
                      placeholder="Ex: Ibirité FM2C / FM2C Ibirité"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-900 border-slate-700 text-white font-semibold h-9 text-xs rounded-lg mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-slate-300 font-semibold uppercase">KM Inicial (Decimal)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Ex: 403834.0"
                      value={newActivity.startKm || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, startKm: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 text-xs rounded-lg mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] text-slate-300 font-semibold uppercase">KM Final (Decimal)</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Ex: 403869.0"
                      value={newActivity.endKm || ''}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, endKm: parseFloat(e.target.value) || 0 }))}
                      className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 text-xs rounded-lg mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <div className="text-xs text-slate-400 font-mono">
                    {newActivity.endKm && newActivity.startKm && Number(newActivity.endKm) >= Number(newActivity.startKm) ? (
                      <span className="text-emerald-400 font-semibold">
                        KM deste trajeto: {(Number(newActivity.endKm) - Number(newActivity.startKm)).toFixed(1)} km
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    onClick={handleCommitNewActivity}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold h-9 px-4 text-xs rounded-xl shadow-md hover:shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Lançar na Lista Abaixo
                  </Button>
                </div>
              </div>

              {/* Tabela de Atividades Lançadas (Lista abaixo) */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950 shadow-inner">
                <table className="w-full text-xs text-left text-slate-300 min-w-[650px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-24 text-center">Início (Time)</th>
                      <th className="p-2.5 w-24 text-center">Término (Time)</th>
                      <th className="p-2.5">Descrição das Atividades (Trajeto)</th>
                      <th className="p-2.5 w-28 text-center">KM Início (Dec)</th>
                      <th className="p-2.5 w-28 text-center">KM Fim (Dec)</th>
                      <th className="p-2.5 w-20 text-center">KM Rodado</th>
                      <th className="p-2.5 w-12 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activities.map((act, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-2">
                          <Input
                            type="time"
                            value={act.startTime || ''}
                            onChange={(e) => handleActivityChange(idx, 'startTime', e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-center h-8 text-xs font-mono font-bold rounded-lg [color-scheme:dark]"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={act.endTime || ''}
                            onChange={(e) => handleActivityChange(idx, 'endTime', e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-center h-8 text-xs font-mono font-bold rounded-lg [color-scheme:dark]"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={act.description || ''}
                            onChange={(e) => handleActivityChange(idx, 'description', e.target.value)}
                            placeholder="Ex: Ibirité FM2C"
                            className="bg-slate-900 border-slate-700 text-white h-8 text-xs font-semibold rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="any"
                            value={act.startKm ?? ''}
                            onChange={(e) => handleActivityChange(idx, 'startKm', parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 403834.0"
                            className="bg-slate-900 border-slate-700 text-white text-center font-mono font-bold h-8 text-xs rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="any"
                            value={act.endKm ?? ''}
                            onChange={(e) => handleActivityChange(idx, 'endKm', parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 403869.0"
                            className="bg-slate-900 border-slate-700 text-white text-center font-mono font-bold h-8 text-xs rounded-lg"
                          />
                        </td>
                        <td className="p-2 text-center font-mono font-bold text-sky-400 text-xs">
                          {((act.endKm || 0) - (act.startKm || 0) > 0)
                            ? `${((act.endKm || 0) - (act.startKm || 0)).toFixed(1)}`
                            : '0.0'}
                        </td>
                        <td className="p-2 text-center">
                          {activities.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => handleRemoveActivity(idx)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seção 3: Medição de Hodômetro e KM Totais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM INÍCIO (HODÔMETRO)</Label>
                <Input
                  type="number"
                  step="any"
                  value={startKm}
                  onChange={(e) => setStartKm(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700 text-white font-mono font-bold mt-1 h-9 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM FIM (HODÔMETRO)</Label>
                <Input
                  type="number"
                  step="any"
                  value={endKm}
                  onChange={(e) => setEndKm(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 border-slate-700 text-white font-mono font-bold mt-1 h-9 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM RODADO (CALCULADO)</Label>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 mt-1 text-center font-mono font-bold text-sky-400 text-lg">
                  {drivenKm} km
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM CONSIDERADO</Label>
                <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-2 mt-1 text-center font-mono font-bold text-emerald-400 text-lg">
                  {consideredKm} km
                </div>
              </div>

              {/* KM Desconsiderado se houver */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM DESCONSIDERADO (ABATIMENTO)</Label>
                <Input
                  type="number"
                  step="any"
                  value={disregardedKm}
                  onChange={(e) => setDisregardedKm(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="bg-slate-900 border-slate-700 text-white font-mono mt-1 h-9 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-400 font-semibold uppercase">MOTIVO DA DESCONSIDERAÇÃO</Label>
                <Input
                  value={disregardReason}
                  onChange={(e) => setDisregardReason(e.target.value)}
                  placeholder="Ex: Deslocamento garagem / Manutenção"
                  className="bg-slate-900 border-slate-700 text-white mt-1 h-9 rounded-xl"
                />
              </div>
            </div>

            {/* Seção 4: Observações e Assinaturas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400 font-semibold uppercase">OBSERVAÇÕES OPERACIONAIS</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Adicione observações da viagem..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Assinaturas e Conferência</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">ASS. DP / CONFERÊNCIA</span>
                    <Input
                      value={dpSignature}
                      onChange={(e) => setDpSignature(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-emerald-400 font-semibold h-8 mt-1 text-xs rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ASS. MOTORISTA RESPONSÁVEL</span>
                    <Input
                      value={driverName || 'Motorista Operacional'}
                      onChange={(e) => setDriverName(e.target.value)}
                      className="bg-slate-900 border-slate-700 text-amber-400 font-semibold h-8 mt-1 text-xs rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-950 p-4 border-t border-slate-800 rounded-b-2xl gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {isReadOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" /> {parteDiariaToEdit ? 'Atualizar Parte Diária' : 'Salvar Parte Diária'}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParteDiariaModal;
