import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Plus,
  Trash,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Car,
  Clock,
  Navigation,
  FileCheck,
  Percent,
  Receipt,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldAlert,
  Eye,
  Edit2,
  Search,
  RefreshCw,
  Truck,
  Gauge,
  Bus,
  FileUp,
  Loader2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { parteDiariaService, ParteDiaria } from '@/services/parteDiariaService';
import { contasAReceberService } from '@/services/contasAReceberService';
import { clientService } from '@/services/clientService';
import { ContractMeasurementPdfService } from '@/services/contractMeasurementPdfService';
import { fleetService } from '@/services/fleetService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { routeService, Route } from '@/services/routeService';
import { serviceService, ServiceItem } from '@/services/serviceService';
import { ArrowRightLeft } from 'lucide-react';
import { ParteDiariaModal } from './ParteDiariaModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface LeasedVehicleItem {
  id: string;
  itemNumber: number;
  description: string;
  route: string;
  plate: string;
  period: string;
  monthlyRate: number;
  workingDays: number;
  dailyRate: number;
  totalPeriod: number;
  observations?: string;
}

export interface ExtraTripItem {
  id: string;
  date: string;
  plate: string;
  route: string;
  vehicleType: string;
  tripCost: number;
  total: number;
}

export interface ExcessKmItem {
  id: string;
  periodMonth: string;
  plate: string;
  franchiseKm: number;
  totalKmDriven: number;
  disregardedKm: number;
  consideredKm: number;
  excessKm: number;
  excessKmRate: number;
  totalExcessValue: number;
}

export interface ContractDeductionItem {
  id: string;
  date: string;
  plate: string;
  description: string;
  type: 'DEBIT' | 'CREDIT';
  value: number;
}

export interface RevenueInvoiceData {
  invoiceNumber: string;
  series: string;
  issueDate: string;
  dueDate: string;
  serviceCode: string;
  issRatePercentage: number;
  grossValue: number;
  pisRetention: number;
  cofinsRetention: number;
  csllRetention: number;
  inssRetention: number;
  netReceivableValue: number;
  accessKey: string;
  attachedFile?: string;
  status: 'DRAFT' | 'ISSUED' | 'SENT_TO_RECEIVABLES' | 'PAID';
}

interface NfseParsedData {
  nfseNumber?: string;
  nfseKey?: string;
  issueDate?: string;
  tomadorCnpjCpf?: string;
  tomadorName?: string;
  prestadorCnpjCpf?: string;
  prestadorName?: string;
  grossAmount?: number;
  netAmount?: number;
  issqnRetido?: number;
  inssRetido?: number;
  irRetido?: number;
  pisRetido?: number;
  cofinsRetido?: number;
  csllRetido?: number;
  serviceDescription?: string;
  municipality?: string;
  xmlUrl?: string;
  pdfUrl?: string;
}

const CLIENT_CONTRACTS_MOCK = [
  {
    id: 'cli-01',
    clientName: 'GERAES ARQUITETURA E ENGENHARIA LTDA',
    clientCnpj: '25.618.133/0001-57',
    measurementNumber: '016',
    periodStart: '2024-03-21',
    periodEnd: '2024-04-20',
    dueDate: '2024-05-05',
    contractNumber: 'CTC-GERAES-2024/01'
  },
  {
    id: 'cli-02',
    clientName: 'ALMENARA TURISMO EIRELI',
    clientCnpj: '18.442.991/0001-08',
    measurementNumber: '004',
    periodStart: '2024-01-01',
    periodEnd: '2024-01-31',
    dueDate: '2024-03-05',
    contractNumber: 'CTC-ALMENARA-2024/02'
  },
  {
    id: 'cli-03',
    clientName: 'VALE S.A.',
    clientCnpj: '33.592.510/0001-54',
    measurementNumber: '088',
    periodStart: '2024-09-01',
    periodEnd: '2024-09-30',
    dueDate: '2024-10-15',
    contractNumber: 'CTC-VALE-2024/88'
  },
  {
    id: 'cli-04',
    clientName: 'FMQC - TRANSPORTES & OPERAÇÕES',
    clientCnpj: '08.123.456/0001-99',
    measurementNumber: '025',
    periodStart: '2025-12-01',
    periodEnd: '2025-12-31',
    dueDate: '2026-01-10',
    contractNumber: 'CT-2025/FMQC'
  }
];

const INITIAL_PARTES_DIARIAS: Record<string, ParteDiaria[]> = {
  'cli-01': [
    {
      id: 'pd-geraes-1',
      number: '13098',
      date: '2024-04-02',
      clientId: 'cli-01',
      clientName: 'GERAES ARQUITETURA E ENGENHARIA LTDA',
      contractNumber: 'CTC-GERAES-2024/01',
      obraName: 'MINA VALE MIGUELÃO - N. LIMA-MG',
      vehiclePlate: 'RUR-7A78',
      vehicleModel: 'Ônibus Rodoviário',
      driverName: 'Carlos Eduardo Mendes',
      startTime: '05:30',
      endTime: '17:40',
      startKm: 120100,
      endKm: 120280,
      drivenKm: 180,
      disregardedKm: 0,
      consideredKm: 180,
      status: 'VALIDADA',
      notes: 'Transporte de colaboradores turno manhã e tarde',
      atividades: [
        { startTime: '05:30', endTime: '11:00', description: 'Praça da Estação BH x Mina Miguelão', startKm: 120100, endKm: 120190, activityType: 'REGULAR' },
        { startTime: '12:30', endTime: '17:40', description: 'Mina Miguelão x Praça da Estação BH', startKm: 120190, endKm: 120280, activityType: 'REGULAR' }
      ]
    },
    {
      id: 'pd-geraes-2',
      number: '13099',
      date: '2024-04-03',
      clientId: 'cli-01',
      clientName: 'GERAES ARQUITETURA E ENGENHARIA LTDA',
      contractNumber: 'CTC-GERAES-2024/01',
      obraName: 'MINA VALE MIGUELÃO - N. LIMA-MG',
      vehiclePlate: 'SHZ-3A40',
      vehicleModel: 'Micro Ônibus',
      driverName: 'Marcos Vinicius Rocha',
      startTime: '06:00',
      endTime: '18:15',
      startKm: 85400,
      endKm: 85565,
      drivenKm: 165,
      disregardedKm: 0,
      consideredKm: 165,
      status: 'VALIDADA',
      notes: 'Operação regular sem intercorrências',
      atividades: [
        { startTime: '06:00', endTime: '12:00', description: 'Raposos x Mina Miguelão', startKm: 85400, endKm: 85480, activityType: 'REGULAR' },
        { startTime: '13:00', endTime: '18:15', description: 'Mina Miguelão x Raposos', startKm: 85480, endKm: 85565, activityType: 'REGULAR' }
      ]
    }
  ],
  'cli-04': [
    {
      id: 'pd-fmqc-1',
      number: '13103',
      date: '2025-12-13',
      clientId: 'cli-04',
      clientName: 'FMQC - TRANSPORTES & OPERAÇÕES',
      contractNumber: 'CT-2025/FMQC',
      obraName: 'FMQC IBIRITÉ',
      vehiclePlate: 'QMR-2F82',
      vehicleModel: 'MICRO',
      driverName: 'João da Silva (Motorista)',
      startTime: '05:20',
      endTime: '08:05',
      startKm: 404014,
      endKm: 404085,
      drivenKm: 71,
      disregardedKm: 0,
      consideredKm: 71,
      status: 'VALIDADA',
      notes: 'Operação realizada com sucesso conforme parte diária física Nº 13103.',
      createdBy: 'José Mário Ramos (DP)',
      atividades: [
        { startTime: '05:20', endTime: '06:59', description: 'Ibirite FMQC', startKm: 404014, endKm: 404058, activityType: 'REGULAR' },
        { startTime: '07:00', endTime: '08:05', description: 'FMQC Ibirite', startKm: 404058, endKm: 404085, activityType: 'REGULAR' }
      ]
    }
  ]
};

export const ClientContractMeasurementManager: React.FC = () => {
  const [selectedClientId, setSelectedClientId] = useState('cli-01');
  const [activeTab, setActiveTab] = useState('leased-vehicles');
  const { toast } = useToast();

  const currentClient = CLIENT_CONTRACTS_MOCK.find(c => c.id === selectedClientId) || CLIENT_CONTRACTS_MOCK[0];

  // State: Veículos Locados
  const [leasedVehicles, setLeasedVehicles] = useState<LeasedVehicleItem[]>([
    {
      id: 'lv-1',
      itemNumber: 1,
      description: 'PRESTAÇÃO DE SERVIÇO COM ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA PARA TRANSPORTE DE FUNCIONÁRIOS.',
      route: 'PRAÇA DA ESTAÇÃO - BH/MG X MINA VALE MIGUELÃO - N. LIMA-MG',
      plate: 'RUR-7A78',
      period: '21/03/2024 À 20/04/2024',
      monthlyRate: 33600.00,
      workingDays: 30,
      dailyRate: 1120.00,
      totalPeriod: 33600.00,
      observations: '02 MOTORISTAS'
    },
    {
      id: 'lv-2',
      itemNumber: 2,
      description: 'PRESTAÇÃO DE SERVIÇO COM MICRO ÔNIBUS RODOVIÁRIO, COM CESSÃO DE MÃO DE OBRA PARA TRANSPORTE DE FUNCIONÁRIOS.',
      route: 'RAPOSOS - NOVA LIMA/MG X MINA VALE MIGUELÃO - N. LIMA-MG',
      plate: 'SHZ-3A40',
      period: '21/03/2024 À 20/04/2024',
      monthlyRate: 34500.00,
      workingDays: 30,
      dailyRate: 1150.00,
      totalPeriod: 34500.00,
      observations: '02 MOTORISTAS'
    }
  ]);

  // State: Viagens Extras
  const [extraTrips, setExtraTrips] = useState<ExtraTripItem[]>([
    {
      id: 'et-1',
      date: '2024-04-05',
      plate: 'RUR-7A78',
      route: 'Belo Horizonte X Ouro Preto (Turno Especial)',
      vehicleType: 'Ônibus Rodoviário',
      tripCost: 1200.00,
      total: 1200.00
    }
  ]);

  // State: Quilometragem Excedente
  const [excessKmItems, setExcessKmItems] = useState<ExcessKmItem[]>([
    {
      id: 'ekm-1',
      periodMonth: 'ABRIL',
      plate: 'RUR-7A78',
      franchiseKm: 2000,
      totalKmDriven: 2592,
      disregardedKm: 921,
      consideredKm: 1671,
      excessKm: 0,
      excessKmRate: 8.60,
      totalExcessValue: 0.00
    },
    {
      id: 'ekm-2',
      periodMonth: 'ABRIL',
      plate: 'SHZ-3A40',
      franchiseKm: 2000,
      totalKmDriven: 2497,
      disregardedKm: 191,
      consideredKm: 2306,
      excessKm: 306,
      excessKmRate: 6.90,
      totalExcessValue: 2111.40
    }
  ]);

  // State: Débitos / Deduções
  const [deductions, setDeductions] = useState<ContractDeductionItem[]>([
    {
      id: 'ded-1',
      date: '2024-04-01',
      plate: 'SHZ-3A40',
      description: 'APÓLICE SEGURO DE FROTA - MÊS ABRIL',
      type: 'DEBIT',
      value: 159.80
    }
  ]);

  // Controle de Modais: Débitos / Deduções
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState<boolean>(false);
  const [isDeductionViewOpen, setIsDeductionViewOpen] = useState<boolean>(false);
  const [selectedDeduction, setSelectedDeduction] = useState<ContractDeductionItem | null>(null);
  const [deductionToDelete, setDeductionToDelete] = useState<ContractDeductionItem | null>(null);
  const [isDeductionDeleteDialogOpen, setIsDeductionDeleteDialogOpen] = useState<boolean>(false);
  const [deductionForm, setDeductionForm] = useState<{
    date: string;
    plate: string;
    description: string;
    type: 'DEBIT' | 'CREDIT';
    value: number;
  }>({
    date: new Date().toISOString().split('T')[0],
    plate: 'RUR-7A78',
    description: '',
    type: 'DEBIT',
    value: 0
  });

  // State: Nota Fiscal de Receita
  const [invoice, setInvoice] = useState<RevenueInvoiceData>({
    invoiceNumber: '0001642',
    series: '1',
    issueDate: '2024-04-22',
    dueDate: currentClient.dueDate,
    serviceCode: '07.02 - Transporte Coletivo de Passageiros',
    issRatePercentage: 2.5,
    grossValue: 71351.60, // 68100 (locacao) + 1200 (extra) + 2111.40 (km) - 159.80
    pisRetention: 463.78,
    cofinsRetention: 2140.55,
    csllRetention: 713.51,
    inssRetention: 0.00,
    netReceivableValue: 68033.76,
    accessKey: '31240471055644000125550010000016421004829103',
    status: 'ISSUED'
  });

  // State: Importação da NFS-e emitida para o cliente
  const nfFileInputRef = useRef<HTMLInputElement | null>(null);
  const [nfFile, setNfFile] = useState<File | null>(null);
  const [nfParsed, setNfParsed] = useState<NfseParsedData | null>(null);
  const [isNfImporting, setIsNfImporting] = useState<boolean>(false);
  const [isNfDragOver, setIsNfDragOver] = useState<boolean>(false);

  // State: Partes Diárias por Cliente
  const [partesDiariasMap, setPartesDiariasMap] = useState<Record<string, ParteDiaria[]>>(INITIAL_PARTES_DIARIAS);
  const [partesLoading, setPartesLoading] = useState<boolean>(false);
  const [partesSearch, setPartesSearch] = useState<string>('');
  
  // Controle de Modais para Parte Diária
  const [isParteModalOpen, setIsParteModalOpen] = useState<boolean>(false);
  const [selectedParteDiaria, setSelectedParteDiaria] = useState<ParteDiaria | null>(null);
  const [isModalReadOnly, setIsModalReadOnly] = useState<boolean>(false);

  // Exclusão
  const [parteToDelete, setParteToDelete] = useState<ParteDiaria | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  const loadPartesDiarias = async () => {
    try {
      setPartesLoading(true);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(selectedClientId);
      const apiPartes = await parteDiariaService.getPartesDiarias(
        undefined,
        undefined,
        isUuid ? selectedClientId : undefined
      ).catch(() => []);
      if (Array.isArray(apiPartes) && apiPartes.length > 0) {
        setPartesDiariasMap(prev => ({
          ...prev,
          [selectedClientId]: apiPartes
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar partes diárias da API:', err);
    } finally {
      setPartesLoading(false);
    }
  };

  useEffect(() => {
    loadPartesDiarias();
  }, [selectedClientId]);

  const currentPartesDiarias = partesDiariasMap[selectedClientId] || [];

  const filteredPartesDiarias = currentPartesDiarias.filter(pd => {
    if (!partesSearch) return true;
    const term = partesSearch.toLowerCase();
    return (
      (pd.number || '').toLowerCase().includes(term) ||
      (pd.vehiclePlate || '').toLowerCase().includes(term) ||
      (pd.driverName || '').toLowerCase().includes(term) ||
      (pd.vehicleModel || '').toLowerCase().includes(term) ||
      (pd.status || '').toLowerCase().includes(term)
    );
  });

  const totalKmPartesConsiderado = currentPartesDiarias.reduce(
    (sum, p) => sum + (Number(p.consideredKm ?? p.drivenKm) || 0),
    0
  );
  const totalKmPartesRodado = currentPartesDiarias.reduce(
    (sum, p) => sum + (Number(p.drivenKm) || 0),
    0
  );

  const handleOpenCreateParteDiaria = () => {
    setSelectedParteDiaria(null);
    setIsModalReadOnly(false);
    setIsParteModalOpen(true);
  };

  const handleOpenViewParteDiaria = (pd: ParteDiaria) => {
    setSelectedParteDiaria(pd);
    setIsModalReadOnly(true);
    setIsParteModalOpen(true);
  };

  const handleOpenEditParteDiaria = (pd: ParteDiaria) => {
    setSelectedParteDiaria(pd);
    setIsModalReadOnly(false);
    setIsParteModalOpen(true);
  };

  const handleOpenDeleteParteDiaria = (pd: ParteDiaria) => {
    setParteToDelete(pd);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDeleteParteDiaria = async () => {
    if (!parteToDelete) return;
    try {
      if (parteToDelete.id) {
        await parteDiariaService.deleteParteDiaria(parteToDelete.id).catch(() => {});
      }
      setPartesDiariasMap(prev => ({
        ...prev,
        [selectedClientId]: (prev[selectedClientId] || []).filter(
          p => (p.id ? p.id !== parteToDelete.id : p.number !== parteToDelete.number)
        )
      }));
      toast({
        title: 'Parte Diária Excluída',
        description: `Boletim Nº ${parteToDelete.number} removido com sucesso.`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao excluir',
        description: err.message || 'Falha ao remover parte diária.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setParteToDelete(null);
    }
  };

  const handleParteDiariaSuccess = () => {
    loadPartesDiarias();
  };

    // Itens filtrados pelo cliente selecionado (se não tiver alocações/lançamentos, exibe vazio!)
  const currentLeasedVehicles = leasedVehicles.filter(v => v.clientId === selectedClientId);
  const currentExtraTrips = extraTrips.filter(t => t.clientId === selectedClientId);
  const currentExcessKmItems = excessKmItems.filter(k => k.clientId === selectedClientId);
  const currentDeductions = deductions.filter(d => d.clientId === selectedClientId);

  // Cálculos Totais estritamente do cliente selecionado
  const totalLeasedVehicles = currentLeasedVehicles.reduce((sum, i) => sum + i.totalPeriod, 0);
  const totalExtraTrips = currentExtraTrips.reduce((sum, i) => sum + i.total, 0);
  const totalExcessKm = currentExcessKmItems.reduce((sum, i) => sum + i.totalExcessValue, 0);
  const totalDeductions = currentDeductions.reduce((sum, i) => sum + (i.type === 'DEBIT' ? i.value : -i.value), 0);
  
  const totalGrossMeasurement = totalLeasedVehicles + totalExtraTrips + totalExcessKm - totalDeductions;

  // Helper para formatação de valores decimais até 9 casas (ex: decimal 15,9)
  const formatDecimalRate = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '0,00';
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 9 });
  };

  // Rotas e Serviços cadastrados
  const [routes, setRoutes] = useState<Route[]>([]);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [isCustomPlate, setIsCustomPlate] = useState(false);
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [newRouteForm, setNewRouteForm] = useState({ name: '', originAddress: '', destinationAddress: '', distanceKm: 0 });
  const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({ name: '', category: 'FRETAMENTO_CONTINUO', description: '' });
  // Lista de veículos da frota carregados da API
  const [fleetVehicles, setFleetVehicles] = useState<any[]>([]);

  useEffect(() => {
    fleetService.getVehicles().then(data => {
      if (Array.isArray(data)) setFleetVehicles(data);
    }).catch(() => {});

    routeService.findAllRoutes().then(data => {
      if (Array.isArray(data)) setRoutes(data);
    }).catch(() => {});

    serviceService.listServices().then(data => {
      if (Array.isArray(data)) setServicesList(data);
    }).catch(() => {});
  }, []);

  // State e Handlers: Mover Veículo de Contrato/Cliente
  const [isMoveVehicleModalOpen, setIsMoveVehicleModalOpen] = useState(false);
  const [vehicleToMove, setVehicleToMove] = useState<LeasedVehicleItem | null>(null);
  const [targetClientId, setTargetClientId] = useState<string>('');

  const handleOpenMoveVehicle = (vehicle: LeasedVehicleItem) => {
    setVehicleToMove(vehicle);
    const otherClients = CLIENT_CONTRACTS_MOCK.filter(c => c.id !== selectedClientId);
    setTargetClientId(otherClients[0]?.id || '');
    setIsMoveVehicleModalOpen(true);
  };

  const handleConfirmMoveVehicle = () => {
    if (!vehicleToMove || !targetClientId) return;
    const targetClientObj = CLIENT_CONTRACTS_MOCK.find(c => c.id === targetClientId);
    setLeasedVehicles(prev =>
      prev.map(v => (v.id === vehicleToMove.id ? { ...v, clientId: targetClientId } : v))
    );
    toast({
      title: 'Veículo Transferido com Sucesso!',
      description: `O veículo ${vehicleToMove.plate} foi transferido para o contrato de ${targetClientObj?.clientName || 'novo cliente'}.`
    });
    setIsMoveVehicleModalOpen(false);
    setVehicleToMove(null);
  };

  // Opções para SearchableSelect
  const vehicleOptions: SearchableOption[] = useMemo(() => {
    return fleetVehicles
      .filter(v => v && v.plate)
      .map(v => {
        const typeStr = v.vehicleType || 'Veículo';
        const modelStr = [v.brand, v.model].filter(Boolean).join(' ') || v.model || '';
        return {
          value: v.plate,
          label: `${v.plate} — ${modelStr}`,
          subtitle: `${typeStr}${v.clientName ? ` · Cliente: ${v.clientName}` : ' · Disponível'}`,
          badge: typeStr,
          badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          keywords: [v.plate, v.model || '', v.brand || '', typeStr]
        };
      });
  }, [fleetVehicles]);

  const routeOptions: SearchableOption[] = useMemo(() => {
    return routes.map(r => ({
      value: r.name,
      label: r.name,
      subtitle: [r.originAddress, r.destinationAddress].filter(Boolean).join(' ➔ ') || r.description || 'Rota Cadastrada',
      badge: r.distanceKm ? `${r.distanceKm} km` : 'Rota',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      keywords: [r.name, r.originAddress || '', r.destinationAddress || '', r.code || '']
    }));
  }, [routes]);

  const serviceOptions: SearchableOption[] = useMemo(() => {
    return servicesList.map(s => ({
      value: s.name,
      label: s.name,
      subtitle: s.description || (s.category ? `Categoria: ${s.category}` : 'Serviço Cadastrado'),
      badge: s.category || 'Serviço',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      keywords: [s.name, s.code || '', s.category || '']
    }));
  }, [servicesList]);

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRouteForm.name.trim()) return;
    setSavingRoute(true);
    try {
      const created = await routeService.createRoute({
        name: newRouteForm.name.trim().toUpperCase(),
        originAddress: newRouteForm.originAddress.trim(),
        destinationAddress: newRouteForm.destinationAddress.trim(),
        distanceKm: Number(newRouteForm.distanceKm) || undefined,
        description: [newRouteForm.originAddress, newRouteForm.destinationAddress].filter(Boolean).join(' ➔ ')
      });
      setRoutes(prev => [...prev, created]);
      setVehicleForm(prev => ({ ...prev, route: created.name }));
      setIsNewRouteModalOpen(false);
      toast({ title: 'Rota Criada com Sucesso!', description: `A rota ${created.name} foi adicionada à base de rotas.` });
    } catch (err: any) {
      // Fallback local se a API der erro
      const fallbackRoute: Route = {
        id: `route-${Date.now()}`,
        name: newRouteForm.name.trim().toUpperCase(),
        originAddress: newRouteForm.originAddress.trim(),
        destinationAddress: newRouteForm.destinationAddress.trim(),
        distanceKm: Number(newRouteForm.distanceKm) || 0,
        unit: { id: 'default' },
        location: { id: 'default' },
        estimatedDuration: 3600,
        checkpointsRequired: false,
        geofenceEnabled: false
      };
      setRoutes(prev => [...prev, fallbackRoute]);
      setVehicleForm(prev => ({ ...prev, route: fallbackRoute.name }));
      setIsNewRouteModalOpen(false);
      toast({ title: 'Rota Registrada', description: `Rota ${fallbackRoute.name} vinculada com sucesso.` });
    } finally {
      setSavingRoute(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.name.trim()) return;
    setSavingService(true);
    try {
      const created = await serviceService.createService({
        name: newServiceForm.name.trim().toUpperCase(),
        category: newServiceForm.category,
        description: newServiceForm.description.trim()
      });
      setServicesList(prev => [...prev, created]);
      setVehicleForm(prev => ({ ...prev, description: created.name }));
      setIsNewServiceModalOpen(false);
      toast({ title: 'Serviço Cadastrado!', description: `O serviço ${created.name} foi adicionado à tabela de serviços.` });
    } catch (err: any) {
      toast({ title: 'Erro ao cadastrar serviço', description: 'Não foi possível salvar o serviço.', variant: 'destructive' });
    } finally {
      setSavingService(false);
    }
  };
  // State e Handlers: Adicionar / Editar Veículo Locado
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [selectedVehicleItem, setSelectedVehicleItem] = useState<LeasedVehicleItem | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    description: '',
    route: '',
    monthlyRate: 30000,
    workingDays: 30,
    observations: '01 MOTORISTA'
  });

  const handleOpenAddVehicle = () => {
    setSelectedVehicleItem(null);
    setVehicleForm({
      plate: fleetVehicles[0]?.plate || 'ABC-1234',
      description: 'PRESTAÇÃO DE SERVIÇO DE TRANSPORTE DE PASSAGEIROS',
      route: 'ROTA OPERACIONAL X UNIDADE',
      monthlyRate: 30000,
      workingDays: 30,
      observations: '01 MOTORISTA'
    });
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditVehicle = (item: LeasedVehicleItem) => {
    setSelectedVehicleItem(item);
    setVehicleForm({
      plate: item.plate,
      description: item.description,
      route: item.route,
      monthlyRate: item.monthlyRate,
      workingDays: item.workingDays,
      observations: item.observations || ''
    });
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleForm.plate.trim() || !vehicleForm.description.trim()) {
      toast({ title: 'Atenção', description: 'Preencha a placa e a descrição do serviço.', variant: 'destructive' });
      return;
    }
    const days = Number(vehicleForm.workingDays) || 30;
    const monthly = Number(vehicleForm.monthlyRate) || 0;
    const daily = monthly / (days || 1);
    const total = monthly;

    if (selectedVehicleItem) {
      setLeasedVehicles(prev => prev.map(v => v.id === selectedVehicleItem.id ? {
        ...v,
        plate: vehicleForm.plate.trim().toUpperCase(),
        description: vehicleForm.description.trim().toUpperCase(),
        route: vehicleForm.route.trim().toUpperCase(),
        monthlyRate: monthly,
        workingDays: days,
        dailyRate: daily,
        totalPeriod: total,
        observations: vehicleForm.observations
      } : v));
      toast({ title: 'Veículo Atualizado', description: 'As alterações foram salvas na medição.' });
    } else {
      const newItem: LeasedVehicleItem = {
        id: `lv-${Date.now()}`,
        clientId: selectedClientId,
        itemNumber: currentLeasedVehicles.length + 1,
        plate: vehicleForm.plate.trim().toUpperCase(),
        description: vehicleForm.description.trim().toUpperCase(),
        route: vehicleForm.route.trim().toUpperCase(),
        period: `${currentClient.periodStart} À ${currentClient.periodEnd}`,
        monthlyRate: monthly,
        workingDays: days,
        dailyRate: daily,
        totalPeriod: total,
        observations: vehicleForm.observations
      };
      setLeasedVehicles(prev => [...prev, newItem]);
      toast({ title: 'Veículo Alocado', description: `Veículo ${newItem.plate} adicionado ao contrato de ${currentClient.clientName}.` });
    }
    setIsVehicleModalOpen(false);
  };

  const handleDeleteVehicle = (item: LeasedVehicleItem) => {
    setLeasedVehicles(prev => prev.filter(v => v.id !== item.id));
    toast({ title: 'Veículo Removido', description: `Veículo ${item.plate} foi desvinculado desta medição.` });
  };

  // Handler: Gerar PDF Medição
  const handleGenerateMeasurementPdf = async () => {
    try {
      toast({
        title: 'Gerando PDF da Medição...',
        description: `Preparando folha de medição Nº ${currentClient.measurementNumber} (${currentClient.clientName})...`
      });

      await ContractMeasurementPdfService.generateMeasurementPDF({
        client: currentClient,
        leasedVehicles: currentLeasedVehicles,
        extraTrips: currentExtraTrips,
        excessKmItems: currentExcessKmItems,
        deductions: currentDeductions,
        invoice: {
          ...invoice,
          grossValue: totalGrossMeasurement,
          netReceivableValue: totalGrossMeasurement - (invoice.pisRetention + invoice.cofinsRetention + invoice.csllRetention)
        },
        companyName: 'Viação São Silvestre LTDA / FluxBus'
      });

      toast({
        title: 'PDF Gerado com Sucesso!',
        description: 'O download da folha de medição foi concluído.'
      });
    } catch (error: any) {
      console.error('Erro ao gerar PDF da medição:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: error?.message || 'Falha ao processar relatório de medição.',
        variant: 'destructive'
      });
    }
  };

  // State e Handlers: Viagens Extras (Modal & CRUD)
  const [isExtraTripModalOpen, setIsExtraTripModalOpen] = useState<boolean>(false);
  const [selectedExtraTrip, setSelectedExtraTrip] = useState<ExtraTripItem | null>(null);
  const [extraTripForm, setExtraTripForm] = useState<{
    date: string;
    plate: string;
    route: string;
    vehicleType: string;
    tripCost: number;
  }>({
    date: new Date().toISOString().split('T')[0],
    plate: 'RUR-7A78',
    route: '',
    vehicleType: 'Ônibus Rodoviário',
    tripCost: 800.00
  });

  const handleOpenAddExtraTrip = () => {
    setSelectedExtraTrip(null);
    setExtraTripForm({
      date: new Date().toISOString().split('T')[0],
      plate: leasedVehicles[0]?.plate || 'RUR-7A78',
      route: '',
      vehicleType: 'Ônibus Rodoviário',
      tripCost: 800.00
    });
    setIsExtraTripModalOpen(true);
  };

  const handleOpenEditExtraTrip = (trip: ExtraTripItem) => {
    setSelectedExtraTrip(trip);
    setExtraTripForm({
      date: trip.date,
      plate: trip.plate,
      route: trip.route,
      vehicleType: trip.vehicleType,
      tripCost: trip.tripCost
    });
    setIsExtraTripModalOpen(true);
  };

  const handleSaveExtraTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTripForm.plate || !extraTripForm.route) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Informe a placa e o trajeto da viagem extra.',
        variant: 'destructive'
      });
      return;
    }

    const costNum = Number(extraTripForm.tripCost) || 0;

    if (selectedExtraTrip) {
      setExtraTrips(prev =>
        prev.map(t =>
          t.id === selectedExtraTrip.id
            ? {
                ...t,
                date: extraTripForm.date,
                plate: extraTripForm.plate.toUpperCase(),
                route: extraTripForm.route,
                vehicleType: extraTripForm.vehicleType,
                tripCost: costNum,
                total: costNum
              }
            : t
        )
      );
      toast({
        title: 'Viagem Extra Atualizada!',
        description: `Viagem (${extraTripForm.plate}) atualizada com sucesso.`
      });
    } else {
      const newItem: ExtraTripItem = {
        id: `et-${Date.now()}`,
        date: extraTripForm.date,
        plate: extraTripForm.plate.toUpperCase(),
        route: extraTripForm.route,
        vehicleType: extraTripForm.vehicleType,
        tripCost: costNum,
        total: costNum
      };
      setExtraTrips(prev => [...prev, newItem]);
      toast({
        title: 'Viagem Extra Adicionada!',
        description: `Nova viagem registrada com valor de R$ ${costNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`
      });
    }

    setIsExtraTripModalOpen(false);
    setSelectedExtraTrip(null);
  };

  const handleDeleteExtraTrip = (tripId: string) => {
    setExtraTrips(prev => prev.filter(t => t.id !== tripId));
    toast({
      title: 'Viagem Extra Removida',
      description: 'O lançamento foi excluído da medição.'
    });
  };

  // State e Handlers: Quilometragem Excedente (Modal & CRUD)
  const [isExcessKmModalOpen, setIsExcessKmModalOpen] = useState<boolean>(false);
  const [selectedExcessKm, setSelectedExcessKm] = useState<ExcessKmItem | null>(null);
  const [excessKmForm, setExcessKmForm] = useState<{
    periodMonth: string;
    plate: string;
    franchiseKm: number;
    totalKmDriven: number;
    disregardedKm: number;
    excessKmRate: number;
  }>({
    periodMonth: 'ABRIL',
    plate: 'RUR-7A78',
    franchiseKm: 2000,
    totalKmDriven: 2500,
    disregardedKm: 0,
    excessKmRate: 8.60
  });

  const handleOpenAddExcessKm = () => {
    setSelectedExcessKm(null);
    setExcessKmForm({
      periodMonth: 'ABRIL',
      plate: leasedVehicles[0]?.plate || 'RUR-7A78',
      franchiseKm: 2000,
      totalKmDriven: 2500,
      disregardedKm: 0,
      excessKmRate: 8.60
    });
    setIsExcessKmModalOpen(true);
  };

  const handleOpenEditExcessKm = (item: ExcessKmItem) => {
    setSelectedExcessKm(item);
    setExcessKmForm({
      periodMonth: item.periodMonth,
      plate: item.plate,
      franchiseKm: item.franchiseKm,
      totalKmDriven: item.totalKmDriven,
      disregardedKm: item.disregardedKm,
      excessKmRate: item.excessKmRate
    });
    setIsExcessKmModalOpen(true);
  };

  const handleSaveExcessKm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excessKmForm.plate || !excessKmForm.periodMonth) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Informe o período e a placa do veículo.',
        variant: 'destructive'
      });
      return;
    }

    const franchise = Number(excessKmForm.franchiseKm) || 0;
    const driven = Number(excessKmForm.totalKmDriven) || 0;
    const disregarded = Number(excessKmForm.disregardedKm) || 0;
    const considered = Math.max(0, driven - disregarded);
    const excess = Math.max(0, considered - franchise);
    const rate = Number(excessKmForm.excessKmRate) || 0;
    const totalVal = Number((excess * rate).toFixed(2));

    if (selectedExcessKm) {
      setExcessKmItems(prev =>
        prev.map(i =>
          i.id === selectedExcessKm.id
            ? {
                ...i,
                periodMonth: excessKmForm.periodMonth.toUpperCase(),
                plate: excessKmForm.plate.toUpperCase(),
                franchiseKm: franchise,
                totalKmDriven: driven,
                disregardedKm: disregarded,
                consideredKm: considered,
                excessKm: excess,
                excessKmRate: rate,
                totalExcessValue: totalVal
              }
            : i
        )
      );
      toast({
        title: 'Apuração de KM Atualizada!',
        description: `Apuração da placa ${excessKmForm.plate} calculada com sucesso.`
      });
    } else {
      const newItem: ExcessKmItem = {
        id: `ekm-${Date.now()}`,
        periodMonth: excessKmForm.periodMonth.toUpperCase(),
        plate: excessKmForm.plate.toUpperCase(),
        franchiseKm: franchise,
        totalKmDriven: driven,
        disregardedKm: disregarded,
        consideredKm: considered,
        excessKm: excess,
        excessKmRate: rate,
        totalExcessValue: totalVal
      };
      setExcessKmItems(prev => [...prev, newItem]);
      toast({
        title: 'Apuração de KM Adicionada!',
        description: `Apuração registrada com ${excess} KM excedentes (R$ ${totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
      });
    }

    setIsExcessKmModalOpen(false);
    setSelectedExcessKm(null);
  };

  const handleDeleteExcessKm = (itemId: string) => {
    setExcessKmItems(prev => prev.filter(i => i.id !== itemId));
    toast({
      title: 'Apuração Removida',
      description: 'O cálculo de KM excedente foi excluído da medição.'
    });
  };

  const handleOpenAddDeduction = () => {
    setSelectedDeduction(null);
    setDeductionForm({
      date: new Date().toISOString().split('T')[0],
      plate: leasedVehicles[0]?.plate || 'RUR-7A78',
      description: '',
      type: 'DEBIT',
      value: 0
    });
    setIsDeductionModalOpen(true);
  };

  const handleOpenEditDeduction = (item: ContractDeductionItem) => {
    setSelectedDeduction(item);
    setDeductionForm({
      date: item.date,
      plate: item.plate,
      description: item.description,
      type: item.type,
      value: item.value
    });
    setIsDeductionModalOpen(true);
  };

  const handleOpenViewDeduction = (item: ContractDeductionItem) => {
    setSelectedDeduction(item);
    setIsDeductionViewOpen(true);
  };

  const handleSaveDeduction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deductionForm.description.trim()) {
      toast({
        title: 'Campos Obrigatórios',
        description: 'Informe a descrição do débito / desconto.',
        variant: 'destructive'
      });
      return;
    }

    const value = Number(deductionForm.value) || 0;
    if (value <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero para o débito / desconto.',
        variant: 'destructive'
      });
      return;
    }

    const payload = {
      date: deductionForm.date,
      plate: deductionForm.plate.trim().toUpperCase(),
      description: deductionForm.description.trim().toUpperCase(),
      type: deductionForm.type,
      value: Number(value.toFixed(2))
    };

    if (selectedDeduction) {
      setDeductions(prev =>
        prev.map(d => (d.id === selectedDeduction.id ? { ...d, ...payload } : d))
      );
      toast({
        title: 'Débito Atualizado',
        description: 'Os dados do lançamento foram atualizados na medição.'
      });
    } else {
      const newDed: ContractDeductionItem = {
        id: `ded-${Date.now()}`,
        ...payload
      };
      setDeductions(prev => [...prev, newDed]);
      toast({
        title: 'Débito/Desconto inserido',
        description: `Lançamento de R$ ${payload.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado.`
      });
    }

    setIsDeductionModalOpen(false);
    setSelectedDeduction(null);
  };

  const handleRequestDeleteDeduction = (item: ContractDeductionItem) => {
    setDeductionToDelete(item);
    setIsDeductionDeleteDialogOpen(true);
  };

  const handleConfirmDeleteDeduction = () => {
    if (!deductionToDelete) return;
    setDeductions(prev => prev.filter(d => d.id !== deductionToDelete.id));
    toast({
      title: 'Débito Removido',
      description: 'O lançamento foi excluído e os totais da medição recalculados.'
    });
    setIsDeductionDeleteDialogOpen(false);
    setDeductionToDelete(null);
  };

  const formatNfFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleNfFileSelected = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isXml = fileName.endsWith('.xml');
    const isPdf = fileName.endsWith('.pdf');

    if (!isXml && !isPdf) {
      toast({
        title: 'Formato não suportado',
        description: 'Selecione um arquivo PDF ou XML da NFS-e.',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo da NFS-e deve ter no máximo 10 MB.',
        variant: 'destructive'
      });
      return;
    }

    setNfFile(file);
    setIsNfImporting(true);

    try {
      const parsed: NfseParsedData = await contasAReceberService.parseNfse(file);
      setNfParsed(parsed);

      setInvoice(prev => ({
        ...prev,
        invoiceNumber: parsed.nfseNumber || prev.invoiceNumber,
        issueDate: parsed.issueDate ? parsed.issueDate.slice(0, 10) : prev.issueDate,
        grossValue: parsed.grossAmount ?? prev.grossValue,
        pisRetention: parsed.pisRetido ?? prev.pisRetention,
        cofinsRetention: parsed.cofinsRetido ?? prev.cofinsRetention,
        csllRetention: parsed.csllRetido ?? prev.csllRetention,
        inssRetention: parsed.inssRetido ?? prev.inssRetention,
        netReceivableValue: parsed.netAmount ?? prev.netReceivableValue,
        accessKey: parsed.nfseKey || prev.accessKey,
        attachedFile: parsed.pdfUrl || parsed.xmlUrl || file.name
      }));

      toast({
        title: 'NFS-e importada com sucesso',
        description: `Nota ${parsed.nfseNumber || 'sem número'} lida e aplicada aos dados do faturamento.`
      });
    } catch (err: any) {
      console.error('Erro ao importar NFS-e:', err);
      setNfParsed(null);
      setInvoice(prev => ({ ...prev, attachedFile: file.name }));
      toast({
        title: 'Arquivo anexado, mas não foi possível ler a NFS-e',
        description:
          err?.response?.data?.message ||
          'O PDF pode ser uma imagem sem texto. Os campos podem ser preenchidos manualmente.',
        variant: 'destructive'
      });
    } finally {
      setIsNfImporting(false);
    }
  };

  const handleNfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleNfFileSelected(file);
    }
    e.target.value = '';
  };

  const handleNfDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsNfDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleNfFileSelected(file);
    }
  };

  const handleRemoveNfFile = () => {
    setNfFile(null);
    setNfParsed(null);
    setInvoice(prev => ({ ...prev, attachedFile: undefined }));
    if (nfFileInputRef.current) {
      nfFileInputRef.current.value = '';
    }
    toast({
      title: 'Anexo removido',
      description: 'O arquivo da NFS-e foi desvinculado do faturamento.'
    });
  };

  const handleSendToReceivables = () => {
    setInvoice({ ...invoice, status: 'SENT_TO_RECEIVABLES' });
    toast({
      title: '⚡ Lançado no Contas a Receber!',
      description: `Nota Fiscal Nº ${invoice.invoiceNumber} (R$ ${totalGrossMeasurement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) enviada para cobrança e geração de boleto.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Cliente & Cabeçalho da Medição */}
      <Card className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800 text-zinc-100 shadow-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 w-full lg:w-auto">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                  Medição de Fretamento & Locação
                </Badge>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-xs font-mono">
                  Contrato: {currentClient.contractNumber}
                </Badge>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-amber-400 shrink-0" />
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">
                    {currentClient.clientName}
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono">CNPJ: {currentClient.clientCnpj}</p>
                </div>
              </div>
            </div>

            {/* Controles de Período e Seleção de Cliente */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-start lg:justify-end">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-400">Selecione o Cliente / Contrato:</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-72 bg-zinc-900 border-zinc-700 text-zinc-200 font-semibold">
                    <SelectValue placeholder="Escolha um cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    {CLIENT_CONTRACTS_MOCK.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.clientName} (Medição {client.measurementNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-xl text-xs space-y-1 font-mono">
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  Período: <span className="text-zinc-100 font-bold">{currentClient.periodStart} à {currentClient.periodEnd}</span>
                </div>
                <div className="text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Vencimento NF: <span className="text-emerald-400 font-bold">{currentClient.dueDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards com Resumo Financeiro da Medição */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">1. Veículos Locados</p>
            <p className="text-xl font-bold text-white mt-1 font-mono">
              R$ {formatDecimalRate(totalLeasedVehicles)}
            </p>
            <span className="text-[11px] text-zinc-500">{currentLeasedVehicles.length} veículo(s) rodando</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">2. Viagens Extras</p>
            <p className="text-xl font-bold text-blue-400 mt-1 font-mono">
              R$ {totalExtraTrips.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">{currentExtraTrips.length} viagem(ns) adicional(is)</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">3. KM Excedente</p>
            <p className="text-xl font-bold text-amber-400 mt-1 font-mono">
              R$ {totalExcessKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">Franquias e hodômetros</span>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-xs text-zinc-400 font-bold uppercase">4. Deduções / Débitos</p>
            <p className="text-xl font-bold text-red-400 mt-1 font-mono">
              -R$ {totalDeductions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[11px] text-zinc-500">Descontos autorizados</span>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-950/40 via-zinc-900 to-zinc-900 border-emerald-500/40 shadow-xl">
          <CardContent className="p-4">
            <p className="text-xs text-emerald-400 font-extrabold uppercase">TOTAL LÍQUIDO MEDIÇÃO</p>
            <p className="text-2xl font-black text-emerald-300 mt-1 font-mono">
              R$ {totalGrossMeasurement.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] mt-1">
              Pronto para Nota Fiscal
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais da Medição */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl flex flex-wrap gap-1">
          <TabsTrigger value="leased-vehicles" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            🚍 1. Veículos Locados ({currentLeasedVehicles.length})
          </TabsTrigger>
          <TabsTrigger value="partes-diarias" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            📋 2. Partes Diárias (Boletins) ({currentPartesDiarias.length})
          </TabsTrigger>
          <TabsTrigger value="extra-trips" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            ⚡ 3. Viagens Extras & KM Excedente
          </TabsTrigger>
          <TabsTrigger value="deductions" className="data-[state='active']:bg-amber-600 data-[state='active']:text-white font-bold text-xs">
            💳 4. Débitos / Descontos ({currentDeductions.length})
          </TabsTrigger>
          <TabsTrigger value="invoice-billing" className="data-[state='active']:bg-emerald-600 data-[state='active']:text-white font-extrabold text-xs">
            📄 5. Nota Fiscal de Receita (NFS-e) & Faturamento
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Veículos Locados */}
        <TabsContent value="leased-vehicles" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-amber-400">Veículos Locados sob Contrato Fixo</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Apurado com base no valor mensal contratado, dias rodados e diárias dos motoristas (Conforme layout Viação São Silvestre).
                </CardDescription>
              </div>
              <Button onClick={handleOpenAddVehicle} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Veículo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="w-12 text-center text-zinc-400">Item</TableHead>
                      <TableHead className="text-zinc-300">Descrição dos Serviços / Trajeto</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Mensal</TableHead>
                      <TableHead className="text-center text-zinc-300">Dias Rodados</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Diário</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Período</TableHead>
                      <TableHead className="text-center text-zinc-300 w-28">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLeasedVehicles.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={8} className="text-center text-zinc-500 text-sm py-8">
                          <p className="font-semibold text-zinc-300 text-base">Nenhum veículo alocado para este cliente neste período.</p>
                          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                            Como os veículos não são fixos por contrato, clique em "+ Adicionar Veículo" para alocar um veículo da frota ou mova um veículo de outro cliente para cá.
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentLeasedVehicles.map((item, idx) => (
                        <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                          <TableCell className="text-center font-bold text-amber-400">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-zinc-100">{item.description}</div>
                            <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Navigation className="w-3 h-3 text-amber-400" /> {item.route}
                            </div>
                            {item.observations && (
                              <Badge className="bg-zinc-800 text-zinc-300 text-[10px] mt-1">{item.observations}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-400">{item.plate}</TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">
                            R$ {formatDecimalRate(item.monthlyRate)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-200">
                              {item.workingDays} dias
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-zinc-400 text-xs">
                            R$ {formatDecimalRate(item.dailyRate)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-400">
                            R$ {formatDecimalRate(item.totalPeriod)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenMoveVehicle(item)}
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg"
                                title="Mover Veículo para Outro Cliente / Contrato"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditVehicle(item)}
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-lg"
                                title="Editar Veículo Locado"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVehicle(item)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                                title="Remover da Medição"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-zinc-900/80 font-bold border-t-2 border-zinc-700">
                      <TableCell colSpan={6} className="text-right uppercase text-zinc-300">Total Locações:</TableCell>
                      <TableCell className="text-right font-mono text-amber-400 text-base">
                        R$ {totalLeasedVehicles.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Partes Diárias do Cliente (Boletins Diários) */}
        <TabsContent value="partes-diarias" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold text-amber-400">
                    Partes Diárias de Veículos — {currentClient.clientName}
                  </CardTitle>
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-mono">
                    {currentPartesDiarias.length} Boletins
                  </Badge>
                </div>
                <CardDescription className="text-zinc-400 text-xs mt-1">
                  Apuração operacional com vínculo do veículo atendente, horários, motorista e KM rodado/considerado.
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={loadPartesDiarias}
                  variant="outline"
                  size="sm"
                  disabled={partesLoading}
                  className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${partesLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button
                  onClick={handleOpenCreateParteDiaria}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow-lg shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Lançar Parte Diária
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-4">
              {/* Barra de Filtros e Resumo de KMs */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input
                    placeholder="Buscar por Nº, placa ou motorista..."
                    value={partesSearch}
                    onChange={(e) => setPartesSearch(e.target.value)}
                    className="pl-9 h-9 bg-zinc-950 border-zinc-800 text-xs text-zinc-200"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <div className="bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300">
                    <span className="text-zinc-500">KM Total:</span>{' '}
                    <span className="font-bold text-white">{totalKmPartesRodado.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-400">
                    <span>Considerado:</span>{' '}
                    <span className="font-bold text-emerald-300">{totalKmPartesConsiderado.toLocaleString('pt-BR')} km</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Partes Diárias */}
              <div className="border border-zinc-800 rounded-xl overflow-x-auto bg-zinc-950/50">
                <Table>
                  <TableHeader className="bg-zinc-900/90">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300 font-bold text-xs">Nº Boletim</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs">Data</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs">Veículo / Placa</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs">Motorista</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs">Horários</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs text-right">KM Início / Fim</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs text-right">KM Considerado</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs text-center">Status</TableHead>
                      <TableHead className="text-zinc-300 font-bold text-xs text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPartesDiarias.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={9} className="text-center py-10 text-zinc-500 text-sm">
                          <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-2 opacity-50" />
                          Nenhuma parte diária encontrada para {currentClient.clientName}.
                          <div className="mt-3">
                            <Button
                              onClick={handleOpenCreateParteDiaria}
                              size="sm"
                              variant="outline"
                              className="border-zinc-700 text-zinc-300 hover:text-white"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Lançar Primeira Parte Diária
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPartesDiarias.map((pd) => (
                        <TableRow key={pd.id || pd.number} className="border-zinc-800/80 hover:bg-zinc-900/50 transition-colors">
                          <TableCell className="font-mono text-xs font-bold">
                            <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-amber-400 font-mono">
                              Nº {pd.number}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-300 font-mono">
                            {pd.date ? pd.date.split('-').reverse().join('/') : '--/--/----'}
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs font-bold text-blue-400 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-blue-400" />
                              {pd.vehiclePlate}
                            </div>
                            <div className="text-[11px] text-zinc-500 font-medium">
                              {pd.vehicleModel || 'MICRO'}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-zinc-200">
                            {pd.driverName || 'Motorista Operacional'}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-zinc-400">
                            <span className="text-zinc-300">{pd.startTime || '05:20'}</span> às <span className="text-zinc-300">{pd.endTime || '08:05'}</span>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-right text-zinc-400">
                            <span>{pd.startKm?.toLocaleString('pt-BR')}</span> → <span className="text-zinc-200 font-bold">{pd.endKm?.toLocaleString('pt-BR')}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className="bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                              {(pd.consideredKm ?? pd.drivenKm ?? 0).toLocaleString('pt-BR')} km
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-zinc-900 text-zinc-300 border-zinc-700 text-[10px]">
                              {pd.status || 'VALIDADA'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenViewParteDiaria(pd)}
                                title="Visualizar Parte Diária"
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditParteDiaria(pd)}
                                title="Editar Parte Diária"
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenDeleteParteDiaria(pd)}
                                title="Excluir Parte Diária"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Viagens Extras & KM Excedente */}
        <TabsContent value="extra-trips" className="space-y-6">
          {/* Viagens Extras */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-blue-400">Viagens Extras & Serviços Adicionais</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Viagens não contempladas no contrato fixo executadas sob demanda do cliente.
                </CardDescription>
              </div>
              <Button onClick={handleOpenAddExtraTrip} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Viagem Extra
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Data</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-zinc-300">Trajeto / Destino</TableHead>
                      <TableHead className="text-zinc-300">Tipo de Veículo</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Viagem</TableHead>
                      <TableHead className="text-center text-zinc-300 w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extraTrips.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={6} className="text-center py-6 text-zinc-500 text-xs">
                          Nenhuma viagem extra cadastrada para esta medição.
                        </TableCell>
                      </TableRow>
                    ) : (
                      extraTrips.map(trip => (
                        <TableRow key={trip.id} className="border-zinc-800 hover:bg-zinc-900/50">
                          <TableCell className="font-mono text-xs text-zinc-300">{trip.date}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-400">{trip.plate}</TableCell>
                          <TableCell className="text-zinc-200">{trip.route}</TableCell>
                          <TableCell className="text-zinc-400 text-xs">{trip.vehicleType}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-400">
                            R$ {trip.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditExtraTrip(trip)}
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg"
                                title="Editar Viagem Extra"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteExtraTrip(trip.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                                title="Excluir Viagem Extra"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Quilometragem Excedente */}
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-amber-400">Quilometragem Excedente (Apuração de Hodômetro)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Cálculo de Franquia Contratada vs KM Rodado, glosas desconsideradas e valor por KM excedente.
                </CardDescription>
              </div>
              <Button onClick={handleOpenAddExcessKm} size="sm" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                <Plus className="w-4 h-4 mr-1" /> Lançar KM Excedente
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Período</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-right text-zinc-300">Franquia (KM)</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Rodado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Desconsiderado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Considerado</TableHead>
                      <TableHead className="text-right text-zinc-300">KM Excedido</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor/KM Exc.</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor Total Exc.</TableHead>
                      <TableHead className="text-center text-zinc-300 w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excessKmItems.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={10} className="text-center py-6 text-zinc-500 text-xs">
                          Nenhuma apuração de KM excedente lançada.
                        </TableCell>
                      </TableRow>
                    ) : (
                      excessKmItems.map(item => (
                        <TableRow key={item.id} className="border-zinc-800 hover:bg-zinc-900/50">
                          <TableCell className="font-bold text-zinc-300 text-xs">{item.periodMonth}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-400">{item.plate}</TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">{item.franchiseKm.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-mono text-zinc-200 font-semibold">{item.totalKmDriven.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-mono text-zinc-500">{item.disregardedKm.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-mono text-zinc-300">{item.consideredKm.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-amber-400">
                            {item.excessKm > 0 ? item.excessKm.toLocaleString('pt-BR') : '0'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-zinc-400 text-xs">
                            R$ {item.excessKmRate.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-emerald-400">
                            R$ {item.totalExcessValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditExcessKm(item)}
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg"
                                title="Editar Apuração de KM"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteExcessKm(item.id)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                                title="Excluir Apuração de KM"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="bg-zinc-900/80 font-bold border-t-2 border-zinc-700">
                      <TableCell colSpan={8} className="text-right uppercase text-zinc-300">Total KM Excedente:</TableCell>
                      <TableCell className="text-right font-mono text-amber-400 text-base">
                        R$ {totalExcessKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: Débitos & Descontos de Contrato */}
        <TabsContent value="deductions" className="space-y-4">
          <Card className="bg-zinc-950 border-zinc-800 text-zinc-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-red-400">Débitos & Repasses de Contrato (Fechamento)</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">
                  Descontos de apólice de seguro, IPVA ou autopeças conforme modelo de demonstrativo.
                </CardDescription>
              </div>
              <Button onClick={handleOpenAddDeduction} size="sm" variant="outline" className="border-red-500/50 bg-red-950/30 text-red-300 hover:bg-red-900/60">
                <Plus className="w-4 h-4 mr-1" /> Adicionar Débito
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-800 rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-zinc-900">
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-300">Data</TableHead>
                      <TableHead className="text-zinc-300">Placa</TableHead>
                      <TableHead className="text-zinc-300">Descrição do Débito / Desconto</TableHead>
                      <TableHead className="text-center text-zinc-300">Tipo</TableHead>
                      <TableHead className="text-right text-zinc-300">Valor (R$)</TableHead>
                      <TableHead className="text-center text-zinc-300 w-28">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.length === 0 ? (
                      <TableRow className="border-zinc-800">
                        <TableCell colSpan={6} className="text-center text-zinc-500 text-sm py-6">
                          Nenhum débito ou repasse lançado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      deductions.map(ded => (
                        <TableRow key={ded.id} className="border-zinc-800 hover:bg-zinc-900/50">
                          <TableCell className="font-mono text-xs text-zinc-400">{ded.date}</TableCell>
                          <TableCell className="font-mono text-xs font-bold text-blue-400">{ded.plate}</TableCell>
                          <TableCell className="text-zinc-200">{ded.description}</TableCell>
                          <TableCell className="text-center">
                            {ded.type === 'CREDIT' ? (
                              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">CRÉDITO</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-300 border-red-500/40">DÉBITO</Badge>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-bold ${ded.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                            {ded.type === 'CREDIT' ? '+R$ ' : '-R$ '}
                            {ded.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenViewDeduction(ded)}
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 rounded-lg"
                                title="Visualizar Débito"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEditDeduction(ded)}
                                className="h-8 w-8 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 rounded-lg"
                                title="Editar Débito"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRequestDeleteDeduction(ded)}
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg"
                                title="Excluir Débito"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: Nota Fiscal de Receita & Faturamento */}
        <TabsContent value="invoice-billing" className="space-y-6">
          <Card className="bg-zinc-950 border-emerald-500/40 text-zinc-100 shadow-2xl">
            <CardHeader className="border-b border-zinc-800 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-black text-emerald-400 flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-emerald-400" />
                    Faturamento da Medição & Nota Fiscal de Serviço (NFS-e)
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-xs mt-1">
                    Insira os dados da Nota Fiscal de Receita emitida para o cliente para faturamento e integração com o Contas a Receber.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleGenerateMeasurementPdf} className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white font-semibold">
                    <Printer className="w-4 h-4 mr-2 text-amber-400" /> Gerar PDF Medição
                  </Button>
                  <Button
                    onClick={handleSendToReceivables}
                    disabled={invoice.status === 'SENT_TO_RECEIVABLES'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/30"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {invoice.status === 'SENT_TO_RECEIVABLES' ? '⚡ Já Enviado ao Contas a Receber' : '⚡ Lançar no Contas a Receber'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Formulário da Nota Fiscal */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Número da Nota Fiscal (NFS-e):</Label>
                  <Input
                    value={invoice.invoiceNumber}
                    onChange={e => setInvoice({ ...invoice, invoiceNumber: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-bold font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Série da NF:</Label>
                  <Input
                    value={invoice.series}
                    onChange={e => setInvoice({ ...invoice, series: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Data de Emissão:</Label>
                  <Input
                    type="date"
                    value={invoice.issueDate}
                    onChange={e => setInvoice({ ...invoice, issueDate: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-zinc-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Data de Vencimento:</Label>
                  <Input
                    type="date"
                    value={invoice.dueDate}
                    onChange={e => setInvoice({ ...invoice, dueDate: e.target.value })}
                    className="bg-zinc-900 border-zinc-700 text-emerald-400 font-bold font-mono"
                  />
                </div>
              </div>

              {/* Impostos e Retenções na Fonte */}
              <div className="border border-zinc-800 bg-zinc-900/60 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="w-4 h-4 text-amber-400" />
                  Retenções de Impostos Federais & Municipais (NFS-e)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">PIS (0.65%):</span>
                    <Input
                      value={invoice.pisRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, pisRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">COFINS (3.00%):</span>
                    <Input
                      value={invoice.cofinsRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, cofinsRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">CSLL (1.00%):</span>
                    <Input
                      value={invoice.csllRetention}
                      type="number"
                      onChange={e => setInvoice({ ...invoice, csllRetention: parseFloat(e.target.value) || 0 })}
                      className="bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-zinc-400">Valor Líquido A Receber:</span>
                    <div className="h-9 px-3 bg-emerald-950/40 border border-emerald-500/40 rounded-md flex items-center font-bold font-mono text-emerald-300 text-sm">
                      R$ {invoice.netReceivableValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Importação / Anexo do PDF ou XML da NF emitida */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsNfDragOver(true); }}
                onDragLeave={() => setIsNfDragOver(false)}
                onDrop={handleNfDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center space-y-2 transition-colors ${
                  isNfDragOver ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-800 bg-zinc-900/30'
                }`}
              >
                <input
                  ref={nfFileInputRef}
                  type="file"
                  accept=".xml,.pdf,application/xml,text/xml,application/pdf"
                  className="hidden"
                  onChange={handleNfInputChange}
                />

                {isNfImporting ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <p className="text-sm font-bold text-zinc-200">Lendo a NFS-e...</p>
                    <p className="text-xs text-zinc-400">Extraindo número, valores e retenções do arquivo.</p>
                  </div>
                ) : nfFile ? (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-zinc-200 truncate max-w-[70vw] sm:max-w-md">{nfFile.name}</p>
                        <p className="text-xs text-zinc-400">
                          {formatNfFileSize(nfFile.size)} · {nfFile.name.toLowerCase().endsWith('.xml') ? 'XML' : 'PDF'}
                          {nfParsed ? ' · NFS-e lida e aplicada' : ' · anexada (preenchimento manual)'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => nfFileInputRef.current?.click()}
                          className="border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 text-xs"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" /> Substituir
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveNfFile}
                          className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs"
                        >
                          <X className="w-3.5 h-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                    </div>

                    {nfParsed && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
                        <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2">
                          <span className="text-[10px] text-zinc-400 block">Nº NFS-e</span>
                          <span className="text-xs font-mono font-bold text-emerald-300">{nfParsed.nfseNumber || invoice.invoiceNumber}</span>
                        </div>
                        <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2">
                          <span className="text-[10px] text-zinc-400 block">Emissão</span>
                          <span className="text-xs font-mono font-bold text-zinc-200">
                            {nfParsed.issueDate ? nfParsed.issueDate.slice(0, 10).split('-').reverse().join('/') : invoice.issueDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                        <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2">
                          <span className="text-[10px] text-zinc-400 block">Valor Bruto</span>
                          <span className="text-xs font-mono font-bold text-zinc-200">
                            R$ {(nfParsed.grossAmount ?? invoice.grossValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-lg p-2">
                          <span className="text-[10px] text-emerald-300 block">Valor Líquido</span>
                          <span className="text-xs font-mono font-bold text-emerald-300">
                            R$ {(nfParsed.netAmount ?? invoice.netReceivableValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <FileUp className="w-8 h-8 text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-zinc-200">Importar PDF ou XML da Nota Fiscal Emitida</h4>
                    <p className="text-xs text-zinc-400">Arraste e solte a nota fiscal emitida ou clique para selecionar</p>
                    <p className="text-[11px] text-zinc-500">Aceita XML (ABRASF / Padrão Nacional) e PDF com texto pesquisável. Máximo 10 MB.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => nfFileInputRef.current?.click()}
                      className="mt-2 border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" /> Selecionar Arquivo NF (PDF/XML)
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Lançamento / Edição / Visualização de Parte Diária */}
      <ParteDiariaModal
        isOpen={isParteModalOpen}
        onClose={() => {
          setIsParteModalOpen(false);
          setSelectedParteDiaria(null);
        }}
        onSuccess={handleParteDiariaSuccess}
        initialClientId={currentClient.id}
        initialClientName={currentClient.clientName}
        initialContractNumber={currentClient.contractNumber}
        initialObraName={leasedVehicles[0]?.route || ''}
        initialVehiclePlate={leasedVehicles[0]?.plate || ''}
        contractVehicles={currentLeasedVehicles}
        parteDiariaToEdit={selectedParteDiaria}
        isReadOnly={isModalReadOnly}
      />

      {/* MODAL: Adicionar / Editar Viagem Extra */}
      <Dialog open={isExtraTripModalOpen} onOpenChange={setIsExtraTripModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-400" />
                {selectedExtraTrip ? 'Editar Viagem Extra' : 'Adicionar Viagem Extra'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                {selectedExtraTrip ? 'Altere as informações da viagem sob demanda.' : 'Preencha os dados da viagem extra executada para o cliente.'}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsExtraTripModalOpen(false)}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveExtraTrip} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Data da Viagem *</Label>
                <Input
                  type="date"
                  value={extraTripForm.date}
                  onChange={(e) => setExtraTripForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl [color-scheme:dark]"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Placa do Veículo *</Label>
                <Input
                  value={extraTripForm.plate}
                  onChange={(e) => setExtraTripForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  placeholder="Ex: RUR-7A78"
                  required
                  className="bg-zinc-900 border-zinc-700 text-blue-400 font-mono font-bold text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Trajeto / Destino *</Label>
              <Input
                value={extraTripForm.route}
                onChange={(e) => setExtraTripForm(prev => ({ ...prev, route: e.target.value }))}
                placeholder="Ex: Belo Horizonte X Ouro Preto (Turno Especial)"
                required
                className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Tipo de Veículo</Label>
                <Select
                  value={extraTripForm.vehicleType}
                  onValueChange={(val) => setExtraTripForm(prev => ({ ...prev, vehicleType: val }))}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                    <SelectItem value="Ônibus Rodoviário">Ônibus Rodoviário</SelectItem>
                    <SelectItem value="Ônibus Urbano">Ônibus Urbano</SelectItem>
                    <SelectItem value="Micro-ônibus">Micro-ônibus</SelectItem>
                    <SelectItem value="Van Executiva">Van Executiva</SelectItem>
                    <SelectItem value="Carro / Apoio">Carro / Apoio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Valor da Viagem (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={extraTripForm.tripCost}
                  onChange={(e) => setExtraTripForm(prev => ({ ...prev, tripCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  required
                  className="bg-zinc-900 border-zinc-700 text-emerald-400 font-mono font-bold text-sm h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExtraTripModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-9 px-4 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-blue-600/20"
              >
                {selectedExtraTrip ? 'Salvar Alterações' : 'Adicionar Viagem Extra'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Adicionar / Editar KM Excedente */}
      <Dialog open={isExcessKmModalOpen} onOpenChange={setIsExcessKmModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="h-5 w-5 text-amber-400" />
                {selectedExcessKm ? 'Editar Apuração de KM Excedente' : 'Lançar Quilometragem Excedente'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Cálculo automático de franquia contratada, KM rodado e glosas desconsideradas.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsExcessKmModalOpen(false)}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveExcessKm} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Período / Mês *</Label>
                <Input
                  value={excessKmForm.periodMonth}
                  onChange={(e) => setExcessKmForm(prev => ({ ...prev, periodMonth: e.target.value.toUpperCase() }))}
                  placeholder="Ex: ABRIL"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-bold text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Placa do Veículo *</Label>
                <Input
                  value={excessKmForm.plate}
                  onChange={(e) => setExcessKmForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  placeholder="Ex: RUR-7A78"
                  required
                  className="bg-zinc-900 border-zinc-700 text-blue-400 font-mono font-bold text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Franquia (KM) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={excessKmForm.franchiseKm}
                  onChange={(e) => setExcessKmForm(prev => ({ ...prev, franchiseKm: parseFloat(e.target.value) || 0 }))}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-mono text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">KM Rodado Total *</Label>
                <Input
                  type="number"
                  min="0"
                  value={excessKmForm.totalKmDriven}
                  onChange={(e) => setExcessKmForm(prev => ({ ...prev, totalKmDriven: parseFloat(e.target.value) || 0 }))}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-mono text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">KM Desconsiderado</Label>
                <Input
                  type="number"
                  min="0"
                  value={excessKmForm.disregardedKm}
                  onChange={(e) => setExcessKmForm(prev => ({ ...prev, disregardedKm: parseFloat(e.target.value) || 0 }))}
                  className="bg-zinc-900 border-zinc-700 text-zinc-400 font-mono text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            {/* Painel de Cálculo em Tempo Real */}
            {(() => {
              const considered = Math.max(0, excessKmForm.totalKmDriven - excessKmForm.disregardedKm);
              const excess = Math.max(0, considered - excessKmForm.franchiseKm);
              const totalVal = excess * excessKmForm.excessKmRate;
              return (
                <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block font-medium">KM Considerado</span>
                    <span className="text-xs font-mono font-bold text-zinc-200">{considered.toLocaleString('pt-BR')} km</span>
                  </div>
                  <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-amber-400 block font-medium">KM Excedido</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{excess > 0 ? excess.toLocaleString('pt-BR') : '0'} km</span>
                  </div>
                  <div className="bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-[10px] text-emerald-400 block font-medium">Valor Total Exc.</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })()}

            <div>
              <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Valor por KM Excedente (R$/KM) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={excessKmForm.excessKmRate}
                onChange={(e) => setExcessKmForm(prev => ({ ...prev, excessKmRate: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 8.60"
                required
                className="bg-zinc-900 border-zinc-700 text-amber-400 font-mono font-bold text-sm h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExcessKmModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-9 px-4 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-amber-500/20"
              >
                {selectedExcessKm ? 'Salvar Apuração' : 'Lançar KM Excedente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Visualizar Débito / Repasse de Contrato */}
      <Dialog open={isDeductionViewOpen} onOpenChange={setIsDeductionViewOpen}>
        <DialogContent className="w-[95vw] max-w-md bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-400" />
                Detalhes do Débito / Repasse
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Lançamento aplicado ao fechamento da medição.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsDeductionViewOpen(false)}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDeduction && (
            <div className="p-4 sm:p-6 space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Data</span>
                <span className="col-span-2 font-mono text-zinc-200">{selectedDeduction.date}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Placa</span>
                <span className="col-span-2 font-mono font-bold text-blue-400">{selectedDeduction.plate}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Descrição</span>
                <span className="col-span-2 text-zinc-200">{selectedDeduction.description}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Tipo</span>
                <span className="col-span-2">
                  {selectedDeduction.type === 'CREDIT' ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">CRÉDITO</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/40">DÉBITO</Badge>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-zinc-400 text-xs font-semibold uppercase">Valor</span>
                <span className={`col-span-2 font-mono text-base font-bold ${selectedDeduction.type === 'CREDIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedDeduction.type === 'CREDIT' ? '+R$ ' : '-R$ '}
                  {selectedDeduction.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeductionViewOpen(false)}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-9 px-4 rounded-xl"
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setIsDeductionViewOpen(false);
                    handleOpenEditDeduction(selectedDeduction);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-amber-500/20"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Adicionar / Editar Débito / Repasse de Contrato */}
      <Dialog open={isDeductionModalOpen} onOpenChange={setIsDeductionModalOpen}>
        <DialogContent className="w-[95vw] max-w-lg bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-2xl p-0 overflow-hidden shadow-2xl">
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 sm:p-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-400" />
                {selectedDeduction ? 'Editar Débito / Repasse' : 'Adicionar Débito / Repasse'}
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-0.5">
                Lançamento aplicado ao fechamento da medição do contrato.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setIsDeductionModalOpen(false)}
              className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveDeduction} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Data *</Label>
                <Input
                  type="date"
                  value={deductionForm.date}
                  onChange={(e) => setDeductionForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-mono text-xs h-10 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Placa do Veículo</Label>
                <Input
                  value={deductionForm.plate}
                  onChange={(e) => setDeductionForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  placeholder="Ex: RUR-7A78"
                  className="bg-zinc-900 border-zinc-700 text-blue-400 font-mono font-bold text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Descrição do Débito / Desconto *</Label>
              <Input
                value={deductionForm.description}
                onChange={(e) => setDeductionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: APÓLICE SEGURO DE FROTA - MÊS ABRIL"
                required
                className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Tipo *</Label>
                <Select
                  value={deductionForm.type}
                  onValueChange={(value: 'DEBIT' | 'CREDIT') => setDeductionForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white text-xs h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
                    <SelectItem value="DEBIT">Débito (desconta do total)</SelectItem>
                    <SelectItem value="CREDIT">Crédito / Repasse (soma ao total)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold mb-1 block">Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={deductionForm.value}
                  onChange={(e) => setDeductionForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 159.80"
                  required
                  className="bg-zinc-900 border-zinc-700 text-red-400 font-mono font-bold text-sm h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeductionModalOpen(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-9 px-4 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-lg shadow-red-600/20"
              >
                {selectedDeduction ? 'Salvar Alterações' : 'Adicionar Débito'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão de Débito */}
      <AlertDialog open={isDeductionDeleteDialogOpen} onOpenChange={setIsDeductionDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Excluir Débito / Repasse?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm">
              Tem certeza que deseja excluir <span className="font-bold text-white">{deductionToDelete?.description}</span>
              {deductionToDelete?.plate ? (
                <> da placa <span className="font-mono font-bold text-white">{deductionToDelete.plate}</span></>
              ) : null}?
              Esta ação recalculará os totais da medição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteDeduction}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-red-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Excluir Parte Diária Nº {parteToDelete?.number}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-sm">
              Tem certeza que deseja excluir o boletim da placa <span className="font-mono font-bold text-white">{parteToDelete?.vehiclePlate}</span> do cliente <span className="font-bold text-white">{currentClient.clientName}</span>?
              Esta ação removerá o apontamento e recalculará os totais da medição.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteParteDiaria}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      {/* MODAL: Mover Veículo de Contrato / Cliente */}
      <Dialog open={isMoveVehicleModalOpen} onOpenChange={setIsMoveVehicleModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <ArrowRightLeft className="w-5 h-5" /> Mover Veículo de Contrato / Cliente
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Como os veículos não atendem exclusivamente um único contrato, você pode transferir a alocação deste veículo para qualquer outro cliente.
            </DialogDescription>
          </DialogHeader>

          {vehicleToMove && (
            <div className="space-y-4 py-2">
              <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 space-y-1">
                <span className="text-[11px] text-zinc-400 font-semibold uppercase">Veículo Selecionado</span>
                <p className="font-mono font-bold text-blue-400 text-base">{vehicleToMove.plate}</p>
                <p className="text-xs text-zinc-300">{vehicleToMove.description}</p>
                <p className="text-xs text-amber-300 pt-1">Origem atual: {currentClient.clientName}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-zinc-300">
                  Transferir para o Cliente / Contrato de Destino:
                </Label>
                <select
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-md p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {CLIENT_CONTRACTS_MOCK.filter(c => c.id !== selectedClientId).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} (Contrato: {c.contractNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsMoveVehicleModalOpen(false)}
              className="border-zinc-700 bg-zinc-950 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmMoveVehicle}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Adicionar / Editar Veículo Locado com Design Funcional */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-6 shadow-2xl">
          <DialogHeader className="border-b border-zinc-800/80 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-amber-400 text-lg font-bold">
                <Bus className="w-5 h-5 text-amber-400" />
                {selectedVehicleItem ? 'Editar Veículo Locado' : 'Alocar Novo Veículo ao Contrato'}
              </DialogTitle>
              <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                {currentClient.contractNumber}
              </Badge>
            </div>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Vincule o veículo da frota, descrição do serviço e trajeto da operação para <span className="text-zinc-200 font-semibold">{currentClient.clientName}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVehicle} className="space-y-4 py-3">
            {/* 1. SEÇÃO: Identificação do Veículo na Frota */}
            <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Car className="w-4 h-4 text-blue-400" />
                  Veículo da Frota Operacional
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomPlate(!isCustomPlate)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-medium underline-offset-2 hover:underline"
                >
                  {isCustomPlate ? '← Selecionar da Tabela de Veículos' : 'Digitar Placa Livre'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-zinc-300 font-semibold">
                    Placa do Veículo *
                  </Label>
                  {isCustomPlate ? (
                    <Input
                      value={vehicleForm.plate}
                      onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })}
                      placeholder="Ex: QRE-1A23"
                      className="bg-zinc-950 border-zinc-700 text-blue-400 font-mono font-bold text-sm h-10"
                      required
                    />
                  ) : (
                    <SearchableSelect
                      value={vehicleForm.plate}
                      fallbackLabel={vehicleForm.plate}
                      onChange={(val, opt) => {
                        setVehicleForm(prev => ({
                          ...prev,
                          plate: val,
                          description: prev.description || (opt?.subtitle ? `TRANSPORTE EM ${opt.subtitle}` : prev.description)
                        }));
                      }}
                      options={vehicleOptions}
                      placeholder="Buscar placa ou modelo na frota..."
                      searchPlaceholder="Digite a placa ou modelo (ex: QRE-1A23, Scania, Agrale)..."
                      emptyText="Nenhum veículo encontrado na tabela de veículos."
                      maxVisibleOptions={50}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300 font-semibold">
                    Dias Rodados *
                  </Label>
                  <Input
                    type="number"
                    value={vehicleForm.workingDays}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, workingDays: parseInt(e.target.value) || 30 })}
                    className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-10"
                    placeholder="30"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. SEÇÃO: Serviço & Rota Operacional */}
            <div className="bg-zinc-900/60 border border-zinc-800/90 rounded-xl p-4 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-amber-400" />
                Serviço Contratado & Operação
              </div>

              {/* Serviço (com tabela de serviços + cadastrar novo na hora) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-300 font-semibold">
                    Descrição do Serviço *
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewServiceForm({ name: '', category: 'FRETAMENTO_CONTINUO', description: '' });
                      setIsNewServiceModalOpen(true);
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar Novo Serviço
                  </button>
                </div>

                <SearchableSelect
                  value={vehicleForm.description}
                  fallbackLabel={vehicleForm.description}
                  onChange={(val) => setVehicleForm(prev => ({ ...prev, description: val }))}
                  options={serviceOptions}
                  placeholder="Selecione na tabela de serviços cadastrados..."
                  searchPlaceholder="Pesquisar serviço cadastrado..."
                  emptyText="Nenhum serviço encontrado. Clique em Cadastrar Novo Serviço."
                  maxVisibleOptions={30}
                />

                <Input
                  value={vehicleForm.description}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                  placeholder="Texto do serviço que sairá no faturamento e na medição..."
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs mt-1"
                  required
                />
              </div>

              {/* Itinerário / Trajeto (com base de rotas + cadastrar nova rota na hora) */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Itinerário / Trajeto (Base de Rotas)
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRouteForm({ name: '', originAddress: '', destinationAddress: '', distanceKm: 0 });
                      setIsNewRouteModalOpen(true);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Cadastrar Nova Rota
                  </button>
                </div>

                <SearchableSelect
                  value={vehicleForm.route}
                  fallbackLabel={vehicleForm.route}
                  onChange={(val) => setVehicleForm(prev => ({ ...prev, route: val }))}
                  options={routeOptions}
                  placeholder="Buscar na base de rotas cadastradas..."
                  searchPlaceholder="Pesquisar por nome de rota ou itinerário..."
                  emptyText="Nenhuma rota encontrada. Clique em Cadastrar Nova Rota."
                  maxVisibleOptions={30}
                />

                <Input
                  value={vehicleForm.route}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, route: e.target.value })}
                  placeholder="Personalize o itinerário / trajeto do veículo..."
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs mt-1"
                />
              </div>
            </div>

            {/* 3. SEÇÃO: Informações Comerciais (Design Funcional estilo Estoque / Fiscal) */}
            <div className="bg-zinc-900/60 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Informações Comerciais
                </div>
                <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                  Precisão Decimal 15,9
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-300 font-bold">
                    VALOR Mensal (R$) *
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={vehicleForm.monthlyRate}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, monthlyRate: parseFloat(e.target.value) || 0 })}
                    className="bg-zinc-950 border-zinc-700 text-emerald-400 font-mono font-bold text-base h-11"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-400 font-semibold">Diária Estimada</Label>
                    <span className="text-[10px] text-zinc-500">Mensal ÷ Dias</span>
                  </div>
                  <div className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">R$</span>
                    <span className="text-sm font-mono font-bold text-emerald-400 truncate">
                      {((Number(vehicleForm.monthlyRate) || 0) / (Number(vehicleForm.workingDays) || 30)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-zinc-400 font-semibold">Valor Total (R$)</Label>
                    <span className="text-[10px] text-zinc-500">Período</span>
                  </div>
                  <div className="h-11 rounded-md border border-zinc-800 bg-zinc-950 px-3 flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">R$</span>
                    <span className="text-sm font-mono font-bold text-white truncate">
                      {(Number(vehicleForm.monthlyRate) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Observações Operacionais */}
              <div className="space-y-1 pt-1">
                <Label className="text-xs text-zinc-300 font-semibold">
                  Observações Operacionais & Alocação de Condutor
                </Label>
                <Input
                  value={vehicleForm.observations}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, observations: e.target.value })}
                  placeholder="Ex: 01 MOTORISTA DEDICADO, ESCALA 6x1, HORÁRIO ADMINISTRATIVO"
                  className="bg-zinc-950 border-zinc-800 text-zinc-200 text-xs h-9"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-zinc-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleModalOpen(false)}
                className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 shadow-lg shadow-amber-600/20"
              >
                {selectedVehicleItem ? 'Salvar Alterações' : 'Alocar Veículo ao Contrato'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SUB-MODAL: Cadastrar Nova Rota */}
      <Dialog open={isNewRouteModalOpen} onOpenChange={setIsNewRouteModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Navigation className="w-5 h-5" /> Cadastrar Nova Rota
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Cadastre uma nova rota operacional na base de rotas para vincular ao contrato.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRoute} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Nome da Rota / Código *:</Label>
              <Input
                value={newRouteForm.name}
                onChange={e => setNewRouteForm({ ...newRouteForm, name: e.target.value.toUpperCase() })}
                placeholder="Ex: ROTA OPERACIONAL MATRIZ X UNIDADE OESTE"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Ponto de Origem / Endereço:</Label>
              <Input
                value={newRouteForm.originAddress}
                onChange={e => setNewRouteForm({ ...newRouteForm, originAddress: e.target.value })}
                placeholder="Ex: Praça da Estação - BH/MG"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Ponto de Destino / Endereço:</Label>
              <Input
                value={newRouteForm.destinationAddress}
                onChange={e => setNewRouteForm({ ...newRouteForm, destinationAddress: e.target.value })}
                placeholder="Ex: Mina Vale Miguelão - Nova Lima/MG"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Distância Estimada (KM):</Label>
              <Input
                type="number"
                step="any"
                value={newRouteForm.distanceKm || ""}
                onChange={e => setNewRouteForm({ ...newRouteForm, distanceKm: parseFloat(e.target.value) || 0 })}
                placeholder="Ex: 45.5"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs font-mono"
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewRouteModalOpen(false)}
                className="border-zinc-700 bg-zinc-950 text-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingRoute}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {savingRoute ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Salvar e Selecionar Rota
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SUB-MODAL: Cadastrar Novo Serviço */}
      <Dialog open={isNewServiceModalOpen} onOpenChange={setIsNewServiceModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <Layers className="w-5 h-5" /> Cadastrar Novo Serviço
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Adicione um novo serviço à tabela de serviços cadastrados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateService} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Nome do Serviço *:</Label>
              <Input
                value={newServiceForm.name}
                onChange={e => setNewServiceForm({ ...newServiceForm, name: e.target.value.toUpperCase() })}
                placeholder="Ex: TRANSPORTE DE PASSAGEIROS COM CESSÃO DE MOTORISTA"
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Categoria:</Label>
              <Select
                value={newServiceForm.category}
                onValueChange={val => setNewServiceForm({ ...newServiceForm, category: val })}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="FRETAMENTO_CONTINUO">Fretamento Contínuo</SelectItem>
                  <SelectItem value="LOCACAO_VEICULOS">Locação de Veículos</SelectItem>
                  <SelectItem value="EVENTUAL_EXTRA">Viagem Extra / Eventual</SelectItem>
                  <SelectItem value="TURISMO">Turismo / Translado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-zinc-300">Descrição Detalhada:</Label>
              <Textarea
                value={newServiceForm.description}
                onChange={e => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                placeholder="Descreva as características do serviço contratado..."
                className="bg-zinc-950 border-zinc-700 text-zinc-100 text-xs"
                rows={2}
              />
            </div>
            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewServiceModalOpen(false)}
                className="border-zinc-700 bg-zinc-950 text-zinc-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={savingService}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                {savingService ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Salvar e Selecionar Serviço
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
</div>
  );
};

export default ClientContractMeasurementManager;
