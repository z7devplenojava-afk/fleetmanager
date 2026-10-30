/**
 * Utilitário de cálculo de jornada e Adicional Noturno (CLT Art. 73 / Lei 13.103)
 * Horário Noturno: Estrito entre 22:00 e 05:00
 * Hora Noturna Ficta: 52 minutos e 30 segundos (fator 60 / 52.5 = 1.142857)
 */

export interface NightShiftCalculationResult {
  totalMinutes: number;           // Duração total trabalhada em minutos
  nightMinutesClock: number;      // Minutos trabalhados no relógio entre 22:00 e 05:00
  nightReducedMinutes: number;    // Minutos com redução ficta da CLT (x 1.142857)
  formattedTotal: string;         // Ex: "4h 30min"
  formattedNightClock: string;    // Ex: "1h 15min"
  formattedNightClt: string;      // Ex: "1h 26min"
  hasNightShift: boolean;         // True se houver trabalho entre 22h e 05h
}

export function calculateNightShiftMinutes(
  startDateTime: Date | string,
  endDateTime: Date | string
): NightShiftCalculationResult {
  const start = typeof startDateTime === 'string' ? new Date(startDateTime) : startDateTime;
  const end = typeof endDateTime === 'string' ? new Date(endDateTime) : endDateTime;

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() <= start.getTime()) {
    return {
      totalMinutes: 0,
      nightMinutesClock: 0,
      nightReducedMinutes: 0,
      formattedTotal: '0h 0min',
      formattedNightClock: '0h 0min',
      formattedNightClt: '0h 0min',
      hasNightShift: false,
    };
  }

  const totalMinutes = Math.floor((end.getTime() - start.getTime()) / 60000);
  let nightMinutesClock = 0;

  // Itera minuto a minuto para cálculo 100% preciso na janela 22:00 - 05:00
  const cur = new Date(start.getTime());
  while (cur.getTime() < end.getTime()) {
    const hour = cur.getHours();
    if (hour >= 22 || hour < 5) {
      nightMinutesClock++;
    }
    cur.setMinutes(cur.getMinutes() + 1);
  }

  const nightReducedMinutes = Math.round(nightMinutesClock * (60 / 52.5));

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min}min`;
  };

  return {
    totalMinutes,
    nightMinutesClock,
    nightReducedMinutes,
    formattedTotal: formatMin(totalMinutes),
    formattedNightClock: formatMin(nightMinutesClock),
    formattedNightClt: formatMin(nightReducedMinutes),
    hasNightShift: nightMinutesClock > 0,
  };
}

/**
 * Calcula adicional noturno dado apenas o dia e strings de horário ("HH:mm")
 */
export function calculateNightShiftFromTimes(
  dateStr: string,   // YYYY-MM-DD
  startTime: string, // HH:mm
  endTime: string    // HH:mm
): NightShiftCalculationResult {
  if (!startTime || !endTime) {
    return {
      totalMinutes: 0,
      nightMinutesClock: 0,
      nightReducedMinutes: 0,
      formattedTotal: '0h 0min',
      formattedNightClock: '0h 0min',
      formattedNightClt: '0h 0min',
      hasNightShift: false,
    };
  }

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const start = new Date(`${dateStr}T${String(sh || 0).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}:00`);
  let end = new Date(`${dateStr}T${String(eh || 0).padStart(2, '0')}:${String(em || 0).padStart(2, '0')}:00`);

  // Se o horário final for menor que o inicial, cruzou a meia-noite (dia seguinte)
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }

  return calculateNightShiftMinutes(start, end);
}
