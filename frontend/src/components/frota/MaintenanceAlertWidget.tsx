'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle2, CalendarClock, Gauge, Loader2, Wrench } from 'lucide-react';
import vehicleMaintenanceStatusService, {
  VehicleMaintenanceStatus,
  MaintenanceAlertLevel
} from '@/services/vehicleMaintenanceStatusService';

interface Props {
  vehicleId: string;
  /** Callback opcional ao clicar em "Criar OS" no card do plano crítico */
  onCreateOrder?: () => void;
}

const ALERT_CONFIG: Record<MaintenanceAlertLevel, {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  rowClass: string;
}> = {
  OVERDUE: {
    label: 'Manutenção Vencida',
    icon: AlertTriangle,
    badgeClass: 'bg-red-600 text-white',
    borderClass: 'border-red-500/40',
    textClass: 'text-red-400',
    rowClass: 'text-red-400'
  },
  UPCOMING: {
    label: 'Manutenção Próxima',
    icon: Clock,
    badgeClass: 'bg-yellow-500 text-black',
    borderClass: 'border-yellow-500/40',
    textClass: 'text-yellow-400',
    rowClass: 'text-yellow-400'
  },
  OK: {
    label: 'Manutenção em Dia',
    icon: CheckCircle2,
    badgeClass: 'bg-green-600 text-white',
    borderClass: 'border-green-500/30',
    textClass: 'text-green-400',
    rowClass: 'text-gray-300'
  },
  NO_SCHEDULE: {
    label: 'Sem Plano de Manutenção',
    icon: CalendarClock,
    badgeClass: 'bg-gray-500 text-white',
    borderClass: 'border-gray-600',
    textClass: 'text-gray-400',
    rowClass: 'text-gray-400'
  }
};

const fmtKm = (v?: number | null) =>
  v == null ? '—' : `${v.toLocaleString('pt-BR')} km`;

const MaintenanceAlertWidget: React.FC<Props> = ({ vehicleId, onCreateOrder }) => {
  const [status, setStatus] = React.useState<VehicleMaintenanceStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    vehicleMaintenanceStatusService.getStatus(vehicleId)
      .then(data => { if (!cancelled) setStatus(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="bg-seguranca-graphite border border-gray-600 rounded-lg p-4 flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando status de manutenção...
      </div>
    );
  }

  if (error || !status) {
    // Falha silenciosa: o widget é complementar, não deve quebrar o painel
    return null;
  }

  const config = ALERT_CONFIG[status.overallAlertLevel] || ALERT_CONFIG.NO_SCHEDULE;
  const AlertIcon = config.icon;

  return (
    <Card className={`bg-seguranca-graphite border ${config.borderClass}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-seguranca-lightgray flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-seguranca-yellow" /> Próxima Manutenção
          </span>
          <Badge className={config.badgeClass}>
            <AlertIcon className="h-3 w-3 mr-1" /> {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" /> Quilometragem atual:{' '}
            <b className="text-seguranca-lightgray">{fmtKm(status.currentMileage)}</b>
          </span>
          <span className="flex items-center gap-1">
            <Wrench className="h-3.5 w-3.5" /> Última:{' '}
            <b className="text-seguranca-lightgray">
              {status.lastMaintenanceDate ? new Date(status.lastMaintenanceDate).toLocaleDateString('pt-BR') : '—'}
            </b>
          </span>
        </div>

        {status.plans.length === 0 && (
          <p className="text-xs text-gray-500">
            Nenhum plano de manutenção preventiva ativo para este veículo.
          </p>
        )}

        <div className="space-y-1.5">
          {status.plans.map(plan => {
            const planCfg = ALERT_CONFIG[plan.alertLevel];
            return (
              <div
                key={plan.planId}
                className="flex items-center justify-between gap-2 bg-black/20 rounded px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-seguranca-lightgray font-medium truncate">{plan.taskName}</p>
                  <p className={`text-xs ${planCfg?.textClass || 'text-gray-400'}`}>{plan.message}</p>
                </div>
                <Badge variant="outline" className={`shrink-0 text-[10px] ${planCfg?.rowClass || ''}`}>
                  {planCfg?.label}
                </Badge>
              </div>
            );
          })}
        </div>

        {status.overallAlertLevel === 'OVERDUE' && onCreateOrder && (
          <button
            onClick={onCreateOrder}
            className="w-full mt-1 px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            Criar Ordem de Serviço para manutenção vencida
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default MaintenanceAlertWidget;
