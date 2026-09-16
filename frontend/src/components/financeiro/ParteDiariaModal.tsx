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
  onSuccess: () => void;
}

export const ParteDiariaModal: React.FC<ParteDiariaModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [motoristasFuncionarios, setMotoristasFuncionarios] = useState<{ id: string; name: string; cargo: string }[]>([]);

  // Dados do Cabeçalho da Parte Diária (Preenchido com base na Ficha Física Nº 13103 da Viação São Silvestre)
  const [docNumber, setDocNumber] = useState<string>('13103');
  const [docDate, setDocDate] = useState<string>('2025-12-13');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('FM2C');
  const [contractNumber, setContractNumber] = useState<string>('CT-2025/FM2C');
  const [obraName, setObraName] = useState<string>('FM2C IBIRITÉ');
  const [vehicleType, setVehicleType] = useState<string>('MICRO'); // CARRO, ONIBUS, MICRO, VAN
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('QMR-2F82');
  const [driverName, setDriverName] = useState<string>('João da Silva (Motorista)');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [dpSignature, setDpSignature] = useState<string>('José Mário Ramos (DP)');

  // Atividades do dia com KM de início/fim por trajeto conforme ficha física
  const [activities, setActivities] = useState<ParteDiariaAtividade[]>([
    { startTime: '05:20', endTime: '06:59', description: 'Ibirite FM2C', startKm: 404014, endKm: 404058, activityType: 'REGULAR' },
    { startTime: '07:00', endTime: '08:05', description: 'FM2C Ibirite', startKm: 404058, endKm: 404085, activityType: 'REGULAR' }
  ]);

  // Hodômetro e KM
  const [startKm, setStartKm] = useState<number>(404014);
  const [endKm, setEndKm] = useState<number>(404085);
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

      // Se houver veículo cadastrado com placa QMR-2F82, selecionar
      const qmrVehicle = vehicleList.find((v: any) => (v.placa || v.plate || '').toUpperCase().includes('QMR'));
      if (qmrVehicle) {
        setSelectedVehicleId(qmrVehicle.id);
        setVehiclePlate(qmrVehicle.placa || qmrVehicle.plate);
      }

      // Se houver cliente FM2C cadastrado, selecionar
      const fm2cClient = clientList.find((c: any) => (c.name || '').toUpperCase().includes('FM2C'));
      if (fm2cClient) {
        setSelectedClientId(fm2cClient.id);
        setClientName(fm2cClient.name);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do formulário:', err);
    } finally {
      setIsLoading(false);
    }
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
    }
  };

  const handleAddActivity = () => {
    const last = activities[activities.length - 1];
    const newStartKm = last?.endKm || startKm;
    setActivities([
      ...activities,
      { startTime: '08:10', endTime: '12:00', description: '', startKm: newStartKm, endKm: newStartKm + 10, activityType: 'REGULAR' }
    ]);
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
      setStartKm(Number(value) || 0);
    }
    if (index === updated.length - 1 && field === 'endKm') {
      setEndKm(Number(value) || 0);
    }
  };

  // Preencher com dados reais da Ficha Física da Viação São Silvestre (Image 3)
  const handleFillSampleData = () => {
    setDocNumber('13103');
    setDocDate('2025-12-13');
    setClientName('FM2C');
    setContractNumber('CT-2025/FM2C');
    setObraName('FM2C IBIRITÉ');
    setVehicleType('MICRO');
    setVehiclePlate('QMR-2F82');
    setDriverName('João da Silva (Motorista)');
    setStartKm(404014);
    setEndKm(404085);
    setDisregardedKm(0);
    setDpSignature('José Mário Ramos (DP)');
    setNotes('Operação de transporte regular executada conforme apontamentos de campo na Parte Diária Nº 13103.');
    setActivities([
      { startTime: '05:20', endTime: '06:59', description: 'Ibirite FM2C', startKm: 404014, endKm: 404058, activityType: 'REGULAR' },
      { startTime: '07:00', endTime: '08:05', description: 'FM2C Ibirite', startKm: 404058, endKm: 404085, activityType: 'REGULAR' }
    ]);
    toast({
      title: 'Dados da Ficha Carregados!',
      description: 'Campos preenchidos com os dados da Parte Diária Nº 13103 da Viação São Silvestre.',
    });
  };

  // Cálculos Automáticos de KM
  const drivenKm = Math.max(0, (endKm || 0) - (startKm || 0));
  const consideredKm = Math.max(0, drivenKm - (disregardedKm || 0));

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
        clientName: clientName || 'FM2C',
        contractNumber: contractNumber || 'CT-2025/FM2C',
        obraName: obraName || 'FM2C IBIRITÉ',
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

      await parteDiariaService.createParteDiaria(payload);

      toast({
        title: 'Parte Diária Registrada!',
        description: `Parte Diária Nº ${docNumber} (${vehiclePlate}) salva com sucesso. KM Considerado: ${consideredKm} km.`,
      });

      onSuccess();
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
                    <Badge className="bg-emerald-950/80 text-emerald-400 border-emerald-500/40 text-[10px]">Formulário Oficial de Campo</Badge>
                  </div>
                  <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 mt-0.5">
                    PARTE DIÁRIA DE VEÍCULOS
                  </h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFillSampleData}
                  className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs h-8 rounded-xl"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Exemplo (Ficha 13103)
                </Button>

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
                <Label className="text-xs text-slate-400 font-semibold uppercase">CLIENTE</Label>
                {clients.length > 0 ? (
                  <Select value={selectedClientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 mt-1 rounded-xl">
                      <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700 text-white">
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

              {/* Seleção do Tipo de Veículo */}
              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">TIPO DE VEÍCULO</Label>
                <div className="grid grid-cols-4 gap-1.5 mt-1">
                  {['CARRO', 'ÔNIBUS', 'MICRO', 'VAN'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-extrabold transition-all border ${
                        vehicleType === type
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/70 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      ({vehicleType === type ? 'X' : ' '}) {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">PLACA DO VEÍCULO</Label>
                {vehicles.length > 0 ? (
                  <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-white font-mono font-bold h-9 mt-1 rounded-xl">
                      <SelectValue placeholder="Selecione a placa..." />
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
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Ex: QMR-2F82"
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

            {/* Seção 2: Tabela de Atividades */}
            <div className="space-y-3">
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Linha / Trajeto
                </Button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                <table className="w-full text-xs text-left text-slate-300 min-w-[600px]">
                  <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-2.5 w-24 text-center">Início</th>
                      <th className="p-2.5 w-24 text-center">Término</th>
                      <th className="p-2.5">Descrição das Atividades (Trajeto)</th>
                      <th className="p-2.5 w-28 text-center">KM Início</th>
                      <th className="p-2.5 w-28 text-center">KM Fim</th>
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
                            className="bg-slate-900 border-slate-700 text-white text-center h-8 text-xs font-mono font-bold rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={act.endTime || ''}
                            onChange={(e) => handleActivityChange(idx, 'endTime', e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white text-center h-8 text-xs font-mono font-bold rounded-lg"
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
                            value={act.startKm ?? ''}
                            onChange={(e) => handleActivityChange(idx, 'startKm', Number(e.target.value))}
                            placeholder="Ex: 404014"
                            className="bg-slate-900 border-slate-700 text-white text-center font-mono font-bold h-8 text-xs rounded-lg"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={act.endKm ?? ''}
                            onChange={(e) => handleActivityChange(idx, 'endKm', Number(e.target.value))}
                            placeholder="Ex: 404058"
                            className="bg-slate-900 border-slate-700 text-white text-center font-mono font-bold h-8 text-xs rounded-lg"
                          />
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
                  value={startKm}
                  onChange={(e) => setStartKm(Number(e.target.value))}
                  className="bg-slate-900 border-slate-700 text-white font-mono font-bold mt-1 h-9 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-400 font-semibold uppercase">KM FIM (HODÔMETRO)</Label>
                <Input
                  type="number"
                  value={endKm}
                  onChange={(e) => setEndKm(Number(e.target.value))}
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
                  value={disregardedKm}
                  onChange={(e) => setDisregardedKm(Number(e.target.value))}
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
              Cancelar
            </Button>
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
                  <Save className="h-4 w-4 mr-2" /> Salvar Parte Diária
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParteDiariaModal;
