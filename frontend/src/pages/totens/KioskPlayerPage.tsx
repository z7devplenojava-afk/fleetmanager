import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Tv, 
  Key, 
  QrCode, 
  Play, 
  RefreshCw, 
  AlertTriangle, 
  Maximize, 
  Minimize,
  Wifi,
  WifiOff,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ManifestSlide {
  id: string;
  name: string;
  position: number;
  durationMs?: number | null;
  transitionType: string;
  interactionMode: string;
  backgroundType: string;
  backgroundMediaId?: string;
  elements: any[];
}

interface Manifest {
  presentationId: string;
  versionNumber: number;
  name: string;
  idleTimeoutSeconds: number;
  homeSlideId?: string;
  slides: ManifestSlide[];
  assets: any[];
}

/**
 * Baixa um asset do totem usando o token de dispositivo e devolve um blob URL.
 * As tags <img>/<video> não conseguem enviar headers customizados, então o
 * download autenticado é feito via axios e o binário é exposto como object URL.
 */
const useDeviceMediaUrl = (deviceToken: string | null, mediaId?: string) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceToken || !mediaId) {
      setObjectUrl(null);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    axios
      .get(`/api/player/media/${mediaId}/content`, {
        headers: { 'X-Device-Token': deviceToken },
        responseType: 'blob',
      })
      .then((resp) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(resp.data);
        setObjectUrl(createdUrl);
      })
      .catch(() => {
        if (!cancelled) setObjectUrl(null);
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [deviceToken, mediaId]);

  return objectUrl;
};

const PlayerMedia: React.FC<{
  deviceToken: string | null;
  mediaId?: string;
  kind: 'image' | 'video';
  className: string;
}> = ({ deviceToken, mediaId, kind, className }) => {
  const url = useDeviceMediaUrl(deviceToken, mediaId);
  if (!url) return null;

  if (kind === 'video') {
    return <video src={url} autoPlay loop muted playsInline className={className} />;
  }
  return <img src={url} alt="Mídia do totem" className={className} />;
};

export const KioskPlayerPage: React.FC = () => {
  // Credenciais salvas no hardware
  const [deviceToken, setDeviceToken] = useState<string | null>(
    localStorage.getItem('kiosk_device_token')
  );
  const [deviceId, setDeviceId] = useState<string | null>(
    localStorage.getItem('kiosk_device_id')
  );

  // Estados de Pareamento
  const [pinInput, setPinInput] = useState('');
  const [pairing, setPairing] = useState(false);
  const [pairError, setPairError] = useState<string | null>(null);

  // Estados do Runtime
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showConfigOverlay, setShowConfigOverlay] = useState(false);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Tentar ler PIN da URL (ex: /player?pin=ABC123)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pin = params.get('pin');
    if (pin && !deviceToken) {
      setPinInput(pin.toUpperCase());
    }
  }, [deviceToken]);

  // 2. Realizar Pareamento
  const handlePair = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) return;

    setPairing(true);
    setPairError(null);

    try {
      const resp = await axios.post('/api/player/pair', {
        pairingCode: pinInput.trim().toUpperCase(),
        platform: 'WEB',
        platformVersion: navigator.userAgent,
        playerVersion: '1.0.0',
        resolutionWidth: window.innerWidth,
        resolutionHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'LANDSCAPE' : 'PORTRAIT',
      });

      const { deviceToken: token, deviceId: id } = resp.data;
      localStorage.setItem('kiosk_device_token', token);
      localStorage.setItem('kiosk_device_id', id);
      setDeviceToken(token);
      setDeviceId(id);
    } catch (err: any) {
      setPairError(err?.response?.data?.message || 'Código PIN inválido ou expirado.');
    } finally {
      setPairing(false);
    }
  };

  // 3. Buscar Manifesto com o Token do Dispositivo
  const fetchManifest = async () => {
    if (!deviceToken) return;
    setLoadingManifest(true);
    try {
      const resp = await axios.get('/api/player/manifest', {
        headers: { 'X-Device-Token': deviceToken },
      });
      if (resp.data && resp.data.slides) {
        setManifest(resp.data);
      }
      setIsOnline(true);
    } catch (err) {
      console.error('Falha ao carregar manifesto do totem', err);
      setIsOnline(false);
    } finally {
      setLoadingManifest(false);
    }
  };

  useEffect(() => {
    if (deviceToken) {
      fetchManifest();
    }
  }, [deviceToken]);

  // 4. Heartbeat Recorrente (a cada 30 segundos)
  useEffect(() => {
    if (!deviceToken) return;

    const sendHeartbeat = async () => {
      try {
        await axios.post(
          '/api/player/heartbeat',
          {
            activeVersionId: (manifest as any)?.presentationVersionId,
            playerVersion: '1.0.0',
            resolutionWidth: window.innerWidth,
            resolutionHeight: window.innerHeight,
            metrics: { online: true },
          },
          { headers: { 'X-Device-Token': deviceToken } }
        );
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, [deviceToken, manifest]);

  // 5. Timer de Inatividade (Reset para Home Slide)
  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!manifest || !manifest.idleTimeoutSeconds) return;

    idleTimerRef.current = setTimeout(() => {
      // Retorna para o slide inicial após o timeout de inatividade
      setCurrentSlideIndex(0);
    }, manifest.idleTimeoutSeconds * 1000);
  };

  // Monitora toques e cliques para reset de inatividade
  useEffect(() => {
    const handleUserInteraction = () => resetIdleTimer();
    window.addEventListener('touchstart', handleUserInteraction);
    window.addEventListener('click', handleUserInteraction);
    resetIdleTimer();

    return () => {
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('click', handleUserInteraction);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [manifest]);

  // 6. Avanço Automático de Slides
  useEffect(() => {
    if (!manifest || !manifest.slides || manifest.slides.length === 0) return;
    const current = manifest.slides[currentSlideIndex];
    if (!current || !current.durationMs || current.interactionMode === 'INTERACTIVE') return;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % manifest.slides.length);
    }, current.durationMs);

    return () => clearTimeout(timer);
  }, [manifest, currentSlideIndex]);

  // 7. Ação de Toque em Elemento
  const handleElementClick = (action?: any) => {
    if (!action || !action.type || action.type === 'NONE') return;

    if (action.type === 'GO_TO_SLIDE' && action.targetSlideIndex !== undefined) {
      const idx = Number(action.targetSlideIndex);
      if (manifest?.slides && idx >= 0 && idx < manifest.slides.length) {
        setCurrentSlideIndex(idx);
      }
    } else if (action.type === 'OPEN_URL' && action.url) {
      window.open(action.url, '_blank');
    }
  };

  // Alternar Tela Cheia
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Desparear Totem
  const handleUnpair = () => {
    if (window.confirm('Deseja desvincular este totem? Será necessário inserir um novo PIN para ativá-lo.')) {
      localStorage.removeItem('kiosk_device_token');
      localStorage.removeItem('kiosk_device_id');
      setDeviceToken(null);
      setDeviceId(null);
      setManifest(null);
      setShowConfigOverlay(false);
    }
  };

  // TELA 1: ATIVAÇÃO / PAREAMENTO (Sem Token)
  if (!deviceToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white select-none">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center space-y-6">
          <div className="p-4 bg-primary/10 text-primary w-fit mx-auto rounded-2xl">
            <Tv className="h-12 w-12" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Ativação de Totem</h1>
            <p className="text-sm text-zinc-400">
              Digite o código PIN de 6 caracteres gerado no painel de administração FluxBus para vincular este hardware.
            </p>
          </div>

          <form onSubmit={handlePair} className="space-y-4">
            <Input
              type="text"
              maxLength={6}
              placeholder="Ex: 8K29X1"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.toUpperCase())}
              className="text-center font-mono text-3xl tracking-widest uppercase bg-slate-800 border-slate-700 h-16 rounded-2xl text-white font-bold"
              autoFocus
            />

            {pairError && (
              <p className="text-xs text-red-400 font-medium">{pairError}</p>
            )}

            <Button
              type="submit"
              disabled={pairing || pinInput.length < 4}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-base"
            >
              {pairing ? 'Ativando Dispositivo...' : 'Ativar Totem'}
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-xs text-zinc-400 flex items-center justify-center gap-1.5">
            <QrCode className="h-4 w-4 text-primary" />
            <span>FluxBus Kiosk Player v1.0 • Pronto para Pareamento</span>
          </div>
        </div>
      </div>
    );
  }

  // TELA 2: CARREGANDO MANIFESTO
  if (loadingManifest && !manifest) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white select-none">
        <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
        <h2 className="text-lg font-bold">Carregando Apresentação do Totem...</h2>
        <p className="text-xs text-zinc-400 mt-1">Conectando ao servidor e verificando integridade</p>
      </div>
    );
  }

  // TELA 3: NENHUMA APRESENTAÇÃO VINCULADA
  if (!manifest || !manifest.slides || manifest.slides.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center select-none">
        <Tv className="h-16 w-16 text-zinc-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Totem Pareado com Sucesso!</h2>
        <p className="text-sm text-zinc-400 max-w-sm mt-1">
          Aguardando o envio de uma apresentação aprovada pelo painel administrativo.
        </p>
        <Button 
          variant="outline" 
          onClick={fetchManifest}
          className="mt-6 rounded-xl text-xs gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Verificar Novamente
        </Button>
      </div>
    );
  }

  // TELA 4: RUNTIME DO PLAYER EM TELA CHEIA
  const activeSlide = manifest.slides[currentSlideIndex] || manifest.slides[0];

  return (
    <div className="fixed inset-0 bg-black text-white overflow-hidden select-none cursor-default">
      {/* Botão sutil de controle no canto superior direito (oculto / toque duplo) */}
      <button
        onClick={() => setShowConfigOverlay(!showConfigOverlay)}
        className="absolute top-3 right-3 z-50 p-2 rounded-xl bg-black/40 hover:bg-black/80 backdrop-blur-md opacity-20 hover:opacity-100 transition-opacity"
        title="Opções do Totem"
      >
        <Settings className="h-4 w-4 text-white" />
      </button>

      {/* Menu Overlay de Configuração / Status */}
      {showConfigOverlay && (
        <div className="absolute top-12 right-3 z-50 p-4 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl text-xs space-y-3 min-w-[220px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold">Status do Totem</span>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          </div>
          <div className="space-y-1 text-zinc-400">
            <p>Apresentação: <strong className="text-white">{manifest.name}</strong></p>
            <p>Versão: <strong className="text-white">v{manifest.versionNumber}</strong></p>
            <p>Slide: <strong className="text-white">{currentSlideIndex + 1}/{manifest.slides.length}</strong></p>
          </div>
          <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
            <Button size="sm" variant="outline" onClick={toggleFullscreen} className="h-8 text-xs rounded-lg">
              {isFullscreen ? <Minimize className="h-3.5 w-3.5 mr-1" /> : <Maximize className="h-3.5 w-3.5 mr-1" />}
              {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            </Button>
            <Button size="sm" variant="outline" onClick={fetchManifest} className="h-8 text-xs rounded-lg">
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Recarregar Manifesto
            </Button>
            <Button size="sm" variant="destructive" onClick={handleUnpair} className="h-8 text-xs rounded-lg">
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Desparear Totem
            </Button>
          </div>
        </div>
      )}

      {/* Plano de Fundo do Slide */}
      {activeSlide.backgroundType === 'IMAGE' && activeSlide.backgroundMediaId && (
        <PlayerMedia
          deviceToken={deviceToken}
          mediaId={activeSlide.backgroundMediaId}
          kind="image"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {activeSlide.backgroundType === 'VIDEO' && activeSlide.backgroundMediaId && (
        <PlayerMedia
          deviceToken={deviceToken}
          mediaId={activeSlide.backgroundMediaId}
          kind="video"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Elementos Interativos do Slide */}
      {activeSlide.elements?.map((el: any) => (
        <div
          key={el.id}
          onClick={() => handleElementClick(el.action)}
          style={{
            left: `${el.x}%`,
            top: `${el.y}%`,
            width: `${el.width}%`,
            height: `${el.height}%`,
            zIndex: el.zIndex,
          }}
          className={`absolute flex items-center justify-center p-2 ${
            el.action?.type && el.action.type !== 'NONE' 
              ? 'cursor-pointer hover:scale-[1.02] active:scale-95 transition-transform' 
              : ''
          }`}
        >
          {el.elementType === 'TEXT' && (
            <div 
              style={{
                fontSize: `${el.content?.fontSize || 28}px`,
                color: el.content?.color || '#ffffff',
                fontWeight: el.content?.fontWeight || 'bold',
              }}
              className="text-center w-full leading-tight drop-shadow-md"
            >
              {el.content?.text}
            </div>
          )}

          {el.elementType === 'BUTTON' && (
            <button
              type="button"
              style={{
                backgroundColor: el.content?.bgColor || '#3b82f6',
                color: el.content?.textColor || '#ffffff',
              }}
              className="w-full h-full px-6 py-3 font-bold rounded-2xl shadow-xl flex items-center justify-center text-lg active:scale-95 transition-transform"
            >
              {el.content?.label}
            </button>
          )}

          {el.elementType === 'IMAGE' && el.content?.mediaId && (
            <PlayerMedia
              deviceToken={deviceToken}
              mediaId={el.content.mediaId}
              kind="image"
              className="w-full h-full object-contain"
            />
          )}

          {el.elementType === 'VIDEO' && el.content?.mediaId && (
            <PlayerMedia
              deviceToken={deviceToken}
              mediaId={el.content.mediaId}
              kind="video"
              className="w-full h-full object-cover rounded-2xl shadow-xl"
            />
          )}

          {el.elementType === 'CARD' && (
            <div className="w-full h-full bg-slate-900/90 border border-slate-700/80 p-4 rounded-3xl flex flex-col justify-center text-left text-white shadow-2xl backdrop-blur-md">
              <p className="text-base font-bold">{el.content?.title}</p>
              <p className="text-xs text-zinc-300 mt-1 line-clamp-3">
                {el.content?.description}
              </p>
            </div>
          )}

          {el.elementType === 'QR_CODE' && (
            <div className="w-full h-full bg-white p-3 rounded-3xl flex flex-col items-center justify-center text-slate-950 shadow-2xl">
              <QrCode className="w-20 h-20 text-slate-950" />
              <span className="text-[11px] font-bold mt-1 text-center">
                {el.content?.label || 'Escaneie no seu celular'}
              </span>
            </div>
          )}

          {el.elementType === 'FORM' && (
            <div className="w-full h-full bg-slate-900/95 border border-slate-700 p-6 rounded-3xl flex flex-col justify-between text-white shadow-2xl">
              <p className="font-bold text-center text-primary text-base">{el.content?.formTitle || 'Cadastro'}</p>
              <div className="space-y-3 my-2">
                <input type="text" placeholder="Nome Completo" className="w-full bg-slate-800 rounded-xl px-3 py-2 text-sm text-white border border-slate-700" />
                <input type="text" placeholder="CPF / Matrícula" className="w-full bg-slate-800 rounded-xl px-3 py-2 text-sm text-white border border-slate-700" />
              </div>
              <p className="text-[10px] text-zinc-400 text-center">🔒 Em conformidade com a LGPD</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KioskPlayerPage;
