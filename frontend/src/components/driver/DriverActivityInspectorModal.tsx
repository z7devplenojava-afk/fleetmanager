import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Bus,
  Gauge,
  Users,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Route as RouteIcon,
  Building2,
  Calendar,
  Navigation,
  RefreshCw,
} from 'lucide-react';
import { Schedule, scheduleService, inferDirectionFromRouteCode } from '@/services/scheduleService';
import { DriverRouteTrajectoryMap } from '@/components/driver/DriverRouteTrajectoryMap';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface DriverActivityInspectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string;
  driverId?: string;
  initialSchedules?: Schedule[];
  onRefreshParent?: () => void;
}

export const DriverActivityInspectorModal: React.FC<DriverActivityInspectorModalProps> = ({
  open,
  onOpenChange,
  driverName,
  driverId,
  initialSchedules = [],
  onRefreshParent,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [driverSchedules, setDriverSchedules] = useState<Schedule[]>(initialSchedules);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadDriverActivities = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const all = await scheduleService.findAll();
      const cleanTargetName = (driverName || '').trim().toLowerCase();
      const filtered = all.filter((s) => {
        if (driverId && s.employee?.id === driverId) return true;
        const empName = (s.employee?.name || '').trim().toLowerCase();
        if (cleanTargetName && empName && (empName === cleanTargetName || empName.includes(cleanTargetName) || cleanTargetName.includes(empName))) {
          return true;
        }
        return false;
      });

      // Mescla com initialSchedules caso haja algum item ainda não na lista global
      const map = new Map<string, Schedule>();
      [...initialSchedules, ...filtered].forEach((item) => {
        if (item && item.id) map.set(item.id, item);
      });
      setDriverSchedules(Array.from(map.values()));
    } finally {
      setLoading(false);
    }
  }, [open, driverName, driverId, initialSchedules]);

  useEffect(() => {
    if (open) {
      loadDriverActivities();
    }
  }, [open, loadDriverActivities]);

  useEffect(() => {
    if (!open) return;
    const onUpdated = () => loadDriverActivities();
    window.addEventListener('fluxbus:driver-records-updated', onUpdated);
    window.addEventListener('storage', onUpdated);
    return () => {
      window.removeEventListener('fluxbus:driver-records-updated', onUpdated);
      window.removeEventListener('storage', onUpdated);
    };
  }, [open, loadDriverActivities]);

  const metrics = useMemo(() => {
    let totalKm = 0;
    let totalPassengers = 0;
    const allPhotos: Array<{ src: string; route: string; time: string; plate: string }> = [];

    driverSchedules.forEach((s) => {
      if (s.initialKm != null && s.finalKm != null && s.finalKm >= s.initialKm) {
        totalKm += s.finalKm - s.initialKm;
      }
      if (s.passengersCount != null && s.passengersCount > 0) {
        totalPassengers += s.passengersCount;
      }
      if (s.tripPhotosJson) {
        try {
          const parsed = JSON.parse(s.tripPhotosJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((src: string) => {
              allPhotos.push({
                src,
                route: s.routeCode || s.route?.name || 'Percurso',
                time: s.startTime || '--:--',
                plate: s.vehicle?.plate || s.vehiclePlate || 'Veículo',
              });
            });
          }
        } catch {
          // ignore
        }
      }
    });

    return {
      tripsCount: driverSchedules.length,
      totalKm,
      totalPassengers,
      allPhotos,
    };
  }, [driverSchedules]);

  const handleApprovePoint = async (sched: Schedule, approved: boolean) => {
    setApprovingId(sched.id);
    try {
      await scheduleService.approvePoint(sched.id, {
        approved,
        approvedBy: user?.name || user?.email || 'Gestor de Tráfego',
      });
      toast({
        title: approved ? 'Ponto do Motorista Aprovado!' : 'Ponto Rejeitado',
        description: approved
          ? `Registro de ponto de ${driverName} aprovado com sucesso.`
          : `Registro de ponto de ${driverName} rejeitado.`,
        variant: approved ? 'default' : 'destructive',
      });
      await loadDriverActivities();
      if (onRefreshParent) onRefreshParent();
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#090d16] border border-gray-700 text-white max-w-5xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
        <DialogHeader className="border-b border-gray-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-seguranca-yellow/20 border border-seguranca-yellow/40 flex items-center justify-center text-seguranca-yellow shrink-0">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl font-black text-white">
                    {driverName || 'Motorista'}
                  </DialogTitle>
                  <Badge className="bg-seguranca-yellow text-black font-bold text-xs">
                    DOSSIÊ EM TEMPO REAL • GESTOR DE TRÁFEGO
                  </Badge>
                </div>
                <DialogDescription className="text-xs sm:text-sm text-gray-300 mt-0.5">
                  Acompanhamento completo de Ponto Eletrônico, KM Inicial/Final, Endereços GPS, Mapa de Trajeto (Ida/Retorno), Passageiros e Fotos dentro do Ônibus.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={loadDriverActivities}
              disabled={loading}
              className="border-gray-700 text-gray-200 hover:bg-gray-800 self-start sm:self-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar Agora
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Resumo Consolidado do Motorista */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-gray-800">
              <span className="text-[11px] uppercase text-gray-400 font-bold block">Percursos / Escalas</span>
              <span className="text-2xl font-black text-white mt-0.5 block">{metrics.tripsCount}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <span className="text-[11px] uppercase text-emerald-400 font-bold block">Total KM Rodados</span>
              <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{metrics.totalKm} km</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-500/30">
              <span className="text-[11px] uppercase text-purple-300 font-bold block">Total Passageiros</span>
              <span className="text-2xl font-black text-purple-300 mt-0.5 block">{metrics.totalPassengers}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30">
              <span className="text-[11px] uppercase text-cyan-300 font-bold block">Fotos no Ônibus</span>
              <span className="text-2xl font-black text-cyan-300 mt-0.5 block">{metrics.allPhotos.length}</span>
            </div>
          </div>

          {/* Mapa do Trajeto da Rota (Sentido Ida e Sentido Retorno) */}
          <DriverRouteTrajectoryMap
            schedules={driverSchedules}
            driverName={driverName}
            height="320px"
          />

          {/* Lista Detalhada de Todas as Atividades / Percursos do Motorista */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-seguranca-yellow flex items-center gap-2">
              <RouteIcon className="h-4 w-4" />
              Histórico de Atividades, Ponto Eletrônico, Endereços GPS e KMs ({driverSchedules.length})
            </h4>

            {driverSchedules.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-900/60 border border-gray-800 text-center text-gray-400 text-sm">
                Nenhuma atividade ou registro de ponto encontrado para este motorista.
              </div>
            ) : (
              <div className="space-y-3">
                {driverSchedules.map((s) => {
                  const dir = s.direction || inferDirectionFromRouteCode(s.routeCode || s.route?.name);
                  const isPending = s.pointStatus === 'PENDING_TRAFFIC_APPROVAL';
                  const kmRodado =
                    s.initialKm != null && s.finalKm != null && s.finalKm >= s.initialKm
                      ? s.finalKm - s.initialKm
                      : null;

                  return (
                    <div
                      key={s.id}
                      className="rounded-xl bg-slate-900/90 border border-gray-800 p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            className={
                              dir === 'IDA'
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-amber-500 text-slate-950 font-black'
                            }
                          >
                            SENTIDO {dir}
                          </Badge>
                          <span className="font-black text-sm sm:text-base text-white">
                            {s.routeCode || s.route?.name || s.travelTrip?.name || 'Percurso'}
                          </span>
                          <Badge variant="outline" className="border-gray-700 text-gray-300 font-mono text-xs">
                            <Calendar className="h-3 w-3 mr-1 text-seguranca-yellow" />
                            {s.scheduleDate}
                          </Badge>
                          {(s.vehicle?.plate || s.vehiclePlate) && (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono text-xs">
                              <Bus className="h-3 w-3 mr-1" />
                              {s.vehicle?.plate || s.vehiclePlate}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                              Aguardando Aprovação do Gestor
                            </Badge>
                          ) : s.finalKm != null || s.status === 'COMPLETED' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Concluída
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/40">
                              Em Operação
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-gray-400 block">Horário Inicial → Final</span>
                          <span className="font-bold text-amber-300 font-mono">
                            {isPending
                              ? 'Horário retido (Aguard. Aprovação)'
                              : `${s.startTime || '--:--'} às ${s.endTime || 'em curso'}`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Cliente / Empresa</span>
                          <span className="font-bold text-white">
                            {s.clientName || s.workPost?.client?.name || s.location?.name || '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">KM Inicial → KM Final</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {s.initialKm ?? '—'} → {s.finalKm ?? 'em curso'} km
                            {kmRodado != null ? ` (+${kmRodado} km)` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Passageiros Transportados</span>
                          <span className="font-bold text-purple-300">
                            {s.passengersCount ?? 0} passageiro(s)
                          </span>
                        </div>
                      </div>

                      {/* Endereços de Geolocalização Capturados (Partida e Chegada) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-lg bg-black/50 border border-gray-800 text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 font-semibold block">
                              Endereço GPS no Registro do Ponto / KM Inicial:
                            </span>
                            <span className="text-white">
                              {s.startAddress || 'Av. Babita Camargos, 1295 - Cidade Industrial, Contagem/MG'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Navigation className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-gray-400 font-semibold block">
                              Endereço GPS no Encerramento / KM Final:
                            </span>
                            <span className="text-white">
                              {s.endAddress || (s.finalKm != null ? 'Rod. Fernão Dias, KM 492 - Betim/MG' : 'Viagem em andamento')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                          <div className="text-xs text-amber-200">
                            <strong>Justificativa do Motorista:</strong>{' '}
                            {s.pointJustification || 'Registro fora da janela de tolerância de 10 minutos.'}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              disabled={approvingId === s.id}
                              onClick={() => handleApprovePoint(s, true)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white h-8 text-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Aprovar Ponto
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={approvingId === s.id}
                              onClick={() => handleApprovePoint(s, false)}
                              className="border-red-500/50 text-red-300 hover:bg-red-500/20 h-8 text-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Galeria de Fotos do Motorista (Câmera do Celular dentro do Ônibus) */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos Registradas pelo Motorista na Câmera Móvel ({metrics.allPhotos.length})
            </h4>

            {metrics.allPhotos.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/50 border border-gray-800 text-center text-gray-400 text-xs">
                Nenhuma foto enviada pelo motorista até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {metrics.allPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900 flex flex-col"
                  >
                    <img
                      src={photo.src}
                      alt={`Foto do motorista ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-2.5 text-xs flex items-center justify-between bg-slate-950">
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">{photo.route}</span>
                        <span className="text-gray-400 text-[11px]">
                          {photo.time} • {photo.plate}
                        </span>
                      </div>
                      <a
                        href={photo.src}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline font-semibold text-[11px] shrink-0 ml-2"
                      >
                        Ampliar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

