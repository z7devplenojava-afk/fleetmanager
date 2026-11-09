import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGSAP } from '@/hooks/use-gsap';
import {
  Warehouse, Plus, Trash2, Loader2, Bus, User, Phone, Search,
  MapPin, Building2, Users, Pencil, AlertTriangle, Gauge,
  ArrowLeftRight, History, ArrowRight, QrCode, Camera,
  LogIn, LogOut, Clock, Wrench, ShieldCheck, CheckCircle2,
  RefreshCw, Filter, Smartphone, ExternalLink, Calendar, Sparkles, Info, Eye
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  garageService, Garage, GarageInput, GarageOccupancyDashboard,
  GarageMovement, GarageTransferInput, GarageCheckInInput, GarageCheckOutInput,
  GarageVehicleSummary, MOVEMENT_REASON_LABELS,
} from '@/services/garageService';
import { employeeService, Employee } from '@/services/employeeService';
import fleetService from '@/services/fleetService';
import { ResponsavelCombobox } from '@/components/garages/ResponsavelCombobox';
import MapWithPin from '@/components/ui/MapWithPin';
import { QRCodeScanner, QRScanResult } from '@/components/frota/QRCodeScanner';
import { VehicleQRCodeModal } from '@/components/frota/VehicleQRCodeModal';
import { DriverCombobox } from '@/components/frota/DriverCombobox';
import { OperacaoDoDiaDashboard } from '@/components/operacao/OperacaoDoDiaDashboard';

interface FleetVehicle {
  id: string;
  plate: string;
  model: string;
  brand?: string;
  year?: number;
  status: string;
  garageId?: string;
  garageName?: string;
  assignedDriver?: string;
  workPostEntity?: { id: string; name: string };
  clientName?: string;
  projectName?: string;
  operationName?: string;
  currentMileage?: number;
  operationEntryDate?: string;
}

/**
 * Endereço estruturado da garagem (campos do formulário de cadastro).
 * É composto em um único texto em `form.address` antes de salvar no backend.
 */
interface GarageAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
}

const EMPTY_GARAGE_ADDRESS: GarageAddress = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
};

const VALID_UFS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT',
  'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
];

/** Formata o CEP enquanto digita (00000-000). */
const formatCep = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
};

/** Monta o endereço completo (string salva em `address`) a partir dos campos estruturados. */
const composeGarageAddress = (addr: GarageAddress): string => {
  const firstLine = [addr.logradouro, addr.numero].filter(Boolean).join(', ');
  const parts = [
    firstLine,
    addr.complemento,
    addr.bairro,
    [addr.cidade, addr.uf].filter(Boolean).join(' - '),
  ].filter(Boolean);
  const text = parts.join(', ');
  if (!addr.cep) return text.trim();
  return (text ? `${text} - CEP ${addr.cep}` : `CEP ${addr.cep}`).trim();
};

/**
 * Converte um endereço já salvo em texto nos campos estruturados (melhor esforço),
 * para que a edição de uma garagem existente não perca o endereço cadastrado.
 */
const parseGarageAddress = (raw?: string): GarageAddress => {
  const addr: GarageAddress = { ...EMPTY_GARAGE_ADDRESS };
  if (!raw || !raw.trim()) return addr;

  let text = raw.trim();
  const cepMatch = text.match(/\b\d{5}-?\d{3}\b/);
  if (cepMatch) {
    addr.cep = formatCep(cepMatch[0]);
    text = text.replace(cepMatch[0], '');
  }
  text = text.replace(/\s*CEP\s*$/i, '').replace(/[\s,;-–]+$/, '').trim();

  const ufMatch = text.match(/\s[-–/(]\s*([A-Za-z]{2})\s*\)?\s*$/);
  if (ufMatch && VALID_UFS.includes((ufMatch[1] || '').toUpperCase())) {
    addr.uf = ufMatch[1].toUpperCase();
    text = text.slice(0, ufMatch.index).replace(/[\s,;]+$/, '').trim();
  }

  const segments = text.split(',').map(s => s.trim()).filter(Boolean);
  if (addr.uf && segments.length > 0) {
    addr.cidade = segments.pop() || '';
  }
  if (segments.length >= 2) {
    addr.bairro = segments[segments.length - 1];
    const head = segments.slice(0, -1);
    addr.logradouro = head[0];
    if (head.length > 1) addr.numero = head.slice(1).join(', ');
  } else if (segments.length === 1) {
    addr.logradouro = segments[0];
  }
  return addr;
};

export const Garagens: React.FC = () => {
  const { toast } = useToast();
  useGSAP();

  // Estados principais de dados
  const [garages, setGarages] = useState<Garage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [dashboard, setDashboard] = useState<GarageOccupancyDashboard | null>(null);
  const [activeStays, setActiveStays] = useState<GarageMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Navegação por Abas
  const [activeTab, setActiveTab] = useState<'vehicles' | 'terminal' | 'garages' | 'history' | 'operacao'>('vehicles');

  // Filtros da aba Veículos no Pátio
  const [searchVehicle, setSearchVehicle] = useState('');
  const [filterGarageId, setFilterGarageId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, MAINTENANCE, ACTIVE, etc.
  const [sortBy, setSortBy] = useState<'stay' | 'plate' | 'client' | 'entry'>('stay');

  // Diálogo de cadastro/edição de Garagem
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GarageInput>({
    name: '', address: '', responsibleEmployeeId: '', responsibleName: '',
    responsiblePhone: '', capacity: undefined, notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Endereço estruturado (CEP + campos) e localização no mapa
  const [addr, setAddr] = useState<GarageAddress>({ ...EMPTY_GARAGE_ADDRESS });
  const addrRef = useRef<GarageAddress>({ ...EMPTY_GARAGE_ADDRESS });
  const [cepLoading, setCepLoading] = useState(false);
  const [garageGeo, setGarageGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isUniqueCityCep, setIsUniqueCityCep] = useState(false);
  const logradouroInputRef = useRef<HTMLInputElement>(null);
  const geocodeDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Confirmação de exclusão/desativação
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal de visualização de informações e veículos de uma garagem
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [vehicleToAssign, setVehicleToAssign] = useState('');
  const [stayVehicleSearch, setStayVehicleSearch] = useState('');
  const [stayEditingVehicleId, setStayEditingVehicleId] = useState<string | null>(null);
  const [stayDriverName, setStayDriverName] = useState('');
  const [stayStartDate, setStayStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stayStartTime, setStayStartTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [stayEndDate, setStayEndDate] = useState('');
  const [stayEndTime, setStayEndTime] = useState('');
  const [stayWorkSchedule, setStayWorkSchedule] = useState('06:00 às 14:20 - Turno Manhã');
  const [stayIsTemporary, setStayIsTemporary] = useState(false);
  const [stayReason, setStayReason] = useState('RECOLHIMENTO');
  const [stayFilterMode, setStayFilterMode] = useState<'all' | 'active' | 'temporary'>('all');
  const [staySearchQuery, setStaySearchQuery] = useState('');
  const [staySaving, setStaySaving] = useState(false);

  // Remanejamento entre garagens
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferVehicleId, setTransferVehicleId] = useState('');
  const [transferToGarageId, setTransferToGarageId] = useState('');
  const [transferReason, setTransferReason] = useState('REMANEJAMENTO');
  const [transferDetail, setTransferDetail] = useState('');
  const [transferDriverName, setTransferDriverName] = useState('');
  const [transferWorkSchedule, setTransferWorkSchedule] = useState('');
  const [transferIsTemporary, setTransferIsTemporary] = useState(false);
  const [transferSaving, setTransferSaving] = useState(false);

  // Histórico de movimentações
  const [movements, setMovements] = useState<GarageMovement[]>([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [historyFilterType, setHistoryFilterType] = useState<string>('all');

  // Scanner de QR Code
  const [scannerOpen, setScannerOpen] = useState(false);

  // Modal de Passaporte / QR Code do veículo
  const [qrModalVehicleId, setQrModalVehicleId] = useState<string | null>(null);

  // Terminal Portaria: Veículo selecionado
  const [terminalVehicleId, setTerminalVehicleId] = useState<string>('');
  const [terminalSearchPlate, setTerminalSearchPlate] = useState('');
  const [terminalAction, setTerminalAction] = useState<'check-in' | 'check-out'>('check-in');
  const [terminalGarageId, setTerminalGarageId] = useState<string>('');
  const [terminalDriver, setTerminalDriver] = useState<string>('');
  const [terminalSelectedEmployee, setTerminalSelectedEmployee] = useState<Employee | null>(null);
  const [terminalClient, setTerminalClient] = useState<string>('');
  const [terminalReason, setTerminalReason] = useState<string>('RECOLHIMENTO');
  const [terminalDetail, setTerminalDetail] = useState<string>('');
  const [terminalKm, setTerminalKm] = useState<number | undefined>(undefined);
  const [terminalStartDate, setTerminalStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [terminalStartTime, setTerminalStartTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [terminalEndDate, setTerminalEndDate] = useState('');
  const [terminalEndTime, setTerminalEndTime] = useState('');
  const [terminalWorkSchedule, setTerminalWorkSchedule] = useState('06:00 às 14:20 - Turno Manhã');
  const [terminalIsTemporary, setTerminalIsTemporary] = useState(false);
  const [terminalSubmitting, setTerminalSubmitting] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);

  // Execução do Seed de Demonstração
  const handleRunSeed = async () => {
    setSeedLoading(true);
    try {
      await garageService.seed();
      toast({
        title: '🌱 Seed de Garagens Concluído!',
        description: 'Garagens e veículos operacionais alocados com sucesso.',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao executar seed',
        description: error.response?.data?.message || 'Não foi possível gerar os dados de demonstração.',
        variant: 'destructive',
      });
    } finally {
      setSeedLoading(false);
    }
  };

  // Carregar dados completos
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [garagesData, employeesData, vehiclesData, dashboardData, activeStaysData, movementsData] = await Promise.all([
        garageService.list().catch(() => []),
        employeeService.getAllEmployees().catch(() => []),
        fleetService.getVehicles().catch(() => [] as any[]),
        garageService.occupancyDashboard().catch(() => null),
        garageService.listActiveStays().catch(() => []),
        garageService.listMovements(0, 100).catch(() => []),
      ]);
      setGarages(garagesData);
      setEmployees(employeesData);
      setVehicles(vehiclesData as FleetVehicle[]);
      setDashboard(dashboardData);
      setActiveStays(activeStaysData);
      setMovements(movementsData);
    } catch {
      toast({ title: 'Erro', description: 'Erro ao carregar dados operacionais das garagens', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Mapa de estadias ativas por veículo para consulta O(1)
  const activeStayMap = useMemo(() => {
    const map = new Map<string, GarageMovement>();
    activeStays.forEach(stay => {
      if (stay.vehicleId) {
        map.set(stay.vehicleId, stay);
      }
    });
    return map;
  }, [activeStays]);

  // Lista consolidada de veículos atualmente no pátio (dentro de alguma garagem)
  const vehiclesInGarage = useMemo(() => {
    return vehicles.filter(v => v.garageId != null);
  }, [vehicles]);

  // Veículos em manutenção que estão atualmente no pátio
  const vehiclesInMaintenanceInGarage = useMemo(() => {
    return vehiclesInGarage.filter(v => (v.status || '').toUpperCase() === 'MAINTENANCE' || (v.status || '').toUpperCase() === 'MANUTENCAO');
  }, [vehiclesInGarage]);

  // Helper para obter nome do cliente de um veículo
  const getVehicleClientName = (v: FleetVehicle, stay?: GarageMovement): string => {
    if (stay?.clientName && stay.clientName.trim()) return stay.clientName;
    if (v.clientName && v.clientName.trim()) return v.clientName;
    if (v.projectName && v.projectName.trim()) return v.projectName;
    if (v.operationName && v.operationName.trim()) return v.operationName;
    if (v.workPostEntity?.name) return v.workPostEntity.name;
    return 'Reserva Operacional / Sem Alocação';
  };

  // Helper para obter motorista do veículo
  const getVehicleDriver = (v: FleetVehicle, stay?: GarageMovement): string => {
    if (stay?.driverName && stay.driverName.trim()) return stay.driverName;
    if (v.assignedDriver && v.assignedDriver.trim()) return v.assignedDriver;
    return 'Não atribuído';
  };

  // Helper para calcular tempo de permanência live
  const calculateStay = (v: FleetVehicle, stay?: GarageMovement) => {
    let entryDate: Date | null = null;
    let reason = stay?.reason || 'RECOLHIMENTO';

    if (stay?.entryTime) {
      entryDate = new Date(stay.entryTime);
    } else if (stay?.createdAt) {
      entryDate = new Date(stay.createdAt);
    } else if (v.operationEntryDate) {
      entryDate = new Date(v.operationEntryDate);
    }

    if (!entryDate || isNaN(entryDate.getTime())) {
      return {
        entryFormatted: '—',
        stayFormatted: 'Tempo Indeterminado',
        stayMinutes: 0,
        severity: 'normal',
        reasonLabel: MOVEMENT_REASON_LABELS[reason] || reason
      };
    }

    const diffMs = Math.max(0, Date.now() - entryDate.getTime());
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);

    let stayFormatted = '';
    if (totalMinutes < 60) {
      stayFormatted = `${totalMinutes} min`;
    } else if (hours < 24) {
      const remMin = totalMinutes % 60;
      stayFormatted = remMin > 0 ? `${hours}h ${remMin}min` : `${hours}h`;
    } else {
      const remHours = hours % 24;
      stayFormatted = remHours > 0 ? `${days}d ${remHours}h` : `${days} dias`;
    }

    // Severidade: verde (< 12h), amarelo (12h a 48h), vermelho (> 48h)
    let severity: 'normal' | 'warning' | 'alert' = 'normal';
    if (hours >= 48) severity = 'alert';
    else if (hours >= 12) severity = 'warning';

    const entryFormatted = entryDate.toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    return {
      entryDate,
      entryFormatted,
      stayFormatted,
      stayMinutes: totalMinutes,
      severity,
      reasonLabel: MOVEMENT_REASON_LABELS[reason] || reason
    };
  };

  // Filtragem e ordenação dos veículos no pátio
  const filteredVehiclesInYard = useMemo(() => {
    let result = vehiclesInGarage.map(v => {
      const stay = activeStayMap.get(v.id);
      const client = getVehicleClientName(v, stay);
      const driver = getVehicleDriver(v, stay);
      const stayInfo = calculateStay(v, stay);
      return {
        ...v,
        client,
        driver,
        stayInfo,
        stay
      };
    });

    // Filtro por Garagem
    if (filterGarageId !== 'all') {
      result = result.filter(v => v.garageId === filterGarageId);
    }

    // Filtro por Status
    if (filterStatus === 'MAINTENANCE') {
      result = result.filter(v => (v.status || '').toUpperCase() === 'MAINTENANCE' || (v.status || '').toUpperCase() === 'MANUTENCAO');
    } else if (filterStatus === 'ACTIVE') {
      result = result.filter(v => (v.status || '').toUpperCase() === 'ACTIVE' || (v.status || '').toUpperCase() === 'ATIVO');
    }

    // Filtro por busca textual
    const q = searchVehicle.trim().toLowerCase();
    if (q) {
      result = result.filter(v =>
        v.plate?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.brand?.toLowerCase().includes(q) ||
        v.client?.toLowerCase().includes(q) ||
        v.driver?.toLowerCase().includes(q) ||
        v.garageName?.toLowerCase().includes(q)
      );
    }

    // Ordenação
    result.sort((a, b) => {
      if (sortBy === 'stay') {
        return b.stayInfo.stayMinutes - a.stayInfo.stayMinutes; // Mais tempo primeiro
      }
      if (sortBy === 'plate') {
        return (a.plate || '').localeCompare(b.plate || '');
      }
      if (sortBy === 'client') {
        return a.client.localeCompare(b.client);
      }
      if (sortBy === 'entry') {
        const timeA = a.stayInfo.entryDate ? a.stayInfo.entryDate.getTime() : 0;
        const timeB = b.stayInfo.entryDate ? b.stayInfo.entryDate.getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

    return result;
  }, [vehiclesInGarage, activeStayMap, filterGarageId, filterStatus, searchVehicle, sortBy]);

  // Abertura do Terminal de Portaria a partir de um veículo específico
  const openTerminalForVehicle = (v: FleetVehicle, action: 'check-in' | 'check-out', scannedDriverName?: string, scannedCnh?: string) => {
    setTerminalVehicleId(v.id);
    setTerminalAction(action);
    setTerminalGarageId(v.garageId || (garages[0]?.id || ''));

    // Prioridade do motorista: QR lido > motorista alocado no veículo > última estadia ativa
    let driverNameToSet = scannedDriverName || v.assignedDriver || '';
    if (!driverNameToSet) {
      const stay = activeStayMap.get(v.id);
      if (stay?.driverName) driverNameToSet = stay.driverName;
    }

    // Busca na base de funcionários por CNH ou Nome
    let matchedEmp: Employee | undefined;
    if (scannedCnh) {
      matchedEmp = employees.find(e => e.cnhNumber && e.cnhNumber.trim() === scannedCnh.trim());
    }
    if (!matchedEmp && driverNameToSet) {
      const cleanTarget = driverNameToSet.trim().toLowerCase();
      matchedEmp = employees.find(e => 
        e.name.trim().toLowerCase() === cleanTarget ||
        (e.cnhNumber && e.cnhNumber.trim() === cleanTarget)
      );
      if (!matchedEmp) {
        matchedEmp = employees.find(e => 
          e.name.toLowerCase().includes(cleanTarget) ||
          cleanTarget.includes(e.name.toLowerCase())
        );
      }
    }

    if (matchedEmp) {
      setTerminalDriver(matchedEmp.name);
      setTerminalSelectedEmployee(matchedEmp);
    } else {
      setTerminalDriver(driverNameToSet);
      setTerminalSelectedEmployee(null);
    }

    setTerminalClient(v.clientName || v.projectName || v.workPostEntity?.name || '');
    setTerminalKm(v.currentMileage);
    setTerminalReason(action === 'check-out' ? 'OPERACAO' : 'RECOLHIMENTO');
    setTerminalDetail('');
    setActiveTab('terminal');
  };

  // Handler de leitura do QR Code
  const handleScanQRCode = (result: QRScanResult) => {
    let matchedVehicle: FleetVehicle | undefined;

    if (result.vehicleId) {
      matchedVehicle = vehicles.find(v => v.id === result.vehicleId);
    }
    if (!matchedVehicle && result.plate) {
      const cleanPlate = result.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
      matchedVehicle = vehicles.find(v => (v.plate || '').toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate);
    }
    if (!matchedVehicle && result.rawText) {
      const textClean = result.rawText.toUpperCase().trim();
      matchedVehicle = vehicles.find(v => v.id === textClean || v.plate?.toUpperCase() === textClean);
    }

    // Busca de motorista na base pelo QR Code (caso tenha CNH ou Nome no QR lido)
    let driverFromQr: Employee | undefined;
    if (result.driverCnh) {
      const cleanCnh = result.driverCnh.trim();
      driverFromQr = employees.find(e => e.cnhNumber && e.cnhNumber.trim() === cleanCnh);
    }
    if (!driverFromQr && result.driverName) {
      const cleanName = result.driverName.trim().toLowerCase();
      driverFromQr = employees.find(e => 
        e.name.trim().toLowerCase() === cleanName ||
        e.name.toLowerCase().includes(cleanName)
      );
    }
    if (!driverFromQr && result.rawText) {
      const raw = result.rawText.trim();
      driverFromQr = employees.find(e => 
        (e.cnhNumber && e.cnhNumber.trim() === raw) ||
        (e.cpf && e.cpf.replace(/\D/g, '') === raw.replace(/\D/g, '')) ||
        (e.registrationNumber && e.registrationNumber.trim() === raw)
      );
    }

    if (matchedVehicle) {
      const isInside = matchedVehicle.garageId != null;
      const driverNameParam = driverFromQr ? driverFromQr.name : (result.driverName || undefined);
      const driverCnhParam = driverFromQr?.cnhNumber || result.driverCnh || undefined;

      openTerminalForVehicle(matchedVehicle, isInside ? 'check-out' : 'check-in', driverNameParam, driverCnhParam);
      
      const driverBadge = driverFromQr
        ? ` | Motorista: ${driverFromQr.name} (CNH: ${driverFromQr.cnhNumber || 'Não informada'})`
        : (matchedVehicle.assignedDriver ? ` | Motorista: ${matchedVehicle.assignedDriver}` : '');

      toast({
        title: 'Veículo Identificado!',
        description: `Placa: ${matchedVehicle.plate} (${matchedVehicle.brand || ''} ${matchedVehicle.model})${driverBadge}`,
      });
    } else if (driverFromQr) {
      // O QR Code lido foi o crachá de um motorista
      setTerminalDriver(driverFromQr.name);
      setTerminalSelectedEmployee(driverFromQr);
      setActiveTab('terminal');
      toast({
        title: 'Motorista Identificado pelo QR Code!',
        description: `${driverFromQr.name} — CNH: ${driverFromQr.cnhNumber || 'Não informada'} (${driverFromQr.positionDescription || 'Funcionário'})`,
      });
    } else {
      toast({
        title: 'QR Code Lido',
        description: `Nenhum veículo ou funcionário localizado com o código: ${result.plate || result.vehicleId || result.rawText || ''}`,
        variant: 'destructive',
      });
    }
  };

  // Confirmação de Check-in no Terminal
  const handleConfirmCheckIn = async () => {
    if (!terminalVehicleId || !terminalGarageId) {
      toast({ title: 'Atenção', description: 'Selecione o veículo e a garagem de destino', variant: 'destructive' });
      return;
    }
    setTerminalSubmitting(true);
    try {
      const entryIso = terminalStartDate
        ? `${terminalStartDate}T${terminalStartTime || '06:00'}:00`
        : undefined;
      const exitIso = terminalEndDate
        ? `${terminalEndDate}T${terminalEndTime || '18:00'}:00`
        : undefined;

      const payload: GarageCheckInInput = {
        vehicleId: terminalVehicleId,
        garageId: terminalGarageId,
        driverName: terminalDriver.trim() || undefined,
        clientName: terminalClient.trim() || undefined,
        reason: terminalReason,
        reasonDetail: terminalDetail.trim() || undefined,
        kmReading: terminalKm,
        entryTime: entryIso,
        exitTime: exitIso,
        workSchedule: terminalWorkSchedule.trim() || undefined,
        isTemporary: terminalIsTemporary,
      };
      await garageService.checkIn(payload);
      toast({
        title: '✅ Entrada Registrada!',
        description: 'Veículo recolhido no pátio com sucesso.',
      });
      loadData();
      setActiveTab('vehicles');
    } catch (error: any) {
      toast({
        title: 'Falha no Check-in',
        description: error.response?.data?.message || 'Não foi possível registrar a entrada.',
        variant: 'destructive',
      });
    } finally {
      setTerminalSubmitting(false);
    }
  };

  // Confirmação de Check-out no Terminal
  const handleConfirmCheckOut = async () => {
    if (!terminalVehicleId) {
      toast({ title: 'Atenção', description: 'Selecione o veículo para saída', variant: 'destructive' });
      return;
    }
    setTerminalSubmitting(true);
    try {
      const exitIso = terminalEndDate
        ? `${terminalEndDate}T${terminalEndTime || new Date().toTimeString().slice(0, 5)}:00`
        : undefined;
      const payload: GarageCheckOutInput = {
        vehicleId: terminalVehicleId,
        driverName: terminalDriver.trim() || undefined,
        reason: terminalReason,
        reasonDetail: terminalDetail.trim() || undefined,
        kmReading: terminalKm,
        exitTime: exitIso,
        workSchedule: terminalWorkSchedule.trim() || undefined,
      };
      await garageService.checkOut(payload);
      toast({
        title: '🚀 Saída Confirmada!',
        description: 'Veículo liberado do pátio para operação.',
      });
      loadData();
      setActiveTab('vehicles');
    } catch (error: any) {
      toast({
        title: 'Falha no Check-out',
        description: error.response?.data?.message || 'Não foi possível registrar a saída.',
        variant: 'destructive',
      });
    } finally {
      setTerminalSubmitting(false);
    }
  };

  // Cadastro/Edição de Garagem
  /** Atualiza campos do endereço e mantém `form.address` (texto salvo no backend) em sincronia. */
  const updateAddress = (patch: Partial<GarageAddress>, triggerGeocode = false): GarageAddress => {
    const next: GarageAddress = { ...addrRef.current, ...patch };
    addrRef.current = next;
    setAddr(next);
    setForm(prev => ({ ...prev, address: composeGarageAddress(next) }));

    if (triggerGeocode) {
      if (geocodeDebounceRef.current) {
        clearTimeout(geocodeDebounceRef.current);
      }
      geocodeDebounceRef.current = setTimeout(() => {
        if (next.cidade && (next.logradouro || next.cep)) {
          void geocodeAddress(next);
        }
      }, 700);
    }

    return next;
  };

  const nominatimSearch = async (
    params: URLSearchParams
  ): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}&format=json&limit=1&countrycodes=br`,
        { headers: { 'Accept-Language': 'pt-BR' } }
      );
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (err) {
      console.error('Erro na geocodificação:', err);
    }
    return null;
  };

  /** Localiza o endereço (a partir do CEP, Rua e Número) e atualiza o mapa com o pino da garagem. */
  const geocodeAddress = async (address: GarageAddress) => {
    const cepDigits = (address.cep || '').replace(/\D/g, '');
    setGeoLoading(true);
    try {
      let coords: { lat: number; lng: number } | null = null;

      // 1) Busca estruturada completa: Rua + Número + Cidade + Estado (alta precisão)
      if (address.logradouro && address.cidade) {
        const streetQuery = [address.logradouro, address.numero].filter(Boolean).join(', ');
        const params = new URLSearchParams();
        params.set('street', streetQuery);
        params.set('city', address.cidade);
        if (address.uf) params.set('state', address.uf);
        coords = await nominatimSearch(params);
      }

      // 2) Busca apenas Rua + Cidade + Estado
      if (!coords && address.logradouro && address.cidade) {
        const params = new URLSearchParams();
        params.set('street', address.logradouro);
        params.set('city', address.cidade);
        if (address.uf) params.set('state', address.uf);
        coords = await nominatimSearch(params);
      }

      // 3) Fallback: localizar pelo CEP
      if (!coords && cepDigits.length === 8) {
        const params = new URLSearchParams();
        params.set('postalcode', cepDigits);
        coords = await nominatimSearch(params);
      }

      // 4) Fallback: Bairro + Cidade + Estado
      if (!coords && address.cidade) {
        const queryParts = [address.bairro, address.cidade, address.uf, 'Brasil'].filter(Boolean).join(', ');
        const params = new URLSearchParams();
        params.set('q', queryParts);
        coords = await nominatimSearch(params);
      }

      // 5) Fallback final: apenas Cidade + Estado
      if (!coords && address.cidade) {
        const params = new URLSearchParams();
        params.set('city', address.cidade);
        if (address.uf) params.set('state', address.uf);
        coords = await nominatimSearch(params);
      }

      setGarageGeo(coords);
      if (!coords) {
        toast({
          title: 'Localização aproximada não identificada',
          description: 'Não foi possível posicionar o endereço no mapa automaticamente.',
        });
      }
    } finally {
      setGeoLoading(false);
    }
  };

  /** Busca CEP com fallback redundante: 1) ViaCEP -> 2) BrasilAPI */
  const fetchCepData = async (digits: string): Promise<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null> => {
    // 1. Tentar ViaCEP
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();
      if (data && !data.erro) {
        return {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          localidade: data.localidade || '',
          uf: data.uf || '',
        };
      }
    } catch (e) {
      console.warn('ViaCEP falhou, consultando BrasilAPI fallback...', e);
    }

    // 2. Fallback BrasilAPI
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
      const data = await response.json();
      if (data && (data.city || data.state)) {
        return {
          logradouro: data.street || '',
          bairro: data.neighborhood || '',
          localidade: data.city || '',
          uf: data.state || '',
        };
      }
    } catch (e) {
      console.warn('BrasilAPI fallback falhou...', e);
    }

    return null;
  };

  /** Consulta o CEP, preenche todos os campos do endereço e atualiza o mapa. */
  const lookupCep = async (digits: string) => {
    setCepLoading(true);
    try {
      const data = await fetchCepData(digits);
      if (!data) {
        toast({ title: 'CEP não encontrado', description: 'Verifique o CEP digitado.', variant: 'destructive' });
        setIsUniqueCityCep(false);
        return;
      }

      // Identifica se é CEP único de município (como Moeda/MG 35470-000 onde não há logradouro nos Correios)
      const isGeneral = !data.logradouro && !!data.localidade;
      setIsUniqueCityCep(isGeneral);

      // Usa o estado mais recente (preserva edições feitas durante a consulta)
      const base = addrRef.current;
      const resolvedBairro = data.bairro || (isGeneral ? 'Centro' : base.bairro);

      const next: GarageAddress = {
        ...base,
        cep: formatCep(digits),
        logradouro: data.logradouro || base.logradouro,
        bairro: resolvedBairro,
        cidade: data.localidade || base.cidade,
        uf: data.uf || base.uf,
      };

      addrRef.current = next;
      setAddr(next);
      setForm(prev => ({ ...prev, address: composeGarageAddress(next) }));

      if (isGeneral) {
        toast({
          title: 'CEP Municipal Identificado',
          description: `${data.localidade}/${data.uf} possui CEP geral. Preenchemos Cidade, UF e Bairro (Centro). Por favor, informe a Rua e o Número.`,
        });
        // Foca automaticamente no campo de Rua / Avenida para o usuário
        setTimeout(() => {
          logradouroInputRef.current?.focus();
        }, 150);
      } else {
        toast({ title: 'CEP encontrado', description: 'Endereço completo preenchido automaticamente.' });
      }

      await geocodeAddress(next);
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      toast({ title: 'Erro ao buscar CEP', description: 'Não foi possível consultar o CEP.', variant: 'destructive' });
    } finally {
      setCepLoading(false);
    }
  };

  /** Digitação do CEP: aplica a máscara e, ao completar 8 dígitos, preenche o endereço + mapa. */
  const handleCepChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    updateAddress({ cep: formatCep(raw) });
    if (digits.length !== 8) {
      setGarageGeo(null);
      setIsUniqueCityCep(false);
      return;
    }
    void lookupCep(digits);
  };

  const openCreateGarage = () => {
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    setEditingId(null);
    addrRef.current = { ...EMPTY_GARAGE_ADDRESS };
    setAddr({ ...EMPTY_GARAGE_ADDRESS });
    setGarageGeo(null);
    setIsUniqueCityCep(false);
    setForm({ name: '', address: '', responsibleEmployeeId: '', responsibleName: '', responsiblePhone: '', capacity: undefined, notes: '' });
    setDialogOpen(true);
  };

  const openEditGarage = (garage: Garage) => {
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    setEditingId(garage.id);
    const parsedAddress = parseGarageAddress(garage.address);
    addrRef.current = parsedAddress;
    setAddr(parsedAddress);
    setGarageGeo(null);
    setIsUniqueCityCep(false);
    setGarageGeo(null);
    setForm({
      name: garage.name || '',
      address: garage.address || '',
      responsibleEmployeeId: garage.responsibleEmployeeId || '',
      responsibleName: garage.responsibleName || '',
      responsiblePhone: garage.responsiblePhone || '',
      capacity: garage.capacity,
      notes: garage.notes || '',
    });
    setDialogOpen(true);
    // Exibe o mapa da garagem já na edição (quando houver CEP no endereço salvo)
    if (parsedAddress.cep) {
      if (!parsedAddress.logradouro) {
        void lookupCep(parsedAddress.cep.replace(/\D/g, ''));
      } else {
        void geocodeAddress(parsedAddress);
      }
    }
  };

  const handleSaveGarage = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Atenção', description: 'Informe o nome da garagem', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: GarageInput = {
        ...form,
        name: form.name.trim(),
        responsibleEmployeeId: form.responsibleEmployeeId || undefined,
        responsibleName: form.responsibleName?.trim() || undefined,
        responsiblePhone: form.responsiblePhone?.trim() || undefined,
      };
      if (editingId) {
        await garageService.update(editingId, payload);
        toast({ title: 'Sucesso', description: 'Garagem atualizada' });
      } else {
        await garageService.create(payload);
        toast({ title: 'Sucesso', description: 'Garagem cadastrada com sucesso' });
      }
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.response?.data?.message || 'Erro ao salvar garagem', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGarage = async () => {
    if (!deleteId) return;
    const idToRemove = deleteId;
    try {
      await garageService.delete(idToRemove);
      setGarages(prev => prev.filter(g => g.id !== idToRemove));
      if (selectedGarage?.id === idToRemove) {
        setVehiclesDialogOpen(false);
        setSelectedGarage(null);
      }
      toast({ title: 'Sucesso', description: 'Garagem excluída com sucesso' });
      loadData();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao excluir garagem', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  // Extrai data (dd/MM/yyyy), hora (HH:mm), rawDate (YYYY-MM-DD) e rawTime (HH:mm) de string ISO ou data
  const splitDateAndTime = useCallback((isoOrDate?: string | null) => {
    if (!isoOrDate) {
      return { dateBr: '—', timeBr: '—', rawDate: '', rawTime: '' };
    }
    const trimmed = String(isoOrDate).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return { dateBr: `${d}/${m}/${y}`, timeBr: '06:00', rawDate: trimmed, rawTime: '06:00' };
    }
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) {
      return { dateBr: trimmed, timeBr: '—', rawDate: '', rawTime: '' };
    }
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    const hh = String(parsed.getHours()).padStart(2, '0');
    const min = String(parsed.getMinutes()).padStart(2, '0');
    return {
      dateBr: `${dd}/${mm}/${yyyy}`,
      timeBr: `${hh}:${min}`,
      rawDate: `${yyyy}-${mm}-${dd}`,
      rawTime: `${hh}:${min}`,
    };
  }, []);

  /**
   * Lista consolidada de todos os veículos de uma garagem (alocados fixos, temporários
   * e registros de entrada/saída vinculados à garagem).
   */
  const getGarageCompleteVehicles = useCallback((garage?: Garage | null) => {
    if (!garage) return [];
    const gId = garage.id;
    const gNameNorm = (garage.name || '').trim().toLowerCase();

    const map = new Map<string, {
      id: string;
      plate: string;
      brand?: string;
      model?: string;
      status?: string;
      currentMileage?: number;
      clientName: string;
      driverName: string;
      startDateBr: string;
      startTimeBr: string;
      endDateBr: string;
      endTimeBr: string;
      rawStartDate: string;
      rawStartTime: string;
      rawEndDate: string;
      rawEndTime: string;
      workSchedule: string;
      isTemporary: boolean;
      activeStay: boolean;
      reason: string;
      reasonLabel: string;
      stayDurationFormatted: string;
    }>();

    // Movimentações relacionadas a esta garagem (ordenadas da mais recente para a mais antiga)
    const garageMovements = [
      ...activeStays.filter(m =>
        m.toGarageId === gId ||
        (m.toGarageName && m.toGarageName.trim().toLowerCase() === gNameNorm)
      ),
      ...movements.filter(m =>
        m.toGarageId === gId ||
        m.fromGarageId === gId ||
        (m.toGarageName && m.toGarageName.trim().toLowerCase() === gNameNorm) ||
        (m.fromGarageName && m.fromGarageName.trim().toLowerCase() === gNameNorm)
      ),
    ];

    const latestMovByVehicle = new Map<string, GarageMovement>();
    garageMovements.forEach(m => {
      const key = m.vehicleId || m.vehiclePlate || m.id;
      if (key && !latestMovByVehicle.has(key)) {
        latestMovByVehicle.set(key, m);
      }
    });

    const defaultScheduleByReason = (reason?: string) => {
      const r = (reason || 'RECOLHIMENTO').toUpperCase();
      if (r === 'ESCALA') return '06:00 às 14:20 - Turno Manhã';
      if (r === 'MANUTENCAO') return 'Parada Técnica - Oficina';
      if (r === 'RESERVA') return 'Plantão 24h - Reserva Técnica';
      if (r === 'RECOLHIMENTO') return '22:00 às 06:00 - Pernoite / Recolhimento';
      return '07:00 às 17:00 - Operacional Padrão';
    };

    // 1. Veículos retornados diretamente na garagem (garage.vehicles)
    (garage.vehicles || []).forEach((gv: GarageVehicleSummary) => {
      if (!gv || !gv.id) return;
      const mov = latestMovByVehicle.get(gv.id) || activeStayMap.get(gv.id);
      const fleetVeh = vehicles.find(v => v.id === gv.id);
      const entrySource = gv.entryTime || mov?.entryTime || gv.entryDate || mov?.createdAt || fleetVeh?.operationEntryDate;
      const exitSource = gv.exitTime || mov?.exitTime || gv.exitDate;
      const entrySplit = splitDateAndTime(entrySource);
      const exitSplit = splitDateAndTime(exitSource);
      const reason = gv.reason || mov?.reason || 'RECOLHIMENTO';
      const schedule = gv.workSchedule || mov?.workSchedule || defaultScheduleByReason(reason);
      const driver = gv.driverName || mov?.driverName || gv.assignedDriver || fleetVeh?.assignedDriver || 'Não informado';
      const client = gv.clientName || mov?.clientName || fleetVeh?.clientName || fleetVeh?.projectName || 'Reserva Operacional';

      map.set(gv.id, {
        id: gv.id,
        plate: gv.plate,
        brand: gv.brand || fleetVeh?.brand,
        model: gv.model || fleetVeh?.model,
        status: gv.status || fleetVeh?.status || 'ACTIVE',
        currentMileage: gv.currentMileage ?? fleetVeh?.currentMileage,
        clientName: client,
        driverName: driver,
        startDateBr: entrySplit.dateBr,
        startTimeBr: entrySplit.timeBr,
        endDateBr: exitSplit.dateBr,
        endTimeBr: exitSplit.timeBr,
        rawStartDate: entrySplit.rawDate,
        rawStartTime: entrySplit.rawTime,
        rawEndDate: exitSplit.rawDate,
        rawEndTime: exitSplit.rawTime,
        workSchedule: schedule,
        isTemporary: Boolean(gv.isTemporary || mov?.isTemporary),
        activeStay: gv.activeStay !== false,
        reason,
        reasonLabel: MOVEMENT_REASON_LABELS[reason] || reason,
        stayDurationFormatted: gv.stayDurationFormatted || mov?.stayDurationFormatted || 'No pátio',
      });
    });

    // 2. Veículos da frota cujo garageId ou garageName bate com esta garagem
    vehicles.forEach(v => {
      const matchesGarage =
        v.garageId === gId ||
        (!v.garageId && v.garageName && v.garageName.trim().toLowerCase() === gNameNorm);
      if (!matchesGarage || map.has(v.id)) return;

      const mov = latestMovByVehicle.get(v.id) || activeStayMap.get(v.id);
      const entrySource = mov?.entryTime || mov?.createdAt || v.operationEntryDate;
      const exitSource = mov?.exitTime;
      const entrySplit = splitDateAndTime(entrySource);
      const exitSplit = splitDateAndTime(exitSource);
      const reason = mov?.reason || 'RECOLHIMENTO';
      const schedule = mov?.workSchedule || defaultScheduleByReason(reason);

      map.set(v.id, {
        id: v.id,
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        status: v.status,
        currentMileage: v.currentMileage,
        clientName: getVehicleClientName(v, mov),
        driverName: getVehicleDriver(v, mov),
        startDateBr: entrySplit.dateBr,
        startTimeBr: entrySplit.timeBr,
        endDateBr: exitSplit.dateBr,
        endTimeBr: exitSplit.timeBr,
        rawStartDate: entrySplit.rawDate,
        rawStartTime: entrySplit.rawTime,
        rawEndDate: exitSplit.rawDate,
        rawEndTime: exitSplit.rawTime,
        workSchedule: schedule,
        isTemporary: Boolean(mov?.isTemporary),
        activeStay: true,
        reason,
        reasonLabel: MOVEMENT_REASON_LABELS[reason] || reason,
        stayDurationFormatted: mov?.stayDurationFormatted || 'No pátio',
      });
    });

    // 3. Movimentações temporárias ou históricas desta garagem cujo veículo ainda não está no mapa
    garageMovements.forEach(mov => {
      const vId = mov.vehicleId || mov.id;
      if (!vId || map.has(vId)) return;
      const fleetVeh = vehicles.find(v => v.id === mov.vehicleId || v.plate === mov.vehiclePlate);
      const entrySource = mov.entryTime || mov.createdAt;
      const exitSource = mov.exitTime;
      const entrySplit = splitDateAndTime(entrySource);
      const exitSplit = splitDateAndTime(exitSource);
      const reason = mov.reason || 'RECOLHIMENTO';
      const schedule = mov.workSchedule || defaultScheduleByReason(reason);
      const isCurrentlyHere = Boolean(mov.activeStay && (mov.toGarageId === gId || (mov.toGarageName || '').trim().toLowerCase() === gNameNorm));

      map.set(vId, {
        id: fleetVeh?.id || vId,
        plate: fleetVeh?.plate || mov.vehiclePlate || '—',
        brand: fleetVeh?.brand,
        model: fleetVeh?.model,
        status: fleetVeh?.status || 'ACTIVE',
        currentMileage: mov.kmReading ?? fleetVeh?.currentMileage,
        clientName: mov.clientName || fleetVeh?.clientName || fleetVeh?.projectName || 'Reserva Operacional',
        driverName: mov.driverName || fleetVeh?.assignedDriver || 'Não informado',
        startDateBr: entrySplit.dateBr,
        startTimeBr: entrySplit.timeBr,
        endDateBr: exitSplit.dateBr,
        endTimeBr: exitSplit.timeBr,
        rawStartDate: entrySplit.rawDate,
        rawStartTime: entrySplit.rawTime,
        rawEndDate: exitSplit.rawDate,
        rawEndTime: exitSplit.rawTime,
        workSchedule: schedule,
        isTemporary: Boolean(mov.isTemporary || !isCurrentlyHere),
        activeStay: isCurrentlyHere,
        reason,
        reasonLabel: MOVEMENT_REASON_LABELS[reason] || reason,
        stayDurationFormatted: mov.stayDurationFormatted || (isCurrentlyHere ? 'No pátio' : 'Concluído'),
      });
    });

    return Array.from(map.values());
  }, [vehicles, activeStays, movements, activeStayMap, splitDateAndTime]);

  const resetStayForm = useCallback(() => {
    setStayEditingVehicleId(null);
    setVehicleToAssign('');
    setStayVehicleSearch('');
    setStayDriverName('');
    setStayStartDate(new Date().toISOString().slice(0, 10));
    setStayStartTime(new Date().toTimeString().slice(0, 5));
    setStayEndDate('');
    setStayEndTime('');
    setStayWorkSchedule('06:00 às 14:20 - Turno Manhã');
    setStayIsTemporary(false);
    setStayReason('RECOLHIMENTO');
  }, []);

  const openGarageDetailsModal = useCallback((garage: Garage) => {
    setSelectedGarage(garage);
    resetStayForm();
    setStayFilterMode('all');
    setStaySearchQuery('');
    setVehiclesDialogOpen(true);
  }, [resetStayForm]);

  const handleEditVehicleStayInGarage = (item: ReturnType<typeof getGarageCompleteVehicles>[number]) => {
    setStayEditingVehicleId(item.id);
    setVehicleToAssign(item.id);
    setStayDriverName(item.driverName === 'Não informado' || item.driverName === 'Não atribuído' ? '' : item.driverName);
    setStayStartDate(item.rawStartDate || new Date().toISOString().slice(0, 10));
    setStayStartTime(item.rawStartTime || '06:00');
    setStayEndDate(item.rawEndDate || '');
    setStayEndTime(item.rawEndTime || '');
    setStayWorkSchedule(item.workSchedule || '06:00 às 14:20 - Turno Manhã');
    setStayIsTemporary(Boolean(item.isTemporary));
    setStayReason(item.reason || 'RECOLHIMENTO');
  };

  const handleSaveVehicleStayInGarage = async () => {
    const targetVehicleId = stayEditingVehicleId || vehicleToAssign;
    if (!selectedGarage || !targetVehicleId) {
      toast({ title: 'Atenção', description: 'Selecione um veículo para registrar na garagem', variant: 'destructive' });
      return;
    }
    setStaySaving(true);
    try {
      const entryIso = stayStartDate
        ? `${stayStartDate}T${stayStartTime || '06:00'}:00`
        : undefined;
      const exitIso = stayEndDate
        ? `${stayEndDate}T${stayEndTime || '18:00'}:00`
        : undefined;

      const payload: Partial<GarageCheckInInput> = {
        vehicleId: targetVehicleId,
        garageId: selectedGarage.id,
        driverName: stayDriverName.trim() || undefined,
        entryTime: entryIso,
        exitTime: exitIso,
        workSchedule: stayWorkSchedule.trim() || undefined,
        isTemporary: stayIsTemporary,
        reason: stayReason,
      };

      const updated = stayEditingVehicleId
        ? await garageService.updateVehicleStay(selectedGarage.id, targetVehicleId, payload)
        : await garageService.assignVehicle(selectedGarage.id, targetVehicleId, payload);

      setSelectedGarage(updated);
      resetStayForm();
      toast({
        title: stayEditingVehicleId ? '✅ Permanência Atualizada!' : '✅ Veículo Registrado na Garagem!',
        description: stayEditingVehicleId
          ? 'Dados de entrada, saída, motorista e escala atualizados.'
          : 'Veículo vinculado à garagem com sucesso.',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Falha ao salvar veículo na garagem',
        variant: 'destructive',
      });
    } finally {
      setStaySaving(false);
    }
  };

  // Remanejamento entre garagens
  const openTransferModal = (vehicleId: string) => {
    const v = vehicles.find(item => item.id === vehicleId);
    const stay = activeStayMap.get(vehicleId);
    setTransferVehicleId(vehicleId);
    setTransferToGarageId('');
    setTransferReason('REMANEJAMENTO');
    setTransferDetail('');
    setTransferDriverName(stay?.driverName || v?.assignedDriver || '');
    setTransferWorkSchedule(stay?.workSchedule || '06:00 às 14:20 - Turno Manhã');
    setTransferIsTemporary(false);
    setTransferDialogOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!transferVehicleId || !transferToGarageId) return;
    setTransferSaving(true);
    try {
      const payload: GarageTransferInput = {
        vehicleId: transferVehicleId,
        toGarageId: transferToGarageId,
        reason: transferReason,
        reasonDetail: transferDetail.trim() || undefined,
        driverName: transferDriverName.trim() || undefined,
        workSchedule: transferWorkSchedule.trim() || undefined,
        isTemporary: transferIsTemporary,
      };
      const movement = await garageService.transferVehicle(payload);
      setTransferDialogOpen(false);
      toast({
        title: 'Remanejamento Concluído!',
        description: `${movement.vehiclePlate} transferido para ${movement.toGarageName}`,
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Não foi possível remanejar',
        description: error.response?.data?.message || 'Erro ao remanejar veículo',
        variant: 'destructive',
      });
    } finally {
      setTransferSaving(false);
    }
  };

  // Helper para o veículo selecionado no Terminal
  const currentTerminalVehicle = useMemo(() => {
    if (!terminalVehicleId) return null;
    return vehicles.find(v => v.id === terminalVehicleId) || null;
  }, [terminalVehicleId, vehicles]);

  // Histórico filtrado
  const filteredMovements = useMemo(() => {
    if (historyFilterType === 'all') return movements;
    return movements.filter(m => (m.movementType || '').toUpperCase() === historyFilterType.toUpperCase());
  }, [movements, historyFilterType]);

  return (
    <StandardLayout
      title="Gestão de Garagens & Pátios"
      subtitle="Controle em tempo real de ocupação, manutenções, clientes, tempo de permanência e portaria rápida via QR Code"
    >
      <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-32 sm:pb-8">
        
        {/* ========================================================================= */}
        {/* 1. HEADER OPERACIONAL COM AÇÕES RÁPIDAS MOBILE-FRIENDLY */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-seguranca-graphite border border-gray-700/80 p-4 rounded-xl shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-seguranca-yellow/15 border border-seguranca-yellow/40 flex items-center justify-center text-seguranca-yellow shrink-0">
              <Warehouse size={24} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Pátio & Operação de Garagens
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-gray-400">
                Portaria inteligente para PC, tablet e celular
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setScannerOpen(true)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-seguranca-yellow to-amber-500 text-black font-bold hover:brightness-105 shadow-md flex items-center justify-center gap-2 px-4 h-10"
            >
              <Camera size={18} />
              <span>Ler QR Code</span>
            </Button>

            <Button
              onClick={openCreateGarage}
              variant="outline"
              className="border-gray-600 text-gray-200 hover:text-white hover:bg-gray-800 h-10 text-xs sm:text-sm"
            >
              <Plus size={16} className="mr-1" /> Nova Garagem
            </Button>

            <Button
              onClick={handleRunSeed}
              disabled={seedLoading}
              variant="outline"
              className="border-seguranca-yellow/40 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black h-10 text-xs sm:text-sm font-semibold"
              title="Gerar garagens e veículos operacionais de demonstração"
            >
              {seedLoading ? <Loader2 size={15} className="animate-spin mr-1" /> : <Sparkles size={15} className="mr-1" />}
              <span className="hidden xs:inline">Gerar Seed</span>
              <span className="xs:hidden">Seed</span>
            </Button>

            <Button
              onClick={loadData}
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white h-10 w-10 shrink-0"
              title="Recarregar dados"
            >
              <RefreshCw size={17} className={isLoading ? 'animate-spin text-seguranca-yellow' : ''} />
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. DASHBOARD DE KPIS OPERACIONAIS EM TEMPO REAL */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* KPI 1: Veículos na Garagem */}
          <Card className="bg-seguranca-graphite border-gray-700/80 p-4 shadow-md hover:border-seguranca-yellow/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Veículos no Pátio</span>
              <Bus size={18} className="text-seguranca-yellow" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">
                {vehiclesInGarage.length}
              </span>
              <span className="text-xs text-gray-400">
                / {vehicles.length} total da frota
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">
                {dashboard?.overallOccupancy != null ? `${dashboard.overallOccupancy}% ocupação` : 'Capacidade livre'}
              </span>
            </p>
          </Card>

          {/* KPI 2: Em Manutenção no Pátio */}
          <Card className={`p-4 shadow-md transition-all border ${
            vehiclesInMaintenanceInGarage.length > 0
              ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-500'
              : 'bg-seguranca-graphite border-gray-700/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Em Manutenção</span>
              <Wrench size={18} className={vehiclesInMaintenanceInGarage.length > 0 ? 'text-rose-400 animate-pulse' : 'text-gray-500'} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold ${vehiclesInMaintenanceInGarage.length > 0 ? 'text-rose-400' : 'text-white'}`}>
                {vehiclesInMaintenanceInGarage.length}
              </span>
              <span className="text-xs text-rose-300/80">veículo(s) parados</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Aguardando peças ou liberação técnica
            </p>
          </Card>

          {/* KPI 3: Em Operação / Clientes (Fora da Garagem) */}
          <Card className="bg-seguranca-graphite border-gray-700/80 p-4 shadow-md hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Em Operação / Linha</span>
              <Building2 size={18} className="text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-cyan-300">
                {Math.max(0, vehicles.length - vehiclesInGarage.length)}
              </span>
              <span className="text-xs text-gray-400">rodando em clientes</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 truncate">
              Alocados em contratos e rotas
            </p>
          </Card>

          {/* KPI 4: Situação de Lotação */}
          <Card className={`p-4 shadow-md transition-all border ${
            (dashboard?.fullGarages ?? 0) > 0
              ? 'bg-red-950/20 border-red-500/60'
              : (dashboard?.nearCapacityGarages ?? 0) > 0
              ? 'bg-amber-950/20 border-amber-500/60'
              : 'bg-seguranca-graphite border-gray-700/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Lotação de Garagens</span>
              <AlertTriangle size={18} className={
                (dashboard?.fullGarages ?? 0) > 0 ? 'text-red-400' : (dashboard?.nearCapacityGarages ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              } />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold ${
                (dashboard?.fullGarages ?? 0) > 0 ? 'text-red-400' : (dashboard?.nearCapacityGarages ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {(dashboard?.fullGarages ?? 0) > 0
                  ? `${dashboard?.fullGarages} lotada(s)`
                  : (dashboard?.nearCapacityGarages ?? 0) > 0
                  ? `${dashboard?.nearCapacityGarages} atenção`
                  : 'Normal'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {garages.length} bases monitoradas
            </p>
          </Card>
        </div>

        {/* Alerta de Lotação em destaque */}
        {dashboard && (dashboard.fullGarages > 0 || dashboard.nearCapacityGarages > 0) && (
          <div className="space-y-2">
            {dashboard.garages.filter(g => g.atCapacity).map(g => (
              <div key={`alert-full-${g.id}`} className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/40 rounded-xl p-3 text-xs sm:text-sm text-rose-200 shadow-sm">
                <AlertTriangle size={17} className="text-rose-400 flex-shrink-0" />
                <div>
                  <strong className="font-bold text-rose-300">🚨 Pátio Lotado:</strong> {g.name} atingiu a capacidade máxima ({g.vehicleCount}/{g.capacity} vagas). Exige remanejamento para novas entradas.
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. BARRA DE NAVEGAÇÃO DE ABAS OPERACIONAIS */}
        {/* ========================================================================= */}
        <div className="flex border-b border-gray-700 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'vehicles'
                ? 'border-seguranca-yellow text-seguranca-yellow bg-seguranca-yellow/10 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Bus size={17} />
            <span>Veículos no Pátio</span>
            <Badge className="ml-1 bg-gray-800 text-gray-200 font-mono text-[10px] px-1.5 py-0">
              {vehiclesInGarage.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'terminal'
                ? 'border-seguranca-yellow text-seguranca-yellow bg-seguranca-yellow/10 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone size={17} />
            <span>Terminal Portaria & QR Code</span>
          </button>

          <button
            onClick={() => setActiveTab('garages')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'garages'
                ? 'border-seguranca-yellow text-seguranca-yellow bg-seguranca-yellow/10 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Warehouse size={17} />
            <span>Pátios & Garagens</span>
            <Badge className="ml-1 bg-gray-800 text-gray-200 font-mono text-[10px] px-1.5 py-0">
              {garages.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('operacao')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'operacao'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles size={17} className="text-blue-400" />
            <span>Operação do Dia & Linhas</span>
            <Badge className="ml-1 bg-blue-900/60 text-blue-300 font-mono text-[10px] px-1.5 py-0 border border-blue-500/30">
              Ao Vivo
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'history'
                ? 'border-seguranca-yellow text-seguranca-yellow bg-seguranca-yellow/10 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History size={17} />
            <span>Histórico Entradas & Saídas</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* ABA 1: VEÍCULOS NO PÁTIO (LISTAGEM, CLIENTE, MOTORISTA, PERMANÊNCIA, MANUTENÇÃO) */}
        {/* ========================================================================= */}
        {activeTab === 'vehicles' && (
          <div className="space-y-4">
            {/* Controles de Busca e Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-seguranca-graphite p-3 sm:p-4 rounded-xl border border-gray-700/80">
              {/* Campo de Busca Textual */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  value={searchVehicle}
                  onChange={e => setSearchVehicle(e.target.value)}
                  placeholder="Buscar placa, cliente, motorista..."
                  className="pl-9 bg-seguranca-black border-gray-700 text-white text-xs sm:text-sm"
                />
              </div>

              {/* Filtro por Garagem */}
              <div>
                <Select value={filterGarageId} onValueChange={setFilterGarageId}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs sm:text-sm">
                    <SelectValue placeholder="Todas as Garagens" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="all">Todas as Garagens ({vehiclesInGarage.length})</SelectItem>
                    {garages.map(g => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name} ({g.vehicleCount ?? 0} veículos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Status */}
              <div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs sm:text-sm">
                    <SelectValue placeholder="Status Operacional" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="MAINTENANCE">🔴 Em Manutenção ({vehiclesInMaintenanceInGarage.length})</SelectItem>
                    <SelectItem value="ACTIVE">🟢 Operacionais Ativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ordenação */}
              <div>
                <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs sm:text-sm">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="stay">⏱️ Mais tempo no pátio</SelectItem>
                    <SelectItem value="entry">📅 Entrada mais recente</SelectItem>
                    <SelectItem value="plate">🔤 Placa (A-Z)</SelectItem>
                    <SelectItem value="client">🏢 Cliente / Linha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Listagem de Veículos no Pátio */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-9 h-9 text-seguranca-yellow animate-spin" />
                <p className="text-gray-400 text-sm">Carregando veículos no pátio...</p>
              </div>
            ) : filteredVehiclesInYard.length === 0 ? (
              <div className="text-center py-16 bg-seguranca-graphite rounded-xl border border-gray-800 p-8">
                <Bus className="mx-auto mb-3 text-gray-500" size={42} />
                <p className="text-white font-semibold text-base">Nenhum veículo encontrado no pátio</p>
                <p className="text-gray-400 text-xs mt-1">Verifique os filtros selecionados ou gere dados de demonstração com veículos operacionais e em manutenção.</p>
                <div className="mt-4">
                  <Button
                    onClick={handleRunSeed}
                    disabled={seedLoading}
                    className="bg-seguranca-yellow text-black hover:bg-yellow-500 font-bold text-xs sm:text-sm shadow-md"
                  >
                    {seedLoading ? <Loader2 size={16} className="animate-spin mr-1.5" /> : <Sparkles size={16} className="mr-1.5" />}
                    Popular Pátio com Veículos de Demonstração
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredVehiclesInYard.map(item => {
                  const isMaintenance = (item.status || '').toUpperCase() === 'MAINTENANCE' || (item.status || '').toUpperCase() === 'MANUTENCAO';
                  const stay = item.stayInfo;

                  return (
                    <Card
                      key={item.id}
                      className={`bg-seguranca-graphite border rounded-xl overflow-hidden transition-all shadow-md flex flex-col justify-between ${
                        isMaintenance
                          ? 'border-rose-500/60 hover:border-rose-400 bg-rose-950/10'
                          : 'border-gray-700/80 hover:border-seguranca-yellow/70'
                      }`}
                    >
                      {/* Topo do Card: Placa, Modelo e Status */}
                      <div className="p-4 border-b border-gray-800/80">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            {/* Placa Padrão Mercosul */}
                            <div className="inline-flex items-center border border-blue-600 bg-gray-900 rounded-md overflow-hidden shadow-inner mb-1">
                              <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 tracking-tighter">
                                BR
                              </span>
                              <span className="px-2 py-0.5 font-mono font-extrabold text-sm text-white tracking-widest">
                                {item.plate}
                              </span>
                            </div>

                            <p className="text-white font-semibold text-sm truncate">
                              {[item.brand, item.model].filter(Boolean).join(' ')}
                            </p>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {isMaintenance ? (
                              <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 animate-pulse">
                                <Wrench size={11} /> MANUTENÇÃO
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-600/90 text-white font-medium text-[10px]">
                                OPERACIONAL
                              </Badge>
                            )}

                            <span className="text-[11px] text-gray-400 font-mono">
                              {item.currentMileage != null ? `${item.currentMileage.toLocaleString('pt-BR')} km` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Garagem Atual */}
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-seguranca-yellow font-medium">
                          <Warehouse size={13} className="shrink-0" />
                          <span className="truncate">{item.garageName || 'Garagem Principal'}</span>
                        </div>
                      </div>

                      {/* Informações Operacionais Críticas Solicitadas pelo Usuário */}
                      <div className="p-4 space-y-2.5 text-xs flex-1">
                        {/* Cliente Alocado */}
                        <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800 flex items-start gap-2">
                          <Building2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block">Cliente / Linha Alocado</span>
                            <span className="text-gray-100 font-medium truncate block">{item.client}</span>
                          </div>
                        </div>

                        {/* Motorista */}
                        <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800 flex items-center gap-2">
                          <User size={15} className="text-purple-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block">Motorista (Entrada na Garagem)</span>
                            <span className="text-gray-100 font-medium truncate block">{item.driver}</span>
                          </div>
                          {item.stay?.isTemporary && (
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] shrink-0">
                              TEMPORÁRIO
                            </Badge>
                          )}
                        </div>

                        {/* Data/Hora de Entrada, Saída e Escala */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block flex items-center gap-1">
                              <Calendar size={11} /> Data / Hora Início
                            </span>
                            <span className="text-gray-200 font-medium mt-0.5 block truncate text-[11px]">
                              {stay.entryFormatted}
                            </span>
                          </div>

                          <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block flex items-center gap-1">
                              <Clock size={11} /> Saída / Permanência
                            </span>
                            <span className={`font-bold mt-0.5 block truncate text-xs ${
                              stay.severity === 'alert' ? 'text-rose-400' : stay.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {item.stay?.exitTime
                                ? new Date(item.stay.exitTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : stay.stayFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Escala e Motivo da Parada */}
                        <div className="text-[11px] text-gray-300 space-y-1 pt-1 border-t border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Escala:</span>
                            <span className="font-semibold text-seguranca-yellow truncate max-w-[180px]">
                              {item.stay?.workSchedule || '06:00 às 14:20 - Turno Manhã'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Motivo da parada:</span>
                            <span className="font-semibold text-gray-200">{stay.reasonLabel}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações Rápidas Mobile-Friendly */}
                      <div className="p-3 bg-seguranca-black/40 border-t border-gray-800 grid grid-cols-3 gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => openTerminalForVehicle(item, 'check-out')}
                          className="bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-[11px] font-semibold h-8"
                          title="Registrar Saída do Pátio"
                        >
                          <LogOut size={13} className="mr-1" /> Saída
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTransferModal(item.id)}
                          className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-[11px] h-8"
                          title="Remanejar para outra garagem"
                        >
                          <ArrowLeftRight size={13} className="mr-1" /> Mudar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setQrModalVehicleId(item.id)}
                          className="border-gray-700 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black text-[11px] h-8"
                          title="Visualizar ou imprimir QR Code"
                        >
                          <QrCode size={13} className="mr-1" /> QR
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 2: TERMINAL PORTARIA & QR CODE (PC, TABLET, CELULAR) */}
        {/* ========================================================================= */}
        {activeTab === 'terminal' && (
          <div className="max-w-3xl mx-auto space-y-5">
            <Card className="bg-seguranca-graphite border-gray-700 p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-seguranca-yellow/20 flex items-center justify-center text-seguranca-yellow">
                    <Smartphone size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Terminal Portaria & Pátio</h3>
                    <p className="text-xs text-gray-400">Entradas e saídas ultrarrápidas via câmera ou placa</p>
                  </div>
                </div>

                <Button
                  onClick={() => setScannerOpen(true)}
                  className="bg-seguranca-yellow text-black font-bold hover:bg-yellow-500 text-xs sm:text-sm flex items-center gap-1.5 shadow"
                >
                  <Camera size={16} /> Ler QR Code
                </Button>
              </div>

              {/* Seletor Rápido de Veículo */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-300 font-semibold mb-1.5 block">
                    Selecione ou Busque o Veículo pela Placa / Modelo:
                  </label>
                  <Select
                    value={terminalVehicleId}
                    onValueChange={(val) => {
                      const v = vehicles.find(item => item.id === val);
                      if (v) {
                        openTerminalForVehicle(v, v.garageId ? 'check-out' : 'check-in');
                      }
                    }}
                  >
                    <SelectTrigger className="bg-seguranca-black border-gray-700 text-white h-11 text-sm">
                      <SelectValue placeholder="Selecione um veículo da frota..." />
                    </SelectTrigger>
                    <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-72">
                      {vehicles.map(v => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} — {v.brand || ''} {v.model} {v.garageId ? `(Na garagem: ${v.garageName})` : '(Fora do pátio)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Painel do Veículo Selecionado */}
                {currentTerminalVehicle ? (
                  <div className="bg-seguranca-black/70 rounded-xl p-4 border border-gray-700/80 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="inline-flex items-center border border-blue-500 bg-black rounded px-2 py-0.5 font-mono font-extrabold text-sm text-white">
                          {currentTerminalVehicle.plate}
                        </div>
                        <span className="font-semibold text-white text-sm">
                          {currentTerminalVehicle.brand} {currentTerminalVehicle.model}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentTerminalVehicle.garageId ? (
                          <Badge className="bg-emerald-600/90 text-white text-xs">
                            No Pátio: {currentTerminalVehicle.garageName}
                          </Badge>
                        ) : (
                          <Badge className="bg-cyan-600/90 text-white text-xs">
                            Fora da Garagem (Operação)
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQrModalVehicleId(currentTerminalVehicle.id)}
                          className="text-seguranca-yellow hover:text-white text-xs h-7 px-2"
                        >
                          <QrCode size={14} className="mr-1" /> Crachá
                        </Button>
                      </div>
                    </div>

                    {/* Alternador de Ação (Entrada ou Saída) */}
                    <div className="grid grid-cols-2 gap-2 bg-gray-900 p-1 rounded-lg border border-gray-800">
                      <button
                        type="button"
                        onClick={() => {
                          setTerminalAction('check-in');
                          setTerminalReason('RECOLHIMENTO');
                        }}
                        className={`py-2 rounded-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          terminalAction === 'check-in'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LogIn size={16} /> REGISTRAR ENTRADA
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTerminalAction('check-out');
                          setTerminalReason('OPERACAO');
                        }}
                        className={`py-2 rounded-md font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                          terminalAction === 'check-out'
                            ? 'bg-amber-600 text-white shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LogOut size={16} /> REGISTRAR SAÍDA
                      </button>
                    </div>

                    {/* Formulário Dinâmico */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {terminalAction === 'check-in' && (
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block font-semibold">Garagem de Destino *</label>
                          <Select value={terminalGarageId} onValueChange={setTerminalGarageId}>
                            <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm">
                              <SelectValue placeholder="Selecione a garagem" />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                              {garages.map(g => (
                                <SelectItem key={g.id} value={g.id} disabled={g.atCapacity}>
                                  {g.name} {g.capacity ? `(${g.vehicleCount ?? 0}/${g.capacity} vagas)` : ''}
                                  {g.atCapacity ? ' 🚨 LOTADA' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">
                          Motorista Condutor / CNH
                        </label>
                        <DriverCombobox
                          value={terminalDriver}
                          onChange={(name, emp) => {
                            setTerminalDriver(name);
                            setTerminalSelectedEmployee(emp || null);
                          }}
                          employees={employees}
                          placeholder="Buscar motorista por nome ou CNH..."
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Cliente / Contrato Alocado</label>
                        <Input
                          value={terminalClient}
                          onChange={e => setTerminalClient(e.target.value)}
                          placeholder="Ex.: Petrobras, Vale, Reserva..."
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Odômetro Atual (KM)</label>
                        <Input
                          type="number"
                          value={terminalKm ?? ''}
                          onChange={e => setTerminalKm(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="KM no painel..."
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block font-semibold">Data Início (Entrada)</label>
                          <Input
                            type="date"
                            value={terminalStartDate}
                            onChange={e => setTerminalStartDate(e.target.value)}
                            className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block font-semibold">Hora Início (Entrada)</label>
                          <Input
                            type="time"
                            value={terminalStartTime}
                            onChange={e => setTerminalStartTime(e.target.value)}
                            className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block font-semibold">Data da Saída</label>
                          <Input
                            type="date"
                            value={terminalEndDate}
                            onChange={e => setTerminalEndDate(e.target.value)}
                            className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block font-semibold">Hora da Saída</label>
                          <Input
                            type="time"
                            value={terminalEndTime}
                            onChange={e => setTerminalEndTime(e.target.value)}
                            className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Escala</label>
                        <Input
                          value={terminalWorkSchedule}
                          onChange={e => setTerminalWorkSchedule(e.target.value)}
                          placeholder="Ex.: 06:00 às 14:20 - Turno Manhã"
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Tipo de Permanência</label>
                        <Select
                          value={terminalIsTemporary ? 'TEMPORARY' : 'REGULAR'}
                          onValueChange={val => setTerminalIsTemporary(val === 'TEMPORARY')}
                        >
                          <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                            <SelectItem value="REGULAR">Alocado na Garagem (Base Fixa)</SelectItem>
                            <SelectItem value="TEMPORARY">Temporário / Passagem na Garagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Motivo</label>
                        <Select value={terminalReason} onValueChange={setTerminalReason}>
                          <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                            {Object.entries(MOVEMENT_REASON_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-400 mb-1 block font-semibold">Observações / Detalhes (Opcional)</label>
                        <Textarea
                          value={terminalDetail}
                          onChange={e => setTerminalDetail(e.target.value)}
                          placeholder="Observações da portaria, avarias aparentes ou orientações..."
                          rows={2}
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="pt-2">
                      {terminalAction === 'check-in' ? (
                        <Button
                          onClick={handleConfirmCheckIn}
                          disabled={terminalSubmitting || !terminalGarageId}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                        >
                          {terminalSubmitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
                          Confirmar Entrada no Pátio
                        </Button>
                      ) : (
                        <Button
                          onClick={handleConfirmCheckOut}
                          disabled={terminalSubmitting}
                          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-12 text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg"
                        >
                          {terminalSubmitting ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                          Confirmar Saída do Pátio
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center bg-black/20">
                    <QrCode size={40} className="mx-auto text-seguranca-yellow mb-2 opacity-80" />
                    <p className="text-sm font-semibold text-gray-200">Nenhum veículo selecionado</p>
                    <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                      Use a câmera do seu celular/tablet para ler o QR Code no para-brisa ou selecione o veículo na lista acima.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 3: PÁTIOS & GARAGENS (CAPACIDADES, RESPONSÁVEL, CONTATO, VEÍCULOS) */}
        {/* ========================================================================= */}
        {activeTab === 'garages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {garages.map(garage => {
              const allGarageVehicles = getGarageCompleteVehicles(garage);
              const activeCount = allGarageVehicles.filter(v => v.activeStay).length;
              const totalCount = Math.max(garage.vehicleCount || 0, activeCount);
              const occ = garage.capacity && garage.capacity > 0
                ? Math.min(100, Math.round((totalCount / garage.capacity) * 100))
                : null;

              return (
                <Card key={garage.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div
                        onClick={() => openGarageDetailsModal(garage)}
                        className="flex items-center gap-3 min-w-0 cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-seguranca-yellow/10 border border-seguranca-yellow/30 flex items-center justify-center flex-shrink-0 text-seguranca-yellow group-hover:bg-seguranca-yellow group-hover:text-black transition-colors">
                          <Warehouse size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate text-base group-hover:text-seguranca-yellow transition-colors">{garage.name}</p>
                          {garage.address && (
                            <p className="text-gray-400 text-xs truncate flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="shrink-0" /> {garage.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openGarageDetailsModal(garage)}
                          className="text-gray-300 hover:text-cyan-400 transition-colors p-1.5 rounded-md hover:bg-gray-800"
                          title="Visualizar informações e veículos da garagem"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditGarage(garage)}
                          className="text-gray-300 hover:text-seguranca-yellow transition-colors p-1.5 rounded-md hover:bg-gray-800"
                          title="Editar garagem"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(garage.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-gray-800"
                          title="Excluir garagem"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Informações da Garagem */}
                    <div className="space-y-2 text-xs text-gray-300 my-3 bg-seguranca-black/50 p-3 rounded-lg border border-gray-800">
                      {garage.responsibleName && (
                        <p className="flex items-center gap-2">
                          <User size={13} className="text-seguranca-yellow shrink-0" />
                          <span className="text-gray-400">Responsável:</span>
                          <span className="font-semibold text-white truncate">{garage.responsibleName}</span>
                        </p>
                      )}

                      {garage.responsiblePhone && (
                        <p className="flex items-center gap-2">
                          <Phone size={13} className="text-emerald-400 shrink-0" />
                          <span className="text-gray-400">Contato:</span>
                          <a
                            href={`https://wa.me/55${garage.responsiblePhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline font-mono"
                          >
                            {garage.responsiblePhone}
                          </a>
                        </p>
                      )}

                      {garage.notes && (
                        <p className="text-[11px] text-gray-400 italic line-clamp-2 border-t border-gray-800/80 pt-1.5">
                          {garage.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                        <span className="text-gray-400">Veículos na Garagem:</span>
                        <span className="font-bold text-white">
                          {totalCount} {garage.capacity ? `de ${garage.capacity} vagas` : ''}
                        </span>
                      </div>

                      {occ != null && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-gray-400">Taxa de Ocupação:</span>
                            <span className={occ >= 100 ? 'text-red-400 font-bold' : occ >= 90 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {occ}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${occ >= 100 ? 'bg-red-500' : occ >= 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${occ}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prévia rápida dos veículos na garagem (incluindo temporários) */}
                    {allGarageVehicles.length > 0 && (
                      <div className="mb-3 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-400 px-0.5">
                          <span>Veículos nesta Garagem ({allGarageVehicles.length})</span>
                          <span className="text-seguranca-yellow">Motorista • Entrada • Escala</span>
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
                          {allGarageVehicles.slice(0, 4).map(v => (
                            <div
                              key={`${garage.id}-${v.id}`}
                              onClick={() => openGarageDetailsModal(garage)}
                              className="bg-seguranca-black/70 border border-gray-800 hover:border-gray-700 rounded-lg px-2.5 py-1.5 text-[11px] cursor-pointer transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="font-mono font-bold text-seguranca-yellow">{v.plate}</span>
                                  {v.isTemporary && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                                      Temp.
                                    </span>
                                  )}
                                  <span className="text-gray-300 truncate">{v.driverName}</span>
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                  {v.startDateBr} {v.startTimeBr !== '—' ? v.startTimeBr : ''}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                                <span className="truncate">Escala: <strong className="text-gray-300">{v.workSchedule}</strong></span>
                                <span className="shrink-0">
                                  Saída: {v.endDateBr !== '—' ? `${v.endDateBr} ${v.endTimeBr !== '—' ? v.endTimeBr : ''}` : 'No pátio'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <Button
                      onClick={() => openGarageDetailsModal(garage)}
                      variant="outline"
                      className="col-span-2 border-seguranca-yellow/50 text-seguranca-yellow hover:bg-seguranca-yellow hover:text-black text-xs font-semibold h-9"
                    >
                      <Eye size={14} className="mr-1.5" /> Visualizar & Veículos ({allGarageVehicles.length})
                    </Button>
                    <div className="grid grid-cols-2 gap-1">
                      <Button
                        type="button"
                        onClick={() => openEditGarage(garage)}
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 h-9 px-0"
                        title="Editar Garagem"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setDeleteId(garage.id)}
                        variant="outline"
                        className="border-rose-900/60 text-rose-400 hover:bg-rose-600 hover:text-white h-9 px-0"
                        title="Excluir Garagem"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ABA 4: HISTÓRICO COMPLETO DE ENTRADAS, SAÍDAS & PERMANÊNCIAS */}
        {/* ========================================================================= */}
        {activeTab === 'history' && (
          <Card className="bg-seguranca-graphite border-gray-700 p-4 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <History size={18} className="text-seguranca-yellow" />
                <h3 className="font-bold text-white text-sm sm:text-base">Histórico de Movimentações do Pátio</h3>
              </div>

              <div className="flex items-center gap-2">
                <Select value={historyFilterType} onValueChange={setHistoryFilterType}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white text-xs h-9 w-44">
                    <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="CHECK_IN">Entradas (Check-in)</SelectItem>
                    <SelectItem value="CHECK_OUT">Saídas (Check-out)</SelectItem>
                    <SelectItem value="TRANSFER">Remanejamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {movements.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-sm">
                Nenhuma movimentação registrada no histórico.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMovements.map(m => {
                  const isCheckIn = (m.movementType || '').toUpperCase() === 'CHECK_IN';
                  const isCheckOut = (m.movementType || '').toUpperCase() === 'CHECK_OUT';
                  const dateFormatted = m.createdAt ? new Date(m.createdAt).toLocaleString('pt-BR') : '—';
                  const entryDateFormatted = m.entryTime ? new Date(m.entryTime).toLocaleString('pt-BR') : null;
                  const exitDateFormatted = m.exitTime ? new Date(m.exitTime).toLocaleString('pt-BR') : null;

                  return (
                    <div
                      key={m.id}
                      className="bg-seguranca-black/60 rounded-xl p-3 sm:p-4 border border-gray-800 hover:border-gray-700 transition-all text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-seguranca-yellow text-sm bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                            {m.vehiclePlate || '—'}
                          </span>

                          {isCheckIn ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] flex items-center gap-1">
                              <LogIn size={11} /> ENTRADA NO PÁTIO
                            </Badge>
                          ) : isCheckOut ? (
                            <Badge className="bg-amber-600 text-white text-[10px] flex items-center gap-1">
                              <LogOut size={11} /> SAÍDA DO PÁTIO
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-600 text-white text-[10px] flex items-center gap-1">
                              <ArrowLeftRight size={11} /> REMANEJAMENTO
                            </Badge>
                          )}
                        </div>

                        <span className="text-gray-400 font-mono text-[11px]">{dateFormatted}</span>
                      </div>

                      {/* Trajeto e Pátio */}
                      <div className="mt-2 text-gray-300 font-medium flex items-center gap-2 flex-wrap">
                        {m.fromGarageName && (
                          <span className="flex items-center gap-1">
                            <Warehouse size={12} className="text-gray-400" /> {m.fromGarageName}
                          </span>
                        )}
                        {m.fromGarageName && m.toGarageName && <ArrowRight size={12} className="text-gray-500" />}
                        {m.toGarageName && (
                          <span className="text-seguranca-yellow font-semibold flex items-center gap-1">
                            <Warehouse size={12} /> {m.toGarageName}
                          </span>
                        )}
                      </div>

                      {/* Motorista, Cliente e Tempo de Permanência */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-800/80 text-[11px] text-gray-400">
                        <div>
                          <span className="text-gray-500">Motorista: </span>
                          <span className="text-gray-200 font-medium">{m.driverName || '—'}</span>
                        </div>

                        <div>
                          <span className="text-gray-500">Cliente/Linha: </span>
                          <span className="text-gray-200 font-medium">{m.clientName || '—'}</span>
                        </div>

                        <div>
                          <span className="text-gray-500">Permanência: </span>
                          <span className="text-seguranca-yellow font-bold">{m.stayDurationFormatted || '—'}</span>
                        </div>
                      </div>

                      {/* Horários e Motivo */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-gray-500">
                        <div className="flex items-center gap-3">
                          {entryDateFormatted && <span>Entrada: {entryDateFormatted}</span>}
                          {exitDateFormatted && <span>Saída: {exitDateFormatted}</span>}
                          {m.kmReading != null && <span>KM: {m.kmReading.toLocaleString('pt-BR')} km</span>}
                        </div>

                        <div>
                          <span>Motivo: <strong className="text-gray-300">{MOVEMENT_REASON_LABELS[m.reason || ''] || m.reason || '—'}</strong></span>
                          {m.performedByName && <span> • por {m.performedByName}</span>}
                        </div>
                      </div>

                      {m.reasonDetail && (
                        <p className="mt-1.5 text-[11px] text-gray-400 italic bg-black/40 p-1.5 rounded border border-gray-800/60">
                          "{m.reasonDetail}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* ========================================================================= */}
        {/* ABA 5: OPERAÇÃO DO DIA & LINHAS */}
        {/* ========================================================================= */}
        {activeTab === 'operacao' && (
          <div className="pt-2">
            <OperacaoDoDiaDashboard />
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CADASTRO / EDIÇÃO DE GARAGEM */}
        {/* ========================================================================= */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse size={18} className="text-seguranca-yellow" />
                {editingId ? 'Editar Garagem / Pátio' : 'Nova Garagem / Pátio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Nome da Garagem / Base *</label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white"
                  placeholder="Ex.: Pátio Central - Paulínia"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <label className="text-xs text-gray-400 font-semibold">Endereço Completo</label>
                  <span className="text-[10px] text-gray-500">Digite o CEP para preencher automático</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Input
                      value={addr.cep}
                      onChange={e => handleCepChange(e.target.value)}
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="CEP (00000-000)"
                      className="bg-seguranca-black border-gray-700 text-white font-mono pr-8"
                    />
                    {cepLoading && (
                      <Loader2 size={14} className="absolute right-2.5 top-3 animate-spin text-seguranca-yellow" />
                    )}
                  </div>
                  <Input
                    value={addr.numero}
                    onChange={e => updateAddress({ numero: e.target.value }, true)}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Número"
                  />
                  <Input
                    ref={logradouroInputRef}
                    value={addr.logradouro}
                    onChange={e => updateAddress({ logradouro: e.target.value }, true)}
                    className="col-span-2 bg-seguranca-black border-gray-700 text-white"
                    placeholder="Rua / Avenida"
                  />
                  <Input
                    value={addr.complemento}
                    onChange={e => updateAddress({ complemento: e.target.value })}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Complemento"
                  />
                  <Input
                    value={addr.bairro}
                    onChange={e => updateAddress({ bairro: e.target.value }, true)}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Bairro"
                  />
                  <Input
                    value={addr.cidade}
                    onChange={e => updateAddress({ cidade: e.target.value }, true)}
                    className="bg-seguranca-black border-gray-700 text-white"
                    placeholder="Cidade"
                  />
                  <Input
                    value={addr.uf}
                    onChange={e => updateAddress({ uf: e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) }, true)}
                    className="bg-seguranca-black border-gray-700 text-white uppercase"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>

                {isUniqueCityCep && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    <Info size={15} className="shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-200">
                        CEP Geral do Município ({addr.cidade}/{addr.uf})
                      </p>
                      <p className="text-[11px] text-amber-300/90 mt-0.5">
                        Definimos o bairro automaticamente como <strong>Centro</strong>. Complete o nome da Rua / Avenida e o Número para posicionar o pino com precisão.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {geoLoading && (
                <div className="flex items-center gap-2 text-[11px] text-gray-400 bg-seguranca-black border border-gray-700 rounded-md px-3 py-2">
                  <Loader2 size={13} className="animate-spin text-seguranca-yellow shrink-0" />
                  Localizando o CEP no mapa...
                </div>
              )}

              {garageGeo && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block font-semibold flex items-center gap-1.5">
                    <MapPin size={13} className="text-seguranca-yellow" /> Localização da Garagem
                  </label>
                  <MapWithPin
                    latitude={garageGeo.lat}
                    longitude={garageGeo.lng}
                    height="240px"
                    showControls={false}
                    className="rounded-lg overflow-hidden border border-gray-700"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    O pino identifica a localização aproximada da garagem a partir do CEP informado.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Responsável Operacional</label>
                <ResponsavelCombobox
                  employees={employees}
                  value={form.responsibleEmployeeId}
                  name={form.responsibleName}
                  placeholder="Digite 3 letras do nome do responsável..."
                  onSelect={emp =>
                    setForm(prev => ({
                      ...prev,
                      responsibleEmployeeId: emp?.id || '',
                      responsibleName: emp?.name || '',
                      responsiblePhone: emp ? (emp.phone || prev.responsiblePhone || '') : prev.responsiblePhone || '',
                    }))
                  }
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Busca na base de funcionários ao digitar os 3 primeiros caracteres.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Telefone / WhatsApp do Responsável</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    value={form.responsiblePhone || ''}
                    onChange={e => setForm({ ...form, responsiblePhone: e.target.value })}
                    className="pl-9 bg-seguranca-black border-gray-700 text-white"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Capacidade Total de Veículos (Vagas)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.capacity ?? ''}
                  onChange={e => setForm({ ...form, capacity: e.target.value ? Number(e.target.value) : undefined })}
                  className="bg-seguranca-black border-gray-700 text-white font-mono"
                  placeholder="Ex.: 45"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Observações e Instruções da Portaria</label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white"
                  rows={2}
                  placeholder="Horários de portaria, regras de acesso, lavador, etc..."
                />
              </div>

              <Button
                onClick={handleSaveGarage}
                disabled={saving}
                className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500 font-bold h-11"
              >
                {saving ? <Loader2 size={17} className="animate-spin mr-1.5" /> : <Plus size={17} className="mr-1.5" />}
                {editingId ? 'Salvar Alterações' : 'Cadastrar Garagem'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* MODAL: VISUALIZAR INFORMAÇÕES DA GARAGEM & LISTA COMPLETA DE VEÍCULOS */}
        {/* ========================================================================= */}
        <Dialog open={vehiclesDialogOpen} onOpenChange={setVehiclesDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[92vh] overflow-y-auto max-w-5xl">
            <DialogHeader>
              <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Warehouse size={20} className="text-seguranca-yellow" />
                  <span>Garagem: {selectedGarage?.name}</span>
                </DialogTitle>
                {selectedGarage && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setVehiclesDialogOpen(false);
                        openEditGarage(selectedGarage);
                      }}
                      className="border-gray-600 text-gray-200 hover:text-seguranca-yellow hover:border-seguranca-yellow h-8 text-xs"
                    >
                      <Pencil size={13} className="mr-1" /> Editar Garagem
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(selectedGarage.id)}
                      className="border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white h-8 text-xs"
                    >
                      <Trash2 size={13} className="mr-1" /> Excluir Garagem
                    </Button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {selectedGarage && (() => {
              const allGarageVehicles = getGarageCompleteVehicles(selectedGarage);
              const filteredGarageVehicles = allGarageVehicles.filter(v => {
                if (stayFilterMode === 'active' && !v.activeStay) return false;
                if (stayFilterMode === 'temporary' && !v.isTemporary) return false;
                const q = staySearchQuery.trim().toLowerCase();
                if (!q) return true;
                return (
                  v.plate.toLowerCase().includes(q) ||
                  (v.model || '').toLowerCase().includes(q) ||
                  (v.brand || '').toLowerCase().includes(q) ||
                  v.driverName.toLowerCase().includes(q) ||
                  v.workSchedule.toLowerCase().includes(q) ||
                  v.clientName.toLowerCase().includes(q)
                );
              });

              const assignableVehicles = vehicles.filter(v => {
                if (!stayVehicleSearch || stayVehicleSearch.trim().length < 1) return true;
                const q = stayVehicleSearch.trim().toLowerCase();
                return (
                  (v.plate || '').toLowerCase().includes(q) ||
                  (v.model || '').toLowerCase().includes(q) ||
                  (v.brand || '').toLowerCase().includes(q) ||
                  (v.assignedDriver || '').toLowerCase().includes(q)
                );
              });

              return (
                <div className="space-y-5 py-2 text-xs sm:text-sm">
                  {/* 1. Resumo das Informações da Garagem */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-seguranca-black/60 p-3.5 rounded-xl border border-gray-800">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Endereço da Garagem</span>
                      <span className="text-gray-200 font-medium text-xs mt-0.5 block">
                        {selectedGarage.address || 'Não informado'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Responsável Operacional</span>
                      <span className="text-white font-semibold text-xs mt-0.5 block">
                        {selectedGarage.responsibleName || 'Não atribuído'}
                      </span>
                      {selectedGarage.responsiblePhone && (
                        <span className="text-emerald-400 font-mono text-[11px] block">
                          {selectedGarage.responsiblePhone}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Capacidade & Lotação</span>
                      <span className="text-seguranca-yellow font-bold text-xs mt-0.5 block">
                        {allGarageVehicles.filter(v => v.activeStay).length} no pátio
                        {selectedGarage.capacity ? ` / ${selectedGarage.capacity} vagas` : ''}
                      </span>
                      <span className="text-gray-400 text-[11px] block">
                        Total registrados (c/ temporários): {allGarageVehicles.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Instruções / Observações</span>
                      <span className="text-gray-300 text-xs mt-0.5 block line-clamp-2">
                        {selectedGarage.notes || 'Portaria operacional padrão.'}
                      </span>
                    </div>
                  </div>

                  {/* 2. Formulário de Entrada / Edição de Veículo na Garagem */}
                  <div className="bg-seguranca-black/80 border border-gray-700/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                        <Bus size={16} className="text-seguranca-yellow" />
                        {stayEditingVehicleId
                          ? 'Editar Veículo na Garagem (Motorista, Entrada, Saída e Escala)'
                          : 'Registrar / Alocar Veículo na Garagem (Fixo ou Temporário)'}
                      </h4>
                      {stayEditingVehicleId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={resetStayForm}
                          className="h-7 text-xs text-gray-400 hover:text-white"
                        >
                          Cancelar Edição
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Veículo */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">
                          Veículo (Digite 3 caracteres da placa/modelo ou selecione) *
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={stayVehicleSearch}
                            onChange={e => {
                              const val = e.target.value;
                              setStayVehicleSearch(val);
                              if (val.trim().length >= 3) {
                                const q = val.trim().toLowerCase();
                                const firstMatch = vehicles.find(v =>
                                  (v.plate || '').toLowerCase().includes(q) ||
                                  (v.model || '').toLowerCase().includes(q)
                                );
                                if (firstMatch && !stayEditingVehicleId) {
                                  setVehicleToAssign(firstMatch.id);
                                  if (!stayDriverName && firstMatch.assignedDriver) {
                                    setStayDriverName(firstMatch.assignedDriver);
                                  }
                                }
                              }
                            }}
                            disabled={Boolean(stayEditingVehicleId)}
                            placeholder="Filtrar placa (ex: BRA)..."
                            className="w-36 bg-seguranca-graphite border-gray-700 text-white text-xs font-mono"
                          />
                          <Select
                            value={stayEditingVehicleId || vehicleToAssign}
                            onValueChange={val => {
                              setVehicleToAssign(val);
                              const found = vehicles.find(v => v.id === val);
                              if (found?.assignedDriver && !stayDriverName) {
                                setStayDriverName(found.assignedDriver);
                              }
                            }}
                            disabled={Boolean(stayEditingVehicleId)}
                          >
                            <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white flex-1 text-xs">
                              <SelectValue placeholder="Selecione o veículo..." />
                            </SelectTrigger>
                            <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-60">
                              {assignableVehicles.slice(0, 120).map(v => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.plate} — {v.brand || ''} {v.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Motorista que deu entrada */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">
                          Motorista que deu entrada na garagem
                        </label>
                        <DriverCombobox
                          value={stayDriverName}
                          onChange={(name) => setStayDriverName(name)}
                          employees={employees}
                          placeholder="Digite ou selecione o motorista..."
                        />
                      </div>

                      {/* Data Início */}
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Data Início (Entrada)</label>
                        <Input
                          type="date"
                          value={stayStartDate}
                          onChange={e => setStayStartDate(e.target.value)}
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs font-mono"
                        />
                      </div>

                      {/* Hora Início */}
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Hora Início (Entrada)</label>
                        <Input
                          type="time"
                          value={stayStartTime}
                          onChange={e => setStayStartTime(e.target.value)}
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs font-mono"
                        />
                      </div>

                      {/* Data da Saída */}
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Data da Saída</label>
                        <Input
                          type="date"
                          value={stayEndDate}
                          onChange={e => setStayEndDate(e.target.value)}
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs font-mono"
                        />
                      </div>

                      {/* Hora da Saída */}
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Hora da Saída</label>
                        <Input
                          type="time"
                          value={stayEndTime}
                          onChange={e => setStayEndTime(e.target.value)}
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs font-mono"
                        />
                      </div>

                      {/* Escala */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Escala</label>
                        <Input
                          value={stayWorkSchedule}
                          onChange={e => setStayWorkSchedule(e.target.value)}
                          placeholder="Ex.: 06:00 às 14:20 - Turno Manhã / Escala 12x36"
                          className="bg-seguranca-graphite border-gray-700 text-white text-xs"
                        />
                      </div>

                      {/* Tipo de Permanência (Fixo ou Temporário) */}
                      <div>
                        <label className="text-[11px] text-gray-400 mb-1 block font-semibold">Permanência na Garagem</label>
                        <Select
                          value={stayIsTemporary ? 'TEMPORARY' : 'REGULAR'}
                          onValueChange={val => setStayIsTemporary(val === 'TEMPORARY')}
                        >
                          <SelectTrigger className="bg-seguranca-graphite border-gray-700 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                            <SelectItem value="REGULAR">Alocado na Garagem</SelectItem>
                            <SelectItem value="TEMPORARY">Temporário / Passagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Botão Salvar */}
                      <div className="flex items-end">
                        <Button
                          onClick={handleSaveVehicleStayInGarage}
                          disabled={staySaving || !(stayEditingVehicleId || vehicleToAssign)}
                          className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500 font-bold h-10 text-xs"
                        >
                          {staySaving ? (
                            <Loader2 size={15} className="animate-spin mr-1.5" />
                          ) : (
                            <Plus size={15} className="mr-1.5" />
                          )}
                          {stayEditingVehicleId ? 'Salvar Alterações' : 'Confirmar na Garagem'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Barra de Filtros da Lista de Veículos da Garagem */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStayFilterMode('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          stayFilterMode === 'all'
                            ? 'bg-seguranca-yellow text-black border-seguranca-yellow'
                            : 'bg-seguranca-black text-gray-300 border-gray-700 hover:text-white'
                        }`}
                      >
                        Todos ({allGarageVehicles.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStayFilterMode('active')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          stayFilterMode === 'active'
                            ? 'bg-emerald-500 text-black border-emerald-400'
                            : 'bg-seguranca-black text-gray-300 border-gray-700 hover:text-white'
                        }`}
                      >
                        No Pátio ({allGarageVehicles.filter(v => v.activeStay).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStayFilterMode('temporary')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          stayFilterMode === 'temporary'
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-seguranca-black text-gray-300 border-gray-700 hover:text-white'
                        }`}
                      >
                        Temporários ({allGarageVehicles.filter(v => v.isTemporary).length})
                      </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={staySearchQuery}
                        onChange={e => setStaySearchQuery(e.target.value)}
                        placeholder="Buscar placa, motorista, escala..."
                        className="pl-8 h-8 bg-seguranca-black border-gray-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  {/* 4. Tabela Completa de Veículos da Garagem */}
                  {filteredGarageVehicles.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 bg-seguranca-black/40 rounded-xl border border-gray-800 text-xs">
                      Nenhum veículo encontrado nesta garagem para o filtro selecionado.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-gray-800 bg-seguranca-black/50">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-800 bg-seguranca-black text-[10px] uppercase text-gray-400 font-bold">
                            <th className="py-2.5 px-3">Veículo / Placa</th>
                            <th className="py-2.5 px-3">Motorista (Entrada)</th>
                            <th className="py-2.5 px-3">Data Início</th>
                            <th className="py-2.5 px-3">Hora Início</th>
                            <th className="py-2.5 px-3">Data da Saída</th>
                            <th className="py-2.5 px-3">Hora da Saída</th>
                            <th className="py-2.5 px-3">Escala</th>
                            <th className="py-2.5 px-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/80">
                          {filteredGarageVehicles.map(v => (
                            <tr key={v.id} className="hover:bg-gray-800/40 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-seguranca-yellow">{v.plate}</span>
                                  {v.isTemporary ? (
                                    <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] px-1.5 py-0">
                                      Temporário
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] px-1.5 py-0">
                                      Fixo
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-[11px] text-gray-400 truncate max-w-[180px]">
                                  {[v.brand, v.model].filter(Boolean).join(' ')}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-white">
                                {v.driverName}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-200">
                                {v.startDateBr}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-200">
                                {v.startTimeBr}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-200">
                                {v.endDateBr !== '—' ? (
                                  v.endDateBr
                                ) : (
                                  <span className="text-emerald-400 font-sans font-semibold text-[11px]">No pátio</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-gray-200">
                                {v.endTimeBr}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-amber-300 font-medium">{v.workSchedule}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditVehicleStayInGarage(v)}
                                    className="h-7 px-2 text-gray-300 hover:text-seguranca-yellow"
                                    title="Editar motorista, entrada, saída e escala"
                                  >
                                    <Pencil size={13} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openTransferModal(v.id)}
                                    className="h-7 px-2 text-gray-300 hover:text-cyan-400"
                                    title="Remanejar para outra garagem"
                                  >
                                    <ArrowLeftRight size={13} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={async () => {
                                      if (!selectedGarage) return;
                                      try {
                                        const updated = await garageService.unassignVehicle(selectedGarage.id, v.id);
                                        setSelectedGarage(updated);
                                        toast({ title: 'Saída Registrada', description: `Saída de ${v.plate} registrada com sucesso.` });
                                        loadData();
                                      } catch {
                                        toast({ title: 'Erro', description: 'Erro ao registrar saída do veículo', variant: 'destructive' });
                                      }
                                    }}
                                    className="h-7 px-2 text-gray-400 hover:text-rose-400"
                                    title="Registrar saída / remover da garagem"
                                  >
                                    <LogOut size={13} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* MODAL: REMANEJAMENTO ENTRE GARAGENS */}
        {/* ========================================================================= */}
        <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight size={18} className="text-seguranca-yellow" /> Remanejar Veículo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs sm:text-sm">
              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Garagem de Destino *</label>
                <Select value={transferToGarageId} onValueChange={setTransferToGarageId}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o destino" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {garages.map(g => (
                      <SelectItem key={g.id} value={g.id} disabled={g.atCapacity}>
                        {g.name} {g.capacity ? `(${g.vehicleCount ?? 0}/${g.capacity})` : ''}
                        {g.atCapacity ? ' 🚨 LOTADA' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Motivo da Transferência</label>
                <Select value={transferReason} onValueChange={setTransferReason}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white">
                    {Object.entries(MOVEMENT_REASON_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Detalhes do Remanejamento</label>
                <Textarea
                  value={transferDetail}
                  onChange={e => setTransferDetail(e.target.value)}
                  className="bg-seguranca-black border-gray-700 text-white"
                  rows={2}
                  placeholder="Ex.: Mudança de rota para atender contrato Petrobras..."
                />
              </div>

              <Button
                onClick={handleTransferSubmit}
                disabled={transferSaving || !transferToGarageId}
                className="w-full bg-seguranca-yellow text-black hover:bg-yellow-500 font-bold h-11"
              >
                {transferSaving ? <Loader2 size={17} className="animate-spin mr-1" /> : <ArrowLeftRight size={17} className="mr-1" />}
                Confirmar Remanejamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* CONFIRMAÇÃO DE EXCLUSÃO DE GARAGEM */}
        {/* ========================================================================= */}
        <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-seguranca-graphite border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Garagem?</AlertDialogTitle>
              <AlertDialogDescription>
                A garagem será removida da lista ativa de pátios e seus veículos serão liberados. O histórico de movimentações permanece preservado para auditoria.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGarage} className="bg-rose-600 hover:bg-rose-500 text-white">
                Excluir Garagem
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ========================================================================= */}
        {/* COMPONENTE: SCANNER DE QR CODE INTEGRADO */}
        {/* ========================================================================= */}
        <QRCodeScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleScanQRCode}
        />

        {/* ========================================================================= */}
        {/* COMPONENTE: MODAL DE PASSAPORTE & QR CODE DO VEÍCULO (IMPRESSÃO CRACHÁ) */}
        {/* ========================================================================= */}
        <VehicleQRCodeModal
          isOpen={qrModalVehicleId != null}
          onClose={() => setQrModalVehicleId(null)}
          vehicleId={qrModalVehicleId}
        />

      </div>
    </StandardLayout>
  );
};

export default Garagens;
