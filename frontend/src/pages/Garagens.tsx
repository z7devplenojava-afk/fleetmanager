import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RefreshCw, Filter, Smartphone, ExternalLink, Calendar, Sparkles
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
  MOVEMENT_REASON_LABELS,
} from '@/services/garageService';
import { employeeService, Employee } from '@/services/employeeService';
import fleetService from '@/services/fleetService';
import { QRCodeScanner, QRScanResult } from '@/components/frota/QRCodeScanner';
import { VehicleQRCodeModal } from '@/components/frota/VehicleQRCodeModal';
import { DriverCombobox } from '@/components/frota/DriverCombobox';

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
  const [activeTab, setActiveTab] = useState<'vehicles' | 'terminal' | 'garages' | 'history'>('vehicles');

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

  // Confirmação de exclusão/desativação
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal de veículos de uma garagem
  const [vehiclesDialogOpen, setVehiclesDialogOpen] = useState(false);
  const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
  const [vehicleToAssign, setVehicleToAssign] = useState('');

  // Remanejamento entre garagens
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferVehicleId, setTransferVehicleId] = useState('');
  const [transferToGarageId, setTransferToGarageId] = useState('');
  const [transferReason, setTransferReason] = useState('REMANEJAMENTO');
  const [transferDetail, setTransferDetail] = useState('');
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
      const payload: GarageCheckInInput = {
        vehicleId: terminalVehicleId,
        garageId: terminalGarageId,
        driverName: terminalDriver.trim() || undefined,
        clientName: terminalClient.trim() || undefined,
        reason: terminalReason,
        reasonDetail: terminalDetail.trim() || undefined,
        kmReading: terminalKm,
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
      const payload: GarageCheckOutInput = {
        vehicleId: terminalVehicleId,
        driverName: terminalDriver.trim() || undefined,
        reason: terminalReason,
        reasonDetail: terminalDetail.trim() || undefined,
        kmReading: terminalKm,
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
  const openCreateGarage = () => {
    setEditingId(null);
    setForm({ name: '', address: '', responsibleEmployeeId: '', responsibleName: '', responsiblePhone: '', capacity: undefined, notes: '' });
    setDialogOpen(true);
  };

  const openEditGarage = (garage: Garage) => {
    setEditingId(garage.id);
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
    try {
      await garageService.delete(deleteId);
      toast({ title: 'Sucesso', description: 'Garagem desativada' });
      loadData();
    } catch {
      toast({ title: 'Erro', description: 'Erro ao desativar garagem', variant: 'destructive' });
    } finally {
      setDeleteId(null);
    }
  };

  // Remanejamento entre garagens
  const openTransferModal = (vehicleId: string) => {
    setTransferVehicleId(vehicleId);
    setTransferToGarageId('');
    setTransferReason('REMANEJAMENTO');
    setTransferDetail('');
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
      <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
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
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block">Motorista Condutor</span>
                            <span className="text-gray-100 font-medium truncate block">{item.driver}</span>
                          </div>
                        </div>

                        {/* Data/Hora de Entrada e Tempo de Permanência */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block flex items-center gap-1">
                              <Calendar size={11} /> Entrada
                            </span>
                            <span className="text-gray-200 font-medium mt-0.5 block truncate text-[11px]">
                              {stay.entryFormatted}
                            </span>
                          </div>

                          <div className="bg-seguranca-black/60 p-2.5 rounded-lg border border-gray-800">
                            <span className="text-gray-400 text-[10px] uppercase font-semibold block flex items-center gap-1">
                              <Clock size={11} /> Permanência
                            </span>
                            <span className={`font-bold mt-0.5 block truncate text-xs ${
                              stay.severity === 'alert' ? 'text-rose-400' : stay.severity === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {stay.stayFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Motivo da Parada */}
                        <div className="text-[11px] text-gray-300 flex items-center justify-between pt-1 border-t border-gray-800">
                          <span className="text-gray-400">Motivo da parada:</span>
                          <span className="font-semibold text-gray-200">{stay.reasonLabel}</span>
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
        {/* ABA 3: PÁTIOS & GARAGENS (CAPACIDADES, RESPONSÁVEL, CONTATO) */}
        {/* ========================================================================= */}
        {activeTab === 'garages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {garages.map(garage => {
              const occ = garage.capacity && garage.capacity > 0
                ? Math.min(100, Math.round(((garage.vehicleCount || 0) / garage.capacity) * 100))
                : null;

              return (
                <Card key={garage.id} className="bg-seguranca-graphite border-gray-700 p-4 hover:border-seguranca-yellow transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-seguranca-yellow/10 border border-seguranca-yellow/30 flex items-center justify-center flex-shrink-0 text-seguranca-yellow">
                          <Warehouse size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate text-base">{garage.name}</p>
                          {garage.address && (
                            <p className="text-gray-400 text-xs truncate flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="shrink-0" /> {garage.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditGarage(garage)} className="text-gray-400 hover:text-seguranca-yellow transition-colors p-1.5" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(garage.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1.5" title="Desativar">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Informações da Garagem */}
                    <div className="space-y-2 text-xs text-gray-300 my-4 bg-seguranca-black/50 p-3 rounded-lg border border-gray-800">
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

                      <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                        <span className="text-gray-400">Veículos Alocados:</span>
                        <span className="font-bold text-white">
                          {garage.vehicleCount ?? 0} {garage.capacity ? `de ${garage.capacity} vagas` : ''}
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
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedGarage(garage);
                      setVehiclesDialogOpen(true);
                    }}
                    variant="outline"
                    className="w-full border-gray-600 text-gray-200 hover:text-white hover:bg-gray-800 text-xs"
                  >
                    <Users size={14} className="mr-1.5" /> Gerenciar Veículos ({garage.vehicleCount ?? 0})
                  </Button>
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
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Endereço Completo</label>
                <Input
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="bg-seguranca-black border-gray-700 text-white"
                  placeholder="Rua, número, bairro, cidade..."
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block font-semibold">Responsável Operacional</label>
                <Select
                  value={form.responsibleEmployeeId || ''}
                  onValueChange={(v) => {
                    const emp = employees.find(e => e.id === v);
                    setForm(prev => ({
                      ...prev,
                      responsibleEmployeeId: v,
                      responsibleName: emp?.name || prev.responsibleName,
                      responsiblePhone: emp?.phone || prev.responsiblePhone,
                    }));
                  }}
                >
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white">
                    <SelectValue placeholder="Selecione o encarregado do pátio" />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-56">
                    {employees.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        {/* MODAL: GERENCIAR VEÍCULOS DE UMA GARAGEM ESPECÍFICA */}
        {/* ========================================================================= */}
        <Dialog open={vehiclesDialogOpen} onOpenChange={setVehiclesDialogOpen}>
          <DialogContent className="bg-seguranca-graphite border-gray-700 text-white max-h-[90vh] overflow-y-auto max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 size={18} className="text-seguranca-yellow" />
                Veículos no Pátio — {selectedGarage?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3 text-xs sm:text-sm">
              <div className="flex gap-2">
                <Select value={vehicleToAssign} onValueChange={setVehicleToAssign}>
                  <SelectTrigger className="bg-seguranca-black border-gray-700 text-white flex-1 text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione um veículo para alocar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-seguranca-graphite border-gray-700 text-white max-h-56">
                    {vehicles.filter(v => v.garageId !== selectedGarage?.id).map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.plate} - {v.brand || ''} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={async () => {
                    if (!selectedGarage || !vehicleToAssign) return;
                    try {
                      const updated = await garageService.assignVehicle(selectedGarage.id, vehicleToAssign);
                      setSelectedGarage(updated);
                      setVehicleToAssign('');
                      toast({ title: 'Sucesso', description: 'Veículo recolhido no pátio' });
                      loadData();
                    } catch (error: any) {
                      toast({ title: 'Erro', description: error.response?.data?.message || 'Falha ao alocar veículo', variant: 'destructive' });
                    }
                  }}
                  disabled={!vehicleToAssign}
                  className="bg-seguranca-yellow text-black hover:bg-yellow-500 font-bold"
                >
                  <Plus size={16} className="mr-1" /> Alocar
                </Button>
              </div>

              {(!selectedGarage?.vehicles || selectedGarage.vehicles.length === 0) ? (
                <p className="text-center text-gray-400 py-8 text-xs">Nenhum veículo alocado nesta garagem no momento.</p>
              ) : (
                <div className="space-y-2">
                  {selectedGarage.vehicles.map(v => (
                    <div key={v.id} className="flex items-center justify-between gap-3 bg-seguranca-black/60 rounded-xl p-3 border border-gray-800">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-xs">{v.plate}</span>
                          <span className="text-gray-400 text-xs truncate">{[v.brand, v.model].filter(Boolean).join(' ')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          {v.currentMileage != null && <span>{v.currentMileage.toLocaleString('pt-BR')} km</span>}
                          {v.assignedDriver && <span>• Condutor: {v.assignedDriver}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTransferModal(v.id)}
                          className="h-8 text-gray-400 hover:text-seguranca-yellow"
                          title="Remanejar"
                        >
                          <ArrowLeftRight size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            if (!selectedGarage) return;
                            try {
                              const updated = await garageService.unassignVehicle(selectedGarage.id, v.id);
                              setSelectedGarage(updated);
                              toast({ title: 'Saída Registrada', description: 'Veículo removido da garagem' });
                              loadData();
                            } catch {
                              toast({ title: 'Erro', description: 'Erro ao registrar saída', variant: 'destructive' });
                            }
                          }}
                          className="h-8 text-gray-500 hover:text-red-500"
                          title="Liberar Saída"
                        >
                          <LogOut size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
        {/* CONFIRMAÇÃO DE DESATIVAÇÃO DE GARAGEM */}
        {/* ========================================================================= */}
        <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent className="bg-seguranca-graphite border-gray-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Desativar Garagem?</AlertDialogTitle>
              <AlertDialogDescription>
                A garagem será desativada das operações do pátio. O histórico de movimentações e auditoria permanece seguro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGarage} className="bg-rose-600 hover:bg-rose-500 text-white">
                Desativar
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
