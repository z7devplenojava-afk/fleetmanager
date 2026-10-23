import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  FileText,
  Loader2,
  Save,
  Search,
  Sparkles,
  Car,
  Bus,
  Gauge,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  AlertTriangle
} from 'lucide-react';
import { clientService, Client } from '@/services/clientService';
import { fleetService } from '@/services/fleetService';
import { parteDiariaService, ParteDiaria, ParteDiariaAtividade } from '@/services/parteDiariaService';
import driverService, { Driver } from '@/services/driverService';
import { employeeService, Employee } from '@/services/employeeService';
import { contractService } from '@/services/contractService';
import { workPostService, WorkPost } from '@/services/workPostService';
import { routeService, Route } from '@/services/routeService';

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

type ModalStep = 'veiculo' | 'atividades' | 'totais';

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
  const [currentStep, setCurrentStep] = useState<ModalStep>('veiculo');
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [workPosts, setWorkPosts] = useState<WorkPost[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [motoristasFuncionarios, setMotoristasFuncionarios] = useState<{ id: string; name: string; cargo: string }[]>([]);

  // Dados do Cabeçalho da Parte Diária
  const [docNumber, setDocNumber] = useState<string>('13102');
  const [docDate, setDocDate] = useState<string>('2025-12-12');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('FM2C');
  const [manualClientMode, setManualClientMode] = useState<boolean>(false);
  const [contractNumber, setContractNumber] = useState<string>('CT-2025/FM2C');
  const [obraName, setObraName] = useState<string>('FM2C IBIRITÉ');
  const [manualObraMode, setManualObraMode] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<string>('MICRO'); // CARRO, ÔNIBUS, MICRO, VAN
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>('QMR-2E82');
  const [manualPlateMode, setManualPlateMode] = useState<boolean>(false);
  const [driverName, setDriverName] = useState<string>(initialDriverName || 'Fernando Silva Santos (MOTORISTA)');
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

  // Atividades do dia
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
      setCurrentStep('veiculo');
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [rawClients, rawVehicles, rawDrivers, rawEmployees, rawWorkPosts, rawRoutes] = await Promise.all([
        clientService.getAllClients().catch(() => []),
        fleetService.getVehicles().catch(() => []),
        driverService.getDrivers().catch(() => []),
        employeeService.getAllEmployees().catch(() => []),
        workPostService.getAllWorkPosts().catch(() => []),
        routeService.findAllRoutes().catch(() => [])
      ]);

      const clientList = Array.isArray(rawClients) ? rawClients : (rawClients as any)?.content || [];
      setClients(clientList);

      const vehicleList = Array.isArray(rawVehicles) ? rawVehicles : (rawVehicles as any)?.content || [];
      setVehicles(vehicleList);

      const driverList = Array.isArray(rawDrivers) ? rawDrivers : (rawDrivers as any)?.content || [];
      setDrivers(driverList);

      const employeeList = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees as any)?.content || [];

      const workPostList = Array.isArray(rawWorkPosts) ? rawWorkPosts : (rawWorkPosts as any)?.content || [];
      setWorkPosts(workPostList);

      const routeList = Array.isArray(rawRoutes) ? rawRoutes : (rawRoutes as any)?.content || [];
      setRoutes(routeList);

      const getCargoText = (e: any): string => {
        if (!e) return '';
        const rawPos = e.position || e.cargo || e.jobTitle;
        if (typeof rawPos === 'string') return rawPos;
        if (rawPos && typeof rawPos === 'object') {
          return rawPos.name || rawPos.title || rawPos.cargo || rawPos.description || '';
        }
        return '';
      };

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

      if (parteDiariaToEdit) {
        setDocNumber(parteDiariaToEdit.number || '13103');
        setDocDate(parteDiariaToEdit.date || new Date().toISOString().split('T')[0]);
        setSelectedClientId(parteDiariaToEdit.clientId || '');
        setClientName(parteDiariaToEdit.clientName || 'FM2C');
        setContractNumber(parteDiariaToEdit.contractNumber || 'CT-2025/FM2C');
        setObraName(parteDiariaToEdit.obraName || 'FM2C IBIRITÉ');
        setVehicleType(parteDiariaToEdit.vehicleModel || 'MICRO');
        setSelectedVehicleId(parteDiariaToEdit.vehicleId || '');
        setVehiclePlate(parteDiariaToEdit.vehiclePlate || 'QMR-2E82');
        setDriverName(parteDiariaToEdit.driverName || initialDriverName || 'Fernando Silva Santos');
        setSelectedDriverId(parteDiariaToEdit.driverId || '');
        setStartKm(parteDiariaToEdit.startKm ?? 403834);
        setEndKm(parteDiariaToEdit.endKm ?? 404017);
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
        const fmqcClient = clientList.find((c: any) => (c.name || '').toUpperCase().includes('FM2C') || (c.name || '').toUpperCase().includes('FMQC'));
        if (fmqcClient) {
          setSelectedClientId(fmqcClient.id);
          setClientName(fmqcClient.name);
          const relatedObras = workPostList.filter((wp: any) => wp.clientId === fmqcClient.id || (wp.clientName && wp.clientName.includes('FM2C')));
          if (relatedObras.length > 0) {
            setObraName(relatedObras[0].name);
          }
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

    if (typeStr.includes('MICRO') || typeStr.includes('MINIBUS')) return 'MICRO';
    if (typeStr.includes('VAN')) return 'VAN';
    if (typeStr.includes('ONIBUS') || typeStr.includes('ÔNIBUS') || typeStr.includes('BUS')) return 'ÔNIBUS';
    if (typeStr.includes('CARRO') || typeStr.includes('CAR') || typeStr.includes('PICKUP') || typeStr.includes('SUV')) return 'CARRO';
    return 'MICRO';
  };

  const handleClientChange = async (clientId: string) => {
    setSelectedClientId(clientId);
    const selected = clients.find(c => c.id === clientId);
    if (selected) {
      setClientName(selected.name);
    }

    const clientObrasFound = workPosts.filter((wp: any) => {
      const cId = wp.clientId || wp.client?.id;
      const cName = wp.clientName || wp.client?.name;
      return (
        cId === clientId ||
        (selected?.name && cName && cName.trim().toLowerCase() === selected.name.trim().toLowerCase())
      );
    });

    if (clientObrasFound.length > 0) {
      setObraName(clientObrasFound[0].name);
      if (clientObrasFound[0].contractId) {
        setContractNumber(`CT-${clientObrasFound[0].contractId.substring(0, 8)}`);
      }
    }

    try {
      const rawContracts = await contractService.getContracts({ clientId }).catch(() => []);
      const contractsList = Array.isArray(rawContracts) ? rawContracts : (rawContracts as any)?.content || [];
      if (contractsList.length > 0) {
        const firstContract = contractsList[0];
        setContractNumber(firstContract.contractNumber || `CT-2025/${selected?.name?.substring(0, 6).toUpperCase() || 'FM2C'}`);
        if (clientObrasFound.length === 0 && (firstContract.description || firstContract.obraName)) {
          setObraName(firstContract.description || firstContract.obraName);
        }
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

      if (found.currentMileage != null && Number(found.currentMileage) > 0) {
        const vKm = Number(found.currentMileage);
        setNewActivity(prev => ({
          ...prev,
          startKm: vKm,
          endKm: vKm
        }));
        if (startKm === 0 || startKm === 403834) {
          setStartKm(vKm);
          setEndKm(vKm);
        }
      }

      if (found.workPostId) {
        const wp = workPosts.find(w => w.id === found.workPostId);
        if (wp) {
          setObraName(wp.name);
          if (wp.clientId) {
            setSelectedClientId(wp.clientId);
            const cli = clients.find(c => c.id === wp.clientId);
            if (cli) setClientName(cli.name);
          }
        }
      } else if (found.clientId) {
        setSelectedClientId(found.clientId);
        const cli = clients.find(c => c.id === found.clientId);
        if (cli) setClientName(cli.name);
      }
    }
  };

  const handlePlateChange = (plateText: string) => {
    const formatted = plateText.toUpperCase();
    setVehiclePlate(formatted);
    const cleanPlate = formatted.replace(/[^A-Za-z0-9]/g, '');
    const found = vehicles.find(v => {
      const p = (v.placa || v.plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      return p === cleanPlate || (cleanPlate.length >= 4 && p.includes(cleanPlate));
    });
    if (found) {
      setSelectedVehicleId(found.id);
      setVehicleType(detectVehicleType(found));
    }
  };

  const handleCommitNewActivity = () => {
    if (!newActivity.startTime || !newActivity.endTime) {
      toast({
        title: 'Horário Obrigatório',
        description: 'Informe o horário de saída e chegada.',
        variant: 'destructive'
      });
      return;
    }
    const startNum = parseFloat(String(newActivity.startKm)) || 0;
    const endNum = parseFloat(String(newActivity.endKm)) || 0;
    if (endNum > 0 && startNum > 0 && endNum < startNum) {
      toast({
        title: 'KM Inválido',
        description: 'O KM de chegada não pode ser menor que o KM de saída.',
        variant: 'destructive'
      });
      return;
    }

    const activityToAdd: ParteDiariaAtividade = {
      startTime: newActivity.startTime,
      endTime: newActivity.endTime,
      description: newActivity.description || 'Trajeto Operacional',
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
      title: '✅ Trajeto Adicionado!',
      description: `${activityToAdd.description} foi incluído no lançamento.`,
    });
  };

  const handleRemoveActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: keyof ParteDiariaAtividade, value: any) => {
    const updated = [...activities];
    updated[index] = { ...updated[index], [field]: value };
    setActivities(updated);

    if (index === 0 && field === 'startKm') {
      setStartKm(parseFloat(String(value)) || 0);
    }
    if (index === updated.length - 1 && field === 'endKm') {
      setEndKm(parseFloat(String(value)) || 0);
    }
  };

  const handleFillSampleData = () => {
    setDocNumber('13102');
    setDocDate('2025-12-12');
    setClientName('FM2C SERVIÇOS');
    setContractNumber('CT-2025/FM2C');
    setObraName('FM2C IBIRITÉ');
    setVehicleType('MICRO');
    setVehiclePlate('QMR-2E82');
    if (!initialDriverName) {
      setDriverName('Fernando Silva Santos');
    }
    setStartKm(403834);
    setEndKm(404017);
    setDisregardedKm(0);
    setDpSignature('José Mário Ramos (DP)');
    setNotes('Parte Diária lançada com sucesso.');
    setActivities([
      { startTime: '14:30', endTime: '15:50', description: 'Ibirité FM2C', startKm: 403834, endKm: 403869, activityType: 'REGULAR' },
      { startTime: '16:00', endTime: '17:47', description: 'FM2C Ibirité', startKm: 403969, endKm: 404017, activityType: 'REGULAR' }
    ]);
    toast({
      title: 'Exemplo Carregado!',
      description: 'Dados da Ficha 13102 preenchidos para demonstração.',
    });
  };

  const drivenKm = Math.max(0, Number(((endKm || 0) - (startKm || 0)).toFixed(2)));
  const consideredKm = Math.max(0, Number((drivenKm - (disregardedKm || 0)).toFixed(2)));

  const combinedMotoristas = [
    ...motoristasFuncionarios.map(m => ({ id: m.id, name: m.name, sub: `Funcionário — ${m.cargo}` })),
    ...drivers.map(d => ({ id: d.id, name: d.name, sub: d.licenseNumber ? `CNH: ${d.licenseNumber}` : 'Motorista Cadastrado' }))
  ];

  const filteredMotoristas = combinedMotoristas.filter(m => 
    !driverSearchFilter || m.name.toLowerCase().includes(driverSearchFilter.toLowerCase())
  );

  const clientObras = React.useMemo(() => {
    if (!selectedClientId) return workPosts;
    return workPosts.filter((wp: any) => {
      const cId = wp.clientId || wp.client?.id;
      const cName = wp.clientName || wp.client?.name;
      return (
        cId === selectedClientId ||
        (clientName && cName && cName.trim().toLowerCase() === clientName.trim().toLowerCase())
      );
    });
  }, [workPosts, selectedClientId, clientName]);

  const quickRouteChips = React.useMemo(() => {
    const curObra = obraName || 'Obra';
    return [
      `Garagem ➔ ${curObra}`,
      `${curObra} ➔ Garagem`,
      `Transporte Turno — ${curObra}`,
      `Deslocamento Interno — ${curObra}`,
      `Retorno Garagem`
    ];
  }, [obraName]);

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
        clientName: clientName || 'FM2C',
        contractNumber: contractNumber || 'CT-2025/FM2C',
        obraName: obraName || 'FM2C IBIRITÉ',
        vehicleId: selectedVehicleId || undefined,
        vehiclePlate: vehiclePlate || 'QMR-2E82',
        vehicleModel: vehicleType,
        driverName: driverName || 'Fernando Silva Santos',
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
          title: 'Parte Diária Salva com Sucesso!',
          description: `Parte Diária Nº ${docNumber} (${vehiclePlate}) gravada com ${activities.length} trajetos e ${consideredKm} km.`,
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

  const vehicleTypesList = [
    { id: 'CARRO', label: 'Carro', icon: Car },
    { id: 'ÔNIBUS', label: 'Ônibus', icon: Bus },
    { id: 'MICRO', label: 'Micro-ônibus', icon: Truck },
    { id: 'VAN', label: 'Van', icon: Bus },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[98vw] sm:w-[94vw] max-w-4xl max-h-[94vh] overflow-y-auto overflow-x-hidden p-0 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Parte Diária de Veículos — Viação São Silvestre</DialogTitle>
          <DialogDescription>Lançamento de horários, motorista, cliente e hodômetro</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 w-full max-w-full overflow-x-hidden">
          {/* Cabeçalho Responsivo sem Cortes */}
          <div className="bg-slate-900/90 border-b border-slate-800 p-3 sm:p-5 sticky top-0 z-30 backdrop-blur-md w-full max-w-full overflow-hidden">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black shrink-0 shadow-md">
                  <Truck className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-[10px] sm:text-xs font-bold text-amber-400 tracking-wider uppercase">
                      VIAÇÃO SÃO SILVESTRE
                    </span>
                    <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-500/40 text-[9px] sm:text-[10px] py-0 px-1.5 font-semibold">
                      {isReadOnly ? 'Consulta' : parteDiariaToEdit ? 'Edição' : 'Lançamento de Campo'}
                    </Badge>
                  </div>
                  <h2 className="text-sm sm:text-lg font-black text-white tracking-tight truncate mt-0.5">
                    PARTE DIÁRIA DE VEÍCULOS
                  </h2>
                </div>
              </div>

              {/* Botão de Exemplo rápido no desktop/mobile */}
              {!isReadOnly && !parteDiariaToEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillSampleData}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-[10px] sm:text-[11px] h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg shrink-0 gap-1"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <span>Exemplo</span>
                </Button>
              )}
            </div>

            {/* Ficha & Data em Linha Compacta */}
            <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-slate-800/80 w-full">
              <div className="bg-slate-950/90 border border-slate-800 p-1.5 sm:p-2 rounded-xl min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Nº da Parte Diária</span>
                <Input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="bg-transparent border-none text-amber-400 font-mono font-black text-xs sm:text-sm h-6 sm:h-7 p-0 focus-visible:ring-0"
                  placeholder="13102"
                />
              </div>

              <div className="bg-slate-950/90 border border-slate-800 p-1.5 sm:p-2 rounded-xl min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Data do Trabalho</span>
                <Input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="bg-transparent border-none text-white font-bold text-[11px] sm:text-xs h-6 sm:h-7 p-0 focus-visible:ring-0 [color-scheme:dark]"
                />
              </div>
            </div>

            {/* PAINEL DINÂMICO INTERATIVO: Toque para trocar veículo ou cliente/obra rapidamente */}
            <div className="mt-2.5 bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-emerald-500/10 border border-amber-500/30 rounded-xl p-2 sm:p-3 shadow-inner w-full max-w-full overflow-hidden">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-amber-400 font-bold mb-1">
                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" /> O Que Está Sendo Lançado:
                </span>
                <span className="text-slate-400 font-mono text-[9px] sm:text-[10px]">
                  {activities.length} trajeto(s) adicionado(s)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs w-full">
                <div
                  onClick={() => setCurrentStep('veiculo')}
                  className="cursor-pointer bg-slate-950/80 hover:bg-slate-900 hover:border-amber-500/50 transition-all p-1.5 rounded-lg border border-slate-800/80 min-w-0 overflow-hidden active:scale-98"
                  title="Toque para alterar o veículo"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-medium">Veículo / Placa</span>
                    <span className="text-[8px] text-amber-400 font-bold">Trocar ✎</span>
                  </div>
                  <span className="font-bold text-amber-300 font-mono text-[11px] truncate block">
                    {vehiclePlate || 'Selecione'} ({vehicleType})
                  </span>
                </div>

                <div
                  onClick={() => setCurrentStep('veiculo')}
                  className="cursor-pointer bg-slate-950/80 hover:bg-slate-900 hover:border-amber-500/50 transition-all p-1.5 rounded-lg border border-slate-800/80 min-w-0 overflow-hidden active:scale-98"
                  title="Toque para alterar o motorista"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-medium">Motorista</span>
                    <span className="text-[8px] text-amber-400 font-bold">Alterar ✎</span>
                  </div>
                  <span className="font-bold text-white text-[11px] truncate block" title={driverName}>
                    {driverName || 'Não selecionado'}
                  </span>
                </div>

                <div
                  onClick={() => setCurrentStep('veiculo')}
                  className="cursor-pointer bg-slate-950/80 hover:bg-slate-900 hover:border-amber-500/50 transition-all p-1.5 rounded-lg border border-slate-800/80 min-w-0 overflow-hidden active:scale-98"
                  title="Toque para alterar a obra ou cliente"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-medium">Cliente / Obra</span>
                    <span className="text-[8px] text-amber-400 font-bold">Mudar ✎</span>
                  </div>
                  <span className="font-bold text-slate-200 text-[11px] truncate block">
                    {clientName || 'Geral'} {obraName ? `• ${obraName}` : ''}
                  </span>
                </div>

                <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800/80 min-w-0 overflow-hidden">
                  <span className="text-[9px] text-slate-400 block font-medium">KM Rodado do Dia</span>
                  <span className="font-black text-emerald-400 font-mono text-[12px] block">
                    {consideredKm} km
                  </span>
                </div>
              </div>
            </div>

            {/* Abas de Navegação entre Etapas para facilitar o preenchimento no celular */}
            <div className="grid grid-cols-3 gap-1 sm:gap-1.5 mt-2.5 pt-1 w-full max-w-full">
              <button
                type="button"
                onClick={() => setCurrentStep('veiculo')}
                className={`min-w-0 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-1 sm:gap-1.5 ${
                  currentStep === 'veiculo'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Truck className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">1. Veículo</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('atividades')}
                className={`min-w-0 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-1 sm:gap-1.5 relative ${
                  currentStep === 'atividades'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">2. Trajetos</span>
                <span className={`text-[9px] px-1 py-0 rounded-full font-black shrink-0 ${
                  currentStep === 'atividades' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {activities.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('totais')}
                className={`min-w-0 py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all border flex items-center justify-center gap-1 sm:gap-1.5 ${
                  currentStep === 'totais'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                    : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Gauge className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">3. Fechamento</span>
              </button>
            </div>
          </div>

          {/* Corpo do Formulário por Etapa */}
          <div className="p-4 sm:p-6 space-y-5 flex-1">
            {/* ETAPA 1: VEÍCULO E MOTORISTA */}
            {currentStep === 'veiculo' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Truck className="h-4 w-4" /> Qual é o veículo utilizado?
                  </div>

                  {/* Tipo de Veículo (Mobile Friendly em 2x2 com Ícones Grandes) */}
                  <div>
                    <Label className="text-xs text-slate-300 font-semibold mb-1.5 block">
                      Tipo de Veículo
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {vehicleTypesList.map(item => {
                        const Icon = item.icon;
                        const isSelected = vehicleType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setVehicleType(item.id)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 active:scale-95 ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500 ring-2 ring-amber-500/40 shadow-md'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Icon className={`h-5 w-5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Placa do Veículo */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs text-slate-300 font-semibold">
                        Placa do Veículo
                      </Label>
                      <button
                        type="button"
                        onClick={() => setManualPlateMode(!manualPlateMode)}
                        className="text-[11px] text-amber-400 hover:underline font-bold"
                      >
                        {manualPlateMode ? 'Buscar na Frota' : 'Digitar Placa Livre'}
                      </button>
                    </div>

                    {!manualPlateMode && vehicles.length > 0 ? (
                      <Select value={selectedVehicleId} onValueChange={handleVehicleChange}>
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-white font-mono font-bold h-11 rounded-xl">
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
                        className="bg-slate-950 border-slate-700 text-amber-300 font-mono font-bold text-base h-11 rounded-xl"
                      />
                    )}
                  </div>
                </div>

                {/* Motorista Responsável */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 relative">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <User className="h-4 w-4" /> Quem é o Motorista?
                  </div>

                  <div className="relative">
                    <Input
                      value={driverName}
                      onChange={(e) => {
                        setDriverName(e.target.value);
                        setDriverSearchFilter(e.target.value);
                        setShowDriverDropdown(true);
                      }}
                      onFocus={() => setShowDriverDropdown(true)}
                      placeholder="Digite ou selecione o motorista..."
                      className="bg-slate-950 border-slate-700 text-white font-semibold text-sm h-11 pr-10 rounded-xl"
                    />
                    <User className="absolute right-3 top-3.5 h-4 w-4 text-amber-400 pointer-events-none" />

                    {showDriverDropdown && combinedMotoristas.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-12 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto p-1.5">
                        <div className="px-2 py-1 text-[10px] text-amber-400 font-bold uppercase tracking-wider border-b border-slate-800">
                          Motoristas & Colaboradores Sugeridos ({combinedMotoristas.length})
                        </div>
                        {filteredMotoristas.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">
                            Usar nome digitado: <strong className="text-white">"{driverName}"</strong>
                          </div>
                        ) : (
                          filteredMotoristas.slice(0, 30).map((m, idx) => (
                            <div
                              key={m.id || idx}
                              onClick={() => {
                                setDriverName(m.name);
                                setSelectedDriverId(m.id);
                                setShowDriverDropdown(false);
                              }}
                              className="p-2.5 hover:bg-amber-500/20 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                            >
                              <span className="text-white font-semibold">{m.name}</span>
                              <span className="text-[10px] text-amber-400/80">{m.sub}</span>
                            </div>
                          ))
                        )}
                        <div
                          onClick={() => setShowDriverDropdown(false)}
                          className="p-2 text-center text-xs text-amber-400 font-bold hover:underline cursor-pointer border-t border-slate-800"
                        >
                          ✓ Confirmar Nome Digitado Manualmente
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cliente e Obra */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Building2 className="h-4 w-4" /> Cliente & Obra / Contrato
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300 font-semibold">Cliente</Label>
                        <button
                          type="button"
                          onClick={() => setManualClientMode(!manualClientMode)}
                          className="text-[10px] text-amber-400 hover:underline font-bold"
                        >
                          {manualClientMode ? 'Buscar' : 'Digitar'}
                        </button>
                      </div>
                      {!manualClientMode && clients.length > 0 ? (
                        <Select value={selectedClientId} onValueChange={handleClientChange}>
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-10 rounded-xl">
                            <SelectValue placeholder="Selecione o cliente..." />
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
                          className="bg-slate-950 border-slate-700 text-white font-bold h-10 rounded-xl"
                        />
                      )}
                    </div>

                    <div>
                      <Label className="text-xs text-slate-300 font-semibold mb-1 block">Nº Contrato</Label>
                      <Input
                        value={contractNumber}
                        onChange={(e) => setContractNumber(e.target.value)}
                        placeholder="Ex: CT-2025/FM2C"
                        className="bg-slate-950 border-slate-700 text-amber-300 font-bold h-10 rounded-xl"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300 font-semibold">
                          Obra / Local de Trabalho
                        </Label>
                        <button
                          type="button"
                          onClick={() => setManualObraMode(!manualObraMode)}
                          className="text-[10px] text-amber-400 hover:underline font-bold"
                        >
                          {manualObraMode ? 'Buscar Obra Cadastrada' : 'Digitar Livre'}
                        </button>
                      </div>

                      {!manualObraMode && clientObras.length > 0 ? (
                        <Select
                          value={clientObras.some((w: any) => w.name === obraName) ? obraName : (clientObras[0]?.name || '')}
                          onValueChange={(val) => {
                            setObraName(val);
                            const wp = clientObras.find((w: any) => w.name === val);
                            if (wp?.contractId) {
                              setContractNumber(`CT-${wp.contractId.substring(0, 8)}`);
                            }
                          }}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-white font-semibold h-10 rounded-xl">
                            <SelectValue placeholder="Selecione a Obra..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-60 overflow-y-auto">
                            {clientObras.map((wp: any) => (
                              <SelectItem key={wp.id} value={wp.name}>
                                {wp.name} {wp.city ? `(${wp.city})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={obraName}
                          onChange={(e) => setObraName(e.target.value)}
                          placeholder="Ex: FM2C IBIRITÉ"
                          className="bg-slate-950 border-slate-700 text-white font-semibold h-10 rounded-xl"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Botão de Avançar Etapa */}
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep('atividades')}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <span>Continuar para Horários & Trajetos</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 2: HORÁRIOS E TRAJETOS (ATIVIDADES) */}
            {currentStep === 'atividades' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200 w-full max-w-full overflow-hidden">
                {/* Card de Adição de Trajeto Super Intuitivo */}
                <div className="bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 border border-amber-500/40 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3.5 w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wide flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Lançar Novo Trajeto / Viagem
                    </span>
                    <span className="text-[10px] text-slate-400 hidden xs:inline">
                      Toque nas sugestões rápidas ou preencha abaixo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full">
                    <div className="min-w-0">
                      <Label className="text-[11px] text-slate-300 font-semibold mb-1 block truncate">
                        🕒 Hora Saída
                      </Label>
                      <Input
                        type="time"
                        value={newActivity.startTime}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, startTime: e.target.value }))}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-center h-10 sm:h-11 text-xs sm:text-sm rounded-xl [color-scheme:dark] w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="text-[11px] text-slate-300 font-semibold mb-1 block truncate">
                        🕒 Hora Chegada
                      </Label>
                      <Input
                        type="time"
                        value={newActivity.endTime}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, endTime: e.target.value }))}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-center h-10 sm:h-11 text-xs sm:text-sm rounded-xl [color-scheme:dark] w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="text-[11px] text-slate-300 font-semibold mb-1 block truncate">
                        🔢 KM na Saída
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Ex: 403834"
                        value={newActivity.startKm || ''}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, startKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-center h-10 sm:h-11 text-xs sm:text-sm rounded-xl w-full"
                      />
                    </div>

                    <div className="min-w-0">
                      <Label className="text-[11px] text-slate-300 font-semibold mb-1 block truncate">
                        🔢 KM na Chegada
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="Ex: 403869"
                        value={newActivity.endKm || ''}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, endKm: parseFloat(e.target.value) || 0 }))}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-center h-10 sm:h-11 text-xs sm:text-sm rounded-xl w-full"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] text-slate-300 font-semibold block">
                          📍 Trajeto / Onde foi (Descrição)
                        </Label>
                        {routes.length > 0 && (
                          <span className="text-[10px] text-amber-400 font-bold">
                            {routes.length} rotas cadastradas
                          </span>
                        )}
                      </div>

                      {/* Seletor rápido de rota cadastrada se houver */}
                      {routes.length > 0 && (
                        <Select
                          onValueChange={(val) => {
                            setNewActivity(prev => ({ ...prev, description: val }));
                            const matched = routes.find(r => r.name === val);
                            if (matched?.distanceKm && matched.distanceKm > 0) {
                              const sKm = parseFloat(String(newActivity.startKm)) || 0;
                              if (sKm > 0) {
                                setNewActivity(prev => ({ ...prev, endKm: sKm + (matched.distanceKm || 0) }));
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-slate-950 border-slate-700 text-amber-300 font-medium h-9 rounded-xl text-xs">
                            <SelectValue placeholder="Ou escolha um itinerário/rota cadastrada na base..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-52 overflow-y-auto">
                            {routes.map(r => (
                              <SelectItem key={r.id} value={r.name}>
                                {r.name} {r.distanceKm ? `(${r.distanceKm} km)` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Input
                        type="text"
                        placeholder="Ex: Garagem até FM2C Ibirité / Transporte de Funcionários"
                        value={newActivity.description}
                        onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-slate-950 border-slate-700 text-white font-medium h-10 sm:h-11 text-xs sm:text-sm rounded-xl w-full"
                      />

                      {/* BOTOES DE 1 TOQUE: Facilita para o motorista não precisar digitar */}
                      <div className="pt-1">
                        <span className="text-[10px] text-amber-400/90 font-bold block mb-1.5 uppercase tracking-wide">
                          Sugestões de 1 Toque (Sem Digitar):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {quickRouteChips.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setNewActivity(prev => ({ ...prev, description: chip }))}
                              className={`text-[10px] py-1 px-2 rounded-lg border font-semibold transition-all active:scale-95 ${
                                newActivity.description === chip
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-500/50 hover:text-white'
                              }`}
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resumo e Botão de Inclusão sem quebra */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800 w-full">
                    <div className="text-xs font-mono text-center sm:text-left">
                      {newActivity.endKm && newActivity.startKm && Number(newActivity.endKm) >= Number(newActivity.startKm) ? (
                        <span className="text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-lg inline-block w-full sm:w-auto text-center">
                          Distância deste trajeto: {(Number(newActivity.endKm) - Number(newActivity.startKm)).toFixed(1)} km
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] sm:text-[11px]">
                          Informe os KMs para calcular a distância
                        </span>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={handleCommitNewActivity}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black h-11 px-4 text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>+ Adicionar este Trajeto à Lista</span>
                    </Button>
                  </div>
                </div>

                {/* Lista de Trajetos Lançados em Cards Mobile-Friendly sem Scroll Horizontal */}
                <div className="space-y-2.5 pt-2 w-full max-w-full overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-400" />
                      Trajetos Lançados ({activities.length})
                    </h4>
                    <span className="text-[10px] sm:text-[11px] text-slate-400">
                      Confira ou exclua cada item
                    </span>
                  </div>

                  {activities.length === 0 ? (
                    <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-5 text-center text-slate-400 text-xs">
                      Nenhum trajeto lançado ainda. Use o formulário acima para adicionar o primeiro trajeto do dia.
                    </div>
                  ) : (
                    <div className="space-y-2 w-full max-w-full overflow-hidden">
                      {activities.map((act, idx) => {
                        const dist = Math.max(0, Number(((act.endKm || 0) - (act.startKm || 0)).toFixed(1)));
                        return (
                          <div
                            key={idx}
                            className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full max-w-full overflow-hidden"
                          >
                            <div className="flex items-start gap-2.5 min-w-0 w-full">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                #{idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <Badge className="bg-slate-800 text-amber-300 border-slate-700 font-mono text-[10px] sm:text-[11px] py-0 px-1.5">
                                    {act.startTime || '--:--'} às {act.endTime || '--:--'}
                                  </Badge>
                                  <Badge className="bg-emerald-950/80 text-emerald-300 border-emerald-500/30 font-mono text-[10px] sm:text-[11px] py-0 px-1.5 font-bold">
                                    {dist} km rodados
                                  </Badge>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-white mt-1 break-words">
                                  {act.description || 'Trajeto sem descrição'}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono mt-1">
                                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    Saída: <strong className="text-amber-300">{act.startKm}</strong>
                                  </span>
                                  <span className="text-slate-500">➔</span>
                                  <span className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                    Chegada: <strong className="text-emerald-300">{act.endKm}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0 w-full sm:w-auto">
                              {activities.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveActivity(idx)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 sm:h-8 px-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs rounded-lg gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Excluir</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Navegação entre Etapas em Grid sem Overflow */}
                <div className="grid grid-cols-2 gap-2 pt-3 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('veiculo')}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-11 px-2 rounded-xl flex items-center justify-center gap-1.5 min-w-0"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="truncate">Voltar ao Veículo</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setCurrentStep('totais')}
                    className="h-11 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-2 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 min-w-0"
                  >
                    <span className="truncate">Conferir & Salvar</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 3: HODÔMETRO, CONFERÊNCIA E FINALIZAÇÃO */}
            {currentStep === 'totais' && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Mostrador Gigante de Totais */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
                      KM Total Percorrido (Hodômetro)
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400 mt-1">
                      {drivenKm} km
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      {endKm} km fim - {startKm} km início
                    </span>
                  </div>

                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl text-center">
                    <span className="text-xs text-emerald-400 font-semibold block uppercase tracking-wider">
                      KM Considerado para Cobrança
                    </span>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1">
                      {consideredKm} km
                    </div>
                    <span className="text-[10px] text-emerald-400/70 font-mono mt-0.5 block">
                      Total válido após eventuais abatimentos
                    </span>
                  </div>
                </div>

                {/* Hodômetro Inicial e Final */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Gauge className="h-4 w-4" /> Leitura do Hodômetro Geral
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-300 font-semibold mb-1 block">
                        KM Início (ao pegar o veículo)
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={startKm}
                        onChange={(e) => setStartKm(parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-base h-11 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-300 font-semibold mb-1 block">
                        KM Fim (ao entregar o veículo)
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={endKm}
                        onChange={(e) => setEndKm(parseFloat(e.target.value) || 0)}
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold text-base h-11 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* KM Desconsiderado (Opcional) */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                      Abatimento de KM (Desconsiderado)
                    </span>
                    <span className="text-[11px] text-slate-400">Opcional</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] text-slate-400 mb-1 block">KM a Desconsiderar</Label>
                      <Input
                        type="number"
                        step="any"
                        value={disregardedKm}
                        onChange={(e) => setDisregardedKm(parseFloat(e.target.value) || 0)}
                        placeholder="0.0"
                        className="bg-slate-950 border-slate-700 text-white font-mono h-10 rounded-xl"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] text-slate-400 mb-1 block">Motivo do Abatimento</Label>
                      <Input
                        value={disregardReason}
                        onChange={(e) => setDisregardReason(e.target.value)}
                        placeholder="Ex: Deslocamento garagem ou manutenção"
                        className="bg-slate-950 border-slate-700 text-white h-10 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Observações Operacionais */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-2">
                  <Label className="text-xs text-slate-300 font-semibold block uppercase">
                    Observações Operacionais da Viagem
                  </Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Adicione observações relevantes..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Botões de Ação Final */}
                <div className="grid grid-cols-2 gap-2 pt-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep('atividades')}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs h-11 px-2 rounded-xl flex items-center justify-center gap-1.5 min-w-0"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    <span className="truncate">Voltar aos Trajetos</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isLoading || isReadOnly}
                    className="h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-2 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 min-w-0"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                        <span className="truncate">Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 shrink-0" />
                        <span className="truncate">{parteDiariaToEdit ? 'Atualizar Parte Diária' : 'Salvar Parte Diária'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé fixo do Modal */}
          <DialogFooter className="bg-slate-900/90 p-4 border-t border-slate-800 rounded-b-2xl flex flex-row items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs h-9"
            >
              Fechar
            </Button>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Parte Diária Oficial • Viação São Silvestre
            </span>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParteDiariaModal;
