import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  QrCode,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  RefreshCw,
  Users,
  Compass,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Building2,
  UserCheck
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/axios';
import { Schedule, resolveScheduleStartTime, resolveScheduleEndTime } from '@/services/scheduleService';
import { fretamentoCheckinService, getCurrentGeoPosition, reverseGeocode } from '@/services/fretamentoCheckinService';

export interface BoardingPassenger {
  id: string;
  name: string;
  registration?: string;
  cpf?: string;
  clientName?: string;
  clientId?: string;
  boardingPointName?: string;
  status?: string;
  boardedAt?: string;
  direction?: 'IDA' | 'RETORNO';
  isAvulso?: boolean;
}

interface DriverBoardingPanelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  driverName?: string;
}

export const DriverBoardingPanelModal: React.FC<DriverBoardingPanelModalProps> = ({
  open,
  onOpenChange,
  schedule,
  driverName,
}) => {
  const { toast } = useToast();
  const [direction, setDirection] = useState<'IDA' | 'RETORNO'>('IDA');
  const [passengers, setPassengers] = useState<BoardingPassenger[]>([]);
  const [boardedIds, setBoardedIds] = useState<Set<string>>(new Set());
  const [loadingList, setLoadingList] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [validating, setValidating] = useState(false);
  const [lastBoarded, setLastBoarded] = useState<{
    name: string;
    cpf?: string;
    registration?: string;
    clientName?: string;
    direction: 'IDA' | 'RETORNO';
    time: string;
  } | null>(null);

  const qrRegionId = 'driver-qr-reader-region';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Som de confirmação de embarque
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Áudio silencioso caso navegador restrinja
    }
  };

  // Carregar colaboradores vinculados à rota da escala
  const loadRoutePassengers = useCallback(async () => {
    if (!schedule) return;
    const routeId = schedule.route?.id || schedule.routeId;
    if (!routeId) {
      setPassengers([]);
      return;
    }

    try {
      setLoadingList(true);
      const res = await api.get(`/api/passengers/route/${routeId}`, {
        params: { direction }
      });
      const data: any[] = res.data || [];
      const mapped: BoardingPassenger[] = data.map((p) => ({
        id: p.id,
        name: p.name,
        registration: p.registration,
        cpf: p.cpf,
        clientName: p.clientName || schedule.clientName || schedule.client?.name || 'Cliente Fretado',
        clientId: p.clientId,
        boardingPointName: p.boardingPoint?.name || p.boardingPointName || 'Ponto de Embarque',
        status: p.status || 'ATIVO',
      }));
      setPassengers(mapped);
    } catch (err) {
      console.warn('Não foi possível carregar passageiros da rota:', err);
    } finally {
      setLoadingList(false);
    }
  }, [schedule, direction]);

  useEffect(() => {
    if (open && schedule) {
      // Inicia com o sentido padrão da rota ou da escala
      const initialDir = schedule.direction?.toUpperCase() === 'RETORNO' ? 'RETORNO' : 'IDA';
      setDirection(initialDir);
      setBoardedIds(new Set());
      setLastBoarded(null);
      loadRoutePassengers();
    }
  }, [open, schedule, loadRoutePassengers]);

  // Recarregar quando mudar o sentido
  useEffect(() => {
    if (open && schedule) {
      loadRoutePassengers();
    }
  }, [direction, open, schedule, loadRoutePassengers]);

  // Processar leitura de QR Code ou código digitado
  const handleProcessScan = useCallback(async (rawText: string) => {
    if (!rawText || validating) return;
    setValidating(true);

    try {
      const clean = rawText.trim();
      let passengerId: string | undefined;
      let matricula: string | undefined;
      let cpf: string | undefined;

      // Se for JSON estruturado de credencial
      if (clean.startsWith('{') && clean.endsWith('}')) {
        try {
          const parsed = JSON.parse(clean);
          passengerId = parsed.id || parsed.passengerId;
          matricula = parsed.matricula || parsed.registration;
          cpf = parsed.cpf;
        } catch {
          // segue para raw
        }
      }

      if (!passengerId && !matricula && !cpf) {
        const digitsOnly = clean.replace(/\D/g, '');
        if (digitsOnly.length === 11) {
          cpf = digitsOnly;
        } else {
          matricula = clean;
        }
      }

      const geo = await getCurrentGeoPosition();
      const addr = await reverseGeocode(geo.latitude, geo.longitude);

      // Chamada de validação no backend
      const payload: any = {
        passengerId,
        cpf,
        matricula,
        scheduleId: schedule?.id,
        direction,
        validationMode: 'QR_MOTORISTA',
        latitude: geo.latitude,
        longitude: geo.longitude,
        address: addr,
      };

      const res = await api.post('/api/boardings/validate-qr', payload);
      const boardingData = res.data;

      const pName = boardingData.passengerName || 'Passageiro / Colaborador';
      const pCpf = boardingData.cpf || cpf || '';
      const pMat = boardingData.registration || matricula || '';
      const pClient = boardingData.clientName || schedule?.clientName || 'Transporte Fretado';

      // Marca como embarcado na lista local
      if (boardingData.passengerId) {
        setBoardedIds((prev) => new Set(prev).add(boardingData.passengerId));
      }

      // Se não constava na lista prévia (ex: check-in livre ou avulso), adiciona à lista da tela
      setPassengers((prev) => {
        const exists = prev.some((p) => p.id === boardingData.passengerId || (p.cpf && p.cpf === pCpf));
        if (exists) {
          return prev.map((p) =>
            p.id === boardingData.passengerId || (p.cpf && p.cpf === pCpf)
              ? { ...p, boardedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              : p
          );
        }
        return [
          {
            id: boardingData.passengerId || `avulso_${Date.now()}`,
            name: pName,
            cpf: pCpf,
            registration: pMat,
            clientName: pClient,
            boardingPointName: addr || 'Embarque em Trânsito',
            boardedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAvulso: true,
          },
          ...prev,
        ];
      });

      const confirmedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastBoarded({
        name: pName,
        cpf: pCpf,
        registration: pMat,
        clientName: pClient,
        direction,
        time: confirmedTime,
      });

      // Feedback sonoro (beep agudo para IDA e duplo para RETORNO)
      if (direction === 'IDA') {
        playBeep(920, 0.18);
      } else {
        playBeep(650, 0.15);
        setTimeout(() => playBeep(780, 0.15), 180);
      }

      toast({
        title: `✅ Embarque Confirmado (${direction})!`,
        description: `${pName} • ${pClient} às ${confirmedTime}`,
        className: direction === 'IDA' ? 'bg-emerald-900 text-white' : 'bg-purple-900 text-white',
      });

      setManualInput('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Não foi possível confirmar o embarque. Verifique o cadastro ou permissão da rota.';

      playBeep(320, 0.35); // tom grave de alerta

      toast({
        title: '❌ Embarque Não Confirmado',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  }, [schedule, direction, validating, toast]);

  // Inicializar câmera com html5-qrcode
  const startCamera = async () => {
    try {
      const html5Qr = new Html5Qrcode(qrRegionId);
      html5QrCodeRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleProcessScan(decodedText);
        },
        () => {
          // ignore frames sem QR
        }
      );
      setScannerActive(true);
    } catch (err) {
      console.error('Erro ao iniciar câmera:', err);
      toast({
        title: 'Câmera indisponível',
        description: 'Permita o acesso à câmera do navegador ou utilize o campo de digitação rápida.',
        variant: 'destructive',
      });
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && scannerActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Erro ao parar scanner:', e);
      }
      setScannerActive(false);
    }
  };

  // Desativa câmera ao fechar modal
  useEffect(() => {
    if (!open && scannerActive) {
      stopCamera();
    }
  }, [open, scannerActive]);

  const routeName =
    schedule?.routeCode ||
    schedule?.route?.name ||
    schedule?.travelTrip?.name ||
    schedule?.workPost?.name ||
    'Linha / Rota da Escala';

  const routeTime = `${resolveScheduleStartTime(schedule || {})} às ${resolveScheduleEndTime(schedule || {})}`;
  const vehiclePlate = schedule?.vehicle?.plate || schedule?.vehiclePlate || 'Sem placa';
  const clientName = schedule?.clientName || schedule?.client?.name || 'Cliente Corporativo';

  const isIda = direction === 'IDA';
  // Cores estritas solicitadas: Verde Bandeira para IDA, Roxa para RETORNO
  const headerBgClass = isIda
    ? 'bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 border-emerald-600/50'
    : 'bg-gradient-to-r from-purple-900 via-purple-800 to-purple-950 border-purple-600/50';

  const badgeColorClass = isIda
    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
    : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400';

  const boardedCount = passengers.filter(
    (p) => boardedIds.has(p.id) || Boolean(p.boardedAt)
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-slate-950 text-white border-gray-700 p-4 sm:p-6 rounded-3xl space-y-4">
        <DialogHeader className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-2.5 rounded-xl ${
                  isIda ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>Painel de Embarque da Escala</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-400">
                  {driverName ? `Motorista: ${driverName} • ` : ''}Veículo: {vehiclePlate}
                </DialogDescription>
              </div>
            </div>

            {/* Alternador de Sentido: IDA (Verde Bandeira) vs RETORNO (Roxa) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setDirection('IDA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  isIda
                    ? 'bg-[#15803d] text-white shadow-md shadow-emerald-900/50 ring-1 ring-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>SENTIDO IDA</span>
              </button>

              <button
                type="button"
                onClick={() => setDirection('RETORNO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  !isIda
                    ? 'bg-[#7e22ce] text-white shadow-md shadow-purple-900/50 ring-1 ring-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>SENTIDO RETORNO</span>
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Card Informativo da Linha e Sentido */}
        <div className={`p-4 rounded-2xl border text-white shadow-lg space-y-2.5 transition-all ${headerBgClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 block">
                Itinerário da Escala &bull; Cliente: {clientName}
              </span>
              <h3 className="text-base sm:text-lg font-black truncate">{routeName}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge className={`${badgeColorClass} font-black text-xs px-2.5 py-1 uppercase`}>
                Sentido {direction}
              </Badge>
              <span className="text-xs font-mono bg-black/40 px-2.5 py-1 rounded-md text-white/90 font-bold">
                {routeTime}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-white/90 gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                Embarcados:{' '}
                <strong className="text-white text-sm">
                  {boardedCount} / {passengers.length}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Limite: 1 check-in de IDA e 1 de RETORNO por dia</span>
            </div>
          </div>
        </div>

        {/* Banner do Último Passageiro Confirmado */}
        {lastBoarded && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 animate-in fade-in duration-300 ${
              lastBoarded.direction === 'IDA'
                ? 'bg-[#15803d]/25 border-emerald-500 text-emerald-200'
                : 'bg-[#7e22ce]/25 border-purple-500 text-purple-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2
                className={`h-5 w-5 shrink-0 ${
                  lastBoarded.direction === 'IDA' ? 'text-emerald-400' : 'text-purple-400'
                }`}
              />
              <div className="truncate">
                <p className="font-black text-sm text-white truncate">{lastBoarded.name}</p>
                <p className="text-xs text-white/70">
                  {lastBoarded.registration ? `Matrícula: ${lastBoarded.registration} • ` : ''}
                  {lastBoarded.clientName} &bull; {lastBoarded.direction} às {lastBoarded.time}
                </p>
              </div>
            </div>
            <Badge
              className={
                lastBoarded.direction === 'IDA'
                  ? 'bg-[#15803d] text-white font-bold'
                  : 'bg-[#7e22ce] text-white font-bold'
              }
            >
              Confirmado!
            </Badge>
          </div>
        )}

        {/* Área do Scanner e Entrada Manual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Leitor de Câmera */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-400" /> Câmera QR Code
              </span>
              <Button
                type="button"
                size="sm"
                variant={scannerActive ? 'destructive' : 'default'}
                onClick={scannerActive ? stopCamera : startCamera}
                className="h-7 text-xs font-bold px-2.5"
              >
                {scannerActive ? (
                  <>
                    <CameraOff className="h-3.5 w-3.5 mr-1" /> Desativar
                  </>
                ) : (
                  <>
                    <Camera className="h-3.5 w-3.5 mr-1" /> Ativar Scanner
                  </>
                )}
              </Button>
            </div>

            <div className="relative w-full aspect-video sm:aspect-square max-h-[220px] rounded-xl overflow-hidden bg-black flex items-center justify-center border border-slate-700">
              <div id={qrRegionId} className="w-full h-full" />
              {!scannerActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-gray-400 bg-slate-950/80">
                  <QrCode className="h-10 w-10 mb-2 opacity-30 text-gray-300" />
                  <p className="text-xs">
                    Clique em <strong>Ativar Scanner</strong> para ler crachás e QR Codes com a câmera.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Validação Rápida por Digitação de Matrícula ou CPF */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-1.5">
                <Search className="h-4 w-4 text-primary" /> Check-in Rápido (Matrícula ou CPF)
              </span>
              <p className="text-[11px] text-gray-400 leading-relaxed mb-3">
                Caso o colaborador esteja sem crachá ou o QR esteja ilegível, digite o CPF ou número de matrícula:
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessScan(manualInput);
              }}
              className="space-y-2.5"
            >
              <Input
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Digite a matrícula ou CPF..."
                disabled={validating}
                className="bg-black/60 border-slate-700 text-white font-mono h-11 text-sm font-bold"
              />
              <Button
                type="submit"
                disabled={!manualInput.trim() || validating}
                className={`w-full h-10 font-black text-xs uppercase tracking-wider text-white shadow-md ${
                  isIda ? 'bg-[#15803d] hover:bg-emerald-600' : 'bg-[#7e22ce] hover:bg-purple-600'
                }`}
              >
                {validating ? 'Validando...' : `Confirmar Embarque (${direction})`}
              </Button>
            </form>
          </div>
        </div>

        {/* Lista de Passageiros da Rota */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-bold text-gray-300 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-emerald-400" />
              <span>Colaboradores / Passageiros Previstos ({passengers.length})</span>
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRoutePassengers}
              disabled={loadingList}
              className="h-6 text-[11px] text-gray-400 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
              Atualizar Lista
            </Button>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-2xl max-h-56 overflow-y-auto bg-slate-900/60">
            {passengers.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400">
                {schedule?.routeId
                  ? 'Nenhum passageiro vinculado à rota ou rota configurada como Check-in Livre.'
                  : 'Esta escala não possui rota fixa associada. Utilize o leitor de QR Code para registrar embarques avulsos.'}
              </div>
            ) : (
              passengers.map((p) => {
                const isBoarded = boardedIds.has(p.id) || Boolean(p.boardedAt);
                return (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between gap-2.5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          isBoarded
                            ? isIda
                              ? 'bg-[#15803d] text-white'
                              : 'bg-[#7e22ce] text-white'
                            : 'bg-slate-800 text-gray-400'
                        }`}
                      >
                        {isBoarded ? <Check className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-white truncate">{p.name}</span>
                          {p.isAvulso && (
                            <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400 py-0">
                              Avulso / Livre
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {p.registration ? `Matrícula: ${p.registration} • ` : ''}
                          {p.cpf ? `CPF: ${p.cpf} • ` : ''}
                          {p.boardingPointName}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {isBoarded ? (
                        <Badge
                          className={`text-[10px] font-bold ${
                            isIda ? 'bg-[#15803d] text-white' : 'bg-[#7e22ce] text-white'
                          }`}
                        >
                          Embarcado {p.boardedAt ? `às ${p.boardedAt}` : ''}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleProcessScan(p.registration || p.cpf || p.id)}
                          disabled={validating}
                          className="h-7 text-[11px] font-bold border-slate-700 hover:bg-slate-800"
                        >
                          Embarcar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

