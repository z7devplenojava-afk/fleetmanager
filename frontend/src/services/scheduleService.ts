import { format } from 'date-fns';
import api from '@/lib/axios';
import escalaService from '@/services/escalaService';

// --- Interfaces ---

export interface ScheduleEmployee {
  id: string;
  name: string;
  position?: string;
}

export interface ScheduleLocation {
  id: string;
  name: string;
}

export interface ScheduleWorkPost {
  id: string;
  name: string;
  postCode: string;
  clientId?: string;
  client?: { id: string; name: string };
  shiftStart?: string;
  shiftEnd?: string;
}

export interface ScheduleRoute {
  id: string;
  name: string;
}

export interface ScheduleVehicle {
  id: string;
  plate: string;
  model?: string;
  fleetNumber?: string;
}

export interface ScheduleTravelTrip {
  id: string;
  name: string;
  code?: string;
  tripType?: string;
  legs?: number;
  originAddress?: string;
  destinationAddress?: string;
  client?: { id: string; name: string };
}

export interface ScheduleClient {
  id: string;
  name: string;
}

export type Shift = 'DAY' | 'NIGHT' | 'MIXED';

export type ScheduleStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'CANCELLED' | 'COMPLETED';

export type PointApprovalStatus = 'NONE' | 'APPROVED' | 'PENDING_TRAFFIC_APPROVAL' | 'REJECTED';

export type ScheduleRecurrence = 'WEEKLY_FIXED' | 'WEEKEND' | 'SINGLE_DAY';

export interface Schedule {
  id: string;
  employeeId?: string;
  employee: ScheduleEmployee;
  scheduleDate: string; // YYYY-MM-DD
  scheduleRecurrence?: ScheduleRecurrence;
  shift: Shift;
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  location: ScheduleLocation;
  workPost?: ScheduleWorkPost;
  travelTrip?: ScheduleTravelTrip;
  legs?: number;
  client?: ScheduleClient;
  clientName?: string;
  routeCode?: string;
  passengersCount?: number;
  status: ScheduleStatus;
  observations?: string;
  routeId?: string;
  route?: ScheduleRoute;
  vehicleId?: string;
  vehicle?: ScheduleVehicle;
  vehiclePlate?: string;
  vehicleModel?: string;
  initialKm?: number;
  finalKm?: number;
  pointRegisteredAt?: string;
  pointStatus?: PointApprovalStatus;
  pointJustification?: string;
  pointApprovedBy?: string;
  pointApprovedAt?: string;
  tripPhotosJson?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  direction?: 'IDA' | 'RETORNO';
  delayMinutes?: number;
  delayReason?: string;
  delayReportedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleDTO {
  employeeId: string;
  locationId?: string;
  workPostId?: string;
  travelTripId?: string;
  legs?: number;
  scheduleDate: string; // YYYY-MM-DD
  scheduleRecurrence?: ScheduleRecurrence;
  shift: Shift;
  startTime?: string;
  endTime?: string;
  clientName?: string;
  routeCode?: string;
  passengersCount?: number;
  status: ScheduleStatus;
  observations?: string;
  routeId?: string;
  vehicleId?: string;
  initialKm?: number;
  finalKm?: number;
  pointStatus?: PointApprovalStatus;
  pointJustification?: string;
  tripPhotosJson?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  direction?: 'IDA' | 'RETORNO';
  delayMinutes?: number;
  delayReason?: string;
  delayReportedAt?: string;
}

export type UpdateScheduleDTO = Partial<CreateScheduleDTO>;

const OVERLAY_STORAGE_KEY = 'fleet_schedule_execution_overlay_v1';
const LOCAL_PONTO_SCHEDULES_KEY = 'fleet_driver_ponto_schedules_v1';

interface ScheduleOverlayData {
  employeeId?: string;
  employeeName?: string;
  scheduleDate?: string;
  scheduleRecurrence?: ScheduleRecurrence;
  shift?: Shift;
  legs?: number;
  workPostId?: string;
  workPostName?: string;
  clientId?: string;
  startTime?: string;
  endTime?: string;
  clientName?: string;
  routeCode?: string;
  passengersCount?: number;
  routeId?: string;
  routeName?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  travelTripId?: string;
  travelTripName?: string;
  initialKm?: number;
  finalKm?: number;
  pointRegisteredAt?: string;
  pointStatus?: PointApprovalStatus;
  pointJustification?: string;
  pointApprovedBy?: string;
  pointApprovedAt?: string;
  tripPhotosJson?: string;
  startLatitude?: number;
  startLongitude?: number;
  startAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  endAddress?: string;
  direction?: 'IDA' | 'RETORNO';
  delayMinutes?: number;
  delayReason?: string;
  delayReportedAt?: string;
  status?: ScheduleStatus;
  observations?: string;
  deleted?: boolean;
}

export function resolveScheduleRecurrence(schedule?: Partial<Schedule> | null): ScheduleRecurrence {
  if (!schedule) return 'WEEKLY_FIXED';
  if (schedule.scheduleRecurrence) return schedule.scheduleRecurrence;

  const obs = (schedule.observations || '').toUpperCase();
  if (obs.includes('[FDS]') || obs.includes('FINAL DE SEMANA') || obs.includes('FIM DE SEMANA')) {
    return 'WEEKEND';
  }
  if (obs.includes('[DATA UNICA]') || obs.includes('[DATA ÚNICA]') || obs.includes('[EXTRA]')) {
    return 'SINGLE_DAY';
  }

  if (schedule.scheduleDate) {
    const clean = schedule.scheduleDate.substring(0, 10);
    const [y, m, d] = clean.split('-').map(Number);
    if (y && m && d) {
      const dt = new Date(y, m - 1, d);
      const dayOfWeek = dt.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'WEEKEND';
      }
    }
  }

  // Por padrão, as escalas cadastradas em dias úteis permanecem fixas durante a semana até o usuário editar
  return 'WEEKLY_FIXED';
}

export function isScheduleActiveForDate(schedule: Schedule, targetDateStr: string): boolean {
  if (!schedule) return false;
  const cleanTarget = (targetDateStr || '').substring(0, 10);
  const cleanSchedule = (schedule.scheduleDate || '').substring(0, 10);
  if (!cleanTarget) return true;
  if (cleanSchedule === cleanTarget) return true;

  const recurrence = resolveScheduleRecurrence(schedule);
  if (recurrence === 'SINGLE_DAY') {
    return cleanSchedule === cleanTarget;
  }

  const [y, m, d] = cleanTarget.split('-').map(Number);
  if (!y || !m || !d) return cleanSchedule === cleanTarget;
  const targetDate = new Date(y, m - 1, d);
  const dayOfWeek = targetDate.getDay();
  const isTargetWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (recurrence === 'WEEKEND') {
    return isTargetWeekend;
  }
  // WEEKLY_FIXED: ativa durante toda a semana (Seg a Sex) até que o gestor a edite/exclua
  return !isTargetWeekend;
}

export function matchesScheduleModeFilter(
  schedule: Schedule,
  mode: 'ALL' | 'WEEKLY_FIXED' | 'WEEKEND'
): boolean {
  if (mode === 'ALL') return true;
  const rec = resolveScheduleRecurrence(schedule);
  if (mode === 'WEEKEND') return rec === 'WEEKEND';
  return rec === 'WEEKLY_FIXED' || rec === 'SINGLE_DAY';
}

export function inferDirectionFromRouteCode(routeCode?: string, rowIndex?: number): 'IDA' | 'RETORNO' {
  const upper = (routeCode || '').toUpperCase();
  if (
    upper.startsWith('04') ||
    upper.startsWith('05') ||
    upper.startsWith('07') ||
    upper.startsWith('10') ||
    upper.startsWith('11') ||
    upper.startsWith('12') ||
    upper.includes('RETORNO') ||
    upper.includes('VOLTA') ||
    upper.includes('FÁBRICA/CASA') ||
    upper.includes('FÁBRICA/PONTO') ||
    upper.includes('FÁBRICA/GARAGEM') ||
    upper.includes('PONTO/CASA') ||
    upper.includes('GARAGEM/CASA')
  ) {
    return 'RETORNO';
  }
  if (typeof rowIndex === 'number' && rowIndex % 2 === 1 && !upper.startsWith('01') && !upper.startsWith('02') && !upper.startsWith('03')) {
    return 'RETORNO';
  }
  return 'IDA';
}

export async function reverseGeocodeAddress(latitude: number, longitude: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data?.address) {
        const a = data.address;
        const road = a.road || a.pedestrian || a.street || a.avenue || '';
        const num = a.house_number ? `, ${a.house_number}` : '';
        const sub = a.suburb || a.neighbourhood || a.district || '';
        const city = a.city || a.town || a.municipality || '';
        const state = a['ISO3166-2-lvl4'] ? a['ISO3166-2-lvl4'].replace('BR-', '') : a.state || '';
        const parts = [
          road ? `${road}${num}` : '',
          sub && sub !== road ? sub : '',
          city ? (state ? `${city}/${state}` : city) : state,
        ].filter(Boolean);
        if (parts.length > 0) return parts.join(' - ');
      }
      if (data?.display_name) return data.display_name;
    }
  } catch {
    // fallback below
  }
  return `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
}

export async function captureDriverGeolocationAndAddress(
  optionsOrPhase?:
    | 'START'
    | 'END'
    | {
        routeCode?: string;
        clientName?: string;
        isEndPoint?: boolean;
        existingStartLat?: number;
        existingStartLng?: number;
      },
  startCoordsFallback?: { latitude: number; longitude: number }
): Promise<{ latitude: number; longitude: number; address: string }> {
  const options =
    typeof optionsOrPhase === 'string'
      ? {
          isEndPoint: optionsOrPhase === 'END',
          existingStartLat: startCoordsFallback?.latitude,
          existingStartLng: startCoordsFallback?.longitude,
        }
      : optionsOrPhase;

  const dir = inferDirectionFromRouteCode(options?.routeCode);
  const isEnd = Boolean(options?.isEndPoint);

  // Coordenadas operacionais de referência caso o dispositivo não forneça GPS distinto
  const hubGaragem = { lat: -19.9386, lng: -44.0528, addr: 'Av. Babita Camargos, 1295 - Cidade Industrial, Contagem/MG' };
  const hubFabrica = { lat: -19.9668, lng: -44.1984, addr: 'Rod. Fernão Dias, KM 492 - Distrito Industrial, Betim/MG' };

  const fallbackPoint = (() => {
    if (dir === 'IDA') {
      return isEnd ? hubFabrica : hubGaragem;
    }
    return isEnd ? hubGaragem : hubFabrica;
  })();

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 4500,
          maximumAge: 30000,
        });
      });
      let lat = pos.coords.latitude;
      let lng = pos.coords.longitude;

      // Se for o ponto final e o motorista estiver testando parado no mesmo computador (mesma coordenada exata),
      // desloca levemente para o destino operacional para permitir visualizar o trajeto completo no mapa
      if (
        isEnd &&
        options?.existingStartLat != null &&
        options?.existingStartLng != null &&
        Math.abs(lat - options.existingStartLat) < 0.0005 &&
        Math.abs(lng - options.existingStartLng) < 0.0005
      ) {
        lat = dir === 'IDA' ? lat - 0.032 : lat + 0.032;
        lng = dir === 'IDA' ? lng - 0.048 : lng + 0.048;
      }

      const resolvedAddr = await reverseGeocodeAddress(lat, lng);
      return {
        latitude: lat,
        longitude: lng,
        address: resolvedAddr,
      };
    } catch {
      // Usa referência operacional abaixo
    }
  }

  return {
    latitude: fallbackPoint.lat,
    longitude: fallbackPoint.lng,
    address: options?.clientName && isEnd
      ? `${fallbackPoint.addr} (${options.clientName})`
      : fallbackPoint.addr,
  };
}

let lastEmitTimestamp = 0;
export function emitDriverRecordsUpdated(options?: { force?: boolean }) {
  if (typeof window !== 'undefined') {
    const now = Date.now();
    if (!options?.force && now - lastEmitTimestamp < 2000) {
      return; // Cooldown de 2s para eliminar loops em cascata
    }
    lastEmitTimestamp = now;

    window.dispatchEvent(new CustomEvent('fluxbus:driver-records-updated'));
    try {
      localStorage.setItem('fluxbus_last_driver_sync', String(now));
    } catch {
      // ignore
    }
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('fluxbus_realtime_sync');
        bc.postMessage({ type: 'DRIVER_RECORDS_UPDATED', timestamp: now });
        bc.close();
      }
    } catch {
      // ignore
    }
  }
}

function getExecutionOverlayMap(): Record<string, ScheduleOverlayData> {
  try {
    const raw = localStorage.getItem(OVERLAY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveExecutionOverlay(id: string, patch: ScheduleOverlayData): ScheduleOverlayData {
  try {
    const map = getExecutionOverlayMap();
    const existing = map[id] || {};
    const cleanPatch: Record<string, any> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) {
        cleanPatch[k] = v;
      }
    }
    // Preserva status de execução (IN_PROGRESS / COMPLETED) caso uma edição de planejamento tente voltar para PENDING
    if (
      cleanPatch.status === 'PENDING' &&
      (existing.status === 'IN_PROGRESS' ||
        existing.status === 'COMPLETED' ||
        existing.initialKm != null ||
        existing.finalKm != null ||
        existing.pointRegisteredAt != null) &&
      cleanPatch.initialKm === undefined &&
      cleanPatch.finalKm === undefined
    ) {
      delete cleanPatch.status;
    }
    const merged: ScheduleOverlayData = { ...existing, ...cleanPatch };
    map[id] = merged;
    localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(map));
    return merged;
  } catch {
    return patch;
  }
}

function getLocalPontoSchedules(): Schedule[] {
  try {
    const raw = localStorage.getItem(LOCAL_PONTO_SCHEDULES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function upsertLocalPontoSchedule(schedule: Schedule) {
  try {
    const list = getLocalPontoSchedules().filter((s) => s.id !== schedule.id);
    list.unshift(schedule);
    localStorage.setItem(LOCAL_PONTO_SCHEDULES_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignore storage errors
  }
}

function applyOverlayToSchedule(schedule: Schedule): Schedule {
  if (!schedule || !schedule.id) return schedule;
  const map = getExecutionOverlayMap();
  const ov = map[schedule.id];
  if (!ov) {
    return {
      ...schedule,
      scheduleRecurrence: resolveScheduleRecurrence(schedule),
    };
  }

  const effectiveEmployeeId = ov.employeeId || schedule.employeeId || schedule.employee?.id;
  const effectiveEmployeeName = ov.employeeName || schedule.employee?.name;

  const effectiveRouteId = ov.routeId || schedule.routeId || schedule.route?.id;
  const effectiveRouteName = ov.routeName || ov.routeCode || schedule.route?.name || schedule.routeCode;

  const effectiveVehicleId = ov.vehicleId || schedule.vehicleId || schedule.vehicle?.id;
  const effectiveVehiclePlate = ov.vehiclePlate || schedule.vehicle?.plate || schedule.vehiclePlate;
  const effectiveVehicleModel = ov.vehicleModel || schedule.vehicle?.model || schedule.vehicleModel;

  const effectiveTravelTripId = ov.travelTripId || schedule.travelTrip?.id;
  const effectiveTravelTripName = ov.travelTripName || schedule.travelTrip?.name;

  const merged: Schedule = {
    ...schedule,
    employeeId: effectiveEmployeeId,
    employee:
      effectiveEmployeeId || effectiveEmployeeName
        ? {
            ...(schedule.employee || {}),
            id: effectiveEmployeeId || 'driver',
            name: effectiveEmployeeName || 'Motorista',
            position: schedule.employee?.position || 'MOTORISTA',
          }
        : schedule.employee,
    scheduleDate: ov.scheduleDate || schedule.scheduleDate,
    scheduleRecurrence: ov.scheduleRecurrence || schedule.scheduleRecurrence || resolveScheduleRecurrence(schedule),
    shift: ov.shift || schedule.shift || 'DAY',
    startTime: ov.startTime || schedule.startTime,
    endTime: ov.endTime || schedule.endTime,
    legs: ov.legs ?? schedule.legs ?? schedule.travelTrip?.legs,
    workPost:
      ov.workPostId || ov.workPostName
        ? {
            ...(schedule.workPost || { postCode: '' }),
            id: ov.workPostId || schedule.workPost?.id || 'wp',
            name: ov.workPostName || schedule.workPost?.name || 'Posto',
          }
        : schedule.workPost,
    clientName:
      ov.clientName ||
      schedule.clientName ||
      schedule.workPost?.client?.name ||
      schedule.travelTrip?.client?.name ||
      schedule.client?.name,
    routeCode: ov.routeCode || ov.routeName || schedule.routeCode,
    passengersCount: ov.passengersCount ?? schedule.passengersCount,
    routeId: effectiveRouteId,
    route:
      effectiveRouteId || effectiveRouteName
        ? {
            id: effectiveRouteId || effectiveRouteName || 'route',
            name: effectiveRouteName || 'Rota',
          }
        : schedule.route,
    vehicleId: effectiveVehicleId,
    vehicle:
      effectiveVehiclePlate || effectiveVehicleId
        ? {
            ...(schedule.vehicle || {}),
            id: effectiveVehicleId || 'vehicle',
            plate: effectiveVehiclePlate || '',
            model: effectiveVehicleModel,
          }
        : schedule.vehicle,
    vehiclePlate: effectiveVehiclePlate,
    vehicleModel: effectiveVehicleModel,
    travelTrip:
      effectiveTravelTripId || effectiveTravelTripName
        ? {
            ...(schedule.travelTrip || {}),
            id: effectiveTravelTripId || effectiveRouteId || 'trip',
            name: effectiveTravelTripName || effectiveRouteName || 'Viagem',
            legs: ov.legs ?? schedule.travelTrip?.legs ?? schedule.legs,
          }
        : schedule.travelTrip,
    initialKm: ov.initialKm ?? schedule.initialKm,
    finalKm: ov.finalKm ?? schedule.finalKm,
    pointRegisteredAt: ov.pointRegisteredAt || schedule.pointRegisteredAt,
    pointStatus:
      ov.pointStatus && ov.pointStatus !== 'NONE'
        ? ov.pointStatus
        : schedule.pointStatus || ov.pointStatus || 'NONE',
    pointJustification: ov.pointJustification || schedule.pointJustification,
    pointApprovedBy: ov.pointApprovedBy || schedule.pointApprovedBy,
    pointApprovedAt: ov.pointApprovedAt || schedule.pointApprovedAt,
    tripPhotosJson: ov.tripPhotosJson || schedule.tripPhotosJson,
    startLatitude: ov.startLatitude ?? schedule.startLatitude,
    startLongitude: ov.startLongitude ?? schedule.startLongitude,
    startAddress: ov.startAddress || schedule.startAddress,
    endLatitude: ov.endLatitude ?? schedule.endLatitude,
    endLongitude: ov.endLongitude ?? schedule.endLongitude,
    endAddress: ov.endAddress || schedule.endAddress,
    direction:
      ov.direction ||
      schedule.direction ||
      inferDirectionFromRouteCode(ov.routeCode || ov.routeName || schedule.routeCode),
    delayMinutes: ov.delayMinutes ?? schedule.delayMinutes,
    delayReason: ov.delayReason || schedule.delayReason,
    delayReportedAt: ov.delayReportedAt || schedule.delayReportedAt,
    status: ov.status || schedule.status,
    observations: ov.observations !== undefined ? ov.observations : schedule.observations,
  };

  return merged;
}

function parseTimeMinutes(timeStr?: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const clean = timeStr.trim().substring(0, 5);
  const [hStr, mStr] = clean.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function normalizePlate(plate?: string | null): string {
  if (!plate) return '';
  return plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Valida se o veículo (ou motorista) já está escalado em horário sobreposto na mesma data/regime.
 * Regra operacional: "O mesmo veículo não pode executar a mesma rota (ou outra rota) no mesmo horário —
 * ele pode executar apenas uma rota por vez (ex: 06:20 às 08:45 e depois outra rota em outro horário)."
 */
export function checkVehicleScheduleConflict(
  schedules: Schedule[],
  candidate: {
    ignoreScheduleId?: string;
    vehicleId?: string;
    vehiclePlate?: string;
    employeeId?: string;
    employeeName?: string;
    routeId?: string;
    routeName?: string;
    scheduleDate: string; // YYYY-MM-DD
    scheduleRecurrence?: ScheduleRecurrence;
    startTime: string;
    endTime: string;
  }
): {
  hasConflict: boolean;
  conflictType?: 'VEHICLE' | 'DRIVER';
  conflictingSchedule?: Schedule;
  message?: string;
} {
  const candStart = parseTimeMinutes(candidate.startTime);
  let candEnd = parseTimeMinutes(candidate.endTime);
  if (candStart === null || candEnd === null) {
    return { hasConflict: false };
  }
  if (candEnd <= candStart) {
    candEnd += 24 * 60;
  }

  const candPlate = normalizePlate(candidate.vehiclePlate);
  const candVehId = candidate.vehicleId && candidate.vehicleId !== 'vehicle' ? String(candidate.vehicleId) : '';
  const candDate = (candidate.scheduleDate || '').substring(0, 10);
  const candRecurrence = candidate.scheduleRecurrence || 'WEEKLY_FIXED';

  for (const s of schedules) {
    if (!s || !s.id) continue;
    if (candidate.ignoreScheduleId && String(s.id) === String(candidate.ignoreScheduleId)) continue;
    if (s.status === 'CANCELLED') continue;

    // Verifica se ambas as escalas ocorrem no mesmo dia ou no mesmo regime ativo
    const sDate = (s.scheduleDate || '').substring(0, 10);
    const sRecurrence = resolveScheduleRecurrence(s);
    const sameActiveDay =
      sDate === candDate ||
      (candDate ? isScheduleActiveForDate(s, candDate) && sRecurrence === candRecurrence : false);

    if (!sameActiveDay) continue;

    const exStart = parseTimeMinutes(resolveScheduleStartTime(s));
    let exEnd = parseTimeMinutes(resolveScheduleEndTime(s));
    if (exStart === null || exEnd === null) continue;
    if (exEnd <= exStart) {
      exEnd += 24 * 60;
    }

    // Sobreposição estrita de intervalos: [candStart, candEnd) e [exStart, exEnd)
    // Permite pegadas em sequência como 06:20-08:45 e 08:45-11:00 (ou 08:50-11:00)
    const overlaps = candStart < exEnd && candEnd > exStart;
    if (!overlaps) continue;

    const sPlate = normalizePlate(s.vehicle?.plate || s.vehiclePlate);
    const sVehId = s.vehicle?.id && s.vehicle.id !== 'vehicle' ? String(s.vehicle.id) : s.vehicleId && s.vehicleId !== 'vehicle' ? String(s.vehicleId) : '';

    const sameVehicle =
      (candPlate && sPlate && candPlate === sPlate) ||
      (candVehId && sVehId && candVehId === sVehId);

    if (sameVehicle) {
      const existingRoute =
        s.routeCode || s.route?.name || s.travelTrip?.name || s.workPost?.name || 'Rota ativa';
      const existingDriver = s.employee?.name || 'outro motorista';
      const displayPlate = candidate.vehiclePlate || s.vehicle?.plate || s.vehiclePlate || 'selecionado';
      const exStartStr = resolveScheduleStartTime(s);
      const exEndStr = resolveScheduleEndTime(s);

      return {
        hasConflict: true,
        conflictType: 'VEHICLE',
        conflictingSchedule: s,
        message: `O veículo ${displayPlate} já está escalado no horário ${exStartStr} às ${exEndStr} na rota "${existingRoute}" (${existingDriver}). O mesmo veículo só pode executar uma rota por vez! Escolha outro horário (ex: após ${exEndStr}) ou outro veículo.`,
      };
    }
  }

  return { hasConflict: false };
}

function normalizeName(name?: string | null): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getCurrentStoredUser(): { id?: string; employeeId?: string; name?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function resolveScheduleStartTime(schedule: Partial<Schedule>): string {
  if (schedule.startTime && schedule.startTime.trim().length >= 5) {
    return schedule.startTime.trim().substring(0, 5);
  }
  if (schedule.workPost?.shiftStart && schedule.workPost.shiftStart.trim().length >= 5) {
    return schedule.workPost.shiftStart.trim().substring(0, 5);
  }
  if (schedule.shift === 'NIGHT') return '22:00';
  if (schedule.shift === 'MIXED') return '14:00';
  return '08:00';
}

export function resolveScheduleEndTime(schedule: Partial<Schedule>): string {
  if (schedule.endTime && schedule.endTime.trim().length >= 5) {
    return schedule.endTime.trim().substring(0, 5);
  }
  if (schedule.workPost?.shiftEnd && schedule.workPost.shiftEnd.trim().length >= 5) {
    return schedule.workPost.shiftEnd.trim().substring(0, 5);
  }
  if (schedule.shift === 'NIGHT') return '06:00';
  if (schedule.shift === 'MIXED') return '22:00';
  return '17:00';
}

export function checkPointTolerance(
  scheduleDate?: string,
  startTime?: string,
  toleranceLimit = 10
): {
  isWithinTolerance: boolean;
  withinTolerance: boolean;
  diffMinutes: number;
  expectedTime: string;
} {
  const now = new Date();
  const cleanTime = startTime && startTime.trim().length >= 5 ? startTime.trim().substring(0, 5) : '08:00';
  // Para escalas semanais fixas, compara sempre com o horário esperado no dia atual
  const [hours, minutes] = cleanTime.split(':').map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { isWithinTolerance: true, withinTolerance: true, diffMinutes: 0, expectedTime: cleanTime };
  }

  const expectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  const diffMs = now.getTime() - expectedDate.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  const isWithin = Math.abs(diffMinutes) <= toleranceLimit;

  return {
    isWithinTolerance: isWithin,
    withinTolerance: isWithin,
    diffMinutes,
    expectedTime: cleanTime,
  };
}

function isSameDriverMatch(
  idA?: string | null,
  nameA?: string | null,
  idB?: string | null,
  nameB?: string | null
): boolean {
  const cleanIdA = idA && idA !== 'driver' ? String(idA).trim() : '';
  const cleanIdB = idB && idB !== 'driver' ? String(idB).trim() : '';
  if (cleanIdA && cleanIdB && cleanIdA === cleanIdB) return true;

  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);
  if (!normA || !normB) return false;
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) return true;

  const partsA = normA.split(/\s+/).filter((p) => p.length > 2);
  const partsB = normB.split(/\s+/).filter((p) => p.length > 2);
  if (partsA.length >= 2 && partsB.length >= 2) {
    return partsA[0] === partsB[0] && partsA[partsA.length - 1] === partsB[partsB.length - 1];
  }
  return false;
}

function getAllDriverDailySheetsFromLocalStorage(): Array<{
  driverName?: string;
  driverId?: string;
  date?: string;
  vehiclePlate?: string;
  rows?: Array<{
    id?: string;
    scheduleId?: string;
    startTime?: string;
    endTime?: string;
    company?: string;
    routeCode?: string;
    direction?: 'IDA' | 'RETORNO';
    startKm?: string | number;
    endKm?: string | number;
    passengers?: string | number;
    startAddress?: string;
    endAddress?: string;
    startLatitude?: number;
    startLongitude?: number;
    endLatitude?: number;
    endLongitude?: number;
  }>;
}> {
  const sheets: any[] = [];
  if (typeof window === 'undefined') return sheets;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('driverDailySheet_v2_') || k.startsWith('driverDailySheet_'))) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.rows)) {
            sheets.push(parsed);
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return sheets;
}

const persistedSyncFingerprints = new Map<string, string>();

export const scheduleService = {
  checkPointTolerance,

  /**
   * Busca todas as escalas de trabalho (integrando em tempo real com Ponto Eletrônico,
   * Quadro Diário, Parte Diária e Check-in/Check-out de Veículos de cada motorista).
   */
  async findAll(): Promise<Schedule[]> {
    const [schedulesRes, partesRes, checklistsRes] = await Promise.all([
      api
        .get('/api/schedules', {
          validateStatus: (status) => status < 500,
          silentErrorLog: true,
        } as any)
        .catch(() => ({ data: [] })),
      api
        .get('/api/partes-diarias', {
          validateStatus: (status) => status < 500,
          silentErrorLog: true,
        } as any)
        .catch(() => ({ data: [] })),
      api
        .get('/frota/vehicle-gate-checklists', {
          validateStatus: (status) => status < 500,
          silentErrorLog: true,
        } as any)
        .catch(() => ({ data: [] })),
    ]);

    let list: Schedule[] = [];
    const data = schedulesRes?.data;
    if (Array.isArray(data)) {
      list = data;
    } else if (data && Array.isArray(data.content)) {
      list = data.content;
    }

    const partesDiarias: any[] = Array.isArray(partesRes?.data)
      ? partesRes.data
      : Array.isArray(partesRes?.data?.content)
        ? partesRes.data.content
        : [];

    const gateChecklists: any[] = Array.isArray(checklistsRes?.data)
      ? checklistsRes.data
      : Array.isArray(checklistsRes?.data?.content)
        ? checklistsRes.data.content
        : [];

    // Busca registros de ponto de hoje para todos os motoristas das escalas
    const currentStoredUser = getCurrentStoredUser();
    const distinctEmpIds = Array.from(
      new Set(
        [
          ...list.map((s) => s?.employee?.id || s?.employeeId),
          currentStoredUser?.employeeId,
          currentStoredUser?.id,
        ].filter((id): id is string => Boolean(id && id !== 'driver' && String(id).trim().length > 0))
      )
    );

    const timeRecordsByEmpId = new Map<string, any[]>();
    const allTodayTimeRecords: any[] = [];

    // 1. Carrega registros de ponto de hoje via endpoint administrativo APENAS se for perfil administrativo
    const currentUserRole = String(currentStoredUser?.role || '').toUpperCase();
    const isCurrentUserDriver = currentUserRole === 'MOTORISTA' || (Array.isArray(currentStoredUser?.roles) && currentStoredUser.roles.some((r: any) => String(r).toUpperCase().includes('MOTORISTA')));
    const isCurrentUserAdmin = !isCurrentUserDriver && (currentUserRole.includes('ADMIN') || currentUserRole.includes('GESTOR') || currentUserRole.includes('SUPERVISOR') || currentUserRole.includes('TRAFEGO') || currentUserRole.includes('RH'));

    if (isCurrentUserAdmin) {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const adminTrRes = await api.get('/time-records/admin/records', {
          params: { startDate: todayStr, endDate: todayStr, size: 200 },
          validateStatus: (status) => status < 500,
          silentErrorLog: true,
        } as any);
        const adminTrData = adminTrRes?.data;
        const recList = Array.isArray(adminTrData)
          ? adminTrData
          : Array.isArray(adminTrData?.content)
            ? adminTrData.content
            : [];
        if (recList.length > 0) {
          allTodayTimeRecords.push(...recList);
        }
      } catch {
        // ignore
      }
    }

    // 2. Busca também por employeeId individual para garantir histórico do colaborador
    if (distinctEmpIds.length > 0) {
      await Promise.all(
        distinctEmpIds.slice(0, 15).map(async (empId) => {
          try {
            const trRes = await api.get(`/time-records/today/${empId}`, {
              validateStatus: (status) => status < 500,
              silentErrorLog: true,
            } as any);
            const trData = trRes?.data;
            const records = Array.isArray(trData)
              ? trData
              : Array.isArray(trData?.data)
                ? trData.data
                : [];
            if (records.length > 0) {
              timeRecordsByEmpId.set(empId, records);
              allTodayTimeRecords.push(...records);
            }
          } catch {
            // ignore
          }
        })
      );
    }

    // 3. Mescla registros de hoje salvos localmente no navegador (fluxbus:today-time-records)
    try {
      if (typeof window !== 'undefined') {
        const localTrRaw = localStorage.getItem('fluxbus:today-time-records');
        if (localTrRaw) {
          const parsed = JSON.parse(localTrRaw);
          if (parsed?.records && Array.isArray(parsed.records)) {
            allTodayTimeRecords.push(...parsed.records);
          } else if (Array.isArray(parsed)) {
            allTodayTimeRecords.push(...parsed);
          }
        }
      }
    } catch {
      // ignore
    }

    // Função auxiliar para encontrar registros de ponto do motorista (por ID ou Nome)
    const findTimeRecordsForDriver = (dId?: string, dName?: string): any[] => {
      const results: any[] = [];
      if (dId && timeRecordsByEmpId.has(dId)) {
        results.push(...(timeRecordsByEmpId.get(dId) || []));
      }
      for (const rec of allTodayTimeRecords) {
        if (!rec) continue;
        const rEmpId = rec.employee?.id || rec.employeeId;
        const rEmpName = rec.employee?.name || rec.employeeName;
        if (isSameDriverMatch(dId, dName, rEmpId, rEmpName)) {
          if (!results.some((x) => x.id && x.id === rec.id)) {
            results.push(rec);
          }
        }
      }
      return results;
    };

    const overlayMap = getExecutionOverlayMap();
    const localPontoList = getLocalPontoSchedules().map(applyOverlayToSchedule);
    const localDailySheets = getAllDriverDailySheetsFromLocalStorage();

    const mergedMap = new Map<string, Schedule>();
    const absorbedLocalIds = new Set<string>();

    for (const rawSchedule of list) {
      if (!rawSchedule || !rawSchedule.id || overlayMap[rawSchedule.id]?.deleted) continue;

      let s = applyOverlayToSchedule(rawSchedule);
      const drvId = s.employee?.id || s.employeeId || '';
      const drvName = s.employee?.name || '';

      // 1. Absorve registros criados como ponto-local-* para o mesmo motorista
      for (const localPonto of localPontoList) {
        if (!localPonto || !localPonto.id || overlayMap[localPonto.id]?.deleted) continue;
        if (
          isSameDriverMatch(
            drvId,
            drvName,
            localPonto.employee?.id || localPonto.employeeId,
            localPonto.employee?.name
          )
        ) {
          absorbedLocalIds.add(localPonto.id);
          const hasPhotos = Boolean(localPonto.tripPhotosJson && localPonto.tripPhotosJson !== '[]');
          const patchFromLocal: ScheduleOverlayData = {
            initialKm: s.initialKm ?? localPonto.initialKm,
            finalKm: s.finalKm ?? localPonto.finalKm,
            passengersCount:
              s.passengersCount != null && s.passengersCount > 0
                ? s.passengersCount
                : localPonto.passengersCount ?? s.passengersCount,
            tripPhotosJson: s.tripPhotosJson || (hasPhotos ? localPonto.tripPhotosJson : undefined),
            pointRegisteredAt: s.pointRegisteredAt || localPonto.pointRegisteredAt,
            pointStatus:
              s.pointStatus && s.pointStatus !== 'NONE'
                ? s.pointStatus
                : localPonto.pointStatus || 'APPROVED',
            pointJustification: s.pointJustification || localPonto.pointJustification,
            startLatitude: s.startLatitude ?? localPonto.startLatitude,
            startLongitude: s.startLongitude ?? localPonto.startLongitude,
            startAddress: s.startAddress || localPonto.startAddress,
            endLatitude: s.endLatitude ?? localPonto.endLatitude,
            endLongitude: s.endLongitude ?? localPonto.endLongitude,
            endAddress: s.endAddress || localPonto.endAddress,
            direction: s.direction || localPonto.direction,
          };
          saveExecutionOverlay(s.id, patchFromLocal);
          s = applyOverlayToSchedule({ ...rawSchedule, ...s });
        }
      }

      // 2. Mescla dados do Quadro Diário salvo no navegador (driverDailySheet_v2_*)
      for (const sheet of localDailySheets) {
        if (!isSameDriverMatch(drvId, drvName, sheet.driverId, sheet.driverName)) continue;
        const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
        const matchedRow =
          rows.find((r) => r.scheduleId === s.id) ||
          rows.find((r) => r.startKm || r.endKm || Number(r.passengers) > 0);
        if (matchedRow) {
          const rStartKm =
            matchedRow.startKm !== undefined && matchedRow.startKm !== '' && !Number.isNaN(Number(matchedRow.startKm))
              ? Number(matchedRow.startKm)
              : undefined;
          const rEndKm =
            matchedRow.endKm !== undefined && matchedRow.endKm !== '' && !Number.isNaN(Number(matchedRow.endKm))
              ? Number(matchedRow.endKm)
              : undefined;
          const rPass =
            matchedRow.passengers !== undefined &&
            matchedRow.passengers !== '' &&
            !Number.isNaN(Number(matchedRow.passengers))
              ? Number(matchedRow.passengers)
              : undefined;

          if (rStartKm != null || rEndKm != null || (rPass != null && rPass > 0)) {
            saveExecutionOverlay(s.id, {
              initialKm: s.initialKm ?? rStartKm,
              finalKm: s.finalKm ?? rEndKm,
              passengersCount:
                s.passengersCount != null && s.passengersCount > 0 ? s.passengersCount : rPass ?? s.passengersCount,
              startAddress: s.startAddress || matchedRow.startAddress,
              endAddress: s.endAddress || matchedRow.endAddress,
              startLatitude: s.startLatitude ?? matchedRow.startLatitude,
              startLongitude: s.startLongitude ?? matchedRow.startLongitude,
              endLatitude: s.endLatitude ?? matchedRow.endLatitude,
              endLongitude: s.endLongitude ?? matchedRow.endLongitude,
              pointStatus: s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED',
              pointRegisteredAt: s.pointRegisteredAt || new Date().toISOString(),
            });
            s = applyOverlayToSchedule({ ...rawSchedule, ...s });
          }
        }
      }

      // 3. Mescla dados de Parte Diária do backend (/api/partes-diarias)
      const driverPartes = partesDiarias.filter((pd) =>
        isSameDriverMatch(
          drvId,
          drvName,
          pd.driver?.id || pd.driverId || pd.employeeId,
          pd.driver?.name || pd.driverName || pd.employeeName
        )
      );
      if (driverPartes.length > 0) {
        const sortedPartes = [...driverPartes].sort((a, b) => {
          const dA = a.date || a.createdAt || '';
          const dB = b.date || b.createdAt || '';
          return dB.localeCompare(dA);
        });
        const latestPd = sortedPartes[0];
        let pdKmIni =
          latestPd.kmInicial != null
            ? Number(latestPd.kmInicial)
            : latestPd.initialKm != null
              ? Number(latestPd.initialKm)
              : latestPd.startKm != null
                ? Number(latestPd.startKm)
                : undefined;
        let pdKmFim =
          latestPd.kmFinal != null
            ? Number(latestPd.kmFinal)
            : latestPd.finalKm != null
              ? Number(latestPd.finalKm)
              : latestPd.endKm != null
                ? Number(latestPd.endKm)
                : undefined;
        let pdPass =
          latestPd.passengersCount != null
            ? Number(latestPd.passengersCount)
            : latestPd.quantidadePassageiros != null
              ? Number(latestPd.quantidadePassageiros)
              : undefined;

        // Se houver atividades cadastradas na Parte Diária (ex: Formulário Diário)
        if (Array.isArray(latestPd.atividades) && latestPd.atividades.length > 0) {
          const atvs = latestPd.atividades;
          const firstAtv = atvs[0];
          const lastAtv = atvs[atvs.length - 1];
          if (pdKmIni == null && (firstAtv.startKm != null || firstAtv.kmInicial != null)) {
            pdKmIni = Number(firstAtv.startKm ?? firstAtv.kmInicial);
          }
          if (pdKmFim == null && (lastAtv.endKm != null || lastAtv.kmFinal != null)) {
            pdKmFim = Number(lastAtv.endKm ?? lastAtv.kmFinal);
          }
          if (pdPass == null) {
            const sumPax = atvs.reduce(
              (acc: number, item: any) => acc + (Number(item.passengersCount || item.passengers || 0)),
              0
            );
            if (sumPax > 0) pdPass = sumPax;
          }
        }

        if (pdKmIni != null || pdKmFim != null || pdPass != null) {
          saveExecutionOverlay(s.id, {
            initialKm: s.initialKm ?? pdKmIni,
            finalKm: s.finalKm ?? pdKmFim,
            passengersCount:
              s.passengersCount != null && s.passengersCount > 0 ? s.passengersCount : pdPass ?? s.passengersCount,
            vehiclePlate: s.vehiclePlate || latestPd.vehiclePlate || latestPd.vehicle?.plate,
            clientName: s.clientName || latestPd.clientName || latestPd.obraName,
            pointStatus: s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED',
            pointRegisteredAt: s.pointRegisteredAt || latestPd.createdAt || new Date().toISOString(),
          });
          s = applyOverlayToSchedule({ ...rawSchedule, ...s });
        }
      }

      // 4. Mescla dados de Check-in / Check-out do Veículo (/frota/vehicle-gate-checklists)
      const driverChecklists = gateChecklists.filter((chk) =>
        isSameDriverMatch(drvId, drvName, chk.driverId || chk.userId, chk.driverName || chk.userName)
      );
      if (driverChecklists.length > 0) {
        const outChk = driverChecklists.find((c) => c.type === 'SAIDA' || c.checkType === 'SAIDA') || driverChecklists[0];
        const inChk = driverChecklists.find((c) => c.type === 'ENTRADA' || c.checkType === 'ENTRADA');
        const chkKmIni = outChk?.odometerKm != null ? Number(outChk.odometerKm) : undefined;
        const chkKmFim = inChk?.odometerKm != null && inChk !== outChk ? Number(inChk.odometerKm) : undefined;
        let chkPhotosJson: string | undefined;
        const chkPhotos = [
          ...(Array.isArray(outChk?.photos) ? outChk.photos : []),
          ...(outChk?.odometerPhotoUrl ? [outChk.odometerPhotoUrl] : []),
        ].filter(Boolean);
        if (chkPhotos.length > 0) {
          chkPhotosJson = JSON.stringify(chkPhotos);
        }

        if (chkKmIni != null || chkKmFim != null || chkPhotosJson) {
          saveExecutionOverlay(s.id, {
            initialKm: s.initialKm ?? chkKmIni,
            finalKm: s.finalKm ?? chkKmFim,
            tripPhotosJson: s.tripPhotosJson || chkPhotosJson,
            pointRegisteredAt: s.pointRegisteredAt || outChk?.checkedAt || outChk?.createdAt,
            pointStatus: s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED',
          });
          s = applyOverlayToSchedule({ ...rawSchedule, ...s });
        }
      }

      // 5. Mescla registros oficiais de Ponto Eletrônico de hoje (por ID ou Nome do Motorista)
      const empTimeRecords = findTimeRecordsForDriver(drvId, drvName);
      if (empTimeRecords.length > 0) {
        const sortedRecs = [...empTimeRecords].sort((a, b) => {
          const tA = a.recordedAt || a.createdAt || '';
          const tB = b.recordedAt || b.createdAt || '';
          return tA.localeCompare(tB);
        });
        const entradaRec =
          sortedRecs.find((r: any) => r.recordType === 'ENTRADA') || sortedRecs[0];
        const saidaRec = sortedRecs.find((r: any) => r.recordType === 'SAIDA');
        const recTimeIso = entradaRec?.recordedAt || entradaRec?.createdAt;
        const recLoc =
          entradaRec?.location && entradaRec.location !== 'Sem localização' ? entradaRec.location : undefined;

        saveExecutionOverlay(s.id, {
          pointRegisteredAt: s.pointRegisteredAt || recTimeIso || new Date().toISOString(),
          pointStatus:
            s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED',
          status: s.status === 'PENDING' ? 'IN_PROGRESS' : s.status,
          startAddress: s.startAddress || recLoc,
          startLatitude: s.startLatitude ?? entradaRec?.latitude,
          startLongitude: s.startLongitude ?? entradaRec?.longitude,
          endAddress: s.endAddress || (saidaRec?.location !== 'Sem localização' ? saidaRec?.location : undefined),
          endLatitude: s.endLatitude ?? saidaRec?.latitude,
          endLongitude: s.endLongitude ?? saidaRec?.longitude,
        });
        s = applyOverlayToSchedule({ ...rawSchedule, ...s });
      }

      // 6. Atualiza status operacional automaticamente conforme os registros do motorista
      const hasPhotosNow = Boolean(s.tripPhotosJson && s.tripPhotosJson !== '[]');
      const isPendingApproval = s.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
      if (!isPendingApproval) {
        if (s.finalKm != null && s.status !== 'COMPLETED') {
          saveExecutionOverlay(s.id, { status: 'COMPLETED' });
          s = { ...s, status: 'COMPLETED' };
        } else if (
          (s.initialKm != null || s.pointRegisteredAt != null || hasPhotosNow) &&
          (s.status === 'PENDING' || s.status === 'CONFIRMED')
        ) {
          saveExecutionOverlay(s.id, { status: 'IN_PROGRESS', pointStatus: s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED' });
          s = {
            ...s,
            status: 'IN_PROGRESS',
            pointStatus: s.pointStatus && s.pointStatus !== 'NONE' ? s.pointStatus : 'APPROVED',
          };
        }
      }

      // 7. Se o registro no backend ainda estava desatualizado em relação ao estado enriquecido, sincroniza via PUT /api/schedules/{id}
      const needsBackendSync =
        !s.id.startsWith('ponto-local-') &&
        !s.id.startsWith('escala-local-') &&
        ((s.initialKm != null && rawSchedule.initialKm == null) ||
          (s.finalKm != null && rawSchedule.finalKm == null) ||
          (s.passengersCount != null && rawSchedule.passengersCount == null) ||
          (s.tripPhotosJson && !rawSchedule.tripPhotosJson) ||
          (s.pointStatus && s.pointStatus !== 'NONE' && rawSchedule.pointStatus !== s.pointStatus) ||
          (s.status !== rawSchedule.status && (s.status === 'IN_PROGRESS' || s.status === 'COMPLETED')));

      if (needsBackendSync) {
        const fingerprint = JSON.stringify({
          i: s.initialKm,
          f: s.finalKm,
          p: s.passengersCount,
          ph: s.tripPhotosJson ? s.tripPhotosJson.length : 0,
          ps: s.pointStatus,
          st: s.status,
        });
        if (persistedSyncFingerprints.get(s.id) !== fingerprint) {
          persistedSyncFingerprints.set(s.id, fingerprint);
          api
            .put(
              `/api/schedules/${s.id}`,
              {
                employeeId: s.employee?.id || s.employeeId,
                scheduleDate: s.scheduleDate,
                shift: s.shift || 'DAY',
                startTime: s.startTime,
                endTime: s.endTime,
                legs: s.legs,
                clientName: s.clientName,
                routeCode: s.routeCode,
                passengersCount: s.passengersCount,
                initialKm: s.initialKm,
                finalKm: s.finalKm,
                pointStatus: s.pointStatus,
                pointJustification: s.pointJustification,
                tripPhotosJson: s.tripPhotosJson,
                status: s.status,
                observations: s.observations,
              },
              { silentErrorLog: true } as any
            )
            .catch(() => {});
        }
      }

      mergedMap.set(s.id, s);
    }

    // Remove do localStorage os ponto-local-* que já foram absorvidos na escala oficial do motorista
    if (absorbedLocalIds.size > 0) {
      try {
        const remaining = getLocalPontoSchedules().filter((item) => !absorbedLocalIds.has(item.id));
        localStorage.setItem(LOCAL_PONTO_SCHEDULES_KEY, JSON.stringify(remaining));
      } catch {
        // ignore
      }
    }

    for (const localItem of localPontoList) {
      if (
        localItem &&
        localItem.id &&
        !absorbedLocalIds.has(localItem.id) &&
        !overlayMap[localItem.id]?.deleted &&
        !mergedMap.has(localItem.id)
      ) {
        mergedMap.set(localItem.id, localItem);
      }
    }

    return Array.from(mergedMap.values());
  },

  /**
   * Busca uma escala de trabalho pelo seu ID.
   */
  async findById(id: string): Promise<Schedule> {
    try {
      const response = await api.get(`/api/schedules/${id}`, { silentErrorLog: true } as any);
      return applyOverlayToSchedule(response.data);
    } catch {
      const local = getLocalPontoSchedules().find((s) => s.id === id);
      if (local) return applyOverlayToSchedule(local);
      return applyOverlayToSchedule({ id } as Schedule);
    }
  },

  /**
   * Busca todas as escalas de um funcionário específico.
   */
  async findByEmployeeId(employeeId: string): Promise<Schedule[]> {
    const response = await api.get(`/api/schedules/employee/${employeeId}`);
    const list = Array.isArray(response.data) ? response.data : [];
    return list.map(applyOverlayToSchedule);
  },

  /**
   * Busca escalas de trabalho por uma data específica.
   */
  async findByDate(date: string): Promise<Schedule[]> {
    try {
      const response = await api.get('/api/schedules/date', {
        params: { date },
        silentErrorLog: true,
      } as any);
      const list = Array.isArray(response.data) ? response.data : [];
      return list.map(applyOverlayToSchedule);
    } catch {
      return [];
    }
  },

  /**
   * Cria uma nova escala de trabalho.
   */
  async create(data: CreateScheduleDTO & {
    employeeName?: string;
    workPostName?: string;
    routeName?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    travelTripName?: string;
  }): Promise<Schedule> {
    const overlayPayload: ScheduleOverlayData = {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      scheduleDate: data.scheduleDate,
      scheduleRecurrence: data.scheduleRecurrence,
      shift: data.shift,
      legs: data.legs,
      workPostId: data.workPostId,
      workPostName: data.workPostName,
      startTime: data.startTime,
      endTime: data.endTime,
      clientName: data.clientName,
      routeCode: data.routeCode || data.routeName,
      passengersCount: data.passengersCount,
      routeId: data.routeId,
      routeName: data.routeName,
      vehicleId: data.vehicleId,
      vehiclePlate: data.vehiclePlate,
      vehicleModel: data.vehicleModel,
      travelTripId: data.travelTripId,
      travelTripName: data.travelTripName,
      status: data.status || 'PENDING',
      observations: data.observations,
    };

    try {
      const response = await api.post('/api/schedules', data, { silentErrorLog: true } as any);
      const created: Schedule = response.data;
      if (created?.id) {
        saveExecutionOverlay(created.id, overlayPayload);
        const merged = applyOverlayToSchedule(created);
        upsertLocalPontoSchedule(merged);
        emitDriverRecordsUpdated();
        return merged;
      }
    } catch {
      // Fallback resiliente caso o backend rejeite campos opcionais (ex: sem workPostId ou ID sintético de frota)
    }

    const nowIso = new Date().toISOString();
    const localId = `escala-local-${Date.now()}`;
    saveExecutionOverlay(localId, overlayPayload);

    const fallbackSchedule: Schedule = applyOverlayToSchedule({
      id: localId,
      employeeId: data.employeeId,
      employee: {
        id: data.employeeId || 'driver',
        name: data.employeeName || 'Motorista Escalado',
        position: 'MOTORISTA',
      },
      scheduleDate: data.scheduleDate,
      scheduleRecurrence: data.scheduleRecurrence || 'WEEKLY_FIXED',
      shift: data.shift || 'DAY',
      startTime: data.startTime,
      endTime: data.endTime,
      legs: data.legs || 1,
      location: {
        id: data.locationId || data.workPostId || data.routeId || 'loc',
        name: data.workPostName || data.routeName || data.clientName || 'Operação de Tráfego',
      },
      workPost: data.workPostId
        ? {
            id: data.workPostId,
            name: data.workPostName || 'Posto de Trabalho',
            postCode: '',
          }
        : undefined,
      routeId: data.routeId,
      route:
        data.routeId || data.routeName
          ? {
              id: data.routeId || 'route',
              name: data.routeName || data.routeCode || 'Rota',
            }
          : undefined,
      routeCode: data.routeCode || data.routeName,
      travelTrip:
        data.travelTripId || data.travelTripName
          ? {
              id: data.travelTripId || data.routeId || 'trip',
              name: data.travelTripName || data.routeName || 'Viagem',
              legs: data.legs || 1,
            }
          : undefined,
      vehicleId: data.vehicleId,
      vehicle:
        data.vehiclePlate || data.vehicleId
          ? {
              id: data.vehicleId || 'vehicle',
              plate: data.vehiclePlate || '',
              model: data.vehicleModel,
            }
          : undefined,
      vehiclePlate: data.vehiclePlate,
      vehicleModel: data.vehicleModel,
      clientName: data.clientName,
      status: data.status || 'PENDING',
      observations: data.observations,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    upsertLocalPontoSchedule(fallbackSchedule);
    emitDriverRecordsUpdated();
    return fallbackSchedule;
  },

  /**
   * Atualiza uma escala de trabalho existente.
   */
  async update(id: string, data: UpdateScheduleDTO & {
    employeeName?: string;
    workPostName?: string;
    routeName?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    travelTripName?: string;
  }): Promise<Schedule> {
    saveExecutionOverlay(id, {
      employeeId: data.employeeId,
      employeeName: data.employeeName,
      scheduleDate: data.scheduleDate,
      scheduleRecurrence: data.scheduleRecurrence,
      shift: data.shift,
      legs: data.legs,
      workPostId: data.workPostId,
      workPostName: data.workPostName,
      startTime: data.startTime,
      endTime: data.endTime,
      clientName: data.clientName,
      routeCode: data.routeCode || data.routeName,
      passengersCount: data.passengersCount,
      routeId: data.routeId,
      routeName: data.routeName,
      vehicleId: data.vehicleId,
      vehiclePlate: data.vehiclePlate,
      vehicleModel: data.vehicleModel,
      travelTripId: data.travelTripId,
      travelTripName: data.travelTripName,
      status: data.status,
      observations: data.observations,
    });

    const existingLocal = getLocalPontoSchedules().find((s) => s.id === id);
    if (existingLocal) {
      upsertLocalPontoSchedule(applyOverlayToSchedule(existingLocal));
    }

    if (!id.startsWith('ponto-local-') && !id.startsWith('escala-local-')) {
      try {
        const response = await api.put(`/api/schedules/${id}`, data, { silentErrorLog: true } as any);
        const updated = applyOverlayToSchedule(response.data);
        emitDriverRecordsUpdated();
        return updated;
      } catch {
        // Continua com atualização via overlay para garantir persistência imediata na tabela
      }
    }

    const current = existingLocal || (await this.findById(id).catch(() => ({ id } as Schedule)));
    const updated = applyOverlayToSchedule({
      ...current,
      id,
      updatedAt: new Date().toISOString(),
    });
    if (id.startsWith('ponto-local-') || id.startsWith('escala-local-')) {
      upsertLocalPontoSchedule(updated);
    }
    emitDriverRecordsUpdated();
    return updated;
  },

  /**
   * Sincroniza em tempo real no overlay e no backend os campos operacionais informados pelo motorista.
   */
  syncLiveExecutionOverlay(id: string, patch: ScheduleOverlayData) {
    if (!id || id === 'NEW') return;
    saveExecutionOverlay(id, patch);
    emitDriverRecordsUpdated();
  },

  /**
   * Registra o ponto do motorista na escala (com tolerância de ±10 minutos e validação pelo gestor se fora do horário).
   */
  async registerPoint(
    id: string,
    payload: {
      initialKm: number;
      forgotPoint?: boolean;
      justification?: string;
      photos?: string[];
      scheduleDate?: string;
      expectedStartTime?: string;
      startTime?: string;
      endTime?: string;
      clientName?: string;
      routeCode?: string;
      passengersCount?: number;
      vehicleId?: string;
      vehiclePlate?: string;
      vehicleModel?: string;
      startLatitude?: number;
      startLongitude?: number;
      startAddress?: string;
      direction?: 'IDA' | 'RETORNO';
    }
  ): Promise<Schedule> {
    const isOut = Boolean(payload.forgotPoint);

    if (isOut && (!payload.justification || !payload.justification.trim())) {
      throw new Error(
        'Para registro marcado fora do horário / esquecimento de ponto, informe o motivo para o Gestor de Tráfego.'
      );
    }

    const geo =
      payload.startLatitude != null && payload.startLongitude != null && payload.startAddress
        ? {
            latitude: payload.startLatitude,
            longitude: payload.startLongitude,
            address: payload.startAddress,
          }
        : await captureDriverGeolocationAndAddress({
            routeCode: payload.routeCode,
            clientName: payload.clientName,
            isEndPoint: false,
          });

    const direction = payload.direction || inferDirectionFromRouteCode(payload.routeCode);
    const nowIso = new Date().toISOString();
    const photosJson = payload.photos && payload.photos.length > 0 ? JSON.stringify(payload.photos) : undefined;
    const pointStatus: PointApprovalStatus = isOut ? 'PENDING_TRAFFIC_APPROVAL' : 'APPROVED';
    const nextStatus: ScheduleStatus = pointStatus === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING';

    saveExecutionOverlay(id, {
      initialKm: payload.initialKm,
      startTime: payload.startTime || payload.expectedStartTime,
      endTime: payload.endTime,
      clientName: payload.clientName,
      routeCode: payload.routeCode,
      passengersCount: payload.passengersCount,
      vehicleId: payload.vehicleId,
      vehiclePlate: payload.vehiclePlate,
      vehicleModel: payload.vehicleModel,
      pointRegisteredAt: nowIso,
      pointStatus,
      pointJustification: isOut ? payload.justification?.trim() : undefined,
      tripPhotosJson: photosJson,
      startLatitude: geo.latitude,
      startLongitude: geo.longitude,
      startAddress: geo.address,
      direction,
      status: nextStatus,
    });

    const localMatch = getLocalPontoSchedules().find((s) => s.id === id);
    if (localMatch) {
      upsertLocalPontoSchedule(applyOverlayToSchedule(localMatch));
    }

    emitDriverRecordsUpdated();

    if (id.startsWith('ponto-local-') || id.startsWith('escala-local-')) {
      return applyOverlayToSchedule(localMatch || ({ id } as Schedule));
    }

    // Persiste diretamente via PUT /api/schedules/{id} para garantir atualização no PostgreSQL independente da data original da escala semanal
    try {
      const putRes = await api.put(
        `/api/schedules/${id}`,
        {
          startTime: payload.startTime || payload.expectedStartTime,
          endTime: payload.endTime,
          clientName: payload.clientName,
          routeCode: payload.routeCode,
          passengersCount: payload.passengersCount,
          vehicleId: payload.vehicleId && payload.vehicleId.length > 10 ? payload.vehicleId : undefined,
          initialKm: payload.initialKm,
          pointStatus,
          pointJustification: isOut ? payload.justification?.trim() : undefined,
          tripPhotosJson: photosJson,
          status: nextStatus,
        },
        { silentErrorLog: true } as any
      );
      if (putRes?.data?.id) {
        const res = applyOverlayToSchedule(putRes.data);
        emitDriverRecordsUpdated();
        return res;
      }
    } catch {
      // Fallback para /register-point abaixo
    }

    try {
      const response = await api.post(
        `/api/schedules/${id}/register-point`,
        {
          initialKm: payload.initialKm,
          forgotPoint: isOut,
          justification: payload.justification || 'Registro operacional no Portal do Motorista',
          photosJson,
          startTime: payload.startTime || payload.expectedStartTime,
          endTime: payload.endTime,
          clientName: payload.clientName,
          routeCode: payload.routeCode,
          passengersCount: payload.passengersCount,
          vehicleId: payload.vehicleId && payload.vehicleId.length > 10 ? payload.vehicleId : undefined,
        },
        { silentErrorLog: true } as any
      );
      const res = applyOverlayToSchedule(response.data);
      emitDriverRecordsUpdated();
      return res;
    } catch {
      const current = await this.findById(id).catch(() => ({ id } as Schedule));
      const res = applyOverlayToSchedule(current);
      emitDriverRecordsUpdated();
      return res;
    }
  },

  /**
   * Registra ocorrência de atraso informada pelo motorista com motivo e tempo estimado.
   */
  async reportDelay(
    id: string,
    payload: {
      delayMinutes: number;
      delayReason: string;
      direction?: 'IDA' | 'RETORNO';
      routeName?: string;
      notes?: string;
    }
  ): Promise<Schedule> {
    const nowIso = new Date().toISOString();
    const delayNotice = `[ATRASO ${payload.delayMinutes} MIN: ${payload.delayReason}]${
      payload.notes ? ` ${payload.notes}` : ''
    }`;

    saveExecutionOverlay(id, {
      delayMinutes: payload.delayMinutes,
      delayReason: payload.delayReason,
      delayReportedAt: nowIso,
      direction: payload.direction,
      observations: delayNotice,
    });

    try {
      const rawEvents = localStorage.getItem('fleet_trip_events_v1') || '[]';
      const events = JSON.parse(rawEvents);
      events.unshift({
        id: `delay-evt-${Date.now()}`,
        scheduleId: id,
        eventType: 'DELAY',
        delayMinutes: payload.delayMinutes,
        description: `Atraso relatado pelo motorista: ${payload.delayMinutes} min (${payload.delayReason})${
          payload.notes ? ` - ${payload.notes}` : ''
        }`,
        createdAt: nowIso,
      });
      localStorage.setItem('fleet_trip_events_v1', JSON.stringify(events.slice(0, 100)));
    } catch {
      // ignore
    }

    try {
      await api.patch(
        `/api/schedules/${id}`,
        {
          delayMinutes: payload.delayMinutes,
          delayReason: payload.delayReason,
          observations: delayNotice,
        },
        { silentErrorLog: true } as any
      );
    } catch {
      // fallback já salvo no overlay
    }

    emitDriverRecordsUpdated();
    const current = await this.findById(id).catch(() => ({ id } as Schedule));
    return applyOverlayToSchedule(current);
  },

  /**
   * Cria ou atualiza um registro de viagem/ponto diretamente da tela de Ponto Eletrônico do Motorista,
   * deixando disponível para verificação imediata do Gestor de Tráfego (com fotos da câmera do celular, KM inicial/final, passageiros, cliente e percurso).
   */
  async registerDriverPontoTrip(payload: {
    scheduleId?: string;
    employeeId: string;
    employeeName: string;
    scheduleDate: string;
    startTime: string;
    endTime?: string;
    clientName: string;
    routeCode: string;
    routeId?: string;
    vehicleId?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    initialKm: number;
    passengersCount?: number;
    photos?: string[];
    forgotPoint?: boolean;
    justification?: string;
    expectedStartTime?: string;
    startLatitude?: number;
    startLongitude?: number;
    startAddress?: string;
    direction?: 'IDA' | 'RETORNO';
  }): Promise<Schedule> {
    let targetScheduleId =
      payload.scheduleId && payload.scheduleId !== 'NEW' ? payload.scheduleId : undefined;

    // Se o motorista não selecionou explicitamente na combo, vincula automaticamente à escala oficial ativa do motorista
    if (!targetScheduleId) {
      try {
        const allSchedules = await this.findAll();
        const matchingOfficial = allSchedules.find(
          (s) =>
            !s.id.startsWith('ponto-local-') &&
            !s.id.startsWith('escala-local-') &&
            isSameDriverMatch(
              s.employee?.id || s.employeeId,
              s.employee?.name,
              payload.employeeId,
              payload.employeeName
            )
        );
        if (matchingOfficial) {
          targetScheduleId = matchingOfficial.id;
        }
      } catch {
        // segue fluxo normal
      }
    }

    if (targetScheduleId) {
      return this.registerPoint(targetScheduleId, {
        initialKm: payload.initialKm,
        forgotPoint: payload.forgotPoint,
        justification: payload.justification,
        photos: payload.photos,
        scheduleDate: payload.scheduleDate,
        expectedStartTime: payload.expectedStartTime,
        startTime: payload.startTime,
        endTime: payload.endTime,
        clientName: payload.clientName,
        routeCode: payload.routeCode,
        passengersCount: payload.passengersCount,
        vehicleId: payload.vehicleId,
        vehiclePlate: payload.vehiclePlate,
        vehicleModel: payload.vehicleModel,
        startLatitude: payload.startLatitude,
        startLongitude: payload.startLongitude,
        startAddress: payload.startAddress,
        direction: payload.direction,
      });
    }

    const nowIso = new Date().toISOString();
    const isOut = Boolean(payload.forgotPoint);
    if (isOut && (!payload.justification || !payload.justification.trim())) {
      throw new Error('Informe obrigatoriamente o motivo do não registro do ponto no horário.');
    }

    const geo =
      payload.startLatitude != null && payload.startLongitude != null && payload.startAddress
        ? {
            latitude: payload.startLatitude,
            longitude: payload.startLongitude,
            address: payload.startAddress,
          }
        : await captureDriverGeolocationAndAddress({
            routeCode: payload.routeCode,
            clientName: payload.clientName,
            isEndPoint: false,
          });
    const direction = payload.direction || inferDirectionFromRouteCode(payload.routeCode);

    const pointStatus: PointApprovalStatus = isOut ? 'PENDING_TRAFFIC_APPROVAL' : 'APPROVED';
    const photosJson = payload.photos && payload.photos.length > 0 ? JSON.stringify(payload.photos) : undefined;

    // Tenta criar no backend se possível
    try {
      const dto: CreateScheduleDTO = {
        employeeId: payload.employeeId,
        scheduleDate: payload.scheduleDate,
        shift: 'DAY',
        startTime: payload.startTime,
        endTime: payload.endTime,
        clientName: payload.clientName,
        routeCode: payload.routeCode,
        passengersCount: payload.passengersCount,
        routeId: payload.routeId && payload.routeId.length > 10 ? payload.routeId : undefined,
        vehicleId: payload.vehicleId && payload.vehicleId.length > 10 ? payload.vehicleId : undefined,
        initialKm: payload.initialKm,
        pointStatus,
        pointJustification: isOut ? payload.justification?.trim() : undefined,
        tripPhotosJson: photosJson,
        startLatitude: geo.latitude,
        startLongitude: geo.longitude,
        startAddress: geo.address,
        direction,
        status: pointStatus === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING',
        observations: `Ponto Eletrônico Motorista • Cliente: ${payload.clientName} • Percurso: ${payload.routeCode} • Endereço Inicial: ${geo.address}`,
      };
      const response = await api.post('/api/schedules', dto, { silentErrorLog: true } as any);
      if (response.data?.id) {
        saveExecutionOverlay(response.data.id, {
          employeeId: payload.employeeId,
          employeeName: payload.employeeName,
          startTime: payload.startTime,
          endTime: payload.endTime,
          clientName: payload.clientName,
          routeCode: payload.routeCode,
          passengersCount: payload.passengersCount,
          vehicleId: payload.vehicleId,
          vehiclePlate: payload.vehiclePlate,
          vehicleModel: payload.vehicleModel,
          initialKm: payload.initialKm,
          pointRegisteredAt: nowIso,
          pointStatus,
          pointJustification: isOut ? payload.justification?.trim() : undefined,
          tripPhotosJson: photosJson,
          startLatitude: geo.latitude,
          startLongitude: geo.longitude,
          startAddress: geo.address,
          direction,
          status: pointStatus === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING',
        });
        const merged = applyOverlayToSchedule(response.data);
        upsertLocalPontoSchedule(merged);
        emitDriverRecordsUpdated();
        return merged;
      }
    } catch {
      // Fallback para armazenamento local compartilhado no navegador
    }

    const localId = `ponto-local-${Date.now()}`;
    const localSchedule: Schedule = {
      id: localId,
      employeeId: payload.employeeId,
      employee: {
        id: payload.employeeId,
        name: payload.employeeName,
        position: 'MOTORISTA',
      },
      scheduleDate: payload.scheduleDate,
      shift: 'DAY',
      startTime: payload.startTime,
      endTime: payload.endTime,
      clientName: payload.clientName,
      routeCode: payload.routeCode,
      passengersCount: payload.passengersCount,
      location: {
        id: 'ponto-eletronico',
        name: payload.clientName || 'Operação Ponto Eletrônico',
      },
      route: {
        id: payload.routeId || payload.routeCode || 'route',
        name: payload.routeCode,
      },
      vehicleId: payload.vehicleId,
      vehicle: payload.vehiclePlate
        ? {
            id: payload.vehicleId || 'vehicle',
            plate: payload.vehiclePlate,
            model: payload.vehicleModel,
          }
        : undefined,
      vehiclePlate: payload.vehiclePlate,
      initialKm: payload.initialKm,
      pointRegisteredAt: nowIso,
      pointStatus,
      pointJustification: isOut ? payload.justification?.trim() : undefined,
      tripPhotosJson: photosJson,
      startLatitude: geo.latitude,
      startLongitude: geo.longitude,
      startAddress: geo.address,
      direction,
      status: pointStatus === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING',
      observations: `Ponto Eletrônico Motorista • Cliente: ${payload.clientName} • Percurso: ${payload.routeCode} • Endereço Inicial: ${geo.address}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    saveExecutionOverlay(localId, {
      employeeId: payload.employeeId,
      employeeName: payload.employeeName,
      startTime: payload.startTime,
      endTime: payload.endTime,
      clientName: payload.clientName,
      routeCode: payload.routeCode,
      passengersCount: payload.passengersCount,
      vehicleId: payload.vehicleId,
      vehiclePlate: payload.vehiclePlate,
      vehicleModel: payload.vehicleModel,
      initialKm: payload.initialKm,
      pointRegisteredAt: nowIso,
      pointStatus,
      pointJustification: isOut ? payload.justification?.trim() : undefined,
      tripPhotosJson: photosJson,
      startLatitude: geo.latitude,
      startLongitude: geo.longitude,
      startAddress: geo.address,
      direction,
      status: pointStatus === 'APPROVED' ? 'IN_PROGRESS' : 'PENDING',
    });

    upsertLocalPontoSchedule(localSchedule);
    emitDriverRecordsUpdated();
    return applyOverlayToSchedule(localSchedule);
  },

  /**
   * Aprova ou rejeita o registro de ponto fora do horário (Gestor / Encarregado de Tráfego).
   */
  async approvePoint(
    id: string,
    payload: {
      approved: boolean;
      managerNotes?: string;
      approvedBy?: string;
    }
  ): Promise<Schedule> {
    const nowIso = new Date().toISOString();
    const map = getExecutionOverlayMap();
    const existingOv = map[id] || {};
    const nextStatus: ScheduleStatus = payload.approved
      ? existingOv.finalKm != null
        ? 'COMPLETED'
        : 'IN_PROGRESS'
      : 'PENDING';

    saveExecutionOverlay(id, {
      pointStatus: payload.approved ? 'APPROVED' : 'REJECTED',
      pointApprovedBy: payload.approvedBy || 'Gestor de Tráfego',
      pointApprovedAt: nowIso,
      status: nextStatus,
    });

    const localMatch = getLocalPontoSchedules().find((s) => s.id === id);
    if (localMatch) {
      upsertLocalPontoSchedule(applyOverlayToSchedule(localMatch));
    }

    emitDriverRecordsUpdated();

    if (id.startsWith('ponto-local-') || id.startsWith('escala-local-')) {
      return applyOverlayToSchedule(localMatch || ({ id } as Schedule));
    }

    try {
      const response = await api.post(`/api/schedules/${id}/approve-point`, payload, {
        silentErrorLog: true,
      } as any);
      const res = applyOverlayToSchedule(response.data);
      emitDriverRecordsUpdated();
      return res;
    } catch {
      const current = await this.findById(id).catch(() => ({ id } as Schedule));
      const res = applyOverlayToSchedule(current);
      emitDriverRecordsUpdated();
      return res;
    }
  },

  /**
   * Registra ocorrência de atraso informada pelo motorista com motivo e tempo estimado.
   */
  async reportDelay(
    id: string,
    payload: {
      delayMinutes: number;
      delayReason: string;
      direction?: 'IDA' | 'RETORNO';
      routeName?: string;
      notes?: string;
    }
  ): Promise<Schedule> {
    const nowIso = new Date().toISOString();
    const delayNotice = `[ATRASO ${payload.delayMinutes} MIN: ${payload.delayReason}]${
      payload.notes ? ` ${payload.notes}` : ''
    }`;

    saveExecutionOverlay(id, {
      delayMinutes: payload.delayMinutes,
      delayReason: payload.delayReason,
      delayReportedAt: nowIso,
      direction: payload.direction,
      observations: delayNotice,
    });

    try {
      const rawEvents = localStorage.getItem('fleet_trip_events_v1') || '[]';
      const events = JSON.parse(rawEvents);
      events.unshift({
        id: `delay-evt-${Date.now()}`,
        scheduleId: id,
        eventType: 'DELAY',
        delayMinutes: payload.delayMinutes,
        description: `Atraso relatado pelo motorista: ${payload.delayMinutes} min (${payload.delayReason})${
          payload.notes ? ` - ${payload.notes}` : ''
        }`,
        createdAt: nowIso,
      });
      localStorage.setItem('fleet_trip_events_v1', JSON.stringify(events.slice(0, 100)));
    } catch {
      // ignore
    }

    try {
      await api.patch(
        `/api/schedules/${id}`,
        {
          delayMinutes: payload.delayMinutes,
          delayReason: payload.delayReason,
          observations: delayNotice,
        },
        { silentErrorLog: true } as any
      );
    } catch {
      // fallback já salvo no overlay
    }

    emitDriverRecordsUpdated();
    const current = await this.findById(id).catch(() => ({ id } as Schedule));
    return applyOverlayToSchedule(current);
  },

  /**
   * Finaliza a viagem da escala informando o KM Final, Horário Final, Passageiros e fotos adicionais.
   */
  async finishTrip(
    id: string,
    payload: {
      finalKm: number;
      endTime?: string;
      passengersCount?: number;
      photos?: string[];
      observations?: string;
      endLatitude?: number;
      endLongitude?: number;
      endAddress?: string;
      direction?: 'IDA' | 'RETORNO';
    }
  ): Promise<Schedule> {
    const map = getExecutionOverlayMap();
    const existingOv = map[id] || {};
    const photosJson =
      payload.photos && payload.photos.length > 0
        ? JSON.stringify(payload.photos)
        : existingOv.tripPhotosJson;

    const endGeo =
      payload.endLatitude != null && payload.endLongitude != null && payload.endAddress
        ? {
            latitude: payload.endLatitude,
            longitude: payload.endLongitude,
            address: payload.endAddress,
          }
        : await captureDriverGeolocationAndAddress({
            routeCode: existingOv.routeCode,
            clientName: existingOv.clientName,
            isEndPoint: true,
            existingStartLat: existingOv.startLatitude,
            existingStartLng: existingOv.startLongitude,
          });

    const isPendingApproval = existingOv.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
    const resolvedEndTime =
      payload.endTime ||
      new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const nextStatus: ScheduleStatus = !isPendingApproval ? 'COMPLETED' : 'PENDING';

    saveExecutionOverlay(id, {
      finalKm: payload.finalKm,
      endTime: resolvedEndTime,
      ...(payload.passengersCount != null ? { passengersCount: payload.passengersCount } : {}),
      tripPhotosJson: photosJson,
      endLatitude: endGeo.latitude,
      endLongitude: endGeo.longitude,
      endAddress: endGeo.address,
      ...(payload.direction ? { direction: payload.direction } : {}),
      ...(payload.observations ? { observations: payload.observations } : {}),
      status: nextStatus,
    });

    const localMatch = getLocalPontoSchedules().find((s) => s.id === id);
    if (localMatch) {
      upsertLocalPontoSchedule(applyOverlayToSchedule(localMatch));
    }

    emitDriverRecordsUpdated();

    if (id.startsWith('ponto-local-') || id.startsWith('escala-local-')) {
      return applyOverlayToSchedule(localMatch || ({ id } as Schedule));
    }

    try {
      const putRes = await api.put(
        `/api/schedules/${id}`,
        {
          finalKm: payload.finalKm,
          endTime: resolvedEndTime,
          passengersCount: payload.passengersCount ?? existingOv.passengersCount,
          tripPhotosJson: photosJson,
          observations: payload.observations,
          status: nextStatus,
        },
        { silentErrorLog: true } as any
      );
      if (putRes?.data?.id) {
        const res = applyOverlayToSchedule(putRes.data);
        emitDriverRecordsUpdated();
        return res;
      }
    } catch {
      // Fallback para /finish-trip
    }

    try {
      const response = await api.post(
        `/api/schedules/${id}/finish-trip`,
        {
          finalKm: payload.finalKm,
          endTime: resolvedEndTime,
          passengersCount: payload.passengersCount,
          photosJson,
          observations: payload.observations,
        },
        { silentErrorLog: true } as any
      );
      const res = applyOverlayToSchedule(response.data);
      emitDriverRecordsUpdated();
      return res;
    } catch {
      const current = await this.findById(id).catch(() => ({ id } as Schedule));
      const res = applyOverlayToSchedule(current);
      emitDriverRecordsUpdated();
      return res;
    }
  },

  /**
   * Exclui uma escala de trabalho.
   */
  async delete(id: string): Promise<void> {
    saveExecutionOverlay(id, { deleted: true });
    try {
      const remaining = getLocalPontoSchedules().filter((s) => s.id !== id);
      localStorage.setItem(LOCAL_PONTO_SCHEDULES_KEY, JSON.stringify(remaining));
    } catch {
      // ignore storage errors
    }

    if (!id.startsWith('ponto-local-') && !id.startsWith('escala-local-')) {
      try {
        await api.delete(`/api/schedules/${id}`, { silentErrorLog: true } as any);
      } catch {
        // já marcado como excluído no overlay local
      }
    }
    emitDriverRecordsUpdated();
  },

  /**
   * Busca todas as escalas de trabalho (com suporte a filtros para compatibilidade).
   */
  async getSchedules(filters?: any): Promise<Schedule[]> {
    return this.findAll();
  },

  /**
   * Exclui uma escala de trabalho (alias para delete para compatibilidade)
   */
  async deleteSchedule(id: string): Promise<void> {
    await this.delete(id);
  },

  /**
   * Escalas do usuário autenticado (portal do motorista), com fallback inteligente por nome/ID
   * para garantir que o motorista (ex: Fernando Silva Santos) sempre veja suas escalas.
   */
  async findMySchedules(filters?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    employeeName?: string;
    targetDate?: string;
  }): Promise<Schedule[]> {
    const storedUser = getCurrentStoredUser();
    const targetName = filters?.employeeName || storedUser?.name || '';
    const targetEmpId = filters?.employeeId || (storedUser?.employeeId ? String(storedUser.employeeId) : '');
    const targetUserId = storedUser?.id ? String(storedUser.id) : '';
    const targetDateStr = filters?.targetDate || filters?.startDate || new Date().toISOString().substring(0, 10);

    const mergedMap = new Map<string, Schedule>();

    // 1. Consulta direta /api/schedules/me
    try {
      const response = await api.get('/api/schedules/me', {
        params: {
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        },
        silentErrorLog: true,
      } as any);
      if (Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item && item.id) {
            mergedMap.set(item.id, applyOverlayToSchedule(item));
          }
        }
      }
    } catch {
      // Continua para os fallbacks inteligentes
    }

    // 2. Consulta geral em /api/schedules com correspondência resiliente de motorista
    try {
      const allSchedules = await this.findAll().catch(async () => {
        const rawRes = await api.get('/api/schedules', { silentErrorLog: true } as any);
        const data = rawRes?.data;
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.content)) return data.content;
        return [];
      });

      if (Array.isArray(allSchedules)) {
        for (const s of allSchedules) {
          if (!s || !s.id) continue;

          const empId = s.employee?.id ? String(s.employee.id) : (s.employeeId ? String(s.employeeId) : '');
          const empName = s.employee?.name || s.employeeName || (s as any).driverName;
          const obs = s.observations || '';
          const client = s.clientName || '';

          const matchesById =
            (targetEmpId && empId === targetEmpId) ||
            (targetUserId && empId === targetUserId);

          const matchesByName =
            isDriverNameMatch(targetName, empName) ||
            isDriverNameMatch(targetName, obs) ||
            isDriverNameMatch(targetName, client);

          if (!matchesById && !matchesByName) continue;

          const isDateRangeQuery = !!(filters?.startDate && filters?.endDate && filters.startDate !== filters.endDate);
          const sDateStr = s.scheduleDate ? s.scheduleDate.substring(0, 10) : '';

          if (isDateRangeQuery) {
            // Se for consulta de período (ex: mês do motorista), inclui todas as escalas no intervalo ou com recorrência ativa
            if (sDateStr && (sDateStr < filters!.startDate! || sDateStr > filters!.endDate!)) {
              const rec = resolveScheduleRecurrence(s);
              if (rec === 'SINGLE_DAY') continue;
            }
          } else if (targetDateStr && !isScheduleActiveForDate(s, targetDateStr)) {
            // Se não bate a data de hoje, mas é do mesmo motorista e foi criada nos últimos 20 dias, mantém como disponível
            if (sDateStr && filters?.startDate && sDateStr < filters.startDate) {
              const diffDays = Math.abs(
                (new Date(targetDateStr).getTime() - new Date(sDateStr).getTime()) / (1000 * 60 * 60 * 24)
              );
              if (diffDays > 20) continue;
            }
          }

          if (!mergedMap.has(s.id)) {
            mergedMap.set(s.id, applyOverlayToSchedule(s));
          }
        }
      }
    } catch {
      // continua
    }

    // 3. Consulta escalas de Fretamento (/api/escalas)
    try {
      const isDateRange = !!(filters?.startDate && filters?.endDate && filters.startDate !== filters.endDate);
      let escalasList = await escalaService.list(isDateRange ? undefined : targetDateStr);
      if (!Array.isArray(escalasList) || escalasList.length === 0) {
        escalasList = await escalaService.list();
      }

      if (Array.isArray(escalasList)) {
        for (const esc of escalasList as any[]) {
          const drvName = esc.driverName || esc.driver?.name;
          const drvId = String(esc.driverId || esc.driver?.id || '');
          const matchesDrv =
            (targetEmpId && drvId === targetEmpId) ||
            (targetUserId && drvId === targetUserId) ||
            isDriverNameMatch(targetName, drvName);

          if (!matchesDrv) continue;

          const escDate = esc.scaleDate ? String(esc.scaleDate).substring(0, 10) : '';
          if (isDateRange && escDate) {
            if (escDate < (filters?.startDate || '') || escDate > (filters?.endDate || '')) {
              continue;
            }
          }

          if (!mergedMap.has(esc.id)) {
            const clientTitle =
              esc.clientName ||
              esc.client?.name ||
              esc.route?.client?.name ||
              esc.routeName ||
              'Cliente da Escala';
            const plateStr = esc.vehiclePlate || esc.vehicle?.plate || undefined;
            const vehIdStr = esc.vehicleId || esc.vehicle?.id || undefined;

            const converted: Schedule = applyOverlayToSchedule({
              id: esc.id,
              employee: {
                id: drvId || targetEmpId || 'driver',
                name: drvName || targetName || 'Motorista',
              },
              scheduleDate: escDate || targetDateStr,
              shift: 'DAY',
              startTime: esc.departureTime ? String(esc.departureTime).substring(0, 5) : '08:00',
              endTime: '17:00',
              location: {
                id: esc.routeId || 'route',
                name: esc.routeName || 'Rota de Fretamento',
              },
              routeId: esc.routeId,
              route: esc.routeId ? { id: esc.routeId, name: esc.routeName || 'Rota' } : undefined,
              routeCode: esc.routeName || '01 - CASA/PONTO',
              clientName: clientTitle,
              vehicleId: vehIdStr,
              vehicle: plateStr ? { id: vehIdStr || 'vehicle', plate: plateStr } : undefined,
              vehiclePlate: plateStr,
              status:
                esc.status === 'CONCLUIDA'
                  ? 'COMPLETED'
                  : esc.status === 'EXECUTANDO'
                    ? 'IN_PROGRESS'
                    : esc.status === 'CONFIRMADA'
                      ? 'CONFIRMED'
                      : 'PENDING',
              createdAt: esc.createdAt || new Date().toISOString(),
              updatedAt: esc.createdAt || new Date().toISOString(),
            });
            mergedMap.set(esc.id, converted);
          }
        }
      }
    } catch {
      // Ignora caso /api/escalas falhe
    }

    // 4. Incluir escalas locais salvas em contingência/offline
    try {
      const localList = getLocalPontoSchedules();
      for (const loc of localList) {
        if (!loc || !loc.id) continue;
        const empName = loc.employee?.name || loc.employeeName;
        const empId = loc.employee?.id ? String(loc.employee.id) : (loc.employeeId ? String(loc.employeeId) : '');
        const matchesLoc =
          (targetEmpId && empId === targetEmpId) ||
          (targetUserId && empId === targetUserId) ||
          isDriverNameMatch(targetName, empName);

        if (matchesLoc && !mergedMap.has(loc.id)) {
          mergedMap.set(loc.id, applyOverlayToSchedule(loc));
        }
      }
    } catch {
      // ignora
    }

    // 6. Ordenar por horário de início
    return Array.from(mergedMap.values()).sort((a, b) => {
      const timeA = resolveScheduleStartTime(a);
      const timeB = resolveScheduleStartTime(b);
      return timeA.localeCompare(timeB);
    });
  },

  /**
   * PDF das escalas do usuário autenticado.
   */
  async generateMyPDFReport(filters?: {
    startDate?: string;
    endDate?: string;
    inline?: boolean;
  }): Promise<Blob> {
    const response = await api.get('/api/schedules/me/pdf', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Gera relatório PDF de escalas com filtros opcionais
   */
  async generatePDFReport(filters: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    workPostId?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      const response = await api.get('/api/schedules/report/pdf', {
        params: filters,
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        try {
          const blobText = await error.response.data.text();
          const jsonError = JSON.parse(blobText);
          if (jsonError.message) {
            throw new Error(jsonError.message);
          }
        } catch {
          // ignore
        }
      }
      throw new Error(error.response?.data?.message || 'Falha ao gerar relatório PDF');
    }
  },
};
