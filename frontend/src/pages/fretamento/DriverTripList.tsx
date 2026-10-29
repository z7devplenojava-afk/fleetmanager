import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  Eye,
  Loader2,
  FileText,
  Bus,
  AlertCircle,
  RefreshCw,
  Play,
  Map as MapIcon,
  Navigation,
  Gauge,
  CheckCircle2,
  ShieldAlert,
  Camera,
  Flag,
  User,
  Car,
} from 'lucide-react';
import { StandardLayout } from '@/components/StandardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useToast } from '@/hooks/use-toast';
import {
  scheduleService,
  Schedule,
  resolveScheduleStartTime,
  resolveScheduleEndTime,
  checkPointTolerance,
  matchesScheduleModeFilter,
  resolveScheduleRecurrence,
} from '@/services/scheduleService';
import { CameraCapture } from '@/components/frota/CameraCapture';

const shiftLabel = (shift?: string) => {
  switch (shift) {
    case 'DAY':
      return 'Diurno';
    case 'NIGHT':
      return 'Noturno';
    case 'MIXED':
      return 'Misto';
    default:
      return shift || '-';
  }
};

const statusLabel = (schedule: Schedule) => {
  if (schedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL') {
    return 'Aguardando Aprovação do Tráfego';
  }
  switch (schedule.status) {
    case 'PENDING':
      return 'Pendente';
    case 'CONFIRMED':
      return 'Confirmada';
    case 'IN_PROGRESS':
      return 'Em Andamento';
    case 'COMPLETED':
      return 'Concluída';
    case 'CANCELLED':
      return 'Cancelada';
    default:
      return schedule.status || '-';
  }
};

const statusVariant = (schedule: Schedule): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (schedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL') {
    return 'secondary';
  }
  switch (schedule.status) {
    case 'CANCELLED':
      return 'destructive';
    case 'COMPLETED':
    case 'IN_PROGRESS':
    case 'CONFIRMED':
      return 'default';
    default:
      return 'outline';
  }
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  try {
    const date = parseISO(value);
    if (!isValid(date)) return value;
    return format(date, 'EEEE, dd/MM/yyyy', { locale: ptBR });
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (!isValid(date)) return value;
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return value;
  }
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

interface CardExecutionState {
  initialKm: string;
  finalKm: string;
  forgotPoint: boolean;
  justification: string;
  isFinishingTrip: boolean;
  photos: File[];
  savedPhotoUrls: string[];
  submittingPoint: boolean;
  submittingFinish: boolean;
}

const DriverTripList: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const today = new Date();
  const [startDate, setStartDate] = useState(format(startOfMonth(today), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(today), 'yyyy-MM-dd'));
  const [pdfLoading, setPdfLoading] = useState<'view' | 'download' | null>(null);
  const [routeMapSchedule, setRouteMapSchedule] = useState<Schedule | null>(null);
  const [execStates, setExecStates] = useState<Record<string, CardExecutionState>>({});
  const [selectedScheduleMode, setSelectedScheduleMode] = useState<'WEEKLY_FIXED' | 'WEEKEND' | 'ALL'>(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKLY_FIXED';
  });

  const defaultRouteCoords: [number, number][] = [
    [-19.9191, -43.9386],
    [-19.905, -43.945],
    [-19.865, -43.968],
    [-19.83, -43.975],
    [-19.795, -43.985],
  ];

  const filters = useMemo(() => ({ startDate, endDate }), [startDate, endDate]);

  const {
    data: schedules = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['driver-my-schedules', filters],
    queryFn: () => scheduleService.findMySchedules(filters),
  });

  const getExecState = (schedule: Schedule): CardExecutionState => {
    const existing = execStates[schedule.id];
    if (existing) return existing;

    let parsedPhotos: string[] = [];
    if (schedule.tripPhotosJson) {
      try {
        const parsed = JSON.parse(schedule.tripPhotosJson);
        if (Array.isArray(parsed)) parsedPhotos = parsed;
      } catch {
        // ignore
      }
    }

    return {
      initialKm: schedule.initialKm != null ? String(schedule.initialKm) : '',
      finalKm: schedule.finalKm != null ? String(schedule.finalKm) : '',
      forgotPoint: false,
      justification: schedule.pointJustification || '',
      isFinishingTrip: schedule.finalKm != null || schedule.status === 'COMPLETED',
      photos: [],
      savedPhotoUrls: parsedPhotos,
      submittingPoint: false,
      submittingFinish: false,
    };
  };

  const updateExecState = (schedule: Schedule, patch: Partial<CardExecutionState>) => {
    setExecStates((prev) => ({
      ...prev,
      [schedule.id]: {
        ...getExecState(schedule),
        ...patch,
      },
    }));
  };

  const handleRegisterPoint = async (schedule: Schedule) => {
    const state = getExecState(schedule);
    const startTime = resolveScheduleStartTime(schedule);
    const tolerance = checkPointTolerance(schedule.scheduleDate, startTime);
    const requiresJustification = state.forgotPoint || !tolerance.isWithinTolerance;

    if (!state.initialKm || Number(state.initialKm) <= 0) {
      toast({
        title: 'KM Inicial Obrigatório',
        description: 'Informe o KM Inicial do veículo para registrar o ponto e iniciar a escala.',
        variant: 'destructive',
      });
      return;
    }

    if (requiresJustification && !state.justification.trim()) {
      toast({
        title: 'Motivo Obrigatório',
        description:
          'Como o registro está fora da tolerância de 10 minutos (ou houve esquecimento), informe o motivo do não registro no horário.',
        variant: 'destructive',
      });
      return;
    }

    updateExecState(schedule, { submittingPoint: true });
    try {
      const newPhotoDataUrls = await Promise.all(state.photos.map(fileToDataUrl));
      const allPhotos = [...state.savedPhotoUrls, ...newPhotoDataUrls];

      const updated = await scheduleService.registerPoint(schedule.id, {
        initialKm: Number(state.initialKm),
        forgotPoint: state.forgotPoint,
        justification: state.justification.trim(),
        photos: allPhotos,
        scheduleDate: schedule.scheduleDate,
        expectedStartTime: startTime,
      });

      updateExecState(schedule, {
        submittingPoint: false,
        photos: [],
        savedPhotoUrls: allPhotos,
      });

      if (updated.pointStatus === 'PENDING_TRAFFIC_APPROVAL') {
        toast({
          title: 'Ponto Registrado — Aguardando Aprovação',
          description:
            'Seu registro e o motivo foram enviados. O status e o horário oficial serão exibidos após aprovação do Gestor / Encarregado de Tráfego.',
        });
      } else {
        toast({
          title: 'Ponto Registrado com Sucesso!',
          description: `Ponto registrado dentro da tolerância de 10 min e KM Inicial (${state.initialKm} km) salvo.`,
        });
      }

      refetch();
    } catch (err: any) {
      updateExecState(schedule, { submittingPoint: false });
      toast({
        title: 'Erro ao registrar ponto',
        description: err?.message || 'Não foi possível registrar o ponto.',
        variant: 'destructive',
      });
    }
  };

  const handleFinishTripOnCard = async (schedule: Schedule) => {
    const state = getExecState(schedule);
    const initialKmNum = Number(state.initialKm || schedule.initialKm || 0);
    const finalKmNum = Number(state.finalKm);

    if (!state.finalKm || finalKmNum <= 0) {
      toast({
        title: 'KM Final Obrigatório',
        description: 'Informe o KM Final do veículo para concluir a viagem.',
        variant: 'destructive',
      });
      return;
    }

    if (initialKmNum > 0 && finalKmNum < initialKmNum) {
      toast({
        title: 'KM Final Inválido',
        description: `O KM Final (${finalKmNum}) não pode ser menor que o KM Inicial (${initialKmNum}).`,
        variant: 'destructive',
      });
      return;
    }

    updateExecState(schedule, { submittingFinish: true });
    try {
      const newPhotoDataUrls = await Promise.all(state.photos.map(fileToDataUrl));
      const allPhotos = [...state.savedPhotoUrls, ...newPhotoDataUrls];

      await scheduleService.finishTrip(schedule.id, {
        finalKm: finalKmNum,
        photos: allPhotos,
      });

      updateExecState(schedule, {
        submittingFinish: false,
        photos: [],
        savedPhotoUrls: allPhotos,
      });

      toast({
        title: 'Viagem Finalizada!',
        description: `KM Final (${finalKmNum} km) e ${allPhotos.length} foto(s) registrados com sucesso.`,
      });

      refetch();
    } catch (err: any) {
      updateExecState(schedule, { submittingFinish: false });
      toast({
        title: 'Erro ao finalizar viagem',
        description: err?.message || 'Não foi possível salvar o KM Final.',
        variant: 'destructive',
      });
    }
  };

  const openPdfBlob = async (action: 'view' | 'download') => {
    setPdfLoading(action);
    try {
      const blob = await scheduleService.generateMyPDFReport({
        ...filters,
        inline: action === 'view',
      });
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

      if (action === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        toast({ title: 'PDF aberto', description: 'Sua escala foi aberta em uma nova aba.' });
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `minha-escala-${startDate}_${endDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: 'Download iniciado', description: 'O PDF da sua escala está sendo baixado.' });
      }
    } catch (err: any) {
      let message = err?.message || 'Não foi possível gerar o PDF da escala.';
      if (err?.response?.data?.message) {
        message = err.response.data.message;
      }
      toast({
        title: 'Erro no PDF',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPdfLoading(null);
    }
  };

  const scheduleTitle = (schedule: Schedule) =>
    schedule.route?.name ||
    schedule.travelTrip?.name ||
    schedule.workPost?.name ||
    schedule.location?.name ||
    'Escala de trabalho';

  return (
    <StandardLayout
      title="Minhas Escalas"
      subtitle="Consulte sua escala, registre seu ponto (tolerância 10 min), informe KM Inicial/Final e anexe fotos com a câmera"
    >
      <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Escala em PDF
            </CardTitle>
            <CardDescription>
              Selecione o período e visualize ou baixe sua escala de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data fim</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => openPdfBlob('view')}
                disabled={!!pdfLoading || isLoading}
              >
                {pdfLoading === 'view' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                Visualizar PDF
              </Button>
              <Button
                onClick={() => openPdfBlob('download')}
                disabled={!!pdfLoading || isLoading}
              >
                {pdfLoading === 'download' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <Button variant="ghost" onClick={() => refetch()} disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Selecione a Escala Semanal ou FDS para Executar
                </CardTitle>
                <CardDescription>
                  A escala semanal é fixa de Segunda a Sexta até ser editada pelo gestor; no Final de Semana selecione a escala FDS
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto">
                {schedules.filter((s) => matchesScheduleModeFilter(s, selectedScheduleMode)).length} escala(s) exibida(s)
              </Badge>
            </div>

            {/* Seletor de Escala Semanal (Fixa) vs Escala FDS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedScheduleMode('WEEKLY_FIXED')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScheduleMode === 'WEEKLY_FIXED'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow-md'
                    : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center justify-between">
                  <span>📅 Escala Semanal (Fixa)</span>
                  <Badge className="bg-emerald-500/30 text-emerald-200 border-none text-[10px]">
                    {schedules.filter((s) => matchesScheduleModeFilter(s, 'WEEKLY_FIXED')).length}
                  </Badge>
                </div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  Segunda a Sexta (vigente toda a semana)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScheduleMode('WEEKEND')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScheduleMode === 'WEEKEND'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                    : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center justify-between">
                  <span>🗓️ Escala Final de Semana (FDS)</span>
                  <Badge className="bg-amber-500/30 text-amber-200 border-none text-[10px]">
                    {schedules.filter((s) => matchesScheduleModeFilter(s, 'WEEKEND')).length}
                  </Badge>
                </div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  Sábado e Domingo (escala de FDS)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedScheduleMode('ALL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedScheduleMode === 'ALL'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold shadow-md'
                    : 'bg-background/60 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="text-xs font-extrabold flex items-center justify-between">
                  <span>📋 Todas as Escalas</span>
                  <Badge className="bg-blue-500/30 text-blue-200 border-none text-[10px]">
                    {schedules.length}
                  </Badge>
                </div>
                <div className="text-[11px] opacity-85 mt-0.5">
                  Visualizar Semanal + FDS
                </div>
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mr-3" />
                Carregando suas escalas...
              </div>
            ) : isError ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg space-y-3">
                <AlertCircle className="h-10 w-10 mx-auto text-destructive opacity-70" />
                <p className="text-sm text-muted-foreground px-4">
                  {(error as any)?.response?.data?.message ||
                    (error as Error)?.message ||
                    'Não foi possível carregar suas escalas.'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Tentar novamente
                </Button>
              </div>
            ) : schedules.filter((s) => matchesScheduleModeFilter(s, selectedScheduleMode)).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg space-y-3">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>
                  Nenhuma escala encontrada no modo{' '}
                  {selectedScheduleMode === 'WEEKEND'
                    ? 'Final de Semana (FDS)'
                    : selectedScheduleMode === 'WEEKLY_FIXED'
                    ? 'Escala Semanal (Fixa)'
                    : 'selecionado'}
                  .
                </p>
                {selectedScheduleMode !== 'ALL' && (
                  <Button variant="outline" size="sm" onClick={() => setSelectedScheduleMode('ALL')}>
                    Mostrar Todas as Escalas
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {schedules
                  .filter((s) => matchesScheduleModeFilter(s, selectedScheduleMode))
                  .map((schedule) => {
                  const state = getExecState(schedule);
                  const startTime = resolveScheduleStartTime(schedule);
                  const endTime = resolveScheduleEndTime(schedule);
                  const tolerance = checkPointTolerance(schedule.scheduleDate, startTime);
                  const hasRegisteredPoint =
                    schedule.pointStatus === 'APPROVED' ||
                    schedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL' ||
                    Boolean(schedule.pointRegisteredAt);
                  const isPendingManager = schedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
                  const isPointApproved = schedule.pointStatus === 'APPROVED';
                  const requiresJustificationNow = state.forgotPoint || !tolerance.isWithinTolerance;
                  const canEditFinalKm =
                    state.isFinishingTrip ||
                    schedule.status === 'COMPLETED' ||
                    schedule.finalKm != null;

                  return (
                    <div
                      key={schedule.id}
                      className="p-4 sm:p-5 rounded-xl border bg-card space-y-4 shadow-sm"
                    >
                      {/* Cabeçalho da Escala com Motorista, Rota, Veículo, Data e Horário */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-2.5 rounded-xl bg-blue-500/10 text-blue-500 mt-0.5">
                            <Bus className="h-5 w-5" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base">
                                Rota / Linha: {scheduleTitle(schedule)}
                              </span>
                              <Badge
                                variant="outline"
                                className={
                                  resolveScheduleRecurrence(schedule) === 'WEEKEND'
                                    ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                                }
                              >
                                {resolveScheduleRecurrence(schedule) === 'WEEKEND'
                                  ? '🗓️ Escala FDS (Sáb/Dom)'
                                  : '📅 Escala Semanal Fixa (Seg–Sex)'}
                              </Badge>
                              <Badge variant={statusVariant(schedule)}>{statusLabel(schedule)}</Badge>
                              <Badge variant="outline">{shiftLabel(schedule.shift)}</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                <User className="h-3.5 w-3.5 text-primary" />
                                Motorista: {schedule.employee?.name || '-'}
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                <Car className="h-3.5 w-3.5 text-purple-400" />
                                Veículo: {schedule.vehicle?.plate || schedule.vehiclePlate || 'Não definido'}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                                Data: {formatDate(schedule.scheduleDate)}
                              </span>
                              <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-foreground">
                                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                                Horário: {startTime} às {endTime} (Tol. ±10m)
                              </span>
                            </div>

                            {(schedule.workPost?.client?.name || schedule.location?.name) && (
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                Cliente / Local:{' '}
                                {schedule.workPost?.client?.name ||
                                  schedule.workPost?.name ||
                                  schedule.location?.name}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRouteMapSchedule(schedule)}
                            className="text-xs h-9 px-3 rounded-xl gap-1.5"
                          >
                            <MapIcon className="h-3.5 w-3.5 text-blue-500" />
                            Ver Rota
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/driver/trip/${schedule.id}`)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9 px-3.5 rounded-xl"
                          >
                            <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            Painel de Embarque
                          </Button>
                        </div>
                      </div>

                      {/* Status do Registro de Ponto (Aprovado vs Aguardando Aprovação do Gestor/Tráfego) */}
                      {isPendingManager && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 font-bold text-amber-400">
                            <ShieldAlert className="h-4 w-4 shrink-0" />
                            <span>
                              PONTO REGISTRADO FORA DO HORÁRIO — AGUARDANDO APROVAÇÃO DO GESTOR / ENCARREGADO DE TRÁFEGO
                            </span>
                          </div>
                          <p className="text-amber-200/90">
                            O horário efetivo do registro e a mudança oficial de status só serão liberados após a aprovação do Gestor / Encarregado de Tráfego.
                          </p>
                          {schedule.pointJustification && (
                            <p className="text-amber-100 font-medium">
                              Motivo informado pelo motorista: &ldquo;{schedule.pointJustification}&rdquo;
                            </p>
                          )}
                        </div>
                      )}

                      {isPointApproved && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>
                              Ponto Registrado e Validado:{' '}
                              {schedule.pointRegisteredAt ? formatDateTime(schedule.pointRegisteredAt) : 'Confirmado'}
                            </span>
                          </div>
                          {schedule.pointApprovedBy && (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[11px]">
                              Aprovado por: {schedule.pointApprovedBy}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Painel Unificado no Mesmo Local: Registro de Ponto + KM Inicial + KM Final + Câmera Múltiplas Fotos */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 rounded-xl bg-muted/30 border border-border">
                        {/* 1. KM Inicial */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5 text-emerald-500" />
                            KM Inicial <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 125400"
                            value={state.initialKm}
                            onChange={(e) => updateExecState(schedule, { initialKm: e.target.value })}
                            disabled={schedule.status === 'COMPLETED'}
                            className="font-mono font-bold h-9"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            Odômetro no início da viagem / ponto.
                          </p>
                        </div>

                        {/* 2. KM Final (Só habilita após clicar em Finalizar Viagem) */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Gauge className="h-3.5 w-3.5 text-blue-500" />
                            KM Final {canEditFinalKm ? <span className="text-red-500">*</span> : '(Bloqueado)'}
                          </Label>
                          <Input
                            type="number"
                            placeholder={
                              canEditFinalKm ? 'Informe o KM Final...' : 'Habilita ao finalizar a viagem'
                            }
                            value={state.finalKm}
                            onChange={(e) => updateExecState(schedule, { finalKm: e.target.value })}
                            disabled={!canEditFinalKm}
                            className="font-mono font-bold h-9 disabled:opacity-50"
                          />
                          <p className="text-[11px] text-muted-foreground">
                            {canEditFinalKm
                              ? schedule.initialKm != null && Number(state.finalKm) >= schedule.initialKm
                                ? `KM Percorrido: ${Number(state.finalKm) - Number(state.initialKm || schedule.initialKm)} km`
                                : 'Digite o odômetro de encerramento.'
                              : 'Só habilita após clicar em "Finalizar Viagem".'}
                          </p>
                        </div>

                        {/* 3. Botões de Ação de Ponto e Finalização */}
                        <div className="flex flex-col justify-end gap-2">
                          {!hasRegisteredPoint ? (
                            <Button
                              type="button"
                              onClick={() => handleRegisterPoint(schedule)}
                              disabled={state.submittingPoint}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9"
                            >
                              {state.submittingPoint ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : (
                                <Clock className="h-4 w-4 mr-1.5" />
                              )}
                              Registrar Ponto & KM Inicial
                            </Button>
                          ) : !state.isFinishingTrip && schedule.status !== 'COMPLETED' ? (
                            <Button
                              type="button"
                              onClick={() => updateExecState(schedule, { isFinishingTrip: true })}
                              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs h-9"
                            >
                              <Flag className="h-4 w-4 mr-1.5" />
                              Finalizar Viagem (Liberar KM Final)
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => handleFinishTripOnCard(schedule)}
                              disabled={state.submittingFinish}
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs h-9"
                            >
                              {state.submittingFinish ? (
                                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              )}
                              Salvar KM Final e Fotos
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Opção para informar esquecimento de ponto ou justificativa fora da tolerância de 10 min */}
                      {!hasRegisteredPoint && (
                        <div className="space-y-3 p-3 rounded-xl border border-border bg-background/50">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`forgot-point-${schedule.id}`}
                              checked={state.forgotPoint}
                              onCheckedChange={(checked) =>
                                updateExecState(schedule, { forgotPoint: Boolean(checked) })
                              }
                            />
                            <Label
                              htmlFor={`forgot-point-${schedule.id}`}
                              className="text-xs font-medium cursor-pointer"
                            >
                              Esqueci de registrar o ponto no horário / Estou registrando fora do horário
                            </Label>
                          </div>

                          {requiresJustificationNow && (
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Motivo do não registro do ponto no horário (Obrigatório — Tolerância ±10 min){' '}
                                <span className="text-red-400">*</span>
                              </Label>
                              <Textarea
                                placeholder="Descreva o motivo de não ter registrado o ponto no horário escalado (será enviado para aprovação do Gestor / Encarregado de Tráfego)..."
                                value={state.justification}
                                onChange={(e) =>
                                  updateExecState(schedule, { justification: e.target.value })
                                }
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Câmera do Telefone Móvel no Mesmo Local (Permite tirar mais de uma foto) */}
                      <div className="p-3.5 rounded-xl border border-border bg-background/40 space-y-3">
                        <CameraCapture
                          label="Fotos da Escala / Odômetro / Veículo (Pode tirar mais de uma foto com a câmera do celular)"
                          maxPhotos={10}
                          onPhotosChange={(files) => updateExecState(schedule, { photos: files })}
                        />

                        {state.savedPhotoUrls.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-border">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
                              <Camera className="h-3.5 w-3.5 text-emerald-400" />
                              Fotos já salvas nesta escala ({state.savedPhotoUrls.length})
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {state.savedPhotoUrls.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Foto da escala ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-border"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Visualização da Rota no Mapa */}
        <Dialog open={!!routeMapSchedule} onOpenChange={(open) => !open && setRouteMapSchedule(null)}>
          <DialogContent className="max-w-xl bg-card text-foreground border border-border p-6 rounded-3xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black flex items-center gap-2">
                <Navigation className="h-5 w-5 text-primary" />
                {routeMapSchedule ? scheduleTitle(routeMapSchedule) : 'Mapa da Rota'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Itinerário completo e pontos de parada cadastrados para esta escala.
              </DialogDescription>
            </DialogHeader>

            <div className="h-64 w-full rounded-2xl overflow-hidden border border-border">
              <MapContainer
                center={[-19.865, -43.968]}
                zoom={11}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={defaultRouteCoords} color="#2563eb" weight={5} opacity={0.8} />
                {defaultRouteCoords.map((pos, idx) => (
                  <Marker key={idx} position={pos}>
                    <Popup>Ponto de Parada 0{idx + 1}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => setRouteMapSchedule(null)}>
                Fechar
              </Button>
              {routeMapSchedule && (
                <Button
                  size="sm"
                  onClick={() => {
                    const id = routeMapSchedule.id;
                    setRouteMapSchedule(null);
                    navigate(`/driver/trip/${id}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  <Play className="h-3.5 w-3.5 mr-1.5" />
                  Abrir Painel de Embarque
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StandardLayout>
  );
};

export default DriverTripList;
