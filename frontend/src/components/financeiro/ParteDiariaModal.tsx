import React, { useState, useEffect, useRef } from 'react';
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
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';

interface ClientPresetData {
  name: string;
  contracts: Array<{ contractNumber: string; description: string }>;
  obras: Array<{ name: string; city?: string }>;
}

const PRESET_CLIENTS: Record<string, ClientPresetData> = {
  anglogold: {
    name: 'ANGLOGOLD ASHANTI CÓRREGO DO SÍTIO MINERAÇÃO S.A.',
    contracts: [
      { contractNumber: 'CT-2024/AGA-01', description: 'Fretamento Operacional Planta Cuiabá (Sabará/MG)' },
      { contractNumber: 'CT-2024/AGA-02', description: 'Transporte Operacional Planta Queiroz & Mina Lamego' },
      { contractNumber: 'CT-2025/AGA-03', description: 'Transporte Administrativo Nova Lima' }
    ],
    obras: [
      { name: 'PLANTA CUIABÁ - SABARÁ/MG', city: 'Sabará/MG' },
      { name: 'PLANTA QUEIROZ - NOVA LIMA/MG', city: 'Nova Lima/MG' },
      { name: 'MINA LAMEGO - SABARÁ/MG', city: 'Sabará/MG' },
      { name: 'CÓRREGO DO SÍTIO - SANTA BÁRBARA/MG', city: 'Santa Bárbara/MG' }
    ]
  },
  vale: {
    name: 'VALE S.A.',
    contracts: [
      { contractNumber: 'CT-2024/VALE-01', description: 'Fretamento Mina de Brucutu' },
      { contractNumber: 'CT-2024/VALE-02', description: 'Fretamento Complexo Itabira' },
      { contractNumber: 'CT-2025/VALE-03', description: 'Transporte Mina de Conceição' }
    ],
    obras: [
      { name: 'MINA DE BRUCUTU - SÃO GONÇALO DO RIO ABAIXO/MG', city: 'São Gonçalo do Rio Abaixo/MG' },
      { name: 'COMPLEXO ITABIRA - ITABIRA/MG', city: 'Itabira/MG' },
      { name: 'MINA DE CONCEIÇÃO - ITABIRA/MG', city: 'Itabira/MG' }
    ]
  },
  fm2c: {
    name: 'FM2C ENGENHARIA & GESTÃO',
    contracts: [
      { contractNumber: 'CT-2025/FM2C', description: 'Prestação de Serviços de Fretamento Contínuo' },
      { contractNumber: 'CT-2024/FM2C-02', description: 'Transporte de Equipes e Turnos' }
    ],
    obras: [
      { name: 'FM2C IBIRITÉ', city: 'Ibirité/MG' },
      { name: 'FM2C BETIM', city: 'Betim/MG' },
      { name: 'FM2C CONTAGEM', city: 'Contagem/MG' }
    ]
  },
  geraes: {
    name: 'GERAES MINERAÇÃO E LOGÍSTICA',
    contracts: [
      { contractNumber: 'CT-2024/GER-01', description: 'Fretamento Operacional Linha Mina' }
    ],
    obras: [
      { name: 'GERAES - MINA CENTRAL', city: 'Minas Gerais' },
      { name: 'GERAES - BELO HORIZONTE/MG', city: 'Belo Horizonte/MG' }
    ]
  },
  almenara: {
    name: 'VIAÇÃO ALMENARA / FRETAMENTO',
    contracts: [
      { contractNumber: 'CT-2025/ALM-01', description: 'Fretamento e Apoio de Transporte' }
    ],
    obras: [
      { name: 'OPERAÇÃO VALE DO JEQUITINHONHA', city: 'Almenara/MG' }
    ]
  }
};

const cleanDriverName = (name?: string) => {
  if (!name) return '';
  return name.replace(/\s*\((motorista|condutor|driver)\)\s*/gi, '').trim();
};

interface ParteDiariaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialClientId?: string;
  initialClientName?: string;
  initialContractNumber?: string;
  initialObraName?: string;
  initialVehiclePlate?: string;
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
  initialContractNumber,
  initialObraName,
  initialVehiclePlate,
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

  // Refs para navegação rápida ao clicar nos cards do topo
  const veiculoSectionRef = useRef<HTMLDivElement>(null);
  const driverSectionRef = useRef<HTMLDivElement>(null);
  const driverInputRef = useRef<HTMLInputElement>(null);
  const clienteSectionRef = useRef<HTMLDivElement>(null);

  // Dados do Cabeçalho da Parte Diária
  const [docNumber, setDocNumber] = useState<string>('13102');
  const [docDate, setDocDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [clientName, setClientName] = useState<string>(initialClientName || 'FM2C');
  const [manualClientMode, setManualClientMode] = useState<boolean>(false);
  const [contractNumber, setContractNumber] = useState<string>(initialContractNumber || 'CT-2025/FM2C');
  const [manualContractMode, setManualContractMode] = useState<boolean>(false);
  const [clientContracts, setClientContracts] = useState<Array<{ id?: string; contractNumber: string; description?: string; obraName?: string }>>([]);
  const [obraName, setObraName] = useState<string>(initialObraName || 'FM2C IBIRITÉ');
  const [manualObraMode, setManualObraMode] = useState<boolean>(false);
  const [vehicleType, setVehicleType] = useState<string>('MICRO'); // CARRO, ÔNIBUS, MICRO, VAN
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [vehiclePlate, setVehiclePlate] = useState<string>(initialVehiclePlate || 'QMR-2E82');
  const [manualPlateMode, setManualPlateMode] = useState<boolean>(false);
  const [driverName, setDriverName] = useState<string>(cleanDriverName(initialDriverName || 'Fernando Silva Santos'));
  const [selectedDriverId, setSelectedDriverId] = useState<string>(initialDriverId || '');
  const [manualDriverMode, setManualDriverMode] = useState<boolean>(false);
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
        setDriverName(cleanDriverName(parteDiariaToEdit.driverName || initialDriverName || 'Fernando Silva Santos'));
        setSelectedDriverId(parteDiariaToEdit.driverId || '');
        setStartKm(parteDiariaToEdit.startKm ?? 0);
        setEndKm(parteDiariaToEdit.endKm ?? 0);
        setDisregardedKm(parteDiariaToEdit.disregardedKm ?? 0);
        setDisregardReason(parteDiariaToEdit.disregardReason || '');
        setNotes(parteDiariaToEdit.notes || 'Operação realizada com sucesso conforme parte diária física.');
        if (parteDiariaToEdit.atividades && parteDiariaToEdit.atividades.length > 0) {
          setActivities(parteDiariaToEdit.atividades);
        }
      } else if (initialClientId || initialClientName) {
        const targetClientId = initialClientId || '';
        const targetClientName = initialClientName || '';
        setSelectedClientId(targetClientId);
        if (targetClientName) {
          setClientName(targetClientName);
        } else {
          const cli = clientList.find((c: any) => c.id === targetClientId);
          if (cli) setClientName(cli.name);
        }

        if (initialContractNumber) {
          setContractNumber(initialContractNumber);
        } else if (targetClientName) {
          setContractNumber(`CT-${targetClientName.substring(0, 6).toUpperCase()}`);
        }

        if (initialObraName) {
          setObraName(initialObraName);
        } else {
          const relatedObras = workPostList.filter((wp: any) => 
            wp.clientId === targetClientId || (wp.clientName && wp.clientName.toLowerCase().includes(targetClientName.toLowerCase()))
          );
          if (relatedObras.length > 0) {
            setObraName(relatedObras[0].name);
          }
        }

        if (initialVehiclePlate) {
          setVehiclePlate(initialVehiclePlate);
          const foundV = vehicleList.find((v: any) => 
            (v.placa || v.plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() === 
            initialVehiclePlate.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
          );
          if (foundV) {
            setSelectedVehicleId(foundV.id);
            setVehicleType(detectVehicleType(foundV));
          }
        }
      } else {
        if (clientList.length > 0) {
          setSelectedClientId(clientList[0].id);
          setClientName(clientList[0].name);
        }
        if (vehicleList.length > 0) {
          setSelectedVehicleId(vehicleList[0].id);
          setVehiclePlate(vehicleList[0].placa || vehicleList[0].plate || '');
          setVehicleType(detectVehicleType(vehicleList[0]));
        }
      }

      if (initialDriverName) {
        setDriverName(cleanDriverName(initialDriverName));
      }
      if (initialDriverId) {
        setSelectedDriverId(initialDriverId);
      }

      // Carregar e sincronizar contratos e obras para o cliente selecionado
      const finalClientId = parteDiariaToEdit?.clientId || initialClientId || (clientList.length > 0 ? clientList[0].id : '');
      const finalClientName = parteDiariaToEdit?.clientName || initialClientName || (clientList.length > 0 ? clientList[0].name : 'FM2C');
      await resolveClientContractsAndObras(finalClientId, finalClientName, clientList, workPostList);
    } catch (err) {
      console.error('Erro ao carregar dados do formulário:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveClientContractsAndObras = async (
    targetClientId: string,
    targetClientName: string,
    _clientsArray: Client[] = clients,
    workPostsArray: WorkPost[] = workPosts
  ) => {
    const lower = (targetClientName || '').toLowerCase();
    let presetContracts: Array<{ contractNumber: string; description: string }> = [];
    let presetObras: Array<{ name: string; city?: string }> = [];

    for (const [key, p] of Object.entries(PRESET_CLIENTS)) {
      if (lower.includes(key) || p.name.toLowerCase().includes(lower)) {
        presetContracts = p.contracts;
        presetObras = p.obras;
        break;
      }
    }

    let backendContracts: any[] = [];
    if (targetClientId && !targetClientId.startsWith('preset-')) {
      try {
        const raw = await contractService.getContractsByClient(targetClientId).catch(async () => {
          return await contractService.getContracts({ clientId: targetClientId }).catch(() => []);
        });
        backendContracts = Array.isArray(raw) ? raw : (raw as any)?.content || [];
      } catch (err) {
        console.warn('Erro ao carregar contratos do cliente:', err);
      }
    }

    const combinedContracts: Array<{ id?: string; contractNumber: string; description?: string; obraName?: string }> = [];
    const seenContracts = new Set<string>();

    backendContracts.forEach((c: any) => {
      const num = c.contractNumber || c.number;
      if (num && !seenContracts.has(num.toUpperCase())) {
        seenContracts.add(num.toUpperCase());
        combinedContracts.push({
          id: c.id,
          contractNumber: num,
          description: c.description || c.notes,
          obraName: c.obraName
        });
      }
    });

    presetContracts.forEach(p => {
      if (!seenContracts.has(p.contractNumber.toUpperCase())) {
        seenContracts.add(p.contractNumber.toUpperCase());
        combinedContracts.push({
          contractNumber: p.contractNumber,
          description: p.description
        });
      }
    });

    if (combinedContracts.length === 0 && targetClientName) {
      const cleanPrefix = targetClientName.replace(/[^A-Za-z0-9]/g, '').substring(0, 6).toUpperCase();
      combinedContracts.push({
        contractNumber: `CT-2025/${cleanPrefix || 'FM2C'}`,
        description: `Contrato de Transporte ${targetClientName}`
      });
    }

    setClientContracts(combinedContracts);
    return { combinedContracts, presetObras };
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

  const handleClientChange = async (clientId: string, clientNameOverride?: string) => {
    setSelectedClientId(clientId);
    const selected = clients.find(c => c.id === clientId) || availableClients.find(c => c.id === clientId);
    const resolvedName = clientNameOverride || selected?.name || clientName;
    if (resolvedName) {
      setClientName(resolvedName);
    }

    const { combinedContracts, presetObras } = await resolveClientContractsAndObras(clientId, resolvedName);

    // Atualiza contrato automaticamente se o atual não pertencer à nova lista
    if (combinedContracts.length > 0) {
      const alreadyHas = combinedContracts.some(c => c.contractNumber === contractNumber);
      if (!alreadyHas) {
        setContractNumber(combinedContracts[0].contractNumber);
      }
    }

    // Atualiza obra automaticamente se houver obras vinculadas
    const clientObrasFound = workPosts.filter((wp: any) => {
      const cId = wp.clientId || wp.client?.id;
      const cName = wp.clientName || wp.client?.name;
      return (
        cId === clientId ||
        (resolvedName && cName && cName.trim().toLowerCase() === resolvedName.trim().toLowerCase())
      );
    });

    if (clientObrasFound.length > 0) {
      setObraName(clientObrasFound[0].name);
      if (clientObrasFound[0].contractId) {
        setContractNumber(`CT-${clientObrasFound[0].contractId.substring(0, 8)}`);
      }
    } else if (presetObras.length > 0) {
      setObraName(presetObras[0].name);
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
    const list: Array<{ id?: string; name: string; city?: string; contractId?: string }> = [];
    const seenNames = new Set<string>();

    workPosts.forEach((wp: any) => {
      const cId = wp.clientId || wp.client?.id;
      const cName = wp.clientName || wp.client?.name;
      const isMatch = !selectedClientId || cId === selectedClientId ||
        (clientName && cName && cName.trim().toLowerCase() === clientName.trim().toLowerCase());

      if (isMatch && wp.name && !seenNames.has(wp.name.toUpperCase())) {
        seenNames.add(wp.name.toUpperCase());
        list.push({
          id: wp.id,
          name: wp.name,
          city: wp.city || wp.cidade,
          contractId: wp.contractId
        });
      }
    });

    const lower = (clientName || '').toLowerCase();
    for (const [key, p] of Object.entries(PRESET_CLIENTS)) {
      if (lower.includes(key) || p.name.toLowerCase().includes(lower)) {
        p.obras.forEach(o => {
          if (!seenNames.has(o.name.toUpperCase())) {
            seenNames.add(o.name.toUpperCase());
            list.push({
              name: o.name,
              city: o.city
            });
          }
        });
        break;
      }
    }

    if (obraName && !seenNames.has(obraName.toUpperCase())) {
      list.unshift({
        name: obraName
      });
    }

    return list;
  }, [workPosts, selectedClientId, clientName, obraName]);

  const availableClients = React.useMemo(() => {
    const list = [...clients];
    const seenNames = new Set(list.map(c => (c.name || '').trim().toLowerCase()));

    Object.values(PRESET_CLIENTS).forEach(p => {
      const pKey = p.name.trim().toLowerCase();
      if (!seenNames.has(pKey) && !Array.from(seenNames).some(n => n.includes('anglo') && pKey.includes('anglo'))) {
        seenNames.add(pKey);
        list.push({
          id: `preset-${p.name.substring(0, 10).toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: p.name,
          status: 'ACTIVE'
        } as any);
      }
    });

    const cleanCurrent = (clientName || '').trim().toLowerCase();
    if (clientName && !list.some(c => c.id === selectedClientId || (c.name && c.name.trim().toLowerCase() === cleanCurrent))) {
      list.unshift({
        id: selectedClientId || 'custom-client',
        name: clientName,
        status: 'ACTIVE'
      } as any);
    }
    return list;
  }, [clients, selectedClientId, clientName]);

  const availableVehicles = React.useMemo(() => {
    const list = [...vehicles];
    const cleanPlate = (vehiclePlate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (vehiclePlate && !list.some(v => v.id === selectedVehicleId || (v.placa || v.plate || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() === cleanPlate)) {
      list.unshift({
        id: selectedVehicleId || 'custom-vehicle',
        placa: vehiclePlate,
        plate: vehiclePlate,
        modelo: vehicleType || 'Veículo',
        model: vehicleType || 'Veículo'
      } as any);
    }
    return list;
  }, [vehicles, selectedVehicleId, vehiclePlate, vehicleType]);

  const vehicleOptions = React.useMemo<SearchableOption[]>(() => {
    return availableVehicles.map((v: any) => {
      const plate = v.placa || v.plate || 'SEM PLACA';
      const model = v.modelo || v.model || v.brand || 'Veículo';
      const type = detectVehicleType(v);
      const kmStr = v.currentMileage != null && Number(v.currentMileage) > 0 
        ? `${Number(v.currentMileage).toLocaleString('pt-BR')} km` 
        : '';
      return {
        value: v.id || plate,
        label: plate,
        subtitle: `${model}${kmStr ? ` • ${kmStr}` : ''}`,
        badge: type,
        badgeColor: type === 'ÔNIBUS' ? 'emerald' : type === 'MICRO' ? 'amber' : 'blue',
        keywords: [plate, model, v.brand, v.fabricante, v.prefixo, v.prefix, type]
      };
    });
  }, [availableVehicles]);

  const driverOptions = React.useMemo<SearchableOption[]>(() => {
    return combinedMotoristas.map((m: any) => {
      const cleaned = cleanDriverName(m.name);
      return {
        value: m.id || cleaned,
        label: cleaned,
        subtitle: m.sub || 'Motorista',
        badge: 'MOTORISTA',
        badgeColor: 'amber',
        keywords: [cleaned, m.sub || '', m.name]
      };
    });
  }, [combinedMotoristas]);

  const clientOptions = React.useMemo<SearchableOption[]>(() => {
    return availableClients.map((c: any) => ({
      value: c.id,
      label: c.name,
      subtitle: c.cnpj ? `CNPJ: ${c.cnpj}` : undefined,
      badge: 'CLIENTE',
      badgeColor: 'blue',
      keywords: [c.name, c.tradeName || '', c.razaoSocial || '', c.cnpj || '']
    }));
  }, [availableClients]);

  const contractOptions = React.useMemo<SearchableOption[]>(() => {
    return clientContracts.map(ct => ({
      value: ct.contractNumber,
      label: ct.contractNumber,
      subtitle: ct.description || (clientName ? `Contrato — ${clientName}` : undefined),
      badge: 'CONTRATO',
      badgeColor: 'amber',
      keywords: [ct.contractNumber, ct.description || '']
    }));
  }, [clientContracts, clientName]);

  const obraOptions = React.useMemo<SearchableOption[]>(() => {
    return clientObras.map(ob => ({
      value: ob.name,
      label: ob.name,
      subtitle: ob.city ? `Localidade: ${ob.city}` : (clientName ? `Cliente: ${clientName}` : undefined),
      badge: 'OBRA',
      badgeColor: 'emerald',
      keywords: [ob.name, ob.city || '']
    }));
  }, [clientObras, clientName]);

  const jumpToVeiculo = () => {
    setCurrentStep('veiculo');
    setTimeout(() => {
      veiculoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const jumpToMotorista = () => {
    setCurrentStep('veiculo');
    setTimeout(() => {
      driverSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  const jumpToCliente = () => {
    setCurrentStep('veiculo');
    setTimeout(() => {
      clienteSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

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

              {/* Ações do Topo: Exemplo e Botão Fechar (X) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {!isReadOnly && !parteDiariaToEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillSampleData}
                    className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-[10px] sm:text-[11px] h-8 sm:h-9 px-2 sm:px-2.5 rounded-xl shrink-0 gap-1"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden xs:inline">Exemplo</span>
                  </Button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Fechar modal"
                  title="Fechar (Esc)"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/90 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700/80 hover:border-red-500/40 flex items-center justify-center transition-all active:scale-95 shadow-sm"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
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
                  onClick={jumpToVeiculo}
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
                  onClick={jumpToMotorista}
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
                  onClick={jumpToCliente}
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
                <div ref={veiculoSectionRef} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
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

                    {!manualPlateMode && vehicleOptions.length > 0 ? (
                      <SearchableSelect
                        value={selectedVehicleId || (availableVehicles.find(v => (v.placa || v.plate || '').toUpperCase() === (vehiclePlate || '').toUpperCase())?.id || '')}
                        fallbackLabel={vehiclePlate ? `${vehiclePlate} — ${vehicleType}` : undefined}
                        onChange={(val, opt) => {
                          handleVehicleChange(val);
                          if (opt?.label) {
                            setVehiclePlate(opt.label);
                          }
                        }}
                        options={vehicleOptions}
                        placeholder="Clique ou digite a placa do veículo..."
                        searchPlaceholder="Digite a placa ou modelo (ex: QMR, Agrale)..."
                        emptyText="Nenhum veículo encontrado para esta busca."
                        size="lg"
                        className="bg-slate-950 border-slate-700 text-white font-mono font-bold"
                      />
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
                <div ref={driverSectionRef} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <User className="h-4 w-4" /> Quem é o Motorista?
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualDriverMode(!manualDriverMode)}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      {manualDriverMode ? 'Buscar Motoristas Cadastrados' : 'Digitar Nome Livre'}
                    </button>
                  </div>

                  {!manualDriverMode && driverOptions.length > 0 ? (
                    <SearchableSelect
                      value={selectedDriverId || driverName}
                      fallbackLabel={driverName || 'Selecione o motorista...'}
                      onChange={(val, opt) => {
                        if (opt?.label) {
                          setDriverName(cleanDriverName(opt.label));
                          setSelectedDriverId(val);
                        }
                      }}
                      options={driverOptions}
                      placeholder="Clique ou digite o nome do motorista..."
                      searchPlaceholder="Digite o nome do motorista (ex: Fernando)..."
                      emptyText="Nenhum motorista ou colaborador encontrado."
                      size="lg"
                      className="bg-slate-950 border-slate-700 text-white font-semibold"
                    />
                  ) : (
                    <Input
                      ref={driverInputRef}
                      value={driverName}
                      onChange={(e) => setDriverName(cleanDriverName(e.target.value))}
                      placeholder="Digite o nome do motorista livremente..."
                      className="bg-slate-950 border-slate-700 text-white font-semibold text-sm h-11 rounded-xl"
                    />
                  )}
                </div>

                {/* Cliente e Obra */}
                <div ref={clienteSectionRef} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 space-y-3">
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
                      {!manualClientMode && clientOptions.length > 0 ? (
                        <SearchableSelect
                          value={selectedClientId || (availableClients.find(c => c.name.toLowerCase() === (clientName || '').toLowerCase())?.id || '')}
                          fallbackLabel={clientName || 'Selecione o cliente...'}
                          onChange={(val, opt) => {
                            handleClientChange(val, opt?.label);
                          }}
                          options={clientOptions}
                          placeholder="Selecione ou busque o cliente..."
                          searchPlaceholder="Buscar cliente (ex: AngloGold, Vale, FM2C)..."
                          emptyText="Nenhum cliente encontrado."
                          className="bg-slate-950 border-slate-700 text-white"
                        />
                      ) : (
                        <Input
                          value={clientName}
                          onChange={(e) => {
                            setClientName(e.target.value);
                            resolveClientContractsAndObras('', e.target.value);
                          }}
                          placeholder="Ex: AngloGold Ashanti"
                          className="bg-slate-950 border-slate-700 text-white font-bold h-10 rounded-xl"
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs text-slate-300 font-semibold">Nº Contrato</Label>
                        <button
                          type="button"
                          onClick={() => setManualContractMode(!manualContractMode)}
                          className="text-[10px] text-amber-400 hover:underline font-bold"
                        >
                          {manualContractMode ? 'Buscar Contratos' : 'Digitar'}
                        </button>
                      </div>
                      {!manualContractMode && contractOptions.length > 0 ? (
                        <SearchableSelect
                          value={contractNumber}
                          fallbackLabel={contractNumber || 'Selecione o contrato...'}
                          onChange={(val) => {
                            setContractNumber(val);
                            const ct = clientContracts.find(c => c.contractNumber === val);
                            if (ct?.obraName) {
                              setObraName(ct.obraName);
                            }
                          }}
                          options={contractOptions}
                          placeholder="Selecione o contrato..."
                          searchPlaceholder="Buscar contrato (ex: CT-2024)..."
                          emptyText="Nenhum contrato cadastrado para este cliente."
                          className="bg-slate-950 border-slate-700 text-amber-300 font-bold"
                        />
                      ) : (
                        <Input
                          value={contractNumber}
                          onChange={(e) => setContractNumber(e.target.value)}
                          placeholder="Ex: CT-2024/AGA-01"
                          className="bg-slate-950 border-slate-700 text-amber-300 font-bold h-10 rounded-xl"
                        />
                      )}
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

                      {!manualObraMode && obraOptions.length > 0 ? (
                        <SearchableSelect
                          value={obraName}
                          fallbackLabel={obraName || 'Selecione a obra...'}
                          onChange={(val) => {
                            setObraName(val);
                            const wp = clientObras.find(w => w.name === val);
                            if (wp?.contractId) {
                              setContractNumber(`CT-${wp.contractId.substring(0, 8)}`);
                            }
                          }}
                          options={obraOptions}
                          placeholder="Selecione a obra..."
                          searchPlaceholder="Buscar obra (ex: Planta Cuiabá, Mina)..."
                          emptyText="Nenhuma obra cadastrada para o cliente."
                          className="bg-slate-950 border-slate-700 text-white font-semibold"
                        />
                      ) : (
                        <Input
                          value={obraName}
                          onChange={(e) => setObraName(e.target.value)}
                          placeholder="Ex: PLANTA CUIABÁ - SABARÁ/MG"
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

          {/* Rodapé informativo discreto do Modal */}
          <div className="bg-slate-900/60 px-4 py-2.5 border-t border-slate-800/80 rounded-b-2xl flex items-center justify-between text-[11px] text-slate-500">
            <span>Parte Diária Oficial • Viação São Silvestre</span>
            <span className="font-mono">Ficha Nº {docNumber}</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ParteDiariaModal;
