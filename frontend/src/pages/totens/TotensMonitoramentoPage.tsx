import React, { useState, useEffect } from 'react';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Clock, 
  Tv, 
  HardDrive, 
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Monitor,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { kioskService } from '@/services/kioskService';
import { KioskDevice, KioskDeviceEvent } from '@/types/kiosk';

export const TotensMonitoramentoPage: React.FC = () => {
  const { toast } = useToast();

  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<KioskDevice | null>(null);
  const [deviceEvents, setDeviceEvents] = useState<KioskDeviceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMonitoring = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const devs = await kioskService.getDevices();
      setDevices(devs || []);
      if (!selectedDevice && devs && devs.length > 0) {
        setSelectedDevice(devs[0]);
      }
    } catch (err: any) {
      toast({
        title: 'Erro de monitoramento',
        description: err?.response?.data?.message || 'Falha ao buscar telemetria dos totens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMonitoring();
  }, []);

  // Carregar eventos do dispositivo selecionado
  useEffect(() => {
    if (!selectedDevice) return;

    const loadEvents = async () => {
      try {
        const events = await kioskService.getDeviceEvents(selectedDevice.id);
        setDeviceEvents(events || []);
      } catch (err) {
        setDeviceEvents([]);
      }
    };

    loadEvents();
  }, [selectedDevice]);

  // Polling a cada 15 segundos se autoRefresh estiver ativo
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadMonitoring(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDevice]);

  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d) => d.status === 'OFFLINE').length;

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Nunca';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return `${diffSec}s atrás`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m atrás`;
    return date.toLocaleTimeString('pt-BR');
  };

  return (
    <StandardLayout
      title="Monitoramento em Tempo Real"
      subtitle="Conectividade, heartbeat, telemetria e integridade dos totens"
    >
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-500" />
              Monitoramento em Tempo Real
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe a conectividade, logs de eventos e integridade dos totens conectados em campo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="rounded-xl text-xs"
            >
              <Clock className="h-3.5 w-3.5 mr-1" />
              {autoRefresh ? 'Auto-refresh Ativo (15s)' : 'Auto-refresh Pausado'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMonitoring(true)}
              disabled={refreshing}
              className="gap-2 rounded-xl border-border hover:bg-card text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar Agora
            </Button>
          </div>
        </div>

        {/* Métricas Gerais de Conectividade */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Totens Monitorados
                </p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{devices.length}</h3>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Tv className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Online (Transmitindo)
                </p>
                <h3 className="text-2xl font-bold text-emerald-500 mt-1">{onlineCount}</h3>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <Wifi className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/60">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Offline (Sem Sinal)
                </p>
                <h3 className="text-2xl font-bold text-zinc-400 mt-1">{offlineCount}</h3>
              </div>
              <div className="p-2.5 bg-zinc-500/10 text-zinc-400 rounded-xl">
                <WifiOff className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layout Dividido: Lista de Totens (Esquerda) + Telemetria Detalhada (Direita) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Totens com Sinal */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Equipamentos</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {devices.map((device) => {
                const isSelected = selectedDevice?.id === device.id;
                const isOnline = device.status === 'ONLINE';

                return (
                  <div
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/60 bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'}`} />
                        <span className="text-xs font-bold text-foreground line-clamp-1">{device.name}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {device.deviceCode}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{device.platform} • {device.orientation}</span>
                      <span>{formatRelativeTime(device.lastHeartbeatAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Telemetria e Logs do Totem Selecionado */}
          <div className="lg:col-span-2 space-y-4">
            {selectedDevice ? (
              <>
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Tv className="h-5 w-5 text-primary" />
                          {selectedDevice.name}
                        </CardTitle>
                        <CardDescription className="text-xs font-mono">
                          Código: {selectedDevice.deviceCode} • ID: {selectedDevice.id}
                        </CardDescription>
                      </div>

                      <Badge 
                        variant="outline"
                        className={selectedDevice.status === 'ONLINE' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-zinc-500 text-zinc-400'}
                      >
                        {selectedDevice.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Plataforma</span>
                        <span className="font-semibold text-foreground">{selectedDevice.platform}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Orientação</span>
                        <span className="font-semibold text-foreground">{selectedDevice.orientation}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Resolução</span>
                        <span className="font-semibold text-foreground">
                          {selectedDevice.resolutionWidth}x{selectedDevice.resolutionHeight}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Último Heartbeat</span>
                        <span className="font-semibold text-foreground">
                          {formatRelativeTime(selectedDevice.lastHeartbeatAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Eventos e Telemetria em Tempo Real */}
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      Logs de Telemetria e Interações do Totem
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Eventos operacionais transmitidos pelo player (ativação, cliques, erros de mídia)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {deviceEvents.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted-foreground">
                        Nenhum evento registrado recentemente para este equipamento.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/60 max-h-64 overflow-y-auto pr-1">
                        {deviceEvents.map((ev) => (
                          <div key={ev.id} className="py-2.5 flex items-start justify-between text-xs">
                            <div>
                              <p className="font-semibold text-foreground font-mono">{ev.eventType}</p>
                              <p className="text-[11px] text-muted-foreground font-mono">
                                {JSON.stringify(ev.eventPayload)}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(ev.occurredAt).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-12 text-center text-xs text-muted-foreground">
                Selecione um totem na lista para visualizar a telemetria.
              </div>
            )}
          </div>
        </div>
      </div>
    </StandardLayout>
  );
};

export default TotensMonitoramentoPage;
