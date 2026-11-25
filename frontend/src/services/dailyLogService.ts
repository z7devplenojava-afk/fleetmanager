import api from '@/lib/axios';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Evita montar URLs como /api/daily-logs/undefined (o backend espera um UUID). */
export const isValidDailyLogId = (value?: string | null): boolean =>
  typeof value === 'string' && UUID_REGEX.test(value.trim());

/**
 * PRD 1.0 - Módulo 5: Execução de Campo & Apontamento (Parte Diária & Telemetria).
 * RF-05.1 (estrutura + assinaturas), RF-05.2 (conciliação telemetria >5%),
 * RF-05.3 (classificação automática de viagens extras).
 */

export type TelemetryStatus = 'NOT_RECONCILED' | 'WITHIN_TOLERANCE' | 'DIVERGENT';

export const TELEMETRY_STATUS_LABELS: Record<TelemetryStatus, string> = {
  NOT_RECONCILED: 'Não conciliado',
  WITHIN_TOLERANCE: 'Dentro da tolerância',
  DIVERGENT: 'Divergente (>5%)',
};

export type ExtraTripReason = 'WEEKEND' | 'HOLIDAY' | 'OUTSIDE_SHIFT';

export const EXTRA_TRIP_REASON_LABELS: Record<ExtraTripReason, string> = {
  WEEKEND: 'Fim de semana',
  HOLIDAY: 'Feriado',
  OUTSIDE_SHIFT: 'Fora da escala',
};

export interface DailyLog {
    id: string;
    date: string;
    vehicleId: string;
    vehiclePlate: string;
    clientId?: string;
    route?: string;
    shift: string;
    initialKm: number;
    finalKm: number;
    totalKmRun: number;
    discountedKm: number;
    consideredKm: number;
    allowance: number;
    excessKm: number;
    notes?: string;
    // RF-03.5: talão
    bookId?: string | null;
    bookSequentialNumber?: number | null;
    // RF-05.1
    driverName?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    activityDescription?: string | null;
    driverSignature?: string | null;
    driverSignedAt?: string | null;
    inspectorSignature?: string | null;
    inspectorName?: string | null;
    inspectorSignedAt?: string | null;
    // RF-05.2
    telemetryKm?: number | null;
    telemetryDiffKm?: number | null;
    telemetryDiffPct?: number | null;
    telemetryStatus?: TelemetryStatus;
    telemetryImportedAt?: string | null;
    telemetrySource?: string | null;
    // RF-05.3
    extraTrip?: boolean;
    extraTripReason?: ExtraTripReason | null;
    extraTripAutoClassified?: boolean;
}

class DailyLogService {
    async getAll(): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs');
        return response.data;
    }

    async getById(id?: string | null): Promise<DailyLog | null> {
        if (!isValidDailyLogId(id)) {
            console.warn('[dailyLogService] getById ignorado: UUID inválido ou não informado.', id);
            return null;
        }
        const response = await api.get(`/api/daily-logs/${id!.trim()}`);
        return response.data;
    }

    async getByPeriod(start: string, end: string): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/by-period', {
            params: { start, end }
        });
        return response.data;
    }

    async save(log: Partial<DailyLog>): Promise<DailyLog> {
        if (isValidDailyLogId(log.id)) {
            const response = await api.put(`/api/daily-logs/${log.id!.trim()}`, log);
            return response.data;
        }
        const response = await api.post('/api/daily-logs', log);
        return response.data;
    }

    async create(log: Partial<DailyLog>): Promise<DailyLog> {
        const response = await api.post('/api/daily-logs', log);
        return response.data;
    }

    async update(id: string, log: Partial<DailyLog>): Promise<DailyLog> {
        // Id inválido/ausente: cria um registro em vez de enviar "/undefined" ao backend.
        if (!isValidDailyLogId(id)) {
            console.warn('[dailyLogService] update chamado sem UUID válido; criando novo registro.', id);
            return this.create(log);
        }
        const response = await api.put(`/api/daily-logs/${id.trim()}`, log);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        if (!isValidDailyLogId(id)) {
            console.warn('[dailyLogService] delete ignorado: UUID inválido.', id);
            return;
        }
        await api.delete(`/api/daily-logs/${id.trim()}`);
    }

    /** RF-05.1: assinatura do Fiscal da Contratante no talão de bordo. */
    async signByInspector(id: string, inspectorName: string, signature?: string): Promise<DailyLog> {
        if (!isValidDailyLogId(id)) {
            throw new Error('Não é possível assinar uma Parte Diária sem ID válido.');
        }
        const response = await api.post(`/api/daily-logs/${id.trim()}/sign-inspector`, {
            inspectorName,
            signature,
        });
        return response.data;
    }

    /** Partes Diárias assinadas pelo fiscal no período (auditoria M7). */
    async getSigned(start: string, end: string): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/signed', { params: { start, end } });
        return response.data;
    }

    /** RF-05.2: importa KM da telemetria e concilia com o apontamento. */
    async importTelemetry(id: string, telemetryKm: number, source?: string): Promise<DailyLog> {
        if (!isValidDailyLogId(id)) {
            throw new Error('Não é possível conciliar telemetria de uma Parte Diária sem ID válido.');
        }
        const response = await api.post(`/api/daily-logs/${id.trim()}/telemetry`, {
            telemetryKm,
            source,
        });
        return response.data;
    }

    /** RF-05.2: Partes Diárias com divergência >5%. */
    async getDivergent(): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/telemetry/divergent');
        return response.data;
    }

    /** RF-05.3: viagens extras classificadas automaticamente no período. */
    async getExtraTrips(start: string, end: string): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/extra-trips', { params: { start, end } });
        return response.data;
    }
}

export default new DailyLogService();
