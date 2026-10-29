import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bus,
  Car,
  Gauge,
  Users,
  Building2,
  Route as RouteIcon,
  Clock,
  Camera,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flag,
  Loader2,
  Sparkles,
  ShieldAlert,
  CalendarClock,
  MapPin,
  Navigation,
  ArrowRight,
  CornerDownLeft
} from 'lucide-react';
import { CameraCapture } from '@/components/frota/CameraCapture';
import { SearchableSelect, SearchableOption } from '@/components/frota/SearchableSelect';
import { DriverRouteTrajectoryMap } from '@/components/driver/DriverRouteTrajectoryMap';
import {
  scheduleService,
  Schedule,
  captureDriverGeolocationAndAddress,
  inferDirectionFromRouteCode,
  matchesScheduleModeFilter,
  resolveScheduleRecurrence,
  resolveScheduleStartTime,
  resolveScheduleEndTime,
} from '@/services/scheduleService';
import driverRouteCodeService, { DEFAULT_DRIVER_ROUTE_CODES, DriverRouteCode } from '@/services/driverRouteCodeService';
import fleetService from '@/services/fleetService';
import { clientService } from '@/services/clientService';
import { useToast } from '@/hooks/use-toast';

interface DriverPontoOperacionalSectionProps {
  employeeId?: string;
  employeeName: string;
  onTriggerOfficialPoint?: (recordType?: 'ENTRADA' | 'SAIDA_ALMOCO' | 'RETORNO_ALMOCO' | 'SAIDA') => Promise<void>;
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });

export const DriverPontoOperacionalSection: React.FC<DriverPontoOperacionalSectionProps> = ({
  employeeId,
  employeeName,
  onTriggerOfficialPoint,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [todaySchedules, setTodaySchedules] = useState<Schedule[]>([]);
  const [selectedScheduleMode, setSelectedScheduleMode] = useState<'WEEKLY_FIXED' | 'WEEKEND' | 'ALL'>(() => {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKLY_FIXED';
  });
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>('NEW');
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Listas auxiliares
  const [routeCodes, setRouteCodes] = useState<DriverRouteCode[]>(DEFAULT_DRIVER_ROUTE_CODES);
  const [vehicles, setVehicles] = useState<Array<{ id: string; plate: string; model?: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  // Campos do Registro do Ponto Operacional do Motorista
  const [startTime, setStartTime] = useState<string>(() => format(new Date(), 'HH:mm'));
  const [endTime, setEndTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [routeCode, setRouteCode] = useState<string>('01 - CASA/PONTO');
  const [customRouteJustification, setCustomRouteJustification] = useState<string>('');
  const [vehicleId, setVehicleId] = useState<string>('');
  const [initialKm, setInitialKm] = useState<string>('');
  const [finalKm, setFinalKm] = useState<string>('');
  const [passengersCount, setPassengersCount] = useState<string>('0');
  const [capturedFiles, setCapturedFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [cameraResetKey, setCameraResetKey] = useState<number>(0);

  // Controle de tolerância de 10 minutos e esquecimento de ponto
  const [forgotPoint, setForgotPoint] = useState<boolean>(false);
  const [pointJustification, setPointJustification] = useState<string>('');

  // Modo de finalização de viagem (habilita KM Final)
  const [isFinishingMode, setIsFinishingMode] = useState<boolean>(false);

  // Sentido da rota (Ida ou Retorno) e Geolocalização / Endereço GPS em tempo real
  const [direction, setDirection] = useState<'IDA' | 'RETORNO'>('IDA');
  const [startAddress, setStartAddress] = useState<string>('');
  const [startCoords, setStartCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [endAddress, setEndAddress] = useState<string>('');
  const [endCoords, setEndCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [capturingGps, setCapturingGps] = useState<boolean>(false);

  const filteredDriverSchedules = useMemo(
    () => todaySchedules.filter((s) => matchesScheduleModeFilter(s, selectedScheduleMode)),
    [todaySchedules, selectedScheduleMode]
  );

  const selectedSchedule = useMemo(
    () => todaySchedules.find((s) => s.id === selectedScheduleId) || null,
    [todaySchedules, selectedScheduleId]
  );

  const isTripStarted = useMemo(() => {
    if (isFinishingMode) return true;
    if (!selectedSchedule) return false;
    return (
      selectedSchedule.initialKm != null ||
      selectedSchedule.status === 'IN_PROGRESS' ||
      selectedSchedule.status === 'COMPLETED'
    );
  }, [selectedSchedule, isFinishingMode]);

  const isTripCompleted = useMemo(() => {
    if (!selectedSchedule) return false;
    return selectedSchedule.finalKm != null || selectedSchedule.status === 'COMPLETED';
  }, [selectedSchedule]);

  // Verifica se está fora da tolerância de ±10 minutos em relação ao horário da escala
  const toleranceCheck = useMemo(() => {
    if (!selectedSchedule || !selectedSchedule.startTime || isTripStarted) {
      return { withinTolerance: true, isWithinTolerance: true, diffMinutes: 0 };
    }
    return scheduleService.checkPointTolerance(todayStr, selectedSchedule.startTime, 10);
  }, [selectedSchedule, todayStr, isTripStarted]);

  const requiresJustification = forgotPoint;

  const loadData = async () => {
    setLoadingSchedules(true);
    try {
      const [mySchedules, codesList, fleetList, clientList] = await Promise.all([
        scheduleService.findMySchedules({ startDate: todayStr, endDate: todayStr }).catch(() => []),
        driverRouteCodeService.getAll().catch(() => DEFAULT_DRIVER_ROUTE_CODES),
        fleetService.getVehicles().catch(() => []),
        clientService.getAllClients().catch(() => []),
      ]);

      setRouteCodes(Array.isArray(codesList) && codesList.length > 0 ? codesList : DEFAULT_DRIVER_ROUTE_CODES);

      if (Array.isArray(fleetList)) {
        setVehicles(
          fleetList.map((v: any) => ({
            id: String(v.id),
            plate: v.plate || v.licensePlate || 'SEM-PLACA',
            model: v.model || v.brand || '',
          }))
        );
      }

      if (Array.isArray(clientList)) {
        setClients(
          clientList.map((c: any) => ({
            id: String(c.id),
            name: c.name || c.companyName || c.razaoSocial || '',
          }))
        );
      }

      const list = Array.isArray(mySchedules) ? mySchedules : [];
      setTodaySchedules(list);

      if (list.length > 0) {
        const currentSelected = selectedScheduleId !== 'NEW' ? list.find((s) => s.id === selectedScheduleId) : null;
        if (currentSelected) {
          applyScheduleToForm(currentSelected);
        } else {
          const activeOrFirst =
            list.find((s) => (s.status === 'IN_PROGRESS' || s.initialKm != null) && s.finalKm == null) ||
            list.find((s) => s.status === 'CONFIRMED' || s.status === 'PENDING') ||
            list[0];
          if (activeOrFirst) {
            applyScheduleToForm(activeOrFirst);
          }
        }
      }
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    loadData();
    // Captura preventiva da geolocalização atual e nome do endereço ao abrir o Ponto
    captureDriverGeolocationAndAddress('START')
      .then((geo) => {
        setStartAddress((prev) => prev || geo.address);
        setStartCoords((prev) => prev || { latitude: geo.latitude, longitude: geo.longitude });
      })
      .catch(() => {});

    const handleRealtimeUpdate = () => {
      loadData();
    };
    window.addEventListener('storage', handleRealtimeUpdate);
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('fluxbus_realtime_sync');
        bc.onmessage = () => loadData();
      }
    } catch {
      // ignore
    }
    return () => {
      window.removeEventListener('storage', handleRealtimeUpdate);
      if (bc) bc.close();
    };
  }, [todayStr, employeeId]);

  // Sincronização em tempo real com a tabela de Escalas do Gestor conforme o motorista preenche KM, Passageiros ou Fotos
  useEffect(() => {
    const targetId =
      selectedScheduleId !== 'NEW'
        ? selectedScheduleId
        : todaySchedules.find((s) => !s.id.startsWith('ponto-local-'))?.id;
    if (!targetId) return;

    const parsedIni = initialKm !== '' && !Number.isNaN(Number(initialKm)) ? Number(initialKm) : undefined;
    const parsedFim = finalKm !== '' && !Number.isNaN(Number(finalKm)) ? Number(finalKm) : undefined;
    const parsedPass =
      passengersCount !== '' && !Number.isNaN(Number(passengersCount)) ? Number(passengersCount) : undefined;

    if (parsedIni == null && parsedFim == null && (parsedPass == null || parsedPass === 0) && existingPhotos.length === 0) {
      return;
    }

    const timer = setTimeout(() => {
      scheduleService.syncLiveExecutionOverlay(targetId, {
        ...(parsedIni != null ? { initialKm: parsedIni } : {}),
        ...(parsedFim != null ? { finalKm: parsedFim } : {}),
        ...(parsedPass != null ? { passengersCount: parsedPass } : {}),
        ...(existingPhotos.length > 0 ? { tripPhotosJson: JSON.stringify(existingPhotos) } : {}),
        ...(startAddress ? { startAddress } : {}),
        ...(endAddress ? { endAddress } : {}),
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [initialKm, finalKm, passengersCount, existingPhotos, startAddress, endAddress, selectedScheduleId, todaySchedules]);

  // Atualiza automaticamente o sentido (Ida/Retorno) ao trocar o código do percurso
  useEffect(() => {
    if (selectedScheduleId === 'NEW') {
      setDirection(inferDirectionFromRouteCode(routeCode, todaySchedules.length));
    }
  }, [routeCode, selectedScheduleId, todaySchedules.length]);

  const handleRefreshGpsNow = async (phase: 'START' | 'END') => {
    setCapturingGps(true);
    try {
      const geo = await captureDriverGeolocationAndAddress(phase, startCoords || undefined);
      if (phase === 'START') {
        setStartAddress(geo.address);
        setStartCoords({ latitude: geo.latitude, longitude: geo.longitude });
      } else {
        setEndAddress(geo.address);
        setEndCoords({ latitude: geo.latitude, longitude: geo.longitude });
      }
      toast({
        title: 'Geolocalização e Endereço capturados!',
        description: geo.address,
      });
    } finally {
      setCapturingGps(false);
    }
  };

  const applyScheduleToForm = (sched: Schedule) => {
    setSelectedScheduleId(sched.id);
    setStartTime(sched.startTime ? sched.startTime.substring(0, 5) : format(new Date(), 'HH:mm'));
    setEndTime(sched.endTime ? sched.endTime.substring(0, 5) : '');
    setClientName(
      sched.clientName ||
        sched.workPost?.client?.name ||
        sched.travelTrip?.client?.name ||
        sched.location?.name ||
        ''
    );
    const resolvedRoute =
      sched.routeCode ||
      sched.route?.name ||
      sched.travelTrip?.name ||
      '01 - CASA/PONTO';
    setRouteCode(resolvedRoute);
    setDirection(sched.direction || inferDirectionFromRouteCode(resolvedRoute, 0));
    setVehicleId(sched.vehicleId || sched.vehicle?.id || '');
    setInitialKm(sched.initialKm != null ? String(sched.initialKm) : '');
    setFinalKm(sched.finalKm != null ? String(sched.finalKm) : '');
    setPassengersCount(sched.passengersCount != null ? String(sched.passengersCount) : '0');
    setPointJustification(sched.pointJustification || '');
    setStartAddress(sched.startAddress || '');
    setStartCoords(
      sched.startLatitude != null && sched.startLongitude != null
        ? { latitude: sched.startLatitude, longitude: sched.startLongitude }
        : null
    );
    setEndAddress(sched.endAddress || '');
    setEndCoords(
      sched.endLatitude != null && sched.endLongitude != null
        ? { latitude: sched.endLatitude, longitude: sched.endLongitude }
        : null
    );

    let parsedPhotos: string[] = [];
    if (sched.tripPhotosJson) {
      try {
        const arr = JSON.parse(sched.tripPhotosJson);
        if (Array.isArray(arr)) parsedPhotos = arr;
      } catch {
        parsedPhotos = [];
      }
    }
    setExistingPhotos(parsedPhotos);

    const started =
      sched.initialKm != null ||
      sched.status === 'IN_PROGRESS' ||
      sched.pointStatus === 'APPROVED' ||
      sched.pointStatus === 'PENDING_TRAFFIC_APPROVAL';

    const completed = sched.finalKm != null || sched.status === 'COMPLETED';
    setIsFinishingMode(started && !completed);
  };

  const handleSelectScheduleChange = (val: string) => {
    if (val === 'NEW') {
      setSelectedScheduleId('NEW');
      setStartTime(format(new Date(), 'HH:mm'));
      setEndTime('');
      setInitialKm('');
      setFinalKm('');
      setPassengersCount('0');
      setCapturedFiles([]);
      setExistingPhotos([]);
      setForgotPoint(false);
      setPointJustification('');
      setIsFinishingMode(false);
      setEndAddress('');
      setEndCoords(null);
      setDirection(inferDirectionFromRouteCode(routeCode, todaySchedules.length));
      captureDriverGeolocationAndAddress('START')
        .then((geo) => {
          setStartAddress(geo.address);
          setStartCoords({ latitude: geo.latitude, longitude: geo.longitude });
        })
        .catch(() => {});
      return;
    }

    const found = todaySchedules.find((s) => s.id === val);
    if (found) {
      applyScheduleToForm(found);
    }
  };

  const vehicleOptions: SearchableOption[] = useMemo(
    () =>
      vehicles.map((v) => ({
        value: v.id,
        label: v.model ? `${v.plate} - ${v.model}` : v.plate,
        keywords: [v.plate, v.model || ''],
      })),
    [vehicles]
  );

  const clientOptions: SearchableOption[] = useMemo(() => {
    const base = clients
      .filter((c) => c.name)
      .map((c) => ({
        value: c.name,
        label: c.name,
        keywords: [c.name],
      }));
    if (clientName && !base.some((o) => o.value === clientName)) {
      base.unshift({ value: clientName, label: clientName, keywords: [clientName] });
    }
    return base;
  }, [clients, clientName]);

  const routeCodeOptions: SearchableOption[] = useMemo(() => {
    const base = routeCodes.map((rc) => {
      const fullLabel = `${rc.code} - ${rc.description}`;
      return {
        value: fullLabel,
        label: fullLabel,
        badge: `Cód. ${rc.code}`,
        keywords: [rc.code, rc.description, fullLabel],
      };
    });
    if (routeCode && !base.some((o) => o.value === routeCode)) {
      base.unshift({ value: routeCode, label: routeCode, keywords: [routeCode] });
    }
    return base;
  }, [routeCodes, routeCode]);

  const selectedVehicleObj = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  );

  const handleRegisterStartPointAndTrip = async () => {
    const parsedInitialKm = Number(initialKm);
    if (!initialKm || isNaN(parsedInitialKm) || parsedInitialKm < 0) {
      toast({
        title: 'KM Inicial obrigatório',
        description: 'Informe o KM Inicial do veículo para registrar o ponto e iniciar a viagem.',
        variant: 'destructive',
      });
      return;
    }

    const resolvedClientName =
      clientName.trim() ||
      selectedSchedule?.clientName ||
      selectedSchedule?.workPost?.client?.name ||
      selectedSchedule?.travelTrip?.client?.name ||
      selectedSchedule?.location?.name ||
      'Cliente da Escala';

    const resolvedRouteBase =
      routeCode.trim() ||
      selectedSchedule?.route?.name ||
      selectedSchedule?.routeCode ||
      selectedSchedule?.travelTrip?.name ||
      selectedSchedule?.workPost?.name ||
      'Rota da Escala';

    if (requiresJustification && !pointJustification.trim()) {
      toast({
        title: 'Motivo do não registro no horário é obrigatório',
        description:
          'Como o ponto está fora da tolerância de 10 minutos (ou houve esquecimento), informe o motivo para aprovação do Gestor de Tráfego.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const newPhotoDataUrls = await Promise.all(capturedFiles.map(fileToDataUrl));
      const allPhotos = [...existingPhotos, ...newPhotoDataUrls];

      const effectiveRouteCode =
        resolvedRouteBase.startsWith('15') && customRouteJustification.trim()
          ? `${resolvedRouteBase} (${customRouteJustification.trim()})`
          : resolvedRouteBase;

      const geoStart = await captureDriverGeolocationAndAddress('START', startCoords || undefined);
      setStartAddress(geoStart.address);
      setStartCoords({ latitude: geoStart.latitude, longitude: geoStart.longitude });

      const savedSchedule = await scheduleService.registerDriverPontoTrip({
        scheduleId: selectedScheduleId !== 'NEW' ? selectedScheduleId : undefined,
        employeeId: employeeId || 'driver',
        employeeName: employeeName || 'Motorista',
        scheduleDate: todayStr,
        startTime: startTime || format(new Date(), 'HH:mm'),
        endTime: endTime || undefined,
        clientName: resolvedClientName,
        routeCode: effectiveRouteCode,
        direction,
        vehicleId: vehicleId || selectedSchedule?.vehicleId || selectedSchedule?.vehicle?.id || undefined,
        vehiclePlate: selectedVehicleObj?.plate || selectedSchedule?.vehicle?.plate || selectedSchedule?.vehiclePlate,
        vehicleModel: selectedVehicleObj?.model || selectedSchedule?.vehicle?.model || selectedSchedule?.vehicleModel,
        initialKm: parsedInitialKm,
        passengersCount: passengersCount ? Number(passengersCount) : 0,
        photos: allPhotos,
        forgotPoint: requiresJustification,
        justification: pointJustification.trim() || undefined,
        expectedStartTime: selectedSchedule?.startTime || startTime,
        startLatitude: geoStart.latitude,
        startLongitude: geoStart.longitude,
        startAddress: geoStart.address,
      });

      // Se o motorista também já informou o KM Final, salva o KM Final na mesma ação
      const parsedFinalKmOpt = Number(finalKm);
      let finalSavedSchedule = savedSchedule;
      if (finalKm && !Number.isNaN(parsedFinalKmOpt) && parsedFinalKmOpt >= parsedInitialKm) {
        const geoEnd = await captureDriverGeolocationAndAddress('END', endCoords || undefined);
        setEndAddress(geoEnd.address);
        setEndCoords({ latitude: geoEnd.latitude, longitude: geoEnd.longitude });
        finalSavedSchedule = await scheduleService.finishTrip(savedSchedule.id, {
          finalKm: parsedFinalKmOpt,
          passengersCount: passengersCount ? Number(passengersCount) : 0,
          endTime: endTime || format(new Date(), 'HH:mm'),
          photos: allPhotos,
          endLatitude: geoEnd.latitude,
          endLongitude: geoEnd.longitude,
          endAddress: geoEnd.address,
        });
      }

      // Também aciona a batida oficial no Ponto Eletrônico se fornecido
      if (onTriggerOfficialPoint) {
        await onTriggerOfficialPoint('ENTRADA').catch(() => {});
      }

      if (finalSavedSchedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL') {
        toast({
          title: 'Ponto registrado • Aguardando Aprovação do Gestor de Tráfego',
          description:
            'Seu registro e motivo foram enviados. O status e o horário oficial serão exibidos assim que o Gestor/Encarregado de Tráfego aprovar.',
        });
      } else {
        toast({
          title: 'Ponto e KM registrados com sucesso!',
          description: `Viagem registrada (${effectiveRouteCode}) com KM Inicial ${parsedInitialKm} km${
            finalSavedSchedule.finalKm != null ? ` e KM Final ${finalSavedSchedule.finalKm} km` : '. O KM Final estará habilitado ao finalizar a viagem'
          }.`,
        });
      }

      setCapturedFiles([]);
      setCameraResetKey((k) => k + 1);
      setTodaySchedules((prev) => [finalSavedSchedule, ...prev.filter((s) => s.id !== finalSavedSchedule.id)]);
      applyScheduleToForm(finalSavedSchedule);
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao registrar ponto da viagem',
        description: error?.message || 'Não foi possível salvar os dados operacionais do ponto.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishTripWithFinalKm = async () => {
    const targetSchedule =
      selectedSchedule ||
      todaySchedules.find((s) => !s.id.startsWith('ponto-local-')) ||
      todaySchedules[0];
    if (!targetSchedule) return;

    const parsedFinalKm = Number(finalKm);
    const baseInitialKm = Number(initialKm || targetSchedule.initialKm || 0);

    if (!finalKm || isNaN(parsedFinalKm) || parsedFinalKm <= 0) {
      toast({
        title: 'KM Final obrigatório',
        description: 'Informe o KM Final do odômetro para encerrar a viagem.',
        variant: 'destructive',
      });
      return;
    }

    if (parsedFinalKm < baseInitialKm) {
      toast({
        title: 'KM Final inválido',
        description: `O KM Final (${parsedFinalKm} km) não pode ser menor que o KM Inicial (${baseInitialKm} km).`,
        variant: 'destructive',
      });
      return;
    }

    const resolvedEndTime = endTime || format(new Date(), 'HH:mm');

    setSubmitting(true);
    try {
      const newPhotoDataUrls = await Promise.all(capturedFiles.map(fileToDataUrl));
      const allPhotos = [...existingPhotos, ...newPhotoDataUrls];

      const geoEnd = await captureDriverGeolocationAndAddress(
        'END',
        startCoords ||
          (targetSchedule.startLatitude != null && targetSchedule.startLongitude != null
            ? { latitude: targetSchedule.startLatitude, longitude: targetSchedule.startLongitude }
            : undefined)
      );
      setEndAddress(geoEnd.address);
      setEndCoords({ latitude: geoEnd.latitude, longitude: geoEnd.longitude });

      const updated = await scheduleService.finishTrip(targetSchedule.id, {
        finalKm: parsedFinalKm,
        endTime: resolvedEndTime,
        passengersCount: passengersCount ? Number(passengersCount) : targetSchedule.passengersCount,
        photos: allPhotos,
        endLatitude: geoEnd.latitude,
        endLongitude: geoEnd.longitude,
        endAddress: geoEnd.address,
        direction,
        observations: `Viagem finalizada no Ponto Eletrônico (${direction}) • Cliente: ${clientName} • Percurso: ${routeCode} • KM: ${baseInitialKm} -> ${parsedFinalKm} • Origem: ${startAddress || targetSchedule.startAddress || '-'} -> Destino: ${geoEnd.address}`,
      });

      setCapturedFiles([]);
      setCameraResetKey((k) => k + 1);
      setEndTime(resolvedEndTime);
      setTodaySchedules((prev) => [updated, ...prev.filter((s) => s.id !== updated.id)]);
      applyScheduleToForm(updated);
      await loadData();

      toast({
        title: 'Viagem Finalizada com Sucesso!',
        description: `KM Final (${parsedFinalKm} km), Horário Final (${resolvedEndTime}) e fotos enviados para o Gestor de Tráfego.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao finalizar viagem',
        description: error?.message || 'Não foi possível registrar o KM Final.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-b from-slate-900/95 via-seguranca-darkgray/95 to-seguranca-black border-2 border-seguranca-yellow/40 shadow-2xl overflow-hidden">
      <CardHeader className="p-3.5 sm:p-6 pb-3.5 sm:pb-4 border-b border-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <Badge className="bg-seguranca-yellow text-seguranca-black font-bold px-2 py-0.5 text-[10px] sm:text-xs">
                <Bus className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 shrink-0" />
                EXCLUSIVO PORTAL DO MOTORISTA
              </Badge>
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] sm:text-xs">
                Integrado com Gestor de Tráfego & Escala
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-xl font-black text-white flex items-start sm:items-center gap-2 pt-0.5 leading-snug">
              <Gauge className="h-5 w-5 text-seguranca-yellow shrink-0 mt-0.5 sm:mt-0" />
              <span>Registro de Ponto da Viagem, Odômetro (KM), Passageiros e Fotos</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Os dados de Motorista, Veículo, Rota e Cliente vêm automaticamente da sua escala. Preencha o Horário Inicial/Final, Quantidade de Passageiros, KM Inicial e KM Final.
            </CardDescription>
          </div>

          {/* Botão Direto para Checklist do Veículo e Pneus */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full lg:w-auto">
            <Button
              type="button"
              onClick={() => navigate('/driver/checklist')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold h-auto min-h-[44px] py-2.5 px-4 rounded-xl shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 whitespace-normal text-xs sm:text-sm"
            >
              <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>Checklist do Veículo e Pneus</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Dados da Escala do Motorista (Exibe seletor apenas se tiver mais de uma escala, ex: Semanal e FDS) */}
        <div className="rounded-xl bg-black/40 border border-gray-800 p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <Label className="text-xs sm:text-sm font-bold text-seguranca-yellow flex items-start sm:items-center gap-1.5 leading-snug">
              <CalendarClock className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {todaySchedules.length > 1
                  ? `Selecione sua Escala (Semanal ou FDS) — ${format(new Date(), 'dd/MM/yyyy')}`
                  : `Sua Escala Ativa — ${format(new Date(), 'dd/MM/yyyy')}`}
              </span>
            </Label>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Sentido da Viagem (Ida / Retorno) */}
              <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-gray-700">
                <button
                  type="button"
                  disabled={isTripCompleted}
                  onClick={() => setDirection('IDA')}
                  className={`h-8 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                    direction === 'IDA'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  <span>Ida</span>
                </button>
                <button
                  type="button"
                  disabled={isTripCompleted}
                  onClick={() => setDirection('RETORNO')}
                  className={`h-8 px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all ${
                    direction === 'RETORNO'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <CornerDownLeft className="h-3.5 w-3.5 shrink-0" />
                  <span>Retorno</span>
                </button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={loadData}
                disabled={loadingSchedules}
                className="h-8 text-xs text-gray-300 hover:text-white px-2.5"
              >
                {loadingSchedules ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 mr-1 text-seguranca-yellow" />
                )}
                Atualizar
              </Button>
            </div>
          </div>

          {/* Exibe os botões de Semanal vs FDS e o dropdown se o motorista tiver mais de uma escala */}
          {todaySchedules.length > 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedScheduleMode('WEEKLY_FIXED');
                    const firstMatch = todaySchedules.find((s) => matchesScheduleModeFilter(s, 'WEEKLY_FIXED'));
                    if (firstMatch) applyScheduleToForm(firstMatch);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedScheduleMode === 'WEEKLY_FIXED'
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-lg shadow-emerald-950/30'
                      : 'bg-[#090d16] border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs font-extrabold text-emerald-300 flex items-center justify-between gap-1">
                    <span>📅 Escala Semanal (Fixa)</span>
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-none text-[10px] shrink-0">
                      {todaySchedules.filter((s) => matchesScheduleModeFilter(s, 'WEEKLY_FIXED')).length}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                    Segunda a Sexta (fixa na semana)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedScheduleMode('WEEKEND');
                    const firstMatch = todaySchedules.find((s) => matchesScheduleModeFilter(s, 'WEEKEND'));
                    if (firstMatch) applyScheduleToForm(firstMatch);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedScheduleMode === 'WEEKEND'
                      ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-950/30'
                      : 'bg-[#090d16] border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs font-extrabold text-amber-300 flex items-center justify-between gap-1">
                    <span>🗓️ Escala Final de Semana (FDS)</span>
                    <Badge className="bg-amber-500/30 text-amber-200 border-none text-[10px] shrink-0">
                      {todaySchedules.filter((s) => matchesScheduleModeFilter(s, 'WEEKEND')).length}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                    Sábado e Domingo (plantão / FDS)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedScheduleMode('ALL')}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedScheduleMode === 'ALL'
                      ? 'bg-blue-500/20 border-blue-500 text-white shadow-lg shadow-blue-950/30'
                      : 'bg-[#090d16] border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs font-extrabold text-blue-300 flex items-center justify-between gap-1">
                    <span>📋 Todas as Minhas Escalas</span>
                    <Badge className="bg-blue-500/30 text-blue-200 border-none text-[10px] shrink-0">
                      {todaySchedules.length}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-gray-300 mt-0.5 leading-snug">
                    Exibir semanais e final de semana
                  </div>
                </button>
              </div>

              <div className="min-w-0">
                <select
                  value={selectedScheduleId}
                  onChange={(e) => handleSelectScheduleChange(e.target.value)}
                  style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                  className="w-full h-11 rounded-lg bg-[#090d16] border border-gray-600 px-2.5 sm:px-3 text-xs sm:text-sm font-medium text-white focus:border-seguranca-yellow focus:outline-none truncate"
                >
                  {(filteredDriverSchedules.length > 0 ? filteredDriverSchedules : todaySchedules).map((s) => {
                    const plate = s.vehicle?.plate || s.vehiclePlate || 'Sem placa';
                    const routeLabel = s.route?.name || s.routeCode || s.travelTrip?.name || s.workPost?.name || 'Rota';
                    const clientLabel =
                      s.clientName || s.workPost?.client?.name || s.travelTrip?.client?.name || s.location?.name || '';
                    const rec = resolveScheduleRecurrence(s);
                    const recTag = rec === 'WEEKEND' ? '[FDS]' : '[SEMANAL]';
                    const startT = resolveScheduleStartTime(s);
                    return (
                      <option key={s.id} value={s.id} style={{ backgroundColor: '#090d16', color: '#ffffff' }}>
                        {`${recTag} ${startT} • ${routeLabel}${clientLabel ? ` (${clientLabel})` : ''} • ${plate}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </>
          )}

          {/* Resumo Automático da Escala: Motorista, Veículo, Rota e Cliente */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-gray-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                Motorista
              </span>
              <span className="text-xs sm:text-sm font-bold text-white truncate block mt-0.5">
                {selectedSchedule?.employee?.name || employeeName || 'Motorista Escalado'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-gray-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                Veículo
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400 truncate block mt-0.5">
                {selectedVehicleObj
                  ? `${selectedVehicleObj.plate} — ${selectedVehicleObj.model || 'Veículo'}`
                  : selectedSchedule?.vehicle?.plate || selectedSchedule?.vehiclePlate
                    ? `${selectedSchedule.vehicle?.plate || selectedSchedule.vehiclePlate}${
                        selectedSchedule.vehicle?.model || selectedSchedule.vehicleModel
                          ? ` — ${selectedSchedule.vehicle?.model || selectedSchedule.vehicleModel}`
                          : ''
                      }`
                    : 'Informe no formulário abaixo'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-gray-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                Rota / Percurso
              </span>
              <span className="text-xs sm:text-sm font-bold text-seguranca-yellow truncate block mt-0.5">
                {selectedSchedule?.route?.name ||
                  selectedSchedule?.routeCode ||
                  selectedSchedule?.travelTrip?.name ||
                  routeCode ||
                  'Rota da Escala'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-gray-800">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">
                Cliente / Empresa
              </span>
              <span className="text-xs sm:text-sm font-bold text-blue-300 truncate block mt-0.5">
                {clientName ||
                  selectedSchedule?.clientName ||
                  selectedSchedule?.workPost?.client?.name ||
                  selectedSchedule?.travelTrip?.client?.name ||
                  selectedSchedule?.location?.name ||
                  'Informe no formulário abaixo'}
              </span>
            </div>
          </div>

          {/* Status da Escala Selecionada */}
          {selectedSchedule && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {selectedSchedule.pointStatus === 'PENDING_TRAFFIC_APPROVAL' ? (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 text-[11px] sm:text-xs whitespace-normal leading-tight">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>Aguardando Aprovação do Gestor de Tráfego</span>
                </Badge>
              ) : selectedSchedule.pointStatus === 'APPROVED' ? (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 text-[11px] sm:text-xs whitespace-normal leading-tight">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>
                    Ponto Confirmado às{' '}
                    {selectedSchedule.pointRegisteredAt
                      ? new Date(selectedSchedule.pointRegisteredAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : selectedSchedule.startTime}
                  </span>
                </Badge>
              ) : null}

              {isTripCompleted && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2.5 py-1 text-[11px] sm:text-xs">
                  Viagem Finalizada • KM Final: {selectedSchedule.finalKm} km
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Grade de Veículo e Cliente informados no Ponto Eletrônico */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-950/90 border border-gray-800">
          {/* Veículo da Viagem */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Car className="h-3.5 w-3.5 shrink-0" />
                Veículo da Viagem *
              </span>
              {selectedVehicleObj && (
                <span className="text-[10px] font-mono text-gray-400">
                  {selectedVehicleObj.plate}
                </span>
              )}
            </Label>
            <select
              value={vehicleId}
              onChange={(e) => {
                const val = e.target.value;
                setVehicleId(val);
                const foundV = vehicles.find((v) => v.id === val);
                if (selectedScheduleId && selectedScheduleId !== 'NEW') {
                  scheduleService.saveExecutionOverlay(selectedScheduleId, {
                    vehicleId: val,
                    vehiclePlate: foundV?.plate,
                    vehicleModel: foundV?.model,
                  });
                  scheduleService.emitDriverRecordsUpdated();
                }
              }}
              disabled={isTripCompleted}
              style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
              aria-label="Selecionar Veículo"
              className="w-full h-11 rounded-lg bg-[#090d16] border border-gray-600 px-3 text-xs sm:text-sm font-bold text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Selecione o Veículo da Escala...</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} style={{ backgroundColor: '#090d16', color: '#ffffff' }}>
                  {v.plate} — {v.model || 'Veículo Operacional'}
                </option>
              ))}
            </select>
          </div>

          {/* Cliente / Empresa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                Cliente / Empresa *
              </span>
              {clientName && (
                <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
                  {clientName}
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                value={clientName}
                onChange={(e) => {
                  const val = e.target.value;
                  setClientName(val);
                  if (selectedScheduleId && selectedScheduleId !== 'NEW') {
                    scheduleService.saveExecutionOverlay(selectedScheduleId, {
                      clientName: val,
                    });
                    scheduleService.emitDriverRecordsUpdated();
                  }
                }}
                disabled={isTripCompleted}
                placeholder="Ex: ATERPA, DIEFRA, FAGUNDES..."
                list="ponto-known-clients-list"
                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                className="!bg-[#090d16] !text-white border-gray-600 placeholder:text-gray-500 font-bold h-11 text-xs sm:text-sm"
              />
              <datalist id="ponto-known-clients-list">
                {clients.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
                <option value="ATERPA" />
                <option value="DIEFRA" />
                <option value="FAGUNDES CONSTRUTORA" />
                <option value="CKTR DO BRASIL" />
                <option value="ALFA SERVIÇOS" />
                <option value="COOPERTAR" />
                <option value="PROSPERAR" />
                <option value="VEÍCULOS MOBILIZADOS" />
              </datalist>
            </div>
          </div>
        </div>

        {/* Grade de Horários e Passageiros */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Horário Inicial */}
          <div className="space-y-1.5 col-span-1">
            <Label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Horário Inicial *</span>
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={isTripCompleted}
              style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
              className="!bg-[#090d16] !text-white border-gray-600 font-mono font-bold h-11 text-sm"
            />
          </div>

          {/* Horário Final */}
          <div className="space-y-1.5 col-span-1">
            <Label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Horário Final {isTripStarted ? '*' : ''}</span>
            </Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={!isTripStarted && !isFinishingMode}
              placeholder="--:--"
              style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
              className="!bg-[#090d16] !text-white border-gray-600 font-mono font-bold h-11 text-sm disabled:opacity-50"
            />
          </div>

          {/* Quantidade de Passageiros */}
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-purple-400 shrink-0" />
              <span>Quantidade de Passageiros *</span>
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={passengersCount}
              onChange={(e) => setPassengersCount(e.target.value)}
              disabled={isTripCompleted}
              placeholder="Ex: 42"
              style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
              className="!bg-[#090d16] !text-white border-gray-600 placeholder:text-gray-400 font-bold h-11"
            />
          </div>
        </div>

        {/* Painel de Odômetro: KM Inicial, KM Final e Botão Verde de Registrar Ponto logo abaixo do KM Final */}
        <div className="p-3.5 sm:p-5 rounded-xl bg-slate-950/90 border border-gray-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* KM Inicial */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                  <Gauge className="h-4 w-4 shrink-0" />
                  <span>KM Inicial (Ao Iniciar Viagem) *</span>
                </Label>
                {isTripStarted && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5">
                    Registrado
                  </Badge>
                )}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={initialKm}
                onChange={(e) => {
                  setInitialKm(e.target.value);
                  if (!startAddress && !capturingGps) {
                    captureDriverGeolocationAndAddress('START')
                      .then((geo) => {
                        setStartAddress(geo.address);
                        setStartCoords({ latitude: geo.latitude, longitude: geo.longitude });
                      })
                      .catch(() => {});
                  }
                }}
                disabled={isTripCompleted}
                placeholder="Ex: 185420"
                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                className="!bg-[#090d16] !text-white border-emerald-500/40 placeholder:text-gray-400 text-lg sm:text-xl font-mono font-bold h-13"
              />
            </div>

            {/* KM Final */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label
                  className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${
                    isTripStarted ? 'text-amber-400' : 'text-gray-400'
                  }`}
                >
                  <Flag className="h-4 w-4 shrink-0" />
                  <span>KM Final (Ao Finalizar Viagem)</span>
                </Label>
                {!isTripStarted ? (
                  <Badge variant="outline" className="border-gray-700 text-gray-400 text-[11px] px-2.5 py-0.5">
                    Após KM Inicial
                  </Badge>
                ) : isTripCompleted ? (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[11px] font-bold px-2.5 py-0.5">
                    Viagem Encerrada
                  </Badge>
                ) : null}
              </div>
              <Input
                type="number"
                inputMode="numeric"
                min={Number(initialKm || 0)}
                value={finalKm}
                onChange={(e) => {
                  setFinalKm(e.target.value);
                  if (isTripStarted && !endAddress && !capturingGps) {
                    captureDriverGeolocationAndAddress('END', startCoords || undefined)
                      .then((geo) => {
                        setEndAddress(geo.address);
                        setEndCoords({ latitude: geo.latitude, longitude: geo.longitude });
                      })
                      .catch(() => {});
                  }
                }}
                disabled={!isTripStarted || isTripCompleted}
                placeholder={
                  isTripStarted
                    ? 'Informe o KM Final para encerrar...'
                    : 'Registre o KM Inicial primeiro'
                }
                style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                className="!bg-[#090d16] !text-white border-amber-500/40 placeholder:text-gray-400 text-lg sm:text-xl font-mono font-bold h-13 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Controle de Tolerância (±10 min) e Esquecimento de Registro de Ponto */}
          <div className="rounded-xl bg-amber-950/20 border border-amber-500/30 p-3 sm:p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2.5 flex-wrap">
              <label htmlFor="forgot-point-checkbox" className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  id="forgot-point-checkbox"
                  type="checkbox"
                  checked={forgotPoint}
                  onChange={(e) => setForgotPoint(e.target.checked)}
                  className="h-5 w-5 mt-0.5 rounded border-amber-500 text-amber-500 focus:ring-amber-500 shrink-0"
                />
                <span className="text-xs sm:text-sm font-bold text-amber-200 leading-snug">
                  Esqueci de registrar o ponto no horário / Registro fora da tolerância de 10 minutos
                </span>
              </label>
              {!toleranceCheck.withinTolerance && (
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs whitespace-normal leading-tight">
                  Diferença de {toleranceCheck.diffMinutes} min do horário escalado (Tolerância: ±10 min)
                </Badge>
              )}
            </div>

            {requiresJustification && (
              <div className="space-y-1.5 pt-1">
                <Label className="text-xs font-bold text-amber-300 flex items-start gap-1.5 leading-snug">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Motivo do não registro no horário (Obrigatório para aprovação do Gestor / Encarregado de Tráfego) *</span>
                </Label>
                <Textarea
                  value={pointJustification}
                  onChange={(e) => setPointJustification(e.target.value)}
                  placeholder="Explique o motivo pelo qual o ponto está sendo registrado fora do horário escalado..."
                  rows={2}
                  style={{ backgroundColor: '#090d16', color: '#ffffff', colorScheme: 'dark' }}
                  className="!bg-[#090d16] !text-white border-amber-500/40 placeholder:text-gray-400 text-xs sm:text-sm"
                />
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  ⚠️ Atenção: Seu ponto será salvo, porém o status oficial e o horário do registro ficarão aguardando a aprovação do Gestor / Encarregado de Tráfego.
                </p>
              </div>
            )}
          </div>

          {/* Botão Verde Principal de Registrar Ponto + Iniciar Viagem LOGO ABAIXO DO KM FINAL */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch gap-3">
              <Button
                type="button"
                onClick={handleRegisterStartPointAndTrip}
                disabled={submitting}
                className="flex-1 w-full h-auto min-h-[60px] py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-3 whitespace-normal text-center leading-tight border border-emerald-400/30"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin shrink-0" />
                    <span>Registrando Ponto e KM...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-6 w-6 fill-current shrink-0" />
                    <span className="leading-snug">
                      Registrar Ponto + Iniciar Viagem
                      <span className="block text-xs sm:text-sm font-bold opacity-95 mt-0.5">
                        (Salvar KM Inicial e Fotos)
                      </span>
                    </span>
                  </>
                )}
              </Button>

              {isTripStarted && !isTripCompleted && (
                <Button
                  type="button"
                  onClick={handleFinishTripWithFinalKm}
                  disabled={submitting}
                  className="flex-1 w-full h-auto min-h-[60px] py-3.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-base sm:text-lg rounded-xl shadow-lg shadow-amber-950/60 flex items-center justify-center gap-3 whitespace-normal text-center leading-tight"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin shrink-0" />
                      <span>Finalizando Viagem...</span>
                    </>
                  ) : (
                    <>
                      <Flag className="h-6 w-6 shrink-0" />
                      <span className="leading-snug">
                        Finalizar Viagem + Salvar KM Final
                        <span className="block text-xs sm:text-sm font-bold opacity-90 mt-0.5">
                          (Encerrar Percurso e Fotos)
                        </span>
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>

            {isTripCompleted && (
              <div className="w-full p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2 text-emerald-300 text-xs sm:text-sm font-semibold leading-snug">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span>
                    Viagem concluída ({selectedSchedule?.startTime} às {selectedSchedule?.endTime || endTime}) • KM:{' '}
                    {selectedSchedule?.initialKm} km → {selectedSchedule?.finalKm} km • Passageiros:{' '}
                    {selectedSchedule?.passengersCount ?? passengersCount}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={() => handleSelectScheduleChange('NEW')}
                  className="w-full sm:w-auto bg-seguranca-yellow text-seguranca-black hover:bg-yellow-400 font-black text-sm sm:text-base min-h-[48px] px-5 rounded-xl"
                >
                  + Iniciar Novo Percurso Hoje
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Câmera do Telefone Móvel (Múltiplas Fotos para verificação do Gestor de Tráfego) */}
        <div className="rounded-xl bg-slate-950/70 border border-cyan-500/30 p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-cyan-300 flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>Fotos da Câmera do Celular (Verificação do Gestor)</span>
                </h4>
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 bg-cyan-500/10 shrink-0 text-xs font-bold">
                  {existingPhotos.length + capturedFiles.length} foto(s)
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed">
                Tire uma ou mais fotos usando a câmera do celular mostrando o painel/odômetro. Disponível em tempo real para o Gestor de Tráfego.
              </p>
            </div>
          </div>

          <CameraCapture
            key={cameraResetKey}
            onPhotosChange={(files) => {
              setCapturedFiles(files);
              const targetId =
                selectedScheduleId !== 'NEW'
                  ? selectedScheduleId
                  : todaySchedules.find((s) => !s.id.startsWith('ponto-local-'))?.id;
              if (targetId && files.length > 0) {
                Promise.all(files.map(fileToDataUrl))
                  .then((newUrls) => {
                    const combined = Array.from(new Set([...existingPhotos, ...newUrls]));
                    scheduleService.syncLiveExecutionOverlay(targetId, {
                      tripPhotosJson: JSON.stringify(combined),
                    });
                  })
                  .catch(() => {});
              }
            }}
            maxPhotos={10}
            disabled={isTripCompleted}
            label="Abrir Câmera do Celular / Tirar Fotos no Ônibus (Até 10 fotos)"
          />

          {existingPhotos.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <p className="text-xs font-medium text-gray-400">
                Fotos já salvas e enviadas ao Gestor de Tráfego nesta viagem ({existingPhotos.length}):
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {existingPhotos.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={`Foto enviada ${idx + 1}`}
                    className="h-16 w-24 object-cover rounded-lg border border-cyan-500/40 shrink-0"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumo das Viagens / Percursos Registrados Hoje pelo Motorista em Tempo Real */}
        {todaySchedules.length > 0 && (
          <div className="pt-3 border-t border-gray-800 space-y-2.5">
            <h4 className="text-xs sm:text-sm font-bold text-gray-300 uppercase tracking-wider">
              Percursos & Pontos Operacionais do Motorista Hoje ({todaySchedules.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {todaySchedules.map((item, idx) => {
                let pCount = 0;
                if (item.tripPhotosJson) {
                  try {
                    const arr = JSON.parse(item.tripPhotosJson);
                    if (Array.isArray(arr)) pCount = arr.length;
                  } catch {
                    pCount = 0;
                  }
                }
                const isSelected = item.id === selectedScheduleId;
                const isPendingApproval = item.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
                const dir =
                  item.direction ||
                  inferDirectionFromRouteCode(item.routeCode || item.route?.name || '', idx);

                return (
                  <div
                    key={item.id}
                    onClick={() => applyScheduleToForm(item)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all ${
                      isSelected
                        ? 'bg-seguranca-yellow/10 border-seguranca-yellow'
                        : 'bg-black/40 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge
                          className={`text-[10px] shrink-0 ${
                            dir === 'IDA'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {dir === 'IDA' ? 'IDA' : 'RETORNO'}
                        </Badge>
                        <span className="font-bold text-xs sm:text-sm text-white truncate">
                          {item.routeCode || item.route?.name || item.travelTrip?.name || 'Percurso'}
                        </span>
                      </div>
                      {isPendingApproval ? (
                        <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                          Aguard. Gestor
                        </Badge>
                      ) : item.finalKm != null ? (
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
                          Finalizada
                        </Badge>
                      ) : item.initialKm != null ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px]">
                          Em Viagem
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-gray-400">
                          Escalada
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        🕒 {isPendingApproval ? 'Horário retido (Aguard. Aprovação)' : `${item.startTime || '--:--'} - ${item.endTime || 'em curso'}`}
                      </span>
                      <span>🏢 {item.clientName || item.workPost?.client?.name || item.location?.name || '-'}</span>
                      <span>🛣️ KM: {item.initialKm ?? '-'} → {item.finalKm ?? '-'}</span>
                      <span>👥 Passag.: {item.passengersCount ?? 0}</span>
                      {pCount > 0 && <span className="text-cyan-400">📷 {pCount} foto(s)</span>}
                    </div>
                    {(item.startAddress || item.endAddress) && (
                      <div className="mt-2 pt-2 border-t border-gray-800/80 space-y-1 text-[11px]">
                        {item.startAddress && (
                          <div className="text-emerald-300 truncate" title={item.startAddress}>
                            📍 <strong>KM Ini:</strong> {item.startAddress}
                          </div>
                        )}
                        {item.endAddress && (
                          <div className="text-amber-300 truncate" title={item.endAddress}>
                            🏁 <strong>KM Fim:</strong> {item.endAddress}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mapa Interativo do Trajeto (Sentido Ida e Sentido Retorno) */}
        <DriverRouteTrajectoryMap
          schedules={todaySchedules}
          selectedScheduleId={selectedScheduleId !== 'NEW' ? selectedScheduleId : undefined}
          driverName={employeeName}
          heightClass="h-[340px]"
        />
      </CardContent>
    </Card>
  );
};

