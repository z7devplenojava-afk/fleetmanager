import api from '@/lib/axios';

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

    async getByPeriod(start: string, end: string): Promise<DailyLog[]> {
        const response = await api.get('/api/daily-logs/by-period', {
            params: { start, end }
        });
        return response.data;
    }

    async save(log: Partial<DailyLog>): Promise<DailyLog> {
        if (log.id) {
            const response = await api.put(`/api/daily-logs/${log.id}`, log);
            return response.data;
        } else {
            const response = await api.post('/api/daily-logs', log);
            return response.data;
        }
    }

    async delete(id: string): Promise<void> {
        await api.delete(`/api/daily-logs/${id}`);
    }

    /** RF-05.1: assinatura do Fiscal da Contratante no talão de bordo. */
    async signByInspector(id: string, inspectorName: string, signature?: string): Promise<DailyLog> {
        const response = await api.post(`/api/daily-logs/${id}/sign-inspector`, {
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
        const response = await api.post(`/api/daily-logs/${id}/telemetry`, {
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
