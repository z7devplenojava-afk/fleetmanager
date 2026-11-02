import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, CameraDevice } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Camera,
  RefreshCw,
  Flashlight,
  FlashlightOff,
  Keyboard,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface UniversalQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
  description?: string;
  placeholderManual?: string;
  allowManualInput?: boolean;
  continuousMode?: boolean;
  colorTheme?: 'emerald' | 'blue' | 'purple';
}

// Reproduz bipe moderno de confirmação usando Web Audio API
const playBeepSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota Lá (A5)
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12); // A6 subindo

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.debug('Áudio não permitido ou indisponível:', e);
  }
};

export const UniversalQrScannerModal: React.FC<UniversalQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear QR Code',
  description = 'Aponte a câmera traseira do dispositivo para o código QR',
  placeholderManual = 'Digite o código, CPF ou matrícula...',
  allowManualInput = true,
  continuousMode = false,
  colorTheme = 'emerald',
}) => {
  const containerId = useRef(`universal-qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  // Prevents infinite retry loop when device has no camera
  const noCameraRef = useRef<boolean>(false);
  const cameraStartedRef = useRef<boolean>(false);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  // Manipulador de sucesso seguro com feedback
  const handleSuccess = useCallback(
    (decodedText: string) => {
      const now = Date.now();
      // Em modo contínuo, evita escanear o mesmo QR code repetidamente dentro de 2.5 segundos
      if (continuousMode) {
        if (decodedText === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 2500) {
          return;
        }
        if (now - lastScannedTimeRef.current < 1200) {
          return;
        }
      }
      lastScannedCodeRef.current = decodedText;
      lastScannedTimeRef.current = now;

      if (soundEnabled) {
        playBeepSound();
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(80);
        } catch {
          // ignora
        }
      }

      setLastFeedback(decodedText.length > 20 ? `${decodedText.substring(0, 20)}...` : decodedText);
      setTimeout(() => setLastFeedback(null), 2000);

      if (continuousMode) {
        // No modo contínuo (Retorno em massa), mantém a câmera ligada e só chama o callback
        onScanSuccess(decodedText);
      } else {
        // Parar câmera imediatamente para não ler duplicado
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .catch(() => {})
            .finally(() => {
              onScanSuccess(decodedText);
              onClose();
            });
        } else {
          onScanSuccess(decodedText);
          onClose();
        }
      }
    },
    [onScanSuccess, onClose, soundEnabled, continuousMode]
  );

  // Inicializar câmera
  const startCamera = useCallback(
    async (cameraId?: string) => {
      // Guard: if no camera was found previously, skip retrying to prevent infinite loop
      if (noCameraRef.current && !cameraId) return;
      // Guard: already started (prevents double-fire from effect)
      if (cameraStartedRef.current && !cameraId) return;

      cameraStartedRef.current = true;
      setErrorMessage(null);
      setIsStarting(true);

      try {
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(containerId);
        }

        const scanner = html5QrCodeRef.current;

        // Se já estiver rodando, parar antes
        if (scanner.isScanning) {
          await scanner.stop();
        }

        // Listar câmeras disponíveis
        let availableCameras = cameras;
        if (availableCameras.length === 0) {
          try {
            availableCameras = await Html5Qrcode.getCameras();
            setCameras(availableCameras);
          } catch (e) {
            console.warn('Não foi possível enumerar câmeras:', e);
            // Mark as no camera available to stop future retries
            noCameraRef.current = true;
          }
        }

        // Escolhe câmera traseira (environment) se não especificado
        const cameraConfig = cameraId
          ? cameraId
          : { facingMode: 'environment' as const };

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrEdge = Math.max(220, Math.floor(minEdge * 0.72));
            return { width: qrEdge, height: qrEdge };
          },
          aspectRatio: 1.0,
        };

        await scanner.start(
          cameraConfig,
          config,
          (decodedText) => {
            handleSuccess(decodedText);
          },
          () => {
            // Ignora quadros intermediários sem QR code
          }
        );

        setIsScanning(true);
        setIsStarting(false);

        // Checar suporte a lanterna (Torch)
        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorch(true);
          }
        } catch {
          setHasTorch(false);
        }
      } catch (err: any) {
        console.error('Falha ao iniciar câmera:', err);
        setIsStarting(false);
        setIsScanning(false);

        const errorStr = String(err?.message || err);
        if (errorStr.includes('NotAllowedError') || errorStr.includes('Permission')) {
          setErrorMessage('Permissão de acesso à câmera negada. Habilite a câmera nas configurações do navegador.');
        } else if (errorStr.includes('NotFoundError') || errorStr.includes('DevicesNotFoundError')) {
          // Mark permanently — no camera on this device, stop all future retries
          noCameraRef.current = true;
          setErrorMessage('Nenhuma câmera encontrada no dispositivo.');
          // Auto-switch to manual tab so user can still operate without camera
          setActiveTab('manual');
        } else {
          setErrorMessage('Não foi possível abrir o feed da câmera. Você pode digitar o código ou enviar uma imagem.');
        }
      }
    },
    [cameras, containerId, handleSuccess]
  );

  // Parar câmera com limpeza completa
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.debug('Erro ao limpar scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
    setIsStarting(false);
    setTorchEnabled(false);
  }, []);

  // Alternar lanterna
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextTorch = !torchEnabled;
      await (html5QrCodeRef.current as any).applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
    } catch (e) {
      console.warn('Erro ao alternar lanterna:', e);
    }
  };

  // Alternar entre câmeras (frontal e traseira)
  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];
    setSelectedCameraId(nextCamera.id);
    await stopCamera();
    await startCamera(nextCamera.id);
  };

  // Ler QR code a partir de imagem enviada
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const tempScanner = html5QrCodeRef.current || new Html5Qrcode(containerId);
      const result = await tempScanner.scanFile(file, true);
      handleSuccess(result);
    } catch {
      setErrorMessage('Nenhum QR Code legível foi detectado nesta imagem. Tente uma foto mais nítida.');
    }
  };

  // Enviar código manual
  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;
    handleSuccess(clean);
  };

  // Efeito de abertura/fechamento do modal
  // IMPORTANT: do NOT add startCamera/stopCamera as deps — they are stable callbacks.
  // Using isOpen as the single trigger prevents the retry loop when camera is unavailable.
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      // Reset guards so camera can retry if modal is reopened
      cameraStartedRef.current = false;
      return;
    }

    setErrorMessage(null);
    setManualCode('');
    // Only default to camera tab if camera is potentially available
    if (!noCameraRef.current) {
      setActiveTab('camera');
    }

    // Pequeno timeout para garantir montagem do container no DOM do Radix Dialog
    const t = setTimeout(() => {
      startCamera();
    }, 150);

    return () => {
      clearTimeout(t);
      stopCamera();
      cameraStartedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0b0f19] border border-slate-800 text-slate-100 p-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Cabeçalho */}
        <DialogHeader className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400 mt-0.5">
                  {description}
                </DialogDescription>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Abas Alternativas (Câmera Direta vs Manual) */}
          {allowManualInput && (
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  if (!isScanning) startCamera();
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                Câmera ao Vivo
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  stopCamera();
                }}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'manual'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                <Keyboard className="h-3.5 w-3.5" />
                Digitar Código
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Corpo do Modal */}
        <div className="p-4 sm:p-5 space-y-4">
          {activeTab === 'camera' ? (
            <div className="space-y-3">
              {/* Moldura da Câmera com Efeito de Laser e Cantoneiras */}
              <div className="relative aspect-square w-full max-w-[340px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-slate-800 shadow-inner flex items-center justify-center">
                {/* Container do Html5Qrcode */}
                <div
                  id={containerId}
                  className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
                />

                {/* Laser de Escaneamento Animado */}
                {isScanning && (
                  <div className="pointer-events-none absolute inset-x-6 top-0 bottom-0 flex flex-col justify-between py-6">
                    <div className={`w-full h-0.5 bg-gradient-to-r from-transparent ${
                      colorTheme === 'purple' ? 'via-purple-400 shadow-[0_0_12px_#c084fc]' :
                      colorTheme === 'blue' ? 'via-blue-400 shadow-[0_0_12px_#60a5fa]' :
                      'via-emerald-400 shadow-[0_0_12px_#34d399]'
                    } to-transparent animate-bounce`} />
                    
                    {/* Cantoneiras HUD */}
                    <div className={`absolute top-6 left-6 w-7 h-7 border-t-2 border-l-2 ${
                      colorTheme === 'purple' ? 'border-purple-400' :
                      colorTheme === 'blue' ? 'border-blue-400' :
                      'border-emerald-400'
                    } rounded-tl-lg`} />
                    <div className={`absolute top-6 right-6 w-7 h-7 border-t-2 border-r-2 ${
                      colorTheme === 'purple' ? 'border-purple-400' :
                      colorTheme === 'blue' ? 'border-blue-400' :
                      'border-emerald-400'
                    } rounded-tr-lg`} />
                    <div className={`absolute bottom-6 left-6 w-7 h-7 border-b-2 border-l-2 ${
                      colorTheme === 'purple' ? 'border-purple-400' :
                      colorTheme === 'blue' ? 'border-blue-400' :
                      'border-emerald-400'
                    } rounded-bl-lg`} />
                    <div className={`absolute bottom-6 right-6 w-7 h-7 border-b-2 border-r-2 ${
                      colorTheme === 'purple' ? 'border-purple-400' :
                      colorTheme === 'blue' ? 'border-blue-400' :
                      'border-emerald-400'
                    } rounded-br-lg`} />
                  </div>
                )}

                {/* Banner de Validação Imediata (Feedback contínuo) */}
                {lastFeedback && (
                  <div className="absolute top-4 inset-x-4 bg-emerald-600/90 backdrop-blur-md text-white text-xs font-bold py-2 px-3 rounded-xl shadow-lg border border-emerald-400/40 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                    <span>Lido: {lastFeedback}</span>
                  </div>
                )}

                {/* Badge de Modo Contínuo */}
                {continuousMode && (
                  <div className={`absolute bottom-3 inset-x-4 py-1 px-2.5 rounded-lg text-[11px] font-mono font-bold text-center border backdrop-blur-md ${
                    colorTheme === 'purple' ? 'bg-purple-950/80 text-purple-200 border-purple-500/40' :
                    colorTheme === 'blue' ? 'bg-blue-950/80 text-blue-200 border-blue-500/40' :
                    'bg-emerald-950/80 text-emerald-200 border-emerald-500/40'
                  }`}>
                    ⚡ Modo Contínuo Ativo: Aponte os crachás em sequência
                  </div>
                )}

                {/* Estado de Carregamento inicial */}
                {isStarting && (
                  <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-2 text-amber-400">
                    <RefreshCw className="h-7 w-7 animate-spin" />
                    <span className="text-xs font-medium text-slate-300">Iniciando câmera...</span>
                  </div>
                )}

                {/* Mensagem de Erro na Câmera */}
                {errorMessage && (
                  <div className="absolute inset-0 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center gap-3">
                    <AlertCircle className="h-8 w-8 text-rose-500" />
                    <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startCamera()}
                        className="text-xs border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Tentar Novamente
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab('manual')}
                        className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                      >
                        Digitar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Controles de Câmera (Trocar lente, Lanterna, Som, Upload) */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  {cameras.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={switchCamera}
                      className="h-8 px-2.5 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl"
                      title="Alternar entre câmeras"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      Trocar
                    </Button>
                  )}

                  {hasTorch && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={toggleTorch}
                      className={`h-8 px-2.5 text-xs border-slate-800 rounded-xl transition-all ${
                        torchEnabled
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                      title={torchEnabled ? 'Desligar lanterna' : 'Ligar lanterna'}
                    >
                      {torchEnabled ? (
                        <>
                          <FlashlightOff className="h-3.5 w-3.5 mr-1 text-amber-400" />
                          Luz On
                        </>
                      ) : (
                        <>
                          <Flashlight className="h-3.5 w-3.5 mr-1" />
                          Luz Off
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="h-8 w-8 text-slate-400 hover:text-white rounded-xl"
                    title={soundEnabled ? 'Silenciar bipe' : 'Ativar bipe'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>

                {/* Upload de arquivo como fallback */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs text-slate-400 hover:text-white rounded-xl"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Foto / Galeria
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Aba de Entrada Manual */
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Identificador ou Conteúdo do QR Code:
                </label>
                <Input
                  autoFocus
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder={placeholderManual}
                  className="bg-slate-950 border-slate-700 text-white font-mono text-sm h-11 rounded-xl focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400">
                  Ideal caso a câmera não esteja disponível, o QR Code esteja ilegível ou o passageiro informe a matrícula/CPF.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('camera')}
                  className="flex-1 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 rounded-xl h-11"
                >
                  Voltar para Câmera
                </Button>
                <Button
                  type="submit"
                  disabled={!manualCode.trim()}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl h-11 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Confirmar
                </Button>
              </div>
            </form>
          )}

          {/* Botão de Fechar */}
          <div className="pt-2 border-t border-slate-800/80">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl h-10 text-xs font-medium"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalQrScannerModal;
