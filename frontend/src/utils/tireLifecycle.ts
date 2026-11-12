import { Tire, TireLifecycleConfig } from '@/services/tireService';

export const DEFAULT_TIRE_LIFECYCLE_CONFIG: TireLifecycleConfig = {
  firstLifeMinKm: 90000,
  firstLifeMaxKm: 120000,
  secondLifeMinKm: 90000,
  secondLifeMaxKm: 140000,
  thirdLifeMinKm: 80000,
  thirdLifeMaxKm: 100000,
  maxRecapCount: 2,
  minTreadDepthTwi: 1.6,
  alertTreadDepthMm: 3.0,
  dotMaxAgeYears: 5,
  urbanCalibrationFactor: 1.0,
  metropolitanCalibrationFactor: 1.1,
  roadCalibrationFactor: 1.25,
};

export function getLifeStageLabel(tire: Pick<Tire, 'recapCount' | 'status'>): string {
  if (tire.status === 'SCRAPPED') return 'Sucateado';
  const recaps = tire.recapCount || 0;
  if (recaps === 0) return 'Novo (1ª Vida)';
  if (recaps === 1) return '1ª Recapagem (2ª Vida)';
  if (recaps === 2) return '2ª Recapagem (3ª Vida)';
  return `${recaps}ª Recapagem`;
}

export function getTireDisplayCode(tire: Pick<Tire, 'fireNumber' | 'serialNumber'>): string {
  return tire.fireNumber?.trim() ? tire.fireNumber.trim() : tire.serialNumber;
}

export function getPositionLabel(axle?: number, index?: number, code?: string): string {
  if (code) {
    switch (code) {
      case 'DE': return 'Diant. L.E (DE)';
      case 'DD': return 'Diant. L.D (DD)';
      case 'TOE': return 'Tração Ext. Esq (TOE)';
      case 'TIE': return 'Tração Int. Esq (TIE)';
      case 'TID': return 'Tração Int. Dir (TID)';
      case 'TOD': return 'Tração Ext. Dir (TOD)';
      case 'ESTEPE': return 'Estepe';
      default: return code;
    }
  }
  if (axle === 0) return 'Estepe';
  if (axle === 1) return index === 0 ? 'Diant. L.E' : 'Diant. L.D';
  if (axle === 2) return `Tração E2-${index ?? 0}`;
  if (axle != null) return `Eixo ${axle}-${index ?? 0}`;
  return '-';
}

/**
 * Avalia o DOT (4 dígitos SSAA = semana/ano) e verifica validade cronológica (padrão 5 anos).
 */
export function evaluateDotExpiration(dot?: string, maxYears = 5): {
  validFormat: boolean;
  manufactureYear?: number;
  manufactureWeek?: number;
  ageYears?: number;
  expired: boolean;
  nearExpiration: boolean;
  label: string;
} {
  if (!dot) return { validFormat: false, expired: false, nearExpiration: false, label: 'DOT não informado' };
  const digits = dot.replace(/\D/g, '');
  if (digits.length !== 4) {
    return { validFormat: false, expired: false, nearExpiration: false, label: dot };
  }
  const week = parseInt(digits.slice(0, 2), 10);
  const year = 2000 + parseInt(digits.slice(2, 4), 10);
  if (week < 1 || week > 53) {
    return { validFormat: false, expired: false, nearExpiration: false, label: dot };
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = Math.ceil(((now.getTime() - new Date(currentYear, 0, 1).getTime()) / 86400000 + 1) / 7);
  const ageYears = (currentYear - year) + (currentWeek - week) / 52;
  const expired = ageYears >= maxYears;
  const nearExpiration = !expired && ageYears >= maxYears - 0.5;
  return {
    validFormat: true,
    manufactureYear: year,
    manufactureWeek: week,
    ageYears: Math.max(0, Number(ageYears.toFixed(1))),
    expired,
    nearExpiration,
    label: `Sem ${String(week).padStart(2, '0')}/${year}`,
  };
}

export function getCalibrationFactor(lineType: string | undefined, cfg: TireLifecycleConfig): number {
  const norm = (lineType || 'URBANA').toUpperCase();
  if (norm === 'RODOVIARIA') return Number(cfg.roadCalibrationFactor) || 1.25;
  if (norm === 'METROPOLITANA') return Number(cfg.metropolitanCalibrationFactor) || 1.1;
  return Number(cfg.urbanCalibrationFactor) || 1.0;
}

export function getCycleKmRange(
  recapCount: number,
  lineType: string | undefined,
  cfg: TireLifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG
): { minKm: number; maxKm: number; lifeLabel: string } {
  const factor = getCalibrationFactor(lineType, cfg);
  let baseMin = cfg.firstLifeMinKm;
  let baseMax = cfg.firstLifeMaxKm;
  let lifeLabel = '1ª Vida (Novo)';

  if (recapCount === 1) {
    baseMin = cfg.secondLifeMinKm;
    baseMax = cfg.secondLifeMaxKm;
    lifeLabel = '2ª Vida (1ª Recapagem)';
  } else if (recapCount >= 2) {
    baseMin = cfg.thirdLifeMinKm;
    baseMax = cfg.thirdLifeMaxKm;
    lifeLabel = '3ª Vida (2ª Recapagem)';
  }

  return {
    minKm: Math.round(baseMin * factor),
    maxKm: Math.round(baseMax * factor),
    lifeLabel,
  };
}

export interface TireNextExchangeInfo {
  status: 'SCRAPPED' | 'OVERDUE' | 'DUE_SOON' | 'OK';
  headline: string;
  compactRemaining: string;
  nextActionLabel: string;
  nextLifeTargetMinKm: number;
  nextLifeTargetMaxKm: number;
  kmRemainingToMin: number;
  kmRemainingToMax: number;
  nextVehicleKmMin: number | null;
  nextVehicleKmMax: number | null;
  dueReason: string;
}

type TireMetricsInput = {
  status?: Tire['status'];
  recapCount?: number;
  lineType?: string;
  dot?: string;
  currentTreadDepth?: number;
  currentMileage?: number;
  currentLifeMileage?: number;
  installKm?: number;
  vehicleCurrentMileage?: number;
  axleNumber?: number;
};

/**
 * Calcula KM rodada no veículo atual (ou na vida atual acumulada) em tempo real e previsão clara da próxima troca.
 */
export function computeTireLiveMetrics(
  tire: TireMetricsInput,
  cfg: TireLifecycleConfig = DEFAULT_TIRE_LIFECYCLE_CONFIG
) {
  const installKm = tire.installKm || 0;
  const vehicleKm = tire.vehicleCurrentMileage || installKm;
  const mountedCycleKm = tire.status === 'IN_USE' && vehicleKm >= installKm ? vehicleKm - installKm : 0;
  const currentLifeKm = (tire.currentLifeMileage || 0) + mountedCycleKm;
  const totalCarcassKm = (tire.currentMileage || 0) + mountedCycleKm;
  const recapCount = tire.recapCount || 0;
  const maxRecaps = cfg.maxRecapCount ?? 2;
  const range = getCycleKmRange(recapCount, tire.lineType, cfg);
  const dotInfo = evaluateDotExpiration(tire.dot, cfg.dotMaxAgeYears);
  const tread = tire.currentTreadDepth != null ? Number(tire.currentTreadDepth) : null;
  const twiCritical = tread != null && tread <= Number(cfg.minTreadDepthTwi);
  const treadAlert = tread != null && tread <= Number(cfg.alertTreadDepthMm);
  const kmThresholdReached = currentLifeKm >= range.minKm;
  const kmLimitExceeded = currentLifeKm >= range.maxKm;
  const isFrontAxleRecapException = tire.status === 'IN_USE' && tire.axleNumber === 1 && recapCount > 0;
  const recapLimitReached = recapCount >= maxRecaps;

  const kmRemainingToMin = range.minKm - currentLifeKm;
  const kmRemainingToMax = range.maxKm - currentLifeKm;
  const nextVehicleKmMin =
    tire.status === 'IN_USE' && vehicleKm > 0 ? Math.max(0, vehicleKm + kmRemainingToMin) : null;
  const nextVehicleKmMax =
    tire.status === 'IN_USE' && vehicleKm > 0 ? Math.max(0, vehicleKm + kmRemainingToMax) : null;

  const nextActionLabel =
    tire.status === 'SCRAPPED'
      ? 'Carcaça Sucateada'
      : recapLimitReached
      ? 'Sucateamento (Fim de Vida)'
      : `Enviar p/ ${recapCount + 1}ª Recapagem`;

  let exchStatus: TireNextExchangeInfo['status'] = 'OK';
  let headline = `Faltam ${kmRemainingToMin.toLocaleString('pt-BR')} km`;
  let compactRemaining = `+${Math.round(kmRemainingToMin / 1000)}k`;
  let dueReason = `Meta da vida: ${(range.minKm / 1000).toFixed(0)}k–${(range.maxKm / 1000).toFixed(0)}k km`;

  if (tire.status === 'SCRAPPED') {
    exchStatus = 'SCRAPPED';
    headline = 'Ciclo Encerrado';
    compactRemaining = 'Sucata';
    dueReason = 'Pneu descartado';
  } else if (twiCritical) {
    exchStatus = 'OVERDUE';
    headline = `Troca Imediata (TWI ${tread?.toFixed(1)} mm)`;
    compactRemaining = 'TWI!';
    dueReason = `Sulco no limite legal (<= ${cfg.minTreadDepthTwi} mm)`;
  } else if (kmLimitExceeded) {
    const overKm = Math.abs(kmRemainingToMax);
    exchStatus = 'OVERDUE';
    headline = `Troca Vencida (+${overKm.toLocaleString('pt-BR')} km)`;
    compactRemaining = `-${Math.max(1, Math.round(overKm / 1000))}k`;
    dueReason = `Ultrapassou limite de ${range.maxKm.toLocaleString('pt-BR')} km na vida atual`;
  } else if (kmThresholdReached) {
    exchStatus = 'DUE_SOON';
    headline = `Na faixa de troca (restam ${kmRemainingToMax.toLocaleString('pt-BR')} km)`;
    compactRemaining = `${Math.round(kmRemainingToMax / 1000)}k lim`;
    dueReason = `Entre ${range.minKm.toLocaleString('pt-BR')} e ${range.maxKm.toLocaleString('pt-BR')} km`;
  } else if (treadAlert) {
    exchStatus = 'DUE_SOON';
    headline = `Sulco baixo (${tread?.toFixed(1)} mm) • Faltam ${kmRemainingToMin.toLocaleString('pt-BR')} km`;
    compactRemaining = `${tread?.toFixed(1)}mm`;
    dueReason = `Sulco próximo do TWI (<= ${cfg.alertTreadDepthMm} mm)`;
  } else if (dotInfo.expired) {
    exchStatus = 'DUE_SOON';
    headline = `DOT Vencido (${dotInfo.ageYears}a) • Avaliar troca`;
    compactRemaining = 'DOT!';
    dueReason = `Borracha com ${dotInfo.ageYears} anos (máx. ${cfg.dotMaxAgeYears} anos)`;
  } else if (kmRemainingToMin <= 10000) {
    exchStatus = 'DUE_SOON';
    headline = `Troca próxima: faltam ${kmRemainingToMin.toLocaleString('pt-BR')} km`;
    compactRemaining = `${Math.max(1, Math.round(kmRemainingToMin / 1000))}k`;
    dueReason = `Próximo da faixa inicial (${range.minKm.toLocaleString('pt-BR')} km)`;
  }

  const nextExchange: TireNextExchangeInfo = {
    status: exchStatus,
    headline,
    compactRemaining,
    nextActionLabel,
    nextLifeTargetMinKm: range.minKm,
    nextLifeTargetMaxKm: range.maxKm,
    kmRemainingToMin,
    kmRemainingToMax,
    nextVehicleKmMin,
    nextVehicleKmMax,
    dueReason,
  };

  return {
    mountedCycleKm,
    currentLifeKm,
    totalCarcassKm,
    range,
    dotInfo,
    twiCritical,
    treadAlert,
    kmThresholdReached,
    kmLimitExceeded,
    isFrontAxleRecapException,
    recapLimitReached,
    nextExchange,
  };
}

