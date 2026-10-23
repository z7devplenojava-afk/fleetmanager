'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Upload, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotosChange,
  maxPhotos = 10,
  disabled = false,
  className = '',
  label = 'Fotos do veículo (câmera)',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const attachStreamToVideo = useCallback((stream: MediaStream) => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Erro ao reproduzir stream da câmera:', err);
      });
    }
  }, []);

  // Callback ref: garante que o stream seja anexado assim que o <video> for montado
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch((err) => {
        console.warn('Erro ao inicializar vídeo no callback ref:', err);
      });
    }
  }, []);

  const startCamera = useCallback(async (targetFacing: 'environment' | 'user' = 'environment') => {
    setError(null);
    stopStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Seu navegador não suporta captura direta de vídeo. Use o botão "Tirar Foto" para abrir a câmera nativa do aparelho.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        // Prioriza câmera traseira (environment)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (errFirst) {
        // Fallback básico caso constraints rígidas não sejam aceitas pelo aparelho
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: targetFacing },
          audio: false,
        });
      }

      streamRef.current = stream;
      setFacingMode(targetFacing);
      setIsStreaming(true);
      attachStreamToVideo(stream);
    } catch (err: any) {
      console.error('Erro ao acessar câmera:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('NotAllowedError')) {
        setError('Permissão de câmera negada. Habilite a permissão no navegador ou use o botão "Tirar Foto (Câmera Traseira)".');
      } else {
        setError('Não foi possível iniciar a visualização ao vivo. Use o botão "Tirar Foto (Câmera Traseira)" para abrir o aplicativo de câmera do celular.');
      }
    }
  }, [stopStream, attachStreamToVideo]);

  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  }, [facingMode, startCamera]);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  // Se o componente re-renderizar mantendo o streaming, garante que o stream continue ativo no vídeo
  useEffect(() => {
    if (isStreaming && streamRef.current && videoRef.current) {
      attachStreamToVideo(streamRef.current);
    }
  }, [isStreaming, attachStreamToVideo]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current || capturedPhotos.length >= maxPhotos) return;

    setIsCapturing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsCapturing(false);
          return;
        }
        const prefix = maxPhotos === 1 ? 'odometro' : 'veiculo';
        const file = new File([blob], `${prefix}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const next = [...capturedPhotos, file];
        setCapturedPhotos(next);
        onPhotosChange(next);
        setIsCapturing(false);

        // Se o limite era 1 foto (ex: odômetro), desliga o stream automaticamente após capturar
        if (maxPhotos === 1) {
          stopStream();
        }
      },
      'image/jpeg',
      0.92
    );
  }, [capturedPhotos, maxPhotos, onPhotosChange, stopStream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - capturedPhotos.length;
    if (remainingSlots <= 0) {
      setError(`Limite máximo de ${maxPhotos} foto(s) já atingido.`);
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const next = [...capturedPhotos, ...selectedFiles];
    setCapturedPhotos(next);
    onPhotosChange(next);
    setError(null);

    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = useCallback(
    (index: number) => {
      const next = capturedPhotos.filter((_, i) => i !== index);
      setCapturedPhotos(next);
      onPhotosChange(next);
    },
    [capturedPhotos, onPhotosChange]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-sm font-medium text-seguranca-lightgray flex items-center gap-2">
          <Camera className="h-4 w-4 text-seguranca-yellow" />
          {label}
          {capturedPhotos.length > 0 && (
            <span className="text-xs bg-zinc-800 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
              {capturedPhotos.length}/{maxPhotos}
            </span>
          )}
        </span>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Input para Câmera Traseira Nativa (Abre o app de câmera do celular direto) */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Input para Galeria/Upload comum */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={maxPhotos > 1}
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            onChange={handleFileUpload}
            className="hidden"
          />

          {/* Botão Principal: Tirar Foto usando a câmera traseira do celular */}
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => nativeCameraInputRef.current?.click()}
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-3 shadow-sm"
            title="Abrir câmera traseira do dispositivo para tirar foto"
          >
            <Camera className="h-3.5 w-3.5 mr-1.5" />
            Tirar Foto
          </Button>

          {/* Botão de Ver Câmera na Tela (Stream ao vivo) */}
          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopStream}
              className="border-red-500/40 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-xs h-8 px-3"
            >
              Desativar câmera
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => startCamera('environment')}
              disabled={disabled || capturedPhotos.length >= maxPhotos}
              className="border-gray-600 bg-seguranca-black hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
              title="Abrir câmera ao vivo na tela"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
              Câmera na Tela
            </Button>
          )}

          {/* Botão de Upload da Galeria */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            className="border-gray-600 bg-seguranca-black hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
            title="Selecionar fotos existentes na galeria"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
            Galeria
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 p-2 rounded-lg">{error}</p>
      )}

      {/* Visualizador de Câmera ao Vivo */}
      {isStreaming && (
        <div className="relative rounded-lg overflow-hidden bg-black border border-gray-700 shadow-md">
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[320px] object-cover bg-black"
          />
          <div className="absolute top-2 right-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={toggleFacingMode}
              className="h-7 px-2 text-xs bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm border border-white/20"
              title="Alternar entre câmera traseira e frontal"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {facingMode === 'environment' ? 'Traseira' : 'Frontal'}
            </Button>
          </div>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={capturePhoto}
              disabled={isCapturing || capturedPhotos.length >= maxPhotos}
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 font-bold shadow-lg"
            >
              {isCapturing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Camera className="h-4 w-4 mr-1.5" />
              )}
              Capturar Foto ({capturedPhotos.length}/{maxPhotos})
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {/* Miniaturas de Fotos Anexadas */}
      {capturedPhotos.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800/80 p-3 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Fotos Anexadas ({capturedPhotos.length} de {maxPhotos})
          </span>
          <div className="flex flex-wrap gap-2.5">
            {capturedPhotos.map((file, idx) => (
              <div key={`${file.name}-${file.size}-${file.lastModified}-${idx}`} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Foto ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-700 shadow-sm transition-transform group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-md transition-opacity"
                  aria-label="Remover foto"
                  title="Remover foto"
                >
                  <X className="h-3 w-3" />
                </button>
                <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1 rounded font-mono">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
