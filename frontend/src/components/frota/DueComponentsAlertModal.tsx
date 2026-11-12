import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Clock, Wrench } from 'lucide-react';
import { FleetComponentControlRow } from '@/services/fleetComponentControlService';

interface DueComponentsAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: FleetComponentControlRow[];
  thresholdKm?: number;
  onOpenWorkOrder: (row: FleetComponentControlRow) => void;
  onGoToAlertsTab?: () => void;
}

export const DueComponentsAlertModal: React.FC<DueComponentsAlertModalProps> = ({
  open,
  onOpenChange,
  alerts,
  thresholdKm = 3000,
  onOpenWorkOrder,
  onGoToAlertsTab,
}) => {
  const overdue = alerts.filter((a) => a.alertStatus === 'OVERDUE');
  const dueSoon = alerts.filter((a) => a.alertStatus === 'DUE_SOON');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] max-h-[88vh] overflow-y-auto bg-seguranca-graphite border-amber-500/50 text-white p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-white">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <Bell className="h-5 w-5" />
            </div>
            Alertas de Vencimento — Controles Preventivos de Frota
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-xs sm:text-sm">
            Existem <strong>{overdue.length} item(ns) vencido(s)</strong> e{' '}
            <strong>{dueSoon.length} item(ns) próximo(s) do vencimento</strong> (antecedência de{' '}
            {thresholdKm.toLocaleString('pt-BR')} km) para Alinhamento, Óleo de Motor, Polia, Arranque e Alternador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1 py-1">
          {alerts.map((item) => {
            const isOverdue = item.alertStatus === 'OVERDUE';
            return (
              <div
                key={`${item.vehicleId}-${item.controlType}`}
                className={`rounded-xl border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isOverdue
                    ? 'bg-red-950/35 border-red-500/60'
                    : 'bg-amber-950/30 border-amber-500/50'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`text-[10px] font-bold ${
                        isOverdue
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-500 text-black'
                      }`}
                    >
                      {isOverdue ? (
                        <><AlertTriangle className="h-3 w-3 mr-1" /> VENCIDO</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> PRÓXIMO</>
                      )}
                    </Badge>
                    <span className="font-mono font-bold text-sm text-white">
                      {item.fleetNumber ? `Frota ${item.fleetNumber} • ` : ''}
                      {item.plate}
                    </span>
                    <span className="text-xs font-semibold text-seguranca-yellow">
                      {item.controlLabel}
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-mono flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>KM Atual: <strong>{item.currentKm.toLocaleString('pt-BR')}</strong></span>
                    <span>Próx. Troca: <strong>{item.nextDueKm.toLocaleString('pt-BR')}</strong></span>
                    <span className={isOverdue ? 'text-red-400 font-bold' : 'text-amber-300 font-bold'}>
                      KM Falta: {item.kmRemaining.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenWorkOrder(item);
                  }}
                  className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-semibold shrink-0"
                >
                  <Wrench className="h-3.5 w-3.5 mr-1.5" />
                  Abrir OS
                </Button>
              </div>
            );
          })}
        </div>

        <DialogFooter className="border-t border-gray-700 pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between">
          {onGoToAlertsTab ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onGoToAlertsTab();
              }}
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 text-xs"
            >
              Ver Aba Completa de Alertas
            </Button>
          ) : (
            <div />
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-600 text-gray-200 text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

