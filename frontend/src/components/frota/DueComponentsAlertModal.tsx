import React, { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  Bell,
  Bus,
  CheckCheck,
  CheckSquare,
  Clock,
  Layers,
  Square,
  Wrench,
} from 'lucide-react';
import { FleetComponentControlRow } from '@/services/fleetComponentControlService';

interface DueComponentsAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: FleetComponentControlRow[];
  thresholdKm?: number;
  onOpenWorkOrder: (row: FleetComponentControlRow) => void;
  onOpenMultipleWorkOrders?: (rows: FleetComponentControlRow[]) => void;
  onGoToAlertsTab?: () => void;
  title?: string;
  description?: string;
}

interface VehicleAlertGroup {
  vehicleId: string;
  plate: string;
  fleetNumber?: string;
  currentKm: number;
  items: FleetComponentControlRow[];
  overdueCount: number;
  dueSoonCount: number;
}

export const DueComponentsAlertModal: React.FC<DueComponentsAlertModalProps> = ({
  open,
  onOpenChange,
  alerts,
  thresholdKm = 3000,
  onOpenWorkOrder,
  onOpenMultipleWorkOrders,
  onGoToAlertsTab,
  title,
  description,
}) => {
  // Controle de itens selecionados para a OS (por chave vehicleId-controlType)
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});

  // Inicializar todos os itens selecionados por padrão quando o modal abrir ou alertas mudarem
  useEffect(() => {
    if (open && alerts && alerts.length > 0) {
      const initial: Record<string, boolean> = {};
      alerts.forEach((a) => {
        initial[`${a.vehicleId}-${a.controlType}`] = true;
      });
      setSelectedKeys(initial);
    }
  }, [open, alerts]);

  // Agrupar alertas por veículo
  const vehicleGroups = useMemo<VehicleAlertGroup[]>(() => {
    const map = new Map<string, VehicleAlertGroup>();
    alerts.forEach((item) => {
      let group = map.get(item.vehicleId);
      if (!group) {
        group = {
          vehicleId: item.vehicleId,
          plate: item.plate,
          fleetNumber: item.fleetNumber,
          currentKm: item.currentKm,
          items: [],
          overdueCount: 0,
          dueSoonCount: 0,
        };
        map.set(item.vehicleId, group);
      }
      group.items.push(item);
      if (item.alertStatus === 'OVERDUE') {
        group.overdueCount++;
      } else if (item.alertStatus === 'DUE_SOON') {
        group.dueSoonCount++;
      }
    });

    // Ordenar grupos: veículos com alertas vencidos primeiro, depois por placa
    return Array.from(map.values()).sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) {
        return b.overdueCount - a.overdueCount;
      }
      return a.plate.localeCompare(b.plate);
    });
  }, [alerts]);

  const totalOverdue = alerts.filter((a) => a.alertStatus === 'OVERDUE').length;
  const totalDueSoon = alerts.filter((a) => a.alertStatus === 'DUE_SOON').length;

  const toggleItem = (key: string) => {
    setSelectedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleAllForVehicle = (group: VehicleAlertGroup, selectAll: boolean) => {
    setSelectedKeys((prev) => {
      const next = { ...prev };
      group.items.forEach((item) => {
        next[`${group.vehicleId}-${item.controlType}`] = selectAll;
      });
      return next;
    });
  };

  const handleOpenUnifiedOs = (group: VehicleAlertGroup) => {
    const selectedRows = group.items.filter(
      (item) => selectedKeys[`${group.vehicleId}-${item.controlType}`] !== false
    );

    const rowsToExecute = selectedRows.length > 0 ? selectedRows : group.items;

    onOpenChange(false);
    if (onOpenMultipleWorkOrders) {
      onOpenMultipleWorkOrders(rowsToExecute);
    } else if (rowsToExecute.length > 0) {
      onOpenWorkOrder(rowsToExecute[0]);
    }
  };

  const handleOpenSingleOs = (item: FleetComponentControlRow) => {
    onOpenChange(false);
    onOpenWorkOrder(item);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[90vh] overflow-y-auto bg-seguranca-graphite border-amber-500/50 text-white p-4 sm:p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-white">
            <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <span>{title || 'Alertas de Vencimento — Controles Preventivos de Frota'}</span>
          </DialogTitle>
          <DialogDescription className="text-gray-300 text-xs sm:text-sm">
            {description || (
              <>
                Existem <strong>{totalOverdue} serviço(s) vencido(s)</strong> e{' '}
                <strong>{totalDueSoon} próximo(s) do vencimento</strong> agrupados por{' '}
                <strong>{vehicleGroups.length} veículo(s)</strong>. Selecione os itens e crie uma
                Ordem de Serviço (OS) unificada para executar todos de uma vez.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Lista de Alertas Agrupados por Veículo */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 py-1 scrollbar-thin">
          {vehicleGroups.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCheck className="h-10 w-10 mx-auto text-emerald-400 mb-2 opacity-80" />
              <p className="text-sm font-semibold">Nenhum componente com vencimento próximo ou vencido.</p>
            </div>
          ) : (
            vehicleGroups.map((group) => {
              const selectedItems = group.items.filter(
                (item) => selectedKeys[`${group.vehicleId}-${item.controlType}`] !== false
              );
              const allSelected = selectedItems.length === group.items.length;
              const hasSelected = selectedItems.length > 0;

              return (
                <div
                  key={group.vehicleId}
                  className="rounded-2xl border border-gray-700/80 bg-slate-900/80 overflow-hidden shadow-lg transition-all"
                >
                  {/* Cabeçalho do Veículo com Ação de Criar OS Unificada */}
                  <div className="bg-slate-950/90 border-b border-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-base sm:text-lg text-white tracking-wide">
                            {group.fleetNumber ? `Frota ${group.fleetNumber} • ` : ''}
                            {group.plate}
                          </span>
                          {group.overdueCount > 0 && (
                            <Badge className="bg-red-600 text-white text-[10px] font-bold">
                              {group.overdueCount} vencido(s)
                            </Badge>
                          )}
                          {group.dueSoonCount > 0 && (
                            <Badge className="bg-amber-500 text-black text-[10px] font-bold">
                              {group.dueSoonCount} próximo(s)
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">
                          KM Atual:{' '}
                          <strong className="text-gray-200">
                            {group.currentKm?.toLocaleString('pt-BR')} km
                          </strong>{' '}
                          &bull; {group.items.length} serviço(s) preventivo(s) no veículo
                        </div>
                      </div>
                    </div>

                    {/* Botões do Veículo: Marcar/Desmarcar e Criar OS Unificada */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAllForVehicle(group, !allSelected)}
                        className="text-[11px] h-8 px-2 text-gray-300 hover:text-white hover:bg-slate-800"
                        title={allSelected ? 'Desmarcar todos os itens' : 'Marcar todos os itens'}
                      >
                        {allSelected ? 'Desmarcar Todos' : 'Marcar Todos'}
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleOpenUnifiedOs(group)}
                        disabled={!hasSelected}
                        className="bg-seguranca-red hover:bg-seguranca-darkred text-white text-xs font-bold h-9 shadow-md shadow-red-950/40 gap-1.5 transition-all"
                      >
                        <Wrench className="h-4 w-4" />
                        <span>
                          Criar OS ({selectedItems.length}/{group.items.length})
                        </span>
                      </Button>
                    </div>
                  </div>

                  {/* Lista de Serviços do Veículo com Checkboxes */}
                  <div className="p-3 space-y-2">
                    {group.items.map((item) => {
                      const itemKey = `${item.vehicleId}-${item.controlType}`;
                      const isChecked = selectedKeys[itemKey] !== false;
                      const isOverdue = item.alertStatus === 'OVERDUE';

                      return (
                        <div
                          key={itemKey}
                          onClick={() => toggleItem(itemKey)}
                          className={`rounded-xl border p-2.5 sm:p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${isChecked
                            ? isOverdue
                              ? 'bg-red-950/30 border-red-500/50 hover:bg-red-950/40'
                              : 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/30'
                            : 'bg-slate-950/40 border-gray-800 opacity-60 hover:opacity-100'
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleItem(itemKey)}
                              onClick={(e) => e.stopPropagation()}
                              className="border-gray-500 data-[state=checked]:bg-seguranca-red data-[state=checked]:border-red-500 shrink-0"
                            />

                            <div className="space-y-0.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  className={`text-[9px] font-bold py-0 h-4 ${isOverdue
                                    ? 'bg-red-600 text-white'
                                    : 'bg-amber-500 text-black'
                                    }`}
                                >
                                  {isOverdue ? (
                                    <>
                                      <AlertTriangle className="h-2.5 w-2.5 mr-1" /> VENCIDO
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-2.5 w-2.5 mr-1" /> PRÓXIMO
                                    </>
                                  )}
                                </Badge>
                                <span className="font-semibold text-xs sm:text-sm text-seguranca-yellow truncate">
                                  {item.controlLabel}
                                </span>
                              </div>

                              <div className="text-[11px] text-gray-300 font-mono flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>
                                  Próx. Troca:{' '}
                                  <strong className="text-gray-100">
                                    {item.nextDueKm?.toLocaleString('pt-BR')} km
                                  </strong>
                                </span>
                                <span
                                  className={
                                    isOverdue ? 'text-red-400 font-bold' : 'text-amber-300 font-bold'
                                  }
                                >
                                  Falta: {item.kmRemaining?.toLocaleString('pt-BR')} km
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Botão de Abrir OS Individual (Opcional) */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSingleOs(item);
                            }}
                            className="text-[11px] h-7 px-2 text-gray-400 hover:text-white hover:bg-slate-800 shrink-0 hidden sm:flex"
                            title="Abrir Ordem de Serviço apenas para este serviço específico"
                          >
                            <span>OS Individual</span>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t border-gray-700/80 pt-3 flex flex-col-reverse sm:flex-row gap-2 sm:justify-between items-center">
          {onGoToAlertsTab ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onGoToAlertsTab();
              }}
              className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10 text-xs w-full sm:w-auto"
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
            className="border-gray-600 text-gray-200 text-xs w-full sm:w-auto"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DueComponentsAlertModal;

