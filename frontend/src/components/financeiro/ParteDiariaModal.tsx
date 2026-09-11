import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, Plus, Trash2, CheckCircle2, Clock, MapPin, User, Hash, FileText, Loader2, Save } from 'lucide-react';
import { clientService, Client } from '@/services/clientService';
import { fleetService } from '@/services/fleetService';
import { parteDiariaService, ParteDiaria, ParteDiariaAtividade } from '@/services/parteDiariaService';
import driverService, { Driver } from '@/services/driverService';
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

  // Dados do Cabeçalho da Parte Diária (Baseado no Documento Físico)
  const [docNumber, setDocNumber] = useState<string>(`PD-${Math.floor(10000 + Math.random() * 90000)}`);
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [obraName, setObraName] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<string>('MICRO'); // CARRO, ONIBUS, MICRO, VAN
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [dpSignature, setDpSignature] = useState<string>('CONFERIDO / DP');

  // Atividades do dia
  const [activities, setActivities] = useState<ParteDiariaAtividade[]>([
    { startTime: '07:00', endTime: '12:00', description: 'Linha Regular - Transporte de Passageiros', activityType: 'REGULAR' },
    { startTime: '13:00', endTime: '18:00', description: 'Atendimento Operacional / Trajeto Especial', activityType: 'EXTRA' }
  ]);

  // Hodômetro e KM
  const [startKm, setStartKm] = useState<number>(403834);
  const [endKm, setEndKm] = useState<number>(404017);
  const [disregardedKm, setDisregardedKm] = useState<number>(0);
  const [disregardReason, setDisregardReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [rawClients, rawVehicles, rawDrivers] = await Promise.all([
        clientService.getAllClients().catch(() => []),
        fleetService.getVehicles().catch(() => []),
        driverService.getDrivers().catch(() => [])
      ]);
      setClients(Array.isArray(rawClients) ? rawClients : (rawClients as any)?.content || []);
      const vehicleList = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles as any)?.content || [];
      setVehicles(vehicleList);
      const driverList = Array.isArray(rawDrivers) ? rawDrivers : (rawDrivers as any)?.content || [];
      setDrivers(driverList);

      if (vehicleList.length > 0) {
        const first = vehicleList[0];
        setSelectedVehicleId(first.id);
        setVehiclePlate(first.placa || first.plate || '');
      }

      if (driverList.length > 0) {
        setSelectedDriverId(driverList[0].id || '');
        setDriverName(driverList[0].name || '');
      }
    } catch (err) {
      console.error('Erro ao carregar dados do formulário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    try {
      const rawContracts = await contractService.getContracts({ clientId }).catch(() => []);
      const contractsList = Array.isArray(rawContracts) ? rawContracts : (rawContracts as any)?.content || [];
      if (contractsList.length > 0) {
        const firstContract = contractsList[0];
        setContractNumber(firstContract.contractNumber || 'CT-2024/001');
        setObraName(firstContract.description || firstContract.unitName || 'OBRA TALUDE');
      } else {
        const selectedClient = clients.find(c => c.id === clientId);
        setContractNumber(`CT-2024/${selectedClient?.name?.substring(0, 6).toUpperCase() || 'FM2C'}`);
        setObraName('OBRA TALUDE / OPERACIONAL');
      }
    } catch (err) {
      console.warn('Erro ao carregar contratos do cliente:', err);
    }
  };

  const handleDriverChange = (driverIdOrName: string) => {
    const found = drivers.find(d => d.id === driverIdOrName || d.name === driverIdOrName);
    if (found) {
      setSelectedDriverId(found.id || '');
      setDriverName(found.name || '');
    } else {
      setDriverName(driverIdOrName);
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
    setActivities([
      ...activities,
      { startTime: '08:00', endTime: '12:00', description: '', activityType: 'REGULAR' }
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: keyof ParteDiariaAtividade, value: string) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);
  };

  // Cálculos Automáticos de KM
  const drivenKm = Math.max(0, (endKm || 0) - (startKm || 0));
  const consideredKm = Math.max(0, drivenKm - (disregardedKm || 0));

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
      const selectedClient = clients.find(c => c.id === selectedClientId);

      const payload: ParteDiaria = {
        number: docNumber,
        date: docDate,
        clientId: selectedClientId || undefined,
        clientName: selectedClient?.name || 'Cliente Geral',
        vehicleId: selectedVehicleId || undefined,
        vehiclePlate: vehiclePlate || 'QMR-2F82',
        vehicleModel: vehicleType,
        driverName: driverName || 'Motorista Operacional',
        startTime: activities[0]?.startTime || '07:00',
        endTime: activities[activities.length - 1]?.endTime || '18:00',
        startKm,
        endKm,
        drivenKm,
        disregardedKm,
        consideredKm,
        disregardReason: disregardedKm > 0 ? disregardReason : undefined,
        status: 'VALIDADA',
        notes,
        createdBy: 'Operação Frotas',
        atividades: activities
      };

      await parteDiariaService.createParteDiaria(payload);

      toast({
        title: 'Parte Diária Lançada!',
        description: `Parte Diária ${docNumber} registrada com sucesso. KM Considerado: ${consideredKm} km.`,
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
      <DialogContent className="max-w-4xl bg-seguranca-graphite border-gray-600 text-seguranca-lightgray max-h-[92vh] overflow-y-auto p-0 rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          {/* Cabeçalho que Imita a Ficha Física Real */}
          <div className="bg-gradient-to-r from-seguranca-black via-gray-900 to-seguranca-black p-6 border-b border-gray-700/80 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">VIAÇÃO SÃO SILVESTRE</span>
                    <Badge className="bg-gray-800 text-gray-300 border-gray-600 text-[10px]">Modelo Padrão Universal</Badge>
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                    PARTE DIÁRIA DE VEÍCULOS
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-semibold block">NÚMERO DO DOCUMENTO</span>
                  <Input
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    className="w-32 bg-seguranca-black border-amber-500/40 text-amber-400 font-bold text-center h-8 text-sm"
                  />
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 font-semibold block">DATA DO APONTAMENTO</span>
                  <Input
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                    className="w-36 bg-seguranca-black border-gray-600 text-white font-bold h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Seção 1: Dados do Cliente, Contrato, Obra, Veículo e Motorista */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-seguranca-black/60 p-4 rounded-xl border border-gray-700/60">
              <div>
                <Label className="text-xs text-gray-300 font-semibold">CLIENTE</Label>
                <Select value={selectedClientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-9 mt-1">
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-black border-gray-600 text-white">
                    {(Array.isArray(clients) ? clients : []).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-gray-300 font-semibold">NÚMERO DO CONTRATO</Label>
                <Input
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="Auto-preenchido ou Ex: CT-2024/001"
                  className="bg-seguranca-black border-gray-600 text-amber-400 font-bold h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300 font-semibold">OBRA / SETOR DE TRABALHO</Label>
                <Input
                  value={obraName}
                  onChange={(e) => setObraName(e.target.value)}
                  placeholder="Auto-preenchido ou Ex: OBRA TALUDE"
                  className="bg-seguranca-black border-gray-600 text-white font-semibold h-9 mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-300 font-semibold">TIPO DE VEÍCULO</Label>
                <div className="flex gap-2 mt-1.5">
                  {['CARRO', 'ÔNIBUS', 'MICRO', 'VAN'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setVehicleType(type)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                        vehicleType === type
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/60'
                          : 'bg-seguranca-black text-gray-400 border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      ({vehicleType === type ? 'X' : ' '}) {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-300 font-semibold">PLACA DO VEÍCULO</Label>
                {vehicles.length > 0 ? (
                  <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-9 mt-1">
                      <SelectValue placeholder="Selecione a placa..." />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 text-white">
                      {vehicles.map((v: any) => (
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
                    className="bg-seguranca-black border-gray-600 text-white h-9 mt-1"
                  />
                )}
              </div>

              <div>
                <Label className="text-xs text-gray-300 font-semibold">MOTORISTA RESPONSÁVEL</Label>
                {drivers.length > 0 ? (
                  <Select value={selectedDriverId || driverName} onValueChange={handleDriverChange}>
                    <SelectTrigger className="bg-seguranca-black border-gray-600 text-white h-9 mt-1">
                      <SelectValue placeholder="Selecione o motorista..." />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-black border-gray-600 text-white">
                      {drivers.map((d: any) => (
                        <SelectItem key={d.id || d.name} value={d.id || d.name}>
                          {d.name} {d.licenseNumber ? `(CNH: ${d.licenseNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nome completo do motorista..."
                    className="bg-seguranca-black border-gray-600 text-white h-9 mt-1"
                  />
                )}
              </div>
            </div>

            {/* Seção 2: Tabela de Atividades (Conforme Ficha Física) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  Descrição das Atividades e Horários
                </h3>
                <Button
                  type="button"
                  onClick={handleAddActivity}
                  size="sm"
                  variant="outline"
                  className="border-gray-600 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Atividade
                </Button>
              </div>

              <div className="border border-gray-700/80 rounded-xl overflow-hidden bg-seguranca-black/80">
                <table className="w-full text-xs text-left text-gray-300">
                  <thead className="bg-gray-800/90 text-gray-300 font-bold uppercase tracking-wider border-b border-gray-700">
                    <tr>
                      <th className="p-3 w-28 text-center">Início</th>
                      <th className="p-3 w-28 text-center">Término</th>
                      <th className="p-3">Descrição das Atividades</th>
                      <th className="p-3 w-16 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {activities.map((act, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                        <td className="p-2">
                          <Input
                            type="time"
                            value={act.startTime || ''}
                            onChange={(e) => handleActivityChange(idx, 'startTime', e.target.value)}
                            className="bg-seguranca-black border-gray-700 text-white text-center h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="time"
                            value={act.endTime || ''}
                            onChange={(e) => handleActivityChange(idx, 'endTime', e.target.value)}
                            className="bg-seguranca-black border-gray-700 text-white text-center h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            value={act.description || ''}
                            onChange={(e) => handleActivityChange(idx, 'description', e.target.value)}
                            placeholder="Descreva o serviço / trajeto executado..."
                            className="bg-seguranca-black border-gray-700 text-white h-8"
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

            {/* Seção 3: Medição de Hodômetro e KM */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gradient-to-br from-amber-950/20 via-seguranca-black to-seguranca-graphite/40 p-4 rounded-xl border border-amber-500/30">
              <div>
                <Label className="text-xs text-amber-300 font-bold uppercase">KM INÍCIO</Label>
                <Input
                  type="number"
                  value={startKm}
                  onChange={(e) => setStartKm(Number(e.target.value))}
                  className="bg-seguranca-black border-gray-600 text-white font-mono font-bold mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs text-amber-300 font-bold uppercase">KM FIM</Label>
                <Input
                  type="number"
                  value={endKm}
                  onChange={(e) => setEndKm(Number(e.target.value))}
                  className="bg-seguranca-black border-gray-600 text-white font-mono font-bold mt-1 h-9"
                />
              </div>

              <div>
                <Label className="text-xs text-blue-300 font-bold uppercase">KM RODADO (CALCULADO)</Label>
                <div className="bg-seguranca-black/80 border border-blue-500/40 rounded-lg p-2 mt-1 text-center font-mono font-extrabold text-blue-400 text-lg">
                  {drivenKm} km
                </div>
              </div>

              <div>
                <Label className="text-xs text-emerald-300 font-bold uppercase">KM CONSIDERADO</Label>
                <div className="bg-seguranca-black/80 border border-emerald-500/40 rounded-lg p-2 mt-1 text-center font-mono font-extrabold text-emerald-400 text-lg">
                  {consideredKm} km
                </div>
              </div>

              {/* KM Desconsiderado se houver */}
              <div className="md:col-span-2">
                <Label className="text-xs text-rose-300 font-semibold">KM DESCONSIDERADO (ABATIMENTO)</Label>
                <Input
                  type="number"
                  value={disregardedKm}
                  onChange={(e) => setDisregardedKm(Number(e.target.value))}
                  placeholder="0"
                  className="bg-seguranca-black border-gray-600 text-white font-mono mt-1 h-9"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="text-xs text-gray-300 font-semibold">MOTIVO DA DESCONSIDERAÇÃO</Label>
                <Input
                  value={disregardReason}
                  onChange={(e) => setDisregardReason(e.target.value)}
                  placeholder="Ex: Deslocamento para garagem / Manutenção"
                  className="bg-seguranca-black border-gray-600 text-white mt-1 h-9"
                />
              </div>
            </div>

            {/* Seção 4: Observações e Assinaturas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-gray-300 font-semibold">OBSERVAÇÕES OPERACIONAIS</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Adicione observações da viagem, apontamentos ou ocorrências..."
                  className="w-full bg-seguranca-black border border-gray-600 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-3 bg-seguranca-black/60 p-4 rounded-xl border border-gray-700/60">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Assinaturas e Conferência</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">ASS. DP / CONFERÊNCIA</span>
                    <Input
                      value={dpSignature}
                      onChange={(e) => setDpSignature(e.target.value)}
                      className="bg-seguranca-black border-gray-700 text-emerald-400 font-semibold h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">ASS. MOTORISTA</span>
                    <Input
                      value={driverName ? `Assinado por: ${driverName}` : 'Assinatura digital'}
                      disabled
                      className="bg-seguranca-black border-gray-800 text-gray-400 h-8 mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-seguranca-black p-4 border-t border-gray-700/80 rounded-b-2xl gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-seguranca-black font-extrabold hover:brightness-110 shadow-lg shadow-amber-500/20 px-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Lançar Parte Diária
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
