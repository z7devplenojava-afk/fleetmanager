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
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Schedule, scheduleService, inferDirectionFromRouteCode, generateScaleCode } from '@/services/scheduleService';
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
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

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
    const tacografoPhotos: Array<{ src: string; route: string; time: string; plate: string; scaleCode: string }> = [];
    const operationalPhotos: Array<{ src: string; route: string; time: string; plate: string; scaleCode: string }> = [];

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
            parsed.forEach((rawSrc: string) => {
              const isTac = rawSrc.startsWith('tacografo:');
              const cleanSrc = rawSrc.replace(/^tacografo:/, '');
              const photoItem = {
                src: cleanSrc,
                route: s.routeCode || s.route?.name || 'Percurso',
                time: s.startTime || '--:--',
                plate: s.vehicle?.plate || s.vehiclePlate || 'Veículo',
                scaleCode: generateScaleCode(s),
              };
              if (isTac) {
                tacografoPhotos.push(photoItem);
              } else {
                operationalPhotos.push(photoItem);
              }
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
      tacografoPhotos,
      operationalPhotos,
      allPhotos: [...tacografoPhotos, ...operationalPhotos],
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

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsReportOpen(true)}
                className="bg-seguranca-yellow text-slate-950 hover:bg-yellow-400 font-bold text-xs shadow-md"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Gerar Relatório Completo (PDF / Imprimir)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={loadDriverActivities}
                disabled={loading}
                className="border-gray-700 text-gray-200 hover:bg-gray-800 text-xs"
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Resumo Consolidado do Motorista */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-gray-800">
              <span className="text-[10px] uppercase text-gray-400 font-bold block">Percursos</span>
              <span className="text-xl sm:text-2xl font-black text-white mt-0.5 block">{metrics.tripsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30">
              <span className="text-[10px] uppercase text-emerald-400 font-bold block">Total KM Rodados</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 block">{metrics.totalKm} km</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-blue-500/30">
              <span className="text-[10px] uppercase text-blue-300 font-bold block">Passageiros</span>
              <span className="text-xl sm:text-2xl font-black text-blue-300 mt-0.5 block">{metrics.totalPassengers}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30">
              <span className="text-[10px] uppercase text-amber-300 font-bold block">Tacógrafo (Disco)</span>
              <span className="text-xl sm:text-2xl font-black text-amber-300 mt-0.5 block">{metrics.tacografoPhotos.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30">
              <span className="text-[10px] uppercase text-cyan-300 font-bold block">Fotos Painel/Ônibus</span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 mt-0.5 block">{metrics.operationalPhotos.length}</span>
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

          {/* Galeria Exclusiva: Disco de Tacógrafo (Auditoria do Gestor de Tráfego) */}
          <div className="space-y-3 p-4 rounded-xl bg-amber-950/20 border border-amber-500/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Auditoria de Tacógrafo (Disco / Fita Diária) ({metrics.tacografoPhotos.length})
              </h4>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                Exibição Separada para o Gestor
              </Badge>
            </div>

            {metrics.tacografoPhotos.length === 0 ? (
              <div className="p-4 rounded-lg bg-black/40 border border-dashed border-amber-500/30 text-center text-amber-200/70 text-xs">
                Nenhum disco de tacógrafo enviado pelo motorista para as viagens de hoje.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {metrics.tacografoPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="rounded-xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 flex flex-col shadow-lg"
                  >
                    <div className="relative">
                      <img
                        src={photo.src}
                        alt={`Disco de Tacógrafo ${index + 1}`}
                        className="w-full h-52 object-contain bg-black"
                      />
                      <Badge className="absolute top-2 left-2 bg-amber-500 text-slate-950 font-black text-[10px]">
                        DISCO DE TACÓGRAFO
                      </Badge>
                    </div>
                    <div className="p-3 text-xs flex items-center justify-between bg-slate-900 border-t border-amber-500/30">
                      <div className="truncate min-w-0 pr-2">
                        <span className="font-bold text-amber-300 block truncate">
                          [{photo.scaleCode}] {photo.route}
                        </span>
                        <span className="text-gray-400 text-[11px] block">
                          Hora: {photo.time} • Veículo: {photo.plate}
                        </span>
                      </div>
                      <a
                        href={photo.src}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-[11px] shrink-0"
                      >
                        Ampliar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Galeria de Fotos Operacionais / Odômetro / Veículo */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Fotos Operacionais (Odômetro, Painel & Veículo) ({metrics.operationalPhotos.length})
            </h4>

            {metrics.operationalPhotos.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/50 border border-gray-800 text-center text-gray-400 text-xs">
                Nenhuma foto operacional registrada nesta data.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {metrics.operationalPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="rounded-xl overflow-hidden border border-cyan-500/30 bg-slate-900 flex flex-col"
                  >
                    <img
                      src={photo.src}
                      alt={`Foto do motorista ${index + 1}`}
                      className="w-full h-48 object-cover bg-black"
                    />
                    <div className="p-2.5 text-xs flex items-center justify-between bg-slate-950">
                      <div className="truncate min-w-0 pr-2">
                        <span className="font-bold text-white block truncate">
                          [{photo.scaleCode}] {photo.route}
                        </span>
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

      {/* Modal / Visão de Impressão do Relatório Consolidado do Gestor de Tráfego */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-white text-slate-950 max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 print:p-0 print:max-w-none">
          <div className="flex items-center justify-between pb-4 border-b border-gray-300 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              <h3 className="font-black text-lg text-slate-900">Relatório Consolidado do Processo</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimir / Salvar PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsReportOpen(false)}
                className="text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>

          {/* Conteúdo Imprimível do Dossiê */}
          <div className="space-y-6 pt-4 text-slate-900 font-sans">
            {/* Cabeçalho Oficial */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  FLUXBUS • GESTÃO DE TRÁFEGO & FRETAMENTO
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Relatório Operacional Integrado: Ponto Eletrônico, Escalas, Tacógrafo e Checklist
                </p>
              </div>
              <div className="text-right text-xs">
                <span className="block font-bold">Data de Emissão:</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleString('pt-BR')}</span>
              </div>
            </div>

            {/* Quadro de Identificação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-100 rounded-lg border border-slate-300 text-xs">
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Motorista</span>
                <span className="font-black text-sm text-slate-900">{driverName}</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Total de Viagens / Escalas</span>
                <span className="font-black text-sm text-slate-900">{metrics.tripsCount} percurso(s)</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Quilometragem Total</span>
                <span className="font-black text-sm text-emerald-700">{metrics.totalKm} km rodados</span>
              </div>
              <div>
                <span className="block font-bold text-slate-500 uppercase text-[10px]">Passageiros Totais</span>
                <span className="font-black text-sm text-blue-700">{metrics.totalPassengers} transportados</span>
              </div>
            </div>

            {/* Detalhamento das Escalas & Ponto Eletrônico */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                1. Registros de Ponto Eletrônico & Jornada de Trabalho
              </h4>
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-200 text-slate-800 font-bold">
                  <tr>
                    <th className="p-2 border border-slate-300">Cód. Escala</th>
                    <th className="p-2 border border-slate-300">Percurso / Rota</th>
                    <th className="p-2 border border-slate-300">Veículo</th>
                    <th className="p-2 border border-slate-300">Cliente</th>
                    <th className="p-2 border border-slate-300 text-center">Horário</th>
                    <th className="p-2 border border-slate-300 text-center">KM Ini ➔ Fim</th>
                    <th className="p-2 border border-slate-300 text-center">KM Rodado</th>
                    <th className="p-2 border border-slate-300 text-center">Passag.</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverSchedules.map((s, idx) => {
                    const kmRod = s.initialKm != null && s.finalKm != null ? s.finalKm - s.initialKm : '-';
                    return (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="p-2 font-mono font-bold border border-slate-300 text-[11px]">
                          {generateScaleCode(s)}
                        </td>
                        <td className="p-2 border border-slate-300">{s.routeCode || s.route?.name || 'Percurso'}</td>
                        <td className="p-2 font-mono border border-slate-300">{s.vehicle?.plate || s.vehiclePlate || 'Sem placa'}</td>
                        <td className="p-2 border border-slate-300">{s.clientName || s.workPost?.client?.name || '-'}</td>
                        <td className="p-2 text-center font-mono border border-slate-300">
                          {s.startTime || '--:--'} às {s.endTime || '--:--'}
                        </td>
                        <td className="p-2 text-center font-mono border border-slate-300">
                          {s.initialKm ?? '-'} ➔ {s.finalKm ?? '-'}
                        </td>
                        <td className="p-2 text-center font-bold text-emerald-800 border border-slate-300">
                          {kmRod !== '-' ? `${kmRod} km` : '-'}
                        </td>
                        <td className="p-2 text-center border border-slate-300">
                          {s.passengersCount != null && s.passengersCount > 0 ? s.passengersCount : '-'}
                        </td>
                        <td className="p-2 text-center border border-slate-300 font-bold">
                          {s.pointStatus === 'APPROVED' ? 'Aprovado' : s.pointStatus === 'PENDING_TRAFFIC_APPROVAL' ? 'Pendente' : 'Concluído'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Seção do Disco de Tacógrafo */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                2. Comprovantes Visuais do Disco de Tacógrafo (Auditoria)
              </h4>
              {metrics.tacografoPhotos.length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhuma foto de disco de tacógrafo anexada para este motorista.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {metrics.tacografoPhotos.map((photo, pIdx) => (
                    <div key={pIdx} className="border border-slate-400 rounded-lg p-2 bg-slate-50 text-center">
                      <img src={photo.src} alt="Disco de Tacógrafo" className="h-40 w-full object-contain mx-auto border border-slate-300 rounded" />
                      <span className="block font-bold text-[11px] mt-1 text-slate-900">
                        [{photo.scaleCode}] {photo.route}
                      </span>
                      <span className="block text-[10px] text-slate-600">
                        Veículo: {photo.plate} • Horário: {photo.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção das Fotos Operacionais */}
            {metrics.operationalPhotos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
                  3. Fotos Operacionais (Odômetro & Veículo)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {metrics.operationalPhotos.map((photo, pIdx) => (
                    <div key={pIdx} className="border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-center">
                      <img src={photo.src} alt="Foto Operacional" className="h-28 w-full object-cover mx-auto rounded" />
                      <span className="block font-semibold text-[10px] mt-1 text-slate-800 truncate">
                        {photo.route} ({photo.plate})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assinaturas de Conferência */}
            <div className="grid grid-cols-2 gap-8 pt-8 mt-6 border-t-2 border-slate-400 text-center text-xs">
              <div>
                <div className="border-b border-slate-900 pb-1 mx-8 font-semibold text-slate-900">
                  {driverName}
                </div>
                <span className="block text-[10px] text-slate-600 mt-1 uppercase font-bold">Motorista Responsável</span>
              </div>
              <div>
                <div className="border-b border-slate-900 pb-1 mx-8 font-semibold text-slate-900">
                  {user?.name || 'Gestor de Tráfego'}
                </div>
                <span className="block text-[10px] text-slate-600 mt-1 uppercase font-bold">Gestão de Tráfego / Operações</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

