import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardLayout } from '@/components/StandardLayout';
import { 
  Tv, 
  Film, 
  Layers, 
  Send, 
  Activity, 
  Plus, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  ExternalLink,
  Wifi,
  WifiOff,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { kioskService } from '@/services/kioskService';
import { KioskDevice, KioskPresentation, KioskMediaAsset, KioskPublication } from '@/types/kiosk';

export const TotensDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [presentations, setPresentations] = useState<KioskPresentation[]>([]);
  const [mediaList, setMediaList] = useState<KioskMediaAsset[]>([]);
  const [publications, setPublications] = useState<KioskPublication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [devs, pres, media, pubs] = await Promise.all([
        kioskService.getDevices().catch(() => [] as KioskDevice[]),
        kioskService.getPresentations().catch(() => [] as KioskPresentation[]),
        kioskService.getMediaAssets().catch(() => [] as KioskMediaAsset[]),
        kioskService.getPublications().catch(() => [] as KioskPublication[]),
      ]);
      setDevices(devs);
      setPresentations(pres);
      setMediaList(media);
      setPublications(pubs);
    } catch (err) {
      console.error('Erro ao carregar dashboard de totens', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const onlineDevicesCount = devices.filter((d) => d.status === 'ONLINE').length;
  const pendingDevicesCount = devices.filter((d) => d.status === 'PENDING_PAIRING').length;

  return (
    <StandardLayout
      title="Gestão de Totens"
      subtitle="Digital Signage e gerenciamento de totens multimídia e interativos"
    >
      <div className="space-y-6">
        {/* Top Banner / Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-border p-6 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-primary/20 text-primary rounded-xl">
                <Tv className="h-5 w-5" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestão de Totens
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Digital Signage & Totens
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gerencie totens interativos, crie apresentações multimídia, envie atualizações remotas e monitore status em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => navigate('/totens/apresentacoes')}
              className="gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md font-semibold"
            >
              <Plus className="h-4 w-4" />
              Nova Apresentação
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/totens/dispositivos')}
              className="gap-2 rounded-xl border-border"
            >
              <Tv className="h-4 w-4" />
              Novo Totem
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/80 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Totens Cadastrados
              </CardTitle>
              <Tv className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {loading ? '...' : devices.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {onlineDevicesCount} totem(s) online agora
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Totens Online
              </CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-emerald-500">
                {loading ? '...' : onlineDevicesCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {pendingDevicesCount > 0 ? `${pendingDevicesCount} aguardando pareamento` : 'Telemetria ativa (30s)'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Apresentações
              </CardTitle>
              <Layers className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {loading ? '...' : presentations.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {presentations.filter(p => p.status === 'PUBLISHED').length} publicada(s) em totens
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/80 border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Biblioteca de Mídias
              </CardTitle>
              <Film className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {loading ? '...' : mediaList.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Vídeos e artes com hash SHA-256
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navegação Rápida pelos Módulos de Totens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card 
            onClick={() => navigate('/totens/dispositivos')}
            className="border-border hover:border-primary/50 cursor-pointer transition-all hover:shadow-md bg-card/60"
          >
            <CardHeader>
              <div className="p-3 bg-primary/10 text-primary w-fit rounded-xl mb-2">
                <Tv className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Equipamentos & Pareamento</CardTitle>
              <CardDescription>
                Cadastre totens verticais ou horizontais, gere códigos temporários de pareamento (PIN e QR Code) e gerencie credenciais.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            onClick={() => navigate('/totens/midias')}
            className="border-border hover:border-cyan-500/50 cursor-pointer transition-all hover:shadow-md bg-card/60"
          >
            <CardHeader>
              <div className="p-3 bg-cyan-500/10 text-cyan-400 w-fit rounded-xl mb-2">
                <Film className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Biblioteca de Mídias</CardTitle>
              <CardDescription>
                Upload de vídeos institucionais (MP4), imagens em alta definição e assets com validação de checksum para cache offline.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            onClick={() => navigate('/totens/apresentacoes')}
            className="border-border hover:border-amber-500/50 cursor-pointer transition-all hover:shadow-md bg-card/60"
          >
            <CardHeader>
              <div className="p-3 bg-amber-500/10 text-amber-400 w-fit rounded-xl mb-2">
                <Layers className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Editor de Apresentações</CardTitle>
              <CardDescription>
                Crie slides interativos ou com avanço automático, botões de toque, QR Codes, menus de veículos e formulários com LGPD.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Totens Ativos Recentes */}
        <Card className="border-border bg-card/60">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Totens Cadastrados Recentemente</CardTitle>
              <CardDescription>Status de conexão e telemetria</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/totens/dispositivos')}
              className="text-xs text-primary gap-1"
            >
              Ver Todos
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Nenhum totem cadastrado ainda. Clique em "Novo Totem" para registrar o primeiro equipamento.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {devices.slice(0, 5).map((device) => (
                  <div key={device.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${device.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                        <Tv className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-sm">{device.name}</p>
                        <p className="text-muted-foreground font-mono">{device.deviceCode} • {device.clientName || 'Empresa'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {device.orientation === 'PORTRAIT' ? 'Retrato (9:16)' : 'Paisagem (16:9)'}
                      </span>
                      <Badge 
                        variant="outline"
                        className={device.status === 'ONLINE' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10' : 'border-zinc-500 text-zinc-400'}
                      >
                        {device.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </StandardLayout>
  );
};

export default TotensDashboardPage;
