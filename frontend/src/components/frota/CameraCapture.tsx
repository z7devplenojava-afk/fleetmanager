'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      setError(msg.includes('Permission') ? 'Permissão de câmera negada.' : 'Não foi possível acessar a câmera. Você também pode fazer upload de fotos abaixo.');
    }
  }, []);

  useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

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
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setIsCapturing(false);
          return;
        }
        const prefix = maxPhotos === 1 ? 'odometer' : 'vehicle';
        const file = new File([blob], `${prefix}_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const next = [...capturedPhotos, file];
        setCapturedPhotos(next);
        onPhotosChange(next);
        setIsCapturing(false);
      },
      'image/jpeg',
      0.9
    );
  }, [capturedPhotos, maxPhotos, onPhotosChange]);

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

    // Limpar o valor do input para permitir selecionar o mesmo arquivo se necessário
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          {/* Input oculto para Upload de Arquivos */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple={maxPhotos > 1}
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            onChange={handleFileUpload}
            className="hidden"
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || capturedPhotos.length >= maxPhotos}
            className="border-gray-600 bg-seguranca-black hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
            title="Selecionar fotos do dispositivo"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Upload de Foto{maxPhotos > 1 ? 's' : ''}
          </Button>

          {isStreaming ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopStream}
              className="border-gray-600 bg-red-950/40 text-red-300 hover:bg-red-900/50 text-xs h-8 px-3"
            >
              Desligar câmera
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startCamera}
              disabled={disabled || capturedPhotos.length >= maxPhotos}
              className="border-gray-600 bg-seguranca-black hover:bg-zinc-800 text-zinc-200 text-xs h-8 px-3"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5 text-yellow-400" />
              Ativar câmera
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-800/60 p-2 rounded-lg">{error}</p>
      )}

      {isStreaming && (
        <div className="relative rounded-lg overflow-hidden bg-black border border-gray-700 shadow-md">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-[280px] object-cover"
          />
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={capturePhoto}
              disabled={isCapturing || capturedPhotos.length >= maxPhotos}
              className="bg-seguranca-yellow text-black hover:bg-seguranca-yellow/90 font-bold shadow-lg"
            >
              {isCapturing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Capturar ({capturedPhotos.length}/{maxPhotos})
                </>
              )}
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
