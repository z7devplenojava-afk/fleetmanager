import React, { useState, useEffect, useMemo } from 'react';
import { format, isWeekend, isBefore, startOfDay } from 'date-fns';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle2,
  Calendar as CalendarLucide,
  Car,
  Footprints,
  Bus,
  Route as RouteIcon,
} from 'lucide-react';
import fleetService from '@/services/fleetService';
import { Vehicle } from '@/types/fleet';
import { parseLocalDate } from '@/utils/date-utils';
import {
  Schedule,
  ScheduleStatus,
  ScheduleRecurrence,
  scheduleService,
  resolveScheduleStartTime,
  resolveScheduleEndTime,
  resolveScheduleRecurrence,
  checkVehicleScheduleConflict,
  isScheduleActiveForDate,
} from '@/services/scheduleService';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';

export interface ShiftPresetOption {
  value: string;
  label: string;
  description: string;
  startTime?: string;
  endTime?: string;
  shift: 'DAY' | 'MIXED' | 'NIGHT';
  category: 'PEGADA_CURTA' | 'TURNO_COMPLETO' | 'CUSTOM';
}

export const TURNOS_E_PEGADAS: ShiftPresetOption[] = [
  {
    value: 'PEGADA_0500_0700',
    label: '1ª Pegada Manhã — Entrada',
    description: '05:00 às 07:00 (2h00)',
    startTime: '05:00',
    endTime: '07:00',
    shift: 'DAY',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_0620_0845',
    label: 'Pegada Manhã Curta — Pico',
    description: '06:20 às 08:45 (2h25)',
    startTime: '06:20',
    endTime: '08:45',
    shift: 'DAY',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_0700_0930',
    label: 'Pegada Manhã — Comercial',
    description: '07:00 às 09:30 (2h30)',
    startTime: '07:00',
    endTime: '09:30',
    shift: 'DAY',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_0850_1115',
    label: '2ª Pegada Manhã — Sequência',
    description: '08:50 às 11:15 (2h25)',
    startTime: '08:50',
    endTime: '11:15',
    shift: 'DAY',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_1120_1345',
    label: 'Pegada Almoço / Entre-turno',
    description: '11:20 às 13:45 (2h25)',
    startTime: '11:20',
    endTime: '13:45',
    shift: 'DAY',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_1350_1615',
    label: '1ª Pegada Tarde',
    description: '13:50 às 16:15 (2h25)',
    startTime: '13:50',
    endTime: '16:15',
    shift: 'MIXED',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_1620_1845',
    label: '2ª Pegada Tarde — Pico Saída',
    description: '16:20 às 18:45 (2h25)',
    startTime: '16:20',
    endTime: '18:45',
    shift: 'MIXED',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_1700_1930',
    label: 'Pegada Saída Administrativo',
    description: '17:00 às 19:30 (2h30)',
    startTime: '17:00',
    endTime: '19:30',
    shift: 'MIXED',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_1900_2130',
    label: '1ª Pegada Noite',
    description: '19:00 às 21:30 (2h30)',
    startTime: '19:00',
    endTime: '21:30',
    shift: 'NIGHT',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_2140_2355',
    label: '2ª Pegada Noite / Fechamento',
    description: '21:40 às 23:55 (2h15)',
    startTime: '21:40',
    endTime: '23:55',
    shift: 'NIGHT',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'PEGADA_0000_0450',
    label: 'Pegada Madrugada / Corujão',
    description: '00:00 às 04:50 (4h50)',
    startTime: '00:00',
    endTime: '04:50',
    shift: 'NIGHT',
    category: 'PEGADA_CURTA',
  },
  {
    value: 'DAY',
    label: 'Turno Diurno Padrão',
    description: '08:00 às 17:00 (9h00)',
    startTime: '08:00',
    endTime: '17:00',
    shift: 'DAY',
    category: 'TURNO_COMPLETO',
  },
  {
    value: 'DAY_0700_1900',
    label: 'Turno Diurno 12h (Plantão)',
    description: '07:00 às 19:00 (12h00)',
    startTime: '07:00',
    endTime: '19:00',
    shift: 'DAY',
    category: 'TURNO_COMPLETO',
  },
  {
    value: 'MIXED',
    label: 'Turno Misto / Tarde',
    description: '14:00 às 22:00 (8h00)',
    startTime: '14:00',
    endTime: '22:00',
    shift: 'MIXED',
    category: 'TURNO_COMPLETO',
  },
  {
    value: 'NIGHT',
    label: 'Turno Noturno',
    description: '22:00 às 06:00 (8h00)',
    startTime: '22:00',
    endTime: '06:00',
    shift: 'NIGHT',
    category: 'TURNO_COMPLETO',
  },
  {
    value: 'CUSTOM',
    label: 'Horário Personalizado / Pegada Livre',
    description: 'Definir início e término manualmente',
    shift: 'DAY',
    category: 'CUSTOM',
  },
];

function inferShiftFromTime(startTime?: string, fallbackShift?: string): 'DAY' | 'MIXED' | 'NIGHT' {
  if (!startTime || startTime.length < 2) {
    if (fallbackShift === 'NIGHT' || fallbackShift === 'MIXED') return fallbackShift;
    return 'DAY';
  }
  const hour = Number(startTime.substring(0, 2));
  if (Number.isNaN(hour)) return 'DAY';
  if (hour >= 19 || hour < 5) return 'NIGHT';
  if (hour >= 13) return 'MIXED';
  return 'DAY';
}

function resolveShiftPresetValue(startTime?: string, endTime?: string, shift?: string): string {
  const cleanStart = (startTime || '').trim().substring(0, 5);
  const cleanEnd = (endTime || '').trim().substring(0, 5);
  const matched = TURNOS_E_PEGADAS.find(
    (t) => t.startTime === cleanStart && t.endTime === cleanEnd
  );
  if (matched) return matched.value;
  if (cleanStart && cleanEnd) return 'CUSTOM';
  if (shift === 'NIGHT' || shift === 'MIXED' || shift === 'DAY') return shift;
  return 'PEGADA_0620_0845';
}

function normalizeStr(val?: string | null): string {
  if (!val) return '';
  return val
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface EscalaFormData {
  employeeId: string;
  employeeName?: string;
  locationId: string;
  workPostId: string;
  workPostName?: string;
  travelTripId?: string;
  travelTripName?: string;
  legs?: number;
  scheduleDate: Date;
  scheduleRecurrence?: ScheduleRecurrence;
  shift: string;
  startTime: string;
  endTime: string;
  status: string;
  observations: string;
  routeId?: string;
  routeName?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  clientName?: string;
}

interface EscalaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: EscalaFormData) => Promise<void> | void;
  initialData?: any;
  mode?: 'create' | 'edit' | 'view';
  existingSchedules?: Schedule[];
}

interface ValidationErrors {
  employeeId?: string;
  locationId?: string;
  workPostId?: string;
  scheduleDate?: string;
  shift?: string;
  startTime?: string;
  endTime?: string;
  routeId?: string;
  vehicleId?: string;
}

// Cache em memória para abertura instantânea do formulário sem travar nas 5.422 placas
let cachedUsuarios: { id: string; name: string; role?: string }[] | null = null;
let cachedClientes: { id: string; name: string }[] | null = null;
let cachedPostos: { id: string; name: string; postCode: string; clientId?: string }[] | null = null;
let cachedRotas: { id: string; name: string; code?: string }[] | null = null;
let cachedViagens: { id: string; name: string; tripType: string; legs: number; clientId?: string; clientName?: string }[] | null = null;
let cachedVeiculos: Vehicle[] | null = null;

const EscalaFormModal: React.FC<EscalaFormModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  mode = 'create',
  existingSchedules,
}) => {
  const getDefaultFormData = (): EscalaFormData => {
    const now = new Date();
    return {
      employeeId: '',
      locationId: '',
      workPostId: '',
      travelTripId: '',
      legs: 1,
      scheduleDate: now,
      scheduleRecurrence: isWeekend(now) ? 'WEEKEND' : 'WEEKLY_FIXED',
      shift: 'DAY',
      startTime: '06:20',
      endTime: '08:45',
      status: 'PENDING',
      observations: '',
      routeId: '',
      vehicleId: '',
    };
  };

  const [formData, setFormData] = useState<EscalaFormData>(getDefaultFormData());
  const [shiftPreset, setShiftPreset] = useState<string>('PEGADA_0620_0845');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [allSchedules, setAllSchedules] = useState<Schedule[]>(existingSchedules || []);

  const [usuarios, setUsuarios] = useState<{ id: string; name: string; role?: string }[]>(cachedUsuarios || []);
  const [clientes, setClientes] = useState<{ id: string; name: string }[]>(cachedClientes || []);
  const [postosTrabalho, setPostosTrabalho] = useState<{ id: string; name: string; postCode: string; clientId?: string }[]>(cachedPostos || []);
  const [rotas, setRotas] = useState<{ id: string; name: string; code?: string }[]>(cachedRotas || []);
  const [viagens, setViagens] = useState<{ id: string; name: string; tripType: string; legs: number; clientId?: string; clientName?: string }[]>(cachedViagens || []);
  const [veiculos, setVeiculos] = useState<Vehicle[]>(cachedVeiculos || []);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeBankBalance, setTimeBankBalance] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (existingSchedules && existingSchedules.length > 0) {
      setAllSchedules(existingSchedules);
    }
  }, [existingSchedules]);

  const updateTimeBankBalance = async (employeeId: string) => {
    try {
      const { driverJourneyService } = await import('@/services/driverJourneyService');
      const balance = await driverJourneyService.getTimeBankBalance(employeeId);
      setTimeBankBalance(balance);
    } catch {
      setTimeBankBalance(null);
    }
  };

  // Carrega todos os cadastros em paralelo (Promise.allSettled) e mantém em cache para abrir instantaneamente
  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const loadAllParallel = async () => {
      if (!cachedUsuarios || !cachedVeiculos || !cachedRotas) {
        setIsLoadingLists(true);
      }

      const [empRes, cliRes, wpRes, rtRes, vehRes, tripRes, schedRes] = await Promise.allSettled([
        (async () => {
          const { employeeService } = await import('@/services/employeeService');
          const employees: any = await employeeService.getAllEmployees();
          const list = Array.isArray(employees) ? employees : employees?.content || [];
          return list.map((e: any) => ({
            id: String(e.id),
            name: e.name || e.nome || 'Funcionário sem nome',
            role: e.positionName || e.position?.name || e.cargo || '',
          }));
        })(),
        (async () => {
          const { clientService } = await import('@/services/clientService');
          const clients = await clientService.getAllClients();
          return (clients || []).map((c: any) => ({ id: String(c.id), name: c.name }));
        })(),
        (async () => {
          const { workPostService } = await import('@/services/workPostService');
          const workPosts = await workPostService.getAllWorkPosts();
          return (workPosts || []).map((wp: any) => ({
            id: String(wp.id),
            name: wp.name,
            postCode: wp.postCode || '',
            clientId: wp.clientId ? String(wp.clientId) : wp.client?.id ? String(wp.client.id) : undefined,
          }));
        })(),
        (async () => {
          const { routeService } = await import('@/services/routeService');
          const routes = await routeService.findAllRoutes();
          return (routes || []).map((r: any) => ({
            id: String(r.id),
            name: r.name,
            code: r.code || '',
          }));
        })(),
        (async () => {
          const vehicles = await fleetService.getVehicles();
          return vehicles || [];
        })(),
        (async () => {
          const { travelTripService } = await import('@/services/travelTripService');
          let trips = await travelTripService.findActive().catch(() => []);
          if (!trips || trips.length === 0) {
            trips = await travelTripService.findAll().catch(() => []);
          }
          return (trips || []).map((t: any) => ({
            id: String(t.id),
            name: t.name,
            tripType: t.tripType || 'FRETAMENTO',
            legs: t.legs || 1,
            clientId: t.client?.id ? String(t.client.id) : t.clientId ? String(t.clientId) : undefined,
            clientName: t.client?.name || '',
          }));
        })(),
        (async () => {
          return await scheduleService.findAll();
        })(),
      ]);

      if (!isMounted) return;

      if (empRes.status === 'fulfilled') {
        cachedUsuarios = empRes.value;
        setUsuarios(empRes.value);
      }
      if (cliRes.status === 'fulfilled') {
        cachedClientes = cliRes.value;
        setClientes(cliRes.value);
      }
      if (wpRes.status === 'fulfilled') {
        cachedPostos = wpRes.value;
        setPostosTrabalho(wpRes.value);
      }
      if (rtRes.status === 'fulfilled') {
        cachedRotas = rtRes.value;
        setRotas(rtRes.value);
      }
      if (vehRes.status === 'fulfilled') {
        cachedVeiculos = vehRes.value;
        setVeiculos(vehRes.value);
      }
      if (tripRes.status === 'fulfilled') {
        cachedViagens = tripRes.value;
        setViagens(tripRes.value);
      }
      if (schedRes.status === 'fulfilled' && Array.isArray(schedRes.value)) {
        setAllSchedules(schedRes.value);
      }

      setIsLoadingLists(false);
    };

    loadAllParallel();
    return () => {
      isMounted = false;
    };
  }, [open]);

  // Opções memoizadas para SearchableSelect (incluindo o valor atual da escala em edição para nunca ficar em branco!)
  const employeeOptions = useMemo<SearchableOption[]>(() => {
    const opts: SearchableOption[] = usuarios.map((u) => ({
      value: String(u.id),
      label: u.name,
      subtitle: u.role || undefined,
      badge: u.role && u.role.toLowerCase().includes('motorista') ? 'MOTORISTA' : undefined,
    }));

    const curEmpId = String(formData.employeeId || initialData?.employeeId || initialData?.employee?.id || '');
    const curEmpName = initialData?.employee?.name || formData.employeeName;
    if (curEmpId && curEmpName && !opts.some((o) => String(o.value) === curEmpId)) {
      opts.unshift({
        value: curEmpId,
        label: curEmpName,
        badge: 'MOTORISTA',
        subtitle: 'Motorista da escala atual',
      });
    }
    return opts;
  }, [usuarios, formData.employeeId, formData.employeeName, initialData]);

  const clientOptions = useMemo<SearchableOption[]>(() => {
    const opts: SearchableOption[] = clientes.map((c) => ({
      value: String(c.id),
      label: c.name,
    }));
    const curClientName =
      formData.clientName ||
      initialData?.clientName ||
      initialData?.client?.name ||
      initialData?.workPost?.client?.name ||
      initialData?.travelTrip?.client?.name;
    if (selectedClientId && curClientName && !opts.some((o) => String(o.value) === String(selectedClientId))) {
      opts.unshift({
        value: String(selectedClientId),
        label: curClientName,
      });
    }
    return opts;
  }, [clientes, selectedClientId, formData.clientName, initialData]);

  const postosFiltradosOptions = useMemo<SearchableOption[]>(() => {
    const filtered = selectedClientId
      ? postosTrabalho.filter((p) => String(p.clientId) === String(selectedClientId))
      : postosTrabalho;
    const listToUse = filtered.length > 0 ? filtered : postosTrabalho;
    const opts: SearchableOption[] = listToUse.map((p) => ({
      value: String(p.id),
      label: p.name,
      badge: p.postCode || undefined,
      subtitle:
        selectedClientId && String(p.clientId) !== String(selectedClientId)
          ? 'Outro cliente / Geral'
          : undefined,
    }));
    const curWpId = String(formData.workPostId || initialData?.workPost?.id || '');
    const curWpName = initialData?.workPost?.name || initialData?.location?.name;
    if (curWpId && curWpName && !opts.some((o) => String(o.value) === curWpId)) {
      opts.unshift({
        value: curWpId,
        label: curWpName,
        badge: 'POSTO ATUAL',
      });
    }
    return opts;
  }, [postosTrabalho, selectedClientId, formData.workPostId, initialData]);

  // Lista combinada de Viagens: inclui TravelTrips + Rotas cadastradas para nunca ficar vazia!
  const viagemOptions = useMemo<SearchableOption[]>(() => {
    const options: SearchableOption[] = [];
    const seenIds = new Set<string>();

    const sortedTrips = [...viagens].sort((a, b) => {
      const aMatch = selectedClientId && String(a.clientId) === String(selectedClientId) ? 0 : 1;
      const bMatch = selectedClientId && String(b.clientId) === String(selectedClientId) ? 0 : 1;
      return aMatch - bMatch;
    });

    for (const v of sortedTrips) {
      seenIds.add(String(v.id));
      options.push({
        value: String(v.id),
        label: v.name,
        badge: v.tripType === 'TURISTICO' ? 'TURÍSTICO' : 'VIAGEM',
        subtitle: `${v.legs || 1} pegada(s)${v.clientName ? ` • ${v.clientName}` : ''}`,
      });
    }

    for (const r of rotas) {
      if (!seenIds.has(String(r.id))) {
        seenIds.add(String(r.id));
        options.push({
          value: String(r.id),
          label: r.name,
          badge: r.code || 'ROTA / VIAGEM',
          subtitle: 'Rota Operacional Ativa',
        });
      }
    }

    if (options.length === 0) {
      for (const wp of postosTrabalho) {
        seenIds.add(String(wp.id));
        options.push({
          value: String(wp.id),
          label: wp.name,
          badge: wp.postCode || 'LINHA / POSTO',
        });
      }
    }

    const curTripId = String(formData.travelTripId || formData.routeId || initialData?.travelTrip?.id || initialData?.route?.id || '');
    const curTripLabel =
      initialData?.travelTrip?.name ||
      initialData?.route?.name ||
      initialData?.routeCode ||
      formData.travelTripName ||
      formData.routeName;
    if (curTripId && curTripLabel && !seenIds.has(curTripId)) {
      options.unshift({
        value: curTripId,
        label: curTripLabel,
        badge: 'ROTA / LINHA ATUAL',
      });
    }

    return options;
  }, [viagens, rotas, postosTrabalho, selectedClientId, formData.travelTripId, formData.routeId, formData.travelTripName, formData.routeName, initialData]);

  // Lista de Rotas: inclui Rotas operacionais + TravelTrips para garantir seleção obrigatória
  const rotaOptions = useMemo<SearchableOption[]>(() => {
    const options: SearchableOption[] = [];
    const seenIds = new Set<string>();

    for (const r of rotas) {
      seenIds.add(String(r.id));
      options.push({
        value: String(r.id),
        label: r.name,
        badge: r.code || 'ROTA',
      });
    }

    for (const v of viagens) {
      if (!seenIds.has(String(v.id))) {
        seenIds.add(String(v.id));
        options.push({
          value: String(v.id),
          label: v.name,
          badge: 'VIAGEM / ROTA',
          subtitle: v.clientName || undefined,
        });
      }
    }

    if (options.length === 0) {
      for (const wp of postosTrabalho) {
        seenIds.add(String(wp.id));
        options.push({
          value: String(wp.id),
          label: wp.name,
          badge: wp.postCode || 'ROTA / POSTO',
        });
      }
    }

    const curRouteId = String(formData.routeId || initialData?.routeId || initialData?.route?.id || '');
    const curRouteLabel =
      formData.routeName ||
      initialData?.route?.name ||
      initialData?.routeCode ||
      initialData?.travelTrip?.name ||
      initialData?.workPost?.name;
    if (curRouteId && curRouteLabel && !seenIds.has(curRouteId)) {
      options.unshift({
        value: curRouteId,
        label: curRouteLabel,
        badge: 'ROTA ATUAL',
      });
    }

    return options;
  }, [rotas, viagens, postosTrabalho, formData.routeId, formData.routeName, initialData]);

  // Opções de veículos (5.422 veículos filtrados instantaneamente via SearchableSelect com maxVisibleOptions=50)
  const vehicleOptions = useMemo<SearchableOption[]>(() => {
    const opts: SearchableOption[] = veiculos.map((v) => ({
      value: String(v.id),
      label: v.plate || 'Sem Placa',
      badge: v.fleetNumber ? `Frota ${v.fleetNumber}` : undefined,
      subtitle: [v.brand, v.model].filter(Boolean).join(' ') || undefined,
      keywords: [v.plate || '', v.fleetNumber || '', v.model || '', v.brand || ''],
    }));

    const curVehId = String(formData.vehicleId || initialData?.vehicleId || initialData?.vehicle?.id || '');
    const curPlate = formData.vehiclePlate || initialData?.vehicle?.plate || initialData?.vehiclePlate;
    if (curVehId && curPlate && !opts.some((o) => String(o.value) === curVehId)) {
      opts.unshift({
        value: curVehId,
        label: curPlate,
        badge: 'VEÍCULO ATUAL',
        subtitle: formData.vehicleModel || initialData?.vehicle?.model || initialData?.vehicleModel || 'Veículo da escala',
        keywords: [curPlate],
      });
    }

    return opts;
  }, [veiculos, formData.vehicleId, formData.vehiclePlate, formData.vehicleModel, initialData]);

  // Verifica em tempo real conflito de veículo no mesmo horário ("o mesmo veículo só pode executar uma rota por vez")
  const selectedVehicleObj = useMemo(
    () => veiculos.find((v) => String(v.id) === String(formData.vehicleId)),
    [veiculos, formData.vehicleId]
  );
  const currentVehiclePlate =
    selectedVehicleObj?.plate ||
    formData.vehiclePlate ||
    initialData?.vehicle?.plate ||
    initialData?.vehiclePlate ||
    '';

  const currentScheduleDateStr = useMemo(() => {
    if (!formData.scheduleDate) return new Date().toISOString().substring(0, 10);
    return format(formData.scheduleDate, 'yyyy-MM-dd');
  }, [formData.scheduleDate]);

  // Lista de outras pegadas já alocadas para este mesmo veículo nesta data/regime
  const vehicleExistingPegadas = useMemo(() => {
    if (!formData.vehicleId && !currentVehiclePlate) return [];
    const normPlate = currentVehiclePlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const rec = formData.scheduleRecurrence || 'WEEKLY_FIXED';

    return allSchedules.filter((s) => {
      if (!s || !s.id) return false;
      if (initialData?.id && String(s.id) === String(initialData.id)) return false;
      if (s.status === 'CANCELLED') return false;

      const sDate = (s.scheduleDate || '').substring(0, 10);
      const sRec = resolveScheduleRecurrence(s);
      const sameDay =
        sDate === currentScheduleDateStr ||
        (isScheduleActiveForDate(s, currentScheduleDateStr) && sRec === rec);
      if (!sameDay) return false;

      const sPlate = (s.vehicle?.plate || s.vehiclePlate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const sVehId = String(s.vehicle?.id || s.vehicleId || '');

      return (
        (normPlate && sPlate && normPlate === sPlate) ||
        (formData.vehicleId && formData.vehicleId !== 'vehicle' && sVehId === String(formData.vehicleId))
      );
    });
  }, [allSchedules, formData.vehicleId, currentVehiclePlate, currentScheduleDateStr, formData.scheduleRecurrence, initialData?.id]);

  const vehicleConflict = useMemo(() => {
    if (!formData.vehicleId && !currentVehiclePlate) return { hasConflict: false };
    return checkVehicleScheduleConflict(allSchedules, {
      ignoreScheduleId: mode === 'edit' || initialData?.id ? String(initialData?.id || '') : undefined,
      vehicleId: formData.vehicleId,
      vehiclePlate: currentVehiclePlate,
      routeId: formData.routeId,
      routeName: formData.routeName,
      scheduleDate: currentScheduleDateStr,
      scheduleRecurrence: formData.scheduleRecurrence || 'WEEKLY_FIXED',
      startTime: formData.startTime,
      endTime: formData.endTime,
    });
  }, [
    allSchedules,
    mode,
    initialData?.id,
    formData.vehicleId,
    currentVehiclePlate,
    formData.routeId,
    formData.routeName,
    currentScheduleDateStr,
    formData.scheduleRecurrence,
    formData.startTime,
    formData.endTime,
  ]);

  // Calcula duração do turno
  const calculateShiftDuration = (): string => {
    if (!formData.startTime || !formData.endTime) return '';

    const start = new Date(`2000-01-01T${formData.startTime.substring(0, 5)}`);
    let end = new Date(`2000-01-01T${formData.endTime.substring(0, 5)}`);

    if (end <= start) {
      end = new Date(`2000-01-02T${formData.endTime.substring(0, 5)}`);
    }

    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h${diffMinutes > 0 ? ` ${diffMinutes}min` : ''}`;
  };

  // Validação dos campos obrigatórios + validação de conflito de veículo no mesmo horário
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Motorista (Funcionário) é obrigatório';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Veículo é obrigatório para saber qual veículo está escalado';
    } else if (vehicleConflict.hasConflict && vehicleConflict.message) {
      newErrors.vehicleId = vehicleConflict.message;
    }

    if (!formData.routeId && !formData.travelTripId) {
      newErrors.routeId = 'Rota é obrigatória para saber para qual rota o motorista está escalado';
    }

    if (!formData.scheduleDate) {
      newErrors.scheduleDate = 'Data da escala é obrigatória';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Horário de início é obrigatório';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'Horário de término é obrigatório';
    }

    if (!formData.shift) {
      newErrors.shift = 'Turno / Pegada é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShiftPresetChange = (presetValue: string) => {
    setShiftPreset(presetValue);
    const preset = TURNOS_E_PEGADAS.find((t) => t.value === presetValue);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        shift: preset.shift,
        startTime: preset.startTime ? preset.startTime : prev.startTime,
        endTime: preset.endTime ? preset.endTime : prev.endTime,
      }));
      setErrors((prev) => ({
        ...prev,
        shift: undefined,
        startTime: undefined,
        endTime: undefined,
        vehicleId: undefined,
      }));
    }
  };

  const handleInputChange = (field: keyof EscalaFormData, value: any) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        [field]: value,
      };
      if (field === 'startTime' || field === 'endTime') {
        const nextStart = field === 'startTime' ? String(value) : prev.startTime;
        const nextEnd = field === 'endTime' ? String(value) : prev.endTime;
        next.shift = inferShiftFromTime(nextStart, prev.shift);
        setShiftPreset(resolveShiftPresetValue(nextStart, nextEnd, next.shift));
      }
      return next;
    });

    if (errors[field as keyof ValidationErrors] || field === 'startTime' || field === 'endTime') {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
        ...(field === 'startTime' || field === 'endTime' ? { vehicleId: undefined } : {}),
      }));
    }

    if (field === 'employeeId' && value) {
      updateTimeBankBalance(String(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: vehicleConflict.hasConflict ? 'Conflito de Horário do Veículo' : 'Campos Obrigatórios Pendentes',
        description:
          vehicleConflict.hasConflict && vehicleConflict.message
            ? vehicleConflict.message
            : 'Preencha Motorista, Veículo, Data, Horário e Rota para salvar a escala.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedEmpOpt = employeeOptions.find((emp) => String(emp.value) === String(formData.employeeId));
      const selectedRouteOpt = rotaOptions.find((r) => String(r.value) === String(formData.routeId || formData.travelTripId));
      const selectedTripOpt = viagemOptions.find((v) => String(v.value) === String(formData.travelTripId || formData.routeId));
      const selectedVehicle = veiculos.find((v) => String(v.id) === String(formData.vehicleId));
      const selectedWorkPostOpt = postosFiltradosOptions.find((wp) => String(wp.value) === String(formData.workPostId));

      const isRealTravelTrip = viagens.some((v) => String(v.id) === String(formData.travelTripId));
      const isRealRoute = rotas.some((r) => String(r.id) === String(formData.routeId));

      const selectedClientObj = clientes.find((c) => String(c.id) === String(selectedClientId));
      const cleanStart = (formData.startTime || '06:20').trim().substring(0, 5);
      const cleanEnd = (formData.endTime || '08:45').trim().substring(0, 5);
      const effectiveShift = inferShiftFromTime(cleanStart, formData.shift);

      const resolvedRouteLabel =
        selectedRouteOpt?.label ||
        selectedTripOpt?.label ||
        formData.routeName ||
        initialData?.route?.name ||
        initialData?.routeCode ||
        initialData?.travelTrip?.name;

      const payloadToSave: EscalaFormData = {
        ...formData,
        employeeId: formData.employeeId,
        employeeName: selectedEmpOpt?.label || formData.employeeName || initialData?.employee?.name,
        scheduleRecurrence:
          formData.scheduleRecurrence || (isWeekend(formData.scheduleDate) ? 'WEEKEND' : 'WEEKLY_FIXED'),
        shift: effectiveShift,
        startTime: cleanStart,
        endTime: cleanEnd,
        locationId: formData.locationId || formData.workPostId || selectedClientId || '',
        workPostId: formData.workPostId || '',
        workPostName: selectedWorkPostOpt?.label || initialData?.workPost?.name,
        travelTripId: isRealTravelTrip ? formData.travelTripId : undefined,
        travelTripName: selectedTripOpt?.label || resolvedRouteLabel,
        routeId: isRealRoute ? formData.routeId : formData.routeId || formData.travelTripId,
        routeName: resolvedRouteLabel,
        vehicleId: formData.vehicleId,
        vehiclePlate:
          selectedVehicle?.plate ||
          formData.vehiclePlate ||
          initialData?.vehicle?.plate ||
          initialData?.vehiclePlate,
        vehicleModel:
          selectedVehicle?.model ||
          formData.vehicleModel ||
          initialData?.vehicle?.model ||
          initialData?.vehicleModel,
        clientName:
          selectedClientObj?.name ||
          formData.clientName ||
          initialData?.clientName ||
          initialData?.client?.name ||
          initialData?.workPost?.client?.name ||
          initialData?.travelTrip?.client?.name,
      };

      await onSave(payloadToSave);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar escala',
        description: error?.message || 'Verifique os dados informados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1) Inicializa os dados do formulário ao abrir o modal ou trocar a escala selecionada (sem resetar quando listas assíncronas carregam)
  useEffect(() => {
    if (!open) {
      setErrors({});
      setIsSubmitting(false);
      return;
    }

    const getProperty = (obj: any, path: string): string => {
      return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj) || '';
    };

    const hasData =
      initialData &&
      (initialData.id ||
        initialData.employeeId ||
        getProperty(initialData, 'employee.id') ||
        getProperty(initialData, 'employee.name'));

    if (initialData && (mode === 'edit' || mode === 'view' || hasData)) {
      let scheduleDateValue: Date;
      if (initialData.scheduleDate) {
        if (initialData.scheduleDate instanceof Date) {
          scheduleDateValue = initialData.scheduleDate;
        } else if (typeof initialData.scheduleDate === 'string') {
          scheduleDateValue = parseLocalDate(initialData.scheduleDate);
        } else {
          scheduleDateValue = new Date();
        }
      } else {
        scheduleDateValue = new Date();
      }

      const employeeId = String(initialData.employeeId || getProperty(initialData, 'employee.id') || '');
      const employeeName = String(getProperty(initialData, 'employee.name') || initialData.employeeName || '');
      const workPostId = String(initialData.workPostId || getProperty(initialData, 'workPost.id') || '');
      const locationId = String(initialData.locationId || getProperty(initialData, 'location.id') || workPostId || '');

      const rawStart =
        initialData.startTime ||
        resolveScheduleStartTime(initialData) ||
        '08:00';
      const rawEnd =
        initialData.endTime ||
        resolveScheduleEndTime(initialData) ||
        '17:00';

      const startTime = String(rawStart).trim().substring(0, 5);
      const endTime = String(rawEnd).trim().substring(0, 5);
      const shift = String(initialData.shift || inferShiftFromTime(startTime));

      const rawStatus = initialData.status || 'PENDING';
      const validStatus: ScheduleStatus = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'COMPLETED'].includes(rawStatus)
        ? (rawStatus as ScheduleStatus)
        : 'PENDING';

      const rawRouteName = String(
        initialData.routeCode ||
          getProperty(initialData, 'route.name') ||
          getProperty(initialData, 'travelTrip.name') ||
          getProperty(initialData, 'workPost.name') ||
          ''
      );
      const rawRouteId = String(
        initialData.routeId ||
          getProperty(initialData, 'route.id') ||
          getProperty(initialData, 'travelTrip.id') ||
          (rawRouteName ? `route-${rawRouteName}` : '')
      );
      const travelTripId = String(
        initialData.travelTripId ||
          getProperty(initialData, 'travelTrip.id') ||
          rawRouteId ||
          ''
      );

      const rawPlate = String(
        getProperty(initialData, 'vehicle.plate') ||
          initialData.vehiclePlate ||
          ''
      );
      const rawVehicleId = String(
        initialData.vehicleId ||
          getProperty(initialData, 'vehicle.id') ||
          (rawPlate ? `veh-${rawPlate}` : '')
      );
      const rawVehicleModel = String(
        getProperty(initialData, 'vehicle.model') ||
          initialData.vehicleModel ||
          ''
      );

      const legs = Number(initialData.legs || getProperty(initialData, 'travelTrip.legs') || 1);
      const clientName = String(
        initialData.clientName ||
          getProperty(initialData, 'client.name') ||
          getProperty(initialData, 'workPost.client.name') ||
          getProperty(initialData, 'travelTrip.client.name') ||
          ''
      );

      setShiftPreset(resolveShiftPresetValue(startTime, endTime, shift));
      setFormData({
        employeeId,
        employeeName,
        locationId,
        workPostId,
        travelTripId,
        travelTripName: getProperty(initialData, 'travelTrip.name') || rawRouteName,
        legs,
        scheduleDate: scheduleDateValue,
        scheduleRecurrence: initialData.scheduleRecurrence || resolveScheduleRecurrence(initialData),
        shift,
        startTime,
        endTime,
        status: validStatus,
        observations: String(initialData.observations || ''),
        routeId: rawRouteId || travelTripId,
        routeName: rawRouteName,
        vehicleId: rawVehicleId,
        vehiclePlate: rawPlate,
        vehicleModel: rawVehicleModel,
        clientName,
      });

      const clientIdFromData =
        initialData.clientId ||
        getProperty(initialData, 'workPost.clientId') ||
        getProperty(initialData, 'workPost.client.id') ||
        getProperty(initialData, 'travelTrip.client.id') ||
        getProperty(initialData, 'client.id');

      if (clientIdFromData) {
        setSelectedClientId(String(clientIdFromData));
      } else if (clientName) {
        setSelectedClientId(`client-${clientName}`);
      } else {
        setSelectedClientId('');
      }
    } else {
      const def = getDefaultFormData();
      setFormData(def);
      setShiftPreset(resolveShiftPresetValue(def.startTime, def.endTime, def.shift));
      setSelectedClientId('');
    }
  }, [initialData?.id, open, mode]);

  // 2) Reconcilia IDs automaticamente quando as listas (motoristas, veículos, rotas, clientes) terminam de carregar
  useEffect(() => {
    if (!open || (!initialData && mode === 'create')) return;

    setFormData((prev) => {
      let changed = false;
      const next = { ...prev };

      // Reconciliar motorista por nome se o ID não bater na lista de funcionários
      if (usuarios.length > 0) {
        const existsEmp = usuarios.some((u) => String(u.id) === String(prev.employeeId));
        if (!existsEmp) {
          const targetEmpName = normalizeStr(prev.employeeName || initialData?.employee?.name);
          if (targetEmpName) {
            const foundEmp = usuarios.find(
              (u) =>
                normalizeStr(u.name) === targetEmpName ||
                normalizeStr(u.name).includes(targetEmpName) ||
                targetEmpName.includes(normalizeStr(u.name))
            );
            if (foundEmp) {
              next.employeeId = String(foundEmp.id);
              next.employeeName = foundEmp.name;
              changed = true;
            }
          }
        }
      }

      // Reconciliar veículo pela placa se o ID estiver vazio ou sintético
      if (veiculos.length > 0) {
        const existsVeh = veiculos.some((v) => String(v.id) === String(prev.vehicleId));
        if (!existsVeh) {
          const targetPlate = (prev.vehiclePlate || initialData?.vehicle?.plate || initialData?.vehiclePlate || '')
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase();
          if (targetPlate) {
            const foundVeh = veiculos.find(
              (v) => (v.plate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === targetPlate
            );
            if (foundVeh) {
              next.vehicleId = String(foundVeh.id);
              next.vehiclePlate = foundVeh.plate;
              next.vehicleModel = foundVeh.model;
              changed = true;
            }
          }
        }
      }

      // Reconciliar rota pelo nome se o ID estiver vazio ou sintético
      const allRoutesAndTrips = [...rotas, ...viagens];
      if (allRoutesAndTrips.length > 0) {
        const existsRoute = allRoutesAndTrips.some((r) => String(r.id) === String(prev.routeId));
        if (!existsRoute) {
          const targetRouteName = normalizeStr(
            prev.routeName ||
              initialData?.routeCode ||
              initialData?.route?.name ||
              initialData?.travelTrip?.name
          );
          if (targetRouteName) {
            const foundRoute = allRoutesAndTrips.find(
              (r) =>
                normalizeStr(r.name) === targetRouteName ||
                normalizeStr(r.name).includes(targetRouteName) ||
                targetRouteName.includes(normalizeStr(r.name))
            );
            if (foundRoute) {
              next.routeId = String(foundRoute.id);
              next.routeName = foundRoute.name;
              if (!next.travelTripId || next.travelTripId.startsWith('route-')) {
                next.travelTripId = String(foundRoute.id);
              }
              changed = true;
            }
          }
        }
      }

      return changed ? next : prev;
    });

    // Reconciliar cliente pelo nome ou pelo posto de trabalho
    if (clientes.length > 0) {
      const existsCli = clientes.some((c) => String(c.id) === String(selectedClientId));
      if (!existsCli) {
        const targetCliName = normalizeStr(
          initialData?.clientName ||
            initialData?.client?.name ||
            initialData?.workPost?.client?.name ||
            initialData?.travelTrip?.client?.name
        );
        if (targetCliName) {
          const foundCli = clientes.find(
            (c) =>
              normalizeStr(c.name) === targetCliName ||
              normalizeStr(c.name).includes(targetCliName)
          );
          if (foundCli) {
            setSelectedClientId(String(foundCli.id));
          }
        } else if (formData.workPostId && postosTrabalho.length > 0) {
          const wp = postosTrabalho.find((p) => String(p.id) === String(formData.workPostId));
          if (wp?.clientId) {
            setSelectedClientId(String(wp.clientId));
          }
        }
      }
    }
  }, [open, initialData, mode, usuarios, veiculos, rotas, viagens, clientes, postosTrabalho]);

  const initialEmployeeName =
    formData.employeeName ||
    initialData?.employee?.name ||
    usuarios.find((u) => String(u.id) === String(formData.employeeId))?.name;
  const initialVehicleLabel =
    currentVehiclePlate ||
    initialData?.vehicle?.plate ||
    initialData?.vehiclePlate;
  const initialRouteLabel =
    formData.routeName ||
    initialData?.routeCode ||
    initialData?.route?.name ||
    initialData?.travelTrip?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-seguranca-graphite text-seguranca-lightgray border-gray-700 sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-gray-700/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-seguranca-yellow/20 rounded-lg flex items-center justify-center">
              <CalendarLucide className="w-5 h-5 text-seguranca-yellow" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {mode === 'edit' || initialData?.id ? 'Edição de Escala' : 'Nova Escala de Motorista'}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-0.5 text-xs">
                Campos obrigatórios (*): Motorista (Funcionário), Veículo, Data, Horário e Rota.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* 1. Motorista (Funcionário) - OBRIGATÓRIO */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-seguranca-yellow" />
              <Label className="text-sm font-semibold">
                Motorista (Funcionário) <span className="text-red-400">*</span>
              </Label>
              {timeBankBalance && (
                <Badge
                  variant="outline"
                  className={`ml-auto border-gray-600 ${
                    timeBankBalance.startsWith('-') ? 'text-red-400' : 'text-green-400'
                  }`}
                >
                  Banco: {timeBankBalance}
                </Badge>
              )}
            </div>
            <SearchableSelect
              value={String(formData.employeeId || '')}
              fallbackLabel={initialEmployeeName}
              onChange={(val) => handleInputChange('employeeId', val)}
              options={employeeOptions}
              placeholder={isLoadingLists ? 'Carregando motoristas...' : 'Digite ou selecione o motorista / funcionário...'}
              searchPlaceholder="Buscar motorista por nome..."
              maxVisibleOptions={50}
              disabled={mode === 'view'}
            />
            {errors.employeeId && (
              <div className="flex items-center gap-1.5 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.employeeId}
              </div>
            )}
          </div>

          {/* 2. Veículo - OBRIGATÓRIO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-purple-400" />
                <Label className="text-sm font-semibold">
                  Veículo Escalado <span className="text-red-400">*</span>
                </Label>
                <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  1 rota por vez (sem sobreposição de horário)
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                {veiculos.length > 0 ? `${veiculos.length} veículos disponíveis` : ''}
              </span>
            </div>
            <SearchableSelect
              value={String(formData.vehicleId || '')}
              fallbackLabel={initialVehicleLabel}
              onChange={(val) => handleInputChange('vehicleId', val)}
              options={vehicleOptions}
              placeholder={isLoadingLists ? 'Carregando frota...' : 'Digite a placa, prefixo/frota ou modelo do veículo...'}
              searchPlaceholder="Digite placa (ex: SHZ) ou número de frota (ex: 5422)..."
              maxVisibleOptions={50}
              disabled={mode === 'view'}
            />
            {vehicleExistingPegadas.length > 0 && (
              <div className="p-2.5 rounded-lg bg-seguranca-black/70 border border-gray-700 text-xs space-y-1">
                <div className="text-[11px] font-semibold text-gray-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-seguranca-yellow" />
                  Horários já ocupados por este veículo ({currentVehiclePlate}) nesta data/regime:
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {vehicleExistingPegadas.map((peg) => {
                    const pStart = resolveScheduleStartTime(peg);
                    const pEnd = resolveScheduleEndTime(peg);
                    const pRoute = peg.routeCode || peg.route?.name || peg.travelTrip?.name || 'Rota';
                    const pDrv = peg.employee?.name || 'Motorista';
                    return (
                      <Badge
                        key={peg.id}
                        variant="outline"
                        className="text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-200 font-mono"
                      >
                        🚌 {pStart} às {pEnd} • {pRoute} ({pDrv})
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
            {(errors.vehicleId || vehicleConflict.hasConflict) && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errors.vehicleId || vehicleConflict.message}</span>
              </div>
            )}
          </div>

          {/* 3. Rota e Viagem - ROTA OBRIGATÓRIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rota Associada (Obrigatória) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <RouteIcon className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-sm font-semibold">
                  Rota <span className="text-red-400">*</span>
                </Label>
              </div>
              <SearchableSelect
                value={String(formData.routeId || '')}
                fallbackLabel={initialRouteLabel}
                onChange={(val) => {
                  handleInputChange('routeId', val);
                  if (!formData.travelTripId && val) {
                    handleInputChange('travelTripId', val);
                  }
                }}
                options={rotaOptions}
                placeholder="Selecione a rota da escala..."
                searchPlaceholder="Buscar rota por nome ou código..."
                maxVisibleOptions={50}
                disabled={mode === 'view'}
              />
              {errors.routeId && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.routeId}
                </div>
              )}
            </div>

            {/* Viagem (Integrada com Rotas e Viagens Ativas) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-sm font-semibold">Viagem / Linha</Label>
              </div>
              <SearchableSelect
                value={String(formData.travelTripId || formData.routeId || '')}
                fallbackLabel={initialData?.travelTrip?.name || initialRouteLabel}
                onChange={(val) => {
                  handleInputChange('travelTripId', val);
                  if (!formData.routeId && val) {
                    handleInputChange('routeId', val);
                  }
                  const trip = viagens.find((v) => String(v.id) === String(val));
                  if (trip?.legs) {
                    handleInputChange('legs', trip.legs);
                  }
                }}
                options={viagemOptions}
                placeholder="Selecione uma viagem ou linha..."
                searchPlaceholder="Buscar viagem ou rota..."
                maxVisibleOptions={50}
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {/* Regime / Vigência da Escala: Fixa Semanal vs Final de Semana (FDS) */}
          <div className="p-3.5 rounded-xl bg-seguranca-black/60 border border-seguranca-yellow/30 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-sm font-bold text-seguranca-yellow flex items-center gap-2">
                <CalendarLucide className="w-4 h-4" />
                Regime / Vigência da Escala <span className="text-red-400">*</span>
              </Label>
              <span className="text-[11px] text-gray-400">
                A escala fixa semanal vale todos os dias da semana até ser editada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                disabled={mode === 'view'}
                onClick={() => handleInputChange('scheduleRecurrence', 'WEEKLY_FIXED')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  (formData.scheduleRecurrence || 'WEEKLY_FIXED') === 'WEEKLY_FIXED'
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md'
                    : 'bg-seguranca-black border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300">📅 Escala Fixa Semanal</div>
                <div className="text-[10px] text-gray-300 mt-0.5">
                  Segunda a Sexta (mantida fixa até editar)
                </div>
              </button>

              <button
                type="button"
                disabled={mode === 'view'}
                onClick={() => handleInputChange('scheduleRecurrence', 'WEEKEND')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  formData.scheduleRecurrence === 'WEEKEND'
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-md'
                    : 'bg-seguranca-black border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-xs font-bold text-amber-300">🗓️ Escala Final de Semana (FDS)</div>
                <div className="text-[10px] text-gray-300 mt-0.5">
                  Sábado e Domingo (escala de plantão/FDS)
                </div>
              </button>

              <button
                type="button"
                disabled={mode === 'view'}
                onClick={() => handleInputChange('scheduleRecurrence', 'SINGLE_DAY')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  formData.scheduleRecurrence === 'SINGLE_DAY'
                    ? 'bg-blue-500/20 border-blue-500 text-white shadow-md'
                    : 'bg-seguranca-black border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                <div className="text-xs font-bold text-blue-300">📌 Data Específica / Extra</div>
                <div className="text-[10px] text-gray-300 mt-0.5">
                  Válida apenas na data selecionada abaixo
                </div>
              </button>
            </div>
          </div>

          {/* 4. Data, Turno e Horários (Data e Horário OBRIGATÓRIOS) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-seguranca-yellow" />
                <Label htmlFor="scheduleDate" className="text-sm font-semibold">
                  Data de Referência / Início <span className="text-red-400">*</span>
                </Label>
              </div>
              <Input
                id="scheduleDate"
                type="date"
                value={formData.scheduleDate ? format(formData.scheduleDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    const newDate = new Date(year, month - 1, day);
                    handleInputChange('scheduleDate', newDate);
                    if (isWeekend(newDate) && formData.scheduleRecurrence === 'WEEKLY_FIXED') {
                      handleInputChange('scheduleRecurrence', 'WEEKEND');
                    } else if (!isWeekend(newDate) && formData.scheduleRecurrence === 'WEEKEND') {
                      handleInputChange('scheduleRecurrence', 'WEEKLY_FIXED');
                    }
                  }
                }}
                disabled={mode === 'view'}
                className={`bg-seguranca-black border transition-colors h-10 text-seguranca-lightgray ${
                  errors.scheduleDate
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow'
                }`}
              />
              {formData.scheduleDate && isWeekend(formData.scheduleDate) && (
                <Badge variant="secondary" className="text-[10px] bg-orange-500/20 text-orange-300">
                  Final de semana
                </Badge>
              )}
              {errors.scheduleDate && (
                <div className="flex items-center gap-1.5 text-red-400 text-xs">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.scheduleDate}
                </div>
              )}
            </div>

            {/* Turno / Faixa de Pegada */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-seguranca-yellow" />
                  <Label htmlFor="shift" className="text-sm font-semibold">
                    Turno / Faixa de Pegada <span className="text-red-400">*</span>
                  </Label>
                </div>
                <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-300">
                  {formData.shift === 'NIGHT'
                    ? 'Noturno'
                    : formData.shift === 'MIXED'
                      ? 'Misto/Tarde'
                      : 'Diurno'}
                </Badge>
              </div>
              <Select
                value={shiftPreset || 'PEGADA_0620_0845'}
                onValueChange={(value) => handleShiftPresetChange(value)}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="bg-seguranca-black border border-gray-600 hover:border-gray-500 focus:border-seguranca-yellow h-10">
                  <SelectValue placeholder="Selecione a pegada ou turno" />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10095] max-h-80">
                  {TURNOS_E_PEGADAS.map((turno) => (
                    <SelectItem key={turno.value} value={turno.value} className="hover:bg-seguranca-black/50">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="font-medium">{turno.label}</span>
                        <span className="text-xs text-seguranca-yellow font-mono">
                          {turno.value === 'CUSTOM' && formData.startTime && formData.endTime
                            ? `(${formData.startTime} às ${formData.endTime})`
                            : `(${turno.description})`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Horário de Início e Horário de Término - OBRIGATÓRIOS */}
          <div className="p-3.5 rounded-lg bg-seguranca-black/40 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-sm font-semibold">
                  Horário da Pegada / Execução da Rota (Tolerância ±10 min) <span className="text-red-400">*</span>
                </Label>
              </div>
              {formData.startTime && formData.endTime && (
                <span className="text-xs text-seguranca-yellow font-medium">
                  Duração: {calculateShiftDuration()}
                </span>
              )}
            </div>

            {/* Atalhos Rápidos de Pegadas Curtas */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-gray-400 block">
                Atalhos de pegada curta (o motorista pode fazer uma rota curta e depois outra rota em outro horário):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {TURNOS_E_PEGADAS.filter((t) => t.category === 'PEGADA_CURTA').map((p) => {
                  const isSelected =
                    formData.startTime === p.startTime && formData.endTime === p.endTime;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      disabled={mode === 'view'}
                      onClick={() => handleShiftPresetChange(p.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all border ${
                        isSelected
                          ? 'bg-seguranca-yellow text-seguranca-black border-seguranca-yellow font-bold shadow-sm'
                          : 'bg-seguranca-black text-gray-300 border-gray-700 hover:border-seguranca-yellow/50 hover:text-white'
                      }`}
                    >
                      {p.startTime} às {p.endTime}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs text-gray-300">
                  Horário de Início / Partida <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime || ''}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  disabled={mode === 'view'}
                  className={`bg-seguranca-black border h-10 ${
                    errors.startTime ? 'border-red-500' : 'border-gray-600 focus:border-seguranca-yellow'
                  }`}
                />
                {errors.startTime && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.startTime}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs text-gray-300">
                  Horário de Término Previsto <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime || ''}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  disabled={mode === 'view'}
                  className={`bg-seguranca-black border h-10 ${
                    errors.endTime ? 'border-red-500' : 'border-gray-600 focus:border-seguranca-yellow'
                  }`}
                />
                {errors.endTime && (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.endTime}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Cliente, Posto de Trabalho e Pegadas (Complementares) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-xs font-medium text-gray-300">Cliente / Empresa</Label>
              </div>
              <SearchableSelect
                value={String(selectedClientId || '')}
                fallbackLabel={
                  formData.clientName ||
                  initialData?.clientName ||
                  initialData?.workPost?.client?.name ||
                  initialData?.client?.name
                }
                onChange={(val) => {
                  setSelectedClientId(val);
                  const foundCli = clientOptions.find((c) => String(c.value) === String(val));
                  if (foundCli) {
                    handleInputChange('clientName', foundCli.label);
                  }
                }}
                options={clientOptions}
                placeholder="Selecione o cliente..."
                searchPlaceholder="Buscar cliente..."
                maxVisibleOptions={50}
                disabled={mode === 'view'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-xs font-medium text-gray-300">Posto de Trabalho / Base</Label>
              </div>
              <SearchableSelect
                value={String(formData.workPostId || '')}
                fallbackLabel={initialData?.workPost?.name || initialData?.location?.name}
                onChange={(val) => {
                  handleInputChange('workPostId', val);
                  handleInputChange('locationId', val);
                }}
                options={postosFiltradosOptions}
                placeholder="Selecione o posto..."
                searchPlaceholder="Buscar posto..."
                maxVisibleOptions={50}
                disabled={mode === 'view'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Footprints className="w-4 h-4 text-seguranca-yellow" />
                <Label className="text-xs font-medium text-gray-300">Pegadas (Trechos)</Label>
              </div>
              <Select
                value={String(formData.legs || 1)}
                onValueChange={(value) => handleInputChange('legs', Number.parseInt(value, 10))}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="bg-seguranca-black border border-gray-600 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10095]">
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} pegada{n > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status e Observações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-300">Status da Escala</Label>
              <Select
                value={formData.status || 'PENDING'}
                onValueChange={(value) => handleInputChange('status', value as ScheduleStatus)}
                disabled={mode === 'view'}
              >
                <SelectTrigger className="bg-seguranca-black border border-gray-600 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-seguranca-graphite border-gray-600 z-[10095]">
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                  <SelectItem value="COMPLETED">Concluída</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observations" className="text-xs font-medium text-gray-300">
                Observações
              </Label>
              <Textarea
                id="observations"
                value={formData.observations || ''}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Observações da escala (opcional)"
                disabled={mode === 'view'}
                className="bg-seguranca-black border border-gray-600 resize-none h-10 min-h-[40px]"
                rows={1}
              />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-700">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="bg-seguranca-black border-gray-600 hover:bg-seguranca-graphite"
              >
                {mode === 'view' ? 'Fechar' : 'Cancelar'}
              </Button>
              {mode !== 'view' && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-seguranca-red hover:bg-seguranca-red/80 text-white font-semibold"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {mode === 'edit' || initialData?.id ? 'Atualizar Escala' : 'Criar Escala'}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EscalaFormModal;
