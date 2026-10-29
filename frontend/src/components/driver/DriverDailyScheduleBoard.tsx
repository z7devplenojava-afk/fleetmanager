import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Route as RouteIcon,
  Users,
  Gauge,
  Building2,
  Settings2,
  Sparkles,
  Save,
  Loader2,
  FileSpreadsheet,
  MapPin,
  Navigation,
  ArrowRight,
  CornerDownLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import driverRouteCodeService, {
  DriverRouteCode,
  DEFAULT_DRIVER_ROUTE_CODES,
} from '@/services/driverRouteCodeService';
import {
  scheduleService,
  Schedule,
  captureDriverGeolocationAndAddress,
  inferDirectionFromRouteCode,
} from '@/services/scheduleService';
import escalaService, { Escala } from '@/services/escalaService';
import { parteDiariaService } from '@/services/parteDiariaService';
import { DriverRouteTrajectoryMap } from '@/components/driver/DriverRouteTrajectoryMap';

export interface DailyTripRow {
  id: string;
  startTime: string;
  endTime: string;
  companyName: string;
  routeCode: string;
  startKm: string;
  endKm: string;
  passengers: string;
  scheduleId?: string;
  fromScale?: boolean;
  startAddress?: string;
  endAddress?: string;
  direction?: 'IDA' | 'RETORNO';
  pointStatus?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  delayMinutes?: number;
  delayReason?: string;
}

export const resolveRowStatus = (
  row: DailyTripRow
): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' => {
  if (row.status) return row.status;
  if (row.pointStatus === 'APPROVED' && row.endKm) return 'COMPLETED';
  const parsedEnd = Number.parseInt(row.endKm, 10);
  const parsedIni = Number.parseInt(row.startKm, 10);
  if (!Number.isNaN(parsedEnd) && parsedEnd > 0) return 'COMPLETED';
  if (!Number.isNaN(parsedIni) && parsedIni > 0) return 'IN_PROGRESS';
  return 'PENDING';
};

interface DriverDailyScheduleBoardProps {
  driverId?: string;
  driverName?: string;
  driverRole?: string;
  vehicleId?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleCurrentKm?: number;
  onKmSummaryChange?: (summary: {
    firstStartKm?: number;
    lastEndKm?: number;
    totalKm: number;
    totalPassengers: number;
    rows: DailyTripRow[];
    otherJustification: string;
  }) => void;
}

const createEmptyRow = (prevEndKm = '', defaultCompany = ''): DailyTripRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  startTime: '',
  endTime: '',
  companyName: defaultCompany,
  routeCode: '01',
  startKm: prevEndKm,
  endKm: '',
  passengers: '',
  direction: 'IDA',
  status: 'PENDING',
});

export const DriverDailyScheduleBoard: React.FC<DriverDailyScheduleBoardProps> = ({
  driverId,
  driverName = 'Motorista',
  driverRole = 'Motorista Operacional',
  vehicleId,
  vehiclePlate = '',
  vehicleModel = '',
  vehicleCurrentKm,
  onKmSummaryChange,
}) => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [roleTitle, setRoleTitle] = useState<string>(driverRole || 'Motorista');
  const [routeCodes, setRouteCodes] = useState<DriverRouteCode[]>(DEFAULT_DRIVER_ROUTE_CODES);
  const [otherJustification, setOtherJustification] = useState<string>('');
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [isLoadingScale, setIsLoadingScale] = useState<boolean>(false);
  const [isSavingDaily, setIsSavingDaily] = useState<boolean>(false);
  const [scaleLoadedCount, setScaleLoadedCount] = useState<number>(0);
  const [syncedSchedules, setSyncedSchedules] = useState<Schedule[]>([]);

  // Modal de gerenciamento de códigos de percurso por empresa
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [newCodeNumber, setNewCodeNumber] = useState<string>('');
  const [newCodeDesc, setNewCodeDesc] = useState<string>('');
  const [newCodeRequiresJust, setNewCodeRequiresJust] = useState<boolean>(false);
  const [isSavingCode, setIsSavingCode] = useState<boolean>(false);

  // Modal de Ocorrência de Atraso
  const [isDelayModalOpen, setIsDelayModalOpen] = useState<boolean>(false);
  const [delayTargetRowIndex, setDelayTargetRowIndex] = useState<number>(0);
  const [delayMinutes, setDelayMinutes] = useState<number>(15);
  const [delayReason, setDelayReason] = useState<string>('Trânsito intenso / Congestionamento');
  const [delayNotes, setDelayNotes] = useState<string>('');
  const [isSavingDelay, setIsSavingDelay] = useState<boolean>(false);

  const [rows, setRows] = useState<DailyTripRow[]>(() => [
    createEmptyRow(vehicleCurrentKm != null ? String(vehicleCurrentKm) : '', ''),
  ]);

  // Carrega códigos de percurso (padrão 01-15 + customizados da empresa)
  const loadRouteCodes = useCallback(async () => {
    try {
      const list = await driverRouteCodeService.getAll();
      if (list.length > 0) {
        setRouteCodes(list);
      }
    } catch {
      setRouteCodes(DEFAULT_DRIVER_ROUTE_CODES);
    }
  }, []);

  useEffect(() => {
    loadRouteCodes();
  }, [loadRouteCodes]);

  // Atualiza KM inicial da primeira linha se o veículo mudar e ainda estiver em branco
  useEffect(() => {
    if (vehicleCurrentKm != null) {
      setRows((prev) => {
        if (prev.length === 1 && !prev[0].startKm && !prev[0].endKm) {
          return [{ ...prev[0], startKm: String(vehicleCurrentKm) }];
        }
        return prev;
      });
    }
  }, [vehicleCurrentKm]);

  // Inferir código de percurso (01 a 15) a partir do nome da rota/turno
  const inferRouteCodeFromText = (text: string, index: number): string => {
    const trimmed = (text || '').trim();
    const directCodeMatch = trimmed.match(/^(\d{2})\b/);
    if (directCodeMatch) {
      return directCodeMatch[1];
    }
    const upper = trimmed.toUpperCase();
    if (upper.includes('CASA') && upper.includes('PONTO')) return '01';
    if (upper.includes('CASA') && upper.includes('GARAGEM')) return '02';
    if (upper.includes('CASA') && (upper.includes('FABRICA') || upper.includes('FÁBRICA'))) return '03';
    if (upper.includes('PONTO') && upper.includes('CASA')) return '04';
    if (upper.includes('PONTO') && upper.includes('GARAGEM')) return '05';
    if (upper.includes('PONTO') && (upper.includes('FABRICA') || upper.includes('FÁBRICA'))) return '06';
    if (upper.includes('GARAGEM') && upper.includes('CASA')) return '07';
    if (upper.includes('GARAGEM') && upper.includes('PONTO')) return '08';
    if (upper.includes('GARAGEM') && (upper.includes('FABRICA') || upper.includes('FÁBRICA'))) return '09';
    if ((upper.includes('FABRICA') || upper.includes('FÁBRICA')) && upper.includes('CASA')) return '10';
    if ((upper.includes('FABRICA') || upper.includes('FÁBRICA')) && upper.includes('PONTO')) return '11';
    if ((upper.includes('FABRICA') || upper.includes('FÁBRICA')) && upper.includes('GARAGEM')) return '12';
    if (upper.includes('OUTROS')) return '15';
    if (index === 0) return '06';
    if (index === 1) return '11';
    if (index === 2) return '05';
    return '01';
  };

  // Integração com a Escala de Motorista (Schedule + Escala Fretamento)
  const syncFromDriverSchedule = useCallback(
    async (silent = false) => {
      setIsLoadingScale(true);
      try {
        const [mySchedules, dateSchedules, fretamentoEscalas] = await Promise.all([
          scheduleService
            .findMySchedules({ startDate: selectedDate, endDate: selectedDate })
            .catch(() => [] as Schedule[]),
          scheduleService.findByDate(selectedDate).catch(() => [] as Schedule[]),
          escalaService.list(selectedDate).catch(() => [] as Escala[]),
        ]);

        const driverNameClean = (driverName || '').trim().toLowerCase();

        // Filtra escalas de trabalho do motorista
        const relevantSchedules = [
          ...mySchedules,
          ...dateSchedules.filter((s) => {
            if (mySchedules.some((m) => m.id === s.id)) return false;
            if (driverId && s.employee?.id === driverId) return true;
            if (driverNameClean && s.employee?.name?.trim().toLowerCase() === driverNameClean) return true;
            if (vehicleId && (s.vehicleId === vehicleId || s.vehicle?.id === vehicleId)) return true;
            return false;
          }),
        ];

        setSyncedSchedules(relevantSchedules);

        // Filtra escalas de viagens/fretamento do motorista ou veículo
        const relevantEscalas = fretamentoEscalas.filter((e) => {
          if (driverId && e.driverId === driverId) return true;
          if (driverNameClean && e.driverName?.trim().toLowerCase() === driverNameClean) return true;
          if (vehicleId && e.vehicleId === vehicleId) return true;
          return false;
        });

        const generatedRows: DailyTripRow[] = [];
        const baseKm = vehicleCurrentKm != null ? String(vehicleCurrentKm) : '';

        // 1. A partir de Escalas de Viagens (Fretamento)
        relevantEscalas.forEach((esc, idx) => {
          const dep = esc.departureTime ? esc.departureTime.substring(0, 5) : '06:00';
          const durMin = esc.estimatedDurationMinutes || 60;
          const [hh, mm] = dep.split(':').map((n) => Number.parseInt(n, 10) || 0);
          const totalMin = hh * 60 + mm + durMin;
          const endHH = String(Math.floor((totalMin / 60) % 24)).padStart(2, '0');
          const endMM = String(totalMin % 60).padStart(2, '0');

          generatedRows.push({
            id: `esc-${esc.id}`,
            startTime: dep,
            endTime: `${endHH}:${endMM}`,
            companyName: esc.routeName || 'Fretamento Operacional',
            routeCode: inferRouteCodeFromText(esc.routeName || '', idx),
            startKm: idx === 0 ? baseKm : '',
            endKm: '',
            passengers: esc.routeCapacity ? String(esc.routeCapacity) : '',
            scheduleId: esc.id,
            fromScale: true,
            direction: inferDirectionFromRouteCode(esc.routeName || '', idx),
            status:
              esc.status === 'CONCLUIDA'
                ? 'COMPLETED'
                : esc.status === 'EXECUTANDO'
                  ? 'IN_PROGRESS'
                  : esc.status === 'CANCELADA'
                    ? 'CANCELLED'
                    : 'PENDING',
          });
        });

        // 2. A partir de Schedule (Escala de Trabalho / Ponto Eletrônico do Motorista)
        relevantSchedules.forEach((sch, idx) => {
          const isPendingTraffic = sch.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
          const shiftStart =
            (!isPendingTraffic && sch.startTime ? sch.startTime.substring(0, 5) : '') ||
            sch.workPost?.shiftStart?.substring(0, 5) ||
            sch.startTime?.substring(0, 5) ||
            (sch.shift === 'NIGHT' ? '18:00' : sch.shift === 'MIXED' ? '14:00' : '06:00');
          const shiftEnd =
            sch.endTime?.substring(0, 5) ||
            sch.workPost?.shiftEnd?.substring(0, 5) ||
            '';
          const company =
            sch.clientName ||
            sch.client?.name ||
            sch.workPost?.client?.name ||
            sch.travelTrip?.client?.name ||
            sch.workPost?.name ||
            sch.travelTrip?.name ||
            sch.route?.name ||
            sch.location?.name ||
            'Operação Escala';

          const routeText = `${sch.routeCode || ''} ${sch.route?.name || ''} ${sch.travelTrip?.name || ''}`;
          const resolvedCode = inferRouteCodeFromText(routeText, generatedRows.length + idx);

          const legsCount = sch.legs || sch.travelTrip?.legs || 1;
          for (let leg = 0; leg < legsCount; leg++) {
            const rowIdx = generatedRows.length;
            generatedRows.push({
              id: `sch-${sch.id}-${leg}`,
              startTime: leg === 0 ? shiftStart : '',
              endTime: leg === legsCount - 1 ? shiftEnd : '',
              companyName: company,
              routeCode: resolvedCode,
              startKm:
                leg === 0 && sch.initialKm != null
                  ? String(sch.initialKm)
                  : rowIdx === 0
                    ? baseKm
                    : '',
              endKm:
                leg === legsCount - 1 && sch.finalKm != null
                  ? String(sch.finalKm)
                  : '',
              passengers:
                sch.passengersCount != null ? String(sch.passengersCount) : '',
              scheduleId: sch.id,
              fromScale: true,
              startAddress: sch.startAddress,
              endAddress: sch.endAddress,
              direction:
                sch.direction || inferDirectionFromRouteCode(routeText, rowIdx),
              pointStatus: sch.pointStatus,
              status:
                sch.status === 'COMPLETED' || (sch.finalKm != null && sch.finalKm > 0)
                  ? 'COMPLETED'
                  : sch.status === 'IN_PROGRESS' || (sch.initialKm != null && sch.initialKm > 0)
                    ? 'IN_PROGRESS'
                    : sch.status === 'CANCELLED'
                      ? 'CANCELLED'
                      : 'PENDING',
              delayMinutes: sch.delayMinutes,
              delayReason: sch.delayReason,
            });
          }
        });

        if (generatedRows.length > 0) {
          setRows(generatedRows);
          setScaleLoadedCount(generatedRows.length);
          if (!silent) {
            toast({
              title: 'Escala do Motorista sincronizada!',
              description: `${generatedRows.length} percurso(s) carregado(s) automaticamente da sua escala para ${new Date(
                selectedDate + 'T12:00:00'
              ).toLocaleDateString('pt-BR')}.`,
            });
          }
        } else if (!silent) {
          toast({
            title: 'Nenhuma escala programada nesta data',
            description: 'Você pode preencher os horários, empresas e códigos de percurso manualmente abaixo.',
          });
        }
      } catch (err) {
        console.warn('Erro ao sincronizar escala do motorista:', err);
      } finally {
        setIsLoadingScale(false);
      }
    },
    [selectedDate, driverId, driverName, vehicleId, vehicleCurrentKm, toast]
  );

  // Carrega automaticamente a escala ao abrir, trocar a data ou receber novos registros do Ponto Eletrônico em tempo real
  useEffect(() => {
    syncFromDriverSchedule(true);
    const handleRealtimeUpdate = () => {
      syncFromDriverSchedule(true);
    };
    window.addEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('fluxbus:driver-records-updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, [selectedDate, driverId, syncFromDriverSchedule]);

  // Cálculos consolidados do quadro
  const summary = useMemo(() => {
    let firstStartKm: number | undefined;
    let lastEndKm: number | undefined;
    let totalKm = 0;
    let totalPassengers = 0;

    rows.forEach((r) => {
      const sKm = Number.parseInt(r.startKm, 10);
      const eKm = Number.parseInt(r.endKm, 10);
      const pax = Number.parseInt(r.passengers, 10);

      if (!Number.isNaN(sKm) && sKm > 0) {
        if (firstStartKm === undefined || sKm < firstStartKm) {
          firstStartKm = sKm;
        }
      }
      if (!Number.isNaN(eKm) && eKm > 0) {
        if (lastEndKm === undefined || eKm > lastEndKm) {
          lastEndKm = eKm;
        }
      }
      if (!Number.isNaN(sKm) && !Number.isNaN(eKm) && eKm >= sKm) {
        totalKm += eKm - sKm;
      }
      if (!Number.isNaN(pax) && pax > 0) {
        totalPassengers += pax;
      }
    });

    if (totalKm === 0 && firstStartKm != null && lastEndKm != null && lastEndKm >= firstStartKm) {
      totalKm = lastEndKm - firstStartKm;
    }

    return { firstStartKm, lastEndKm, totalKm, totalPassengers };
  }, [rows]);

  // Notifica o componente pai (DriverChecklist) sempre que KM/linhas mudam
  useEffect(() => {
    if (onKmSummaryChange) {
      onKmSummaryChange({
        ...summary,
        rows,
        otherJustification,
      });
    }
  }, [summary, rows, otherJustification, onKmSummaryChange]);

  const hasCode15OrJustificationRequired = useMemo(() => {
    return rows.some((r) => {
      if (r.routeCode === '15') return true;
      const found = routeCodes.find((c) => c.code === r.routeCode);
      return Boolean(found?.requiresJustification);
    });
  }, [rows, routeCodes]);

  const handleRowChange = (index: number, field: keyof DailyTripRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === 'routeCode') {
        const codeObj = routeCodes.find((c) => c.code === value);
        const label = codeObj ? `${codeObj.code} - ${codeObj.description}` : value;
        updated[index].direction = inferDirectionFromRouteCode(label, index);
      }

      // Quando o motorista preenche o KM Final de uma linha, encadeia automaticamente como KM Inicial da próxima linha se estiver vazia
      if (field === 'endKm' && value && index + 1 < updated.length && !updated[index + 1].startKm) {
        updated[index + 1] = { ...updated[index + 1], startKm: value };
      }
      return updated;
    });

    // Captura geolocalização e nome do endereço automaticamente ao informar KM Inicial ou KM Final
    if (field === 'startKm' && value) {
      captureDriverGeolocationAndAddress('START')
        .then((geo) => {
          setRows((prev) => {
            if (!prev[index]) return prev;
            const copy = [...prev];
            if (!copy[index].startAddress) {
              copy[index] = { ...copy[index], startAddress: geo.address };
            }
            return copy;
          });
        })
        .catch(() => { });
    } else if (field === 'endKm' && value) {
      captureDriverGeolocationAndAddress('END')
        .then((geo) => {
          setRows((prev) => {
            if (!prev[index]) return prev;
            const copy = [...prev];
            if (!copy[index].endAddress) {
              copy[index] = { ...copy[index], endAddress: geo.address };
            }
            return copy;
          });
        })
        .catch(() => { });
    }
  };

  const handleAddRow = () => {
    setRows((prev) => {
      const lastRow = prev[prev.length - 1];
      const nextStartKm = lastRow?.endKm || lastRow?.startKm || (vehicleCurrentKm ? String(vehicleCurrentKm) : '');
      const nextCompany = lastRow?.companyName || '';
      const nextList = [...prev, createEmptyRow(nextStartKm, nextCompany)];
      setActiveRowIndex(nextList.length - 1);
      return nextList;
    });
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow(vehicleCurrentKm ? String(vehicleCurrentKm) : '', '')]);
      return;
    }
    setRows((prev) => prev.filter((_, idx) => idx !== index));
    if (activeRowIndex >= rows.length - 1) {
      setActiveRowIndex(Math.max(0, rows.length - 2));
    }
  };

  const handleSelectCodeFromLegend = (code: string) => {
    const targetIdx = activeRowIndex >= 0 && activeRowIndex < rows.length ? activeRowIndex : rows.length - 1;
    handleRowChange(targetIdx, 'routeCode', code);
    toast({
      title: `Código ${code} selecionado`,
      description: `Aplicado na linha #${targetIdx + 1} do quadro diário.`,
    });
  };

  const handleCreateCustomCode = async () => {
    if (!newCodeNumber.trim() || !newCodeDesc.trim()) {
      toast({
        title: 'Preencha código e descrição',
        description: 'Informe o número (ex: 16) e o percurso (ex: GARAGEM/MINA).',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingCode(true);
    try {
      await driverRouteCodeService.create({
        code: newCodeNumber,
        description: newCodeDesc,
        requiresJustification: newCodeRequiresJust,
      });
      await loadRouteCodes();
      setNewCodeNumber('');
      setNewCodeDesc('');
      setNewCodeRequiresJust(false);
      toast({
        title: 'Código de percurso adicionado!',
        description: `O código ${newCodeNumber.toUpperCase()} - ${newCodeDesc.toUpperCase()} já está disponível para uso.`,
      });
    } finally {
      setIsSavingCode(false);
    }
  };

  const handleRemoveCustomCode = async (item: DriverRouteCode) => {
    await driverRouteCodeService.remove(item.id || item.code);
    await loadRouteCodes();
    toast({
      title: 'Código removido',
      description: `O código ${item.code} foi removido.`,
    });
  };

  const handleSaveDelay = async () => {
    if (!delayReason) {
      toast({
        title: 'Selecione o motivo do atraso',
        description: 'Informe o motivo do atraso para ciência do Gestor de Tráfego.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDelay(true);
    try {
      const targetRow = rows[delayTargetRowIndex] || rows[0];
      const schId = targetRow?.scheduleId;

      if (schId) {
        await scheduleService.reportDelay(schId, {
          delayMinutes,
          delayReason,
          direction: targetRow.direction,
          routeName: targetRow.companyName,
          notes: delayNotes,
        });
      }

      setRows((prev) =>
        prev.map((r, i) =>
          i === delayTargetRowIndex
            ? { ...r, delayMinutes, delayReason }
            : r
        )
      );

      toast({
        title: 'Ocorrência de atraso registrada!',
        description: `Atraso de ${delayMinutes} min (${delayReason}) comunicado ao Gestor de Tráfego.`,
      });
      setIsDelayModalOpen(false);
      setDelayNotes('');
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar atraso',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDelay(false);
    }
  };

  const handleSaveParteDiaria = async () => {
    if (hasCode15OrJustificationRequired && !otherJustification.trim()) {
      toast({
        title: 'Justificativa obrigatória para código 15 (OUTROS)',
        description: 'Preencha o campo "Justificar outros (15)" no rodapé da tabela.',
        variant: 'destructive',
      });
      return;
    }

    const validRows = rows.filter((r) => r.startTime || r.endTime || r.companyName || r.startKm || r.endKm);
    if (validRows.length === 0) {
      toast({
        title: 'Quadro vazio',
        description: 'Preencha pelo menos uma linha de percurso antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingDaily(true);
    try {
      const firstRow = validRows[0];
      const lastRow = validRows[validRows.length - 1];

      try {
        localStorage.setItem(
          `driverDailySheet_v2_${selectedDate}_${(driverName || 'driver').replace(/\s+/g, '_')}`,
          JSON.stringify({
            driverId,
            driverName,
            date: selectedDate,
            vehiclePlate,
            rows: validRows,
          })
        );
      } catch {
        // ignore storage error
      }

      try {
        await parteDiariaService.createParteDiaria({
          number: `FD-${selectedDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
          date: selectedDate,
          clientName: firstRow.companyName || 'Operação Diária',
          obraName: firstRow.companyName || 'Escala Motorista',
          vehicleId: vehicleId || undefined,
          vehiclePlate: vehiclePlate || 'SEM-PLACA',
          vehicleModel: vehicleModel || 'ÔNIBUS',
          driverId: driverId || undefined,
          driverName: driverName || 'Motorista',
          startTime: firstRow.startTime || '06:00',
          endTime: lastRow.endTime || '18:00',
          startKm: summary.firstStartKm ?? 0,
          endKm: summary.lastEndKm ?? 0,
          drivenKm: summary.totalKm,
          consideredKm: summary.totalKm,
          status: 'LANÇADA',
          notes: otherJustification
            ? `Formulário Diário do Motorista (${roleTitle}). Justificativa (15 - Outros): ${otherJustification}`
            : `Formulário Diário do Motorista (${roleTitle}) integrado à Escala.`,
          atividades: validRows.map((r) => {
            const codeObj = routeCodes.find((c) => c.code === r.routeCode);
            const codeLabel = codeObj ? `${codeObj.code} - ${codeObj.description}` : r.routeCode;
            return {
              startTime: r.startTime || '--:--',
              endTime: r.endTime || '--:--',
              companyName: r.companyName || 'Empresa',
              routeCode: r.routeCode,
              startKm: Number.parseInt(r.startKm, 10) || undefined,
              endKm: Number.parseInt(r.endKm, 10) || undefined,
              passengersCount: Number.parseInt(r.passengers, 10) || undefined,
              activityType: r.routeCode,
              description: `[${codeLabel}] ${r.companyName || 'Percurso'}${r.passengers ? ` (${r.passengers} pass.)` : ''
                }`,
              notes: r.routeCode === '15' ? otherJustification : undefined,
            };
          }),
        });
      } catch {
        // Continua sincronização com a Escala / Ponto Operacional mesmo se o veículo não tiver sido selecionado na Parte Diária
      }

      // Sincroniza também cada linha com a Escala / Ponto Operacional + Geolocalização e Endereço para exibir no Mapa de Trajeto e no Gestor de Tráfego
      for (let i = 0; i < validRows.length; i++) {
        const r = validRows[i];
        const codeObj = routeCodes.find((c) => c.code === r.routeCode);
        const fullRouteLabel = codeObj ? `${codeObj.code} - ${codeObj.description}` : r.routeCode;
        const parsedIni = Number.parseInt(r.startKm, 10);
        const parsedEnd = Number.parseInt(r.endKm, 10);
        const parsedPax = Number.parseInt(r.passengers, 10) || 0;
        const dir = r.direction || inferDirectionFromRouteCode(fullRouteLabel, i);

        if (!Number.isNaN(parsedIni) && parsedIni >= 0) {
          const savedSch = await scheduleService.registerDriverPontoTrip({
            scheduleId: r.scheduleId,
            employeeId: driverId || 'driver',
            employeeName: driverName || 'Motorista',
            scheduleDate: selectedDate,
            startTime: r.startTime || '06:00',
            endTime: r.endTime || undefined,
            clientName: r.companyName || 'Operação Diária',
            routeCode: fullRouteLabel,
            direction: dir,
            vehicleId: vehicleId || undefined,
            vehiclePlate: vehiclePlate || undefined,
            vehicleModel: vehicleModel || undefined,
            initialKm: parsedIni,
            passengersCount: parsedPax,
            startAddress: r.startAddress,
          });

          if (!Number.isNaN(parsedEnd) && parsedEnd >= parsedIni) {
            await scheduleService.finishTrip(savedSch.id, {
              finalKm: parsedEnd,
              endTime: r.endTime || undefined,
              passengersCount: parsedPax,
              endAddress: r.endAddress,
              direction: dir,
            });
          }
        }
      }

      await syncFromDriverSchedule(true);

      toast({
        title: 'Formulário Diário e Trajeto GPS registrados com sucesso!',
        description: `${validRows.length} percurso(s) sincronizado(s) em tempo real com o Mapa de Trajeto e Gestor de Tráfego (${summary.totalKm} km rodados).`,
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar Formulário Diário',
        description: err?.response?.data?.message || err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDaily(false);
    }
  };

  return (
    <Card className="border-primary/30 shadow-md overflow-hidden">
      <CardHeader className="bg-muted/40 border-b p-3.5 sm:p-6 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base sm:text-xl font-black tracking-tight flex items-start sm:items-center gap-2 uppercase leading-snug">
                <FileSpreadsheet className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <span>Formulário Diário — Controle de Percursos e Escala</span>
              </CardTitle>
              {scaleLoadedCount > 0 && (
                <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-semibold text-xs">
                  <Sparkles className="h-3 w-3 mr-1" /> {scaleLoadedCount} da Escala
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Quadro diário integrado com a Escala de Motorista (Horário, Empresa, Código do Percurso, Km Inicial/Final e Passageiros).
            </CardDescription>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDelayTargetRowIndex(activeRowIndex || 0);
                setIsDelayModalOpen(true);
              }}
              className="w-full sm:w-auto h-9 gap-1.5 border-amber-500/60 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-bold text-xs justify-center"
              title="Informar ocorrência de atraso na rota"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Informar Atraso</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => syncFromDriverSchedule(false)}
              disabled={isLoadingScale}
              className="w-full sm:w-auto h-9 gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-semibold text-xs justify-center"
            >
              {isLoadingScale ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              )}
              <span className="truncate">Sincronizar Escala</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCodeModalOpen(true)}
              className="w-full sm:w-auto h-9 gap-1.5 text-xs justify-center"
            >
              <Settings2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Códigos ({routeCodes.length})</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveParteDiaria}
              disabled={isSavingDaily}
              className="col-span-2 sm:w-auto h-10 sm:h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm justify-center"
            >
              {isSavingDaily ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Save className="h-4 w-4 shrink-0" />
              )}
              <span>Salvar Quadro Diário</span>
            </Button>
          </div>
        </div>

        {/* Cabeçalho fiel ao Formulário Diário: Nome | Função | Data | Veículo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-3 mt-3 border-t border-border/60">
          <div className="space-y-1 min-w-0">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground truncate block">Nome do Motorista</Label>
            <div className="h-9 px-2.5 sm:px-3 rounded-lg border bg-background/80 flex items-center text-xs sm:text-sm font-bold truncate">
              {driverName || 'Motorista Logado'}
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Função</Label>
            <Input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="Motorista"
              className="h-9 text-xs sm:text-sm font-semibold bg-background/80"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-primary shrink-0" /> Data
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 text-xs sm:text-sm font-mono font-bold bg-background/80 px-2"
            />
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-[10px] sm:text-[11px] font-bold uppercase text-muted-foreground">Veículo</Label>
            <div className="h-9 px-2.5 sm:px-3 rounded-lg border bg-background/80 flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="truncate">{vehiclePlate || 'Selecione acima'}</span>
              {vehicleModel && (
                <Badge variant="outline" className="text-[9px] ml-1 shrink-0 hidden sm:inline-flex">
                  {vehicleModel}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 space-y-4">
        {/* Layout em 2 colunas no Desktop igual à folha física: Tabela à esquerda + Coluna "Código - Percurso" à direita */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Quadro Principal (Horário | Empresa | Percurso (cód.) | Km Inicial/Final | Qtde. Passageiros) */}
          <div className="xl:col-span-9 space-y-3">
            {/* Visão Mobile em Cards (sem rolagem horizontal) */}
            <div className="md:hidden space-y-3">
              {rows.map((row, index) => {
                const isSelectedRow = activeRowIndex === index;
                const sKm = Number.parseInt(row.startKm, 10);
                const eKm = Number.parseInt(row.endKm, 10);
                const rowKmDiff =
                  !Number.isNaN(sKm) && !Number.isNaN(eKm) && eKm >= sKm ? eKm - sKm : null;

                return (
                  <div
                    key={row.id}
                    onClick={() => setActiveRowIndex(index)}
                    className={`rounded-xl border p-3 space-y-2.5 transition-all ${isSelectedRow ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold">
                          Percurso #{index + 1}
                        </Badge>
                        {row.fromScale && (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                            Da Escala
                          </Badge>
                        )}
                        {rowKmDiff !== null && rowKmDiff > 0 && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                            +{rowKmDiff} km
                          </Badge>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRow(index);
                        }}
                        className="h-7 w-7 text-muted-foreground hover:text-red-500"
                        title="Remover linha"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Sentido (Ida / Retorno) & Status Operacional */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-lg bg-muted/30 border border-border/70">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground mr-0.5">Sentido:</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowChange(index, 'direction', 'IDA');
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded border transition-all ${
                            (row.direction || 'IDA') === 'IDA'
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-background/80 text-muted-foreground border-border hover:text-foreground'
                          }`}
                        >
                          ➡️ IDA
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowChange(index, 'direction', 'RETORNO');
                          }}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded border transition-all ${
                            row.direction === 'RETORNO'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                              : 'bg-background/80 text-muted-foreground border-border hover:text-foreground'
                          }`}
                        >
                          ⬅️ RETORNO
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          value={resolveRowStatus(row)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowChange(index, 'status', e.target.value as any);
                          }}
                          aria-label="Status do percurso"
                          className={`h-7 px-2 text-[11px] font-bold rounded border ${
                            resolveRowStatus(row) === 'COMPLETED'
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                              : resolveRowStatus(row) === 'IN_PROGRESS'
                                ? 'bg-blue-950/60 text-blue-400 border-blue-500/50'
                                : resolveRowStatus(row) === 'CANCELLED'
                                  ? 'bg-red-950/60 text-red-400 border-red-500/50'
                                  : 'bg-amber-950/60 text-amber-400 border-amber-500/50'
                          }`}
                        >
                          <option value="PENDING">⏳ Pendente</option>
                          <option value="IN_PROGRESS">🔵 Em Execução</option>
                          <option value="COMPLETED">✅ Concluído</option>
                          <option value="CANCELLED">❌ Cancelado</option>
                        </select>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDelayTargetRowIndex(index);
                            setIsDelayModalOpen(true);
                          }}
                          className="h-7 px-2 text-[10px] font-bold rounded bg-amber-500/15 text-amber-400 border border-amber-500/40 hover:bg-amber-500/25 flex items-center gap-1"
                          title="Informar atraso neste percurso"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Atraso</span>
                        </button>
                      </div>
                    </div>

                    {/* Aviso de Atraso se registrado */}
                    {row.delayMinutes != null && row.delayMinutes > 0 && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/50 border border-red-500/50 text-[11px] font-semibold text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 animate-pulse" />
                        <span>Atraso: +{row.delayMinutes} min ({row.delayReason || 'Informado pelo motorista'})</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Início</Label>
                        <Input
                          type="time"
                          value={row.startTime}
                          onChange={(e) => handleRowChange(index, 'startTime', e.target.value)}
                          className="h-9 mt-0.5 text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Término</Label>
                        <Input
                          type="time"
                          value={row.endTime}
                          onChange={(e) => handleRowChange(index, 'endTime', e.target.value)}
                          className="h-9 mt-0.5 text-xs font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Empresa / Cliente</Label>
                        <Input
                          value={row.companyName}
                          onChange={(e) => handleRowChange(index, 'companyName', e.target.value)}
                          placeholder="Cliente / Empresa..."
                          className="h-9 mt-0.5 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Percurso (Código)</Label>
                        <select
                          value={row.routeCode}
                          onChange={(e) => handleRowChange(index, 'routeCode', e.target.value)}
                          aria-label="Código de Percurso"
                          className="w-full h-9 mt-0.5 rounded-md border border-input bg-background px-2.5 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {routeCodes.map((rc) => (
                            <option key={rc.code} value={rc.code}>
                              {rc.code} - {rc.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">KM Inicial</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={row.startKm}
                          onChange={(e) => handleRowChange(index, 'startKm', e.target.value)}
                          placeholder="KM Ini"
                          className="h-9 mt-0.5 px-2 text-xs font-mono font-semibold text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">KM Final</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={row.endKm}
                          onChange={(e) => handleRowChange(index, 'endKm', e.target.value)}
                          placeholder="KM Fim"
                          className="h-9 mt-0.5 px-2 text-xs font-mono font-bold text-emerald-500 text-center"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground">Passag.</Label>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={row.passengers}
                          onChange={(e) => handleRowChange(index, 'passengers', e.target.value)}
                          placeholder="0"
                          className="h-9 mt-0.5 px-2 text-xs font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Justificar outros (15) no Mobile */}
              <div
                className={`p-3 rounded-xl border flex flex-col gap-1.5 ${hasCode15OrJustificationRequired
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-muted/30 border-border'
                  }`}
              >
                <Label className="text-xs font-bold flex items-center gap-1.5">
                  Justificar outros (15):
                  {hasCode15OrJustificationRequired && (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                      Obrigatório
                    </Badge>
                  )}
                </Label>
                <Input
                  value={otherJustification}
                  onChange={(e) => setOtherJustification(e.target.value)}
                  placeholder="Descreva o motivo caso utilize o código 15 - OUTROS..."
                  className="h-9 text-xs bg-background"
                />
              </div>
            </div>

            {/* Visão Desktop em Tabela */}
            <div className="hidden md:block rounded-xl border border-border overflow-x-auto bg-card">
              <table className="w-full text-xs sm:text-sm border-collapse min-w-[840px]">
                <thead>
                  <tr className="bg-muted/70 border-b border-border text-foreground font-bold uppercase text-[11px]">
                    <th colSpan={2} className="py-2 px-2 text-center border-r border-border">
                      Horário
                    </th>
                    <th rowSpan={2} className="py-2 px-2.5 text-left border-r border-border min-w-[140px]">
                      Empresa
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center border-r border-border w-[145px]">
                      Percurso (cód.)
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center border-r border-border w-[130px]">
                      Sentido
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center border-r border-border w-[125px]">
                      Status
                    </th>
                    <th colSpan={2} className="py-2 px-2 text-center border-r border-border">
                      Km
                    </th>
                    <th rowSpan={2} className="py-2 px-2 text-center border-r border-border w-[85px]">
                      Qtde.
                      <span className="block text-[9px] font-normal text-muted-foreground">Passag.</span>
                    </th>
                    <th rowSpan={2} className="py-2 px-1 text-center w-[60px]">
                      Ação
                    </th>
                  </tr>
                  <tr className="bg-muted/40 border-b border-border text-[10px] uppercase text-muted-foreground font-bold">
                    <th className="py-1.5 px-2 text-center border-r border-border w-[80px]">Início</th>
                    <th className="py-1.5 px-2 text-center border-r border-border w-[80px]">Término</th>
                    <th className="py-1.5 px-2 text-center border-r border-border w-[95px]">Inicial</th>
                    <th className="py-1.5 px-2 text-center border-r border-border w-[95px]">Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {rows.map((row, index) => {
                    const isSelectedRow = activeRowIndex === index;
                    const sKm = Number.parseInt(row.startKm, 10);
                    const eKm = Number.parseInt(row.endKm, 10);
                    const rowKmDiff =
                      !Number.isNaN(sKm) && !Number.isNaN(eKm) && eKm >= sKm ? eKm - sKm : null;

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setActiveRowIndex(index)}
                        className={`transition-colors ${isSelectedRow ? 'bg-primary/5' : 'hover:bg-muted/20'
                          }`}
                      >
                        <td className="p-1.5 border-r border-border/60">
                          <Input
                            type="time"
                            value={row.startTime}
                            onChange={(e) => handleRowChange(index, 'startTime', e.target.value)}
                            className="h-8 px-1.5 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <Input
                            type="time"
                            value={row.endTime}
                            onChange={(e) => handleRowChange(index, 'endTime', e.target.value)}
                            className="h-8 px-1.5 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <div className="relative flex items-center gap-1">
                            <Input
                              value={row.companyName}
                              onChange={(e) => handleRowChange(index, 'companyName', e.target.value)}
                              placeholder="Cliente / Empresa..."
                              className="h-8 text-xs font-medium"
                            />
                            {row.fromScale && (
                              <span
                                title="Carregado da Escala de Motorista"
                                className="shrink-0 w-2 h-2 rounded-full bg-emerald-500"
                              />
                            )}
                          </div>
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <select
                            value={row.routeCode}
                            onChange={(e) => handleRowChange(index, 'routeCode', e.target.value)}
                            aria-label="Código de Percurso"
                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {routeCodes.map((rc) => (
                              <option key={rc.code} value={rc.code}>
                                {rc.code} - {rc.description}
                              </option>
                            ))}
                          </select>
                        </td>
                        {/* Coluna Sentido: IDA / RETORNO */}
                        <td className="p-1.5 border-r border-border/60 text-center">
                          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/40">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowChange(index, 'direction', 'IDA');
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                (row.direction || 'IDA') === 'IDA'
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'text-muted-foreground hover:text-white'
                              }`}
                              title="Sentido Ida"
                            >
                              IDA
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowChange(index, 'direction', 'RETORNO');
                              }}
                              className={`px-2 py-0.5 text-[10px] font-bold rounded transition-all ${
                                row.direction === 'RETORNO'
                                  ? 'bg-amber-600 text-white shadow-sm'
                                  : 'text-muted-foreground hover:text-white'
                              }`}
                              title="Sentido Retorno"
                            >
                              RETORNO
                            </button>
                          </div>
                        </td>
                        {/* Coluna Status Operacional */}
                        <td className="p-1.5 border-r border-border/60 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={resolveRowStatus(row)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleRowChange(index, 'status', e.target.value as any);
                              }}
                              aria-label="Status do percurso"
                              className={`h-7 px-1.5 text-[10px] font-bold rounded border ${
                                resolveRowStatus(row) === 'COMPLETED'
                                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/50'
                                  : resolveRowStatus(row) === 'IN_PROGRESS'
                                    ? 'bg-blue-950/60 text-blue-400 border-blue-500/50'
                                    : resolveRowStatus(row) === 'CANCELLED'
                                      ? 'bg-red-950/60 text-red-400 border-red-500/50'
                                      : 'bg-amber-950/60 text-amber-400 border-amber-500/50'
                              }`}
                            >
                              <option value="PENDING">⏳ Pendente</option>
                              <option value="IN_PROGRESS">🔵 Em Execução</option>
                              <option value="COMPLETED">✅ Concluído</option>
                              <option value="CANCELLED">❌ Cancelado</option>
                            </select>
                            {row.delayMinutes != null && row.delayMinutes > 0 && (
                              <span
                                className="text-[9px] font-bold text-red-400 flex items-center gap-0.5 bg-red-950/60 px-1 py-0.5 rounded border border-red-500/40"
                                title={row.delayReason || 'Atraso informado'}
                              >
                                <AlertTriangle className="h-2.5 w-2.5 shrink-0" /> +{row.delayMinutes}m
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <Input
                            type="number"
                            min={0}
                            value={row.startKm}
                            onChange={(e) => handleRowChange(index, 'startKm', e.target.value)}
                            placeholder="KM Ini"
                            className="h-8 px-2 text-xs font-mono font-semibold text-center"
                          />
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <div className="space-y-0.5">
                            <Input
                              type="number"
                              min={0}
                              value={row.endKm}
                              onChange={(e) => handleRowChange(index, 'endKm', e.target.value)}
                              placeholder="KM Fim"
                              className="h-8 px-2 text-xs font-mono font-bold text-emerald-500 text-center"
                            />
                            {rowKmDiff !== null && rowKmDiff > 0 && (
                              <span className="block text-[10px] text-center font-mono text-emerald-500 font-semibold">
                                +{rowKmDiff} km
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-1.5 border-r border-border/60">
                          <Input
                            type="number"
                            min={0}
                            value={row.passengers}
                            onChange={(e) => handleRowChange(index, 'passengers', e.target.value)}
                            placeholder="0"
                            className="h-8 px-1.5 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="p-1 text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDelayTargetRowIndex(index);
                                setIsDelayModalOpen(true);
                              }}
                              className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20"
                              title="Informar atraso neste percurso"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveRow(index);
                              }}
                              className="h-7 w-7 text-muted-foreground hover:text-red-500"
                              title="Remover linha"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Rodapé fiel ao formulário físico: Justificar outros (15) */}
              <div
                className={`p-3 border-t flex flex-col sm:flex-row sm:items-center gap-2 transition-colors ${hasCode15OrJustificationRequired
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-muted/30 border-border'
                  }`}
              >
                <Label className="text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
                  Justificar outros (15):
                  {hasCode15OrJustificationRequired && (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-500">
                      Obrigatório
                    </Badge>
                  )}
                </Label>
                <Input
                  value={otherJustification}
                  onChange={(e) => setOtherJustification(e.target.value)}
                  placeholder="Descreva o motivo caso utilize o código 15 - OUTROS ou rota extra..."
                  className="h-8 text-xs flex-1 bg-background"
                />
              </div>
            </div>

            {/* Barra de ações e totalizadores */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="gap-1.5 font-semibold border-dashed border-primary/50 text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" /> Adicionar Linha de Percurso
              </Button>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="py-1 px-2.5 font-mono">
                  <Gauge className="h-3.5 w-3.5 mr-1 text-blue-500" />
                  KM Inicial: <strong className="ml-1">{summary.firstStartKm ?? '—'}</strong>
                </Badge>
                <Badge variant="outline" className="py-1 px-2.5 font-mono">
                  <Gauge className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                  KM Final: <strong className="ml-1">{summary.lastEndKm ?? '—'}</strong>
                </Badge>
                <Badge className="bg-emerald-600 text-white py-1 px-2.5 font-mono">
                  Rodado: {summary.totalKm} km
                </Badge>
                <Badge variant="secondary" className="py-1 px-2.5 font-mono">
                  <Users className="h-3.5 w-3.5 mr-1 text-primary" />
                  Passageiros: {summary.totalPassengers}
                </Badge>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Quadro "Código - Percurso" (Fiel à folha impressa) */}
          <div className="xl:col-span-3 rounded-xl border border-border bg-muted/20 overflow-hidden">
            <div className="bg-muted/80 px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <RouteIcon className="h-3.5 w-3.5 text-primary" /> Código - Percurso
              </span>
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                + Criar código
              </button>
            </div>
            <div className="divide-y divide-border/60 max-h-[380px] overflow-y-auto">
              {routeCodes.map((rc) => {
                const isUsed = rows.some((r) => r.routeCode === rc.code);
                return (
                  <button
                    key={rc.code}
                    type="button"
                    onClick={() => handleSelectCodeFromLegend(rc.code)}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition-colors hover:bg-primary/10 ${isUsed ? 'bg-primary/10 font-bold text-primary' : 'text-foreground/90'
                      }`}
                    title="Clique para aplicar na linha selecionada"
                  >
                    <span className="font-mono">
                      <strong>{rc.code}</strong> - {rc.description}
                    </span>
                    {isUsed && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="p-2 bg-muted/40 border-t border-border text-[10px] text-muted-foreground text-center">
              Toque em um código para preencher a linha #{activeRowIndex + 1}
            </div>
          </div>
        </div>

        {/* Listagem em Tempo Real dos Registros do Motorista + Endereços GPS e Mapa de Trajeto (Ida / Retorno) */}
        <div className="pt-4 border-t border-border space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                <MapPin className="h-4 w-4 text-emerald-500" />
                Registros do Motorista em Tempo Real & Endereços GPS ({rows.filter((r) => r.startTime || r.startKm || r.companyName).length})
              </h4>
              <span className="text-[11px] text-muted-foreground">
                Atualizado automaticamente conforme o motorista registra o Ponto, KM Inicial e KM Final
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rows.map((r, idx) => {
                const codeObj = routeCodes.find((c) => c.code === r.routeCode);
                const codeLabel = codeObj ? `${codeObj.code} - ${codeObj.description}` : r.routeCode;
                const dir = r.direction || inferDirectionFromRouteCode(codeLabel, idx);
                const sKm = Number.parseInt(r.startKm, 10);
                const eKm = Number.parseInt(r.endKm, 10);
                const diff = !Number.isNaN(sKm) && !Number.isNaN(eKm) && eKm >= sKm ? eKm - sKm : null;

                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveRowIndex(idx)}
                    className={`rounded-xl border p-3 text-xs transition-all cursor-pointer ${activeRowIndex === idx
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-muted/20 hover:bg-muted/40'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          className={`text-[10px] ${dir === 'IDA'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            }`}
                        >
                          {dir === 'IDA' ? (
                            <span className="flex items-center gap-1">
                              <ArrowRight className="h-3 w-3" /> SENTIDO IDA
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <CornerDownLeft className="h-3 w-3" /> SENTIDO RETORNO
                            </span>
                          )}
                        </Badge>
                        <span className="font-bold text-foreground">{codeLabel}</span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        🕒 {r.startTime || '--:--'} → {r.endTime || 'em curso'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                      <span>
                        <strong className="text-foreground">Empresa:</strong> {r.companyName || 'Não informada'}
                      </span>
                      <span>
                        <strong className="text-foreground">KM:</strong> {r.startKm || '—'} → {r.endKm || '—'}
                        {diff !== null ? ` (+${diff} km)` : ''}
                      </span>
                      <span>
                        <strong className="text-foreground">Passageiros:</strong> {r.passengers || '0'}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/60 space-y-1 text-[11px]">
                      <div className="flex items-start gap-1.5 text-emerald-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="truncate" title={r.startAddress || 'Capturado ao informar o KM Inicial'}>
                          <strong>Endereço KM Inicial:</strong>{' '}
                          {r.startAddress || (r.startKm ? 'Localização GPS registrada no início do percurso' : 'Aguardando KM Inicial')}
                        </span>
                      </div>
                      <div className="flex items-start gap-1.5 text-amber-400">
                        <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="truncate" title={r.endAddress || 'Capturado ao informar o KM Final'}>
                          <strong>Endereço KM Final:</strong>{' '}
                          {r.endAddress || (r.endKm ? 'Localização GPS registrada no término do percurso' : 'Aguardando KM Final')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mapa Interativo do Trajeto da Rota (Sentido Ida e Sentido Retorno) */}
          <DriverRouteTrajectoryMap
            schedules={syncedSchedules}
            driverName={driverName}
            heightClass="h-[340px]"
          />
        </div>
      </CardContent>

      {/* Modal para a empresa adicionar/personalizar códigos de percurso */}
      <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-primary" />
              Códigos de Percurso da Empresa
            </DialogTitle>
            <DialogDescription>
              Os códigos 01 a 15 são padrão do formulário diário. Sua empresa pode adicionar novos códigos personalizados conforme suas rotas e contratos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl border bg-muted/30">
              <div>
                <Label className="text-xs font-bold">Código *</Label>
                <Input
                  value={newCodeNumber}
                  onChange={(e) => setNewCodeNumber(e.target.value)}
                  placeholder="Ex: 16"
                  maxLength={10}
                  className="h-9 mt-1 font-mono font-bold uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-bold">Descrição do Percurso *</Label>
                <Input
                  value={newCodeDesc}
                  onChange={(e) => setNewCodeDesc(e.target.value)}
                  placeholder="Ex: GARAGEM/MINA CUIABÁ"
                  className="h-9 mt-1 uppercase"
                />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between pt-1">
                <label className="text-xs flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCodeRequiresJust}
                    onChange={(e) => setNewCodeRequiresJust(e.target.checked)}
                    className="rounded border-input"
                  />
                  Exigir preenchimento de justificativa quando selecionado
                </label>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateCustomCode}
                  disabled={isSavingCode}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Adicionar Código
                </Button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-xl divide-y">
              {routeCodes.map((rc) => {
                const isDefault = Number.parseInt(rc.code, 10) >= 1 && Number.parseInt(rc.code, 10) <= 15 && !rc.id;
                return (
                  <div key={rc.code} className="px-3 py-2 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-primary">{rc.code}</span>
                      <span className="mx-1.5">—</span>
                      <span className="font-semibold">{rc.description}</span>
                      {rc.requiresJustification && (
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          Requer justificativa
                        </Badge>
                      )}
                    </div>
                    {!isDefault && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleRemoveCustomCode(rc)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCodeModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Informar Ocorrência de Atraso */}
      <Dialog open={isDelayModalOpen} onOpenChange={setIsDelayModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Informar Ocorrência de Atraso na Rota
            </DialogTitle>
            <DialogDescription>
              Comunique imediatamente o Gestor de Tráfego sobre atrasos no início, trajeto ou desembarque.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Seleção do Percurso */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Percurso / Escala Afetada
              </Label>
              <select
                value={delayTargetRowIndex}
                onChange={(e) => setDelayTargetRowIndex(Number(e.target.value))}
                aria-label="Percurso com atraso"
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-semibold text-foreground focus:ring-2 focus:ring-primary"
              >
                {rows.map((r, i) => (
                  <option key={r.id} value={i}>
                    Percurso #{i + 1} — {r.companyName || 'Cliente'} (
                    {(r.direction || 'IDA') === 'IDA' ? 'Ida' : 'Retorno'}
                    {r.startTime ? ` • ${r.startTime}` : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Tempo Estimado de Atraso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-amber-500" /> Tempo Estimado de Atraso
                </Label>
                <span className="text-xs font-black text-amber-400 font-mono">
                  +{delayMinutes} minutos
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[5, 10, 15, 20, 30, 45, 60, 90].map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDelayMinutes(min)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                      delayMinutes === min
                        ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-white'
                    }`}
                  >
                    +{min}m
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                value={delayMinutes}
                onChange={(e) => setDelayMinutes(Math.max(1, Number(e.target.value)))}
                placeholder="Ou digite os minutos..."
                className="h-8 text-xs font-mono font-bold mt-1"
              />
            </div>

            {/* Motivo do Atraso */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Motivo Principal do Atraso
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {[
                  'Trânsito intenso / Congestionamento',
                  'Pane mecânica / Manutenção',
                  'Atraso no embarque / Passageiros',
                  'Chuva forte / Pista interditada',
                  'Acidente na via / Desvio',
                  'Fiscalização / Blitz policial',
                  'Outros motivos operacionais',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDelayReason(reason)}
                    className={`p-2 text-[11px] font-bold text-left rounded-lg border transition-all ${
                      delayReason === reason
                        ? 'bg-amber-600/20 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-muted/30 text-muted-foreground border-border hover:text-white'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações adicionais */}
            <div className="space-y-1">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Observações / Detalhes (Opcional)
              </Label>
              <Input
                value={delayNotes}
                onChange={(e) => setDelayNotes(e.target.value)}
                placeholder="Ex: Trecho com obras no anel rodoviário, trânsito lento..."
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDelayModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveDelay}
              disabled={isSavingDelay}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5"
            >
              {isSavingDelay ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              Registrar Atraso ao Gestor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default DriverDailyScheduleBoard;

